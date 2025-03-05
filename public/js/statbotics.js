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
    enhanceTeamPageWithStatbotics(params.get('team'));
  }
});