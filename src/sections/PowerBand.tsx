import { useEffect, useRef } from 'react'
import { rng, ScrollTrigger } from '../lib/motion'

/** Scroll-scrubbed hand-off: lit meters cool down and shrink into the graph paper below. */
export default function PowerBand() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = wrap.current!
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    let W = 0, H = 0, dpr = 1
    let seeds: Float32Array = new Float32Array(0)
    let progress = 0

    const size = () => {
      W = el.clientWidth
      H = el.clientHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)
      cv.width = W * dpr
      cv.height = H * dpr
      cv.style.width = W + 'px'
      cv.style.height = H + 'px'
      const r = rng(3)
      seeds = new Float32Array(Math.ceil(W / 24 + 1) * Math.ceil(H / 24 + 1)).map(() => r())
      draw()
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#10163A')
      g.addColorStop(0.55, '#353E6E')
      g.addColorStop(1, '#EEF2F6')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
      let k = 0
      for (let y = 12; y < H; y += 24) {
        for (let x = 12; x < W; x += 24) {
          const s = seeds[k++] ?? 0.5
          // local "cool down" amount moves down the band as you scroll
          const t = Math.min(1, Math.max(0, y / H + (progress - 0.5) * 0.9))
          const lit = s < 0.62 * (1 - t)
          const rad = lit ? 0.7 + 2.3 * (1 - t) : 1.05
          ctx.fillStyle = lit
            ? `rgba(255,${181 + 40 * t},${71 + 150 * t},${0.95 - t * 0.45})`
            : `rgba(150,165,205,${0.22 + t * 0.5})`
          ctx.beginPath()
          ctx.arc(x, y, rad, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      // graph-paper rules appear at the bottom
      ctx.strokeStyle = 'rgba(191,205,224,0.9)'
      ctx.lineWidth = 1
      for (let y = 12; y < H; y += 24) {
        const a = Math.max(0, (y / H - 0.62 + progress * 0.25) / 0.38)
        if (a <= 0) continue
        ctx.globalAlpha = Math.min(1, a)
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    size()
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (s) => { progress = s.progress; draw() },
    })
    window.addEventListener('resize', size)
    return () => { st.kill(); window.removeEventListener('resize', size) }
  }, [])

  return (
    <div ref={wrap} className="band" aria-hidden="false">
      <canvas ref={canvas} aria-hidden="true" />
      <div className="band-copy">
        <p>switch flipped · every meter online</p>
        <h2>Lights on. Now it's your turn.</h2>
      </div>
    </div>
  )
}
