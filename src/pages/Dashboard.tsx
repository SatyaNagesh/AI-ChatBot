import { useState, useEffect } from 'react'
import { ListTodo, CheckCircle2, BarChart3, AlertCircle, MessageCircle, Calendar, CloudSun, Terminal } from 'lucide-react'
import { AGENTS_DATA, DB_API } from '../data/agents'
import type { Session } from '../types'
import { getInitials } from '../utils/helpers'

type Task = {
  id: string; title: string; description: string; priority: string
  dueDate: string; createdAt: string; project?: string
}

type Column = 'To Do' | 'In Progress' | 'In Review' | 'Done'

const COLUMNS: Column[] = ['To Do', 'In Progress', 'In Review', 'Done']
const STORAGE_KEY = 'ai-chatbot-tasks'

function loadTasks(): Record<Column, Task[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const valid = { 'To Do': [], 'In Progress': [], 'In Review': [], 'Done': [] } as Record<Column, Task[]>
      for (const col of COLUMNS) {
        if (Array.isArray(parsed[col])) valid[col] = parsed[col].filter((t: any) => t && typeof t.id === 'string')
      }
      return valid
    }
  } catch {}
  return { 'To Do': [], 'In Progress': [], 'In Review': [], 'Done': [] }
}

function isOverdue(dateStr: string) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

const QUICK_ACTIONS = [
  { icon: MessageCircle, label: 'Chat', page: 'chat' },
  { icon: ListTodo, label: 'Tasks', page: 'tasks' },
  { icon: Calendar, label: 'Calendar', page: 'calendar' },
  { icon: CloudSun, label: 'Weather', page: 'weather' },
  { icon: Terminal, label: 'Voice', page: 'voice' },
]

export default function Dashboard() {
  const [tasks, setTasks] = useState<Record<Column, Task[]>>({ 'To Do': [], 'In Progress': [], 'In Review': [], 'Done': [] })
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    setTasks(loadTasks())
    const handler = () => setTasks(loadTasks())
    window.addEventListener('tasks-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('tasks-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  useEffect(() => {
    Promise.all(
      AGENTS_DATA.map(a =>
        fetch(`${DB_API}/sessions?agent=${encodeURIComponent(a.name)}`)
          .then(r => r.json()).catch(() => [])
      )
    ).then(results => {
      setSessions(results.flat().filter(Boolean).slice(0, 6))
    })
  }, [])

  const allTasks = COLUMNS.flatMap(col => tasks[col])
  const totalTasks = allTasks.length
  const doneCount = tasks['Done'].length
  const inProgressCount = tasks['In Progress'].length + tasks['In Review'].length
  const pctDone = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0
  const overdueHigh = allTasks.filter(t => t.priority === 'High' && isOverdue(t.dueDate) && t.dueDate)

  const projectMap: Record<string, { done: number; total: number }> = {}
  for (const t of allTasks) {
    const p = t.project || 'Uncategorized'
    if (!projectMap[p]) projectMap[p] = { done: 0, total: 0 }
    projectMap[p].total++
    if (tasks['Done'].some(d => d.id === t.id)) projectMap[p].done++
  }
  const projects = Object.entries(projectMap).sort((a, b) => b[1].total - a[1].total)

  const inProgressTasks = tasks['In Progress'].slice(0, 4)

  const statCards = [
    { label: 'Total Tasks', value: totalTasks, color: '#2878D9', bg: '#EBF4FF' },
    { label: 'Completed', value: `${pctDone}%`, color: '#22C55E', bg: '#D1FAE5' },
    { label: 'In Progress', value: inProgressCount, color: '#D97706', bg: '#FFF7ED' },
    { label: 'Overdue', value: overdueHigh.length, color: '#DC2626', bg: '#FEE2E2' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        {totalTasks > 0 && (
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#22C55E]" />{doneCount}</span>
            <span className="text-[#E5E7EB]">/</span>
            <span>{totalTasks} tasks</span>
          </div>
        )}
      </div>

      <div className="px-8 pb-8 space-y-5">
        {/* Stat cards row */}
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-3xl font-semibold text-[#111827] tracking-tight">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Middle row: Projects (wide) + Activity (narrow) */}
        <div className="grid grid-cols-3 gap-5">
          {/* Project Progress - spans 2 cols */}
          <div className="col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111827] flex items-center gap-2">
                <BarChart3 size={15} className="text-[#2878D9]" />
                Project Progress
              </h3>
              {totalTasks > 0 && (
                <span className="text-[11px] text-[#6B7280]">{projects.length} projects</span>
              )}
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-8">No tasks yet — create some on the Tasks page</p>
            ) : (
              <div className="space-y-4">
                {projects.map(([name, data]) => {
                  const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-[#111827]">{name}</span>
                        <span className="text-[11px] text-[#6B7280]">{data.done}/{data.total}</span>
                      </div>
                      <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#22C55E' : pct >= 50 ? '#D97706' : '#2878D9' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* In Progress Now - spans 1 col */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
              Active Now
            </h3>
            {inProgressTasks.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-6">No active tasks</p>
            ) : (
              <div className="space-y-2">
                {inProgressTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 py-2 border-b border-[#F3F4F6] last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2878D9] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#111827] truncate font-medium">{t.title}</p>
                      {t.project && <p className="text-[11px] text-[#9CA3AF]">{t.project}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Sessions (wide) + Quick Actions (narrow) */}
        <div className="grid grid-cols-3 gap-5">
          {/* Continue Where You Left Off - spans 2 cols */}
          <div className="col-span-2 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111827]">Continue Where You Left Off</h3>
              {sessions.length > 0 && <span className="text-[11px] text-[#6B7280]">{sessions.length} sessions</span>}
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-6">No sessions yet — start a chat to begin</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {sessions.map(s => (
                  <div key={s.id} className="min-w-[180px] bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] p-3 flex-shrink-0 hover:border-[#D1D5DB] transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[8px] font-medium text-[#6B7280]">{getInitials(s.name)}</div>
                      <span className="text-xs font-medium text-[#111827] truncate">{s.name}</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] line-clamp-2">{s.preview || 'No messages yet'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((a, i) => {
                const Icon = a.icon
                return (
                  <button key={i} className="flex flex-col items-center gap-1.5 py-3 rounded-lg border border-[#E5E7EB] hover:border-[#2878D9] hover:bg-[#FAFAFA] transition-all cursor-pointer">
                    <Icon size={18} className="text-[#2878D9]" />
                    <span className="text-[10px] font-medium text-[#6B7280]">{a.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Overdue alert banner */}
        {overdueHigh.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626]">
            <AlertCircle size={15} />
            <span className="font-medium">{overdueHigh.length} overdue high-priority task{overdueHigh.length > 1 ? 's' : ''}</span>
            <span className="text-[#9CA3AF] ml-1">— check the Tasks page</span>
          </div>
        )}
      </div>
    </div>
  )
}
