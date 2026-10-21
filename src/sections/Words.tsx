import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'

const PANELS = [
  {
    n: 1, word: 'TO BUILD', note: 'one screen for a whole state',
    stickers: [{ big: '5,000+', small: 'smart meters', c: 'mint' }, { big: '4', small: 'user roles', c: 'lilac' }],
    card: { t: 'State power dashboard', d: 'React · R3F · Visx' },
  },
  {
    n: 2, word: 'TO FIX', note: 'found the real bottleneck first',
    stickers: [{ big: '−60%', small: 'upload time', c: 'orange' }],
    card: { t: 'Employee portal', d: 'Next.js · S3 presigned URLs' },
  },
  {
    n: 3, word: 'TO SPEED UP', note: 'cache it, don’t fetch it twice',
    stickers: [{ big: '−35%', small: 'API calls', c: 'lilac' }, { big: '<2s', small: 'to first byte', c: 'mint' }],
    card: { t: 'Dashboard data layer', d: 'React Query · Redis' },
  },
  {
    n: 4, word: 'TO INCLUDE', note: 'see it for yourself ↓',
    stickers: [{ big: '2,000+', small: 'people a day', c: 'orange' }, { big: 'AA', small: 'WCAG 2.1', c: 'mint' }],
    card: { t: 'Civic complaint portal', d: 'Hindi + English · AI chatbot' },
  },
]

/** Giant words that travel sideways while you scroll down. Stickers roll as they move. */
export default function Words() {
  const sec = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const el = track.current!
      const dist = () => el.scrollWidth - window.innerWidth
      const move = gsap.to(el, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: sec.current, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: true, invalidateOnRefresh: true },
      })
      // stickers roll: one full turn per circumference travelled
      gsap.utils.toArray<HTMLElement>('.roll').forEach((s) => {
        // rolls in from the right and comes to rest upright, so it can be read
        gsap.fromTo(s, { rotate: 300, x: 340 }, {
          rotate: 0, x: 0, ease: 'none',
          scrollTrigger: { trigger: s, containerAnimation: move, start: 'left right', end: 'center 60%', scrub: true },
        })
      })
      gsap.utils.toArray<HTMLElement>('.w-word').forEach((w) => {
        gsap.from(w.querySelectorAll('.ci'), {
          yPercent: 110, rotate: () => gsap.utils.random(-25, 25), stagger: 0.03, ease: 'back.out(2)',
          scrollTrigger: { trigger: w, containerAnimation: move, start: 'left 85%', end: 'left 35%', scrub: true },
        })
      })
      gsap.utils.toArray<HTMLElement>('.w-card').forEach((c) => {
        gsap.from(c, {
          y: 220, rotate: 18, ease: 'power2.out',
          scrollTrigger: { trigger: c, containerAnimation: move, start: 'left 95%', end: 'left 55%', scrub: true },
        })
      })
    }, sec)
    return () => ctx.revert()
  }, [])

  return (
    <section id="words" ref={sec} className="words field">
      <p className="words-kicker">why I build</p>
      <div className="w-track" ref={track}>
        {PANELS.map((p) => (
          <div className="w-panel" key={p.word}>
            <p className="w-num" aria-hidden="true">{p.n}</p>
            <h3 className="big w-word" aria-label={p.word}>
              {p.word.split('').map((ch, i) => (
                <span className="c" key={i} style={{ ['--r' as string]: `${((i * 37) % 9) - 4}deg` }} aria-hidden="true">
                  <span className="ci">{ch === ' ' ? ' ' : ch}</span>
                </span>
              ))}
            </h3>
            <p className="w-note">{p.note}</p>
            <svg className="w-arrow" viewBox="0 0 120 60" aria-hidden="true"><path d="M4 50 C 30 10, 70 0, 112 22 M100 10 l12 12 -16 6" /></svg>
            <div className="w-stickers">
              {p.stickers.map((s) => (
                <span key={s.big + s.small} className={`roll sticker-${s.c}`}><b>{s.big}</b><small>{s.small}</small></span>
              ))}
            </div>
            <div className="w-card">
              <span className="tape" aria-hidden="true" />
              <b>{p.card.t}</b>
              <span>{p.card.d}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
