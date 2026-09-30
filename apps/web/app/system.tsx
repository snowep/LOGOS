"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Badge,
  Link,
  TextField,
  Button,
} from "@mui/material";
import {
  Memory,
  Storage,
  Analytics,
  Timeline,
  Speed,
  Description,
  Code,
  DeveloperBoard,
} from "@mui/icons-material";

const SystemPage = () => {
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const response = await fetch("/api/system");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSystemData(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch system data:", err);
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    };

    fetchSystemData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", p: 4 }}>
        <Typography variant="h4" align="center" sx={{ my: 4 }}>
          Loading system information...
        </Typography>
        <CircularProgress sx={{ mx: "auto", display: "block" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", p: 4 }}>
        <Typography variant="h5" color="error.secondary" align="center" sx={{ my: 4 }}>
          Error loading system information
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {error}
        </Typography>
        <Button variant="outlined" sx={{ mx: "auto", display: "block", mt: 4 }} onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!systemData) {
    return (
      <Box sx={{ minHeight: "100vh", p: 4 }}>
        <Typography variant="h4" align="center" sx={{ my: 4 }}>
          No system data available
        </Typography>
      </Box>
    );
  }

  const {
    health,
    storage,
    retrieval,
    events,
    runtime,
    logs,
    configuration,
    developer,
  } = systemData;

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3 }, backgroundColor: "#0a0a0a", color: "#fafafa" }}>
      <Box sx={{ px: { xs: 2, sm: 3 }, py: 4, maxWidth: 1400, mx: "auto" }}>
        <Typography variant="h3" sx={{ mb: 4 }}>
          System
        </Typography>

        {/* Health Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Health
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {health.status.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color={health.status === "ok" ? "success.main" : "error.main"}>
                    {health.status}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {health.service}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {health.version}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Timestamp
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                    {new Date(health.timestamp).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Storage Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Storage
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Database Size
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {(storage.databaseSize / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Page Count
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {storage.pageCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Cache Size
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {storage.cacheSize}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Document Count
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {storage.documentCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Retrieval Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Retrieval
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Vector Available
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {retrieval.vecAvailable ? "Yes" : "No"}
                  </Typography>
                  <Typography variant="caption" color={retrieval.vecAvailable ? "success.main" : "error.main"}>
                    {retrieval.vecAvailable ? "Available" : "Not Available"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Embedding Model
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {retrieval.embeddingModel || "Not configured"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Events Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Events
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    SSE Clients
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {events.sseClients}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Recent Events Count
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {events.recentEventsCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Runtime Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Runtime
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Uptime
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {Math.floor(runtime.uptime / 3600)}h {Math.floor((runtime.uptime % 3600) / 60)}m {Math.floor(runtime.uptime % 60)}s
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Memory Usage (RSS)
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {(runtime.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Memory Usage (Heap Total)
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {(runtime.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Memory Usage (Heap Used)
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {(runtime.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Logs Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Logs
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              Recent Logs (last 50 entries)
            </Typography>
            <TextField
              sx={{ width: "100%", height: 200 }}
              multiline
              rows={8}
              placeholder="Logs will appear here..."
              value={logs.recent
                .map(
                  (log) =>
                    `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
                )
                .join("\n")}
            />
          </Box>
        </Paper>

        {/* Configuration Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Configuration
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Port
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {configuration.port}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Vault Path
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                    {configuration.vaultPath}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    DB Path
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                    {configuration.dbPath}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Version
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {configuration.version}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Developer Section */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: "#111111", borderColor: "#27272a" }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Developer
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Active Phase
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {developer.activePhase}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ p: 2, textAlign: "center", backgroundColor: "#111111", borderColor: "#27272a" }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Git Branch
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 1 }}>
                    {developer.gitBranch || "Not available"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default SystemPage;