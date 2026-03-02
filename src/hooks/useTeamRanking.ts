import { useState, useEffect } from 'react';
import { fetchTBA } from './useTBA';

interface TeamRankingData {
  rank: number | null;
  totalTeams: number;
  year: number | null;
  isLoading: boolean;
  error: string | null;
  rankingType: 'district' | 'regional' | null;
}

interface DistrictInfo {
  abbreviation: string;
  display_name: string;
  key: string;
  year: number;
}

interface RankingInfo {
  rank: number;
  team_key: string;
  point_total: number;
}

const useTeamRanking = (teamNumber: string): TeamRankingData => {
  const [rank, setRank] = useState<number | null>(null);
  const [totalTeams, setTotalTeams] = useState<number>(0);
  const [year, setYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rankingType, setRankingType] = useState<'district' | 'regional' | null>(null);

  useEffect(() => {
    const fetchTeamRanking = async () => {
      try {
        setIsLoading(true);
        const currentYear = new Date().getFullYear();
        const yearsToTry = [currentYear, currentYear - 1];

        // Fetch the team's districts using centralized TBA fetcher
        const districts = await fetchTBA<DistrictInfo[]>(
          `/team/frc${teamNumber}/districts`
        );

        // Try to find a district ranking for current year or previous year
        let foundRanking = false;
        for (const tryYear of yearsToTry) {
          const district = districts.find((d) => d.year === tryYear);
          if (!district) continue;

          try {
            const rankings = await fetchTBA<RankingInfo[]>(
              `/district/${district.key}/rankings`
            );

            const teamKey = `frc${teamNumber}`;
            const teamRanking = rankings.find((r) => r.team_key === teamKey);

            if (teamRanking) {
              setRank(teamRanking.rank);
              setTotalTeams(rankings.length);
              setYear(tryYear);
              setRankingType('district');
              setError(null);
              foundRanking = true;
              break;
            }
          } catch {
            // District rankings not available for this year, try next
            continue;
          }
        }

        // If no district ranking found, try regional rankings
        if (!foundRanking) {
          for (const tryYear of yearsToTry) {
            try {
              const regionalRankings = await fetchTBA<RankingInfo[]>(
                `/regional_advancement/${tryYear}/rankings`
              );

              const teamKey = `frc${teamNumber}`;
              const teamRanking = regionalRankings.find((r) => r.team_key === teamKey);

              if (teamRanking) {
                setRank(teamRanking.rank);
                setTotalTeams(regionalRankings.length);
                setYear(tryYear);
                setRankingType('regional');
                setError(null);
                break;
              }
            } catch {
              // Regional rankings not available for this year, try next
              continue;
            }
          }
        }
      } catch {
        setError('Failed to load ranking');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamRanking();
  }, [teamNumber]);

  return { rank, totalTeams, year, isLoading, error, rankingType };
};

export default useTeamRanking;
