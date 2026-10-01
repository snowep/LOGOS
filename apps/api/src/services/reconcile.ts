import fs from 'fs';
import path from 'path';
import {
  db,
  computeContentHash,
  getOrCreateDocumentIdentity,
  getDocumentByPath,
  recordDocumentEvent,
  getDocumentByHash,
  resolveSafePath,
} from '../db';
import { config } from '../config';
import { broadcastEvent } from '../routes/events';

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
}

function scanMarkdownFiles(dir: string, basePath: string): string[] {
  const markdownFiles: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      markdownFiles.push(...scanMarkdownFiles(fullPath, basePath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
      markdownFiles.push(path.relative(basePath, fullPath).replace(/\\/g, '/'));
    }
  }
  return markdownFiles;
}

/**
 * Real reconciliation: walks the vault, compares file hash against the DB's
 * current_hash AND version ancestry. A file whose content changed on disk
 * while its DB version also advanced (e.g. concurrent LOGOS write) is
 * reported as a conflict instead of silently overwritten.
 */
export async function reconcile(syncPath?: string): Promise<ReconcileResult> {
  const vaultPath = config.vaultPath;
  const targetPath = syncPath ? resolveSafePath(vaultPath, syncPath) : vaultPath;

  const markdownFiles = scanMarkdownFiles(targetPath, vaultPath);

  let created = 0;
  let updated = 0;
  let deleted = 0;
  let renamed = 0;
  let skipped = 0;
  const conflictDetails: ReconcileResult['conflictDetails'] = [];

  const seenPaths = new Set<string>();

  for (const relPath of markdownFiles) {
    seenPaths.add(relPath);
    const fullPath = path.join(vaultPath, relPath);
    const content = await fs.promises.readFile(fullPath, 'utf8');
    const contentHash = computeContentHash(content);
    const fileStats = await fs.promises.stat(fullPath);

    const existingDoc = getDocumentByPath(relPath);

    if (!existingDoc) {
      // Check if this file's hash matches an existing document (rename/move)
      const docByHash = getDocumentByHash(contentHash);
      if (docByHash) {
        // This is a rename/move - update path
        const previousPath = docByHash.path;
        const now = Date.now();
        db.prepare('UPDATE documents SET path = ?, updated_at = ? WHERE id = ?').run(relPath, now, docByHash.id);
        recordDocumentEvent(docByHash.id, 'renamed', relPath, docByHash.version, contentHash, 'USER', previousPath, { size: fileStats.size });
        renamed++;
        continue;
      }

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

  const allDocs = db.prepare('SELECT * FROM documents').all() as any[];
  for (const doc of allDocs) {
    if (!seenPaths.has(doc.path)) {
      recordDocumentEvent(doc.id, 'deleted', doc.path, doc.version, doc.current_hash, 'USER');
      db.prepare('DELETE FROM documents WHERE id = ?').run(doc.id);
      deleted++;
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
  };

  broadcastEvent('reconcile-complete', {
    path: syncPath || vaultPath,
    created,
    updated,
    deleted,
    renamed,
    conflicts: result.conflicts,
    skipped,
    timestamp: new Date().toISOString(),
  });

  return result;
}
