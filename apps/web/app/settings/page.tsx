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
} from '@mui/icons-material';

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
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
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
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Dark mode"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="High contrast"
                  />
                  <Slider
                    defaultValue={30}
                    sx={{ mt: 1 }}
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Font size
                  </Typography>
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
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Enable notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Play sound for notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Show preview in lock screen"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Notification grouping
                  </Typography>
                  <RadioGroup
                    row
                    value="none"
                    onChange={(_) => {}}
                  >
                    <FormControlLabel value="none" control={<Radio />} label="None" />
                    <FormControlLabel value="byApp" control={<Radio />} label="By app" />
                    <FormControlLabel value="byTime" control={<Radio />} label="By time" />
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
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Match system language"
                  />
                  <FormControl sx={{ mt: 1 }}>
                    <InputLabel id="language-select-label">Language</InputLabel>
                    <Select
                      labelId="language-select-label"
                      id="language-select"
                      value="en-US"
                      label="Language"
                      onChange={(_) => {}}
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
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Right-to-left layout"
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
                  <TextField
                    label="Vault path"
                    placeholder="D:\\Project\\LOGOS\\storage\\workspace\\vault"
                    value="D:\\Project\\LOGOS\\storage\\workspace\\vault"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    label="Sync interval (seconds)"
                    type="number"
                    value="30"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Auto-start on login"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Run as administrator"
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
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Allow clipboard access"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Allow screen capture"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Allow file system access"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Allow network access"
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    API key for external services
                  </Typography>
                  <TextField
                    label="API key"
                    type="password"
                    sx={{ mb: 2 }}
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
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Save chat history"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={true}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Learn from interactions"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Share anonymized usage data"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Retain memory for (days)
                  </Typography>
                  <Slider
                    defaultValue={90}
                    sx={{ mt: 1 }}
                    valueLabelDisplay="auto"
                  />
                  <Button variant="outlined" size="small" sx={{ mt: 2 }}>
                    Clear all memory
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
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Enable automation engine"
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Triggers
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="On startup" sx={{ bgcolor: 'primary.light', color: 'primary.dark' }} />
                    <Chip label="File change" sx={{ bgcolor: 'primary.light', color: 'primary.dark' }} />
                    <Chip label="Time-based" sx={{ bgcolor: 'primary.light', color: 'primary.dark' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    Actions
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip label="Send email" sx={{ bgcolor: 'primary.light', color: 'primary.dark' }} />
                    <Chip label="Create task" sx={{ bgcolor: 'primary.light', color: 'primary.dark' }} />
                    <Chip label="Log activity" sx={{ bgcolor: 'primary.light', color: 'primary.dark' }} />
                  </Box>
                  <Button variant="contained" size="small" sx={{ mt: 2 }}>
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
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="GitHub"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Google Drive"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Slack"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={false}
                        onChange={(_) => {}}
                        color="primary"
                      />
                    }
                    label="Microsoft Outlook"
                  />
                  <Button variant="outlined" size="small" sx={{ mt: 2 }}>
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
                  Log level
                </Typography>
                <RadioGroup
                  row
                  value="info"
                  onChange={(_) => {}}
                >
                  <FormControlLabel value="debug" control={<Radio />} label="Debug" />
                  <FormControlLabel value="info" control={<Radio />} label="Info" />
                  <FormControlLabel value="warn" control={<Radio />} label="Warn" />
                  <FormControlLabel value="error" control={<Radio />} label="Error" />
                </RadioGroup>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                  Experimental features
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={false}
                      onChange={(_) => {}}
                      color="primary"
                    />
                  }
                  label="Enable experimental model providers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={false}
                      onChange={(_) => {}}
                      color="primary"
                    />
                  }
                  label="Enable debug console"
                />
                <Button variant="outlined" size="small" sx={{ mt: 2 }}>
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