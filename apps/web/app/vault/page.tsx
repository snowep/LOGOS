'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
} from '@mui/icons-material';
import { marked } from 'marked';
import Shell from '../components/Shell';

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

  // Fetch documents from API
  useEffect(() => {
    let isCancelled = false;
    let retries = 3;
    
    const fetchDocuments = async () => {
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
    
    fetchDocuments();
    
    return () => {
      isCancelled = true;
    };
  }, []);

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
  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc);
  };

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

  // Action handlers (placeholders)
  const handleAskLogos = () => {
    if (menuActions) {
      window.location.href = `/chat?q=${encodeURIComponent(`Analyze ${menuActions.name} from the vault`)}`;
    }
  };

  const handleEdit = () => {
    console.log('Edit:', menuActions?.name);
  };

  const handleRename = () => {
    console.log('Rename:', menuActions?.name);
  };

  const handleMove = () => {
    console.log('Move:', menuActions?.name);
  };

  const handleArchive = () => {
    console.log('Archive:', menuActions?.name);
  };

  const handleShowRelated = () => {
    console.log('Show related:', menuActions?.name);
  };

  const handleFindConflicts = () => {
    console.log('Find conflicts:', menuActions?.name);
  };

  if (loading) {
    return (
      <Shell>
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', alignItems: 'center', justifyContent: 'center', p: 4 }}>
          <Paper elevation={0} variant="outlined" sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderColor: 'error.main' }}>
            <Typography variant="h6" color="error.main" gutterBottom>
              Failed to load documents
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => window.location.reload()}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Paper>
        </Box>
      </Shell>
    );
  }

  return (
    <Shell>
      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: '#0a0a0a', color: '#fafafa' }}>
        {/* Knowledge Pane */}
        <Box sx={{ width: 240, borderRight: '1px solid #27272a', p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom color="#fff">
            KNOWLEDGE
          </Typography>
          <List>
            {knowledgeCategories.map((cat) => (
              <ListItem key={cat.key} sx={{ mb: 1 }}>
                <ListItemButton
                  selected={selectedCategory === cat.key}
                  onClick={() => handleCategorySelect(cat.key)}
                  sx={{
                    borderRadius: 4,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                    ...(selectedCategory === cat.key && { bgcolor: 'rgba(99,102,241,0.12)' }),
                  }}
                >
                  <ListItemIcon>{cat.icon}</ListItemIcon>
                  <ListItemText primary={cat.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Documents Pane */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', p: 2, borderRight: '1px solid #27272a' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom color="#fff">
              DOCUMENTS
            </Typography>
            <TextField
              placeholder="Search documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: 250 }}
              size="small"
            />
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List>
              {filteredDocuments.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No documents found" sx={{ color: '#a1a1aa' }} />
                </ListItem>
              ) : (
                filteredDocuments.map((doc) => (
                  <ListItem key={doc.id} sx={{ mb: 1 }}>
                    <ListItemButton
                      selected={selectedDocument?.id === doc.id}
                      onClick={() => handleDocumentSelect(doc)}
                      sx={{
                        borderRadius: 4,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                        ...(selectedDocument?.id === doc.id && { bgcolor: 'rgba(99,102,241,0.12)' }),
                      }}
                    >
                      <ListItemIcon>
                        <InsertDriveFile />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.name}
                        secondary={doc.path}
                        sx={{ primary: { fontWeight: 500 } }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Box>

        {/* Preview Pane */}
        <Box sx={{ width: 400, borderLeft: '1px solid #27272a', p: 3, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom color="#fff">
              PREVIEW
            </Typography>
            {selectedDocument && (
              <Tooltip title="Actions">
                <IconButton onClick={(e) => handleMenuOpen(e, selectedDocument)} aria-controls="simple-menu" aria-haspopup="true">
                  <MoreVert />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Divider sx={{ my: 1 }} />
          {selectedDocument ? (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <div
                dangerouslySetInnerHTML={{
                  __html: marked.parse(`# ${selectedDocument.name}\n\n*Last modified: ${new Date(selectedDocument.modified).toLocaleString()}*\n\n---\n\n*This is a preview of the document content. In a real implementation, this would fetch the actual markdown content from the vault.*`)
                }}
              />
            </Box>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
              Select a document to preview
            </Box>
          )}
        </Box>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleAskLogos}>
            Ask LOGOS
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            Edit
          </MenuItem>
          <MenuItem onClick={handleRename}>
            Rename
          </MenuItem>
          <MenuItem onClick={handleMove}>
            Move
          </MenuItem>
          <MenuItem onClick={handleArchive}>
            Archive
          </MenuItem>
          <MenuItem onClick={handleShowRelated}>
            Show related
          </MenuItem>
          <MenuItem onClick={handleFindConflicts}>
            Find conflicts
          </MenuItem>
        </Menu>
      </Box>
    </Shell>
  );
}

export default function VaultPage() {
  return <VaultContent />;
}