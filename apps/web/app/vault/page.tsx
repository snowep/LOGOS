'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  Chip,
  Menu,
  MenuItem,
  Button,
  ListItemButton,
  CircularProgress,
  Paper,
  Skeleton,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Folder,
  Person,
  Memory,
  Group,
  Scale,
  Edit,
  Delete,
  Share,
  Search,
  MoreVert,
  InsertDriveFile,
  Sync,
  SyncProblem,
  WifiOff,
  CloudDone,
  Error as ErrorIcon,
  VisibilityOff,
  Article,
} from '@mui/icons-material';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { useVaultEvents, FileChangeEventData, ReconcileCompleteEventData, ConnectionState } from '@/hooks/useVaultEvents';

// Define knowledge categories with const assertions for literal types
const knowledgeCategories = [
  { key: 'projects' as const, label: 'Projects', icon: <Folder /> },
  { key: 'councils' as const, label: 'Councils', icon: <Group /> },
  { key: 'memory' as const, label: 'Memory', icon: <Memory /> },
  { key: 'people' as const, label: 'People', icon: <Person /> },
  { key: 'decisions' as const, label: 'Decisions', icon: <Scale /> },
];

// Type for category keys
type Category = typeof knowledgeCategories[number]['key'];

// Document type
interface Document {
  id: string;
  name: string;
  path: string;
  category: Category;
  modified: string;
  content?: string;
  version?: number;
  lastWriter?: 'USER' | 'LOGOS' | 'AGENT' | 'AUTOMATION';
}

function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const config = useMemo(() => {
    switch (state) {
      case 'connected':
        return { color: 'success', icon: CloudDone, label: 'Connected' };
      case 'connecting':
        return { color: 'warning', icon: Sync, label: 'Connecting...' };
      case 'disconnected':
        return { color: 'warning', icon: WifiOff, label: 'Disconnected' };
      case 'error':
        return { color: 'error', icon: ErrorIcon, label: 'Connection Error' };
    }
  }, [state]);

  const IconComponent = config.icon as typeof CloudDone;

  return (
    <Tooltip title={config.label}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        bgcolor: `${config.color}Light`,
        color: `${config.color}Main`,
        ...(state === 'connecting' && {
          '& > :first-child': {
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          },
        }),
      }}>
        <IconComponent fontSize="small" />
        <Typography variant="caption" sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {config.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function VaultContent() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuActions, setMenuActions] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaths, setShowPaths] = useState(false);
  const [documentContentLoading, setDocumentContentLoading] = useState(false);

  // SSE connection
  const { connectionState, lastEvent, eventCount, reconnect, disconnect } = useVaultEvents({
    onFileChange: (event: FileChangeEventData) => {
      console.log('[Vault] SSE event received:', event);
      // Invalidate and refetch document list on file changes
      if (event.event === 'created' || event.event === 'modified' || event.event === 'deleted' || event.event === 'renamed' || event.event === 'moved') {
        fetchDocuments();
      }
      // If the currently selected document was modified, refetch its content
      if (selectedDocument && (event.documentId === selectedDocument.id || event.path === selectedDocument.path)) {
        fetchDocumentContent(selectedDocument.id);
      }
    },
    onReconcileComplete: (event: ReconcileCompleteEventData) => {
      console.log('[Vault] Reconcile complete:', event);
      if (event.scanQuality !== 'FAILED') {
        fetchDocuments();
      }
    },
    onConnectionChange: (state) => {
      console.log('[Vault] SSE connection state:', state);
    },
  });

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    let isCancelled = false;
    let retries = 3;

    const doFetch = async () => {
      while (retries > 0 && !isCancelled) {
        try {
          console.log('[Vault] Fetching documents from /api/documents?limit=100 (retries left:', retries, ')');
          const response = await fetch('/api/documents?limit=100');
          console.log('[Vault] Response status:', response.status, 'ok:', response.ok, 'headers:', response.headers.get('content-type'));

          if (isCancelled) return;

          if (!response.ok) {
            const text = await response.text();
            console.log('[Vault] Response error text:', text);
            throw new Error(`HTTP error: ${response.status} - ${text}`);
          }

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.log('[Vault] Non-JSON response:', text.substring(0, 200));
            throw new Error(`Expected JSON but got ${contentType}: ${text.substring(0, 100)}`);
          }

          const data = await response.json();
          console.log('[Vault] Data received:', data);

          if (isCancelled) return;

          if (data.error) {
            throw new Error(data.error);
          }

          const transformedDocs: Document[] = (data.documents || []).map((doc: any) => {
            // Determine category from path
            const pathParts = doc.path.split('/');
            let category: Category = 'projects';
            if (pathParts.includes('councils')) category = 'councils';
            else if (pathParts.includes('memory')) category = 'memory';
            else if (pathParts.includes('people')) category = 'people';
            else if (pathParts.includes('decisions')) category = 'decisions';

            return {
              id: doc.id,
              name: doc.path.replace(/\.md$/, '').split('/').pop() || doc.path,
              path: doc.path,
              category,
              modified: new Date(doc.updated_at).toISOString(),
              version: doc.version,
              lastWriter: doc.last_writer,
            };
          });

          console.log('[Vault] Transformed docs:', transformedDocs);

          if (isCancelled) return;

          setDocuments(transformedDocs);
          setError(null);
          return; // Success - exit retry loop
        } catch (err) {
          if (isCancelled) return;
          console.error('[Vault] Failed to fetch documents:', err);
          retries--;
          if (retries === 0) {
            setError(err instanceof Error ? err.message : String(err));
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!isCancelled) {
        setLoading(false);
      }
    };

    doFetch();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch document content
  const fetchDocumentContent = useCallback(async (docId: string) => {
    if (!docId) return;
    
    setDocumentContentLoading(true);
    try {
      const response = await fetch(`/api/documents/${docId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSelectedDocument(prev => prev ? {
        ...prev,
        content: data.content || '',
        version: data.version,
        lastWriter: data.last_writer,
      } : null);
    } catch (err) {
      console.error('[Vault] Failed to fetch document content:', err);
    } finally {
      setDocumentContentLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle SSE events - refetch on relevant changes
  useEffect(() => {
    if (lastEvent) {
      // Check if it's a file change event that should trigger refetch
      if ('event' in lastEvent && (lastEvent.event === 'created' || lastEvent.event === 'modified' || lastEvent.event === 'deleted' || lastEvent.event === 'renamed' || lastEvent.event === 'moved')) {
        // The onFileChange callback handles refetching
      } else if (lastEvent.event === 'reconcile-complete') {
        // The onReconcileComplete callback handles refetching
      }
    }
  }, [lastEvent]);

  // Filter documents by category and search
  const filteredDocuments = useMemo(() => {
    return documents
      .filter(doc => !selectedCategory || doc.category === selectedCategory)
      .filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.path.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [documents, selectedCategory, searchQuery]);

  // Handle category selection
  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    setSelectedDocument(null);
  };

  // Handle document selection
  const handleDocumentSelect = useCallback((doc: Document) => {
    setSelectedDocument(doc);
    fetchDocumentContent(doc.id);
  }, [fetchDocumentContent]);

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
    setAnchorEl(event.currentTarget);
    setMenuActions(doc);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuActions(null);
  };

  // Sanitize markdown HTML before rendering
  const sanitizeMarkdown = (markdown: string): string => {
    const html = marked.parse(markdown);
    return DOMPurify.sanitize(html as string, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'u', 's', 'code', 'pre',
        'blockquote', 'ul', 'ol', 'li',
        'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    });
  };

  // Action handlers
  const handleAskLogos = () => {
    if (menuActions) {
      window.location.href = `/chat?q=${encodeURIComponent(`Analyze ${menuActions.name} from the vault`)}`;
    }
    handleMenuClose();
  };

  const handleEdit = () => {
    if (menuActions) {
      console.log('Edit:', menuActions.name);
      // Navigate to editor or open edit modal
    }
    handleMenuClose();
  };

  const handleRename = () => {
    if (menuActions) {
      const newName = prompt('Enter new name:', menuActions.name);
      if (newName && newName !== menuActions.name) {
        console.log('Rename:', menuActions.name, '->', newName);
        // Implement rename API call
      }
    }
    handleMenuClose();
  };

  const handleMove = () => {
    if (menuActions) {
      console.log('Move:', menuActions.name);
      // Implement move dialog
    }
    handleMenuClose();
  };

  const handleArchive = () => {
    if (menuActions) {
      if (confirm(`Archive "${menuActions.name}"? This will move it to the archive folder.`)) {
        console.log('Archive:', menuActions.name);
        // Implement archive API call
      }
    }
    handleMenuClose();
  };

  const handleShowRelated = () => {
    if (menuActions) {
      console.log('Show related:', menuActions.name);
      // Navigate to related documents view
    }
    handleMenuClose();
  };

  const handleFindConflicts = () => {
    if (menuActions) {
      console.log('Find conflicts:', menuActions.name);
      // Navigate to conflicts view
    }
    handleMenuClose();
  };

  const handleRefresh = () => {
    fetchDocuments();
  };

  const handleReconnect = () => {
    reconnect();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Paper elevation={0} variant="outlined" sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderColor: 'error.main' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Failed to load documents</AlertTitle>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleRefresh}>
              Retry
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Render document content with sanitized markdown
  const renderDocumentContent = (doc: Document) => {
    if (documentContentLoading) {
      return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="80%" height={16} />
          <Divider />
          <Skeleton variant="rectangular" width="100%" height={200} />
        </Box>
      );
    }

    if (!doc.content) {
      return (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', p: 4, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Article fontSize="large" sx={{ opacity: 0.5 }} />
            <Typography variant="body1">No content available</Typography>
            <Typography variant="body2" color="text.secondary">
              The document content could not be loaded.
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Box
          component="div"
          dangerouslySetInnerHTML={{
            __html: sanitizeMarkdown(doc.content),
          }}
          sx={{
            lineHeight: 1.7,
            fontSize: '0.95rem',
            color: '#e4e4e7',
            '& h1, & h2, & h3, & h4': {
              color: '#fff',
              marginTop: '1.5em',
              marginBottom: '0.5em',
              fontWeight: 600,
            },
            '& h1': { fontSize: '1.75rem', borderBottom: '1px solid #27272a', paddingBottom: '0.25em' },
            '& h2': { fontSize: '1.5rem' },
            '& h3': { fontSize: '1.25rem' },
            '& code': {
              bgcolor: 'rgba(255,255,255,0.08)',
              px: 0.5,
              py: 0.125,
              borderRadius: 4,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: '0.9em',
            },
            '& pre': {
              bgcolor: '#0d0d0d',
              border: '1px solid #27272a',
              borderRadius: 8,
              p: 2,
              overflow: 'auto',
              '& code': {
                bgcolor: 'transparent',
                px: 0,
                py: 0,
                fontSize: '0.85rem',
                lineHeight: 1.6,
              },
            },
            '& blockquote': {
              borderLeft: '3px solid #6366f1',
              pl: 2,
              ml: 0,
              color: '#a1a1aa',
              fontStyle: 'italic',
            },
            '& ul, & ol': { pl: 4 },
            '& a': { color: '#818cf8', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
            '& table': { width: '100%', borderCollapse: 'collapse', marginY: 2 },
            '& th, & td': { border: '1px solid #27272a', px: 2, py: 1 },
            '& th': { bgcolor: 'rgba(255,255,255,0.04)', fontWeight: 600 },
            '& img': { maxWidth: '100%', borderRadius: 4, height: 'auto' },
            '& hr': { borderColor: '#27272a', my: 3 },
          }}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Knowledge Pane - 200px */}
      <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider', p: 2, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom color="text.primary" sx={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            KNOWLEDGE
          </Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={handleRefresh} aria-label="Refresh">
              <Sync fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <List dense>
          {knowledgeCategories.map((cat) => (
            <ListItem key={cat.key} sx={{ mb: 0.5, px: 0 }}>
              <ListItemButton
                selected={selectedCategory === cat.key}
                onClick={() => handleCategorySelect(cat.key)}
                sx={{
                  borderRadius: 2,
                  py: 0.75,
                  '&:hover': { bgcolor: 'action.hover' },
                  ...(selectedCategory === cat.key && { bgcolor: 'action.selected' }),
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: selectedCategory === cat.key ? 'primary.main' : 'text.secondary' }}>
                  {cat.icon}
                </ListItemIcon>
                <ListItemText primary={cat.label} sx={{ variant: 'body2', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Documents Pane - 320px */}
      <Box sx={{ width: 320, minWidth: 320, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', flexShrink: 0, bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" gutterBottom color="text.primary" sx={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              DOCUMENTS
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ConnectionIndicator state={connectionState} />
              <Tooltip title={showPaths ? 'Hide paths' : 'Show paths'}>
                <IconButton size="small" onClick={() => setShowPaths(!showPaths)} aria-label={showPaths ? 'Hide paths' : 'Show paths'}>
                  {showPaths ? <VisibilityOff fontSize="small" /> : <InsertDriveFile fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="Search documents..."
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{ width: '100%' }}
          />
        </Box>
        
        <Divider sx={{ m: 0 }} />
        
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <List dense>
            {filteredDocuments.length === 0 ? (
              <ListItem sx={{ px: 2, py: 4, textAlign: 'center' }}>
                <ListItemText primary="No documents found" sx={{ color: 'text.secondary', variant: 'body2' }} />
              </ListItem>
            ) : (
              filteredDocuments.map((doc) => (
                <ListItem key={doc.id} sx={{ mb: 0.5, px: 1 }}>
                  <ListItemButton
                    selected={selectedDocument?.id === doc.id}
                    onClick={() => handleDocumentSelect(doc)}
                    sx={{
                      borderRadius: 2,
                      py: 0.75,
                      '&:hover': { bgcolor: 'action.hover' },
                      ...(selectedDocument?.id === doc.id && { bgcolor: 'action.selected' }),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'text.secondary' }}>
                      <InsertDriveFile fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={doc.name}
                      secondary={showPaths ? doc.path : `v${doc.version || 1} • ${doc.lastWriter || '—'} • ${new Date(doc.modified).toLocaleDateString()}`}
                      sx={{ primary: { variant: 'body2', fontWeight: 500 }, secondary: { variant: 'caption', color: 'text.secondary' } }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Box>

      {/* Preview Pane - remaining */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" gutterBottom color="text.primary" sx={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            PREVIEW
          </Typography>
          {selectedDocument && (
            <Tooltip title="Actions">
              <IconButton onClick={(e) => handleMenuOpen(e, selectedDocument)} aria-controls="document-menu" aria-haspopup="true">
                <MoreVert />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Divider sx={{ m: 0 }} />
        {selectedDocument ? (
          renderDocumentContent(selectedDocument)
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary', p: 4, textAlign: 'center' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <InsertDriveFile fontSize="large" sx={{ opacity: 0.3 }} />
              <Typography variant="body1">Select a document to preview</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a document from the middle pane to view its content here.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Actions Menu */}
        <Menu
          id="document-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{ '& .MuiPaper-root': { bgcolor: 'background.paper', border: 1, borderColor: 'divider' } }}
        >
          <MenuItem onClick={handleAskLogos} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Memory fontSize="small" color="primary" />
              Ask LOGOS
            </Box>
          </MenuItem>
          <MenuItem disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Edit fontSize="small" />
              Edit (coming soon)
            </Box>
          </MenuItem>
          <MenuItem disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Edit fontSize="small" />
              Rename (coming soon)
            </Box>
          </MenuItem>
          <MenuItem disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Share fontSize="small" />
              Move (coming soon)
            </Box>
          </MenuItem>
          <MenuItem disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Delete fontSize="small" color="warning" />
              Archive (coming soon)
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Share fontSize="small" />
              Show related (coming soon)
            </Box>
          </MenuItem>
          <MenuItem disabled sx={{ opacity: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SyncProblem fontSize="small" color="warning" />
              Find conflicts (coming soon)
            </Box>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}

export default function VaultPage() {
  return <VaultContent />;
}