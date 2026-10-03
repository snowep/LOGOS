import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { db } from '../db';
import { config } from '../config';
import { getSseClientCount } from './events';

// Simple in-memory log buffer
export interface LogEntry {
  timestamp: number;
  level: string;
  args: string[];
}

const logBuffer: LogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;

export function installConsoleCapture(): void {
  const wrap = (level: string, original: (...args: any[]) => void) => {
    return function (...args: any[]) {
      const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        args: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))),
      };
      logBuffer.push(entry);
      if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
      original.apply(console, args);
    };
  };
  console.log = wrap('log', console.log);
  console.error = wrap('error', console.error);
  console.warn = wrap('warn', console.warn);
  console.info = wrap('info', console.info);
}

const router = Router();

router.get('/', (_req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: config.name,
      version: config.version,
    };

    const dbStat = fs.statSync(config.dbPath);
    const pageCountRow = db.prepare('PRAGMA page_count').get();
    const cacheSizeRow = db.prepare('PRAGMA cache_size').get();
    const docCountRow = db.prepare('SELECT COUNT(*) as count FROM documents').get();
    const storage = {
      databaseSize: dbStat.size,
      pageCount: (pageCountRow as any).page_count,
      cacheSize: (cacheSizeRow as any).cache_size,
      documentCount: (docCountRow as any).count,
    };

    const retrieval = {
      vecAvailable: false,
      embeddingModel: 'Xenova/all-MiniLM-L6-v2',
    };

    const eventCountRow = db.prepare('SELECT COUNT(*) as count FROM document_events').get();
    const events = {
      sseClients: getSseClientCount(),
      recentEventsCount: (eventCountRow as any).count,
    };

    const runtime = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    const logs = {
      recent: logBuffer.slice(-50).map(entry => ({
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.args.join(' '),
      })),
    };

    const configuration = {
      port: config.port,
      vaultPath: config.vaultPath,
      dbPath: config.dbPath,
      cors: config.cors,
      rateLimit: config.rateLimit,
      sse: config.sse,
      logosWriteCleanup: config.logosWriteCleanup,
      maxFileSize: config.maxFileSize,
      version: config.version,
      name: config.name,
      activePhase: config.activePhase,
    };

    let gitBranch: string | null = null;
    try {
      gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '../../../..'),
      }).trim();
    } catch {
      gitBranch = null;
    }
    const developer = { activePhase: config.activePhase, gitBranch };

    res.json({ health, storage, retrieval, events, runtime, logs, configuration, developer });
  } catch (err) {
    console.error('Error fetching system metrics:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'logos-api',
    version: config.version,
  });
});

router.get('/version', (_req, res) => {
  res.json({
    version: config.version,
    name: config.name,
    activePhase: config.activePhase,
  });
});

export default router;
