import { useCallback, useEffect, useState } from 'react';
import { frcAPI } from '../utils/frcAPI';

export interface AtlasDistrict {
  key: string;
  abbreviation: string;
  display_name: string;
  year: number;
}

export interface AtlasEvent {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  event_type: number;
  event_type_string?: string;
  week?: number | null;
  city?: string;
  state_prov?: string;
  country?: string;
}

export function useAtlasData(year: string) {
  const [districts, setDistricts] = useState<AtlasDistrict[]>([]);
  const [events, setEvents] = useState<AtlasEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAtlasData = useCallback(async () => {
    if (!year) return;
    try {
      setIsLoading(true);
      setError(null);

      const [districtData, eventData] = await Promise.all([
        frcAPI.fetchDistricts(year),
        frcAPI.fetchSeasonEvents(year)
      ]);

      setDistricts(districtData as AtlasDistrict[]);
      setEvents(eventData as AtlasEvent[]);
    } catch (err) {
      console.error('Error fetching atlas data', err);
      setError(err instanceof Error ? err.message : 'Failed to load atlas data');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchAtlasData();
  }, [fetchAtlasData]);

  const refetch = () => fetchAtlasData();

  return { districts, events, isLoading, error, refetch };
}
