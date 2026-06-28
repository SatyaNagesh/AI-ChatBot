import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Trash2, Plus, MessageSquare, Brain, Activity, Clock, Cpu, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AGENTS_DATA } from '../data/agents'

type OjSession = { id: string; created_at: string; title: string; model: string; messages: OjMessage[] }
type OjMessage = { id: string; role: 'user' | 'assistant'; content: string }
type OjTrace = { id: string; latency_ms: number; tokens_in: number; tokens_out: number; model: string }
type OjMemory = { id: string; key: string; value: string; context: string }

export default function VoicePage() {
  const [sessions, setSessions] = useState<OjSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [model, setModel] = useState(AGENTS_DATA[0].model)
  const [traces, setTraces] = useState<OjTrace[]>([])
  const [memories, setMemories] = useState<OjMemory[]>([])
  const [memKey, setMemKey] = useState('')
  const [memVal, setMemVal] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const activeSession = sessions.find(s => s.id === activeId) || null

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeSession?.messages])

  const loadSessions = useCallback(async () => {
    const { data } = await supabase.from('openjarvis_sessions').select('*').order('created_at', { ascending: false })
    if (data) {
      const withMessages = await Promise.all(data.map(async (s) => {
        const { data: msgs } = await supabase.from('openjarvis_messages').select('*').eq('session_id', s.id).order('created_at', { ascending: true })
        return { ...s, messages: msgs || [] }
      }))
      setSessions(withMessages)
    }
  }, [])

  const loadTraces = useCallback(async (sessionId: string) => {
    const { data } = await supabase.from('openjarvis_traces').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(10)
    if (data) setTraces(data)
  }, [])

  const loadMemories = useCallback(async (sessionId: string) => {
    const { data } = await supabase.from('openjarvis_memories').select('*').eq('session_id', sessionId).order('created_at', { ascending: false })
    if (data) setMemories(data)
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])
  useEffect(() => {
    if (activeId) { loadTraces(activeId); loadMemories(activeId) }
  }, [activeId, loadTraces, loadMemories])

  async function createSession() {
    const { data } = await supabase.from('openjarvis_sessions').insert({ title: 'New conversation', model }).select().single()
    if (data) { setSessions(prev => [{ ...data, messages: [] }, ...prev]); setActiveId(data.id) }
  }

  async function deleteSession(id: string) {
    await supabase.from('openjarvis_messages').delete().eq('session_id', id)
    await supabase.from('openjarvis_traces').delete().eq('session_id', id)
    await supabase.from('openjarvis_memories').delete().eq('session_id', id)
    await supabase.from('openjarvis_sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeId === id) setActiveId(null)
  }

  async function renameSession(id: string, title: string) {
    await supabase.from('openjarvis_sessions').update({ title }).eq('id', id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
  }

  async function sendMessage() {
    if (!input.trim() || !activeId || streaming) return
    const startTime = performance.now()
    setStreaming(true)

    const userMsg: OjMessage = { id: crypto.randomUUID(), role: 'user', content: input.trim() }
    const userText = input.trim()
    setInput('')

    await supabase.from('openjarvis_messages').insert({ id: userMsg.id, session_id: activeId, role: 'user', content: userText, model })
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: [...s.messages, userMsg] } : s))

    if (sessions.find(s => s.id === activeId)?.messages.length === 1) {
      const title = userText.slice(0, 60) + (userText.length > 60 ? '...' : '')
      renameSession(activeId, title)
    }

    const assistantId = crypto.randomUUID()
    const assistantMsg: OjMessage = { id: assistantId, role: 'assistant', content: '' }
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: [...s.messages, assistantMsg] } : s))

    abortRef.current = new AbortController()
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: userText }] }),
        signal: abortRef.current.signal,
      })
      const text = await resp.text()
      const latencyMs = Math.round(performance.now() - startTime)

      setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: text } : m) } : s))
      await supabase.from('openjarvis_messages').insert({ id: assistantId, session_id: activeId, role: 'assistant', content: text, model })
      await supabase.from('openjarvis_traces').insert({ session_id: activeId, message_id: assistantId, model, tokens_in: Math.round(userText.length / 4), tokens_out: Math.round(text.length / 4), latency_ms: latencyMs, success: true })
      setTraces(prev => [{ id: crypto.randomUUID(), latency_ms: latencyMs, tokens_in: Math.round(userText.length / 4), tokens_out: Math.round(text.length / 4), model }, ...prev.slice(0, 9)])
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const errMsg = { id: crypto.randomUUID(), role: 'assistant' as const, content: 'Request failed. Check your API endpoint.' }
      setSessions(prev => prev.map(s => s.id === activeId ? { ...s, messages: [...s.messages, errMsg] } : s))
    } finally { setStreaming(false); abortRef.current = null }
  }

  async function storeMemory() {
    if (!memKey.trim() || !memVal.trim() || !activeId) return
    const { data } = await supabase.from('openjarvis_memories').insert({ session_id: activeId, key: memKey.trim(), value: memVal.trim(), context: `from model ${model}` }).select().single()
    if (data) { setMemories(prev => [data, ...prev]); setMemKey(''); setMemVal('') }
  }

  async function deleteMemory(id: string) {
    await supabase.from('openjarvis_memories').delete().eq('id', id)
    setMemories(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="flex-1 flex bg-[#FAFAFA] overflow-y-auto">
      {/* Sessions sidebar */}
      <div className="w-56 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-3 border-b border-[#E5E7EB]">
          <button onClick={createSession} className="w-full flex items-center justify-center gap-1.5 text-sm bg-[#2878D9] text-white rounded-lg py-2 hover:bg-[#1D5FA8] cursor-pointer">
            <Plus size={14} /> New Session
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`w-full text-left p-2 rounded-lg text-sm flex items-center gap-2 cursor-pointer ${activeId === s.id ? 'bg-[#EFF6FF] text-[#2878D9]' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}
            >
              <MessageSquare size={14} className="flex-shrink-0" />
              <span className="truncate flex-1">{s.title}</span>
              <button onClick={e => { e.stopPropagation(); deleteSession(s.id) }} className="opacity-0 hover:opacity-100 text-[#9CA3AF] hover:text-red-500 flex-shrink-0 cursor-pointer"><Trash2 size={12} /></button>
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0A0F1E] flex items-center justify-center">
              <span className="text-sm font-bold text-white">J</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">OpenJarvis</h2>
              <p className="text-[10px] text-[#9CA3AF]">Stanford Scaling Intelligence Lab</p>
            </div>
          </div>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="text-xs border border-[#E5E7EB] rounded-lg px-3 py-1.5 bg-white text-[#374151] focus:outline-none focus:border-[#2878D9]"
          >
            {AGENTS_DATA.map(a => <option key={a.model} value={a.model}>{a.name}</option>)}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!activeSession && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0A0F1E] flex items-center justify-center mb-4">
                <Cpu size={28} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827] mb-1">Personal AI, On Your Cloud</h3>
              <p className="text-sm text-[#6B7280] max-w-md">
                Start a new session to chat with any AI model. Conversations, memories, and traces are persisted in Supabase.
              </p>
            </div>
          )}
          {activeSession?.messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#2878D9] text-white' : 'bg-white border border-[#E5E7EB] text-[#111827]'}`}>
                {m.content || <span className="text-[#9CA3AF] italic">streaming...</span>}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={activeId ? 'Message OpenJarvis...' : 'Create a session first'}
              disabled={!activeId || streaming}
              className="flex-1 text-sm border border-[#E5E7EB] rounded-lg px-4 py-2 bg-[#FAFAFA] focus:outline-none focus:border-[#2878D9] disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!activeId || streaming || !input.trim()}
              className="w-9 h-9 rounded-lg bg-[#2878D9] text-white flex items-center justify-center hover:bg-[#1D5FA8] disabled:opacity-50 cursor-pointer"
            >
              {streaming ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel - Traces + Memories */}
      <div className="w-64 flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col overflow-y-auto">
        {/* Traces */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3 flex items-center gap-1.5"><Activity size={12} /> TRACES</h3>
          {!activeId ? <p className="text-xs text-[#9CA3AF]">Select a session</p> : traces.length === 0 ? <p className="text-xs text-[#9CA3AF]">No traces yet</p> : (
            <div className="space-y-2">
              {traces.map(t => (
                <div key={t.id} className="bg-[#F9FAFB] rounded-lg p-2.5 text-xs">
                  <div className="flex items-center gap-2 text-[#6B7280] mb-1">
                    <Clock size={10} /> {t.latency_ms}ms · {t.tokens_in}→{t.tokens_out} tok
                  </div>
                  <div className="text-[#9CA3AF] truncate">{t.model}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Memories */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3 flex items-center gap-1.5"><Brain size={12} /> MEMORIES</h3>
          {!activeId ? <p className="text-xs text-[#9CA3AF]">Select a session</p> : (
            <div>
              <div className="flex gap-1 mb-2">
                <input value={memKey} onChange={e => setMemKey(e.target.value)} placeholder="key" className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1 focus:outline-none focus:border-[#2878D9]" />
                <input value={memVal} onChange={e => setMemVal(e.target.value)} placeholder="value" className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1 focus:outline-none focus:border-[#2878D9]" />
                <button onClick={storeMemory} className="w-6 h-6 rounded bg-[#2878D9] text-white flex items-center justify-center hover:bg-[#1D5FA8] cursor-pointer"><Plus size={11} /></button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {memories.map(m => (
                  <div key={m.id} className="flex items-center gap-1 text-xs bg-[#F9FAFB] rounded px-2 py-1.5">
                    <span className="font-medium text-[#374151]">{m.key}:</span>
                    <span className="text-[#6B7280] truncate flex-1">{m.value}</span>
                    <button onClick={() => deleteMemory(m.id)} className="text-[#9CA3AF] hover:text-red-500 cursor-pointer"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3 flex items-center gap-1.5"><Cpu size={12} /> ABOUT</h3>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            OpenJarvis Cloud runs on your existing infra — AI via Vercel proxy, persistence in Supabase. No local install needed.
          </p>
          <a href="https://open-jarvis.github.io/OpenJarvis/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#2878D9] hover:underline mt-2">
            OpenJarvis docs <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  )
}
