import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion, scrollToId } from '../lib/motion'
import { sfx, sound } from '../lib/sound'
import { haptic } from '../lib/haptics'

const LINKS = [
  { id: 'plug', label: 'Plug in' },
  { id: 'desk', label: 'The desk' },
  { id: 'stack', label: 'The stack' },
  { id: 'playground', label: 'Draw something' },
  { id: 'words', label: 'Why I build' },
  { id: 'work', label: 'Work' },
  { id: 'heap', label: 'Say hi' },
]

/** Crumpled-paper grain over the whole site. One static SVG, rendered once by the browser. */
export function Paper() {
  return <div className="paper-grain" aria-hidden="true" />
}

/** A ceiling pull-cord. Pull it (click, drag down, or Enter) to drop the menu tag. */
export function PullCord() {
  const [open, setOpen] = useState(false)
  const cord = useRef<HTMLDivElement>(null)
  const tag = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; d: number } | null>(null)

  const tug = (to = !open) => {
    sfx.tug()
    haptic.pulse()
    const el = cord.current
    if (el && !prefersReducedMotion()) {
      gsap.fromTo(el, { '--pull': '46px' }, { '--pull': '0px', duration: 0.9, ease: 'elastic.out(1, 0.35)' })
    }
    setOpen(to)
  }

  useEffect(() => {
    const t = tag.current
    if (!t || prefersReducedMotion()) return
    if (open) gsap.fromTo(t, { y: -40, rotate: -14, opacity: 0 }, { y: 0, rotate: -3, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' })
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`pullcord ${open ? 'open' : ''}`}>
      <div
        ref={cord}
        className="cord"
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, d: 0 }
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          drag.current.d = Math.max(0, Math.min(70, e.clientY - drag.current.y))
          cord.current!.style.setProperty('--pull', `${drag.current.d}px`)
        }}
        onPointerUp={() => {
          if (!drag.current) return
          drag.current = null
          tug() // a tap or a drag both count as a pull
        }}
        onPointerCancel={() => { drag.current = null; cord.current!.style.setProperty('--pull', '0px') }}
      >
        <span className="string" />
        <button
          className="bead"
          aria-expanded={open}
          aria-controls="cord-menu"
          aria-label={open ? 'Close menu' : 'Pull for menu'}
          onClick={(e) => { if (e.detail === 0) tug() /* keyboard */ }}
        >
          <span className="bead-label">{open ? 'close' : 'pull'}</span>
        </button>
      </div>
      <div ref={tag} id="cord-menu" className="cord-tag" hidden={!open}>
        <p className="tag-h">Where to?</p>
        <ul>
          {LINKS.map((l) => (
            <li key={l.id}>
              <button onClick={() => { setOpen(false); sfx.click(); scrollToId(l.id) }}>{l.label}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function Logo() {
  return (
    <button className="logo-sticker" onClick={() => scrollToId('plug')} aria-label="Ujjwal Dhariwal, back to top">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M18 4 9 18h6l-2 10 10-15h-6z" /></svg>
      <span>Ujjwal<br />Dhariwal</span>
    </button>
  )
}

export function SoundToggle() {
  const [on, setOn] = useState(sound.on)
  useEffect(() => sound.subscribe(setOn), [])
  return (
    <button className={`sound-toggle ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => sound.set(!on)}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" />
        {on ? <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" className="waves" /> : <path d="M16.5 9.5l5 5m0-5-5 5" className="waves" />}
      </svg>
      <span>{on ? 'Sound on' : 'Sound off'}</span>
    </button>
  )
}
