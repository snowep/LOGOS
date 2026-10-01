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
  Link,
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
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { usePathname } from 'next/navigation';
import { layout } from '@/theme/tokens';
import { useThemeMode } from '@/theme/ThemeRegistry';

const DRAWER_WIDTH_COLLAPSED = layout.railCollapsed; // 64
const DRAWER_WIDTH_EXPANDED = layout.railExpanded;   // 248
const APP_BAR_HEIGHT = layout.topBarHeight;          // 56

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
  const pathname = usePathname();
  const { mode, toggleTheme } = useThemeMode();

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

  const NavLink = ({ icon: Icon, label, href }: { icon: React.ComponentType<any>; label: string; href: string }) => {
    const selected = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <ListItem
        component={Link}
        href={href}
        sx={{
          px: 2,
          py: 1.5,
          mx: 1,
          my: 0.5,
          color: selected ? 'primary.main' : 'text.secondary',
          '&:hover': { backgroundColor: selected ? 'action.selected' : 'action.hover' },
          '& .MuiListItemIcon-root': { color: selected ? 'primary.main' : 'text.secondary' },
          transition: 'background-color 0.15s ease',
          borderRadius: 2,
        }}
      >
        <ListItemIcon><Icon fontSize="medium" /></ListItemIcon>
        {expanded && <ListItemText primary={label} />}
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
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
            backgroundColor: 'background.default',
            borderRight: '1px solid',
            borderColor: 'divider',
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
                borderRadius: 2,
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="h2" sx={{ fontSize: '1.125rem', color: 'primary.contrastText', lineHeight: 1, fontWeight: 700 }}>
                L
              </Typography>
            </Box>
            {expanded && (
              <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                LOGOS
              </Typography>
            )}
          </Box>

          <Divider sx={{ mx: 1, my: 1 }} />

          <List sx={{ flex: 1, px: 0.5, py: 0.5, overflow: 'auto' }}>
            {navItems.map((item) => (
              <NavLink key={item.key} icon={item.icon} label={item.label} href={item.href} />
            ))}
          </List>

          <Divider sx={{ mx: 1, my: 1 }} />

          <List sx={{ px: 0.5, py: 0.5 }}>
            {bottomNavItems.map((item) => (
              <NavLink key={item.key} icon={item.icon} label={item.label} href={item.href} />
            ))}
          </List>

          {expanded && !isMobile && (
            <Box sx={{ px: 2, pb: 2 }}>
              <IconButton
                onClick={toggleDrawer}
                sx={{ width: '100%', justifyContent: 'center', py: 1, color: 'text.secondary', '&:hover': { backgroundColor: 'action.hover' } }}
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
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            height: APP_BAR_HEIGHT,
            zIndex: (theme.zIndex.drawer as number) + 1,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar sx={{ px: { md: 4, xs: 2 }, justifyContent: 'space-between', minHeight: APP_BAR_HEIGHT }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={toggleDrawer}
                edge="start"
                color="inherit"
                aria-label={isMobile ? 'Open menu' : expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                sx={{ mr: 1, color: 'text.secondary' }}
              >
                {isMobile || expanded ? <MenuIcon /> : <ChevronRight />}
              </IconButton>
              {expanded && !isMobile && (
                <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
                  LOGOS
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={toggleTheme}
                sx={{ color: 'text.secondary', '&:hover': { backgroundColor: 'action.hover' } }}
                aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {mode === 'dark' ? <LightModeIcon fontSize="medium" /> : <DarkModeIcon fontSize="medium" />}
              </IconButton>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'primary.contrastText' }}>
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
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            minHeight: `calc(100vh - ${APP_BAR_HEIGHT}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            maxWidth: { md: `calc(${layout.contentMaxWidth}px + ${layout.pagePadding * 2}px)` },
            mx: { md: 'auto' },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}