// Function to update playoff bracket
async function updatePlayoffBracket(eventKey) {
    try {
      // First, initialize all bracket positions with placeholder TBD matches
      // This ensures the bracket displays properly even before data loads
      initializeBracketWithPlaceholders();
      
      // Fetch alliance data first to build the mapping
      const allianceMap = await buildAllianceMapping(eventKey);
      
      // Then fetch match data
      const response = await fetch(`${window.TBA_BASE_URL}/event/${eventKey}/matches`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const matches = await response.json();
      
      const playoffMatches = matches.filter(match =>
        match.comp_level === 'sf' || match.comp_level === 'f'
      );
  
      if (playoffMatches && playoffMatches.length > 0) {
        // Process semifinal matches:
        const sfMatches = playoffMatches
          .filter(match => match.comp_level === 'sf')
          .sort((a, b) => (a.set_number - b.set_number) || (a.match_number - b.match_number));
  
        sfMatches.forEach((match, index) => {
          const sequentialNumber = index + 1; // sf match number in order
          const matchId = `match-sf${sequentialNumber}`;
          const matchBox = document.getElementById(matchId);
          if (matchBox) {
            updateMatchBox(matchBox, match, allianceMap);
            
            // Add match link to match box for direct access to match details page
            const matchNumber = matchBox.querySelector('.match-number');
            if (matchNumber) {
              matchNumber.innerHTML = `
                <a href="match.html?match=${match.key}" class="match-link">
                  Match ${sequentialNumber}
                  <i class="fas fa-external-link-alt text-xs ml-1"></i>
                </a>
              `;
            }
          }
        });
  
        // Process finals matches
        const finalMatches = playoffMatches.filter(match => match.comp_level === 'f');
        finalMatches.forEach(match => {
          const matchId = `match-f${match.match_number}`;
          const matchBox = document.getElementById(matchId);
          if (matchBox) {
            updateMatchBox(matchBox, match, allianceMap);
            
            // Add match link to match box for direct access to match details page
            const matchNumber = matchBox.querySelector('.match-number');
            if (matchNumber) {
              matchNumber.innerHTML = `
                <a href="match.html?match=${match.key}" class="match-link">
                  Finals ${match.match_number}
                  <i class="fas fa-external-link-alt text-xs ml-1"></i>
                </a>
              `;
            }
          }
        });
      }
  
    } catch (error) {
      console.error('Error updating playoff bracket:', error);
      // Don't replace the bracket with an error message - just log it
      // The initialized placeholders will remain visible
    }
  }
  
  // New function to initialize the bracket with TBD placeholders
  function initializeBracketWithPlaceholders() {
    const matchBoxes = document.querySelectorAll('[id^="match-sf"], [id^="match-f"]');
    
    matchBoxes.forEach(matchBox => {
      // Default placeholder structure
      const blueAlliance = matchBox.querySelector('.alliance.blue');
      const redAlliance = matchBox.querySelector('.alliance.red');
      
      if (blueAlliance) {
        blueAlliance.innerHTML = `
          <div class="alliance-badge blue-badge">TBD</div>
          <span class="teams">TBD</span>
          <span class="score"></span>
        `;
      }
      
      if (redAlliance) {
        redAlliance.innerHTML = `
          <div class="alliance-badge red-badge">TBD</div>
          <span class="teams">TBD</span>
          <span class="score"></span>
        `;
      }
      
      // Reset any winner styling
      blueAlliance?.classList.remove('winner');
      redAlliance?.classList.remove('winner');
    });
  }
  
  // Initialize page data
  if (window.location.pathname.includes('milac.html')) {
    loadEventRankings('2025milac');
    loadEventSchedule('2025milac');
    updatePlayoffBracket('2025milac');
    
    // Optional: Add periodic updates
    setInterval(() => {
      updatePlayoffBracket('2025milac');
    }, 30000); // Update every 30 seconds
  }
  // Add support for Traverse City event page
  else if (window.location.pathname.includes('mitvc.html')) {
    loadEventRankings('2025mitvc');
    loadEventSchedule('2025mitvc');
    updatePlayoffBracket('2025mitvc');
    
    // Optional: Add periodic updates
    setInterval(() => {
      updatePlayoffBracket('2025mitvc');
    }, 30000); // Update every 30 seconds
  }
  
  // Add this new function to handle loading match details
  async function loadMatchDetails(matchKey) {
    try {
      // Parse event key from match key (e.g., extract "2025milac" from "2025milac_qm1")
      const eventKey = matchKey.split('_')[0];
      
      // Show loading state
      document.getElementById('match-title').innerHTML = 
        '<span class="text-baywatch-orange animate-pulse">Loading match details...</span>';
      
      // Fetch match data
      const matchResponse = await fetch(`${window.TBA_BASE_URL}/match/${matchKey}`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!matchResponse.ok) throw new Error(`Match data HTTP error: ${matchResponse.status}`);
      const matchData = await matchResponse.json();
      
      // Fetch event data for the event name
      const eventResponse = await fetch(`${window.TBA_BASE_URL}/event/${eventKey}`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!eventResponse.ok) throw new Error(`Event data HTTP error: ${eventResponse.status}`);
      const eventData = await eventResponse.json();
      
      // Fetch team data for all teams in the match
      const allTeamKeys = [
        ...matchData.alliances.blue.team_keys,
        ...matchData.alliances.red.team_keys
      ];
      
      const teamPromises = allTeamKeys.map(teamKey => 
        fetch(`${window.TBA_BASE_URL}/team/${teamKey}`, {
          headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
        }).then(res => {
          if (!res.ok) throw new Error(`Team data HTTP error for ${teamKey}: ${res.status}`);
          return res.json();
        })
      );
      
      const teamData = await Promise.all(teamPromises);
      
      // Update UI with match details
      updateMatchOverview(matchData, eventData, teamData);
      
    } catch (error) {
      console.error("Error loading match details:", error);
      
      // Update UI with error state
      document.getElementById('match-title').innerHTML = 
        'Error Loading Match <span class="text-red-400"><i class="fas fa-circle-exclamation"></i></span>';
      document.getElementById('match-event').textContent = 'Failed to load match details';
      
      document.getElementById('match-time').innerHTML = 
        '<i class="fas fa-circle-exclamation mr-1"></i> Data error';
      document.getElementById('match-status').innerHTML = 
        '<i class="fas fa-circle-xmark mr-1"></i> Try again later';
        
      document.getElementById('score-container').innerHTML = 
        '<div class="w-full text-center py-8"><i class="fas fa-robot text-gray-600 text-5xl mb-4"></i><p class="text-gray-400">Match data could not be loaded</p></div>';
      
      document.getElementById('match-breakdown').innerHTML = 
        '<div class="text-center text-gray-400"><i class="fas fa-table-list text-gray-600 text-3xl mb-4"></i><p>Match breakdown unavailable</p></div>';
        
      document.getElementById('team-details').innerHTML = 
        '<div class="text-center text-gray-400"><i class="fas fa-users text-gray-600 text-3xl mb-4"></i><p>Team information unavailable</p></div>';
        
      document.getElementById('match-video').innerHTML = 
        '<div class="text-center text-gray-400"><i class="fas fa-video text-gray-600 text-3xl mb-4"></i><p>No match video available</p></div>';
    }
  }
  
  // Update match overview UI
  function updateMatchOverview(matchData, eventData, teamData) {
    // Update match title
    const matchTypeMap = {
      'qm': 'Qualification',
      'sf': 'Semifinal',
      'f': 'Final'
    };
    
    const matchType = matchTypeMap[matchData.comp_level] || 'Match';
    const matchNumber = matchData.match_number;
    let matchTitle = '';
    
    // Format title differently based on match type
    if (matchData.comp_level === 'qm') {
      matchTitle = `${matchType} ${matchNumber}`;
    } else if (matchData.comp_level === 'sf') {
      matchTitle = `${matchType} ${matchData.set_number} Match ${matchNumber}`;
    } else if (matchData.comp_level === 'f') {
      matchTitle = `${matchType} ${matchNumber}`;
    } else {
      const matchSet = matchData.set_number > 1 ? ` (Set ${matchData.set_number})` : '';
      matchTitle = `${matchType} ${matchNumber}${matchSet}`;
    }
    
    document.getElementById('match-title').innerHTML = 
      `<span class="text-baywatch-orange">${matchTitle}</span>`;
    
    // Update event info with playoff indicator for playoff matches
    let eventInfo = `${eventData.name} | ${eventData.year}`;
    if (matchData.comp_level !== 'qm') {
      eventInfo += ' | <span class="bg-baywatch-orange/30 text-baywatch-orange px-2 py-0.5 rounded text-sm">Playoffs</span>';
    }
    document.getElementById('match-event').innerHTML = eventInfo;
    
    // Update match time and status
    updateMatchTimeAndStatus(matchData);
    
    // Update alliance and score info
    updateMatchScores(matchData, teamData);
    
    // Update match breakdown
    updateMatchBreakdown(matchData);
    
    // Update team details
    updateTeamDetails(matchData, teamData);
    
    // Check for match video
    updateMatchVideo(matchData);
  }
  
  // Update match time and status display - simplified since elements were removed
  function updateMatchTimeAndStatus(matchData) {
    // Function remains but no longer updates UI elements that were removed
    console.log("Match time/status update skipped - elements removed from UI");
  }
  
  // Update alliance and score info
  function updateMatchScores(matchData, teamData) {
    const blueTeams = document.getElementById('blue-teams');
    const redTeams = document.getElementById('red-teams');
    const blueScore = document.getElementById('blue-score');
    const redScore = document.getElementById('red-score');
    const resultBanner = document.getElementById('match-result-banner');
    
    // Get blue and red alliance headers to update them
    const blueHeader = document.querySelector('.flex-1:first-child h3');
    const redHeader = document.querySelector('.flex-1:last-child h3');
    
    // Create a map of team keys to team data for quick lookup
    const teamMap = {};
    teamData.forEach(team => {
      teamMap[team.key] = team;
    });
    
    // Check if this is a playoff match
    const isPlayoff = matchData.comp_level !== 'qm';
    
    // If it's a playoff match, get alliance numbers
    if (isPlayoff) {
      // We need to fetch alliance data for the event to get alliance numbers
      fetch(`${window.TBA_BASE_URL}/event/${matchData.event_key}/alliances`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(alliances => {
        // Create a map of team keys to alliance numbers
        const allianceMap = {};
        
        // Iterate through each alliance and assign numbers
        alliances.forEach((alliance, index) => {
          const allianceNumber = index + 1;
          alliance.picks.forEach(teamKey => {
            allianceMap[teamKey] = allianceNumber;
          });
        });
        
        // Find alliance numbers for the current match
        let blueAllianceNum = '?';
        let redAllianceNum = '?';
        
        // Check each team in the blue alliance to find a match
        for (const teamKey of matchData.alliances.blue.team_keys) {
          if (allianceMap[teamKey]) {
            blueAllianceNum = allianceMap[teamKey];
            break;
          }
        }
        
        // Check each team in the red alliance to find a match
        for (const teamKey of matchData.alliances.red.team_keys) {
          if (allianceMap[teamKey]) {
            redAllianceNum = allianceMap[teamKey];
            break;
          }
        }
        
        // Update headers with alliance numbers and keep color indicator
        if (blueHeader) blueHeader.innerHTML = `ALLIANCE ${blueAllianceNum} <span class="text-blue-400"></span>`;
        if (redHeader) redHeader.innerHTML = `ALLIANCE ${redAllianceNum} <span class="text-red-400"></span>`;
      })
      .catch(err => {
        console.error("Error fetching alliance data:", err);
        // Fallback to basic headers on error
        if (blueHeader) blueHeader.textContent = "BLUE ALLIANCE";
        if (redHeader) redHeader.textContent = "RED ALLIANCE";
      });
    } else {
      // For qualification matches, keep the original headers
      if (blueHeader) blueHeader.textContent = "BLUE ALLIANCE";
      if (redHeader) redHeader.textContent = "RED ALLIANCE";
    }
    
    // Rest of the existing function remains the same
    // Display blue alliance teams
    blueTeams.innerHTML = matchData.alliances.blue.team_keys.map(teamKey => {
      const team = teamMap[teamKey];
      const teamNumber = teamKey.replace('frc', '');
      const teamName = team ? team.nickname : 'Unknown Team';
      const is7790 = teamNumber === '7790' ? 'team-7790' : '';
      
      return `
        <div class="team-item blue-team ${is7790}">
          <span class="team-number">${teamNumber}</span>
          <span class="team-name">${teamName}</span>
        </div>
      `;
    }).join('');
    
    // Display red alliance teams
    redTeams.innerHTML = matchData.alliances.red.team_keys.map(teamKey => {
      const team = teamMap[teamKey];
      const teamNumber = teamKey.replace('frc', '');
      const teamName = team ? team.nickname : 'Unknown Team';
      const is7790 = teamNumber === '7790' ? 'team-7790' : '';
      
      return `
        <div class="team-item red-team ${is7790}">
          <span class="team-number">${teamNumber}</span>
          <span class="team-name">${teamName}</span>
        </div>
      `;
    }).join('');
    
    // Display scores if the match is completed
    if (matchData.alliances.blue.score !== null && matchData.alliances.red.score !== null) {
      blueScore.textContent = matchData.alliances.blue.score;
      redScore.textContent = matchData.alliances.red.score;
      
      // Show result banner
      resultBanner.classList.remove('hidden');
      
      if (matchData.winning_alliance === 'blue') {
        resultBanner.classList.add('blue-winner');
        resultBanner.textContent = 'Blue Alliance Wins!';
      } 
      else if (matchData.winning_alliance === 'red') {
        resultBanner.classList.add('red-winner');
        resultBanner.textContent = 'Red Alliance Wins!';
      }
      else {
        resultBanner.classList.add('tie');
        resultBanner.textContent = 'Match Tied!';
      }
    } else {
      blueScore.textContent = '--';
      redScore.textContent = '--';
    }
  }

// At the end of the file, add this event listener to ensure proper tab initialization

document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the event page
  if (window.location.pathname.includes('event.html')) {
    // Try to select the rankings tab by default (if available)
    setTimeout(() => {
      const rankingsTab = document.getElementById('tab-rankings');
      if (rankingsTab && typeof rankingsTab.click === 'function') {
        rankingsTab.click();
      }
      
      // Check hash to switch to appropriate tab
      const hash = window.location.hash.substring(1);
      if (hash === 'schedule' || hash === 'playoff' || hash === 'rankings') {
        const tab = document.getElementById(`tab-${hash}`);
        if (tab && typeof tab.click === 'function') {
          tab.click();
        }
      }
    }, 500); // small delay to ensure DOM is ready
  }
});