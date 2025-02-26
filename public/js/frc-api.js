// FRC API Configuration
const FRC_TEAM_KEY = "frc7790";
const TBA_AUTH_KEY =
  "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf"; // You'll need to get this from The Blue Alliance

// API Endpoints
const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";

// Fetch current event data - modified for testing
async function getCurrentEventData() {
  try {
    const response = await fetch(`${TBA_BASE_URL}/event/2025milac`, {
      headers: {
        "X-TBA-Auth-Key": TBA_AUTH_KEY,
      },
    });
    const event = await response.json();
    return event;
  } catch (error) {
    console.error("Error fetching event data:", error);
    return null;
  }
}

// New function to calculate the next event automatically
async function getNextEvent() {
  try {
    const response = await fetch(
      `${TBA_BASE_URL}/team/${FRC_TEAM_KEY}/events/simple`,
      {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY },
      }
    );
    const events = await response.json();
    const now = new Date();
    // Filter for upcoming or currently ongoing events
    const upcoming = events.filter((event) => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      return start >= now || (start < now && end > now);
    });
    upcoming.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    return upcoming[0];
  } catch (error) {
    console.error("Error fetching next event:", error);
    return null;
  }
}

// Update UI elements with loading state
function setLoadingState(isLoading) {
  const loadingElements = {
    ranking: {
      number: document.getElementById("ranking-number"),
      total: document.getElementById("total-teams"),
    },
    record: {
      wins: document.getElementById("wins"),
      losses: document.getElementById("losses"),
    },
    nextMatch: {
      number: document.getElementById("match-number"),
      time: document.getElementById("match-time"),
      blue: document.getElementById("blue-alliance"),
      red: document.getElementById("red-alliance"),
    },
  };

  if (isLoading) {
    loadingElements.ranking.number.textContent = "...";
    loadingElements.ranking.total.textContent = "Fetching data...";
    loadingElements.record.wins.textContent = "...";
    loadingElements.record.losses.textContent = "...";
    loadingElements.nextMatch.number.textContent = "Loading...";
    loadingElements.nextMatch.time.textContent = "Fetching schedule...";
    loadingElements.nextMatch.blue.textContent = "Loading alliance...";
    loadingElements.nextMatch.red.textContent = "Loading alliance...";
  }
}

// Handle errors gracefully
function setErrorState(element, message = "No data available") {
  const el = document.getElementById(element);
  if (el) {
    el.textContent = message;
  }
}

// Update rankings display with better error handling
async function updateRankings(eventKey) {
  try {
    const response = await fetch(`${TBA_BASE_URL}/event/${eventKey}/rankings`, {
      headers: {
        "X-TBA-Auth-Key": TBA_AUTH_KEY,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch rankings");

    const rankings = await response.json();
    const teamRanking = rankings.rankings.find(
      (r) => r.team_key === FRC_TEAM_KEY
    );

    if (teamRanking) {
      const rankingEl = document.getElementById("ranking-number");
      rankingEl.textContent = teamRanking.rank;
      rankingEl.setAttribute("data-target", teamRanking.rank);
      // Re-trigger counter animation
      runCounter(rankingEl);
      document.getElementById(
        "total-teams"
      ).textContent = `of ${rankings.rankings.length} teams`;
    } else {
      setErrorState("ranking-number", "--");
      setErrorState("total-teams", "Not currently ranked");
    }
  } catch (error) {
    console.error("Error fetching rankings:", error);
    setErrorState("ranking-number", "--");
    setErrorState("total-teams", "Rankings unavailable");
  }
}

// Update match record
async function updateRecord(eventKey) {
  try {
    const response = await fetch(
      `${TBA_BASE_URL}/team/${FRC_TEAM_KEY}/event/${eventKey}/matches`,
      {
        headers: {
          "X-TBA-Auth-Key": TBA_AUTH_KEY,
        },
      }
    );
    const matches = await response.json();

    let wins = 0;
    let losses = 0;

    matches.forEach((match) => {
      if (match.winning_alliance) {
        const isBlue = match.alliances.blue.team_keys.includes(FRC_TEAM_KEY);
        const isWinner =
          (isBlue && match.winning_alliance === "blue") ||
          (!isBlue && match.winning_alliance === "red");
        if (isWinner) wins++;
        else losses++;
      }
    });

    const winsEl = document.getElementById("wins");
    const lossesEl = document.getElementById("losses");
    winsEl.setAttribute("data-target", wins);
    lossesEl.setAttribute("data-target", losses);
    // Re-trigger counter animation
    runCounter(winsEl);
    runCounter(lossesEl);
  } catch (error) {
    console.error("Error fetching match record:", error);
  }
}

// Update next match with better error handling
async function updateNextMatch(eventKey) {
  try {
    const response = await fetch(
      `${TBA_BASE_URL}/team/${FRC_TEAM_KEY}/event/${eventKey}/matches`,
      {
        headers: {
          "X-TBA-Auth-Key": TBA_AUTH_KEY,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch matches");

    const matches = await response.json();
    const nextMatch = matches.find(
      (match) => !match.actual_time && match.predicted_time
    );

    if (nextMatch) {
      document.getElementById(
        "match-number"
      ).textContent = `Match ${nextMatch.match_number}`;

      const matchTime = new Date(nextMatch.predicted_time * 1000);
      document.getElementById("match-time").textContent =
        matchTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

      const blueAlliance = nextMatch.alliances.blue.team_keys
        .map((team) => team.replace("frc", ""))
        .join(", ");
      const redAlliance = nextMatch.alliances.red.team_keys
        .map((team) => team.replace("frc", ""))
        .join(", ");

      document.getElementById("blue-alliance").textContent = blueAlliance;
      document.getElementById("red-alliance").textContent = redAlliance;
    } else {
      document.getElementById("match-number").textContent =
        "No upcoming matches";
      document.getElementById("match-time").textContent = "--:--";
      document.getElementById("blue-alliance").textContent = "TBD";
      document.getElementById("red-alliance").textContent = "TBD";
    }
  } catch (error) {
    console.error("Error fetching next match:", error);
    setErrorState("match-number", "Match data unavailable");
    setErrorState("match-time", "--:--");
    setErrorState("blue-alliance", "TBD");
    setErrorState("red-alliance", "TBD");
  }
}

// Add countdown functionality
function updateCountdown(startDate) {
  const now = new Date().getTime();
  const eventStart = new Date(startDate).getTime();
  const timeLeft = eventStart - now;

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  // Update UI with countdown
  document.getElementById("ranking-number").textContent = days;
  document.getElementById("total-teams").textContent = "Days until event";

  document.getElementById("wins").textContent = hours;
  document.getElementById("losses").textContent = minutes;

  // Update labels
  document.querySelector('[for="wins"]').textContent = "Hours";
  document.querySelector('[for="losses"]').textContent = "Minutes";

  // Update next match section
  document.getElementById("match-number").textContent = "Event Starting Soon";
  document.getElementById("match-time").textContent = new Date(
    startDate
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  document.getElementById("blue-alliance").textContent = "At";
  document.getElementById("red-alliance").textContent = new Date(
    startDate
  ).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// New function for event countdown
function updateEventCountdown(startDate) {
  const now = new Date().getTime();
  const eventStart = new Date(startDate).getTime();
  let timeLeft = eventStart - now;
  if (timeLeft < 0) timeLeft = 0;

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  document.getElementById(
    "countdown-timer"
  ).textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Initialize and update all data with loading states
async function initializeEventData() {
  setLoadingState(true);
  const OFFSET_MS = 37 * 3600 * 1000; // 37 hour offset

  try {
    // Use calculated next event instead of a hardcoded one
    const currentEvent = await getNextEvent();
    if (currentEvent) {
      const now = new Date();
      const adjustedEventStart = new Date(
        new Date(currentEvent.start_date).getTime() + OFFSET_MS
      );
      const adjustedEventEnd = new Date(
        new Date(currentEvent.end_date).getTime() + OFFSET_MS
      );

      if (now < adjustedEventStart || now > adjustedEventEnd) {
        document.getElementById("live-updates").classList.add("hidden");
        document.getElementById("countdown-section").classList.remove("hidden");

        const targetDate =
          now < adjustedEventStart ? adjustedEventStart : adjustedEventEnd;
        updateEventCountdown(targetDate);
        setInterval(() => {
          updateEventCountdown(targetDate);
        }, 1000);
      } else {
        document.getElementById("live-updates").classList.remove("hidden");
        document.getElementById("countdown-section").classList.add("hidden");

        await Promise.all([
          updateRankings(currentEvent.key),
          updateRecord(currentEvent.key),
          updateNextMatch(currentEvent.key),
        ]);

        setInterval(() => {
          updateRankings(currentEvent.key);
          updateRecord(currentEvent.key);
          updateNextMatch(currentEvent.key);
        }, 300000);
      }
    } else {
      setErrorState("ranking-number", "No upcoming event");
      setErrorState("total-teams", "Check back later");
    }
  } catch (error) {
    console.error("Error initializing data:", error);
    setErrorState("ranking-number", "Error loading data");
  }
}

// Start updates when document is loaded
document.addEventListener("DOMContentLoaded", initializeEventData);

// Functions for Lake City Regional page
async function loadEventRankings() {
  try {
    const response = await fetch(`${TBA_BASE_URL}/event/2025milac/rankings`, {
      headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
    });
    const data = await response.json();
    updateRankingsTable(data.rankings);
  } catch (error) {
    console.error("Error loading rankings:", error);
    document.querySelector("#rankings-table tbody").innerHTML = 
      '<tr><td colspan="4" class="p-4 text-center">No Rankings Available</td></tr>';
  }
}

async function loadEventSchedule() {
  try {
    const response = await fetch(`${TBA_BASE_URL}/event/2025milac/matches`, {
      headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
    });
    const matches = await response.json();
    updateScheduleTable(matches);
  } catch (error) {
    console.error("Error loading schedule:", error);
    document.querySelector("#schedule-table tbody").innerHTML = 
      '<tr><td colspan="5" class="p-4 text-center text-red-400">Error loading schedule</td></tr>';
  }
}

function highlightTeam(text, teamNumber = '7790') {
  return text.replace(
    teamNumber,
    `<span class="text-baywatch-orange font-bold">${teamNumber}</span>`
  );
}

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

function updateRankingsTable(rankings) {
  const tbody = document.querySelector("#rankings-table tbody");
  const team7790Index = rankings.findIndex(team => team.team_key === 'frc7790');
  
  // Generate HTML for all rankings
  const allRowsHtml = rankings.map((team, index) => {
    const teamNumber = team.team_key.replace('frc', '');
    const isHighlighted = teamNumber === '7790';
    const rowClass = isHighlighted ? 'bg-baywatch-orange bg-opacity-20' : '';
    const hiddenClass = index >= 10 ? 'ranking-hidden hidden' : '';
    const hiddenStyle = index >= 10 ? 'max-height: 0; opacity: 0;' : '';
    
    return `
      <tr class="border-t border-gray-700 ${rowClass} ${hiddenClass} transition-all duration-300" style="${hiddenStyle}">
        <td class="p-4">${team.rank}</td>
        <td class="p-4">${teamNumber}</td>
        <td class="p-4">${team.record.wins}-${team.record.losses}-${team.record.ties}</td>
        <td class="p-4">${team.sort_orders[0].toFixed(2)}</td>
      </tr>
    `;
  }).join('');
  
  // Update the table with all rows
  tbody.innerHTML = allRowsHtml;
  
  // Add special handling for Team 7790 when not in top 10
  if (team7790Index >= 10) {
    // Find our team's row
    const team7790Row = tbody.querySelectorAll('tr')[team7790Index];
    if (team7790Row) {
      // Make the row visible
      team7790Row.classList.remove('hidden', 'ranking-hidden');
      team7790Row.style.maxHeight = '50px';
      team7790Row.style.opacity = '1';
      
      // Add separator line before Team 7790 row if it's not the first hidden row
      if (team7790Index > 10) {
        const separatorRow = document.createElement('tr');
        separatorRow.className = 'team-7790-separator';
        separatorRow.innerHTML = `
          <td colspan="4" class="py-2">
            <div class="border-t-2 border-dashed border-baywatch-orange border-opacity-30 relative">
            </div>
          </td>
        `;
        team7790Row.parentNode.insertBefore(separatorRow, team7790Row);
      }
    }
  }
  
  // Add "Show All" button after the table if it doesn't exist yet
  if (!document.getElementById('show-all-rankings')) {
    const tableContainer = document.querySelector('#rankings-table').parentNode;
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'text-center mt-4';
    buttonContainer.innerHTML = `
      <button id="show-all-rankings" class="px-6 py-2 bg-baywatch-orange bg-opacity-20 rounded-lg 
        hover:bg-opacity-40 transition-all duration-300 text-baywatch-orange">
        <span class="show-text">Show All Rankings</span>
        <span class="hide-text hidden">Hide Rankings</span>
        <i class="fas fa-chevron-down ml-2 show-icon"></i>
        <i class="fas fa-chevron-up ml-2 hide-icon hidden"></i>
      </button>
    `;
    tableContainer.appendChild(buttonContainer);
    
    // Add event listener to the button
    document.getElementById('show-all-rankings').addEventListener('click', toggleRankings);
  }
}

// Function to toggle all rankings visibility
function toggleRankings() {
  const hiddenRows = document.querySelectorAll('.ranking-hidden');
  const separator = document.querySelector('.team-7790-separator');
  const button = document.getElementById('show-all-rankings');
  const showText = button.querySelector('.show-text');
  const hideText = button.querySelector('.hide-text');
  const showIcon = button.querySelector('.show-icon');
  const hideIcon = button.querySelector('.hide-icon');
  
  const isExpanded = !hiddenRows[0]?.classList.contains('hidden');
  
  // Toggle visibility of rows with animation
  hiddenRows.forEach(row => {
    if (isExpanded) {
      // Collapse
      row.classList.add('hidden');
      row.style.maxHeight = '0';
      row.style.opacity = '0';
    } else {
      // Expand
      row.classList.remove('hidden');
      row.style.maxHeight = '50px'; // Adjust based on row height
      row.style.opacity = '1';
    }
  });
  
  // Handle the separator specially
  if (separator) {
    if (isExpanded) {
      separator.style.display = 'table-row'; // Keep it visible when collapsing
    } else {
      separator.style.display = 'none'; // Hide when expanding all
    }
  }
  
  // Update button text and icon
  showText.classList.toggle('hidden');
  hideText.classList.toggle('hidden');
  showIcon.classList.toggle('hidden');
  hideIcon.classList.toggle('hidden');
}

function updateScheduleTable(matches) {
  const tbody = document.querySelector("#schedule-table tbody");
  
  const qualMatches = matches
    .filter(match => match.comp_level === 'qm')
    .sort((a, b) => a.match_number - b.match_number);
  
  if (qualMatches.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">No matches available</td></tr>';
    return;
  }
  
  // Find current match (first unplayed match)
  const now = Date.now() / 1000; // current time in seconds
  let currentMatchIndex = qualMatches.findIndex(match => !match.actual_time);
  
  // If all matches have been played, set current to the last match
  if (currentMatchIndex === -1) currentMatchIndex = qualMatches.length - 1;
  
  // Determine range of matches to display
  const totalToShow = 11; // 5 before + current + 5 after
  let startIndex = Math.max(0, currentMatchIndex - 5);
  let endIndex = Math.min(qualMatches.length - 1, currentMatchIndex + 5);
  
  // If we don't have 5 matches before, show more after
  if (currentMatchIndex < 5) {
    endIndex = Math.min(qualMatches.length - 1, startIndex + totalToShow - 1);
  }
  
  // If we don't have 5 matches after, show more before
  if (qualMatches.length - currentMatchIndex - 1 < 5) {
    startIndex = Math.max(0, endIndex - totalToShow + 1);
  }
  
  // Slice the matches we want to display
  const displayMatches = qualMatches.slice(startIndex, endIndex + 1);
  
  // Generate HTML for visible matches
  const visibleMatchesHtml = displayMatches.map(match => {
    const { blueStyle, redStyle, scoreStyle } = getMatchWinnerStyles(match);
    const blueAlliance = highlightTeam(match.alliances.blue.team_keys.map(t => t.replace('frc', '')).join(', '));
    const redAlliance = highlightTeam(match.alliances.red.team_keys.map(t => t.replace('frc', '')).join(', '));
    const score = match.actual_time ? 
      `${match.alliances.blue.score} - ${match.alliances.red.score}` : 
      'Not Played';
    
    // Highlight current match
    const isCurrentMatch = match.match_number === qualMatches[currentMatchIndex].match_number;
    const rowClass = isCurrentMatch ? 'bg-baywatch-orange bg-opacity-10 current-match' : '';
    
    return `
      <tr class="border-t border-gray-700 ${rowClass}">
        <td class="p-4">${match.match_number}</td>
        <td class="p-4 text-blue-400 ${blueStyle}">${blueAlliance}</td>
        <td class="p-4 text-red-400 ${redStyle}">${redAlliance}</td>
        <td class="p-4 ${scoreStyle}">${score}</td>
      </tr>
    `;
  }).join('');

  // Generate HTML for total table with show more button
  const totalMatchCount = qualMatches.length;
  const visibleMatchCount = displayMatches.length;
  
  tbody.innerHTML = visibleMatchesHtml;
  
  // Add "Show All Matches" button after the table if it doesn't exist yet
  if (!document.getElementById('show-all-matches') && totalMatchCount > visibleMatchCount) {
    const tableContainer = document.querySelector('#schedule-table').parentNode;
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'text-center mt-4';
    buttonContainer.innerHTML = `
      <button id="show-all-matches" class="px-6 py-2 bg-baywatch-orange bg-opacity-20 rounded-lg 
        hover:bg-opacity-40 transition-all duration-300 text-baywatch-orange">
        <span class="show-text">Show All Matches</span>
        <span class="hide-text hidden">Show Fewer Matches</span>
        <i class="fas fa-chevron-down ml-2 show-icon"></i>
        <i class="fas fa-chevron-up ml-2 hide-icon hidden"></i>
      </button>
    `;
    tableContainer.appendChild(buttonContainer);
    
    // Add event listener to the button
    document.getElementById('show-all-matches').addEventListener('click', function() {
      toggleAllMatches(qualMatches, currentMatchIndex);
    });
  }
}

// Function to toggle between limited and all matches
function toggleAllMatches(qualMatches, currentMatchIndex) {
  const button = document.getElementById('show-all-matches');
  const showText = button.querySelector('.show-text');
  const hideText = button.querySelector('.hide-text');
  const showIcon = button.querySelector('.show-icon');
  const hideIcon = button.querySelector('.hide-icon');
  
  const isShowingAll = showText.classList.contains('hidden');
  const tbody = document.querySelector("#schedule-table tbody");
  
  if (isShowingAll) {
    // Switch back to limited view
    updateScheduleTable(qualMatches); // This will redraw the limited view
  } else {
    // Show all matches
    const allMatchesHtml = qualMatches.map(match => {
      const { blueStyle, redStyle, scoreStyle } = getMatchWinnerStyles(match);
      const blueAlliance = highlightTeam(match.alliances.blue.team_keys.map(t => t.replace('frc', '')).join(', '));
      const redAlliance = highlightTeam(match.alliances.red.team_keys.map(t => t.replace('frc', '')).join(', '));
      const score = match.actual_time ? 
        `${match.alliances.blue.score} - ${match.alliances.red.score}` : 
        'Not Played';
      
      // Highlight current match
      const isCurrentMatch = match.match_number === qualMatches[currentMatchIndex].match_number;
      const rowClass = isCurrentMatch ? 'bg-baywatch-orange bg-opacity-10 current-match' : '';
      
      return `
        <tr class="border-t border-gray-700 ${rowClass} animate-fade-in" style="animation-duration: 0.5s">
          <td class="p-4">${match.match_number}</td>
          <td class="p-4 text-blue-400 ${blueStyle}">${blueAlliance}</td>
          <td class="p-4 text-red-400 ${redStyle}">${redAlliance}</td>
          <td class="p-4 ${scoreStyle}">${score}</td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = allMatchesHtml;
  }
  
  // Toggle button text/icon
  showText.classList.toggle('hidden');
  hideText.classList.toggle('hidden');
  showIcon.classList.toggle('hidden');
  hideIcon.classList.toggle('hidden');
}

// New function to fetch playoff alliances data
async function fetchAllianceData(eventKey) {
  try {
    const response = await fetch(`${TBA_BASE_URL}/event/${eventKey}/alliances`, {
      headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
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

// Function to update playoff bracket
async function updatePlayoffBracket(eventKey) {
  try {
    // First, initialize all bracket positions with placeholder TBD matches
    // This ensures the bracket displays properly even before data loads
    initializeBracketWithPlaceholders();
    
    // Fetch alliance data first to build the mapping
    const allianceMap = await buildAllianceMapping(eventKey);
    
    // Then fetch match data
    const response = await fetch(`${TBA_BASE_URL}/event/${eventKey}/matches`, {
      headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
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
        }
      });

      // Process finals matches
      const finalMatches = playoffMatches.filter(match => match.comp_level === 'f');
      finalMatches.forEach(match => {
        const matchId = `match-f${match.match_number}`;
        const matchBox = document.getElementById(matchId);
        if (matchBox) {
          updateMatchBox(matchBox, match, allianceMap);
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
  loadEventRankings();
  loadEventSchedule();
  updatePlayoffBracket('2025milac');
  
  // Optional: Add periodic updates
  setInterval(() => {
    updatePlayoffBracket('2025milac');
  }, 30000); // Update every 30 seconds
}
