import React, { useMemo, useEffect, useState } from 'react';
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
  // Alliance mapping (team_key -> alliance number)
  const [allianceMapping, setAllianceMapping] = useState<Record<string, number>>({});
  const [isAllianceLoading, setIsAllianceLoading] = useState(false);

  // Derive event key from first playoff match key (e.g. "2025mimid_sf1m1" => "2025mimid")
  useEffect(() => {
    const loadMapping = async () => {
      if (Object.keys(allianceMapping).length > 0) return; // already loaded/cached
      if (!playoffMatches || playoffMatches.length === 0) return; // nothing yet

      const firstMatchKey = playoffMatches[0].key;
      const eventKey = firstMatchKey?.split('_')[0];
      if (!eventKey) return;

      try {
        setIsAllianceLoading(true);
        const { frcAPI } = await import('../../../utils/frcAPI');
        const alliances = await frcAPI.fetchEventAlliances(eventKey);
        const mapping: Record<string, number> = {};
        alliances.forEach((alliance: any, index: number) => {
          const allianceNumber = index + 1;
          alliance.picks.forEach((teamKey: string) => {
            mapping[teamKey] = allianceNumber;
          });
        });
        setAllianceMapping(mapping);
      } catch (err) {
        console.warn('Failed to load alliance mapping', err);
      } finally {
        setIsAllianceLoading(false);
      }
    };

    loadMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playoffMatches]);
  const formatTeamNumber = (teamKey: string): string => {
    return teamKey.replace('frc', '');
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

    // Helper to build row classes for each alliance
    const allianceRowClasses = (color: 'blue' | 'red') => {
      const base =
        color === 'blue'
          ? 'bg-blue-900/30 text-blue-400 border-blue-400/30'
          : 'bg-red-900/30 text-red-400 border-red-400/30';
      const winnerBonus =
        winner === color ? (color === 'blue' ? 'border-2 border-blue-500 font-bold' : 'border-2 border-red-500 font-bold') : '';
      return `alliance flex justify-between items-center p-3 rounded relative border ${base} ${winnerBonus}`;
    };

    // Badge bubble styles
    const badgeClasses = (color: 'blue' | 'red') =>
      `absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[0.65rem] font-bold backdrop-blur-xl rounded-full border shadow-md ${
        color === 'blue' ? 'bg-blue-500/40 border-blue-300 text-white' : 'bg-red-500/40 border-red-300 text-white'
      }`;

        // Compute alliance numbers using mapping (fallback to TBD)
    const blueTeamKeyFull = bracketMatch.match?.alliances.blue.team_keys[0];
    const redTeamKeyFull = bracketMatch.match?.alliances.red.team_keys[0];
    const blueAllianceLabel =
      blueTeamKeyFull && allianceMapping[blueTeamKeyFull]
        ? `Alliance ${allianceMapping[blueTeamKeyFull]}`
        : 'TBD';
    const redAllianceLabel =
      redTeamKeyFull && allianceMapping[redTeamKeyFull]
        ? `Alliance ${allianceMapping[redTeamKeyFull]}`
        : 'TBD';

    return (
      <div
        className={`relative flex flex-col justify-center p-6 pt-8 rounded-xl bg-black/90 border border-baywatch-orange/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-105 w-[280px] min-h-[200px] before:content-[''] before:absolute before:inset-0 before:opacity-5 before:rounded-xl before:pointer-events-none before:bg-[radial-gradient(circle_at_1px_1px,_rgba(255,107,0,0.2)_1px,_transparent_0)] before:bg-[length:20px_20px] ${className}`}
      >
        {/* Match title bubble */}
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-baywatch-orange/50 backdrop-blur-xl text-black text-xs font-semibold rounded-full border border-baywatch-orange/60 shadow-md">
          {displayName} <i className="fas fa-arrow-up-right-from-square ml-1"></i>
        </span>

        {/* Alliance rows */}
        <div className="flex flex-col gap-4">
          {/* Blue Alliance */}
          <div className={allianceRowClasses('blue')}>
            <span className={badgeClasses('blue')}>{isAllianceLoading ? 'Loading...' : blueAllianceLabel}</span>
            <div className="flex flex-wrap gap-1">
              {teams.blue.map((team) => (
                <span
                  key={team}
                  className={`text-sm ${team === '7790' ? 'text-baywatch-orange font-bold' : ''}`}
                >
                  {team}
                </span>
              ))}
            </div>
            <div className="ml-2 font-semibold text-blue-400">{scores.blue ?? '--'}</div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-600/50" />

          {/* Red Alliance */}
          <div className={allianceRowClasses('red')}>
            <span className={badgeClasses('red')}>{redAllianceLabel}</span>
            <div className="flex flex-wrap gap-1">
              {teams.red.map((team) => (
                <span
                  key={team}
                  className={`text-sm ${team === '7790' ? 'text-baywatch-orange font-bold' : ''}`}
                >
                  {team}
                </span>
              ))}
            </div>
            <div className="ml-2 font-semibold text-red-400">{scores.red ?? '--'}</div>
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
                      className="match-box group "
                    />
                  ))}
                </div>

                {/* Second Round Winners */}
                <div style={{ marginTop: '7rem' }}>
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(6), 'Match 7')}
                    className="match-box group "
                  />
                  {/* Second game lower in the column */}
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(7), 'Match 8')}
                    className="match-box group  mt-[17rem]"
                  />
                </div>

                {/* Third Round Winners */}
                <div style={{ marginTop: '22rem' }}>
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(10), 'Match 11')}
                    className="match-box group "
                  />
                </div>

                {/* Finals */}
                <div style={{ marginTop: '22rem' }}>
                  {finalMatchesSorted.slice(0, 5).map((match) => (
                    <MatchBox
                      key={match.key}
                      bracketMatch={createBracketMatch(match, match.match_number === 4 ? 'Overtime 1' : match.match_number === 5 ? 'Overtime 2' : `Finals ${match.match_number}`)}
                      className="match-box group finals-match  mt-4 first:mt-0"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ---------------- Divider ---------------- */}
            <div className="my-8 relative">
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
                <div className="space-y-8" style={{ marginTop: '-10rem' }}>
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(4), 'Match 5')}
                    className="match-box group "
                  />
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(5), 'Match 6')}
                    className="match-box group "
                  />
                </div>

                {/* Second Round Losers */}
                <div className="space-y-8" style={{ marginTop: '-10rem' }}>
                  {/* Note: order intentionally 10 then 9 to mimic old layout */}
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(9), 'Match 10')}
                    className="match-box group "
                  />
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(8), 'Match 9')}
                    className="match-box group "
                  />
                </div>

                {/* Third Round Losers */}
                <div className="-mt-12">
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(11), 'Match 12')}
                    className="match-box group "
                  />
                </div>

                {/* Fourth Round Losers */}
                <div className="-mt-12">
                  <MatchBox
                    bracketMatch={createBracketMatch(getSfMatch(12), 'Match 13')}
                    className="match-box group "
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
