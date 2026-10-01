import { Router, Request, Response } from 'express';
import http from 'http';
import crypto from 'crypto';
import { config } from '../config';

export interface SseClient {
  res: http.ServerResponse;
  connectedAt: number;
}

const sseClients = new Map<string, SseClient>();

export function broadcastEvent(eventType: 'file-change' | 'reconcile-complete', data: any): void {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client, clientId) => {
    try {
      client.res.write(payload);
    } catch {
      sseClients.delete(clientId);
    }
  });
}

export function getSseClientCount(): number {
  return sseClients.size;
}

const router = Router();

// SSE endpoint for vault sync events
router.get('/events/vault', (req: Request, res: Response) => {
  // Use configured CORS origins instead of wildcard
  const origin = req.headers.origin;
  const allowedOrigins = config.cors.origin === '*' ? '*' : config.cors.origin;
  const corsOrigin = typeof allowedOrigins === 'string' && allowedOrigins !== '*' ? allowedOrigins : (origin || '*');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': corsOrigin,
  });

  res.write(': welcome\n\n');

  const clientId = crypto.randomUUID();
  sseClients.set(clientId, { res: res as unknown as http.ServerResponse, connectedAt: Date.now() });

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(clientId);
    }
  }, config.sse.heartbeatInterval);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(clientId);
    res.end();
  });
});

export default router;
