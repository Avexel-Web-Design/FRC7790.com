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

  // Sort semifinal ("sf") matches in the exact order the old site expected
  const sfMatchesSorted = useMemo(() => {
    return playoffMatches
      .filter((m) => m.comp_level === 'sf')
      .sort((a, b) => (a.set_number - b.set_number) || (a.match_number - b.match_number));
  }, [playoffMatches]);

  // Finals ("f") matches sorted by match_number (1, 2, 3 …)
  const finalMatchesSorted = useMemo(() => {
    return playoffMatches
      .filter((m) => m.comp_level === 'f')
      .sort((a, b) => a.match_number - b.match_number);
  }, [playoffMatches]);

  // Convenience helper – returns the `sfMatchesSorted` item at index or null if out of range
  const getSfMatch = (index: number): Match | null => sfMatchesSorted[index] ?? null;

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

        <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 overflow-x-auto">
          {/* We need extra width so the bracket can breathe on small viewports */}
          <div className="min-w-[1200px] relative">
            {/* ---------------- Winners Bracket ---------------- */}
            <div className="bracket-container">
              <div className="grid grid-cols-4 gap-8">
                {/* First Round */}
                <div className="space-y-8">
                  {[0, 1, 2, 3].map((idx) => (
                    <MatchBox
                      key={`sf-first-${idx}`}
                      bracketMatch={createBracketMatch(getSfMatch(idx), `Match ${idx + 1}`)}
                      className="match-box group animate__animated animate__fadeInUp"
                    />
                  ))}
                </div>

                {/* Second Round Winners */}
                <div style={{ marginTop: '5rem' }}>
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(6), 'Match 7')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                  {/* Second game lower in the column */}
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(7), 'Match 8')}
                    className="match-box group animate__animated animate__fadeInUp mt-[13rem]"
                  />
                </div>

                {/* Third Round Winners */}
                <div style={{ marginTop: '16rem' }}>
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(10), 'Match 11')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                </div>

                {/* Finals */}
                <div style={{ marginTop: '16rem' }}>
                  {finalMatchesSorted.slice(0, 5).map((match) => (
                    <MatchBox
                      key={match.key}
                      bracketMatch={createBracketMatch(match, `Finals ${match.match_number}`)}
                      className="match-box group finals-match animate__animated animate__fadeInUp mt-4 first:mt-0"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ---------------- Divider ---------------- */}
            <div className="my-16 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-700 bg-gradient-to-r from-transparent via-baywatch-orange to-transparent opacity-30"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 py-1 text-sm text-baywatch-orange bg-black rounded-full border border-baywatch-orange/30">
                  Elimination Bracket
                </span>
              </div>
            </div>

            {/* ---------------- Losers Bracket ---------------- */}
            <div className="bracket-container mt-48">
              <div className="grid grid-cols-4 gap-8">
                {/* First Round Losers */}
                <div className="space-y-8" style={{ marginTop: '-8rem' }}>
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(4), 'Match 5')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(5), 'Match 6')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                </div>

                {/* Second Round Losers */}
                <div className="space-y-8" style={{ marginTop: '-8rem' }}>
                  {/* Note: order intentionally 10 then 9 to mimic old layout */}
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(9), 'Match 10')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(8), 'Match 9')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                </div>

                {/* Third Round Losers */}
                <div className="-mt-12">
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(11), 'Match 12')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                </div>

                {/* Fourth Round Losers */}
                <div className="-mt-12">
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(12), 'Match 13')}
                    className="match-box group animate__animated animate__fadeInUp"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Playoffs;
