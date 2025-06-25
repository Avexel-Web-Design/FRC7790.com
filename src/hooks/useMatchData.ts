import { useState, useEffect } from 'react';

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
    blue: any;
    red: any;
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
  loading: boolean;
  error: string | null;
}

export const useMatchData = (matchKey: string | null): UseMatchDataReturn => {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [teamData, setTeamData] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchKey) {
      setMatchData(null);
      setEventData(null);
      setTeamData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const loadMatchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Parse event key from match key (e.g., extract "2025milac" from "2025milac_qm1")
        const eventKey = matchKey.split('_')[0];

        // Fetch match data
        const matchResponse = await fetch(`https://www.thebluealliance.com/api/v3/match/${matchKey}`, {
          headers: { "X-TBA-Auth-Key": "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf" }
        });

        if (!matchResponse.ok) throw new Error(`Match data HTTP error: ${matchResponse.status}`);
        const match = await matchResponse.json();

        // Fetch event data
        const eventResponse = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}`, {
          headers: { "X-TBA-Auth-Key": "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf" }
        });

        if (!eventResponse.ok) throw new Error(`Event data HTTP error: ${eventResponse.status}`);
        const event = await eventResponse.json();

        // Fetch team data for all teams in the match
        const allTeamKeys = [
          ...match.alliances.blue.team_keys,
          ...match.alliances.red.team_keys
        ];

        const teamPromises = allTeamKeys.map(teamKey => 
          fetch(`https://www.thebluealliance.com/api/v3/team/${teamKey}`, {
            headers: { "X-TBA-Auth-Key": "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf" }
          }).then(res => {
            if (!res.ok) throw new Error(`Team data HTTP error for ${teamKey}: ${res.status}`);
            return res.json();
          })
        );

        const teams = await Promise.all(teamPromises);

        setMatchData(match);
        setEventData(event);
        setTeamData(teams);
      } catch (err) {
        console.error("Error loading match data:", err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [matchKey]);

  return { matchData, eventData, teamData, loading, error };
};
