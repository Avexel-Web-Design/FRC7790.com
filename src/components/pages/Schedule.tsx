import ScheduleHero from '../sections/schedule/ScheduleHero';
import CompetitionSchedule from '../sections/schedule/CompetitionSchedule';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export default function Schedule() {
  useScrollReveal();

  return (
    <>
      <ScheduleHero />
      <CompetitionSchedule />
    </>
  );
}
