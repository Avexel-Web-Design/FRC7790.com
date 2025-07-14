import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Match } from '../../../hooks/useEventData';
import NebulaLoader from '../../common/NebulaLoader';
import { getDivisionMapping, getAllianceDisplayName, type DivisionMapping } from '../../../utils/divisionUtils';
import { getTeamColor } from '../../../utils/color';

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
  // Division mapping (alliance number -> division name) for championship events
  const [divisionMapping, setDivisionMapping] = useState<DivisionMapping>({});
  const [isChampionshipEvent, setIsChampionshipEvent] = useState(false);
  const [isAllianceLoading, setIsAllianceLoading] = useState(false);
  const [bracketType, setBracketType] = useState<'2-team' | '4-team' | '8-team' | 'single-elim-bo3'>('8-team');
  // Alliance data for the listing section
  const [alliances, setAlliances] = useState<any[]>([]);
  const [isAlliancesLoading, setIsAlliancesLoading] = useState(false);

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
        setIsAlliancesLoading(true);
        
        // Use the new division utility function
        const { isChampionshipEvent: isChampEvent, divisionMapping: divMapping, allianceMapping: allianceMap } = 
          await getDivisionMapping(eventKey);
        
        setIsChampionshipEvent(isChampEvent);
        setDivisionMapping(divMapping);
        setAllianceMapping(allianceMap);
        
        // Also fetch full alliance data for the listing
        const { frcAPI } = await import('../../../utils/frcAPI');
        const allianceData = await frcAPI.fetchEventAlliances(eventKey);
        setAlliances(allianceData);
        
        // Determine bracket type based on year and number of alliances
        const eventYear = parseInt(eventKey.substring(0, 4));
        const uniqueAlliances = new Set(Object.values(allianceMap));
        const allianceCount = uniqueAlliances.size;
        
        // 2022 and earlier used single elimination with best-of-3 matches
        if (eventYear <= 2022) {
          setBracketType('single-elim-bo3');
        } else if (allianceCount <= 2) {
          setBracketType('2-team');
        } else if (allianceCount <= 4) {
          setBracketType('4-team');
        } else {
          setBracketType('8-team');
        }
        
      } catch (err) {
        console.warn('Failed to load alliance mapping', err);
      } finally {
        setIsAllianceLoading(false);
        setIsAlliancesLoading(false);
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

  // Render 2-team bracket (just finals)
  const render2TeamBracket = () => (
    <div className="min-w-[600px] relative">
      <div className="flex justify-center">
        <div className="space-y-8">
          <h3 className="text-2xl font-bold text-center text-baywatch-orange mb-8">Championship Finals</h3>
          {finalMatchesSorted.slice(0, 5).map((match) => (
            <MatchBox
              key={match.key}
              bracketMatch={createBracketMatch(match, match.match_number === 4 ? 'Overtime 1' : match.match_number === 5 ? 'Overtime 2' : `Finals ${match.match_number}`)}
              className="match-box group finals-match"
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Render 4-team bracket
  const render4TeamBracket = () => (
    <div className="min-w-[900px] relative">
      {/* Winners Bracket */}
      <div className="bracket-container">
        <div className="grid grid-cols-3 gap-8">
          {/* First Round */}
          <div className="space-y-8" style={{ marginTop: '7rem' }}>
            {[0, 1].map((idx) => (
              <MatchBox
                key={`sf-first-${idx}`}
                bracketMatch={createBracketMatch(getSfMatch(idx), `Match ${idx + 1}`)}
                className="match-box group"
              />
            ))}
          </div>

          {/* Second Round Winners */}
          <div style={{ marginTop: '14.5rem' }}>
            <MatchBox
              bracketMatch={createBracketMatch(getSfMatch(2), 'Match 3')}
              className="match-box group"
            />
          </div>

          {/* Finals */}
          <div style={{ marginTop: '1rem' }}>
            {finalMatchesSorted.slice(0, 5).map((match) => (
              <MatchBox
                key={match.key}
                bracketMatch={createBracketMatch(match, match.match_number === 4 ? 'Overtime 1' : match.match_number === 5 ? 'Overtime 2' : `Finals ${match.match_number}`)}
                className="match-box group finals-match mt-4 first:mt-0"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
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

      {/* Losers Bracket */}
      <div className="bracket-container">
        <div className="grid grid-cols-3 gap-8">
          {/* First Round Losers */}
          
          <div></div>
          
          <div>
            <MatchBox
              bracketMatch={createBracketMatch(getSfMatch(3), 'Match 4')}
              className="match-box group"
            />
          </div>

          {/* Second Round Losers */}
          <div>
            <MatchBox
              bracketMatch={createBracketMatch(getSfMatch(4), 'Match 5')}
              className="match-box group"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render 8-team bracket (current implementation)
  const render8TeamBracket = () => (
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
  );

  // Render single elimination best-of-3 bracket (2022 and earlier)
  const renderSingleElimBo3Bracket = () => {
    // Group playoff matches by comp_level and set_number
    const efMatches = playoffMatches.filter(m => m.comp_level === 'ef').sort((a, b) => (a.set_number - b.set_number) || (a.match_number - b.match_number));
    const qfMatches = playoffMatches.filter(m => m.comp_level === 'qf').sort((a, b) => (a.set_number - b.set_number) || (a.match_number - b.match_number));
    const sfMatches = playoffMatches.filter(m => m.comp_level === 'sf').sort((a, b) => (a.set_number - b.set_number) || (a.match_number - b.match_number));
    const finalMatches = playoffMatches.filter(m => m.comp_level === 'f').sort((a, b) => a.match_number - b.match_number);
    
    // Create series boxes for best-of-3 matches
    const createSeriesBox = (matches: Match[], seriesName: string, className = '') => {
      if (matches.length === 0) {
        return (
          <div key={seriesName} className={`bg-black/90 border border-gray-700/50 rounded-xl p-4 w-[300px] min-h-[240px] ${className}`}>
            <h4 className="text-center text-baywatch-orange font-semibold mb-4">{seriesName}</h4>
            <div className="text-center text-gray-500">Not yet scheduled</div>
          </div>
        );
      }

      return (
        <div key={seriesName} className={`bg-black/90 border border-baywatch-orange/30 rounded-xl p-4 w-[300px] min-h-[240px] ${className}`}>
          <h4 className="text-center text-baywatch-orange font-semibold mb-4">{seriesName}</h4>
          <div className="space-y-3">
            {matches.map((match, idx) => (
              <MatchBox
                key={match.key}
                bracketMatch={createBracketMatch(match, `Game ${idx + 1}`)}
                className="!w-full !min-h-[160px] match-box group"
              />
            ))}
          </div>
        </div>
      );
    };

    // Group QF/EF matches by set
    const qfSeries = new Map<number, Match[]>();
    qfMatches.forEach(match => {
      if (!qfSeries.has(match.set_number)) {
        qfSeries.set(match.set_number, []);
      }
      qfSeries.get(match.set_number)!.push(match);
    });

    // Group EF matches by set (used as quarters in some years)
    const efSeries = new Map<number, Match[]>();
    efMatches.forEach(match => {
      if (!efSeries.has(match.set_number)) {
        efSeries.set(match.set_number, []);
      }
      efSeries.get(match.set_number)!.push(match);
    });

    // Group SF matches by set
    const sfSeries = new Map<number, Match[]>();
    sfMatches.forEach(match => {
      if (!sfSeries.has(match.set_number)) {
        sfSeries.set(match.set_number, []);
      }
      sfSeries.get(match.set_number)!.push(match);
    });

    const efSeriesCount = efSeries.size;
    const qfSeriesCount = qfSeries.size;
    const sfSeriesCount = sfSeries.size;

    return (
      <div className="min-w-[1200px] relative">
        {/* Single Elimination Bracket Structure */}
        
        {/* Elimination Finals (if present) - Used as quarters in some years */}
        {efSeriesCount > 0 && (
          <>
            <h3 className="text-2xl font-bold text-center text-baywatch-orange mb-8">Quarterfinals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {Array.from(efSeries.entries()).map(([setNumber, matches]) => 
                createSeriesBox(matches, `Quarterfinal ${setNumber}`, 'hover:scale-105 transition-transform duration-300')
              )}
            </div>
          </>
        )}
        
        {/* Quarterfinals (if present and no EF) */}
        {qfSeriesCount > 0 && efSeriesCount === 0 && (
          <>
            <h3 className="text-2xl font-bold text-center text-baywatch-orange mb-8">Quarterfinals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {Array.from(qfSeries.entries()).map(([setNumber, matches]) => 
                createSeriesBox(matches, `Quarterfinal ${setNumber}`, 'hover:scale-105 transition-transform duration-300')
              )}
            </div>
          </>
        )}

        {/* Semifinals */}
        {sfSeriesCount > 0 && (
            <>
            <h3 className="text-2xl font-bold text-center text-baywatch-orange mb-8">Semifinals</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 justify-center mb-12">
              <div></div>
              {Array.from(sfSeries.entries()).map(([setNumber, matches]) => 
              createSeriesBox(matches, `Semifinal ${setNumber}`, 'hover:scale-105 transition-transform duration-300')
              )}
            </div>
            </>
        )}

        {/* Finals */}
        {finalMatches.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-center text-baywatch-orange mb-8">Finals</h3>
            <div className="flex justify-center">
              {createSeriesBox(finalMatches, '', 'hover:scale-105 transition-transform duration-300')}
            </div>
          </>
        )}

        {/* If no matches scheduled yet */}
        {efSeriesCount === 0 && qfSeriesCount === 0 && sfSeriesCount === 0 && finalMatches.length === 0 && (
          <div className="text-center py-16">
            <i className="fas fa-info-circle text-4xl text-gray-500 mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Playoff Schedule Not Available</h3>
            <p className="text-gray-400">Playoff matches will appear here once they are scheduled.</p>
          </div>
        )}
      </div>
    );
  };

  // Render alliance listing section
  const renderAllianceListing = () => {
    if (isAlliancesLoading) {
      return (
        <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mt-8">
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="mb-4"><NebulaLoader size={48} /></div>
              <p className="text-gray-400">Loading alliances...</p>
            </div>
          </div>
        </div>
      );
    }

    if (alliances.length === 0) return null;

    return (
      <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 mt-8">
        <h3 className="text-2xl font-bold mb-6 text-center">Alliance Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {alliances.map((alliance, index) => {
            const allianceNumber = index + 1;
            const displayName = getAllianceDisplayName(allianceNumber, isChampionshipEvent, divisionMapping, `Alliance ${allianceNumber}`);
            
            return (
              <div 
                key={index} 
                className="bg-black rounded-lg p-4 border border-gray-700/50 transform transition-all duration-300 hover:scale-105 hover:bg-black/60 hover:border-baywatch-orange/50 hover:shadow-[0_20px_40px_-12px_rgba(255,107,0,0.3)]"
              >
                <h4 className="text-lg font-semibold text-baywatch-orange mb-3 text-center">
                  {displayName}
                </h4>
                <div className="space-y-2">
                  {alliance.picks.map((teamKey: string, pickIndex: number) => {
                    const teamNumber = teamKey.replace('frc', '');
                    const teamColor = getTeamColor(teamNumber);
                    const isSpecialTeam = teamColor !== null;
                    const pickLabels = ['Captain', 'Pick 1', 'Pick 2', 'Pick 3'];
                    
                    return (
                      <Link
                        key={teamKey}
                        to={`/team?team=${teamNumber}`}
                        className={`flex items-center justify-between p-2 rounded transition-all duration-200 hover:translate-x-1 hover:shadow-md cursor-pointer group outline-none focus:outline-none focus-visible:outline-none active:outline-none border ${
                          isSpecialTeam 
                            ? '' 
                            : 'bg-gray-800/50 border-transparent hover:bg-gray-700/50 hover:border-gray-600'
                        }`}
                        style={{ 
                          outline: 'none', 
                          boxShadow: 'none',
                          ...(isSpecialTeam && { 
                            backgroundColor: teamColor + '20',
                            borderColor: teamColor + '50'
                          })
                        }}
                        onMouseEnter={(e) => {
                          if (isSpecialTeam && teamColor) {
                            e.currentTarget.style.backgroundColor = teamColor + '30';
                            e.currentTarget.style.borderColor = teamColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isSpecialTeam && teamColor) {
                            e.currentTarget.style.backgroundColor = teamColor + '20';
                            e.currentTarget.style.borderColor = teamColor + '50';
                          }
                        }}
                      >
                        <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                          {pickLabels[pickIndex] || `Pick ${pickIndex}`}
                        </span>
                        <div className="flex items-center">
                          <span 
                            className={`font-semibold transition-colors ${
                              isSpecialTeam 
                                ? 'group-hover:opacity-80' 
                                : 'text-white group-hover:text-baywatch-orange'
                            }`}
                            style={isSpecialTeam ? { color: teamColor } : {}}
                          >
                            {teamNumber}
                          </span>
                          <i className="fas fa-arrow-up-right-from-square ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"></i>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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

        // Compute alliance labels using division mapping if available, otherwise alliance numbers
    const blueTeamKeyFull = bracketMatch.match?.alliances.blue.team_keys[0];
    const redTeamKeyFull = bracketMatch.match?.alliances.red.team_keys[0];
    const blueAllianceNumber = blueTeamKeyFull && allianceMapping[blueTeamKeyFull] ? allianceMapping[blueTeamKeyFull] : null;
    const redAllianceNumber = redTeamKeyFull && allianceMapping[redTeamKeyFull] ? allianceMapping[redTeamKeyFull] : null;
    
    const blueAllianceLabel = isAllianceLoading ? 'Loading...' : 
      getAllianceDisplayName(blueAllianceNumber, isChampionshipEvent, divisionMapping, 'TBD');
      
    const redAllianceLabel = isAllianceLoading ? 'Loading...' : 
      getAllianceDisplayName(redAllianceNumber, isChampionshipEvent, divisionMapping, 'TBD');

    return (
      <div
        className={`relative flex flex-col justify-center p-6 pt-8 rounded-xl bg-black/90 border border-baywatch-orange/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-105 w-[280px] min-h-[200px] before:content-[''] before:absolute before:inset-0 before:opacity-5 before:rounded-xl before:pointer-events-none before:bg-[radial-gradient(circle_at_1px_1px,_rgba(255,107,0,0.2)_1px,_transparent_0)] before:bg-[length:20px_20px] ${className}`}
      >
        {/* Match title bubble */}
        {bracketMatch.match ? (
           <Link
             to={`/match?match=${bracketMatch.match.key}`}
             className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-baywatch-orange/80 backdrop-blur-sm text-black text-xs font-semibold rounded-full border border-baywatch-orange/60 shadow-md inline-flex items-center hover:text-white transition-colors will-change-transform"
           >
             {displayName} <i className="fas fa-arrow-up-right-from-square ml-1"></i>
           </Link>
         ) : (
           <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-baywatch-orange/80 backdrop-blur-sm text-black text-xs font-semibold rounded-full border border-baywatch-orange/60 shadow-md will-change-transform">
             {displayName}
           </span>
         )}

         {/* Alliance rows */}
        <div className="flex flex-col gap-4">
          {/* Blue Alliance */}
          <div className={allianceRowClasses('blue')}>
            <span className={badgeClasses('blue')}>{blueAllianceLabel}</span>
            <div className="flex flex-wrap gap-1">
              {teams.blue.map((team) => {
                const teamColor = getTeamColor(team);
                return (
                  <Link
                    key={team}
                    to={`/team?team=${team}`}
                    className={`text-sm transition-colors cursor-pointer font-bold hover:opacity-80`}
                    style={teamColor ? { color: teamColor } : {}}
                  >
                    {team}
                  </Link>
                );
              })}
            </div>
            <div className="ml-2 font-semibold text-blue-400">{scores.blue ?? '--'}</div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-600/50" />

          {/* Red Alliance */}
          <div className={allianceRowClasses('red')}>
            <span className={badgeClasses('red')}>{redAllianceLabel}</span>
            <div className="flex flex-wrap gap-1">
              {teams.red.map((team) => {
                const teamColor = getTeamColor(team);
                return (
                  <Link
                    key={team}
                    to={`/team?team=${team}`}
                    className={`text-sm transition-colors cursor-pointer font-bold hover:opacity-80`}
                    style={teamColor ? { color: teamColor } : {}}
                  >
                    {team}
                  </Link>
                );
              })}
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
        <div className="container mx-auto sm:px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Playoff Bracket</h2>
          <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="mb-4"><NebulaLoader size={96} /></div>
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
        <div className="container mx-auto sm:px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">Playoff Bracket</h2>
          <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
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
      <div className="container mx-auto sm:px-6">
        <h2 className="text-4xl font-bold mb-8 text-center">Playoff Bracket</h2>

        <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 overflow-x-auto">
          {/* Render appropriate bracket based on bracket type */}
          {bracketType === '2-team' && render2TeamBracket()}
          {bracketType === '4-team' && render4TeamBracket()}
          {bracketType === '8-team' && render8TeamBracket()}
          {bracketType === 'single-elim-bo3' && renderSingleElimBo3Bracket()}
        </div>

        {/* Alliance Selection Section */}
        {renderAllianceListing()}
      </div>
    </section>
  );
};

export default Playoffs;
