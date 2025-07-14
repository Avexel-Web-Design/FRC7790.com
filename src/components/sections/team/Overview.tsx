import { useState, useEffect } from 'react';
import TeamStats from './Stats';
import CurrentEvent from './CurrentEvent';
import TeamLinks from './Links';
import SeasonPerformance from './SeasonPerformance';

interface TeamOverviewProps {
  teamNumber: string;
  teamData: any;
}

export default function TeamOverview({ teamNumber, teamData }: TeamOverviewProps) {
  const [eventsData, setEventsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();
        
        const response = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/events/${currentYear}`, {
          headers: {
            'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setEventsData(data);
        }
      } catch (error) {
        console.error('Error fetching events data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (teamNumber) {
      fetchEventsData();
    }
  }, [teamNumber]);

  return (
    <section className="card-gradient sm:bg-none sm:border-none rounded-xl py-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Team Stats */}
        <TeamStats 
          teamNumber={teamNumber}
          teamData={teamData}
          eventsData={eventsData}
        />
        
        {/* Current Event Overview */}
        <CurrentEvent 
          teamNumber={teamNumber}
          eventsData={eventsData}
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
          eventsData={eventsData}
          loading={loading}
        />
      </div>
    </section>
  );
}
