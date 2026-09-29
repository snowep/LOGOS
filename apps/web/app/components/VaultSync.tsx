"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  Sync,
  SyncDisabled,
  FolderOpen,
  Edit,
  Delete,
  Refresh,
  Error as ErrorIcon,
  CheckCircle,
  Warning,
  AddCircle,
} from "@mui/icons-material";

interface FileChangeEvent {
  event: "add" | "change" | "unlink";
  path: string;
  timestamp: string;
  conflict: boolean;
  content?: string;
}

interface VaultSyncProps {
  sseUrl?: string;
  vaultPath?: string;
}

export default function VaultSync({ sseUrl = "http://localhost:3001/events/vault", vaultPath = "D:\\Project\\LOGOS\\storage\\workspace\\vault" }: VaultSyncProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [events, setEvents] = useState<FileChangeEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<FileChangeEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflictCount, setConflictCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxEvents = 50;

  const getEventIcon = useCallback((eventType: string) => {
    switch (eventType) {
      case "add": return <AddCircle color="success" fontSize="small" />;
      case "change": return <Edit color="primary" fontSize="small" />;
      case "unlink": return <Delete color="error" fontSize="small" />;
      default: return <FolderOpen fontSize="small" />;
    }
  }, []);

  const getEventColor = useCallback((eventType: string) => {
    switch (eventType) {
      case "add": return "success";
      case "change": return "primary";
      case "unlink": return "error";
      default: return "default";
    }
  }, []);

  const formatTimestamp = useCallback((ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString() + "." + String(date.getMilliseconds()).padStart(3, "0");
  }, []);

  const handleFileChange = useCallback((data: FileChangeEvent) => {
    setLastEvent(data);
    setEvents(prev => [data, ...prev.slice(0, maxEvents - 1)]);
    if (data.conflict) {
      setConflictCount(c => c + 1);
    }
  }, []);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus("connecting");
    setError(null);

    try {
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionStatus("connected");
        setError(null);
      };

      // Listen for file-change events specifically (custom SSE event)
      es.addEventListener("file-change", (e: MessageEvent) => {
        try {
          const data: FileChangeEvent = JSON.parse(e.data);
          handleFileChange(data);
        } catch (err) {
          console.error("Failed to parse SSE file-change:", err);
        }
      });

      // Also handle generic messages for heartbeat/comments
      es.onmessage = () => {
        // Heartbeat/comment messages — ignore
      };

      es.onerror = () => {
        console.error("SSE error");
        setConnectionStatus("error");
        setError("Connection lost. Attempting to reconnect...");
        es.close();

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (err) {
      setConnectionStatus("error");
      setError("Failed to establish SSE connection");
    }
  }, [sseUrl, handleFileChange]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setConnectionStatus("disconnected");
  }, []);

  const triggerManualSync = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/vault/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: vaultPath }),
      });
      if (!response.ok) {
        throw new Error(`Sync returned ${response.status}`);
      }
      setError(null);
    } catch (err) {
      setError("Manual sync failed: " + (err as Error).message);
    }
  };

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const statusColor = connectionStatus === "connected" ? "success" :
                      connectionStatus === "connecting" ? "warning" :
                      connectionStatus === "error" ? "error" : "default";

  const statusLabel = connectionStatus === "connected" ? "Connected" :
                      connectionStatus === "connecting" ? "Connecting..." :
                      connectionStatus === "error" ? "Error" : "Disconnected";

  return (
    <Paper sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Stack sx={{ flexDirection: "row", alignItems: "center" }} spacing={1}>
          <FolderOpen color="primary" />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>Vault Sync</Typography>
          <Chip
            label={statusLabel}
            color={statusColor}
            variant="outlined"
            size="small"
            icon={
              connectionStatus === "connected" ? <CheckCircle fontSize="small" /> :
              connectionStatus === "connecting" ? <Sync fontSize="small" /> :
              <ErrorIcon fontSize="small" />
            }
          />
          {connectionStatus === "connecting" && <LinearProgress sx={{ width: 20, height: 4, ml: 1 }} />}
        </Stack>
        <Stack sx={{ flexDirection: "row", alignItems: "center" }} spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={triggerManualSync}
            disabled={connectionStatus !== "connected"}
          >
            Sync Now
          </Button>
          <Tooltip title={connectionStatus === "connected" ? "Disconnect" : "Reconnect"}>
            <IconButton onClick={connectionStatus === "connected" ? disconnect : connect} size="small">
              {connectionStatus === "connected" ? <SyncDisabled /> : <Sync />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Vault Path */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontFamily: "monospace" }}>
        {vaultPath}
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Conflict indicator */}
      {conflictCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }} icon={<Warning />}>
          {conflictCount} conflict{conflictCount > 1 ? "s" : ""} detected
        </Alert>
      )}

      {/* Last Event */}
      {lastEvent && (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: "#f5f5f5" }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Last Event
            </Typography>
            <Stack sx={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }} spacing={1}>
              <Chip
                label={lastEvent.event}
                color={getEventColor(lastEvent.event)}
                size="small"
                icon={getEventIcon(lastEvent.event)}
              />
              <Typography variant="body2" sx={{ fontFamily: "monospace", flex: 1, minWidth: 150 }}>
                {lastEvent.path}
              </Typography>
              {lastEvent.conflict && (
                <Chip label="CONFLICT" color="error" size="small" icon={<Warning />} />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(lastEvent.timestamp)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Event History */}
      <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Event History ({events.length})
        </Typography>
        {conflictCount > 0 && (
          <Typography variant="caption" color="error">
            {conflictCount} conflict{conflictCount > 1 ? "s" : ""}
          </Typography>
        )}
      </Stack>
      <Divider sx={{ mb: 1 }} />

      <Box sx={{ flex: 1, overflow: "auto", maxHeight: 350 }}>
        {events.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            {connectionStatus === "connected"
              ? "Waiting for file changes..."
              : "Connect to start receiving events"}
          </Box>
        ) : (
          <List dense disablePadding>
            {events.map((event, index) => (
              <ListItem key={index} sx={{ px: 1, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getEventIcon(event.event)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack sx={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }} spacing={1}>
                      <Chip
                        label={event.event}
                        color={getEventColor(event.event)}
                        size="small"
                        variant="outlined"
                      />
                      <Typography variant="body2" sx={{ fontFamily: "monospace", flex: 1, minWidth: 150 }}>
                        {event.path}
                      </Typography>
                      {event.conflict && (
                        <Chip label="CONFLICT" color="error" size="small" variant="outlined" />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(event.timestamp)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}