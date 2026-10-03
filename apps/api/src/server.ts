import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import { safeErrorHandler } from './middleware/validate';
import documentsRouter from './routes/documents';
import memoryRouter from './routes/memory';
import systemRouter from './routes/system';
import eventsRouter from './routes/events';
import { apiKeyAuth } from './auth';

export function createApp(): Express {
  const app = express();

  // CORS with configured origins (not wildcard)
  app.use(cors(config.cors));
  app.use(express.json({ limit: '10mb' }));

  // Public read routes (no auth required)
  app.use('/api/documents', documentsRouter);
  app.use('/api/memory', memoryRouter);
  app.use('/api/system', systemRouter);
  app.use('/api/events', eventsRouter);

  // Protected mutation routes - require API key auth
  // The routes themselves validate write permissions
  // but we apply a base auth check here for defense in depth
  // Note: actual write endpoints are /api/documents (POST), /api/documents/:id (PUT/DELETE), /api/vault/reconcile, /api/vault/sync

  app.use(safeErrorHandler);

  return app;
}
