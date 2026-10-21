/** Tiny synthesised sound kit. No audio files: every sound is generated with Web Audio.
 *  Off by default; browsers only allow audio after the visitor interacts, and the toggle is that interaction. */
type Listener = (on: boolean) => void

let ctx: AudioContext | null = null
let enabled = false
const listeners = new Set<Listener>()

const ac = () => {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function noise(c: AudioContext, dur: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
  const s = c.createBufferSource()
  s.buffer = b
  return s
}

function blip(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number) {
  const c = ac()
  if (!c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + dur)
}

function burst(dur: number, freq: number, q: number, gain: number) {
  const c = ac()
  if (!c) return
  const s = noise(c, dur)
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  g.gain.value = gain
  s.connect(f).connect(g).connect(c.destination)
  s.start()
}

export const sfx = {
  /** light-switch click */
  click: () => { if (!enabled) return; burst(0.05, 3200, 1.2, 0.5); blip(1800, 0.03, 'square', 0.04) },
  /** pull-cord tug */
  tug: () => { if (!enabled) return; blip(220, 0.12, 'triangle', 0.12, 120); burst(0.04, 2400, 2, 0.25) },
  /** electric spark when the plug goes in */
  spark: () => { if (!enabled) return; burst(0.35, 5200, 0.7, 0.55); blip(90, 0.25, 'sawtooth', 0.05, 60) },
  /** soft pop for stickers and recognised drawings */
  pop: () => { if (!enabled) return; blip(520, 0.09, 'sine', 0.15, 880) },
  /** thud for things landing in the footer pile */
  thud: (strength = 1) => { if (!enabled) return; blip(110, 0.12, 'sine', Math.min(0.2, 0.05 * strength), 60) },
}

export const sound = {
  get on() { return enabled },
  set(on: boolean) {
    enabled = on
    if (on) { ac(); sfx.click() }
    listeners.forEach((l) => l(on))
  },
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } },
}
