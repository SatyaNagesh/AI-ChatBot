import { useState } from 'react'
import { Globe, Key, Puzzle, Database, Palette, Info, ExternalLink } from 'lucide-react'

const CATEGORIES = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'mcp', label: 'MCP Servers', icon: Database },
  { id: 'storage', label: 'Storage', icon: Database },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'about', label: 'About', icon: Info },
]

const API_KEYS = [
  { service: 'tokenlb.net (Claude)', key: 'sk-mOpK****...****WME4', status: 'connected' as const },
  { service: 'tokenlb.net (GPT)', key: 'sk-mOpK****...****WME4', status: 'connected' as const },
  { service: 'Bluesminds', key: 'sk-KmTY****...****VO4P', status: 'connected' as const },
]

const INTEGRATIONS = [
  { name: 'GitHub', connected: true, username: 'SatyaNagesh' },
  { name: 'Google', connected: false },
  { name: 'Slack', connected: false },
  { name: 'Discord', connected: false },
]

const MCP_SERVERS = [
  { name: 'Obsidian-MCP', url: 'http://localhost:3456', status: 'connected' as const },
  { name: 'Ruflo', url: 'ws://localhost:8765', status: 'connected' as const },
  { name: 'Filesystem', url: 'http://localhost:3457', status: 'disconnected' as const },
]

export default function SettingsPage() {
  const [category, setCategory] = useState('general')

  return (
    <div className="flex-1 flex bg-[#FAFAFA]">
      <div className="w-52 flex-shrink-0 bg-white border-r border-[#E5E7EB] p-3 overflow-y-auto">
        <p className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-2 px-2">SETTINGS</p>
        {CATEGORIES.map(c => {
          const Icon = c.icon
          return (
            <button key={c.id} onClick={() => setCategory(c.id)} className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm mb-0.5 ${category === c.id ? 'bg-[#F3F4F6] text-[#111827] font-medium' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>
              <Icon size={16} />
              <span>{c.label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {category === 'general' && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold text-[#111827]">General Settings</h2>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 space-y-4">
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Default AI Agent</label>
                <select className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none text-[#111827]">
                  <option>Claude Code</option>
                  <option>opencode</option>
                  <option>Claude Sonnet 4.6</option>
                </select></div>
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Language</label>
                <select className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 outline-none text-[#111827]">
                  <option>English</option>
                </select></div>
              <div className="flex items-center justify-between"><span className="text-sm text-[#111827]">Notifications</span>
                <div className="w-10 h-5 rounded-full bg-[#2878D9] relative cursor-pointer"><div className="w-4 h-4 rounded-full bg-white absolute top-0.5 right-0.5" /></div></div>
              <div className="flex items-center justify-between"><span className="text-sm text-[#111827]">Sound Effects</span>
                <div className="w-10 h-5 rounded-full bg-[#D1D5DB] relative cursor-pointer"><div className="w-4 h-4 rounded-full bg-white absolute top-0.5 left-0.5" /></div></div>
            </div>
          </div>
        )}

        {category === 'api-keys' && (
          <div className="max-w-lg space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-[#111827]">API Keys</h2>
              <button className="text-xs text-[#2878D9] font-medium hover:underline">+ Add API Key</button></div>
            <div className="bg-white rounded-lg border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
              {API_KEYS.map((k, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div><p className="text-sm font-medium text-[#111827]">{k.service}</p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">{k.key}</p></div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${k.status === 'connected' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>{k.status}</span>
                    <button className="text-xs text-[#EF4444] hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {category === 'integrations' && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold text-[#111827]">Integrations</h2>
            <div className="grid grid-cols-2 gap-4">
              {INTEGRATIONS.map((int, i) => (
                <div key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] flex items-center justify-center text-sm font-medium text-[#6B7280]">{int.name[0]}</div>
                    <div><p className="text-sm font-medium text-[#111827]">{int.name}</p>
                      {int.connected && <p className="text-xs text-[#22C55E]">Connected as {int.username}</p>}
                      {!int.connected && <p className="text-xs text-[#9CA3AF]">Not connected</p>}
                    </div>
                  </div>
                  <button className={`text-xs font-medium ${int.connected ? 'text-[#EF4444] hover:underline' : 'text-[#2878D9] hover:underline'}`}>
                    {int.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {category === 'mcp' && (
          <div className="max-w-lg space-y-6">
            <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-[#111827]">MCP Servers</h2>
              <button className="text-xs text-[#2878D9] font-medium hover:underline">+ Add MCP Server</button></div>
            <div className="bg-white rounded-lg border border-[#E5E7EB] divide-y divide-[#F3F4F6]">
              {MCP_SERVERS.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'connected' ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]'}`} />
                    <div><p className="text-sm font-medium text-[#111827]">{s.name}</p>
                      <p className="text-xs text-[#9CA3AF] font-mono">{s.url}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-[#6B7280] hover:underline">Edit</button>
                    <button className="text-xs text-[#EF4444] hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {category === 'storage' && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold text-[#111827]">Storage</h2>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 space-y-4">
              <div className="flex items-center justify-between"><span className="text-sm text-[#6B7280]">Database</span>
                <span className="text-sm font-medium text-[#111827]">Cloudflare D1</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-[#6B7280]">Storage Used</span>
                <span className="text-sm font-medium text-[#111827]">2.4 GB / 10 GB</span></div>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#2878D9]" style={{ width: '24%' }} /></div>
              <div className="flex items-center justify-between"><span className="text-sm text-[#6B7280]">Sessions</span>
                <span className="text-sm font-medium text-[#111827]">47</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-[#6B7280]">Messages</span>
                <span className="text-sm font-medium text-[#111827]">1,284</span></div>
              <button className="text-xs text-[#EF4444] font-medium hover:underline mt-2">Clear All Data</button>
            </div>
          </div>
        )}

        {category === 'appearance' && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold text-[#111827]">Appearance</h2>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 space-y-4">
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Theme</label>
                <div className="flex items-center gap-3">
                  {['Light', 'Dark'].map(t => (
                    <button key={t} className={`px-4 py-2 text-sm rounded-lg border ${t === 'Light' ? 'border-[#2878D9] bg-[#EBF4FF] text-[#2878D9] font-medium' : 'border-[#E5E7EB] text-[#6B7280]'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div><label className="text-xs text-[#6B7280] block mb-1.5">Font Size</label>
                <div className="flex items-center gap-3">
                  {['Small', 'Medium', 'Large'].map(s => (
                    <button key={s} className={`px-4 py-2 text-sm rounded-lg border ${s === 'Medium' ? 'border-[#2878D9] bg-[#EBF4FF] text-[#2878D9] font-medium' : 'border-[#E5E7EB] text-[#6B7280]'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between"><span className="text-sm text-[#111827]">Compact Mode</span>
                <div className="w-10 h-5 rounded-full bg-[#D1D5DB] relative cursor-pointer"><div className="w-4 h-4 rounded-full bg-white absolute top-0.5 left-0.5" /></div>
              </div>
            </div>
          </div>
        )}

        {category === 'about' && (
          <div className="max-w-lg space-y-6">
            <h2 className="text-base font-semibold text-[#111827]">About</h2>
            <div className="bg-white rounded-lg border border-[#E5E7EB] p-5 space-y-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2878D9] to-[#1D5FA8] flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">AI</span>
                </div>
                <h3 className="text-base font-semibold text-[#111827]">AI Command Center</h3>
                <p className="text-xs text-[#9CA3AF] mt-1">Version 1.0.0</p>
              </div>
              <div className="space-y-2 text-sm text-[#6B7280]">
                <p>Built with: React 19 · Vite 8 · Tailwind v4 · Cloudflare D1</p>
                <p>AI Models: Claude · GPT · Gemini · opencode</p>
                <p>Backend: Vercel Serverless · Cloudflare Workers</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <ExternalLink size={14} className="text-[#9CA3AF]" />
                <a href="#" className="text-xs text-[#2878D9] hover:underline">View on GitHub</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
