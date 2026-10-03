import fs from 'fs';
import path from 'path';
import {
  db,
  computeContentHash,
  generateDocumentId,
  getDocumentIdentity,
  getOrCreateDocumentIdentity,
  getActiveDocumentByPath,
  getDocumentIncludingTombstone,
  recordDocumentEvent,
  WriterIdentity,
  DocumentIdentity,
  resolveSafePath,
} from '../db';
import { config } from '../config';
import { broadcastEvent } from '../routes/events';

export interface CreateDocumentOptions {
  path: string;
  content: string;
  writer: WriterIdentity;
}

export interface UpdateDocumentOptions {
  id: string;
  content: string;
  expectedVersion: number;
  expectedHash: string;
  writer: WriterIdentity;
}

export interface DeleteDocumentOptions {
  id: string;
  expectedVersion: number;
  expectedHash: string;
}

export interface DocumentOperationResult {
  document: DocumentIdentity;
  eventType: 'created' | 'modified' | 'deleted';
}

export interface ConflictDetails {
  currentVersion: number;
  currentHash: string;
  expectedVersion: number;
  expectedHash: string;
}

/**
 * Cross-resource atomicity: file write + DB update + event emission
 * Uses a recovery boundary: if any step fails after file write, we attempt rollback.
 * If rollback fails, we log for manual recovery.
 * Uses SQLite transaction for DB + event atomicity.
 */
export function createDocument(options: CreateDocumentOptions): DocumentOperationResult {
  const { path: docPath, content, writer } = options;
  const hash = computeContentHash(content);
  const now = Date.now();
  const size = Buffer.byteLength(content, 'utf8');

  // Ensure parent directory exists
  const fullPath = resolveSafePath(config.vaultPath, docPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Check if active document already exists at this path
  const existingDoc = getActiveDocumentByPath(docPath);
  if (existingDoc) {
    throw createConflictError({
      ...existingDoc,
      current_hash: hash,
      version: existingDoc.version,
    }, 0, '');
  }

  // Check if filesystem file already exists
  if (fs.existsSync(fullPath)) {
    // Read existing file to check if it's the same content
    const existingContent = fs.readFileSync(fullPath, 'utf8');
    const existingHash = computeContentHash(existingContent);
    if (existingHash === hash) {
      // Same content exists - could be a tombstone restore scenario
      // Use getOrCreateDocumentIdentity to resurrect if tombstoned
      throw createConflictError({
        id: '',
        path: docPath,
        current_hash: existingHash,
        version: 0,
        created_at: 0,
        updated_at: 0,
        deleted_at: null,
        last_writer: 'USER',
        size: Buffer.byteLength(existingContent, 'utf8'),
      }, 0, '');
    }
    // Different content exists - reject to avoid overwriting user files
    throw createConflictError({
      id: '',
      path: docPath,
      current_hash: existingHash,
      version: 0,
      created_at: 0,
      updated_at: 0,
      deleted_at: null,
      last_writer: 'USER',
      size: Buffer.byteLength(existingContent, 'utf8'),
    }, 0, '');
  }

  // Atomic write: write to temp file then rename
  const tempPath = `${fullPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tempPath, content, 'utf8');
  
  // Verify written content matches expected hash
  const writtenContent = fs.readFileSync(tempPath, 'utf8');
  const writtenHash = computeContentHash(writtenContent);
  if (writtenHash !== hash) {
    fs.unlinkSync(tempPath);
    throw new Error('Write verification failed: content hash mismatch after write');
  }

  fs.renameSync(tempPath, fullPath);

  // Cross-resource atomicity: DB record creation with rollback on failure
  // Use SQLite transaction for DB + event atomicity
  let dbRecordCreated = false;
  let eventRecorded = false;
  let eventBroadcast = false;
  let docId: string | null = null;

  try {
    // Create DB record with stable UUID (uses getOrCreateDocumentIdentity which handles tombstone resurrection)
    const created = getOrCreateDocumentIdentity(docPath, content, writer);
    docId = created.id;
    if (!docId) {
      throw new Error('Failed to create document identity');
    }
    dbRecordCreated = true;

    // Use transaction for DB update + event record
    db.transaction(() => {
      recordDocumentEvent(docId!, 'created', docPath, 1, hash, writer, undefined, { size });
    })();
    eventRecorded = true;

    // Broadcast event (outside transaction - if this fails, we log but don't rollback DB)
    broadcastEvent('file-change', {
      event: 'created',
      documentId: docId!,
      path: docPath,
      version: 1,
      hash,
      writer,
      timestamp: new Date().toISOString(),
    });
    eventBroadcast = true;

    return { document: created, eventType: 'created' };
  } catch (err) {
    // Recovery boundary: attempt rollback
    if (eventBroadcast && !eventRecorded) {
      console.error('[createDocument] Event broadcast but not recorded - inconsistency');
    }
    if (dbRecordCreated && docId) {
      // Try to delete the DB record we created
      try {
        db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
      } catch (rollbackErr) {
        console.error('[createDocument] ROLLBACK FAILED - manual recovery needed:', rollbackErr);
      }
    }
    // Try to remove the file we wrote
    try {
      fs.unlinkSync(fullPath);
    } catch (rollbackErr) {
      console.error('[createDocument] FILE ROLLBACK FAILED - manual recovery needed:', rollbackErr);
    }
    throw err;
  }
}

/**
 * Update an existing document: verify DB + filesystem state, atomic write, 409 on mismatch
 * Uses SQLite transaction for DB + event atomicity.
 */
export function updateDocument(options: UpdateDocumentOptions): DocumentOperationResult {
  const { id, content, expectedVersion, expectedHash, writer } = options;

  // Get current document from DB
  const doc = getDocumentIdentity(id);
  if (!doc) {
    throw new Error('Document not found');
  }

  // Verify document is not deleted
  if (doc.deleted_at !== null) {
    throw new Error('Cannot update deleted document');
  }

  // Verify version matches
  if (doc.version !== expectedVersion) {
    throw createConflictError(doc, expectedVersion, expectedHash);
  }

  // Verify hash matches
  if (doc.current_hash !== expectedHash) {
    throw createConflictError(doc, expectedVersion, expectedHash);
  }

  // Verify filesystem state matches DB - file MUST exist and hash MUST match
  const fullPath = resolveSafePath(config.vaultPath, doc.path);
  if (!fs.existsSync(fullPath)) {
    throw createConflictError(doc, expectedVersion, expectedHash);
  }
  
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const fileHash = computeContentHash(fileContent);
  if (fileHash !== doc.current_hash) {
    throw createConflictError(doc, expectedVersion, expectedHash);
  }

  const newHash = computeContentHash(content);
  
  // If content hasn't changed, return current document without incrementing version
  if (newHash === doc.current_hash) {
    return { document: doc, eventType: 'modified' };
  }

  const now = Date.now();
  const size = Buffer.byteLength(content, 'utf8');

  // Atomic write to filesystem
  const tempPath = `${fullPath}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tempPath, content, 'utf8');
  
  // Verify written content matches expected hash
  const writtenContent = fs.readFileSync(tempPath, 'utf8');
  const writtenHash = computeContentHash(writtenContent);
  if (writtenHash !== newHash) {
    fs.unlinkSync(tempPath);
    throw new Error('Write verification failed: content hash mismatch after write');
  }

  fs.renameSync(tempPath, fullPath);

  // Cross-resource atomicity: DB update + event with recovery boundary
  // Use SQLite transaction for DB + event atomicity
  let dbUpdated = false;
  let eventRecorded = false;
  let eventBroadcast = false;

  try {
    // Use transaction for DB update + event record
    db.transaction(() => {
      // Update DB - increment version only on real content change
      const updatedVersion = doc.version + 1;
      db.prepare(`
        UPDATE documents SET current_hash = ?, version = ?, updated_at = ?, last_writer = ?, size = ?
        WHERE id = ?
      `).run(newHash, updatedVersion, now, writer, size, id);

      // Record event
      recordDocumentEvent(doc.id, 'modified', doc.path, updatedVersion, newHash, writer, undefined, { size });
    })();
    dbUpdated = true;
    eventRecorded = true;

    const updated: DocumentIdentity = {
      ...doc,
      current_hash: newHash,
      version: doc.version + 1,
      updated_at: now,
      last_writer: writer,
      size,
    };

    // Broadcast event (outside transaction - if this fails, we log but don't rollback DB)
    broadcastEvent('file-change', {
      event: 'modified',
      documentId: doc.id,
      path: doc.path,
      version: updated.version,
      hash: newHash,
      writer,
      timestamp: new Date().toISOString(),
    });
    eventBroadcast = true;

    return { document: updated, eventType: 'modified' };
  } catch (err) {
    // Recovery boundary: if DB updated but event failed, log inconsistency
    if (dbUpdated && !eventRecorded) {
      console.error('[updateDocument] DB updated but event not recorded - inconsistency');
    }
    if (eventBroadcast && !eventRecorded) {
      console.error('[updateDocument] Event broadcast but not recorded - inconsistency');
    }
    throw err;
  }
}

/**
 * Delete a document: verify, remove file, tombstone (deleted_at), event
 * Uses SQLite transaction for DB + event atomicity.
 */
export function deleteDocument(options: DeleteDocumentOptions): DocumentOperationResult {
  const { id, expectedVersion, expectedHash } = options;

  // Get current document from DB
  const doc = getDocumentIdentity(id);
  if (!doc) {
    throw new Error('Document not found');
  }

  // Verify version matches
  if (doc.version !== expectedVersion) {
    throw createConflictError(doc, expectedVersion, expectedHash);
  }

  // Verify hash matches
  if (doc.current_hash !== expectedHash) {
    throw createConflictError(doc, expectedVersion, expectedHash);
  }

  // Verify filesystem state matches DB
  const fullPath = resolveSafePath(config.vaultPath, doc.path);
  if (fs.existsSync(fullPath)) {
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const fileHash = computeContentHash(fileContent);
    if (fileHash !== doc.current_hash) {
      throw createConflictError(doc, expectedVersion, expectedHash);
    }
  }

  const now = Date.now();

  // Cross-resource atomicity: file deletion + DB tombstone + event with recovery boundary
  // Use SQLite transaction for DB + event atomicity
  let fileDeleted = false;
  let dbTombstoned = false;
  let eventRecorded = false;
  let eventBroadcast = false;

  try {
    // Remove file from filesystem
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    fileDeleted = true;

    let tombstoned: DocumentIdentity;

    // Use transaction for DB tombstone + event record
    db.transaction(() => {
      // Tombstone in DB (set deleted_at, keep record for history)
      db.prepare(`
        UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ?
      `).run(now, now, id);
      dbTombstoned = true;

      tombstoned = {
        ...doc,
        deleted_at: now,
        updated_at: now,
      };

      // Record event with correct writer identity
      recordDocumentEvent(doc.id, 'deleted', doc.path, doc.version, doc.current_hash, doc.last_writer, undefined, { size: doc.size });
    })();
    eventRecorded = true;

    // Broadcast event (outside transaction - if this fails, we log but don't rollback DB)
    broadcastEvent('file-change', {
      event: 'deleted',
      documentId: doc.id,
      path: doc.path,
      version: doc.version,
      hash: doc.current_hash,
      writer: doc.last_writer,
      timestamp: new Date().toISOString(),
    });
    eventBroadcast = true;

    return { document: tombstoned!, eventType: 'deleted' };
  } catch (err) {
    // Recovery boundary
    if (fileDeleted && !dbTombstoned) {
      console.error('[deleteDocument] File deleted but DB not tombstoned - manual recovery needed');
    }
    if (dbTombstoned && !eventRecorded) {
      console.error('[deleteDocument] DB tombstoned but event not recorded - inconsistency');
    }
    if (eventBroadcast && !eventRecorded) {
      console.error('[deleteDocument] Event broadcast but not recorded - inconsistency');
    }
    throw err;
  }
}

/**
 * Check if document exists and is not deleted
 */
export function getActiveDocument(id: string): DocumentIdentity | null {
  const doc = getDocumentIdentity(id);
  if (!doc || doc.deleted_at !== null) {
    return null;
  }
  return doc;
}

/**
 * Check if document exists (including deleted/tombstoned)
 */
export function getDocumentById(id: string): DocumentIdentity | null {
  return getDocumentIdentity(id);
}

/**
 * List active (non-deleted) documents
 */
export function listActiveDocuments(limit = 50, offset = 0): DocumentIdentity[] {
  return db.prepare(`
    SELECT * FROM documents WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as DocumentIdentity[];
}

/**
 * Get document history (events)
 */
export function getDocumentHistory(documentId: string, limit = 50): any[] {
  return db.prepare('SELECT * FROM document_events WHERE document_id = ? ORDER BY timestamp DESC LIMIT ?').all(documentId, limit);
}

function createConflictError(doc: DocumentIdentity, expectedVersion: number, expectedHash: string): Error {
  const error = new Error('Conflict') as Error & { conflict: ConflictDetails };
  error.conflict = {
    currentVersion: doc.version,
    currentHash: doc.current_hash,
    expectedVersion,
    expectedHash,
  };
  return error;
}