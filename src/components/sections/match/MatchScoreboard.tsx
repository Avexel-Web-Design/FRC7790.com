import React, { useEffect, useState } from 'react';
import type { MatchData, TeamData } from '../../../hooks/useMatchData';
import { getDivisionMapping, getAllianceDisplayName } from '../../../utils/divisionUtils';
import { getTeamColor } from '../../../utils/color';

interface MatchScoreboardProps {
  matchData: MatchData;
  teamData: TeamData[];
}

const MatchScoreboard: React.FC<MatchScoreboardProps> = ({ matchData, teamData }) => {
  const [allianceNumbers, setAllianceNumbers] = useState<{ blue: string; red: string }>({ blue: '?', red: '?' });

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
            </div>
          </div>
          
          {/* Match Result Banner */}
          {getResultBanner()}
        </div>
      </div>

    </section>
  );
};

export default MatchScoreboard;
