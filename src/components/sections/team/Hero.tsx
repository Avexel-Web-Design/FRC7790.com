import { useEffect } from 'react';
import { getTeamAccentStyle, getTeamGlowClass } from '../../../utils/color';

interface TeamHeroProps {
  teamNumber: string;
  teamData: any;
  setTeamData: (data: any) => void;
  setLoading: (loading: boolean) => void;
}

export default function TeamHero({ teamNumber, teamData, setTeamData, setLoading }: TeamHeroProps) {
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        
        // Fetch basic team data
        const response = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}`, {
          headers: {
            'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTeamData(data);
          
          // Update page title with team nickname
          document.title = `Team ${teamNumber} - ${data.nickname || 'FRC Team'} - Overview`;
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamNumber, setTeamData, setLoading]);

  return (
    <section className="pt-36 pb-16 relative z-10">
      <div className="container mx-auto px-6">
        <h1 className="text-5xl md:text-7xl font-bold text-center mb-4">
          <span className="text-white inline-block animate__animated animate__fadeInUp" style={{animationDelay: '0.2s'}}>
            Team
          </span>
          <span className={`${getTeamGlowClass(teamNumber)} inline-block animate__animated animate__fadeInUp ml-4`} style={{...getTeamAccentStyle(teamNumber), animationDelay: '0.4s'}}>
            {teamNumber}
          </span>
        </h1>
        <p className="text-gray-400 text-center mt-4 max-w-2xl mx-auto animate__animated animate__fadeInUp" style={{animationDelay: '0.6s'}}>
          {teamData ? (
            <>
              {teamData.nickname}
              {teamData.school_name && ` - ${teamData.school_name}`}
            </>
          ) : (
            'Loading team information...'
          )}
        </p>
      </div>
    </section>
  );
}
