import { useState } from 'react'
import type { PageName } from './types'
import IconSidebar from './components/IconSidebar'
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
  const [activePage, setActivePage] = useState<PageName>('chat')

  const PageComponent = PAGE_COMPONENTS[activePage]

  return (
    <div className="h-full flex bg-[#FAFAFA] font-['Inter',sans-serif]">
      <IconSidebar activePage={activePage} onPageChange={setActivePage} />
      <PageComponent />
    </div>
  )
}
