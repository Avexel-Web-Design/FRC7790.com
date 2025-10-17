import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSearchData } from '../../contexts/SearchDataContext';

/* global process */
// Declare process.env for CRA without @types/node
declare const process: {
  env: {
    REACT_APP_TBA_KEY?: string;
  };
};

export default function SearchResults() {
  type TabType = 'teams' | 'events';
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get('q') || '';

  const [activeTab, setActiveTab] = useState<TabType>('teams');

  const [teams, setTeams] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  
  // Get pre-loaded data from context
  const { allTeams, allEvents, isLoading: dataLoading } = useSearchData();



// Simple Levenshtein distance implementation
  const levenshtein = (a: string, b: string): number => {
    const matrix: number[][] = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  };

  // Filter and search whenever query changes
  useEffect(() => {
    const runSearch = () => {
      // Wait for data to be loaded
      if (dataLoading) {
        setLoading(true);
        return;
      }

      // If data is loaded but empty, don't search
      if (allTeams.length === 0 || allEvents.length === 0) {
        setLoading(false);
        return;
      }

      if (!query) {
        setLoading(false);
        setTeams([]);
        setEvents([]);
        return;
      }

      setLoading(true);
      
      try {
        const normalizedQuery = query.toLowerCase();
        const currentYear = new Date().getFullYear();
        
        // Check if query contains a year (4 consecutive digits)
        const yearInQuery = /\d{4}/.test(query);

        const computeScore = (q: string, target: string): number => {
          const lowerTarget = target.toLowerCase();
          
          // Fast path: exact substring match
          if (lowerTarget.includes(q)) return 0;
          
          // Fast reject: if lengths are too different, skip expensive computation
          const lengthDiff = Math.abs(q.length - lowerTarget.length);
          if (lengthDiff > Math.max(q.length, lowerTarget.length) * 0.8) {
            return 1; // Score of 1 = will be filtered out
          }
          
          const dist = levenshtein(q, lowerTarget);
          return dist / Math.max(q.length, lowerTarget.length);
        };

        const scoredTeams = allTeams
          .map((t: any) => {
            const teamNumberStr = `${t.team_number}`;
            const nickname = t.nickname || '';
            
            // Quick substring check before expensive computation
            if (teamNumberStr.includes(normalizedQuery) || nickname.toLowerCase().includes(normalizedQuery)) {
              return {
                team_number: t.team_number,
                nickname: nickname,
                score: 0 // Perfect match
              };
            }
            
            const numberScore = computeScore(normalizedQuery, teamNumberStr);
            const nicknameScore = computeScore(normalizedQuery, nickname);
            return {
              team_number: t.team_number,
              nickname: nickname,
              score: Math.min(numberScore, nicknameScore)
            };
          })
          .filter((t) => t.score < 0.8); // Filter early to reduce sort size

        const scoredEvents = allEvents
          .map((e: any) => {
            // Extract year from event key (format: 2025miket)
            const eventYear = parseInt(e.key.substring(0, 4));
            
            return {
              key: e.key,
              name: e.name,
              year: eventYear,
              score: computeScore(normalizedQuery, e.name)
            };
          })
          .filter((e) => e.score < 0.8); // Filter early

        

        scoredTeams.sort((a, b) => a.score - b.score);
        
        // Sort events by score first, then by year (newest first) as tiebreaker
        scoredEvents.sort((a, b) => {
          if (a.score !== b.score) {
            return a.score - b.score; // Better score (lower) first
          }
          return b.year - a.year; // Then newer year first
        });
        

        // Teams already filtered above, no need to filter again
        const filteredTeams = scoredTeams;
        
        // Filter events by year: exclude events 3+ years old UNLESS year is in query
        const filteredEvents = scoredEvents.filter((e) => {
          const yearDiff = currentYear - e.year;
          
          // If year is in query, show all events regardless of age
          if (yearInQuery) return true;
          
          // Otherwise, only show events from the last 2 years (and next year)
          return yearDiff >= -1 && yearDiff <= 2;
        });
        

        setTeams(filteredTeams.slice(0, 15));
        setEvents(filteredEvents.slice(0, 15));
        

        // Keep current tab if it still has results; otherwise switch to the other tab
        if (activeTab === 'teams' && filteredTeams.length === 0 && filteredEvents.length) {
          setActiveTab('events');
        } else if (activeTab === 'events' && filteredEvents.length === 0 && filteredTeams.length) {
          setActiveTab('teams');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [query, allTeams, allEvents, dataLoading, activeTab]);

  return (
    <div className="-mb-32 bg-black min-h-screen w-full text-white">
      <div className="container mx-auto p-40">
      {/* Tabs */}
      <div className="mb-6 flex w-full border-b border-gray-700">
        {(['teams', 'events'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center pb-2 capitalize transition-colors duration-200 ${
              activeTab === tab ? 'text-baywatch-orange border-b-2 border-baywatch-orange' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <p className="text-gray-400">Loading teams and events data...</p>
      ) : loading ? (
        <p className="text-gray-400">Searching...</p>
      ) : (
        <>
          <h1 className="text-3xl font-bold">
            Search results for "{query}"
          </h1>

          {/* Teams Section */}
          {activeTab === 'teams' && teams.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <Link key={t.team_number} to={`/team?team=${t.team_number}`} className="block card-gradient p-4 rounded-lg border border-gray-700 hover:border-baywatch-orange transition transform hover:-translate-y-1">
                <h3 className="text-xl font-bold text-baywatch-orange">Team {t.team_number}</h3>
                {t.nickname && <p className="text-gray-300 mt-1">{t.nickname}</p>}
              </Link>
            ))}
          </section> )}

          {/* Events Section */}
          {activeTab === 'events' && events.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => (
              <Link key={e.key} to={`/event?event=${e.key}`} className="block card-gradient p-4 rounded-lg border border-gray-700 hover:border-baywatch-orange transition transform hover:-translate-y-1">
                <h3 className="text-lg font-semibold text-baywatch-orange">{e.name}</h3>
                <p className="text-gray-400 mt-1">{e.key}</p>
              </Link>
            ))}
          </section> )}


        </>
      )}

      </div>
    </div>
  );
}
