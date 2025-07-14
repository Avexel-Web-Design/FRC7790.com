import { useState, useEffect } from 'react';
import { getTeamCardGradientClass, getTeamAccentStyle } from '../../../utils/color';

interface CurrentEventProps {
  teamNumber: string;
  eventsData: any[];
}

export default function CurrentEvent({ teamNumber, eventsData }: CurrentEventProps) {
  const [currentEventData, setCurrentEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to determine event offset
  const getOffsetForEvent = (eventKey: string): number => {
    if (!eventKey) return 37 * 3600 * 1000; // 37 hour default offset
    
    const eventLower = eventKey.toLowerCase();
    
    if (eventLower.includes('micmp')) return 20.5 * 3600 * 1000;
    if (eventLower.includes('txcmp')) return 17.5 * 3600 * 1000;
    if (eventLower.includes('necmp')) return (17 + (1/6)) * 3600 * 1000;
    
    return 37 * 3600 * 1000; // Default offset for district events
  };

  useEffect(() => {
    const findCurrentEvent = async () => {
      try {
        setLoading(true);
        
        if (!eventsData.length) {
          setCurrentEventData(null);
          setLoading(false);
          return;
        }

        // Sort events by start date
        const sortedEvents = [...eventsData].sort((a, b) => 
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );

        const now = new Date();
        let currentEvent = null;
        let nextEvent = null;

        // Find current or next event with proper offset
        for (const event of sortedEvents) {
          const offset = getOffsetForEvent(event.key);
          const startDate = new Date(new Date(event.start_date).getTime() + offset);
          const endDate = new Date(new Date(event.end_date).getTime() + offset);
          endDate.setHours(23, 59, 59);

          if (now >= startDate && now <= endDate) {
            currentEvent = event;
            break;
          } else if (now < startDate) {
            if (!nextEvent || startDate < new Date(new Date(nextEvent.start_date).getTime() + getOffsetForEvent(nextEvent.key))) {
              nextEvent = event;
            }
          }
        }

        const targetEvent = currentEvent || nextEvent;
        
        if (targetEvent) {
          // Fetch detailed event data
          const eventResponse = await fetch(`https://www.thebluealliance.com/api/v3/event/${targetEvent.key}`, {
            headers: {
              'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
            }
          });

          if (eventResponse.ok) {
            const eventData = await eventResponse.json();
            
            // If it's a current event, get team status
            if (currentEvent) {
              try {
                const statusResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${targetEvent.key}/status`, {
                  headers: {
                    'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
                  }
                });

                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  eventData.teamStatus = statusData;
                }
              } catch (error) {
                console.log('Error fetching team status:', error);
              }

              // Get next match
              try {
                const matchesResponse = await fetch(`https://www.thebluealliance.com/api/v3/team/frc${teamNumber}/event/${targetEvent.key}/matches`, {
                  headers: {
                    'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
                  }
                });

                if (matchesResponse.ok) {
                  const matches = await matchesResponse.json();
                  const upcomingMatch = matches.find((match: any) => !match.actual_time);
                  if (upcomingMatch) {
                    eventData.nextMatch = upcomingMatch;
                  }
                }
              } catch (error) {
                console.log('Error fetching matches:', error);
              }
            }

            eventData.isCurrent = !!currentEvent;
            eventData.isNext = !!nextEvent && !currentEvent;
            eventData.offset = getOffsetForEvent(targetEvent.key);
            
            setCurrentEventData(eventData);
          }
        } else {
          setCurrentEventData(null);
        }
      } catch (error) {
        console.error('Error finding current event:', error);
        setCurrentEventData(null);
      } finally {
        setLoading(false);
      }
    };

    findCurrentEvent();
  }, [teamNumber, eventsData]);

  if (loading) {
    return (
      <>
        {/* Card with gradient, only visible on sm and up */}
        <div className={`hidden sm:block ${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.3s'}}>
          <h2 className="text-2xl font-bold mb-6 text-center">Current Event</h2>
          <div className="text-center">
            <div className="text-gray-400 animate-pulse">Loading event data...</div>
          </div>
        </div>
        {/* Card without gradient, only visible below sm */}
        <div className={`block sm:hidden rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.3s'}}>
          <h2 className="text-2xl font-bold mb-6 text-center">Current Event</h2>
          <div className="text-center">
            <div className="text-gray-400 animate-pulse">Loading event data...</div>
          </div>
        </div>
      </>
    );
  }

  if (!currentEventData) {
    return (
      <>
        {/* Card with gradient, only visible on sm and up */}
        <div className={`hidden sm:block ${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.3s'}}>
          <h2 className="text-2xl font-bold mb-6 text-center">Current Event</h2>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">No Current Event</h3>
            <p className="text-gray-400">There are no active or upcoming events scheduled at this time.</p>
          </div>
        </div>
        {/* Card without gradient, only visible below sm */}
        <div className={`block sm:hidden rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.3s'}}>
          <h2 className="text-2xl font-bold mb-6 text-center">Current Event</h2>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">No Current Event</h3>
            <p className="text-gray-400">There are no active or upcoming events scheduled at this time.</p>
          </div>
        </div>
      </>
    );
  }

  const renderCurrentEvent = () => {
    const status = currentEventData.teamStatus;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6">{currentEventData.name}</h3>
        </div>
        
        {status?.qual?.ranking && (
          <>
            <div className="mb-4">
              <h4 className="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Current Ranking</h4>
              <div className="text-center">
                <span className="text-5xl font-bold mb-2 block">{status.qual.ranking.rank}</span>
                <span className="text-sm text-gray-400">of {status.qual.num_teams} teams</span>
              </div>
            </div>
            
            {status.qual.ranking.record && (
              <div className="mb-4">
                <h4 className="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Record</h4>
                <div className="flex justify-center items-center space-x-8">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-green-400 block">{status.qual.ranking.record.wins}</span>
                    <span className="text-sm text-gray-400">Wins</span>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-red-400 block">{status.qual.ranking.record.losses}</span>
                    <span className="text-sm text-gray-400">Losses</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {currentEventData.nextMatch && (
          <div>
            <h4 className="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Next Match</h4>
            <div className="p-3 bg-black/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">Match {currentEventData.nextMatch.match_number}</span>
                <span className="text-sm text-gray-400">
                  {new Date((currentEventData.nextMatch.predicted_time * 1000) + currentEventData.offset)
                    .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
              <div className="mt-1 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-blue-400">Blue:</span>
                  <span>{currentEventData.nextMatch.alliances.blue.team_keys.map((t: string) => t.replace('frc', '')).join(', ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400">Red:</span>
                  <span>{currentEventData.nextMatch.alliances.red.team_keys.map((t: string) => t.replace('frc', '')).join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNextEvent = () => {
    const startDate = new Date(new Date(currentEventData.start_date).getTime() + currentEventData.offset);
    const endDate = new Date(new Date(currentEventData.end_date).getTime() + currentEventData.offset);
    const now = new Date();
    const timeDiff = startDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));

    return (
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-4">{currentEventData.name}</h3>
        <div className="mt-4 mb-6">
          <span className="text-4xl font-bold" style={getTeamAccentStyle(teamNumber)}>{days}</span>
          <span className="text-xl ml-2">days away</span>
        </div>
        <div className="text-sm text-gray-400">
          {startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long', 
            day: 'numeric'
          })} - {endDate.toLocaleDateString('en-US', {
            month: 'long', 
            day: 'numeric'
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Card with gradient, only visible on sm and up */}
      <div className={`hidden sm:block ${getTeamCardGradientClass(teamNumber)} rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.3s'}}>
        <h2 className="text-2xl font-bold mb-6 text-center">Current Event</h2>
        {currentEventData.isCurrent ? renderCurrentEvent() : renderNextEvent()}
      </div>
      {/* Card without gradient, only visible below sm */}
      <div className={`block sm:hidden rounded-xl p-6 animate__animated animate__fadeIn sm:border sm:border-gray-800`} style={{animationDelay: '0.3s'}}>
        <h2 className="text-2xl font-bold mb-6 text-center">Current Event</h2>
        {currentEventData.isCurrent ? renderCurrentEvent() : renderNextEvent()}
      </div>
    </>
  );
}
