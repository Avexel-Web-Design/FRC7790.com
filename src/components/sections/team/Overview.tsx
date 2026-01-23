import TeamStats from './Stats';
import CurrentEvent from './CurrentEvent';
import TeamLinks from './Links';
import SeasonPerformance from './SeasonPerformance';
import { useTeamYearEvents } from '../../../hooks/useTBA';

interface TeamOverviewProps {
  teamNumber: string;
  teamData: {
    rookie_year?: number;
    city?: string;
    state_prov?: string;
    website?: string;
  } | null;
}

export default function TeamOverview({ teamNumber, teamData }: TeamOverviewProps) {
  // Use SWR hook for current year events with caching
  const { data: eventsData, isLoading: loading } = useTeamYearEvents(teamNumber);
  
  // Default to empty array if no data yet
  const events = eventsData ?? [];

  return (
    <section className="card-gradient sm:bg-none sm:border-none rounded-xl py-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Team Stats */}
        <TeamStats 
          teamNumber={teamNumber}
          teamData={teamData}
          eventsData={events}
        />
        
        {/* Current Event Overview */}
        <CurrentEvent 
          teamNumber={teamNumber}
          eventsData={events}
        />
        
        {/* Social Media & Links */}
        <TeamLinks 
          teamNumber={teamNumber}
          teamData={teamData}
        />
      </div>
      
      {/* Season Performance */}
      <div className="mt-8">
        <SeasonPerformance 
          teamNumber={teamNumber}
          eventsData={events}
          loading={loading}
        />
      </div>
    </section>
  );
}
