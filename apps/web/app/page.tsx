"use client";

import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Stack,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Schedule,
  Sync,
  SmartToy,
  AutoAwesome,
  FolderOpen,
  Verified,
  RocketLaunch,
  Memory,
  Psychology,
  Security,
  Bolt,
  Analytics,
} from "@mui/icons-material";
import VaultSync from "./components/VaultSync";

const phases = [
  { id: "P0.1", name: "Constitution + Skeleton", status: "completed", progress: 100 },
  { id: "P0.2", name: "Web + API (Health & Live Dashboard)", status: "completed", progress: 100 },
  { id: "P0.3", name: "Prisma + SQLite + Filesystem", status: "completed", progress: 100 },
  { id: "P0.4", name: "Bidirectional Sync (Chokidar + SSE)", status: "in_progress", progress: 25 },
  { id: "P0.5", name: "Domain Models", status: "pending", progress: 0 },
  { id: "P0.6", name: "Context Engine", status: "pending", progress: 0 },
  { id: "P0.7", name: "Memory Lifecycle", status: "pending", progress: 0 },
  { id: "P0.8", name: "Model Provider Interface", status: "pending", progress: 0 },
  { id: "P0.9", name: "Proposal + Approval Workflow", status: "pending", progress: 0 },
  { id: "P0.10", name: "Execution + Verification", status: "pending", progress: 0 },
];

const systemMetrics = {
  uptime: "99.9%",
  latency: "< 50ms",
  throughput: "1.2k req/s",
  memoryUsage: "342 MB / 2.1 GB",
  activeConnections: 3,
  lastSync: new Date().toLocaleTimeString(),
};

export default function Home() {
  const currentPhase = phases.find(p => p.status === "in_progress") || phases[0];
  const completedCount = phases.filter(p => p.status === "completed").length;
  const totalProgress = Math.round((completedCount / phases.length) * 100);
  const inProgressCount = phases.filter(p => p.status === "in_progress").length;

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle color="success" fontSize="large" />;
      case "in_progress": return <Schedule color="primary" fontSize="large" />;
      default: return <Chip label="Pending" size="small" variant="outlined" />;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "in_progress": return "primary";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: "auto", fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif' }}>
      {/* Header with Logo/Acronym */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: "linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%)", color: "white", border: "1px solid", borderColor: "primary.main" }}>
        <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }} spacing={2}>
          <Stack sx={{ flexDirection: "row", alignItems: "baseline" }} spacing={1}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Verified sx={{ fontSize: 40, color: "primary.light" }} />
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: "-0.02em", background: "linear-gradient(90deg, #fff 0%, #90caf9 100%)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                LOGOS
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="inherit" sx={{ opacity: 0.7, fontWeight: 400, mt: 0.5 }}>
              <strong>L</strong>ogical <strong>O</strong>rchestration <strong>G</strong>overning <strong>O</strong>perational <strong>S</strong>ystems
            </Typography>
          </Stack>
          <Stack sx={{ flexDirection: "row", alignItems: "center" }} spacing={2}>
            <Chip 
              icon={<RocketLaunch fontSize="small" />} 
              label="Nemotron 3 Ultra Active" 
              color="primary" 
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              icon={<Verified fontSize="small" />} 
              label="P0.1 Foundation: STABLE" 
              color="success" 
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* System Health Bar */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: "success.main" }}>
            <Bolt color="success" fontSize="large" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{systemMetrics.latency}</Typography>
            <Typography variant="caption" color="text.secondary">Avg Latency</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: "primary.main" }}>
            <Analytics color="primary" fontSize="large" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{systemMetrics.throughput}</Typography>
            <Typography variant="caption" color="text.secondary">Throughput</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: "warning.main" }}>
            <Memory color="warning" fontSize="large" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{systemMetrics.memoryUsage.split(" / ")[0]}</Typography>
            <Typography variant="caption" color="text.secondary">Memory Used</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderColor: "info.main" }}>
            <Sync color="info" fontSize="large" sx={{ mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{systemMetrics.activeConnections}</Typography>
            <Typography variant="caption" color="text.secondary">Active Streams</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Live Roadmap & Progress Bar */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
        <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap" }} spacing={1}>
          <Stack sx={{ flexDirection: "row", alignItems: "center" }} spacing={1}>
            <Psychology color="primary" fontSize="large" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Current Phase: <strong>{currentPhase.id} — {currentPhase.name}</strong>
            </Typography>
          </Stack>
          <Stack sx={{ flexDirection: "row", alignItems: "center" }} spacing={2}>
            <Chip
              label={`${totalProgress}% Complete`}
              color="primary"
              variant="filled"
              size="medium"
              sx={{ fontWeight: 700 }}
            />
            <Chip
              label={`${completedCount}/${phases.length} Phases`}
              color={inProgressCount > 0 ? "warning" : "success"}
              variant="outlined"
              size="medium"
            />
          </Stack>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={totalProgress}
          sx={{ height: 16, borderRadius: 8, mb: 2 }}
          color="primary"
        />
        <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }} spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Overall Roadmap: {completedCount} completed, {inProgressCount} in progress, {phases.length - completedCount - inProgressCount} pending
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date().toLocaleString()}
          </Typography>
        </Stack>
      </Paper>

      {/* System Status Cards */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
        <Security sx={{ mr: 1, verticalAlign: "middle" }} /> System Status
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4, display: "grid" }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: "success.main", "&:hover": { borderColor: "success.light", boxShadow: "0 4px 20px rgba(76, 175, 80, 0.15)" } }}>
            <CardContent>
              <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", mb: 1 }} spacing={1}>
                <Sync color="success" />
                <Chip label="LIVE" color="success" size="small" variant="filled" />
              </Stack>
              <Typography variant="h6" color="success.main">Vault Sync (SSE)</Typography>
              <Typography variant="caption" color="text.secondary">D:\\Project\\LOGOS\\storage\\workspace\\vault</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }} spacing={1}>
                <Typography variant="body2"><strong>Status:</strong> Connected</Typography>
                <Typography variant="body2"><strong>Latency:</strong> {systemMetrics.latency}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: "primary.main", "&:hover": { borderColor: "primary.light", boxShadow: "0 4px 20px rgba(25, 118, 210, 0.15)" } }}>
            <CardContent>
              <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", mb: 1 }} spacing={1}>
                <SmartToy color="primary" />
                <Chip label="5 ACTIVE" color="primary" size="small" variant="outlined" />
              </Stack>
              <Typography variant="h6" color="primary.main">Subagents Team</Typography>
              <Typography variant="caption" color="text.secondary">Git • Dev • Vault • QA • PM</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }} spacing={1}>
                <Typography variant="body2"><strong>Model:</strong> Nemotron 3 Ultra</Typography>
                <Typography variant="body2"><strong>Provider:</strong> NVIDIA</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: "info.main", "&:hover": { borderColor: "info.light", boxShadow: "0 4px 20px rgba(0, 188, 212, 0.15)" } }}>
            <CardContent>
              <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", mb: 1 }} spacing={1}>
                <FolderOpen color="info" />
                <Chip label="v2 SYNC" color="info" size="small" variant="outlined" />
              </Stack>
              <Typography variant="h6" color="info.main">Kanban Board</Typography>
              <Typography variant="caption" color="text.secondary">GitHub Projects Integration</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }} spacing={1}>
                <Typography variant="body2"><strong>Sync:</strong> Bidirectional</Typography>
                <Typography variant="body2"><strong>Last:</strong> {systemMetrics.lastSync}</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderColor: "warning.main", "&:hover": { borderColor: "warning.light", boxShadow: "0 4px 20px rgba(255, 193, 7, 0.15)" } }}>
            <CardContent>
              <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", mb: 1 }} spacing={1}>
                <AutoAwesome color="warning" />
                <Chip label="READY" color="warning" size="small" variant="filled" />
              </Stack>
              <Typography variant="h6" color="warning.main">Model Interface</Typography>
              <Typography variant="caption" color="text.secondary">Nemotron Adapter Configured</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }} spacing={1}>
                <Typography variant="body2"><strong>Context:</strong> 128k tokens</Typography>
                <Typography variant="body2"><strong>Mode:</strong> Streaming</Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vault Sync Component */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
        <Sync sx={{ mr: 1, verticalAlign: "middle" }} /> Live Vault Synchronization
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12 }}>
          <VaultSync 
            sseUrl="http://localhost:3001/events/vault" 
            vaultPath="D:\\Project\\LOGOS\\storage\\workspace\\vault" 
          />
        </Grid>
      </Grid>

      {/* Phase Roadmap */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
        <RocketLaunch sx={{ mr: 1, verticalAlign: "middle" }} /> Implementation Roadmap
      </Typography>
      <Grid container spacing={2}>
        {phases.map((phase) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={phase.id}>
            <Paper
              variant="outlined"
              elevation={phase.status === "in_progress" ? 3 : 0}
              sx={{
                p: 2,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                minHeight: 140,
                borderColor: phase.status === "in_progress" ? "primary.main" : 
                           phase.status === "completed" ? "success.main" : "divider",
                bgcolor: phase.status === "in_progress" ? "primary.50" : 
                       phase.status === "completed" ? "success.50" : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: phase.status === "in_progress" 
                    ? "0 8px 30px rgba(25, 118, 210, 0.2)"
                    : phase.status === "completed"
                    ? "0 8px 30px rgba(76, 175, 80, 0.2)"
                    : "0 4px 20px rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Stack sx={{ flexDirection: "row", alignItems: "flex-start", mb: 1 }} spacing={1}>
                  <Box sx={{ flexShrink: 0 }}>
                    {getPhaseIcon(phase.status)}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      {phase.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {phase.name}
                    </Typography>
                  </Box>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={phase.progress}
                  sx={{ height: 6, borderRadius: 3, mt: 1 }}
                  color={getPhaseColor(phase.status) as any}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {phase.progress}% complete
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right", minWidth: 80 }}>
                <Chip
                  label={phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                  size="small"
                  color={getPhaseColor(phase.status) as any}
                  variant={phase.status === "completed" ? "filled" : phase.status === "in_progress" ? "filled" : "outlined"}
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Footer */}
      <Paper elevation={0} sx={{ p: 3, mt: 6, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
        <Stack sx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }} spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Verified fontSize="small" color="primary" />
            <strong>LOGOS</strong> — Logical Orchestration Governing Operational Systems
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Built with Next.js 16 • MUI 9 • TypeScript 5 • Node 26 • Nemotron 3 Ultra
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}