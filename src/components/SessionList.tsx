import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Plus, Filter, MoreHorizontal, Pencil, Check, X } from 'lucide-react'
import type { Session } from '../types'

export default function SessionList({ sessions, selectedSession, onSelectSession, onNewSession, onRenameSession }: {
  sessions: Session[]; selectedSession: string; onSelectSession: (id: string) => void; onNewSession: () => void; onRenameSession: (id: string, name: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null)
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
    if (renameValue.trim()) onRenameSession(id, renameValue.trim())
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
                    <input ref={inputRef} className="flex-1 text-sm font-medium text-[#111827] border border-[#2878D9] rounded px-1.5 py-0.5 outline-none" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmRename(session.id); if (e.key === 'Escape') setRenaming(null) }} onClick={e => e.stopPropagation()} />
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
