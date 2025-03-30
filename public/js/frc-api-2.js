/*
 * FRC API Module 2 - Ranking Tables & Match Display
 * 
 * This file handles functions related to team rankings and match tables.
 * Includes sortable ranking tables, match schedule display, playoff bracket
 * updates, and alliance mapping functions for playoff visualization.
 */

// Helper function to determine winner and apply styling
function getMatchWinnerStyles(match) {
  if (!match.actual_time) return { blueStyle: '', redStyle: '', scoreStyle: '' };
  
  const blueScore = match.alliances.blue.score;
  const redScore = match.alliances.red.score;
  
  if (blueScore > redScore) {
    return {
      blueStyle: 'font-bold',
      redStyle: '',
      scoreStyle: 'font-bold text-blue-400'
    };
  } else if (redScore > blueScore) {
    return {
      blueStyle: '',
      redStyle: 'font-bold',
      scoreStyle: 'font-bold text-red-400'
    };
  }
  return {
    blueStyle: 'font-bold',
    redStyle: 'font-bold',
    scoreStyle: 'font-bold'  // Tie case
  };
}

// Global variable to track current sort state
let rankingsSortConfig = {
  column: 'rank',  // Default sort by rank
  direction: 'asc' // Default to ascending
};

function updateRankingsTable(rankings) {
  const tbody = document.querySelector("#rankings-table tbody");
  const team7790Index = rankings.findIndex(team => team.team_key === 'frc7790');
  
  // First, fetch team names for all teams in the rankings
  const teamKeys = rankings.map(team => team.team_key);
  
  // Function to fetch team names
  async function fetchTeamNames(teamKeys) {
    try {
      // Create a map to store team names
      const teamNames = {};
      
      // Fetch data for each team (could be optimized with a batch API call if available)
      const teamPromises = teamKeys.map(teamKey => 
        fetch(`${window.TBA_BASE_URL}/team/${teamKey}`, {
          headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
        })
        .then(res => res.ok ? res.json() : { nickname: "Unknown" })
        .then(data => {
          teamNames[teamKey] = data.nickname || "Unknown";
        })
        .catch(err => {
          console.error(`Error fetching team name for ${teamKey}:`, err);
          teamNames[teamKey] = "Unknown";
        })
      );
      
      // Wait for all team name fetches to complete
      await Promise.all(teamPromises);
      return teamNames;
    } catch (error) {
      console.error("Error fetching team names:", error);
      return {};
    }
  }
  
  // Show loading state while fetching team names
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="p-4 text-center">
        <div class="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-baywatch-orange mr-2"></div>
        Loading rankings...
      </td>
    </tr>
  `;
  
  // Fetch team names then update the table
  fetchTeamNames(teamKeys).then(teamNames => {
    // Create a sortable array that holds all the data
    const rankingsData = rankings.map((team, index) => {
      const teamNumber = team.team_key.replace('frc', '');
      const teamName = teamNames[team.team_key] || "Unknown";
      return {
        rank: team.rank,
        teamNumber: parseInt(teamNumber),
        teamNumberString: teamNumber,
        teamName: teamName,
        record: team.record,
        recordString: `${team.record.wins}-${team.record.losses}-${team.record.ties}`,
        winPercentage: team.record.wins / (team.record.wins + team.record.losses + team.record.ties) || 0,
        sortOrder: team.sort_orders[0],
        epa: null, // Will be filled by enhanceRankingsWithEPA
        originalIndex: index,
        isTeam7790: teamNumber === '7790'
      };
    });
    
    // Update the table headers to be sortable
    updateSortableHeaders(rankingsData);
    
    // Initially sort by rank (default sorting)
    renderRankingsTable(rankingsData);
  });
}

// Function to update headers with sort functionality
function updateSortableHeaders(rankingsData) {
  const headerRow = document.querySelector('#rankings-table thead tr');
  if (!headerRow) return;
  
  // Clear existing headers
  headerRow.innerHTML = '';
  
  // Define the sortable columns - Always include EPA column since we know it will be added
  const columns = [
    { id: 'rank', text: 'Rank', sortKey: 'rank' },
    { id: 'team', text: 'Team', sortKey: 'teamNumber' },
    { id: 'name', text: 'Name', sortKey: 'teamName' },
    { id: 'record', text: 'Record (W-L-T)', sortKey: 'winPercentage' },
    { id: 'rp', text: 'Ranking Points', sortKey: 'sortOrder' },
    { id: 'epa', text: 'EPA <i class="fas fa-info-circle text-baywatch-orange tooltip-trigger" data-tooltip="EPA data may take a moment to load"></i>', sortKey: 'epa' }
  ];
  
  // Create sortable headers
  columns.forEach(column => {
    const th = document.createElement('th');
    th.className = 'p-4 text-baywatch-orange cursor-pointer select-none';
    th.id = `header-${column.id}`;
    
    // Create header content with sort indicators
    th.innerHTML = `
      <div class="flex items-center">
        ${column.text}
        <span class="sort-indicator ml-1">
          <i class="fas fa-sort text-gray-600"></i>
          <i class="fas fa-sort-up text-baywatch-orange hidden"></i>
          <i class="fas fa-sort-down text-baywatch-orange hidden"></i>
        </span>
      </div>
    `;
    
    // Add click event to sort
    th.addEventListener('click', () => {
      sortRankingsBy(rankingsData, column.sortKey);
    });
    
    headerRow.appendChild(th);
  });
  
  // Set initial sort indicator
  updateSortIndicator(rankingsSortConfig.column, rankingsSortConfig.direction);
  
  // Add custom tooltip functionality for the info icons
  document.querySelectorAll('.tooltip-trigger').forEach(trigger => {
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip opacity-0 invisible absolute z-50 bg-gray-900 text-white text-xs rounded p-2 max-w-xs transition-all duration-200';
    tooltip.textContent = trigger.getAttribute('data-tooltip');
    document.body.appendChild(tooltip);
    
    // Show tooltip on hover
    trigger.addEventListener('mouseenter', (e) => {
      const rect = trigger.getBoundingClientRect();
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
      tooltip.classList.remove('opacity-0', 'invisible');
      tooltip.classList.add('opacity-100', 'visible');
    });
    
    // Hide tooltip when not hovering
    trigger.addEventListener('mouseleave', () => {
      tooltip.classList.remove('opacity-100', 'visible');
      tooltip.classList.add('opacity-0', 'invisible');
    });
  });
}

// Function to update sort indicators in the headers
function updateSortIndicator(column, direction) {
  // First, reset all indicators
  document.querySelectorAll('#rankings-table th .sort-indicator i').forEach(icon => {
    icon.classList.add('hidden');
  });
  
  // Find the correct header based on column
  let headerId;
  switch (column) {
    case 'rank': headerId = 'header-rank'; break;
    case 'teamNumber': headerId = 'header-team'; break;
    case 'teamName': headerId = 'header-name'; break;
    case 'winPercentage': headerId = 'header-record'; break;
    case 'sortOrder': headerId = 'header-rp'; break;
    case 'epa': headerId = 'header-epa'; break;
    default: headerId = 'header-rank';
  }
  
  const header = document.getElementById(headerId);
  if (!header) return;
  
  // Show the appropriate sort direction icon
  const indicator = header.querySelector('.sort-indicator');
  if (direction === 'asc') {
    indicator.querySelector('.fa-sort-up').classList.remove('hidden');
  } else {
    indicator.querySelector('.fa-sort-down').classList.remove('hidden');
  }
}

// Function to sort rankings data by a specific column
function sortRankingsBy(rankingsData, column) {
  // Toggle sort direction if clicking the same column again
  if (rankingsSortConfig.column === column) {
    rankingsSortConfig.direction = rankingsSortConfig.direction === 'asc' ? 'desc' : 'asc';
  } else {
    rankingsSortConfig.column = column;
    
    // Default directions for different columns
    if (column === 'teamName') {
      rankingsSortConfig.direction = 'asc'; // A to Z for names
    } else if (column === 'rank' || column === 'teamNumber') {
      rankingsSortConfig.direction = 'asc'; // Low to high for ranks and team numbers
    } else {
      rankingsSortConfig.direction = 'desc'; // High to low for performance metrics
    }
  }
  
  // Sort the data based on the selected column and direction
  rankingsData.sort((a, b) => {
    let comparison = 0;
    const valueA = a[column];
    const valueB = b[column];
    
    // Handle null/undefined values
    if (valueA === null && valueB === null) return 0;
    if (valueA === null) return 1;
    if (valueB === null) return -1;
    
    // Special handling for teamNumber to ensure correct numerical sorting
    if (column === 'teamNumber') {
      return rankingsSortConfig.direction === 'asc' ? 
        parseInt(a.teamNumberString) - parseInt(b.teamNumberString) : 
        parseInt(b.teamNumberString) - parseInt(a.teamNumberString);
    }
    
    // Compare based on data type
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      comparison = valueA.localeCompare(valueB, undefined, { numeric: true });
    } else {
      comparison = valueA - valueB;
    }
    
    // Apply sort direction
    return rankingsSortConfig.direction === 'asc' ? comparison : -comparison;
  });
  
  // Update the sort indicator
  updateSortIndicator(column, rankingsSortConfig.direction);
  
  // Render the sorted table
  renderRankingsTable(rankingsData);
}

// Function to render the rankings table with sorted data
function renderRankingsTable(rankingsData) {
  const tbody = document.querySelector("#rankings-table tbody");
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Store the updated data globally for EPA enhancement
  window.rankingsData = rankingsData;
  
  // Generate HTML for all rankings
  rankingsData.forEach((team, index) => {
    const isHighlighted = team.isTeam7790;
    const rowClass = isHighlighted ? 'bg-baywatch-orange bg-opacity-20' : '';
    
    // All rows are always visible (removed hiddenClass and hiddenStyle)
    
    const row = document.createElement('tr');
    row.className = `border-t border-gray-700 ${rowClass} transition-all duration-300`;
    
    // Format EPA cell with loading indicator or value
    let epaContent;
    if (team.epa !== null) {
      const epaValue = parseFloat(team.epa);
      epaContent = `
        <span class="font-mono ${
          epaValue > 35 ? 'text-green-400' : 
          epaValue > 25 ? 'text-blue-400' : 
          'text-gray-300'
        }">${epaValue.toFixed(1)}</span>
      `;
    } else {
      epaContent = `<span class="font-mono text-gray-500">...</span>`;
    }
    
    // Get the proper suffix for ranking (1st, 2nd, 3rd, 4th, etc.)
    const rankSuffix = window.formatRankSuffix ? window.formatRankSuffix(team.rank) : 'th';
    
    // Append cells for each column
    row.innerHTML = `
      <td class="p-4">${team.rank}<sup>${rankSuffix}</sup></td>
      <td class="p-4">
        <a href="team.html?team=${team.teamNumberString}" 
           class="text-baywatch-orange hover:text-white transition-colors">
          ${team.teamNumberString}
        </a>
      </td>
      <td class="p-4">
        <span class="text-gray-300">${team.teamName}</span>
      </td>
      <td class="p-4">${team.recordString}</td>
      <td class="p-4">${team.sortOrder.toFixed(2)}</td>
      <td class="p-4 epa-cell">${epaContent}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Removed the "Show All" button code since we're always showing all rankings
}

// Updated function to generate HTML for match schedule with event.html links
function updateScheduleTable(matches) {
  const tbody = document.querySelector("#schedule-table tbody");
  
  const qualMatches = matches
    .filter(match => match.comp_level === 'qm')
    .sort((a, b) => a.match_number - b.match_number);
  
  if (qualMatches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No matches available</td></tr>';
    return;
  }
  
  // Find current match (first unplayed match) for highlighting
  const now = Date.now() / 1000; // current time in seconds
  let currentMatchIndex = qualMatches.findIndex(match => !match.actual_time);
  
  // If all matches have been played, set current to the last match
  if (currentMatchIndex === -1) currentMatchIndex = qualMatches.length - 1;
  
  // Generate HTML for ALL matches - always show all matches
  const allMatchesHtml = qualMatches.map(match => {
    const { blueStyle, redStyle, scoreStyle } = getMatchWinnerStyles(match);
    const blueAlliance = highlightTeam(match.alliances.blue.team_keys.map(t => t.replace('frc', '')).join(', '));
    const redAlliance = highlightTeam(match.alliances.red.team_keys.map(t => t.replace('frc', '')).join(', '));
    const score = match.actual_time ? 
      `${match.alliances.blue.score} - ${match.alliances.red.score}` : 
      'Not Played';
    
    // Extract event code from match key (format: "2025milac_qm1")
    const eventCode = match.key.split('_')[0];
    
    // Highlight current match
    const isCurrentMatch = match.match_number === qualMatches[currentMatchIndex].match_number;
    const rowClass = isCurrentMatch ? 'bg-baywatch-orange bg-opacity-10 current-match' : '';
    
    // Create a link to the match details page
    const matchNumberCell = `
      <td class="p-4">
        <a href="match.html?match=${match.key}" 
           class="flex items-center text-baywatch-orange hover:text-white transition-colors">
          <span>${match.match_number}</span>
          <i class="fas fa-external-link-alt text-xs ml-1"></i>
        </a>
      </td>
    `;
    
    return `
      <tr class="border-t border-gray-700 ${rowClass}">
        ${matchNumberCell}
        <td class="p-4 text-blue-400 ${blueStyle}">${blueAlliance}</td>
        <td class="p-4 text-red-400 ${redStyle}">${redAlliance}</td>
        <td class="p-4 ${scoreStyle}">${score}</td>
      </tr>
    `;
  }).join('');
  
  // Render all matches directly
  tbody.innerHTML = allMatchesHtml;
  
  // No "Show All" button needed since we're always showing all matches
}

// New function to fetch playoff alliances data
async function fetchAllianceData(eventKey) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/event/${eventKey}/alliances`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching alliance data:', error);
    return [];
  }
}

// Store alliance mapping globally to avoid repeated fetching
let allianceMapping = null;

// Helper function to create alliance number mapping
async function buildAllianceMapping(eventKey) {
  if (allianceMapping !== null) return allianceMapping;
  
  const alliances = await fetchAllianceData(eventKey);
  allianceMapping = {};
  
  // Create a mapping of team keys to their alliance numbers
  alliances.forEach((alliance, index) => {
    const allianceNumber = index + 1;
    alliance.picks.forEach(teamKey => {
      allianceMapping[teamKey] = allianceNumber;
    });
  });
  
  return allianceMapping;
}

// Function to get alliance number for a specific team
function getAllianceNumber(teamKey, mapping) {
  return mapping[teamKey] || '?';
}

// Helper function to update a match box - updated to handle TBD for matches that haven't happened
function updateMatchBox(matchBox, match, allianceMapping) {
  const blueAlliance = matchBox.querySelector('.alliance.blue');
  const redAlliance = matchBox.querySelector('.alliance.red');

  // Check if the match has teams assigned yet
  const hasTeams = match.alliances.blue.team_keys.length > 0 && match.alliances.red.team_keys.length > 0;
  
  if (hasTeams) {
    // Get the first team from each alliance to look up the alliance number
    const blueTeamKey = match.alliances.blue.team_keys[0];
    const redTeamKey = match.alliances.red.team_keys[0];
    
    // Look up the alliance numbers
    const blueAllianceNum = getAllianceNumber(blueTeamKey, allianceMapping);
    const redAllianceNum = getAllianceNumber(redTeamKey, allianceMapping);

    // Update teams without alliance numbers in the content area
    const blueTeams = match.alliances.blue.team_keys
      .map(team => team.replace('frc', ''))
      .join(', ');
    const redTeams = match.alliances.red.team_keys
      .map(team => team.replace('frc', ''))
      .join(', ');
      
    // Add alliance number badges above each alliance
    blueAlliance.innerHTML = `
      <div class="alliance-badge blue-badge">Alliance ${blueAllianceNum}</div>
      <span class="teams">${blueTeams}</span>
      <span class="score"></span>
    `;
    
    redAlliance.innerHTML = `
      <div class="alliance-badge red-badge">Alliance ${redAllianceNum}</div>
      <span class="teams">${redTeams}</span>
      <span class="score"></span>
    `;
  } else {
    // Show TBD for matches that don't have teams assigned yet
    blueAlliance.innerHTML = `
      <div class="alliance-badge blue-badge">TBD</div>
      <span class="teams">TBD</span>
      <span class="score"></span>
    `;
    
    redAlliance.innerHTML = `
      <div class="alliance-badge red-badge">TBD</div>
      <span class="teams">TBD</span>
      <span class="score"></span>
    `;
  }

  // Update scores if available
  if (hasTeams && match.alliances.blue.score >= 0) {
    blueAlliance.querySelector('.score').textContent = match.alliances.blue.score;
    redAlliance.querySelector('.score').textContent = match.alliances.red.score;
  } else {
    blueAlliance.querySelector('.score').textContent = '';
    redAlliance.querySelector('.score').textContent = '';
  }

  // Reset and update winner styling
  blueAlliance.classList.remove('winner');
  redAlliance.classList.remove('winner');
  
  if (match.winning_alliance === 'blue') {
    blueAlliance.classList.add('winner');
  } else if (match.winning_alliance === 'red') {
    redAlliance.classList.add('winner');
  }
}