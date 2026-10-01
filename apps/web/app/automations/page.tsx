'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { AutoAwesome as AutomationsIcon } from '@mui/icons-material';

interface Automation {
  id: string;
  name: string;
  trigger: string;
  schedule: string;
  status: 'active' | 'paused' | 'error';
  lastRun: string | null;
  nextRun: string | null;
}

export default function AutomationsPage() {
  // No backend for automations exists yet (P1.1). Render honest empty state.
  const [automations] = useState<Automation[]>([]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1120, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h1" sx={{ fontSize: 28, fontWeight: 600 }} color="text.primary">
          Automations
        </Typography>
        <Button
          variant="contained"
          color="primary"
          disableElevation
          sx={{ height: 40, textTransform: 'none' }}
          startIcon={<AutomationsIcon sx={{ fontSize: 20 }} />}
          disabled
        >
          Create Automation
        </Button>
      </Box>

      {automations.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderColor: 'divider' }}>
          <Typography variant="h3" sx={{ fontSize: 18, fontWeight: 600, mb: 1 }}>
            No automations yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto' }}>
            Scheduled and triggered automations arrive with the automation engine (P1.1). Nothing is running right now.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Trigger</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last run</TableCell>
                <TableCell>Next run</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {automations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.trigger}</TableCell>
                  <TableCell>{a.schedule}</TableCell>
                  <TableCell>
                    <Chip
                      label={a.status}
                      size="small"
                      color={a.status === 'active' ? 'success' : a.status === 'paused' ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{a.lastRun ?? 'Never'}</TableCell>
                  <TableCell>{a.nextRun ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
