import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import {
  writeEpisodic, searchEpisodic, getEpisodicById, getRecentEpisodic,
  writeSemantic, searchSemantic, getSemanticById, updateSemanticAccess,
  writeProcedural, searchProcedural, recordProceduralUse,
  writeWorking, getWorking, getAllWorking, updateWorking, deleteWorking,
  clearExpiredWorking, clearSessionWorking, searchAllMemory,
} from '../memory';
import { validate } from '../middleware/validate';

const writerEnum = z.enum(['USER', 'LOGOS', 'AGENT', 'AUTOMATION']);
const limitMax50 = z.coerce.number().int().min(1).max(50).default(10);
const limitMax100 = z.coerce.number().int().min(1).max(100).default(50);

const queryWithQ = (limitSchema: z.ZodTypeAny = limitMax50) =>
  z.object({
    q: z.string().min(1),
    limit: limitSchema,
    threshold: z.coerce.number().min(0).max(1).default(0.75),
  });

const router = Router();

router.get('/search', validate({ query: queryWithQ() }), async (req, res) => {
  const { q, limit } = req.query as unknown as { q: string; limit: number };
  const results = await searchAllMemory(q, limit);
  const total = results.episodic.length + results.semantic.length + results.procedural.length;
  res.json({ ...results, total });
});

// --- Episodic ---
const episodicWrite = z.object({
  type: z.string().min(1).max(100),
  content: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.number().int().positive().optional(),
  session_id: z.string().optional(),
  source: z.string().optional(),
  writer_identity: writerEnum.default('LOGOS'),
});

router.post('/episodic', validate({ body: episodicWrite }), async (req, res) => {
  const b = req.body;
  const id = await writeEpisodic({ ...b, timestamp: b.timestamp || Date.now() });
  res.status(201).json({ id, status: 'created' });
});

router.get('/episodic/search', validate({ query: queryWithQ() }), async (req, res) => {
  const { q, limit, threshold } = req.query as unknown as { q: string; limit: number; threshold: number };
  const results = await searchEpisodic(q, limit, threshold);
  res.json({ results, count: results.length });
});

router.get('/episodic/recent', validate({ query: z.object({ limit: limitMax100 }) }), async (req, res) => {
  const { limit } = req.query as unknown as { limit: number };
  const results = getRecentEpisodic(limit);
  res.json({ results, count: results.length });
});

router.get('/episodic/:id', validate({ params: z.object({ id: z.string().min(1) }) }), async (req, res) => {
  const result = getEpisodicById(req.params.id);
  if (!result) return res.status(404).json({ error: 'not_found' });
  return res.json(result);
});

// --- Semantic ---
const semanticWrite = z.object({
  fact: z.string().min(1),
  category: z.string().max(100).optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  source: z.string().optional(),
  writer_identity: writerEnum.default('LOGOS'),
});

router.post('/semantic', validate({ body: semanticWrite }), async (req, res) => {
  const id = await writeSemantic(req.body);
  res.status(201).json({ id, status: 'created' });
});

router.get('/semantic/search', validate({ query: queryWithQ() }), async (req, res) => {
  const { q, limit, threshold } = req.query as unknown as { q: string; limit: number; threshold: number };
  const results = await searchSemantic(q, limit, threshold);
  res.json({ results, count: results.length });
});

router.get('/semantic/:id', validate({ params: z.object({ id: z.string().min(1) }) }), async (req, res) => {
  const result = getSemanticById(req.params.id);
  if (!result) return res.status(404).json({ error: 'not_found' });
  updateSemanticAccess(req.params.id);
  return res.json(result);
});

// --- Procedural ---
const proceduralWrite = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  steps: z.string().min(1),
  triggers: z.string().optional(),
  writer_identity: writerEnum.default('LOGOS'),
});

router.post('/procedural', validate({ body: proceduralWrite }), async (req, res) => {
  const id = await writeProcedural(req.body);
  res.status(201).json({ id, status: 'created' });
});

router.get(
  '/procedural/search',
  validate({ query: queryWithQ(z.coerce.number().int().min(1).max(20).default(5)) }),
  async (req, res) => {
    const { q, limit, threshold } = req.query as unknown as { q: string; limit: number; threshold: number };
    const results = await searchProcedural(q, limit, threshold);
    res.json({ results, count: results.length });
  }
);

router.post(
  '/procedural/:id/use',
  validate({
    params: z.object({ id: z.string().min(1) }),
    body: z.object({ success: z.boolean().default(true) }),
  }),
  async (req, res) => {
    recordProceduralUse(req.params.id, req.body.success);
    res.json({ status: 'recorded' });
  }
);

// --- Working ---
const workingWrite = z.object({
  session_id: z.string().min(1),
  key: z.string().min(1).max(200),
  value: z.string(),
  priority: z.number().int().default(0),
  expires_at: z.number().int().positive().optional(),
});

router.post('/working', validate({ body: workingWrite }), async (req, res) => {
  const id = writeWorking(req.body);
  res.status(201).json({ id, status: 'created' });
});

router.get('/working/:sessionId/:key?', async (req, res) => {
  const { sessionId, key } = req.params;
  if (key) {
    const result = getWorking(sessionId, key);
    if (!result) return res.status(404).json({ error: 'not_found' });
    return res.json(result);
  }
  const results = getAllWorking(sessionId);
  return res.json({ results, count: results.length });
});

router.put(
  '/working/:sessionId/:key',
  validate({ body: z.object({ value: z.string() }) }),
  async (req, res) => {
    updateWorking(req.params.sessionId, req.params.key, req.body.value);
    res.json({ status: 'updated' });
  }
);

router.delete('/working/:sessionId/:key?', async (req, res) => {
  const { sessionId, key } = req.params;
  if (key) {
    deleteWorking(sessionId, key);
    return res.json({ status: 'deleted' });
  }
  const count = clearSessionWorking(sessionId);
  return res.json({ status: 'cleared', count });
});

router.post('/working/cleanup', async (_req, res) => {
  const count = clearExpiredWorking();
  res.json({ status: 'cleaned', count });
});

// --- Promotion ---
router.get(
  '/promote/events',
  validate({ query: z.object({ limit: limitMax100, offset: z.coerce.number().int().nonnegative().default(0) }) }),
  (req, res) => {
    const { limit, offset } = req.query as unknown as { limit: number; offset: number };
    const events = db.prepare('SELECT * FROM document_events ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset);
    const total = db.prepare('SELECT COUNT(*) as count FROM document_events').get() as { count: number };
    res.json({ events, total: total.count, limit, offset });
  }
);

const promoteBase = z.object({ document_event_id: z.string().min(1) });

router.post(
  '/promote/episodic',
  validate({
    body: promoteBase.extend({
      type: z.string().optional(),
      session_id: z.string().optional(),
      source: z.string().optional(),
      writer_identity: writerEnum.default('LOGOS'),
    }),
  }),
  async (req, res) => {
    const { document_event_id, type, session_id, source, writer_identity } = req.body;
    const docEvent = db.prepare('SELECT * FROM document_events WHERE id = ?').get(document_event_id) as any;
    if (!docEvent) return res.status(404).json({ error: 'not_found' });
    const content = `Document ${docEvent.event_type}: ${docEvent.path} (v${docEvent.version})`;
    const metadata = {
      document_id: docEvent.document_id,
      path: docEvent.path,
      version: docEvent.version,
      hash: docEvent.hash,
      original_writer: docEvent.writer_identity,
      metadata: docEvent.metadata ? JSON.parse(docEvent.metadata) : {},
    };
    const id = await writeEpisodic({
      type: type || 'document_event',
      content,
      metadata,
      timestamp: docEvent.timestamp,
      session_id,
      source: source || 'document_promotion',
      writer_identity,
    });
    return res.status(201).json({ id, status: 'promoted', episodic_id: id });
  }
);

router.post(
  '/promote/semantic',
  validate({
    body: promoteBase.extend({
      fact: z.string().optional(),
      category: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
      source: z.string().optional(),
      writer_identity: writerEnum.default('LOGOS'),
    }),
  }),
  async (req, res) => {
    const { document_event_id, fact, category, confidence, source, writer_identity } = req.body;
    const docEvent = db.prepare('SELECT * FROM document_events WHERE id = ?').get(document_event_id) as any;
    if (!docEvent) return res.status(404).json({ error: 'not_found' });
    const factContent = fact || `Document ${docEvent.event_type}: ${docEvent.path}`;
    const id = await writeSemantic({
      fact: factContent,
      category: category || 'document',
      confidence: confidence ?? 0.8,
      source: source || 'document_promotion',
      writer_identity,
    });
    return res.status(201).json({ id, status: 'promoted', semantic_id: id });
  }
);

router.post(
  '/promote/procedural',
  validate({
    body: promoteBase.extend({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      steps: z.string().min(1),
      triggers: z.string().optional(),
      writer_identity: writerEnum.default('LOGOS'),
    }),
  }),
  async (req, res) => {
    const { document_event_id, name, description, steps, triggers, writer_identity } = req.body;
    const docEvent = db.prepare('SELECT * FROM document_events WHERE id = ?').get(document_event_id) as any;
    if (!docEvent) return res.status(404).json({ error: 'not_found' });
    const id = await writeProcedural({
      name,
      description: description || `Extracted from document event: ${docEvent.path}`,
      steps,
      triggers: triggers || docEvent.event_type,
      writer_identity,
    });
    return res.status(201).json({ id, status: 'promoted', procedural_id: id });
  }
);

export default router;
