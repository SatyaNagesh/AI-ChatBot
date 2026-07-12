import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Trash2, Plus, MessageSquare, Activity, Clock, Cpu, Loader2, GitCompare, FileText, Download, Upload, DollarSign, Volume2, Pause } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AGENTS_DATA } from '../data/agents'

type OjSession = { id: string; created_at: string; title: string; messages: OjMessage[] }
type OjMessage = { id: string; role: 'user' | 'assistant'; content: string; compare?: string[] }
type OjTrace = { latency_ms: number; tokens_in: number; tokens_out: number; model: string }
type OjTemplate = { id: string; name: string; prompt: string; variables: string[]; model: string }
type RightTab = 'traces' | 'memories' | 'templates' | 'costs'
type CompareResult = { model: string; content: string; latency: number }

export default function VoicePage() {
  const [sessions, setSessions] = useState<OjSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [model, setModel] = useState(AGENTS_DATA[0].model)
  const [rightTab, setRightTab] = useState<RightTab>('traces')
  const [compareMode, setCompareMode] = useState(false)
  const [compareModels, setCompareModels] = useState<string[]>([AGENTS_DATA[0].model, AGENTS_DATA[1].model])
  const [compareResults, setCompareResults] = useState<CompareResult[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find(s => s.id === activeId) || null
  const onlineAgents = AGENTS_DATA.filter(a => a.online)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [voice, setVoice] = useState('en-US-GuyNeural')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  async function speak(text: string, msgId: string) {
    if (speakingId === msgId) {
      audioRef.current?.pause()
      setSpeakingId(null)
      return
    }
    try {
      const ttsUrl = import.meta.env.DEV ? 'http://localhost:3457/tts' : '/api/tts'
      const res = await fetch(ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) audioRef.current.pause()
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => { setSpeakingId(null); URL.revokeObjectURL(url) }
      audioRef.current.play()
      setSpeakingId(msgId)
    } catch {
      setSpeakingId(null)
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeSession?.messages, compareResults])

  const loadSessions = useCallback(async () => {
    const { data } = await supabase.from('openjarvis_sessions').select('*').order('created_at', { ascending: false })
    if (data) {
      const withMessages = await Promise.all(data.map(async s => {
        const { data: msgs } = await supabase.from('openjarvis_messages').select('*').eq('session_id', s.id).order('created_at', { ascending: true })
        return { ...s, messages: (msgs || []).map(m => ({ ...m, compare: undefined })) }
      }))
      setSessions(withMessages)
    }
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  async function createSession() {
    const { data } = await supabase.from('openjarvis_sessions').insert({ title: 'New conversation', model }).select().single()
    if (data) { setSessions(prev => [{ ...data, messages: [] }, ...prev]); setActiveId(data.id) }
  }

  async function deleteSession(id: string) {
    await Promise.all([
      supabase.from('openjarvis_messages').delete().eq('session_id', id),
      supabase.from('openjarvis_traces').delete().eq('session_id', id),
      supabase.from('openjarvis_memories').delete().eq('session_id', id),
      supabase.from('openjarvis_sessions').delete().eq('id', id),
    ])
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeId === id) setActiveId(null)
  }

  function renameSession(id: string, title: string) {
    supabase.from('openjarvis_sessions').update({ title }).eq('id', id)
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s))
  }

  async function sendMessage() {
    const sid = activeId
    if (!input.trim() || !sid || streaming) return
    const userText = input.trim()
    setInput('')

    if (!compareMode) {
      await singleSend(sid, userText)
    } else {
      await compareSend(sid, userText)
    }
  }

  async function singleSend(sid: string, userText: string) {
    const startTime = performance.now()
    setStreaming(true)

    const userMsg: OjMessage = { id: crypto.randomUUID(), role: 'user', content: userText }
    await supabase.from('openjarvis_messages').insert({ id: userMsg.id, session_id: sid, role: 'user', content: userText, model })
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, userMsg] } : s))

    if (sessions.find(s => s.id === sid)?.messages.length === 1) {
      renameSession(sid, userText.slice(0, 60) + (userText.length > 60 ? '...' : ''))
    }

    const assistantId = crypto.randomUUID()
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, { id: assistantId, role: 'assistant', content: '' }] } : s))

    try {
      const resp = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'user', content: userText }] }) })
      const text = await resp.text()
      const latencyMs = Math.round(performance.now() - startTime)

      setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: text } : m) } : s))
      await supabase.from('openjarvis_messages').insert({ id: assistantId, session_id: sid, role: 'assistant', content: text, model })
      await supabase.from('openjarvis_traces').insert({ session_id: sid, message_id: assistantId, model, tokens_in: Math.round(userText.length / 4), tokens_out: Math.round(text.length / 4), latency_ms: latencyMs, success: true })
    } catch {
      setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: s.messages.map(m => m.id === assistantId ? { ...m, content: 'Request failed.' } : m) } : s))
    } finally { setStreaming(false) }
  }

  async function compareSend(sid: string, userText: string) {
    setStreaming(true)
    setCompareResults([])

    const userMsg: OjMessage = { id: crypto.randomUUID(), role: 'user', content: userText }
    await supabase.from('openjarvis_messages').insert({ id: userMsg.id, session_id: sid, role: 'user', content: userText, model: compareModels.join(',') })
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, userMsg] } : s))

    if (sessions.find(s => s.id === sid)?.messages.length === 1) {
      renameSession(sid, userText.slice(0, 60) + (userText.length > 60 ? '...' : ''))
    }

    const results = await Promise.all(compareModels.map(async m => {
      const t0 = performance.now()
      try {
        const resp = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: m, messages: [{ role: 'user', content: userText }] }) })
        const text = await resp.text()
        return { model: m, content: text, latency: Math.round(performance.now() - t0) }
      } catch { return { model: m, content: 'Failed', latency: 0 } }
    }))

    setCompareResults(results)
    for (const r of results) {
      const aid = crypto.randomUUID()
      await supabase.from('openjarvis_messages').insert({ id: aid, session_id: sid, role: 'assistant', content: `[${r.model}]\n${r.content}`, model: r.model })
      await supabase.from('openjarvis_traces').insert({ session_id: sid, message_id: aid, model: r.model, tokens_in: Math.round(userText.length / 4), tokens_out: Math.round(r.content.length / 4), latency_ms: r.latency, success: r.content !== 'Failed' })
    }
    setStreaming(false)
  }

  function toggleCompareModel(m: string) {
    setCompareModels(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  function exportSession(format: 'markdown' | 'json') {
    if (!activeSession) return
    const title = activeSession.title.replace(/\s+/g, '_').toLowerCase()
    if (format === 'markdown') {
      const md = activeSession.messages.map(m => `## ${m.role === 'user' ? 'You' : 'AI'}\n\n${m.content}`).join('\n\n---\n\n')
      const blob = new Blob([`# ${activeSession.title}\n\n${md}`], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${title}.md`; a.click()
      URL.revokeObjectURL(url)
    } else {
      const blob = new Blob([JSON.stringify({ title: activeSession.title, messages: activeSession.messages }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `${title}.json`; a.click()
      URL.revokeObjectURL(url)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeId) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      setInput(`Analyze this file (${file.name}):\n\n${text.slice(0, 8000)}${text.length > 8000 ? '\n\n[file truncated]' : ''}`)
    }
    reader.readAsText(file)
  }

  async function applyTemplate(t: OjTemplate) {
    setInput(t.prompt)
    if (t.model) setModel(t.model)
    setRightTab('traces')
  }

  return (
    <div className="flex-1 flex bg-[#FAFAFA] overflow-hidden">
      {/* Sessions sidebar */}
      <div className="w-52 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="p-3 border-b border-[#E5E7EB]">
          <button onClick={createSession} className="w-full flex items-center justify-center gap-1.5 text-sm bg-[#2878D9] text-white rounded-lg py-1.5 hover:bg-[#1D5FA8] cursor-pointer"><Plus size={14} /> New Session</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <button key={s.id} onClick={() => setActiveId(s.id)} className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer ${activeId === s.id ? 'bg-[#EFF6FF] text-[#2878D9]' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}>
              <MessageSquare size={13} className="flex-shrink-0" />
              <span className="truncate flex-1">{s.title}</span>
              <button onClick={e => { e.stopPropagation(); deleteSession(s.id) }} className="opacity-0 hover:opacity-100 text-[#9CA3AF] hover:text-red-500 flex-shrink-0 cursor-pointer"><Trash2 size={11} /></button>
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#0A0F1E] flex items-center justify-center"><span className="text-xs font-bold text-white">J</span></div>
            <span className="text-sm font-semibold text-[#111827]">OpenJarvis</span>
            {compareMode && <span className="text-[10px] bg-[#EFF6FF] text-[#2878D9] px-2 py-0.5 rounded-full flex items-center gap-1"><GitCompare size={10} /> Compare</span>}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCompareMode(!compareMode)} className={`text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer flex items-center gap-1 ${compareMode ? 'bg-[#EFF6FF] border-[#2878D9] text-[#2878D9]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]'}`}>
              <GitCompare size={13} /> Compare
            </button>
            <button onClick={() => exportSession('markdown')} disabled={!activeSession} className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] cursor-pointer disabled:opacity-30 flex items-center gap-1">
              <Download size={13} /> Export
            </button>
            {!compareMode ? (
              <>
                <select value={model} onChange={e => setModel(e.target.value)} className="text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 bg-white text-[#374151] focus:outline-none focus:border-[#2878D9]">
                  {onlineAgents.map(a => <option key={a.model} value={a.model}>{a.name}</option>)}
                </select>
                <select value={voice} onChange={e => setVoice(e.target.value)} className="text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 bg-white text-[#374151] focus:outline-none focus:border-[#2878D9]">
                  <option value="en-US-GuyNeural">Guy (US)</option>
                  <option value="en-US-JennyNeural">Jenny (US)</option>
                  <option value="en-US-AriaNeural">Aria (US)</option>
                  <option value="en-US-DavisNeural">Davis (US)</option>
                  <option value="en-US-TonyNeural">Tony (US)</option>
                  <option value="en-GB-RyanNeural">Ryan (UK)</option>
                  <option value="en-GB-SoniaNeural">Sonia (UK)</option>
                  <option value="en-IN-PrabhatNeural">Prabhat (IN)</option>
                  <option value="en-IN-NeerjaNeural">Neerja (IN)</option>
                </select>
              </>
            ) : null}
          </div>
        </div>

        {/* Compare model selectors */}
        {compareMode && (
          <div className="px-5 py-2 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#6B7280]">Models:</span>
            {onlineAgents.map(a => (
              <button key={a.model} onClick={() => toggleCompareModel(a.model)} className={`text-xs px-2 py-1 rounded-md border cursor-pointer ${compareModels.includes(a.model) ? 'bg-[#2878D9] text-white border-[#2878D9]' : 'bg-white border-[#E5E7EB] text-[#374151] hover:bg-[#F3F4F6]'}`}>
                {a.name}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!activeSession && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0A0F1E] flex items-center justify-center mb-3"><Cpu size={24} className="text-white" /></div>
              <h3 className="text-base font-semibold text-[#111827] mb-1">Personal AI, On Your Cloud</h3>
              <p className="text-xs text-[#6B7280] max-w-sm">Start a session. Compare models. Store memories. Track costs. All persisted in Supabase.</p>
            </div>
          )}

          {activeSession?.messages.map(m => (
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[70%] bg-[#2878D9] text-white rounded-xl px-4 py-2 text-sm leading-relaxed">{m.content}</div>
              </div>
            ) : (
              <div key={m.id} className="group text-sm text-[#111827] leading-relaxed bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5">
                {m.content || <span className="text-[#9CA3AF] italic">streaming...</span>}
                {m.content && (
                  <button
                    onClick={() => speak(m.content, m.id)}
                    className="ml-2 mt-1 inline-flex items-center gap-1 text-[10px] text-[#9CA3AF] hover:text-[#2878D9] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {speakingId === m.id ? <Pause size={12} /> : <Volume2 size={12} />}
                    {speakingId === m.id ? 'Stop' : 'Speak'}
                  </button>
                )}
              </div>
            )
          ))}

          {/* Compare results */}
          {compareResults.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {compareResults.map(r => (
                <div key={r.model} className="bg-white border border-[#E5E7EB] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E5E7EB]">
                    <span className="text-xs font-semibold text-[#2878D9]">{r.model}</span>
                    <span className="text-[10px] text-[#9CA3AF]">{r.latency}ms</span>
                  </div>
                  <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">{r.content}</p>
                </div>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} disabled={!activeId} className="w-8 h-8 rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:text-[#2878D9] hover:border-[#2878D9] flex items-center justify-center cursor-pointer disabled:opacity-30">
              <Upload size={14} />
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,.md,.json,.csv,.py,.js,.ts,.jsx,.tsx,.html,.css" onChange={handleFileUpload} className="hidden" />
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder={activeId ? 'Message OpenJarvis...' : 'Create a session first'} disabled={!activeId || streaming} className="flex-1 text-sm border border-[#E5E7EB] rounded-lg px-4 py-2 bg-[#FAFAFA] focus:outline-none focus:border-[#2878D9] disabled:opacity-50" />
            <button onClick={sendMessage} disabled={!activeId || streaming || !input.trim()} className="w-8 h-8 rounded-lg bg-[#2878D9] text-white flex items-center justify-center hover:bg-[#1D5FA8] disabled:opacity-50 cursor-pointer">
              {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-64 flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-[#E5E7EB]">
          {(['traces', 'memories', 'templates', 'costs'] as RightTab[]).map(tab => (
            <button key={tab} onClick={() => setRightTab(tab)} className={`flex-1 text-[10px] py-2.5 font-medium cursor-pointer ${rightTab === tab ? 'text-[#2878D9] border-b-2 border-[#2878D9]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}>
              {tab === 'traces' ? 'Traces' : tab === 'memories' ? 'Memory' : tab === 'templates' ? 'Templates' : 'Costs'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Traces tab */}
          {rightTab === 'traces' && <TracesTab sessionId={activeId} />}
          {/* Memories tab */}
          {rightTab === 'memories' && <MemoriesTab sessionId={activeId} />}
          {/* Templates tab */}
          {rightTab === 'templates' && <TemplatesTab onApply={applyTemplate} />}
          {/* Costs tab */}
          {rightTab === 'costs' && <CostsTab />}
        </div>
      </div>
    </div>
  )
}

/* ---- Traces Tab ---- */
function TracesTab({ sessionId }: { sessionId: string | null }) {
  const [traces, setTraces] = useState<OjTrace[]>([])

  useEffect(() => {
    if (!sessionId) return
    const load = async () => {
      const { data } = await supabase.from('openjarvis_traces').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(15)
      if (data) setTraces(data)
    }
    load()
    const sub = supabase.channel('traces').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'openjarvis_traces', filter: `session_id=eq.${sessionId}` }, () => load()).subscribe()
    return () => { sub.unsubscribe() }
  }, [sessionId])

  if (!sessionId) return <div className="p-4 text-xs text-[#9CA3AF]">Select a session</div>

  return (
    <div className="p-4 space-y-2">
      {traces.length === 0 ? <p className="text-xs text-[#9CA3AF]">No traces yet</p> : traces.map((t, i) => (
        <div key={i} className="bg-[#F9FAFB] rounded-lg p-2.5 text-xs space-y-1">
          <div className="flex items-center gap-2 text-[#6B7280]"><Clock size={10} /> {t.latency_ms}ms</div>
          <div className="flex items-center gap-2 text-[#6B7280]"><Activity size={10} /> {t.tokens_in} tok in → {t.tokens_out} tok out</div>
          <div className="text-[#9CA3AF] truncate">{t.model}</div>
        </div>
      ))}
    </div>
  )
}

/* ---- Memories Tab ---- */
function MemoriesTab({ sessionId }: { sessionId: string | null }) {
  const [localMem, setLocalMem] = useState<{ id: string; key: string; value: string }[]>([])
  const [globalMem, setGlobalMem] = useState<{ id: string; key: string; value: string }[]>([])
  const [key, setKey] = useState('')
  const [val, setVal] = useState('')
  const [scope, setScope] = useState<'session' | 'global'>('session')

  const loadLocal = useCallback(async () => {
    if (!sessionId) return
    const { data } = await supabase.from('openjarvis_memories').select('*').eq('session_id', sessionId).order('created_at', { ascending: false })
    if (data) setLocalMem(data)
  }, [sessionId])

  const loadGlobal = useCallback(async () => {
    const { data } = await supabase.from('openjarvis_global_memories').select('*').order('created_at', { ascending: false })
    if (data) setGlobalMem(data)
  }, [])

  useEffect(() => { loadLocal() }, [loadLocal])
  useEffect(() => { loadGlobal() }, [loadGlobal])

  async function addMemory() {
    if (!key.trim() || !val.trim()) return
    if (scope === 'session') {
      if (!sessionId) return
      const { data } = await supabase.from('openjarvis_memories').insert({ session_id: sessionId, key: key.trim(), value: val.trim() }).select().single()
      if (data) { setLocalMem(prev => [data, ...prev]); setKey(''); setVal('') }
    } else {
      const { data } = await supabase.from('openjarvis_global_memories').insert({ key: key.trim(), value: val.trim() }).select().single()
      if (data) { setGlobalMem(prev => [data, ...prev]); setKey(''); setVal('') }
    }
  }

  async function deleteMemory(id: string, g: boolean) {
    if (g) { await supabase.from('openjarvis_global_memories').delete().eq('id', id); setGlobalMem(prev => prev.filter(m => m.id !== id)) }
    else { await supabase.from('openjarvis_memories').delete().eq('id', id); setLocalMem(prev => prev.filter(m => m.id !== id)) }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2 mb-1">
        <button onClick={() => setScope('session')} className={`text-[10px] px-2 py-1 rounded cursor-pointer ${scope === 'session' ? 'bg-[#2878D9] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Session</button>
        <button onClick={() => setScope('global')} className={`text-[10px] px-2 py-1 rounded cursor-pointer ${scope === 'global' ? 'bg-[#2878D9] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>Global</button>
      </div>
      <div className="flex gap-1">
        <input value={key} onChange={e => setKey(e.target.value)} placeholder="key" className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1.5 focus:outline-none focus:border-[#2878D9]" />
        <input value={val} onChange={e => setVal(e.target.value)} placeholder="value" className="flex-1 text-xs border border-[#E5E7EB] rounded px-2 py-1.5 focus:outline-none focus:border-[#2878D9]" />
        <button onClick={addMemory} className="w-7 h-7 rounded bg-[#2878D9] text-white flex items-center justify-center hover:bg-[#1D5FA8] cursor-pointer"><Plus size={12} /></button>
      </div>
      {(!sessionId && scope === 'session') ? <p className="text-xs text-[#9CA3AF]">Select a session</p> : (
        <div className="space-y-1">
          {(scope === 'session' ? localMem : globalMem).map(m => (
            <div key={m.id} className="flex items-center gap-1 text-xs bg-[#F9FAFB] rounded px-2 py-1.5">
              <span className="font-medium text-[#374151]">{m.key}:</span>
              <span className="text-[#6B7280] truncate flex-1">{m.value}</span>
              <button onClick={() => deleteMemory(m.id, scope === 'global')} className="text-[#9CA3AF] hover:text-red-500 cursor-pointer"><Trash2 size={10} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---- Templates Tab ---- */
function TemplatesTab({ onApply }: { onApply: (t: OjTemplate) => void }) {
  const [templates, setTemplates] = useState<OjTemplate[]>([])
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [tmplModel, setTmplModel] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('openjarvis_templates').select('*').order('created_at', { ascending: false })
    if (data) setTemplates(data)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveTemplate() {
    if (!name.trim() || !prompt.trim()) return
    const { data } = await supabase.from('openjarvis_templates').insert({ name: name.trim(), prompt: prompt.trim(), model: tmplModel }).select().single()
    if (data) { setTemplates(prev => [data, ...prev]); setName(''); setPrompt(''); setTmplModel(''); setShowForm(false) }
  }

  async function deleteTemplate(id: string) {
    await supabase.from('openjarvis_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="p-4 space-y-3">
      <button onClick={() => setShowForm(!showForm)} className="w-full flex items-center justify-center gap-1 text-xs bg-[#2878D9] text-white rounded-lg py-1.5 hover:bg-[#1D5FA8] cursor-pointer"><Plus size={12} /> New Template</button>
      {showForm && (
        <div className="bg-[#F9FAFB] rounded-lg p-3 space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1.5 focus:outline-none focus:border-[#2878D9]" />
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Prompt (use {{variable}} for variables)" rows={3} className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1.5 focus:outline-none focus:border-[#2878D9] resize-none" />
          <select value={tmplModel} onChange={e => setTmplModel(e.target.value)} className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-[#2878D9]">
            <option value="">Any model</option>
            {AGENTS_DATA.filter(a => a.online).map(a => <option key={a.model} value={a.model}>{a.name}</option>)}
          </select>
          <div className="flex gap-1">
            <button onClick={saveTemplate} className="flex-1 text-xs bg-[#2878D9] text-white rounded py-1.5 hover:bg-[#1D5FA8] cursor-pointer">Save</button>
            <button onClick={() => setShowForm(false)} className="text-xs bg-[#F3F4F6] text-[#6B7280] rounded py-1.5 px-3 hover:bg-[#E5E7EB] cursor-pointer">Cancel</button>
          </div>
        </div>
      )}
      {templates.length === 0 ? <p className="text-xs text-[#9CA3AF]">No templates</p> : templates.map(t => (
        <div key={t.id} className="bg-white border border-[#E5E7EB] rounded-lg p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#111827]">{t.name}</span>
            <button onClick={() => deleteTemplate(t.id)} className="text-[#9CA3AF] hover:text-red-500 cursor-pointer"><Trash2 size={10} /></button>
          </div>
          <p className="text-[10px] text-[#6B7280] line-clamp-2">{t.prompt}</p>
          <div className="flex items-center justify-between">
            {t.model && <span className="text-[10px] text-[#2878D9]">{t.model}</span>}
            <button onClick={() => onApply(t)} className="text-[10px] text-[#2878D9] hover:underline cursor-pointer">Apply</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- Costs Tab ---- */
function CostsTab() {
  const [total, setTotal] = useState<{ sessions: number; messages: number; tokensIn: number; tokensOut: number; costUsd: number; avgLatency: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: traces } = await supabase.from('openjarvis_traces').select('*')
      const { count: sessions } = await supabase.from('openjarvis_sessions').select('*', { count: 'exact', head: true })
      const { count: messages } = await supabase.from('openjarvis_messages').select('*', { count: 'exact', head: true })
      if (!traces) return
      const tokensIn = traces.reduce((s, t) => s + (t.tokens_in || 0), 0)
      const tokensOut = traces.reduce((s, t) => s + (t.tokens_out || 0), 0)
      const avgLatency = traces.length ? Math.round(traces.reduce((s, t) => s + (t.latency_ms || 0), 0) / traces.length) : 0
      const costUsd = (tokensIn / 1_000_000 * 3) + (tokensOut / 1_000_000 * 15)
      setTotal({ sessions: sessions || 0, messages: messages || 0, tokensIn, tokensOut, costUsd: Math.round(costUsd * 100) / 100, avgLatency })
    }
    load()
  }, [])

  if (!total) return <div className="p-4 text-xs text-[#9CA3AF]">Loading...</div>

  return (
    <div className="p-4 space-y-3">
      {[
        { label: 'Sessions', value: total.sessions.toString(), icon: MessageSquare },
        { label: 'Messages', value: total.messages.toString(), icon: FileText },
        { label: 'Tokens In', value: total.tokensIn.toLocaleString(), icon: Activity },
        { label: 'Tokens Out', value: total.tokensOut.toLocaleString(), icon: Activity },
        { label: 'Avg Latency', value: `${total.avgLatency}ms`, icon: Clock },
        { label: 'Est. Cost', value: `$${total.costUsd}`, icon: DollarSign },
      ].map((s, i) => (
        <div key={i} className="bg-[#F9FAFB] rounded-lg p-3 flex items-center gap-3">
          <s.icon size={16} className="text-[#2878D9]" />
          <div>
            <p className="text-[10px] text-[#9CA3AF]">{s.label}</p>
            <p className="text-sm font-semibold text-[#111827]">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
