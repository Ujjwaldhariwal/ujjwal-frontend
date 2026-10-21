import { useEffect, useRef, useState } from 'react'
import { loopWhileVisible, prefersReducedMotion, rng } from '../lib/motion'
import Switch from '../ui/Switch'

const EMAIL = 'ujjwaldhariwal0@gmail.com'

export default function Contact({ powered, onToggle }: { powered: boolean; onToggle: () => void }) {
  const sec = useRef<HTMLElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const level = useRef(powered ? 1 : 0.15)
  const target = useRef(powered ? 1 : 0.15)
  const [copied, setCopied] = useState(false)

  useEffect(() => { target.current = powered ? 1 : 0.15 }, [powered])

  useEffect(() => {
    const el = sec.current!, c = cv.current!, ctx = c.getContext('2d')!
    let W = 0, H = 0, dpr = 1
    let dots: { x: number; y: number; lit: boolean; ph: number }[] = []
    const size = () => {
      W = el.clientWidth; H = el.clientHeight; dpr = Math.min(2, devicePixelRatio || 1)
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'
      const r = rng(5); dots = []
      for (let y = 6; y < H; y += 12) for (let x = 6; x < W; x += 12) if (r() > 0.4) dots.push({ x, y, lit: r() > 0.94, ph: r() * 6.28 })
    }
    size()
    window.addEventListener('resize', size)
    const reduced = prefersReducedMotion()
    const stop = loopWhileVisible(el, (t) => {
      level.current += (target.current - level.current) * (reduced ? 1 : 0.06)
      const L = level.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      for (const d of dots) {
        if (d.lit) {
          const a = L * (0.6 + 0.4 * Math.sin(t * 0.002 + d.ph))
          ctx.fillStyle = `rgba(255,181,71,${a})`
          ctx.beginPath(); ctx.arc(d.x, d.y, 2, 0, 6.29); ctx.fill()
        } else {
          ctx.fillStyle = 'rgba(70,82,150,0.33)'
          ctx.fillRect(d.x - 0.6, d.y - 0.6, 1.2, 1.2)
        }
      }
    })
    return () => { stop(); window.removeEventListener('resize', size) }
  }, [])

  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { location.href = `mailto:${EMAIL}` }
  }

  return (
    <section id="contact" ref={sec} className={`contact ${powered ? 'is-on' : 'is-off'}`}>
      <canvas ref={cv} aria-hidden="true" />
      <div className="in">
        <p className="dev" lang="hi">उज्ज्वल</p>
        <h2>{powered ? 'Need your product to feel bright?' : 'Lights off. Still hiring?'}</h2>
        <p>Open to frontend and full-stack roles in Noida, Gurugram or remote.</p>
        <div className="mail-row">
          <a className="mail" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <button className="copy" onClick={copy}>{copied ? 'Copied' : 'Copy email'}</button>
        </div>
      </div>
      <div className="bigswitch">
        <Switch on={powered} onToggle={onToggle} label={powered ? 'Switch the grid off' : 'Switch the grid on'} size="lg" />
        <span>{powered ? 'switch off when you leave' : 'switch it back on'}</span>
      </div>
      <footer className="links">
        <a href="https://github.com/Ujjwaldhariwal" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://linkedin.com/in/ujjwal-dhariwal" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="/resume.pdf" target="_blank" rel="noreferrer">Résumé (PDF)</a>
        <span>Built with React, Three.js and GSAP</span>
      </footer>
    </section>
  )
}
