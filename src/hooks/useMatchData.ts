import { useState, useEffect } from 'react';
import { fetchTBA } from './useTBA';

export interface MatchData {
  key: string;
  comp_level: string;
  match_number: number;
  set_number: number;
  predicted_time: number;
  actual_time?: number;
  winning_alliance: string;
  event_key: string;
  alliances: {
    blue: {
      team_keys: string[];
      score: number | null;
    };
    red: {
      team_keys: string[];
      score: number | null;
    };
  };
  score_breakdown?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blue: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    red: Record<string, any>;
  };
  videos?: Array<{
    type: string;
    key: string;
  }>;
}

export interface EventData {
  key: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
}

export interface TeamData {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  city: string;
  state_prov: string;
  country: string;
}

export interface UseMatchDataReturn {
  matchData: MatchData | null;
  eventData: EventData | null;
  teamData: TeamData[];
  isLoading: boolean;
  error: string | null;
}

export const useMatchData = (matchKey: string | null): UseMatchDataReturn => {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchKey) {
      setMatchData(null);
      setEventData(null);
      setTeamData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const loadMatchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Parse event key from match key (e.g., extract "2025milac" from "2025milac_qm1")
        const eventKey = matchKey.split('_')[0];

        // Fetch match and event data in parallel using centralized TBA fetcher
        const [match, event] = await Promise.all([
          fetchTBA<MatchData>(`/match/${matchKey}`),
          fetchTBA<EventData>(`/event/${eventKey}`),
        ]);

        // Fetch team data for all teams in the match
        const allTeamKeys = [
          ...match.alliances.blue.team_keys,
          ...match.alliances.red.team_keys,
        ];

        const teams = await Promise.all(
          allTeamKeys.map(teamKey => fetchTBA<TeamData>(`/team/${teamKey}`))
        );

        setMatchData(match);
        setEventData(event);
        setTeamData(teams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadMatchData();
  }, [matchKey]);

  return { matchData, eventData, teamData, isLoading, error };
};
