'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type WriterIdentity = 'USER' | 'LOGOS' | 'AGENT' | 'AUTOMATION';
export type FileChangeEvent = 'created' | 'modified' | 'deleted' | 'renamed' | 'moved';
export type VaultEventType = 'file-change' | 'reconcile-complete';
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface FileChangeEventData {
  event: FileChangeEvent;
  documentId: string;
  path: string;
  version: number;
  hash: string;
  writer: WriterIdentity;
  timestamp: string;
  previousPath?: string;
}

export interface ReconcileCompleteEventData {
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

export type VaultEvent = FileChangeEventData | ReconcileCompleteEventData;

export interface UseVaultEventsOptions {
  onFileChange?: (event: FileChangeEventData) => void;
  onReconcileComplete?: (event: ReconcileCompleteEventData) => void;
  onConnectionChange?: (state: ConnectionState) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useVaultEvents(options: UseVaultEventsOptions = {}) {
  const {
    onFileChange,
    onReconcileComplete,
    onConnectionChange,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [lastEvent, setLastEvent] = useState<VaultEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Stable refs for callbacks to prevent EventSource recreation on render
  const onFileChangeRef = useRef(onFileChange);
  const onReconcileCompleteRef = useRef(onReconcileComplete);
  const onConnectionChangeRef = useRef(onConnectionChange);

  onFileChangeRef.current = onFileChange;
  onReconcileCompleteRef.current = onReconcileComplete;
  onConnectionChangeRef.current = onConnectionChange;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    // Prevent duplicate connections
    if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
      return;
    }

    try {
      // SSE endpoint is at /events/vault (proxied from /api/events/vault)
      const eventSource = new EventSource('/events/vault');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionState('connected');
        onConnectionChangeRef.current?.('connected');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.addEventListener('file-change', (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const fileChangeEvent: FileChangeEventData = JSON.parse(event.data);
          setLastEvent(fileChangeEvent);
          setEventCount((prev) => prev + 1);
          onFileChangeRef.current?.(fileChangeEvent);
        } catch (err) {
          console.warn('[useVaultEvents] Failed to parse file-change event:', err);
        }
      });

      eventSource.addEventListener('reconcile-complete', (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const reconcileEvent: ReconcileCompleteEventData = JSON.parse(event.data);
          setLastEvent(reconcileEvent);
          setEventCount((prev) => prev + 1);
          onReconcileCompleteRef.current?.(reconcileEvent);
        } catch (err) {
          console.warn('[useVaultEvents] Failed to parse reconcile-complete event:', err);
        }
      });

      eventSource.onerror = () => {
        if (!isMountedRef.current) return;
        setConnectionState('disconnected');
        onConnectionChangeRef.current?.('disconnected');
        cleanup();

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setConnectionState('connecting');
              onConnectionChangeRef.current?.('connecting');
              connect();
            }
          }, delay);
        } else {
          setConnectionState('error');
          onConnectionChangeRef.current?.('error');
        }
      };
    } catch (err) {
      console.error('[useVaultEvents] Failed to create EventSource:', err);
      setConnectionState('error');
      onConnectionChangeRef.current?.('error');
    }
  }, [cleanup, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  return {
    connectionState,
    lastEvent,
    eventCount,
    reconnect: connect,
    disconnect: cleanup,
  };
}