import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, CalendarDays, MessageCircle, AlertCircle, Clock, Trash2 } from 'lucide-react'
import { DB_API } from '../data/agents'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const HEAT_COLORS = ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39']
const PRIORITY_COLORS: Record<string, string> = { High: '#EF4444', Medium: '#D97706', Low: '#6B7280' }
const EVENT_COLORS = ['#2878D9', '#8B5CF6', '#D97706', '#059669', '#DC2626', '#0891B2']

type CalendarEvent = {
  id: string; title: string; date: string; time: string; description: string; color: string
}

type TaskItem = {
  id: string; title: string; description: string; priority: string; dueDate: string
}

type SessionItem = { id: string; name: string; date: string; time: string }
type DayData = {
  date: string; tasks: TaskItem[]; events: CalendarEvent[]; sessions: SessionItem[]; level: number
}

const STORAGE_KEY = 'ai-chatbot-calendar-events'
const TASKS_KEY = 'ai-chatbot-tasks'

function loadEvents(): CalendarEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

function loadTasks(): TaskItem[] {
  try {
    const data = localStorage.getItem(TASKS_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    const all: TaskItem[] = []
    for (const col of ['To Do', 'In Progress', 'In Review', 'Done']) {
      if (Array.isArray(parsed[col])) all.push(...parsed[col])
    }
    return all.filter(t => t.dueDate)
  } catch { return [] }
}

function getDateFromSessionId(id: string): string | null {
  const match = id.match(/-(\d{13})$/)
  if (!match) return null
  const d = new Date(Number(match[1]))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function CalendarPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  )
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formColor, setFormColor] = useState(EVENT_COLORS[0])
  const [view, setView] = useState<'calendar' | 'heatmap'>('calendar')

  useEffect(() => {
    setEvents(loadEvents())
    setTasks(loadTasks())
    fetch(`${DB_API}/sessions`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const parsed: SessionItem[] = data
          .filter((s: any) => {
            try {
              const p = JSON.parse(s.preview || '{}')
              return !p.deleted
            } catch { return true }
          })
          .map((s: any) => {
            const d = getDateFromSessionId(s.id)
            const ts = s.id.match(/-(\d{13})$/)
            const time = ts ? new Date(Number(ts[1])).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''
            return d ? { id: s.id, name: s.name, date: d, time } : null
          })
          .filter((s): s is SessionItem => s !== null)
        setSessions(parsed)
      }
    }).catch(() => {})
  }, [])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const allDates: DayData[] = Array.from({ length: daysInMonth }, (_, i) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    const dayTasks = tasks.filter(t => t.dueDate === dateStr)
    const dayEvents = events.filter(e => e.date === dateStr)
    const daySessions = sessions.filter(s => s.date === dateStr)
    const msgCount = sessions.filter(s => s.date === dateStr).length
    const taskCount = dayTasks.length
    const eventCount = dayEvents.length
    const total = msgCount + taskCount + eventCount
    const level = total === 0 ? 0 : total <= 2 ? 1 : total <= 5 ? 2 : total <= 10 ? 3 : 4
    return { date: dateStr, tasks: dayTasks, events: dayEvents, sessions: daySessions, level }
  })

  const selectedDay = allDates.find(d => d.date === selectedDate)
  const isToday = (d: string) => {
    const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return d === t
  }

  const todayYear = today.getFullYear()
  const startOfYear = new Date(todayYear, 0, 1)
  const startDay = startOfYear.getDay()
  const daysInYear = (todayYear % 4 === 0 && (todayYear % 100 !== 0 || todayYear % 400 === 0)) ? 366 : 365
  const heatmapWeeks = Math.ceil((startDay + daysInYear) / 7)

  function getHeatLevel(dateStr: string) {
    const d = allDates.find(a => a.date === dateStr)
    return d ? d.level : 0
  }

  function getHeatDates() {
    const result: { date: string; level: number }[] = []
    for (let i = 0; i < daysInYear; i++) {
      const d = new Date(todayYear, 0, 1 + i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const level = getHeatLevel(dateStr)
      result.push({ date: dateStr, level })
    }
    return result
  }

  function openNewEvent() {
    setEditingEvent(null)
    setFormTitle('')
    setFormTime('')
    setFormDesc('')
    setFormColor(EVENT_COLORS[0])
    setShowEventModal(true)
  }

  function openEditEvent(e: CalendarEvent) {
    setEditingEvent(e)
    setFormTitle(e.title)
    setFormTime(e.time)
    setFormDesc(e.description)
    setFormColor(e.color)
    setShowEventModal(true)
  }

  function saveEvent() {
    if (!formTitle.trim()) return
    const updated = editingEvent
      ? events.map(e => e.id === editingEvent.id ? { ...e, title: formTitle.trim(), time: formTime, description: formDesc.trim(), color: formColor } : e)
      : [...events, { id: generateId(), title: formTitle.trim(), date: selectedDate, time: formTime, description: formDesc.trim(), color: formColor }]
    setEvents(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setShowEventModal(false)
  }

  function deleteEvent(id: string) {
    const updated = events.filter(e => e.id !== id)
    setEvents(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setShowEventModal(false)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const heatDates = getHeatDates()

  return (
    <div className="flex-1 flex bg-[#FAFAFA] overflow-hidden">
      {/* Heatmap sidebar */}
      <div className="w-[240px] bg-white border-r border-[#E5E7EB] p-4 flex flex-col gap-3 overflow-y-auto shrink-0">
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider">{todayYear} Activity</p>
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1 text-[8px] text-[#9CA3AF] leading-3 pt-3">
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-0.5" style={{ minWidth: heatmapWeeks * 12 }}>
              {Array.from({ length: heatmapWeeks }).map((_, w) => (
                <div key={w} className="flex flex-col gap-0.5">
                  {Array.from({ length: 7 }).map((_, d) => {
                    const idx = w * 7 + d - startDay
                    if (idx < 0 || idx >= daysInYear) return <div key={d} className="w-2.5 h-2.5" />
                    const hd = heatDates[idx]
                    return (
                      <div
                        key={d}
                        className="w-2.5 h-2.5 rounded-sm cursor-pointer"
                        style={{ backgroundColor: HEAT_COLORS[hd.level] }}
                        title={`${hd.date}: ${hd.level} activities`}
                        onClick={() => setSelectedDate(hd.date)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
          <span>Less</span>
          {HEAT_COLORS.map((c, i) => <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />)}
          <span>More</span>
        </div>
        <div className="mt-2 text-[10px] text-[#6B7280] space-y-1">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-[#EF4444]" /> Task deadline</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-[#D97706]" /> Event</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-[#2878D9]" /> Chat session</div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-white shrink-0">
          <h1 className="text-lg font-semibold text-[#111827]">Calendar</h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <button onClick={() => setView('calendar')} className={`px-3 py-1.5 text-xs font-medium ${view === 'calendar' ? 'bg-[#2878D9] text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>Month</button>
              <button onClick={() => setView('heatmap')} className={`px-3 py-1.5 text-xs font-medium ${view === 'heatmap' ? 'bg-[#2878D9] text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>Heatmap</button>
            </div>
            <button onClick={openNewEvent} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]"><Plus size={14} />Add Event</button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Calendar grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-white mx-4 mt-4 rounded-lg border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB] shrink-0">
                <button onClick={prevMonth} className="p-1 hover:bg-[#F3F4F6] rounded"><ChevronLeft size={18} className="text-[#6B7280]" /></button>
                <h2 className="text-base font-semibold text-[#111827]">{MONTHS[month]} {year}</h2>
                <button onClick={nextMonth} className="p-1 hover:bg-[#F3F4F6] rounded"><ChevronRight size={18} className="text-[#6B7280]" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-[#9CA3AF] py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {allDates.map((day) => {
                    const selected = day.date === selectedDate
                    const taskDots = day.tasks.slice(0, 3)
                    const eventDots = day.events.slice(0, 3)
                    const hasSessions = day.sessions.length > 0
                    const todayMatch = isToday(day.date)
                    return (
                      <button
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                        className={`min-h-[80px] rounded-lg flex flex-col items-start p-1.5 relative text-sm transition-colors border ${
                          selected ? 'bg-[#EBF4FF] border-[#2878D9]' : todayMatch ? 'bg-[#FAFAFA] border-[#D1D5DB]' : 'border-transparent hover:bg-[#F9FAFB]'
                        }`}
                      >
                        <span className={`text-xs font-medium ${selected ? 'text-[#2878D9]' : todayMatch ? 'text-[#2878D9]' : 'text-[#6B7280]'}`}>
                          {day.date.split('-')[2]}
                        </span>
                        <div className="flex-1 w-full space-y-0.5 mt-0.5">
                          {taskDots.map(t => (
                            <div key={t.id} className="flex items-center gap-1 text-[8px] leading-tight text-[#EF4444] truncate">
                              <span className="w-1 h-1 rounded-full bg-[#EF4444] shrink-0" />
                              <span className="truncate">{t.title}</span>
                            </div>
                          ))}
                          {eventDots.map(e => (
                            <div key={e.id} className="flex items-center gap-1 text-[8px] leading-tight truncate" style={{ color: e.color }}>
                              <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                              <span className="truncate">{e.title}</span>
                            </div>
                          ))}
                          {hasSessions && day.tasks.length === 0 && day.events.length === 0 && (
                            <div className="flex items-center gap-1 text-[8px] text-[#2878D9]">
                              <MessageCircle size={8} /> {day.sessions.length}
                            </div>
                          )}
                        </div>
                        {(taskDots.length > 0 || eventDots.length > 0 || hasSessions) && (
                          <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${selected ? 'bg-[#2878D9]' : 'bg-[#9CA3AF]'}`} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Day detail panel */}
          <div className="w-80 bg-white border-l border-[#E5E7EB] flex flex-col overflow-hidden shrink-0">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] shrink-0">
              <p className="text-sm font-semibold text-[#111827]">
                {selectedDay ? new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a day'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {selectedDay && selectedDay.level === 0 && (
                <p className="text-xs text-[#9CA3AF] text-center py-8">No activity on this day</p>
              )}

              {selectedDay && selectedDay.tasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertCircle size={13} className="text-[#EF4444]" />
                    <span className="text-xs font-semibold text-[#111827]">Tasks Due</span>
                    <span className="text-[10px] text-[#9CA3AF]">({selectedDay.tasks.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedDay.tasks.map(t => (
                      <div key={t.id} className="text-xs bg-[#FEF2F2] rounded-lg px-3 py-2 border-l-2" style={{ borderLeftColor: PRIORITY_COLORS[t.priority] || '#6B7280' }}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#111827]">{t.title}</span>
                          <span className="text-[10px] font-medium" style={{ color: PRIORITY_COLORS[t.priority] }}>{t.priority}</span>
                        </div>
                        {t.description && <p className="text-[#6B7280] mt-0.5">{t.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay && selectedDay.events.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CalendarDays size={13} className="text-[#D97706]" />
                    <span className="text-xs font-semibold text-[#111827]">Events</span>
                    <span className="text-[10px] text-[#9CA3AF]">({selectedDay.events.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedDay.events.map(e => (
                      <div key={e.id} className="text-xs bg-[#FFFBEB] rounded-lg px-3 py-2 border-l-2 cursor-pointer hover:bg-[#FFF7E6]" style={{ borderLeftColor: e.color }} onClick={() => openEditEvent(e)}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#111827]">{e.title}</span>
                          {e.time && <span className="text-[10px] text-[#6B7280]"><Clock size={10} className="inline mr-0.5" />{e.time}</span>}
                        </div>
                        {e.description && <p className="text-[#6B7280] mt-0.5">{e.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay && selectedDay.sessions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageCircle size={13} className="text-[#2878D9]" />
                    <span className="text-xs font-semibold text-[#111827]">Conversations</span>
                    <span className="text-[10px] text-[#9CA3AF]">({selectedDay.sessions.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedDay.sessions.map(s => (
                      <div key={s.id} className="text-xs bg-[#EBF4FF] rounded-lg px-3 py-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#2878D9]/10 flex items-center justify-center text-[7px] font-medium text-[#2878D9] shrink-0">{s.name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#111827] truncate">{s.name}</p>
                          <p className="text-[10px] text-[#6B7280]">{s.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowEventModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-80" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
              <p className="text-sm font-semibold text-[#111827]">{editingEvent ? 'Edit Event' : 'New Event'}</p>
              <button onClick={() => setShowEventModal(false)}><X size={16} className="text-[#6B7280]" /></button>
            </div>
            <div className="px-4 py-3 space-y-3">
              <input className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none" placeholder="Event title" value={formTitle} onChange={e => setFormTitle(e.target.value)} autoFocus />
              <input className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none" placeholder="Time (e.g. 10:00 AM)" value={formTime} onChange={e => setFormTime(e.target.value)} />
              <textarea className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none resize-none h-16" placeholder="Description" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              <div>
                <p className="text-xs text-[#6B7280] mb-1.5">Color</p>
                <div className="flex gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c} onClick={() => setFormColor(c)} className={`w-6 h-6 rounded-full border-2 ${formColor === c ? 'border-[#111827]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB]">
              {editingEvent && (
                <button onClick={() => deleteEvent(editingEvent.id)} className="flex items-center gap-1 text-xs text-[#EF4444] font-medium hover:text-[#DC2626]"><Trash2 size={13} />Delete</button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                <button onClick={() => setShowEventModal(false)} className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Cancel</button>
                <button onClick={saveEvent} disabled={!formTitle.trim()} className="px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937] disabled:opacity-50">
                  {editingEvent ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
