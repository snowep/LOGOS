"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  Avatar,
  Tooltip,
  Drawer,
} from '@mui/material';
import { Psychology, Terminal, Speed, Hub } from '@mui/icons-material';
import { IconButton } from '@mui/material';

const MEMORY_TYPES = [
  { label: 'Episodic', icon: Psychology, color: 'primary' },
  { label: 'Semantic', icon: Hub, color: 'success' },
  { label: 'Procedural', icon: Terminal, color: 'warning' },
  { label: 'Working', icon: Speed, color: 'info' },
];

interface MemoryItem {
  id: string;
  content: string;
  source: string;
  related: string[];
  confidence: 'High' | 'Medium' | 'Low';
  created: string; // ISO string
  status: 'Durable' | 'Fading' | 'Archived';
  types: string[]; // e.g., ['Episodic', 'Semantic']
}

function MemoryPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | 'Recent' | 'About you' | 'Projects' | 'Decisions' | 'Knowledge' | 'Ways of working'>('All');
  const [advancedDetail, setAdvancedDetail] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  // Fetch memories from API
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const response = await fetch('/api/memory');
        if (!response.ok) throw new Error('Failed to fetch memories');
        const data: MemoryItem[] = await response.json();
        setMemories(data);
      } catch (error) {
        console.error('Error fetching memories:', error);
        // Show placeholder data for development
        setMemories([
          {
            id: '1',
            content: 'Scarcity is a core principle of DROP 002.',
            source: 'Brand Council — Session 04',
            related: ['DROP 002', 'scarcity.md'],
            confidence: 'High',
            created: '2026-09-29T10:30:00Z',
            status: 'Durable',
            types: ['Semantic'],
          },
          {
            id: '2',
            content: 'User prefers dark theme and minimal Apple-like visual restraint.',
            source: 'User onboarding interview',
            related: ['About you'],
            confidence: 'High',
            created: '2026-09-28T15:45:00Z',
            status: 'Durable',
            types: ['Episodic'],
          },
        ]);
      }
    };

    fetchMemories();
  }, []);

  // Filter memories based on search and category
  const filteredMemories = memories.filter((mem) => {
    const matchesSearch = mem.content.toLowerCase().includes(search.toLowerCase()) ||
      mem.source.toLowerCase().includes(search.toLowerCase()) ||
      mem.related.some((r) => r.toLowerCase().includes(search.toLowerCase()));

    if (category === 'All') return matchesSearch;

    // Map category to related field (simplified)
    const categoryMap: Record<string, string[]> = {
      'Recent': [], // Handled by sort
      'About you': ['About you', 'User'],
      'Projects': ['DROP 002', 'Project'],
      'Decisions': ['Decision', 'Council'],
      'Knowledge': ['Knowledge', 'Research'],
      'Ways of working': ['Process', 'Workflow', 'Way of working'],
    };

    const relevantTerms = categoryMap[category] || [];
    const matchesCategory = relevantTerms.some((term) =>
      mem.related.some((r) => r.toLowerCase().includes(term.toLowerCase())) ||
      mem.content.toLowerCase().includes(term.toLowerCase())
    );

    return matchesSearch && matchesCategory;
  });

  // Sort by date descending (Recent first)
  const sortedMemories = [...filteredMemories].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );

  // Handle memory selection
  const handleMemorySelect = (mem: MemoryItem) => {
    setSelectedMemory(mem);
    setOpenDetail(true);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        <Typography variant="h2" sx={{ fontWeight: 700 }}>
          What does LOGOS remember?
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search what LOGOS remembers..."
            placeholder="Search what LOGOS remembers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, maxWidth: 400 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => setAdvancedDetail(!advancedDetail)}
          >
            {advancedDetail ? 'Hide advanced detail' : 'Show advanced detail'}
          </Button>
        </Box>
      </Box>

      {/* Categories */}
             <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
               {(['All', 'Recent', 'About you', 'Projects', 'Decisions', 'Knowledge', 'Ways of working'] as const).map((cat) => (
                 <Paper
                   key={cat}
                   variant="outlined"
                   sx={{ p: 3, textAlign: 'center', cursor: 'pointer', backgroundColor: category === cat ? 'primary.main' : 'transparent', color: category === cat ? 'primary.contrastText' : 'text.primary' }}
                   onClick={() => setCategory(cat as typeof category)}
                 >
                   <Typography variant="h6" sx={{ fontWeight: 600 }}>
                     {cat}
                   </Typography>
                 </Paper>
               ))}
             </Box>

      {/* Memories List */}
      <Box sx={{ mb: 4 }}>
        {sortedMemories.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No memories found.
          </Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {sortedMemories.map((mem) => (
              <ListItem
                key={mem.id}
                sx={{ cursor: 'pointer', borderBottom: '1px solid', borderColor: 'divider' }}
                onClick={() => handleMemorySelect(mem)}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2 }}>
                  <Avatar sx={{ bg: 'primary.main', color: 'primary.contrastText', mr: 2 }}>
                    {(() => {
                      const IconComponent = MEMORY_TYPES.find((t) => mem.types.includes(t.label))?.icon || Psychology;
                      return <IconComponent fontSize="medium" />;
                    })()}
                  </Avatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Typography variant="body1" sx={{ mb: 0.5 }}>
                      {mem.content}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                      {mem.types.map((type) => (
                        <Chip
                          key={type}
                          label={type}
                          size="small"
                          sx={{ backgroundColor: MEMORY_TYPES.find((t) => t.label === type)?.color + '.main', color: MEMORY_TYPES.find((t) => t.label === type)?.color + '.contrastText' }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Source: {mem.source} • {new Date(mem.created).toLocaleDateString()} • Status: {mem.status}
                    </Typography>
                    {advancedDetail && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Related: {mem.related.join(', ')} • Confidence: {mem.confidence}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Memory Detail Drawer */}
      <Drawer
        anchor="right"
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        sx={{ width: 360 }}
      >
        {selectedMemory && (
          <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Memory Detail
              </Typography>
              <IconButton onClick={() => setOpenDetail(false)} sx={{ p: 1 }}>
                {/* Assuming we have Close icon; for simplicity, use X */}
                <Typography>×</Typography>
              </IconButton>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ flex: 1, mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedMemory.content}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Source
                </Typography>
                <Typography variant="body2">{selectedMemory.source}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Related
                </Typography>
                <Typography variant="body2">
                  {selectedMemory.related.map((r) => (
                    <Box key={r} sx={{ display: 'block', mb: 0.5 }}>
                      {r}
                    </Box>
                  ))}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Confidence
                </Typography>
                <Typography variant="body2">{selectedMemory.confidence}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedMemory.created).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2">{selectedMemory.status}</Typography>
                {advancedDetail && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Types
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedMemory.types.map((type) => (
                        <Chip
                          key={type}
                          label={type}
                          size="small"
                          sx={{ backgroundColor: MEMORY_TYPES.find((t) => t.label === type)?.color + '.main', color: MEMORY_TYPES.find((t) => t.label === type)?.color + '.contrastText' }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </Box>
            <Button
              variant="outlined"
              size="small"
              sx={{ alignSelf: 'flex-end' }}
              onClick={() => {
                // TODO: Implement edit/delete actions
                alert('Actions not implemented yet');
              }}
            >
              Actions
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

export default MemoryPage;