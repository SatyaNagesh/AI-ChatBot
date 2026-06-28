import { useState } from 'react'
import { MessageCircle, ExternalLink, ChevronDown, Keyboard } from 'lucide-react'

const FAQ = [
  { q: 'How do I connect a new AI agent?', a: 'Agents are pre-configured in the system. Go to Settings > API Keys to manage connections. Each agent uses a specific model endpoint via tokenlb.net or Bluesminds.' },
  { q: 'What is a Great Hall?', a: 'A Great Hall is a multi-agent chat room where you send one message and it gets processed by multiple AI agents sequentially. Each agent builds on the previous responses, giving you a comprehensive answer from multiple perspectives.' },
  { q: 'How do MCP servers work?', a: 'MCP (Model Context Protocol) servers connect external tools and data sources to your AI agents. You can add them per-agent in the Info Panel or globally in Settings > MCP Servers.' },
  { q: 'How is my data stored?', a: 'All sessions, messages, and hall definitions are stored in Cloudflare D1 database. Data persists across sessions and browsers. No localStorage is used.' },
  { q: 'How do I export my chats?', a: 'Chat export is not yet available as a built-in feature. Messages are stored in D1 and can be accessed programmatically via the API.' },
]

const SHORTCUTS = [
  { keys: '⌘K', action: 'Search' },
  { keys: '⌘N', action: 'New session' },
  { keys: '⌘,', action: 'Settings' },
  { keys: '⌘1-0', action: 'Switch pages' },
  { keys: '⌘B', action: 'Toggle sidebar' },
  { keys: '⌘↑', action: 'Scroll to top' },
  { keys: '⌘↓', action: 'Scroll to bottom' },
]

const STEPS = [
  { num: 1, title: 'Select an Agent', desc: 'Choose from 13 AI models in the sidebar. Each has unique capabilities.' },
  { num: 2, title: 'Start a Chat', desc: 'Create a new session and send a message. The AI will respond in real-time.' },
  { num: 3, title: 'Create a Great Hall', desc: 'Combine multiple agents into one hall for multi-perspective answers.' },
  { num: 4, title: 'Connect MCP Servers', desc: 'Extend agent capabilities by connecting external tools and data.' },
]

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="px-8 py-5">
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Help & Support</h1>
      </div>

      <div className="grid grid-cols-2 gap-6 px-8 pb-8 flex-1">
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Quick Start Guide</h2>
            <div className="space-y-4">
              {STEPS.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#2878D9] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{s.num}</div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{s.title}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Frequently Asked Questions</h2>
            <div className="space-y-1">
              {FAQ.map((item, i) => (
                <div key={i}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-[#F9FAFB] text-left">
                    <span className="text-sm text-[#111827]">{item.q}</span>
                    <ChevronDown size={14} className={`text-[#9CA3AF] transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-3 pb-3 text-sm text-[#6B7280] leading-relaxed">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Keyboard size={16} className="text-[#9CA3AF]" />
              <h2 className="text-sm font-semibold text-[#111827]">Keyboard Shortcuts</h2>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-[#6B7280]">{s.action}</span>
                  <kbd className="text-xs bg-[#F3F4F6] border border-[#E5E7EB] rounded px-2 py-0.5 font-mono text-[#111827]">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] p-5">
            <h2 className="text-sm font-semibold text-[#111827] mb-4">Need Help?</h2>
            <p className="text-sm text-[#6B7280] mb-4">Get assistance from the AI agents or report an issue.</p>
            <div className="space-y-2">
              <button className="flex items-center gap-2 w-full px-4 py-2.5 bg-[#EBF4FF] text-[#2878D9] rounded-lg text-sm font-medium hover:bg-[#DBEAFE]">
                <MessageCircle size={16} /> Chat with opencode
              </button>
              <button className="flex items-center gap-2 w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] hover:bg-[#F9FAFB]">
                <ExternalLink size={16} /> Report an issue
              </button>
              <button className="flex items-center gap-2 w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] hover:bg-[#F9FAFB]">
                <ExternalLink size={16} /> Send feedback
              </button>
            </div>
            <p className="text-xs text-[#9CA3AF] text-center mt-4">AI Command Center v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
