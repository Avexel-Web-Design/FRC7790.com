import { useEffect } from 'react';
import Hero from '../sections/home/Hero';
import LiveUpdates from '../sections/home/LiveUpdates';
import Countdown from '../sections/home/Countdown';
import Robot from '../sections/home/Robot';
import GameInfo from '../sections/home/GameInfo';
import Contact from '../sections/home/Contact';
import { updateSEO, SEO_CONFIGS } from '../../utils/seo';

export default function Home() {
  useEffect(() => {
    updateSEO(SEO_CONFIGS.home);
  }, []);

  return (
    <>
      <Hero />
      <LiveUpdates />
      <Countdown />
      <Contact />
      <Robot />
      <GameInfo />
    </>
  );
}
