import { Router, Request, Response } from 'express';
import { 
  writeEpisodic, searchEpisodic, getEpisodicById, getRecentEpisodic,
  writeSemantic, searchSemantic, getSemanticById, updateSemanticAccess,
  writeProcedural, searchProcedural, recordProceduralUse,
  writeWorking, getWorking, getAllWorking, updateWorking, deleteWorking, clearExpiredWorking, clearSessionWorking,
  searchAllMemory
} from '../memory';
import { apiKeyAuth, optionalApiKeyAuth } from '../auth';

const router = Router();

// Apply optional auth to all routes
router.use(optionalApiKeyAuth);

// ===== EPISODIC MEMORY =====
router.post('/memory/episodic', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, content, metadata, timestamp, session_id, source } = req.body;
    if (!type || !content) {
      res.status(400).json({ error: 'type and content are required' });
      return;
    }
    const id = await writeEpisodic({ type, content, metadata, timestamp: timestamp || Date.now(), session_id, source });
    res.status(201).json({ id, status: 'created' });
  } catch (err: any) {
    console.error('writeEpisodic error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/memory/episodic/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = '10', threshold = '0.75' } = req.query;
    if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
    const results = await searchEpisodic(q as string, parseInt(limit as string), parseFloat(threshold as string));
    res.json({ results, count: results.length });
  } catch (err: any) {
    console.error('searchEpisodic error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/memory/episodic/recent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = '50' } = req.query;
    const results = getRecentEpisodic(parseInt(limit as string));
    res.json({ results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/memory/episodic/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = getEpisodicById(req.params.id);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===== SEMANTIC MEMORY =====
router.post('/memory/semantic', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fact, category, confidence, source } = req.body;
    if (!fact) { res.status(400).json({ error: 'fact is required' }); return; }
    const id = await writeSemantic({ fact, category, confidence, source });
    res.status(201).json({ id, status: 'created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/memory/semantic/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = '10', threshold = '0.75' } = req.query;
    if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
    const results = await searchSemantic(q as string, parseInt(limit as string), parseFloat(threshold as string));
    res.json({ results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/memory/semantic/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = getSemanticById(req.params.id);
    if (!result) { res.status(404).json({ error: 'Not found' }); return; }
    updateSemanticAccess(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===== PROCEDURAL MEMORY =====
router.post('/memory/procedural', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, steps, triggers } = req.body;
    if (!name || !steps) { res.status(400).json({ error: 'name and steps are required' }); return; }
    const id = await writeProcedural({ name, description, steps, triggers });
    res.status(201).json({ id, status: 'created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/memory/procedural/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = '5', threshold = '0.75' } = req.query;
    if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
    const results = await searchProcedural(q as string, parseInt(limit as string), parseFloat(threshold as string));
    res.json({ results, count: results.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/memory/procedural/:id/use', async (req: Request, res: Response): Promise<void> => {
  try {
    const { success } = req.body;
    recordProceduralUse(req.params.id, success ?? true);
    res.json({ status: 'recorded' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===== WORKING MEMORY =====
router.post('/memory/working', async (req: Request, res: Response): Promise<void> => {
  try {
    const { session_id, key, value, priority, expires_at } = req.body;
    if (!session_id || !key || value === undefined) {
      res.status(400).json({ error: 'session_id, key, and value are required' });
      return;
    }
    const id = writeWorking({ session_id, key, value, priority, expires_at });
    res.status(201).json({ id, status: 'created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/memory/working/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { key } = req.query;
    if (key) {
      const result = getWorking(req.params.sessionId, key as string);
      if (!result) { res.status(404).json({ error: 'Not found' }); return; }
      res.json(result);
    } else {
      const results = getAllWorking(req.params.sessionId);
      res.json({ results, count: results.length });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/memory/working/:sessionId/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    const { value } = req.body;
    if (value === undefined) { res.status(400).json({ error: 'value required' }); return; }
    updateWorking(req.params.sessionId, req.params.key, value);
    res.json({ status: 'updated' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/memory/working/:sessionId/:key', async (req: Request, res: Response): Promise<void> => {
  try {
    deleteWorking(req.params.sessionId, req.params.key);
    res.json({ status: 'deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/memory/working/session/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const count = clearSessionWorking(req.params.sessionId);
    res.json({ status: 'cleared', count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/memory/working/cleanup', async (req: Request, res: Response): Promise<void> => {
  try {
    const count = clearExpiredWorking();
    res.json({ status: 'cleaned', count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ===== UNIFIED SEARCH =====
router.get('/memory/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = '10' } = req.query;
    if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
    const results = await searchAllMemory(q as string, parseInt(limit as string));
    const total = results.episodic.length + results.semantic.length + results.procedural.length;
    res.json({ ...results, total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;