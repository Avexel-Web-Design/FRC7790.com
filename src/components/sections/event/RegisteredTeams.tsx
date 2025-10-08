import React from 'react';
import NebulaLoader from '../../common/NebulaLoader';
import type { Team } from '../../../hooks/useEventData';
import { getTeamColor } from '../../../utils/color';

interface RegisteredTeamsProps {
  teams: Team[];
  isLoading: boolean;
}

const RegisteredTeams: React.FC<RegisteredTeamsProps> = ({ teams, isLoading }) => {
  const formatTeamNumber = (teamKey: string): string => {
    return teamKey.replace('frc', '');
  };

  const handleTeamClick = (teamNumber: string) => {
    window.location.href = `/team?team=${teamNumber}`;
  };

  // Sort teams numerically by team number
  const sortedTeams = React.useMemo(() => {
    return [...teams].sort((a, b) => {
      const teamNumberA = parseInt(formatTeamNumber(a.key));
      const teamNumberB = parseInt(formatTeamNumber(b.key));
      return teamNumberA - teamNumberB;
    });
  }, [teams]);

  return (
    <div className="container mx-auto px-6 mb-12">
      <h2 className="text-3xl font-bold mb-2 text-center">Registered Teams</h2>
      <p className="text-gray-400 text-center mb-8">
        <span className={isLoading ? 'animate-pulse' : ''}>
          {isLoading ? 'Loading...' : sortedTeams.length}
        </span> teams competing at this event
      </p>
      
      <div className="animate__animated animate__fadeIn">
        {isLoading ? (
          <div className="flex justify-center">
            <NebulaLoader size={64} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedTeams.map((team) => {
              const tn = formatTeamNumber(team.key);
              const favColor = getTeamColor(tn);
              const isFav = !!favColor;
              return (
              <div
                key={team.key}
                className={`card-gradient backdrop-blur-sm rounded-lg p-4 border transition-all duration-300 cursor-pointer hover:scale-105 ${isFav ? '' : 'border-gray-700/50 hover:border-baywatch-orange/50 hover:shadow-lg hover:shadow-baywatch-orange/20'}`}
                style={isFav ? { 
                  borderColor: favColor + '80', 
                  boxShadow: `0 10px 20px -8px ${favColor}33`,
                  ['--hover-shadow' as any]: `0 10px 20px -8px ${favColor}66`
                } : undefined}
                onMouseEnter={(e) => {
                  if (isFav && favColor) {
                    e.currentTarget.style.boxShadow = `0 10px 20px -8px ${favColor}66`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (isFav && favColor) {
                    e.currentTarget.style.boxShadow = `0 10px 20px -8px ${favColor}33`;
                  }
                }}
                onClick={() => handleTeamClick(tn)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-baywatch-orange font-bold text-lg">
                      <span style={isFav ? { color: favColor } : {}}>{tn}</span>
                    </div>
                    <div className="h-6 w-px bg-gray-600"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm truncate">
                        {team.nickname || team.name}
                      </div>
                      {team.city && team.state_prov && (
                        <div className="text-gray-400 text-xs truncate">
                          {team.city}, {team.state_prov}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-2">
                    <i className="fas fa-chevron-right text-gray-500 text-sm"></i>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
        
        {!isLoading && sortedTeams.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <i className="fas fa-info-circle text-2xl mb-2"></i>
            <p>No teams registered for this event yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisteredTeams;
