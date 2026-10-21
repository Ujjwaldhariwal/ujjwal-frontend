/** Shown while the 3D meter map downloads. Same box as the map, so nothing jumps when it arrives. */
export default function PowerLoader({ label = 'Bringing the meter grid online…' }: { label?: string }) {
  return (
    <div className="meter-map power-loader" role="status" aria-label={label}>
      <div className="hud">
        <b>Smart-meter analytics, v2</b>
        <span>loading the 3D meter field</span>
      </div>
      <div className="loader-scope" aria-hidden="true">
        <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="loader-wave">
          <path d="M0 30 Q 12.5 6 25 30 T 50 30 T 75 30 T 100 30 T 125 30 T 150 30 T 175 30 T 200 30" />
          <path d="M200 30 Q 212.5 6 225 30 T 250 30 T 275 30 T 300 30 T 325 30 T 350 30 T 375 30 T 400 30" />
        </svg>
        <span className="loader-scanline" />
      </div>
      <p className="loader-meta"><span className="live-dot" />{label}</p>
    </div>
  )
}
