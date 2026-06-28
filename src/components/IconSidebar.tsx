import { Search, Inbox, House, Ticket, AudioLines, Calendar, MessageCircle, BarChart3, Building2, FolderKanban, Settings, CircleHelp } from 'lucide-react'
import type { PageName } from '../types'

type IconItem = { icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; page: PageName; label: string }

const topIcons: IconItem[] = [
  { icon: House, page: 'dashboard', label: 'Dashboard' },
  { icon: MessageCircle, page: 'chat', label: 'Chat' },
  { icon: Calendar, page: 'calendar', label: 'Calendar' },
  { icon: Inbox, page: 'inbox', label: 'Inbox' },
  { icon: Ticket, page: 'tasks', label: 'Tasks' },
  { icon: AudioLines, page: 'voice', label: 'OpenJarvis' },
  { icon: Search, page: 'search', label: 'Search' },
  { icon: BarChart3, page: 'analytics', label: 'Analytics' },
  { icon: Building2, page: 'projects', label: 'Projects' },
  { icon: FolderKanban, page: 'files', label: 'Files' },
]

const bottomIcons: IconItem[] = [
  { icon: Settings, page: 'settings', label: 'Settings' },
  { icon: CircleHelp, page: 'help', label: 'Help' },
]

export default function IconSidebar({ activePage, onPageChange }: { activePage: PageName; onPageChange: (p: PageName) => void }) {
  return (
    <div className="w-[52px] flex-shrink-0 bg-white border-r border-[#ECECEC] flex flex-col items-center py-3 justify-between">
      <div className="flex flex-col items-center gap-5">
        {topIcons.map(({ icon: Icon, page, label }) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`cursor-pointer relative group ${activePage === page ? 'text-[#2878D9]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}
            title={label}
          >
            <Icon size={20} strokeWidth={1.8} />
            {activePage === page && <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#2878D9] rounded-full" />}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center gap-5">
        {bottomIcons.map(({ icon: Icon, page, label }) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`cursor-pointer relative group ${activePage === page ? 'text-[#2878D9]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}
            title={label}
          >
            <Icon size={20} strokeWidth={1.8} />
            {activePage === page && <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#2878D9] rounded-full" />}
          </button>
        ))}
        <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-semibold text-[#111827] cursor-pointer hover:bg-[#D1D5DB]">U</div>
      </div>
    </div>
  )
}
