import fs from 'fs';
import { Stats } from 'fs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const IGNORE_PATTERNS = [
  /\.bak$/,
  /\.tmp$/,
  /\.log$/,
  /~$/,
  /\.db(-wal|-shm)?$/,
  /node_modules/,
];

const ALLOWED_EXTENSIONS = ['.md', '.markdown'];

/**
 * Shared eligibility rules for watcher and reconcile.
 * A file is eligible if:
 * - Has .md or .markdown extension
 * - Is not in node_modules
 * - Does not match ignore patterns (.bak, .tmp, .log, ~, .db*)
 * - Is not larger than 10MB
 * - Can be read (read errors do not become deletions)
 */
export function isEligiblePath(relativePath: string, stats?: Stats): boolean {
  // Check extension
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => relativePath.endsWith(ext));
  if (!hasValidExtension) return false;

  // Check ignore patterns
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(relativePath)) return false;
  }

  // Check file size if stats provided
  if (stats && stats.size > MAX_FILE_SIZE) return false;

  return true;
}

export const ELIGIBILITY_IGNORE_PATTERNS = IGNORE_PATTERNS;
export const ELIGIBILITY_MAX_FILE_SIZE = MAX_FILE_SIZE;
export const ELIGIBILITY_ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;