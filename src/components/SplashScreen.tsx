import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<'show' | 'exit' | 'done'>('show')

  useEffect(() => {
    const seen = sessionStorage.getItem('splash-seen')
    if (seen) {
      setPhase('done')
      onFinish()
      return
    }
    const t1 = setTimeout(() => setPhase('exit'), 500)
    const t2 = setTimeout(() => {
      setPhase('done')
      sessionStorage.setItem('splash-seen', '1')
      onFinish()
    }, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onFinish])

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden">
      <h1
        className="text-black font-bold select-none"
        style={{
          fontSize: 'clamp(4rem, 15vw, 12rem)',
          letterSpacing: '0.06em',
          transform: phase === 'exit' ? 'scale(3.5)' : 'scale(1)',
          opacity: phase === 'exit' ? 0 : 1,
          transition: phase === 'exit'
            ? 'transform 1s ease, opacity 0.9s ease'
            : 'none',
        }}
      >
        J.A.R.V.I.S
      </h1>
    </div>
  )
}
