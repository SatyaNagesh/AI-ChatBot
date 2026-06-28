import { useState } from 'react'
import { TrendingUp, MessageSquare, Database, Clock } from 'lucide-react'
import { AGENTS_DATA, AGENT_COLORS } from '../data/agents'

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days']

const STATS = [
  { label: 'Total API Calls', value: '2,847', change: '+12.3%', icon: TrendingUp, color: '#2878D9' },
  { label: 'Tokens Used', value: '1.2M', change: '+8.1%', icon: MessageSquare, color: '#8B5CF6' },
  { label: 'Active Sessions', value: '23', change: '+5', icon: Database, color: '#22C55E' },
  { label: 'Avg Response Time', value: '1.8s', change: '-0.3s', icon: Clock, color: '#D97706' },
]

const CHART_DATA = [40, 65, 35, 80, 55, 90, 70, 85, 60, 75, 95, 50, 45, 78]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const AGENT_CALLS = AGENTS_DATA.map((a, i) => ({
  name: a.name,
  calls: Math.floor(Math.random() * 400 + 50),
  color: AGENT_COLORS[i % AGENT_COLORS.length],
})).sort((a, b) => b.calls - a.calls)

const RESPONSE_TABLE = AGENTS_DATA.slice(0, 7).map((a) => ({
  name: a.name,
  avg: (Math.random() * 3 + 0.5).toFixed(1),
  p50: (Math.random() * 2 + 0.3).toFixed(1),
  p95: (Math.random() * 4 + 1).toFixed(1),
  calls: Math.floor(Math.random() * 200 + 20),
  errors: (Math.random() * 5).toFixed(1),
}))

const SORT_KEYS = ['name', 'avg', 'p50', 'p95', 'calls', 'errors'] as const

export default function AnalyticsPage() {
  const [range, setRange] = useState(RANGES[0])
  const [sortKey, setSortKey] = useState<string>('calls')
  const [sortAsc, setSortAsc] = useState(false)

  const sorted = [...RESPONSE_TABLE].sort((a, b) => {
    const val = sortAsc
      ? Number(a[sortKey as keyof typeof a] || 0) - Number(b[sortKey as keyof typeof b] || 0)
      : Number(b[sortKey as keyof typeof b] || 0) - Number(a[sortKey as keyof typeof a] || 0)
    return val
  })

  function toggleSort(key: string) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5">
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Analytics</h1>
        <div className="flex bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-4 py-1.5 text-xs font-medium ${range === r ? 'bg-[#2878D9] text-white' : 'text-[#6B7280] hover:bg-[#F9FAFB]'}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-8 mb-6">
        {STATS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white rounded-lg border border-[#E5E7EB] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B7280]">{s.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '15' }}><Icon size={16} style={{ color: s.color }} /></div>
              </div>
              <p className="text-2xl font-semibold text-[#111827]">{s.value}</p>
              <p className="text-xs" style={{ color: s.change.startsWith('+') ? '#22C55E' : '#EF4444' }}>{s.change} vs previous period</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-5 gap-4 px-8 flex-1 pb-6">
        <div className="col-span-3 bg-white rounded-lg border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">Usage Over Time</h3>
          <div className="flex items-end gap-1.5 h-40">
            {CHART_DATA.map((v, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t" style={{ height: `${v}%`, backgroundColor: '#2878D9', opacity: 0.7 }} />
                {idx % 7 === 0 && <span className="text-[9px] text-[#9CA3AF]">{DAYS[idx / 7]}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-lg border border-[#E5E7EB] p-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">Agent Distribution</h3>
          <div className="space-y-2">
            {AGENT_CALLS.slice(0, 7).map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-[#6B7280] w-3 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-[#111827] truncate max-w-[100px]">{a.name}</span>
                    <span className="text-xs text-[#9CA3AF]">{a.calls}</span>
                  </div>
                  <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(a.calls / AGENT_CALLS[0].calls) * 100}%`, backgroundColor: a.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-5 bg-white rounded-lg border border-[#E5E7EB] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E7EB]">
            <h3 className="text-sm font-semibold text-[#111827]">Response Time by Agent</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  {['Agent', 'Avg (s)', 'P50 (s)', 'P95 (s)', 'Total Calls', 'Error Rate'].map((h, i) => (
                    <th key={i} onClick={() => toggleSort(SORT_KEYS[i])} className="text-left px-5 py-3 text-xs font-medium text-[#9CA3AF] cursor-pointer hover:text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA]">
                    <td className="px-5 py-3 text-sm font-medium text-[#111827]">{r.name}</td>
                    <td className="px-5 py-3 text-sm text-[#6B7280]">{r.avg}s</td>
                    <td className="px-5 py-3 text-sm text-[#6B7280]">{r.p50}s</td>
                    <td className="px-5 py-3 text-sm text-[#6B7280]">{r.p95}s</td>
                    <td className="px-5 py-3 text-sm text-[#6B7280]">{r.calls}</td>
                    <td className="px-5 py-3 text-sm text-[#6B7280]">{r.errors}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
