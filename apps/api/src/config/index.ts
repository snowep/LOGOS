import path from 'path';

function getLogosHome(): string {
  const envHome = process.env.LOGOS_HOME;
  if (envHome) {
    return envHome.startsWith('~') 
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', envHome.slice(1))
      : envHome;
  }
  // Default: ~/.logos
  return path.join(process.env.HOME || process.env.USERPROFILE || '', '.logos');
}

function getWorkspaceRoot(): string {
  const envRoot = process.env.LOGOS_WORKSPACE_ROOT;
  if (envRoot) return envRoot;
  // Default: LOGOS_HOME/workspace/vault
  return path.join(getLogosHome(), 'workspace', 'vault');
}

function getCorsOrigins(): string[] {
  const envOrigin = process.env.CORS_ORIGIN;
  if (envOrigin) {
    // Split comma-separated origins
    return envOrigin.split(',').map(o => o.trim()).filter(o => o.length > 0);
  }
  // Default: restrict to localhost for development
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '127.0.0.1',
  vaultPath: getWorkspaceRoot(),
  dbPath: process.env.DB_PATH || path.join(getLogosHome(), 'system', 'logos.db'),
  cors: {
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'] as string[],
    allowedHeaders: ['Content-Type', 'Authorization'] as string[],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  sse: {
    heartbeatInterval: parseInt(process.env.SSE_HEARTBEAT_INTERVAL || '30000', 10),
  },
  logosWriteCleanup: parseInt(process.env.LOGOS_WRITE_CLEANUP_MS || '5000', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  version: '0.4.2',
  name: 'logos',
  activePhase: 'P0.4.2',
} as const;

export type Config = typeof config;