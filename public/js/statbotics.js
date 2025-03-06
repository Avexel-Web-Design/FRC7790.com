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
        epaHeader.className = 'px-4 py-3 text-right text-baywatch-orange';
        headerRow.appendChild(epaHeader);
      }
    }
    
    // First, update the colspan for any separator rows and ensure they span across the EPA column
    const separatorRow = rankingsTable.querySelector('.team-7790-separator');
    if (separatorRow && separatorRow.querySelector('td')) {
      const separatorCell = separatorRow.querySelector('td');
      separatorCell.setAttribute('colspan', '6'); // Increase colspan to include EPA column
    }
    
    // Show loading indicator on the EPA column
    console.log("Starting EPA data fetch for all teams in ranking table...");
    let loadingCount = 0;
    
    // Process each team row
    for (const row of teamRows) {
      // If this is a separator row, adjust the colspan and skip the rest
      if (row.classList.contains('team-7790-separator')) {
        continue;
      }
      
      // Find the team number cell (now it's the second cell)
      const teamCell = row.querySelector('td:nth-child(2)');
      if (!teamCell) continue;
      
      // Extract team number from link
      let teamNumber;
      const teamLink = teamCell.querySelector('a');
      if (teamLink) {
        const href = teamLink.getAttribute('href');
        teamNumber = href.split('=')[1];
      } else {
        // If no link, try to get from text content
        teamNumber = teamCell.textContent.trim();
      }
      
      if (!teamNumber) continue;
      
      // Create EPA cell if it doesn't exist
      let epaCell = row.querySelector('.epa-cell');
      if (!epaCell) {
        // Create EPA cell
        epaCell = document.createElement('td');
        epaCell.className = 'px-4 py-3 text-right epa-cell';
        
        // If this is team 7790's row, add the highlighting class to the EPA cell too
        if (teamNumber === '7790') {
          epaCell.classList.add('bg-baywatch-orange', 'bg-opacity-20');
        }
        
        // Add loading indicator
        epaCell.innerHTML = `<span class="font-mono text-gray-500">...</span>`;
        row.appendChild(epaCell);
      }
      
      // Increment loading counter
      loadingCount++;
      
      // Use separate async function to fetch data for each team to avoid blocking
      (async function fetchTeamEPA(teamNum, cell) {
        try {
          // Direct API call to the team_event endpoint
          const teamEventData = await getTeamEventStatbotics(teamNum, eventKey);
          
          if (teamEventData && teamEventData.epa && teamEventData.epa.total_points) {
            const epaRating = teamEventData.epa.total_points.mean;
            
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
          }
        } catch (error) {
          console.error(`Error fetching EPA for team ${teamNum}:`, error);
          cell.innerHTML = `<span class="font-mono text-gray-500">--</span>`;
        } finally {
          loadingCount--;
          if (loadingCount === 0) {
            console.log("Completed loading all EPA data for teams");
          }
        }
      })(teamNumber, epaCell);
    }
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