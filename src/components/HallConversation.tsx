import { useState, useEffect, useRef } from 'react'
import { Send, X, Loader2, Pause, Play } from 'lucide-react'
import type { Activity, GreatHall, Agent } from '../types'
import { AGENT_COLORS } from '../data/agents'

type AgentStatus = 'idle' | 'thinking' | 'asking' | 'done' | 'error'

export default function HallConversation({ hall, agents, onClose, onActivity, onPauseChange }: {
  hall: GreatHall; agents: Agent[]; onClose: () => void; onActivity?: (a: Activity) => void; onPauseChange?: (id: string, paused: boolean) => void
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const [paneStates, setPaneStates] = useState<Record<string, { status: AgentStatus; response: string }>>({})
  const [consensus, setConsensus] = useState('')
  const [userMessages, setUserMessages] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRefs = useRef<Record<string, AbortController>>({})

  const agentColors = hall.agents.reduce((acc, name, i) => {
    acc[name] = AGENT_COLORS[i % AGENT_COLORS.length]
    return acc
  }, {} as Record<string, string>)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [paneStates, consensus, userMessages])

  function showToast(msg: string) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3000)
  }

  async function callAgent(agentName: string, userMsg: string, history: string[]): Promise<string> {
    const agent = agents.find(a => a.name === agentName)
    if (!agent || !agent.online) return ''

    const taskMsg = `[Team Context] You are ${agentName}, a ${agent.specialty} expert. Your team includes: ${hall.agents.filter(a => a !== agentName).join(', ')}. Focus on your expertise — do what you're best at. If you need clarification from the user, ask directly in your response.\n\nTask: ${userMsg}`

    const apiMessages = [
      ...history.map(m => ({ role: 'user' as const, content: m })),
      { role: 'user', content: taskMsg },
    ]

    const ac = new AbortController()
    abortRefs.current[agentName] = ac

    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({ messages: apiMessages, model: agent.model }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        return `Error: ${errBody?.error?.message || `HTTP ${res.status}`}`
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
            setPaneStates(prev => ({ ...prev, [agentName]: { ...prev[agentName], response: reply } }))
          } catch {}
        }
      }
      return reply
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return ''
      return 'Error: connection failed'
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    if (pausedRef.current) {
      showToast('The Great Hall is paused — click Resume to continue')
      return
    }

    setInput('')
    setLoading(true)
    setPaused(false)
    pausedRef.current = false
    setConsensus('')

    const newUserMessages = [...userMessages, text]
    setUserMessages(newUserMessages)

    const initialStates: Record<string, { status: AgentStatus; response: string }> = {}
    hall.agents.forEach(name => {
      initialStates[name] = { status: 'thinking', response: '' }
    })
    setPaneStates(initialStates)

    const history = userMessages
    const results = await Promise.all(
      hall.agents.map(async (name) => {
        const reply = await callAgent(name, text, history)
        return { name, reply }
      })
    )

    const allParts: string[] = []
    setPaneStates(prev => {
      const updated = { ...prev }
      results.forEach(({ name, reply }) => {
        allParts.push(reply)
        if (reply && !reply.startsWith('Error:')) {
          const hasQuestion = /\?\s*$/.test(reply.trim())
          updated[name] = {
            status: hasQuestion ? 'asking' : 'done',
            response: reply,
          }
        } else if (reply.startsWith('Error:')) {
          updated[name] = { status: 'error', response: reply }
        } else {
          updated[name] = { status: 'idle', response: '' }
        }
      })
      return updated
    })

    const validParts = allParts.filter(r => r && !r.startsWith('Error:'))
    if (validParts.length > 0) {
      setConsensus(validParts.join('\n\n---\n\n'))
    }

    setLoading(false)
    onActivity?.({ user: hall.name, time: new Date().toLocaleString(), text: `${hall.agents.length} agents responded`, status: 'done' })
  }

  function handlePause() {
    Object.values(abortRefs.current).forEach(ac => ac.abort())
    setPaused(true)
    pausedRef.current = true
    setLoading(false)
    onPauseChange?.(hall.id, true)
  }

  async function handlePreferenceAnswer(agentName: string, answer: string) {
    if (!answer.trim()) return

    const prevResponse = paneStates[agentName]?.response || ''
    setPaneStates(prev => ({ ...prev, [agentName]: { status: 'thinking', response: prevResponse + '\n\n[User answer: ' + answer + ']\n\n' } }))

    const agent = agents.find(a => a.name === agentName)
    if (!agent) return

    const apiMessages = [
      { role: 'user', content: `[Continuing your work as ${agentName}] The user answered your question: "${answer}". Continue based on their input.` },
    ]

    const ac = new AbortController()
    abortRefs.current[agentName] = ac

    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ac.signal,
        body: JSON.stringify({ messages: apiMessages, model: agent.model }),
      })
      if (!res.ok) {
        setPaneStates(prev => ({ ...prev, [agentName]: { status: 'error', response: 'Error: request failed' } }))
        return
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
            setPaneStates(prev => ({ ...prev, [agentName]: { status: 'thinking', response: prevResponse + '\n\n[User answer: ' + answer + ']\n\n' + reply } }))
          } catch {}
        }
      }
      setPaneStates(prev => ({ ...prev, [agentName]: { status: 'done', response: prevResponse + '\n\n[User answer: ' + answer + ']\n\n' + reply } }))
    } catch {
      setPaneStates(prev => ({ ...prev, [agentName]: { status: 'error', response: 'Error: connection failed' } }))
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-w-0 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {hall.agents.slice(0, 4).map((name, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-medium" style={{ backgroundColor: agentColors[name] + '22', color: agentColors[name] }}>{name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
            ))}
            {hall.agents.length > 4 && <div className="w-7 h-7 rounded-full bg-[#E5E7EB] border-2 border-white flex items-center justify-center text-[9px] font-medium text-[#6B7280]">+{hall.agents.length - 4}</div>}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#111827]">{hall.name}</p>
            <p className="text-xs text-[#6B7280]">Team · {hall.agents.length} agents · parallel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#2878D9]">
              <Loader2 size={14} className="animate-spin" />
              Agents working...
            </div>
          )}
          {paused ? (
            <button onClick={() => { setPaused(false); pausedRef.current = false; onPauseChange?.(hall.id, false) }} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D97706] rounded-lg text-xs font-medium text-[#D97706] hover:bg-[#FFFBEB]"><Play size={14} />Resume</button>
          ) : (
            <button onClick={handlePause} disabled={!loading} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"><Pause size={14} />Pause</button>
          )}
          <button onClick={onClose} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]"><X size={14} />Close</button>
        </div>
      </div>

      {toast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#D97706] text-white px-4 py-2 rounded-lg text-xs font-medium shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Main grid */}
      <div className="flex-1 flex min-h-0">
        {/* Agent columns */}
        <div className="flex-1 grid gap-0" style={{ gridTemplateColumns: `repeat(${hall.agents.length}, 1fr)` }}>
          {hall.agents.map((name) => {
            const state = paneStates[name]
            const color = agentColors[name]
            const status = state?.status || 'idle'
            const response = state?.response || ''

            return (
              <div key={name} className="flex flex-col border-r border-[#E5E7EB] last:border-r-0">
                <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-medium" style={{ backgroundColor: color + '22', color }}>{name.split(' ').slice(-2).map(s => s[0]).join('')}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#111827] truncate">{name}</p>
                      <p className="text-[10px] text-[#6B7280] truncate">{agents.find(a => a.name === name)?.specialty || ''}</p>
                    </div>
                    <StatusBadge status={status} color={color} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {userMessages.map((msg, i) => (
                    <div key={i} className="text-xs bg-[#DBEAFE] text-[#1E40AF] rounded-lg px-3 py-2 leading-relaxed">{msg}</div>
                  ))}
                  {response && (
                    <div className="text-xs leading-relaxed whitespace-pre-wrap text-[#111827]">{response}</div>
                  )}
                  {!response && status === 'thinking' && (
                    <div className="flex items-center gap-1 text-xs text-[#6B7280] py-4">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: color, animationDelay: '300ms' }} />
                    </div>
                  )}
                  {status === 'error' && (
                    <div className="text-xs text-[#EF4444] bg-[#FEF2F2] rounded-lg px-3 py-2">{response}</div>
                  )}
                </div>
                {status === 'asking' && (
                  <PreferenceInput agentName={name} color={color} onSubmit={handlePreferenceAnswer} />
                )}
              </div>
            )
          })}
        </div>

        {/* Consensus panel */}
        <div className="w-72 flex flex-col border-l border-[#E5E7EB] shrink-0">
          <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA]">
            <p className="text-xs font-semibold text-[#111827]">Team Consensus</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {consensus ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap text-[#111827] space-y-2">
                {consensus.split('\n\n---\n\n').map((part, i) => (
                  <div key={i} className="border-l-2 border-[#2878D9] pl-3">{part}</div>
                ))}
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-full text-xs text-[#9CA3AF]">Waiting for team...</div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-[#9CA3AF]">Team output appears here</div>
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#E5E7EB] px-5 py-4 shrink-0">
        <div className="bg-white border border-[#E5E7EB] rounded-xl">
          <textarea className="w-full resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-4 pt-3 h-16" placeholder="Send a task to the whole team..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
              {hall.agents.map((name) => (
                <span key={name} className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-medium border" style={{ borderColor: agentColors[name] + '44', backgroundColor: agentColors[name] + '11', color: agentColors[name] }} title={name}>{name.split(' ').slice(-2).map(s => s[0]).join('')}</span>
              ))}
              <span className="ml-1">all receive same task</span>
            </div>
            <button onClick={handleSend} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#D97706] text-white rounded-lg text-xs font-medium hover:bg-[#B45309] disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {loading ? 'Working...' : 'Send to Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, color }: { status: AgentStatus; color: string }) {
  const cfg: Record<AgentStatus, { color: string; label: string }> = {
    idle: { color: '#D1D5DB', label: 'Idle' },
    thinking: { color, label: 'Thinking' },
    asking: { color: '#D97706', label: 'Needs input' },
    done: { color: '#22C55E', label: 'Done' },
    error: { color: '#EF4444', label: 'Error' },
  }
  const c = cfg[status]
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
      {c.label}
    </span>
  )
}

function PreferenceInput({ agentName, color, onSubmit }: { agentName: string; color: string; onSubmit: (name: string, val: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="border-t border-[#E5E7EB] p-2.5 bg-[#FFFBEB] shrink-0">
      <p className="text-[10px] font-medium text-[#D97706] mb-1">Preference needed:</p>
      <textarea className="w-full text-xs border border-[#D97706]/30 rounded-lg px-2.5 py-1.5 outline-none resize-none h-10 bg-white" placeholder={`Answer ${agentName}...`} value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (val.trim()) { onSubmit(agentName, val.trim()); setVal('') } } }} />
      <button onClick={() => { onSubmit(agentName, val.trim()); setVal('') }} disabled={!val.trim()} className="mt-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: color + '18', color }}>Submit Answer</button>
    </div>
  )
}
