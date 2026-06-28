import { useState } from 'react'
import { Search as SearchIcon, MessageCircle, Ticket, FileText, X } from 'lucide-react'

const ALL_DATA = [
  { type: 'chat', title: 'API deployment configuration', context: 'Discussed with Claude Code about deploying v2.3', agent: 'Claude Code', date: '2h ago' },
  { type: 'chat', title: 'Authentication middleware fix', context: 'Debug session with opencode for JWT validation', agent: 'opencode', date: '1d ago' },
  { type: 'task', title: 'Implement OAuth2 flow', context: 'High priority task in To Do column', agent: 'GPT-5.5', date: '3d ago' },
  { type: 'task', title: 'Dashboard redesign', context: 'In Progress — 4/6 subtasks done', agent: 'Claude Sonnet 4.6', date: '5d ago' },
  { type: 'file', title: 'src/App.tsx', context: 'Main application component — 1213 lines', agent: 'Source Code', date: '1h ago' },
  { type: 'file', title: 'api/chat.js', context: 'Vercel serverless function for AI proxy', agent: 'Source Code', date: '3h ago' },
  { type: 'chat', title: 'Database schema design', context: 'Reviewed D1 schema with Claude Opus 4.8', agent: 'Claude Opus 4.8', date: '2d ago' },
]

const FILTERS = ['All', 'Chats', 'Tasks', 'Files'] as const

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string>('All')
  const [searched, setSearched] = useState(false)

  const results = query.trim()
    ? ALL_DATA.filter(item => {
        const matches = item.title.toLowerCase().includes(query.toLowerCase()) || item.context.toLowerCase().includes(query.toLowerCase())
        if (filter === 'All') return matches
        if (filter === 'Chats') return matches && item.type === 'chat'
        if (filter === 'Tasks') return matches && item.type === 'task'
        if (filter === 'Files') return matches && item.type === 'file'
        return matches
      })
    : []

  function getIcon(type: string) {
    switch (type) {
      case 'chat': return <MessageCircle size={16} className="text-[#2878D9]" />
      case 'task': return <Ticket size={16} className="text-[#D97706]" />
      case 'file': return <FileText size={16} className="text-[#6B7280]" />
      default: return <SearchIcon size={16} className="text-[#9CA3AF]" />
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex flex-col items-center px-8 pt-12 pb-6">
        <div className="relative w-full max-w-lg">
          <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="w-full h-12 pl-11 pr-10 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2878D9] focus:ring-1 focus:ring-[#2878D9]"
            placeholder="Search across all agents, sessions, tasks, files..."
            value={query}
            onChange={e => { setQuery(e.target.value); if (!searched) setSearched(true) }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearched(false) }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={16} className="text-[#9CA3AF]" />
            </button>
          )}
        </div>
      </div>

      {searched && (
        <div className="px-8 flex-1">
          <div className="flex gap-2 mb-4">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === f ? 'bg-[#2878D9] text-white' : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'}`}>{f}</button>
            ))}
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <SearchIcon size={40} className="text-[#D1D5DB]" />
              <p className="text-sm text-[#9CA3AF]">No results found for "{query}"</p>
              <p className="text-xs text-[#D1D5DB]">Try different keywords or check your filters</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {results.map((r, i) => (
                <div key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-4 flex items-start gap-3 cursor-pointer hover:border-[#D1D5DB]">
                  <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 mt-0.5">{getIcon(r.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111827]">{r.title}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{r.context}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#2878D9]">{r.agent}</span>
                      <span className="text-xs text-[#9CA3AF]">{r.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <SearchIcon size={48} className="text-[#E5E7EB] mx-auto mb-3" />
            <p className="text-sm text-[#9CA3AF]">Search across everything — chats, tasks, files, agents</p>
          </div>
        </div>
      )}
    </div>
  )
}
