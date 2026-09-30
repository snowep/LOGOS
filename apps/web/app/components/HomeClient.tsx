"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Card,
  CardContent,
  Stack,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Alert,
} from "@mui/material";
import {
  ArrowRight,
  FolderOpen,
  Schedule,
  CheckCircle,
  Warning,
  KeyboardArrowRight,
  Search,
  Mic,
  Send,
} from "@mui/icons-material";
import { useTheme, useMediaQuery } from "@mui/material";

const geistFont = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

interface Project {
  id: string;
  name: string;
  description: string;
  lastActivity: string;
  lastActivityTime: string;
  nextAction: string;
  status: "active" | "paused" | "completed";
  projectName?: string;
}

interface AttentionItem {
  id: string;
  projectId: string;
  projectName: string;
  message: string;
  actionLabel: string;
  severity: "warning" | "info" | "error";
}

interface ActivityItem {
  id: string;
  time: string;
  description: string;
  projectName?: string;
}

interface HomeClientProps {
  initialProjects: Project[];
  initialActivities: ActivityItem[];
}

export default function HomeClient({ initialProjects, initialActivities }: HomeClientProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [command, setCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [attentionItems, setAttentionItems] = useState<AttentionItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/documents?limit=10")
        .then((res) => res.json())
        .then((data) => {
          const transformedProjects: Project[] = (data.documents || []).map((doc: any) => ({
            id: doc.id,
            name: doc.path.replace(/\.md$/, "").replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            description: `Last updated: ${new Date(doc.updated_at).toLocaleDateString()}`,
            lastActivity: doc.path,
            lastActivityTime: new Date(doc.updated_at).toISOString(),
            nextAction: "Continue editing",
            status: "active" as const,
          }));
          setProjects(transformedProjects.slice(0, 5));
        })
        .catch((err) => console.error("Failed to fetch projects:", err));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    window.location.href = `/chat?q=${encodeURIComponent(command.trim())}`;
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
  };

  const formatTimeAgo = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatActivityTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading && projects.length === 0 && activities.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid", borderColor: "primary.main transparent transparent transparent", animation: "spin 1s linear infinite" }} />
          <Typography variant="body1" color="text.secondary">Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", width: "100%", px: isMobile ? 2 : 0, py: 4, fontFamily: geistFont }}>
      <Paper elevation={0} variant="outlined" sx={{ mb: 4, p: { xs: 3, sm: 4 }, borderColor: "divider" }}>
        <Stack spacing={2.5} direction="column" sx={{ alignItems: "stretch" }}>
          <Typography variant="h2" sx={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2, color: "text.primary" }}>
            {greeting}.
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.3, color: "text.primary" }}>
            What are we working on?
          </Typography>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Continue a project, ask a question, or tell LOGOS what to do…"
              variant="outlined"
              size="small"
              multiline
              rows={2}
              aria-label="Command input"
              sx={{
                "& .MuiInputBase-root": {
                  fontSize: "1.125rem",
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: "text.primary",
                  "&::placeholder": { color: "text.disabled", opacity: 1 },
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "divider" },
                  "&:hover fieldset": { borderColor: "text.secondary" },
                  "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 2 },
                },
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, mt: 1 }}>
              <IconButton size="small" onClick={handleVoiceInput} sx={{ color: isListening ? "primary.main" : "text.secondary", p: 0.5 }} aria-label={isListening ? "Stop voice input" : "Start voice input"}>
                <Mic fontSize="medium" />
              </IconButton>
              <Button type="button" onClick={handleCommandSubmit} size="small" variant="contained" disabled={!command.trim()} startIcon={<ArrowRight fontSize="small" />} sx={{ textTransform: "none", fontWeight: 500, height: 36 }}>
                Send
              </Button>
            </Box>
          </Box>
        </Stack>
      </Paper>

      {projects.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Stack spacing={1.5} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
              Continue Working
            </Typography>
          </Stack>
          <Stack spacing={1.5} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {projects.map((project) => (
              <Card key={project.id} variant="outlined" sx={{ p: 2.5, borderColor: "divider", transition: "border-color 0.15s ease, box-shadow 0.15s ease", "&:hover": { borderColor: "primary.light", boxShadow: 1 }, cursor: "pointer" }} onClick={() => (window.location.href = `/work/${project.id}`)}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "1rem" }}>
                          {project.name}
                        </Typography>
                        <Chip label={project.status} size="small" variant="outlined" color={project.status === "active" ? "success" : project.status === "paused" ? "warning" : "default"} icon={project.status === "active" ? <CheckCircle fontSize="small" /> : project.status === "paused" ? <Schedule fontSize="small" /> : undefined} />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {project.description}
                      </Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ opacity: 0.3 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Schedule fontSize="small" sx={{ color: "text.secondary" }} />
                        <Typography variant="caption" color="text.secondary">
                          Last activity: {formatTimeAgo(project.lastActivityTime)}
                        </Typography>
                      </Box>
                      {project.projectName && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <FolderOpen fontSize="small" sx={{ color: "text.secondary" }} />
                          <Typography variant="caption" color="text.secondary">
                            {project.projectName}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                        {project.nextAction}
                      </Typography>
                      <KeyboardArrowRight fontSize="small" sx={{ color: "text.secondary" }} />
                    </Box>
                  </Box>
                </Box>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      {attentionItems.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Stack spacing={1.5} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
              Needs Attention
            </Typography>
            <Chip label={attentionItems.length} color="warning" size="small" variant="filled" />
          </Stack>
          <Stack spacing={1} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {attentionItems.map((item) => (
              <Alert key={item.id} severity={item.severity} variant="filled" sx={{ borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }} action={<Button size="small" variant="outlined" sx={{ textTransform: "none", fontWeight: 500 }}>{item.actionLabel}</Button>}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, flex: 1, minWidth: 200 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {item.projectName}
                  </Typography>
                  <Typography variant="body2" color="inherit">
                    {item.message}
                  </Typography>
                </Box>
              </Alert>
            ))}
          </Stack>
        </Box>
      )}

      {(activities.length > 0 || projects.length > 0) && (
        <Box>
          <Stack spacing={1.5} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
              Recent Activity
            </Typography>
          </Stack>
          <Paper elevation={0} variant="outlined" sx={{ borderColor: "divider" }}>
            <List dense disablePadding sx={{ maxHeight: 400, overflow: "auto" }}>
              {activities.slice(0, 15).map((activity) => (
                <ListItem key={activity.id} sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                  <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                    <FolderOpen fontSize="small" sx={{ color: "text.secondary" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                        <Typography variant="body2" sx={{ fontWeight: 400 }}>
                          {activity.description}
                        </Typography>
                        {activity.projectName && <Typography variant="caption" color="text.secondary">{activity.projectName}</Typography>}
                      </Box>
                    }
                    secondary={<Typography variant="caption" color="text.disabled">{formatActivityTime(activity.time)}</Typography>}
                  />
                </ListItem>
              ))}
              {activities.length === 0 && projects.length === 0 && (
                <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body1">No recent activity yet.</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Start a project or ask a question to begin.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>
        </Box>
      )}

      {projects.length === 0 && activities.length === 0 && attentionItems.length === 0 && !loading && (
        <Box sx={{ mt: 4, textAlign: "center", color: "text.secondary" }}>
          <Paper elevation={0} variant="outlined" sx={{ p: 4, borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Welcome to LOGOS
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, maxWidth: 500, mx: "auto" }}>
              Your personal AI assistant. Start by telling LOGOS what you're working on, or create a new project in the Work section.
            </Typography>
            <Button variant="contained" size="large" startIcon={<FolderOpen />} onClick={() => (window.location.href = "/work")} sx={{ textTransform: "none", fontWeight: 500 }}>
              Create a Project
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
}