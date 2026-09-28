'use client';

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Sync,
  SmartToy,
  AutoAwesome,
  FolderOpen
} from '@mui/icons-material';

const phases = [
  { id: 'P0.1', name: 'Constitution + Skeleton', status: 'completed', progress: 100 },
  { id: 'P0.2', name: 'Web + API (Health & Live Dashboard)', status: 'in_progress', progress: 80 },
  { id: 'P0.3', name: 'Prisma + SQLite + Filesystem', status: 'pending', progress: 0 },
  { id: 'P0.4', name: 'Bidirectional Sync (Chokidar + SSE)', status: 'pending', progress: 0 },
  { id: 'P0.5', name: 'Domain Models', status: 'pending', progress: 0 },
  { id: 'P0.6', name: 'Context Engine', status: 'pending', progress: 0 },
  { id: 'P0.7', name: 'Memory Lifecycle', status: 'pending', progress: 0 },
  { id: 'P0.8', name: 'Model Provider Interface', status: 'pending', progress: 0 },
  { id: 'P0.9', name: 'Proposal + Approval Workflow', status: 'pending', progress: 0 },
  { id: 'P0.10', name: 'Execution + Verification', status: 'pending', progress: 0 },
];

export default function Home() {
  const currentPhase = phases.find(p => p.status === 'in_progress') || phases[0];
  const completedCount = phases.filter(p => p.status === 'completed').length;
  const totalProgress = Math.round((completedCount / phases.length) * 100);

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto', fontFamily: 'sans-serif' }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        LOGOS — Personal AI Assistant
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your digital world as naturally as a highly capable personal assistant.
      </Typography>

      {/* Live Roadmap & Progress Bar */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">
            Current Active Phase: <strong>{currentPhase.id} — {currentPhase.name}</strong>
          </Typography>
          <Chip
            label={`${totalProgress}% Completed`}
            color="primary"
            variant="outlined"
          />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={totalProgress}
          sx={{ height: 12, borderRadius: 6, mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          Overall Roadmap Progress: {completedCount} of {phases.length} Phases Done
        </Typography>
      </Paper>

      {/* Quick Status Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Sync color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Vault Sync</Typography>
              </Stack>
              <Typography variant="h6">Active (SSE)</Typography>
              <Typography variant="caption" color="text.secondary">D:\Project\LOGOS\vault</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <SmartToy color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Subagents Team</Typography>
              </Stack>
              <Typography variant="h6">5 Active Agents</Typography>
              <Typography variant="caption" color="text.secondary">Git, Dev, Vault, QA, PM</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <FolderOpen color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Kanban Board</Typography>
              </Stack>
              <Typography variant="h6">GitHub Projects</Typography>
              <Typography variant="caption" color="text.secondary">v2 Sync Enabled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <AutoAwesome color="primary" />
                <Typography variant="subtitle2" color="text.secondary">Model</Typography>
              </Stack>
              <Typography variant="h6">Nemotron Adapter</Typography>
              <Typography variant="caption" color="text.secondary">Ready</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Phase List */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Live Implementation Roadmap
      </Typography>
      <Grid container spacing={2}>
        {phases.map((phase) => (
          <Grid item xs={12} sm={6} md={4} key={phase.id}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: phase.status === 'in_progress' ? 'primary.main' : undefined,
                bgcolor: phase.status === 'in_progress' ? '#e3f2fd' : undefined
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {phase.id}: {phase.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status: {phase.status}
                </Typography>
              </Box>
              {phase.status === 'completed' && <CheckCircle color="success" />}
              {phase.status === 'in_progress' && <Schedule color="primary" />}
              {phase.status === 'pending' && <Chip label="Pending" size="small" />}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}