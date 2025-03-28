// New function to update social media links for the specific team
function updateTeamSocialLinks(teamNumber) {
    // Update social links container with consistent links for all teams
    const socialLinksContainer = document.getElementById('team-links-container');
    if (socialLinksContainer) {
      socialLinksContainer.innerHTML = `
        <a href="https://www.thebluealliance.com/team/${teamNumber}" target="_blank" class="flex items-center p-3 rounded-lg bg-black/30 hover:bg;-black/50 transition-all group">
          <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-link text-blue-400"></i>
          </div>
          <div>
            <span class="font-semibold">The Blue Alliance</span>
            <p class="text-sm text-gray-400 group-hover:text-gray-300">Team ${teamNumber} Profile</p>
          </div>
          <i class="fas fa-external-link ml-auto opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"></i>
        </a>
        
        <a href="https://frc-events.firstinspires.org/team/${teamNumber}" target="_blank" class="flex items-center p-3 rounded-lg bg-black/30 hover:bg-black/50 transition-all group">
          <div class="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
            <i class="fas fa-robot text-green-400"></i>
          </div>
          <div>
            <span class="font-semibold">FIRST Inspires</span>
            <p class="text-sm text-gray-400 group-hover:text-gray-300">Team ${teamNumber} on FIRST</p>
          </div>
          <i class="fas fa-external-link ml-auto opacity-50 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all"></i>
        </a>
      `;
    }
  }
  
  // Add initialization for team.html page
  if (window.location.pathname.includes('team.html')) {
    // Initialize Team Overview page
    document.addEventListener('DOMContentLoaded', function() {
      loadTeamOverview();
    });
  }
  
  // Add initialization for the event page without periodic updates
  document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('event.html')) {
      // Parse URL parameters to get event code
      const urlParams = new URLSearchParams(window.location.search);
      const eventCode = urlParams.get('event');
      
      if (eventCode) {
        // Prepare the event page based on whether it has started
        prepareEventPage(eventCode);
        
        // Automatic refresh has been removed to prevent data updates every 30-60 seconds
      }
    }
  });
  
  // Helper function to get the appropriate offset for an event
  function getEventOffset(eventKey) {
    // Use the global function if available, otherwise use constants here
    if (window.getOffsetForEvent) {
      return window.getOffsetForEvent(eventKey);
    }
    
    // Fallback constants if the global function is not available
    const OFFSET_MS = 37 * 3600 * 1000; // 37 hour offset for district events
    const MICMP_OFFSET_MS = 20.5 * 3600 * 1000; // 20.5 hour offset for FiM championship
    const TXCMP_OFFSET_MS = 17.5 * 3600 * 1000; // 17.5 hour offset for FiT championship
    const NECMP_OFFSET_MS = (17+(1/6)) * 3600 * 1000; // 17.5 hour offset for NE championship
    
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
  
  // New function to check if event has started (using event-specific offset)
  function hasEventStarted(eventStartDate, eventKey) {
    const now = new Date();
    const startDate = new Date(eventStartDate);
    // Add event-specific offset to the official start date
    const offsetMs = getEventOffset(eventKey);
    startDate.setTime(startDate.getTime() + offsetMs);
    return now >= startDate;
  }
  
  // Add this function to check if an event has ended (using event-specific offset)
  function hasEventEnded(eventEndDate, eventKey) {
    const now = new Date();
    const endDate = new Date(eventEndDate);
    // Add event-specific offset to the official end date
    const offsetMs = getEventOffset(eventKey);
    endDate.setTime(endDate.getTime() + offsetMs);
    return now > endDate;
  }
  
  // New function to fetch teams attending an event
  async function fetchEventTeams(eventCode) {
    try {
      const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/teams`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching teams: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching event teams:', error);
      return [];
    }
  }
  
  // Function to display teams list for upcoming events
  async function displayEventTeams(eventCode) {
    try {
      const teams = await fetchEventTeams(eventCode);
      
      if (!teams || teams.length === 0) {
        document.getElementById('teams-container').innerHTML = `
          <div class="card-gradient rounded-xl p-6 text-center">
            <i class="fas fa-users-slash text-gray-500 text-4xl mb-3"></i>
            <p class="text-lg text-gray-400">No teams registered yet</p>
            <p class="text-sm text-gray-500 mt-2">Check back closer to the event date</p>
          </div>
        `;
        return;
      }
      
      // Sort teams by team number
      teams.sort((a, b) => parseInt(a.team_number) - parseInt(b.team_number));
      
      // Group teams by first digit of team number
      const groupedTeams = {};
      teams.forEach(team => {
        const firstDigit = Math.floor(team.team_number / 1000);
        if (!groupedTeams[firstDigit]) {
          groupedTeams[firstDigit] = [];
        }
        groupedTeams[firstDigit].push(team);
      });
      
      // Create HTML for each group - ensure proper ordering of team groups
      let teamsHTML = '';
      
      // Define the order we want the groups to appear in (1000s through 10000s)
      const orderedGroups = Object.keys(groupedTeams)
                                  .map(Number) // Convert string keys to numbers
                                  .sort((a, b) => a - b); // Sort numerically
      
      orderedGroups.forEach(group => {
        // Format the group header appropriately
        let groupHeader = group < 10 ? `${group}000s` : `${group}000s`;
        
        teamsHTML += `
          <div class="mb-8">
            <h3 class="text-xl font-bold mb-4 text-baywatch-orange">${groupHeader}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        `;
        
        groupedTeams[group].forEach(team => {
          const isHighlighted = team.team_number === 7790;
          teamsHTML += `
            <div class="team-card-container">
              <a href="team.html?team=${team.team_number}" 
                 class="team-card card-gradient rounded-xl p-4 block hover:scale-105 transition-all duration-300 ${isHighlighted ? 'border-2 border-baywatch-orange' : ''}">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br ${isHighlighted ? 'from-baywatch-orange to-orange-600' : 'from-gray-700 to-gray-800'} flex items-center justify-center font-bold text-lg">
                    ${team.team_number}
                  </div>
                  <div>
                    <h4 class="font-bold ${isHighlighted ? 'text-baywatch-orange' : 'text-white'} truncate max-w-[180px]">${team.nickname}</h4>
                    <p class="text-sm text-gray-400 truncate max-w-[180px]">${team.city}, ${team.state_prov}</p>
                  </div>
                </div>
              </a>
            </div>
          `;
        });
        
        teamsHTML += `
            </div>
          </div>
        `;
      });
      
      // Update teams container with the generated HTML
      document.getElementById('teams-container').innerHTML = teamsHTML;
      
      // Update total teams count
      document.getElementById('team-count').textContent = teams.length;
      
    } catch (error) {
      console.error('Error displaying event teams:', error);
      document.getElementById('teams-container').innerHTML = `
        <div class="card-gradient rounded-xl p-6 text-center">
          <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-3"></i>
          <p class="text-lg text-red-400">Error loading teams</p>
          <p class="text-sm text-gray-400 mt-2">Please try again later</p>
        </div>
      `;
    }
  }
  
  // Function to prepare event page based on whether event has started or not
  async function prepareEventPage(eventCode) {
    try {
      // Show loading overlay
      document.getElementById('loading-overlay').classList.remove('hidden');
      
      // Fetch event data
      const eventData = await fetchEventData(eventCode);
      
      if (!eventData) {
        throw new Error('Event data not available');
      }
      
      // Store event dates in localStorage for future reference
      localStorage.setItem(`${eventCode}_startDate`, eventData.start_date);
      localStorage.setItem(`${eventCode}_endDate`, eventData.end_date);
      
      // Update page title and header information
      updateEventPageHeader(eventData);
      
      // Check if the event has started (using event-specific offset)
      const hasStarted = hasEventStarted(eventData.start_date, eventData.key);
      // Check if the event has ended (using event-specific offset)
      const hasEnded = hasEventEnded(eventData.end_date, eventData.key);
      
      // Get the tab navigation element
      const tabNavigation = document.querySelector('#competition-data-container .container:first-child');
      
      if (hasEnded || hasStarted) {
        // Event has started or ended - show competition data view
        document.getElementById('teams-section').classList.add('hidden');
        
        // Make competition data container visible
        const competitionContainer = document.getElementById('competition-data-container');
        if (competitionContainer) {
          competitionContainer.classList.remove('hidden');
          
          // Make tab navigation visible
          if (tabNavigation) tabNavigation.classList.remove('hidden');
        }
        
        // Load event competition data - all sections, but only the active tab will be visible
        loadEventRankings(eventCode);
        loadEventSchedule(eventCode);
        updatePlayoffBracket(eventCode);
        loadEventAwards(eventCode); // New call to load awards data
        
      } else {
        // Event hasn't started - show teams section
        document.getElementById('teams-section').classList.remove('hidden');
        
        // Hide competition data container to ensure proper document flow
        const competitionContainer = document.getElementById('competition-data-container');
        if (competitionContainer) {
          competitionContainer.classList.add('hidden');
        } else {
          // If container doesn't exist, hide individual sections
          document.getElementById('rankings-section').classList.add('hidden');
          document.getElementById('schedule-section').classList.add('hidden');
          document.getElementById('playoff-section').classList.add('hidden');
          document.getElementById('awards-section').classList.add('hidden'); // Hide awards section for pre-event view
        }
        
        // Hide tab navigation for pre-event view
        if (tabNavigation) tabNavigation.classList.add('hidden');
        
        // Display registered teams
        displayEventTeams(eventCode);
        
        // Update countdown timer
        updateEventCountdownDisplay(eventData.start_date, eventData.key);
      }
      
      // Hide loading overlay
      document.getElementById('loading-overlay').classList.add('hidden');
      
    } catch (error) {
      console.error('Error preparing event page:', error);
      document.getElementById('loading-overlay').classList.add('hidden');
      document.getElementById('error-message').classList.remove('hidden');
    }
  }
  
  // Update event page header information
  function updateEventPageHeader(eventData) {
    document.title = `${eventData.name} - Baywatch Robotics | FRC Team 7790`;
    document.querySelector('meta[name="description"]').content = 
      `Live results and information for ${eventData.name} - FRC Team 7790 Baywatch Robotics`;
    
    // Extract city name and event type from event name
    const cityName = extractCityName(eventData.name);
    const eventType = extractEventType(eventData.name);
    
    // Update header text
    document.getElementById('event-city').textContent = cityName;
    document.getElementById('event-type').textContent = eventType;
    
    // Check if this is the Traverse City event that needs a location override
    const locationName = eventData.key === "2025mitvc" ? 
        "1150 Milliken Drive" : 
        eventData.location_name;
    
    // Format dates
    const startDate = new Date(eventData.start_date);
    const endDate = new Date(eventData.end_date);
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDates = `${startDate.toLocaleDateString('en-US', dateOptions)} - ${endDate.toLocaleDateString('en-US', dateOptions)} | ${locationName}`;
    document.getElementById('event-details').textContent = formattedDates;
    
    // Set appropriate Twitch link if available from webcasts array
    const watchLink = document.getElementById('event-watch-link');
    
    // Check if webcasts array exists and has entries
    if (eventData.webcasts && eventData.webcasts.length > 0) {
      // Look for a Twitch stream first
      const twitchStream = eventData.webcasts.find(webcast => webcast.type === 'twitch');
      
      if (twitchStream && twitchStream.channel) {
        // Set the watch link to the Twitch channel
        watchLink.href = `https://twitch.tv/${twitchStream.channel}`;
        watchLink.classList.remove('hidden');
        
        // Add click handler to ensure link works properly
        watchLink.onclick = function(e) {
          e.preventDefault(); 
          window.open(`https://twitch.tv/${twitchStream.channel}`, '_blank');
        };
      } else {
        // Check for YouTube stream as fallback
        const youtubeStream = eventData.webcasts.find(webcast => webcast.type === 'youtube');
        if (youtubeStream && youtubeStream.channel) {
          const youtubeUrl = `https://youtube.com/watch?v=${youtubeStream.channel}`;
          watchLink.href = youtubeUrl;
          watchLink.innerHTML = `<i class="fab fa-youtube mr-2"></i> Watch Live`;
          watchLink.classList.remove('hidden');
          watchLink.classList.replace('text-[#A970FF]', 'text-[#FF0000]');
          watchLink.classList.replace('bg-[#6441A4]/20', 'bg-[#FF0000]/20');
          watchLink.classList.replace('hover:bg-[#6441A4]/30', 'hover:bg-[#FF0000]/30');
          
          // Add click handler to ensure link works properly
          watchLink.onclick = function(e) {
            e.preventDefault();
            window.open(youtubeUrl, '_blank');
          };
        } else {
          // Hide watch link if no stream available
          watchLink.classList.add('hidden');
        }
      }
    } else {
      // No webcasts available
      watchLink.classList.add('hidden');
    }
    
    // Update district button link if the event has district information
    const districtLink = document.getElementById('event-district-link');
    if (districtLink && eventData.district) {
      // Use district key from event data to create link to district page
      const districtKey = eventData.district.key;
      const districtUrl = `district.html?district=${districtKey}`;
      districtLink.href = districtUrl;
      districtLink.classList.remove('hidden');
      
      // Add click handler to ensure link works properly
      districtLink.onclick = function(e) {
        e.preventDefault();
        window.location.href = districtUrl;
      };
    } else {
      // Hide district link if no district information
      districtLink.classList.add('hidden');
    }
  }
  
  // Function to update countdown display for upcoming events
  function updateEventCountdownDisplay(startDate, eventKey) {
    // Get the countdown container
    const countdownContainer = document.getElementById('event-countdown');
    
    // Calculate time until event starts (with event-specific offset)
    const startWithOffset = new Date(startDate);
    const offsetMs = getEventOffset(eventKey);
    startWithOffset.setTime(startWithOffset.getTime() + offsetMs);
    
    // Update initial countdown
    updateUpcomingEventCountdown(startWithOffset);
    
    // Set interval to update countdown every second
    const countdownInterval = setInterval(() => {
      // Check if countdown is complete
      const now = new Date();
      if (now >= startWithOffset) {
        clearInterval(countdownInterval);
        // Reload page to show competition view
        window.location.reload();
        return;
      }
      
      updateUpcomingEventCountdown(startWithOffset);
    }, 1000);
  }
  
  // Function to update the countdown timer
  function updateUpcomingEventCountdown(targetDate) {
    const now = new Date();
    const timeLeft = targetDate - now;
    
    if (timeLeft <= 0) {
      document.getElementById('days-value').textContent = '0';
      document.getElementById('hours-value').textContent = '0';
      document.getElementById('minutes-value').textContent = '0';
      document.getElementById('seconds-value').textContent = '0';
      return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    document.getElementById('days-value').textContent = days;
    document.getElementById('hours-value').textContent = hours.toString().padStart(2, '0');
    document.getElementById('minutes-value').textContent = minutes.toString().padStart(2, '0');
    document.getElementById('seconds-value').textContent = seconds.toString().padStart(2, '0');
  }
  
  function extractCityName(eventName) {
    // Logic to extract just city name from full event name
    // Example: "2025 FIM District Lake City Event" -> "Lake City"
    
    // First try to find a match for common patterns
    const cityPatterns = [
      /\bDistrict\s+([A-Za-z\s]+?)\s+Event\b/i,
      /\b([A-Za-z\s]+?)\s+District Event\b/i,
      /\b([A-Za-z\s]+?)\s+Regional\b/i,
      /\b([A-Za-z\s]+?)\s+Event\b/i
    ];
  
    
    for (const pattern of cityPatterns) {
      const match = eventName.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: split the event name and take words that aren't common qualifiers
    const nameParts = eventName.split(' ');
    const commonWords = ['FIM', 'District', 'Event', 'Regional', '2025'];
    const cityParts = nameParts.filter(part => 
      !commonWords.includes(part) && part.length > 1
    );
    
    return cityParts.join(' ') || 'Event';
  }
  
  function extractEventType(eventName) {
    // Always return empty string regardless of event type
    return "";
  }
  
  // New function to fetch award data for an event
  async function fetchEventAwards(eventCode) {
    try {
      const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/awards`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching award data: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching event awards:', error);
      return [];
    }
  }
  
  // Function to load and display award data
  async function loadEventAwards(eventCode) {
    try {
      const awardsContainer = document.getElementById('awards-container');
      
      // Get the award data from the API
      const awardsData = await fetchEventAwards(eventCode);
      
      if (!awardsData || awardsData.length === 0) {
        awardsContainer.innerHTML = `
          <div class="text-center py-8">
            <i class="fas fa-award text-gray-500 text-5xl mb-4"></i>
            <p class="text-xl text-gray-400">No awards data available yet</p>
            <p class="text-sm text-gray-500 mt-2">Awards will be displayed once they are announced</p>
          </div>
        `;
        return;
      }
      
      // Sort awards by type to ensure consistent ordering
      awardsData.sort((a, b) => a.award_type - b.award_type);
      
      // First we need to gather all team keys to fetch team names in a single call
      const teamKeys = new Set();
      awardsData.forEach(award => {
        if (award.recipient_list) {
          award.recipient_list.forEach(recipient => {
            if (recipient.team_key) {
              teamKeys.add(recipient.team_key);
            }
          });
        }
      });
      
      // Fetch team data for all teams that received awards
      const teamDataMap = new Map();
      if (teamKeys.size > 0) {
        const teamKeysArray = Array.from(teamKeys);
        const teamsData = await Promise.all(
          teamKeysArray.map(async (teamKey) => {
            try {
              const response = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}`, {
                headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
              });
              
              if (response.ok) {
                return await response.json();
              }
              return null;
            } catch (error) {
              console.error(`Error fetching team data for ${teamKey}:`, error);
              return null;
            }
          })
        );
        
        // Create map of team data keyed by team_key
        teamsData.forEach(team => {
          if (team) {
            teamDataMap.set(`frc${team.team_number}`, team);
          }
        });
      }
      
      // Group awards by category for better organization
      const awardGroups = {
        submitted: [],  // Truly submitted awards: Impact (Chairman's), Dean's List, Digital Animation, Safety Animation, Woodie Flowers
        alliance: [],   // Winner, Finalist
        technical: [],  // Technical awards (excluding Imagery)
        attribute: [],  // Special recognition awards + Engineering Inspiration + Rookie All-Star + Imagery
        individual: []  // Other individual awards not in submitted category
      };
      
      // Categorize awards
      awardsData.forEach(award => {
        const type = award.award_type;
        
        // Truly submitted awards: Impact (0), Dean's List (4), Woodie Flowers (3), Digital Animation (31)
        // Safety Animation doesn't seem to have a distinct type but would go here
        if (type === 0 || type === 4 || type === 3 || type === 31) {
          awardGroups.submitted.push(award);
        }
        // Alliance awards (1-2)
        else if (type === 1 || type === 2) {
          awardGroups.alliance.push(award);
        }
        // Engineering Inspiration (9), Rookie All-Star (10) now go to Attribute
        else if (type === 9 || type === 10 || type === 27) {
          awardGroups.attribute.push(award);
        }
        // Individual recognition (3-5) excluding those already handled
        else if ((type >= 3 && type <= 5) && type !== 3 && type !== 4) {
          awardGroups.individual.push(award);
        }
        // Technical awards (16-29, 71-73) excluding Imagery (27)
        else if ((type >= 16 && type <= 29 && type !== 27) || (type >= 71 && type <= 73)) {
          awardGroups.technical.push(award);
        }
        // Other special awards go to Attribute
        else {
          awardGroups.attribute.push(award);
        }
      });
      
      // Generate the styled HTML
      let awardsHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      `;
      
      // Function to generate award HTML
      const generateAwardHTML = (award) => {
        let html = `
          <div class="award-card overflow-hidden relative p-8 rounded-2xl bg-black/90 border border-baywatch-orange/30 shadow-lg transition-shadow duration-500 ease-in-out hover:shadow-baywatch-orange/30 transition-all duration-500 animate-fade-in group">
            <div class="absolute -top-10 -right-10 opacity-5 text-8xl">
              <i class="fas fa-award"></i>
            </div>
            <h3 class="text-2xl font-bold text-baywatch-orange mb-3 relative">${award.name}</h3>
            <div class="space-y-3 relative">
        `;
        
        if (award.recipient_list && award.recipient_list.length > 0) {
          award.recipient_list.forEach(recipient => {
            const teamKey = recipient.team_key;
            const recipientName = recipient.awardee;
            
            // Special handling for Dean's List (award_type 4) - show both team and recipient name
            if (award.award_type === 4 && teamKey && recipientName) {
              const teamNumber = teamKey.replace('frc', '');
              const isTeam7790 = teamNumber === '7790';
              const teamData = teamDataMap.get(teamKey);
              const teamName = teamData ? teamData.nickname : 'Unknown Team';
              
              html += `
                <div class="flex items-center ${isTeam7790 ? 'award-highlight-team' : ''} rounded-lg p-2">
                  <a href="team.html?team=${teamNumber}" class="flex items-center hover:scale-105 transition-all">
                    <div class="w-10 h-10 rounded-full ${isTeam7790 ? 'bg-gradient-to-br from-baywatch-orange to-orange-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'} flex items-center justify-center font-bold mr-3">
                      ${teamNumber}
                    </div>
                    <div>
                      <span class="font-semibold ${isTeam7790 ? 'text-baywatch-orange' : 'text-white'}">${recipientName}</span>
                      <p class="text-sm text-gray-400">${teamName}</p>
                    </div>
                  </a>
                </div>
              `;
            }
            // Normal team award
            else if (teamKey) {
              const teamNumber = teamKey.replace('frc', '');
              const isTeam7790 = teamNumber === '7790';
              const teamData = teamDataMap.get(teamKey);
              const teamName = teamData ? teamData.nickname : 'Unknown Team';
              
              html += `
                <div class="flex items-center ${isTeam7790 ? 'award-highlight-team' : ''} rounded-lg p-2">
                  <a href="team.html?team=${teamNumber}" class="flex items-center hover:scale-105 transition-all">
                    <div class="w-10 h-10 rounded-full ${isTeam7790 ? 'bg-gradient-to-br from-baywatch-orange to-orange-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'} flex items-center justify-center font-bold mr-3">
                      ${teamNumber}
                    </div>
                    <span class="font-semibold ${isTeam7790 ? 'text-baywatch-orange' : 'text-white'}">${teamName}</span>
                  </a>
                </div>
              `;
            } 
            // Individual award (like Woodie Flowers)
            else if (recipientName) {
              html += `
                <div class="flex items-center p-2">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mr-3">
                    <i class="fas fa-user text-white"></i>
                  </div>
                  <span class="font-semibold text-white">${recipientName}</span>
                </div>
              `;
            }
          });
        } else {
          html += `<div class="text-gray-500 italic">No recipients announced yet</div>`;
        }
        
        html += `
            </div>
          </div>
        `;
        return html;
      };
      
      // Add Submitted Awards at the top (if any)
      if (awardGroups.submitted.length > 0) {
        awardsHTML += `
          <div class="col-span-1 md:col-span-2 mb-6">
            <h2 class="text-2xl font-bold mb-4 text-center border-b border-baywatch-orange/30 pb-2">Submitted Awards</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${awardGroups.submitted.map(generateAwardHTML).join('')}
            </div>
          </div>
        `;
      }
      
      // Add alliance awards
      if (awardGroups.alliance.length > 0) {
        awardsHTML += `
          <div class="col-span-1 md:col-span-2 mb-6">
            <h2 class="text-2xl font-bold mb-4 text-center border-b border-baywatch-orange/30 pb-2">Alliance Awards</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${awardGroups.alliance.map(generateAwardHTML).join('')}
            </div>
          </div>
        `;
      }
      
      // Add technical awards
      if (awardGroups.technical.length > 0) {
        awardsHTML += `
          <div class="col-span-1 md:col-span-2 mb-6">
            <h2 class="text-2xl font-bold mb-4 text-center border-b border-baywatch-orange/30 pb-2">Technical Awards</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${awardGroups.technical.map(generateAwardHTML).join('')}
            </div>
          </div>
        `;
      }
      
      // Add attribute awards
      if (awardGroups.attribute.length > 0) {
        awardsHTML += `
          <div class="col-span-1 md:col-span-2 mb-6">
            <h2 class="text-2xl font-bold mb-4 text-center border-b border-baywatch-orange/30 pb-2">Attribute Awards</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${awardGroups.attribute.map(generateAwardHTML).join('')}
            </div>
          </div>
        `;
      }
      
      // Add individual awards
      if (awardGroups.individual.length > 0) {
        awardsHTML += `
          <div class="col-span-1 md:col-span-2 mb-6">
            <h2 class="text-2xl font-bold mb-4 text-center border-b border-baywatch-orange/30 pb-2">Individual Awards</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              ${awardGroups.individual.map(generateAwardHTML).join('')}
            </div>
          </div>
        `;
      }
      
      awardsHTML += `
        </div>
        <style>
          .award-highlight-team {
            background-color: rgba(255, 107, 0, 0.1);
            border-radius: 0.5rem;
            box-shadow: 0 0 15px rgba(255, 107, 0, 0.3);
          }
          /* No longer overriding card-gradient class */
        </style>
      `;
      
      // Update the awards container with the generated HTML
      awardsContainer.innerHTML = awardsHTML;
      
      // Add subtle animation to award cards
      const awardCards = document.querySelectorAll('.award-card');
      awardCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 100 + (index * 50)); // Staggered animation
      });
      
    } catch (error) {
      console.error('Error loading event awards:', error);
      document.getElementById('awards-container').innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
          <p class="text-xl text-red-400">Error loading awards</p>
          <p class="text-sm text-gray-400 mt-2">Please try again later</p>
        </div>
      `;
    }
  }