import { Router, Request, Response } from 'express';
import { createApiKey, validateApiKey, listApiKeys, revokeApiKey, apiKeyAuth } from '../auth';

const router = Router();

// Admin routes - require admin permission
router.post('/keys', apiKeyAuth(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, permissions = ['read'], expires_in_days } = req.body;
    if (!name) { res.status(400).json({ error: 'name is required' }); return; }
    const result = createApiKey(name, permissions, expires_in_days);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/keys', apiKeyAuth(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const keys = listApiKeys();
    res.json({ keys, count: keys.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/keys/:key', apiKeyAuth(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const success = revokeApiKey(req.params.key);
    if (!success) { res.status(404).json({ error: 'Key not found' }); return; }
    res.json({ status: 'revoked' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Validate current key (for testing)
router.get('/keys/validate', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ valid: false, error: 'No key provided' });
    return;
  }
  const key = authHeader.slice(7);
  const keyData = validateApiKey(key);
  if (!keyData) {
    res.status(401).json({ valid: false, error: 'Invalid key' });
    return;
  }
  res.json({ valid: true, ...keyData });
});

export default router;