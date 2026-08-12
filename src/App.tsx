import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from './app/hooks'
import EventsView from './features/events/EventsView'
import { fetchSettings } from './features/settings/settingsSlice'
import SettingsView from './features/settings/SettingsView'

type AppTab = 'events' | 'settings'

function AppContent() {
  const dispatch = useAppDispatch()
  const settingsStatus = useAppSelector((state) => state.settings.loadStatus)
  const [activeTab, setActiveTab] = useState<AppTab>('events')
  const [settingsDirty, setSettingsDirty] = useState(false)

  useEffect(() => {
    if (settingsStatus === 'idle') void dispatch(fetchSettings())
  }, [dispatch, settingsStatus])

  const handleTabChange = (_: React.SyntheticEvent, nextTab: AppTab) => {
    if (
      activeTab === 'settings' &&
      nextTab !== 'settings' &&
      settingsDirty &&
      !window.confirm('Discard your unsaved settings changes?')
    ) {
      return
    }
    setActiveTab(nextTab)
  }

  const handleDirtyChange = useCallback((dirty: boolean) => setSettingsDirty(dirty), [])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ flexWrap: 'wrap' }}>
            <Typography variant="h6" component="div" sx={{ mr: { xs: 2, sm: 5 }, py: 1 }}>
              See Tickets
            </Typography>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="Application sections">
              <Tab value="events" label="Events" />
              <Tab value="settings" label="Settings" />
            </Tabs>
          </Toolbar>
        </Container>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {activeTab === 'events' ? (
          <EventsView />
        ) : (
          <SettingsView onDirtyChange={handleDirtyChange} />
        )}
      </Container>
    </Box>
  )
}

function App() {
  const selectedTheme = useAppSelector((state) => state.settings.data?.settings.theme ?? 'dark')
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: selectedTheme },
        shape: { borderRadius: 10 },
        typography: { fontFamily: 'Inter, system-ui, sans-serif' },
      }),
    [selectedTheme],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  )
}

export default App
