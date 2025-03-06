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

// Get team-event performance data
async function getTeamEventStatbotics(teamNumber, eventKey) {
  const cacheKey = `${teamNumber}_${eventKey}`;
  if (statboticsCache.teamEvents.has(cacheKey) && 
      (Date.now() - statboticsCache.lastUpdated) < 3600000) {
    return statboticsCache.teamEvents.get(cacheKey);
  }
  
  const teamEventData = await fetchFromStatbotics(`/team_event/${teamNumber}/${eventKey}`);
  if (teamEventData) {
    statboticsCache.teamEvents.set(cacheKey, teamEventData);
    statboticsCache.lastUpdated = Date.now();
  }
  return teamEventData;
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
    // Call original function first to get basic match data
    const matchData = await loadMatchDetails(matchKey);
    
    // Now fetch Statbotics data for enhanced stats
    const statboticsMatch = await getMatchStatbotics(matchKey);
    
    if (statboticsMatch) {
      // Update match breakdown with enhanced stats
      updateStatboticsMatchBreakdown(statboticsMatch);
      
      // Update team details with EPA ratings
      if (matchData.teamData) {
        await updateTeamDetailsWithStatbotics(matchData.matchData, matchData.teamData);
      }
    }
    
    return matchData;
  } catch (error) {
    console.error('Error loading enhanced match details:', error);
    return null;
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
  
  if (path.includes('match.html') && params.has('match')) {
    // On match page, load enhanced match details
    loadMatchDetailsWithStatbotics(params.get('match'));
  } 
  else if (path.includes('event.html') && params.has('event')) {
    // On event page, enhance with Statbotics event data
    enhanceEventPageWithStatbotics(params.get('event'));
  }
  else if (path.includes('team.html') && params.has('team')) {
    // On team page, enhance with Statbotics team data
    enhanceTeamEventsWithEPA(params.get('team'));
  }
});

// Enhanced match details function that incorporates Statbotics data
async function loadMatchDetailsWithStatbotics(matchKey) {
  try {
    // First call the original function to get TBA data
    await loadMatchDetails(matchKey);
    
    // Then fetch Statbotics data
    const statboticsMatchData = await getMatchStatbotics(matchKey);
    if (!statboticsMatchData) return;
    
    // Update the match breakdown with additional Statbotics insights
    updateStatboticsMatchBreakdown(statboticsMatchData);
    
  } catch (error) {
    console.error('Error loading match details with Statbotics:', error);
  }
}

// Function to update match breakdown with Statbotics data
function updateStatboticsMatchBreakdown(matchData) {
  const breakdownElement = document.getElementById('match-breakdown');
  if (!breakdownElement) return;
  
  // Clear current content
  breakdownElement.innerHTML = '';
  
  // Create sections
  const predSection = document.createElement('div');
  predSection.className = 'mb-6';
  
  // If prediction data is available, show it
  if (matchData.pred) {
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
    
    // Only append prediction section if match doesn't have results yet
    if (!matchData.result) {
      breakdownElement.appendChild(predSection);
    } else {
      breakdownElement.appendChild(predSection);
    }
  }
  
  // Create detailed stats section if the match has results
  if (matchData.result) {
    const statsSection = document.createElement('div');
    
    // Create stats header
    const statsHeader = document.createElement('h3');
    statsHeader.className = 'text-lg font-semibold mb-3 mt-6';
    statsHeader.textContent = 'Detailed Match Statistics';
    
    // Create stats table
    const statsTable = document.createElement('table');
    statsTable.className = 'score-table';
    
    // Add table header
    statsTable.appendChild(createTableHeader());
    
    // Add section header for Auto
    statsTable.appendChild(createSectionHeader('Autonomous Period'));
    
    // Auto leave points
    statsTable.appendChild(createStatsRow('Mobility Points', 
      matchData.result.blue_auto_leave_points, 
      matchData.result.red_auto_leave_points));
    
    // Auto coral number
    statsTable.appendChild(createStatsRow('Auto Coral', 
      matchData.result.blue_auto_coral, 
      matchData.result.red_auto_coral));
    
    // Auto coral points
    statsTable.appendChild(createStatsRow('Auto Coral Points', 
      matchData.result.blue_auto_coral_points, 
      matchData.result.red_auto_coral_points));
    
    // Total auto points
    statsTable.appendChild(createStatsRow('Total Auto Points', 
      matchData.result.blue_auto_points, 
      matchData.result.red_auto_points));
    
    // Add section header for Teleop
    statsTable.appendChild(createSectionHeader('Teleoperated Period'));
    
    // Teleop coral number
    statsTable.appendChild(createStatsRow('Teleop Coral', 
      matchData.result.blue_teleop_coral, 
      matchData.result.red_teleop_coral));
    
    // Teleop coral points
    statsTable.appendChild(createStatsRow('Teleop Coral Points', 
      matchData.result.blue_teleop_coral_points, 
      matchData.result.red_teleop_coral_points));
    
    // Coral by level
    statsTable.appendChild(createStatsRow('L1 Coral', 
      matchData.result.blue_coral_l1, 
      matchData.result.red_coral_l1));
    
    statsTable.appendChild(createStatsRow('L2 Coral', 
      matchData.result.blue_coral_l2, 
      matchData.result.red_coral_l2));
    
    statsTable.appendChild(createStatsRow('L3 Coral', 
      matchData.result.blue_coral_l3, 
      matchData.result.red_coral_l3));
    
    statsTable.appendChild(createStatsRow('L4 Coral', 
      matchData.result.blue_coral_l4, 
      matchData.result.red_coral_l4));
    
    // Total coral points
    statsTable.appendChild(createStatsRow('Total Coral Points', 
      matchData.result.blue_total_coral_points, 
      matchData.result.red_total_coral_points));
    
    // Processor algae
    statsTable.appendChild(createStatsRow('Processor Algae', 
      matchData.result.blue_processor_algae, 
      matchData.result.red_processor_algae));
    
    // Processor algae points
    statsTable.appendChild(createStatsRow('Processor Points', 
      matchData.result.blue_processor_algae_points, 
      matchData.result.red_processor_algae_points));
    
    // Net algae
    statsTable.appendChild(createStatsRow('Net Algae', 
      matchData.result.blue_net_algae, 
      matchData.result.red_net_algae));
    
    // Net algae points
    statsTable.appendChild(createStatsRow('Net Algae Points', 
      matchData.result.blue_net_algae_points, 
      matchData.result.red_net_algae_points));
    
    // Total algae points
    statsTable.appendChild(createStatsRow('Total Algae Points', 
      matchData.result.blue_total_algae_points, 
      matchData.result.red_total_algae_points));
    
    // Add section header for Endgame
    statsTable.appendChild(createSectionHeader('Endgame Period'));
    
    // Barge points
    statsTable.appendChild(createStatsRow('Barge Points', 
      matchData.result.blue_barge_points, 
      matchData.result.red_barge_points));
    
    // Add section header for Totals
    statsTable.appendChild(createSectionHeader('Match Totals'));
    
    // Total game pieces
    statsTable.appendChild(createStatsRow('Game Pieces', 
      matchData.result.blue_total_game_pieces, 
      matchData.result.red_total_game_pieces));
    
    // Total points row with special styling
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    totalRow.innerHTML = `
      <td class="score-category">Total Points</td>
      <td class="blue-value">${matchData.result.blue_score}</td>
      <td class="red-value">${matchData.result.red_score}</td>
    `;
    statsTable.appendChild(totalRow);
    
    // Append stats elements
    statsSection.appendChild(statsHeader);
    statsSection.appendChild(statsTable);
    breakdownElement.appendChild(statsSection);
  }
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