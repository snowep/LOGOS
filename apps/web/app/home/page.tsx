"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Stack,
  Divider,
  Chip,
  Avatar,
  Button,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  RocketLaunch,
  Schedule,
  SmartToy,
  FolderOpen,
  Memory,
  People,
  Groups,
  Analytics,
  Speed,
  ControlPoint,
  Hub,
  Sync,
  DarkMode,
  LightMode,
  Bolt,
  Terminal,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Hub as HubIcon,
  Groups as GroupsIcon,
  People as PeopleIcon,
  RocketLaunch as RocketIcon,
  Schedule as ScheduleIcon,
  SmartToy as SmartToyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Memory as MemoryIcon,
  ControlPoint as ControlPointIcon,
  ArrowForward,
  Refresh,
  TrendingUp,
  Settings,
  Description,
  CheckCircle,
} from "@mui/icons-material";
import { useTheme, useMediaQuery } from "@mui/material";
import Link from "next/link";

// Mock data for home page
const mockStats = {
  projectsActive: 3,
  tasksOpen: 12,
  decisionsThisWeek: 2,
  documentsTotal: 47,
  memoryItems: 156,
  automationsRunning: 4,
};

const mockRecentActivity = [
  { id: "1", type: "decision", text: "Approved SQLite WAL mode for storage", time: "2 hours ago", icon: SmartToyIcon, color: "warning" },
  { id: "2", type: "task", text: "Completed vault scanner implementation", time: "5 hours ago", icon: CheckCircle, color: "success" },
  { id: "3", type: "commit", text: "Pushed bidirectional sync (Chokidar + SSE)", time: "1 day ago", icon: Terminal, color: "info" },
  { id: "4", type: "document", text: "Added API specification document", time: "2 days ago", icon: Description, color: "primary" },
];

const mockQuickActions = [
  { label: "New Task", icon: ScheduleIcon, href: "/work", color: "primary" },
  { label: "Record Decision", icon: SmartToyIcon, href: "/work", color: "warning" },
  { label: "Upload Document", icon: FolderOpen, href: "/vault", color: "success" },
  { label: "Search Memory", icon: MemoryIcon, href: "/memory", color: "info" },
  { label: "Add Contact", icon: PeopleIcon, href: "/people", color: "secondary" },
  { label: "Create Automation", icon: AutoAwesomeIcon, href: "/automations", color: "error" },
];

const mockProjects = [
  { id: "1", name: "LOGOS Platform", status: "active", progress: 75, nextAction: "Implement conflict resolution", color: "primary" },
  { id: "2", name: "Personal Wiki", status: "planning", progress: 20, nextAction: "Design memory schema", color: "info" },
  { id: "3", name: "Automation Engine", status: "active", progress: 45, nextAction: "Write trigger tests", color: "success" },
];

export default function HomePage() {
  const theme = useTheme();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<"light" | "dark">(prefersDark ? "dark" : "light");

  useEffect(() => { setMode(prefersDark ? "dark" : "light"); }, [prefersDark]);

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RocketIcon sx={{ fontSize: 36, color: "primary.main" }} />
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
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, ml: 2 }}>
            Living Organism Governing Operational Systems
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Chip
            icon={<ControlPointIcon fontSize="small" />}
            label="System Operational"
            color="success"
            variant="filled"
            size="small"
          />
          <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
              size="small"
              sx={{ background: "background.paper", boxShadow: 1 }}
            >
              {mode === "dark" ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
          <Button variant="contained" color="primary" endIcon={<ArrowForward />} size="small" component={Link} href="/work">
            Open Workspace
          </Button>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    Active Projects
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {mockStats.projectsActive}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "primary.light", opacity: 0.2 }}>
                  <RocketIcon fontSize="large" color="primary" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    Open Tasks
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {mockStats.tasksOpen}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "warning.light", opacity: 0.2 }}>
                  <ScheduleIcon fontSize="large" color="warning" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    Decisions This Week
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {mockStats.decisionsThisWeek}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "warning.light", opacity: 0.2 }}>
                  <SmartToyIcon fontSize="large" color="warning" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    Documents
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {mockStats.documentsTotal}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "success.light", opacity: 0.2 }}>
                  <Description fontSize="large" color="success" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    Memory Items
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {mockStats.memoryItems}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "info.light", opacity: 0.2 }}>
                  <MemoryIcon fontSize="large" color="info" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
                    Automations Running
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {mockStats.automationsRunning}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "error.light", opacity: 0.2 }}>
                  <AutoAwesomeIcon fontSize="large" color="error" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Button variant="text" size="small" endIcon={<Refresh />} component={Link} href="/work">
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={0} direction="column">
                {mockRecentActivity.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      py: 1.5,
                      px: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${activity.color}.light`, opacity: 0.2 }}>
                      <activity.icon fontSize="medium" color={activity.color as any} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {activity.text}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      {activity.time}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                <Button variant="text" size="small" endIcon={<Settings />} component={Link} href="/settings">
                  Settings
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1} direction="column">
                {mockQuickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outlined"
                    color={action.color as any}
                    startIcon={<action.icon />}
                    size="small"
                    component={Link}
                    href={action.href}
                    sx={{
                      justifyContent: "flex-start",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 500,
                      py: 1,
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Projects Overview
                </Typography>
                <Button variant="text" size="small" endIcon={<ArrowForward />} component={Link} href="/work">
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={0} direction="column">
                {mockProjects.map((project) => (
                  <Box
                    key={project.id}
                    sx={{
                      py: 1.5,
                      px: 1,
                      borderBottom: 1,
                      borderColor: "divider",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      "&:last-child": { borderBottom: 0 },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {project.name}
                        </Typography>
                        <Chip
                          label={project.status.toUpperCase()}
                          color={project.status === "active" ? "success" : "info"}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ display: "block" }}>
                        Next: {project.nextAction}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", minWidth: 120 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {project.progress}%
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ height: 6 }}>
                        <Box
                          sx={{
                            flex: project.progress / 100,
                            height: "100%",
                            bgcolor: `${project.color}.main`,
                            borderRadius: 1,
                          }}
                        />
                        <Box
                          sx={{
                            flex: 1 - project.progress / 100,
                            height: "100%",
                            bgcolor: "divider",
                            borderRadius: 1,
                          }}
                        />
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  System Status
                </Typography>
                <Button variant="text" size="small" endIcon={<TrendingUp />} component={Link} href="/system">
                  Details
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2} direction="column">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.light", opacity: 0.2 }}>
                    <CheckCircle fontSize="medium" color="success" />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      API Server
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Running on port 3001
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.light", opacity: 0.2 }}>
                    <CheckCircle fontSize="medium" color="success" />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Vault Watcher
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Monitoring D:\Project\LOGOS\storage\workspace\vault
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.light", opacity: 0.2 }}>
                    <CheckCircle fontSize="medium" color="success" />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      SSE Endpoint
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      /events/vault active
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "warning.light", opacity: 0.2 }}>
                    <CheckCircle fontSize="medium" color="warning" />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Vector Search
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      JS fallback (Windows)
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: "success.light", opacity: 0.2 }}>
                    <CheckCircle fontSize="medium" color="success" />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Database
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SQLite WAL mode, 47 pages
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer Links */}
      <Divider sx={{ my: 4 }} />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
        <Button variant="text" size="small" component={Link} href="/chat">
          <AutoAwesomeIcon fontSize="small" sx={{ mr: 0.5 }} /> Chat
        </Button>
        <Button variant="text" size="small" component={Link} href="/work">
          <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} /> Work
        </Button>
        <Button variant="text" size="small" component={Link} href="/vault">
          <FolderOpen fontSize="small" sx={{ mr: 0.5 }} /> Vault
        </Button>
        <Button variant="text" size="small" component={Link} href="/memory">
          <MemoryIcon fontSize="small" sx={{ mr: 0.5 }} /> Memory
        </Button>
        <Button variant="text" size="small" component={Link} href="/people">
          <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} /> People
        </Button>
        <Button variant="text" size="small" component={Link} href="/automations">
          <AutoAwesomeIcon fontSize="small" sx={{ mr: 0.5 }} /> Automations
        </Button>
        <Button variant="text" size="small" component={Link} href="/settings">
          <Settings fontSize="small" sx={{ mr: 0.5 }} /> Settings
        </Button>
        <Button variant="text" size="small" component={Link} href="/system">
          <ControlPointIcon fontSize="small" sx={{ mr: 0.5 }} /> System
        </Button>
      </Box>
    </Box>
  );
}