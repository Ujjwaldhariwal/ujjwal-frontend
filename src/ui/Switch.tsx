import { forwardRef } from 'react'

type Props = { on: boolean; onToggle: () => void; label: string; size?: 'md' | 'lg' }

/** A physical rocker switch. It is a real toggle button, so keyboard and screen readers get it for free. */
const Switch = forwardRef<HTMLButtonElement, Props>(({ on, onToggle, label, size = 'md' }, ref) => (
  <button
    ref={ref}
    type="button"
    className={`rocker-switch ${size} ${on ? 'on' : ''}`}
    aria-pressed={on}
    aria-label={label}
    onClick={onToggle}
  >
    <span className="plate">
      <span className="rocker">
        <span className="led" />
      </span>
    </span>
  </button>
))

export default Switch
