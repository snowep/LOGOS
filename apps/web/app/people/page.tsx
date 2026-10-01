'use client';

import React from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { Person, SmartToy } from '@mui/icons-material';

// People page groups: You / LOGOS / Agents / Personas / Councils.
// Agents, personas, and councils have no backend yet (P0.8/P0.9) — render honest empty states.

function EntityCard({
  icon,
  title,
  subtitle,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status?: string;
  children?: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        {status && <Chip label={status} size="small" variant="outlined" />}
      </Box>
      {children}
    </Paper>
  );
}

function EmptyGroup({ name, note }: { name: string; note: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderColor: 'divider', mb: 2 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 0.5 }}>{name}</Typography>
      <Typography variant="body2" color="text.secondary">
        {note}
      </Typography>
    </Paper>
  );
}

export default function PeoplePage() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1120, mx: 'auto', width: '100%' }}>
      <Typography variant="h1" sx={{ fontSize: 28, fontWeight: 600, mb: 3 }} color="text.primary">
        People
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 4 }}>
        <EntityCard icon={<Person />} title="You" subtitle="Primary user" status="Active" />
        <EntityCard icon={<SmartToy />} title="LOGOS" subtitle="Personal AI assistant" status="Available" />
      </Box>

      <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 2 }}>Agents</Typography>
      <EmptyGroup name="No agents registered" note="Delegated worker agents arrive with the agent registry (P0.8)." />

      <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 2 }}>Personas</Typography>
      <EmptyGroup name="No personas defined" note="Personas arrive with the agent registry (P0.8)." />

      <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 2 }}>Councils</Typography>
      <EmptyGroup name="No councils convening" note="Structured reasoning councils arrive with P0.9." />
    </Box>
  );
}
