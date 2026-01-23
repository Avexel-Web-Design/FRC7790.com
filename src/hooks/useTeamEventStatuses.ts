/**
 * useTeamEventStatuses - Bulk fetching of team event statuses
 * 
 * Now uses the bulk endpoint /team/frc{teamNumber}/events/{year}/statuses
 * which returns ALL event statuses for a year in ONE request.
 * 
 * Performance improvement:
 * - Before: N HTTP requests (one per event)
 * - After: 1 HTTP request per year
 */

import { useMemo } from 'react';
import { useTeamYearStatuses } from './useTBA';
import type { EventStatus } from './useTBA';

interface UseTeamEventStatusesResult {
  statuses: Map<string, EventStatus | null>;
  isLoading: boolean;
  stats: {
    avgRanking: number | null;
    winRate: number | null;
    totalWins: number;
    totalLosses: number;
    totalTies: number;
    totalMatches: number;
    eventsWithData: number;
  };
}

/**
 * Hook for fetching team statuses at multiple events
 * Uses the bulk endpoint for a single year
 */
export function useTeamEventStatuses(
  teamNumber: string | null,
  eventKeys: string[],
  year?: number
): UseTeamEventStatusesResult {
  const targetYear = year ?? new Date().getFullYear();
  
  // Single API call to get ALL statuses for the year
  const { data: statusesData, isLoading } = useTeamYearStatuses(teamNumber, targetYear);
  
  // Filter to only the events we care about
  const statuses = useMemo(() => {
    const result = new Map<string, EventStatus | null>();
    
    if (!statusesData) {
      // Return empty map with null values for requested events
      for (const eventKey of eventKeys) {
        result.set(eventKey, null);
      }
      return result;
    }
    
    // Map the requested events to their statuses
    for (const eventKey of eventKeys) {
      const status = statusesData[eventKey] ?? null;
      result.set(eventKey, status);
    }
    
    return result;
  }, [statusesData, eventKeys]);
  
  // Calculate aggregate stats
  const stats = useMemo(() => calculateStats(statuses), [statuses]);
  
  return {
    statuses,
    isLoading,
    stats,
  };
}

/**
 * Calculate aggregate statistics from event statuses
 */
function calculateStats(statuses: Map<string, EventStatus | null>) {
  let totalRank = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalTies = 0;
  let eventsWithRanking = 0;
  
  statuses.forEach((status) => {
    if (status?.qual?.ranking) {
      totalRank += status.qual.ranking.rank;
      eventsWithRanking++;
      
      if (status.qual.ranking.record) {
        totalWins += status.qual.ranking.record.wins;
        totalLosses += status.qual.ranking.record.losses;
        totalTies += status.qual.ranking.record.ties;
      }
    }
  });
  
  const totalMatches = totalWins + totalLosses + totalTies;
  
  return {
    avgRanking: eventsWithRanking > 0 ? totalRank / eventsWithRanking : null,
    winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : null,
    totalWins,
    totalLosses,
    totalTies,
    totalMatches,
    eventsWithData: eventsWithRanking,
  };
}
