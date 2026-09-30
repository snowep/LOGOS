import http from 'http';
import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Stats } from 'fs';
import { initializeSchema, close as closeDb, db } from './db';
import {
  computeContentHash,
  generateDocumentId,
  getOrCreateDocumentIdentity,
  getDocumentByPath,
  recordDocumentEvent,
  getDocumentEvents,
  WriterIdentity,
  resolveSafePath
} from './db';
import {
  writeEpisodic, searchEpisodic, getEpisodicById, getRecentEpisodic,
  writeSemantic, searchSemantic, getSemanticById, updateSemanticAccess,
  writeProcedural, searchProcedural, recordProceduralUse,
  writeWorking, getWorking, getAllWorking, updateWorking, deleteWorking, clearExpiredWorking, clearSessionWorking,
  searchAllMemory
} from './memory';
import { config } from './config';

import { execSync } from 'child_process';
const port = parseInt(process.env.PORT || '3001', 10);
const vaultPath = process.env.VAULT_PATH || path.resolve(__dirname, '../../../storage/workspace/vault');

// Initialize database
initializeSchema();
// Simple in-memory log buffer for system logs
const logBuffer: Array<{ timestamp: number; level: string; args: string[] }> = [];
const MAX_LOG_ENTRIES = 1000;

// Override console.log to capture logs
const originalLog = console.log;
console.log = function (...args) {
  const entry = { timestamp: Date.now(), level: 'log', args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalLog.apply(console, args);
};
// Override console.error
const originalError = console.error;
console.error = function (...args) {
  const entry = { timestamp: Date.now(), level: 'error', args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalError.apply(console, args);
};
// Override console.warn
const originalWarn = console.warn;
console.warn = function (...args) {
  const entry = { timestamp: Date.now(), level: 'warn', args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalWarn.apply(console, args);
};
// Override console.info
const originalInfo = console.info;
console.info = function (...args) {
  const entry = { timestamp: Date.now(), level: 'info', args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)) };
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  originalInfo.apply(console, args);
};


// Ensure vault directory exists
if (!fs.existsSync(vaultPath)) {
  fs.mkdirSync(vaultPath, { recursive: true });
}

// Track LOGOS-initiated writes to prevent self-write loops
const logosWrites = new Map<string, { path: string; timestamp: number; contentHash: string }>();

// SSE client management using Map (not Set) for proper lifecycle
const sseClients = new Map<string, { res: http.ServerResponse; connectedAt: number }>();

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

  const clientId = crypto.randomUUID();
  sseClients.set(clientId, { res, connectedAt: Date.now() });

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      // Client disconnected
      clearInterval(heartbeat);
      sseClients.delete(clientId);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
    res.end();
  });
}

// Function to broadcast an event to all SSE clients
function broadcastEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client, clientId) => {
    try {
      client.res.write(payload);
    } catch (err: any) {
      // Client likely disconnected
      sseClients.delete(clientId);
    }
  });
}

// Register a LOGOS-initiated write to prevent self-detection loops
function registerLogosWrite(relativePath: string, contentHash: string): void {
  logosWrites.set(relativePath, {
    path: relativePath,
    timestamp: Date.now(),
    contentHash
  });
  
  // Auto-cleanup after 5 seconds
  setTimeout(() => {
    const entry = logosWrites.get(relativePath);
    if (entry && entry.contentHash === contentHash) {
      logosWrites.delete(relativePath);
    }
  }, 5000);
}

// Helper function to scan directory for markdown files
function scanMarkdownFiles(dir: string, basePath: string): string[] {
  const markdownFiles: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      markdownFiles.push(...scanMarkdownFiles(fullPath, basePath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
      markdownFiles.push(path.relative(basePath, fullPath).replace(/\\/g, '/'));
    }
  }
  return markdownFiles;
}

// Check if a file change was caused by LOGOS itself
function isLogosWrite(relativePath: string, contentHash: string): boolean {
  const entry = logosWrites.get(relativePath);
  if (!entry) return false;
  
  // Consider it a LOGOS write if the hash matches and it was recent
  const timeSinceWrite = Date.now() - entry.timestamp;
  return entry.contentHash === contentHash && timeSinceWrite < 5000;
}

// Determine writer identity from the event
function determineWriter(event: string, relativePath: string, contentHash: string): WriterIdentity {
  // If it's a LOGOS write, mark as LOGOS
  if (isLogosWrite(relativePath, contentHash)) {
    return 'LOGOS';
  }
  
  // For now, default to USER for external changes
  // In future, AGENT/AUTOMATION could be determined from context
  return 'USER';
}

// Watch for changes in the vault - restricted to Markdown files with size limits
const watcher = chokidar.watch(vaultPath, {
  ignored: (p) => {
    const normalized = p.replace(/\\/g, '/');
    // Ignore dotfiles, node_modules, temp files, backup files, log files
    if (/(^|[\\/\\\\])\..*/.test(normalized)) return true;
    if (/node_modules/.test(normalized)) return true;
    if (/\.tmp$/.test(normalized)) return true;
    if (/~$/.test(normalized)) return true;
    if (/\.log$/.test(normalized)) return true;
    // Ignore non-markdown files
    if (!normalized.endsWith('.md') && !normalized.endsWith('.markdown')) {
      // But still watch directories
      try {
        return !fs.statSync(p).isDirectory();
      } catch {
        return true;
      }
    }
    return false;
  },
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 50,
    pollInterval: 100
  }
});

// Watch for changes in the vault
watcher.on('all', async (event, fullPath) => {
  try {
    // Get relative path from vault root
    const relativePath = path.relative(vaultPath, fullPath).replace(/\\/g, '/');
    
    // Skip if not a markdown file
    if (!relativePath.endsWith('.md') && !relativePath.endsWith('.markdown')) {
      return;
    }
    
    // Skip if path is empty (root directory events)
    if (!relativePath || relativePath === '.') {
      return;
    }

    let stats: Stats | null = null;
    let content: string | null = null;
    let contentHash = '';
    
    // For change/add events, read the file content
    if (event === 'change' || event === 'add') {
      try {
        const fileStats = await fs.promises.stat(fullPath);
        
        // Enforce file size safeguard (10MB max)
        if (fileStats.size > 10 * 1024 * 1024) {
          console.log(`Skipping large file: ${relativePath} (${fileStats.size} bytes)`);
          return;
        }
        
        content = await fs.promises.readFile(fullPath, 'utf8');
        stats = fileStats;
        contentHash = computeContentHash(content);
      } catch (err: any) {
        // File might have been deleted already
        console.log(`Could not read file ${relativePath}:`, err.message);
        return;
      }
    } else if (event === 'unlink') {
      // For deletions, we still need the hash from our records
      const doc = getDocumentByPath(relativePath);
      if (doc) {
        contentHash = doc.current_hash;
      }
    }
    
    // Determine writer identity
    const writer = determineWriter(event, relativePath, contentHash);
    
    // Handle document identity
    let documentId: string;
    let version = 1;
    let isNewDocument = false;
    
    if (event === 'unlink') {
      // For deletions, get existing document
      const doc = getDocumentByPath(relativePath);
      if (doc) {
        documentId = doc.id;
        version = doc.version;
      } else {
        documentId = generateDocumentId(relativePath);
      }
    } else if (content) {
      // For add/change, get or create document identity
      const doc = getOrCreateDocumentIdentity(relativePath, content, writer);
      documentId = doc.id;
      version = doc.version;
      isNewDocument = doc.version === 1;
    } else {
      return; // No content, can't proceed
    }
    
    // Determine event type
    let eventType: 'created' | 'modified' | 'deleted' | 'renamed' | 'moved';
    switch (event) {
      case 'add':
        eventType = isNewDocument ? 'created' : 'modified';
        break;
      case 'change':
        eventType = 'modified';
        break;
      case 'unlink':
        eventType = 'deleted';
        break;
      default:
        // chokidar doesn't emit rename/move directly, would need additional logic
        eventType = 'modified';
    }
    
    // Record document event
    if (event !== 'unlink' || getDocumentByPath(relativePath)) {
      recordDocumentEvent(
        documentId,
        eventType,
        relativePath,
        version,
        contentHash,
        writer,
        undefined, // previousPath - would need rename detection
        { size: stats?.size }
      );
    }
    
    // Broadcast lightweight file change event (no full content)
    broadcastEvent('file-change', {
      event: eventType,
      documentId,
      path: relativePath,
      version,
      hash: contentHash,
      writer,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`Vault ${eventType}: ${relativePath} (v${version}, ${writer})`);
    
  } catch (err: any) {
    console.error(`Watcher error for ${fullPath}:`, err.message);
  }
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

  // Document API routes
    if (pathname.startsWith('/api/documents')) {
      const subPath = pathname.replace('/api/documents', '') || '/';
      console.log(`[API] ${method} ${pathname} -> subPath: "${subPath}"`);

      // List documents
      if (subPath === '/' && method === 'GET') {
        const limit = parseInt(query.limit || '50');
        const offset = parseInt(query.offset || '0');
        const docs = db.prepare('SELECT * FROM documents ORDER BY updated_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        const total = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ documents: docs, total: total.count, limit, offset }));
        return true;
      }

      // Get document events (MUST come before generic document by ID)
      if (subPath.startsWith('/') && subPath.endsWith('/events') && method === 'GET') {
        const docId = subPath.replace('/events', '').replace('/', '');
        const limit = parseInt(query.limit || '50');
        const events = getDocumentEvents(docId, limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ events, count: events.length }));
        return true;
      }

      // Get document by ID
      if (subPath.startsWith('/') && subPath !== '/' && method === 'GET') {
        const docId = subPath.replace('/', '');
        const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
        if (!doc) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
          return true;
        }
        const events = getDocumentEvents(docId, 10);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...doc, recentEvents: events }));
        return true;
      }

    // Create/Update document (LOGOS write)
    if ((subPath === '/' || subPath.startsWith('/')) && (method === 'POST' || method === 'PUT')) {
      try {
        const body = await parseBody();
        const { path: docPath, content, writer = 'LOGOS' } = body;
        
        if (!docPath || content === undefined) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'path and content are required' }));
          return true;
        }
        
        // Validate writer identity
        if (!['USER', 'LOGOS', 'AGENT', 'AUTOMATION'].includes(writer)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid writer identity' }));
          return true;
        }
        
        // Write file to vault
        const safePath = resolveSafePath(vaultPath, docPath);
        await fs.promises.writeFile(safePath, content, 'utf8');
        
        // Register as LOGOS write to prevent self-detection
        const contentHash = computeContentHash(content);
        registerLogosWrite(docPath, contentHash);
        
        // Document identity will be updated by watcher
        // But we can also update it directly here for immediate consistency
        const doc = getOrCreateDocumentIdentity(docPath, content, writer as WriterIdentity);
        
        res.writeHead(method === 'POST' ? 201 : 200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: doc.id, status: method === 'POST' ? 'created' : 'updated', document: doc }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }

    // Delete document
    if (subPath.startsWith('/') && subPath !== '/' && method === 'DELETE') {
      try {
        const docId = subPath.replace('/', '');
        const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId) as any;
        
        if (!doc) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
          return true;
        }
        
        // Delete file from vault
        const safePath = resolveSafePath(vaultPath, doc.path);
        if (fs.existsSync(safePath)) {
          await fs.promises.unlink(safePath);
        }
        
        // Document event will be recorded by watcher
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'deleted' }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return true;
    }
  }

  // Real manual reconciliation endpoint
    if (pathname === '/api/vault/reconcile' && method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}');
          const syncPath = parsed.path ? resolveSafePath(vaultPath, parsed.path) : vaultPath;
        
          // Scan intended vault Markdown files using the helper function
          const markdownFiles = scanMarkdownFiles(syncPath, vaultPath);

          // Compare filesystem state to indexed state
          let created = 0;
          let updated = 0;
          let deleted = 0;
          const conflicts = 0;

            // Track which documents we've seen
            const seenPaths = new Set<string>();
        
        // Check each file on disk
        for (const relPath of markdownFiles) {
          seenPaths.add(relPath);
          const fullPath = path.join(vaultPath, relPath);
          const content = await fs.promises.readFile(fullPath, 'utf8');
          const contentHash = computeContentHash(content);
          const fileStats = await fs.promises.stat(fullPath);
          
          const existingDoc = getDocumentByPath(relPath);
          
          if (!existingDoc) {
            // New file
            const doc = getOrCreateDocumentIdentity(relPath, content, 'USER');
            recordDocumentEvent(doc.id, 'created', relPath, 1, contentHash, 'USER', undefined, { size: fileStats.size });
            created++;
          } else if (existingDoc.current_hash !== contentHash) {
            // Modified file - check for conflict
            const currentVersion = existingDoc.version;
            const doc = getOrCreateDocumentIdentity(relPath, content, 'USER');
            
            // Real conflict: if we have a pending write based on old version
            // For now, just record as modified
            recordDocumentEvent(doc.id, 'modified', relPath, doc.version, contentHash, 'USER', undefined, { size: fileStats.size });
            updated++;
          }
        }
        
        // Check for deleted files (in DB but not on disk)
        const allDocs = db.prepare('SELECT * FROM documents').all() as any[];
        for (const doc of allDocs) {
          if (!seenPaths.has(doc.path)) {
            recordDocumentEvent(doc.id, 'deleted', doc.path, doc.version, doc.current_hash, 'USER');
            db.prepare('DELETE FROM documents WHERE id = ?').run(doc.id);
            deleted++;
          }
        }
        
        // Broadcast reconciliation result
        broadcastEvent('reconcile-complete', {
          path: syncPath,
          created,
          updated,
          deleted,
          conflicts,
          timestamp: new Date().toISOString(),
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'reconciled',
          created,
          updated,
          deleted,
          conflicts,
          timestamp: new Date().toISOString()
        }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // Legacy sync endpoint - redirect to reconcile
  if (pathname === '/api/vault/sync' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      // Forward to reconcile
      req.url = '/api/vault/reconcile';
      handleRestRequest(req, res);
    });
    return true;
  }

  // Memory API routes (existing)
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
        const { type, content, metadata, timestamp, session_id, source, writer_identity = 'LOGOS' } = body;
        if (!type || !content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'type and content are required' }));
          return true;
        }
        const id = await writeEpisodic({ type, content, metadata, timestamp: timestamp || Date.now(), session_id, source, writer_identity });
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
        const { fact, category, confidence, source, writer_identity = 'LOGOS' } = body;
        if (!fact) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'fact is required' }));
          return true;
        }
        const id = await writeSemantic({ fact, category, confidence, source, writer_identity });
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
        const { name, description, steps, triggers, writer_identity = 'LOGOS' } = body;
        if (!name || !steps) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'name and steps are required' }));
          return true;
        }
        const id = await writeProcedural({ name, description, steps, triggers, writer_identity });
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

        // ===== MEMORY PROMOTION API (Explicit promotion from document events) =====
            if (subPath.startsWith('/promote')) {
              const promoteSubPath = subPath.replace('/promote', '') || '/';
              console.log(`[API] ${method} ${pathname} -> promoteSubPath: "${promoteSubPath}"`);

              // List document events available for promotion
              if (promoteSubPath === '/events' && method === 'GET') {
                try {
                  const limit = parseInt(query.limit || '50');
                  const offset = parseInt(query.offset || '0');
                  const events = db.prepare('SELECT * FROM document_events ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset);
                  const total = db.prepare('SELECT COUNT(*) as count FROM document_events').get() as { count: number };
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ events, total: total.count, limit, offset }));
                } catch (err: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
                return true;
              }

              // Promote document event to episodic memory
              if (promoteSubPath === '/episodic' && method === 'POST') {
                try {
                  const body = await parseBody();
                  const { document_event_id, type, session_id, source, writer_identity = 'LOGOS' } = body;
                  if (!document_event_id) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'document_event_id is required' }));
                    return true;
                  }
                  // Fetch the document event
                  const docEvent = db.prepare('SELECT * FROM document_events WHERE id = ?').get(document_event_id) as any;
                  if (!docEvent) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Document event not found' }));
                    return true;
                  }
                  // Create episodic memory from the document event
                  const content = `Document ${docEvent.event_type}: ${docEvent.path} (v${docEvent.version})`;
                  const metadata = { document_id: docEvent.document_id, path: docEvent.path, version: docEvent.version, hash: docEvent.hash, original_writer: docEvent.writer_identity, metadata: docEvent.metadata ? JSON.parse(docEvent.metadata) : {} };
                  const id = await writeEpisodic({ type: type || 'document_event', content, metadata, timestamp: docEvent.timestamp, session_id, source: source || 'document_promotion', writer_identity });
                  res.writeHead(201, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ id, status: 'promoted', episodic_id: id }));
                } catch (err: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
                return true;
              }

              // Promote document event to semantic memory (extract facts/knowledge)
              if (promoteSubPath === '/semantic' && method === 'POST') {
                try {
                  const body = await parseBody();
                  const { document_event_id, fact, category, confidence, source, writer_identity = 'LOGOS' } = body;
                  if (!document_event_id) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'document_event_id is required' }));
                    return true;
                  }
                  const docEvent = db.prepare('SELECT * FROM document_events WHERE id = ?').get(document_event_id) as any;
                  if (!docEvent) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Document event not found' }));
                    return true;
                  }
                  // Use provided fact or generate from event
                  const factContent = fact || `Document ${docEvent.event_type}: ${docEvent.path}`;
                  const id = await writeSemantic({ fact: factContent, category: category || 'document', confidence: confidence ?? 0.8, source: source || 'document_promotion', writer_identity });
                  res.writeHead(201, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ id, status: 'promoted', semantic_id: id }));
                } catch (err: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
                return true;
              }

              // Promote document event to procedural memory (extract skill/workflow)
              if (promoteSubPath === '/procedural' && method === 'POST') {
                try {
                  const body = await parseBody();
                  const { document_event_id, name, description, steps, triggers, writer_identity = 'LOGOS' } = body;
                  if (!document_event_id) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'document_event_id is required' }));
                    return true;
                  }
                  if (!name || !steps) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'name and steps are required' }));
                    return true;
                  }
                  const docEvent = db.prepare('SELECT * FROM document_events WHERE id = ?').get(document_event_id) as any;
                  if (!docEvent) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Document event not found' }));
                    return true;
                  }
                  const id = await writeProcedural({ name, description: description || `Extracted from document event: ${docEvent.path}`, steps, triggers: triggers || docEvent.event_type, writer_identity });
                  res.writeHead(201, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ id, status: 'promoted', procedural_id: id }));
                } catch (err: any) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: err.message }));
                }
                return true;
              }
            }
          }

  // System metrics endpoint
  if (pathname === '/api/system' && method === 'GET') {
    try {
      const health = { status: 'ok', timestamp: new Date().toISOString(), service: config.name, version: config.version };
      
      // Storage stats
      const dbPath = config.dbPath;
      const dbStat = fs.statSync(dbPath);
      const pageCountRow = db.prepare('PRAGMA page_count').get();
      const cacheSizeRow = db.prepare('PRAGMA cache_size').get();
      const docCountRow = db.prepare('SELECT COUNT(*) as count FROM documents').get();
      const storage = {
        databaseSize: dbStat.size,
        pageCount: pageCountRow.page_count,
        cacheSize: cacheSizeRow.cache_size,
        documentCount: docCountRow.count
      };
      
      // Retrieval stats
      const retrieval = {
        vecAvailable: false, // sqlite-vec not available on Windows via npm
        embeddingModel: null // not configured
      };
      
      // Events stats
      const sseClientsCount = sseClients.size;
      const eventCountRow = db.prepare('SELECT COUNT(*) as count FROM document_events').get();
      const events = {
        sseClients: sseClientsCount,
        recentEventsCount: eventCountRow.count
      };
      
      // Runtime stats
      const runtime = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
      
      // Logs
      const recentLogs = logBuffer.slice(-50).map(entry => ({
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.args.join(' ')
      }));
      const logs = { recent: recentLogs };
      
      // Configuration
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
        activePhase: config.activePhase
      };
      
      // Developer info
      let gitBranch = null;
      try {
        gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', cwd: path.resolve(__dirname, '../../../..') }).trim();
      } catch (e) {
        gitBranch = null;
      }
      const developer = {
        activePhase: config.activePhase,
        gitBranch: gitBranch
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        health,
        storage,
        retrieval,
        events,
        runtime,
        logs,
        configuration,
        developer
      }));
} catch (err: any) {
      console.error('Error fetching system metrics:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
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
      version: '0.3.0'
    }));
    return;
  }

  if (req.url === '/api/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: '0.3.0',
      name: 'logos',
      activePhase: 'P0.3'
    }));
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
  console.log(`Vault reconcile endpoint: http://localhost:${port}/api/vault/reconcile`);
  console.log(`Watching vault directory: ${vaultPath}`);
});

export default server;