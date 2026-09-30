'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Wallet,
  SmartToy,
  Psychology,
  Group,
  Shield,
  Description,
  CalendarToday,
  Comment,
  Link,
  FilterAlt,
  Book,
  Send,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';

// Mock data
const you = {
  name: 'Alex',
  role: 'Primary User',
  status: 'Active',
  responsibilities: ['Directing LOGOS', 'Setting goals', 'Providing context'],
  permissions: {
    read: ['*'],
    write: ['*'],
    delete: ['*'],
  },
};

const logos = {
  name: 'LOGOS',
  role: 'AI Assistant',
  status: 'Available',
  responsibilities: [
    'Understanding user intent',
    'Executing tasks',
    'Managing memory',
    'Coordinating agents',
  ],
  permissions: {
    read: ['memory/*', 'vault/*', 'projects/*'],
    write: ['memory/*', 'vault/*'],
    execute: ['agents/*', 'councils/*'],
  },
};

const agents = [
  {
    id: 1,
    name: 'Research Manager',
    role: 'Research & validation',
    status: 'Available',
    responsibilities: ['Research', 'Source checking', 'Evidence collection'],
    permissions: {
      read: ['Research/'],
      write: ['Research/Drafts/'],
      deny: ['Delete canonical files'],
    },
  },
  {
    id: 2,
    name: 'Editor',
    role: 'Content refinement',
    status: 'Busy',
    responsibilities: ['Editing drafts', 'Improving clarity', 'Ensuring consistency'],
    permissions: {
      read: ['Projects/*/Docs'],
      write: ['Projects/*/Docs/Edited'],
    },
  },
  {
    id: 3,
    name: 'Executor',
    role: 'Task automation',
    status: 'Available',
    responsibilities: ['Running scripts', 'File operations', 'API calls'],
    permissions: {
      read: ['System/Scripts'],
      write: ['Temp/'],
    },
  },
];

const personas = [
  { id: 1, name: 'The Strategist', description: 'Focuses on long-term planning and risk assessment.' },
  { id: 2, name: 'The Innovator', description: 'Generates creative solutions and explores new ideas.' },
  { id: 3, name: 'The Analyst', description: 'Breaks down complex problems into data-driven insights.' },
];

const councils = [
  {
    id: 1,
    name: 'Brand Council',
    purpose: 'Challenge brand decisions.',
    members: ['Research Manager', 'Editor', 'Executor', 'The Strategist'],
    currentSession: {
      id: 'session-001',
      topic: 'Brand voice for new product line',
      participants: 4,
      discussion: 'Debated whether to use a authoritative or friendly tone for the new product launch.',
      arguments: [
        { agent: 'Research Manager', point: 'Data shows authoritative tone increases conversion by 18%' },
        { agent: 'The Innovator', point: 'Friendly tone aligns with our brand personality of approachability' },
      ],
      disagreements: [
        { agent: 'Research Manager', vs: 'The Innovator', topic: 'Tone choice', resolution: 'Compromise: authoritative for headlines, friendly for body copy' },
      ],
      evidence: ['Market research report Q3-2026', 'Brand guidelines v2.1'],
      synthesis: 'Use authoritative tone for headlines and CTAs, friendly tone for educational content.',
      decision: 'Approve brand voice guidelines with split tone application.',
      actions: [
        { agent: 'Editor', action: 'Update all marketing templates by EOD Friday', due: '2026-10-02' },
        { agent: 'Research Manager', action: 'Run A/B test on tone effectiveness', due: '2026-10-09' },
      ],
    },
  },
  {
    id: 2,
    name: 'Product Council',
    purpose: 'Evaluate feature trade-offs.',
    members: ['Executor', 'The Analyst', 'The Innovator'],
    currentSession: {
      id: 'session-002',
      topic: 'Prioritizing vault search vs. memory graph features',
      participants: 3,
      discussion: 'Weighed immediate user needs against long-term architectural benefits.',
      arguments: [
        { agent: 'The Analyst', point: 'Vault search addresses 70% of current user complaints' },
        { agent: 'Executor', point: 'Memory graph enables future automation but requires 3 weeks dev time' },
      ],
      disagreements: [],
      evidence: ['User feedback survey Sept 2026', 'Technical spike report'],
      synthesis: 'Implement vault search first as MVP, then begin memory graph foundation.',
      decision: 'Approve vault search MVP for next sprint, schedule memory graph spike.',
      actions: [
        { agent: 'Executor', action: 'Design vault search UI', due: '2026-10-05' },
        { agent: 'The Analyst', action: 'Define memory graph schema', due: '2026-10-12' },
      ],
    },
  },
];

export default function PeoplePage() {
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [expandedCouncil, setExpandedCouncil] = useState(null);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h3" gutterBottom>
        People
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 3, mb: 4 }}>
        {/* You */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Avatar sx={{ width: 60, height: 60, mb: 2 }}>
            <Person fontSize="large" />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            You
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {you.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {you.role}
          </Typography>
          <Chip label={you.status} size="small" sx={{ mb: 2 }} />
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Responsibilities
            </Typography>
            <List sx={{ mt: 1 }}>
              {you.responsibilities.map((r) => (
                <ListItem key={r} sx={{ py: 0.5 }}>
                  <ListItemIcon>{/* bullet */}</ListItemIcon>
                  <ListItemText primary={r} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Permissions
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Read: *" size="small" />
              <Chip label="Write: *" size="small" />
              <Chip label="Delete: *" size="small" />
            </Box>
          </Box>
        </Paper>

        {/* LOGOS */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: 'primary.main' }}>
            <SmartToy fontSize="large" sx={{ color: '#fff' }} />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            LOGOS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI Assistant
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {logos.status}
          </Typography>
          <Chip label={logos.status} size="small" sx={{ mb: 2 }} />
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Responsibilities
            </Typography>
            <List sx={{ mt: 1 }}>
              {logos.responsibilities.map((r) => (
                <ListItem key={r} sx={{ py: 0.5 }}>
                  <ListItemIcon>{/* bullet */}</ListItemIcon>
                  <ListItemText primary={r} />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Permissions
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Read: memory/*" size="small" />
              <Chip label="Write: memory/*" size="small" />
              <Chip label="Execute: agents/*" size="small" />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Agents */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Agents
        </Typography>
        {agents.map((agent) => (
          <Paper key={agent.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 40, height: 40 }}>
                  <Psychology fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6">{agent.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {agent.role}
                  </Typography>
                </Box>
              </Box>
              <Chip label={agent.status} size="small" />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Responsibilities
              </Typography>
              <Typography variant="body2">
                {agent.responsibilities.join(', ')}
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {Object.entries(agent.permissions).map(([type, value]) => (
                  <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: 'small' }}>
                      {type.toUpperCase()}: {Array.isArray(value) ? value.join(', ') : value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setExpandedAgent(agent.id)}
              sx={{ mb: 1 }}
            >
              {expandedAgent === agent.id ? 'Hide Details' : 'Show Details'}
            </Button>
            <Accordion
              expanded={expandedAgent === agent.id}
              onChange={(_, isExpanded) => setExpandedAgent(isExpanded ? agent.id : null)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary>
                <Typography variant="body2">Agent Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" color="text.secondary">
                    Agent ID: {agent.id}
                  </Typography>
                  {/* Additional technical details could go here */}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Paper>
        ))}
      </Box>

      {/* Personas */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Personas
        </Typography>
        {personas.map((persona) => (
          <Paper key={persona.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 40, height: 40 }}>
                  <Psychology fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6">{persona.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {persona.description}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Councils */}
      <Box>
        <Typography variant="h4" gutterBottom>
          Councils
        </Typography>
        {councils.map((council) => (
          <Paper key={council.id} variant="outlined" sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 40, height: 40 }}>
                  <Group fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="h6">{council.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {council.purpose}
                  </Typography>
                </Box>
              </Box>
              <Chip label={`${council.members.length} members`} size="small" />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Members
              </Typography>
              <Typography variant="body2">
                {council.members.join(', ')}
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Current Session
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {council.currentSession.topic}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setExpandedCouncil(council.id)}
              sx={{ mb: 1 }}
            >
              {expandedCouncil === council.id ? 'Hide Session Details' : 'Show Session Details'}
            </Button>
            <Accordion
                          expanded={expandedCouncil === council.id}
                          onChange={(_, isExpanded) => setExpandedCouncil(isExpanded ? council.id : null)}
                          sx={{ mb: 1 }}
                        >
                          <AccordionSummary>
                            <Typography variant="body2">Session Details</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Topic:
                              </Typography>
                              <Typography variant="body2">
                                {council.currentSession.topic}
                              </Typography>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Participants:
                              </Typography>
                              <Typography variant="body2">
                                {council.currentSession.participants}
                              </Typography>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Discussion:
                              </Typography>
                              <Typography variant="body2">
                                {council.currentSession.discussion}
                              </Typography>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Arguments:
                              </Typography>
                              <TableContainer>
                                <Table sx={{ width: "100%" }}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Agent</TableCell>
                                      <TableCell>Point</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {council.currentSession.arguments.map((arg, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{arg.agent}</TableCell>
                                        <TableCell>{arg.point}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            {council.currentSession.disagreements.length > 0 && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Disagreements (Preserved):
                                </Typography>
                                {council.currentSession.disagreements.map((dis, idx) => (
                                  <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: 'action.hover' }}>
                                    <Typography variant="body2">
                                      {dis.agent} vs {dis.vs} on "{dis.topic}"
                                    </Typography>
                                    {dis.resolution && (
                                      <Box sx={{ mt: 0.5 }}>
                                        <Typography variant="body2" color="text.secondary">
                                          Resolution: {dis.resolution}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                ))}
                              </Box>
                            )}
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Evidence:
                            </Typography>
                            <List sx={{ mt: 1 }}>
                              {council.currentSession.evidence.map((e, idx) => (
                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                  <ListItemIcon>{/* document */}</ListItemIcon>
                                  <ListItemText primary={e} />
                                </ListItem>
                              ))}
                            </List>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Synthesis:
                            </Typography>
                            <Typography variant="body2">
                              {council.currentSession.synthesis}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Decision:
                            </Typography>
                            <Typography variant="body2">
                              {council.currentSession.decision}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Actions:
                            </Typography>
                            <TableContainer>
                              <Table sx={{ width: "100%" }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Agent</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Due</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {council.currentSession.actions.map((act, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{act.agent}</TableCell>
                                      <TableCell>{act.action}</TableCell>
                                      <TableCell>{act.due}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                          </AccordionDetails>
                        </Accordion>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}