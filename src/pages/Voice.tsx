import { useState } from 'react'
import { Mic, Square, Upload, Headphones } from 'lucide-react'

const HISTORY = [
  { id: '1', text: "Generate a new React component for the dashboard's activity feed", time: '2h ago', agent: 'Claude Code' },
  { id: '2', text: 'Explain the architecture of the current authentication system', time: '5h ago', agent: 'opencode' },
  { id: '3', text: 'Create unit tests for the message parsing utility functions', time: '1d ago', agent: 'GPT-5.5' },
]

export default function VoicePage() {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')

  function toggleRecording() {
    if (recording) {
      setRecording(false)
      if (transcript) {
        HISTORY.unshift({ id: Date.now().toString(), text: transcript, time: 'Just now', agent: 'Claude Sonnet 4.6' })
        setTranscript('')
      }
    } else {
      setRecording(true)
      setTranscript('')
    }
  }

  return (
    <div className="flex-1 flex bg-[#FAFAFA] overflow-y-auto">
      <div className="flex-1 flex flex-col px-8 py-6">
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight mb-6">Voice & Multimodal</h1>

        <div className="flex-1 flex flex-col items-center justify-center">
          <button
            onClick={toggleRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${recording ? 'bg-[#DC2626] shadow-lg shadow-red-200 scale-110 animate-pulse' : 'bg-gradient-to-br from-[#2878D9] to-[#1D5FA8] hover:shadow-lg hover:shadow-blue-200'}`}
          >
            {recording ? <Square size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
          </button>
          <p className="text-sm text-[#6B7280] mt-4">{recording ? 'Listening...' : 'Click to start recording'}</p>
          {recording && (
            <div className="flex items-center gap-1 mt-3">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-1 bg-[#2878D9] rounded-full animate-bounce" style={{ height: `${Math.random() * 24 + 4}px`, animationDelay: `${i * 80}ms`, animationDuration: '0.5s' }} />
              ))}
            </div>
          )}
          {transcript && (
            <div className="mt-6 max-w-lg w-full bg-white rounded-lg border border-[#E5E7EB] p-4">
              <p className="text-sm text-[#111827]">{transcript}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Recent Voice Sessions</h3>
          <div className="space-y-2">
            {HISTORY.map(h => (
              <div key={h.id} className="bg-white rounded-lg border border-[#E5E7EB] p-3 flex items-center gap-3 cursor-pointer hover:bg-[#FAFAFA]">
                <Headphones size={16} className="text-[#9CA3AF] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#111827] truncate">{h.text}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#9CA3AF]">{h.time}</span>
                    <span className="text-xs text-[#2878D9]">{h.agent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-64 flex-shrink-0 bg-white border-l border-[#E5E7EB] p-5">
        <h3 className="text-xs font-semibold text-[#9CA3AF] tracking-wider mb-3">UPLOAD FILES</h3>
        <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-[#D1D5DB]">
          <Upload size={24} className="text-[#9CA3AF]" />
          <p className="text-xs text-[#6B7280] text-center">Drop files here or browse</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['PNG', 'JPG', 'MP3', 'WAV', 'MP4'].map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 bg-[#F3F4F6] text-[#6B7280] rounded">{f}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
