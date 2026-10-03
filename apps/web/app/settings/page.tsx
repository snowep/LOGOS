"use client";

import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Stack,
  Switch,
  FormControlLabel,
  RadioGroup,
  FormControl,
  Radio,
  Slider,
  TextField,
  Select,
  MenuItem,
  Chip,
  Button,
  InputLabel,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Brightness6,
  Notifications,
  Language,
  Work,
  Security,
  Memory,
  AutoAwesome,
  Hub,
  Settings,
  ExpandMore,
  ChevronRight,
  Info as InfoIcon,
  Block,
} from '@mui/icons-material';
import { useThemeMode } from '@/theme/ThemeRegistry';

export default function SettingsPage() {
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);
  const [memoryExpanded, setMemoryExpanded] = useState(false);
  const [automationExpanded, setAutomationExpanded] = useState(false);
  const [integrationsExpanded, setIntegrationsExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  
  const { mode, toggleTheme, setMode } = useThemeMode();

  const toggleAppearance = () => setAppearanceExpanded(!appearanceExpanded);
  const toggleNotifications = () => setNotificationsExpanded(!notificationsExpanded);
  const toggleLanguage = () => setLanguageExpanded(!languageExpanded);
  const toggleWorkspace = () => setWorkspaceExpanded(!workspaceExpanded);
  const togglePermissions = () => setPermissionsExpanded(!permissionsExpanded);
  const toggleMemory = () => setMemoryExpanded(!memoryExpanded);
  const toggleAutomation = () => setAutomationExpanded(!automationExpanded);
  const toggleIntegrations = () => setIntegrationsExpanded(!integrationsExpanded);
  const toggleAdvanced = () => setAdvancedExpanded(!advancedExpanded);

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto', minHeight: 'calc(100dvh - 56px)' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Divider sx={{ my: 3 }} />
      <Grid container spacing={3}>
        {/* Appearance */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <Brightness6 fontSize="medium" />
                </Box>
              }
              title="Appearance"
              subheader="Theme, colors, and visual settings"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={toggleAppearance} aria-label="expand appearance">
                    {appearanceExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {appearanceExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mode === 'dark'}
                        onChange={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                        color="primary"
                      />
                    }
                    label="Dark mode"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="High contrast (coming soon)"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Font size (coming soon)
                  </Typography>
                  <Slider
                    defaultValue={30}
                    disabled
                    sx={{ mt: 1 }}
                    valueLabelDisplay="auto"
                  />
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
        {/* Notifications */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <Notifications fontSize="medium" />
                </Box>
              }
              title="Notifications"
              subheader="Alerts, sounds, and notification preferences"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={toggleNotifications} aria-label="expand notifications">
                    {notificationsExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {notificationsExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Enable notifications (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Play sound for notifications (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Show preview in lock screen (coming soon)"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Notification grouping (coming soon)
                  </Typography>
                  <RadioGroup
                    row
                    value="none"
                    onChange={() => {}}
                  >
                    <FormControlLabel value="none" control={<Radio disabled />} label="None" />
                    <FormControlLabel value="byApp" control={<Radio disabled />} label="By app" />
                    <FormControlLabel value="byTime" control={<Radio disabled />} label="By time" />
                  </RadioGroup>
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
        {/* Language */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <Language fontSize="medium" />
                </Box>
              }
              title="Language"
              subheader="Interface language and regional settings"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={toggleLanguage} aria-label="expand language">
                    {languageExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {languageExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Match system language (coming soon)"
                  />
                  <FormControl sx={{ mt: 1 }}>
                    <InputLabel id="language-select-label">Language</InputLabel>
                    <Select
                      labelId="language-select-label"
                      id="language-select"
                      value="en-US"
                      label="Language"
                      onChange={() => {}}
                      disabled
                    >
                      <MenuItem value={"en-US"}>English (US)</MenuItem>
                      <MenuItem value={"es-ES"}>Español (España)</MenuItem>
                      <MenuItem value={"fr-FR"}>Français (France)</MenuItem>
                      <MenuItem value={"de-DE"}>Deutsch (Deutschland)</MenuItem>
                      <MenuItem value={"ja-JP"}>日本語 (日本)</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Right-to-left layout (coming soon)"
                  />
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
        {/* Workspace */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <Work fontSize="medium" />
                </Box>
              }
              title="Workspace"
              subheader="File paths, storage, and workspace behavior"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={toggleWorkspace} aria-label="expand workspace">
                    {workspaceExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {workspaceExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <Alert severity="info" sx={{ mb: 1 }}>
                    <AlertTitle>Note</AlertTitle>
                    Workspace configuration is managed via environment variables on the server. These settings are read-only in the UI.
                  </Alert>
                  <TextField
                    label="Vault path"
                    placeholder="Configured via LOGOS_WORKSPACE_ROOT"
                    value="Set via LOGOS_WORKSPACE_ROOT environment variable"
                    slotProps={{ input: { readOnly: true } }}
                    helperText="Change this in your server environment configuration"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Sync interval (seconds)"
                    type="number"
                    value="30"
                    slotProps={{ input: { readOnly: true } }}
                    helperText="Configured via server environment"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Auto-start on login (OS-level, not configurable here)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Run as administrator (OS-level, not configurable here)"
                  />
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
        {/* Permissions */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <Security fontSize="medium" />
                </Box>
              }
              title="Permissions"
              subheader="Access controls and security settings"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={togglePermissions} aria-label="expand permissions">
                    {permissionsExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {permissionsExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Allow clipboard access (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Allow screen capture (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Allow file system access (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Allow network access (coming soon)"
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    API key for external services
                  </Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <AlertTitle>API Keys</AlertTitle>
                    API key management is not yet implemented. Configure API keys via server environment variables.
                  </Alert>
                  <TextField
                    label="API key"
                    type="password"
                    disabled
                    sx={{ mb: 2 }}
                    helperText="Not yet implemented"
                  />
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
        {/* Memory behavior */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <Memory fontSize="medium" />
                </Box>
              }
              title="Memory behavior"
              subheader="How LOGOS stores and uses your information"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={toggleMemory} aria-label="expand memory">
                    {memoryExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {memoryExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Save chat history (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Learn from interactions (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Share anonymized usage data (coming soon)"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Retain memory for (days) (coming soon)
                  </Typography>
                  <Slider
                    defaultValue={90}
                    disabled
                    sx={{ mt: 1 }}
                    valueLabelDisplay="auto"
                  />
                  <Button variant="outlined" size="small" sx={{ mt: 2 }} disabled>
                    Clear all memory (coming soon)
                  </Button>
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
        {/* Automation */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <AutoAwesome fontSize="medium" />
                </Box>
              }
              title="Automation"
              subheader="Workflows, triggers, and automated tasks"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={toggleAutomation} aria-label="expand automation">
                    {automationExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {automationExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Enable automation engine (coming soon)"
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Triggers (coming soon)
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="On startup" disabled variant="outlined" />
                    <Chip label="File change" disabled variant="outlined" />
                    <Chip label="Time-based" disabled variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Actions (coming soon)
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="Send email" disabled variant="outlined" />
                    <Chip label="Create task" disabled variant="outlined" />
                    <Chip label="Log activity" disabled variant="outlined" />
                  </Box>
                  <Button variant="contained" size="small" sx={{ mt: 2 }} disabled>
                    Create new automation
                  </Button>
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
        {/* Integrations */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 } }}>
            <CardHeader
              avatar={
                <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                  <Hub fontSize="medium" />
                </Box>
              }
              title="Integrations"
              subheader="Connect to other apps and services"
              action={
                <Tooltip title="Expand">
                  <IconButton size="small" onClick={toggleIntegrations} aria-label="expand integrations">
                    {integrationsExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                </Tooltip>
              }
            />
            {integrationsExpanded && (
              <CardContent sx={{ pt: 0 }}>
                <Stack spacing={2}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <AlertTitle>Integrations</AlertTitle>
                    Third-party integrations are not yet implemented. This section will be available when the automation/backend APIs are ready.
                  </Alert>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="GitHub (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Google Drive (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Slack (coming soon)"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={() => {}}
                        disabled
                        color="primary"
                      />
                    }
                    label="Microsoft Outlook (coming soon)"
                  />
                  <Button variant="outlined" size="small" sx={{ mt: 2 }} disabled>
                    Add integration
                  </Button>
                </Stack>
              </CardContent>
            )}
          </Card>
        </Grid>
      </Grid>
      <Divider sx={{ my: 4 }} />
      <Box>
        <Card>
          <CardHeader
            avatar={
              <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, borderRadius: 1 }}>
                <Settings fontSize="medium" />
              </Box>
            }
            title="Advanced / Developer Settings"
            subheader="Technical environment and system configuration"
            action={
              <Tooltip title="Expand">
                <IconButton size="small" onClick={toggleAdvanced} aria-label="expand advanced">
                  {advancedExpanded ? <ExpandMore /> : <ChevronRight />}
                </IconButton>
              </Tooltip>
            }
          />
          {advancedExpanded && (
            <CardContent sx={{ pt: 0 }}>
              <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  API endpoint
                </Typography>
                <TextField
                  label="API URL"
                  value={process.env.NEXT_PUBLIC_API_URL ?? '/api (proxied)'}
                  slotProps={{ input: { readOnly: true } }}
                  helperText="Configured via LOGOS_API_URL on the server. Change it in System, not here."
                  sx={{ mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  Log level (server-side only)
                </Typography>
                <FormControl disabled>
                  <RadioGroup
                    row
                    value="info"
                    onChange={() => {}}
                  >
                    <FormControlLabel value="debug" control={<Radio />} label="Debug" />
                    <FormControlLabel value="info" control={<Radio />} label="Info" />
                    <FormControlLabel value="warn" control={<Radio />} label="Warn" />
                    <FormControlLabel value="error" control={<Radio />} label="Error" />
                  </RadioGroup>
                </FormControl>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  Experimental features
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={false}
                      onChange={() => {}}
                      disabled
                      color="primary"
                    />
                  }
                  label="Enable experimental model providers (coming soon)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={false}
                      onChange={() => {}}
                      disabled
                      color="primary"
                    />
                  }
                  label="Enable debug console (coming soon)"
                />
                <Button variant="outlined" size="small" sx={{ mt: 2 }} disabled>
                  Reset to defaults
                </Button>
              </Stack>
            </CardContent>
          )}
        </Card>
      </Box>
    </Box>
  );
}