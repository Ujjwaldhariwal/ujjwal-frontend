import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

/** One Lenis instance driven by GSAP's ticker so ScrollTrigger and smooth scroll never drift apart. */
export function startSmoothScroll() {
  if (lenis || prefersReducedMotion()) return lenis
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis?.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  return lenis
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

/** Deterministic PRNG so the grid looks identical on every visit. */
export function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Runs cb every frame only while el is on screen. Returns a cleanup. */
export function loopWhileVisible(el: Element, cb: (t: number, dt: number) => void) {
  let raf = 0
  let last = performance.now()
  let visible = false
  const tick = (t: number) => {
    const dt = Math.min(64, t - last)
    last = t
    cb(t, dt)
    raf = requestAnimationFrame(tick)
  }
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !visible) {
      visible = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    } else if (!e.isIntersecting && visible) {
      visible = false
      cancelAnimationFrame(raf)
    }
  })
  io.observe(el)
  return () => {
    io.disconnect()
    cancelAnimationFrame(raf)
  }
}

export { gsap, ScrollTrigger }
