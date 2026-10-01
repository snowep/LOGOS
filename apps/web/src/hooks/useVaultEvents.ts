'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type VaultEventType = 'file-change' | 'sync-complete' | 'conflict' | 'error';
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface VaultEvent {
  event: string;
  documentId: string;
  path: string;
  version: number;
  hash: string;
  writer: 'USER' | 'LOGOS' | 'AGENT' | 'AUTOMATION';
  timestamp: string;
  previousPath?: string;
}

export interface UseVaultEventsOptions {
  onEvent?: (event: VaultEvent) => void;
  onConnectionChange?: (state: ConnectionState) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useVaultEvents(options: UseVaultEventsOptions = {}) {
  const {
    onEvent,
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

    try {
      const eventSource = new EventSource('/api/vault/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionState('connected');
        onConnectionChange?.('connected');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (messageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const event: VaultEvent = JSON.parse(messageEvent.data);
          setLastEvent(event);
          setEventCount((prev) => prev + 1);
          onEvent?.(event);
        } catch (err) {
          console.warn('[useVaultEvents] Failed to parse event:', err);
        }
      };

      eventSource.addEventListener('file-change', (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const vaultEvent: VaultEvent = JSON.parse(event.data);
          setLastEvent(vaultEvent);
          setEventCount((prev) => prev + 1);
          onEvent?.(vaultEvent);
        } catch (err) {
          console.warn('[useVaultEvents] Failed to parse file-change event:', err);
        }
      });

      eventSource.addEventListener('sync-complete', (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const vaultEvent: VaultEvent = JSON.parse(event.data);
          setLastEvent(vaultEvent);
          setEventCount((prev) => prev + 1);
          onEvent?.(vaultEvent);
        } catch (err) {
          console.warn('[useVaultEvents] Failed to parse sync-complete event:', err);
        }
      });

      eventSource.addEventListener('conflict', (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const vaultEvent: VaultEvent = JSON.parse(event.data);
          setLastEvent(vaultEvent);
          setEventCount((prev) => prev + 1);
          onEvent?.(vaultEvent);
        } catch (err) {
          console.warn('[useVaultEvents] Failed to parse conflict event:', err);
        }
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        if (!isMountedRef.current) return;
        try {
          const vaultEvent: VaultEvent = JSON.parse(event.data);
          setLastEvent(vaultEvent);
          setEventCount((prev) => prev + 1);
          onEvent?.(vaultEvent);
        } catch (err) {
          console.warn('[useVaultEvents] Failed to parse error event:', err);
        }
      });

      eventSource.onerror = () => {
        if (!isMountedRef.current) return;
        setConnectionState('disconnected');
        onConnectionChange?.('disconnected');
        cleanup();

        // Attempt reconnection with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setConnectionState('connecting');
              onConnectionChange?.('connecting');
              connect();
            }
          }, delay);
        } else {
          setConnectionState('error');
          onConnectionChange?.('error');
        }
      };
    } catch (err) {
      console.error('[useVaultEvents] Failed to create EventSource:', err);
      setConnectionState('error');
      onConnectionChange?.('error');
    }
  }, [cleanup, onEvent, onConnectionChange, reconnectInterval, maxReconnectAttempts]);

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