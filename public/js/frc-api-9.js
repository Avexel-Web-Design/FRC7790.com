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

// Function to enhance event page with Statbotics data
async function enhanceEventPageWithStatbotics(eventKey) {
  try {
    const statboticsData = await getEventStatbotics(eventKey);
    if (!statboticsData) return;
    
    // Find the rankings section
    const rankingsSection = document.getElementById('rankings-section');
    if (!rankingsSection) return;
    
    // Create a stats card for event EPA data
    const statsCard = document.createElement('div');
    statsCard.className = 'card-gradient rounded-lg p-4 mb-6 animate__animated animate__fadeIn';
    
    statsCard.innerHTML = `
      <h3 class="text-lg font-semibold mb-3">Event Statistics</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-black/30 p-3 rounded text-center">
          <div class="text-xs text-gray-400 mb-1">Max EPA</div>
          <div class="text-2xl font-bold text-baywatch-orange">${statboticsData.epa.max.toFixed(1)}</div>
        </div>
        <div class="bg-black/30 p-3 rounded text-center">
          <div class="text-xs text-gray-400 mb-1">Top 8 EPA</div>
          <div class="text-2xl font-bold text-blue-400">${statboticsData.epa.top_8.toFixed(1)}</div>
        </div>
        <div class="bg-black/30 p-3 rounded text-center">
          <div class="text-xs text-gray-400 mb-1">Average EPA</div>
          <div class="text-2xl font-bold text-gray-300">${statboticsData.epa.mean.toFixed(1)}</div>
        </div>
        <div class="bg-black/30 p-3 rounded text-center">
          <div class="text-xs text-gray-400 mb-1">Prediction Accuracy</div>
          <div class="text-2xl font-bold text-green-400">${(statboticsData.metrics.win_prob.acc * 100).toFixed(0)}%</div>
        </div>
      </div>
      <div class="text-xs text-gray-400 mt-2 text-right">
        <i class="fas fa-chart-bar mr-1"></i> Data from Statbotics
      </div>
    `;
    
    // Insert stats card at the top of rankings section
    const rankingsTable = rankingsSection.querySelector('.card-gradient');
    if (rankingsTable) {
      rankingsTable.parentNode.insertBefore(statsCard, rankingsTable);
    }
    
    // Enhance team rankings with EPA
    enhanceRankingsWithEPA(eventKey);
    
  } catch (error) {
    console.error('Error enhancing event page with Statbotics data:', error);
  }
}

// Function to enhance team rankings with EPA data
async function enhanceRankingsWithEPA(eventKey) {
  try {
    // Get all team rows in the rankings table
    const rankingsTable = document.querySelector('#rankings-section table');
    if (!rankingsTable) return;
    
    const teamRows = rankingsTable.querySelectorAll('tbody tr');
    if (!teamRows.length) return;
    
    // Add EPA header if it doesn't exist
    const headerRow = rankingsTable.querySelector('thead tr');
    if (headerRow) {
      // Check if EPA header already exists
      if (!headerRow.querySelector('th:last-child')?.textContent.includes('EPA')) {
        const epaHeader = document.createElement('th');
        epaHeader.textContent = 'EPA';
        epaHeader.className = 'px-4 py-3 text-right';
        headerRow.appendChild(epaHeader);
      }
    }
    
    // Process each team row
    for (const row of teamRows) {
      // Find the team number cell
      const firstCell = row.querySelector('td:first-child');
      if (!firstCell) continue;
      
      // Extract team number from text or link
      let teamNumber;
      const teamLink = firstCell.querySelector('a');
      if (teamLink) {
        const href = teamLink.getAttribute('href');
        teamNumber = href.split('=')[1];
      } else {
        // Extract from text, assuming format is just the number
        teamNumber = firstCell.textContent.trim();
      }
      
      if (!teamNumber) continue;
      
      // Fetch team EPA for this event
      const teamEventData = await getTeamEventStatbotics(teamNumber, eventKey);
      if (!teamEventData) continue;
      
      // Check if EPA cell already exists
      let epaCell = row.querySelector('.epa-cell');
      if (!epaCell) {
        // Create EPA cell
        epaCell = document.createElement('td');
        epaCell.className = 'px-4 py-3 text-right epa-cell';
        row.appendChild(epaCell);
      }
      
      // Update EPA value
      const epaRating = teamEventData.epa.total_points.mean;
      epaCell.innerHTML = `<span class="font-mono ${epaRating > 35 ? 'text-green-400' : epaRating > 25 ? 'text-blue-400' : 'text-gray-300'}">${epaRating.toFixed(1)}</span>`;
    }
  } catch (error) {
    console.error('Error enhancing rankings with EPA data:', error);
  }
}

// Function to enhance team page with Statbotics data
async function enhanceTeamPageWithStatbotics(teamNumber) {
  try {
    const statboticsData = await getTeamStatbotics(teamNumber);
    if (!statboticsData) return;
    
    // Create EPA stats section
    const statsContainer = document.querySelector('.container .grid');
    if (!statsContainer) return;
    
    const statsCard = document.createElement('div');
    statsCard.className = 'col-span-1 md:col-span-2 lg:col-span-1 animate__animated animate__fadeInUp';
    statsCard.style.animationDelay = '0.3s';
    
    statsCard.innerHTML = `
      <div class="card-gradient rounded-xl p-6">
        <h2 class="text-xl font-bold mb-4">EPA Statistics</h2>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Current EPA Rating:</span>
            <span class="text-2xl font-bold text-baywatch-orange">${statboticsData.current_epa?.toFixed(1) || 'N/A'}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Season Trend:</span>
            <span class="text-green-400">${statboticsData.trend > 0 ? '+' : ''}${statboticsData.trend?.toFixed(1) || '0.0'}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400">Recent Events:</span>
            <span class="text-lg">${statboticsData.recent_events?.join(', ') || 'N/A'}</span>
          </div>
          <div class="mt-2 text-xs text-gray-500 text-center">
            <i class="fas fa-chart-line mr-1"></i> Data from Statbotics
          </div>
        </div>
      </div>
    `;
    
    // Insert at the appropriate position
    const firstChild = statsContainer.firstChild;
    statsContainer.insertBefore(statsCard, firstChild);
    
    // Also enhance the events table with EPA data
    enhanceTeamEventsWithEPA(teamNumber);
    
  } catch (error) {
    console.error('Error enhancing team page with Statbotics data:', error);
  }
}

// Function to enhance team events table with EPA data
async function enhanceTeamEventsWithEPA(teamNumber) {
  try {
    const eventsTable = document.getElementById('events-table');
    if (!eventsTable) return;
    
    // Add EPA header to events table
    const headerRow = eventsTable.querySelector('thead tr');
    if (headerRow) {
      const epaHeader = document.createElement('th');
      epaHeader.textContent = 'EPA';
      epaHeader.className = 'p-4 text-left';
      headerRow.appendChild(epaHeader);
    }
    
    // Get all event rows
    const eventRows = eventsTable.querySelectorAll('tbody tr');
    if (!eventRows.length) return;
    
    // Process each event row
    for (const row of eventRows) {
      // Skip if this is just a "No events" message row
      if (row.querySelector('td[colspan]')) continue;
      
      // Find the event key from the event name cell
      const eventLinkCell = row.querySelector('td:first-child a');
      if (!eventLinkCell) continue;
      
      const eventHref = eventLinkCell.getAttribute('href');
      const eventKey = eventHref.split('=')[1];
      
      if (!eventKey) continue;
      
      // Fetch team-event data from Statbotics
      const teamEventData = await getTeamEventStatbotics(teamNumber, eventKey);
      
      // Create EPA cell
      const epaCell = document.createElement('td');
      epaCell.className = 'p-4';
      
      if (teamEventData && teamEventData.epa && teamEventData.epa.total_points) {
        const epaRating = teamEventData.epa.total_points.mean;
        epaCell.innerHTML = `
          <span class="font-mono ${epaRating > 35 ? 'text-green-400' : epaRating > 25 ? 'text-blue-400' : 'text-gray-300'}">
            ${epaRating.toFixed(1)}
          </span>
        `;
      } else {
        epaCell.textContent = 'N/A';
      }
      
      row.appendChild(epaCell);
    }
  } catch (error) {
    console.error('Error enhancing team events with EPA data:', error);
  }
}