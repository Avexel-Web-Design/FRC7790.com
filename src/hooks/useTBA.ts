/**
 * useTBA - Base SWR hook for The Blue Alliance API
 * 
 * Provides:
 * - Automatic caching with smart TTL based on data type
 * - Request deduplication (same URL = single request)
 * - Stale-while-revalidate (instant loads with background refresh)
 * - Error handling with retries
 */

import useSWR from 'swr';
import type { SWRConfiguration, SWRResponse } from 'swr';
import { TBA_CONFIG, CACHE_CONFIG } from '../config';
import { cacheUtils } from '../utils/swrCache';

// TBA API fetcher with caching
async function tbaFetcher<T>(endpoint: string): Promise<T> {
  const url = `${TBA_CONFIG.BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'X-TBA-Auth-Key': TBA_CONFIG.AUTH_KEY,
    },
  });
  
  if (!response.ok) {
    const error = new Error(`TBA API error: ${response.status} ${response.statusText}`);
    (error as any).status = response.status;
    throw error;
  }
  
  const data = await response.json();
  
  // Store in our cache utility for direct access
  cacheUtils.set(endpoint, data);
  
  return data;
}

// Determine revalidation settings based on endpoint
function getRevalidationConfig(endpoint: string): Partial<SWRConfiguration> {
  const currentYear = new Date().getFullYear();
  
  // Historical data - never revalidate
  if (endpoint.includes('/events') && !endpoint.includes(currentYear.toString()) && !endpoint.endsWith('/events')) {
    return {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: CACHE_CONFIG.HISTORICAL_TTL,
    };
  }
  
  // All-time events endpoint
  if (endpoint.match(/\/team\/frc\d+\/events$/)) {
    return {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: CACHE_CONFIG.TEAM_INFO_TTL,
    };
  }
  
  // Team basic info
  if (endpoint.match(/\/team\/frc\d+$/) && !endpoint.includes('/event')) {
    return {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: CACHE_CONFIG.TEAM_INFO_TTL,
    };
  }
  
  // Historical awards
  if (endpoint.includes('/awards')) {
    const yearMatch = endpoint.match(/(\d{4})/);
    if (yearMatch && parseInt(yearMatch[1], 10) < currentYear) {
      return {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: CACHE_CONFIG.HISTORICAL_TTL,
      };
    }
  }
  
  // Live data (rankings, matches, status)
  if (endpoint.includes('/rankings') || endpoint.includes('/matches') || endpoint.includes('/status')) {
    return {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      refreshInterval: CACHE_CONFIG.LIVE_DATA_TTL,
      dedupingInterval: CACHE_CONFIG.LIVE_DATA_TTL / 2,
    };
  }
  
  // Current year events
  if (endpoint.includes('/events/') && endpoint.includes(currentYear.toString())) {
    return {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: CACHE_CONFIG.CURRENT_EVENTS_TTL,
    };
  }
  
  // Default
  return {
    revalidateOnFocus: true,
    revalidateIfStale: true,
    dedupingInterval: CACHE_CONFIG.DEFAULT_TTL,
  };
}

/**
 * Base hook for TBA API calls
 */
export function useTBA<T>(
  endpoint: string | null,
  config?: SWRConfiguration<T>
): SWRResponse<T, Error> {
  const revalidationConfig = endpoint ? getRevalidationConfig(endpoint) : {};
  
  return useSWR<T, Error>(
    endpoint,
    endpoint ? () => tbaFetcher<T>(endpoint) : null,
    {
      // Try to use cached data first
      fallbackData: endpoint ? cacheUtils.get<T>(endpoint) ?? undefined : undefined,
      ...revalidationConfig,
      ...config,
    }
  );
}

/**
 * Hook for fetching team basic info
 */
export function useTeamInfo(teamNumber: string | null) {
  return useTBA<{
    key: string;
    team_number: number;
    nickname: string;
    name: string;
    city: string;
    state_prov: string;
    country: string;
    rookie_year: number;
    motto?: string;
    website?: string;
  }>(teamNumber ? `/team/frc${teamNumber}` : null);
}

/**
 * Hook for fetching team events for a specific year
 */
export function useTeamYearEvents(teamNumber: string | null, year?: number) {
  const targetYear = year ?? new Date().getFullYear();
  return useTBA<Array<{
    key: string;
    name: string;
    event_code: string;
    event_type: number;
    start_date: string;
    end_date: string;
    year: number;
    city?: string;
    state_prov?: string;
  }>>(teamNumber ? `/team/frc${teamNumber}/events/${targetYear}` : null);
}

/**
 * Hook for fetching ALL team events (all years)
 */
export function useAllTeamEvents(teamNumber: string | null) {
  return useTBA<Array<{
    key: string;
    name: string;
    event_code: string;
    event_type: number;
    start_date: string;
    end_date: string;
    year: number;
  }>>(teamNumber ? `/team/frc${teamNumber}/events` : null);
}

/**
 * Hook for fetching team awards at an event
 */
export function useTeamEventAwards(teamNumber: string | null, eventKey: string | null) {
  return useTBA<Array<{
    name: string;
    award_type: number;
    event_key: string;
    recipient_list: Array<{ team_key: string; awardee?: string }>;
    year: number;
  }>>(teamNumber && eventKey ? `/team/frc${teamNumber}/event/${eventKey}/awards` : null);
}

/**
 * Hook for fetching team status at an event
 */
export function useTeamEventStatus(teamNumber: string | null, eventKey: string | null) {
  return useTBA<{
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
  }>(teamNumber && eventKey ? `/team/frc${teamNumber}/event/${eventKey}/status` : null);
}

/**
 * Hook for fetching event details
 */
export function useEvent(eventKey: string | null) {
  return useTBA<{
    key: string;
    name: string;
    event_code: string;
    event_type: number;
    start_date: string;
    end_date: string;
    year: number;
    city?: string;
    state_prov?: string;
    country?: string;
    week?: number;
  }>(eventKey ? `/event/${eventKey}` : null);
}

/**
 * Hook for fetching event rankings
 */
export function useEventRankings(eventKey: string | null) {
  return useTBA<{
    rankings: Array<{
      rank: number;
      team_key: string;
      record: { wins: number; losses: number; ties: number };
      matches_played: number;
      sort_orders: number[];
    }>;
  }>(eventKey ? `/event/${eventKey}/rankings` : null);
}

/**
 * Direct fetch function for use outside of React components
 * or for batch operations
 */
export async function fetchTBA<T>(endpoint: string): Promise<T> {
  // Check cache first
  const cached = cacheUtils.get<T>(endpoint);
  if (cached !== null) {
    return cached;
  }
  
  return tbaFetcher<T>(endpoint);
}

/**
 * Batch fetch multiple endpoints in parallel
 */
export async function batchFetchTBA<T>(endpoints: string[]): Promise<Map<string, T>> {
  const results = new Map<string, T>();
  
  // Check cache for each endpoint
  const uncachedEndpoints: string[] = [];
  for (const endpoint of endpoints) {
    const cached = cacheUtils.get<T>(endpoint);
    if (cached !== null) {
      results.set(endpoint, cached);
    } else {
      uncachedEndpoints.push(endpoint);
    }
  }
  
  // Fetch uncached endpoints in parallel
  if (uncachedEndpoints.length > 0) {
    const fetchPromises = uncachedEndpoints.map(async (endpoint) => {
      try {
        const data = await tbaFetcher<T>(endpoint);
        return { endpoint, data, success: true as const };
      } catch (error) {
        console.error(`Failed to fetch ${endpoint}:`, error);
        return { endpoint, data: null as T, success: false as const };
      }
    });
    
    const fetchResults = await Promise.all(fetchPromises);
    
    for (const result of fetchResults) {
      if (result.success && result.data !== null) {
        results.set(result.endpoint, result.data);
      }
    }
  }
  
  return results;
}
