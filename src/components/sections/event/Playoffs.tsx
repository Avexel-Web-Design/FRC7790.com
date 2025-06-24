import React, { useMemo } from 'react';
import type { Match } from '../../../hooks/useEventData';

interface PlayoffsProps {
  playoffMatches: Match[];
  isLoading: boolean;
}

interface BracketMatch {
  id: string;
  match: Match | null;
  displayName: string;
  teams: {
    blue: string[];
    red: string[];
  };
  scores: {
    blue: number;
    red: number;
  };
  winner?: 'blue' | 'red';
}

const Playoffs: React.FC<PlayoffsProps> = ({ playoffMatches, isLoading }) => {
  const formatTeamNumber = (teamKey: string): string => {
    return teamKey.replace('frc', '');
  };

  const getMatchDisplayName = (match: Match): string => {
    const levelMap: { [key: string]: string } = {
      'ef': 'QF',
      'qf': 'QF',
      'sf': 'SF',
      'f': 'F'
    };
    
    const level = levelMap[match.comp_level] || match.comp_level.toUpperCase();
    return `${level}${match.match_number}`;
  };

  const organizeBracketMatches = useMemo(() => {
    const semifinals = playoffMatches.filter(m => m.comp_level === 'sf');
    const finals = playoffMatches.filter(m => m.comp_level === 'f');
    
    return {
      semifinals,
      finals
    };
  }, [playoffMatches]);

  const createBracketMatch = (match: Match | null, displayName: string): BracketMatch => {
    if (!match) {
      return {
        id: displayName,
        match: null,
        displayName,
        teams: { blue: [], red: [] },
        scores: { blue: 0, red: 0 }
      };
    }

    return {
      id: match.key,
      match,
      displayName,
      teams: {
        blue: match.alliances.blue.team_keys.map(formatTeamNumber),
        red: match.alliances.red.team_keys.map(formatTeamNumber)
      },
      scores: {
        blue: match.alliances.blue.score || 0,
        red: match.alliances.red.score || 0
      },
      winner: match.winning_alliance === '' ? undefined : match.winning_alliance
    };
  };

  const MatchBox: React.FC<{ bracketMatch: BracketMatch; className?: string }> = ({ 
    bracketMatch, 
    className = '' 
  }) => {
    const { displayName, teams, scores, winner } = bracketMatch;
    
    return (
      <div className={`bg-gray-800/50 rounded-lg border border-gray-600 p-4 min-w-[200px] ${className}`}>
        <div className="text-center text-baywatch-orange font-semibold text-sm mb-2">
          {displayName}
        </div>
        
        <div className="space-y-1">
          {/* Blue Alliance */}
          <div className={`
            flex justify-between items-center p-2 rounded
            ${winner === 'blue' ? 'bg-blue-500/20 border border-blue-500' : 'bg-gray-700/50'}
          `}>
            <div className="flex flex-wrap gap-1">
              {teams.blue.map(team => (
                <span 
                  key={team}
                  className={`text-sm ${team === '7790' ? 'text-baywatch-orange font-bold' : 'text-blue-300'}`}
                >
                  {team}
                </span>
              ))}
            </div>
            <div className="text-white font-semibold ml-2">
              {scores.blue || '--'}
            </div>
          </div>
          
          {/* Red Alliance */}
          <div className={`
            flex justify-between items-center p-2 rounded
            ${winner === 'red' ? 'bg-red-500/20 border border-red-500' : 'bg-gray-700/50'}
          `}>
            <div className="flex flex-wrap gap-1">
              {teams.red.map(team => (
                <span 
                  key={team}
                  className={`text-sm ${team === '7790' ? 'text-baywatch-orange font-bold' : 'text-red-300'}`}
                >
                  {team}
                </span>
              ))}
            </div>
            <div className="text-white font-semibold ml-2">
              {scores.red || '--'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <section className="tab-content py-8 relative z-10">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Playoff Bracket</h2>
          <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-baywatch-orange/30 border-t-baywatch-orange rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Loading playoff bracket...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (playoffMatches.length === 0) {
    return (
      <section className="tab-content py-8 relative z-10">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Playoff Bracket</h2>
          <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="text-center py-16">
              <i className="fas fa-info-circle text-4xl text-gray-500 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Playoffs Haven't Started</h3>
              <p className="text-gray-400">The playoff bracket will appear once elimination matches begin.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tab-content py-8 relative z-10">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold mb-8 text-center">Playoff Bracket</h2>
        
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Semifinals */}
            {organizeBracketMatches.semifinals.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-center mb-4 text-baywatch-orange">
                  Semifinals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {organizeBracketMatches.semifinals.map((match) => (
                    <MatchBox
                      key={match.key}
                      bracketMatch={createBracketMatch(match, getMatchDisplayName(match))}
                      className="animate__animated animate__fadeInUp"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Finals */}
            {organizeBracketMatches.finals.length > 0 && (
              <div className="mb-8">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 py-1 text-sm text-baywatch-orange bg-black rounded-full border border-baywatch-orange/30">
                      Finals
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                    {organizeBracketMatches.finals.map((match) => (
                      <MatchBox
                        key={match.key}
                        bracketMatch={createBracketMatch(match, getMatchDisplayName(match))}
                        className="animate__animated animate__fadeInUp"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Playoffs;
