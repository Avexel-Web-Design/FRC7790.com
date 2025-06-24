import ScheduleHero from '../sections/schedule/ScheduleHero';
import CompetitionSchedule from '../sections/schedule/CompetitionSchedule';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function Schedule() {
  useScrollReveal();

  return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-black"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-baywatch-dark to-black opacity-50"></div>
        <div className="relative z-10">
          <ScheduleHero />
          <CompetitionSchedule />
        </div>
      </div>
  );
}
