/**
 * useTeamHistory - Progressive loading hook for team history
 * 
 * Features:
 * - Parallel fetching of all awards (not sequential!)
 * - Progressive rendering - shows years as they load
 * - Smart caching - historical data cached forever
 * - Instant loading on return visits
 */

import { useState, useEffect, useRef } from 'react';
import { useAllTeamEvents, fetchTBA } from './useTBA';
import { cacheUtils } from '../utils/swrCache';

// Types
interface Award {
  name: string;
  award_type: number;
  event_key: string;
  year: number;
}

interface TeamEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  start_date: string;
  end_date: string;
  year: number;
}

interface EventWithAwards extends TeamEvent {
  awards: Award[];
  awardsLoaded: boolean;
}

interface YearData {
  year: number;
  events: EventWithAwards[];
  loading: boolean;
  loaded: boolean;
}

interface TeamHistoryState {
  years: Map<number, YearData>;
  isInitialLoading: boolean;
  isLoadingAwards: boolean;
  progress: {
    totalEvents: number;
    loadedEvents: number;
  };
}

/**
 * Hook for loading team history with progressive rendering
 */
export function useTeamHistory(teamNumber: string | null) {
  const currentYear = new Date().getFullYear();
  
  // Get all team events using SWR (cached)
  const { data: allEvents, isLoading: eventsLoading, error: eventsError } = useAllTeamEvents(teamNumber);
  
  // State for progressive loading
  const [state, setState] = useState<TeamHistoryState>({
    years: new Map(),
    isInitialLoading: true,
    isLoadingAwards: false,
    progress: { totalEvents: 0, loadedEvents: 0 },
  });
  
  // Track if we've started loading awards for this team
  const loadingRef = useRef<string | null>(null);
  
  // Process events when they arrive
  useEffect(() => {
    if (!allEvents || !teamNumber) return;
    
    // Skip current year events (shown in Overview)
    const historicalEvents = allEvents.filter(e => e.year < currentYear);
    
    if (historicalEvents.length === 0) {
      setState({
        years: new Map(),
        isInitialLoading: false,
        isLoadingAwards: false,
        progress: { totalEvents: 0, loadedEvents: 0 },
      });
      return;
    }
    
    // Group events by year
    const eventsByYear = new Map<number, TeamEvent[]>();
    for (const event of historicalEvents) {
      const yearEvents = eventsByYear.get(event.year) || [];
      yearEvents.push(event);
      eventsByYear.set(event.year, yearEvents);
    }
    
    // Sort events within each year by date
    eventsByYear.forEach((events) => {
      events.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    });
    
    // Initialize year data with events (awards not loaded yet)
    const years = new Map<number, YearData>();
    eventsByYear.forEach((events, year) => {
      years.set(year, {
        year,
        events: events.map(e => ({
          ...e,
          awards: [],
          awardsLoaded: false,
        })),
        loading: true,
        loaded: false,
      });
    });
    
    setState(prev => ({
      ...prev,
      years,
      isInitialLoading: false,
      isLoadingAwards: true,
      progress: { totalEvents: historicalEvents.length, loadedEvents: 0 },
    }));
    
    // Prevent duplicate award loading
    if (loadingRef.current === teamNumber) return;
    loadingRef.current = teamNumber;
    
    // Load awards for all events in parallel with progressive updates
    loadAwardsProgressively(teamNumber, years, (updatedYears, loadedCount) => {
      setState(prev => ({
        ...prev,
        years: updatedYears,
        progress: { ...prev.progress, loadedEvents: loadedCount },
      }));
    }).then((finalYears) => {
      setState(prev => ({
        ...prev,
        years: finalYears,
        isLoadingAwards: false,
        progress: { ...prev.progress, loadedEvents: prev.progress.totalEvents },
      }));
    });
  }, [allEvents, teamNumber, currentYear]);
  
  // Reset when team changes
  useEffect(() => {
    if (teamNumber !== loadingRef.current) {
      loadingRef.current = null;
      setState({
        years: new Map(),
        isInitialLoading: true,
        isLoadingAwards: false,
        progress: { totalEvents: 0, loadedEvents: 0 },
      });
    }
  }, [teamNumber]);
  
  // Convert Map to sorted array for rendering
  const sortedYears = Array.from(state.years.values())
    .sort((a, b) => b.year - a.year);
  
  return {
    years: sortedYears,
    isLoading: eventsLoading || state.isInitialLoading,
    isLoadingAwards: state.isLoadingAwards,
    progress: state.progress,
    error: eventsError,
  };
}

/**
 * Load awards for all events in parallel with progressive updates
 */
async function loadAwardsProgressively(
  teamNumber: string,
  years: Map<number, YearData>,
  onProgress: (years: Map<number, YearData>, loadedCount: number) => void
): Promise<Map<number, YearData>> {
  const allEvents: { year: number; eventIndex: number; eventKey: string }[] = [];
  
  // Collect all events that need awards loaded
  years.forEach((yearData, year) => {
    yearData.events.forEach((event, index) => {
      allEvents.push({ year, eventIndex: index, eventKey: event.key });
    });
  });
  
  // Create a mutable copy of years
  const updatedYears = new Map(years);
  let loadedCount = 0;
  
  // Fetch awards for all events in parallel
  const awardPromises = allEvents.map(async ({ year, eventIndex, eventKey }) => {
    const cacheKey = `/team/frc${teamNumber}/event/${eventKey}/awards`;
    
    // Check cache first
    let awards = cacheUtils.get<Award[]>(cacheKey);
    
    if (!awards) {
      try {
        awards = await fetchTBA<Award[]>(cacheKey);
      } catch (error) {
        console.warn(`Failed to fetch awards for ${eventKey}:`, error);
        awards = [];
      }
    }
    
    // Update the year data
    const yearData = updatedYears.get(year);
    if (yearData) {
      const updatedEvents = [...yearData.events];
      updatedEvents[eventIndex] = {
        ...updatedEvents[eventIndex],
        awards: awards || [],
        awardsLoaded: true,
      };
      
      // Check if all events in this year are loaded
      const allLoaded = updatedEvents.every(e => e.awardsLoaded);
      
      updatedYears.set(year, {
        ...yearData,
        events: updatedEvents,
        loading: !allLoaded,
        loaded: allLoaded,
      });
    }
    
    loadedCount++;
    
    // Report progress (throttled to avoid too many re-renders)
    if (loadedCount % 3 === 0 || loadedCount === allEvents.length) {
      onProgress(new Map(updatedYears), loadedCount);
    }
    
    return { year, eventIndex, awards };
  });
  
  // Wait for all to complete
  await Promise.all(awardPromises);
  
  // Mark all years as loaded
  updatedYears.forEach((yearData, year) => {
    updatedYears.set(year, {
      ...yearData,
      loading: false,
      loaded: true,
    });
  });
  
  return updatedYears;
}

/**
 * Prefetch team history (call before navigating to team page)
 */
export function prefetchTeamHistory(teamNumber: string): void {
  // Prefetch all events - SWR will cache this
  fetchTBA(`/team/frc${teamNumber}/events`).catch(() => {});
  
  // Also prefetch team info
  fetchTBA(`/team/frc${teamNumber}`).catch(() => {});
}
