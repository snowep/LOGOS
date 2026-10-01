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

// Canonical event vocabulary (P0.4.2)
export type WriterIdentity = 'USER' | 'LOGOS' | 'AGENT' | 'AUTOMATION';

export type VaultEventType = 
  | 'file-change'
  | 'reconcile-complete';

export type FileChangeEvent = 'created' | 'modified' | 'deleted' | 'renamed' | 'moved';

export interface VaultEvent {
  event: FileChangeEvent;
  documentId: string;
  path: string;
  version: number;
  hash: string;
  writer: WriterIdentity;
  timestamp: string;
  previousPath?: string;
}

export interface ReconcileCompleteEvent {
  event: 'reconcile-complete';
  path: string;
  created: number;
  updated: number;
  deleted: number;
  renamed: number;
  conflicts: number;
  skipped: number;
  scanQuality: 'COMPLETE' | 'PARTIAL' | 'FAILED';
  timestamp: string;
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