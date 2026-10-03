import { Router, Request } from 'express';
import { z } from 'zod';
import fs from 'fs';
import {
  db,
  getDocumentEvents,
  resolveSafePath,
  WriterIdentity,
  computeContentHash,
  getActiveDocumentByPath,
  getDocumentIdentity,
} from '../db';
import { reconcile } from '../services/reconcile';
import { config } from '../config';
import { validate } from '../middleware/validate';
import { apiKeyAuth } from '../auth';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getActiveDocument,
  ConflictDetails,
  listActiveDocuments,
} from '../services/documentService';

// Writer removed from public API - server determines from context (HTTP -> USER)
const createBody = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(10 * 1024 * 1024),
});

const updateBody = z.object({
  content: z.string().max(10 * 1024 * 1024),
  expectedVersion: z.number().int().min(1),
  expectedHash: z.string().min(1),
});

const deleteQuery = z.object({
  expectedVersion: z.coerce.number().int().min(1),
  expectedHash: z.string().min(1),
});

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const eventsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const idParam = z.object({ id: z.string().uuid() });

const reconcileBody = z.object({ path: z.string().optional() });

const router = Router();

router.get(
  '/',
  validate({ query: listQuery }),
  (req, res) => {
    const { limit, offset } = req.query as unknown as z.infer<typeof listQuery>;
    // Only return active (non-deleted) documents
    const docs = listActiveDocuments(limit, offset);
    const total = db.prepare('SELECT COUNT(*) as count FROM documents WHERE deleted_at IS NULL').get() as { count: number };
    res.json({ documents: docs, total: total.count, limit, offset });
  }
);

router.get(
  '/:id/events',
  validate({ params: idParam, query: eventsQuery }),
  (req, res) => {
    const { id } = req.params;
    const { limit } = req.query as unknown as z.infer<typeof eventsQuery>;
    const events = getDocumentEvents(id, limit);
    res.json({ events, count: events.length });
  }
);

router.get(
  '/:id',
  validate({ params: idParam }),
  (req, res) => {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Fetch document content from filesystem
    let content = '';
    try {
      const safePath = resolveSafePath(config.vaultPath, (doc as any).path);
      if (fs.existsSync(safePath)) {
        content = fs.readFileSync(safePath, 'utf8');
      }
    } catch (err) {
      console.warn('[API] Could not read document content:', err);
    }

    const events = getDocumentEvents(req.params.id, 10);
    return res.json({ ...(doc as object), content, recentEvents: events });
  }
);

router.post(
  '/',
  validate({ body: createBody }),
  (req, res) => {
    const { path: docPath, content } =
      req.body as z.infer<typeof createBody>;

    try {
      const result = createDocument({
        path: docPath,
        content,
        writer: 'USER',
      });

      return res.status(201).json({ id: result.document.id, status: 'created', document: result.document });
    } catch (err: any) {
      if (err.conflict) {
        return res.status(409).json({
          error: 'conflict',
          conflict: err.conflict,
        });
      }
      throw err;
    }
  }
);

router.put(
  '/:id',
  validate({ params: idParam, body: updateBody }),
  (req, res) => {
    const { content, expectedVersion, expectedHash } = req.body as z.infer<typeof updateBody>;

    const doc = getActiveDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'not_found' });
    }

    try {
      const result = updateDocument({
        id: req.params.id,
        content,
        writer: 'USER',
        expectedVersion,
        expectedHash,
      });

      return res.json({ id: result.document.id, status: 'updated', document: result.document });
    } catch (err: any) {
      if (err.conflict) {
        return res.status(409).json({
          error: 'conflict',
          conflict: err.conflict,
        });
      }
      throw err;
    }
  }
);

router.delete(
  '/:id',
  validate({ params: idParam, query: deleteQuery }),
  async (req, res) => {
    const doc = getActiveDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'not_found' });
    }

    const { expectedVersion, expectedHash } = req.query as unknown as z.infer<typeof deleteQuery>;

    try {
      const result = deleteDocument({
        id: req.params.id,
        expectedVersion,
        expectedHash,
      });

      return res.json({ status: 'deleted', document: result.document });
    } catch (err: any) {
      if (err.conflict) {
        return res.status(409).json({
          error: 'conflict',
          conflict: err.conflict,
        });
      }
      throw err;
    }
  }
);

router.post(
  '/vault/reconcile',
  apiKeyAuth(['vault:reconcile']),
  validate({ body: reconcileBody }),
  async (req, res, next) => {
    try {
      const { path: syncPath } = req.body as z.infer<typeof reconcileBody>;
      const result = await reconcile(syncPath);
      return res.json({
        status: 'reconciled',
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        renamed: result.renamed,
        conflicts: result.conflicts,
        conflictDetails: result.conflictDetails,
        skipped: result.skipped,
        scanQuality: result.scanQuality,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
      return;
    }
  }
);

// Legacy sync endpoint — same handler
router.post('/vault/sync', apiKeyAuth(['vault:reconcile']), validate({ body: reconcileBody }), async (req, res, next) => {
  try {
    const { path: syncPath } = req.body as z.infer<typeof reconcileBody>;
    const result = await reconcile(syncPath);
    return res.json({
      status: 'reconciled',
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
      renamed: result.renamed,
      conflicts: result.conflicts,
      conflictDetails: result.conflictDetails,
      skipped: result.skipped,
      scanQuality: result.scanQuality,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
    return;
  }
});

export default router;
