import React from 'react';
import type { Award } from '../../../hooks/useEventData';

interface AwardsProps {
  awards: Award[];
  isLoading: boolean;
}

const Awards: React.FC<AwardsProps> = ({ awards, isLoading }) => {
  const formatTeamNumber = (teamKey: string): string => {
    return teamKey.replace('frc', '');
  };

  const getAwardIcon = (awardType: number ): string => {

    // Map award types to appropriate icons
    switch (awardType) {
      case 0: // Impact Award
        return 'fas fa-crown text-yellow-400';
      case 1: // Winner
        return 'fas fa-trophy text-yellow-400';
      case 2: // Finalist
        return 'fas fa-medal text-gray-300';
      case 3: // Woodie Flowers Finalist
        return 'fas fa-heart text-red-400';
      case 4: // Dean's List Finalist
        return 'fas fa-star text-blue-400';
      case 5: // Volunteer of the Year
        return 'fas fa-hands-helping text-green-400';
      case 6: // Founder's Award
        return 'fas fa-user-tie text-blue-400';
      case 7: // Coopertition
        return 'fas fa-users text-indigo-400';
      case 9: // Engineering Inspiration
        return 'fas fa-lightbulb text-yellow-500';
      case 10: // Rookie All Star
        return 'fas fa-rocket text-yellow-400';
      case 11: // Gracious Professionalism
        return 'fas fa-handshake text-purple-400';
      case 13: // Judges' Choice
        return 'fas fa-gavel text-orange-400';
      case 15: // Entrepreneurship
        return 'fas fa-chart-line text-green-500';
      case 16: // Industrial Design
        return 'fas fa-drafting-compass text-teal-400';
      case 17: // Quality
        return 'fas fa-check-circle text-green-300';
      case 18: // Highest Rookie Seed
        return 'fas fa-seedling text-green-400';
      case 20: // Creativity
        return 'fas fa-palette text-pink-400';
      case 21: // Excellence in Engineering
        return 'fas fa-cogs text-blue-500';
      case 24: // Media and Technology
        return 'fas fa-broadcast-tower text-red-300';
      case 25: // Rookie Inspiration
        return 'fas fa-lightbulb text-yellow-300';
      case 26: // Safety
        return 'fas fa-shield-alt text-blue-600';
      case 27: // Imagery
        return 'fas fa-camera text-purple-300';
      case 29: // Innovation in Control
        return 'fas fa-microchip text-blue-300';
      case 30: // Team Spirit
        return 'fas fa-flag text-blue-500';
      case 69: // Impact Award Finalist
        return 'fas fa-crown text-gray-300';
      case 71: // Autonomous
        return 'fas fa-robot text-gray-400';
      case 82: // Sustainability
        return 'fas fa-leaf text-green-600';
      case 83: // Rising All-Star
        return 'fas fa-star text-yellow-500';
      default:
        return 'fas fa-award text-gray-400';
    }
  };

  const handleTeamClick = (teamNumber: string) => {
    window.location.href = `/team?team=${teamNumber}`;
  };

  // Rearrange awards so that Engineering Inspiration appears directly below Finalist, which is below Winner
  const sortedAwards = React.useMemo(() => {
    if (!awards) return [] as Award[];

    const impact = awards.filter(
      (a) => a.award_type === 0 || /impact/i.test(a.name) || /chairman/i.test(a.name)
    );
    const winners = awards.filter((a) => a.award_type === 1 || /winner/i.test(a.name));
    const finalists = awards.filter((a) => a.award_type === 2 || /finalist/i.test(a.name));
    const engineeringInspiration = awards.filter((a) => /engineering inspiration/i.test(a.name));
    const others = awards.filter(
      (a) =>
        !impact.includes(a) &&
        !winners.includes(a) &&
        !finalists.includes(a) &&
        !engineeringInspiration.includes(a)
    );

    return [...impact, ...winners, ...finalists, ...engineeringInspiration, ...others];
  }, [awards]);

  if (isLoading) {
    return (
      <section className="tab-content py-8 relative z-10">
        <div className="container mx-auto sm:px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">Event Awards</h2>
          <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-baywatch-orange/30 border-t-baywatch-orange rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Loading awards...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="tab-content py-8 relative z-10">
      <div className="container mx-auto sm:px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Event Awards</h2>
        
        <div className="card-gradient backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          {awards.length === 0 ? (
            <div className="text-center py-16">
              <i className="fas fa-info-circle text-4xl text-gray-500 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No Awards Yet</h3>
              <p className="text-gray-400">Awards will be displayed here after the ceremony.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedAwards.map((award, index) => (
                <div
                  key={`${award.name}-${index}`}
                  className="bg-black/80 rounded-lg p-6 border border-gray-600 hover:border-baywatch-orange/50 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <i className={`${getAwardIcon(award.award_type)} text-2xl`}></i>
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {award.name}
                      </h3>
                      
                      <div className="space-y-2">
                        {award.recipient_list.map((recipient, recipientIndex) => (
                          <div
                            key={`${recipient.team_key || recipient.awardee}-${recipientIndex}`}
                            className="flex items-center space-x-2"
                          >
                            {recipient.team_key && (
                              <span
                                className={`
                                  cursor-pointer hover:text-baywatch-orange transition-colors
                                  ${formatTeamNumber(recipient.team_key) === '7790' 
                                    ? 'text-baywatch-orange font-bold' 
                                    : 'text-baywatch-orange'
                                  }
                                `}
                                onClick={() => handleTeamClick(formatTeamNumber(recipient.team_key!))}
                              >
                                Team {formatTeamNumber(recipient.team_key)}
                                {formatTeamNumber(recipient.team_key) === '7790' && (
                                  <i className="fas fa-star ml-1"></i>
                                )}
                              </span>
                            )}
                            
                            {recipient.awardee && (
                              <span className="text-gray-300">
                                {recipient.awardee}
                              </span>
                            )}
                            
                            {recipient.team_key && recipient.awardee && (
                              <span className="text-gray-500">•</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Awards;
