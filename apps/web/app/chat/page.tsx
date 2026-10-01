"use client";

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Modal,
  Drawer,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  IconButton,
  Typography,
  Paper,
} from '@mui/material';
import {
  Menu,
  Search,
  FolderOpen,
  Group,
  Gavel,
  Memory,
  Info,
} from '@mui/icons-material';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  reasoning?: string;
  pendingAction?: {
    type: string;
    description: string;
    confirm: () => void;
    cancel: () => void;
  };
  workingState?: string;
}

interface ContextData {
  project: {
    name: string;
    description: string;
    lastUpdated: Date;
  };
  relatedNotes: Array<{
    id: string;
    title: string;
    snippet: string;
    timestamp: Date;
  }>;
  councilSessions: Array<{
    id: string;
    topic: string;
    participants: string[];
    timestamp: Date;
    outcome: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: Date;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  memories: Array<{
    id: string;
    type: 'episodic' | 'semantic' | 'procedural' | 'working';
    content: string;
    timestamp: Date;
    relevance: number;
  }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    description: string;
    confirm: () => void;
    cancel: () => void;
  } | null>(null);
  const [workingState, setWorkingState] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch context data on mount
  useEffect(() => {
    const fetchContext = async () => {
      setLoadingContext(true);
      try {
        const response = await fetch(`${API_URL}/context`);
        if (!response.ok) throw new Error('Failed to fetch context');
        const data = await response.json();
        setContextData(data);
      } catch (error) {
        console.error('Error fetching context:', error);
        setContextData(null);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchContext();
  }, []);

  // Scroll to bottom of messages when new message added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    // Set working state
    setWorkingState('Thinking...');

    try {
      const response = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue, context: contextData }),
      });

      if (!response.ok) throw new Error('Chat API error');

      const data = await response.json();

      const assistantMessage: Message = {
        id: Date.now().toString() + 'a',
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        sources: data.sources,
        reasoning: data.reasoning,
        pendingAction: data.pendingAction
          ? {
              type: data.pendingAction.type,
              description: data.pendingAction.description,
              confirm: data.pendingAction.confirm,
              cancel: data.pendingAction.cancel,
            }
          : undefined,
      };

      setMessages([...messages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...messages,
        {
          id: Date.now().toString() + 'e',
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setWorkingState(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const toggleContextPanel = () => setContextPanelOpen(!contextPanelOpen);

  const handleApprovalConfirm = () => {
    if (pendingAction) {
      pendingAction.confirm();
    }
    setApprovalModalOpen(false);
    setPendingAction(null);
  };

  const handleApprovalCancel = () => {
    if (pendingAction) {
      pendingAction.cancel();
    }
    setApprovalModalOpen(false);
    setPendingAction(null);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Context Panel (Drawer) */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={contextPanelOpen}
        onClose={toggleContextPanel}
        sx={{ width: 300, bgcolor: 'background.paper' }}
        ModalProps={{
          keepMounted: true, // Better render performance.
        }}
      >
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Context
            </Typography>
            <IconButton onClick={toggleContextPanel} sx={{ p: 1 }}>
              <Menu fontSize="small" />
            </IconButton>
          </Box>
          <Divider sx={{ my: 2 }} />
          {loadingContext ? (
            <CircularProgress sx={{ mt: 2 }} />
          ) : (
            <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)} sx={{ mt: 1 }}>
              <Tab label="Project" />
              <Tab label="Notes" />
              <Tab label="Sessions" />
              <Tab label="Decisions" />
              <Tab label="Memories" />
            </Tabs>
          )}
          <Box sx={{ flexGrow: 1, mt: 2, overflow: 'auto' }}>
            {loadingContext ? null : (
              <>
                {/* Project Tab */}
                <Box sx={{ p: 2, display: tabIndex === 0 ? 'block' : 'none' }}>
                  {contextData && (
                    <>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Project:</strong> {contextData.project.name}
                      </Typography>
                      <Typography variant="caption" sx={{ mb: 2 }}>
                        {contextData.project.description}
                      </Typography>
                      <Typography variant="caption" sx={{ mb: 2 }}>
                        Last updated: {contextData.project.lastUpdated.toLocaleString()}
                      </Typography>
                    </>
                  )}
                </Box>
                {/* Notes Tab */}
                <Box sx={{ p: 2, display: tabIndex === 1 ? 'block' : 'none' }}>
                  {contextData && (
                    <List>
                      {contextData.relatedNotes.map((note) => (
                        <ListItem key={note.id} sx={{ mb: 2 }}>
                          <ListItemAvatar>
                            <FolderOpen fontSize="small" />
                          </ListItemAvatar>
                          <ListItemText
                            primary={note.title}
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption">{note.snippet}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {note.timestamp.toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                {/* Sessions Tab */}
                <Box sx={{ p: 2, display: tabIndex === 2 ? 'block' : 'none' }}>
                  {contextData && (
                    <List>
                      {contextData.councilSessions.map((session) => (
                        <ListItem key={session.id} sx={{ mb: 2 }}>
                          <ListItemAvatar>
                            <Group fontSize="small" />
                          </ListItemAvatar>
                          <ListItemText
                            primary={session.topic}
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption">
                                  Participants: {session.participants.join(', ')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {session.timestamp.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ mt: 1 }}>
                                  Outcome: {session.outcome}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                {/* Decisions Tab */}
                <Box sx={{ p: 2, display: tabIndex === 3 ? 'block' : 'none' }}>
                  {contextData && (
                    <List>
                      {contextData.decisions.map((decision) => (
                        <ListItem key={decision.id} sx={{ mb: 2 }}>
                          <ListItemAvatar>
                            <Gavel fontSize="small" />
                          </ListItemAvatar>
                          <ListItemText
                            primary={decision.title}
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption">{decision.description}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {decision.timestamp.toLocaleString()} •{' '}
                                  <Chip
                                    label={decision.status}
                                    size="small"
                                    color={
                                      decision.status === 'approved'
                                        ? 'success'
                                        : decision.status === 'rejected'
                                        ? 'error'
                                        : 'warning'
                                    }
                                  />
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                {/* Memories Tab */}
                <Box sx={{ p: 2, display: tabIndex === 4 ? 'block' : 'none' }}>
                  {contextData && (
                    <List>
                      {contextData.memories.map((memory) => (
                        <ListItem key={memory.id} sx={{ mb: 2 }}>
                          <ListItemAvatar>
                            <Memory fontSize="small" />
                          </ListItemAvatar>
                          <ListItemText
                            primary={memory.content.substring(0, 50) + '...'}
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption">
                                  Type: {memory.type}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {memory.timestamp.toLocaleString()} • Relevance: {
                                    Math.round(memory.relevance * 100)
                                  }%
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Main Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            px: 4,
            py: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{'L'}</Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                LOGOS Chat
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                AI-powered assistant
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Open context panel">
              <IconButton onClick={toggleContextPanel}>
                <Search fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Conversation Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4, bgcolor: 'background.default' }}>
          {workingState && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="body2">{workingState}</Typography>
            </Box>
          )}
          <List>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  mb: 3,
                  display: 'flex',
                  flexDirection:
                    message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                {message.role === 'assistant' && (
                  <ListItemAvatar sx={{ mt: 1 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>{'A'}</Avatar>
                  </ListItemAvatar>
                )}
                <Box sx={{ maxWidth: '80%' }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor:
                        message.role === 'user'
                          ? 'primary.main'
                          : 'background.paper',
                      color:
                        message.role === 'user'
                          ? 'contrastText'
                          : 'text.primary',
                      borderRadius: 1,
                      mb: message.workingState || message.pendingAction ? 1 : 0,
                    }}
                  >
                    <Box sx={{ mb: 1 }}>
                      {message.content}
                    </Box>
                    {message.workingState && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <CircularProgress size={20} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {message.workingState}
                        </Typography>
                      </Box>
                    )}
                    {message.pendingAction && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                                                  variant="contained"
                                                  color="error"
                                                  size="small"
                                                  sx={{ mb: 1 }}
                                                  onClick={() => {
                                                    if (message.pendingAction) {
                                                      setPendingAction(message.pendingAction);
                                                      setApprovalModalOpen(true);
                                                    }
                                                  }}
                                                >
                                                  Review Action
                                                </Button>
                      </Box>
                    )}
                    {(message.sources || message.reasoning) && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="text"
                          size="small"
                          sx={{ color: 'text.secondary' }}
                          onClick={() => {
                            // In a real app, we would open a modal or expand a section
                            alert(
                              `Sources: ${message.sources?.join(', ') || 'None'}\n\nReasoning: ${
                                message.reasoning || 'None'
                              }`
                            );
                          }}
                        >
                          Show Sources/Reasoning
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Box>
                {message.role === 'user' && (
                  <ListItemAvatar sx={{ mt: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{'L'}</Avatar>
                  </ListItemAvatar>
                )}
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        {/* Input Bar */}
        <Box
          sx={{
            px: 4,
            py: 3,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <TextField
            label="Message"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{ flexGrow: 1, margin: 0 }}
          />
          <Button
            variant="contained"
            color="primary"
            size="medium"
            disabled={!inputValue.trim()}
            onClick={handleSend}
            sx={{ px: 4 }}
          >
            Send
          </Button>
        </Box>
      </Box>

      {/* Approval Modal */}
      <Modal
        open={approvalModalOpen}
        onClose={handleApprovalCancel}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Action Required
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {pendingAction?.description}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleApprovalCancel}
              sx={{ px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleApprovalConfirm}
              sx={{ px: 3 }}
            >
              Confirm
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}