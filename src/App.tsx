import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Inbox, House, Ticket, AudioLines, Calendar,
  MessageCircle, BarChart3, Building2, Settings, CircleHelp,
  ChevronLeft, Filter, MoreHorizontal, Phone, MapPin,
  Paperclip, Smile, ImageIcon, Type, Send, Pencil,
  ChevronDown, Pause, X, Circle, Loader2, Plus, Check
} from 'lucide-react'
const DB_API = import.meta.env.DEV ? 'http://localhost:3456' : 'https://ai-chatbot-db.YOUR-ACCOUNT.workers.dev'
const agents = [
  { name: 'Claude Opus 4.8', model: 'claude-opus-4-8', specialty: 'Architecture & Reasoning', online: true },
  { name: 'Claude Opus 4.7', model: 'claude-opus-4-7', specialty: 'Complex Debugging', online: true },
  { name: 'Claude Opus 4.6', model: 'claude-opus-4-6', specialty: 'Agentic Workflows', online: true },
  { name: 'Claude Sonnet 4.6', model: 'claude-sonnet-4-6', specialty: 'Daily Driver — All Tasks', online: true },
  { name: 'Claude Sonnet 4.5', model: 'claude-sonnet-4-5-20250929', specialty: 'Balanced Chat', online: true },
  { name: 'Claude Haiku 4.5', model: 'claude-haiku-4-5-20251001', specialty: 'Speed & High Volume', online: true },
  { name: 'GPT-5.5', model: 'gpt-5.5', specialty: 'Code Generation', online: true },
  { name: 'GPT-5.4', model: 'gpt-5.4', specialty: 'General Purpose', online: true },
  { name: 'GPT-5.4 Mini', model: 'gpt-5.4-mini', specialty: 'Lightweight Tasks', online: true },
  { name: 'Gemini 3.1 Pro', model: 'gemini-3.1-pro-preview', specialty: 'Research & Analysis', online: true },
  { name: 'Blackbox', model: 'blackbox', specialty: 'Untested', online: false },
]

type Session = { id: string; name: string; preview: string; unread: number }
type Message = { role: 'user' | 'assistant'; content: string }

function IconSidebar() {
  const topIcons = [
    { icon: Search, active: false }, { icon: Inbox, active: false },
    { icon: House, active: false }, { icon: Ticket, active: false },
    { icon: AudioLines, active: false }, { icon: Calendar, active: false },
    { icon: MessageCircle, active: false }, { icon: BarChart3, active: true },
    { icon: Building2, active: false },
  ]
  const bottomIcons = [
    { icon: Settings, active: false }, { icon: CircleHelp, active: false },
  ]
  return (
    <div className="w-[52px] flex-shrink-0 bg-white border-r border-[#ECECEC] flex flex-col items-center py-3 justify-between">
      <div className="flex flex-col items-center gap-6">
        {topIcons.map(({ icon: Icon, active }, i) => (
          <Icon key={i} size={20} className={active ? 'text-[#2563EB]' : 'text-[#9CA3AF]'} strokeWidth={1.8} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-6">
        {bottomIcons.map(({ icon: Icon, active }, i) => (
          <Icon key={i} size={20} className={active ? 'text-[#2563EB]' : 'text-[#9CA3AF]'} strokeWidth={1.8} />
        ))}
        <div className="w-8 h-8 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-semibold text-[#111827]">U</div>
      </div>
    </div>
  )
}

function NavSidebar({ selectedAgent, onSelectAgent }: { selectedAgent: string; onSelectAgent: (n: string) => void }) {
  return (
    <div className="w-[220px] flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col p-4 gap-5 overflow-y-auto">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none" placeholder="Search chat" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">INBOX</p>
        {[
          { label: 'All', count: 6 }, { label: 'Assigned to me', count: 6, selected: true }, { label: 'Unassigned', count: 6 },
        ].map((item, i) => (
          <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${item.selected ? 'bg-[#F3F4F6] text-[#111827] font-medium' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>
            <span>{item.label}</span><span className="text-xs text-[#9CA3AF]">{item.count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">STATUS</p>
        {[
          { label: 'All', count: 56, color: '#9CA3AF' }, { label: 'Agent', count: 123, color: '#2563EB' },
          { label: 'Awaiting agent', count: 34, color: '#D97706' }, { label: 'Paused', count: 89, color: '#EAB308' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#6B7280] cursor-pointer hover:bg-[#F9FAFB]">
            <div className="flex items-center gap-2"><Circle size={8} fill={item.color} stroke="none" /><span>{item.label}</span></div>
            <span className="text-xs text-[#9CA3AF]">{item.count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">CHANNEL</p>
        {[
          { label: 'All', count: 56 }, { label: 'SMS', count: 123 }, { label: 'Whatsapp', count: 34 },
          { label: 'Instagram', count: 89 }, { label: 'Web', count: 89 },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#6B7280] cursor-pointer hover:bg-[#F9FAFB]">
            <span>{item.label}</span><span className="text-xs text-[#9CA3AF]">{item.count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">AGENTS</p>
        {agents.map((agent, i) => (
          <div key={i} onClick={() => onSelectAgent(agent.name)} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${selectedAgent === agent.name ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'}`}>
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">{agent.name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${agent.online ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#111827] truncate">{agent.name}</p>
              <p className="text-xs text-[#6B7280] truncate">{agent.specialty}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionList({ sessions, selectedSession, onSelectSession, onNewSession, onRenameSession }: {
  sessions: Session[]; selectedSession: string; onSelectSession: (id: string) => void; onNewSession: () => void; onRenameSession: (id: string, name: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renaming])

  function startRename(id: string, currentName: string) {
    setRenaming(id)
    setRenameValue(currentName)
    setMenuOpen(null)
  }

  function confirmRename(id: string) {
    if (renameValue.trim()) {
      onRenameSession(id, renameValue.trim())
    }
    setRenaming(null)
    setRenameValue('')
  }

  return (
    <div className="w-[300px] flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <ChevronLeft size={18} className="text-[#6B7280]" />
          <span className="text-sm font-semibold text-[#111827]">Sessions</span>
        </div>
        <button onClick={onNewSession} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]">
          <Plus size={14} />
          New Session
        </button>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#E5E7EB]">
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]"><Filter size={14} />Filter</button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2878D9] rounded-lg text-xs font-medium text-[#2878D9]">Open</button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Newest</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="flex items-center justify-center h-full px-4">
            <p className="text-sm text-[#9CA3AF] text-center">No sessions yet. Click "+ New Session" to start.</p>
          </div>
        )}
        {sessions.map((session) => (
          <div key={session.id} onClick={() => { if (!renaming) onSelectSession(session.id) }} className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#F3F4F6] ${selectedSession === session.id ? 'bg-[#FAFAFA]' : 'hover:bg-[#FAFAFA]'}`}>
            <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex-shrink-0 flex items-center justify-center text-xs font-medium text-[#6B7280]">
              {session.name === 'New Session' ? '?' : session.name.split(' ').slice(-2).map(s => s[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                {renaming === session.id ? (
                  <div className="flex items-center gap-1 flex-1 mr-1">
                    <input
                      ref={inputRef}
                      className="flex-1 text-sm font-medium text-[#111827] border border-[#2878D9] rounded px-1.5 py-0.5 outline-none"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') confirmRename(session.id); if (e.key === 'Escape') setRenaming(null) }}
                      onClick={e => e.stopPropagation()}
                    />
                    <button onClick={e => { e.stopPropagation(); confirmRename(session.id) }}><Check size={14} className="text-[#22C55E]" /></button>
                    <button onClick={e => { e.stopPropagation(); setRenaming(null) }}><X size={14} className="text-[#EF4444]" /></button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-[#111827] truncate">{session.name}</p>
                    <div className="relative flex-shrink-0 ml-2">
                      <MoreHorizontal size={14} className="text-[#9CA3AF] cursor-pointer" onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === session.id ? null : session.id) }} />
                      {menuOpen === session.id && (
                        <div ref={menuRef} className="absolute right-0 top-5 z-10 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 min-w-[120px]" onClick={e => e.stopPropagation()}>
                          <button onClick={() => startRename(session.id, session.name)} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[#111827] hover:bg-[#F9FAFB]">
                            <Pencil size={13} /> Rename
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-[#6B7280] truncate">{session.preview}</p>
                {session.unread > 0 && (
                  <div className="w-4 h-4 rounded bg-[#D97706] flex items-center justify-center flex-shrink-0 ml-2">
                    <span className="text-[10px] font-bold text-white">{session.unread}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Conversation({ sessionId, model, sessionName, onFirstMessage }: {
  sessionId: string; model: string; sessionName: string; onFirstMessage: (id: string, text: string) => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasNamed, setHasNamed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sessionId) return
    setMessages([])
    setHasNamed(false)
    fetch(`${DB_API}/messages?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data) setMessages(data)
      })
      .catch(() => {})
  }, [sessionId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    if (!hasNamed && sessionName === 'New Session') {
      setHasNamed(true)
      onFirstMessage(sessionId, text)
    }

    fetch(`${DB_API}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, role: 'user', content: text }),
    }).catch(() => {})

    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMsg], model }),
      })
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: request failed' }])
        setLoading(false)
        return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let reply = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]')
        for (const line of lines) {
          try {
            const delta = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''
            reply += delta
            setMessages(prev => {
              const copy = [...prev]
              copy[copy.length - 1] = { role: 'assistant', content: reply }
              return copy
            })
          } catch {}
        }
      }
      if (reply) {
        fetch(`${DB_API}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, role: 'assistant', content: reply }),
        }).catch(() => {})
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: connection failed' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      <div className="flex items-center justify-between px-5 h-14 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">
            {sessionName === 'New Session' ? '?' : sessionName.split(' ').slice(-2).map(s => s[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{sessionName}</p>
            <p className="text-xs text-[#22C55E]">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]"><Pause size={14} />Pause</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]"><X size={14} />Close</button>
          <ChevronDown size={16} className="text-[#6B7280]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#9CA3AF]">Ask {sessionName} anything...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[400px] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
            <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#2878D9] text-white' : 'bg-[#F5F5F5] text-[#111827]'}`}>
              {msg.content || (msg.role === 'assistant' && loading && i === messages.length - 1 ? <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{animationDelay:'0ms'}} /><span className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{animationDelay:'150ms'}} /><span className="w-1.5 h-1.5 bg-[#6B7280] rounded-full animate-bounce" style={{animationDelay:'300ms'}} /></span> : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-[#E5E7EB] px-5 py-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl">
          <textarea
            className="w-full resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-4 pt-3 h-20"
            placeholder='Type "/" to use template message'
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <Paperclip size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <Smile size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <ImageIcon size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <Type size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Assign to Form</button>
              <button onClick={handleSend} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D97706] text-white rounded-lg text-xs font-medium hover:bg-[#B45309] disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoPanel() {
  return (
    <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">CG</div>
          <p className="text-sm font-semibold text-[#111827]">Cora Goyette</p>
        </div>
        <Pencil size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
      </div>
      <div className="px-5 py-4 space-y-3 border-b border-[#E5E7EB]">
        {[
          { label: 'Channel', value: 'WhatsAppB2B' },
          { label: 'ID', value: '2023113142356' },
          { label: 'Phone', value: '+6267976229012', icon: Phone },
          { label: 'Address', value: '5467 Richmond View\nSuite 511\nSunrise\nKentucky\n43546-6636', icon: MapPin },
        ].map((item, i) => (
          <div key={i}>
            <p className="text-xs text-[#9CA3AF] mb-0.5">{item.label}</p>
            <div className="flex items-start gap-1.5">
              {item.icon && <item.icon size={14} className="text-[#9CA3AF] mt-0.5 flex-shrink-0" />}
              <p className="text-sm text-[#111827] whitespace-pre-line">{item.value}</p>
            </div>
          </div>
        ))}
        <button className="text-xs text-[#2878D9] font-medium hover:underline">+ Add new attribute</button>
      </div>
      <div className="px-5 py-4 border-b border-[#E5E7EB]">
        <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-2">NOTES</p>
        <div className="border border-[#E5E7EB] rounded-lg">
          <textarea className="w-full h-20 resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-3 pt-2" placeholder="Write a note..." />
          <div className="flex items-center gap-2 px-3 pb-2">
            <Paperclip size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
            <Smile size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex-1">
        <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3">ACTIVITY</p>
        <div className="space-y-4">
          {[{n:'Justin Hickle',t:'Feb 23, 18:43',s:'Send Sarah an update by email by 4PM tomorrow.'},{n:'Justin Hickle',t:'Feb 23, 18:43',s:'Send Sarah an update by email by 4PM tomorrow.'},{n:'Justin Hickle',t:'Feb 23, 18:43',s:'Send Sarah an update by email by 4PM tomorrow.'}].map((a, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-[#E5E7EB] flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-medium text-[#6B7280]">{a.n.split(' ').map(s => s[0]).join('')}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between"><p className="text-xs font-medium text-[#111827]">{a.n}</p><MoreHorizontal size={12} className="text-[#9CA3AF] flex-shrink-0" /></div>
                <p className="text-xs text-[#9CA3AF]">{a.t}</p>
                <p className="text-xs text-[#6B7280] mt-1">{a.s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0].name)
  const [sessionsByAgent, setSessionsByAgent] = useState<Record<string, Session[]>>(() => {
    const initial: Record<string, Session[]> = {}
    agents.forEach(a => { initial[a.name] = [] })
    return initial
  })
  const [selectedSession, setSelectedSession] = useState('')

  const sessions = sessionsByAgent[selectedAgent] || []
  const agent = agents.find(a => a.name === selectedAgent)
  const session = sessions.find(s => s.id === selectedSession)

  useEffect(() => {
    agents.forEach(a => {
      fetch(`${DB_API}/sessions?agent=${encodeURIComponent(a.name)}`)
        .then(r => r.json())
        .then(data => {
          if (data) setSessionsByAgent(prev => ({ ...prev, [a.name]: data }))
        })
        .catch(() => {})
    })
  }, [])

  const handleNewSession = useCallback(() => {
    const slug = selectedAgent.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8)
    const id = `${slug}-${Date.now()}`
    const newSession: Session = { id, name: 'New Session', preview: '', unread: 0 }
    fetch(`${DB_API}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: 'New Session', agent: selectedAgent }),
    }).catch(() => {})
    setSessionsByAgent(prev => ({
      ...prev,
      [selectedAgent]: [newSession, ...(prev[selectedAgent] || [])],
    }))
    setSelectedSession(id)
  }, [selectedAgent])

  const handleFirstMessage = useCallback((sessionId: string, text: string) => {
    const name = text.length > 40 ? text.slice(0, 40) + '...' : text
    fetch(`${DB_API}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, preview: text }),
    }).catch(() => {})
    setSessionsByAgent(prev => ({
      ...prev,
      [selectedAgent]: (prev[selectedAgent] || []).map(s =>
        s.id === sessionId ? { ...s, name, preview: text } : s
      ),
    }))
  }, [selectedAgent])

  const handleRenameSession = useCallback((sessionId: string, name: string) => {
    fetch(`${DB_API}/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).catch(() => {})
    setSessionsByAgent(prev => ({
      ...prev,
      [selectedAgent]: (prev[selectedAgent] || []).map(s =>
        s.id === sessionId ? { ...s, name } : s
      ),
    }))
  }, [selectedAgent])

  return (
    <div className="h-full flex bg-[#FAFAFA] font-['Inter',sans-serif]">
      <IconSidebar />
      <NavSidebar selectedAgent={selectedAgent} onSelectAgent={(name) => { setSelectedAgent(name); setSelectedSession('') }} />
      <SessionList sessions={sessions} selectedSession={selectedSession} onSelectSession={setSelectedSession} onNewSession={handleNewSession} onRenameSession={handleRenameSession} />
      {session ? (
        <Conversation sessionId={session.id} model={agent?.model || ''} sessionName={session.name} onFirstMessage={handleFirstMessage} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <p className="text-sm text-[#9CA3AF]">Select a session or start a new one</p>
        </div>
      )}
      <InfoPanel />
    </div>
  )
}
