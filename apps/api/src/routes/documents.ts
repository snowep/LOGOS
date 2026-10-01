import { Router, Request } from 'express';
import { z } from 'zod';
import fs from 'fs';
import {
  db,
  getDocumentEvents,
  resolveSafePath,
  WriterIdentity,
  computeContentHash,
  getDocumentByPath,
  getDocumentIdentity,
} from '../db';
import { reconcile } from '../services/reconcile';
import { registerLogosWrite } from '../services/watcher';
import { config } from '../config';
import { validate } from '../middleware/validate';
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getActiveDocument,
  ConflictDetails,
} from '../services/documentService';

// Actor context type for internal service calls
export type ActorContext = 'HTTP' | 'INTERNAL' | 'AGENT' | 'SCHEDULER';

function determineWriterFromContext(context: ActorContext): WriterIdentity {
  switch (context) {
    case 'HTTP':
      return 'USER';
    case 'INTERNAL':
      return 'LOGOS';
    case 'AGENT':
      return 'AGENT';
    case 'SCHEDULER':
      return 'AUTOMATION';
    default:
      return 'USER';
  }
}

// Internal service function that sets actor context
export function writeDocumentInternal(
  path: string,
  content: string,
  expectedVersion: number | undefined,
  expectedHash: string | undefined,
  context: ActorContext = 'INTERNAL'
): ReturnType<typeof updateDocument> {
  const writer = determineWriterFromContext(context);
  return updateDocument({
    id: '', // will be resolved by path
    content,
    expectedVersion: expectedVersion || 0,
    expectedHash: expectedHash || '',
    writer,
  });
}

// Internal service function for document creation
export function createDocumentInternal(
  path: string,
  content: string,
  context: ActorContext = 'INTERNAL'
): ReturnType<typeof createDocument> {
  const writer = determineWriterFromContext(context);
  return createDocument({
    path,
    content,
    writer,
  });
}

const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const eventsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const idParam = z.object({ id: z.string().min(1) });

// Writer removed from public API - server determines from context (HTTP -> USER)
const writeBody = z.object({
  path: z.string().min(1).max(500),
  content: z.string().max(10 * 1024 * 1024),
  expectedVersion: z.number().int().min(0),
  expectedHash: z.string().min(1),
});

const updateBody = z.object({
  content: z.string().max(10 * 1024 * 1024),
  expectedVersion: z.number().int().min(0),
  expectedHash: z.string().min(1),
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
  '/api/documents',
  validate({ body: writeBody }),
  (req, res) => {
    const { path: docPath, content } =
      req.body as z.infer<typeof writeBody>;

    try {
      const result = createDocument({
        path: docPath,
        content,
        writer: determineWriterFromContext('HTTP'),
      });

      registerLogosWrite(docPath, computeContentHash(content));
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
  '/api/documents/:id',
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
        writer: determineWriterFromContext('HTTP'),
        expectedVersion,
        expectedHash,
      });

      registerLogosWrite(doc.path, computeContentHash(content));
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
  '/api/documents/:id',
  validate({ params: idParam }),
  async (req, res) => {
    const doc = getActiveDocument(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'not_found' });
    }

    // For DELETE, we need expectedVersion and expectedHash from query params
    // Since the current schema doesn't include them in body, we'll require them as query params
    const expectedVersion = parseInt(req.query.expectedVersion as string, 10);
    const expectedHash = req.query.expectedHash as string;
    
    if (isNaN(expectedVersion) || !expectedHash) {
      return res.status(400).json({ error: 'expectedVersion and expectedHash query parameters required' });
    }

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
        renamed: result.renamed,
        conflicts: result.conflicts,
        conflictDetails: result.conflictDetails,
        skipped: result.skipped,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
      return;
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
      renamed: result.renamed,
      conflicts: result.conflicts,
      conflictDetails: result.conflictDetails,
      skipped: result.skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
    return;
  }
});

export default router;
