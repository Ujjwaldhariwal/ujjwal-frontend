import { useEffect, useRef, useState } from 'react'
import { gsap, loopWhileVisible, prefersReducedMotion, scrollToY, ScrollTrigger } from '../lib/motion'
import { sfx } from '../lib/sound'
import Split from '../ui/Split'

const SKILLS = [
  { n: 'React', c: '#6CF0C2' },
  { n: 'TypeScript', c: '#B9A6FF' },
  { n: 'Three.js', c: '#FFE14D' },
  { n: 'Next.js', c: '#FFFFFF' },
  { n: 'Node', c: '#6CF0C2' },
  { n: 'Postgres', c: '#B9A6FF' },
  { n: 'Redis', c: '#FF5A1F' },
  { n: 'GSAP', c: '#FFE14D' },
  { n: 'i18next', c: '#FFFFFF' },
  { n: 'Elastic', c: '#FF5A1F' },
]

const CATS = [
  {
    k: 'Dashboards',
    t: 'LIVE DATA, CALM SCREENS.',
    d: 'A state power utility dashboard: 5,000+ smart meters, four kinds of users, one screen each.',
    m: '<2s', mu: 'time to first byte',
    uses: ['React', 'TypeScript', 'Three.js', 'Redis'],
  },
  {
    k: 'Portals',
    t: 'HINDI, ENGLISH, EVERYONE.',
    d: 'Civic and employee portals with a WCAG 2.1 AA module, an AI chatbot and Elasticsearch autocomplete.',
    m: '2,000+', mu: 'people a day',
    uses: ['Next.js', 'i18next', 'Elastic', 'Node'],
  },
  {
    k: 'Checkouts',
    t: 'CART TO RETURNS.',
    d: 'Multi-step checkout with Razorpay and Google sign-in, plus a 10K-row admin table that stays smooth.',
    m: '+20%', mu: 'onboarding',
    uses: ['React', 'Node', 'Postgres', 'TypeScript'],
  },
  {
    k: '3D & motion',
    t: '60FPS OR IT DIDN’T SHIP.',
    d: 'Three.js scenes and GSAP motion that stay smooth on a mid-range phone. You are scrolling one now.',
    m: '60', mu: 'frames a second',
    uses: ['Three.js', 'GSAP', 'React', 'TypeScript'],
  },
]

export default function Stack() {
  const sec = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const trig = useRef<ScrollTrigger | null>(null)
  const [cat, setCat] = useState(0)
  const catRef = useRef(0)

  useEffect(() => {
    const items = Array.from(ring.current!.querySelectorAll<HTMLElement>('.orb'))
    const place = (p: number, t = 0) => {
      const W = ring.current!.clientWidth, H = ring.current!.clientHeight
      const rx = W * 0.46, ry = H * 0.4
      items.forEach((el, i) => {
        const a = (i / items.length) * Math.PI * 2 + p * Math.PI * 3 + t * 0.00012
        const x = Math.cos(a) * rx, y = Math.sin(a) * ry
        const depth = (Math.sin(a) + 1) / 2 // 0 at the back, 1 at the front
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.72 + depth * 0.4).toFixed(3)}) rotate(${(Math.cos(a) * 14).toFixed(1)}deg)`
        el.style.zIndex = String(depth > 0.5 ? 3 : 1)
      })
    }
    if (prefersReducedMotion()) { place(0); return }
    let prog = 0
    const stop = loopWhileVisible(sec.current!, (t) => place(prog, t)) // pauses when the section is off screen
    trig.current = ScrollTrigger.create({
      trigger: sec.current,
      start: 'top top',
      end: '+=2400',
      pin: pin.current,
      scrub: true,
      onUpdate: (s) => {
        prog = s.progress
        const c = Math.min(CATS.length - 1, Math.floor(s.progress * CATS.length * 0.999))
        if (c !== catRef.current) { catRef.current = c; setCat(c); sfx.pop() }
      },
    })
    return () => { stop(); trig.current?.kill() }
  }, [])

  // pop the centre sticker when the category changes
  useEffect(() => {
    if (prefersReducedMotion()) return
    gsap.fromTo('.core-inner', { scale: 0.86, rotate: -6 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' })
    gsap.fromTo('.core-title .ci', { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.015, ease: 'back.out(2)' })
  }, [cat])

  const jump = (i: number) => {
    const t = trig.current
    if (!t) { setCat(i); return }
    scrollToY(t.start + ((i + 0.5) / CATS.length) * (t.end - t.start))
  }

  const c = CATS[cat]
  return (
    <section id="stack" ref={sec} className="stack field">
      <div className="stack-pin" ref={pin}>
        <div className="stack-head">
          <Split as="h2" className="big" text="MEET THE STACK" wobble={4} seed={5} />
        </div>

        <ul className="cat-chips" aria-label="What I build">
          {CATS.map((x, i) => (
            <li key={x.k}><button className={i === cat ? 'on' : ''} aria-pressed={i === cat} onClick={() => jump(i)}>{x.k}</button></li>
          ))}
        </ul>

        <div className="orbit" ref={ring}>
          {SKILLS.map((s) => (
            <span key={s.n} className={`orb ${c.uses.includes(s.n) ? 'hot' : ''}`} style={{ ['--c' as string]: s.c }}>
              <span>{s.n}</span>
            </span>
          ))}
          <div className="core" aria-live="polite">
            <svg className="core-ring" viewBox="0 0 300 300" aria-hidden="true">
              <defs><path id="core-circle" d="M150 150 m-128 0 a128 128 0 1 1 256 0 a128 128 0 1 1 -256 0" /></defs>
              <text><textPath href="#core-circle">FRONTEND ✺ FULL STACK ✺ NOIDA ✺ OPEN TO WORK ✺ FRONTEND ✺ FULL STACK ✺ </textPath></text>
            </svg>
            <div className="core-inner">
              <Split key={c.t} as="p" className="big core-title" text={c.t} wobble={3} seed={cat + 2} />
              <p className="core-d">{c.d}</p>
              <p className="core-m"><b>{c.m}</b> {c.mu}</p>
            </div>
          </div>
        </div>

        <p className="plug-it" aria-hidden="true">plug it in! <span>scroll to switch</span></p>
      </div>
    </section>
  )
}
