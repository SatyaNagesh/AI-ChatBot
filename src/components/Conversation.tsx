import { useState, useEffect, useRef } from 'react'
import { Paperclip, Smile, ImageIcon, Type, Send, ChevronDown, Pause, Play, X, Loader2 } from 'lucide-react'
import type { Message, Activity } from '../types'
import { DB_API } from '../data/agents'

export default function Conversation({ sessionId, model, sessionName, onFirstMessage, onClose, onActivity, onPauseChange }: {
  sessionId: string; model: string; sessionName: string; onFirstMessage: (id: string, text: string) => void; onClose: () => void; onActivity?: (a: Activity) => void; onPauseChange?: (id: string, paused: boolean) => void
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
    fetch(`${DB_API}/messages?session_id=${sessionId}`).then(r => r.json()).then(data => { if (data) setMessages(data) }).catch(() => {})
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
        const errBody = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }))
        const errMsg = errBody?.error?.message || errBody?.error || `Error: request failed`
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
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
            <button onClick={() => { setPaused(false); onPauseChange?.(sessionId, false); handleResume() }} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D97706] rounded-lg text-xs font-medium text-[#D97706] hover:bg-[#FFFBEB]"><Play size={14} />Resume</button>
          ) : (
            <button onClick={() => { abortRef.current?.abort(); setPaused(true); onPauseChange?.(sessionId, true) }} disabled={!loading} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB] disabled:opacity-40 disabled:cursor-not-allowed"><Pause size={14} />Pause</button>
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
          <textarea className="w-full resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-4 pt-3 h-20" placeholder='Type "/" to use template message' value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} />
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
