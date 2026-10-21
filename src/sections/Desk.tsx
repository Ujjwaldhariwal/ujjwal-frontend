import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'
import Split from '../ui/Split'

/** A strip of masking tape. Angle and length vary so no two look the same. */
function Tape({ w = 110, r = -4, style }: { w?: number; r?: number; style?: React.CSSProperties }) {
  return <span className="tape" style={{ width: w, transform: `rotate(${r}deg)`, ...style }} aria-hidden="true" />
}

function DashCard() {
  const bars = [38, 52, 44, 70, 62, 88, 74, 96, 80, 64, 92, 100]
  return (
    <div className="ui-card ui-dash">
      <div className="ui-top"><b>Feeder load</b><span className="pill-live">live</span></div>
      <div className="ui-kpis">
        <div><small>meters online</small><strong>4,982</strong></div>
        <div><small>peak today</small><strong>61.4 kW</strong></div>
        <div><small>TTFB</small><strong>1.6s</strong></div>
      </div>
      <div className="ui-bars">{bars.map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}</div>
    </div>
  )
}

function PortalCard() {
  return (
    <div className="ui-card ui-portal">
      <div className="ui-top"><b>Lodge a complaint</b><span className="lang"><b>EN</b> / हिं</span></div>
      <div className="pfield"><small>Category</small><span>Street light not working</span></div>
      <div className="pfield"><small>Ward</small><span>Ward 14, Sector 62</span></div>
      <div className="bot"><span className="av">AI</span><p>This looks like a routine fix. I've logged it and you'll get an SMS update.</p></div>
      <div className="a11y">WCAG 2.1 AA ✓</div>
    </div>
  )
}

function CheckoutCard() {
  return (
    <div className="ui-card ui-checkout">
      <ol className="steps"><li className="on">Cart</li><li className="on">Address</li><li className="on">Pay</li><li>Done</li></ol>
      <div className="line"><span>Wooden train set</span><span>₹1,299</span></div>
      <div className="line"><span>Gift wrap</span><span>₹200</span></div>
      <button className="pay" tabIndex={-1}>Pay ₹1,499</button>
      <small className="g">Signed in with Google</small>
    </div>
  )
}

function UploadCard() {
  return (
    <div className="ui-card ui-upload">
      <div className="ui-top"><b>Uploading 3 files</b><span>direct to S3</span></div>
      {[['offer-letter.pdf', 100], ['pan-card.jpg', 100], ['payslip-sep.pdf', 72]].map(([n, v]) => (
        <div className="up" key={n as string}><span>{n}</span><i style={{ width: `${v}%` }} /></div>
      ))}
      <p className="was">was 9.8s · now 3.9s</p>
    </div>
  )
}

export default function Desk() {
  const sec = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      // the headline drops in once, as soon as the yellow takes over
      gsap.from('.desk-title .ci', {
        yPercent: 120, rotate: () => gsap.utils.random(-30, 30), stagger: 0.012, duration: 0.7, ease: 'back.out(2)',
        scrollTrigger: { trigger: sec.current, start: 'top 85%', toggleActions: 'play none none reverse' },
      })
      const tl = gsap.timeline({
        scrollTrigger: { trigger: sec.current, start: 'top top', end: '+=1700', pin: pin.current, scrub: 0.4 },
      })
      gsap.utils.toArray<HTMLElement>('.desk-item').forEach((el, i) => {
        const fromLeft = i % 2 === 0
        tl.from(el, {
          x: fromLeft ? '-70vw' : '70vw',
          y: gsap.utils.random(-200, 200),
          rotate: gsap.utils.random(-40, 40),
          duration: 0.9,
          ease: 'power3.out',
        }, i * 0.14)
      })
      tl.from('.ship-card', { scale: 0, rotate: -25, duration: 0.6, ease: 'back.out(2.2)' }, '>-0.2')
      tl.to('.desk-item[data-depth]', { y: (_i: number, el: HTMLElement) => -Number(el.dataset.depth) * 80, duration: 1, ease: 'none' }, '>')
    }, sec)
    return () => ctx.revert()
  }, [])

  return (
    <section id="desk" ref={sec} className="desk">
      <div className="desk-pin" ref={pin}>
        <div className="desk-copy">
          <p className="note-tag">the everyday mess</p>
          <Split as="h2" className="big desk-title" text="FIGMA HANDOFFS. 2AM PROD FIXES. A 10K-ROW TABLE THAT WON'T LOAD." wobble={3} seed={7} />
        </div>

        <div className="desk-item item-dash" data-depth="1.2"><Tape r={-6} style={{ left: 30, top: -14 }} /><Tape w={80} r={8} style={{ right: 20, top: -12 }} /><DashCard /><p className="scribble">state power dashboard</p></div>
        <div className="desk-item item-portal" data-depth="0.6"><Tape r={4} style={{ left: '35%', top: -14 }} /><PortalCard /><p className="scribble">civic portal, 2,000+ a day</p></div>
        <div className="desk-item item-checkout" data-depth="1.6"><Tape w={90} r={-10} style={{ left: -18, top: 20 }} /><CheckoutCard /></div>
        <div className="desk-item item-upload" data-depth="0.9"><Tape r={3} style={{ left: '30%', top: -14 }} /><UploadCard /></div>
        <div className="desk-item item-sticky" data-depth="2">
          <div className="sticky">
            <p className="sh">today</p>
            <p className="done">ship Hindi + English</p>
            <p className="done">cache API calls</p>
            <p>fix TTFB on mobile</p>
            <p>chai</p>
          </div>
        </div>
        <svg className="desk-item item-coil" data-depth="0.4" viewBox="0 0 240 120" aria-hidden="true">
          <path d="M0 60 C 20 60 20 20 40 20 S 60 100 80 100 S 100 20 120 20 S 140 100 160 100 S 180 20 200 20 S 220 60 240 60" />
        </svg>
        <span className="desk-item item-ring" data-depth="0.3" aria-hidden="true" />

        <div className="ship-card">
          <Split as="p" className="big" text="I ALWAYS SHIP." wobble={4} seed={11} />
          <p>Dashboards, portals and checkouts that real people use every day.</p>
        </div>
      </div>
    </section>
  )
}
