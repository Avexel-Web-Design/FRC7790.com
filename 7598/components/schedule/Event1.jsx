import React, { useState, useEffect } from 'react';
import useScrollReveal from "../../hooks/useScrollReveal";

const Event1 = () => {
  useScrollReveal();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamEvents, setTeamEvents] = useState([]);
  const [divisionNumber, setDivisionNumber] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Get the current year
        const currentYear = new Date().getFullYear();
        
        // Fetch all events for team 7598 in the current year
        const response = await fetch(
          `https://www.thebluealliance.com/api/v3/team/frc7598/events/${currentYear}`,
          {
            headers: {
              'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API response error: ${response.status}`);
        }

        const events = await response.json();
        setTeamEvents(events);
        
        // Sort events by start date to get the first event
        const sortedEvents = events.sort(
          (a, b) => new Date(a.start_date) - new Date(b.start_date)
        );
        
        // Get the first event (excluding state championship and worlds)
        const firstEvent = sortedEvents.find(event => 
          !event.key.includes('micmp') && 
          !event.key.includes('cmptx')
        );
        
        if (!firstEvent) {
          throw new Error('No district/regional events found for this team');
        }
        
        setEventData(firstEvent);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching event data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEventData();
  }, []);

  // Function to determine division number
  const getDivisionInfo = () => {
    if (!eventData) return null;
    
    // For regular events, no division is shown
    if (!eventData.key.includes('micmp') && !eventData.key.includes('cmptx')) {
      return null;
    }
    
    // For Michigan State Championship
    if (eventData.key.includes('micmp')) {
      // Check team events to see which division we're in
      for (const event of teamEvents) {
        if (event.key.includes('micmp1')) return 1;
        if (event.key.includes('micmp2')) return 2;
        if (event.key.includes('micmp3')) return 3;
        if (event.key.includes('micmp4')) return 4;
      }
    }
    
    return null;
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Function to get appropriate Font Awesome icon class for a webcast
  const getWebcastIcon = (type) => {
    switch (type) {
      case 'twitch':
        return 'fab fa-twitch';
      case 'youtube':
        return 'fab fa-youtube';
      default:
        return 'fas fa-video';
    }
  };
  
  // Function to get webcast URL
  const getWebcastUrl = (webcast) => {
    switch (webcast.type) {
      case 'twitch':
        return `https://www.twitch.tv/${webcast.channel}`;
      case 'youtube':
        return `https://www.youtube.com/watch?v=${webcast.channel}`;
      default:
        return `#`;
    }
  };
  
  // Function to detect and label webcasts appropriately
  const getLabelForWebcast = (webcast, index, total) => {
    // If we only have one webcast, don't add labels
    if (total === 1) return '';
    
    // Check if the webcast has a description
    if (webcast.description && webcast.description.trim()) {
      return webcast.description;
    }
    
    // Check if the event key or name suggests it has divisions
    const hasDivisions = eventData && (
      (eventData.key && (eventData.key.includes('micmp') || eventData.key.includes('cmptx'))) ||
      (eventData.name && (
        eventData.name.toLowerCase().includes('championship') && 
        (eventData.name.toLowerCase().includes('world') || eventData.name.toLowerCase().includes('state') || eventData.name.toLowerCase().includes('district'))
      ))
    );
       
    if (hasDivisions) {
      // For events with divisions, use division numbers
      return `Division ${index + 1}`;
    } else {
      // For events without divisions but multiple streams, use more generic labels
      if (total === 2) {
        return index === 0 ? "Main Field" : "Secondary Field";
      } else {
        return `Field ${index + 1}`;
      }
    }
  };

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Add a centered title section to match championship style */}
          {eventData && !loading && !error && (
            <div className="text-center mb-10 reveal-bottom">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-[hsl(275,60%,20%)] to-[hsl(275,60%,80%)] bg-clip-text text-transparent">
                  {eventData.name}
                </span>
              </h2>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loader">
                <div className="flex space-x-2">
                  <div className="h-3 w-3 bg-sca-purple rounded-full animate-bounce"></div>
                  <div className="h-3 w-3 bg-sca-purple rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="h-3 w-3 bg-sca-purple rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
                <p className="mt-4 text-gray-300">Loading event data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-lg p-6 text-center">
              <h3 className="text-xl text-red-400 font-bold mb-2">Error Loading Data</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          ) : eventData ? (
            <div className="modern-card p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Event Details</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-sca-gold mr-2">•</span>
                      <span><strong>Dates:</strong> {formatDate(eventData.start_date)} - {formatDate(eventData.end_date)}</span>
                    </li>
                    {getDivisionInfo() && (
                      <li className="flex items-start">
                        <span className="text-sca-gold mr-2">•</span>
                        <span><strong>Our Division:</strong> Division {getDivisionInfo()}</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Watch Live</h3>
                  {eventData.webcasts && eventData.webcasts.length > 0 ? (
                    <ul className="space-y-3 text-gray-300">
                      {eventData.webcasts.map((webcast, index) => {
                        const divisionLabel = getLabelForWebcast(webcast, index, eventData.webcasts.length);
                        
                        return (
                          <li key={index} className="flex items-center group">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon mr-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12">
                              <i className={`${getWebcastIcon(webcast.type)} text-sca-gold`}></i>
                            </div>
                            <div>
                              <a 
                                href={getWebcastUrl(webcast)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sca-gold hover:text-sca-gold-light transition-colors"
                              >
                                Watch on {webcast.type === 'twitch' ? 'Twitch' : webcast.type === 'youtube' ? 'YouTube' : 'Stream'}
                              </a>
                              {divisionLabel && (
                                <div className="text-gray-400 text-sm mt-0.5">{divisionLabel}</div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-gray-400">No webcasts available for this event.</p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-center">
                <a 
                  href={`https://www.thebluealliance.com/event/${eventData.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-modern px-6 py-3 transition-all duration-300"
                >
                  View on TBA
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-6 text-center">
              <h3 className="text-xl text-yellow-400 font-bold mb-2">No Event Data Found</h3>
              <p className="text-gray-300">Could not find information for the first event.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-[#471a67]/20 to-transparent rounded-full filter blur-3xl -z-10" aria-hidden="true"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-radial from-[#d3b840]/10 to-transparent rounded-full filter blur-3xl -z-10" aria-hidden="true"></div>
    </section>
  );
};

export default Event1;