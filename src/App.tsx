import { useState, useEffect } from 'react'
import type { PageName } from './types'
import IconSidebar from './components/IconSidebar'
import SplashScreen from './components/SplashScreen'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import CalendarPage from './pages/Calendar'
import WeatherPage from './pages/Weather'
import InboxPage from './pages/Inbox'
import TasksPage from './pages/Tasks'
import VoicePage from './pages/Voice'
import SearchPage from './pages/Search'
import AnalyticsPage from './pages/Analytics'
import ProjectsPage from './pages/Projects'
import FilesPage from './pages/Files'
import SettingsPage from './pages/Settings'
import HelpPage from './pages/Help'

const PAGE_COMPONENTS: Record<PageName, React.ComponentType> = {
  dashboard: Dashboard,
  chat: Chat,
  calendar: CalendarPage,
  weather: WeatherPage,
  inbox: InboxPage,
  tasks: TasksPage,
  voice: VoicePage,
  search: SearchPage,
  analytics: AnalyticsPage,
  projects: ProjectsPage,
  files: FilesPage,
  settings: SettingsPage,
  help: HelpPage,
}

export default function App() {
  const [activePage, setActivePage] = useState<PageName>('dashboard')
  const [splashDone, setSplashDone] = useState(false)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 1300)
    return () => clearTimeout(t)
  }, [])

  const PageComponent = PAGE_COMPONENTS[activePage]

  return (
    <>
      <div
        className="h-full flex bg-[#FAFAFA] font-['Inter',sans-serif]"
        style={{
          opacity: appReady ? 1 : 0,
          transform: appReady ? 'scale(1)' : 'scale(0.92)',
          transition: appReady ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
        }}
      >
        <IconSidebar activePage={activePage} onPageChange={setActivePage} />
        <PageComponent />
      </div>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
    </>
  )
}
