import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveSafePath } from '../src/fs/safePath';

let root: string;

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-safepath-'));
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('resolveSafePath', () => {
  it('accepts a normal relative markdown path', () => {
    const p = resolveSafePath(root, 'projects/a.md');
    expect(p.startsWith(fs.realpathSync(root))).toBe(true);
  });

  it('rejects ../ traversal', () => {
    expect(() => resolveSafePath(root, '../secret.md')).toThrow(/traversal|outside/i);
  });

  it('rejects ..\\ windows traversal', () => {
    expect(() => resolveSafePath(root, '..\\secret.md')).toThrow(/traversal|outside/i);
  });

  it('rejects windows absolute path', () => {
    expect(() => resolveSafePath(root, 'C:\\secret.md')).toThrow();
  });

  it('rejects UNC path', () => {
    expect(() => resolveSafePath(root, '\\\\server\\share\\secret.md')).toThrow();
  });

  it('rejects posix absolute path', () => {
    expect(() => resolveSafePath(root, '/etc/passwd')).toThrow();
  });

  it('blocks symlink escape', () => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-outside-'));
    const link = path.join(root, 'link');
    let linked = false;
    try {
      fs.symlinkSync(outside, link, 'dir');
      linked = true;
    } catch {
      try {
        fs.symlinkSync(outside, link, 'junction'); // Windows: junction needs no admin
        linked = true;
      } catch {
        linked = false;
      }
    }
    try {
      if (linked) {
        expect(() => resolveSafePath(root, 'link/evil.md')).toThrow(/[Ss]ymlink|outside/);
      } else {
        // Platform cannot create links without privilege; verify containment logic directly
        expect(() => resolveSafePath(root, '../evil.md')).toThrow();
      }
    } finally {
      if (linked) fs.rmSync(link, { force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  it('does not create parent dir when containment fails', () => {
    const target = path.join(path.dirname(root), 'should-not-exist-dir');
    try {
      resolveSafePath(root, '../should-not-exist-dir/x.md');
    } catch {
      // expected
    }
    expect(fs.existsSync(target)).toBe(false);
  });
});
