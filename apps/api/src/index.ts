import http from 'http';
import chokidar from 'chokidar';
import fs from 'fs';
import { SafeFilesystemAdapter } from '@logos/core/src/filesystem';
import { Stats } from 'fs';
import { initializeSchema, close as closeDb } from './db';
import { 
  writeEpisodic, searchEpisodic, getEpisodicById, getRecentEpisodic,
  writeSemantic, searchSemantic, getSemanticById, updateSemanticAccess,
  writeProcedural, searchProcedural, recordProceduralUse,
  writeWorking, getWorking, getAllWorking, updateWorking, deleteWorking, clearExpiredWorking, clearSessionWorking,
  searchAllMemory
} from './memory';

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
  console.log(`[handleRestRequest] ${method} ${url}`);
  
  // Parse path and query
  const [pathname, queryString] = url.split('?');
  console.log(`[handleRestRequest] pathname: "${pathname}"`);
  
  const query: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split('&')) {
      const [k, v] = pair.split('=');
      query[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }

  // Helper to parse JSON body
  async function parseBody(): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
      });
    });
  }

  // Memory API routes
  if (pathname.startsWith('/api/memory')) {
    const subPath = pathname.replace('/api/memory', '') || '/';
    console.log(`[API] ${method} ${pathname} -> subPath: "${subPath}"`);
    
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

    // Episodic memory
    if (subPath === '/episodic' && method === 'POST') {
      try {
        const body = await parseBody();
        const { type, content, metadata, timestamp, session_id, source } = body;
        if (!type || !content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'type and content are required' }));
          return true;
        }
        const id = await writeEpisodic({ type, content, metadata, timestamp: timestamp || Date.now(), session_id, source });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, status: 'created' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath === '/episodic/search' && method === 'GET') {
      const q = query.q;
      const limit = parseInt(query.limit || '10');
      const threshold = parseFloat(query.threshold || '0.75');
      console.log(`[API] Episodic search: q=${q}, limit=${limit}, threshold=${threshold}`);
      if (!q) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'q parameter required' }));
        return true;
      }
      try {
        const results = await searchEpisodic(q, limit, threshold);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results, count: results.length }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath === '/episodic/recent' && method === 'GET') {
      const limit = parseInt(query.limit || '50');
      try {
        const results = getRecentEpisodic(limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results, count: results.length }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath.startsWith('/episodic/') && method === 'GET') {
      const id = subPath.replace('/episodic/', '');
      console.log(`[API] Episodic GET: id=${id}, subPath=${subPath}`);
      try {
        const result = getEpisodicById(id);
        if (!result) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
          return true;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    // Semantic memory
    if (subPath === '/semantic' && method === 'POST') {
      try {
        const body = await parseBody();
        const { fact, category, confidence, source } = body;
        if (!fact) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'fact is required' }));
          return true;
        }
        const id = await writeSemantic({ fact, category, confidence, source });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, status: 'created' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath === '/semantic/search' && method === 'GET') {
      const q = query.q;
      const limit = parseInt(query.limit || '10');
      const threshold = parseFloat(query.threshold || '0.75');
      if (!q) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'q parameter required' }));
        return true;
      }
      try {
        const results = await searchSemantic(q, limit, threshold);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results, count: results.length }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath.startsWith('/semantic/') && method === 'GET') {
      const id = subPath.replace('/semantic/', '');
      try {
        const result = getSemanticById(id);
        if (!result) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
          return true;
        }
        updateSemanticAccess(id);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    // Procedural memory
    if (subPath === '/procedural' && method === 'POST') {
      try {
        const body = await parseBody();
        const { name, description, steps, triggers } = body;
        if (!name || !steps) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'name and steps are required' }));
          return true;
        }
        const id = await writeProcedural({ name, description, steps, triggers });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, status: 'created' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath === '/procedural/search' && method === 'GET') {
      const q = query.q;
      const limit = parseInt(query.limit || '5');
      const threshold = parseFloat(query.threshold || '0.75');
      if (!q) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'q parameter required' }));
        return true;
      }
      try {
        const results = await searchProcedural(q, limit, threshold);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results, count: results.length }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath.startsWith('/procedural/') && subPath.endsWith('/use') && method === 'POST') {
      const id = subPath.replace('/procedural/', '').replace('/use', '');
      try {
        const body = await parseBody();
        recordProceduralUse(id, body.success ?? true);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'recorded' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    // Working memory
    if (subPath === '/working' && method === 'POST') {
      try {
        const body = await parseBody();
        const { session_id, key, value, priority, expires_at } = body;
        if (!session_id || !key || value === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'session_id, key, and value are required' }));
          return true;
        }
        const id = writeWorking({ session_id, key, value, priority, expires_at });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id, status: 'created' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath.startsWith('/working/') && method === 'GET') {
      const parts = subPath.replace('/working/', '').split('/');
      const sessionId = parts[0];
      const key = parts[1];
      console.log(`[API] Working GET: sessionId=${sessionId}, key=${key}, subPath=${subPath}`);
      try {
        if (key) {
          const result = getWorking(sessionId, key);
          if (!result) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
            return true;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          const results = getAllWorking(sessionId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ results, count: results.length }));
        }
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath.startsWith('/working/') && method === 'PUT') {
      const parts = subPath.replace('/working/', '').split('/');
      const sessionId = parts[0];
      const key = parts[1];
      try {
        const body = await parseBody();
        if (body.value === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'value required' }));
          return true;
        }
        updateWorking(sessionId, key, body.value);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'updated' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath.startsWith('/working/') && method === 'DELETE') {
      const parts = subPath.replace('/working/', '').split('/');
      const sessionId = parts[0];
      const key = parts[1];
      try {
        if (key) {
          deleteWorking(sessionId, key);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'deleted' }));
        } else {
          const count = clearSessionWorking(sessionId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'cleared', count }));
        }
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    if (subPath === '/working/cleanup' && method === 'POST') {
      try {
        const count = clearExpiredWorking();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'cleaned', count }));
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
  console.log(`[Server] ${req.method} ${req.url}`);
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Try REST API first
  const handled = await handleRestRequest(req, res);
  if (handled) return;

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