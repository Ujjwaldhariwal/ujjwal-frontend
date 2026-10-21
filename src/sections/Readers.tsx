import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'

const LAYERS = [
  { key: 'default', tab: 'Everyone', sub: 'the default view' },
  { key: 'hc', tab: 'High contrast', sub: '21:1 contrast' },
  { key: 'kb', tab: 'Keyboard only', sub: 'visible focus, Tab order' },
  { key: 'zoom', tab: '200% zoom', sub: 'reflows, no side scroll' },
  { key: 'sr', tab: 'Screen reader', sub: 'what NVDA announces' },
  { key: 'hi', tab: 'हिंदी', sub: 'i18next, live switch' },
] as const

const DESKTOP = [0, 30, 46, 62, 74.5, 87.5, 100]
const MOBILE = [0, 76, 80.8, 85.6, 90.4, 95.2, 100]

function Copy({ theme }: { theme: string }) {
  return (
    <div className={`r-hero r-${theme}`}>
      <h2>I build for everyone who shows up.</h2>
      <p>Frontend engineer. React, TypeScript and Three.js, with accessibility and speed treated as features, not chores.</p>
      <div className="r-cta">
        <span className="b1">See my work</span>
        <span className="b2">Change language</span>
      </div>
    </div>
  )
}

export default function Readers() {
  const box = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState(DESKTOP)
  const [focus, setFocus] = useState(0)
  const live = useRef(edges)
  live.current = edges

  useEffect(() => {
    const set = () => setEdges(window.innerWidth < 760 ? MOBILE : DESKTOP)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [])

  const moveEdge = useCallback((i: number, pct: number) => {
    setEdges((e) => {
      const n = e.slice()
      n[i] = Math.min(n[i + 1] - 4, Math.max(n[i - 1] + 4, pct))
      return n
    })
  }, [])

  const startDrag = (i: number) => (e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const r = box.current!.getBoundingClientRect()
    const mv = (ev: PointerEvent) => moveEdge(i, ((ev.clientX - r.left) / r.width) * 100)
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up) }
    el.addEventListener('pointermove', mv)
    el.addEventListener('pointerup', up)
  }

  const show = (k: number) => {
    setFocus(k)
    const big = window.innerWidth < 760 ? 76 : 52
    const rest = (100 - big) / 5
    const target = [0]
    for (let i = 0; i < 6; i++) target.push(target[i] + (i === k ? big : rest))
    target[6] = 100
    if (prefersReducedMotion()) { setEdges(target); return }
    const obj = { ...live.current }
    gsap.to(obj, {
      ...Object.fromEntries(target.map((v, i) => [i, v])),
      duration: 0.8,
      ease: 'expo.inOut',
      onUpdate: () => setEdges(Object.values(obj) as number[]),
    })
  }

  const clip = (i: number) => `inset(0 ${100 - edges[i + 1]}% 0 ${edges[i]}%)`

  return (
    <section id="access" className="readers">
      <div className="r-stage" ref={box}>
        {LAYERS.map((l, i) => (
          <div key={l.key} className={`r-layer r-layer-${l.key}`} style={{ clipPath: clip(i) }} aria-hidden={i === 0 ? undefined : true}>
            {l.key === 'sr' || l.key === 'hi' ? (
              <div className="r-panel" style={{ left: `${edges[i]}%`, width: `${edges[i + 1] - edges[i]}%` }}>
                {l.key === 'sr' ? (
                  <div className="sr-lines">
                    <p><em>heading, level 2</em>I build for everyone who shows up.</p>
                    <p><em>link</em>See my work</p>
                    <p><em>button, collapsed</em>Change language <span className="cur" /></p>
                  </div>
                ) : (
                  <div className="hi-copy" lang="hi">
                    <h3>सबके लिए बनाता हूँ।</h3>
                    <p>i18next से हर भाषा, बिना रीलोड।</p>
                    <span className="b1">काम देखें</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={l.key === 'zoom' ? 'zoomed' : ''}>
                <Copy theme={l.key} />
              </div>
            )}
            <div className="r-tab" style={{ left: `calc(${edges[i]}% + 14px)`, maxWidth: `calc(${edges[i + 1] - edges[i]}% - 28px)` }}>
              <b>{l.tab}</b>
              <span>{l.sub}</span>
            </div>
          </div>
        ))}

        {edges.slice(1, 6).map((v, j) => {
          const i = j + 1
          return (
            <div
              key={i}
              className="seam"
              style={{ left: `${v}%` }}
              role="separator"
              aria-orientation="vertical"
              aria-label={`Seam between ${LAYERS[j].tab} and ${LAYERS[i].tab}`}
              aria-valuenow={Math.round(v)}
              aria-valuemin={0}
              aria-valuemax={100}
              tabIndex={0}
              onPointerDown={startDrag(i)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') moveEdge(i, v - 2)
                if (e.key === 'ArrowRight') moveEdge(i, v + 2)
              }}
            >
              <span className="knob">⇔</span>
            </div>
          )
        })}
      </div>

      <div className="r-bar">
        <p className="q">Same page, six people.</p>
        <p className="why">I built WCAG 2.1 AA for a portal with 2,000+ daily users. Drag a seam, or pick a reader.</p>
        <div className="chips" role="group" aria-label="Read as">
          {LAYERS.map((l, i) => (
            <button key={l.key} className={focus === i ? 'on' : ''} aria-pressed={focus === i} onClick={() => show(i)}>
              {l.tab === '200% zoom' ? 'Zoom' : l.tab === 'Keyboard only' ? 'Keyboard' : l.tab}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
