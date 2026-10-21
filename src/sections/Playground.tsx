import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion, scrollToId, ScrollTrigger } from '../lib/motion'
import { haptic } from '../lib/haptics'
import { bbox, demoStroke, recognize, toPath, type Kind, type Pt } from '../lib/recognize'
import { ShippedButton, NightToggle, TimelineSlider, CallsChart } from '../ui/Components'

type Item = { id: number; kind: Kind; fx: number; fy: number; ghost: string; seeded: boolean; shape?: string; from?: { dx: number; dy: number } }

const NARROW: Record<Kind, [number, number]> = { button: [0.5, 0.09], toggle: [0.5, 0.27], slider: [0.5, 0.5], chart: [0.5, 0.82] }
const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 960
const seeds = (): Item[] => (isNarrow() ? SEEDS.map((s) => ({ ...s, fx: NARROW[s.kind][0], fy: NARROW[s.kind][1] })) : SEEDS)

const SEEDS: Item[] = [
  { id: 1, kind: 'button', fx: 0.24, fy: 0.16, ghost: '', seeded: true },
  { id: 2, kind: 'toggle', fx: 0.8, fy: 0.16, ghost: '', seeded: true },
  { id: 3, kind: 'slider', fx: 0.42, fy: 0.47, ghost: '', seeded: true },
  { id: 4, kind: 'chart', fx: 0.74, fy: 0.8, ghost: '', seeded: true },
]

const NOTES: Record<Kind, string> = {
  button: "you drew a box. it's a button now.",
  toggle: 'circle → toggle',
  slider: 'a line became my timeline. drag it.',
  chart: 'a zig-zag became a real chart.',
}

const STEPS = ['stroke captured', 'recognised', 'component', 'GET /api/metrics', 'rendered']
const COMPONENT_NAME: Record<Kind, string> = { button: '<Button />', toggle: '<Toggle />', slider: '<Timeline />', chart: '<LineChart />' }

export default function Playground() {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<Item[]>(seeds)
  const [live, setLive] = useState<Pt[] | null>(null)
  const [step, setStep] = useState(-1)
  const [label, setLabel] = useState<{ shape: string; conf: number; kind: Kind } | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [blueprint, setBlueprint] = useState(false)
  const drawn = useRef(false)
  const nextId = useRef(10)
  const lastPlaced = useRef<number | null>(null)
  const timers = useRef<number[]>([])

  const finalize = useCallback((pts: Pt[]) => {
    const st = stage.current!
    const res = recognize(pts)
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (res.kind === null) {
      setHint(res.reason === 'too small' ? 'Bit small. Draw it bigger.' : 'Keep going, draw a full shape.')
      setLive(null)
      setStep(-1)
      return
    }
    setHint(null)
    haptic.stamp()
    const b = bbox(pts)
    const W = st.clientWidth, H = st.clientHeight
    const home = seeds().find((sd) => sd.kind === res.kind)!
    const from = { dx: b.cx - home.fx * W, dy: b.cy - home.fy * H }
    const id = nextId.current++
    lastPlaced.current = id
    setLabel({ shape: res.shape, conf: Math.round(res.confidence * 100), kind: res.kind })
    const kind = res.kind
    const shape = res.shape
    const ghost = toPath(pts)
    STEPS.forEach((_, i) => timers.current.push(window.setTimeout(() => setStep(i), i * 170)))
    timers.current.push(window.setTimeout(() => {
      setItems((prev) => [...prev.filter((p) => p.kind !== kind), { id, kind, fx: home.fx, fy: home.fy, ghost, seeded: false, shape, from }])
      setLive(null)
    }, 260))
  }, [])

  // Pointer drawing on the paper
  useEffect(() => {
    const st = stage.current!
    let pts: Pt[] = []
    let drawing = false
    const local = (e: PointerEvent) => {
      const r = st.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.comp')) return
      drawing = true
      drawn.current = true
      st.setPointerCapture(e.pointerId)
      pts = [local(e)]
      setStep(-1)
      setLive(pts.slice())
    }
    const move = (e: PointerEvent) => {
      if (!drawing) return
      pts.push(local(e))
      setLive(pts.slice())
    }
    const up = () => {
      if (!drawing) return
      drawing = false
      finalize(pts)
    }
    st.addEventListener('pointerdown', down)
    st.addEventListener('pointermove', move)
    st.addEventListener('pointerup', up)
    st.addEventListener('pointercancel', up)
    return () => {
      st.removeEventListener('pointerdown', down)
      st.removeEventListener('pointermove', move)
      st.removeEventListener('pointerup', up)
      st.removeEventListener('pointercancel', up)
    }
  }, [finalize])

  // "Draw it for me": animates a stroke so keyboard and touch-less visitors get the same moment
  const autoDraw = useCallback((kind: Kind) => {
    const st = stage.current
    if (!st) return
    const W = st.clientWidth, H = st.clientHeight
    const s = Math.min(1, W / 860)
    const anchor: Record<Kind, [number, number]> = isNarrow() ? { button: [0.5, 0.12], toggle: [0.5, 0.3], slider: [0.5, 0.52], chart: [0.5, 0.78] } : { button: [0.3, 0.2], toggle: [0.78, 0.2], slider: [0.45, 0.5], chart: [0.42, 0.8] }
    const pts = demoStroke(kind, anchor[kind][0] * W, anchor[kind][1] * H, s)
    if (prefersReducedMotion()) { finalize(pts); return }
    const t0 = performance.now(), dur = 650
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur)
      setLive(pts.slice(0, Math.max(2, Math.floor(pts.length * k))))
      if (k < 1) requestAnimationFrame(tick)
      else finalize(pts)
    }
    setStep(-1)
    requestAnimationFrame(tick)
  }, [finalize])

  // If nobody draws within a few seconds, demo it once
  useEffect(() => {
    let id = 0
    const t = ScrollTrigger.create({
      trigger: section.current,
      start: 'top 40%',
      once: true,
      onEnter: () => { id = window.setTimeout(() => { if (!drawn.current) autoDraw('chart') }, 2600) },
    })
    return () => { t.kill(); clearTimeout(id) }
  }, [autoDraw])

  // Pop the newly placed component in
  // Pop the new component out of the stroke, then fly it home so the paper never gets cluttered
  useLayoutEffect(() => {
    const id = lastPlaced.current
    if (id == null) return
    const it = items.find((i) => i.id === id)
    const slot = stage.current?.querySelector(`[data-item="${id}"]`)
    const comp = slot?.querySelector('.comp')
    const note = slot?.querySelector('.note')
    const gh = stage.current?.querySelector(`[data-ghost="${id}"]`)
    if (slot && comp && it?.from && !prefersReducedMotion()) {
      const tl = gsap.timeline()
      tl.fromTo(slot, { x: it.from.dx, y: it.from.dy }, { x: 0, y: 0, duration: 0.9, ease: 'expo.inOut', delay: 0.35 }, 0)
      tl.fromTo(comp, { scale: 0.3, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.55, ease: 'back.out(2.4)' }, 0)
      if (note) tl.fromTo(note, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.9)
    }
    if (gh) gsap.fromTo(gh, { opacity: 0.95, strokeWidth: 3.2 }, { opacity: 0.22, strokeWidth: 2, duration: 1.4, ease: 'power2.out' })
    lastPlaced.current = null
  }, [items])

  const renderComp = (it: Item) => {
    switch (it.kind) {
      case 'button': return <ShippedButton onOpen={() => scrollToId('work')} />
      case 'toggle': return <NightToggle on={blueprint} onToggle={() => setBlueprint((b) => !b)} />
      case 'slider': return <TimelineSlider />
      case 'chart': return <CallsChart />
    }
  }

  return (
    <section id="playground" ref={section} className={`playground ${blueprint ? 'blueprint' : ''}`}>
      <div className="pg-left">
        <p className="hand">go on, draw something here ↘</p>
        <h2>Rough in. Production out.</h2>
        <p className="lede">
          I turn scribbles, Figma frames and messy requirements into fast, accessible React. Draw a box, a circle, a line or
          a zig-zag on the paper and watch it ship.
        </p>
        <div className="pg-cta">
          <button className="btn-cobalt" onClick={() => scrollToId('work')}>See shipped work</button>
          <a className="btn-line" href="https://github.com/Ujjwaldhariwal" target="_blank" rel="noreferrer">Read the source</a>
        </div>
        <div className="draw-for-me" role="group" aria-label="Draw it for me">
          <span>No mouse handy? Draw it for me:</span>
          {(['button', 'toggle', 'slider', 'chart'] as Kind[]).map((k) => (
            <button key={k} onClick={() => autoDraw(k)}>
              {{ button: 'a box', toggle: 'a circle', slider: 'a line', chart: 'a zig-zag' }[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="stage" ref={stage} aria-label="Drawing paper. Draw a shape to turn it into a component.">
        <svg className="ink" aria-hidden="true">
          {items.filter((i) => i.ghost).map((i) => (
            <path key={i.id} data-ghost={i.id} d={i.ghost} className="ghost" />
          ))}
          {live && <path d={toPath(live)} className="live" />}
        </svg>
        {items.map((it) => (
          <div key={it.id} data-item={it.id} className={`slot slot-${it.kind}`} style={{ left: `${it.fx * 100}%`, top: `${it.fy * 100}%` }}>
            <p className="note">{it.seeded ? NOTES[it.kind] : `you drew a ${it.shape ?? 'shape'}. shipped.`}</p>
            <div className="comp">{renderComp(it)}</div>
          </div>
        ))}
        {hint && <p className="stage-hint" role="status">{hint}</p>}
      </div>

      <ol className="pipeline" aria-live="polite">
        {STEPS.map((s, i) => (
          <li key={s} className={i <= step ? 'on' : ''}>
            {i === 1 && label ? `recognised: ${label.shape}, ${label.conf}%` : i === 2 && label ? COMPONENT_NAME[label.kind] : s}
          </li>
        ))}
        <li className="where">Noida, India · open to frontend and full-stack roles</li>
      </ol>
    </section>
  )
}
