import fs from 'fs';
import path from 'path';

// Path safety utilities (docs/01_ARCHITECTURE_CONSOLIDATION_GATE.md §5)
export function resolveSafePath(rootPath: string, relativePath: string): string {
  // Reject absolute paths on any platform: POSIX (/x), Windows drive (C:\x), UNC (\\server\share)
  if (path.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath) || path.posix.isAbsolute(relativePath)) {
    throw new Error(`Path traversal attempt blocked: ${relativePath}`);
  }

  const normalized = path.normalize(relativePath);
  if (
    normalized === '..' ||
    normalized.startsWith('..' + path.sep) ||
    normalized.startsWith('../') ||
    normalized.startsWith('..\\')
  ) {
    throw new Error(`Path traversal attempt blocked: ${relativePath}`);
  }

  const resolved = path.resolve(rootPath, normalized);

  // path.relative() containment check BEFORE any filesystem mutation
  const rel = path.relative(rootPath, resolved);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
    throw new Error(`Path outside root blocked: ${relativePath}`);
  }

  // Verify real paths: walk up to the nearest existing ancestor so a symlinked
  // parent directory (escape vector) is caught before anything is created.
  const realRoot = fs.realpathSync(rootPath);
  let ancestor = resolved;
  while (!fs.existsSync(ancestor)) {
    const parent = path.dirname(ancestor);
    if (parent === ancestor) break;
    ancestor = parent;
  }
  const realAncestor = fs.realpathSync(ancestor);
  const realRel = path.relative(realRoot, realAncestor);
  if (realRel === '..' || realRel.startsWith('..' + path.sep) || path.isAbsolute(realRel)) {
    throw new Error(`Symlink escape blocked: ${relativePath}`);
  }

  // Containment established — only now ensure the parent directory exists.
  const parentDir = path.dirname(resolved);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  return resolved;
}
