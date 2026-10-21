export type Pt = { x: number; y: number }
export type Kind = 'button' | 'toggle' | 'slider' | 'chart'
export type Recognition = { kind: Kind; confidence: number; shape: string } | { kind: null; reason: string }

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)

export function pathLength(pts: Pt[]) {
  let L = 0
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i])
  return L
}

/** Resample to n evenly spaced points (classic $1-recognizer step). */
export function resample(pts: Pt[], n = 64): Pt[] {
  if (pts.length < 2) return pts.slice()
  const I = pathLength(pts) / (n - 1)
  const out: Pt[] = [pts[0]]
  let D = 0
  const src = pts.slice()
  for (let i = 1; i < src.length; i++) {
    const d = dist(src[i - 1], src[i])
    if (D + d >= I && d > 0) {
      const t = (I - D) / d
      const q = { x: src[i - 1].x + t * (src[i].x - src[i - 1].x), y: src[i - 1].y + t * (src[i].y - src[i - 1].y) }
      out.push(q)
      src.splice(i, 0, q)
      D = 0
    } else D += d
  }
  while (out.length < n) out.push(src[src.length - 1])
  return out
}

export function bbox(pts: Pt[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of pts) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y) }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
}

/** Counts vertical direction changes, ignoring hand jitter smaller than the threshold. */
function reversals(pts: Pt[], th: number) {
  let dir = 0, ext = pts[0].y, count = 0
  for (const p of pts) {
    if (dir === 0) {
      if (p.y - ext > th) { dir = 1; ext = p.y } else if (ext - p.y > th) { dir = -1; ext = p.y }
    } else if (dir === 1) {
      if (p.y > ext) ext = p.y
      else if (ext - p.y > th) { count++; dir = -1; ext = p.y }
    } else {
      if (p.y < ext) ext = p.y
      else if (p.y - ext > th) { count++; dir = 1; ext = p.y }
    }
  }
  return count
}

export function recognize(raw: Pt[]): Recognition {
  if (raw.length < 4) return { kind: null, reason: 'too short' }
  const pts = resample(raw)
  const b = bbox(pts)
  const diag = Math.hypot(b.w, b.h)
  if (diag < 28) return { kind: null, reason: 'too small' }
  const L = pathLength(pts)
  const gap = dist(pts[0], pts[pts.length - 1]) / diag
  const closed = gap < 0.28 && L > diag * 1.6

  if (!closed) {
    const rev = reversals(pts, Math.max(8, b.h * 0.18))
    const straight = dist(pts[0], pts[pts.length - 1]) / L
    if (rev >= 2) return { kind: 'chart', confidence: Math.min(0.98, 0.8 + rev * 0.04), shape: 'zig-zag' }
    if (straight > 0.75) return { kind: 'slider', confidence: 0.75 + straight * 0.23, shape: 'line' }
    return { kind: 'slider', confidence: 0.71, shape: 'curve' }
  }

  // closed: a box visits its corners, a circle never does
  const inCorner = pts.filter((p) => {
    const nx = Math.abs((p.x - b.cx) / (b.w || 1)), ny = Math.abs((p.y - b.cy) / (b.h || 1))
    return nx > 0.36 && ny > 0.36
  }).length / pts.length
  if (inCorner < 0.06) return { kind: 'toggle', confidence: Math.min(0.99, 0.97 - inCorner * 3), shape: 'circle' }
  return { kind: 'button', confidence: Math.min(0.98, 0.8 + inCorner), shape: 'box' }
}

/** Shapes used by "draw it for me" so keyboard and touch-less visitors get the same show. */
export function demoStroke(kind: Kind, cx: number, cy: number, s: number): Pt[] {
  const pts: Pt[] = []
  const j = () => (Math.random() - 0.5) * 3
  if (kind === 'button') {
    const w = 200 * s, h = 80 * s
    const c = [[-w / 2, -h / 2], [w / 2, -h / 2 - 6], [w / 2 + 4, h / 2], [-w / 2 - 3, h / 2 + 4], [-w / 2 + 6, -h / 2 + 2]]
    for (let i = 0; i < c.length - 1; i++)
      for (let k = 0; k <= 14; k++) pts.push({ x: cx + c[i][0] + (c[i + 1][0] - c[i][0]) * k / 14 + j(), y: cy + c[i][1] + (c[i + 1][1] - c[i][1]) * k / 14 + j() })
  } else if (kind === 'toggle') {
    for (let a = 0; a <= Math.PI * 2.05; a += 0.12) pts.push({ x: cx + 52 * s * Math.cos(a) + j(), y: cy + 40 * s * Math.sin(a) + j() })
  } else if (kind === 'slider') {
    for (let k = 0; k <= 40; k++) pts.push({ x: cx - 220 * s + k * 11 * s, y: cy + Math.sin(k / 3) * 4 + j() })
  } else {
    const z = [[-150, 60], [-90, -10], [-45, 30], [15, -50], [65, -10], [120, -90], [160, -60]]
    for (let i = 0; i < z.length - 1; i++)
      for (let k = 0; k <= 10; k++) pts.push({ x: cx + (z[i][0] + (z[i + 1][0] - z[i][0]) * k / 10) * s + j(), y: cy + (z[i][1] + (z[i + 1][1] - z[i][1]) * k / 10) * s + j() })
  }
  return pts
}

export const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
