import fs from 'fs';
import path from 'path';

export interface StorageAdapter {
  read(relativePath: string): Promise<string>;
  write(relativePath: string, content: string): Promise<void>;
  exists(relativePath: string): Promise<boolean>;
  delete(relativePath: string): Promise<void>;
  list(dirPath?: string): Promise<string[]>;
}

export class SafeFilesystemAdapter implements StorageAdapter {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = path.resolve(rootPath);
    if (!fs.existsSync(this.rootPath)) {
      fs.mkdirSync(this.rootPath, { recursive: true });
    }
  }

  private resolveSafePath(relativePath: string): string {
    const normalized = path.normalize(relativePath);
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      throw new Error(`Path traversal attempt blocked: ${relativePath}`);
    }
    const resolved = path.resolve(this.rootPath, normalized);
    if (!resolved.startsWith(this.rootPath)) {
      throw new Error(`Path outside root blocked: ${relativePath}`);
    }
    return resolved;
  }

  async read(relativePath: string): Promise<string> {
    const safePath = this.resolveSafePath(relativePath);
    return fs.promises.readFile(safePath, 'utf8');
  }

  async write(relativePath: string, content: string): Promise<void> {
    const safePath = this.resolveSafePath(relativePath);
    const dir = path.dirname(safePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    // Atomic write via temp file
    const tempPath = `${safePath}.tmp.${Date.now()}`;
    await fs.promises.writeFile(tempPath, content, 'utf8');
    await fs.promises.rename(tempPath, safePath);
  }

  async exists(relativePath: string): Promise<boolean> {
    const safePath = this.resolveSafePath(relativePath);
    return fs.existsSync(safePath);
  }

  async delete(relativePath: string): Promise<void> {
    const safePath = this.resolveSafePath(relativePath);
    if (fs.existsSync(safePath)) {
      await fs.promises.unlink(safePath);
    }
  }

  async list(dirPath = ''): Promise<string[]> {
    const safeDir = this.resolveSafePath(dirPath);
    if (!fs.existsSync(safeDir)) return [];
    return fs.promises.readdir(safeDir);
  }
}
