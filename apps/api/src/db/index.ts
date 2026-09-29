import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(path.resolve(''));
const DB_DIR = path.join(__dirname, 'storage/system');
const DB_PATH = path.join(DB_DIR, 'logos.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbInstance = new Database(DB_PATH);
dbInstance.pragma('journal_mode = WAL');
dbInstance.pragma('foreign_keys = ON');

export const db = dbInstance as any;

export function initializeSchema() {
  // Enable sqlite-vec extension
  try {
    db.loadExtension(path.join(__dirname, 'node_modules/sqlite-vec/dist/vec0'));
  } catch (e) {
    console.warn('sqlite-vec extension not available, vector search disabled');
  }

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
      source TEXT
    );
  `);

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
      last_accessed INTEGER
    );
  `);

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
      updated_at INTEGER NOT NULL
    );
  `);

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

  // Vector search virtual tables using sqlite-vec
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_episodic USING vec0(
      embedding FLOAT[384]
    );
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_semantic USING vec0(
      embedding FLOAT[384]
    );
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_procedural USING vec0(
      embedding FLOAT[384]
    );
  `);

  // Indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_episodic_timestamp ON episodic_memory(timestamp DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_semantic_category ON semantic_memory(category);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_working_session ON working_memory(session_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_context_memory ON context_index(memory_type, memory_id);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);`);

  console.log('Database schema initialized with sqlite-vec');
}

export function close() {
  db.close();
}

// Types
export interface EpisodicMemory {
  id: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: Float32Array;
  timestamp: number;
  session_id?: string;
  source?: string;
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