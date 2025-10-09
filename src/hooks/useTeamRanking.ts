import { useState, useEffect } from 'react';

interface TeamRankingData {
  rank: number | null;
  totalTeams: number;
  year: number | null;
  loading: boolean;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rankingType, setRankingType] = useState<'district' | 'regional' | null>(null);

  useEffect(() => {
    const fetchTeamRanking = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();
        const yearsToTry = [currentYear, currentYear - 1];

        console.log('[useTeamRanking] Fetching for team:', teamNumber);

        // First, try to fetch the team's districts
        const districtsResponse = await fetch(
          `https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/districts`,
          {
            headers: {
              'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf',
            },
          }
        );

        if (!districtsResponse.ok) {
          throw new Error('Failed to fetch districts');
        }

        const districts: DistrictInfo[] = await districtsResponse.json();
        console.log('[useTeamRanking] Districts:', districts);

        // Try to find a district ranking for current year or previous year
        let foundRanking = false;
        for (const tryYear of yearsToTry) {
          const district = districts.find((d) => d.year === tryYear);
          console.log(`[useTeamRanking] Checking year ${tryYear}, found district:`, district);
          if (!district) continue;

          // Fetch rankings for this district
          const rankingsResponse = await fetch(
            `https://www.thebluealliance.com/api/v3/district/${district.key}/rankings`,
            {
              headers: {
                'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf',
              },
            }
          );

          if (!rankingsResponse.ok) {
            console.log(`[useTeamRanking] Rankings fetch failed for ${district.key}`);
            continue;
          }

          const rankings: RankingInfo[] = await rankingsResponse.json();
          const teamKey = `frc${teamNumber}`;
          const teamRanking = rankings.find((r) => r.team_key === teamKey);

          console.log(`[useTeamRanking] Searched for ${teamKey} in ${rankings.length} teams, found:`, teamRanking);

          if (teamRanking) {
            setRank(teamRanking.rank);
            setTotalTeams(rankings.length);
            setYear(tryYear);
            setRankingType('district');
            setError(null);
            console.log('[useTeamRanking] District ranking found! Rank:', teamRanking.rank, 'Total:', rankings.length, 'Year:', tryYear);
            foundRanking = true;
            break;
          }
        }

        // If no district ranking found, try regional rankings
        if (!foundRanking) {
          console.log('[useTeamRanking] No district ranking found, trying regional...');
          for (const tryYear of yearsToTry) {
            const regionalResponse = await fetch(
              `https://www.thebluealliance.com/api/v3/regional_advancement/${tryYear}/rankings`,
              {
                headers: {
                  'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf',
                },
              }
            );

            if (!regionalResponse.ok) {
              console.log(`[useTeamRanking] Regional rankings fetch failed for ${tryYear}`);
              continue;
            }

            const regionalRankings: RankingInfo[] = await regionalResponse.json();
            const teamKey = `frc${teamNumber}`;
            const teamRanking = regionalRankings.find((r) => r.team_key === teamKey);

            console.log(`[useTeamRanking] Searched for ${teamKey} in ${regionalRankings.length} regional teams, found:`, teamRanking);

            if (teamRanking) {
              setRank(teamRanking.rank);
              setTotalTeams(regionalRankings.length);
              setYear(tryYear);
              setRankingType('regional');
              setError(null);
              console.log('[useTeamRanking] Regional ranking found! Rank:', teamRanking.rank, 'Total:', regionalRankings.length, 'Year:', tryYear);
              break;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching team ranking:', err);
        setError('Failed to load ranking');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamRanking();
  }, [teamNumber]);

  return { rank, totalTeams, year, loading, error, rankingType };
};

export default useTeamRanking;
