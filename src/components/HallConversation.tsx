import { useState, useEffect, useRef } from 'react'
import { Paperclip, Smile, ImageIcon, Type, Send, ChevronDown, Pause, Play, X, Loader2 } from 'lucide-react'
import type { HallMessage, Activity, GreatHall } from '../types'
import { AGENTS_DATA, AGENT_COLORS, DB_API } from '../data/agents'
import { encodeAgentMsg, decodeAgentMsg } from '../utils/helpers'

export default function HallConversation({ hall, onClose, onActivity, onPauseChange }: {
  hall: GreatHall; onClose: () => void; onActivity?: (a: Activity) => void; onPauseChange?: (id: string, paused: boolean) => void
}) {
  const [messages, setMessages] = useState<HallMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentAgentIdx, setCurrentAgentIdx] = useState(-1)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sessionId = hall.id

  const hallName = sessionName || hall.name

  useEffect(() => { loadMessages() }, [hall.id])

  async function loadMessages() {
    try {
      const res = await fetch(`${DB_API}/messages?session_id=${sessionId}`)
      const data = await res.json()
      if (data && data.length > 0) {
        const parsed: HallMessage[] = data.map((m: { role: string; content: string }) => {
          if (m.role === 'assistant') {
            const decoded = decodeAgentMsg(m.content)
            return { ...m, content: decoded.text, agentName: decoded.agent }
          }
          return { ...m, content: m.content }
        })
        setMessages(parsed)
        const firstUser = parsed.find(m => m.role === 'user')
        if (firstUser) setSessionName(firstUser.content.length > 40 ? firstUser.content.slice(0, 40) + '...' : firstUser.content)
      }
    } catch {}
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, currentAgentIdx])

  function reportActivity(agent: string, text: string, status: 'doing' | 'done' | 'waiting') {
    onActivity?.({ user: agent, time: new Date().toLocaleString(), text, status })
  }

  async function sendToAgent(agentName: string, history: HallMessage[]): Promise<string> {
    const agent = AGENTS_DATA.find(a => a.name === agentName)
    if (!agent) return ''

    const apiMessages = history.map(m => ({ role: m.role, content: m.content }))

    reportActivity(agentName, 'Agent is thinking...', 'doing')
    setCurrentAgentIdx(hall.agents.indexOf(agentName))
    setMessages(prev => [...prev, { role: 'assistant', content: '', agentName }])

    abortRef.current = new AbortController()
    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({ messages: apiMessages, model: agent.model }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
        const errMsg = errBody?.error?.message || errBody?.error || 'Error: request failed'
        setMessages(prev => {
          const copy = [...prev]
          if (copy[copy.length - 1]?.role === 'assistant' && copy[copy.length - 1]?.agentName === agentName) {
            copy[copy.length - 1] = { role: 'assistant', content: errMsg, agentName }
          }
          return copy
        })
        return ''
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let reply = ''
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
              if (copy[copy.length - 1]?.agentName === agentName) {
                copy[copy.length - 1] = { role: 'assistant', content: reply, agentName }
              }
              return copy
            })
          } catch {}
        }
      }
      if (reply) {
        fetch(`${DB_API}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, role: 'assistant', content: encodeAgentMsg(agentName, reply) }),
        }).catch(() => {})
      }
      reportActivity(agentName, reply.slice(0, 80) + (reply.length > 80 ? '...' : ''), 'done')
      return reply
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setMessages(prev => prev.filter(m => m.content !== '' || m.agentName !== agentName))
        return ''
      }
      setMessages(prev => {
        const copy = [...prev]
        const idx = copy.findIndex(m => m.role === 'assistant' && m.agentName === agentName && m.content === '')
        if (idx >= 0) copy[idx] = { role: 'assistant', content: 'Error: connection failed', agentName }
        return copy
      })
      return ''
    }
  }

  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setCurrentAgentIdx(0)
    setPaused(false)

    if (!sessionName) {
      const name = text.length > 40 ? text.slice(0, 40) + '...' : text
      setSessionName(name)
    }

    const userMsg: HallMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])

    fetch(`${DB_API}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, role: 'user', content: text }),
    }).catch(() => {})

    let currentHistory = [...messages, userMsg]
    for (const agentName of hall.agents) {
      if (pausedRef.current) break
      const reply = await sendToAgent(agentName, currentHistory)
      if (reply) currentHistory = [...currentHistory, { role: 'assistant', content: reply, agentName }]
    }

    setCurrentAgentIdx(-1)
    setLoading(false)
  }

  function handlePause() {
    abortRef.current?.abort()
    setPaused(true)
    pausedRef.current = true
    setCurrentAgentIdx(-1)
    setLoading(false)
    onPauseChange?.(hall.id, true)
  }

  const agentColors = hall.agents.reduce((acc, name, i) => {
    acc[name] = AGENT_COLORS[i % AGENT_COLORS.length]
    return acc
  }, {} as Record<string, string>)

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0">
      <div className="flex items-center justify-between px-5 h-14 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {hall.agents.slice(0, 4).map((name, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-medium" style={{ backgroundColor: agentColors[name] + '22', color: agentColors[name] }}>{name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
            ))}
            {hall.agents.length > 4 && <div className="w-7 h-7 rounded-full bg-[#E5E7EB] border-2 border-white flex items-center justify-center text-[9px] font-medium text-[#6B7280]">+{hall.agents.length - 4}</div>}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{hallName}</p>
            <p className="text-xs text-[#6B7280]">{hall.agents.length} agents</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#2878D9]">
              <Loader2 size={14} className="animate-spin" />
              {currentAgentIdx >= 0 ? `${hall.agents[currentAgentIdx]} (${currentAgentIdx + 1}/${hall.agents.length})` : 'Processing...'}
            </div>
          )}
          {paused ? (
            <button onClick={() => { setPaused(false); pausedRef.current = false; onPauseChange?.(hall.id, false) }} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D97706] rounded-lg text-xs font-medium text-[#D97706] hover:bg-[#FFFBEB]"><Play size={14} />Resume</button>
          ) : (
            <button onClick={handlePause} disabled={!loading} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"><Pause size={14} />Pause</button>
          )}
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]"><X size={14} />Close</button>
          <ChevronDown size={16} className="text-[#6B7280]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[#9CA3AF] text-center max-w-md">
              Send a message to all agents in <span className="font-semibold">{hall.name}</span>.<br />
              They'll respond one after another, building on each other's answers.
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          if (msg.role === 'user') {
            return (
              <div key={i} className="max-w-[500px] ml-auto">
                <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-[#2878D9] text-white">{msg.content}</div>
              </div>
            )
          }
          const color = msg.agentName ? agentColors[msg.agentName] || '#6B7280' : '#6B7280'
          return (
            <div key={i} className="max-w-[500px] mr-auto">
              {msg.agentName && (
                <div className="flex items-center gap-2 mb-1 ml-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-medium" style={{ backgroundColor: color + '22', color }}>{msg.agentName.split(' ').slice(-2).map(s => s[0]).join('')}</div>
                  <span className="text-xs font-medium" style={{ color }}>{msg.agentName}</span>
                </div>
              )}
              <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ backgroundColor: color + '0D', color: '#111827' }}>
                {msg.content || (loading && (
                  <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '300ms' }} /></span>
                ))}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#E5E7EB] px-5 py-4">
        <div className="bg-white border border-[#E5E7EB] rounded-xl">
          <textarea className="w-full resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-4 pt-3 h-20" placeholder={`Ask ${hall.agents.length} agents in ${hall.name}...`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-2">
              <Paperclip size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <Smile size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <ImageIcon size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <Type size={16} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              {hall.agents.map((name) => (
                <div key={name} className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-medium border" style={{ borderColor: agentColors[name] + '44', backgroundColor: agentColors[name] + '11', color: agentColors[name] }} title={name}>{name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSend} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D97706] text-white rounded-lg text-xs font-medium hover:bg-[#B45309] disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {loading ? 'Sending...' : 'Send to All'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
