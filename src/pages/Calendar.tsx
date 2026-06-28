import { useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, Cloud, Clock } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const TODAY = new Date()

const ACTIVITY_DATA: Record<string, { chats: number; storage: string; activeTime: string; sessions: { name: string; time: string; msgs: number }[] }> = {
  '15': { chats: 5, storage: '156 MB', activeTime: '3h 42m', sessions: [
    { name: 'API deployment discussion', time: '10:23 AM - 11:15 AM', msgs: 24 },
    { name: 'Code review with Claude', time: '1:30 PM - 2:10 PM', msgs: 12 },
    { name: 'Debug auth middleware', time: '3:45 PM - 4:30 PM', msgs: 18 },
  ]},
}

function getDaysInMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const days = MONTH_DAYS[month]
  const isLeap = month === 1 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
  return { firstDay, days: isLeap ? 29 : days }
}

export default function CalendarPage() {
  const [year, setYear] = useState(TODAY.getFullYear())
  const [month, setMonth] = useState(TODAY.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>('15')
  const [view, setView] = useState<'calendar' | 'timeline'>('calendar')

  const { firstDay, days } = getDaysInMonth(year, month)
  const selected = selectedDate ? ACTIVITY_DATA[selectedDate] : null

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5">
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Activity Timeline</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <button onClick={() => setView('calendar')} className={`px-4 py-1.5 text-xs font-medium ${view === 'calendar' ? 'bg-[#2878D9] text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>Calendar</button>
            <button onClick={() => setView('timeline')} className={`px-4 py-1.5 text-xs font-medium ${view === 'timeline' ? 'bg-[#2878D9] text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>Timeline</button>
          </div>
        </div>
      </div>

      <div className="mx-8 mb-6">
        <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
            <button onClick={prevMonth} className="p-1 hover:bg-[#F3F4F6] rounded"><ChevronLeft size={18} className="text-[#6B7280]" /></button>
            <h2 className="text-base font-semibold text-[#111827]">{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="p-1 hover:bg-[#F3F4F6] rounded"><ChevronRight size={18} className="text-[#6B7280]" /></button>
          </div>
          {view === 'calendar' ? (
            <div className="p-5">
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-[#9CA3AF] py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: days }).map((_, i) => {
                  const date = String(i + 1)
                  const isToday = i + 1 === TODAY.getDate() && month === TODAY.getMonth() && year === TODAY.getFullYear()
                  const hasData = !!ACTIVITY_DATA[date]
                  const isSelected = selectedDate === date
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`h-12 rounded-lg flex flex-col items-center justify-center relative text-sm transition-colors
                        ${isSelected ? 'bg-[#2878D9] text-white' : isToday ? 'bg-[#EBF4FF] text-[#2878D9] font-semibold' : 'hover:bg-[#F3F4F6] text-[#111827]'}`}
                    >
                      {i + 1}
                      {hasData && !isSelected && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#2878D9]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {Array.from({ length: Math.min(days, 5) }).map((_, i) => {
                const date = String(i + 1)
                const d = ACTIVITY_DATA[date]
                if (!d) return null
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2878D9] mt-1" />
                      {i < 4 && <div className="w-px flex-1 bg-[#E5E7EB] my-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-[#111827]">{MONTHS[month]} {date}</p>
                      <p className="text-xs text-[#9CA3AF]">{d.chats} chats · {d.activeTime}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selected && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-[#111827] mb-3">{MONTHS[month]} {selectedDate}, {year}</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#EBF4FF] flex items-center justify-center"><MessageCircle size={18} className="text-[#2878D9]" /></div>
                <div><p className="text-xs text-[#6B7280]">Chats Used</p><p className="text-lg font-semibold text-[#111827]">{selected.chats}</p></div>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F3F0FF] flex items-center justify-center"><Cloud size={18} className="text-[#8B5CF6]" /></div>
                <div><p className="text-xs text-[#6B7280]">Storage Used</p><p className="text-lg font-semibold text-[#111827]">{selected.storage}</p></div>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FFF7ED] flex items-center justify-center"><Clock size={18} className="text-[#D97706]" /></div>
                <div><p className="text-xs text-[#6B7280]">Active Time</p><p className="text-lg font-semibold text-[#111827]">{selected.activeTime}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="px-5 py-3 border-b border-[#E5E7EB]">
                <h4 className="text-sm font-semibold text-[#111827]">Sessions</h4>
              </div>
              <div className="divide-y divide-[#F3F4F6]">
                {selected.sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#FAFAFA]">
                    <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[9px] font-medium text-[#6B7280] flex-shrink-0">{s.name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111827]">{s.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{s.time}</p>
                    </div>
                    <span className="text-xs text-[#6B7280]">{s.msgs} msgs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
