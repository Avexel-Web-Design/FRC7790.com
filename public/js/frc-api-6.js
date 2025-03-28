// New function to load team overview data
async function loadTeamOverview() {
    try {
      // Get team from URL parameter, default to 7790 if not specified
      const urlParams = new URLSearchParams(window.location.search);
      const teamNumber = urlParams.get('team') || '7790';
      const teamKey = `frc${teamNumber}`;
      
      // Event offset constants (in milliseconds)
      const OFFSET_MS = 37 * 3600 * 1000; // 37 hour offset for district events
      const MICMP_OFFSET_MS = 20.5 * 3600 * 1000; // 20.5 hour offset for FiM championship
      const TXCMP_OFFSET_MS = 17.5 * 3600 * 1000; // 17.5 hour offset for FiT championship
      const NECMP_OFFSET_MS = (17+(1/6)) * 3600 * 1000; // 17.5 hour offset for NE championship
      
      // Helper function to determine which offset to use based on event key
      function getOffsetForEvent(eventKey) {
        if (!eventKey) return OFFSET_MS;
        
        // Convert to lowercase for case-insensitive comparison
        const eventLower = eventKey.toLowerCase();
        
        // Check for Michigan state championship (micmp)
        if (eventLower.includes('micmp')) {
          return MICMP_OFFSET_MS;
        }
        
        // Check for Texas state championship (txcmp only)
        if (eventLower.includes('txcmp')) {
          return TXCMP_OFFSET_MS;
        }
        
        // Check for New England state championship (necmp)
        if (eventLower.includes('necmp')) {
          return NECMP_OFFSET_MS;
        }
        
        // Default offset for district and other events
        return OFFSET_MS;
      }
      
      // Update page title to reflect current team
      document.title = `Team ${teamNumber} Overview - FRC`;
      
      // Set initial loading state
      document.getElementById("rookie-year").textContent = "Loading...";
      document.getElementById("events-count").textContent = "Loading...";
      document.getElementById("avg-ranking").textContent = "Loading...";
      document.getElementById("win-rate").textContent = "Loading...";
      
      // Fetch team data from TBA API
      const teamResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}`, {
        headers: {
          'X-TBA-Auth-Key': window.TBA_AUTH_KEY
        }
      });
      
      if (!teamResponse.ok) {
        throw new Error('Failed to fetch team data');
      }
      
      const teamData = await teamResponse.json();
      
      // Update page title with team nickname
      document.title = `Team ${teamNumber} - ${teamData.nickname} - Overview`;
      
      // Update hero section with team name and number
      const heroTitle = document.querySelector('section.pt-36 h1');
      if (heroTitle) {
        heroTitle.innerHTML = `
          <span class="text-white inline-block animate__animated animate__fadeInUp" style="animation-delay: 0.2s">Team</span>
          <span class="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp" style="animation-delay: 0.4s">${teamNumber}</span>
        `;
      }
      
      const heroSubtitle = document.querySelector('section.pt-36 p');
      if (heroSubtitle) {
        heroSubtitle.textContent = teamData.nickname + (teamData.school_name ? ` - ${teamData.school_name}` : '');
      }
      
      // Update basic team stats
      document.getElementById("rookie-year").textContent = teamData.rookie_year || "N/A";
      document.getElementById("team-location").textContent = `${teamData.city}, ${teamData.state_prov}`;
      
      // Fetch current year events (using 2024 since we're in early 2024, will need update later)
      const currentYear = new Date().getFullYear();
      const eventsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/events/${currentYear}`, {
        headers: {
          'X-TBA-Auth-Key': window.TBA_AUTH_KEY
        }
      });
      
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch events data');
      }
      
      const eventsData = await eventsResponse.json();
      
      // Update events count
      document.getElementById("events-count").textContent = eventsData.length;
      
      // Process events data for the table
      let eventsTable = document.getElementById("events-table").querySelector("tbody");
      eventsTable.innerHTML = '';
      
      if (eventsData.length === 0) {
        eventsTable.innerHTML = `
          <tr>
            <td colspan="5" class="p-4 text-center">No events scheduled for ${currentYear} yet.</td>
        `;
      } else {
        // Sort events by start date
        eventsData.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        
        // Calculate which event is current or next, applying the appropriate offset
        const now = new Date();
        let currentEvent = null;
        let nextEvent = null;
        
        for (const event of eventsData) {
          // Apply offset to start and end dates
          const offset = getOffsetForEvent(event.key);
          const startDate = new Date(new Date(event.start_date).getTime() + offset);
          const endDate = new Date(new Date(event.end_date).getTime() + offset);
          endDate.setHours(23, 59, 59); // Set to end of day
          
          if (now >= startDate && now <= endDate) {
            currentEvent = event;
            break;
          } else if (now < startDate) {
            if (!nextEvent || startDate < new Date(new Date(nextEvent.start_date).getTime() + getOffsetForEvent(nextEvent.key))) {
              nextEvent = event;
            }
          }
        }
        
        // Process and display each event
        for (const event of eventsData) {
          // Fetch team status at this event
          let ranking = "Not Available";
          let record = "N/A";
          let awards = "None";
          
          try {
            // Get team status (includes ranking)
            const statusResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/status`, {
              headers: {
                'X-TBA-Auth-Key': window.TBA_AUTH_KEY
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData && statusData.qual && statusData.qual.ranking) {
                ranking = `${statusData.qual.ranking.rank} of ${statusData.qual.num_teams}`;
                
                if (statusData.qual.ranking.record) {
                  record = `${statusData.qual.ranking.record.wins}-${statusData.qual.ranking.record.losses}-${statusData.qual.ranking.record.ties}`;
                }
              }
            }
            
            // Get awards
            const awardsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/awards`, {
              headers: {
                'X-TBA-Auth-Key': window.TBA_AUTH_KEY
              }
            });
            
            if (awardsResponse.ok) {
              const awardsData = await awardsResponse.json();
              if (awardsData.length > 0) {
                awards = awardsData.map(award => award.name).join(", ");
              }
            }
          } catch (error) {
            console.log(`Error fetching details for event ${event.key}:`, error);
          }
          
          // Format date with appropriate offset
          const offset = getOffsetForEvent(event.key);
          const startDate = new Date(new Date(event.start_date).getTime() + offset);
          const endDate = new Date(new Date(event.end_date).getTime() + offset);
          const dateStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          
          // Create row
          const row = document.createElement("tr");
          
          // Highlight current event
          if (currentEvent && currentEvent.key === event.key) {
            row.classList.add("bg-baywatch-orange/10");
          }
          
          row.innerHTML = `
            <td class="p-4">
              <a href="event.html?event=${event.key}" 
                 class="hover:text-baywatch-orange transition-colors font-medium">
                ${event.name}
                ${currentEvent && currentEvent.key === event.key ? 
                  '<span class="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Current</span>' : 
                  (nextEvent && nextEvent.key === event.key ? 
                    '<span class="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Next</span>' : '')}
              </a>
            </td>
            <td class="p-4">${dateStr}</td>
            <td class="p-4">${ranking}</td>
            <td class="p-4">${record}</td>
            <td class="p-4">${awards}</td>
          `;
          
          eventsTable.appendChild(row);
        }
        
        // Calculate and update average ranking and win rate
        let totalRank = 0;
        let totalEvents = 0;
        let totalWins = 0;
        let totalMatches = 0;
        
        for (const event of eventsData) {
          try {
            const statusResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/status`, {
              headers: {
                'X-TBA-Auth-Key': window.TBA_AUTH_KEY
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData && statusData.qual && statusData.qual.ranking) {
                totalRank += statusData.qual.ranking.rank;
                totalEvents++;
                
                if (statusData.qual.ranking.record) {
                  totalWins += statusData.qual.ranking.record.wins;
                  totalMatches += statusData.qual.ranking.record.wins + 
                                 statusData.qual.ranking.record.losses + 
                                 statusData.qual.ranking.record.ties;
                }
              }
            }
          } catch (error) {
            console.log(`Error fetching status for event ${event.key}:`, error);
          }
        }
        
        // Update average ranking and win rate
        if (totalEvents > 0) {
          const avgRank = (totalRank / totalEvents).toFixed(1);
          document.getElementById("avg-ranking").textContent = avgRank;
        } else {
          document.getElementById("avg-ranking").textContent = "N/A";
        }
        
        if (totalMatches > 0) {
          const winRate = ((totalWins / totalMatches) * 100).toFixed(1) + "%";
          document.getElementById("win-rate").textContent = winRate;
        } else {
          document.getElementById("win-rate").textContent = "N/A";
        }
        
        // Update current event container
        const currentEventContainer = document.getElementById("current-event-container");
        if (currentEvent) {
          // Hide loading message
          document.getElementById("event-loading").style.display = "none";
          
          // Get team status at current event
          try {
            const statusResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${currentEvent.key}/status`, {
              headers: {
                'X-TBA-Auth-Key': window.TBA_AUTH_KEY
              }
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              
              let rankHtml = "Ranking not available";
              let recordHtml = "Record not available";
              let nextMatchHtml = "No upcoming matches";
              
              if (statusData && statusData.qual && statusData.qual.ranking) {
                rankHtml = `
                  <div class="text-center">
                    <span class="text-5xl font-bold mb-2 block">${statusData.qual.ranking.rank}</span>
                    <span class="text-sm text-gray-400">of ${statusData.qual.num_teams} teams</span>
                  </div>
                `;
                
                if (statusData.qual.ranking.record) {
                  recordHtml = `
                    <div class="flex justify-center items-center space-x-8">
                      <div class="text-center">
                        <span class="text-4xl font-bold text-green-400 block">${statusData.qual.ranking.record.wins}</span>
                        <span class="text-sm text-gray-400">Wins</span>
                      </div>
                      <div class="text-center">
                        <span class="text-4xl font-bold text-red-400 block">${statusData.qual.ranking.record.losses}</span>
                        <span class="text-sm text-gray-400">Losses</span>
                      </div>
                    </div>
                  `;
                }
              }
              
              // Get next match
              const matchesResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${currentEvent.key}/matches`, {
                headers: {
                  'X-TBA-Auth-Key': window.TBA_AUTH_KEY
                }
              });
              
              if (matchesResponse.ok) {
                const matches = await matchesResponse.json();
                
                // Find upcoming match
                const upcomingMatch = matches.find(match => !match.actual_time);
                
                if (upcomingMatch) {
                  // Apply the appropriate offset to the match time
                  const matchTime = new Date((upcomingMatch.predicted_time * 1000) + getOffsetForEvent(currentEvent.key));
                  const timeStr = matchTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                  
                  const isBlue = upcomingMatch.alliances.blue.team_keys.includes(teamKey);
                  const allianceClass = isBlue ? 'text-blue-400' : 'text-red-400';
                  
                  nextMatchHtml = `
                    <div class="p-3 bg-black/30 rounded-lg">
                      <div class="flex items-center justify-between mb-2">
                        <span class="font-bold">Match ${upcomingMatch.match_number}</span>
                        <span class="text-sm text-gray-400">${timeStr}</span>
                      </div>
                      <div class="mt-1 text-sm">
                        <div class="flex justify-between items-center mb-1 ${isBlue ? 'font-bold' : ''}">
                          <span class="text-blue-400">Blue:</span>
                          <span>${upcomingMatch.alliances.blue.team_keys.map(t => t.replace('frc', '')).join(', ')}</span>
                        </div>
                        <div class="flex justify-between items-center ${!isBlue ? 'font-bold' : ''}">
                          <span class="text-red-400">Red:</span>
                          <span>${upcomingMatch.alliances.red.team_keys.map(t => t.replace('frc', '')).join(', ')}</span>
                        </div>
                      </div>
                      <a href="match.html?match=${upcomingMatch.key}" class="block mt-3 text-center text-xs bg-baywatch-orange/30 hover:bg-baywatch-orange/50 transition-colors py-1 rounded text-white">
                        View Match Details
                      </a>
                    </div>
                  `;
                }
              }
              
              // Update the current event container
              currentEventContainer.innerHTML = `
                <div class="text-center">
                  <h3 class="text-xl font-semibold mb-6">${currentEvent.name}</h3>
                </div>
                
                <div class="space-y-6">
                  <div class="mb-4">
                    <h4 class="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Current Ranking</h4>
                    ${rankHtml}
                  </div>
                  
                  <div class="mb-4">
                    <h4 class="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Record</h4>
                    ${recordHtml}
                  </div>
                  
                  <div>
                    <h4 class="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Next Match</h4>
                    ${nextMatchHtml}
                  </div>
                </div>
              `;
            } else {
              // Handle case where status isn't available yet
              currentEventContainer.innerHTML = `
                <div class="text-center">
                  <h3 class="text-xl font-semibold mb-4">${currentEvent.name}</h3>
                  <p class="text-gray-400">This event is currently in progress, but complete data is not yet available.</p>
                  <p class="text-sm mt-2">Check back soon for rankings and match information.</p>
                </div>
              `;
            }
          } catch (error) {
            console.log("Error fetching current event status:", error);
            currentEventContainer.innerHTML = `
              <div class="text-center">
                <h3 class="text-xl font-semibold mb-4">${currentEvent.name}</h3>
                <p class="text-gray-400">Unable to load event data at this time.</p>
                <p class="text-sm mt-2">Please try again later.</p>
              </div>
            `;
          }
        } else if (nextEvent) {
          // Show next event countdown with appropriate offset
          document.getElementById("event-loading").style.display = "none";
          
          const offset = getOffsetForEvent(nextEvent.key);
          const startDate = new Date(new Date(nextEvent.start_date).getTime() + offset);
          const now = new Date();
          
          // Calculate difference with adjusted time
          const timeDiff = startDate.getTime() - now.getTime();
          const days = Math.floor(timeDiff / (1000 * 3600 * 24));
          
          currentEventContainer.innerHTML = `
            <div class="text-center">
              <h3 class="text-xl font-semibold mb-4">${nextEvent.name}</h3>
              <div class="mt-4 mb-6">
                <span class="text-4xl font-bold text-baywatch-orange">${days}</span>
                <span class="text-xl ml-2">days away</span>
              </div>
              <div class="text-sm text-gray-400">
                ${startDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric'
                })} - ${new Date(new Date(nextEvent.end_date).getTime() + offset).toLocaleDateString('en-US', {
                  month: 'long', 
                  day: 'numeric'
                })}
              </div>
            </div>
          `;
        } else {
          // No current or upcoming events
          document.getElementById("event-loading").style.display = "none";
          currentEventContainer.innerHTML = `
            <div class="text-center">
              <h3 class="text-xl font-semibold mb-4">No Current Event</h3>
              <p class="text-gray-400">There are no active or upcoming events scheduled at this time.</p>
            </div>
          `;
        }
        
        // Update team history section
        const teamHistoryElement = document.getElementById("team-history");
        
        // Fetch all historical events
        const allEventsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/events`, {
          headers: {
            'X-TBA-Auth-Key': window.TBA_AUTH_KEY
          }
        });
        
        if (allEventsResponse.ok) {
          const allEvents = await allEventsResponse.json();
          
          // Group events by year
          const eventsByYear = {};
          allEvents.forEach(event => {
            if (!eventsByYear[event.year]) {
              eventsByYear[event.year] = [];
            }
            eventsByYear[event.year].push(event);
          });
          
          // Sort years in descending order
          const years = Object.keys(eventsByYear).sort((a, b) => b - a);
          
          let historyHTML = '';
          
          for (const year of years) {
            if (year === currentYear.toString()) continue; // Skip current year as it's shown above
            
            const yearEvents = eventsByYear[year];
            yearEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
            
            // Create year section
            historyHTML += `
              <div class="mb-6">
                <h3 class="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">${year} Season</h3>
                <div class="space-y-3">
            `;
            
            // Add events for this year
            for (const event of yearEvents) {
              // Try to fetch awards for this event
              let awardsHTML = '';
              try {
                const awardsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/awards`, {
                  headers: {
                    'X-TBA-Auth-Key': window.TBA_AUTH_KEY
                  }
                });
                
                if (awardsResponse.ok) {
                  const awards = await awardsResponse.json();
                  if (awards.length > 0) {
                    awardsHTML = `
                      <div class="mt-2">
                        <span class="text-sm text-baywatch-orange">Awards: </span>
                        <span class="text-sm">${awards.map(a => a.name).join(', ')}</span>
                      </div>
                    `;
                  }
                }
              } catch (error) {
                console.log(`Error fetching awards for ${event.key}:`, error);
              }
              
              historyHTML += `
                <div class="bg-black/30 p-3 rounded">
                  <div class="flex justify-between items-center">
                    <span class="font-medium">${event.name}</span>
                    <span class="text-sm text-gray-400">${new Date(event.start_date).toLocaleDateString('en-US', {
                      month: 'short', 
                      day: 'numeric'
                    })}</span>
                  </div>
                  ${awardsHTML}
                </div>
              `;
            }
            
            historyHTML += `
                </div>
              </div>
            `;
          }
          
          teamHistoryElement.innerHTML = historyHTML || `
            <div class="text-center py-4">
              <p class="text-gray-400">No historical data available</p>
            </div>
          `;
        } else {
          teamHistoryElement.innerHTML = `
            <div class="text-center py-4">
              <p class="text-gray-400">Unable to load team history</p>
            </div>
          `;
        }
      }
      
      // Update social media links for the specific team
      updateTeamSocialLinks(teamNumber);
      
    } catch (error) {
      console.error("Error loading team overview data:", error);
      
      // Update UI with error messages
      document.getElementById("rookie-year").textContent = "Error";
      document.getElementById("events-count").textContent = "Error";
      document.getElementById("avg-ranking").textContent = "Error";
      document.getElementById("win-rate").textContent = "Error";
      
      document.getElementById("events-table").querySelector("tbody").innerHTML = `
        <tr>
          <td colspan="5" class="p-4 text-center text-red-400">
            <i class="fas fa-circle-exclamation mr-1"></i> Error loading team data. Please try again later.
          </td>
        </tr>
      `;
      
      document.getElementById("event-loading").style.display = "none";
      document.getElementById("current-event-container").innerHTML = `
        <div class="text-center">
          <h3 class="text-xl font-semibold mb-4 text-red-400">Error</h3>
          <p class="text-gray-400">Unable to load event data at this time.</p>
          <p class="text-sm mt-2">Please try again later.</p>
        </div>
      `;
      
      document.getElementById("team-history").innerHTML = `
        <div class="text-center py-4">
          <p class="text-gray-400">Unable to load team history</p>
        </div>
      `;
    }
  }