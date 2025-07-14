import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTeamCardGradientClass, getTeamAccentStyle, getTeamColor } from '../../../utils/color';

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
          
          // Sort playoffs chronologically - semifinals first by set_number then match_number, then finals
          playoffs.sort((a: any, b: any) => {
            // If both are semifinals, sort by set_number then match_number
            if (a.comp_level === 'sf' && b.comp_level === 'sf') {
              return (a.set_number - b.set_number) || (a.match_number - b.match_number);
            }
            
            // If both are finals, sort by match_number
            if (a.comp_level === 'f' && b.comp_level === 'f') {
              return a.match_number - b.match_number;
            }
            
            // Semifinals come before finals
            if (a.comp_level === 'sf' && b.comp_level === 'f') {
              return -1;
            }
            if (a.comp_level === 'f' && b.comp_level === 'sf') {
              return 1;
            }
            
            // For any other comp_levels, use original logic
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

  const formatMatchName = (match: any, _allPlayoffMatches: any[]) => {
    if (match.comp_level === 'qm') {
      return `Q${match.match_number}`;
    }
    
    if (match.comp_level === 'ef') {
      return `QF${match.set_number}-${match.match_number}`;
    }
    
    if (match.comp_level === 'qf') {
      return `QF${match.set_number}-${match.match_number}`;
    }
    
    if (match.comp_level === 'sf') {
      // Use "Playoff" prefix and remove the "-1" suffix for semifinals
      return `SF${match.set_number}`;
    }
    
    if (match.comp_level === 'f') {
      if (match.match_number === 4) {
        return 'OT1';
      } else if (match.match_number === 5) {
        return 'OT2';
      } else {
        return `F${match.match_number}`;
      }
    }
    
    // Fallback for any other competition levels
    return `${match.comp_level.toUpperCase()}${match.match_number}`;
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
              cursor-pointer transition-colors font-bold
              ${isCurrentTeam ? '' : 
                alliance === 'blue' ? 'text-blue-400 hover:text-blue-400' : 'text-red-400 hover:text-red-400'}
            `}
            style={isCurrentTeam ? getTeamAccentStyle(teamNumber) : undefined}
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
          <div className={`${getTeamCardGradientClass(teamNumber)} backdrop-blur-sm rounded-xl p-6 border border-gray-700/50`}>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="text-left">
                    <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Match</th>
                    <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Blue Alliance</th>
                    <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Red Alliance</th>
                    <th className="p-4 font-bold" style={getTeamAccentStyle(teamNumber)}>Score</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr>
                    <td colSpan={4} className="p-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div 
                          className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{
                            borderColor: `${getTeamColor(teamNumber) || '#f97316'}30`,
                            borderTopColor: getTeamColor(teamNumber) || '#f97316'
                          }}
                        ></div>
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
        <h3 className="text-2xl font-bold mb-4 px-6 sm:px-0">{title}</h3>
        <div className="sm:bg-black/50 backdrop-blur-sm sm:rounded-xl p-6 sm:border sm:border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="p-4" style={getTeamAccentStyle(teamNumber)}>Match</th>
                  <th className="p-4" style={getTeamAccentStyle(teamNumber)}>Blue Alliance</th>
                  <th className="p-4" style={getTeamAccentStyle(teamNumber)}>Red Alliance</th>
                  <th className="p-4" style={getTeamAccentStyle(teamNumber)}>Score</th>
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
                        <td className="p-4 font-semibold" style={getTeamAccentStyle(teamNumber)}>
                          <Link
                            to={`/match?match=${match.key}`}
                            className="inline-flex items-center hover:text-white transition-colors"
                          >
                            {formatMatchName(match, playoffMatches)} <i className="fas fa-arrow-up-right-from-square ml-0.5"></i>
                          </Link>
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
        <div className="container mx-auto sm:px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Match Schedule</h2>
          <div className={`${getTeamCardGradientClass(teamNumber)} backdrop-blur-sm sm:rounded-xl sm:p-6 border-y sm:border border-gray-700/50`}>
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
      <div className="container mx-auto sm:px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Match Schedule</h2>
        <div className={`${getTeamCardGradientClass(teamNumber)} backdrop-blur-sm sm:rounded-xl sm:px-6 py-6 border-y sm:border border-gray-700/50`}>
        {/* Event selector */}
        <div className="mb-6 px-6 sm:px-0">
          <label htmlFor="event-selector" className="block text-sm font-medium text-gray-300 mb-3">
            Select Event:
          </label>
          <div className="relative">
            <select
              id="event-selector"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full appearance-none bg-black/40 rounded-lg border border-gray-700 transition-all duration-300 px-4 py-3 text-white focus:outline-none"
              style={{
                borderColor: selectedEvent ? `${getTeamColor(teamNumber)}50` : '#374151',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = `${getTeamColor(teamNumber)}70`;
                e.target.style.boxShadow = `0 0 0 2px ${getTeamColor(teamNumber)}30`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = selectedEvent ? `${getTeamColor(teamNumber)}50` : '#374151';
                e.target.style.boxShadow = '';
              }}
            >
              {eventsData.map((event) => (
                <option key={event.key} value={event.key}>
                  {event.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4" style={getTeamAccentStyle(teamNumber)}>
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
