import fs from 'fs';
import path from 'path';
import { resolveSafePath } from '@logos/api/fs/safePath';

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

  async read(relativePath: string): Promise<string> {
    const safePath = resolveSafePath(this.rootPath, relativePath);
    return fs.promises.readFile(safePath, 'utf8');
  }

  async write(relativePath: string, content: string): Promise<void> {
    const safePath = resolveSafePath(this.rootPath, relativePath);
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
    const safePath = resolveSafePath(this.rootPath, relativePath);
    return fs.existsSync(safePath);
  }

  async delete(relativePath: string): Promise<void> {
    const safePath = resolveSafePath(this.rootPath, relativePath);
    if (fs.existsSync(safePath)) {
      await fs.promises.unlink(safePath);
    }
  }

  async list(dirPath = ''): Promise<string[]> {
    const safeDir = resolveSafePath(this.rootPath, dirPath);
    if (!fs.existsSync(safeDir)) return [];
    return fs.promises.readdir(safeDir);
  }
}
