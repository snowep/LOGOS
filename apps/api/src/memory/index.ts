import { db, EpisodicMemory, SemanticMemory, ProceduralMemory, WorkingMemory } from '../db';
import { generateEmbedding, embeddingToBuffer, bufferToEmbedding, EMBEDDING_CONFIG } from '../embeddings';
import { v4 as uuidv4 } from 'uuid';

function now() { return Date.now(); }

// Type helpers for database rows
interface EpisodicRow {
  id: string;
  type: string;
  content: string;
  metadata: string | null;
  embedding: Buffer | null;
  timestamp: number;
  session_id: string | null;
  source: string | null;
  distance?: number;
}

interface SemanticRow {
  id: string;
  fact: string;
  category: string | null;
  confidence: number;
  embedding: Buffer | null;
  source: string | null;
  created_at: number;
  updated_at: number;
  access_count: number;
  last_accessed: number | null;
  distance?: number;
}

interface ProceduralRow {
  id: string;
  name: string;
  description: string | null;
  steps: string;
  triggers: string | null;
  embedding: Buffer | null;
  success_rate: number;
  use_count: number;
  created_at: number;
  updated_at: number;
  distance?: number;
}

interface WorkingRow {
  id: string;
  session_id: string;
  key: string;
  value: string;
  priority: number;
  expires_at: number | null;
  created_at: number;
  updated_at: number;
}

// ===== EPISODIC MEMORY =====
export async function writeEpisodic(memory: Omit<EpisodicMemory, 'id' | 'embedding'>): Promise<string> {
  const id = uuidv4();
  const embedding = await generateEmbedding(memory.content);
  
  const stmt = db.prepare(`
      INSERT INTO episodic_memory (id, type, content, metadata, embedding, timestamp, session_id, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
  stmt.run(id, memory.type, memory.content, JSON.stringify(memory.metadata || {}), embeddingToBuffer(embedding), memory.timestamp, memory.session_id || null, memory.source || null);

  // Also insert into vec table
  const vecStmt = db.prepare('INSERT INTO vec_episodic (rowid, embedding) VALUES (?, ?)');
  vecStmt.run(id, embeddingToBuffer(embedding));

  return id;
}

export async function searchEpisodic(query: string, limit = 10, threshold = EMBEDDING_CONFIG.similarityThreshold): Promise<(EpisodicMemory & { similarity: number })[]> {
  const queryEmbedding = await generateEmbedding(query);
  const queryBuffer = embeddingToBuffer(queryEmbedding);

  const rows = db.prepare(`
    SELECT e.*, vec_distance_cosine(embedding, ?) as distance
    FROM episodic_memory e
    JOIN vec_episodic v ON e.id = v.rowid
    WHERE vec_distance_cosine(embedding, ?) < ?
    ORDER BY distance ASC
    LIMIT ?
  `).all(queryBuffer, queryBuffer, 1 - threshold, limit) as EpisodicRow[];

  return rows.map(row => ({
    id: row.id,
    type: row.type,
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    embedding: row.embedding ? bufferToEmbedding(row.embedding) : undefined,
    timestamp: row.timestamp,
    session_id: row.session_id || undefined,
    source: row.source || undefined,
    similarity: row.distance !== undefined ? 1 - row.distance : 1,
  }));
}

export function getEpisodicById(id: string): EpisodicMemory | null {
  const row = db.prepare('SELECT * FROM episodic_memory WHERE id = ?').get(id) as EpisodicRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    embedding: row.embedding ? bufferToEmbedding(row.embedding) : undefined,
    timestamp: row.timestamp,
    session_id: row.session_id || undefined,
    source: row.source || undefined,
  };
}

export function getRecentEpisodic(limit = 50): EpisodicMemory[] {
  const rows = db.prepare('SELECT * FROM episodic_memory ORDER BY timestamp DESC LIMIT ?').all(limit) as EpisodicRow[];
  return rows.map(row => ({
    id: row.id,
    type: row.type,
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    embedding: row.embedding ? bufferToEmbedding(row.embedding) : undefined,
    timestamp: row.timestamp,
    session_id: row.session_id || undefined,
    source: row.source || undefined,
  }));
}

// ===== SEMANTIC MEMORY =====
export async function writeSemantic(memory: Omit<SemanticMemory, 'id' | 'embedding' | 'created_at' | 'updated_at' | 'access_count' | 'last_accessed'>): Promise<string> {
  const id = uuidv4();
  const embedding = await generateEmbedding(memory.fact);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO semantic_memory (id, fact, category, confidence, embedding, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, memory.fact, memory.category || null, memory.confidence ?? 1.0, embeddingToBuffer(embedding), memory.source || null, timestamp, timestamp);

  const vecStmt = db.prepare('INSERT INTO vec_semantic (rowid, embedding) VALUES (?, ?)');
  vecStmt.run(id, embeddingToBuffer(embedding));

  return id;
}

export async function searchSemantic(query: string, limit = 10, threshold = EMBEDDING_CONFIG.similarityThreshold): Promise<(SemanticMemory & { similarity: number })[]> {
  const queryEmbedding = await generateEmbedding(query);
  const queryBuffer = embeddingToBuffer(queryEmbedding);

  const rows = db.prepare(`
    SELECT s.*, vec_distance_cosine(embedding, ?) as distance
    FROM semantic_memory s
    JOIN vec_semantic v ON s.id = v.rowid
    WHERE vec_distance_cosine(embedding, ?) < ?
    ORDER BY distance ASC, s.confidence DESC
    LIMIT ?
  `).all(queryBuffer, queryBuffer, 1 - threshold, limit) as SemanticRow[];

  return rows.map(row => ({
    id: row.id,
    fact: row.fact,
    category: row.category || undefined,
    confidence: row.confidence,
    embedding: row.embedding ? bufferToEmbedding(row.embedding) : undefined,
    source: row.source || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    access_count: row.access_count,
    last_accessed: row.last_accessed || undefined,
    similarity: row.distance !== undefined ? 1 - row.distance : 1,
  }));
}

export function getSemanticById(id: string): SemanticMemory | null {
  const row = db.prepare('SELECT * FROM semantic_memory WHERE id = ?').get(id) as SemanticRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    fact: row.fact,
    category: row.category || undefined,
    confidence: row.confidence,
    embedding: row.embedding ? bufferToEmbedding(row.embedding) : undefined,
    source: row.source || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
    access_count: row.access_count,
    last_accessed: row.last_accessed || undefined,
  };
}

export function updateSemanticAccess(id: string): void {
  db.prepare('UPDATE semantic_memory SET access_count = access_count + 1, last_accessed = ?, updated_at = ? WHERE id = ?').run(now(), now(), id);
}

// ===== PROCEDURAL MEMORY =====
export async function writeProcedural(memory: Omit<ProceduralMemory, 'id' | 'embedding' | 'success_rate' | 'use_count' | 'created_at' | 'updated_at'>): Promise<string> {
  const id = uuidv4();
  const searchText = `\${memory.name} \${memory.description || ''} \${memory.steps} \${memory.triggers || ''}`;
  const embedding = await generateEmbedding(searchText);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO procedural_memory (id, name, description, steps, triggers, embedding, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, memory.name, memory.description || null, memory.steps, memory.triggers || null, embeddingToBuffer(embedding), timestamp, timestamp);

  const vecStmt = db.prepare('INSERT INTO vec_procedural (rowid, embedding) VALUES (?, ?)');
  vecStmt.run(id, embeddingToBuffer(embedding));

  return id;
}

export async function searchProcedural(query: string, limit = 5, threshold = EMBEDDING_CONFIG.similarityThreshold): Promise<(ProceduralMemory & { similarity: number })[]> {
  const queryEmbedding = await generateEmbedding(query);
  const queryBuffer = embeddingToBuffer(queryEmbedding);

  const rows = db.prepare(`
    SELECT p.*, vec_distance_cosine(embedding, ?) as distance
    FROM procedural_memory p
    JOIN vec_procedural v ON p.id = v.rowid
    WHERE vec_distance_cosine(embedding, ?) < ?
    ORDER BY distance ASC, p.success_rate DESC
    LIMIT ?
  `).all(queryBuffer, queryBuffer, 1 - threshold, limit) as ProceduralRow[];

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    steps: row.steps,
    triggers: row.triggers || undefined,
    embedding: row.embedding ? bufferToEmbedding(row.embedding) : undefined,
    success_rate: row.success_rate,
    use_count: row.use_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
    similarity: row.distance !== undefined ? 1 - row.distance : 1,
  }));
}

export function recordProceduralUse(id: string, success: boolean): void {
  const row = db.prepare('SELECT use_count, success_rate FROM procedural_memory WHERE id = ?').get(id) as { use_count: number; success_rate: number } | null;
  if (!row) return;
  
  const newUseCount = row.use_count + 1;
  const newSuccessRate = (row.success_rate * row.use_count + (success ? 1 : 0)) / newUseCount;
  
  db.prepare('UPDATE procedural_memory SET use_count = ?, success_rate = ?, updated_at = ? WHERE id = ?')
    .run(newUseCount, newSuccessRate, now(), id);
}

// ===== WORKING MEMORY =====
export function writeWorking(memory: Omit<WorkingMemory, 'id' | 'created_at' | 'updated_at'>): string {
  const id = uuidv4();
  const timestamp = now();
  
  db.prepare(`
    INSERT INTO working_memory (id, session_id, key, value, priority, expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, memory.session_id, memory.key, memory.value, memory.priority ?? 0, memory.expires_at || null, timestamp, timestamp);

  return id;
}

export function getWorking(sessionId: string, key: string): WorkingMemory | null {
  const row = db.prepare('SELECT * FROM working_memory WHERE session_id = ? AND key = ? AND (expires_at IS NULL OR expires_at > ?)')
    .get(sessionId, key, now()) as WorkingRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    session_id: row.session_id,
    key: row.key,
    value: row.value,
    priority: row.priority,
    expires_at: row.expires_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function getAllWorking(sessionId: string): WorkingMemory[] {
  const rows = db.prepare('SELECT * FROM working_memory WHERE session_id = ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY priority DESC, updated_at DESC')
    .all(sessionId, now()) as WorkingRow[];
  return rows.map(row => ({
    id: row.id,
    session_id: row.session_id,
    key: row.key,
    value: row.value,
    priority: row.priority,
    expires_at: row.expires_at || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export function updateWorking(sessionId: string, key: string, value: string): void {
  db.prepare('UPDATE working_memory SET value = ?, updated_at = ? WHERE session_id = ? AND key = ?')
    .run(value, now(), sessionId, key);
}

export function deleteWorking(sessionId: string, key: string): void {
  db.prepare('DELETE FROM working_memory WHERE session_id = ? AND key = ?').run(sessionId, key);
}

export function clearExpiredWorking(): number {
  const result = db.prepare('DELETE FROM working_memory WHERE expires_at IS NOT NULL AND expires_at <= ?').run(now());
  return result.changes;
}

export function clearSessionWorking(sessionId: string): number {
  const result = db.prepare('DELETE FROM working_memory WHERE session_id = ?').run(sessionId);
  return result.changes;
}

// ===== UNIFIED SEARCH =====
export async function searchAllMemory(query: string, limit = 10): Promise<{
  episodic: (EpisodicMemory & { similarity: number })[];
  semantic: (SemanticMemory & { similarity: number })[];
  procedural: (ProceduralMemory & { similarity: number })[];
}> {
  const [episodic, semantic, procedural] = await Promise.all([
    searchEpisodic(query, Math.ceil(limit / 3)),
    searchSemantic(query, Math.ceil(limit / 3)),
    searchProcedural(query, Math.ceil(limit / 3)),
  ]);
  return { episodic, semantic, procedural };
}