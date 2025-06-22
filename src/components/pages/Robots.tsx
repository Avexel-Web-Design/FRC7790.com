import RobotsHero from '../sections/robots/RobotsHero';
import CurrentRobot from '../sections/robots/CurrentRobot';
import PreviousRobots from '../sections/robots/PreviousRobots';

export default function Robots() {
  return (
    <>
      <RobotsHero />
      <CurrentRobot />
      <PreviousRobots />
    </>
  );
}
