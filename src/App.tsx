import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Inbox, House, Ticket, AudioLines, Calendar,
  MessageCircle, BarChart3, Building2, Settings, CircleHelp,
  ChevronLeft, Filter, MoreHorizontal,
  Paperclip, Smile, ImageIcon, Type, Send, Pencil,
  ChevronDown, Pause, Play, X, Circle, Loader2, Plus, Check
} from 'lucide-react'
const DB_API = import.meta.env.DEV ? 'http://localhost:3456' : 'https://ai-chatbot-api.satyanagesh-r.workers.dev'
const AGENTS_DATA = [
  { name: 'Claude Code', model: 'claude-opus-4-8', specialty: 'Full-Stack Engineering & UI/UX', online: true, description: 'Your AI pair programmer powered by Claude, specializing in full-stack development, UI/UX design, and system architecture. Handles everything from database design to deployment.', capabilities: ['Full-stack development', 'UI/UX design systems', 'System architecture & DevOps', 'Code generation & review'], bestAt: 'Building and deploying production-grade applications from concept to completion', source: 'tokenlb.net' },
  { name: 'Claude Opus 4.8', model: 'claude-opus-4-8', specialty: 'Architecture & Reasoning', online: true, description: 'Claude Opus 4.8 is Anthropic\'s most capable model, excelling at complex reasoning, nuanced analysis, and architecting large-scale systems.', capabilities: ['System architecture & design', 'Complex multi-step reasoning', 'Code analysis & review'], bestAt: 'Designing distributed systems and solving novel architecture problems', source: 'tokenlb.net' },
  { name: 'Claude Opus 4.7', model: 'claude-opus-4-7', specialty: 'Complex Debugging', online: true, description: 'Claude Opus 4.7 specializes in deep debugging, tracing issues across layers, and fixing intricate codebase problems.', capabilities: ['Deep debugging & root cause analysis', 'Performance optimization', 'Cross-layer issue tracing'], bestAt: 'Finding and fixing the hardest bugs in complex codebases', source: 'tokenlb.net' },
  { name: 'Claude Opus 4.6', model: 'claude-opus-4-6', specialty: 'Agentic Workflows', online: true, description: 'Claude Opus 4.6 is optimized for autonomous agentic workflows, multi-step tool use, and structured task execution.', capabilities: ['Autonomous task execution', 'Multi-step tool orchestration', 'Workflow automation'], bestAt: 'Running multi-step autonomous workflows with reliable tool use', source: 'tokenlb.net' },
  { name: 'Claude Sonnet 4.6', model: 'claude-sonnet-4-6', specialty: 'Daily Driver — All Tasks', online: true, description: 'Claude Sonnet 4.6 is the ideal daily driver — fast, capable, and well-rounded across all task types.', capabilities: ['General coding & debugging', 'Content writing & analysis', 'Data processing & automation'], bestAt: 'Being the all-around daily driver for any task', source: 'tokenlb.net' },
  { name: 'Claude Sonnet 4.5', model: 'claude-sonnet-4-5-20250929', specialty: 'Balanced Chat', online: true, description: 'Claude Sonnet 4.5 strikes a refined balance between speed, cost, and conversational quality.', capabilities: ['Natural conversation', 'Quick code snippets', 'Documentation & explanation'], bestAt: 'Balanced, natural conversations with quick, accurate responses', source: 'tokenlb.net' },
  { name: 'Claude Haiku 4.5', model: 'claude-haiku-4-5-20251001', specialty: 'Speed & High Volume', online: true, description: 'Claude Haiku 4.5 is Anthropic\'s fastest model, built for high-throughput, low-latency use cases.', capabilities: ['Lightning-fast responses', 'High-volume processing', 'Simple code generation'], bestAt: 'Blazing fast responses for high-volume, simple tasks', source: 'tokenlb.net' },
  { name: 'GPT-5.5', model: 'gpt-5.5', specialty: 'Code Generation', online: true, description: 'GPT-5.5 is OpenAI\'s latest model with state-of-the-art code generation and problem-solving abilities.', capabilities: ['Code generation & translation', 'Algorithm design', 'Technical documentation'], bestAt: 'Generating production-quality code across multiple languages', source: 'tokenlb.net' },
  { name: 'GPT-5.4', model: 'gpt-5.4', specialty: 'General Purpose', online: true, description: 'GPT-5.4 is a reliable, general-purpose model from OpenAI suitable for a wide variety of tasks.', capabilities: ['General problem solving', 'Content creation', 'Data analysis'], bestAt: 'Reliable general-purpose assistance for everyday tasks', source: 'tokenlb.net' },
  { name: 'GPT-5.4 Mini', model: 'gpt-5.4-mini', specialty: 'Lightweight Tasks', online: true, description: 'GPT-5.4 Mini is a lightweight, cost-effective model for simple, routine tasks that don\'t require full-scale reasoning.', capabilities: ['Simple Q&A', 'Text summarization', 'Quick formatting'], bestAt: 'Cost-effective handling of simple, repetitive tasks', source: 'tokenlb.net' },
  { name: 'Gemini 3.1 Pro', model: 'gemini-3.1-pro-preview', specialty: 'Research & Analysis', online: true, description: 'Google Gemini 3.1 Pro excels at research, analysis, and understanding context across very long documents.', capabilities: ['Long-context reasoning', 'Research synthesis', 'Multimodal understanding'], bestAt: 'Analyzing long documents and synthesizing research insights', source: 'Bluesminds' },
  { name: 'Blackbox', model: 'blackbox', specialty: 'Untested', online: false, description: 'Blackbox is an experimental model available via Bluesminds. Capabilities are currently being evaluated.', capabilities: ['Currently testing'], bestAt: 'TBD — connection being evaluated', source: 'Bluesminds' },
]

type Agent = typeof AGENTS_DATA[0]
type Session = { id: string; name: string; preview: string; unread: number }
type Message = { role: 'user' | 'assistant'; content: string }
type MCPServer = { name: string; url: string }
type Activity = { user: string; time: string; text: string; status: 'done' | 'doing' | 'pending' | 'waiting' }

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

function NavSidebar({ agents, selectedAgent, onSelectAgent }: { agents: typeof AGENTS_DATA; selectedAgent: string; onSelectAgent: (n: string) => void }) {
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
        {agents.map((agent) => (
          <div key={agent.name} onClick={() => onSelectAgent(agent.name)} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${selectedAgent === agent.name ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'}`}>
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

function Conversation({ sessionId, model, sessionName, onFirstMessage, onClose, onActivity }: {
  sessionId: string; model: string; sessionName: string; onFirstMessage: (id: string, text: string) => void; onClose: () => void; onActivity?: (a: Activity) => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hasNamed, setHasNamed] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!sessionId) return
    setMessages([])
    setHasNamed(false)
    setPaused(false)
    fetch(`${DB_API}/messages?session_id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data) setMessages(data)
      })
      .catch(() => {})
  }, [sessionId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!onActivity) return
    if (loading) onActivity({ user: sessionName, time: new Date().toLocaleString(), text: 'Agent is responding...', status: 'doing' })
    else if (paused) onActivity({ user: sessionName, time: new Date().toLocaleString(), text: 'Response paused by user', status: 'waiting' })
  }, [loading, paused])

  const lastMsg = messages[messages.length - 1]
  useEffect(() => {
    if (!onActivity || !lastMsg || lastMsg.role !== 'assistant' || loading) return
    onActivity({ user: lastMsg.role === 'assistant' ? sessionName : 'User', time: new Date().toLocaleString(), text: lastMsg.content.slice(0, 80) + (lastMsg.content.length > 80 ? '...' : ''), status: 'done' })
  }, [messages.length])

  async function handleSend(forcedText?: string) {
    const text = forcedText || input.trim()
    if (!text || loading) return
    if (!forcedText) setInput('')
    const userMsg: Message = { role: 'user', content: text }
    if (!forcedText) setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setPaused(false)

    if (!forcedText && !hasNamed && sessionName === 'New Session') {
      setHasNamed(true)
      onFirstMessage(sessionId, text)
    }

    if (!forcedText) {
      fetch(`${DB_API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, role: 'user', content: text }),
      }).catch(() => {})
    }

    abortRef.current = new AbortController()
    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ messages: forcedText ? messages : [...messages, userMsg], model }),
      })
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: request failed' }])
        abortRef.current = null
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
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setMessages(prev => prev.slice(0, -1))
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: connection failed' }])
      }
    }
    abortRef.current = null
    setLoading(false)
  }

  async function handleResume() {
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.role !== 'user') return
    await handleSend(lastMsg.content)
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
          {paused ? (
            <button onClick={handleResume} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D97706] rounded-lg text-xs font-medium text-[#D97706] hover:bg-[#FFFBEB]"><Play size={14} />Resume</button>
          ) : (
            <button onClick={() => { abortRef.current?.abort(); setPaused(true) }} disabled={!loading} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"><Pause size={14} />Pause</button>
          )}
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]"><X size={14} />Close</button>
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
              <button onClick={() => handleSend()} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D97706] text-white rounded-lg text-xs font-medium hover:bg-[#B45309] disabled:opacity-50">
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

function InfoPanel({ agent, mcpServers, onRenameAgent, onAddMCPServer, notes, onNotesChange, activities }: {
  agent?: Agent; mcpServers: MCPServer[]; onRenameAgent: (oldName: string, newName: string) => void
  onAddMCPServer: (s: MCPServer) => void; notes: string; onNotesChange: (v: string) => void; activities: Activity[]
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [addingMcp, setAddingMcp] = useState(false)
  const [mcpName, setMcpName] = useState('')
  const [mcpUrl, setMcpUrl] = useState('')

  if (!agent) return <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#E5E7EB]" />

  const initials = agent.name.split(' ').slice(-2).map(s => s[0]).join('')

  return (
    <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">{initials}</div>
          {editingName ? (
            <div className="flex items-center gap-1">
              <input className="text-sm font-semibold text-[#111827] border border-[#2878D9] rounded px-1.5 py-0.5 w-28 outline-none" value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onRenameAgent(agent.name, nameInput); setEditingName(false) } if (e.key === 'Escape') setEditingName(false) }} autoFocus />
              <button onClick={() => { onRenameAgent(agent.name, nameInput); setEditingName(false) }}><Check size={14} className="text-[#22C55E]" /></button>
              <button onClick={() => setEditingName(false)}><X size={14} className="text-[#EF4444]" /></button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#111827]">{agent.name}</p>
          )}
        </div>
        <Pencil size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" onClick={() => { setEditingName(true); setNameInput(agent.name) }} />
      </div>

      <div className="px-5 py-4 space-y-3 border-b border-[#E5E7EB]">
        <div><p className="text-xs text-[#9CA3AF] mb-0.5">What this agent does</p><p className="text-sm text-[#111827]">{agent.description}</p></div>
        <div><p className="text-xs text-[#9CA3AF] mb-0.5">What it can do</p><ul className="list-disc list-inside text-sm text-[#111827]">{agent.capabilities.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
        <div><p className="text-xs text-[#9CA3AF] mb-0.5">Best at</p><p className="text-sm text-[#111827]">{agent.bestAt}</p></div>
      </div>

      <div className="px-5 py-4 space-y-3 border-b border-[#E5E7EB]">
        <div><p className="text-xs text-[#9CA3AF] mb-0.5">API Source</p><p className="text-sm text-[#111827]">{agent.source}</p></div>
        <div>
          <p className="text-xs text-[#9CA3AF] mb-0.5">Connected MCP Servers</p>
          {mcpServers.length === 0 ? <p className="text-sm text-[#9CA3AF] italic">No MCP servers</p> : (
            mcpServers.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm text-[#111827] mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> {s.name} <span className="text-[#9CA3AF] text-xs">({s.url})</span>
              </div>
            ))
          )}
          {addingMcp ? (
            <div className="flex flex-col gap-1.5 mt-2">
              <input className="text-xs border border-[#E5E7EB] rounded px-2 py-1 outline-none" placeholder="Server name" value={mcpName} onChange={e => setMcpName(e.target.value)} />
              <input className="text-xs border border-[#E5E7EB] rounded px-2 py-1 outline-none" placeholder="ws:// or http:// URL" value={mcpUrl} onChange={e => setMcpUrl(e.target.value)} />
              <div className="flex gap-2">
                <button className="text-xs font-medium text-[#22C55E]" onClick={() => { if (mcpName && mcpUrl) { onAddMCPServer({ name: mcpName, url: mcpUrl }); setMcpName(''); setMcpUrl(''); setAddingMcp(false) } }}>Add</button>
                <button className="text-xs font-medium text-[#EF4444]" onClick={() => setAddingMcp(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="text-xs text-[#2878D9] font-medium hover:underline mt-1" onClick={() => setAddingMcp(true)}>+ Add MCP server</button>
          )}
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF] mb-0.5">Integrations</p>
          <div className="flex items-center gap-3 text-sm text-[#111827]">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D1D5DB]" /> Obsidian-MCP</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D1D5DB]" /> Ruflo</div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-[#E5E7EB]">
        <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-2">NOTES</p>
        <div className="border border-[#E5E7EB] rounded-lg">
          <textarea className="w-full h-20 resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-3 pt-2" placeholder="Write a note..." value={notes} onChange={e => onNotesChange(e.target.value)} />
          <div className="flex items-center gap-2 px-3 pb-2">
            <Paperclip size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
            <Smile size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex-1">
        <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3">ACTIVITY</p>
        <div className="space-y-4">
          {activities.length === 0 ? <p className="text-xs text-[#9CA3AF] italic">No recent activity</p> : (
            activities.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.status === 'done' ? 'bg-[#22C55E]' : a.status === 'doing' ? 'bg-[#2878D9] animate-pulse' : a.status === 'waiting' ? 'bg-[#D97706]' : 'bg-[#D1D5DB]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111827]">{a.user}</p>
                  <p className="text-xs text-[#9CA3AF]">{a.time}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{a.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [agents, setAgents] = useState(AGENTS_DATA)
  const [selectedAgent, setSelectedAgent] = useState(AGENTS_DATA[0].name)
  const [sessionsByAgent, setSessionsByAgent] = useState<Record<string, Session[]>>(() => {
    const initial: Record<string, Session[]> = {}
    AGENTS_DATA.forEach(a => { initial[a.name] = [] })
    return initial
  })
  const [selectedSession, setSelectedSession] = useState('')
  const [mcpServers, setMcpServers] = useState<Record<string, MCPServer[]>>({})
  const [agentNotes, setAgentNotes] = useState<Record<string, string>>({})
  const [activities, setActivities] = useState<Activity[]>([])

  const sessions = sessionsByAgent[selectedAgent] || []
  const agent = agents.find(a => a.name === selectedAgent)
  const session = sessions.find(s => s.id === selectedSession)

  useEffect(() => {
    AGENTS_DATA.forEach(a => {
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

  const handleRenameAgent = useCallback((oldName: string, newName: string) => {
    if (oldName === newName) return
    setAgents(prev => prev.map(a => a.name === oldName ? { ...a, name: newName } : a))
    setSessionsByAgent(prev => {
      const sessions = prev[oldName] || []
      const copy = { ...prev }
      delete copy[oldName]
      copy[newName] = sessions
      return copy
    })
    if (selectedAgent === oldName) setSelectedAgent(newName)
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
      <NavSidebar agents={agents} selectedAgent={selectedAgent} onSelectAgent={(name) => { setSelectedAgent(name); setSelectedSession('') }} />
      <SessionList sessions={sessions} selectedSession={selectedSession} onSelectSession={setSelectedSession} onNewSession={handleNewSession} onRenameSession={handleRenameSession} />
      {session ? (
        <Conversation sessionId={session.id} model={agent?.model || ''} sessionName={session.name} onFirstMessage={handleFirstMessage} onClose={() => setSelectedSession('')} onActivity={a => setActivities(prev => [a, ...prev].slice(0, 20))} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <p className="text-sm text-[#9CA3AF]">Select a session or start a new one</p>
        </div>
      )}
      <InfoPanel
        agent={agent}
        mcpServers={mcpServers[selectedAgent] || []}
        onRenameAgent={handleRenameAgent}
        onAddMCPServer={s => setMcpServers(prev => ({ ...prev, [selectedAgent]: [...(prev[selectedAgent] || []), s] }))}
        notes={agentNotes[selectedSession] || ''}
        onNotesChange={v => setAgentNotes(prev => ({ ...prev, [selectedSession]: v }))}
        activities={activities}
      />
    </div>
  )
}
