import React, { useEffect, useState } from 'react';
import type { MatchData, TeamData } from '../../../hooks/useMatchData';

interface MatchTeamDetailsProps {
  matchData: MatchData;
  teamData: TeamData[];
}

interface TeamEPA {
  [teamKey: string]: number;
}

const MatchTeamDetails: React.FC<MatchTeamDetailsProps> = ({ matchData, teamData }) => {
  const [epaData, setEpaData] = useState<TeamEPA>({});
  const [loadingEPA, setLoadingEPA] = useState(true);

  // Create a map of team keys to team data for quick lookup
  const teamMap = teamData.reduce((map, team) => {
    map[team.key] = team;
    return map;
  }, {} as { [key: string]: TeamData });

  // Fetch EPA data from Statbotics
  useEffect(() => {
    const fetchEPAData = async () => {
      setLoadingEPA(true);
      const eventKey = matchData.event_key;
      const allTeamKeys = [
        ...matchData.alliances.blue.team_keys,
        ...matchData.alliances.red.team_keys
      ];

      const epaMap: TeamEPA = {};

      try {
        const epaPromises = allTeamKeys.map(async (teamKey) => {
          try {
            const teamNumber = teamKey.replace('frc', '');
            const response = await fetch(`https://api.statbotics.io/v3/team_event/${teamNumber}/${eventKey}`);
            
            if (response.ok) {
              const teamEventData = await response.json();
              if (teamEventData?.epa?.total_points?.mean) {
                epaMap[teamKey] = Math.round(teamEventData.epa.total_points.mean);
              }
            }
          } catch (error) {
            // Silently fail for individual teams
          }
        });

        await Promise.all(epaPromises);
        setEpaData(epaMap);
      } catch (error) {
        console.error('Error fetching EPA data:', error);
      } finally {
        setLoadingEPA(false);
      }
    };

    fetchEPAData();
  }, [matchData]);

  const renderTeamCard = (teamKey: string, alliance: 'blue' | 'red') => {
    const team = teamMap[teamKey];
    const teamNumber = teamKey.replace('frc', '');
    const is7790 = teamNumber === '7790';
    const epa = epaData[teamKey];

    if (!team) {
      return (
        <div key={teamKey} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-400">Team {teamNumber}</div>
            <div className="text-sm text-gray-500">Loading team info...</div>
          </div>
        </div>
      );
    }

    const allianceColor = alliance === 'blue' ? 'border-blue-500/30 bg-blue-500/10' : 'border-red-500/30 bg-red-500/10';
    const teamNumberColor = alliance === 'blue' ? 'text-blue-400' : 'text-red-400';

    return (
      <div key={teamKey} className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${allianceColor} ${is7790 ? 'ring-2 ring-baywatch-orange/50' : ''}`}>
        <div className="text-center">
          <div className={`text-2xl font-bold ${teamNumberColor} mb-1`}>
            <a 
              href={`/team?team=${teamNumber}`} 
              className="hover:underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {teamNumber}
              <i className="fas fa-external-link-alt text-xs ml-1 opacity-60"></i>
            </a>
          </div>
          <div className="text-white font-semibold mb-2 line-clamp-2">{team.nickname}</div>
          <div className="text-xs text-gray-400 mb-3">
            {team.city}, {team.state_prov}
            {team.country !== 'USA' && `, ${team.country}`}
          </div>
          
          {/* EPA Display */}
          <div className="text-center">
            {loadingEPA ? (
              <div className="text-xs text-gray-500">Loading EPA...</div>
            ) : epa ? (
              <div className="bg-black/30 rounded px-2 py-1">
                <div className="text-xs text-gray-400">EPA</div>
                <div className="text-sm font-mono font-bold text-baywatch-orange">{epa}</div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">EPA: N/A</div>
            )}
          </div>

          {/* Winner indicator */}
          {matchData.winning_alliance === alliance && matchData.alliances.blue.score !== null && (
            <div className="mt-2 flex justify-center">
              <div className={`px-2 py-1 rounded text-xs font-bold ${alliance === 'blue' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                <i className="fas fa-trophy mr-1"></i>
                Winner
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Team Information</h2>
      <div className="card-gradient backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="space-y-6">
          {/* Blue Alliance Teams */}
          <div>
            <h3 className="text-blue-400 font-bold mb-3 flex items-center">
              <i className="fas fa-users mr-2"></i>
              Blue Alliance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchData.alliances.blue.team_keys.map(teamKey => renderTeamCard(teamKey, 'blue'))}
            </div>
          </div>

          {/* Red Alliance Teams */}
          <div>
            <h3 className="text-red-400 font-bold mb-3 flex items-center">
              <i className="fas fa-users mr-2"></i>
              Red Alliance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchData.alliances.red.team_keys.map(teamKey => renderTeamCard(teamKey, 'red'))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MatchTeamDetails;
