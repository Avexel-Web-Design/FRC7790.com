import { Suspense, useEffect, lazy } from 'react';
import Hero from '../sections/home/Hero';
import Robot from '../sections/home/Robot';
import GameInfo from '../sections/home/GameInfo';
import Contact from '../sections/home/Contact';
import { updateSEO, SEO_CONFIGS } from '../../utils/seo';

const LiveUpdates = lazy(() => import('../sections/home/LiveUpdates'));
const Countdown = lazy(() => import('../sections/home/Countdown'));

export default function Home() {
  useEffect(() => {
    updateSEO(SEO_CONFIGS.home);
  }, []);

  return (
    <>
      <Hero />
      <Suspense fallback={null}>
        <LiveUpdates />
        <Countdown />
      </Suspense>
      <Contact />
      <Robot />
      <GameInfo />
    </>
  );
}
