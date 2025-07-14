import React, { useMemo } from 'react';
import NebulaLoader from '../../common/NebulaLoader';
import { Link } from 'react-router-dom';
import type { Match } from '../../../hooks/useEventData';
import { getTeamColor } from '../../../utils/color';

interface ScheduleProps {
  matches: Match[];
  isLoading: boolean;
}

const Schedule: React.FC<ScheduleProps> = ({ matches, isLoading }) => {
  const formatTeamNumber = (teamKey: string): string => {
    return teamKey.replace('frc', '');
  };

  const formatMatchName = (match: Match): string => {
    return `Q${match.match_number}`;
  };

  const formatMatchTime = (match: Match): string => {
    if (!match.predicted_time) return 'TBD';
    
    const matchTime = new Date(match.predicted_time * 1000);
    return matchTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatScore = (match: Match): React.ReactNode => {
    if (!match.alliances.blue.score && !match.alliances.red.score) {
      return '';
    }
    
    const blueScore = match.alliances.blue.score;
    const redScore = match.alliances.red.score;
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`${
          match.winning_alliance === 'blue' ? 'text-blue-400 font-bold' : 'text-gray-400'
        }`}>
          {blueScore}
        </span>
        <span className="text-gray-500">-</span>
        <span className={`${
          match.winning_alliance === 'red' ? 'text-red-400 font-bold' : 'text-gray-400'
        }`}>
          {redScore}
        </span>
      </div>
    );
  };

  const isWinningTeam = (match: Match, teamKey: string, alliance: 'blue' | 'red'): boolean => {
    return match.winning_alliance === alliance && 
           match.alliances[alliance].team_keys.includes(teamKey);
  };

  const isTeam7790Playing = (match: Match): boolean => {
    const allTeams = [
      ...match.alliances.blue.team_keys,
      ...match.alliances.red.team_keys
    ];
    return allTeams.includes('frc7790');
  };

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => a.match_number - b.match_number);
  }, [matches]);

  const handleTeamClick = (teamNumber: string) => {
    window.location.href = `/team?team=${teamNumber}`;
  };

  return (
    <section className="tab-content py-8 relative z-10">
      <div className="container mx-auto sm:px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Match Schedule</h2>
        
        <div className="card-gradient backdrop-blur-sm rounded-xl sm:px-6 py-6 border border-gray-700/50">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left">
                  <th className="p-2 sm:p-4 text-baywatch-orange">Match</th>
                  <th className="p-2 sm:p-4 text-baywatch-orange">Time</th>
                  <th className="p-2 sm:p-4 text-baywatch-orange">Blue Alliance</th>
                  <th className="p-2 sm:p-4 text-baywatch-orange">Red Alliance</th>
                  <th className="p-2 sm:p-4 text-baywatch-orange">Score</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <NebulaLoader size={24} />
                        <span>Loading schedule...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedMatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400">
                      <i className="fas fa-info-circle mr-2"></i>
                      No matches scheduled yet
                    </td>
                  </tr>
                ) : (
                  sortedMatches.map((match, index) => {
                    const isOurMatch = isTeam7790Playing(match);
                    
                    return (
                      <tr
                        key={match.key}
                        className={`
                          hover:bg-gray-800/50 transition-all duration-300
                          ${isOurMatch ? 'bg-baywatch-orange/10 border-l-4 border-baywatch-orange' : ''}
                        `}
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        <td className="p-2 sm:p-4 font-semibold text-baywatch-orange">
                          <Link
                            to={`/match?match=${match.key}`}
                            className="inline-flex items-center hover:text-white transition-colors"
                          >
                            {formatMatchName(match)} <i className="fas fa-arrow-up-right-from-square ml-0.5"></i>
                          </Link>
                          {isOurMatch && <i className="fas fa-star text-baywatch-orange ml-2"></i>}
                        </td>
                        <td className="p-2 sm:p-4 text-sm text-gray-400">
                          {formatMatchTime(match)}
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex flex-wrap gap-1">
                            {match.alliances.blue.team_keys.map(teamKey => {
                              const teamNumber = formatTeamNumber(teamKey);
                              const teamColor = getTeamColor(teamNumber);
                              const isWinner = isWinningTeam(match, teamKey, 'blue');
                              return (
                                <span
                                  key={teamKey}
                                  className={`
                                    cursor-pointer hover:opacity-80 transition-all
                                    ${teamColor ? 'font-bold' : 'text-blue-400'}
                                    ${isWinner && !teamColor ? 'font-bold' : ''}
                                  `}
                                  style={teamColor ? { color: teamColor } : {}}
                                  onClick={() => handleTeamClick(teamNumber)}
                                >
                                  {teamNumber}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex flex-wrap gap-1">
                            {match.alliances.red.team_keys.map(teamKey => {
                              const teamNumber = formatTeamNumber(teamKey);
                              const teamColor = getTeamColor(teamNumber);
                              const isWinner = isWinningTeam(match, teamKey, 'red');
                              return (
                                <span
                                  key={teamKey}
                                  className={`
                                    cursor-pointer hover:opacity-80 transition-all
                                    ${teamColor ? 'font-bold' : 'text-red-400'}
                                    ${isWinner && !teamColor ? 'font-bold' : ''}
                                  `}
                                  style={teamColor ? { color: teamColor } : {}}
                                  onClick={() => handleTeamClick(teamNumber)}
                                >
                                  {teamNumber}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-2 sm:p-4">
                          {formatScore(match)}
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
    </section>
  );
};

export default Schedule;
