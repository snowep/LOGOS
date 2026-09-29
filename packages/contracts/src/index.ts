/**
 * LOGOS Contracts Package
 * Shared type definitions and interfaces for the LOGOS system
 */

export interface VaultFile {
  path: string;
  content: string;
  mtime: number;
  size: number;
  hash: string;
}

export interface VaultEvent {
  event: 'add' | 'change' | 'unlink' | 'unlinkDir';
  path: string;
  timestamp: string;
  conflict?: boolean;
  content?: string;
}

export interface SyncState {
  status: 'connected' | 'disconnected' | 'connecting' | 'syncing';
  lastSync: string;
  pendingChanges: number;
  conflicts: number;
}

export interface ApiVersion {
  version: string;
  name: string;
  activePhase: string;
}

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  version: string;
}