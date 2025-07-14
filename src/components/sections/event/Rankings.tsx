import React, { useState, useMemo } from 'react';
import type { TeamRanking } from '../../../hooks/useEventData';
import { getTeamColor } from '../../../utils/color';

interface RankingsProps {
  rankings: TeamRanking[];
  epaData: { [teamKey: string]: number };
  isLoading: boolean;
}

type SortField = 'rank' | 'team_key' | 'ranking_points' | 'record' | 'qual_average' | 'epa';
type SortDirection = 'asc' | 'desc';

const Rankings: React.FC<RankingsProps> = ({ rankings, epaData, isLoading }) => {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Always show EPA column, but with placeholders until data loads
  const showEPA = true;

  // Debug EPA data when it changes
  React.useEffect(() => {
    if (Object.keys(epaData).length > 0) {
      console.log('EPA data available:', epaData);
      console.log('Ranking team keys:', rankings.map(r => r.team_key));
      console.log('EPA data keys:', Object.keys(epaData));
    }
  }, [epaData, rankings]);

  // Debug logging to understand the data structure
  React.useEffect(() => {
    if (rankings.length > 0) {
      console.log('Rankings data sample:', rankings[0]);
      console.log('Full rankings:', rankings);
    }
  }, [rankings]);

  const formatTeamNumber = (teamKey: string): string => {
    return teamKey.replace('frc', '');
  };

  const formatRecord = (ranking: TeamRanking): string => {
    if (ranking.record) {
      return `${ranking.record.wins}-${ranking.record.losses}-${ranking.record.ties}`;
    }
    return `${ranking.wins || 0}-${ranking.losses || 0}-${ranking.ties || 0}`;
  };

  const getRankingPoints = (ranking: TeamRanking): number => {
    // Try different possible fields for ranking points
    return ranking.ranking_points || 
           (ranking.sort_orders && ranking.sort_orders[0]) || 
           0;
  };

  const getQualAverage = (ranking: TeamRanking): number => {
    // Try different possible fields for qualification average
    return ranking.qual_average || 
           (ranking.sort_orders && ranking.sort_orders[1]) || 
           0;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRankings = useMemo(() => {
    if (!rankings.length) return [];

    return [...rankings].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'team_key':
          aValue = parseInt(formatTeamNumber(a.team_key));
          bValue = parseInt(formatTeamNumber(b.team_key));
          break;
        case 'ranking_points':
          aValue = getRankingPoints(a);
          bValue = getRankingPoints(b);
          break;
        case 'record':
          aValue = a.wins || 0;
          bValue = b.wins || 0;
          break;
        case 'qual_average':
          aValue = getQualAverage(a);
          bValue = getQualAverage(b);
          break;
        case 'epa':
          aValue = epaData[a.team_key] || 0;
          bValue = epaData[b.team_key] || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [rankings, sortField, sortDirection]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return 'fas fa-sort text-gray-500';
    return sortDirection === 'asc' ? 'fas fa-sort-up text-baywatch-orange' : 'fas fa-sort-down text-baywatch-orange';
  };

  const handleTeamClick = (teamNumber: string) => {
    window.location.href = `/team?team=${teamNumber}`;
  };

  return (
    <section className="tab-content py-8 relative z-10">
      <div className="container mx-auto sm:px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Team Rankings</h2>
        
        <div className="card-gradient backdrop-blur-sm rounded-xl sm:px-6 py-6 border border-gray-700/50">
          <div className="overflow-x-auto">
            {!isLoading && rankings.length === 0 && (
              <div className="text-center py-8 mb-4">
                <i className="fas fa-info-circle text-3xl text-gray-500 mb-3"></i>
                <h3 className="text-lg font-semibold mb-2">Rankings Not Available</h3>
                <p className="text-gray-400 text-sm">
                  Rankings will appear once qualification matches begin and teams are scored.
                </p>
              </div>
            )}
            
            <table className="min-w-full table-auto">{/* ...existing table code... */}
              <thead>
                <tr className="text-left">
                  <th 
                    className="p-4 text-baywatch-orange cursor-pointer hover:bg-baywatch-orange/10 transition-colors"
                    onClick={() => handleSort('rank')}
                  >
                    <div className="flex items-center">
                      Rank
                      <i className={`ml-2 ${getSortIcon('rank')}`}></i>
                    </div>
                  </th>
                  <th 
                    className="p-4 text-baywatch-orange cursor-pointer hover:bg-baywatch-orange/10 transition-colors"
                    onClick={() => handleSort('team_key')}
                  >
                    <div className="flex items-center">
                      Team
                      <i className={`ml-2 ${getSortIcon('team_key')}`}></i>
                    </div>
                  </th>
                  <th 
                    className="p-4 text-baywatch-orange cursor-pointer hover:bg-baywatch-orange/10 transition-colors"
                    onClick={() => handleSort('ranking_points')}
                  >
                    <div className="flex items-center">
                      Ranking Score
                      <i className={`ml-2 ${getSortIcon('ranking_points')}`}></i>
                    </div>
                  </th>
                  <th 
                    className="p-4 text-baywatch-orange cursor-pointer hover:bg-baywatch-orange/10 transition-colors"
                    onClick={() => handleSort('record')}
                  >
                    <div className="flex items-center">
                      Record
                      <i className={`ml-2 ${getSortIcon('record')}`}></i>
                    </div>
                  </th>
                  <th 
                    className="p-4 text-baywatch-orange cursor-pointer hover:bg-baywatch-orange/10 transition-colors"
                    onClick={() => handleSort('qual_average')}
                  >
                    <div className="flex items-center">
                      Coopertition Score
                      <i className={`ml-2 ${getSortIcon('qual_average')}`}></i>
                    </div>
                  </th>
                  {showEPA && (
                    <th 
                      className="p-4 text-baywatch-orange cursor-pointer hover:bg-baywatch-orange/10 transition-colors"
                      onClick={() => handleSort('epa')}
                    >
                      <div className="flex items-center">
                        EPA
                        <i className={`ml-2 ${getSortIcon('epa')}`}></i>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={showEPA ? 6 : 5} className="p-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-baywatch-orange/30 border-t-baywatch-orange rounded-full animate-spin"></div>
                        <span>Loading rankings...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedRankings.length === 0 ? (
                  <tr>
                    <td colSpan={showEPA ? 6 : 5} className="p-4 text-center text-gray-400">
                      <i className="fas fa-info-circle mr-2"></i>
                      No rankings available yet
                    </td>
                  </tr>
                ) : (
                  sortedRankings.map((ranking, index) => {
                    const teamNumber = formatTeamNumber(ranking.team_key);
                    const teamColor = getTeamColor(teamNumber);
                    const hasSpecialColor = teamColor !== null;
                    
                    return (
                      <tr
                        key={ranking.team_key}
                        className={`
                          hover:bg-gray-800/50 transition-all duration-300 cursor-pointer
                          ${teamNumber === '7790' ? 'border-l-4 border-baywatch-orange bg-baywatch-orange/10' : ''}
                        `}
                        style={{
                          animationDelay: `${index * 0.05}s`
                        }}
                        onClick={() => handleTeamClick(teamNumber)}
                      >
                        <td className="p-4 font-semibold">
                          {ranking.rank}
                          {teamNumber === '7790' && <i className="fas fa-star ml-2 text-baywatch-orange"></i>}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <span 
                              className={`font-bold`}
                              style={hasSpecialColor ? { color: teamColor } : { color: '#ff6b00' }}
                            >
                              {teamNumber}
                            </span>
                            {ranking.team_name && (
                              <span className="ml-2 text-gray-400 text-sm truncate max-w-32">
                                {ranking.team_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">{getRankingPoints(ranking).toFixed(2)}</td>
                        <td className="p-4">{formatRecord(ranking)}</td>
                        <td className="p-4">{getQualAverage(ranking).toFixed(2)}</td>
                        {showEPA && (
                          <td className="p-4">
                            {epaData[ranking.team_key] !== undefined ? (
                              epaData[ranking.team_key].toFixed(1)
                            ) : (
                              <span className="text-gray-500">
                                <i className="fas fa-spinner fa-spin text-xs"></i>
                              </span>
                            )}
                          </td>
                        )}
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

export default Rankings;
