import { useState, useEffect } from 'react';
import { getTeamCardGradientClass, getTeamAccentStyle } from '../../../utils/color';

interface TeamHistoryProps {
  teamNumber: string;
  teamData: any;
}

export default function TeamHistory({ teamNumber, teamData }: TeamHistoryProps) {
  const [historyData, setHistoryData] = useState<{ [year: string]: any[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamHistory = async () => {
      try {
        setLoading(true);
        
        // Fetch all historical events for the team
        const response = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/events`, {
          headers: {
            'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
          }
        });
        
        if (response.ok) {
          const allEvents = await response.json();
          
          // Group events by year
          const eventsByYear: { [year: string]: any[] } = {};
          allEvents.forEach((event: any) => {
            if (!eventsByYear[event.year]) {
              eventsByYear[event.year] = [];
            }
            eventsByYear[event.year].push(event);
          });
          
          // Sort events within each year by start date
          Object.keys(eventsByYear).forEach(year => {
            eventsByYear[year].sort((a, b) => 
              new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            );
          });
          
          // Fetch awards for each event
          const enrichedHistory: { [year: string]: any[] } = {};
          
          for (const year of Object.keys(eventsByYear)) {
            // Skip current year as it's shown in the overview
            if (year === new Date().getFullYear().toString()) continue;
            
            enrichedHistory[year] = [];
            
            for (const event of eventsByYear[year]) {
              const eventWithAwards = { ...event, awards: [] };
              
              try {
                const awardsResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${event.key}/awards`, {
                  headers: {
                    'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
                  }
                });
                
                if (awardsResponse.ok) {
                  const awards = await awardsResponse.json();
                  eventWithAwards.awards = awards;
                }
              } catch (error) {
                console.log(`Error fetching awards for ${event.key}:`, error);
              }
              
              enrichedHistory[year].push(eventWithAwards);
            }
          }
          
          setHistoryData(enrichedHistory);
        }
      } catch (error) {
        console.error('Error fetching team history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (teamNumber) {
      fetchTeamHistory();
    }
  }, [teamNumber]);

  const formatEventDate = (startDate: string) => {
    try {
      const date = new Date(startDate);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Date TBD';
    }
  };

  const renderAwards = (awards: any[]) => {
    if (!awards.length) return null;
    
    return (
      <div className="mt-2">
        <span className="text-sm" style={getTeamAccentStyle(teamNumber)}>Awards: </span>
        <span className="text-sm text-yellow-400">
          {awards.map(award => award.name).join(', ')}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-8 relative z-10">
        <h2 className="text-3xl font-bold mb-8 text-center">Team History</h2>
        <div className={`${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn border border-gray-800`}>
          <div className="text-center">
            <div className="text-gray-400 animate-pulse">Loading team history...</div>
          </div>
        </div>
      </section>
    );
  }

  const years = Object.keys(historyData).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <section className="py-8 relative z-10">
      <h2 className="text-3xl font-bold mb-8 text-center">Team History</h2>
      <div className={`${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn border border-gray-800`}>
        <div className="space-y-6">
          {years.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400">No historical data available</p>
            </div>
          ) : (
            years.map((year) => (
              <div key={year} className="mb-6">
                <h3 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">
                  {year} Season
                </h3>
                <div className="space-y-3">
                  {historyData[year].map((event) => (
                    <div 
                      key={event.key} 
                      className="bg-black/30 p-3 rounded hover:bg-black/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">
                          <a
                            href={`/event?event=${event.key}`}
                            className="transition-colors"
                            style={{
                              color: 'white',
                            }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLAnchorElement).style.color = getTeamAccentStyle(teamNumber).color || '#f97316';
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLAnchorElement).style.color = 'white';
                            }}
                          >
                            {event.name}
                          </a>
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatEventDate(event.start_date)}
                        </span>
                      </div>
                      {renderAwards(event.awards)}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {/* Team summary at bottom */}
          {teamData && (
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-black/30 p-3 rounded">
                    <div className="font-medium" style={getTeamAccentStyle(teamNumber)}>Rookie Year</div>
                    <div className="text-white">{teamData.rookie_year}</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <div className="font-medium" style={getTeamAccentStyle(teamNumber)}>Years Active</div>
                    <div className="text-white">
                      {new Date().getFullYear() - teamData.rookie_year + 1} years
                    </div>
                  </div>
                  <div className="bg-black/30 p-3 rounded">
                    <div className="font-medium" style={getTeamAccentStyle(teamNumber)}>Total Seasons</div>
                    <div className="text-white">{years.length + 1}</div>
                  </div>
                </div>
                
                {teamData.motto && (
                  <div className="mt-4 p-3 bg-black/30 rounded">
                    <div className="font-medium mb-2" style={getTeamAccentStyle(teamNumber)}>Team Motto</div>
                    <div className="text-gray-300 italic">"{teamData.motto}"</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
