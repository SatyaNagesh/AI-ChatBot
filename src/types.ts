export type Agent = {
  name: string; model: string; specialty: string; online: boolean
  description: string; capabilities: string[]; bestAt: string; source: string
}
export type Session = { id: string; name: string; preview: string; unread: number }
export type Message = { role: 'user' | 'assistant'; content: string }
export type HallMessage = { role: 'user' | 'assistant'; content: string; agentName?: string }
export type MCPServer = { name: string; url: string }
export type Activity = { user: string; time: string; text: string; status: 'done' | 'doing' | 'pending' | 'waiting' }
export type GreatHall = { id: string; name: string; agents: string[] }
export type PageName = 'dashboard' | 'chat' | 'calendar' | 'inbox' | 'tasks' | 'voice' | 'search' | 'analytics' | 'projects' | 'files' | 'settings' | 'help'
