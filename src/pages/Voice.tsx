import { useState, useEffect } from 'react'
import { ExternalLink, GitFork, BookOpen, Terminal, Cpu, Zap, Globe, Download, Sparkles, Check, ChevronDown } from 'lucide-react'

const FEATURES = [
  { icon: Cpu, title: 'Local-First', desc: '100% on-device inference via Ollama, vLLM, SGLang, or llama.cpp. No cloud dependency.' },
  { icon: Zap, title: 'Hardware-Aware', desc: 'Auto-detects your GPU/CPU and tunes the engine for optimal efficiency.' },
  { icon: Globe, title: 'Cloud Optional', desc: 'Add cloud APIs (OpenRouter, Anthropic, OpenAI, Google) only when local isn\'t enough.' },
  { icon: Sparkles, title: 'Learning Loop', desc: 'Traces stored in local DB improve models over time using your own interaction data.' },
]

const QUICK_CMDS = [
  { cmd: 'curl -fsSL https://open-jarvis.github.io/OpenJarvis/install.sh | bash', label: 'macOS / Linux / WSL2' },
  { cmd: 'irm https://open-jarvis.github.io/OpenJarvis/install.ps1 | iex', label: 'Native Windows' },
  { cmd: 'jarvis', label: 'Start chatting' },
  { cmd: 'jarvis init --preset morning-digest-mac', label: 'Quick preset' },
]

export default function VoicePage() {
  const [jarvisRunning, setJarvisRunning] = useState<boolean | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  useEffect(() => {
    fetch('http://localhost:5173/api/health', { signal: AbortSignal.timeout(2000) })
      .then(r => setJarvisRunning(r.ok))
      .catch(() => setJarvisRunning(false))
  }, [])

  function copyCmd(idx: number, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="flex-1 flex bg-[#FAFAFA] overflow-y-auto">
      <div className="flex-1 max-w-4xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-[#111827] tracking-tight">OpenJarvis</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Personal AI, On Personal Devices</p>
          </div>
          <div className="flex items-center gap-3">
            {jarvisRunning === true && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Running on localhost:5173
              </span>
            )}
            {jarvisRunning === false && (
              <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                Not detected
              </span>
            )}
            {jarvisRunning === null && (
              <span className="text-xs text-[#9CA3AF]">Checking...</span>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-[#0A0F1E] to-[#1A1F2E] rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">J</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">A research framework for composable, on-device AI</h2>
              <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                OpenJarvis is a Stanford research framework for building personal AI agents that run locally by default,
                calling cloud APIs only when necessary. It provides shared primitives for on-device agents, evaluations
                that treat energy, FLOPs, latency, and cost as first-class constraints, and a learning loop that improves
                models using local trace data.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-xs text-gray-500">Stanford Scaling Intelligence Lab · Hazy Research</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status + Quick Launch */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3">STATUS</h3>
            {jarvisRunning === true ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-[#111827]">OpenJarvis is running</span>
                </div>
                <a
                  href="http://localhost:5173"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#2878D9] hover:underline"
                >
                  <ExternalLink size={14} /> Open Web UI
                </a>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                  <span className="text-sm font-medium text-[#111827]">Not running</span>
                </div>
                <p className="text-xs text-[#9CA3AF]">Install OpenJarvis to get started</p>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3">QUICK LAUNCH</h3>
            <div className="flex flex-wrap gap-2">
              <a href="https://open-jarvis.github.io/OpenJarvis/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-[#F3F4F6] text-[#374151] px-3 py-1.5 rounded-lg hover:bg-[#E5E7EB]">
                <BookOpen size={12} /> Docs
              </a>
              <a href="https://github.com/open-jarvis/OpenJarvis" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-[#F3F4F6] text-[#374151] px-3 py-1.5 rounded-lg hover:bg-[#E5E7EB]">
                <GitFork size={12} /> GitHub
              </a>
              <a href="https://discord.gg/YZZRxCAhmm" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-[#F3F4F6] text-[#374151] px-3 py-1.5 rounded-lg hover:bg-[#E5E7EB]">
                <ExternalLink size={12} /> Discord
              </a>
              <button onClick={() => window.location.href = 'https://open-jarvis.github.io/OpenJarvis/getting-started/install/'} className="inline-flex items-center gap-1.5 text-xs bg-[#2878D9] text-white px-3 py-1.5 rounded-lg hover:bg-[#1D5FA8]">
                <Download size={12} /> Install
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Core Features</h3>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                <f.icon size={16} className="text-[#2878D9]" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#111827]">{f.title}</h4>
                <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Installation */}
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Installation</h3>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-8">
          <div className="space-y-2">
            {QUICK_CMDS.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-[#6B7280] w-32 flex-shrink-0">{q.label}</span>
                <code className="flex-1 text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#111827] font-mono truncate">{q.cmd}</code>
                <button
                  onClick={() => copyCmd(i, q.cmd)}
                  className="flex-shrink-0 w-7 h-7 rounded-md bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center"
                >
                  {copiedIdx === i ? <Check size={12} className="text-emerald-600" /> : <Terminal size={12} className="text-[#6B7280]" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5 Pillars */}
        <h3 className="text-sm font-semibold text-[#111827] mb-3">Architecture</h3>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-8">
          <div className="grid grid-cols-5 gap-4">
            {['Intelligence', 'Agent', 'Tools', 'Engine', 'Learning'].map((p, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-[#2878D9]">{i + 1}</span>
                </div>
                <p className="text-xs font-medium text-[#111827]">{p}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#9CA3AF] text-center mt-4">Five interconnected pillars powering local-first personal AI</p>
        </div>

        {/* FAQ */}
        <h3 className="text-sm font-semibold text-[#111827] mb-3">FAQ</h3>
        <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] mb-8">
          {[
            { q: 'What hardware do I need?', a: 'Any modern x86_64 or ARM64 CPU with 4GB RAM minimum. 8GB+ recommended for local inference. GPU acceleration auto-detected.' },
            { q: 'How is this different from Ollama?', a: 'Ollama is an inference engine. OpenJarvis is a full framework on top — adding agents, tools, evaluation, and a learning loop that treats energy and cost as first-class metrics.' },
            { q: 'Can I use cloud models too?', a: 'Yes. Local-first is the default, but you can add cloud providers (OpenRouter, Anthropic, OpenAI, Google) as a fallback for tasks local models can\'t handle.' },
            { q: 'Is my data private?', a: 'Yes. Everything runs locally by default. No data leaves your machine unless you explicitly configure a cloud API key.' },
          ].map((item, i) => (
            <button key={i} onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full text-left p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAFAFA]">
              <span className="text-sm text-[#111827]">{item.q}</span>
              <ChevronDown size={14} className={`text-[#9CA3AF] transition-transform ${faqOpen === i ? 'rotate-180' : ''}`} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-[#9CA3AF]">
            OpenJarvis is a research project from{' '}
            <a href="https://scalingintelligence.stanford.edu/" target="_blank" rel="noopener noreferrer" className="text-[#2878D9] hover:underline">Stanford Scaling Intelligence Lab</a>
            {' '}·{' '}
            <a href="https://github.com/open-jarvis/OpenJarvis" target="_blank" rel="noopener noreferrer" className="text-[#2878D9] hover:underline">GitHub</a>
            {' '}·{' '}
            <a href="https://open-jarvis.github.io/OpenJarvis/" target="_blank" rel="noopener noreferrer" className="text-[#2878D9] hover:underline">Documentation</a>
          </p>
        </div>
      </div>
    </div>
  )
}
