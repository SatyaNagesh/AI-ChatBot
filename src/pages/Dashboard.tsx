import { useState, useEffect } from 'react'
import { ListTodo, CheckCircle2, AlertCircle, BarChart3, Clock } from 'lucide-react'

type Task = {
  id: string
  title: string
  description: string
  priority: string
  dueDate: string
  createdAt: string
  project?: string
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
        if (Array.isArray(parsed[col])) {
          valid[col] = parsed[col].filter((t: any) => t && typeof t.id === 'string')
        }
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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Record<Column, Task[]>>({ 'To Do': [], 'In Progress': [], 'In Review': [], 'Done': [] })

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

  const allTasks = COLUMNS.flatMap(col => tasks[col])
  const totalTasks = allTasks.length
  const doneCount = tasks['Done'].length
  const inProgressCount = tasks['In Progress'].length + tasks['In Review'].length
  const todoCount = tasks['To Do'].length
  const pctDone = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0
  const overdue = allTasks.filter(t => t.priority === 'High' && isOverdue(t.dueDate) && t.dueDate && tasks['To Do'].concat(tasks['In Progress']).concat(tasks['In Review']).some(tt => tt.id === t.id))

  const projectMap: Record<string, { done: number; total: number; tasks: Task[] }> = {}
  for (const t of allTasks) {
    const p = t.project || 'Uncategorized'
    if (!projectMap[p]) projectMap[p] = { done: 0, total: 0, tasks: [] }
    projectMap[p].total++
    projectMap[p].tasks.push(t)
    if (tasks['Done'].some(d => d.id === t.id)) projectMap[p].done++
  }
  const projects = Object.entries(projectMap).sort((a, b) => b[1].total - a[1].total)
  const inProgressTasks = tasks['In Progress'].slice(0, 5)

  const stats = [
    { label: 'Total Tasks', value: totalTasks, icon: ListTodo, color: '#2878D9', bg: '#EBF4FF' },
    { label: 'Completed', value: `${doneCount} (${pctDone}%)`, icon: CheckCircle2, color: '#22C55E', bg: '#D1FAE5' },
    { label: 'In Progress', value: inProgressCount, icon: BarChart3, color: '#D97706', bg: '#FFF7ED' },
    { label: 'Overdue', value: overdue.length, icon: AlertCircle, color: '#DC2626', bg: '#FEE2E2' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5">
        <div>
          <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Live progress from your tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-8 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B7280]">{s.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-[#111827]">{s.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-5 gap-4 px-8 flex-1 pb-8">
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#111827]">Projects</h3>
              {projects.length > 0 && (
                <span className="text-[10px] text-[#9CA3AF]">{projects.length} projects</span>
              )}
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <ListTodo size={32} className="mx-auto text-[#D1D5DB] mb-3" />
                <p className="text-sm text-[#9CA3AF]">No tasks yet</p>
                <p className="text-xs text-[#D1D5DB] mt-1">Create tasks from the Tasks page to see project progress</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map(([name, data]) => {
                  const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
                  const statusColor = pct === 100 ? '#22C55E' : pct >= 50 ? '#D97706' : '#9CA3AF'
                  const statusLabel = pct === 100 ? 'Done' : pct >= 50 ? 'In Progress' : 'Started'
                  const subTasks = data.tasks.filter(t => tasks['To Do'].some(d => d.id === t.id)).length
                  const subInProg = data.tasks.filter(t => tasks['In Progress'].some(d => d.id === t.id)).length
                  const subDone = data.tasks.filter(t => tasks['Done'].some(d => d.id === t.id)).length
                  return (
                    <div key={name} className="bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#111827]">{name}</h4>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          pct === 100 ? 'bg-[#D1FAE5] text-[#065F46]' :
                          pct >= 50 ? 'bg-[#FFF7ED] text-[#9A3412]' :
                          'bg-[#F3F4F6] text-[#6B7280]'
                        }`}>{statusLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: statusColor }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#6B7280] min-w-[36px] text-right">{pct}%</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF]">
                        <span>📋 {subTasks} to do</span>
                        <span>🔄 {subInProg} active</span>
                        <span>✅ {subDone} done</span>
                        <span className="ml-auto">{data.total} tasks</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <Clock size={14} className="text-[#2878D9]" />
              In Progress Now
            </h3>
            {inProgressTasks.length === 0 ? (
              <p className="text-xs text-[#9CA3AF] text-center py-6">No active tasks</p>
            ) : (
              <div className="space-y-2">
                {inProgressTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2.5 py-2 border-b border-[#F3F4F6] last:border-0">
                    <div className="w-2 h-2 rounded-full bg-[#2878D9] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#111827] truncate">{t.title}</p>
                      <div className="flex items-center gap-2">
                        {t.project && <span className="text-[10px] text-[#9CA3AF]">{t.project}</span>}
                        {t.priority === 'High' && <span className="text-[10px] text-[#DC2626]">High</span>}
                      </div>
                    </div>
                    {t.dueDate && (
                      <span className={`text-[10px] ${isOverdue(t.dueDate) ? 'text-[#DC2626]' : 'text-[#9CA3AF]'}`}>
                        {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">At a Glance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">To Do</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#9CA3AF]" style={{ width: `${totalTasks > 0 ? (todoCount / totalTasks) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-[#111827] min-w-[20px] text-right">{todoCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">In Progress</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#2878D9]" style={{ width: `${totalTasks > 0 ? (inProgressCount / totalTasks) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-[#111827] min-w-[20px] text-right">{inProgressCount}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B7280]">Done</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${totalTasks > 0 ? (doneCount / totalTasks) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-[#111827] min-w-[20px] text-right">{doneCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
