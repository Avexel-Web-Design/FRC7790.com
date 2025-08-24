import React, { useState, useEffect } from 'react';
import useScrollReveal from "../../hooks/useScrollReveal";

const Worlds = () => {
  useScrollReveal();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamEvents, setTeamEvents] = useState([]);
  const [divisionName, setDivisionName] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Get the current year
        const currentYear = new Date().getFullYear();
        
        // Fetch all team events to detect division
        const teamResponse = await fetch(
          `https://www.thebluealliance.com/api/v3/team/frc7598/events/${currentYear}`,
          {
            headers: {
              'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
            }
          }
        );
        
        if (!teamResponse.ok) {
          throw new Error(`Team API response error: ${teamResponse.status}`);
        }
        
        const events = await teamResponse.json();
        setTeamEvents(events);
        
        // Check for world championship division
        const divisionMap = {
          'arc': 'Archimedes',
          'cur': 'Curie',
          'dal': 'Daly',
          'gal': 'Galileo',
          'hop': 'Hopper',
          'joh': 'Johnson',
          'mil': 'Milstein',
          'new': 'Newton'
        };
        
        // Look for division in team events
        for (const event of events) {
          if (event.key.includes('cmptx') && event.key !== `${currentYear}cmptx`) {
            // This is a division event at worlds
            for (const divKey in divisionMap) {
              if (event.key.includes(divKey)) {
                setDivisionName(divisionMap[divKey]);
                break;
              }
            }
          }
        }
        
        // Direct API call to championship event using the event key pattern
        const response = await fetch(
          `https://www.thebluealliance.com/api/v3/event/${currentYear}cmptx`,
          {
            headers: {
              'X-TBA-Auth-Key': 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API response error: ${response.status}`);
        }

        const data = await response.json();
        setEventData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching event data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEventData();
  }, []);

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 reveal-bottom">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[hsl(275,60%,20%)] to-[hsl(275,60%,80%)] bg-clip-text text-transparent">
                {eventData ? eventData.name : "FIRST Championship"}
              </span>
            </h2>
          </div>
          
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
            <div className="modern-card p-8 reveal-bottom">
              <div className="p-3 rounded-full mb-6 border border-[#d3b840]/30">
                <p className="text-center text-gray-200 font-medium">
                  <span className="text-sca-gold">⚠</span> Qualification Dependent
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Championship Details</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <span className="text-sca-gold mr-2">•</span>
                      <span><strong>Dates:</strong> {formatDate(eventData.start_date)} - {formatDate(eventData.end_date)}</span>
                    </li>
                    {divisionName && (
                      <li className="flex items-start">
                        <span className="text-sca-gold mr-2">•</span>
                        <span><strong>Our Division:</strong> {divisionName}</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Watch Live</h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-center group">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon mr-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12">
                        <i className="fas fa-gamepad text-sca-gold"></i>
                      </div>
                      <div>
                        <a 
                          href="https://www.thebluealliance.com/gameday"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sca-gold hover:text-sca-gold-light transition-colors"
                        >
                          Watch on TBA Gameday
                        </a>
                        <div className="text-gray-400 text-sm mt-0.5">All Divisions</div>
                      </div>
                    </li>
                  </ul>
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
            <div className="modern-card p-8 reveal-bottom">
              {/* Qualification dependent notice */}
              <div className="bg-gradient-to-r from-[#d3b840]/20 to-[#471a67]/20 p-3 rounded-lg mb-6 border border-[#d3b840]/30">
                <p className="text-center text-gray-200 font-medium">
                  <span className="text-sca-gold">⚠</span> Qualification Dependent
                </p>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">Championship Details</h3>
              <p className="text-gray-300 mb-6">
                The FIRST Championship is the culmination of the season, bringing together teams from around the world. 
                The event is typically held in Houston, Texas in late April.
              </p>
              
              <div className="bg-gradient-to-r from-[#471a67]/20 to-[#d3b840]/20 p-4 rounded-lg mb-6">
                <p className="text-center text-gray-300">
                  Stay tuned for information on our qualification and performance at the 2025 FIRST Championship!
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                  <h4 className="text-sca-gold font-medium mb-2">Expected Date</h4>
                  <p className="text-sm text-gray-400">April 23-26, 2025</p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white mb-4">Watch Live</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center group">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sca-purple-light to-sca-purple-dark flex items-center justify-center shadow-neon mr-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(211,184,64,0.7)] group-hover:rotate-12">
                      <i className="fas fa-gamepad text-sca-gold"></i>
                    </div>
                    <div>
                      <a 
                        href="https://www.thebluealliance.com/gameday"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sca-gold hover:text-sca-gold-light transition-colors"
                      >
                        Watch on TBA Gameday
                      </a>
                      <div className="text-gray-400 text-sm mt-0.5">All Divisions</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-gradient-radial from-[#d3b840]/20 to-transparent rounded-full filter blur-3xl -z-10" aria-hidden="true"></div>
      <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-gradient-radial from-[#471a67]/30 to-transparent rounded-full filter blur-3xl -z-10" aria-hidden="true"></div>
    </section>
  );
};

export default Worlds;