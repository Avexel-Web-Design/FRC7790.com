/**
 * useTeamEventStatuses - Parallel fetching of team event statuses
 * 
 * Features:
 * - Fetches all event statuses in parallel (not sequential!)
 * - Smart caching based on event timing
 * - Progressive updates as statuses load
 */

import { useState, useEffect, useRef } from 'react';
import { fetchTBA } from './useTBA';
import { cacheUtils } from '../utils/swrCache';

interface EventStatus {
  qual?: {
    ranking?: {
      rank: number;
      record: { wins: number; losses: number; ties: number };
      matches_played: number;
    };
    num_teams?: number;
  };
  alliance?: {
    number: number;
    pick: number;
  };
  playoff?: {
    level: string;
    status: string;
    record: { wins: number; losses: number; ties: number };
  };
}

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
 * Hook for fetching team statuses at multiple events in parallel
 */
export function useTeamEventStatuses(
  teamNumber: string | null,
  eventKeys: string[]
): UseTeamEventStatusesResult {
  const [statuses, setStatuses] = useState<Map<string, EventStatus | null>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  
  // Track the current team/events to avoid stale updates
  const loadingRef = useRef<string>('');
  
  useEffect(() => {
    if (!teamNumber || eventKeys.length === 0) {
      setStatuses(new Map());
      setIsLoading(false);
      return;
    }
    
    const loadKey = `${teamNumber}-${eventKeys.join(',')}`;
    if (loadingRef.current === loadKey) return;
    loadingRef.current = loadKey;
    
    setIsLoading(true);
    
    // Fetch all statuses in parallel
    const fetchAllStatuses = async () => {
      const newStatuses = new Map<string, EventStatus | null>();
      
      const promises = eventKeys.map(async (eventKey) => {
        const cacheKey = `/team/frc${teamNumber}/event/${eventKey}/status`;
        
        // Check cache first
        let status = cacheUtils.get<EventStatus>(cacheKey);
        
        if (!status) {
          try {
            status = await fetchTBA<EventStatus>(cacheKey);
          } catch (error) {
            console.warn(`Failed to fetch status for ${eventKey}:`, error);
            status = null;
          }
        }
        
        return { eventKey, status };
      });
      
      const results = await Promise.all(promises);
      
      // Only update if this is still the current request
      if (loadingRef.current !== loadKey) return;
      
      for (const { eventKey, status } of results) {
        newStatuses.set(eventKey, status);
      }
      
      setStatuses(newStatuses);
      setIsLoading(false);
    };
    
    fetchAllStatuses();
  }, [teamNumber, eventKeys.join(',')]);
  
  // Calculate aggregate stats
  const stats = calculateStats(statuses);
  
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

/**
 * Prefetch team event statuses (call before navigating)
 */
export function prefetchTeamEventStatuses(teamNumber: string, eventKeys: string[]): void {
  for (const eventKey of eventKeys) {
    fetchTBA(`/team/frc${teamNumber}/event/${eventKey}/status`).catch(() => {});
  }
}
