"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Stack,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import {
  FolderOpen,
  Schedule,
  SmartToy,
  Psychology,
  Terminal,
  ControlPoint,
  Groups,
  RocketLaunch,
  Memory,
  People,
  Analytics,
  Hub,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import { useTheme, useMediaQuery } from "@mui/material";

// Mock project data
const mockProject = {
  id: "proj-001",
  name: "LOGOS Platform",
  description: "Logical Orchestration Governing Operational Systems",
  status: "active",
  currentFocus: "Bidirectional Sync (Chokidar + SSE)",
  nextActions: [
    "Implement conflict resolution for vault sync",
    "Write integration tests for document events",
    "Update documentation for P0.4 phase",
  ],
  importantDecisions: [
    { id: "dec-1", text: "Use SQLite with WAL mode for local storage", date: "2026-09-25" },
    { id: "dec-2", text: "Adopt MUI 9.4.0 for consistent UI", date: "2026-09-20" },
    { id: "dec-3", text: "Implement SSE for real-time vault updates", date: "2026-09-15" },
  ],
  openQuestions: [
    "How should we handle large binary files in the vault?",
    "What is the optimal embedding model for our memory system?",
    "Should we implement role-based access control for projects?",
  ],
  recentActivity: [
    { id: "act-1", type: "commit", description: "Added document event tracking", timestamp: "2026-09-30T10:30:00Z" },
    { id: "act-2", type: "decision", description: "Approved use of SQLite WAL mode", timestamp: "2026-09-29T15:20:00Z" },
    { id: "act-3", type: "task", description: "Completed vault scanner implementation", timestamp: "2026-09-28T09:10:00Z" },
  ],
  tasks: [
    { id: "task-1", title: "Implement conflict resolution", status: "in_progress", assignee: "dev-01" },
    { id: "task-2", title: "Write integration tests", status: "todo", assignee: "qa-02" },
    { id: "task-3", title: "Update documentation", status: "review", assignee: "pm-03" },
  ],
  decisions: [
    { id: "dec-1", title: "Storage backend", description: "Selected SQLite with WAL mode", date: "2026-09-25", participants: ["arch-01", "dev-02"] },
    { id: "dec-2", title: "UI framework", description: "Chose MUI 9.4.0 for consistency", date: "2026-09-20", participants: ["ux-01", "dev-03"] },
  ],
  documents: [
    { id: "doc-1", title: "Project Constitution", type: "markdown", updated: "2026-09-28" },
    { id: "doc-2", title: "API Specification", type: "markdown", updated: "2026-09-25" },
    { id: "doc-3", title: "Database Schema", type: "markdown", updated: "2026-09-22" },
  ],
  memory: [
    { id: "mem-1", type: "episodic", content: "User created initial project structure", timestamp: "2026-09-20T08:00:00Z" },
    { id: "mem-2", type: "semantic", content: "SQLite WAL mode provides better concurrency", timestamp: "2026-09-25T14:30:00Z" },
  ],
  people: [
    { id: "p-1", name: "Alex Developer", role: "Lead Engineer", avatar: "/avatars/alex.jpg" },
    { id: "p-2", name: "Sam Designer", role: "UX/UI Designer", avatar: "/avatars/sam.jpg" },
    { id: "p-3", name: "Taylor PM", role: "Product Manager", avatar: "/avatars/taylor.jpg" },
  ],
  councils: [
    { id: "c-1", name: "Technical Council", purpose: "Architecture and tech decisions", members: ["dev-01", "arch-02"] },
    { id: "c-2", name: "Product Council", purpose: "Feature prioritization and roadmap", members: ["pm-01", "ux-01"] },
  ],
};

// Tab labels and icons
const tabs = [
  { label: "Overview", icon: RocketLaunch },
  { label: "Tasks", icon: Schedule },
  { label: "Decisions", icon: SmartToy },
  { label: "Documents", icon: FolderOpen },
  { label: "Memory", icon: Memory },
  { label: "People", icon: People },
  { label: "Councils", icon: Groups },
  { label: "Activity", icon: Analytics },
];

function ProjectHeader() {
  const theme = useTheme();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<"light" | "dark">(prefersDark ? "dark" : "light");

  useEffect(() => { setMode(prefersDark ? "dark" : "light"); }, [prefersDark]);

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RocketLaunch sx={{ fontSize: 36, color: "primary.main" }} />
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
            {mockProject.name}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, ml: 2 }}>
          {mockProject.description}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
        <Chip
          icon={<ControlPoint fontSize="small" />}
          label="Active"
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
        <MenuAnchor>
          <MenuItem onClick={() => alert("Project settings")}>
            <IconButton size="small" aria-label="project settings">
              <SmartToy fontSize="small" />
            </IconButton>
          </MenuItem>
        </MenuAnchor>
      </Box>
    </Box>
  );
}

// MenuAnchor component (simplified)
function MenuAnchor({ children }: { children: React.ReactNode }) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const id = open ? "menu-anchor" : undefined;

  return (
    <>
      <Button
        variant="text"
        size="small"
        aria-controls={id}
        aria-haspopup="true"
        onClick={(e) => {
          setAnchorEl(e.currentTarget);
        }}
      >
        <SmartToy fontSize="small" />
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
      >
        {children}
      </Menu>
    </>
  );
}

function OverviewTab() {
  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Chip
          color="info"
          variant="outlined"
          sx={{ fontSize: "0.875rem" }}
          label={mockProject.currentFocus}
        />
        <Chip
          label={mockProject.status.toUpperCase()}
          color={mockProject.status === "active" ? "success" : "warning"}
          variant="filled"
          sx={{ fontSize: "0.875rem" }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
        {/* Next Actions */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Next Actions
          </Typography>
          <List>
            {mockProject.nextActions.map((action) => (
              <ListItem key={action} sx={{ py: 0.5 }}>
                <ListItemIcon>
                  <Schedule fontSize="small" color="info" />
                </ListItemIcon>
                <ListItemText primary={action} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Important Decisions */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Important Decisions
          </Typography>
          <List>
            {mockProject.importantDecisions.map((dec) => (
              <ListItem key={dec.id} sx={{ py: 0.5 }}>
                <ListItemIcon>
                  <SmartToy fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText primary={dec.text} secondary={dec.date} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Open Questions */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Open Questions
          </Typography>
          <List>
            {mockProject.openQuestions.map((q, idx) => (
              <ListItem key={idx} sx={{ py: 0.5 }}>
                <ListItemIcon>
                  <Psychology fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText primary={q} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Recent Activity */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Recent Activity
          </Typography>
          <List>
            {mockProject.recentActivity.map((act) => (
              <ListItem key={act.id} sx={{ py: 0.5 }}>
                <ListItemIcon>
                  {act.type === "commit" ? (
                    <Terminal fontSize="small" color="info" />
                  ) : act.type === "decision" ? (
                    <SmartToy fontSize="small" color="warning" />
                  ) : (
                    <Schedule fontSize="small" color="success" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={act.description}
                  secondary={new Date(act.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Stack>
  );
}

function TasksTab() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Project Tasks
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        {["todo", "in_progress", "review", "done"].map((status) => (
          <Chip
            key={status}
            label={status.replace("_", " ").toUpperCase()}
            color={
              status === "todo"
                ? "error"
                : status === "in_progress"
                ? "warning"
                : status === "review"
                ? "info"
                : "success"
            }
            variant="outlined"
            sx={{ fontSize: "0.875rem" }}
          />
        ))}
      </Box>
      <List>
        {mockProject.tasks.map((task) => (
          <ListItem key={task.id} sx={{ py: 1 }} divider>
            <ListItemIcon>
              <Schedule fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={task.title}
              secondary={
                <>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Chip
                      label={task.status.replace("_", " ").toUpperCase()}
                      color={
                        task.status === "todo"
                          ? "error"
                          : task.status === "in_progress"
                          ? "warning"
                          : task.status === "review"
                          ? "info"
                          : "success"
                      }
                      size="small"
                    />
                    <Chip label={task.assignee} size="small" color="default" variant="outlined" />
                  </Box>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" size="medium">
          Add Task
        </Button>
      </Box>
    </Stack>
  );
}

function DecisionsTab() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Project Decisions
      </Typography>
      <List>
        {mockProject.decisions.map((dec) => (
          <ListItem key={dec.id} sx={{ py: 1.5 }} divider>
            <ListItemIcon>
              <SmartToy fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText
              primary={dec.title}
              secondary={dec.description}
            />
            <Box sx={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)" }}>
              <Chip label={dec.date} size="small" color="default" variant="outlined" />
              <Box sx={{ display: "flex", mt: 1 }}>
                {dec.participants.map((p, idx) => (
                  <Avatar key={idx} sx={{ size: 24, ml: idx > 0 ? -8 : 0 }}>{p.charAt(0).toUpperCase()}</Avatar>
                ))}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" size="medium">
          Record Decision
        </Button>
      </Box>
    </Stack>
  );
}

function DocumentsTab() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Project Documents
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Chip label="Markdown" color="info" variant="outlined" sx={{ fontSize: "0.875rem" }} />
        <Chip label="Text" color="success" variant="outlined" sx={{ fontSize: "0.875rem" }} />
        <Chip label="Image" color="warning" variant="outlined" sx={{ fontSize: "0.875rem" }} />
        <Chip label="Other" color="default" variant="outlined" sx={{ fontSize: "0.875rem" }} />
      </Box>
      <List>
        {mockProject.documents.map((doc) => (
          <ListItem key={doc.id} sx={{ py: 1 }} divider>
            <ListItemIcon>
              <FolderOpen fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={doc.title}
              secondary={
                <>
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Chip label={doc.type} size="small" color="default" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">
                      Updated: {doc.updated}
                    </Typography>
                  </Box>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" size="medium">
          Upload Document
        </Button>
        <Button variant="outlined" color="primary" size="medium" sx={{ ml: 2 }}>
          New Document
        </Button>
      </Box>
    </Stack>
  );
}

function MemoryTab() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Project Memory
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        {["episodic", "semantic", "procedural", "working"].map((type) => (
          <Chip
            key={type}
            label={type.charAt(0).toUpperCase() + type.slice(1)}
            color={
              type === "episodic"
                ? "primary"
                : type === "semantic"
                ? "success"
                : type === "procedural"
                ? "warning"
                : "info"
            }
            variant="outlined"
            sx={{ fontSize: "0.875rem" }}
          />
        ))}
      </Box>
      <List>
        {mockProject.memory.map((mem) => (
          <ListItem key={mem.id} sx={{ py: 1 }} divider>
            <ListItemIcon>
              {mem.type === "episodic" ? (
                <Hub fontSize="small" color="primary" />
              ) : (
                <Psychology fontSize="small" color="success" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={mem.content}
              secondary={new Date(mem.timestamp).toLocaleString()}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" size="medium">
          Add Memory
        </Button>
      </Box>
    </Stack>
  );
}

function PeopleTab() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Project Team
      </Typography>
      <List>
        {mockProject.people.map((person) => (
          <ListItem key={person.id} sx={{ py: 1.5 }} divider>
            <ListItemIcon>
              <Avatar sx={{ size: 40 }}>
                {person.avatar ? (
                  <img src={person.avatar} alt={person.name} width="40" height="40" />
                ) : (
                  person.name.charAt(0).toUpperCase()
                )}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              primary={person.name}
              secondary={person.role}
            />
            <Box sx={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)" }}>
              <Chip label="Active" size="small" color="success" variant="filled" />
            </Box>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" size="medium">
          Add Member
        </Button>
      </Box>
    </Stack>
  );
}

function CouncilsTab() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Governance Councils
      </Typography>
      <List>
        {mockProject.councils.map((council) => (
          <ListItem key={council.id} sx={{ py: 1.5 }} divider>
            <ListItemIcon>
              <Groups fontSize="small" color="info" />
            </ListItemIcon>
            <ListItemText
              primary={council.name}
              secondary={council.purpose}
            />
            <Box sx={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)" }}>
              <Chip label={`${council.members.length} members`} size="small" color="default" variant="outlined" />
              <Box sx={{ display: "flex", mt: 1 }}>
                {council.members.map((m, idx) => (
                  <Avatar key={idx} sx={{ size: 24, ml: idx > 0 ? -8 : 0 }}>{m.charAt(0).toUpperCase()}</Avatar>
                ))}
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3, textAlign: "right" }}>
        <Button variant="contained" color="primary" size="medium">
          Create Council
        </Button>
      </Box>
    </Stack>
  );
}

function ActivityTab() {
  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Activity Feed
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Chip label="All" color="primary" variant="filled" size="small" />
        <Chip label="Commits" color="info" variant="outlined" size="small" />
        <Chip label="Decisions" color="warning" variant="outlined" size="small" />
        <Chip label="Tasks" color="success" variant="outlined" size="small" />
        <Chip label="Docs" color="default" variant="outlined" size="small" />
      </Box>
      <List>
        {mockProject.recentActivity.map((act) => (
          <ListItem key={act.id} sx={{ py: 1 }} divider>
            <ListItemIcon>
              {act.type === "commit" ? (
                <Terminal fontSize="small" color="info" />
              ) : act.type === "decision" ? (
                <SmartToy fontSize="small" color="warning" />
              ) : (
                <Schedule fontSize="small" color="success" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={act.description}
              secondary={new Date(act.timestamp).toLocaleString()}
            />
            <Box sx={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)" }}>
              <Chip
                label={act.type.charAt(0).toUpperCase() + act.type.slice(1)}
                size="small"
                color={
                  act.type === "commit"
                    ? "info"
                    : act.type === "decision"
                    ? "warning"
                    : "success"
                }
                variant="outlined"
              />
            </Box>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Showing {mockProject.recentActivity.length} recent activities
        </Typography>
      </Box>
    </Stack>
  );
}

// Main WorkPage component
export default function WorkPage() {
  const [activeTab, setActiveTab] = useState<number>(0);

  const TabContent = () => {
    switch (activeTab) {
      case 0: return <OverviewTab />;
      case 1: return <TasksTab />;
      case 2: return <DecisionsTab />;
      case 3: return <DocumentsTab />;
      case 4: return <MemoryTab />;
      case 5: return <PeopleTab />;
      case 6: return <CouncilsTab />;
      case 7: return <ActivityTab />;
      default: return <OverviewTab />;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: "auto" }}>
      <ProjectHeader />
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{ bgcolor: "background.paper" }}
        >
          {tabs.map((tab) => (
            <Tab key={tab.label} icon={<tab.icon fontSize="small" />} label={tab.label} sx={{ px: 2, minWidth: 140 }} />
          ))}
        </Tabs>
      </Paper>
      {/* Tab Content */}
      <Box sx={{ p: 3 }}>
        <TabContent />
      </Box>
    </Box>
  );
}