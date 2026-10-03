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
  Stack,
  ListItemButton,
  ListItemIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  FolderOpen,
  Group,
  Gavel,
  Memory,
  Info,
  ChevronLeft,
  Add,
  Delete,
} from '@mui/icons-material';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  reasoning?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConversationRail, setShowConversationRail] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track mobile viewport for responsive drawer
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/chat/conversations');
        if (!response.ok) throw new Error('Failed to fetch conversations');
        const data = await response.json();
        setConversations(data.conversations || []);
        // Select the most recent conversation if none selected
        if (data.conversations?.length > 0 && !selectedConversationId) {
          setSelectedConversationId(data.conversations[0].id);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Unable to load conversations.');
      }
    };

    fetchConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/chat/conversations/${selectedConversationId}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setError('Unable to load messages.');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversationId]);

  // Scroll to bottom of messages when new message added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      const data = await response.json();
      setConversations([data.conversation, ...conversations]);
      setSelectedConversationId(data.conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Unable to create conversation.');
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    if (window.innerWidth < 1024) {
      setShowConversationRail(false);
    }
  };

  const handleConversationDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete conversation');
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(conversations[1]?.id || null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Unable to delete conversation.');
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedConversationId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    try {
      const response = await fetch(`/api/chat/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputValue }),
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
      };

      setMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([
        ...messages,
        userMessage,
        {
          id: Date.now().toString() + 'e',
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const filteredConversations = conversations.map(conv => ({
    ...conv,
    updatedAt: new Date(conv.updatedAt).toLocaleDateString(),
  }));

  if (error && conversations.length === 0) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Paper elevation={0} variant="outlined" sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderColor: 'error.main' }}>
            <Typography variant="h6" gutterBottom color="error">
                          Unable to load conversations
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="p">
                          {error}
                        </Typography>
            <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'background.default' }}>
      {/* Conversation Rail - Desktop: persistent, Mobile: drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: { xs: 0, sm: 280 },
          flexShrink: 0,
          display: { xs: 'none', sm: 'flex' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Rail Header */}
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Conversations
            </Typography>
            <Tooltip title="New conversation">
              <IconButton size="small" onClick={handleNewConversation} aria-label="New conversation">
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Conversation List */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List dense disablePadding>
              {filteredConversations.length === 0 ? (
                <ListItem sx={{ px: 2, py: 4, textAlign: 'center' }}>
                  <ListItemText primary="No conversations yet" sx={{ color: 'text.secondary', variant: 'body2' }} />
                </ListItem>
              ) : (
                filteredConversations.map((conv) => (
                  <ListItem key={conv.id} sx={{ px: 1, py: 0.5 }}>
                    <ListItemButton
                      selected={selectedConversationId === conv.id}
                      onClick={() => handleConversationSelect(conv.id)}
                      sx={{
                        borderRadius: 2,
                        py: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        ...(selectedConversationId === conv.id && { bgcolor: 'action.selected' }),
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: selectedConversationId === conv.id ? 'primary.main' : 'text.secondary' }}>
                        <FolderOpen fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={conv.title}
                        secondary={`${conv.messageCount} messages • ${conv.updatedAt}`}
                        sx={{
                          primary: { variant: 'body2', fontWeight: 500 },
                          secondary: { variant: 'caption', color: 'text.secondary' },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleConversationDelete(conv.id, e)}
                        sx={{ ml: 'auto', color: 'text.secondary', opacity: selectedConversationId === conv.id ? 1 : 0, transition: 'opacity 0.15s' }}
                        aria-label="Delete conversation"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Box>
      </Drawer>

      {/* Mobile Conversation Rail Drawer */}
            <Drawer
              variant="temporary"
              anchor="left"
              open={showConversationRail && isMobile}
              onClose={() => setShowConversationRail(false)}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Conversations
            </Typography>
            <IconButton onClick={() => setShowConversationRail(false)} aria-label="Close">
              <ChevronLeft fontSize="medium" />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List dense disablePadding>
              {filteredConversations.map((conv) => (
                <ListItem key={conv.id} sx={{ px: 1, py: 0.5 }}>
                  <ListItemButton
                    selected={selectedConversationId === conv.id}
                    onClick={() => handleConversationSelect(conv.id)}
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                      ...(selectedConversationId === conv.id && { bgcolor: 'action.selected' }),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: selectedConversationId === conv.id ? 'primary.main' : 'text.secondary' }}>
                      <FolderOpen fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={conv.title}
                      secondary={`${conv.messageCount} messages • ${conv.updatedAt}`}
                      sx={{
                        primary: { variant: 'body2', fontWeight: 500 },
                        secondary: { variant: 'caption', color: 'text.secondary' },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleConversationDelete(conv.id, e)}
                      sx={{ ml: 'auto', color: 'text.secondary' }}
                      aria-label="Delete conversation"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      </Drawer>

      {/* Main Workspace */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <Box
          sx={{
            px: { md: 4, xs: 2 },
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setShowConversationRail(true)}
              sx={{ mr: 1, color: 'text.secondary', display: { xs: 'flex', sm: 'none' } }}
              aria-label="Open conversations"
            >
              <MenuIcon />
            </IconButton>
            <Avatar sx={{ bgcolor: 'primary.main' }}>L</Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                LOGOS Chat
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {selectedConversationId ? (
                  conversations.find(c => c.id === selectedConversationId)?.title || 'Conversation'
                ) : (
                  'Select or start a conversation'
                )}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Settings">
              <IconButton>
                <Info fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Conversation Area */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: { md: 4, xs: 2 }, bgcolor: 'background.default' }}>
          {loading && (
            <Box sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Loading conversation...</Typography>
            </Box>
          )}

          {!loading && !selectedConversationId && (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
              <FolderOpen fontSize="large" sx={{ opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                              No conversation selected
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="p">
                              Start a new conversation or select one from the sidebar.
                            </Typography>
              <Button variant="contained" color="primary" onClick={handleNewConversation} sx={{ mt: 2 }}>
                <Add sx={{ mr: 1 }} fontSize="small" /> New Conversation
              </Button>
            </Box>
          )}

          {!loading && selectedConversationId && messages.length === 0 && (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4 }}>
              <FolderOpen fontSize="large" sx={{ opacity: 0.3, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                              Empty conversation
                            </Typography>
                            <Typography variant="body2" color="text.secondary" component="p">
                              Start the conversation by sending a message below.
                            </Typography>
            </Box>
          )}

          <List>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  mb: 3,
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                {message.role === 'assistant' && (
                  <ListItemAvatar sx={{ mt: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>A</Avatar>
                  </ListItemAvatar>
                )}
                <Box sx={{ maxWidth: '80%' }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                      color: message.role === 'user' ? 'contrastText' : 'text.primary',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ mb: 1 }}>{message.content}</Box>
                    {(message.sources || message.reasoning) && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="text"
                          size="small"
                          sx={{ color: 'text.secondary' }}
                          onClick={() => {
                            alert(`Sources: ${message.sources?.join(', ') || 'None'}\n\nReasoning: ${message.reasoning || 'None'}`);
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
                    <Avatar sx={{ bgcolor: 'primary.main' }}>L</Avatar>
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
            px: { md: 4, xs: 2 },
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
            placeholder={selectedConversationId ? "Type your message..." : "Start a conversation first"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedConversationId}
            sx={{ flexGrow: 1, margin: 0 }}
            multiline
            rows={1}
            maxRows={4}
          />
          <Button
            variant="contained"
            color="primary"
            size="medium"
            disabled={!inputValue.trim() || !selectedConversationId}
            onClick={handleSend}
            sx={{ px: 4 }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}