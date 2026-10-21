/** Short vibrations on Android browsers. iOS Safari has no vibration API, so these are silent there.
 *  Chrome only allows vibrate() after the visitor has tapped or clicked the page, so we check first
 *  instead of letting the browser log a "blocked call" warning. */
const canVibrate = () =>
  typeof navigator !== 'undefined' &&
  'vibrate' in navigator &&
  !(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) &&
  ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true)

const buzz = (p: number | number[]) => {
  if (!canVibrate()) return
  try { navigator.vibrate(p) } catch { /* not allowed here */ }
}

export const haptic = {
  /** Subtle tick: passing a station */
  tick: () => buzz(10),
  /** Medium pulse: flipping a switch */
  pulse: () => buzz(22),
  /** Heavy stamp: complaint stamped, drawing recognised */
  stamp: () => buzz([35, 30, 20]),
}
