import { useEffect, useRef } from 'react'
import { loopWhileVisible, prefersReducedMotion, ScrollTrigger } from '../lib/motion'

const A = 'WHEN THE DATA GETS HEAVY, SOMETHING HAS TO STAY FAST ✺ '
const B = 'REACT ✺ TYPESCRIPT ✺ THREE.JS ✺ NODE ✺ POSTGRES ✺ REDIS ✺ GSAP ✺ '

/** Two curved ribbons of text crossing the seam between the yellow and indigo fields.
 *  They drift on their own and speed up with scroll velocity. */
export default function Marquee() {
  const sec = useRef<HTMLDivElement>(null)
  const a = useRef<SVGTextPathElement>(null)
  const b = useRef<SVGTextPathElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let vel = 0, oa = 0, ob = 0
    // one repeat of each phrase, in SVG units, so the loop wraps without a visible jump
    const measure = (el: SVGTextPathElement | null) => ((el?.parentNode as SVGTextElement | null)?.getComputedTextLength() ?? 0) / 6
    let ua = 0, ub = 0
    const st = ScrollTrigger.create({ trigger: sec.current, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { vel = s.getVelocity() } })
    const stop = loopWhileVisible(sec.current!, (_t, dt) => {
      const boost = 1 + Math.min(6, Math.abs(vel) / 400)
      vel *= 0.92
      if (!ua || !ub) { ua = measure(a.current) || 3000; ub = measure(b.current) || 3000 }
      oa = (oa + 0.09 * dt * boost) % ua
      ob = (ob + 0.07 * dt * boost) % ub
      a.current?.setAttribute('startOffset', String(-oa))
      b.current?.setAttribute('startOffset', String(ob - ub))
    })
    document.fonts.ready.then(() => { ua = 0; ub = 0 })
    return () => { st.kill(); stop() }
  }, [])

  return (
    <div className="marquee" ref={sec} aria-label="When the data gets heavy, something has to stay fast.">
      <svg viewBox="0 0 1440 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <path id="mq-a" d="M-200 260 C 200 120, 520 380, 900 230 S 1500 120, 1700 250 L 3300 250" />
          <path id="mq-b" d="M-200 120 C 240 300, 600 40, 960 180 S 1500 340, 1700 170 L 3300 170" />
        </defs>
        <path className="floor" d="M0 250 C 260 190, 520 330, 820 270 S 1250 180, 1440 240 L1440 420 L0 420 Z" />
        <use href="#mq-b" className="ribbon r-b" />
        <text className="mq-text t-b"><textPath ref={b} href="#mq-b" startOffset="0%">{B.repeat(6)}</textPath></text>
        <use href="#mq-a" className="ribbon r-a" />
        <text className="mq-text t-a"><textPath ref={a} href="#mq-a" startOffset="0%">{A.repeat(6)}</textPath></text>
      </svg>
    </div>
  )
}
