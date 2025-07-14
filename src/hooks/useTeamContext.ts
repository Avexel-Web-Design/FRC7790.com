import { useLocation, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

export function useTeamContext() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const teamContext = useMemo(() => {
    // Check if we're on a team page
    const isTeamPage = location.pathname === '/team';
    
    if (!isTeamPage) {
      return {
        isTeamPage: false,
        teamNumber: null,
        isSpecialTeam: false
      };
    }

    // Get team number from URL parameters
    const teamNumber = searchParams.get('team') || '7790';
    
    // Check if it's a special team with custom colors
    const specialTeams = ['3767', '7598', '5560'];
    const isSpecialTeam = specialTeams.includes(teamNumber);

    return {
      isTeamPage: true,
      teamNumber,
      isSpecialTeam
    };
  }, [location.pathname, searchParams]);

  return teamContext;
}
