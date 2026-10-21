import { forwardRef, type ElementType, type CSSProperties } from 'react'
import { rng } from '../lib/motion'

type Props = {
  text: string
  as?: ElementType
  className?: string
  /** max random tilt per letter, in degrees */
  wobble?: number
  seed?: number
  style?: CSSProperties
}

/** Splits text into letters that each sit at a slight, fixed random tilt. Screen readers get the plain text. */
const Split = forwardRef<HTMLElement, Props>(({ text, as: Tag = 'span', className = '', wobble = 4, seed = 1, style }, ref) => {
  const r = rng(seed * 97 + text.length)
  const words = text.split(' ')
  return (
    <Tag ref={ref} className={`split ${className}`} aria-label={text} style={style}>
      {words.map((w, wi) => (
        <span className="w" aria-hidden="true" key={wi}>
          {w.split('').map((c, ci) => {
            const rot = (r() * 2 - 1) * wobble
            const y = (r() * 2 - 1) * wobble * 0.012
            return (
              <span className="c" key={ci} style={{ ['--r' as string]: `${rot.toFixed(2)}deg`, ['--y' as string]: `${y.toFixed(3)}em` }}>
                <span className="ci">{c}</span>
              </span>
            )
          })}
          {wi < words.length - 1 && <span className="sp"> </span>}
        </span>
      ))}
    </Tag>
  )
})

export default Split
