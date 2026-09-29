import http from 'http';
import chokidar from 'chokidar';
import fs from 'fs';
import { SafeFilesystemAdapter } from '@logos/core/src/filesystem';
import { Stats } from 'fs';
import { initializeSchema, close as closeDb } from './db';
import { writeEpisodic, searchAllMemory } from './memory';

const port = parseInt(process.env.PORT || '3001', 10);
const vaultPath = process.env.VAULT_PATH || '../../storage/workspace/vault';

// Initialize database
initializeSchema();

// Ensure vault directory exists
if (!fs.existsSync(vaultPath)) {
  fs.mkdirSync(vaultPath, { recursive: true });
}

// Set up file watcher for the vault
const watcher = chokidar.watch(vaultPath, {
  ignored: /(^|[\\/\\\\])\\../, // ignore dotfiles
  persistent: true
});

const sseClients = new Set<{id: string; res: http.ServerResponse}>();

// SSE handler function
function sseHandler(req: http.IncomingMessage, res: http.ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send a comment to prevent proxies from buffering
  res.write(': welcome\n\n');
  
  const clientId = Date.now() + '-' + Math.random();
  sseClients.add({ id: clientId, res } as { id: string; res: http.ServerResponse });
  
  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete({ id: clientId, res });
    res.end();
  });
}

// Track file states for conflict detection
const fileStates = new Map(); // path -> { mtime, size, contentHash, lastEventTime }

// Function to compute content hash for conflict detection
function computeContentHash(content: string): number {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & 0xFFFFFFFF;
  }
  return (hash >>> 0);
}

// Function to detect conflicts
function detectConflict(relativePath: string, eventType: string, stats: Stats | null, contentHash: number): boolean {
  const existingState = fileStates.get(relativePath);
  if (!existingState) return false;

  const now = Date.now();
  const timeSinceLastEvent = now - existingState.lastEventTime;

  // If file was modified very recently (within 1 second) and size/hash differs
  if (timeSinceLastEvent < 1000) {
    if (eventType === 'change' && stats && contentHash !== existingState.contentHash) {
      return true; // Concurrent modification detected
    }
  }
  return false;
}

// Function to broadcast an event to all SSE clients
function broadcastEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client: { id: string; res: http.ServerResponse }) => {
    try {
      client.res.write(payload);
    } catch (err: any) {
      // Client likely disconnected
      sseClients.delete(client);
    }
  });
}

// Function to update file state tracking
function updateFileState(relativePath: string, eventType: string, stats: Stats | null, contentHash: number) {
  const now = Date.now();
  
  if (eventType === 'unlink' || eventType === 'unlinkDir') {
    fileStates.delete(relativePath);
    return;
  }

  if (stats) {
    fileStates.set(relativePath, {
      mtime: stats.mtimeMs,
      size: stats.size,
      contentHash: contentHash,
      lastEventTime: now
    });
  }
}

// Watch for changes in the vault
watcher.on('all', async (event, path) => {
  console.log(`Vault file ${event}: ${path}`);
  // Get relative path from vault root
  const relativePath = path.replace(vaultPath + '/', '').replace(/\\/g, '/');

  let stats = null;
  let content = null;
  let contentHash = 0;

  // For change events, read the file content for conflict detection and broadcasting
  if (event === 'change' || event === 'add') {
    try {
      const fullPath = path;
      const fileStats = await fs.promises.stat(fullPath);
      content = await fs.promises.readFile(fullPath, 'utf8');
      stats = fileStats;
      contentHash = computeContentHash(content);
      
      // Also store in episodic memory
      await writeEpisodic({
        type: 'file-' + event,
        content: `File ${event}: ${relativePath}\n\n${content}`,
        metadata: { path: relativePath, event },
        timestamp: Date.now(),
        source: 'vault-watcher'
      });
    } catch (err: any) {
      // File might have been deleted already
      console.log(`Could not read file ${path}:`, err.message);
    }
  }

  // Check for conflicts
  const conflict = detectConflict(relativePath, event, stats, contentHash);

  // Update file state
  updateFileState(relativePath, event, stats, contentHash);

  // Broadcast file change event
  broadcastEvent('file-change', {
    event,
    path: relativePath,
    timestamp: new Date().toISOString(),
    conflict,
    ...(content !== null ? { content } : {})
  });
});

// Simple router for REST endpoints
async function handleRestRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
  const url = req.url || '';
  const method = req.method || 'GET';
  
  // Parse path and query
  const [pathname, queryString] = url.split('?');
  const query: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [k, v] = pair.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }

  // Memory API routes
  if (pathname.startsWith('/api/memory')) {
    const subPath = pathname.replace('/api/memory', '') || '/';
    
    // Search all memory
    if (subPath === '/search' && method === 'GET') {
      const q = query.q;
      const limit = parseInt(query.limit || '10');
      if (!q) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'q parameter required' }));
        return true;
      }
      try {
        const results = await searchAllMemory(q, limit);
        const total = results.episodic.length + results.semantic.length + results.procedural.length;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...results, total }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'logos-api',
        version: '0.2.0'
      }));
      return;
    }

    if (req.url === '/api/version') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        version: '0.2.0',
        name: 'logos',
        activePhase: 'P0.2'
      }));
      return;
    }

  // Manual sync trigger endpoint
  if (req.url === '/api/vault/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let syncPath = vaultPath;
      try {
        const parsed = JSON.parse(body);
        if (parsed.path) syncPath = parsed.path;
      } catch (e) { /* use default */ }

      // Broadcast a sync-triggered event to all SSE clients
      broadcastEvent('sync-trigger', {
        path: syncPath,
        timestamp: new Date().toISOString(),
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'synced', path: syncPath, timestamp: new Date().toISOString() }));
    });
    return;
  }

  // SSE endpoint for vault sync events
  if (req.url === '/events/vault' && req.method === 'GET') {
    sseHandler(req, res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  closeDb();
  process.exit(0);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`LOGOS API server running on http://localhost:${port}`);
  console.log(`Vault SSE endpoint: http://localhost:${port}/events/vault`);
  console.log(`Watching vault directory: ${vaultPath}`);
});

export default server;