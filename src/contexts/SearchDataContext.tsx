import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TBA_CONFIG } from '../config';

interface SearchTeam {
  key: string;
  team_number: number;
  nickname: string;
  name: string;
  city: string;
  state_prov: string;
  country: string;
  rookie_year: number;
}

interface SearchEvent {
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
}

interface SearchDataContextType {
  allTeams: SearchTeam[];
  allEvents: SearchEvent[];
  isLoading: boolean;
}

const SearchDataContext = createContext<SearchDataContextType | undefined>(undefined);

/** Fetch all FRC teams from TBA using paginated endpoint. */
async function fetchAllTeams(): Promise<SearchTeam[]> {
  const results: SearchTeam[] = [];
  const MAX_PAGES = 25;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(`${TBA_CONFIG.BASE_URL}/teams/${page}`, {
      headers: { 'X-TBA-Auth-Key': TBA_CONFIG.AUTH_KEY },
    });
    if (!res.ok) break;
    const data: SearchTeam[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
  }
  return results;
}

/** Fetch events for the current year window (previous 2 years through next year). */
async function fetchEvents(): Promise<SearchEvent[]> {
  const currentYear = new Date().getFullYear();
  const years = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];

  const eventsByYear = await Promise.all(
    years.map(async (year) => {
      try {
        const res = await fetch(`${TBA_CONFIG.BASE_URL}/events/${year}`, {
          headers: { 'X-TBA-Auth-Key': TBA_CONFIG.AUTH_KEY },
        });
        if (!res.ok) return [];
        return (await res.json()) as SearchEvent[];
      } catch {
        return [];
      }
    })
  );

  return eventsByYear.flat();
}

export function SearchDataProvider({ children }: { children: ReactNode }) {
  const [allTeams, setAllTeams] = useState<SearchTeam[]>([]);
  const [allEvents, setAllEvents] = useState<SearchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, eventsData] = await Promise.all([
          fetchAllTeams(),
          fetchEvents(),
        ]);
        setAllTeams(teamsData);
        setAllEvents(eventsData);
      } catch {
        // Data load failed - keep empty arrays
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <SearchDataContext.Provider value={{ allTeams, allEvents, isLoading }}>
      {children}
    </SearchDataContext.Provider>
  );
}

export function useSearchData() {
  const context = useContext(SearchDataContext);
  if (context === undefined) {
    throw new Error('useSearchData must be used within a SearchDataProvider');
  }
  return context;
}
