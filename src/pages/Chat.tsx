import { useState, useEffect, useCallback } from 'react'
import type { Session, GreatHall, Activity, MCPServer } from '../types'
import { DB_API, AGENTS_DATA } from '../data/agents'
import NavSidebar from '../components/NavSidebar'
import SessionList from '../components/SessionList'
import Conversation from '../components/Conversation'
import HallConversation from '../components/HallConversation'
import InfoPanel from '../components/InfoPanel'

export default function Chat() {
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
  const [greatHalls, setGreatHalls] = useState<GreatHall[]>([])
  const [activeHall, setActiveHall] = useState<GreatHall | null>(null)
  const [hallNotes, setHallNotes] = useState<Record<string, string>>({})
  const [pausedSessions, setPausedSessions] = useState<string[]>([])
  const hallMcpServers: Record<string, Record<string, MCPServer[]>> = {}

  useEffect(() => {
    fetch(`${DB_API}/sessions?agent=__hall__`)
      .then(r => r.json())
      .then(data => {
        if (!data || !data.length) return
        const halls: GreatHall[] = data
          .map((s: Session) => {
            try {
              const preview = JSON.parse(s.preview || '{}')
              if (preview.deleted) return null
              return { id: s.id, name: s.name, agents: preview.agents || [] }
            } catch { return null }
          })
          .filter(Boolean)
        if (halls.length) {
          setGreatHalls(halls)
          setActiveHall(prev => {
            if (!prev) return null
            const stillExists = halls.find(h => h.id === prev.id)
            return stillExists || null
          })
        }
      })
      .catch(() => {})
  }, [])

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

  const sessions = sessionsByAgent[selectedAgent] || []
  const agent = agents.find(a => a.name === selectedAgent)
  const session = sessions.find(s => s.id === selectedSession)
  const totalSessions = Object.values(sessionsByAgent).reduce((sum, s) => sum + s.length, 0)
  const totalAgents = agents.length
  const awaitingCount = agents.filter(a => !a.online).length
  const pausedCount = pausedSessions.length

  function handlePauseChange(id: string, paused: boolean) {
    setPausedSessions(prev => paused ? [...prev, id] : prev.filter(p => p !== id))
  }

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

  const handleCreateGreatHall = useCallback((name: string, agentNames: string[]) => {
    const id = `hall-${Date.now()}`
    const hall: GreatHall = { id, name, agents: agentNames }
    fetch(`${DB_API}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, agent: '__hall__', preview: JSON.stringify({ agents: agentNames }) }),
    }).catch(() => {})
    setGreatHalls(prev => [...prev, hall])
  }, [])

  const handleDeleteHall = useCallback((id: string) => {
    setGreatHalls(prev => prev.filter(h => h.id !== id))
    if (activeHall?.id === id) setActiveHall(null)
    fetch(`${DB_API}/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preview: JSON.stringify({ deleted: true }) }),
    }).catch(() => {})
  }, [activeHall])

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

  function handleSelectAgent(name: string) {
    setSelectedAgent(name)
    setSelectedSession('')
    setActiveHall(null)
  }

  function handleSelectHall(hall: GreatHall) {
    setActiveHall(hall)
    setSelectedSession('')
  }

  function handleCloseHall() { setActiveHall(null) }

  function handleAddAgentToHall(hallId: string, agentName: string) {
    setGreatHalls(prev => {
      const updated = prev.map(h =>
        h.id === hallId ? { ...h, agents: [...h.agents, agentName] } : h
      )
      const hall = prev.find(h => h.id === hallId)
      if (hall) {
        fetch(`${DB_API}/sessions/${hallId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preview: JSON.stringify({ agents: [...hall.agents, agentName] }) }),
        }).catch(() => {})
      }
      return updated
    })
    if (activeHall?.id === hallId) {
      setActiveHall(prev => prev ? { ...prev, agents: [...prev.agents, agentName] } : null)
    }
  }

  function handleRemoveAgentFromHall(hallId: string, agentName: string) {
    setGreatHalls(prev => {
      const hall = prev.find(h => h.id === hallId)
      if (hall) {
        fetch(`${DB_API}/sessions/${hallId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preview: JSON.stringify({ agents: hall.agents.filter(a => a !== agentName) }) }),
        }).catch(() => {})
      }
      return prev.map(h =>
        h.id === hallId ? { ...h, agents: h.agents.filter(a => a !== agentName) } : h
      )
    })
    if (activeHall?.id === hallId) {
      setActiveHall(prev => prev ? { ...prev, agents: prev.agents.filter(a => a !== agentName) } : null)
    }
  }

  return (
    <div className="flex-1 flex bg-[#FAFAFA]">
      <NavSidebar
        agents={agents}
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        greatHalls={greatHalls}
        selectedHallId={activeHall?.id}
        onSelectHall={handleSelectHall}
        onCreateGreatHall={handleCreateGreatHall}
        onDeleteHall={handleDeleteHall}
        totalSessions={totalSessions}
        totalAgents={totalAgents}
        awaitingCount={awaitingCount}
        pausedCount={pausedCount}
      />
      {activeHall ? (
        <HallConversation hall={activeHall} agents={agents} onClose={handleCloseHall} onActivity={a => setActivities(prev => [a, ...prev].slice(0, 20))} onPauseChange={handlePauseChange} />
      ) : (
        <>
          <SessionList sessions={sessions} selectedSession={selectedSession} onSelectSession={setSelectedSession} onNewSession={handleNewSession} onRenameSession={handleRenameSession} />
          {session ? (
            <Conversation sessionId={session.id} model={agent?.model || ''} sessionName={session.name} onFirstMessage={handleFirstMessage} onClose={() => setSelectedSession('')} onActivity={a => setActivities(prev => [a, ...prev].slice(0, 20))} onPauseChange={handlePauseChange} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <p className="text-sm text-[#9CA3AF]">Select a session or start a new one</p>
            </div>
          )}
        </>
      )}
      <InfoPanel
        agent={agent}
        mcpServers={mcpServers[selectedAgent] || []}
        onRenameAgent={handleRenameAgent}
        onAddMCPServer={s => setMcpServers(prev => ({ ...prev, [selectedAgent]: [...(prev[selectedAgent] || []), s] }))}
        notes={activeHall ? (hallNotes[activeHall.id] || '') : (agentNotes[selectedSession] || '')}
        onNotesChange={activeHall ? (v => setHallNotes(prev => ({ ...prev, [activeHall.id]: v }))) : (v => setAgentNotes(prev => ({ ...prev, [selectedSession]: v })))}
        activities={activities}
        hall={activeHall || undefined}
        hallAgents={activeHall ? activeHall.agents.map(n => agents.find(a => a.name === n)!).filter(Boolean) : undefined}
        onRemoveAgent={activeHall ? (name => handleRemoveAgentFromHall(activeHall.id, name)) : undefined}
        onAddAgent={activeHall ? (name => handleAddAgentToHall(activeHall.id, name)) : undefined}
        allAgents={activeHall ? agents : undefined}
        hallMcpServers={activeHall ? (hallMcpServers[activeHall.id] || {}) : undefined}
      />
    </div>
  )
}
