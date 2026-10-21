import { lazy, Suspense, useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, ScrollTrigger } from '../lib/motion'
import PowerLoader from '../ui/PowerLoader'
const MeterMap = lazy(() => import('../ui/MeterMap'))

const ROWS = [
  { year: '2024', name: 'BEST ICRS complaint portal', what: 'Multilingual civic portal with a WCAG 2.1 AA disability module and an AI chatbot that answers routine queries.', metric: '2,000+', unit: 'daily users' },
  { year: '2024', name: 'Infinite Horizon employee portal', what: 'Next.js SSR dashboards, Elasticsearch autocomplete, and S3 presigned uploads.', metric: '−60%', unit: 'upload time' },
  { year: '2023', name: 'Hippo Toys checkout', what: 'Multi-step checkout with Razorpay, order tracking and a 10K-row admin table.', metric: '+20%', unit: 'onboarding' },
  { year: '2024', name: 'Maple Global School ERP', what: 'Freelance. Student, teacher and parent portals for attendance, transport and fees.', metric: '3', unit: 'portals' },
]

export default function Work() {
  const ref = useRef<HTMLElement>(null)

  // One orchestrated reveal: the big numbers count up as the rows arrive
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.stat b', {
        textContent: 0,
        duration: 1.2,
        ease: 'power2.out',
        snap: { textContent: 1 },
        stagger: 0.12,
        scrollTrigger: { trigger: '.stats', start: 'top 85%' },
      })
      ScrollTrigger.batch('.row', {
        start: 'top 90%',
        onEnter: (els) => gsap.from(els, { y: 24, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' }),
        once: true,
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section id="work" className="work" ref={ref}>
      <h2>Work that carries real load.</h2>
      <p className="sub">Dashboards, portals and checkouts that people use every day. Built front to back, polished front first.</p>

      <div className="feature">
        <Suspense fallback={<PowerLoader />}>
          <MeterMap />
        </Suspense>
        <div className="ft">
          <p className="yr">2024 – now · Infinite Computer Solutions</p>
          <h3>Power distribution for a whole state, on one screen.</h3>
          <p>
            A React and TypeScript dashboard for a state power utility. It turns 5,000+ smart-meter records into charts and a 3D
            geospatial map built with React Three Fiber, so field and office teams see the same live picture.
          </p>
          <div className="stats">
            <div className="stat"><span className="v">−<b>35</b>%</span>network calls</div>
            <div className="stat"><span className="v">&lt;<b>2</b>s</span>TTFB</div>
            <div className="stat"><span className="v">+<b>25</b>%</span>engagement</div>
          </div>
          <p className="stack">React · TypeScript · R3F · Visx · React Query · Node · Postgres</p>
        </div>
      </div>

      <ul className="rows">
        {ROWS.map((r) => (
          <li className="row" key={r.name}>
            <span className="y">{r.year}</span>
            <h4>{r.name}</h4>
            <p>{r.what}</p>
            <span className="m">{r.metric}<small>{r.unit}</small></span>
          </li>
        ))}
      </ul>
    </section>
  )
}
