/**
 * useTeamHistory - Fetches complete team history in ONE API call
 * 
 * Uses the /team/{team_key}/history endpoint which returns:
 * - All events the team has ever participated in
 * - All awards the team has ever won
 * 
 * This is ~30-50x faster than the previous approach which made
 * individual API calls for each event's awards.
 * 
 * Performance comparison:
 * - Before: 31+ HTTP requests (1 for events + 30 for awards)
 * - After: 1 HTTP request
 */

import { useMemo } from 'react';
import { useTeamHistoryData, fetchTBA } from './useTBA';
import type { TeamHistoryEvent, TeamHistoryAward } from './useTBA';

// Types
export interface EventWithAwards extends TeamHistoryEvent {
  awards: TeamHistoryAward[];
}

export interface YearData {
  year: number;
  events: EventWithAwards[];
}

/**
 * Hook for loading team history - now uses a single API call
 */
export function useTeamHistory(teamNumber: string | null) {
  const currentYear = new Date().getFullYear();
  
  // Single API call to get ALL events and ALL awards
  const { data: history, isLoading, error } = useTeamHistoryData(teamNumber);
  
  // Process the data client-side (instant, no network)
  const years = useMemo(() => {
    if (!history) return [];
    
    // Filter to historical events only (not current year)
    const historicalEvents = history.events.filter(e => e.year < currentYear);
    
    if (historicalEvents.length === 0) return [];
    
    // Create a map of eventKey -> awards for fast lookup
    const awardsByEvent = new Map<string, TeamHistoryAward[]>();
    for (const award of history.awards) {
      const existing = awardsByEvent.get(award.event_key) || [];
      existing.push(award);
      awardsByEvent.set(award.event_key, existing);
    }
    
    // Group events by year and attach awards
    const eventsByYear = new Map<number, EventWithAwards[]>();
    for (const event of historicalEvents) {
      const yearEvents = eventsByYear.get(event.year) || [];
      yearEvents.push({
        ...event,
        awards: awardsByEvent.get(event.key) || [],
      });
      eventsByYear.set(event.year, yearEvents);
    }
    
    // Sort events within each year by date
    eventsByYear.forEach((events) => {
      events.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    });
    
    // Convert to sorted array (newest years first)
    const sortedYears: YearData[] = [];
    const yearKeys = Array.from(eventsByYear.keys()).sort((a, b) => b - a);
    for (const year of yearKeys) {
      sortedYears.push({
        year,
        events: eventsByYear.get(year) || [],
      });
    }
    
    return sortedYears;
  }, [history, currentYear]);
  
  return {
    years,
    isLoading,
    // No longer needed but kept for API compatibility
    isLoadingAwards: false,
    progress: { totalEvents: 0, loadedEvents: 0 },
    error,
  };
}

/**
 * Prefetch team history (call before navigating to team page)
 */
export function prefetchTeamHistory(teamNumber: string): void {
  // Prefetch history endpoint - this gets everything in one call
  fetchTBA(`/team/frc${teamNumber}/history`).catch(() => {});
}
