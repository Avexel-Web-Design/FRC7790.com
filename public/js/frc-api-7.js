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
  
  // New function to check if event has started (accounting for 37-hour offset)
  function hasEventStarted(eventStartDate) {
    const now = new Date();
    const startDate = new Date(eventStartDate);
    // Add 37-hour offset to the official start date
    startDate.setHours(startDate.getHours() + 37);
    return now >= startDate;
  }
  
  // Add this function to check if an event has ended (accounting for 37-hour offset)
  function hasEventEnded(eventEndDate) {
    const now = new Date();
    const endDate = new Date(eventEndDate);
    // Add 37-hour offset to the official end date
    endDate.setHours(endDate.getHours() + 37);
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
      
      // Check if the event has started (with 37 hour offset)
      const hasStarted = hasEventStarted(eventData.start_date);
      // Check if the event has ended (with 37 hour offset)
      const hasEnded = hasEventEnded(eventData.end_date);
      
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
        }
        
        // Hide tab navigation for pre-event view
        if (tabNavigation) tabNavigation.classList.add('hidden');
        
        // Display registered teams
        displayEventTeams(eventCode);
        
        // Update countdown timer
        updateEventCountdownDisplay(eventData.start_date, eventData.end_date);
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
      } else {
        // Check for YouTube stream as fallback
        const youtubeStream = eventData.webcasts.find(webcast => webcast.type === 'youtube');
        if (youtubeStream && youtubeStream.channel) {
          watchLink.href = `https://youtube.com/watch?v=${youtubeStream.channel}`;
          watchLink.innerHTML = `<i class="fab fa-youtube mr-2"></i> Watch Live`;
          watchLink.classList.remove('hidden');
          watchLink.classList.replace('text-[#A970FF]', 'text-[#FF0000]');
          watchLink.classList.replace('bg-[#6441A4]/20', 'bg-[#FF0000]/20');
          watchLink.classList.replace('hover:bg-[#6441A4]/30', 'hover:bg-[#FF0000]/30');
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
      districtLink.href = `district.html?district=${districtKey}`;
    } else {
      // Hide district link if no district information
      districtLink.classList.add('hidden');
    }
  }
  
  // Function to update countdown display for upcoming events
  function updateEventCountdownDisplay(startDate) {
    // Get the countdown container
    const countdownContainer = document.getElementById('event-countdown');
    
    // Calculate time until event starts (with 37 hour offset)
    const startWithOffset = new Date(startDate);
    startWithOffset.setHours(startWithOffset.getHours() + 37);
    
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