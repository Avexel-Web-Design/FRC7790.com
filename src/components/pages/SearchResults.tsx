import { useLocation, Link } from 'react-router-dom';
import { TBA_AUTH_KEY } from '../../utils/frcAPI';
import { useEffect, useState } from 'react';

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
  // districts removed per user request
  
  const [loading, setLoading] = useState(true);



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
    const res = await fetch(`https://www.thebluealliance.com/api/v3/events/${new Date().getFullYear()}`, {
      headers: { 'X-TBA-Auth-Key': TBA_AUTH_KEY }
    });
    return res.json();
  };

  useEffect(() => {
    const runSearch = async () => {
      setLoading(true);
      try {
        const [allTeams, allEvents] = await Promise.all([
          fetchAllTeams(),
          fetchEvents()
        ]);

        const normalizedQuery = query.toLowerCase();

        const computeScore = (q: string, target: string): number => {
          const lowerTarget = target.toLowerCase();
          if (lowerTarget.includes(q)) return 0; // exact / substring match ranks highest
          const dist = levenshtein(q, lowerTarget);
          return dist / Math.max(q.length, lowerTarget.length);
        };

        const scoredTeams = allTeams.map((t: any) => {
          const numberScore = computeScore(normalizedQuery, `${t.team_number}`);
          const nicknameScore = computeScore(normalizedQuery, t.nickname || '');
          return {
            team_number: t.team_number,
            nickname: t.nickname || '',
            score: Math.min(numberScore, nicknameScore)
          };
        });

        const scoredEvents = allEvents.map((e: any) => ({
          key: e.key,
          name: e.name,
          score: computeScore(normalizedQuery, e.name)
        }));

        

        scoredTeams.sort((a, b) => a.score - b.score);
        scoredEvents.sort((a, b) => a.score - b.score);
        

        const filteredTeams = scoredTeams.filter((t) => t.score < 0.8);
        const filteredEvents = scoredEvents.filter((e) => e.score < 0.8);
        

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
        alert('Error fetching data from The Blue Alliance API. Please ensure your API key is set in the .env file.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      runSearch();
    }
  }, [query]);

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

      {loading ? (
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
