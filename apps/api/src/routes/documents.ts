import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import {
  db,
  getDocumentEvents,
  resolveSafePath,
  writeDocument,
  WriterIdentity,
} from '../db';
import { reconcile } from '../services/reconcile';
import { registerLogosWrite } from '../services/watcher';
import { computeContentHash } from '../db';
import { config } from '../config';
import { validate } from '../middleware/validate';

const writerEnum = z.enum(['USER', 'LOGOS', 'AGENT', 'AUTOMATION']);

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const eventsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const idParam = z.object({ id: z.string().min(1) });

const writeBody = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(10 * 1024 * 1024),
  expectedVersion: z.number().int().min(0),
  expectedHash: z.string().min(1),
  writer: writerEnum.default('LOGOS'),
});

const updateBody = z.object({
  content: z.string().max(10 * 1024 * 1024),
  expectedVersion: z.number().int().min(0),
  expectedHash: z.string().min(1),
  writer: writerEnum.default('LOGOS'),
});

const reconcileBody = z.object({ path: z.string().optional() });

const router = Router();

router.get(
  '/api/documents',
  validate({ query: listQuery }),
  (req, res) => {
    const { limit, offset } = req.query as unknown as z.infer<typeof listQuery>;
    const docs = db.prepare('SELECT * FROM documents ORDER BY updated_at DESC LIMIT ? OFFSET ?').all(limit, offset);
    const total = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
    res.json({ documents: docs, total: total.count, limit, offset });
  }
);

router.get(
  '/api/documents/:id/events',
  validate({ params: idParam, query: eventsQuery }),
  (req, res) => {
    const { id } = req.params;
    const { limit } = req.query as unknown as z.infer<typeof eventsQuery>;
    const events = getDocumentEvents(id, limit);
    res.json({ events, count: events.length });
  }
);

router.get(
  '/api/documents/:id',
  validate({ params: idParam }),
  (req, res) => {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'not_found' });
    }
    const events = getDocumentEvents(req.params.id, 10);
    return res.json({ ...(doc as object), recentEvents: events });
  }
);

router.post(
  '/api/documents',
  validate({ body: writeBody }),
  (req, res) => {
    const { path: docPath, content, writer, expectedVersion, expectedHash } =
      req.body as z.infer<typeof writeBody>;

    const result = writeDocument({
      path: docPath,
      content,
      writer: writer as WriterIdentity,
      expectedVersion,
      expectedHash,
    });

    if (result.conflict) {
      return res.status(409).json({
        error: 'conflict',
        conflict: result.conflict,
        currentDocument: result.document,
      });
    }

    registerLogosWrite(docPath, computeContentHash(content));
    return res.status(201).json({ id: result.document.id, status: 'created', document: result.document });
  }
);

router.put(
  '/api/documents/:id',
  validate({ params: idParam, body: updateBody }),
  (req, res) => {
    const { content, writer, expectedVersion, expectedHash } = req.body as z.infer<typeof updateBody>;

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
    if (!doc) {
      return res.status(404).json({ error: 'not_found' });
    }

    const result = writeDocument({
      path: doc.path,
      content,
      writer: writer as WriterIdentity,
      expectedVersion,
      expectedHash,
    });

    if (result.conflict) {
      return res.status(409).json({
        error: 'conflict',
        conflict: result.conflict,
        currentDocument: result.document,
      });
    }

    registerLogosWrite(doc.path, computeContentHash(content));
    return res.json({ id: result.document.id, status: 'updated', document: result.document });
  }
);

router.delete(
  '/api/documents/:id',
  validate({ params: idParam }),
  async (req, res) => {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
    if (!doc) {
      return res.status(404).json({ error: 'not_found' });
    }

    const safePath = resolveSafePath(config.vaultPath, doc.path);
    if (fs.existsSync(safePath)) {
      await fs.promises.unlink(safePath);
    }
    return res.json({ status: 'deleted' });
  }
);

router.post(
  '/api/vault/reconcile',
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
        conflicts: result.conflicts,
        conflictDetails: result.conflictDetails,
        skipped: result.skipped,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// Legacy sync endpoint — same handler
router.post('/api/vault/sync', validate({ body: reconcileBody }), async (req, res, next) => {
  try {
    const { path: syncPath } = req.body as z.infer<typeof reconcileBody>;
    const result = await reconcile(syncPath);
    return res.json({
      status: 'reconciled',
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
      conflicts: result.conflicts,
      conflictDetails: result.conflictDetails,
      skipped: result.skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
