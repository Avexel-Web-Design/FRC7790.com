/**
 * useSeasonPerformance - Hook for fetching current season performance data
 * 
 * Now uses bulk endpoints for massive performance improvement:
 * - /team/frc{teamNumber}/events/{year}/statuses - ALL statuses in 1 request
 * - /team/frc{teamNumber}/awards - ALL awards in 1 request
 * 
 * Performance improvement:
 * - Before: 2N HTTP requests (N statuses + N awards)
 * - After: 2 HTTP requests total
 */

import { useMemo } from 'react';
import { useTeamYearStatuses, useTeamAllAwards } from './useTBA';
import type { EventStatus, TeamHistoryAward } from './useTBA';

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
 * Hook for fetching current season performance data using bulk endpoints
 */
export function useSeasonPerformance(
  teamNumber: string | null,
  eventsData: Array<{
    key: string;
    name: string;
    start_date: string;
    end_date: string;
  }>,
  year?: number
): UseSeasonPerformanceResult {
  const targetYear = year ?? new Date().getFullYear();
  
  // Single API call for ALL statuses for the year
  const { data: statusesData, isLoading: statusesLoading } = useTeamYearStatuses(teamNumber, targetYear);
  
  // Single API call for ALL awards (we'll filter to the events we care about)
  const { data: allAwards, isLoading: awardsLoading } = useTeamAllAwards(teamNumber);
  
  // Process all data client-side (instant, no network)
  const performanceData = useMemo(() => {
    if (!eventsData || eventsData.length === 0) return [];
    
    const now = new Date();
    
    // Create a map of eventKey -> awards for fast lookup
    const awardsByEvent = new Map<string, TeamHistoryAward[]>();
    if (allAwards) {
      for (const award of allAwards) {
        // Only include awards for events in our list
        const existing = awardsByEvent.get(award.event_key) || [];
        existing.push(award);
        awardsByEvent.set(award.event_key, existing);
      }
    }
    
    // Sort events by start date
    const sortedEvents = [...eventsData].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    return sortedEvents.map((event): EventPerformance => {
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
      
      // Get status from bulk response
      const status: EventStatus | undefined = statusesData?.[event.key];
      if (status?.qual?.ranking) {
        eventData.ranking = `${status.qual.ranking.rank} of ${status.qual.num_teams}`;
        
        if (status.qual.ranking.record) {
          const record = status.qual.ranking.record;
          eventData.record = `${record.wins}-${record.losses}-${record.ties}`;
        }
      }
      
      // Get awards from bulk response
      const eventAwards = awardsByEvent.get(event.key);
      if (eventAwards && eventAwards.length > 0) {
        eventData.awards = eventAwards.map(award => award.name).join(', ');
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
  }, [eventsData, statusesData, allAwards]);
  
  return {
    performanceData,
    isLoading: statusesLoading || awardsLoading,
  };
}
