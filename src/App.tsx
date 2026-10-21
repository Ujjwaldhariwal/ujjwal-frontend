import { useEffect } from 'react'
import { startSmoothScroll } from './lib/motion'
import { Logo, Paper, PullCord, SoundToggle } from './ui/Chrome'
import PlugHero from './sections/PlugHero'
import Desk from './sections/Desk'
import Marquee from './sections/Marquee'
import Stack from './sections/Stack'
import Playground from './sections/Playground'
import Words from './sections/Words'
import Readers from './sections/Readers'
import Work from './sections/Work'
import Heap from './sections/Heap'

export default function App() {
  useEffect(() => {
    startSmoothScroll()
  }, [])

  return (
    <>
      <a className="skip" href="#desk">Skip to content</a>
      <Logo />
      <PullCord />
      <SoundToggle />
      <main>
        <PlugHero />
        <Desk />
        <Marquee />
        <Stack />
        <Playground />
        <Words />
        <Readers />
        <Work />
        <Heap />
      </main>
      <Paper />
    </>
  )
}
