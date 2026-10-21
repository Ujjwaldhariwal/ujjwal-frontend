import { useEffect, useRef, useState } from 'react'
import { gsap, loopWhileVisible, prefersReducedMotion, ScrollTrigger } from '../lib/motion'
import type { PlugScene } from '../ui/plugScene'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'
import Split from '../ui/Split'

const LETTERS = 'UJJWAL'.split('')
const STRINGS = [18, 6, 26, 10, 30, 14] // string length per bulb-letter, in vh

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

export default function PlugHero() {
  const sec = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const flood = useRef<HTMLDivElement>(null)
  const copy = useRef<HTMLDivElement>(null)
  const floodCopy = useRef<HTMLDivElement>(null)
  const [lit, setLit] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const st = stage.current!
    let scene: PlugScene | null = null
    let progress = 0
    let stop = () => {}
    let ro: ResizeObserver | null = null
    let cancelled = false

    // Three.js arrives in its own chunk right after first paint; the pinned scroll works without it
    import('../ui/plugScene').then(({ createPlugScene }) => {
      if (cancelled) return
      try {
        scene = createPlugScene(host.current!, { reduced, onSpark: () => { sfx.spark(); haptic.stamp() } })
      } catch (err) {
        console.warn('3D plug unavailable, showing the page without it', err)
        return
      }
      scene.setProgress(progress)
      // observe the section, not the pinned stage: pinning re-parents the stage and would detach the observer
      stop = loopWhileVisible(sec.current!, (t) => scene!.render(t))
      ro = new ResizeObserver(() => scene?.resize())
      ro.observe(st)
      requestAnimationFrame(() => setReady(true))
    })

    const apply = (p: number) => {
      progress = p
      scene?.setProgress(p)
      setLit(p > 0.415)
      const f = smooth(0.46, 0.86, p)
      const s = scene?.socketScreen() ?? { x: 0.5, y: 0.8 }
      const W = st.clientWidth, H = st.clientHeight
      const cx = s.x * W, cy = s.y * H
      const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.05
      flood.current!.style.clipPath = `circle(${(f * R).toFixed(1)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px)`
      copy.current!.style.opacity = String(1 - smooth(0.04, 0.2, p))
      copy.current!.style.transform = `translateY(${(-40 * smooth(0.04, 0.2, p)).toFixed(1)}px)`
      const fc = smooth(0.7, 0.92, p)
      floodCopy.current!.style.opacity = String(fc)
      floodCopy.current!.style.setProperty('--rise', `${(1 - fc) * 60}px`)
    }

    let trig: ScrollTrigger | null = null
    if (reduced) apply(0.43)
    else {
      trig = ScrollTrigger.create({
        trigger: sec.current,
        start: 'top top',
        end: '+=1900',
        pin: stage.current,
        scrub: true,
        onUpdate: (s) => apply(s.progress),
      })
      apply(0)
    }

    const onMove = (e: PointerEvent) => {
      const b = st.getBoundingClientRect()
      scene?.setPointer(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1)
    }
    st.addEventListener('pointermove', onMove)
    return () => {
      cancelled = true
      trig?.kill()
      stop()
      ro?.disconnect()
      st.removeEventListener('pointermove', onMove)
      scene?.dispose()
    }
  }, [])

  // the bulb-letters flicker on when the plug goes in
  useEffect(() => {
    if (!lit || prefersReducedMotion()) return
    const els = sec.current!.querySelectorAll('.bulb')
    gsap.fromTo(els, { opacity: 0.3 }, { opacity: 1, duration: 0.06, repeat: 5, yoyo: true, stagger: 0.05, ease: 'steps(1)' })
    gsap.fromTo(els, { '--kick': '10deg' }, { '--kick': '0deg', duration: 1.6, ease: 'elastic.out(1, 0.3)', stagger: 0.04 })
  }, [lit])

  return (
    <section id="plug" ref={sec} className={`plug-hero ${lit ? 'is-lit' : ''}`}>
      <div className="plug-stage" ref={stage}>
        <div className="bulbs" aria-hidden="true">
          {LETTERS.map((l, i) => (
            <span key={i} className="bulb" style={{ ['--str' as string]: `${STRINGS[i]}vh`, ['--dur' as string]: `${3.2 + (i % 3) * 0.7}s`, ['--del' as string]: `${-i * 0.6}s` }}>
              <span className="glyph">{l}</span>
            </span>
          ))}
        </div>

        <div className="flood" ref={flood} aria-hidden="true" />
        <div className="flood-copy" ref={floodCopy}>
          <Split as="p" className="big flood-title" text="SWITCHED ON." wobble={5} seed={3} />
          <p className="flood-sub">Now, the mess I turn into product ↓</p>
        </div>

        <div className={`plug-canvas ${ready ? 'in' : ''}`} ref={host} aria-hidden="true" />

        <div className="hero-copy" ref={copy}>
          <p className="dev" lang="hi">उज्ज्वल <span lang="en">means bright</span></p>
          <h1>Frontend engineer who makes heavy data feel light.</h1>
          <p className="lede">React, TypeScript and Three.js up front. Node, Redis and Postgres underneath. Based in Noida.</p>
          <p className="hint">scroll to plug me in</p>
        </div>
      </div>
    </section>
  )
}
