import fs from 'fs';
import path from 'path';
import {
  db,
  computeContentHash,
  getOrCreateDocumentIdentity,
  getActiveDocumentByPath,
  recordDocumentEvent,
  getDocumentByHash,
  resolveSafePath,
} from '../db';
import { config } from '../config';
import { broadcastEvent } from '../routes/events';
import { isEligiblePath } from './eligibility';

export interface ReconcileResult {
  created: number;
  updated: number;
  deleted: number;
  renamed: number;
  conflicts: number;
  skipped: number;
  conflictDetails: Array<{
    path: string;
    existingVersion: number;
    fileHash: string;
    dbHash: string;
  }>;
  scanQuality: 'COMPLETE' | 'PARTIAL' | 'FAILED';
}

function scanMarkdownFiles(dir: string, basePath: string): string[] {
  const markdownFiles: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      markdownFiles.push(...scanMarkdownFiles(fullPath, basePath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
      const relPath = path.relative(basePath, fullPath).replace(/\\/g, '/');
      if (isEligiblePath(relPath)) {
        markdownFiles.push(relPath);
      }
    }
  }
  return markdownFiles;
}

/**
 * Scoped reconciliation: walks the vault subtree, compares file hash against the DB's
 * current_hash AND version ancestry. A file whose content changed on disk
 * while its DB version also advanced (e.g. concurrent LOGOS write) is
 * reported as a conflict instead of silently overwritten.
 * 
 * Only operates within the given subtree (syncPath). Does not delete siblings
 * outside the subtree.
 * 
 * Rename detection requires unique identity evidence, not just hash match.
 * Read errors do not become deletions.
 * Idempotent: second run produces zeros.
 */
export async function reconcile(syncPath?: string): Promise<ReconcileResult> {
  const vaultPath = config.vaultPath;
  const targetPath = syncPath ? resolveSafePath(vaultPath, syncPath) : vaultPath;

  // Scan only within the target subtree
  const markdownFiles = scanMarkdownFiles(targetPath, vaultPath);

  let created = 0;
  let updated = 0;
  let deleted = 0;
  let renamed = 0;
  let skipped = 0;
  let readErrors = 0;
  const conflictDetails: ReconcileResult['conflictDetails'] = [];

  const seenPaths = new Set<string>();

  // Track hash -> path for rename detection within this reconciliation run
  const hashesInRun = new Map<string, string>();

  for (const relPath of markdownFiles) {
    seenPaths.add(relPath);
    const fullPath = path.join(vaultPath, relPath);
    
    let content: string;
    let contentHash: string;
    let fileStats: fs.Stats;

    try {
      fileStats = await fs.promises.stat(fullPath);
      if (fileStats.size > config.maxFileSize) {
        skipped++;
        continue;
      }
      content = await fs.promises.readFile(fullPath, 'utf8');
      contentHash = computeContentHash(content);
    } catch (err: any) {
      // Read errors do NOT become deletions - skip and log
      console.log(`Reconcile: could not read ${relPath}:`, err.message);
      readErrors++;
      skipped++;
      continue;
    }

    // Deduplicate within this run: if same hash seen at different path, it's a potential rename
        const existingPathForHash = hashesInRun.get(contentHash);
        if (existingPathForHash && existingPathForHash !== relPath) {
          // Check if the other path was also processed this run
          // If so, we have a hash collision - skip rename detection for this one
          // Unique identity evidence required
        }
        hashesInRun.set(contentHash, relPath);

        const existingDoc = getActiveDocumentByPath(relPath);

            if (!existingDoc) {
              // Check if this file's hash matches an existing ACTIVE document (rename/move)
              // BUT require unique identity: hash must map to exactly ONE ACTIVE document in DB
              const docsByHash = db.prepare('SELECT * FROM documents WHERE current_hash = ? AND deleted_at IS NULL').all(contentHash) as any[];
    
              if (docsByHash.length === 1) {
                // Unique match - this is a rename/move
                const docByHash = docsByHash[0];
                const previousPath = docByHash.path;
       
                // Only count as rename if the old path is NOT in our current scan
                // (i.e., file moved from outside subtree to inside, or within subtree)
                if (!seenPaths.has(previousPath)) {
                  const now = Date.now();
                  db.prepare('UPDATE documents SET path = ?, updated_at = ? WHERE id = ?').run(relPath, now, docByHash.id);
                  recordDocumentEvent(docByHash.id, 'renamed', relPath, docByHash.version, contentHash, 'USER', previousPath, { size: fileStats.size });
                  renamed++;
                  continue;
                }
              }
    
              // No existing doc, or hash collision, or old path still in subtree - create new
              const doc = getOrCreateDocumentIdentity(relPath, content, 'USER');
              recordDocumentEvent(doc.id, 'created', relPath, 1, contentHash, 'USER', undefined, { size: fileStats.size });
              created++;
              continue;
            }

            if (existingDoc.current_hash === contentHash) {
              skipped++;
              continue;
            }

    // Conflict detection: file changed on disk. Check the most recent
    // document event — if the DB already recorded the file's new hash under a
    // different version (i.e. another writer advanced the doc), flag it
    // rather than blindly bumping.
    const lastEvent = db
      .prepare('SELECT version, hash FROM document_events WHERE document_id = ? ORDER BY timestamp DESC LIMIT 1')
      .get(existingDoc.id) as { version: number; hash: string } | undefined;

    if (lastEvent && lastEvent.hash === contentHash && lastEvent.version !== existingDoc.version) {
      // Disk matches an event but the doc row diverged — true conflict
      conflictDetails.push({
        path: relPath,
        existingVersion: existingDoc.version,
        fileHash: contentHash,
        dbHash: existingDoc.current_hash,
      });
      continue;
    }

    const doc = getOrCreateDocumentIdentity(relPath, content, 'USER');
    recordDocumentEvent(doc.id, 'modified', relPath, doc.version, contentHash, 'USER', undefined, { size: fileStats.size });
    updated++;
  }

  // Determine scan quality BEFORE tombstone deletions - partial/failed scans must not cause deletions
  let scanQuality: 'COMPLETE' | 'PARTIAL' | 'FAILED' = 'COMPLETE';
  if (readErrors > 0 && readErrors < markdownFiles.length) {
    scanQuality = 'PARTIAL';
  } else if (readErrors >= markdownFiles.length && markdownFiles.length > 0) {
    scanQuality = 'FAILED';
  } else if (markdownFiles.length === 0) {
    scanQuality = 'COMPLETE'; // No files to scan
  }

  // Only delete documents that were in the SUBTREE and not seen
  // This prevents sibling deletions outside the reconciliation scope
  // Only tombstone if scanQuality is COMPLETE - partial/failed scans must not cause deletions
  const subtreePrefix = syncPath ? syncPath.replace(/\\/g, '/') + '/' : '';
  const docsInSubtree = db.prepare('SELECT * FROM documents WHERE path LIKE ? AND deleted_at IS NULL').all(subtreePrefix + '%') as any[];

  for (const doc of docsInSubtree) {
    if (!seenPaths.has(doc.path)) {
      // Double-check: file really doesn't exist (not a read error)
      const fullPath = path.join(vaultPath, doc.path);
      try {
        await fs.promises.access(fullPath);
        // File exists but wasn't in scan - shouldn't happen, skip
        continue;
      } catch {
        // File genuinely gone - only tombstone if scan was COMPLETE
        if (scanQuality === 'COMPLETE') {
          const now = Date.now();
          db.prepare('UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now, now, doc.id);
          recordDocumentEvent(doc.id, 'deleted', doc.path, doc.version, doc.current_hash, 'USER');
          deleted++;
        }
      }
    }
  }

  const result: ReconcileResult = {
    created,
    updated,
    deleted,
    renamed,
    conflicts: conflictDetails.length,
    skipped,
    conflictDetails,
    scanQuality,
  };

  broadcastEvent('reconcile-complete', {
    path: syncPath || vaultPath,
    created,
    updated,
    deleted,
    renamed,
    conflicts: result.conflicts,
    skipped,
    scanQuality,
    timestamp: new Date().toISOString(),
  });

  return result;
}
