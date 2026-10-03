"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Settings as SettingsIcon,
  BugReport as BugReportIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface SystemData {
  health: {
    status: string;
    timestamp: string;
    service: string;
    version: string;
  };
  storage: {
    databaseSize: number;
    pageCount: number;
    cacheSize: number;
    documentCount: number;
  };
  retrieval: {
    vecAvailable: boolean;
    embeddingModel: string;
  };
  events: {
    sseClients: number;
    recentEventsCount: number;
  };
  runtime: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
  logs: {
    recent: Array<{
      timestamp: number;
      level: string;
      message: string;
    }>;
  };
  configuration: {
    port: number;
    vaultPath: string;
    dbPath: string;
    cors: any;
    rateLimit: any;
    sse: any;
    logosWriteCleanup: number;
    maxFileSize: number;
    version: string;
    name: string;
    activePhase: string;
  };
  developer: {
    activePhase: string;
    gitBranch: string | null;
  };
}

function MetricCard({ title, value, icon: Icon, color, trend }: { title: string; value: string; icon: React.ComponentType<any>; color?: string; trend?: string }) {
  return (
    <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ fontSize: 24, color: color || 'primary.main' }} />
            <Typography variant="overline" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
              {title}
            </Typography>
          </Box>
          {trend && <Chip label={trend} size="small" color="success" variant="outlined" />}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function LogTable({ logs }: { logs: SystemData['logs']['recent'] }) {
  return (
    <TableContainer sx={{ maxHeight: 300, overflow: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.slice().reverse().map((log, index) => (
            <TableRow key={index} hover>
              <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </TableCell>
              <TableCell>
                <Chip
                  label={log.level.toUpperCase()}
                  size="small"
                  variant="outlined"
                  color={
                    log.level === 'error' ? 'error' :
                    log.level === 'warn' ? 'warning' :
                    log.level === 'info' ? 'info' : 'default'
                  }
                />
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace', maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.message}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function SystemPage() {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  const fetchSystemData = async () => {
    try {
      const response = await fetch('/api/system');
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();
      setSystemData(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch system data:', error);
      setError('Unable to load system information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100dvh - 56px)', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !systemData) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100dvh - 56px)', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Paper elevation={0} variant="outlined" sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderColor: 'error.main' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error loading system information</AlertTitle>
            {error || 'Unable to connect to API server'}
          </Alert>
          <Button variant="contained" color="primary" onClick={fetchSystemData} startIcon={<RefreshIcon />}>
            Retry
          </Button>
        </Paper>
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

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const healthColor = health.status === 'ok' ? 'success' : 'error';
  const healthIcon = health.status === 'ok' ? CheckCircleIcon : ErrorIcon;

  return (
    <Box sx={{ minHeight: 'calc(100dvh - 56px)', p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
              System
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Health, configuration, and diagnostics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Refresh data">
              <IconButton onClick={fetchSystemData} disabled={loading} aria-label="Refresh">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Chip
              icon={health.status === 'ok' ? <CheckCircleIcon /> : <ErrorIcon />}
              label={health.status.toUpperCase()}
              color={healthColor}
              variant="outlined"
            />
          </Box>
        </Box>

        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 4 }}>
          <Tab label="Overview" />
          <Tab label="Storage" />
          <Tab label="Runtime" />
          <Tab label="Logs" />
          <Tab label="Config" />
        </Tabs>

        {/* Overview Tab */}
        {tabIndex === 0 && (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>Health</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Status"
                value={health.status.toUpperCase()}
                icon={healthIcon}
                color={healthColor}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Service"
                value={health.service}
                icon={SettingsIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Version"
                value={health.version}
                icon={CodeIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Last Check"
                value={new Date(health.timestamp).toLocaleString()}
                icon={SpeedIcon}
              />
            </Grid>

            <Grid size={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Storage</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Database Size"
                value={formatBytes(storage.databaseSize)}
                icon={StorageIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Page Count"
                value={storage.pageCount.toLocaleString()}
                icon={StorageIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Cache Size"
                value={storage.cacheSize.toLocaleString()}
                icon={MemoryIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Documents"
                value={storage.documentCount.toString()}
                icon={StorageIcon}
              />
            </Grid>

            <Grid size={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Retrieval</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MetricCard
                title="Vector Search"
                value={retrieval.vecAvailable ? 'Available' : 'Unavailable'}
                icon={MemoryIcon}
                color={retrieval.vecAvailable ? 'success' : 'warning'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MetricCard
                title="Embedding Model"
                value={retrieval.embeddingModel || 'Not configured'}
                icon={MemoryIcon}
              />
            </Grid>

            <Grid size={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Events</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MetricCard
                title="SSE Clients"
                value={events.sseClients.toString()}
                icon={SpeedIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <MetricCard
                title="Recent Events"
                value={events.recentEventsCount.toString()}
                icon={BugReportIcon}
              />
            </Grid>
          </Grid>
        )}

        {/* Storage Tab */}
        {tabIndex === 1 && (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Database Details</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Database Path</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{configuration.dbPath}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Database Size</TableCell>
                        <TableCell>{formatBytes(storage.databaseSize)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Page Count</TableCell>
                        <TableCell>{storage.pageCount.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Cache Size</TableCell>
                        <TableCell>{storage.cacheSize.toLocaleString()} pages</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Document Count</TableCell>
                        <TableCell>{storage.documentCount.toString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Vault</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Vault Path</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{configuration.vaultPath}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Max File Size</TableCell>
                        <TableCell>{formatBytes(configuration.maxFileSize)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Runtime Tab */}
        {tabIndex === 2 && (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>Process</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Uptime"
                value={formatUptime(runtime.uptime)}
                icon={SpeedIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Memory (RSS)"
                value={formatBytes(runtime.memoryUsage.rss)}
                icon={MemoryIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Heap Total"
                value={formatBytes(runtime.memoryUsage.heapTotal)}
                icon={MemoryIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Heap Used"
                value={formatBytes(runtime.memoryUsage.heapUsed)}
                icon={MemoryIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="External"
                value={formatBytes(runtime.memoryUsage.external)}
                icon={MemoryIcon}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard
                title="Array Buffers"
                value={formatBytes(runtime.memoryUsage.arrayBuffers)}
                icon={MemoryIcon}
              />
            </Grid>
          </Grid>
        )}

        {/* Logs Tab */}
        {tabIndex === 3 && (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>Recent Logs (last 50 entries)</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<RefreshIcon />}
                      onClick={fetchSystemData}
                    >
                      Refresh
                    </Button>
                  </Box>
                  {logs.recent.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No logs available</Typography>
                  ) : (
                    <LogTable logs={logs.recent} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Config Tab */}
        {tabIndex === 4 && (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Server Configuration</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Port</TableCell>
                        <TableCell>{configuration.port}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vault Path</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{configuration.vaultPath}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>DB Path</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{configuration.dbPath}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Version</TableCell>
                        <TableCell>{configuration.version}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>{configuration.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Active Phase</TableCell>
                        <TableCell>{configuration.activePhase}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Rate Limiting</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Window</TableCell>
                        <TableCell>{configuration.rateLimit.windowMs} ms</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Max Requests</TableCell>
                        <TableCell>{configuration.rateLimit.max}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>SSE Configuration</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Heartbeat Interval</TableCell>
                        <TableCell>{configuration.sse.heartbeatInterval} ms</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Developer Info</Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Active Phase</TableCell>
                        <TableCell>{developer.activePhase}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Git Branch</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{developer.gitBranch || 'Not available'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}