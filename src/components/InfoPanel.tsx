import { useState, useEffect } from 'react'
import { Paperclip, Smile, Pencil, Check, X, Plus, Trash2, Brain } from 'lucide-react'
import type { Agent, MCPServer, Activity, GreatHall } from '../types'
import { DB_API, AGENT_COLORS, AGENTS_DATA } from '../data/agents'
import { getInitials } from '../utils/helpers'

export default function InfoPanel({ agent, mcpServers, onRenameAgent, onAddMCPServer, notes, onNotesChange, activities,
  hall, hallAgents, onRemoveAgent, onAddAgent, allAgents, hallMcpServers: hallAgentMcp }: {
  agent?: Agent; mcpServers: MCPServer[]; onRenameAgent: (oldName: string, newName: string) => void
  onAddMCPServer: (s: MCPServer) => void; notes: string; onNotesChange: (v: string) => void; activities: Activity[]
  hall?: GreatHall; hallAgents?: Agent[]; onRemoveAgent?: (name: string) => void; onAddAgent?: (name: string) => void
  allAgents?: typeof AGENTS_DATA; hallMcpServers?: Record<string, MCPServer[]>
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [addingMcp, setAddingMcp] = useState(false)
  const [mcpName, setMcpName] = useState('')
  const [mcpUrl, setMcpUrl] = useState('')
  const [showAddAgent, setShowAddAgent] = useState(false)

  const [memories, setMemories] = useState<{ key: string; value: string }[]>([])
  const [memoryKey, setMemoryKey] = useState('')
  const [memoryValue, setMemoryValue] = useState('')
  const [showMemoryInput, setShowMemoryInput] = useState(false)

  useEffect(() => {
    fetch(`${DB_API}/memory`).then(r => r.json()).then(data => { if (Array.isArray(data)) setMemories(data) }).catch(() => {})
  }, [])

  function addMemory() {
    if (!memoryKey.trim() || !memoryValue.trim()) return
    fetch(`${DB_API}/memory`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: memoryKey.trim(), value: memoryValue.trim() }),
    }).then(() => {
      setMemories(prev => [...prev.filter(m => m.key !== memoryKey.trim()), { key: memoryKey.trim(), value: memoryValue.trim() }])
      setMemoryKey(''); setMemoryValue(''); setShowMemoryInput(false)
    }).catch(() => {})
  }

  function deleteMemory(key: string) {
    fetch(`${DB_API}/memory/${encodeURIComponent(key)}`, { method: 'DELETE' }).then(() => {
      setMemories(prev => prev.filter(m => m.key !== key))
    }).catch(() => {})
  }

  const SharedMemorySection = () => (
    <div className="border-t border-[#E5E7EB]">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider">SHARED MEMORY</p>
          <button onClick={() => setShowMemoryInput(!showMemoryInput)} className="text-[#2878D9] hover:text-[#1D5FA8]"><Plus size={14} /></button>
        </div>
        {showMemoryInput && (
          <div className="space-y-1.5 mb-3 bg-[#F9FAFB] rounded-lg p-3 border border-[#E5E7EB]">
            <input className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1 outline-none" placeholder="Key (e.g. user-name)" value={memoryKey} onChange={e => setMemoryKey(e.target.value)} />
            <input className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1 outline-none" placeholder="Value (e.g. Satya)" value={memoryValue} onChange={e => setMemoryValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addMemory() }} />
            <div className="flex gap-2">
              <button onClick={addMemory} className="text-xs font-medium text-[#22C55E]">Save</button>
              <button onClick={() => setShowMemoryInput(false)} className="text-xs font-medium text-[#EF4444]">Cancel</button>
            </div>
          </div>
        )}
        {memories.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] italic">No shared memories</p>
        ) : (
          <div className="space-y-1">
            {memories.map(m => (
              <div key={m.key} className="flex items-start gap-2 text-xs bg-[#F9FAFB] rounded-lg px-3 py-2 group">
                <Brain size={12} className="text-[#9CA3AF] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-[#111827]">{m.key}:</span>{' '}
                  <span className="text-[#6B7280]">{m.value}</span>
                </div>
                <button onClick={() => deleteMemory(m.key)} className="opacity-0 group-hover:opacity-100 text-[#EF4444] hover:text-[#DC2626]"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (hall && hallAgents && allAgents) {
    const agentColors = hallAgents.reduce((acc, a, i) => {
      acc[a.name] = AGENT_COLORS[i % AGENT_COLORS.length]
      return acc
    }, {} as Record<string, string>)
    const availableAgents = allAgents.filter(a => !hallAgents.some(h => h.name === a.name))

    return (
      <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <div className="flex -space-x-2">
            {hallAgents.slice(0, 4).map((a) => (
              <div key={a.name} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-medium" style={{ backgroundColor: agentColors[a.name] + '22', color: agentColors[a.name] }}>{getInitials(a.name)}</div>
            ))}
            {hallAgents.length > 4 && <div className="w-7 h-7 rounded-full bg-[#E5E7EB] border-2 border-white flex items-center justify-center text-[9px] font-medium text-[#6B7280]">+{hallAgents.length - 4}</div>}
          </div>
          <p className="text-sm font-semibold text-[#111827]">{hall.name}</p>
        </div>

        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3">AGENTS IN THIS HALL</p>
          <div className="space-y-3">
            {hallAgents.map((a) => {
              const color = agentColors[a.name]
              return (
                <div key={a.name} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-medium flex-shrink-0 mt-0.5" style={{ backgroundColor: color + '22', color }}>{getInitials(a.name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#111827]">{a.name}</p>
                      {onRemoveAgent && (
                        <button onClick={() => onRemoveAgent(a.name)} className="p-0.5 hover:bg-[#FEE2E2] rounded"><X size={12} className="text-[#EF4444]" /></button>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280]">API: {a.source}</p>
                    <p className="text-xs text-[#2878D9]">MCP: {(hallAgentMcp?.[a.name]?.length || 0)} servers</p>
                  </div>
                </div>
              )
            })}
          </div>
          {onAddAgent && (
            <div className="relative mt-2">
              <button onClick={() => setShowAddAgent(!showAddAgent)} className="flex items-center gap-1 text-xs text-[#2878D9] font-medium hover:underline"><Plus size={12} />Add Agent</button>
              {showAddAgent && (
                <div className="absolute left-0 top-6 z-10 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto w-full">
                  {availableAgents.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[#9CA3AF] italic">All agents already in hall</p>
                  ) : (
                    availableAgents.map(a => (
                      <button key={a.name} onClick={() => { onAddAgent(a.name); setShowAddAgent(false) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[#111827] hover:bg-[#F9FAFB]">
                        <div className="w-5 h-5 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[7px] font-medium text-[#6B7280]">{getInitials(a.name)}</div>
                        <span>{a.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-b border-[#E5E7EB] flex-1">
          <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-2">NOTES</p>
          <div className="border border-[#E5E7EB] rounded-lg">
            <textarea className="w-full h-20 resize-none outline-none text-sm text-[#111827] placeholder:text-[#9CA3AF] px-3 pt-2" placeholder="Write a note..." value={notes} onChange={e => onNotesChange(e.target.value)} />
            <div className="flex items-center gap-2 px-3 pb-2">
              <Paperclip size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
              <Smile size={14} className="text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
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
        <SharedMemorySection />
      </div>
    )
  }

  if (!agent) return <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#E5E7EB]" />

  return (
    <div className="w-[320px] flex-shrink-0 bg-white border-l border-[#E5E7EB] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">{getInitials(agent.name)}</div>
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

      <div className="px-5 py-4">
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
      <SharedMemorySection />
    </div>
  )
}
