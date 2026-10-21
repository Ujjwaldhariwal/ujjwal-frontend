import { useEffect, useState } from 'react'
import { startSmoothScroll } from './lib/motion'
import Nav from './sections/Nav'
import Hero from './sections/Hero'
import PowerBand from './sections/PowerBand'
import Playground from './sections/Playground'
import Readers from './sections/Readers'
import Work from './sections/Work'
import Contact from './sections/Contact'

export default function App() {
  const [powered, setPowered] = useState(false)

  useEffect(() => {
    startSmoothScroll()
  }, [])

  return (
    <>
      <a className="skip" href="#playground">Skip to content</a>
      <Nav />
      <main>
        <Hero powered={powered} onPower={() => setPowered(true)} />
        <PowerBand />
        <Playground />
        <Readers />
        <Work />
        <Contact powered={powered} onToggle={() => setPowered((p) => !p)} />
      </main>
    </>
  )
}
