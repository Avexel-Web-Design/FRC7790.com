import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  CirclePile, 
  Circle, 
  ChessRook, 
  Bot, 
  Ship, 
  Music, 
  Users 
} from 'lucide-react';
import CoralIcon from '../../icons/CoralIcon';
import type { MatchData, TeamData } from '../../../hooks/useMatchData';
import { getDivisionMapping, getAllianceDisplayName } from '../../../utils/divisionUtils';
import { getTeamColor } from '../../../utils/color';
import { useEventHighScores } from '../../../hooks/useEventHighScores';
import { formatMatchNameForHighScore } from '../../../utils/eventStats';

interface MatchScoreboardProps {
  matchData: MatchData;
  teamData: TeamData[];
}

const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ matchData, teamData }) => {
  const [allianceNumbers, setAllianceNumbers] = useState<{ blue: string; red: string }>({ blue: '?', red: '?' });
  
  // Fetch event high scores
  const { highScores, loading: highScoresLoading } = useEventHighScores(matchData.event_key);

  // Create a map of team keys to team data for quick lookup
  const teamMap = teamData.reduce((map, team) => {
    map[team.key] = team;
    return map;
  }, {} as { [key: string]: TeamData });

  // Fetch alliance numbers for playoff matches
  useEffect(() => {
    const fetchAllianceNumbers = async () => {
      if (matchData.comp_level === 'qm') {
        setAllianceNumbers({ blue: 'BLUE', red: 'RED' });
        return;
      }

      try {
        // Use the new division utility function
        const { isChampionshipEvent: isChampEvent, divisionMapping: divMapping, allianceMapping } = 
          await getDivisionMapping(matchData.event_key);

        // Find alliance numbers for the current match
        let blueAllianceNum: number | null = null;
        let redAllianceNum: number | null = null;
        
        // Check each team in the blue alliance to find a match
        for (const teamKey of matchData.alliances.blue.team_keys) {
          if (allianceMapping[teamKey]) {
            blueAllianceNum = allianceMapping[teamKey];
            break;
          }
        }
        
        // Check each team in the red alliance to find a match
        for (const teamKey of matchData.alliances.red.team_keys) {
          if (allianceMapping[teamKey]) {
            redAllianceNum = allianceMapping[teamKey];
            break;
          }
        }

        // Get display names using the utility function
        const blueDisplayName = getAllianceDisplayName(blueAllianceNum, isChampEvent, divMapping, 'BLUE');
        const redDisplayName = getAllianceDisplayName(redAllianceNum, isChampEvent, divMapping, 'RED');

        setAllianceNumbers({ blue: blueDisplayName, red: redDisplayName });
      } catch (err) {
        console.error("Error fetching alliance data:", err);
        setAllianceNumbers({ blue: 'BLUE', red: 'RED' });
      }
    };

    fetchAllianceNumbers();
  }, [matchData]);

  const renderTeamList = (teamKeys: string[], alliance: 'blue' | 'red') => {
    return teamKeys.map(teamKey => {
      const team = teamMap[teamKey];
      const teamNumber = teamKey.replace('frc', '');
      const teamName = team ? team.nickname : 'Unknown Team';
  const teamColor = getTeamColor(teamNumber);
  const hasSpecialColor = teamColor !== null;
      
      return (
        <div 
          key={teamKey} 
          className={`team-item ${alliance === 'blue' ? 'bg-blue-500/20' : 'bg-red-500/20'} ${hasSpecialColor ? 'border-l-4' : ''} flex items-center gap-2 p-2 rounded transition-all duration-300 hover:translate-x-1`}
          style={hasSpecialColor ? { borderLeftColor: teamColor } : {}}
        >
          <span 
            className="team-number font-semibold text-lg"
            style={hasSpecialColor ? { color: teamColor } : {}}
          >
            {teamNumber}
          </span>
          <span className="team-name text-sm opacity-80">{teamName}</span>
        </div>
      );
    });
  };

  const getResultBanner = () => {
    if (matchData.alliances.blue.score === null || matchData.alliances.red.score === null) {
      return null;
    }

    let bannerClass = '';
    let bannerText = '';

    if (matchData.winning_alliance === 'blue') {
      bannerClass = 'bg-blue-500/20 border border-blue-500/40 text-blue-300';
      bannerText = 'Blue Alliance Wins!';
    } else if (matchData.winning_alliance === 'red') {
      bannerClass = 'bg-red-500/20 border border-red-500/40 text-red-300';
      bannerText = 'Red Alliance Wins!';
    } else {
      bannerClass = 'bg-gray-500/20 border border-gray-500/40 text-gray-300';
      bannerText = 'Match Tied!';
    }

    return (
      <div className={`mt-8 p-4 rounded-lg text-center text-lg font-bold ${bannerClass}`}>
        {bannerText}
      </div>
    );
  };

  const renderRankingPoints = (alliance: 'blue' | 'red') => {
    if (matchData.comp_level !== 'qm') return null;

    const eventYear = parseInt(matchData.event_key.substring(0, 4));
    const breakdown = matchData.score_breakdown?.[alliance];
    const isWin = matchData.winning_alliance === alliance;
    const isTie = matchData.winning_alliance === '';

    const rpIcons: { lucideIcon: React.ElementType; achieved: boolean | undefined; title: string }[] = [];

    // Base Match RPs (Win/Tie)
    rpIcons.push({
      lucideIcon: Trophy,
      achieved: isWin || isTie,
      title: 'Match RP 1'
    });

    // In 2026 and 2025, wins are worth 3 RPs and ties are worth 1 RP
    if (eventYear >= 2025) {
      rpIcons.push({
        lucideIcon: Trophy,
        achieved: isWin,
        title: 'Match RP 2'
      });
      rpIcons.push({
        lucideIcon: Trophy,
        achieved: isWin,
        title: 'Match RP 3'
      });
    } else {
      // Pre-2025, wins are worth 2 RPs and ties are worth 1 RP
      rpIcons.push({
        lucideIcon: Trophy,
        achieved: isWin,
        title: 'Match RP 2'
      });
    }

    // Add game-specific RPs
    if (eventYear >= 2026) {
      rpIcons.push({
        lucideIcon: Circle,
        achieved: breakdown?.energizedAchieved,
        title: 'Energized RP'
      });
      rpIcons.push({
        lucideIcon: CirclePile,
        achieved: breakdown?.superchargedAchieved,
        title: 'Supercharged RP'
      });
      rpIcons.push({
        lucideIcon: ChessRook,
        achieved: breakdown?.traversalAchieved,
        title: 'Traversal RP'
      });
    } else if (eventYear === 2025) {
      rpIcons.push({
        lucideIcon: Bot,
        achieved: breakdown?.autoBonusAchieved,
        title: 'Auto RP'
      });
      rpIcons.push({
        lucideIcon: Ship,
        achieved: breakdown?.bargeBonusAchieved,
        title: 'Barge RP'
      });
      rpIcons.push({
        lucideIcon: CoralIcon,
        achieved: breakdown?.coralBonusAchieved,
        title: 'Coral RP'
      });
    } else if (eventYear === 2024) {
      rpIcons.push({
        lucideIcon: Music,
        achieved: breakdown?.melodyBonusAchieved,
        title: 'Melody RP'
      });
      rpIcons.push({
        lucideIcon: Users,
        achieved: breakdown?.ensembleBonusAchieved,
        title: 'Ensemble RP'
      });
    }

    if (rpIcons.length === 0 || !breakdown) return null;

    const baseColor = alliance === 'blue' ? 'text-blue-400' : 'text-red-400';
    const bgColorClass = alliance === 'blue' ? 'bg-blue-500/20' : 'bg-red-500/20';
    const ringColorClass = alliance === 'blue' ? 'ring-blue-500/50' : 'ring-red-500/50';

    return (
      <div className="mt-4 flex flex-col items-center">
        <div className="flex gap-3 mb-1">
          {rpIcons.map((rp, index) => {
            const Icon = rp.lucideIcon;
            return (
              <div 
                key={index} 
                className={`flex items-center justify-center w-8 h-8 rounded-full ${rp.achieved ? `${baseColor} ${bgColorClass} ring-1 ${ringColorClass}` : 'text-gray-600 bg-gray-800/50'}`}
                title={rp.title}
              >
                <Icon className="w-4 h-4" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className="py-8 relative z-10">
      <div className="container mx-auto px-6">
        <div className="card-gradient backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8 animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Blue Alliance */}
            <div className="flex-1 flex flex-col items-center">
              <h3 className="text-blue-400 text-xl font-bold mb-4">
                {matchData.comp_level === 'qm' ? 'BLUE ALLIANCE' : allianceNumbers.blue}
              </h3>
              <div className="match-alliance-teams text-center mb-4 space-y-2">
                {renderTeamList(matchData.alliances.blue.team_keys, 'blue')}
              </div>
              <div className="text-5xl md:text-7xl font-bold text-blue-400">
                {matchData.alliances.blue.score !== null ? matchData.alliances.blue.score : '--'}
              </div>
              {renderRankingPoints('blue')}
            </div>
            
            {/* VS Divider */}
            <div className="my-6 md:my-0 px-8">
              <div className="text-3xl text-gray-400 font-bold">VS</div>
            </div>
            
            {/* Red Alliance */}
            <div className="flex-1 flex flex-col items-center">
              <h3 className="text-red-400 text-xl font-bold mb-4">
                {matchData.comp_level === 'qm' ? 'RED ALLIANCE' : allianceNumbers.red}
              </h3>
              <div className="match-alliance-teams text-center mb-4 space-y-2">
                {renderTeamList(matchData.alliances.red.team_keys, 'red')}
              </div>
              <div className="text-5xl md:text-7xl font-bold text-red-400">
                {matchData.alliances.red.score !== null ? matchData.alliances.red.score : '--'}
              </div>
              {renderRankingPoints('red')}
            </div>
          </div>
          
          {/* Match Result Banner */}
          {getResultBanner()}
        </div>
        
        {/* Event High Score Section */}
        {highScores && !highScoresLoading && (
          <div className="card-gradient backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-6 mt-6 animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <h3 className="text-baywatch-orange text-lg font-bold mb-3 flex items-center justify-center">
                <i className="fas fa-trophy mr-2"></i>
                Event High Score
              </h3>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {highScores.overallHighScore}
                  </div>
                  {highScores.highScoringMatch && (
                    <div className="text-sm text-gray-400">
                      {formatMatchNameForHighScore(highScores.highScoringMatch)}
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-gray-500 mx-4">•</div>
                <div className="text-center text-sm text-gray-400">
                  <div>Blue High: <span className="text-blue-400 font-semibold">{highScores.blueHighScore}</span></div>
                  <div>Red High: <span className="text-red-400 font-semibold">{highScores.redHighScore}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </section>
  );
};

export default MatchScoreboard;
