import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, Search, AlertCircle, CheckCircle2, ListTodo, BarChart3, Edit3, Trash2, Calendar, ChevronDown, Wifi, WifiOff } from 'lucide-react'

type Priority = 'High' | 'Medium' | 'Low'
type Column = 'To Do' | 'In Progress' | 'In Review' | 'Done'

type Task = {
  id: string
  title: string
  description: string
  priority: Priority
  dueDate: string
  createdAt: string
}

const COLUMNS: { key: Column; color: string }[] = [
  { key: 'To Do', color: '#9CA3AF' },
  { key: 'In Progress', color: '#2878D9' },
  { key: 'In Review', color: '#8B5CF6' },
  { key: 'Done', color: '#22C55E' },
]

const STORAGE_KEY = 'ai-chatbot-tasks'
const API_BASE = '/api/tasks'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr: string) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

function emptyBoard(): Record<Column, Task[]> {
  return { 'To Do': [], 'In Progress': [], 'In Review': [], 'Done': [] }
}

function defaultTasks(): Record<Column, Task[]> {
  return {
    'To Do': [
      { id: 'default1', title: 'Agent Memory Persistence', description: 'Agents remember context across conversations in the same session', priority: 'High', dueDate: '2026-07-11', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default2', title: 'Global Conversation Search', description: 'Cmd+K / Spotlight-style search across all conversations and agents', priority: 'High', dueDate: '2026-07-10', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default3', title: 'File Upload & Analysis', description: 'Drag & drop code, PDFs, images for agents to analyze directly in chat', priority: 'Medium', dueDate: '2026-07-12', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default4', title: 'Side-by-Side Agent Compare', description: 'Send one prompt to multiple agents and compare responses in split view', priority: 'Medium', dueDate: '2026-07-14', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default5', title: 'Prompt Library', description: 'Save, organize, and reuse prompt templates; assign to specific agents', priority: 'Medium', dueDate: '2026-07-15', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default6', title: 'Knowledge Base Page', description: 'Persistent docs/notes page that all agents can reference during conversations', priority: 'Medium', dueDate: '2026-07-18', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default7', title: 'Analytics Dashboard', description: 'Usage stats: messages per agent, response times, busiest days, trends', priority: 'Low', dueDate: '2026-07-20', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default8', title: 'Export & Share', description: 'Export conversations as markdown, PDF, or generate a shareable link', priority: 'Low', dueDate: '2026-07-22', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default9', title: 'Dark Mode', description: 'Light/dark theme toggle across the entire app', priority: 'Low', dueDate: '2026-07-25', createdAt: '2026-07-05T00:00:00.000Z' },
      { id: 'default10', title: 'Voice Input', description: 'Microphone button with speech-to-text for hands-free chat', priority: 'Low', dueDate: '2026-07-28', createdAt: '2026-07-05T00:00:00.000Z' },
    ],
    'In Progress': [],
    'In Review': [],
    'Done': [],
  }
}

function loadFromStorage(): Record<Column, Task[]> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const valid = emptyBoard()
      for (const col of COLUMNS.map(c => c.key)) {
        if (Array.isArray(parsed[col])) {
          valid[col] = parsed[col].filter((t: any) => t && typeof t.id === 'string')
        }
      }
      return valid
    }
  } catch {}
  return defaultTasks()
}

function saveToStorage(tasks: Record<Column, Task[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

async function apiGet(): Promise<Record<Column, Task[]> | null> {
  try {
    const res = await fetch(API_BASE)
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

async function apiPost(task: Task, column: Column): Promise<boolean> {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: task.title, description: task.description, priority: task.priority, dueDate: task.dueDate, column }),
    })
    return res.ok
  } catch { return false }
}

async function apiPut(taskId: string, updates: Partial<Task>): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${taskId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    return res.ok
  } catch { return false }
}

async function apiDelete(taskId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${taskId}`, { method: 'DELETE' })
    return res.ok
  } catch { return false }
}

async function apiMove(taskId: string, toColumn: Column): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/${taskId}/move`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: toColumn }),
    })
    return res.ok
  } catch { return false }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Record<Column, Task[]>>(emptyBoard)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editColumn, setEditColumn] = useState<Column>('To Do')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPriority, setFormPriority] = useState<Priority>('Medium')
  const [formDue, setFormDue] = useState('')
  const [quickAddCol, setQuickAddCol] = useState<Column | null>(null)
  const [quickAddTitle, setQuickAddTitle] = useState('')
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([])
  const dragId = useRef<string | null>(null)
  const dragCol = useRef<Column | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    apiGet().then(data => {
      if (data) {
        setTasks(data)
        saveToStorage(data)
        setOnline(true)
      } else {
        setTasks(loadFromStorage())
        setOnline(false)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!loading) {
      saveToStorage(tasks)
      window.dispatchEvent(new CustomEvent('tasks-updated'))
    }
  }, [tasks, loading])

  const addToast = useCallback((msg: string) => {
    const id = generateId()
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }, [])

  function openNew(col: Column) {
    setEditingTask(null)
    setEditColumn(col)
    setFormTitle('')
    setFormDesc('')
    setFormPriority('Medium')
    setFormDue('')
    setShowModal(true)
  }

  function openEdit(task: Task, col: Column) {
    setEditingTask(task)
    setEditColumn(col)
    setFormTitle(task.title)
    setFormDesc(task.description)
    setFormPriority(task.priority)
    setFormDue(task.dueDate)
    setShowModal(true)
  }

  function saveTask() {
    if (!formTitle.trim()) return
    const now = new Date().toISOString()
    if (editingTask) {
      setTasks(prev => {
        const next = { ...prev }
        for (const col of COLUMNS.map(c => c.key)) {
          next[col] = next[col].map(t =>
            t.id === editingTask.id
              ? { ...t, title: formTitle.trim(), description: formDesc.trim(), priority: formPriority, dueDate: formDue }
              : t
          )
        }
        return next
      })
      apiPut(editingTask.id, { title: formTitle.trim(), description: formDesc.trim(), priority: formPriority, dueDate: formDue })
        .then(ok => setOnline(ok))
      addToast('Task updated')
    } else {
      const task: Task = {
        id: generateId(),
        title: formTitle.trim(),
        description: formDesc.trim(),
        priority: formPriority,
        dueDate: formDue,
        createdAt: now,
      }
      setTasks(prev => ({ ...prev, [editColumn]: [task, ...prev[editColumn]] }))
      apiPost(task, editColumn).then(ok => setOnline(ok))
      addToast('Task created')
    }
    setShowModal(false)
  }

  function deleteTask(taskId: string) {
    setTasks(prev => {
      const next = { ...prev }
      for (const col of COLUMNS.map(c => c.key)) {
        next[col] = next[col].filter(t => t.id !== taskId)
      }
      return next
    })
    setShowModal(false)
    apiDelete(taskId).then(ok => setOnline(ok))
    addToast('Task deleted')
  }

  function quickAdd() {
    if (!quickAddTitle.trim() || !quickAddCol) return
    const task: Task = {
      id: generateId(),
      title: quickAddTitle.trim(),
      description: '',
      priority: 'Medium',
      dueDate: '',
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => ({ ...prev, [quickAddCol]: [task, ...prev[quickAddCol]] }))
    apiPost(task, quickAddCol).then(ok => setOnline(ok))
    setQuickAddTitle('')
    setQuickAddCol(null)
    addToast('Task added')
  }

  function moveTask(taskId: string, fromCol: Column, toCol: Column) {
    if (fromCol === toCol) return
    setTasks(prev => {
      const task = prev[fromCol].find(t => t.id === taskId)
      if (!task) return prev
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter(t => t.id !== taskId),
        [toCol]: [task, ...prev[toCol]],
      }
    })
    apiMove(taskId, toCol).then(ok => setOnline(ok))
  }

  function handleDragStart(taskId: string, col: Column) {
    dragId.current = taskId
    dragCol.current = col
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(col: Column) {
    if (dragId.current && dragCol.current) {
      moveTask(dragId.current, dragCol.current, col)
    }
    dragId.current = null
    dragCol.current = null
  }

  const totalTasks = COLUMNS.reduce((s, c) => s + tasks[c.key].length, 0)
  const doneCount = tasks['Done'].length
  const pctDone = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0
  const activeCount = totalTasks - doneCount
  const highCount = COLUMNS.reduce((s, c) => s + tasks[c.key].filter(t => t.priority === 'High').length, 0)

  function filtered(col: Column) {
    return tasks[col].filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      if (filterPriority && t.priority !== filterPriority) return false
      return true
    })
  }

  function priorityBadge(p: Priority) {
    const styles: Record<Priority, string> = {
      High: 'bg-[#FEE2E2] text-[#DC2626]',
      Medium: 'bg-[#FFF7ED] text-[#D97706]',
      Low: 'bg-[#F3F4F6] text-[#6B7280]',
    }
    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${styles[p]}`}>
        {p}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-sm text-[#9CA3AF]">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-[#E5E7EB] bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Tasks</h1>
          <div className="hidden sm:flex items-center gap-4 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1"><ListTodo size={13} />{totalTasks} total</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-[#22C55E]" />{pctDone}%</span>
            <span className="flex items-center gap-1"><BarChart3 size={13} />{activeCount} active</span>
            {highCount > 0 && <span className="flex items-center gap-1"><AlertCircle size={13} className="text-[#DC2626]" />{highCount} high</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {online ? (
            <span className="flex items-center gap-1 text-[10px] text-[#22C55E]"><Wifi size={11} />API</span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-[#D97706]"><WifiOff size={11} />local</span>
          )}
          <button onClick={() => openNew('To Do')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2878D9] text-white rounded-lg text-xs font-medium hover:bg-[#1D5FA8] transition-colors">
            <Plus size={14} />New Task
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex items-center gap-3 px-8 py-3 border-b border-[#E5E7EB] bg-white">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-[#FAFAFA] text-[#111827] outline-none focus:border-[#2878D9] transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as Priority | '')}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-[#FAFAFA] text-[#6B7280] outline-none focus:border-[#2878D9] cursor-pointer transition-colors"
          >
            <option value="">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 overflow-x-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-8 min-h-[300px]" style={{ minWidth: 640 }}>
          {COLUMNS.map(({ key: col, color }) => {
            const items = filtered(col)
            return (
              <div
                key={col}
                className="bg-white rounded-lg border border-[#E5E7EB] flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(col)}
              >
                {/* COLUMN HEADER */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-semibold text-[#111827]">{col}</h3>
                  <span className="text-xs text-[#9CA3AF] ml-auto">{items.length}</span>
                </div>

                {/* CARDS */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
                  {items.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-xs text-[#9CA3AF]">{search || filterPriority ? 'No matches' : 'No tasks'}</p>
                    </div>
                  )}
                  {items.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id, col)}
                      className="bg-[#FAFAFA] rounded-lg border border-[#E5E7EB] p-3 hover:border-[#D1D5DB] transition-colors group cursor-grab active:cursor-grabbing select-none"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-[#111827] truncate">{task.title}</p>
                            {priorityBadge(task.priority)}
                          </div>
                          {task.description && (
                            <p className="text-xs text-[#6B7280] mb-2 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2">
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 text-[10px] ${isOverdue(task.dueDate) && col !== 'Done' ? 'text-[#DC2626]' : 'text-[#9CA3AF]'}`}>
                                  {isOverdue(task.dueDate) && col !== 'Done' ? <AlertCircle size={10} /> : <Calendar size={10} />}
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(task, col)} className="p-1 text-[#9CA3AF] hover:text-[#2878D9] transition-colors" title="Edit">
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                className="p-1 text-[#9CA3AF] hover:text-[#DC2626] transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* QUICK ADD */}
                  {quickAddCol === col ? (
                    <div className="bg-[#FAFAFA] rounded-lg border border-[#2878D9] p-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Task title..."
                        value={quickAddTitle}
                        onChange={e => setQuickAddTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') quickAdd(); if (e.key === 'Escape') setQuickAddCol(null) }}
                        className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-1.5 outline-none focus:border-[#2878D9] transition-colors"
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => { setQuickAddCol(null); setQuickAddTitle('') }} className="px-2 py-1 text-[10px] text-[#6B7280] hover:text-[#111827] transition-colors">Cancel</button>
                        <button onClick={quickAdd} className="px-2 py-1 text-[10px] bg-[#2878D9] text-white rounded hover:bg-[#1D5FA8] transition-colors">Add</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQuickAddCol(col)}
                      className="w-full py-2 border border-dashed border-[#E5E7EB] rounded-lg text-xs text-[#9CA3AF] hover:text-[#6B7280] hover:border-[#D1D5DB] transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={12} />Quick add
                    </button>
                  )}
                  <div className="h-2" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CRUD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowModal(false)}>
          <div ref={formRef} className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-semibold text-[#111827]">{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button onClick={() => setShowModal(false)}><X size={16} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <input
                className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none focus:border-[#2878D9] transition-colors"
                placeholder="Task title"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none focus:border-[#2878D9] transition-colors resize-none"
                placeholder="Description (optional)"
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-[#6B7280] mb-1 uppercase tracking-wider">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as Priority)}
                    className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none focus:border-[#2878D9] text-[#111827] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[#6B7280] mb-1 uppercase tracking-wider">Due date</label>
                  <input
                    type="date"
                    value={formDue}
                    onChange={e => setFormDue(e.target.value)}
                    className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none focus:border-[#2878D9] text-[#111827] transition-colors"
                  />
                </div>
              </div>
              {!editingTask && (
                <div>
                  <label className="block text-[10px] font-medium text-[#6B7280] mb-1 uppercase tracking-wider">Add to</label>
                  <select
                    value={editColumn}
                    onChange={e => setEditColumn(e.target.value as Column)}
                    className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none focus:border-[#2878D9] text-[#111827] transition-colors appearance-none cursor-pointer"
                  >
                    {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.key}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-between px-6 py-4 border-t border-[#E5E7EB]">
              <div>
                {editingTask && (
                  <button onClick={() => deleteTask(editingTask.id)} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] transition-colors">
                    <Trash2 size={13} />Delete
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:text-[#111827] transition-colors">Cancel</button>
                <button onClick={saveTask} className="px-3 py-1.5 bg-[#2878D9] text-white rounded-lg text-xs font-medium hover:bg-[#1D5FA8] transition-colors">{editingTask ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="bg-white border border-[#E5E7EB] rounded-lg shadow-lg px-4 py-2.5 text-xs font-medium text-[#111827] flex items-center gap-2" style={{ animation: 'slideUp 0.25s ease forwards' }}>
            {t.msg === 'Task deleted' ? <Trash2 size={12} className="text-[#DC2626]" /> : <CheckCircle2 size={12} className="text-[#22C55E]" />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
