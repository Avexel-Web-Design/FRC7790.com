import { useState, useEffect, useCallback } from 'react';
import { frcAPI } from '../utils/frcAPI';

export interface EventData {
  key: string;
  name: string;
  short_name?: string;
  city?: string;
  state_prov?: string;
  country?: string;
  start_date: string;
  end_date: string;
  event_type: number;
  event_type_string?: string;
  district?: {
    abbreviation: string;
    display_name: string;
    key: string;
  };
  website?: string;
  livestream?: {
    type: string;
    channel: string;
  };
}

export interface TeamRanking {
  rank: number;
  team_key: string;
  wins?: number;
  losses?: number;
  ties?: number;
  ranking_points?: number;
  sort_orders?: number[];
  dq?: number;
  matches_played?: number;
  qual_average?: number;
  record?: {
    wins: number;
    losses: number;
    ties: number;
  };
  extra_stats?: number[];
  team_name?: string;
  nickname?: string;
  epa?: number;
}

export interface Match {
  key: string;
  comp_level: string;
  set_number: number;
  match_number: number;
  predicted_time?: number;
  actual_time?: number;
  post_result_time?: number;
  score_breakdown?: any;
  alliances: {
    blue: {
      team_keys: string[];
      score: number;
      dq_team_keys?: string[];
      surrogate_team_keys?: string[];
    };
    red: {
      team_keys: string[];
      score: number;
      dq_team_keys?: string[];
      surrogate_team_keys?: string[];
    };
  };
  videos?: any[];
  time?: number;
  winning_alliance?: 'red' | 'blue' | '';
}

export interface Award {
  name: string;
  award_type: number;
  event_key: string;
  recipient_list: Array<{
    team_key?: string;
    awardee?: string;
  }>;
  year: number;
}

export interface Team {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  city?: string;
  state_prov?: string;
  country?: string;
  rookie_year?: number;
}

export function useEventData(eventCode: string) {
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<Match[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [epaData, setEpaData] = useState<{ [teamKey: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if event is upcoming
  const isUpcoming = eventData ? new Date(eventData.start_date) > new Date() : false;

  const fetchEventData = useCallback(async () => {
    if (!eventCode) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch basic event data
      const event = await frcAPI.fetchEventData(eventCode);
      setEventData(event);

      // Fetch teams for the event
      const eventTeams = await frcAPI.fetchEventTeams(eventCode);
      setTeams(eventTeams);

      // Only fetch competition data if event has started
      const eventStarted = new Date(event.start_date) <= new Date();
      
      if (eventStarted) {
        // Fetch rankings
        try {
          const eventRankings = await frcAPI.fetchEventRankings(eventCode);
          setRankings(eventRankings);
        } catch (err) {
          console.warn('Rankings not available yet:', err);
        }

        // Fetch matches
        try {
          const eventMatches = await frcAPI.fetchEventMatches(eventCode);
          setMatches(eventMatches.filter(match => match.comp_level === 'qm'));
          setPlayoffMatches(eventMatches.filter(match => match.comp_level !== 'qm'));
        } catch (err) {
          console.warn('Matches not available yet:', err);
        }

        // Fetch awards
        try {
          const eventAwards = await frcAPI.fetchEventAwards(eventCode);
          setAwards(eventAwards);
        } catch (err) {
          console.warn('Awards not available yet:', err);
        }
      }

    } catch (err) {
      console.error('Error fetching event data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event data');
    } finally {
      setIsLoading(false);
    }
  }, [eventCode]);

  const refetch = useCallback(() => {
    fetchEventData();
  }, [fetchEventData]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Auto-load EPA data when teams are loaded
  useEffect(() => {
    if (teams.length > 0 && Object.keys(epaData).length === 0) {
      loadEpaData();
    }
  }, [teams]);

  const loadEpaData = async () => {
    if (!eventData) return;
    
    try {
      console.log('Auto-loading EPA data for event:', eventData.key);
      
      // Use progressive callback to update EPA data as it loads
      const epaResults = await frcAPI.fetchStatboticsEPA(eventData.key, (progressEpaData) => {
        setEpaData(prevData => ({ ...prevData, ...progressEpaData }));
      });
      
      // Final update to ensure all data is set
      setEpaData(epaResults);
      console.log('EPA data loading completed:', epaResults);
    } catch (err) {
      console.error('Error fetching EPA data:', err);
    }
  };

  return {
    eventData,
    rankings,
    matches,
    playoffMatches,
    awards,
    teams,
    epaData,
    isLoading,
    error,
    isUpcoming,
    refetch
  };
}
