import { useState } from 'react'
import { Inbox, X } from 'lucide-react'

const NOTIFICATIONS = [
  { id: '1', agent: 'Claude Code', text: 'PR #42 has been reviewed. 2 comments pending.', time: '2m ago', unread: true, type: 'code' },
  { id: '2', agent: 'opencode', text: 'Codebase analysis complete. Found 3 optimization opportunities.', time: '15m ago', unread: true, type: 'analysis' },
  { id: '3', agent: 'GPT-5.5', text: 'Unit tests generated for auth module: 45/45 passed.', time: '1h ago', unread: true, type: 'test' },
  { id: '4', agent: 'Claude Opus 4.8', text: 'Architecture review ready for microservices migration proposal.', time: '2h ago', unread: false, type: 'review' },
  { id: '5', agent: 'Claude Sonnet 4.6', text: 'Daily summary: 3 sessions completed, 2 pending.', time: '4h ago', unread: false, type: 'summary' },
  { id: '6', agent: 'Gemini 3.1 Pro', text: 'Research on competitor AI tools is 80% complete.', time: '6h ago', unread: false, type: 'research' },
]

type Filter = 'all' | 'unread' | 'archived'

export default function InboxPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [archived, setArchived] = useState<string[]>([])

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return n.unread && !archived.includes(n.id)
    if (filter === 'archived') return archived.includes(n.id)
    return !archived.includes(n.id)
  })

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  function toggleArchive(id: string) {
    setArchived(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5">
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Inbox</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            {(['all', 'unread', 'archived'] as Filter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-xs font-medium capitalize ${filter === f ? 'bg-[#2878D9] text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>{f}</button>
            ))}
          </div>
          <button onClick={markAllRead} className="text-xs text-[#2878D9] font-medium hover:underline px-3 py-1.5">Mark All Read</button>
        </div>
      </div>

      <div className="mx-8 flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Inbox size={40} className="text-[#D1D5DB]" />
            <p className="text-sm text-[#9CA3AF]">No notifications yet</p>
            <p className="text-xs text-[#D1D5DB]">Notifications from your agents will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] divide-y divide-[#F3F4F6]">
            {filtered.map((n) => (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-[#FAFAFA] ${n.unread ? 'border-l-2 border-l-[#2878D9]' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[9px] font-medium text-[#6B7280] flex-shrink-0 mt-0.5">
                  {n.agent.split(' ').slice(-2).map(s => s[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#111827]">{n.agent}</p>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-[#2878D9]" />}
                  </div>
                  <p className="text-sm text-[#6B7280] mt-0.5">{n.text}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{n.time}</p>
                </div>
                <button onClick={() => toggleArchive(n.id)} className="p-1 hover:bg-[#F3F4F6] rounded flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100">
                  <X size={14} className="text-[#9CA3AF]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
