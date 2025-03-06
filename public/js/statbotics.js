// public/js/statbotics.js
const STATBOTICS_BASE_URL = 'https://api.statbotics.io/v3';

// Cache to prevent repeated API calls
const statboticsCache = {
  events: new Map(),
  teams: new Map(),
  matches: new Map(),
  teamEvents: new Map(),
  lastUpdated: Date.now()
};

// Helper function for API fetch with error handling
async function fetchFromStatbotics(endpoint) {
  try {
    const response = await fetch(`${STATBOTICS_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Statbotics resource not found: ${endpoint}`);
        return null;
      }
      throw new Error(`Statbotics API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from Statbotics: ${endpoint}`, error);
    return null;
  }
}

// Get event data with cache support
async function getEventStatbotics(eventKey) {
  if (statboticsCache.events.has(eventKey) && 
      (Date.now() - statboticsCache.lastUpdated) < 3600000) { // 1 hour cache
    return statboticsCache.events.get(eventKey);
  }
  
  const eventData = await fetchFromStatbotics(`/event/${eventKey}`);
  if (eventData) {
    statboticsCache.events.set(eventKey, eventData);
    statboticsCache.lastUpdated = Date.now();
  }
  return eventData;
}

// Get match data with cache support
async function getMatchStatbotics(matchKey) {
  if (statboticsCache.matches.has(matchKey) && 
      (Date.now() - statboticsCache.lastUpdated) < 3600000) {
    return statboticsCache.matches.get(matchKey);
  }
  
  const matchData = await fetchFromStatbotics(`/match/${matchKey}`);
  if (matchData) {
    statboticsCache.matches.set(matchKey, matchData);
    statboticsCache.lastUpdated = Date.now();
  }
  return matchData;
}

// Get team-event performance data with cache support
async function getTeamEventStatbotics(teamNumber, eventKey) {
  const cacheKey = `${teamNumber}_${eventKey}`;
  
  // Check cache first to prevent excessive API calls
  if (statboticsCache.teamEvents.has(cacheKey) && 
      (Date.now() - statboticsCache.lastUpdated) < 3600000) { // 1 hour cache
    console.log(`Using cached EPA data for team ${teamNumber} at ${eventKey}`);
    return statboticsCache.teamEvents.get(cacheKey);
  }
  
  console.log(`Fetching EPA data for team ${teamNumber} at ${eventKey}`);
  
  try {
    // Make sure teamNumber doesn't have 'frc' prefix
    const cleanTeamNumber = teamNumber.replace('frc', '');
    const teamEventData = await fetchFromStatbotics(`/team_event/${cleanTeamNumber}/${eventKey}`);
    
    if (teamEventData) {
      // Store in cache
      statboticsCache.teamEvents.set(cacheKey, teamEventData);
      statboticsCache.lastUpdated = Date.now();
      console.log(`Successfully cached EPA data for team ${teamNumber}`);
    } else {
      console.warn(`No data returned from Statbotics for team ${teamNumber} at ${eventKey}`);
    }
    
    return teamEventData;
  } catch (error) {
    console.error(`Error in getTeamEventStatbotics for team ${teamNumber}:`, error);
    return null;
  }
}

// Fetch team data from Statbotics
async function getTeamStatbotics(teamNumber) {
  try {
    const response = await fetch(`${STATBOTICS_BASE_URL}/team/${teamNumber}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching team data from Statbotics:', error);
    return null;
  }
}

// Enhanced version of loadMatchDetails that incorporates Statbotics data
async function loadMatchDetailsWithStatbotics(matchKey) {
  try {
    // First call the original function to get TBA data
    await loadMatchDetails(matchKey);
    
    // Then fetch Statbotics data
    const statboticsMatchData = await getMatchStatbotics(matchKey);
    if (!statboticsMatchData) return;
    
    // Add just the prediction section to the TBA breakdown
    updateStatboticsMatchBreakdown(statboticsMatchData);
    
  } catch (error) {
    console.error('Error loading match details with Statbotics:', error);
  }
}

// Helper function to create stats row for match breakdown
function createStatsRow(label, blueValue, redValue) {
  const row = document.createElement('tr');
  
  const labelCell = document.createElement('td');
  labelCell.className = 'score-category';
  labelCell.textContent = label;
  
  const blueCell = document.createElement('td');
  blueCell.className = 'blue-value';
  blueCell.textContent = blueValue;
  
  const redCell = document.createElement('td');
  redCell.className = 'red-value';
  redCell.textContent = redValue;
  
  row.appendChild(labelCell);
  row.appendChild(blueCell);
  row.appendChild(redCell);
  
  return row;
}

// Initialize on document load
document.addEventListener('DOMContentLoaded', function() {
  // Detect which page we're on
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  
  if (path.includes('event.html') && params.has('event')) {
    // On event page, enhance with Statbotics event data
    enhanceEventPageWithStatbotics(params.get('event'));
  }
  else if (path.includes('team.html') && params.has('team')) {
    // On team page, enhance with Statbotics team data
    enhanceTeamEventsWithEPA(params.get('team'));
  }
});

// Function to update match breakdown with Statbotics data
function updateStatboticsMatchBreakdown(matchData) {
  const breakdownElement = document.getElementById('match-breakdown');
  if (!breakdownElement) return;
  
  // Only add prediction, don't replace the entire content
  if (matchData.pred) {
    // Create prediction section
    const predSection = document.createElement('div');
    predSection.className = 'mb-6';
    predSection.innerHTML = `
      <h3 class="text-lg font-semibold mb-3">Match Prediction</h3>
      <div class="card-gradient rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-blue-400 font-medium">Blue Alliance</div>
          <div class="text-gray-300 font-medium">Win Probability</div>
          <div class="text-red-400 font-medium">Red Alliance</div>
        </div>
        <div class="flex items-center">
          <div class="w-full rounded-l-full h-5 bg-blue-500/30" 
               style="width: ${(1 - matchData.pred.red_win_prob) * 100}%"></div>
          <div class="px-2 text-xs bg-gray-800/80">${Math.round((1 - matchData.pred.red_win_prob) * 100)}%</div>
          <div class="w-full rounded-r-full h-5 bg-red-500/30" 
               style="width: ${matchData.pred.red_win_prob * 100}%"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <div>${Math.round(matchData.pred.blue_score)} pts</div>
          <div>Predicted Score</div>
          <div>${Math.round(matchData.pred.red_score)} pts</div>
        </div>
      </div>
    `;
    
    // Insert at the beginning of the breakdown element
    breakdownElement.insertBefore(predSection, breakdownElement.firstChild);
  }
  
  // Don't add the detailed stats section that conflicts with TBA data
}

// Helper function to create table header
function createTableHeader() {
  const header = document.createElement('tr');
  
  const emptyCell = document.createElement('th');
  emptyCell.className = 'score-category';
  
  const blueCell = document.createElement('th');
  blueCell.textContent = 'BLUE';
  
  const redCell = document.createElement('th');
  redCell.textContent = 'RED';
  
  header.appendChild(emptyCell);
  header.appendChild(blueCell);
  header.appendChild(redCell);
  
  return header;
}

// Helper function to create section headers
function createSectionHeader(title) {
  const row = document.createElement('tr');
  row.className = 'section-header';
  
  const cell = document.createElement('td');
  cell.colSpan = 3;
  cell.textContent = title;
  
  row.appendChild(cell);
  return row;
}

// Update document ready function to use enhanced match loader
document.addEventListener('DOMContentLoaded', function() {
  // Extract match key from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const matchKey = urlParams.get('match');
  
  if (matchKey) {
    // Use enhanced function with Statbotics data
    loadMatchDetailsWithStatbotics(matchKey);
  } else {
    // Handle case where no match key is provided (use original error handling)
    document.getElementById('match-title').innerHTML = 
      'No Match Selected <span class="text-red-400"><i class="fas fa-circle-exclamation"></i></span>';
    document.getElementById('match-event').textContent = 'Please select a match from the schedule';
    
    document.getElementById('score-container').innerHTML = 
      '<div class="w-full text-center py-8"><i class="fas fa-robot text-gray-600 text-5xl mb-4"></i><p class="text-gray-400">No match data available</p></div>';
    
    document.getElementById('match-breakdown').innerHTML = 
      '<div class="text-center text-gray-400"><i class="fas fa-table-list text-gray-600 text-3xl mb-4"></i><p>Match breakdown unavailable</p></div>';
      
    document.getElementById('team-details').innerHTML = 
      '<div class="text-center text-gray-400"><i class="fas fa-users text-gray-600 text-3xl mb-4"></i><p>Team information unavailable</p></div>';
      
    document.getElementById('match-video').innerHTML = 
      '<div class="text-center text-gray-400"><i class="fas fa-video text-gray-600 text-3xl mb-4"></i><p>No match video available</p></div>';
  }
});

// Enhanced version of updateTeamDetails to include Statbotics data
async function updateTeamDetailsWithStatbotics(matchData, teamData) {
  // Call original function first
  await updateTeamDetails(matchData, teamData);
  
  // Then enhance with Statbotics data
  const eventKey = matchData.event_key;
  const teamDetailsElement = document.getElementById('team-details');
  
  // Create a map of team keys to team data for quick lookup
  const teamMap = {};
  teamData.forEach(team => {
    teamMap[team.key] = team;
  });
  
  // Get all team cards
  const teamCards = teamDetailsElement.querySelectorAll('.team-detail-card');
  
  // For each team card, add Statbotics data
  for (const card of teamCards) {
    // Extract team number from the link href
    const teamLink = card.getAttribute('href');
    const teamNumber = teamLink.split('=')[1];
    
    // Fetch team-event data from Statbotics
    const teamEventData = await getTeamEventStatbotics(teamNumber, eventKey);
    if (!teamEventData) continue;
    
    // Create stats element to insert
    const statsElement = document.createElement('div');
    statsElement.className = 'mt-3 pt-2 border-t border-gray-700/30';
    
    // Determine team alliance color
    const isBlue = card.classList.contains('bg-blue-900/20');
    const color = isBlue ? 'text-blue-300' : 'text-red-300';
    
    // Add EPA stats
    statsElement.innerHTML = `
      <div class="flex justify-between text-xs mt-1">
        <span class="text-gray-400">EPA Rating:</span>
        <span class="${color} font-mono">${teamEventData.epa.total_points.mean.toFixed(1)}</span>
      </div>
      <div class="flex justify-between text-xs mt-1">
        <span class="text-gray-400">Auto Points:</span>
        <span class="${color} font-mono">${teamEventData.epa.breakdown.auto_points.toFixed(1)}</span>
      </div>
      <div class="flex justify-between text-xs mt-1">
        <span class="text-gray-400">Teleop Points:</span>
        <span class="${color} font-mono">${teamEventData.epa.breakdown.teleop_points.toFixed(1)}</span>
      </div>
      <div class="flex justify-between text-xs mt-1">
        <span class="text-gray-400">Endgame:</span>
        <span class="${color} font-mono">${teamEventData.epa.breakdown.endgame_points.toFixed(1)}</span>
      </div>
      <div class="text-xs text-gray-400 mt-2 text-center">
        <i class="fas fa-chart-line mr-1"></i> Statbotics EPA
      </div>
    `;
    
    // Append the stats element to the card
    card.appendChild(statsElement);
  }
}

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
    `;
    
    // Insert stats card at the top of rankings section
    const rankingsTable = rankingsSection.querySelector('.card-gradient');
    if (rankingsTable) {
      rankingsTable.parentNode.insertBefore(statsCard, rankingsTable);
    }
    
    // IMPORTANT: Add a slight delay to ensure the table is fully rendered before enhancing with EPA
    // This helps avoid timing issues with the sortable table
    setTimeout(() => {
      enhanceRankingsWithEPA(eventKey);
    }, 500);
    
  } catch (error) {
    console.error('Error enhancing event page with Statbotics data:', error);
  }
}

// Function to enhance team rankings with EPA data
async function enhanceRankingsWithEPA(eventKey) {
  try {
    console.log("Starting EPA enhancement for rankings table");
    
    // Get all team rows in the rankings table
    const rankingsTable = document.querySelector('#rankings-table');
    if (!rankingsTable) {
      console.error('Rankings table not found');
      return;
    }
    
    // Get team data from table rows - using a more specific selector to avoid separator rows
    const teamRows = rankingsTable.querySelectorAll('tbody tr:not(.team-7790-separator)');
    if (!teamRows.length) {
      console.error('No team rows found in rankings table');
      return;
    }
    
    console.log(`Found ${teamRows.length} team rows to enhance with EPA data`);
    
    // If rankingsData doesn't exist yet, create it from the table
    if (!window.rankingsData) {
      console.log('Creating rankings data from table');
      window.rankingsData = [];
      
      Array.from(teamRows).forEach((row, index) => {
        const rankCell = row.cells[0];
        const teamCell = row.cells[1].querySelector('a');
        const nameCell = row.cells[2];
        const recordCell = row.cells[3];
        const rpCell = row.cells[4];
        
        if (!teamCell) return;
        
        const href = teamCell.getAttribute('href');
        const teamNumber = href.split('=')[1];
        
        if (!teamNumber) return;
        
        // Create record object from string "W-L-T"
        let record = { wins: 0, losses: 0, ties: 0 };
        const recordMatch = recordCell.textContent.match(/(\d+)-(\d+)-(\d+)/);
        if (recordMatch) {
          record = { 
            wins: parseInt(recordMatch[1]), 
            losses: parseInt(recordMatch[2]), 
            ties: parseInt(recordMatch[3])
          };
        }
        
        // Add to rankings data
        window.rankingsData.push({
          rank: parseInt(rankCell.textContent || '0'),
          teamNumber: parseInt(teamNumber),
          teamNumberString: teamNumber,
          teamName: nameCell.textContent.trim() || 'Unknown',
          record: record,
          recordString: recordCell.textContent.trim() || '0-0-0',
          winPercentage: record.wins / (record.wins + record.losses + record.ties) || 0,
          sortOrder: parseFloat(rpCell.textContent.trim() || '0'),
          epa: null,
          originalIndex: index,
          isTeam7790: teamNumber === '7790'
        });
      });
    }
    
    console.log("Starting EPA data fetch for all teams in ranking table...");
    let loadingCount = 0;
    const fetchPromises = [];
    
    // Process each team row and fetch EPA data
    for (let i = 0; i < teamRows.length; i++) {
      const row = teamRows[i];
      
      // Get team number from the second cell that contains the team number link
      const teamCell = row.querySelector('td:nth-child(2) a');
      if (!teamCell) {
        console.warn(`No team link found in row ${i+1}`);
        continue;
      }
      
      const href = teamCell.getAttribute('href');
      if (!href) {
        console.warn(`No href attribute on team link in row ${i+1}`);
        continue;
      }
      
      const teamNumber = href.split('=')[1];
      if (!teamNumber) {
        console.warn(`Could not extract team number from href: ${href}`);
        continue;
      }
      
      console.log(`Processing team ${teamNumber} in row ${i+1}`);
      
      // Find this team in rankingsData or continue
      const teamDataIndex = window.rankingsData.findIndex(team => 
        team.teamNumberString === teamNumber);
      
      if (teamDataIndex === -1) {
        console.warn(`Could not find team ${teamNumber} in rankingsData`);
        continue;
      }
      
      // Get EPA cell - try both approaches as the DOM might have changed
      let epaCell;
      if (row.cells.length >= 6) {
        epaCell = row.cells[5]; // Direct access if cell exists
      } else {
        epaCell = row.querySelector('.epa-cell'); // Query selector if direct access fails
        if (!epaCell) {
          // Create EPA cell if it doesn't exist
          epaCell = document.createElement('td');
          epaCell.className = 'p-4 epa-cell';
          epaCell.innerHTML = `<span class="font-mono text-gray-500">...</span>`;
          row.appendChild(epaCell);
        }
      }
      
      // Increment loading counter
      loadingCount++;
      
      // Create a promise for each team's EPA data fetch
      const fetchPromise = (async function fetchTeamEPA(teamNum, cell, dataIndex) {
        try {
          console.log(`Fetching EPA data for team ${teamNum}`);
          // Direct API call to the team_event endpoint
          const teamEventData = await getTeamEventStatbotics(teamNum, eventKey);
          
          if (teamEventData && teamEventData.epa && teamEventData.epa.total_points) {
            const epaRating = teamEventData.epa.total_points.mean;
            
            // Store EPA value in the team data
            if (window.rankingsData && window.rankingsData[dataIndex]) {
              window.rankingsData[dataIndex].epa = epaRating;
            }
            
            // Update EPA value with color coding based on rating
            cell.innerHTML = `<span class="font-mono ${
              epaRating > 35 ? 'text-green-400' : 
              epaRating > 25 ? 'text-blue-400' : 
              'text-gray-300'
            }">${epaRating.toFixed(1)}</span>`;
            
            console.log(`Successfully loaded EPA (${epaRating.toFixed(1)}) for team ${teamNum}`);
          } else {
            console.warn(`No EPA data found for team ${teamNum} at event ${eventKey}`);
            cell.innerHTML = `<span class="font-mono text-gray-500">N/A</span>`;
            
            // Set to 0 to avoid null issues with sorting
            if (window.rankingsData && window.rankingsData[dataIndex]) {
              window.rankingsData[dataIndex].epa = 0;
            }
          }
        } catch (error) {
          console.error(`Error fetching EPA for team ${teamNum}:`, error);
          cell.innerHTML = `<span class="font-mono text-gray-500">--</span>`;
          
          // Set to 0 to avoid null issues with sorting
          if (window.rankingsData && window.rankingsData[dataIndex]) {
            window.rankingsData[dataIndex].epa = 0;
          }
        } finally {
          loadingCount--;
          if (loadingCount === 0) {
            console.log("Completed loading all EPA data for teams");
          }
        }
        return true; // Resolve the promise
      })(teamNumber, epaCell, teamDataIndex);
      
      fetchPromises.push(fetchPromise);
    }
    
    // Wait for all EPA data to be fetched
    await Promise.all(fetchPromises);
    console.log("All EPA data fetching complete");
    
  } catch (error) {
    console.error('Error enhancing rankings with EPA data:', error);
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
      epaHeader.className = 'p-4 text-left text-baywatch-orange';
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