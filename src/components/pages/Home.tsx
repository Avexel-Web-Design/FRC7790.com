import Hero from '../sections/home/Hero';
import LiveUpdates from '../sections/home/LiveUpdates';
import Countdown from '../sections/home/Countdown';
import Contact from '../sections/home/Contact';
import About from '../sections/home/About';

export default function Home() {
  return (
    <>
      <Hero />
      <LiveUpdates />
      <Countdown />
      <Contact />
      <About />
    </>
  );
}
