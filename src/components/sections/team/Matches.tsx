import { useState, useEffect } from 'react';

interface TeamMatchesProps {
  teamNumber: string;
  teamData: any;
}

export default function TeamMatches({ teamNumber }: TeamMatchesProps) {
  const [eventsData, setEventsData] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [qualMatches, setQualMatches] = useState<any[]>([]);
  const [playoffMatches, setPlayoffMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();
        
        const response = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/events/${currentYear}`, {
          headers: {
            'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Sort events by start date (chronological order)
          const sortedData = data.sort((a: any, b: any) => {
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            return dateA.getTime() - dateB.getTime(); // Ascending order (earliest first)
          });
          
          setEventsData(sortedData);
          
          // Auto-select the first event if available
          if (sortedData.length > 0) {
            setSelectedEvent(sortedData[0].key);
          }
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (teamNumber) {
      fetchEvents();
    }
  }, [teamNumber]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!selectedEvent) {
        setQualMatches([]);
        setPlayoffMatches([]);
        return;
      }

      try {
        setMatchesLoading(true);
        
        const response = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${selectedEvent}/matches`, {
          headers: {
            'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
          }
        });
        
        if (response.ok) {
          const matches = await response.json();
          
          // Separate qualification and playoff matches
          const quals = matches.filter((match: any) => match.comp_level === 'qm');
          const playoffs = matches.filter((match: any) => match.comp_level !== 'qm');
          
          // Sort matches
          quals.sort((a: any, b: any) => a.match_number - b.match_number);
          playoffs.sort((a: any, b: any) => {
            // Sort by comp_level priority, then match_number
            const levelPriority: { [key: string]: number } = { 'ef': 1, 'qf': 2, 'sf': 3, 'f': 4 };
            const aPriority = levelPriority[a.comp_level] || 0;
            const bPriority = levelPriority[b.comp_level] || 0;
            
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            return a.match_number - b.match_number;
          });
          
          setQualMatches(quals);
          setPlayoffMatches(playoffs);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
        setQualMatches([]);
        setPlayoffMatches([]);
      } finally {
        setMatchesLoading(false);
      }
    };

    fetchMatches();
  }, [selectedEvent, teamNumber]);

  const formatMatchName = (match: any) => {
    const typeMap: { [key: string]: string } = {
      'qm': 'Q',
      'ef': 'QF',
      'qf': 'QF', 
      'sf': 'SF',
      'f': 'F'
    };
    
    const type = typeMap[match.comp_level] || match.comp_level.toUpperCase();
    return `${type}${match.match_number}`;
  };

  const formatTeamNumbers = (teamKeys: string[], currentTeam: string, alliance: 'blue' | 'red') => {
    return teamKeys.map((key, index) => {
      const teamNum = key.replace('frc', '');
      const isCurrentTeam = teamNum === currentTeam;
      
      return (
        <span key={key}>
          {index > 0 && ' '}
          <span
            className={`
              cursor-pointer transition-colors
              ${isCurrentTeam ? 'text-baywatch-orange font-bold' : 
                alliance === 'blue' ? 'text-blue-400 hover:text-blue-400' : 'text-red-400 hover:text-red-400'}
            `}
            onClick={() => window.location.href = `/team?team=${teamNum}`}
          >
            {teamNum}
          </span>
        </span>
      );
    });
  };

  const getMatchResult = (match: any) => {
    if (!match.alliances.blue.score || !match.alliances.red.score) {
      return { blue: '-', red: '-', winner: null };
    }

    const blueScore = match.alliances.blue.score;
    const redScore = match.alliances.red.score;
    
    return {
      blue: blueScore.toString(),
      red: redScore.toString(),
      winner: blueScore > redScore ? 'blue' : redScore > blueScore ? 'red' : 'tie'
    };
  };

  const renderMatchTable = (matches: any[], title: string) => {
    if (matchesLoading) {
      return (
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">{title}</h3>
          <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="p-4 text-baywatch-orange">Match</th>
                    <th className="p-4 text-baywatch-orange">Blue Alliance</th>
                    <th className="p-4 text-baywatch-orange">Red Alliance</th>
                    <th className="p-4 text-baywatch-orange">Score</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr>
                    <td colSpan={4} className="p-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-baywatch-orange/30 border-t-baywatch-orange rounded-full animate-spin"></div>
                        <span>Loading matches...</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <div className="bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="p-4 text-baywatch-orange">Match</th>
                  <th className="p-4 text-baywatch-orange">Blue Alliance</th>
                  <th className="p-4 text-baywatch-orange">Red Alliance</th>
                  <th className="p-4 text-baywatch-orange">Score</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {matches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-400">
                      <i className="fas fa-info-circle mr-2"></i>
                      {selectedEvent ? `No ${title.toLowerCase()} found for this event` : 'Select an event to view matches'}
                    </td>
                  </tr>
                ) : (
                  matches.map((match, index) => {
                    const result = getMatchResult(match);
                    
                    return (
                      <tr 
                        key={match.key} 
                        className={`
                          hover:bg-gray-800/50 transition-all duration-300
                        `}
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        <td className="p-4 font-semibold text-baywatch-orange">
                          {formatMatchName(match)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {formatTeamNumbers(match.alliances.blue.team_keys, teamNumber, 'blue')}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {formatTeamNumbers(match.alliances.red.team_keys, teamNumber, 'red')}
                          </div>
                        </td>
                        <td className="p-4">
                          {result.blue !== '-' && result.red !== '-' ? (
                            <div className="flex items-center space-x-2">
                              <span className={`${
                                result.winner === 'blue' ? 'text-blue-400 font-bold' : 'text-gray-400'
                              }`}>
                                {result.blue}
                              </span>
                              <span className="text-gray-500">-</span>
                              <span className={`${
                                result.winner === 'red' ? 'text-red-400 font-bold' : 'text-gray-400'
                              }`}>
                                {result.red}
                              </span>
                            </div>
                          ) : (
                            ''
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="tab-content py-8 relative z-10">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Match Schedule</h2>
          <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="text-center">
              <div className="text-gray-400 animate-pulse">Loading events...</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tab-content py-8 relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Match Schedule</h2>
        <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        {/* Event selector */}
        <div className="mb-6">
          <label htmlFor="event-selector" className="block text-sm font-medium text-gray-300 mb-3">
            Select Event:
          </label>
          <div className="relative">
            <select
              id="event-selector"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full appearance-none bg-black/40 rounded-lg border border-gray-700 hover:border-orange-500/50 focus:border-orange-500/70 transition-all duration-300 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {eventsData.map((event) => (
                <option key={event.key} value={event.key}>
                  {event.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-orange-500">
              <i className="fas fa-chevron-down transition-all duration-300"></i>
            </div>
          </div>
        </div>
        
          {/* Qualification Matches */}
          {renderMatchTable(qualMatches, 'Qualification Matches')}
          
          {/* Playoff Matches */}
          {renderMatchTable(playoffMatches, 'Playoff Matches')}
        </div>
      </div>
    </section>
  );
}
