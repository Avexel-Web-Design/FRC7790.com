/*
 * FRC API Module 11 - Team Scheduling & Performance Analytics
 * 
 * This file handles team-specific functionality including event schedules, match
 * results, team performance metrics, and statbotics integration. Enables users to
 * browse qualification and playoff matches with dynamic highlighting of team performance.
 */

// Update the event link generation in the processEventData function
function generateEventLink(eventKey, eventName) {
    return `<a href="event.html?event=${eventKey}" target="_blank" class="hover:text-baywatch-orange transition-colors font-medium">${eventName}</a>`;
  }
  
  // Define a function to generate row HTML rather than trying to reference row directly
  function generateEventRowHTML(event, currentEvent, nextEvent, dateStr, ranking, record, awards) {
    return `
      <td class="p-4">
        ${generateEventLink(event.key, event.name)}
        ${currentEvent && currentEvent.key === event.key ? 
          '<span class="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Current</span>' : 
          (nextEvent && nextEvent.key === event.key ? 
            '<span class="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Next</span>' : '')}
      </td>
      <td class="p-4">${dateStr}</td>
      <td class="p-4">${ranking}</td>
      <td class="p-4">${record}</td>
      <td class="p-4">${awards}</td>
    `;
  }
  // Modified tab navigation script - removed stats tab references
  document.addEventListener('DOMContentLoaded', function() {
    // Get tab buttons and content sections
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Add tooltip data for mobile view
    document.getElementById('tab-overview').setAttribute('data-tooltip', 'Overview');
    document.getElementById('tab-schedule').setAttribute('data-tooltip', 'Schedule');
    document.getElementById('tab-history').setAttribute('data-tooltip', 'History');
    
    // Add click event listeners to each tab button
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        tabButtons.forEach(btn => {
          btn.classList.remove('tab-active');
          btn.classList.remove('tab-clicked');
        });
        
        // Add "clicked" class for ripple effect animation
        this.classList.add('tab-clicked');
        
        // After a short delay, add the active class to allow ripple to display first
        setTimeout(() => {
          this.classList.add('tab-active');
        }, 150);
        
        // Hide all content sections first
        tabContents.forEach(content => {
          content.classList.add('hidden');
          content.classList.remove('active');
        });
        
        // Show corresponding content based on button id with animation
        const contentId = this.id.replace('tab-', '') + '-section';
        const contentElement = document.getElementById(contentId);
        
        if (contentElement) {
          contentElement.classList.remove('hidden');
          setTimeout(() => {
            contentElement.classList.add('active');
          }, 50);
          
          // Update URL hash without scrolling
          const hash = this.id.replace('tab-', '');
          history.replaceState(null, null, `#${hash}`);
          
          // If schedule tab is active, load the team schedule
          if (hash === 'schedule') {
            loadTeamSchedule();
          }
        }
      });
    });
    
    // Function to set active tab based on URL hash
    function setActiveTabFromHash() {
      const hash = window.location.hash.substring(1); // Remove the # character
      if (hash === 'schedule' || hash === 'history') {
        // Simulate click on the appropriate tab
        document.getElementById(`tab-${hash}`).click();
      } else {
        // If no hash or stats (now removed), activate the first tab by default
        document.getElementById('tab-overview').click();
      }
    }
    
    // Set active tab when page loads
    setActiveTabFromHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', setActiveTabFromHash);
  });


  async function loadTeamSchedule() {
    // Get team number from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const teamNumber = urlParams.get('team');
    
    if (!teamNumber) return;
    
    try {
      // Get event selector element
      const eventSelector = document.getElementById('event-selector');
      const qualTable = document.getElementById('team-qual-table').getElementsByTagName('tbody')[0];
      const playoffTable = document.getElementById('team-playoff-table').getElementsByTagName('tbody')[0];
      
      // First, load the team's events for the current year
      const teamKey = `frc${teamNumber}`;
      const currentYear = new Date().getFullYear();
      
      const eventsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/events/${currentYear}`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!eventsResponse.ok) throw new Error(`Failed to fetch team events: ${eventsResponse.status}`);
      
      const events = await eventsResponse.json();
      
      if (events.length === 0) {
        eventSelector.innerHTML = '<option value="">No events found for this year</option>';
        qualTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No events scheduled for this year</td></tr>';
        playoffTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No events scheduled for this year</td></tr>';
        return;
      }
      
      // Sort events by start date
      events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      
      // Populate event selector dropdown
      eventSelector.innerHTML = events.map(event => 
        `<option value="${event.key}">${event.name}</option>`
      ).join('');
      
      // Add event listener for event selection change
      eventSelector.addEventListener('change', async function() {
        const selectedEventKey = this.value;
        await loadEventMatches(teamKey, selectedEventKey);
      });
      
      // Load matches for the first event by default
      await loadEventMatches(teamKey, events[0].key);
      
    } catch (error) {
      console.error('Error loading team schedule:', error);
      document.getElementById('team-qual-table').getElementsByTagName('tbody')[0].innerHTML = 
        '<tr><td colspan="4" class="p-4 text-center text-red-400">Error loading team schedule</td></tr>';
      document.getElementById('team-playoff-table').getElementsByTagName('tbody')[0].innerHTML = 
        '<tr><td colspan="4" class="p-4 text-center text-red-400">Error loading team schedule</td></tr>';
    }
  }
  
  // Function to load matches for a specific event
  async function loadEventMatches(teamKey, eventKey) {
    try {
      const qualTable = document.getElementById('team-qual-table').getElementsByTagName('tbody')[0];
      const playoffTable = document.getElementById('team-playoff-table').getElementsByTagName('tbody')[0];
      
      qualTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading qualification matches...</td></tr>';
      playoffTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading playoff matches...</td></tr>';
      
      // Fetch team matches at the event
      const matchesResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${eventKey}/matches`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!matchesResponse.ok) throw new Error(`Failed to fetch team matches: ${matchesResponse.status}`);
      
      const matches = await matchesResponse.json();
      
      if (matches.length === 0) {
        qualTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No qualification matches found</td></tr>';
        playoffTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No playoff matches found</td></tr>';
        return;
      }
      
      // Separate qualification and playoff matches
      const qualMatches = matches.filter(match => match.comp_level === 'qm');
      const playoffMatches = matches.filter(match => match.comp_level !== 'qm');
      
      // Sort qualification matches by match number
      qualMatches.sort((a, b) => a.match_number - b.match_number);
      
      // Sort playoff matches by level and then match number
      playoffMatches.sort((a, b) => {
        // First sort by comp level (ef, qf, sf, f)
        if (a.comp_level !== b.comp_level) {
          const levels = { 'ef': 1, 'qf': 2, 'sf': 3, 'f': 4 };
          return levels[a.comp_level] - levels[b.comp_level];
        }
        // Then by set number
        if (a.set_number !== b.set_number) {
          return a.set_number - b.set_number;
        }
        // Then by match number
        return a.match_number - b.match_number;
      });
      
      // Process qualification matches
      if (qualMatches.length > 0) {
        qualTable.innerHTML = qualMatches.map(match => generateMatchRow(match, teamKey)).join('');
      } else {
        qualTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No qualification matches found</td></tr>';
      }
      
      // Process playoff matches
      if (playoffMatches.length > 0) {
        playoffTable.innerHTML = playoffMatches.map(match => generateMatchRow(match, teamKey)).join('');
      } else {
        playoffTable.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No playoff matches found</td></tr>';
      }
      
    } catch (error) {
      console.error('Error loading event matches:', error);
      document.getElementById('team-qual-table').getElementsByTagName('tbody')[0].innerHTML = 
        '<tr><td colspan="4" class="p-4 text-center text-red-400">Error loading qualification matches</td></tr>';
      document.getElementById('team-playoff-table').getElementsByTagName('tbody')[0].innerHTML = 
        '<tr><td colspan="4" class="p-4 text-center text-red-400">Error loading playoff matches</td></tr>';
    }
  }
  

  function generateMatchRow(match, teamKey) {
    // Determine if team is on blue or red alliance
    const isBlue = match.alliances.blue.team_keys.includes(teamKey);
    
    // Format match number based on match type
    let matchName = '';
    if (match.comp_level === 'qm') {
      matchName = `Qual ${match.match_number}`;
    } else if (match.comp_level === 'qf') {
      matchName = `QF ${match.set_number}-${match.match_number}`;
    } else if (match.comp_level === 'sf') {
      matchName = `SF ${match.set_number}-${match.match_number}`;
    } else if (match.comp_level === 'f') {
      matchName = `Final ${match.match_number}`;
    }
    
    // Determine if match has a winner
    const hasWinner = match.winning_alliance === 'blue' || match.winning_alliance === 'red';
    const isTie = match.winning_alliance === 'tie';
    
    // Format alliance teams with links
    const blueTeams = match.alliances.blue.team_keys.map(key => {
      const teamNum = key.replace('frc', '');
      const isCurrentTeam = key === teamKey;
      const isWinner = hasWinner && match.winning_alliance === 'blue';
      
      // Priority: 1) Current team (orange), 2) Winner (bold), 3) Regular
      if (isCurrentTeam) {
        if (isWinner) {
        return `<span class="font-bold text-baywatch-orange">${teamNum}</span>`;
        } else {
          return `<span class="text-baywatch-orange">${teamNum}</span>`;
        }
      } else if (isWinner) {
        return `<a href="team.html?team=${teamNum}" class="font-bold hover:text-baywatch-orange transition-colors">${teamNum}</a>`;
      } else {
        return `<a href="team.html?team=${teamNum}" class="hover:text-baywatch-orange transition-colors">${teamNum}</a>`;
      }
    }).join(', ');
    
    const redTeams = match.alliances.red.team_keys.map(key => {
      const teamNum = key.replace('frc', '');
      const isCurrentTeam = key === teamKey;
      const isWinner = hasWinner && match.winning_alliance === 'red';
      
      // Priority: 1) Current team (orange), 2) Winner (bold), 3) Regular
      if (isCurrentTeam) {
        if (isWinner) {
        return `<span class="font-bold text-baywatch-orange">${teamNum}</span>`;
        } else {
          return `<span class="text-baywatch-orange">${teamNum}</span>`;
        }
      } else if (isWinner) {
        return `<a href="team.html?team=${teamNum}" class="font-bold hover:text-baywatch-orange transition-colors">${teamNum}</a>`;
      } else {
        return `<a href="team.html?team=${teamNum}" class="hover:text-baywatch-orange transition-colors">${teamNum}</a>`;
      }
    }).join(', ');
    
    // Format score display
    let scoreDisplay = 'Not Played';
    let scoreClass = '';
    
    // Check if match has been played
    if (match.alliances.blue.score !== -1 && match.alliances.red.score !== -1) {
      // Get scores
      const blueScore = match.alliances.blue.score;
      const redScore = match.alliances.red.score;
      
      // Set colors based on winner
      if (match.winning_alliance === 'blue') {
        scoreDisplay = `<span class="text-blue-400 font-bold">${blueScore}</span> - <span class="text-red-400">${redScore}</span>`;
        scoreClass = 'text-blue-400';
      } else if (match.winning_alliance === 'red') {
        scoreDisplay = `<span class="text-blue-400">${blueScore}</span> - <span class="text-red-400 font-bold">${redScore}</span>`;
        scoreClass = 'text-red-400';
      } else if (match.winning_alliance === 'tie') {
        // Handle ties
        scoreDisplay = `<span class="text-blue-400">${blueScore}</span> - <span class="text-red-400">${redScore}</span>`;
        scoreClass = 'text-yellow-400 font-bold';
      }
    }
    
    return `
      <tr class="border-t border-gray-700 hover:bg-gray-900/30 transition-colors">
        <td class="p-4">
          <a href="match.html?match=${match.key}" 
            class="flex items-center text-baywatch-orange hover:text-white transition-colors">
            <span>${matchName}</span>
            <i class="fas fa-external-link-alt text-xs ml-1"></i>
          </a>
        </td>
        <td class="p-4 text-blue-400">${blueTeams}</td>
        <td class="p-4 text-red-400">${redTeams}</td>
        <td class="p-4 ${scoreClass}">${scoreDisplay}</td>
      </tr>
    `;
  }

  // Function to load team performance metrics
  async function loadTeamPerformanceMetrics() {
    try {
      // Get team number from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const teamNumber = urlParams.get('team');
      
      if (!teamNumber) {
        console.log("No team number found in URL");
        return;
      }
      
      console.log("Loading metrics for team", teamNumber);
      
      // Use the current year
      const currentYear = new Date().getFullYear();
      
      // StatBotics API URL
      const STATBOTICS_BASE_URL = 'https://api.statbotics.io/v2';
      
      // Fetch team year data from Statbotics
      const response = await fetch(`${STATBOTICS_BASE_URL}/team_year/${teamNumber}/${currentYear}`);
      
      if (!response.ok) {
        console.error(`StatBotics API responded with status: ${response.status}`);
        throw new Error(`Failed to fetch team data: ${response.status}`);
      }
      
      const teamData = await response.json();
      console.log("StatBotics data:", teamData);
      
      if (teamData) {
        // Update auto points - using the v2 API fields
        const avgAutoPoints = teamData.auto || 0;
        const maxAutoPoints = 20; // Approximate max value for scaling
        const autoPercentage = Math.min(100, (avgAutoPoints / maxAutoPoints) * 100);
        
        document.getElementById('avg-auto-points').textContent = avgAutoPoints.toFixed(1);
        document.getElementById('auto-points-bar').style.width = `${autoPercentage}%`;
        
        // Update teleop points
        const avgTeleopPoints = teamData.teleop || 0;
        const maxTeleopPoints = 40; // Approximate max value for scaling
        const teleopPercentage = Math.min(100, (avgTeleopPoints / maxTeleopPoints) * 100);
        
        document.getElementById('avg-teleop-points').textContent = avgTeleopPoints.toFixed(1);
        document.getElementById('teleop-points-bar').style.width = `${teleopPercentage}%`;
        
        // Update EPA total
        const epaTotal = teamData.total_epa || 0;
        const maxEpa = 60; // Approximate max value for scaling
        const epaPercentage = Math.min(100, (epaTotal / maxEpa) * 100);
        
        document.getElementById('epa-total').textContent = epaTotal.toFixed(1);
        document.getElementById('epa-bar').style.width = `${epaPercentage}%`;
        
        // Apply color coding based on EPA value
        if (epaTotal > 40) {
          document.getElementById('epa-bar').classList.add('bg-green-500');
          document.getElementById('epa-bar').classList.remove('bg-baywatch-orange');
        } else if (epaTotal < 20) {
          document.getElementById('epa-bar').classList.add('bg-red-500');
          document.getElementById('epa-bar').classList.remove('bg-baywatch-orange');
        }
      } else {
        console.log("No team data found in response");
        setDefaultMetrics();
      }
    } catch (error) {
      console.error('Error loading team performance metrics:', error);
      setDefaultMetrics();
      
      // Try fallback to v3 API if v2 fails
      tryFallbackMetrics();
    }
  }
  
  // Function to try fallback to v3 API
  async function tryFallbackMetrics() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const teamNumber = urlParams.get('team');
      
      if (!teamNumber) return;
      
      console.log("Trying fallback to v3 API");
      
      const STATBOTICS_V3_URL = 'https://api.statbotics.io/v3';
      const response = await fetch(`${STATBOTICS_V3_URL}/team/${teamNumber}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team data from v3 API: ${response.status}`);
      }
      
      const teamData = await response.json();
      console.log("StatBotics v3 data:", teamData);
      
      if (teamData && teamData.epa) {
        // Update auto points
        const avgAutoPoints = teamData.epa.breakdown?.auto_points?.mean || 0;
        const maxAutoPoints = 20; // Approximate max value for scaling
        const autoPercentage = Math.min(100, (avgAutoPoints / maxAutoPoints) * 100);
        
        document.getElementById('avg-auto-points').textContent = avgAutoPoints.toFixed(1);
        document.getElementById('auto-points-bar').style.width = `${autoPercentage}%`;
        
        // Update teleop points
        const avgTeleopPoints = teamData.epa.breakdown?.teleop_points?.mean || 0;
        const maxTeleopPoints = 40; // Approximate max value for scaling
        const teleopPercentage = Math.min(100, (avgTeleopPoints / maxTeleopPoints) * 100);
        
        document.getElementById('avg-teleop-points').textContent = avgTeleopPoints.toFixed(1);
        document.getElementById('teleop-points-bar').style.width = `${teleopPercentage}%`;
        
        // Update EPA total
        const epaTotal = teamData.epa.total_points?.mean || 0;
        const maxEpa = 60; // Approximate max value for scaling
        const epaPercentage = Math.min(100, (epaTotal / maxEpa) * 100);
        
        document.getElementById('epa-total').textContent = epaTotal.toFixed(1);
        document.getElementById('epa-bar').style.width = `${epaPercentage}%`;
      }
    } catch (error) {
      console.error('Fallback v3 API also failed:', error);
    }
  }
  
  // Function to set default metrics if API fails
  function setDefaultMetrics() {
    document.getElementById('avg-auto-points').textContent = 'N/A';
    document.getElementById('avg-teleop-points').textContent = 'N/A';
    document.getElementById('epa-total').textContent = 'N/A';
    
    document.getElementById('auto-points-bar').style.width = '0%';
    document.getElementById('teleop-points-bar').style.width = '0%';
    document.getElementById('epa-bar').style.width = '0%';
  }
  
  // Load metrics on page load and when tab is clicked
  document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded - Setting up metrics handlers");
    
    const statsTab = document.getElementById('tab-stats');
    
    if (statsTab) {
      // Load metrics when stats tab is clicked
      statsTab.addEventListener('click', function() {
        console.log("Stats tab clicked - Loading metrics");
        loadTeamPerformanceMetrics();
      });
      
      // Check if we're already on the stats tab due to URL hash
      if (window.location.hash === '#stats') {
        console.log("Hash is #stats - Loading metrics immediately");
        setTimeout(loadTeamPerformanceMetrics, 500); // Short delay to ensure DOM is ready
      }
    }
    
    // Also load metrics once everything has settled
    setTimeout(function() {
      if (window.location.hash === '#stats' || !window.location.hash) {
        console.log("Loading metrics after timeout");
        loadTeamPerformanceMetrics();
      }
    }, 2000);
  });