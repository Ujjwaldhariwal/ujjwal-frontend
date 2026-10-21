import { useEffect, useRef, useState } from 'react'
import type Matter from 'matter-js'
import { prefersReducedMotion, ScrollTrigger } from '../lib/motion'
import { sfx } from '../lib/sound'
import { haptic } from '../lib/haptics'
import Split from '../ui/Split'

const EMAIL = 'ujjwaldhariwal0@gmail.com'

type Thing = {
  id: string
  label: string
  shape: 'circle' | 'pill' | 'tag'
  w: number
  h: number
  cls: string
  href?: string
  action?: 'copy'
}

const THINGS: Thing[] = [
  { id: 'mail', label: EMAIL, shape: 'tag', w: 300, h: 64, cls: 't-mail', action: 'copy' },
  { id: 'gh', label: 'GitHub', shape: 'circle', w: 112, h: 112, cls: 't-ink', href: 'https://github.com/Ujjwaldhariwal' },
  { id: 'li', label: 'LinkedIn', shape: 'circle', w: 112, h: 112, cls: 't-lilac', href: 'https://linkedin.com/in/ujjwal-dhariwal' },
  { id: 'cv', label: 'Résumé', shape: 'circle', w: 112, h: 112, cls: 't-mint', href: '/resume.pdf' },
  { id: 'hire', label: 'Hire me', shape: 'pill', w: 170, h: 66, cls: 't-yellow' },
  { id: 'react', label: 'React', shape: 'circle', w: 92, h: 92, cls: 't-mint' },
  { id: 'ts', label: 'TypeScript', shape: 'pill', w: 160, h: 56, cls: 't-lilac' },
  { id: 'three', label: 'Three.js', shape: 'circle', w: 96, h: 96, cls: 't-yellow' },
  { id: 'node', label: 'Node', shape: 'circle', w: 84, h: 84, cls: 't-ink' },
  { id: 'pg', label: 'Postgres', shape: 'pill', w: 140, h: 54, cls: 't-cream' },
  { id: 'noida', label: 'Noida, IN', shape: 'pill', w: 150, h: 54, cls: 't-cream' },
  { id: 'bolt', label: 'bolt', shape: 'circle', w: 84, h: 84, cls: 't-yellow' },
  { id: 'chai', label: 'Chai', shape: 'circle', w: 88, h: 88, cls: 't-cream' },
  { id: 'r3f', label: 'R3F', shape: 'circle', w: 96, h: 96, cls: 't-ink' },
  { id: 'ship', label: 'Ships on Friday', shape: 'pill', w: 230, h: 60, cls: 't-lilac' },
  { id: 'a11y', label: 'WCAG AA', shape: 'pill', w: 140, h: 54, cls: 't-mint' },
  { id: 'gsap', label: 'GSAP', shape: 'circle', w: 80, h: 80, cls: 't-lilac' },
]

/** A pile of stickers that falls in when you arrive. Drag them around; tap the email to copy it. */
export default function Heap() {
  const sec = useRef<HTMLElement>(null)
  const pit = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const shakeRef = useRef<() => void>(() => {})

  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* text stays selectable */ }
  }

  useEffect(() => {
    let cleanup = () => {}
    let cancelled = false
    // the physics engine downloads only when the visitor gets close to the footer
    const near = ScrollTrigger.create({
      trigger: pit.current,
      start: 'top 250%',
      once: true,
      onEnter: () => {
        import('matter-js').then(({ default: M }) => {
          if (!cancelled) cleanup = run(M)
        })
      },
    })
    const run = (M: typeof Matter): (() => void) => {
      const el = pit.current!
      const nodes = new Map<string, HTMLElement>()
      el.querySelectorAll<HTMLElement>('[data-thing]').forEach((n) => nodes.set(n.dataset.thing!, n))
      const reduced = prefersReducedMotion()
      const narrow = () => el.clientWidth < 700
      const scale = () => (narrow() ? 0.72 : 1.22)

      const engine = M.Engine.create({ gravity: { x: 0, y: 1.1 } })
      const world = engine.world
      let walls: Matter.Body[] = []
      const bodies = new Map<string, Matter.Body>()

      const buildWalls = () => {
        walls.forEach((w) => M.Composite.remove(world, w))
        const W = el.clientWidth, H = el.clientHeight, t = 200
        walls = [
          M.Bodies.rectangle(W / 2, H + t / 2, W + 2 * t, t, { isStatic: true }),
          M.Bodies.rectangle(-t / 2, H / 2, t, H * 4, { isStatic: true }),
          M.Bodies.rectangle(W + t / 2, H / 2, t, H * 4, { isStatic: true }),
        ]
        M.Composite.add(world, walls)
      }

      const spawn = () => {
        const W = el.clientWidth, H = el.clientHeight, s = scale()
        THINGS.forEach((th, i) => {
          const x = 80 + ((i * 197) % Math.max(1, W - 160))
          const y = reduced ? H - 80 - (i % 3) * 90 : -120 - i * 70
          const w = th.w * s, h = th.h * s
          const opts = { restitution: 0.35, friction: 0.4, frictionAir: 0.012, angle: (Math.random() - 0.5) * 0.8 }
          const b = th.shape === 'circle'
            ? M.Bodies.circle(x, y, w / 2, opts)
            : M.Bodies.rectangle(x, y, w, h, { ...opts, chamfer: { radius: th.shape === 'pill' ? h / 2 : 12 } })
          bodies.set(th.id, b)
          const n = nodes.get(th.id)!
          n.style.width = `${w}px`
          n.style.height = `${h}px`
          n.style.fontSize = `${(th.shape === 'circle' ? 18 : 20) * s}px`
        })
        M.Composite.add(world, [...bodies.values()])
      }

      buildWalls()
      let started = false
      const start = () => { if (started) return; started = true; spawn() }

      // dragging with mouse or pen; touch keeps scrolling the page, and taps still work
      const mouse = M.Mouse.create(el)
      const m = mouse as unknown as Record<string, EventListener>
      el.removeEventListener('wheel', m.mousewheel)
      el.removeEventListener('mousewheel', m.mousewheel)
      el.removeEventListener('DOMMouseScroll', m.mousewheel)
      el.removeEventListener('touchmove', m.mousemove)
      el.removeEventListener('touchstart', m.mousedown)
      el.removeEventListener('touchend', m.mouseup)
      const mc = M.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, damping: 0.1, render: { visible: false } } })
      M.Composite.add(world, mc)
      let downAt: { x: number; y: number; id: string | null } | null = null
      M.Events.on(mc, 'startdrag', () => { el.classList.add('grabbing'); sfx.pop() })
      M.Events.on(mc, 'enddrag', () => el.classList.remove('grabbing'))

      M.Events.on(engine, 'collisionStart', (e) => {
        const hit = e.pairs.reduce((a, p) => Math.max(a, p.collision.depth), 0)
        if (hit > 4) sfx.thud(hit / 6)
      })

      const shake = () => {
        bodies.forEach((b) => M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 18, y: -10 - Math.random() * 14 }))
        sfx.tug(); haptic.pulse()
      }
      shakeRef.current = () => { start(); shake() }


      const STEP = 1000 / 60
      let raf = 0, last = performance.now(), visible = false, acc = 0
      const tick = (t: number) => {
        // always step exactly 1/60 s and carry the remainder: Matter's integrator blows up
        // if one step is much shorter than the step before it
        acc = Math.min(100, acc + t - last)
        last = t
        while (acc >= STEP) { M.Engine.update(engine, STEP); acc -= STEP }
        bodies.forEach((b, id) => {
          const n = nodes.get(id)!
          n.style.transform = `translate(${(b.position.x - n.offsetWidth / 2).toFixed(1)}px, ${(b.position.y - n.offsetHeight / 2).toFixed(1)}px) rotate(${b.angle.toFixed(3)}rad)`
        })
        raf = requestAnimationFrame(tick)
      }
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(tick) }
        else if (!e.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf) }
      })
      io.observe(el)

      const st = ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: start })

      // a click is a press and release without much travel; then follow the sticker's link
      const onDown = (e: PointerEvent) => {
        const target = (e.target as HTMLElement).closest<HTMLElement>('[data-thing]')
        downAt = { x: e.clientX, y: e.clientY, id: target?.dataset.thing ?? null }
      }
      const onUp = (e: PointerEvent) => {
        if (!downAt) return
        const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y)
        const th = THINGS.find((x) => x.id === downAt!.id)
        downAt = null
        if (!th || moved > 6) return
        if (th.action === 'copy') void copy()
        else if (th.href) window.open(th.href, '_blank', 'noopener')
        else { const b = bodies.get(th.id); if (b) M.Body.setVelocity(b, { x: (Math.random() - 0.5) * 8, y: -14 }); sfx.pop() }
      }
      el.addEventListener('pointerdown', onDown)
      el.addEventListener('pointerup', onUp)

      let rt = 0
      const onResize = () => { clearTimeout(rt); rt = window.setTimeout(buildWalls, 150) }
      window.addEventListener('resize', onResize)

        return () => {
        io.disconnect(); st.kill(); cancelAnimationFrame(raf)
        el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointerup', onUp)
        window.removeEventListener('resize', onResize)
        M.Engine.clear(engine)
      }
    }
    return () => { cancelled = true; near.kill(); cleanup() }
  }, [])

  return (
    <section id="heap" ref={sec} className="heap field">
      <div className="heap-head">
        <Split as="h2" className="big heap-title" text="LET'S MAKE IT BRIGHT." wobble={5} seed={13} />
        <div className="heap-side">
          <p>Open to frontend and full-stack roles in Noida, Gurugram or remote. Grab a sticker, throw it around, or tap the email to copy it.</p>
          <div className="heap-actions">
            <button className="btn-ink" onClick={copy}>{copied ? 'Email copied' : 'Copy my email'}</button>
            <button className="btn-line-ink" onClick={() => shakeRef.current()}>Shake the pile</button>
          </div>
          <p className="mail-plain">{EMAIL}</p>
        </div>
      </div>

      <div className="pit" ref={pit} role="group" aria-label="Sticker pile with my links">
        {THINGS.map((t) => (
          t.href ? (
            <a key={t.id} data-thing={t.id} className={`thing ${t.shape} ${t.cls}`} href={t.href} target="_blank" rel="noreferrer" onClick={(e) => { if (e.detail !== 0) e.preventDefault() /* mouse handled on pointerup; keyboard opens normally */ }} draggable={false}>
              <span>{t.label}</span>
            </a>
          ) : (
            <span key={t.id} data-thing={t.id} className={`thing ${t.shape} ${t.cls}`} role={t.action ? 'button' : undefined} tabIndex={t.action ? 0 : undefined}
              onKeyDown={(e) => { if (t.action && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); void copy() } }}>
              {t.id === 'bolt'
                ? <svg viewBox="0 0 32 32" width="56%" aria-label="lightning bolt"><path d="M18 4 9 18h6l-2 10 10-15h-6z" fill="currentColor" /></svg>
                : <span>{t.id === 'mail' && copied ? 'Copied!' : t.label}</span>}
            </span>
          )
        ))}
      </div>

      <footer className="heap-foot">
        <a href="https://github.com/Ujjwaldhariwal" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://linkedin.com/in/ujjwal-dhariwal" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="/resume.pdf" target="_blank" rel="noreferrer">Résumé (PDF)</a>
        <span>Built with React, Three.js, GSAP and Matter.js</span>
      </footer>
    </section>
  )
}
