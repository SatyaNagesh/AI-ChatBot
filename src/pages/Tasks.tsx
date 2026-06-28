import { useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'

type TaskItem = { id: string; title: string; description: string; agent: string; priority: 'High' | 'Medium' | 'Low'; subtasks: number; subtasksDone: number; due?: string }

const INITIAL_TASKS: Record<string, TaskItem[]> = {
  'To Do': [
    { id: '1', title: 'Implement OAuth2 flow', description: 'Add Google and GitHub OAuth authentication', agent: 'Claude Code', priority: 'High', subtasks: 5, subtasksDone: 2 },
    { id: '2', title: 'Design system audit', description: 'Review all components for consistency', agent: 'opencode', priority: 'Medium', subtasks: 8, subtasksDone: 0 },
    { id: '3', title: 'API rate limiting', description: 'Add rate limiting to all public endpoints', agent: 'GPT-5.5', priority: 'Medium', subtasks: 3, subtasksDone: 1 },
  ],
  'In Progress': [
    { id: '4', title: 'Dashboard redesign', description: 'New dashboard layout with real-time widgets', agent: 'Claude Sonnet 4.6', priority: 'High', subtasks: 6, subtasksDone: 4, due: 'Jan 20' },
  ],
  'Done': [
    { id: '5', title: 'Database migration', description: 'Migrate from SQLite to PostgreSQL', agent: 'Claude Code', priority: 'High', subtasks: 10, subtasksDone: 10 },
  ],
}

const COLUMNS = ['To Do', 'In Progress', 'Done']
const COLORS = ['#9CA3AF', '#2878D9', '#22C55E']

export default function TasksPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  function addTask() {
    if (!newTitle.trim()) return
    const task: TaskItem = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc || 'No description',
      agent: 'Claude Code',
      priority: 'Medium',
      subtasks: 0,
      subtasksDone: 0,
    }
    setTasks(prev => ({ ...prev, 'To Do': [task, ...prev['To Do']] }))
    setNewTitle('')
    setNewDesc('')
    setShowNew(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5">
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Tasks</h1>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2878D9] text-white rounded-lg text-xs font-medium hover:bg-[#1D5FA8]"><Plus size={14} />New Task</button>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 px-8 pb-6">
        {COLUMNS.map((col, ci) => (
          <div key={col} className="bg-white rounded-lg border border-[#E5E7EB] flex flex-col">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E5E7EB]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[ci] }} />
              <h3 className="text-sm font-semibold text-[#111827]">{col}</h3>
              <span className="text-xs text-[#9CA3AF] ml-auto">{tasks[col].length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {tasks[col].map(task => (
                <div key={task.id} className="bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] p-3 cursor-pointer hover:border-[#D1D5DB] group">
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="text-[#D1D5DB] mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-[#111827]">{task.title}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          task.priority === 'High' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                          task.priority === 'Medium' ? 'bg-[#FFF7ED] text-[#D97706]' :
                          'bg-[#F3F4F6] text-[#6B7280]'
                        }`}>{task.priority}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] mb-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[7px] font-medium text-[#6B7280]">{task.agent.split(' ').slice(-2).map(s => s[0]).join('')}</div>
                          {task.due && <span className="text-xs text-[#D97706]">{task.due}</span>}
                        </div>
                        {task.subtasks > 0 && (
                          <span className="text-xs text-[#9CA3AF]">{task.subtasksDone}/{task.subtasks}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-xl shadow-xl w-96" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">New Task</h3>
              <button onClick={() => setShowNew(false)}><X size={16} className="text-[#9CA3AF]" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <input className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none" placeholder="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus />
              <textarea className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none resize-none h-20" placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E5E7EB]">
              <button onClick={() => setShowNew(false)} className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280]">Cancel</button>
              <button onClick={addTask} className="px-3 py-1.5 bg-[#2878D9] text-white rounded-lg text-xs font-medium hover:bg-[#1D5FA8]">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
