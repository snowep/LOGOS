"use client";

import React, { useEffect, useState } from "react";
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
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Avatar,
  Badge,
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
  DarkMode,
  LightMode,
  Speed,
  Monitor,
  ControlPoint,
  Hub,
  Storage,
  Terminal,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import VaultSync from "./components/VaultSync";
import { useTheme, useMediaQuery } from "@mui/material";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

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

const getPhaseIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle color="success" fontSize="medium" />;
    case "in_progress": return <Schedule color="primary" fontSize="medium" />;
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

const metricItems = [
  { key: "latency", label: "Avg Latency", value: systemMetrics.latency, icon: Bolt, trend: "-2%", trendColor: "success" },
  { key: "throughput", label: "Throughput", value: systemMetrics.throughput, icon: Analytics, trend: "+8%", trendColor: "success" },
  { key: "memory", label: "Memory Used", value: systemMetrics.memoryUsage.split(" / ")[0], icon: Memory, trend: "+12MB", trendColor: "warning" },
  { key: "streams", label: "Active Streams", value: systemMetrics.activeConnections, icon: Sync, trend: "+1", trendColor: "info" },
];

const statusItems = [
  {
    id: "vault",
    section: "sync",
    title: "Vault Sync (SSE)",
    path: "D:\\Project\\LOGOS\\storage\\workspace\\vault",
    status: "Connected",
    latency: systemMetrics.latency,
    icon: Sync,
    badge: { label: "LIVE", severity: "success" as const },
  },
  {
    id: "subagents",
    section: "control",
    title: "Subagents Team",
    subtitle: "Git \u2022 Dev \u2022 Vault \u2022 QA \u2022 PM",
    details: [
      { label: "Model", value: "Nemotron 3 Ultra" },
      { label: "Provider", value: "NVIDIA" },
    ],
    icon: SmartToy,
    badge: { label: "5 ACTIVE", severity: "info" as const },
  },
  {
    id: "kanban",
    section: "sync",
    title: "Kanban Board",
    subtitle: "GitHub Projects Integration",
    details: [
      { label: "Sync", value: "Bidirectional" },
      { label: "Last", value: systemMetrics.lastSync },
    ],
    icon: FolderOpen,
    badge: { label: "v2 SYNC", severity: "info" as const },
  },
  {
    id: "model",
    section: "control",
    title: "Model Interface",
    subtitle: "Nemotron Adapter Configured",
    details: [
      { label: "Context", value: "128k tokens" },
      { label: "Mode", value: "Streaming" },
    ],
    icon: AutoAwesome,
    badge: { label: "READY", severity: "warning" as const },
  },
];

const memoryStats = [
  { type: "Episodic", count: 0, icon: Hub, color: "primary" },
  { type: "Semantic", count: 0, icon: Psychology, color: "success" },
  { type: "Procedural", count: 0, icon: Terminal, color: "warning" },
  { type: "Working", count: 0, icon: Speed, color: "info" },
];

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2", light: "#42a5f5", dark: "#1565c0", contrastText: "#fff" },
    success: { main: "#2e7d32", light: "#4caf50", dark: "#1b5e20", contrastText: "#fff" },
    warning: { main: "#ed6c02", light: "#ff9800", dark: "#e65100", contrastText: "#fff" },
    info: { main: "#0288d1", light: "#03a9f4", dark: "#01579b", contrastText: "#fff" },
    background: { default: "#fafafa", paper: "#ffffff" },
    text: { primary: "#1a1a2e", secondary: "#5a5a7e", disabled: "#9aa0a6" },
    divider: "rgba(0, 0, 0, 0.06)",
    action: { hover: "rgba(0, 0, 0, 0.04)", selected: "rgba(25, 118, 210, 0.08)" },
  },
  typography: {
    fontFamily: '"Geist", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em", fontSize: "clamp(1.75rem, 4vw, 2.5rem)" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "clamp(1.25rem, 3vw, 1.75rem)" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em", fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)" },
    h4: { fontWeight: 600, fontSize: "1.125rem" },
    h5: { fontWeight: 600, fontSize: "1rem" },
    h6: { fontWeight: 600, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.08em" },
    subtitle1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.6 },
    subtitle2: { fontWeight: 500, fontSize: "0.875rem" },
    body1: { fontWeight: 400, fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.5 },
    caption: { fontWeight: 400, fontSize: "0.75rem", lineHeight: 1.5 },
    button: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem" },
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
  shape: { borderRadius: 10 },
  spacing: 8,
  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02)",
    "0 2px 4px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
    "0 4px 8px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)",
    "0 8px 16px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)",
    "0 12px 24px rgba(0,0,0,0.07), 0 6px 12px rgba(0,0,0,0.05)",
    ...Array(19).fill("none"),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": { boxSizing: "border-box" },
        html: { WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" },
        body: { minHeight: "100vh" },
        "@media (prefers-reduced-motion: reduce)": {
          "*": { animationDuration: "0.01ms !important", transitionDuration: "0.01ms !important" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid",
          borderColor: "divider",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        },
        elevation0: { boxShadow: "none" },
        elevation1: { boxShadow: "0 1px 3px rgba(0,0,0,0.04)" },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid",
          borderColor: "divider",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          "&:hover": { borderColor: "primary.light", boxShadow: 1 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9999, fontWeight: 600, fontSize: "0.75rem", height: 24 },
        sizeSmall: { height: 20, fontSize: "0.6875rem" },
        sizeMedium: { height: 28, fontSize: "0.8125rem" },
      },
    },
    MuiLinearProgress: {
          styleOverrides: {
            root: { borderRadius: 9999, height: 6, backgroundColor: "action.hover" },
            bar: { borderRadius: 9999 },
            colorPrimary: { backgroundColor: "primary.main" },
          },
        },
    MuiTypography: {
      styleOverrides: { root: { color: "inherit" } },
    },
    MuiTableContainer: { styleOverrides: { root: { borderRadius: 10, border: "1px solid", borderColor: "divider" } } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "text.secondary", borderBottom: "1px solid", borderColor: "divider", py: 2 },
        body: { fontSize: "0.875rem", borderBottom: "1px solid", borderColor: "divider" },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { "&:last-child .MuiTableCell-body": { borderBottom: "none" }, "&:hover": { backgroundColor: "action.hover" } } },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 48, borderBottom: "1px solid", borderColor: "divider" },
        indicator: { height: 2, borderRadius: 1 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 500, fontSize: "0.875rem", minHeight: 48, px: 3, color: "text.secondary", "&.Mui-selected": { color: "primary.main" }, "&:hover": { backgroundColor: "action.hover" } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8, transition: "background-color 0.15s ease", "&:hover": { backgroundColor: "action.hover" } } },
    },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: "0.75rem", borderRadius: 6, px: 2, py: 1 } } },
    MuiAvatar: { styleOverrides: { root: { fontWeight: 600, fontSize: "0.75rem" } } },
    MuiBadge: { styleOverrides: { badge: { fontWeight: 600, fontSize: "0.625rem" } } },
  },
});

const darkTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: "dark",
    primary: { main: "#42a5f5", light: "#64b5f6", dark: "#1976d2", contrastText: "#000" },
    success: { main: "#4caf50", light: "#81c784", dark: "#388e3c", contrastText: "#000" },
    warning: { main: "#ff9800", light: "#ffb74d", dark: "#f57c00", contrastText: "#000" },
    info: { main: "#03a9f4", light: "#29b6f6", dark: "#0288d1", contrastText: "#000" },
    background: { default: "#0d1117", paper: "#161b22" },
    text: { primary: "#e6edf3", secondary: "#8b949e", disabled: "#6e7681" },
    divider: "rgba(255, 255, 255, 0.06)",
    action: { hover: "rgba(255, 255, 255, 0.04)", selected: "rgba(66, 165, 245, 0.12)" },
  },
  components: {
    ...theme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid",
          borderColor: "divider",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid",
          borderColor: "divider",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          "&:hover": { borderColor: "primary.light", boxShadow: 1 },
        },
      },
    },
  },
});

const sections = [
  { id: "monitor", label: "Monitor", icon: Monitor, description: "System health, metrics, and real-time status" },
  { id: "control", label: "Control", icon: ControlPoint, description: "Agents, model interface, and orchestration" },
  { id: "memory", label: "Memory", icon: Hub, description: "Episodic, semantic, procedural, and working memory" },
  { id: "sync", label: "Sync", icon: Sync, description: "Vault synchronization and external integrations" },
] as const;

type SectionId = typeof sections[number]["id"];

function SectionHeader({ title, description, icon: Icon, action }: { title: string; description: string; icon: React.ComponentType<{ fontSize?: string }>; action?: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 3 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ color: "primary.main" }}><Icon fontSize="large" /></Box>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
      {action && <Box sx={{ display: "flex", alignItems: "center" }}>{action}</Box>}
    </Box>
  );
}

function MetricRow({ metrics }: { metrics: typeof metricItems }) {
  return (
    <Grid container spacing={3} sx={{ mb: 2 }}>
      {metrics.map((m) => (
        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={m.key}>
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center", height: "100%" }}>
            <Box sx={{ color: "primary.main", mb: 1.5 }}><m.icon fontSize="large" /></Box>
            <Typography variant="h4" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", mb: 0.5 }}>{m.value}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>{m.label}</Typography>
            <Divider sx={{ my: 1.5, opacity: 0.3 }} />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
              <Speed sx={{ fontSize: 14, color: `${m.trendColor}.main` }} />
              <Typography variant="caption" sx={{ color: `${m.trendColor}.main`, fontWeight: 600 }}>{m.trend} vs last hour</Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

function StatusGrid({ items, sectionId }: { items: typeof statusItems; sectionId: SectionId }) {
  const filtered = items.filter((i) => i.section === sectionId);
  if (filtered.length === 0) return null;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {filtered.map((item) => (
        <Grid size={{ xs: 12, sm: 6, md: 6 }} key={item.id}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 2 }}>
                <Box sx={{ color: "primary.main" }}><item.icon fontSize="large" /></Box>
                <Badge badgeContent={item.badge.label} color={item.badge.severity} variant="dot" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{item.title}</Typography>
              {item.subtitle && <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>{item.subtitle}</Typography>}
              {item.path && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace", display: "block", mb: 2 }}>
                  {item.path}
                </Typography>
              )}
              <Divider sx={{ my: 2, opacity: 0.3 }} />
              {item.details ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                  {item.details.map((d) => (
                    <Box key={d.label} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">{d.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{d.value}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Typography variant="body2"><strong>Status:</strong> {item.status}</Typography>
                  <Typography variant="body2"><strong>Latency:</strong> {item.latency}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

function PhaseTable() {
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [orderBy, setOrderBy] = useState<keyof typeof phases[0]>("id");

  const handleRequestSort = (property: keyof typeof phases[0]) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sorted = [...phases].sort((a, b) => {
    const aVal = a[orderBy];
    const bVal = b[orderBy];
    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Phase</TableCell>
            <TableCell align="left">Name</TableCell>
            <TableCell align="center">
              <TableSortLabel active={orderBy === "status"} direction={orderBy === "status" ? order : "asc"} onClick={() => handleRequestSort("status")}>
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel active={orderBy === "progress"} direction={orderBy === "progress" ? order : "asc"} onClick={() => handleRequestSort("progress")}>
                Progress
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((phase) => (
            <TableRow key={phase.id} hover>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>{phase.id}</Typography>
              </TableCell>
              <TableCell>{phase.name}</TableCell>
              <TableCell align="center">
                <Chip
                  label={phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                  size="small"
                  color={getPhaseColor(phase.status) as any}
                  variant={phase.status === "completed" ? "filled" : phase.status === "in_progress" ? "filled" : "outlined"}
                  icon={phase.status === "completed" ? <CheckCircle fontSize="small" /> : phase.status === "in_progress" ? <Schedule fontSize="small" /> : undefined}
                />
              </TableCell>
              <TableCell align="center" sx={{ width: 140 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <LinearProgress variant="determinate" value={phase.progress} sx={{ flex: 1, height: 6 }} color={getPhaseColor(phase.status) as any} />
                  <Typography variant="caption" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" }}>{phase.progress}%</Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                              <IconButton size="small" aria-label={`Expand ${phase.id}`}>
                                <ExpandMore fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function MemorySection() {
  return (
    <Stack spacing={2}>
      <Grid container spacing={2}>
        {memoryStats.map((m) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={m.type}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <Box sx={{ color: `${m.color}.main`, mb: 1.5 }}><m.icon fontSize="large" /></Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{m.type}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "text.secondary" }}>{m.count}</Typography>
              <Typography variant="caption" color="text.disabled">entries</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        Memory layer stats will populate once the embedding model processes vault content.
      </Typography>
    </Stack>
  );
}

function VaultSyncSection() {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <VaultSync sseUrl="http://localhost:3001/events/vault" vaultPath="D:\\Project\\LOGOS\\storage\\workspace\\vault" />
    </Paper>
  );
}

function SectionContent({ section }: { section: SectionId }) {
  switch (section) {
    case "monitor":
      return (
        <Stack spacing={3}>
          <MetricRow metrics={metricItems} />
          <Divider />
          <StatusGrid items={statusItems} sectionId="monitor" />
        </Stack>
      );
    case "control":
      return (
        <Stack spacing={3}>
          <StatusGrid items={statusItems} sectionId="control" />
        </Stack>
      );
    case "memory":
      return <MemorySection />;
    case "sync":
      return (
        <Stack spacing={3}>
          <StatusGrid items={statusItems} sectionId="sync" />
          <Divider />
          <VaultSyncSection />
        </Stack>
      );
    default:
      return null;
  }
}

function DashboardContent() {
  const theme = useTheme();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<"light" | "dark">(prefersDark ? "dark" : "light");
  const [activeSection, setActiveSection] = useState<SectionId>("monitor");
  const [phaseExpanded, setPhaseExpanded] = useState<string | null>(null);

  useEffect(() => { setMode(prefersDark ? "dark" : "light"); }, [prefersDark]);

  const currentPhase = phases.find((p) => p.status === "in_progress") || phases[0];
  const completedCount = phases.filter((p) => p.status === "completed").length;
  const totalProgress = Math.round((completedCount / phases.length) * 100);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: 1400,
        mx: "auto",
        fontFamily: '"Geist", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Verified sx={{ fontSize: 36, color: "primary.main" }} />
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background: theme.palette.mode === "dark"
                    ? "linear-gradient(90deg, #fff 0%, #90caf9 100%)"
                    : "linear-gradient(90deg, #1a1a2e 0%, #1976d2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                LOGOS
              </Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 400 }}>
              Logical Orchestration Governing Operational Systems
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <Chip icon={<RocketLaunch fontSize="small" />} label="Nemotron 3 Ultra" color="primary" variant="outlined" size="small" />
            <Chip icon={<Verified fontSize="small" />} label="P0.1 Stable" color="success" variant="filled" size="small" />
            <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))} size="small" sx={{ background: "background.paper", boxShadow: 1 }}>
                {mode === "dark" ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Global Progress Bar */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Psychology color="primary" fontSize="medium" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Current: <strong>{currentPhase.id} \u2014 {currentPhase.name}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Chip label={`${totalProgress}% Complete`} color="primary" variant="filled" size="small" sx={{ fontWeight: 600 }} />
            <Chip label={`${completedCount}/${phases.length} Phases`} color={phases.some(p => p.status === "in_progress") ? "warning" : "success"} variant="outlined" size="small" />
          </Box>
        </Box>
        <LinearProgress variant="determinate" value={totalProgress} sx={{ mt: 1.5, height: 8, borderRadius: 4 }} color="primary" />
      </Paper>

      {/* Section Tabs */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Tabs
          value={activeSection}
          onChange={(_, v) => setActiveSection(v as SectionId)}
          variant="fullWidth"
          sx={{ bgcolor: "background.paper" }}
        >
          {sections.map((s) => (
            <Tab
              key={s.id}
              icon={<s.icon fontSize="small" />}
              label={s.label}
              sx={{ px: 2, minWidth: 140 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Section Content */}
      <Collapse in={activeSection === "monitor"} timeout="auto" unmountOnExit>
        <SectionContent section="monitor" />
      </Collapse>
      <Collapse in={activeSection === "control"} timeout="auto" unmountOnExit>
        <SectionContent section="control" />
      </Collapse>
      <Collapse in={activeSection === "memory"} timeout="auto" unmountOnExit>
        <SectionContent section="memory" />
      </Collapse>
      <Collapse in={activeSection === "sync"} timeout="auto" unmountOnExit>
        <SectionContent section="sync" />
      </Collapse>

      {/* Phases - Always visible at bottom */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mt: 4 }}>
        <SectionHeader
          title="Implementation Roadmap"
          description="All phases with status and progress"
          icon={RocketLaunch}
        />
        <PhaseTable />
      </Paper>

      {/* Footer */}
      <Paper variant="outlined" sx={{ p: 2, mt: 4, borderRadius: 2, elevation: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Verified fontSize="small" color="primary" />
            <strong>LOGOS</strong> \u2014 Logical Orchestration Governing Operational Systems
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Next.js 16 \u2022 MUI 9 \u2022 TypeScript 5 \u2022 Node 26 \u2022 Nemotron 3 Ultra
          </Typography>
        </Box>
              </Paper>
    </Box>
  );
}

export default function Home() {
  const theme = useTheme();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<"light" | "dark">(prefersDark ? "dark" : "light");

  useEffect(() => { setMode(prefersDark ? "dark" : "light"); }, [prefersDark]);

  const currentTheme = mode === "dark" ? darkTheme : theme;

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", background: (t) => t.palette.background.default, color: (t) => t.palette.text.primary, transition: "background 0.2s ease, color 0.2s ease" }}>
        <DashboardContent />
      </Box>
    </ThemeProvider>
  );
}