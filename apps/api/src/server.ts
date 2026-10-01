import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import { safeErrorHandler } from './middleware/validate';
import documentsRouter from './routes/documents';
import memoryRouter from './routes/memory';
import systemRouter from './routes/system';
import eventsRouter from './routes/events';

export function createApp(): Express {
  const app = express();

  app.use(cors(config.cors));
  app.use(express.json({ limit: '10mb' }));

  app.use(documentsRouter);
  app.use(memoryRouter);
  app.use(systemRouter);
  app.use(eventsRouter);

  app.use(safeErrorHandler);

  return app;
}
