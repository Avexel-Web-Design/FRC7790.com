import { useState, useEffect, useCallback } from 'react';
import { frcAPI } from '../utils/frcAPI';

export interface RegionalEventPoints {
  event_key: string;
  total: number;
}

export interface RegionalRanking {
  rank: number;
  team_key: string;
  point_total: number;
  event_points?: RegionalEventPoints[];
}

export interface RegionalEvent {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  event_type: number;
  city?: string;
  state_prov?: string;
  country?: string;
}

export function useRegionalData(year: string) {
  const [rankings, setRankings] = useState<RegionalRanking[]>([]);
  const [events, setEvents] = useState<RegionalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegionalData = useCallback(async () => {
    const includeRankings = parseInt(year, 10) >= 2025;
    try {
      setIsLoading(true);
      setError(null);
      const [rankData, eventData] = includeRankings
        ? await Promise.all([
            frcAPI.fetchRegionalRankings(year),
            frcAPI.fetchSeasonRegionalEvents(year)
          ])
        : [[], await frcAPI.fetchSeasonRegionalEvents(year)];
      setRankings(rankData);
      setEvents(eventData);
    } catch (err) {
      console.error('Error fetching regional data', err);
      setError(err instanceof Error ? err.message : 'Failed to load regional rankings');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchRegionalData();
  }, [fetchRegionalData]);

  const refetch = () => fetchRegionalData();

  return { rankings, events, isLoading, error, refetch };
}
