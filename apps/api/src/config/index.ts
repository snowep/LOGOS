import path from 'path';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  vaultPath: process.env.VAULT_PATH || path.resolve(__dirname, '../../../storage/workspace/vault'),
  dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../storage/system/logos.db'),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  sse: {
    heartbeatInterval: parseInt(process.env.SSE_HEARTBEAT_INTERVAL || '30000', 10),
  },
  logosWriteCleanup: parseInt(process.env.LOGOS_WRITE_CLEANUP_MS || '5000', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  version: '0.3.0',
  name: 'logos',
  activePhase: 'P0.3',
} as const;

export type Config = typeof config;