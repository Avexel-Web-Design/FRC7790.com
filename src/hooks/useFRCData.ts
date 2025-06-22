import { useState, useEffect, useCallback } from 'react';
import { frcAPI, type CompetitionData, type Event } from '../utils/frcAPI';

export function useFRCCompetitionData(refreshInterval: number = 30000) {
  const [data, setData] = useState<CompetitionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const competitionData = await frcAPI.getCompetitionData();
      setData(competitionData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching competition data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load competition data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData
  };
}

export function useFRCCurrentEvent() {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const currentEvent = await frcAPI.getCurrentEvent();
        setEvent(currentEvent);
      } catch (err) {
        console.error('Error fetching current event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, []);

  return {
    event,
    isLoading,
    error
  };
}
