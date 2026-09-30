import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DB_DIR = path.join(__dirname, '../../storage/system');
const DB_PATH = path.join(DB_DIR, 'logos.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbInstance = new Database(DB_PATH);
dbInstance.pragma('journal_mode = WAL');
dbInstance.pragma('foreign_keys = ON');

export const db = dbInstance as any;

// Writer identity enum
export type WriterIdentity = 'USER' | 'LOGOS' | 'AGENT' | 'AUTOMATION';

// Document identity interface
export interface DocumentIdentity {
  id: string;
  path: string;
  current_hash: string;
  version: number;
  created_at: number;
  updated_at: number;
  last_writer: WriterIdentity;
  size: number;
  mime_type?: string;
}

// Vector ID mapping for sqlite-vec compatibility
export interface VectorIdMapping {
  app_id: string;      // Application UUID
  vector_rowid: number; // sqlite-vec rowid (INTEGER PRIMARY KEY)
  table_name: string;   // Which memory table: episodic, semantic, procedural
}

// Schema migration system
const SCHEMA_VERSION_KEY = 'schema_version';
const CURRENT_SCHEMA_VERSION = 2;

function getSchemaVersion(): number {
  try {
    const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
    return row.user_version;
  } catch {
    return 0;
  }
}

function setSchemaVersion(version: number): void {
  db.pragma(`user_version = ${version}`);
}

function runMigration(version: number): void {
  switch (version) {
    case 1:
      // Migration 1: Add document identity table
      console.log('Running migration 1: Adding document identity table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          path TEXT NOT NULL UNIQUE,
          current_hash TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          last_writer TEXT NOT NULL CHECK (last_writer IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION')),
          size INTEGER NOT NULL DEFAULT 0,
          mime_type TEXT
        );
      `);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);`);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(current_hash);`);
      break;
    case 2:
      // Migration 2: Add vector ID mapping table
      console.log('Running migration 2: Adding vector ID mapping...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS vector_id_mapping (
          app_id TEXT NOT NULL,
          vector_rowid INTEGER NOT NULL,
          table_name TEXT NOT NULL CHECK (table_name IN ('episodic_memory', 'semantic_memory', 'procedural_memory')),
          created_at INTEGER NOT NULL,
          PRIMARY KEY (app_id, table_name)
        );
      `);
      db.exec(`CREATE INDEX IF NOT EXISTS idx_vector_mapping_rowid ON vector_id_mapping(vector_rowid);`);
      break;
  }
}

export function initializeSchema() {
  const currentVersion = getSchemaVersion();
  
  // Run migrations if needed
  for (let v = currentVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    runMigration(v);
  }
  setSchemaVersion(CURRENT_SCHEMA_VERSION);

  // Note: sqlite-vec native extension not available on Windows via npm
  // Vector search will be done in JavaScript using cosine similarity
  console.warn('sqlite-vec native extension not available, using JS-based vector search');

  // Episodic Memory (events, interactions)
  db.exec(`
    CREATE TABLE IF NOT EXISTS episodic_memory (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      embedding BLOB,
      timestamp INTEGER NOT NULL,
      session_id TEXT,
      source TEXT,
      writer_identity TEXT CHECK (writer_identity IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION'))
    );
  `);

  // Add writer_identity column if it doesn't exist (migration for existing databases)
  try {
    db.exec(`ALTER TABLE episodic_memory ADD COLUMN writer_identity TEXT CHECK (writer_identity IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION'));`);
  } catch (e) {
    // Column already exists
  }

  // Semantic Memory (facts, concepts, knowledge)
  db.exec(`
    CREATE TABLE IF NOT EXISTS semantic_memory (
      id TEXT PRIMARY KEY,
      fact TEXT NOT NULL,
      category TEXT,
      confidence REAL DEFAULT 1.0,
      embedding BLOB,
      source TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      access_count INTEGER DEFAULT 0,
      last_accessed INTEGER,
      writer_identity TEXT CHECK (writer_identity IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION'))
    );
  `);

  // Add writer_identity column if it doesn't exist
  try {
    db.exec(`ALTER TABLE semantic_memory ADD COLUMN writer_identity TEXT CHECK (writer_identity IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION'));`);
  } catch (e) {
    // Column already exists
  }

  // Procedural Memory (skills, workflows, patterns)
  db.exec(`
    CREATE TABLE IF NOT EXISTS procedural_memory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      steps TEXT NOT NULL,
      triggers TEXT,
      embedding BLOB,
      success_rate REAL DEFAULT 0.0,
      use_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      writer_identity TEXT CHECK (writer_identity IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION'))
    );
  `);

  // Add writer_identity column if it doesn't exist
  try {
    db.exec(`ALTER TABLE procedural_memory ADD COLUMN writer_identity TEXT CHECK (writer_identity IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION'));`);
  } catch (e) {
    // Column already exists
  }

  // Working Memory (active context, current task state)
  db.exec(`
    CREATE TABLE IF NOT EXISTS working_memory (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      priority INTEGER DEFAULT 0,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(session_id, key)
    );
  `);

  // Context Index (for retrieval)
  db.exec(`
    CREATE TABLE IF NOT EXISTS context_index (
      id TEXT PRIMARY KEY,
      memory_type TEXT NOT NULL,
      memory_id TEXT NOT NULL,
      keywords TEXT,
      embedding BLOB,
      relevance_score REAL DEFAULT 0.0,
      created_at INTEGER NOT NULL
    );
  `);

  // API Keys
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      permissions TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      last_used INTEGER,
      revoked INTEGER DEFAULT 0
    );
  `);

  // Document Events (for P0.4 synchronization)
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_events (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('created', 'modified', 'deleted', 'renamed', 'moved')),
      path TEXT NOT NULL,
      previous_path TEXT,
      version INTEGER NOT NULL,
      hash TEXT NOT NULL,
      writer_identity TEXT NOT NULL CHECK (writer_identity IN ('USER', 'LOGOS', 'AGENT', 'AUTOMATION')),
      metadata TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_document_events_doc ON document_events(document_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_document_events_timestamp ON document_events(timestamp DESC);`);

  // Indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_episodic_timestamp ON episodic_memory(timestamp DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_episodic_writer ON episodic_memory(writer_identity);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_semantic_category ON semantic_memory(category);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_semantic_writer ON semantic_memory(writer_identity);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_procedural_writer ON procedural_memory(writer_identity);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_working_session ON working_memory(session_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_context_memory ON context_index(memory_type, memory_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);`);

  console.log(`Database schema initialized (version ${CURRENT_SCHEMA_VERSION}, JS-based vector search)`);
}

// Utility functions

export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function generateDocumentId(path: string): string {
  return crypto.createHash('sha256').update(path).digest('hex').substring(0, 16);
}

export function getOrCreateDocumentIdentity(
  filePath: string,
  content: string,
  writer: WriterIdentity
): DocumentIdentity {
  const docId = generateDocumentId(filePath);
  const hash = computeContentHash(content);
  const now = Date.now();
  const size = Buffer.byteLength(content, 'utf8');
  
  const existing = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId) as DocumentIdentity | undefined;
  
  if (existing) {
    // Update existing document
    const updated: DocumentIdentity = {
      ...existing,
      path: filePath,
      current_hash: hash,
      version: existing.version + 1,
      updated_at: now,
      last_writer: writer,
      size,
    };
    db.prepare(`
      UPDATE documents SET path = ?, current_hash = ?, version = ?, updated_at = ?, last_writer = ?, size = ?
      WHERE id = ?
    `).run(filePath, hash, updated.version, now, writer, size, docId);
    return updated;
  } else {
    // Create new document
    const created: DocumentIdentity = {
      id: docId,
      path: filePath,
      current_hash: hash,
      version: 1,
      created_at: now,
      updated_at: now,
      last_writer: writer,
      size,
    };
    db.prepare(`
      INSERT INTO documents (id, path, current_hash, version, created_at, updated_at, last_writer, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(docId, filePath, hash, 1, now, now, writer, size);
    return created;
  }
}

export function getDocumentIdentity(docId: string): DocumentIdentity | null {
  return db.prepare('SELECT * FROM documents WHERE id = ?').get(docId) as DocumentIdentity | null;
}

export function getDocumentByPath(path: string): DocumentIdentity | null {
  return db.prepare('SELECT * FROM documents WHERE path = ?').get(path) as DocumentIdentity | null;
}

export function getDocumentByHash(hash: string): DocumentIdentity | null {
  return db.prepare('SELECT * FROM documents WHERE current_hash = ?').get(hash) as DocumentIdentity | null;
}

export function recordDocumentEvent(
  documentId: string,
  eventType: 'created' | 'modified' | 'deleted' | 'renamed' | 'moved',
  path: string,
  version: number,
  hash: string,
  writer: WriterIdentity,
  previousPath?: string,
  metadata?: Record<string, any>
): void {
  const eventId = crypto.randomUUID();
  const now = Date.now();
  db.prepare(`
    INSERT INTO document_events (id, document_id, event_type, path, previous_path, version, hash, writer_identity, metadata, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(eventId, documentId, eventType, path, previousPath || null, version, hash, writer, JSON.stringify(metadata || {}), now);
}

export function getDocumentEvents(documentId: string, limit = 50): any[] {
  return db.prepare('SELECT * FROM document_events WHERE document_id = ? ORDER BY timestamp DESC LIMIT ?').all(documentId, limit);
}

// Vector ID mapping functions
export function setVectorIdMapping(appId: string, vectorRowid: number, tableName: string): void {
  db.prepare(`
    INSERT OR REPLACE INTO vector_id_mapping (app_id, vector_rowid, table_name, created_at)
    VALUES (?, ?, ?, ?)
  `).run(appId, vectorRowid, tableName, Date.now());
}

export function getVectorIdMapping(appId: string, tableName: string): number | null {
  const row = db.prepare('SELECT vector_rowid FROM vector_id_mapping WHERE app_id = ? AND table_name = ?').get(appId, tableName) as { vector_rowid: number } | undefined;
  return row?.vector_rowid || null;
}

export function getAppIdByVectorRowid(vectorRowid: number, tableName: string): string | null {
  const row = db.prepare('SELECT app_id FROM vector_id_mapping WHERE vector_rowid = ? AND table_name = ?').get(vectorRowid, tableName) as { app_id: string } | undefined;
  return row?.app_id || null;
}

// Path safety utilities
export function resolveSafePath(rootPath: string, relativePath: string): string {
  const normalized = path.normalize(relativePath);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new Error(`Path traversal attempt blocked: ${relativePath}`);
  }
  const resolved = path.resolve(rootPath, normalized);
  
  // Ensure the parent directory exists
  const parentDir = path.dirname(resolved);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  
  // For realpathSync, we need the root to exist
  const realRoot = fs.realpathSync(rootPath);
  
  // For the resolved path, we only need to check if the parent directory is within root
  // Since we already created parentDir, we can use its realpath
  const realParentDir = fs.realpathSync(parentDir);
  if (!realParentDir.startsWith(realRoot)) {
    throw new Error(`Path outside root blocked: ${relativePath}`);
  }
  return resolved;
}

export function close() {
  db.close();
}

// Types (updated with writer_identity)
export interface EpisodicMemory {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: Float32Array;
  timestamp: number;
  session_id?: string;
  source?: string;
  writer_identity?: WriterIdentity;
}

export interface SemanticMemory {
  id: string;
  fact: string;
  category?: string;
  confidence: number;
  embedding?: Float32Array;
  source?: string;
  created_at: number;
  updated_at: number;
  access_count: number;
  last_accessed?: number;
  writer_identity?: WriterIdentity;
}

export interface ProceduralMemory {
  id: string;
  name: string;
  description?: string;
  steps: string;
  triggers?: string;
  embedding?: Float32Array;
  success_rate: number;
  use_count: number;
  created_at: number;
  updated_at: number;
  writer_identity?: WriterIdentity;
}

export interface WorkingMemory {
  id: string;
  session_id: string;
  key: string;
  value: string;
  priority: number;
  expires_at?: number;
  created_at: number;
  updated_at: number;
}

export interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  permissions: string;
  created_at: number;
  expires_at?: number;
  last_used?: number;
  revoked: number;
}