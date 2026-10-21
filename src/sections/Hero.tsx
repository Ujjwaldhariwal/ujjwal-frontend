import { useEffect, useRef, useState } from 'react'
import { gsap, loopWhileVisible, prefersReducedMotion, rng, scrollToId } from '../lib/motion'
import Switch from '../ui/Switch'

type Props = { powered: boolean; onPower: () => void }

const NIGHT = '#10163A'
const FEEDERS = ['12-B', '7-A', '3-C', '21-D', '9-F', '15-E']

function makeSprite(radius: number, core: string, glow: string, coreR: number) {
  const c = document.createElement('canvas')
  const s = radius * 2
  c.width = c.height = s
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(radius, radius, 0, radius, radius, radius)
  g.addColorStop(0, glow)
  g.addColorStop(1, 'rgba(255,181,71,0)')
  x.fillStyle = g
  x.fillRect(0, 0, s, s)
  x.fillStyle = core
  x.beginPath()
  x.arc(radius, radius, coreR, 0, Math.PI * 2)
  x.fill()
  return c
}

export default function Hero({ powered, onPower }: Props) {
  const section = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const switchRef = useRef<HTMLButtonElement>(null)
  const counter = useRef<HTMLSpanElement>(null)
  const powerAt = useRef<{ t: number; x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const sec = section.current!
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const reduced = prefersReducedMotion()
    let W = 0, H = 0, dpr = 1, G = 9
    let xs = new Float32Array(0), ys = new Float32Array(0), ph = new Float32Array(0)
    let flags = new Uint8Array(0) // 1 = in name, 2 = dead meter, 4 = visible background meter, 8 = settles lit after power-on
    let staticLayer: HTMLCanvasElement | null = null
    const glow = makeSprite(8, '#FFB547', 'rgba(255,181,71,0.22)', 2.4)
    const hot = makeSprite(9, '#FFF1D0', 'rgba(255,214,140,0.35)', 2.6)
    const pointer = { x: -9999, y: -9999, active: false }
    const boot = performance.now()
    let lastTipIdx = -1

    const build = async () => {
      await document.fonts.load('800 120px "Bricolage Grotesque"').catch(() => {})
      W = sec.clientWidth
      H = sec.clientHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)
      G = W < 700 ? 5 : 9
      cv.width = W * dpr
      cv.height = H * dpr
      cv.style.width = W + 'px'
      cv.style.height = H + 'px'

      // Sample the name into a mask
      const m = document.createElement('canvas')
      m.width = W
      m.height = H
      const mx = m.getContext('2d')!
      const fs = W < 700 ? W * 0.255 : Math.min(W * 0.2, H * 0.34, 330)
      mx.font = `800 ${fs}px "Bricolage Grotesque"`
      ;(mx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${fs * 0.06}px`
      mx.textAlign = 'center'
      mx.textBaseline = 'alphabetic'
      mx.fillStyle = '#fff'
      const baseY = W < 700 ? H * 0.44 : H * 0.53
      mx.fillText('UJJWAL', W / 2, baseY)
      const mask = mx.getImageData(0, 0, W, H).data

      const r = rng(7)
      const cols = Math.ceil(W / G), rows = Math.ceil(H / G)
      const n = cols * rows
      xs = new Float32Array(n); ys = new Float32Array(n); ph = new Float32Array(n); flags = new Uint8Array(n)
      let i = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * G + G / 2, y = row * G + G / 2
          xs[i] = x; ys[i] = y; ph[i] = r() * Math.PI * 2
          const inName = mask[((y | 0) * W + (x | 0)) * 4 + 3] > 128
          let f = 0
          if (inName) { f |= 1; if (r() < 0.05) f |= 2 }
          else if (r() > 0.38) { f |= 4; if (r() < 0.2) f |= 8 }
          flags[i++] = f
        }
      }

      // Static background: feeder lines + dim meters
      staticLayer = document.createElement('canvas')
      staticLayer.width = W * dpr
      staticLayer.height = H * dpr
      const s = staticLayer.getContext('2d')!
      s.scale(dpr, dpr)
      s.fillStyle = NIGHT
      s.fillRect(0, 0, W, H)
      s.strokeStyle = 'rgba(59,69,128,0.5)'
      s.lineWidth = 1
      const lr = rng(11)
      for (let k = 0; k < 14; k++) {
        s.beginPath()
        let px = 0, py = 80 + lr() * (H - 160)
        s.moveTo(px, py)
        while (px < W) { px += 60 + lr() * 120; py += (lr() - 0.5) * 70; s.lineTo(px, py) }
        s.stroke()
      }
      for (let k = 0; k < n; k++) {
        if (flags[k] & 4) {
          s.fillStyle = `rgba(70,82,150,${0.22 + ph[k] / 20})`
          s.fillRect(xs[k] - 0.7, ys[k] - 0.7, 1.4, 1.4)
        }
      }
      setReady(true)
    }

    const draw = (t: number) => {
      if (!staticLayer) return
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(staticLayer, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const bootSweep = reduced ? Infinity : ((t - boot) / 1300) * (W + 200) - 100
      const pw = powerAt.current
      const waveR = pw ? (reduced ? Infinity : (t - pw.t) * 1.05) : -1
      const R = 120, R2 = R * R
      let nearest = -1, nearestD = 26 * 26

      for (let i = 0; i < xs.length; i++) {
        const f = flags[i]
        if (!f) continue
        const x = xs[i], y = ys[i]
        const dx = x - pointer.x, dy = y - pointer.y
        const d2 = dx * dx + dy * dy
        const near = pointer.active && d2 < R2 ? 1 - Math.sqrt(d2) / R : 0
        let wave = 0, passed = false
        if (pw) {
          const d = Math.hypot(x - pw.x, y - pw.y)
          passed = d < waveR
          const band = Math.abs(d - waveR)
          wave = band < 150 ? 1 - band / 150 : 0
        }

        if (f & 1) {
          if (x > bootSweep + ph[i] * 12) continue
          if ((f & 2) && !passed) {
            ctx.fillStyle = '#4A2B2B'
            ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2)
            continue
          }
          const tw = reduced ? 1 : 0.78 + 0.22 * Math.sin(t * 0.0021 + ph[i] * 3)
          const a = Math.min(1, (0.55 + (ph[i] / 6.28) * 0.45) * tw + near * 0.6 + wave)
          const spr = near > 0.45 || wave > 0.5 || ph[i] > 5.4 ? hot : glow
          ctx.globalAlpha = a
          const sz = spr.width * (G / 9)
          ctx.drawImage(spr, x - sz / 2, y - sz / 2, sz, sz)
          if (d2 < nearestD) { nearestD = d2; nearest = i }
        } else {
          const settled = passed && (f & 8) ? 0.13 + 0.07 * Math.sin(t * 0.0015 + ph[i]) : 0
          const a = Math.max(near * 0.9, wave * 0.95, settled)
          if (a < 0.04) continue
          ctx.globalAlpha = a
          const gz = 16 * (G / 9)
          ctx.drawImage(glow, x - gz / 2, y - gz / 2, gz, gz)
        }
      }
      ctx.globalAlpha = 1

      // Meter tooltip
      const el = tip.current
      if (el) {
        if (nearest >= 0 && pointer.active) {
          if (nearest !== lastTipIdx) {
            lastTipIdx = nearest
            const id = String(10000 + ((nearest * 7919) % 89999)).padStart(5, '0')
            const kw = (1 + ((nearest * 37) % 58) / 10).toFixed(1)
            el.querySelector('b')!.textContent = `Meter MTR-${id}`
            el.querySelector('span')!.textContent = `Feeder ${FEEDERS[nearest % FEEDERS.length]} · ${kw} kW · online`
          }
          el.style.transform = `translate(${xs[nearest] + 18}px, ${ys[nearest] - 64}px)`
          el.style.opacity = '1'
        } else {
          el.style.opacity = '0'
          lastTipIdx = -1
        }
      }
    }

    let stop = () => {}
    build().then(() => {
      stop = loopWhileVisible(sec, (t) => draw(t))
    })

    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect()
      pointer.x = e.clientX - b.left
      pointer.y = e.clientY - b.top
      pointer.active = e.pointerType !== 'touch' || e.buttons > 0
    }
    const onLeave = () => { pointer.active = false }
    sec.addEventListener('pointermove', onMove)
    sec.addEventListener('pointerleave', onLeave)

    let rt = 0
    const onResize = () => {
      clearTimeout(rt)
      rt = window.setTimeout(() => build(), 200)
    }
    window.addEventListener('resize', onResize)

    return () => {
      stop()
      sec.removeEventListener('pointermove', onMove)
      sec.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Power-on: wave from the switch, counter to 5,000, then glide into the playground
  useEffect(() => {
    if (!powered || powerAt.current) return
    const sw = switchRef.current!.getBoundingClientRect()
    const cb = canvas.current!.getBoundingClientRect()
    powerAt.current = { t: performance.now(), x: sw.left + sw.width / 2 - cb.left, y: sw.top + sw.height / 2 - cb.top }
    const obj = { v: 4812 }
    gsap.to(obj, {
      v: 5000, duration: 1.4, ease: 'power3.out',
      onUpdate: () => { if (counter.current) counter.current.textContent = Math.round(obj.v).toLocaleString('en-IN') },
    })
    const id = window.setTimeout(() => scrollToId('playground'), prefersReducedMotion() ? 200 : 2300)
    return () => clearTimeout(id)
  }, [powered])

  return (
    <section id="grid" ref={section} className={`hero ${ready ? 'is-ready' : ''} ${powered ? 'is-powered' : ''}`}>
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      <div ref={tip} className="meter-tip" aria-hidden="true"><b /> <span /></div>

      <div className="hero-readout">
        <strong><span ref={counter}>4,812</span> / 5,000</strong>
        <span>meters online across the state grid</span>
        <span className="sync">{powered ? 'all feeders live' : 'last sync 0.8s ago'}</span>
      </div>

      <div className="hero-copy">
        <p className="dev" lang="hi">उज्ज्वल <span lang="en">— bright</span></p>
        <h1>Ujjwal means bright. So do my interfaces.</h1>
        <p className="lede">
          Frontend engineer who turns heavy, live data into calm, fast UI. React, TypeScript and Three.js on top.
          Node, Redis and Postgres underneath.
        </p>
      </div>

      <div className="hero-switch">
        <div className="lbl">
          <b>{powered ? 'Grid is live' : 'Switch on the grid'}</b>
          {powered ? 'taking you to the playground' : 'flip it to explore my work'}
        </div>
        <Switch ref={switchRef} on={powered} onToggle={() => !powered && onPower()} label="Switch on the grid" />
      </div>
    </section>
  )
}
