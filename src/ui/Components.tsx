import { useEffect, useId, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'

export function ShippedButton({ onOpen }: { onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const ripple = (e: React.PointerEvent) => {
    const b = ref.current!
    const r = b.getBoundingClientRect()
    const s = document.createElement('span')
    s.className = 'ripple'
    s.style.left = e.clientX - r.left + 'px'
    s.style.top = e.clientY - r.top + 'px'
    b.appendChild(s)
    setTimeout(() => s.remove(), 600)
  }
  return (
    <button ref={ref} className="c-btn" onPointerDown={ripple} onClick={onOpen}>
      Open my projects
    </button>
  )
}

export function NightToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button className={`c-tog ${on ? 'on' : ''}`} role="switch" aria-checked={on} onClick={onToggle}>
      <span className="track"><span className="thumb" /></span>
      Blueprint mode
    </button>
  )
}

const STOPS = [
  { at: 0, when: 'May 2023', what: 'Hippo Toys · built the checkout' },
  { at: 33, when: 'Jan 2024', what: 'Infinite · engineering intern' },
  { at: 67, when: 'Sep 2024', what: 'Infinite · joined as engineer' },
  { at: 100, when: 'Now', what: 'Data-heavy dashboards in production' },
]

export function TimelineSlider() {
  const [v, setV] = useState(67)
  const id = useId()
  const stop = STOPS.reduce((a, s) => (Math.abs(s.at - v) < Math.abs(a.at - v) ? s : a), STOPS[0])
  return (
    <div className="c-slider">
      <label htmlFor={id} className="sr-only">Career timeline</label>
      <div className="bubble" style={{ left: `${v}%` }}>
        <b>{stop.when}</b> {stop.what}
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={v}
        aria-valuetext={`${stop.when}: ${stop.what}`}
        onChange={(e) => setV(+e.target.value)}
        style={{ ['--fill' as string]: `${v}%` }}
      />
      <div className="ticks" aria-hidden="true">
        <span>2023</span><span>2024</span><span>Sep ’24</span><span>today</span>
      </div>
    </div>
  )
}

const CALLS = [100, 97, 99, 92, 88, 80, 76, 72, 70, 67, 66, 65]

export function CallsChart() {
  const path = useRef<SVGPathElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const W = 300, H = 90
  const pts = CALLS.map((c, i) => [i * (W / (CALLS.length - 1)), H - ((c - 55) / 50) * H] as const)
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

  useEffect(() => {
    const el = path.current
    if (!el || prefersReducedMotion()) return
    const L = el.getTotalLength()
    gsap.fromTo(el, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' })
  }, [])

  return (
    <figure className="c-chart">
      <figcaption>
        <span>API calls per dashboard load</span>
        <b>−35%</b><small>after React Query caching</small>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H + 8}`} onPointerLeave={() => setHover(null)} role="img" aria-label="API calls fell 35 percent over twelve releases">
        <defs>
          <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#2747F5" stopOpacity=".2" />
            <stop offset="1" stopColor="#2747F5" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L${W} ${H + 8} L0 ${H + 8}Z`} fill="url(#cg)" />
        <path ref={path} d={d} fill="none" stroke="#2747F5" strokeWidth="2.5" />
        {pts.map((p, i) => (
          <rect key={i} x={p[0] - 13} y={0} width={26} height={H + 8} fill="transparent" onPointerEnter={() => setHover(i)} />
        ))}
        {hover != null && (
          <g>
            <line x1={pts[hover][0]} x2={pts[hover][0]} y1={0} y2={H + 8} stroke="#30343C" strokeDasharray="2 3" />
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" fill="#fff" stroke="#2747F5" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      <p className="c-chart-tip">{hover != null ? `Release ${hover + 1}: ${CALLS[hover]} calls (indexed)` : 'Hover the line'}</p>
    </figure>
  )
}
