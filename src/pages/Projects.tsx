import { useState } from 'react'
import { Plus, GitBranch, Grid3X3, List } from 'lucide-react'

type Project = {
  id: string; name: string; description: string; status: 'Active' | 'Paused' | 'Completed'
  progress: number; repo: string; agents: string[]; tasksTotal: number; tasksDone: number; updated: string
}

const PROJECTS: Project[] = [
  { id: '1', name: 'AI-ChatBot Dashboard', description: 'Multi-agent chat dashboard with D1 persistence and Great Halls', status: 'Active', progress: 75, repo: 'AI-ChatBot', agents: ['Claude Code', 'opencode', 'Claude Sonnet 4.6'], tasksTotal: 24, tasksDone: 18, updated: '2h ago' },
  { id: '2', name: 'API Rate Limiter', description: 'Distributed rate limiting middleware for all public endpoints', status: 'Active', progress: 45, repo: 'rate-limiter', agents: ['GPT-5.5', 'Claude Opus 4.8'], tasksTotal: 12, tasksDone: 5, updated: '1d ago' },
  { id: '3', name: 'Database Migration', description: 'Migrate legacy data from SQLite to PostgreSQL', status: 'Completed', progress: 100, repo: 'db-migration', agents: ['Claude Code'], tasksTotal: 10, tasksDone: 10, updated: '3d ago' },
  { id: '4', name: 'Design System Audit', description: 'Review and standardize all UI components', status: 'Paused', progress: 30, repo: 'design-system', agents: ['opencode', 'Claude Opus 4.7'], tasksTotal: 15, tasksDone: 4, updated: '5d ago' },
]

const STATUS_COLORS = { Active: '#22C55E', Paused: '#D97706', Completed: '#9CA3AF' } as const

export default function ProjectsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5">
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Projects</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-[#F3F4F6] text-[#2878D9]' : 'text-[#9CA3AF]'}`}><Grid3X3 size={16} /></button>
            <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-[#F3F4F6] text-[#2878D9]' : 'text-[#9CA3AF]'}`}><List size={16} /></button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2878D9] text-white rounded-lg text-xs font-medium hover:bg-[#1D5FA8]"><Plus size={14} />New Project</button>
        </div>
      </div>

      <div className={`px-8 pb-6 ${view === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}`}>
        {PROJECTS.map(p => (
          <div key={p.id} className="bg-white rounded-lg border border-[#E5E7EB] p-5 cursor-pointer hover:border-[#D1D5DB] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#111827]">{p.name}</h3>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    p.status === 'Active' ? 'bg-[#D1FAE5] text-[#065F46]' :
                    p.status === 'Paused' ? 'bg-[#FFF7ED] text-[#9A3412]' :
                    'bg-[#F3F4F6] text-[#6B7280]'
                  }`}>{p.status}</span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">{p.description}</p>
              </div>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                <span>Progress</span>
                <span>{p.progress}%</span>
              </div>
              <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, backgroundColor: STATUS_COLORS[p.status] }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch size={13} className="text-[#9CA3AF]" />
                <span className="text-xs text-[#6B7280]">{p.repo}</span>
                <div className="flex -space-x-1.5 ml-1">
                  {p.agents.slice(0, 3).map((a, i) => (
                    <div key={i} className="w-5 h-5 rounded-full bg-[#E5E7EB] border border-white flex items-center justify-center text-[7px] font-medium text-[#6B7280]">{a.split(' ').slice(-2).map(s => s[0]).join('')}</div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                <span>{p.tasksDone}/{p.tasksTotal} tasks</span>
                <span>{p.updated}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
