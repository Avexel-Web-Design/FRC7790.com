/**
 * useSeasonPerformance - Hook for fetching current season performance data
 * 
 * Features:
 * - Parallel fetching of statuses and awards
 * - Centralized caching
 * - Proper loading states
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchTBA } from './useTBA';

interface EventPerformance {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  ranking: string;
  record: string;
  awards: string;
  status: 'upcoming' | 'current' | 'completed';
}

interface UseSeasonPerformanceResult {
  performanceData: EventPerformance[];
  isLoading: boolean;
}

/**
 * Hook for fetching current season performance data with parallel loading
 */
export function useSeasonPerformance(
  teamNumber: string | null,
  eventsData: Array<{
    key: string;
    name: string;
    start_date: string;
    end_date: string;
  }>
): UseSeasonPerformanceResult {
  const [performanceData, setPerformanceData] = useState<EventPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadingRef = useRef<string>('');
  
  // Sort events by start date
  const sortedEvents = useMemo(() => 
    [...eventsData].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    ),
    [eventsData]
  );
  
  useEffect(() => {
    if (!teamNumber || sortedEvents.length === 0) {
      setPerformanceData([]);
      setIsLoading(false);
      return;
    }
    
    const loadKey = `${teamNumber}-${sortedEvents.map(e => e.key).join(',')}`;
    if (loadingRef.current === loadKey) return;
    loadingRef.current = loadKey;
    
    setIsLoading(true);
    
    const fetchAllPerformance = async () => {
      const now = new Date();
      
      const promises = sortedEvents.map(async (event) => {
        const eventData: EventPerformance = {
          key: event.key,
          name: event.name,
          start_date: event.start_date,
          end_date: event.end_date,
          ranking: 'Not Available',
          record: 'N/A',
          awards: 'None',
          status: 'completed',
        };
        
        // Fetch status and awards in parallel
        const statusKey = `/team/frc${teamNumber}/event/${event.key}/status`;
        const awardsKey = `/team/frc${teamNumber}/event/${event.key}/awards`;
        
        const [statusResult, awardsResult] = await Promise.all([
          fetchTBA<{
            qual?: {
              ranking?: {
                rank: number;
                record: { wins: number; losses: number; ties: number };
              };
              num_teams?: number;
            };
          }>(statusKey).catch(() => null),
          fetchTBA<Array<{ name: string }>>(awardsKey).catch(() => []),
        ]);
        
        // Process status
        if (statusResult?.qual?.ranking) {
          eventData.ranking = `${statusResult.qual.ranking.rank} of ${statusResult.qual.num_teams}`;
          
          if (statusResult.qual.ranking.record) {
            const record = statusResult.qual.ranking.record;
            eventData.record = `${record.wins}-${record.losses}-${record.ties}`;
          }
        }
        
        // Process awards
        if (awardsResult && awardsResult.length > 0) {
          eventData.awards = awardsResult.map(award => award.name).join(', ');
        }
        
        // Determine event status
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);
        eventEnd.setHours(23, 59, 59);
        
        if (now < eventStart) {
          eventData.status = 'upcoming';
        } else if (now >= eventStart && now <= eventEnd) {
          eventData.status = 'current';
        } else {
          eventData.status = 'completed';
        }
        
        return eventData;
      });
      
      const results = await Promise.all(promises);
      
      // Only update if this is still the current request
      if (loadingRef.current !== loadKey) return;
      
      setPerformanceData(results);
      setIsLoading(false);
    };
    
    fetchAllPerformance();
  }, [teamNumber, sortedEvents]);
  
  return {
    performanceData,
    isLoading,
  };
}
