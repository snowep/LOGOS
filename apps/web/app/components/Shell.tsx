'use client';

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Chat as ChatIcon,
  Work as WorkIcon,
  Lock as VaultIcon,
  Psychology as MemoryIcon,
  People as PeopleIcon,
  AutoAwesome as AutomationsIcon,
  Settings as SettingsIcon,
  Computer as SystemIcon,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { createTheme as createMuiTheme } from '@mui/material/styles';

const geistFont = '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const theme = createMuiTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    secondary: { main: '#a855f7' },
    background: { default: '#0a0a0a', paper: '#111111' },
    divider: '#27272a',
    text: { primary: '#fafafa', secondary: '#a1a1aa' },
    action: { hover: 'rgba(255,255,255,0.04)', selected: 'rgba(99,102,241,0.12)' },
  },
  typography: {
    fontFamily: geistFont,
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, letterSpacing: '-0.01em' },
    body1: { fontWeight: 400, lineHeight: 1.6 },
    body2: { fontWeight: 400, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 8 },
  transitions: { duration: { shortest: 0, shorter: 0, short: 0, standard: 0, complex: 0 } },
  components: {
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: '#0a0a0a', borderRight: '1px solid #27272a' } } },
    MuiAppBar: { styleOverrides: { root: { backgroundColor: '#0a0a0a', borderBottom: '1px solid #27272a', boxShadow: 'none' } } },
    MuiListItem: { styleOverrides: { root: { borderRadius: 8, margin: '2px 8px' } } },
    MuiListItemIcon: { styleOverrides: { root: { minWidth: 40, color: '#a1a1aa' } } },
    MuiListItemText: { styleOverrides: { primary: { fontWeight: 400, fontSize: '0.875rem' } } },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

const DRAWER_WIDTH_COLLAPSED = 64;
const DRAWER_WIDTH_EXPANDED = 256;
const APP_BAR_HEIGHT = 64;

const navItems = [
  { key: 'home', label: 'Home', icon: HomeIcon, href: '/' },
  { key: 'chat', label: 'Chat', icon: ChatIcon, href: '/chat' },
  { key: 'work', label: 'Work', icon: WorkIcon, href: '/work' },
  { key: 'vault', label: 'Vault', icon: VaultIcon, href: '/vault' },
  { key: 'memory', label: 'Memory', icon: MemoryIcon, href: '/memory' },
  { key: 'people', label: 'People', icon: PeopleIcon, href: '/people' },
  { key: 'automations', label: 'Automations', icon: AutomationsIcon, href: '/automations' },
];

const bottomNavItems = [
  { key: 'settings', label: 'Settings', icon: SettingsIcon, href: '/settings' },
  { key: 'system', label: 'System', icon: SystemIcon, href: '/system' },
];

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  const drawerWidth = expanded ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED;

  const toggleDrawer = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setExpanded(!expanded);
    }
  };

  const NavLink = ({ icon: Icon, label, href, selected = false }: { icon: React.ComponentType<any>; label: string; href: string; selected?: boolean }) => (
    <ListItem
      component="a"
      href={href}
      sx={{
        px: 2,
        py: 1.5,
        mx: 1,
        my: 0.5,
        color: selected ? '#6366f1' : '#e4e4e7',
        '&:hover': { backgroundColor: selected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)' },
        '& .MuiListItemIcon-root': { color: selected ? '#6366f1' : '#a1a1aa' },
        transition: 'none',
        borderRadius: 8,
      }}
    >
      <ListItemIcon><Icon fontSize="medium" /></ListItemIcon>
      {expanded && <ListItemText primary={label} />}
    </ListItem>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              overflow: 'hidden',
              transition: isMobile ? 'width 0ms' : 'width 0ms',
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 1 }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, minHeight: 56 }}>
              <Box
                component="span"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography variant="h2" sx={{ fontSize: '1.125rem', color: '#fff', lineHeight: 1, fontWeight: 700 }}>
                  L
                </Typography>
              </Box>
              {expanded && (
                <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  LOGOS
                </Typography>
              )}
            </Box>

            <Divider sx={{ mx: 1, my: 1, borderColor: '#27272a' }} />

            <List sx={{ flex: 1, px: 0.5, py: 0.5, overflow: 'auto' }}>
              {navItems.map((item) => (
                <NavLink key={item.key} icon={item.icon} label={item.label} href={item.href} />
              ))}
            </List>

            <Divider sx={{ mx: 1, my: 1, borderColor: '#27272a' }} />

            <List sx={{ px: 0.5, py: 0.5 }}>
              {bottomNavItems.map((item) => (
                <NavLink key={item.key} icon={item.icon} label={item.label} href={item.href} />
              ))}
            </List>

            {expanded && !isMobile && (
              <Box sx={{ px: 2, pb: 2 }}>
                <IconButton
                  onClick={toggleDrawer}
                  sx={{ width: '100%', justifyContent: 'center', py: 1, color: '#71717a', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' } }}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              width: { md: `calc(100% - ${DRAWER_WIDTH_COLLAPSED}px)` },
              ml: { md: `${DRAWER_WIDTH_COLLAPSED}px` },
              height: APP_BAR_HEIGHT,
              zIndex: 1200,
              transition: 'none',
            }}
          >
            <Toolbar sx={{ px: 3, justifyContent: 'space-between', minHeight: APP_BAR_HEIGHT }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                  onClick={toggleDrawer}
                  edge="start"
                  color="inherit"
                  aria-label={isMobile ? 'Open menu' : expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                  sx={{ mr: 1, color: '#e4e4e7' }}
                >
                  {isMobile || expanded ? <MenuIcon /> : <ChevronRight />}
                </IconButton>
                {expanded && !isMobile && (
                  <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                    LOGOS
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" sx={{ color: '#a1a1aa', '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' } }} aria-label="Notifications">
                  <ExpandMore fontSize="medium" />
                </IconButton>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                    U
                  </Typography>
                </Box>
              </Box>
            </Toolbar>
          </AppBar>

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              pt: APP_BAR_HEIGHT,
              px: { md: 4, xs: 2 },
              pb: 4,
              width: { md: `calc(100% - ${DRAWER_WIDTH_COLLAPSED}px)` },
              ml: { md: `${DRAWER_WIDTH_COLLAPSED}px` },
              minHeight: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
              transition: 'none',
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}