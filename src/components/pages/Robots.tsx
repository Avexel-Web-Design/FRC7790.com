import RobotsHero from '../sections/robots/RobotsHero';
import CurrentRobot from '../sections/robots/CurrentRobot';
import PreviousRobots from '../sections/robots/PreviousRobots';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function Robots() {
  useScrollReveal();

  return (
    <>
      <RobotsHero />
      <CurrentRobot />
      <PreviousRobots />
    </>
  );
}
