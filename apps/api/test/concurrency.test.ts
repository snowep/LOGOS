import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

// Point LOGOS_HOME at a fresh temp dir BEFORE importing db (db path resolved at import time)
let tmpHome: string;
let db: typeof import('../src/db');
let writeDocument: typeof import('../src/db').writeDocument;
let computeContentHash: typeof import('../src/db').computeContentHash;

beforeAll(async () => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-db-test-'));
  process.env.LOGOS_HOME = tmpHome;
  const mod = await import('../src/db');
  mod.initializeSchema();
  db = mod;
  writeDocument = mod.writeDocument;
  computeContentHash = mod.computeContentHash;
});

afterAll(() => {
  try { db.close(); } catch { /* ignore */ }
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

describe('writeDocument optimistic concurrency', () => {
  it('creates a new document at version 1', () => {
    const r = writeDocument({ path: 'a.md', content: '# hello', writer: 'USER' });
    expect(r.conflict).toBeUndefined();
    expect(r.document.version).toBe(1);
    expect(r.document.current_hash).toBe(computeContentHash('# hello'));
  });

  it('update with matching expectedVersion+expectedHash succeeds and bumps version', () => {
    const created = writeDocument({ path: 'b.md', content: 'v1', writer: 'USER' }).document;
    const r = writeDocument({
      path: 'b.md',
      content: 'v2',
      writer: 'USER',
      expectedVersion: 1,
      expectedHash: created.current_hash,
    });
    expect(r.conflict).toBeUndefined();
    expect(r.document.version).toBe(2);
    expect(r.document.current_hash).toBe(computeContentHash('v2'));
  });

  it('stale expectedVersion -> conflict, state unchanged', () => {
    writeDocument({ path: 'c.md', content: 'v1', writer: 'USER' });
    const current = writeDocument({ path: 'c.md', content: 'v2', writer: 'USER' }).document;
    const r = writeDocument({
      path: 'c.md',
      content: 'EVIL',
      writer: 'USER',
      expectedVersion: 1, // stale; current is 2
      expectedHash: current.current_hash,
    });
    expect(r.conflict).toBeDefined();
    expect(r.conflict!.currentVersion).toBe(2);
    const after = db.getDocumentByPath('c.md')!;
    expect(after.current_hash).toBe(computeContentHash('v2'));
    expect(after.version).toBe(2);
  });

  it('wrong expectedHash -> conflict, state unchanged', () => {
    const current = writeDocument({ path: 'd.md', content: 'v1', writer: 'USER' }).document;
    const r = writeDocument({
      path: 'd.md',
      content: 'EVIL',
      writer: 'USER',
      expectedVersion: 1,
      expectedHash: crypto.createHash('sha256').update('wrong').digest('hex'),
    });
    expect(r.conflict).toBeDefined();
    const after = db.getDocumentByPath('d.md')!;
    expect(after.current_hash).toBe(current.current_hash);
  });
});
