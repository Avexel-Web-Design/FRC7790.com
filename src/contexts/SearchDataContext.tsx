import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { TBA_AUTH_KEY } from '../utils/frcAPI';

interface SearchDataContextType {
  allTeams: any[];
  allEvents: any[];
  isLoading: boolean;
}

const SearchDataContext = createContext<SearchDataContextType | undefined>(undefined);

export function SearchDataProvider({ children }: { children: ReactNode }) {
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllTeams = async (): Promise<any[]> => {
      const results: any[] = [];
      let page = 0;
      while (true) {
        const res = await fetch(`https://www.thebluealliance.com/api/v3/teams/${page}`, {
          headers: {
            'X-TBA-Auth-Key': TBA_AUTH_KEY
          }
        });
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) break;
        results.push(...data);
        page += 1;
      }
      return results;
    };

    const fetchEvents = async (): Promise<any[]> => {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      // Fetch events from multiple years
      const years = [nextYear, currentYear, currentYear - 1, currentYear - 2];
      const eventPromises = years.map(year =>
        fetch(`https://www.thebluealliance.com/api/v3/events/${year}`, {
          headers: { 'X-TBA-Auth-Key': TBA_AUTH_KEY }
        }).then(res => res.json())
      );
      
      const eventsByYear = await Promise.all(eventPromises);
      // Flatten all events into one array
      return eventsByYear.flat();
    };

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [teamsData, eventsData] = await Promise.all([
          fetchAllTeams(),
          fetchEvents()
        ]);
        setAllTeams(teamsData);
        setAllEvents(eventsData);
      } catch (err) {
        console.error('Error pre-loading search data:', err);
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
