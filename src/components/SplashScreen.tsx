import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'done'>('enter')

  useEffect(() => {
    const seen = sessionStorage.getItem('splash-seen')
    if (seen) {
      setPhase('done')
      onFinish()
      return
    }
    const t1 = setTimeout(() => setPhase('hold'), 800)
    const t2 = setTimeout(() => setPhase('exit'), 2000)
    const t3 = setTimeout(() => {
      setPhase('done')
      sessionStorage.setItem('splash-seen', '1')
      onFinish()
    }, 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden">
      <h1
        className="text-black font-bold select-none"
        style={{
          fontSize: 'clamp(4rem, 15vw, 12rem)',
          letterSpacing: '0.06em',
          transform: phase === 'enter' ? 'scale(0.3)' : phase === 'exit' ? 'scale(1.3)' : 'scale(1)',
          opacity: phase === 'exit' ? 0 : 1,
          transition: phase === 'enter'
            ? 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease'
            : phase === 'exit'
            ? 'transform 1s cubic-bezier(0.5, 0, 0.1, 1), opacity 0.8s ease'
            : 'none',
        }}
      >
        J.A.R.V.I.S
      </h1>
    </div>
  )
}
