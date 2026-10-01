import fs from 'fs';
import path from 'path';
import { Stats } from 'fs';
import chokidar, { FSWatcher } from 'chokidar';
import {
  db,
  computeContentHash,
  generateDocumentId,
  getOrCreateDocumentIdentity,
  getDocumentByPath,
  recordDocumentEvent,
  getDocumentIdentity,
  WriterIdentity,
} from '../db';
import { config } from '../config';
import { broadcastEvent } from '../routes/events';
import { isEligiblePath } from './eligibility';

// Track LOGOS-initiated writes to prevent self-write loops
const logosWrites = new Map<string, { path: string; timestamp: number; contentHash: string }>();

export function registerLogosWrite(relativePath: string, contentHash: string): void {
  logosWrites.set(relativePath, {
    path: relativePath,
    timestamp: Date.now(),
    contentHash,
  });
  setTimeout(() => {
    const entry = logosWrites.get(relativePath);
    if (entry && entry.contentHash === contentHash) {
      logosWrites.delete(relativePath);
    }
  }, config.logosWriteCleanup);
}

function isLogosWrite(relativePath: string, contentHash: string): boolean {
  const entry = logosWrites.get(relativePath);
  if (!entry) return false;
  const timeSinceWrite = Date.now() - entry.timestamp;
  return entry.contentHash === contentHash && timeSinceWrite < config.logosWriteCleanup;
}

function determineWriter(relativePath: string, contentHash: string): WriterIdentity {
  return isLogosWrite(relativePath, contentHash) ? 'LOGOS' : 'USER';
}

// State machine states for each tracked path
type PathState = 
  | { status: 'idle' }
  | { status: 'pending_delete'; documentId: string; hash: string; timestamp: number; path: string }
  | { status: 'processing_add'; path: string; contentHash: string; stats: Stats }
  | { status: 'pending_rename'; oldPath: string; documentId: string; hash: string; timestamp: number };

// Single source of truth for path state
const pathStates = new Map<string, PathState>();

let watcher: FSWatcher | null = null;
let isStarting = false;

// Shared eligibility check - mirrors reconcile eligibility
function checkEligible(relativePath: string, stats?: Stats): boolean {
  return isEligiblePath(relativePath, stats);
}

function emitDeleted(documentId: string, relativePath: string, version: number, hash: string, writer: WriterIdentity): void {
  recordDocumentEvent(documentId, 'deleted', relativePath, version, hash, writer);
  broadcastEvent('file-change', {
    event: 'deleted',
    documentId,
    path: relativePath,
    version,
    hash,
    writer,
    timestamp: new Date().toISOString(),
  });
  console.log(`Vault deleted: ${relativePath} (v${version}, ${writer})`);
}

function emitCreated(relativePath: string, content: string, contentHash: string, writer: WriterIdentity, stats: Stats): void {
  const doc = getOrCreateDocumentIdentity(relativePath, content, writer);
  recordDocumentEvent(doc.id, 'created', relativePath, 1, contentHash, writer, undefined, { size: stats.size });
  broadcastEvent('file-change', {
    event: 'created',
    documentId: doc.id,
    path: relativePath,
    version: 1,
    hash: contentHash,
    writer,
    timestamp: new Date().toISOString(),
  });
  console.log(`Vault created: ${relativePath} (v1, ${writer})`);
}

function emitModified(relativePath: string, content: string, contentHash: string, writer: WriterIdentity, stats: Stats): void {
  const doc = getOrCreateDocumentIdentity(relativePath, content, writer);
  recordDocumentEvent(doc.id, 'modified', relativePath, doc.version, contentHash, writer, undefined, { size: stats.size });
  broadcastEvent('file-change', {
    event: 'modified',
    documentId: doc.id,
    path: relativePath,
    version: doc.version,
    hash: contentHash,
    writer,
    timestamp: new Date().toISOString(),
  });
  console.log(`Vault modified: ${relativePath} (v${doc.version}, ${writer})`);
}

function emitRenamed(documentId: string, oldPath: string, newPath: string, version: number, hash: string, writer: WriterIdentity, stats: Stats): void {
  const now = Date.now();
  db.prepare('UPDATE documents SET path = ?, updated_at = ? WHERE id = ?').run(newPath, now, documentId);
  recordDocumentEvent(documentId, 'renamed', newPath, version, hash, writer, oldPath, { size: stats.size });
  broadcastEvent('file-change', {
    event: 'renamed',
    documentId,
    path: newPath,
    version,
    hash,
    writer,
    previousPath: oldPath,
    timestamp: new Date().toISOString(),
  });
  console.log(`Vault renamed: ${oldPath} -> ${newPath} (v${version}, ${writer})`);
}

function emitMoved(documentId: string, oldPath: string, newPath: string, version: number, hash: string, writer: WriterIdentity, stats: Stats): void {
  const now = Date.now();
  db.prepare('UPDATE documents SET path = ?, updated_at = ? WHERE id = ?').run(newPath, now, documentId);
  recordDocumentEvent(documentId, 'moved', newPath, version, hash, writer, oldPath, { size: stats.size });
  broadcastEvent('file-change', {
    event: 'moved',
    documentId,
    path: newPath,
    version,
    hash,
    writer,
    previousPath: oldPath,
    timestamp: new Date().toISOString(),
  });
  console.log(`Vault moved: ${oldPath} -> ${newPath} (v${version}, ${writer})`);
}

function clearAllState(): void {
  pathStates.clear();
}

export function startWatcher(): FSWatcher {
  // Singleton: return existing watcher if already running
  if (watcher) return watcher;
  if (isStarting) throw new Error('Watcher start already in progress');

  isStarting = true;
  
  const vaultPath = config.vaultPath;

  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }

  watcher = chokidar.watch(vaultPath, {
    ignored: (p: string) => {
      const relativePath = path.relative(vaultPath, p).replace(/\\/g, '/');
      return !checkEligible(relativePath);
    },
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 100,
    },
  });

  watcher.on('all', async (event, fullPath) => {
    try {
      const relativePath = path.relative(vaultPath, fullPath).replace(/\\/g, '/');

      if (!relativePath || relativePath === '.') return;
      if (!checkEligible(relativePath)) return;

      if (event === 'change' || event === 'add') {
        let stats: Stats | null = null;
        let content: string | null = null;
        let contentHash = '';

        try {
          const fileStats = await fs.promises.stat(fullPath);
          if (fileStats.size > config.maxFileSize) {
            console.log(`Skipping large file: ${relativePath} (${fileStats.size} bytes)`);
            return;
          }
          content = await fs.promises.readFile(fullPath, 'utf8');
          stats = fileStats;
          contentHash = computeContentHash(content);
        } catch (err: any) {
          console.log(`Could not read file ${relativePath}:`, err.message);
          return;
        }

        const writer = determineWriter(relativePath, contentHash);
        const currentState = pathStates.get(relativePath);

        // Deduplicate: if same path+hash already processed, skip (no version bump)
        const existingDoc = getDocumentByPath(relativePath);
        if (existingDoc && existingDoc.current_hash === contentHash) {
          return;
        }

        // Check for pending delete from THIS same path (unlinked, now added back with same content)
        if (currentState?.status === 'pending_delete' && currentState.hash === contentHash) {
          // File was unlinked and now added back with same content - treat as modified
          pathStates.delete(relativePath);
          emitModified(relativePath, content!, contentHash, writer, stats!);
          return;
        }

        // Check for matching pending delete from OTHER path (rename/move)
        let matchedRename = false;
        let matchedMove = false;
        let matchedPath = '';
        let matchedDoc: any = null;

        for (const [otherPath, otherState] of pathStates.entries()) {
          if (otherPath === relativePath) continue;
          if (otherState.status === 'pending_delete' && otherState.hash === contentHash) {
            const oldDoc = getDocumentIdentity(otherState.documentId);
            if (oldDoc) {
              const oldDir = path.dirname(otherState.path);
              const newDir = path.dirname(relativePath);
              
              if (oldDir === newDir) {
                matchedRename = true;
              } else {
                matchedMove = true;
              }
              matchedPath = otherPath;
              matchedDoc = oldDoc;
              
              if (matchedRename) {
                emitRenamed(otherState.documentId, otherState.path, relativePath, oldDoc.version, contentHash, writer, stats!);
              } else {
                emitMoved(otherState.documentId, otherState.path, relativePath, oldDoc.version, contentHash, writer, stats!);
              }
              
              pathStates.delete(otherPath);
              break;
            }
          }
        }

        if (matchedRename || matchedMove) {
          // Mark this path as the new location
          pathStates.set(relativePath, { status: 'pending_rename', oldPath: matchedPath, documentId: matchedDoc!.id, hash: contentHash, timestamp: Date.now() });
          return;
        }

        // Normal add/change
        pathStates.set(relativePath, { status: 'processing_add', path: relativePath, contentHash, stats: stats! });
        
        if (existingDoc) {
          emitModified(relativePath, content!, contentHash, writer, stats!);
        } else {
          emitCreated(relativePath, content!, contentHash, writer, stats!);
        }
        
        pathStates.delete(relativePath);
      } else if (event === 'unlink') {
        const doc = getDocumentByPath(relativePath);
        if (!doc) return;

        // Store pending deletion with bounded window
        pathStates.set(relativePath, {
          status: 'pending_delete',
          documentId: doc.id,
          hash: doc.current_hash,
          timestamp: Date.now(),
          path: relativePath,
        });

        // Bounded window for rename/move detection
        setTimeout(async () => {
          const state = pathStates.get(relativePath);
          if (state?.status === 'pending_delete') {
            // Window expired - check if matching add arrived
            let hasMatchingAdd = false;
            
            // Check if this path now exists (re-added same content)
            try {
              const currentStats = await fs.promises.stat(fullPath);
              const currentContent = await fs.promises.readFile(fullPath, 'utf8');
              const currentHash = computeContentHash(currentContent);
              if (currentHash === state.hash) {
                hasMatchingAdd = true;
              }
            } catch {
              // File doesn't exist
            }

            // Check other paths for matching hash
            if (!hasMatchingAdd) {
              for (const [otherPath, otherState] of pathStates.entries()) {
                if (otherPath === relativePath) continue;
                if (otherState.status === 'pending_rename' && otherState.hash === state.hash) {
                  hasMatchingAdd = true;
                  break;
                }
              }
            }

            if (!hasMatchingAdd) {
              // No match - emit deleted
              const doc = getDocumentIdentity(state.documentId);
              const docVersion = doc?.version ?? 1;
              const writer = determineWriter(relativePath, state.hash);
              emitDeleted(state.documentId, relativePath, docVersion, state.hash, writer);
              pathStates.delete(relativePath);
            }
            // If hasMatchingAdd, the add handler will process it
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error(`Watcher error for ${fullPath}:`, err.message);
    }
  });

  watcher.on('error', (err) => {
    console.error('Watcher error:', err);
  });

  isStarting = false;
  console.log('Vault watcher started');
  return watcher;
}

export async function stopWatcher(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
  clearAllState();
  console.log('Vault watcher stopped');
}
