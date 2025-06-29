import FTCHero from '../sections/ftc/FTCHero';
import FTCGameInfo from '../sections/ftc/FTCGameInfo';
import FTCRobots from '../sections/ftc/FTCRobots';

export default function FTC() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-black"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black opacity-50"></div>
      <div className="relative z-10">
        <FTCHero />
        <FTCGameInfo />
        <FTCRobots />
      </div>
    </div>
  );
}
