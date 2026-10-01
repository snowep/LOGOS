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

// Rename/move detection: track unlink events temporarily
interface PendingDelete {
  documentId: string;
  hash: string;
  path: string;
  timestamp: number;
}

const pendingDeletes = new Map<string, PendingDelete>();

// Track pending adds for move detection
interface PendingAdd {
  documentId: string;
  hash: string;
  path: string;
  timestamp: number;
}

const pendingAdds = new Map<string, PendingAdd>();

let watcher: FSWatcher | null = null;

export function startWatcher(): FSWatcher {
  const vaultPath = config.vaultPath;

  if (!fs.existsSync(vaultPath)) {
    fs.mkdirSync(vaultPath, { recursive: true });
  }

  watcher = chokidar.watch(vaultPath, {
    ignored: (p: string) => {
      const normalized = p.replace(/\\/g, '/');
      if (/[/\\]\\../.test(normalized)) return true;
      if (/node_modules/.test(normalized)) return true;
      if (/\\.tmp$/.test(normalized)) return true;
      if (/~$/.test(normalized)) return true;
      if (/\\.log$/.test(normalized)) return true;
      if (/\\.bak$/.test(normalized)) return true;
      if (/\\.db(-wal|-shm)?$/.test(normalized)) return true;
      if (!normalized.endsWith('.md') && !normalized.endsWith('.markdown')) {
        try {
          return !fs.statSync(p).isDirectory();
        } catch {
          return true;
        }
      }
      return false;
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

      if (!relativePath.endsWith('.md') && !relativePath.endsWith('.markdown')) return;
      if (!relativePath || relativePath === '.') return;

      let stats: Stats | null = null;
      let content: string | null = null;
      let contentHash = '';

      if (event === 'change' || event === 'add') {
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
      } else if (event === 'unlink') {
        const doc = getDocumentByPath(relativePath);
        if (doc) {
          contentHash = doc.current_hash;
          pendingDeletes.set(doc.id, {
            documentId: doc.id,
            hash: contentHash,
            path: relativePath,
            timestamp: Date.now(),
          });
          // Bounded interval for rename/move detection
          setTimeout(() => {
            const pending = pendingDeletes.get(doc.id);
            if (pending && pending.hash === contentHash) {
              pendingDeletes.delete(doc.id);
            }
          }, 2000);
        }
      }

      const writer = determineWriter(relativePath, contentHash);

      let documentId = '';
      let version = 1;
      let eventType: 'created' | 'modified' | 'deleted' | 'renamed' | 'moved' = 'created';
      let previousPath: string | undefined;

      if (event === 'unlink') {
        const doc = getDocumentByPath(relativePath);
        if (doc) {
          documentId = doc.id;
          version = doc.version;
        } else {
          documentId = generateDocumentId(relativePath);
        }
        eventType = 'deleted';
      } else if (content !== null) {
        // Check if this is a rename (add with matching hash from recent unlink)
        let matchedRename = false;
        let matchedMove = false;
        if (event === 'add') {
          for (const [delId, delInfo] of pendingDeletes.entries()) {
            if (delInfo.hash === contentHash) {
              const oldDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(delId) as any;
              if (oldDoc) {
                // Check if parent directory changed (move) vs same directory (rename)
                const oldDir = path.dirname(delInfo.path);
                const newDir = path.dirname(relativePath);
                if (oldDir === newDir) {
                  matchedRename = true;
                  eventType = 'renamed';
                } else {
                  matchedMove = true;
                  eventType = 'moved';
                }
                documentId = delId;
                previousPath = oldDoc.path;
                const now = Date.now();
                db.prepare('UPDATE documents SET path = ?, updated_at = ? WHERE id = ?').run(relativePath, now, delId);
                version = oldDoc.version;
                pendingDeletes.delete(delId);
                break;
              }
            }
          }
        }

        if (!matchedRename && !matchedMove) {
          const doc = getOrCreateDocumentIdentity(relativePath, content, writer);
          documentId = doc.id;
          version = doc.version;
          eventType = doc.version === 1 ? 'created' : 'modified';
        }
      } else {
        return;
      }

      if (event !== 'unlink' || getDocumentByPath(relativePath)) {
        recordDocumentEvent(
          documentId!,
          eventType!,
          relativePath,
          version,
          contentHash,
          writer,
          previousPath,
          { size: stats?.size }
        );
      }

      broadcastEvent('file-change', {
        event: eventType!,
        documentId: documentId!,
        path: relativePath,
        version,
        hash: contentHash,
        writer,
        timestamp: new Date().toISOString(),
      });

      console.log(`Vault ${eventType!}: ${relativePath} (v${version}, ${writer})`);
    } catch (err: any) {
      console.error(`Watcher error for ${fullPath}:`, err.message);
    }
  });

  return watcher;
}

export async function stopWatcher(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
}
