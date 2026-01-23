import { useEffect } from 'react';
import { getTeamAccentStyle, getTeamGlowClass } from '../../../utils/color';
import { useTeamInfo } from '../../../hooks/useTBA';

interface TeamHeroProps {
  teamNumber: string;
  teamData: {
    nickname?: string;
    school_name?: string;
  } | null;
  setTeamData: React.Dispatch<React.SetStateAction<{
    nickname?: string;
    school_name?: string;
    rookie_year?: number;
    city?: string;
    state_prov?: string;
    website?: string;
    motto?: string;
  } | null>>;
  setLoading: (loading: boolean) => void;
}

export default function TeamHero({ teamNumber, teamData, setTeamData, setLoading }: TeamHeroProps) {
  // Use SWR hook for team info with caching
  const { data, isLoading } = useTeamInfo(teamNumber);
  
  // Sync with parent state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);
  
  useEffect(() => {
    if (data) {
      setTeamData(data);
      // Update page title with team nickname
      document.title = `Team ${teamNumber} - ${data.nickname || 'FRC Team'} - Overview`;
    }
  }, [data, teamNumber, setTeamData]);

  return (
    <section className="pt-44 sm:pt-36 pb-20 sm:pb-16 relative z-10">
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
