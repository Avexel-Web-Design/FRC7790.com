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
  
  // Add periodic updates for the rankings and schedule on the event page
  // to ensure the data stays current during an active event
  document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('event.html')) {
      // Parse URL parameters to get event code
      const urlParams = new URLSearchParams(window.location.search);
      const eventCode = urlParams.get('event');
      
      if (eventCode) {
        // Prepare the event page based on whether it has started
        prepareEventPage(eventCode);
        
        // Set up periodic updates for live event data
        setInterval(() => {
          // Check if event has started before updating
          const eventStartDate = localStorage.getItem(`${eventCode}_startDate`);
          if (eventStartDate && hasEventStarted(eventStartDate)) {
            loadEventRankings(eventCode);
            loadEventSchedule(eventCode);
          }
        }, 60000); // Update every minute
      }
    }
  });
  
  // New function to check if event has started (accounting for 37-hour offset)
  function hasEventStarted(eventStartDate) {
    const now = new Date();
    const startDate = new Date(eventStartDate);
    // Add 37-phour offset to the official start date
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
      
      if (hasEnded) {
        // Event has ended - show results view
        document.getElementById('teams-section').classList.add('hidden');
        
        // Make competition data container visible
        const competitionContainer = document.getElementById('competition-data-container');
        if (competitionContainer) {
          competitionContainer.classList.remove('hidden');
        }
        
        // Make individual sections visible
        document.getElementById('rankings-section').classList.remove('hidden');
        document.getElementById('schedule-section').classList.remove('hidden');
        document.getElementById('playoff-section').classList.remove('hidden');
        
        // Load event competition data
        loadEventRankings(eventCode);
        loadEventSchedule(eventCode);
        updatePlayoffBracket(eventCode);
        
      } else if (hasStarted) {
        // Event has started but not ended - show live updates
        document.getElementById('teams-section').classList.add('hidden');
        
        // Make competition data container visible
        const competitionContainer = document.getElementById('competition-data-container');
        if (competitionContainer) {
          competitionContainer.classList.remove('hidden');
        }
        
        // Make individual sections visible
        document.getElementById('rankings-section').classList.remove('hidden');
        document.getElementById('schedule-section').classList.remove('hidden');
        document.getElementById('playoff-section').classList.remove('hidden');
        
        // Load event competition data
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
    
    // Format dates
    const startDate = new Date(eventData.start_date);
    const endDate = new Date(eventData.end_date);
    const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDates = `${startDate.toLocaleDateString('en-US', dateOptions)} - ${endDate.toLocaleDateString('en-US', dateOptions)} | ${eventData.location_name}`;
    document.getElementById('event-details').textContent = formattedDates;
    
    // Set appropriate Twitch link if available
    const eventCode = eventData.key;
    const twitchChannels = {
      '2025mitvc': 'firstinspires36'
    };
    
    if (twitchChannels[eventCode]) {
      const watchLink = document.getElementById('event-watch-link');
      watchLink.href = `https://twitch.tv/${twitchChannels[eventCode]}`;
      watchLink.classList.remove('hidden');
    } else {
      // Hide watch link if no channel is available
      document.getElementById('event-watch-link').classList.add('hidden');
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
  
  function extractEventType(eventName) {
    // Always return empty string regardless of event type
    return "";
  }
  
  // Add this at the end of the file to handle event states on schedule page
if (window.location.pathname.includes('schedule.html')) {
  document.addEventListener('DOMContentLoaded', async function() {
    // List of event codes to check (all four events on the schedule page)
    const eventCodes = ['2025milac', '2025mitvc', '2025micmp', '2025cmptx'];
    const countdownTimers = [];
    
    for (const eventCode of eventCodes) {
      try {
        // Fetch event data
        const eventData = await fetchEventData(eventCode);
        
        if (eventData) {
          const hasStarted = hasEventStarted(eventData.start_date);
          const hasEnded = hasEventEnded(eventData.end_date);
          
          // Get elements for this event based on event code
          let eventSelector;
          if (eventCode === '2025cmptx') {
            // FIRST Championship uses external link
            eventSelector = `a[href="event.html?event=2025cmptx"]`;
          } else if (eventCode === '2025milac') {
            // Lake City Regional - explicitly set the selector
            eventSelector = `a[href="event.html?event=2025milac"]`;
          } else if (eventCode === '2025mitvc') {
            // Traverse City Regional
            eventSelector = `a[href="event.html?event=2025mitvc"]`;
          } else if (eventCode === '2025micmp') {
            // FIM District Championship
            eventSelector = `a[href="event.html?event=2025micmp"]`;
          } else {
            // Default selector pattern
            eventSelector = `a[href="event.html?event=${eventCode}"]`;
          }
          
          // Find the countdown section and live updates section
          const liveUpdates = document.querySelector(`${eventSelector} #live-updates`);
          const countdownSection = document.querySelector(`${eventSelector} #countdown-section`);
          
          // Create sections if they don't exist
          if (!liveUpdates || !countdownSection) {
            // Find the event card
            const eventCard = document.querySelector(eventSelector);
            if (eventCard) {
              const cardBody = eventCard.querySelector('.card-gradient');
              if (cardBody) {
                // Check if sections already exist
                if (!cardBody.querySelector('#live-updates')) {
                  // Create live updates section
                  const updatesSection = document.createElement('div');
                  updatesSection.id = 'live-updates';
                  updatesSection.className = 'mt-6 hidden';
                  updatesSection.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <!-- Current Ranking -->
                      <div class="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 class="text-lg font-semibold mb-2">Current Ranking</h4>
                        <div class="flex items-center justify-center gap-2">
                          <span id="ranking-number" class="text-4xl font-bold text-baywatch-orange">--</span>
                          <span class="text-xl text-gray-400">th</span>
                        </div>
                        <span class="text-gray-400 block mt-1" id="total-teams">Loading...</span>
                      </div>

                      <!-- Win/Loss Record -->
                      <div class="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 class="text-lg font-semibold mb-2">Event Record</h4>
                        <div class="flex justify-center items-center gap-4">
                          <div class="text-center">
                            <span id="wins" class="text-3xl font-bold text-green-500 counter">--</span>
                            <span class="text-gray-400 block">Wins</span>
                          </div>
                          <span class="text-xl text-gray-400">-</span>
                          <div class="text-center">
                            <span id="losses" class="text-3xl font-bold text-red-500 counter">--</span>
                            <span class="text-gray-400 block">Losses</span>
                          </div>
                        </div>
                      </div>

                      <!-- Next Match -->
                      <div class="p-4 bg-black/30 rounded-lg flex flex-col items-center">
                        <h4 class="text-lg font-semibold mb-2">Next Match</h4>
                        <div class="text-center">
                          <span id="match-number" class="text-2xl font-bold text-baywatch-orange">Loading...</span>
                          <div id="match-time" class="text-gray-400 mt-1">--:-- --</div>
                          <div class="mt-2 flex justify-center gap-2">
                            <div id="blue-alliance" class="text-xs px-2 py-1 bg-blue-500/20 rounded-full text-blue-400">
                              Loading...
                            </div>
                            <div id="red-alliance" class="text-xs px-2 py-1 bg-red-500/20 rounded-full text-red-400">
                              Loading...
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                  cardBody.appendChild(updatesSection);
                }
                
                if (!cardBody.querySelector('#countdown-section')) {
                  // Create countdown section
                  const countdownSection = document.createElement('div');
                  countdownSection.id = 'countdown-section';
                  countdownSection.className = 'mt-6 flex flex-col items-center';
                  countdownSection.innerHTML = `
                    <div class="text-center">
                      <h4 class="text-lg font-semibold mb-2">Event Countdown</h4>
                      <div id="countdown-timer" class="text-4xl font-bold text-baywatch-orange">
                        --d --h --m --s
                      </div>
                      <p class="text-gray-400 text-sm mt-2">
                        Live match updates will appear here when the event starts
                      </p>
                    </div>
                  `;
                  cardBody.appendChild(countdownSection);
                }
              }
            }
          }
          
          // Now get the elements again after potentially creating them
          const updatedLiveUpdates = document.querySelector(`${eventSelector} #live-updates`);
          const updatedCountdownSection = document.querySelector(`${eventSelector} #countdown-section`);
          
          if (updatedLiveUpdates && updatedCountdownSection) {
            if (hasEnded) {
              // Event has ended - show results view
              updatedCountdownSection.classList.add('hidden');
              updatedLiveUpdates.classList.remove('hidden');
              
              // Convert to results display with 3 sections
              updatedLiveUpdates.querySelector('.grid').className = 'grid grid-cols-1 md:grid-cols-3 gap-4 text-center';

              // Update with "Event Complete" indicator and enhanced results
              const rankingSection = updatedLiveUpdates.querySelector('.p-4:first-child');
              if (rankingSection) {
                rankingSection.innerHTML = `
                  <h4 class="text-lg font-semibold mb-2">Final Ranking</h4>
                  <div class="flex items-center justify-center gap-1">
                    <span id="ranking-number" class="text-4xl font-bold text-baywatch-orange animate__animated animate__fadeIn">--</span>
                    <span class="text-sm text-gray-400 self-end mb-1">th</span>
                  </div>
                  <div id="qual-record" class="text-sm text-gray-400 mt-1">--W---L---T</div>
                `;
              }

              // Swapping the alliance and playoff sections
              // First, let's create the alliance section (which was previously in nextMatchSection)
              const allianceSection = document.createElement('div');
              allianceSection.className = 'p-4 bg-black/30 rounded-lg flex flex-col items-center';
              allianceSection.innerHTML = `
                <h4 class="text-lg font-semibold mb-2">Alliance</h4>
                <div class="text-center">
                  <div id="alliance-number" class="text-4xl font-bold text-baywatch-orange mb-1">--</div>
                  <div id="alliance-pick" class="text-sm text-gray-400 mb-1">--</div>
                </div>
              `;

              // Now, let's update the nextMatchSection to be the playoff section
              const nextMatchSection = updatedLiveUpdates.querySelector('.p-4:last-child');
              if (nextMatchSection) {
                nextMatchSection.innerHTML = `
                  <h4 class="text-lg font-semibold mb-2">Playoffs</h4>
                  <div class="text-center">
                    <div id="playoff-result" class="text-4xl font-bold text-baywatch-orange">
                      <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div id="playoff-record" class="text-sm text-gray-400 mt-1">
                      Loading playoff data...
                    </div>
                  </div>
                `;
              }

              // Update the grid container with the new order: ranking, alliance, playoffs
              const gridContainer = updatedLiveUpdates.querySelector('.grid');
              if (gridContainer) {
                // Clear current children except the first one (ranking)
                while (gridContainer.children.length > 1) {
                  gridContainer.removeChild(gridContainer.lastChild);
                }
                
                // Add alliance section and playoff section in that order
                gridContainer.appendChild(allianceSection);
                gridContainer.appendChild(nextMatchSection);
              }

              // Add event status indicator at the top
              const eventStatusIndicator = document.createElement('div');
              eventStatusIndicator.className = 'mb-4 text-center';
              updatedLiveUpdates.insertBefore(eventStatusIndicator, updatedLiveUpdates.firstChild);

              // Only fetch final results for events we actually attended
              if (eventCode !== '2025cmptx' && eventCode !== '2025micmp') {
                // Fetch team status at event for ranking & record
                fetchTeamStatusAtEvent(eventCode, '7790').then(status => {
                  if (status) {
                    // Update qualification ranking
                    const rankEl = updatedLiveUpdates.querySelector('#ranking-number');
                    const recordEl = updatedLiveUpdates.querySelector('#qual-record');
                    
                    if (status.qual && status.qual.ranking) {
                      const ranking = status.qual.ranking;
                      if (rankEl) rankEl.textContent = ranking.rank || '--';
                      if (recordEl) {
                        recordEl.textContent = `${ranking.record ? ranking.record.wins : '--'}-${ranking.record ? ranking.record.losses : '--'}-${ranking.record ? ranking.record.ties : '--'}`;
                      }
                    }
                    
                    // Update alliance selection info - now with alliance number as main focus
                    const allianceNumberEl = updatedLiveUpdates.querySelector('#alliance-number');
                    const alliancePickEl = updatedLiveUpdates.querySelector('#alliance-pick');
                    const partnersEl = updatedLiveUpdates.querySelector('#alliance-partners');
                    
                    if (status.alliance) {
                      const pickNumber = status.alliance.pick;
                      
                      // Fix: Ensure we set the alliance number even when not available in playoff data
                      if (allianceNumberEl) {
                        if (status.playoff && status.playoff.alliance) {
                          const allianceNumber = status.playoff.alliance;
                          allianceNumberEl.textContent = `${allianceNumber}`;
                        } else {
                          // Calculate alliance number from status.alliance.number if available, or from picks index
                          const allianceNumber = status.alliance.number !== undefined ? 
                                                status.alliance.number : 
                                                Math.floor(status.alliance.picks.indexOf('frc7790') / 3) + 1;
                          allianceNumberEl.textContent = `${allianceNumber}`;
                        }
                      }
                      
                      // We were an alliance captain
                      if (pickNumber === 0) {
                        if (alliancePickEl) alliancePickEl.innerHTML = `<span class="text-yellow-500"><i class="fas fa-crown mr-1"></i>Captain</span>`;
                        if (partnersEl) {
                          // Fix: Ensure we're creating valid HTML with team numbers
                          const partnerTeams = status.alliance.picks.slice(1);
                          if (partnerTeams.length > 0) {
                            partnersEl.innerHTML = partnerTeams.map(team => 
                              `<span class="px-2 py-1 bg-black/30 rounded-full inline-block m-1">Team ${team.substring(3)}</span>`
                            ).join('');
                          } else {
                            partnersEl.textContent = "No alliance partners found";
                          }
                        }
                      } 
                      // We were picked
                      else {
                        if (alliancePickEl) alliancePickEl.textContent = `Pick ${pickNumber}`;
                        if (partnersEl) {
                          const allTeams = status.alliance.picks;
                        }
                      }
                    } else {
                      // Not selected for playoffs
                      if (allianceNumberEl) allianceNumberEl.innerHTML = `<i class="fas fa-times"></i>`;
                      if (alliancePickEl) alliancePickEl.textContent = '';
                      if (partnersEl) partnersEl.textContent = "Not selected for playoffs";
                    }
                    
                    // Update playoff results
                    const playoffResultEl = updatedLiveUpdates.querySelector('#playoff-result');
                    const playoffRecordEl = updatedLiveUpdates.querySelector('#playoff-record');
                    
                    if (status.playoff) {
                      const playoffStatus = status.playoff.status;
                      const playoffRecord = status.playoff.record;
                      const playoffLevel = status.playoff.level;
                      const allianceNumber = status.playoff.alliance;
                      
                      let resultText = '';
                      let resultClass = '';
                      
                      // Determine playoff result text and color
                      if (playoffStatus === 'won') {
                        resultText = '1st Place';
                        resultClass = 'text-yellow-500';
                      } else if (playoffStatus === 'eliminated') {
                        // Get detailed playoff results to determine exact placement
                        fetchDetailedPlayoffResults(eventCode, status).then(detailedResult => {
                          const { placementText, placementClass } = detailedResult;
                          
                          // Update the playoff result with the precise placement
                          if (playoffResultEl) {
                            playoffResultEl.className = `text-4xl font-bold ${placementClass}`;
                            playoffResultEl.textContent = placementText;
                          }
                        }).catch(() => {
                          // Fallback to basic placement if we can't get detailed results
                          const { placementText, placementClass } = determinePlayoffPlacement(playoffLevel, allianceNumber);
                          
                          if (playoffResultEl) {
                            playoffResultEl.className = `text-4xl font-bold ${placementClass}`;
                            playoffResultEl.textContent = placementText;
                          }
                        });
                        
                        // Set a temporary placement while we wait for the detailed results
                        const { placementText, placementClass } = determinePlayoffPlacement(playoffLevel, allianceNumber);
                        resultText = placementText;
                        resultClass = placementClass;
                      } else if (playoffStatus === 'playing') {
                        resultText = 'In Progress';
                        resultClass = 'text-baywatch-orange';
                      } else {
                        // Handle undefined or unknown status
                        resultText = playoffStatus || 'Unknown';
                        resultClass = 'text-gray-400';
                      }
                      
                      if (playoffResultEl) {
                        playoffResultEl.className = `text-4xl font-bold ${resultClass}`;
                        playoffResultEl.textContent = resultText;
                      }
                      
                      if (playoffRecordEl && playoffRecord) {
                        playoffRecordEl.textContent = `${playoffRecord.wins || 0}-${playoffRecord.losses || 0}-${playoffRecord.ties || 0}`;
                        
                        // Add stage reached info below the record
                        if (playoffLevel) {
                          const stageText = getPlayoffStageName(playoffLevel);
                          if (stageText) {
                            const stageEl = document.createElement('div');
                            stageEl.className = 'text-sm text-gray-400 mt-1';
                            playoffRecordEl.parentNode.appendChild(stageEl);
                          }
                        }
                      } else if (playoffRecordEl) {
                        // Fix: Handle missing record data
                        playoffRecordEl.textContent = "Record unavailable";
                      }
                    } else {
                      // No playoff data
                      if (playoffResultEl) playoffResultEl.innerHTML = `<i class="fas fa-minus"></i>`;
                      if (playoffRecordEl) playoffRecordEl.textContent = "Did not participate";
                    }

                    // Fix: Add debug output to console to verify data
                    console.log(`Event ${eventCode} status data:`, status);
                  } else {
                    // Fix: Handle null status with fallback display
                    setFallbackEventDisplay(updatedLiveUpdates, eventCode);
                  }
                }).catch(err => {
                  console.error('Error fetching team status:', err);
                  // Fix: Handle error with fallback display
                  setFallbackEventDisplay(updatedLiveUpdates, eventCode);
                });
                
                // Also fetch event awards to check for any awards won
                fetchEventAwards(eventCode).then(awards => {
                  const teamAwards = awards.filter(award => 
                    award.recipient_list.some(recipient => recipient.team_key === 'frc7790')
                  );
                  
                  if (teamAwards.length > 0) {
                    // Create awards section if we won any awards
                    const awardsIndicator = document.createElement('div');
                    awardsIndicator.className = 'mt-4 text-center';
                    awardsIndicator.innerHTML = `
                      <div class="text-yellow-500 mb-2"><i class="fas fa-award mr-1"></i> Awards</div>
                      <div class="flex flex-wrap justify-center gap-2">
                        ${teamAwards.map(award => 
                          `<div class="px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-400 text-sm">
                            ${award.name}
                          </div>`
                        ).join('')}
                      </div>
                    `;
                    updatedLiveUpdates.appendChild(awardsIndicator);
                  }
                }).catch(err => console.error('Error fetching event awards:', err));
              } else {
                // Fix: For events we're not expected to attend, show appropriate message
                setQualificationPendingDisplay(updatedLiveUpdates);
              }
            } else if (hasStarted) {
              // Event is ongoing - show live updates
              updatedCountdownSection.classList.add('hidden');
              updatedLiveUpdates.classList.remove('hidden');
              
              // For ongoing events, we could fetch live data here
              if (eventCode !== '2025cmptx') {
                fetchTeamStatusAtEvent(eventCode, '7790').then(status => {
                  const rankEl = updatedLiveUpdates.querySelector('#ranking-number');
                  if (status && status.qual && status.qual.ranking && rankEl) {
                    rankEl.textContent = status.qual.ranking.rank || '--';
                    
                    const totalEl = updatedLiveUpdates.querySelector('#total-teams');
                    if (totalEl) {
                      totalEl.textContent = `of ${status.qual.num_teams} teams`;
                    }
                  }
                }).catch(err => console.error('Error fetching team status:', err));
              }
            } else {
              // Event hasn't started - show countdown
              updatedCountdownSection.classList.remove('hidden');
              updatedLiveUpdates.classList.add('hidden');
              
              // Get the countdown container for this event
              const countdownTimer = updatedCountdownSection.querySelector('#countdown-timer');
              if (countdownTimer) {
                // Calculate countdown with 37-hour offset
                const startWithOffset = new Date(eventData.start_date);
                startWithOffset.setHours(startWithOffset.getHours() + 37);
                
                // Store target date as data attribute and add to timers array
                countdownTimer.dataset.targetDate = startWithOffset.getTime();
                countdownTimers.push(countdownTimer);
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error checking event status for ${eventCode}:`, error);
      }
    }
    
    // Set up a single global interval for all countdown timers
    if (countdownTimers.length > 0) {
      // Initial update for all timers
      updateAllCountdownTimers(countdownTimers);
      
      // Set a single interval to update all timers synchronously
      const globalCountdownInterval = setInterval(() => {
        const allComplete = updateAllCountdownTimers(countdownTimers);
        
        // If all countdowns are complete, clear the interval
        if (allComplete) {
          clearInterval(globalCountdownInterval);
          // Reload page to update the view
          window.location.reload();
        }
      }, 1000);
    }
  });
}

// Function to update all countdown timers at once
function updateAllCountdownTimers(timers) {
  const now = new Date();
  let allComplete = true;
  
  timers.forEach(timer => {
    const targetTime = parseInt(timer.dataset.targetDate);
    const timeLeft = targetTime - now;
    
    if (timeLeft <= 0) {
      timer.textContent = '0d 00h 00m 00s';
    } else {
      allComplete = false;
      
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      timer.textContent = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    }
  });
  
  return allComplete;
}

// Helper function to update countdown display for a specific timer
// Note: This function is kept for compatibility with other parts of the code
function updateCountdownDisplay(timerElement, targetDate) {
  const now = new Date();
  const timeLeft = targetDate - now;
  
  if (timeLeft <= 0) {
    timerElement.textContent = '0d 00h 00m 00s';
    return;
  }
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  
  timerElement.textContent = `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

// Helper function to fetch team status at an event
async function fetchTeamStatusAtEvent(eventCode, teamNumber) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/team/frc${teamNumber}/event/${eventCode}/status`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching team status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Fix: Log the data to see what we're working with
    console.log(`Fetched team status for ${teamNumber} at ${eventCode}:`, data);
    
    // Fix: If the data looks empty but response was OK, create a minimal structure
    if (data && Object.keys(data).length === 0) {
      return {
        qual: { ranking: { rank: '--', record: { wins: '--', losses: '--', ties: '--' } } },
        alliance: null,
        playoff: null
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching team status:', error);
    return null;
  }
}

// Fix: Add helper function to set fallback display when status data isn't available
function setFallbackEventDisplay(liveUpdates, eventCode) {
  // Set fallback for ranking
  const rankingNumberEl = liveUpdates.querySelector('#ranking-number');
  if (rankingNumberEl) rankingNumberEl.textContent = '--';

  const qualRecordEl = liveUpdates.querySelector('#qual-record');
  if (qualRecordEl) qualRecordEl.textContent = '--W--L--T';

  // Set fallback for alliance
  const allianceNumberEl = liveUpdates.querySelector('#alliance-number');
  if (allianceNumberEl) allianceNumberEl.textContent = '--';

  const alliancePickEl = liveUpdates.querySelector('#alliance-pick');
  if (alliancePickEl) alliancePickEl.textContent = '';

  const partnersEl = liveUpdates.querySelector('#alliance-partners');
  if (partnersEl) partnersEl.textContent = "Data unavailable";

  // Set fallback for playoffs
  const playoffResultEl = liveUpdates.querySelector('#playoff-result');
  if (playoffResultEl) playoffResultEl.textContent = "Unknown";

  const playoffRecordEl = liveUpdates.querySelector('#playoff-record');
  if (playoffRecordEl) playoffRecordEl.textContent = "Data unavailable";

  // Add data unavailable message
  const statusIndicator = document.createElement('div');
  statusIndicator.className = 'mt-4 text-center';
  statusIndicator.innerHTML = `
    <div class="inline-block px-3 py-1 bg-gray-500/20 rounded-full text-gray-400 text-sm">
      <i class="fas fa-exclamation-circle mr-1"></i> Some data unavailable
    </div>
  `;
  liveUpdates.appendChild(statusIndicator);
  
  // Log event code for debugging
  console.log(`Fallback display set for event ${eventCode}`);
}

// Fix: Add helper function to set qualification pending display
function setQualificationPendingDisplay(liveUpdates) {
  // Update alliance number to show pending status
  const allianceNumberEl = liveUpdates.querySelector('#alliance-number');
  if (allianceNumberEl) allianceNumberEl.innerHTML = `<i class="fas fa-question-circle"></i>`;

  const alliancePickEl = liveUpdates.querySelector('#alliance-pick');
  if (alliancePickEl) alliancePickEl.textContent = 'Pending';

  const partnersEl = liveUpdates.querySelector('#alliance-partners');
  if (partnersEl) partnersEl.textContent = "Qualification pending";

  // Update playoff section to show pending status
  const playoffResultEl = liveUpdates.querySelector('#playoff-result');
  if (playoffResultEl) {
    playoffResultEl.className = 'text-2xl font-bold text-gray-400';
    playoffResultEl.innerHTML = `<i class="fas fa-question-circle"></i>`;
  }

  const playoffRecordEl = liveUpdates.querySelector('#playoff-record');
  if (playoffRecordEl) playoffRecordEl.textContent = "Qualification pending";
}

// Helper function to fetch event awards
async function fetchEventAwards(eventCode) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/awards`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching event awards: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching event awards:', error);
    return [];
  }
}

// Helper function to get the playoff stage name based on level
function getPlayoffStageName(level) {
  switch(level) {
    case 'f':
      return 'Finals';
    case 'sf':
      return 'Semifinals';
    case 'qf':
      return 'Quarterfinals';
    case 'ef':
      return 'Octofinals'; // (Eighth-finals)
    case 'qm':
      return 'Qualification Matches';
    default:
      return level ? `Level: ${level}` : '';
  }
}

// Helper function to determine playoff placement based on level and alliance number
function determinePlayoffPlacement(level, allianceNumber) {
  // Default styling
  let placementClass = 'text-red-500';
  let placementText = 'Eliminated';
  
  // If we reached finals but lost, we're 2nd place
  if (level === 'f') {
    placementText = '2nd Place';
    placementClass = 'text-silver';
    return { placementText, placementClass };
  }
  
  // If we reached semifinals
  if (level === 'sf') {
    placementText = '3rd Place';
    placementClass = 'text-baywatch-orange';
    return { placementText, placementClass };
  }
  
  // Default case where we can't determine exact placement
  return { placementText, placementClass };
}

// Helper function to fetch detailed playoff results to determine exact placement
async function fetchDetailedPlayoffResults(eventCode, teamStatus) {
  try {
    // Default to the basic placement in case specific match info isn't available
    const playoffLevel = teamStatus.playoff.level;
    const allianceNumber = teamStatus.playoff.alliance;
    const basicPlacement = determinePlayoffPlacement(playoffLevel, allianceNumber);
    
    // For teams eliminated in semifinals, we need to check which specific match they were eliminated in
    if (playoffLevel === 'sf') {
      // Fetch the playoff match results
      const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/matches/playoff`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching playoff matches: ${response.status}`);
      }
      
      const matches = await response.json();
      const sfMatches = matches.filter(m => m.comp_level === 'sf');
      
      // Find the specific match where our team's alliance was eliminated
      const ourAlliance = `frc7790`;
      let ourLastMatch = null;
      
      for (const match of sfMatches) {
        const redAlliance = match.alliances.red.team_keys;
        const blueAlliance = match.alliances.blue.team_keys;
        
        if (redAlliance.includes(ourAlliance) || blueAlliance.includes(ourAlliance)) {
          if (!ourLastMatch || match.match_number > ourLastMatch.match_number) {
            ourLastMatch = match;
          }
        }
      }
      
      if (ourLastMatch) {
        // Match 13 is semifinal 2, which determines 3rd place
        // Match 12 is semifinal 1, which determines 4th place
        if (ourLastMatch.match_number === 13 || ourLastMatch.key.endsWith('_sf2m3')) {
          return {
            placementText: '3rd Place',
            placementClass: 'text-baywatch-orange'
          };
        } else if (ourLastMatch.match_number === 12 || ourLastMatch.key.endsWith('_sf1m3')) {
          return {
            placementText: '4th Place',
            placementClass: 'text-baywatch-orange'
          };
        }
      }
      
      // If we couldn't determine exact match, return the basic placement
      return basicPlacement;
    }
    
    // For quarterfinals, we can potentially distinguish 5th-8th places 
    if (playoffLevel === 'qf') {
      // Strategy: Check if team won any QF matches - teams winning at least one match
      // generally performed better than those who didn't win any
      const response = await fetch(`${window.TBA_BASE_URL}/team/${ourAlliance}/event/${eventCode}/matches`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching team matches: ${response.status}`);
      }
      
      const matches = await response.json();
      const qfMatches = matches.filter(m => m.comp_level === 'qf');
      
      // Check if we won any quarterfinal matches
      const ourAlliance = `frc7790`;
      let wonAnyMatch = false;
      
      for (const match of qfMatches) {
        const redAlliance = match.alliances.red.team_keys;
        const blueAlliance = match.alliances.blue.team_keys;
        let ourAllianceColor = null;
        
        if (redAlliance.includes(ourAlliance)) {
          ourAllianceColor = 'red';
        } else if (blueAlliance.includes(ourAlliance)) {
          ourAllianceColor = 'blue';
        }
        
        if (ourAllianceColor && match.winning_alliance === ourAllianceColor) {
          wonAnyMatch = true;
          break;
        }
      }
    }
    
    // For other playoff levels, return the basic placement
    return basicPlacement;
  } catch (error) {
    console.error('Error determining detailed playoff placement:', error);
    // Fall back to basic placement if we hit any errors
    return determinePlayoffPlacement(teamStatus.playoff.level, teamStatus.playoff.alliance);
  }
}

// Add these styles to support silver/bronze colors
document.addEventListener('DOMContentLoaded', function() {
  // Add custom colors for silver and bronze medals
  const style = document.createElement('style');
  style.textContent = `
    .text-silver {
      color: #C0C0C0;
    }
    .text-bronze {
      color: #CD7F32;
    }
  `;
  document.head.appendChild(style);
});