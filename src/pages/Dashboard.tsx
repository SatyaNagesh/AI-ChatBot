import { useState, useEffect } from 'react'
import { Search, MessageCircle, BarChart3, Terminal, CheckSquare, Sparkles, Star, GitBranch, ExternalLink } from 'lucide-react'
import { AGENTS_DATA, DB_API } from '../data/agents'
import type { Session } from '../types'
import { getInitials } from '../utils/helpers'

const STATS = [
  { label: 'Total Sessions', value: '23', color: '#2878D9' },
  { label: 'Active Agents', value: '11', color: '#22C55E' },
  { label: 'Projects In Progress', value: '3', color: '#D97706' },
  { label: 'Storage Used', value: '2.4 GB / 10 GB', color: '#8B5CF6', bar: true, pct: 24 },
]

const ACTIVITIES = [
  { agent: 'Claude Code', text: 'Deployed API v2.3 to production', time: '2m ago', status: 'done' as const },
  { agent: 'opencode', text: 'Analyzed codebase for optimization', time: '15m ago', status: 'done' as const },
  { agent: 'GPT-5.5', text: 'Generated unit tests for auth module', time: '1h ago', status: 'done' as const },
  { agent: 'Claude Opus 4.8', text: 'Reviewing architecture proposal', time: '2h ago', status: 'doing' as const },
  { agent: 'Gemini 3.1 Pro', text: 'Researching competitor landscape', time: '3h ago', status: 'pending' as const },
]

const REPOS = [
  { name: 'AI-ChatBot', lang: 'TypeScript', langColor: '#3178C6', stars: 12, updated: '2h ago' },
  { name: 'db-worker', lang: 'JavaScript', langColor: '#F7DF1E', stars: 8, updated: '1d ago' },
  { name: 'docs-site', lang: 'MDX', langColor: '#FCB32C', stars: 5, updated: '3d ago' },
]

const ACTIONS = [
  { icon: MessageCircle, label: 'New Chat', page: 'chat' },
  { icon: CheckSquare, label: 'Create Task', page: 'tasks' },
  { icon: BarChart3, label: 'View Analytics', page: 'analytics' },
  { icon: Terminal, label: 'Run Terminal', page: 'voice' },
]

const NEXT_STEPS = [
  'Review Claude Code\'s latest PR on auth module',
  'Check Gemini 3.1 Pro\'s research analysis',
  'Update project roadmap for Q3',
]

export default function Dashboard() {
  const [allSessions, setAllSessions] = useState<Session[]>([])

  useEffect(() => {
    Promise.all(
      AGENTS_DATA.map(a =>
        fetch(`${DB_API}/sessions?agent=${encodeURIComponent(a.name)}`)
          .then(r => r.json()).catch(() => [])
      )
    ).then(results => {
      const flat = results.flat().filter(Boolean).slice(0, 5)
      setAllSessions(flat)
    })
  }, [])

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Home</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Your AI command center summary</p>
        </div>
        <div className="relative w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none" placeholder="Search..." />
        </div>
      </div>

      <div className="mx-8 mb-6 bg-gradient-to-r from-[#EBF4FF] to-white rounded-xl border border-[#E5E7EB] p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Good morning, User</h2>
          <p className="text-sm text-[#6B7280] mt-1">Here's your AI command center summary for today.</p>
        </div>
        <Sparkles size={28} className="text-[#2878D9] opacity-60" />
      </div>

      <div className="grid grid-cols-4 gap-4 mx-8 mb-6">
        {STATS.map((s, i) => (
          <div key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-[#6B7280]">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold text-[#111827]">{s.value}</p>
            {s.bar && (
              <div className="mt-2 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 mx-8 flex-1">
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">Recent Activity</h3>
              <button className="text-xs text-[#2878D9] font-medium hover:underline">View All</button>
            </div>
            <div className="divide-y divide-[#F3F4F6]">
              {ACTIVITIES.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'done' ? 'bg-[#22C55E]' : a.status === 'doing' ? 'bg-[#2878D9] animate-pulse' : 'bg-[#D1D5DB]'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111827]"><span className="font-medium">{a.agent}</span> — {a.text}</p>
                    <p className="text-xs text-[#9CA3AF]">{a.time}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    a.status === 'done' ? 'bg-[#D1FAE5] text-[#065F46]' :
                    a.status === 'doing' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                    'bg-[#F3F4F6] text-[#6B7280]'
                  }`}>{a.status === 'done' ? 'Done' : a.status === 'doing' ? 'Doing' : 'Pending'}</span>
                </div>
              ))}
            </div>
          </div>

          {allSessions.length > 0 && (
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Continue Where You Left Off</h3>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {allSessions.map(s => (
                  <div key={s.id} className="min-w-[180px] bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] p-3 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[8px] font-medium text-[#6B7280]">{getInitials(s.name)}</div>
                      <span className="text-xs font-medium text-[#111827] truncate">{s.name}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] line-clamp-2">{s.preview || 'No messages yet'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">Recent Repos</h3>
              <GitBranch size={14} className="text-[#9CA3AF]" />
            </div>
            <div className="divide-y divide-[#F3F4F6]">
              {REPOS.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.langColor }} />
                    <span className="text-sm text-[#111827]">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-[#6B7280]"><Star size={12} />{r.stars}</div>
                    <span className="text-xs text-[#9CA3AF]">{r.updated}</span>
                    <ExternalLink size={12} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-[#F3F4F6]">
              <button className="flex items-center gap-1 text-xs text-[#2878D9] font-medium hover:underline"><GitBranch size={12} /> Connect GitHub</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ACTIONS.map((a, i) => {
              const Icon = a.icon
              return (
                <button key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex flex-col items-center gap-2 hover:border-[#2878D9] hover:shadow-sm transition-all cursor-pointer">
                  <Icon size={22} className="text-[#2878D9]" />
                  <span className="text-xs font-medium text-[#6B7280]">{a.label}</span>
                </button>
              )
            })}
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Suggested Next Steps</h3>
            <div className="space-y-2.5">
              {NEXT_STEPS.map((step, i) => (
                <label key={i} className="flex items-start gap-2.5 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 border-[#D1D5DB] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-[#6B7280] leading-snug">{step}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </div>
  )
}
