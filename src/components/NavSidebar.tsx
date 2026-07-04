import { useState, useEffect, useRef } from 'react'
import { Search, Plus, MoreHorizontal, Trash2, Check, Circle } from 'lucide-react'
import type { Agent, GreatHall } from '../types'
import { AGENT_COLORS } from '../data/agents'
import { getInitials } from '../utils/helpers'

export default function NavSidebar({ agents, selectedAgent, onSelectAgent, greatHalls, selectedHallId, onSelectHall, onCreateGreatHall, onDeleteHall, totalSessions, totalAgents, awaitingCount, pausedCount }: {
  agents: Agent[]; selectedAgent: string; onSelectAgent: (n: string) => void;
  greatHalls: GreatHall[]; selectedHallId?: string; onSelectHall?: (h: GreatHall) => void;
  onCreateGreatHall: (name: string, agentNames: string[]) => void; onDeleteHall?: (id: string) => void
  totalSessions: number; totalAgents: number; awaitingCount: number; pausedCount: number
}) {
  const [showHallModal, setShowHallModal] = useState(false)
  const [hallName, setHallName] = useState('')
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [hallMenuOpen, setHallMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setHallMenuOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function openCreateHall() {
    setHallName('')
    setSelectedAgents([])
    setShowHallModal(true)
  }

  function toggleAgent(name: string) {
    setSelectedAgents(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  function confirmHall() {
    if (!hallName.trim() || selectedAgents.length === 0) return
    onCreateGreatHall(hallName.trim(), selectedAgents)
    setShowHallModal(false)
  }

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
          { label: 'All', count: totalSessions, color: '#9CA3AF' }, { label: 'Agent', count: totalAgents, color: '#2563EB' },
          { label: 'Awaiting agent', count: awaitingCount, color: '#D97706' }, { label: 'Paused', count: pausedCount, color: '#EAB308' },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#6B7280] cursor-pointer hover:bg-[#F9FAFB]">
            <div className="flex items-center gap-2"><Circle size={8} fill={item.color} stroke="none" /><span>{item.label}</span></div>
            <span className="text-xs text-[#9CA3AF]">{item.count}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">A GREAT HALL</p>
        {greatHalls.map((hall) => (
          <div key={hall.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer mb-1 group ${selectedHallId === hall.id ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB] text-[#6B7280]'}`} onClick={() => onSelectHall?.(hall)}>
            <div className="flex -space-x-1.5 flex-shrink-0">
              {hall.agents.slice(0, 3).map((name, i) => (
                <div key={i} className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-medium" style={{ backgroundColor: AGENT_COLORS[i % AGENT_COLORS.length] + '22', color: AGENT_COLORS[i % AGENT_COLORS.length] }}>{getInitials(name)}</div>
              ))}
              {hall.agents.length > 3 && <div className="w-5 h-5 rounded-full bg-[#E5E7EB] border border-white flex items-center justify-center text-[8px] font-medium text-[#9CA3AF]">+{hall.agents.length - 3}</div>}
            </div>
            <span className="truncate flex-1">{hall.name}</span>
            <MoreHorizontal size={13} className="text-[#9CA3AF] opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={e => { e.stopPropagation(); setHallMenuOpen(hallMenuOpen === hall.id ? null : hall.id) }} />
            {hallMenuOpen === hall.id && (
              <div ref={menuRef} className="absolute right-4 mt-16 z-10 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 min-w-[130px]" onClick={e => e.stopPropagation()}>
                <button onClick={() => { onDeleteHall?.(hall.id); setHallMenuOpen(null) }} className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-[#EF4444] hover:bg-[#F9FAFB]">
                  <Trash2 size={13} /> Delete Hall
                </button>
              </div>
            )}
          </div>
        ))}
        <button onClick={openCreateHall} className="flex items-center gap-1.5 w-full mt-1 px-3 py-2 rounded-lg text-sm font-medium text-[#2878D9] hover:bg-[#F3F4F6]"><Plus size={14} />New Great Hall</button>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">AGENTS</p>
        {agents.map((agent) => (
          <div key={agent.name} onClick={() => onSelectAgent(agent.name)} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer ${selectedAgent === agent.name ? 'bg-[#F3F4F6]' : 'hover:bg-[#F9FAFB]'}`}>
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-[#E5E7EB] flex items-center justify-center text-xs font-medium text-[#6B7280]">{getInitials(agent.name)}</div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${agent.online ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#111827] truncate">{agent.name}</p>
              <p className="text-xs text-[#6B7280] truncate">{agent.specialty}</p>
            </div>
          </div>
        ))}
      </div>

      {showHallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowHallModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-80 max-h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <p className="text-sm font-semibold text-[#111827]">Create A Great Hall</p>
            </div>
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <input className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none" placeholder="Hall name" value={hallName} onChange={e => setHallName(e.target.value)} autoFocus />
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              <p className="text-[11px] font-semibold text-[#9CA3AF] tracking-wider mb-2">SELECT AGENTS</p>
              {agents.filter(a => a.online).map((agent) => (
                <label key={agent.name} className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-[#F9FAFB] text-sm">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedAgents.includes(agent.name) ? 'bg-[#2878D9] border-[#2878D9]' : 'border-[#D1D5DB]'}`}>
                    {selectedAgents.includes(agent.name) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[9px] font-medium text-[#6B7280]">{getInitials(agent.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111827] truncate">{agent.name}</p>
                    <p className="text-xs text-[#6B7280] truncate">{agent.specialty}</p>
                  </div>
                  <input type="checkbox" className="sr-only" checked={selectedAgents.includes(agent.name)} onChange={() => toggleAgent(agent.name)} />
                </label>
              ))}
              {agents.filter(a => !a.online).length > 0 && (
                <p className="text-[11px] text-[#9CA3AF] mt-2 px-2">{agents.filter(a => !a.online).map(a => a.name).join(', ')} offline</p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-[#E5E7EB] flex justify-end gap-2">
              <button onClick={() => setShowHallModal(false)} className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F9FAFB]">Cancel</button>
              <button onClick={confirmHall} className="px-3 py-1.5 bg-[#111827] text-white rounded-lg text-xs font-medium hover:bg-[#1F2937]">Create Hall</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
