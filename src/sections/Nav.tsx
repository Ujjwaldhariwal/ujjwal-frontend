import { useEffect, useState } from 'react'
import { scrollToId, ScrollTrigger } from '../lib/motion'

const LINKS = [
  { id: 'grid', label: 'Grid' },
  { id: 'playground', label: 'Playground' },
  { id: 'access', label: 'Access' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
]

export default function Nav() {
  const [active, setActive] = useState('grid')
  const [progress, setProgress] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const triggers = LINKS.map(({ id }) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top 45%',
        end: 'bottom 45%',
        onToggle: (s) => s.isActive && setActive(id),
      }),
    )
    const p = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (s) => {
        setProgress(s.progress)
        setHidden(s.direction === 1 && s.scroll() > 200)
      },
    })
    return () => {
      triggers.forEach((t) => t.kill())
      p.kill()
    }
  }, [])

  return (
    <header className={`nav ${hidden ? 'hidden' : ''}`} onFocus={() => setHidden(false)}>
      <button className="nav-name" onClick={() => scrollToId('grid')}>
        Ujjwal Dhariwal
      </button>
      <nav aria-label="Sections">
        {LINKS.map((l) => (
          <button
            key={l.id}
            className={active === l.id ? 'on' : ''}
            aria-current={active === l.id ? 'true' : undefined}
            onClick={() => scrollToId(l.id)}
          >
            {l.label}
          </button>
        ))}
      </nav>
      <div className="nav-progress" style={{ transform: `scaleX(${progress})` }} />
    </header>
  )
}
