import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import crypto from 'crypto';

export interface ApiKeyData {
  id: string;
  name: string;
  permissions: string[];
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export function generateApiKey(): string {
  return 'logos_' + crypto.randomBytes(32).toString('hex');
}

export function createApiKey(name: string, permissions: string[], expiresInDays?: number): { key: string; keyHash: string; id: string } {
  const key = generateApiKey();
  const keyHash = hashApiKey(key);
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const expiresAt = expiresInDays ? createdAt + expiresInDays * 24 * 60 * 60 * 1000 : null;

  db.prepare(`
    INSERT INTO api_keys (id, key_hash, name, permissions, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, keyHash, name, JSON.stringify(permissions), createdAt, expiresAt);

  return { key, keyHash, id };
}

export function validateApiKey(key: string): ApiKeyData | null {
  const keyHash = hashApiKey(key);
  const row = db.prepare('SELECT id, name, permissions, expires_at, revoked FROM api_keys WHERE key_hash = ?').get(keyHash) as
    | { id: string; name: string; permissions: string; expires_at: number | null; revoked: number }
    | undefined;

  if (!row || row.revoked === 1) return null;
  if (row.expires_at && row.expires_at < Date.now()) return null;

  return {
    id: row.id,
    name: row.name,
    permissions: JSON.parse(row.permissions),
  };
}

export function updateApiKeyLastUsed(key: string): void {
  const keyHash = hashApiKey(key);
  db.prepare('UPDATE api_keys SET last_used = ? WHERE key_hash = ?').run(Date.now(), keyHash);
}

export function revokeApiKey(key: string): boolean {
  const keyHash = hashApiKey(key);
  const result = db.prepare('UPDATE api_keys SET revoked = 1 WHERE key_hash = ?').run(keyHash);
  return result.changes > 0;
}

export function listApiKeys(): Array<{ id: string; name: string; permissions: string[]; created_at: number; expires_at: number | null; last_used: number | null; revoked: boolean }> {
  const rows = db.prepare('SELECT * FROM api_keys ORDER BY created_at DESC').all() as Array<{
    id: string; name: string; permissions: string; created_at: number; expires_at: number | null; last_used: number | null; revoked: number
  }>;
  return rows.map(r => ({
    ...r,
    permissions: JSON.parse(r.permissions),
    revoked: r.revoked === 1,
  }));
}

// Express middleware
export function apiKeyAuth(requiredPermissions?: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const key = authHeader.slice(7);
    const keyData = validateApiKey(key);

    if (!keyData) {
      res.status(401).json({ error: 'Invalid or expired API key' });
      return;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some(p => keyData.permissions.includes(p));
      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
    }

    (req as any).apiKey = keyData;
    updateApiKeyLastUsed(key);
    next();
  };
}

export function optionalApiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7);
    const keyData = validateApiKey(key);
    if (keyData) {
      (req as any).apiKey = keyData;
      updateApiKeyLastUsed(key);
    }
  }
  next();
}