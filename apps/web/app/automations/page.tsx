'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  CircularProgress,
  Switch,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AutoAwesome as AutomationsIcon,
  Schedule as ScheduleIcon,
  PlayCircle as PlayIcon,
  PauseCircle as PauseIcon,
  ErrorOutlined as ErrorIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface Automation {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'error';
  scope: string[];
  actions: string[];
  permissions: string[];
  lastRun: string | null;
  result: string | null;
  failures: Array<{ timestamp: string; message: string }>;
}

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Daily Vault Backup',
    trigger: 'Every day at 2:00 AM',
    status: 'active',
    scope: ['Vault'],
    actions: ['Create encrypted backup', 'Upload to cloud storage'],
    permissions: ['vault.read', 'vault.write'],
    lastRun: '2026-09-29 02:00:00',
    result: 'Success',
    failures: [],
  },
  {
    id: '2',
    name: 'Memory Sync',
    trigger: 'Every hour',
    status: 'paused',
    scope: ['Memory'],
    actions: ['Sync episodic to semantic', 'Prune old working memory'],
    permissions: ['memory.read', 'memory.write'],
    lastRun: '2026-09-29 10:00:00',
    result: 'Success',
    failures: [],
  },
  {
    id: '3',
    name: 'Log Analysis',
    trigger: 'On new log entry',
    status: 'error',
    scope: ['System'],
    actions: ['Analyze logs', 'Generate insights', 'Notify if critical'],
    permissions: ['system.read', 'system.notify'],
    lastRun: '2026-09-29 09:30:00',
    result: 'Failed to connect to log source',
    failures: [
      { timestamp: '2026-09-29 09:30:00', message: 'Connection timeout' },
      { timestamp: '2026-09-29 08:30:00', message: 'Connection timeout' },
    ],
  },
];

export default function AutomationsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTogglePause = async (id: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    // In a real app, we would update the automation status via API
    // For now, we just toggle locally
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleDelete = async (id: string) => {
    // Simulate delete
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    // In a real app, we would remove the automation via API
    // For now, we just close the detail
    setExpandedId(null);
  };

  return (
    <Box sx={{ p: 3, bgColor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" color="text.primary">
          Automations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ height: 40 }}
          startIcon={<AutomationsIcon fontSize="small" />}
        >
          Create Automation
        </Button>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
        <List>
          {mockAutomations.map(automation => (
            <React.Fragment key={automation.id}>
              <ListItem
                component="button"
                onClick={() => setExpandedId(expandedId === automation.id ? null : automation.id)}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  p: 2,
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <ListItemIcon>
                  <ScheduleIcon fontSize="medium" />
                </ListItemIcon>
                <ListItemText
                  primary={automation.name}
                  secondary={automation.trigger}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label={automation.status.toUpperCase()}
                    size="small"
                    color={
                      automation.status === 'active'
                        ? 'success'
                        : automation.status === 'paused'
                          ? 'warning'
                          : 'error'
                    }
                  />
                  {automation.status === 'active' ? (
                    <Tooltip title="Pause">
                      <IconButton
                        size="small"
                        onClick={() => handleTogglePause(automation.id)}
                        disabled={loading}
                        sx={{ p: 1, color: 'action.active' }}
                      >
                        {loading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <PauseIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Resume">
                      <IconButton
                        size="small"
                        onClick={() => handleTogglePause(automation.id)}
                        disabled={loading}
                        sx={{ p: 1, color: 'action.active' }}
                      >
                        {loading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <PlayIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="More actions">
                    <IconButton size="small" sx={{ p: 1, color: 'text.secondary' }}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>

              {expandedId === automation.id && (
                <Box sx={{ p: 2, bgColor: 'action.hover', borderRadius: 1, m: 1 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Scope
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {automation.scope.map(s => (
                          <Chip key={s} label={s} size="small" sx={{ m: 0.5 }} />
                        ))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Actions
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {automation.actions.map(a => (
                          <Chip key={a} label={a} size="small" sx={{ m: 0.5 }} />
                        ))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Permissions
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {automation.permissions.map(p => (
                          <Chip key={p} label={p} size="small" sx={{ m: 0.5 }} />
                        ))}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Run
                      </Typography>
                      <Typography variant="body1" color="text.primary">
                        {automation.lastRun || 'Never'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Result
                    </Typography>
                    <Typography variant="body1" color="text.primary">
                      {automation.result || 'N/A'}
                    </Typography>
                  </Box>

                  {automation.failures.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Recent Failures
                      </Typography>
                      <List>
                        {automation.failures.slice(0, 3).map((failure, index) => (
                          <ListItem key={index} sx={{ py: 1 }}>
                            <ListItemIcon>
                              <ErrorIcon fontSize="small" color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={failure.timestamp}
                              secondary={failure.message}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setExpandedId(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleDelete(automation.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
}