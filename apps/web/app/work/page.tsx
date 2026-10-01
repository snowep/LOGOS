"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
} from "@mui/material";

// Project sections per UI spec. No project backend exists yet (P1.0) —
// every section renders an honest empty state until real entities land.
const SECTIONS = [
  "Overview",
  "Tasks",
  "Decisions",
  "Documents",
  "Memory",
  "People",
  "Councils",
  "Activity",
] as const;

type Section = (typeof SECTIONS)[number];

function EmptySection({ name }: { name: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderColor: "divider" }}>
      <Typography variant="h3" sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
        No {name.toLowerCase()} yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: "auto" }}>
        Project {name.toLowerCase()} become available once projects are first-class entities (P1.0).
      </Typography>
    </Paper>
  );
}

export default function WorkPage() {
  const [section, setSection] = useState<Section>("Overview");

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1120, mx: "auto", width: "100%" }}>
      <Typography variant="h1" sx={{ fontSize: 28, fontWeight: 600, mb: 1 }} color="text.primary">
        Work
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Projects connect tasks, decisions, documents, memory, people, and councils.
      </Typography>

      <Tabs
        value={section}
        onChange={(_, v) => setSection(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {SECTIONS.map((s) => (
          <Tab key={s} value={s} label={s} sx={{ textTransform: "none", minHeight: 40 }} />
        ))}
      </Tabs>

      <EmptySection name={section} />
    </Box>
  );
}
