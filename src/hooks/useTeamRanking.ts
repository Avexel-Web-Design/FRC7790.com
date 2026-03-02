import { useState, useEffect } from 'react';
import { TBA_CONFIG } from '../config';

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

        // First, try to fetch the team's districts
        const districtsResponse = await fetch(
          `${TBA_CONFIG.BASE_URL}/team/frc${teamNumber}/districts`,
          {
            headers: {
              'X-TBA-Auth-Key': TBA_CONFIG.AUTH_KEY,
            },
          }
        );

        if (!districtsResponse.ok) {
          throw new Error('Failed to fetch districts');
        }

        const districts: DistrictInfo[] = await districtsResponse.json();

        // Try to find a district ranking for current year or previous year
        let foundRanking = false;
        for (const tryYear of yearsToTry) {
          const district = districts.find((d) => d.year === tryYear);
          if (!district) continue;

          // Fetch rankings for this district
          const rankingsResponse = await fetch(
            `${TBA_CONFIG.BASE_URL}/district/${district.key}/rankings`,
            {
              headers: {
                'X-TBA-Auth-Key': TBA_CONFIG.AUTH_KEY,
              },
            }
          );

          if (!rankingsResponse.ok) {
            continue;
          }

          const rankings: RankingInfo[] = await rankingsResponse.json();
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
        }

        // If no district ranking found, try regional rankings
        if (!foundRanking) {
          for (const tryYear of yearsToTry) {
            const regionalResponse = await fetch(
              `${TBA_CONFIG.BASE_URL}/regional_advancement/${tryYear}/rankings`,
              {
                headers: {
                  'X-TBA-Auth-Key': TBA_CONFIG.AUTH_KEY,
                },
              }
            );

            if (!regionalResponse.ok) {
              continue;
            }

            const regionalRankings: RankingInfo[] = await regionalResponse.json();
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
          }
        }
      } catch (err) {
        console.error('Error fetching team ranking:', err);
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
