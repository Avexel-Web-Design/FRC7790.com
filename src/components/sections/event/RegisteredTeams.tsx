import React from 'react';
import type { Team } from '../../../hooks/useEventData';

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

  return (
    <div className="container mx-auto px-6 mb-12">
      <h2 className="text-3xl font-bold mb-2 text-center">Registered Teams</h2>
      <p className="text-gray-400 text-center mb-8">
        <span className={isLoading ? 'animate-pulse' : ''}>
          {isLoading ? 'Loading...' : teams.length}
        </span> teams competing at this event
      </p>
      
      <div className="animate__animated animate__fadeIn">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-baywatch-orange/30 border-t-baywatch-orange rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {teams.map((team) => (
              <div
                key={team.key}
                className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50 hover:border-baywatch-orange/50 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-baywatch-orange/20"
                onClick={() => handleTeamClick(formatTeamNumber(team.key))}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-baywatch-orange font-bold text-lg">
                      {formatTeamNumber(team.key)}
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
                
                {/* Highlight Team 7790 */}
                {team.team_number === 7790 && (
                  <div className="mt-2 text-xs text-baywatch-orange font-semibold">
                    <i className="fas fa-star mr-1"></i>
                    Our Team
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && teams.length === 0 && (
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
