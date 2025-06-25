import { useState, useEffect, useCallback } from 'react';
import { frcAPI } from '../utils/frcAPI';

export interface DistrictEventPoints {
  event_key: string;
  district_cmp: boolean;
  total: number;
}

export interface DistrictRanking {
  rank: number;
  team_key: string;
  point_total: number;
  event_points?: DistrictEventPoints[];
  team_number?: number;
  nickname?: string;
  city?: string;
  state_prov?: string;
  country?: string;
}

export interface DistrictEvent {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  event_type: number;
  city?: string;
  state_prov?: string;
  country?: string;
}

export function useDistrictData(districtKey: string) {
  const [rankings, setRankings] = useState<DistrictRanking[]>([]);
  const [events, setEvents] = useState<DistrictEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDistrictData = useCallback(async () => {
    if (!districtKey) return;
    try {
      setIsLoading(true);
      setError(null);

      const [districtRankings, districtEvents] = await Promise.all([
        frcAPI.fetchDistrictRankings(districtKey),
        frcAPI.fetchDistrictEvents(districtKey)
      ]);

      setRankings(districtRankings);
      setEvents(districtEvents);
    } catch (err) {
      console.error('Error fetching district data', err);
      setError(err instanceof Error ? err.message : 'Failed to load district data');
    } finally {
      setIsLoading(false);
    }
  }, [districtKey]);

  useEffect(() => {
    fetchDistrictData();
  }, [fetchDistrictData]);

  const refetch = () => fetchDistrictData();

  return {
    rankings,
    events,
    isLoading,
    error,
    refetch
  };
}
