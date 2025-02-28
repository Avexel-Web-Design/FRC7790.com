// FRC API Configuration - Check if constants are already defined (from search.js)
if (typeof TBA_AUTH_KEY === 'undefined') {
  const TBA_AUTH_KEY =
    "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";
}

if (typeof TBA_BASE_URL === 'undefined') {
  const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";
}

// Use window-scoped variables to ensure consistent access across modules
window.TBA_AUTH_KEY = window.TBA_AUTH_KEY || "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";
window.TBA_BASE_URL = window.TBA_BASE_URL || "https://www.thebluealliance.com/api/v3";
window.FRC_TEAM_KEY = window.FRC_TEAM_KEY || "frc7790"; // Add team key definition

// Constant for the 37-hour offset (in milliseconds)
const OFFSET_MS = 37 * 3600 * 1000; // 37 hour offset

// Fetch event data by event code
async function fetchEventData(eventCode) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}`, {
      headers: {
        "X-TBA-Auth-Key": window.TBA_AUTH_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching event: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching event data:", error);
    return null;
  }
}

// Helper function to format event dates
function formatEventDate(startDate, endDate) {
  if (!startDate) return "Date TBD";
  
  try {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const start = new Date(startDate).toLocaleDateString('en-US', options);
    
    if (!endDate) return start;
    
    const end = new Date(endDate).toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  } catch (e) {
    return startDate;
  }
}

// New function to calculate the next event automatically
async function getNextEvent() {
  try {
    const response = await fetch(
      `${window.TBA_BASE_URL}/team/${window.FRC_TEAM_KEY}/events/simple`,
      {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const events = await response.json();
    const now = new Date();
    
    // Filter for upcoming or currently ongoing events
    const upcoming = events.filter((event) => {
      const eventEnd = new Date(event.end_date);
      eventEnd.setDate(eventEnd.getDate() + 1); // Include the end day
      return eventEnd >= now;
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

  if (isLoading && loadingElements.ranking.number) {
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

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const rankings = await response.json();
    const teamRanking = rankings.rankings.find(
      (r) => r.team_key === window.FRC_TEAM_KEY
    );

    if (teamRanking) {
      const rankingNumber = document.getElementById("ranking-number");
      const totalTeams = document.getElementById("total-teams");
      
      if (rankingNumber && totalTeams) {
        rankingNumber.textContent = teamRanking.rank;
        totalTeams.textContent = `of ${rankings.rankings.length} teams`;
      }
    } else {
      setErrorState("ranking-number", "--");
      setErrorState("total-teams", "Not ranked yet");
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
      `${window.TBA_BASE_URL}/team/${window.FRC_TEAM_KEY}/event/${eventKey}/matches`,
      {
        headers: {
          "X-TBA-Auth-Key": window.TBA_AUTH_KEY,
        },
      }
    );
    const matches = await response.json();

    let wins = 0;
    let losses = 0;

    matches.forEach((match) => {
      if (match.winning_alliance && match.actual_time) {
        const blueTeams = match.alliances.blue.team_keys;
        const redTeams = match.alliances.red.team_keys;
        
        const isOnBlue = blueTeams.includes(window.FRC_TEAM_KEY);
        const isOnRed = redTeams.includes(window.FRC_TEAM_KEY);
        
        if ((isOnBlue && match.winning_alliance === "blue") || 
            (isOnRed && match.winning_alliance === "red")) {
          wins++;
        } else if ((isOnBlue || isOnRed) && match.winning_alliance !== "") {
          losses++;
        }
      }
    });

    const winsEl = document.getElementById("wins");
    const lossesEl = document.getElementById("losses");
    
    if (winsEl && lossesEl) {
      winsEl.setAttribute("data-target", wins);
      lossesEl.setAttribute("data-target", losses);
      // Re-trigger counter animation
      runCounter(winsEl);
      runCounter(lossesEl);
    }
  } catch (error) {
    console.error("Error fetching match record:", error);
  }
}

// Update next match with better error handling
async function updateNextMatch(eventKey) {
  try {
    const response = await fetch(
      `${window.TBA_BASE_URL}/team/${window.FRC_TEAM_KEY}/event/${eventKey}/matches`,
      {
        headers: {
          "X-TBA-Auth-Key": window.TBA_AUTH_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const matches = await response.json();
    const nextMatch = matches.find(
      (match) => !match.actual_time && match.predicted_time
    );

    if (nextMatch) {
      // Format match number
      const matchNumEl = document.getElementById("match-number");
      if (matchNumEl) {
        matchNumEl.textContent = `Match ${nextMatch.match_number}`;
      }
      
      // Format match time
      const matchTimeEl = document.getElementById("match-time");
      if (matchTimeEl) {
        const matchTime = new Date(nextMatch.predicted_time * 1000);
        matchTimeEl.textContent = matchTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
      }

      // Display alliance partners
      const blueAllianceEl = document.getElementById("blue-alliance");
      const redAllianceEl = document.getElementById("red-alliance");
      
      if (blueAllianceEl && redAllianceEl) {
        const blueTeams = nextMatch.alliances.blue.team_keys;
        const redTeams = nextMatch.alliances.red.team_keys;
        
        if (blueTeams.includes(window.FRC_TEAM_KEY)) {
          blueAllianceEl.textContent = "Our Alliance";
          blueAllianceEl.classList.add("font-bold");
          redAllianceEl.textContent = "Opponent Alliance";
        } else if (redTeams.includes(window.FRC_TEAM_KEY)) {
          redAllianceEl.textContent = "Our Alliance";
          redAllianceEl.classList.add("font-bold");
          blueAllianceEl.textContent = "Opponent Alliance";
        } else {
          blueAllianceEl.textContent = "Blue Alliance";
          redAllianceEl.textContent = "Red Alliance";
        }
      }
    } else {
      // No upcoming matches
      setErrorState("match-number", "No scheduled matches");
      setErrorState("match-time", "--:--");
      setErrorState("blue-alliance", "TBD");
      setErrorState("red-alliance", "TBD");
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
  const rankingNumberEl = document.getElementById("ranking-number");
  const totalTeamsEl = document.getElementById("total-teams");
  const winsEl = document.getElementById("wins");
  const lossesEl = document.getElementById("losses");
  
  if (rankingNumberEl) rankingNumberEl.textContent = days;
  if (totalTeamsEl) totalTeamsEl.textContent = "Days until event";
  if (winsEl) winsEl.textContent = hours;
  if (lossesEl) lossesEl.textContent = minutes;

  // Update labels
  const winsLabelEl = document.querySelector('[for="wins"]');
  const lossesLabelEl = document.querySelector('[for="losses"]');
  
  if (winsLabelEl) winsLabelEl.textContent = "Hours";
  if (lossesLabelEl) lossesLabelEl.textContent = "Minutes";

  // Update next match section
  const matchNumberEl = document.getElementById("match-number");
  const matchTimeEl = document.getElementById("match-time");
  const blueAllianceEl = document.getElementById("blue-alliance");
  const redAllianceEl = document.getElementById("red-alliance");
  
  if (matchNumberEl) matchNumberEl.textContent = "Event Starting Soon";
  if (matchTimeEl) {
    matchTimeEl.textContent = new Date(
      startDate
    ).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }
  if (blueAllianceEl) blueAllianceEl.textContent = "At";
  if (redAllianceEl) {
    redAllianceEl.textContent = new Date(
      startDate
    ).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

// New function for event countdown - Updated to add 37-hour offset
function updateEventCountdown(startDate) {
  const now = new Date().getTime();
  // Add the 37-hour offset to the TBA start date to get the actual start time
  const eventStart = new Date(startDate).getTime() + OFFSET_MS;
  let timeLeft = eventStart - now;
  if (timeLeft < 0) timeLeft = 0;

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const countdownEl = document.getElementById("countdown-timer");
  if (countdownEl) {
    countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}

// Initialize and update all data with loading states
async function initializeEventData() {
  setLoadingState(true);
  console.log("Initializing event data...");

  try {
    // Use calculated next event instead of a hardcoded one
    console.log("Fetching next event with team key:", window.FRC_TEAM_KEY);
    const currentEvent = await getNextEvent();
    console.log("Next event data:", currentEvent);
    
    if (currentEvent) {
      const currentDate = new Date().getTime();
      const eventStart = new Date(currentEvent.start_date).getTime();
      const eventEnd = new Date(currentEvent.end_date).getTime() + OFFSET_MS;
      
      // Add offset to event start date for comparison
      const actualEventStart = eventStart + OFFSET_MS;

      // Check against actual start time (with offset) for determining if the event has started
      if (currentDate >= actualEventStart && currentDate <= eventEnd) {
        // We're currently at an event - show live data
        const eventKey = currentEvent.key;
        document.getElementById("countdown-section").classList.add("hidden");
        document.getElementById("live-updates").classList.remove("hidden");
        updateRankings(eventKey);
        updateRecord(eventKey);
        updateNextMatch(eventKey);
      } else if (currentDate < actualEventStart) {
        // We're before the actual start time - show countdown
        document.getElementById("countdown-section").classList.remove("hidden");
        document.getElementById("live-updates").classList.add("hidden");
        // Pass the original TBA date - the function will add the offset
        updateEventCountdown(currentEvent.start_date);
        setInterval(() => updateEventCountdown(currentEvent.start_date), 1000);
      }
    } else {
      console.error("No upcoming events found");
      setErrorState("ranking-number", "No upcoming event");
      setErrorState("total-teams", "Check back later");
      
      // Use a hard-coded date for Lake City event as fallback
      const fallbackDate = "2025-04-03";
      console.log("Using fallback date:", fallbackDate);
      
      document.getElementById("countdown-section").classList.remove("hidden");
      document.getElementById("live-updates").classList.add("hidden");
      updateEventCountdown(fallbackDate);
      setInterval(() => updateEventCountdown(fallbackDate), 1000);
    }
  } catch (error) {
    console.error("Error initializing data:", error);
    setErrorState("ranking-number", "Error loading data");
    
    // Use a hard-coded date for Lake City event as fallback
    const fallbackDate = "2025-04-03";
    console.log("Using fallback date due to error:", fallbackDate);
    
    document.getElementById("countdown-section").classList.remove("hidden");
    document.getElementById("live-updates").classList.add("hidden");
    updateEventCountdown(fallbackDate);
    setInterval(() => updateEventCountdown(fallbackDate), 1000);
  }
}

// Start updates when document is loaded
document.addEventListener("DOMContentLoaded", initializeEventData);

// Functions for Lake City Regional page
async function loadEventRankings(eventCode) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/rankings`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    const data = await response.json();
    updateRankingsTable(data.rankings);
  } catch (error) {
    console.error(`Error loading rankings for ${eventCode}:`, error);
    document.querySelector("#rankings-table tbody").innerHTML = 
      '<tr><td colspan="4" class="p-4 text-center">No Rankings Available</td></tr>';
  }
}

async function loadEventSchedule(eventCode) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/matches`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    const matches = await response.json();
    updateScheduleTable(matches);
  } catch (error) {
    console.error(`Error loading schedule for ${eventCode}:`, error);
    document.querySelector("#schedule-table tbody").innerHTML = 
      '<tr><td colspan="5" class="p-4 text-center text-red-400">Error loading schedule</td></tr>';
  }
}

function highlightTeam(text, teamNumber = '7790') {
  const teams = text.split(', ');
  return teams.map(team => {
    const isTeam7790 = team === teamNumber;
    return `<a href="team.html?team=${team}" 
              class="transition-colors ${isTeam7790 ? 'text-baywatch-orange hover:text-white' : 'hover:text-baywatch-orange'}">${team}</a>`;
  }).join(', ');
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
        <td class="p-4">
          <a href="team.html?team=${teamNumber}" 
             class="text-baywatch-orange hover:text-white transition-colors">
            ${teamNumber}
          </a>
        </td>
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
  
  // Generate HTML for visible matches - UPDATED to use event.html instead of match-specific HTML files
  const visibleMatchesHtml = displayMatches.map(match => {
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

// Function to toggle between limited and all matches (updated for event.html links)
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
    updateScheduleTable(qualMatches); // This will redraw the limited view with links
  } else {
    // Show all matches WITH LINKS
    const allMatchesHtml = qualMatches.map(match => {
      const { blueStyle, redStyle, scoreStyle } = getMatchWinnerStyles(match);
      const blueAlliance = highlightTeam(match.alliances.blue.team_keys.map(t => t.replace('frc', '')).join(', '));
      const redAlliance = highlightTeam(match.alliances.red.team_keys.map(t => t.replace('frc', '')).join(', '));
      const score = match.actual_time ? 
        `${match.alliances.blue.score} - ${match.alliances.red.score}` : 
        'Not Played';
      
      // Extract event code from match key
      const eventCode = match.key.split('_')[0];
      
      // Highlight current match
      const isCurrentMatch = match.match_number === qualMatches[currentMatchIndex].match_number;
      const rowClass = isCurrentMatch ? 'bg-baywatch-orange bg-opacity-10 current-match' : '';
      
      // Add link to match details
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
        <tr class="border-t border-gray-700 ${rowClass} animate-fade-in" style="animation-duration: 0.5s">
          ${matchNumberCell}
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

// Update match time and status display
function updateMatchTimeAndStatus(matchData) {
  const timeElement = document.getElementById('match-time');
  const statusElement = document.getElementById('match-status');
  
  // Determine match time to display
  let timeDisplay = 'Time unavailable';
  let statusDisplay = 'Unknown status';
  
  // Add playoff-specific status information
  let isPlayoff = matchData.comp_level !== 'qm';
  
  if (matchData.actual_time) {
    // Match is completed, show when it was played
    const matchDate = new Date(matchData.actual_time * 1000);
    timeDisplay = matchDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    statusDisplay = isPlayoff ? 'Playoff match completed' : 'Match completed';
    statusElement.classList.add('bg-green-800');
  } 
  else if (matchData.predicted_time) {
    // Match has a predicted start time
    const matchDate = new Date(matchData.predicted_time * 1000);
    timeDisplay = matchDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const now = new Date();
    if (matchDate > now) {
      statusDisplay = isPlayoff ? 'Playoff match scheduled' : 'Scheduled';
      statusElement.classList.add('bg-blue-800');
    } else {
      statusDisplay = isPlayoff ? 'Playoff match in progress' : 'In progress / recently played';
      statusElement.classList.add('bg-yellow-800');
    }
  }
  
  timeElement.innerHTML = `<i class="far fa-clock mr-1"></i> ${timeDisplay}`;
  statusElement.innerHTML = `<i class="fas fa-circle-info mr-1"></i> ${statusDisplay}`;
}

// Update alliance and score info
function updateMatchScores(matchData, teamData) {
  const blueTeams = document.getElementById('blue-teams');
  const redTeams = document.getElementById('red-teams');
  const blueScore = document.getElementById('blue-score');
  const redScore = document.getElementById('red-score');
  const resultBanner = document.getElementById('match-result-banner');
  
  // Create a map of team keys to team data for quick lookup
  const teamMap = {};
  teamData.forEach(team => {
    teamMap[team.key] = team;
  });
  
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

// Update match breakdown section with more detailed statistics
function updateMatchBreakdown(matchData) {
  const breakdownElement = document.getElementById('match-breakdown');
  
  // Check if breakdown data is available
  if (!matchData.score_breakdown || !matchData.alliances.blue.score) {
    breakdownElement.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-chart-simple text-gray-600 text-3xl mb-3"></i>
        <p class="text-gray-400">Match breakdown not available yet</p>
        <p class="text-xs text-gray-500 mt-2">Detailed scores appear after the match is played</p>
      </div>
    `;
    return;
  }
  
  // Get score breakdown
  const blueBreakdown = matchData.score_breakdown.blue;
  const redBreakdown = matchData.score_breakdown.red;
  
  // Create a more detailed table with expanded breakdown
  // Extract common properties dynamically to handle different years' scoring structures
  
  // Auto categories based on the game year - support 2024 Crescendo and 2025 Reefscape
  const autoCategories = [];
  let gameYear = "unknown";
  
  // Detect game by looking at breakdown fields
  if ('autoSpeakerNoteCount' in blueBreakdown) {
    // 2024 Crescendo
    gameYear = "2024";
    autoCategories.push({ name: 'Auto Speaker Notes', blue: blueBreakdown.autoSpeakerNoteCount || '0', red: redBreakdown.autoSpeakerNoteCount || '0' });
    autoCategories.push({ name: 'Auto Amp Notes', blue: blueBreakdown.autoAmpNoteCount || '0', red: redBreakdown.autoAmpNoteCount || '0' });
    autoCategories.push({ name: 'Auto Leave', blue: blueBreakdown.autoLeave ? 'Yes' : 'No', red: redBreakdown.autoLeave ? 'Yes' : 'No' });
  } 
  // 2025 Reefscape game detection
  else if ('autoCoralCount' in blueBreakdown) {
    gameYear = "2025";
    autoCategories.push({ name: 'Auto Coral Nodes', blue: blueBreakdown.autoCoralCount || '0', red: redBreakdown.autoCoralCount || '0' });
    autoCategories.push({ name: 'Auto Coral Points', blue: blueBreakdown.autoCoralPoints || '0', red: redBreakdown.autoCoralPoints || '0' });
    
    // Add robot mobility status in autonomous
    const blueRobotsAuto = [];
    const redRobotsAuto = [];
    
    for (let i = 1; i <= 3; i++) {
      blueRobotsAuto.push(blueBreakdown[`autoLineRobot${i}`] || 'No');
      redRobotsAuto.push(redBreakdown[`autoLineRobot${i}`] || 'No');
    }
    
    autoCategories.push({ 
      name: 'Auto Mobility', 
      blue: `${blueRobotsAuto.filter(status => status === 'Yes').length}/3`, 
      red: `${redRobotsAuto.filter(status => status === 'Yes').length}/3` 
    });
    
    autoCategories.push({ 
      name: 'Auto Mobility Points', 
      blue: blueBreakdown.autoMobilityPoints || '0', 
      red: redBreakdown.autoMobilityPoints || '0' 
    });
    
    // Add Bonus (if applicable)
    autoCategories.push({ 
      name: 'Auto Bonus', 
      blue: blueBreakdown.autoBonusAchieved ? 'Yes' : 'No', 
      red: redBreakdown.autoBonusAchieved ? 'Yes' : 'No' 
    });
  }
  
  // Teleop categories based on the game year
  const teleopCategories = [];
  if (gameYear === "2024") {
    // 2024 Crescendo
    teleopCategories.push({ name: 'Speaker Notes', blue: blueBreakdown.teleopSpeakerNoteCount || '0', red: redBreakdown.teleopSpeakerNoteCount || '0' });
    teleopCategories.push({ name: 'Amped Speaker Notes', blue: blueBreakdown.teleopSpeakerNoteAmplifiedCount || '0', red: redBreakdown.teleopSpeakerNoteAmplifiedCount || '0' });
    teleopCategories.push({ name: 'Amp Notes', blue: blueBreakdown.teleopAmpNoteCount || '0', red: redBreakdown.teleopAmpNoteCount || '0' });
    if ('coopertitionBonus' in blueBreakdown) {
      teleopCategories.push({ name: 'Coopertition', blue: blueBreakdown.coopertitionBonus ? 'Yes' : 'No', red: redBreakdown.coopertitionBonus ? 'Yes' : 'No' });
    }
  } 
  // 2025 Reefscape teleop details
  else if (gameYear === "2025") {
    teleopCategories.push({ 
      name: 'Teleop Coral Nodes', 
      blue: blueBreakdown.teleopCoralCount || '0', 
      red: redBreakdown.teleopCoralCount || '0' 
    });
    
    teleopCategories.push({ 
      name: 'Teleop Coral Points', 
      blue: blueBreakdown.teleopCoralPoints || '0', 
      red: redBreakdown.teleopCoralPoints || '0' 
    });
    
    // Add Reef row counts for detailed node placement
    if (blueBreakdown.teleopReef && redBreakdown.teleopReef) {
      const blueTopNodes = blueBreakdown.teleopReef.tba_topRowCount || 0;
      const blueMidNodes = blueBreakdown.teleopReef.tba_midRowCount || 0;
      const blueBotNodes = blueBreakdown.teleopReef.tba_botRowCount || 0;
      
      const redTopNodes = redBreakdown.teleopReef.tba_topRowCount || 0;
      const redMidNodes = redBreakdown.teleopReef.tba_midRowCount || 0;
      const redBotNodes = redBreakdown.teleopReef.tba_botRowCount || 0;
      
      teleopCategories.push({ 
        name: 'Top Row Nodes', 
        blue: blueTopNodes, 
        red: redTopNodes 
      });
      
      teleopCategories.push({ 
        name: 'Mid Row Nodes', 
        blue: blueMidNodes, 
        red: redMidNodes 
      });
      
      teleopCategories.push({ 
        name: 'Bottom Row Nodes', 
        blue: blueBotNodes, 
        red: redBotNodes 
      });
      
      // Add trough count if available
      if ('trough' in blueBreakdown.teleopReef && 'trough' in redBreakdown.teleopReef) {
        teleopCategories.push({ 
          name: 'Trough', 
          blue: blueBreakdown.teleopReef.trough || 0, 
          red: redBreakdown.teleopReef.trough || 0 
        });
      }
    }
    
    // Add algae data if available
    if ('netAlgaeCount' in blueBreakdown && 'netAlgaeCount' in redBreakdown) {
      teleopCategories.push({ 
        name: 'Net Algae Count', 
        blue: blueBreakdown.netAlgaeCount || 0, 
        red: redBreakdown.netAlgaeCount || 0 
      });
      
      teleopCategories.push({ 
        name: 'Algae Points', 
        blue: blueBreakdown.algaePoints || 0, 
        red: redBreakdown.algaePoints || 0 
      });
    }
    
    // Add wall algae if available
    if ('wallAlgaeCount' in blueBreakdown && 'wallAlgaeCount' in redBreakdown) {
      teleopCategories.push({ 
        name: 'Wall Algae Count', 
        blue: blueBreakdown.wallAlgaeCount || 0, 
        red: redBreakdown.wallAlgaeCount || 0 
      });
    }
    
    // Add coopertition criteria
    teleopCategories.push({ 
      name: 'Coopertition Met', 
      blue: blueBreakdown.coopertitionCriteriaMet ? 'Yes' : 'No', 
      red: redBreakdown.coopertitionCriteriaMet ? 'Yes' : 'No' 
    });
  }
  
  // Endgame-specific categories
  const endgameCategories = [];
  if (gameYear === "2024") {
    // 2024 Crescendo
    const convertEndgameStatus = (status) => {
      if (status === 'None') return '-';
      return status || '-';
    };
    
    endgameCategories.push({ 
      name: 'Robot 1 Endgame', 
      blue: convertEndgameStatus(blueBreakdown.endGameRobot1 || 'None'), 
      red: convertEndgameStatus(redBreakdown.endGameRobot1 || 'None')
    });
    
    endgameCategories.push({ 
      name: 'Robot 2 Endgame', 
      blue: convertEndgameStatus(blueBreakdown.endGameRobot2 || 'None'), 
      red: convertEndgameStatus(redBreakdown.endGameRobot2 || 'None')
    });
    
    endgameCategories.push({ 
      name: 'Robot 3 Endgame', 
      blue: convertEndgameStatus(blueBreakdown.endGameRobot3 || 'None'), 
      red: convertEndgameStatus(redBreakdown.endGameRobot3 || 'None')
    });
    
    endgameCategories.push({ 
      name: 'Trap Notes', 
      blue: blueBreakdown.trapNotePoints / 5 || '0', 
      red: redBreakdown.trapNotePoints / 5 || '0'
    });
  }
  // 2025 Reefscape endgame
  else if (gameYear === "2025") {
    const convertReefscapeEndgame = (status) => {
      if (!status || status === 'None') return '-';
      return status;
    };
    
    // Add robot endgame positions
    endgameCategories.push({ 
      name: 'Robot 1 Endgame', 
      blue: convertReefscapeEndgame(blueBreakdown.endGameRobot1), 
      red: convertReefscapeEndgame(redBreakdown.endGameRobot1)
    });
    
    endgameCategories.push({ 
      name: 'Robot 2 Endgame', 
      blue: convertReefscapeEndgame(blueBreakdown.endGameRobot2), 
      red: convertReefscapeEndgame(redBreakdown.endGameRobot2)
    });
    
    endgameCategories.push({ 
      name: 'Robot 3 Endgame', 
      blue: convertReefscapeEndgame(blueBreakdown.endGameRobot3), 
      red: convertReefscapeEndgame(redBreakdown.endGameRobot3)
    });
    
    // Add barge points
    endgameCategories.push({ 
      name: 'Barge Points', 
      blue: blueBreakdown.endGameBargePoints || '0', 
      red: redBreakdown.endGameBargePoints || '0'
    });
  }
  
  // Game-specific bonus points
  const bonusCategories = [];
  if (gameYear === "2024") {
    // 2024 Crescendo
    bonusCategories.push({ name: 'Center Stage', blue: blueBreakdown.micCenterStage ? 'Yes' : 'No', red: redBreakdown.micCenterStage ? 'Yes' : 'No' });
    bonusCategories.push({ name: 'Harmony', blue: blueBreakdown.endGameHarmonyPoints > 0 ? 'Yes' : 'No', red: redBreakdown.endGameHarmonyPoints > 0 ? 'Yes' : 'No' });
    bonusCategories.push({ name: 'Melody', blue: blueBreakdown.melodyPoints || '0', red: redBreakdown.melodyPoints || '0' });
  }
  // 2025 Reefscape bonuses
  else if (gameYear === "2025") {
    bonusCategories.push({ 
      name: 'Coral Bonus', 
      blue: blueBreakdown.coralBonusAchieved ? 'Yes' : 'No', 
      red: redBreakdown.coralBonusAchieved ? 'Yes' : 'No' 
    });
    
    bonusCategories.push({ 
      name: 'Barge Bonus', 
      blue: blueBreakdown.bargeBonusAchieved ? 'Yes' : 'No', 
      red: redBreakdown.bargeBonusAchieved ? 'Yes' : 'No' 
    });
    
    // Adjustment points (if any)
    if ((blueBreakdown.adjustPoints && blueBreakdown.adjustPoints > 0) || 
        (redBreakdown.adjustPoints && redBreakdown.adjustPoints > 0)) {
      bonusCategories.push({ 
        name: 'Adjustment Points', 
        blue: blueBreakdown.adjustPoints || '0', 
        red: redBreakdown.adjustPoints || '0' 
      });
    }
  }
  
  // Additional ranking point info - only show for qualification matches
  const rpCategories = [];
  const isQualMatch = matchData.comp_level === 'qm';
  
  if (isQualMatch) {
    if (gameYear === "2024") {
      // 2024 Crescendo
      rpCategories.push({ name: 'Sustainability', blue: blueBreakdown.sustainability ? 'Yes' : 'No', red: redBreakdown.sustainability ? 'Yes' : 'No' });
      rpCategories.push({ name: 'Activation', blue: blueBreakdown.activation ? 'Yes' : 'No', red: redBreakdown.activation ? 'Yes' : 'No' });
    }
    // 2025 Reefscape ranking points
    else if (gameYear === "2025") {
      // Display Reefscape RPs (based on the provided score breakdown)
      // This will need to be updated when the actual RP criteria are finalized
      rpCategories.push({ 
        name: 'Total RP', 
        blue: blueBreakdown.rp || '0', 
        red: redBreakdown.rp || '0' 
      });
    }
  }
  
  // Build rows for the table
  let rowsHTML = '';
  
  // Build Auto section
  if (autoCategories.length > 0) {
    rowsHTML += `
      <tr class="section-header">
        <td class="score-category" colspan="3">Autonomous Period</td>
      </tr>
    `;
    
    autoCategories.forEach(category => {
      rowsHTML += `
        <tr>
          <td class="score-category">${category.name}</td>
          <td class="blue-value">${category.blue}</td>
          <td class="red-value">${category.red}</td>
        </tr>
      `;
    });
    
    rowsHTML += `
      <tr>
        <td class="score-category font-semibold">Total Auto Points</td>
        <td class="blue-value font-semibold">${blueBreakdown.autoPoints || '0'}</td>
        <td class="red-value font-semibold">${redBreakdown.autoPoints || '0'}</td>
      </tr>
    `;
  }
  
  // Build Teleop section
  if (teleopCategories.length > 0) {
    rowsHTML += `
      <tr class="section-header">
        <td class="score-category" colspan="3">Teleop Period</td>
      </tr>
    `;
    
    teleopCategories.forEach(category => {
      rowsHTML += `
        <tr>
          <td class="score-category">${category.name}</td>
          <td class="blue-value">${category.blue}</td>
          <td class="red-value">${category.red}</td>
        </tr>
      `;
    });
    
    rowsHTML += `
      <tr>
        <td class="score-category font-semibold">Total Teleop Points</td>
        <td class="blue-value font-semibold">${blueBreakdown.teleopPoints || '0'}</td>
        <td class="red-value font-semibold">${redBreakdown.teleopPoints || '0'}</td>
      </tr>
    `;
  }
  
  // Build Endgame section
  if (endgameCategories.length > 0) {
    rowsHTML += `
      <tr class="section-header">
        <td class="score-category" colspan="3">Endgame</td>
      </tr>
    `;
    
    endgameCategories.forEach(category => {
      rowsHTML += `
        <tr>
          <td class="score-category">${category.name}</td>
          <td class="blue-value">${category.blue}</td>
          <td class="red-value">${category.red}</td>
        </tr>
      `;
    });
  }
  
  // Build bonus section
  if (bonusCategories.length > 0) {
    rowsHTML += `
      <tr class="section-header">
        <td class="score-category" colspan="3">Bonus Points</td>
      </tr>
    `;
    
    bonusCategories.forEach(category => {
      rowsHTML += `
        <tr>
          <td class="score-category">${category.name}</td>
          <td class="blue-value">${category.blue}</td>
          <td class="red-value">${category.red}</td>
        </tr>
      `;
    });
  }
  
  // Add penalties section
  rowsHTML += `
    <tr class="section-header">
      <td class="score-category" colspan="3">Penalties</td>
    </tr>
  `;
  
  // Add detailed foul information
  rowsHTML += `
    <tr>
      <td class="score-category">Fouls</td>
      <td class="blue-value">${blueBreakdown.foulCount || '0'}</td>
      <td class="red-value">${redBreakdown.foulCount || '0'}</td>
    </tr>
    <tr>
      <td class="score-category">Tech Fouls</td>
      <td class="blue-value">${blueBreakdown.techFoulCount || '0'}</td>
      <td class="red-value">${redBreakdown.techFoulCount || '0'}</td>
    </tr>
    <tr>
      <td class="score-category">Foul Points</td>
      <td class="blue-value">${blueBreakdown.foulPoints || '0'}</td>
      <td class="red-value">${redBreakdown.foulPoints || '0'}</td>
    </tr>
  `;
  
  // Add 2025-specific penalties if present
  if (gameYear === "2025") {
    const blueSpecificPenalties = [];
    const redSpecificPenalties = [];
    
    // Check for specific penalty types
    if (blueBreakdown.g206Penalty) blueSpecificPenalties.push("G206");
    if (blueBreakdown.g410Penalty) blueSpecificPenalties.push("G410");
    if (blueBreakdown.g418Penalty) blueSpecificPenalties.push("G418");
    if (blueBreakdown.g428Penalty) blueSpecificPenalties.push("G428");
    
    if (redBreakdown.g206Penalty) redSpecificPenalties.push("G206");
    if (redBreakdown.g410Penalty) redSpecificPenalties.push("G410");
    if (redBreakdown.g418Penalty) redSpecificPenalties.push("G418");
    if (redBreakdown.g428Penalty) redSpecificPenalties.push("G428");
    
    // Only add the row if there are specific penalties
    if (blueSpecificPenalties.length > 0 || redSpecificPenalties.length > 0) {
      rowsHTML += `
        <tr>
          <td class="score-category">Specific Penalties</td>
          <td class="blue-value">${blueSpecificPenalties.length > 0 ? blueSpecificPenalties.join(", ") : "None"}</td>
          <td class="red-value">${redSpecificPenalties.length > 0 ? redSpecificPenalties.join(", ") : "None"}</td>
        </tr>
      `;
    }
  }
  
  // Add total score
  rowsHTML += `
    <tr class="total-row">
      <td class="score-category font-bold">TOTAL SCORE</td>
      <td class="blue-value font-bold text-lg">${matchData.alliances.blue.score}</td>
      <td class="red-value font-bold text-lg">${matchData.alliances.red.score}</td>
    </tr>
  `;
  
  // Add RP section if applicable (only for qualification matches)
  if (rpCategories.length > 0 && matchData.comp_level === 'qm') {
    rowsHTML += `
      <tr class="section-header">
        <td class="score-category" colspan="3">Ranking Points</td>
      </tr>
    `;
    
    rpCategories.forEach(category => {
      rowsHTML += `
        <tr>
          <td class="score-category">${category.name}</td>
          <td class="blue-value">${category.blue}</td>
          <td class="red-value">${category.red}</td>
        </tr>
      `;
    });
    
    // Win/Loss RP
    rowsHTML += `
      <tr>
        <td class="score-category">Match Result RP</td>
        <td class="blue-value">${matchData.winning_alliance === 'blue' ? '2' : (matchData.winning_alliance === '' ? '1' : '0')}</td>
        <td class="red-value">${matchData.winning_alliance === 'red' ? '2' : (matchData.winning_alliance === '' ? '1' : '0')}</td>
      </tr>
    `;
  }
  
  // Create the final table with the generated rows
  const breakdownHTML = `
    <table class="score-table">
      <thead>
        <tr>
          <th class="score-category">Category</th>
          <th>Blue Alliance</th>
          <th>Red Alliance</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
  `;
  
  // Generate visual reef representation for Reefscape matches
  let reefVisualizationHTML = '';
  if (gameYear === "2025" && blueBreakdown.teleopReef && redBreakdown.teleopReef) {
    reefVisualizationHTML = generateReefVisualization(blueBreakdown, redBreakdown);
  }
  
  // Combine breakdown table with reef visualization
  breakdownElement.innerHTML = reefVisualizationHTML + breakdownHTML;
}

// New function to generate visual representation of reef nodes
function generateReefVisualization(blueBreakdown, redBreakdown) {
  // Helper function to generate node visualization for a single alliance
  const generateAllianceReef = (breakdown, allianceColor) => {
    const autoReef = breakdown.autoReef || { topRow: {}, midRow: {}, botRow: {} };
    const teleopReef = breakdown.teleopReef || { topRow: {}, midRow: {}, botRow: {} };
    
    // Function to determine node state class
    const getNodeClass = (row, node) => {
      const autoState = autoReef[row][node] === true;
      const teleopState = teleopReef[row][node] === true;
      
      if (autoState) return `${allianceColor}-auto-node`;
      if (teleopState) return `${allianceColor}-teleop-node`;
      return 'empty-node';
    };
    
    // Generate HTML for all nodes in the reef
    const generateRowHtml = (rowName, displayName) => {
      let rowHtml = `<div class="reef-row"><div class="row-label">${displayName}</div>`;
      
      // Generate nodes A through L
      for (let i = 0; i < 12; i++) {
        const nodeLetter = String.fromCharCode(65 + i); // Convert 0-11 to A-L
        const nodeId = `node${nodeLetter}`;
        const nodeClass = getNodeClass(rowName, nodeId);
        rowHtml += `<div class="reef-node ${nodeClass}"></div>`;
      }
      
      rowHtml += '</div>';
      return rowHtml;
    };
    
    return `
      <div class="reef-container ${allianceColor}-reef">
        <h4 class="reef-title ${allianceColor === 'blue' ? 'text-blue-400' : 'text-red-400'}">${allianceColor.toUpperCase()} ALLIANCE REEF</h4>
        ${generateRowHtml('topRow', 'Top')}
        ${generateRowHtml('midRow', 'Mid')}
        ${generateRowHtml('botRow', 'Bot')}
      </div>
    `;
  };
  
  // Combine both alliances
  return `
    <div class="reef-visualization mb-8">
      <h3 class="text-xl font-bold text-baywatch-orange mb-4">Reef Node Placement</h3>
      <div class="reefs-container">
        ${generateAllianceReef(blueBreakdown, 'blue')}
        ${generateAllianceReef(redBreakdown, 'red')}
      </div>
      <div class="reef-legend">
        <div class="legend-item"><span class="legend-swatch blue-auto-node"></span> Auto Coral</div>
        <div class="legend-item"><span class="legend-swatch blue-teleop-node"></span> Teleop Coral</div>
        <div class="legend-item"><span class="legend-swatch empty-node"></span> Empty Node</div>
      </div>
      <style>
        .reef-visualization {
          background: rgba(0,0,0,0.3);
          border-radius: 0.75rem;
          padding: 1rem;
        }
        .reefs-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .reefs-container {
            flex-direction: row;
            gap: 2rem;
          }
        }
        .reef-container {
          flex: 1;
          border-radius: 0.5rem;
          padding: 0.75rem;
          background: rgba(0,0,0,0.2);
        }
        .blue-reef {
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .red-reef {
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .reef-title {
          text-align: center;
          margin-bottom: 0.75rem;
          font-weight: 600;
        }
        .reef-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .row-label {
          width: 30px;
          font-size: 0.75rem;
          color: #aaa;
        }
        .reef-node {
          width: 15px;
          height: 15px;
          margin: 0 2px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .empty-node {
          background-color: rgba(255,255,255,0.05);
        }
        .blue-auto-node {
          background-color: rgba(37, 99, 235, 0.9);
          border-color: rgba(37, 99, 235, 1);
        }
        .blue-teleop-node {
          background-color: rgba(37, 99, 235, 0.5);
          border-color: rgba(37, 99, 235, 0.7);
        }
        .red-auto-node {
          background-color: rgba(220, 38, 38, 0.9);
          border-color: rgba(220, 38, 38, 1);
        }
        .red-teleop-node {
          background-color: rgba(220, 38, 38, 0.5);
          border-color: rgba(220, 38, 38, 0.7);
        }
        .reef-legend {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        .legend-item {
          display: flex;
          align-items: center;
          font-size: 0.8rem;
          color: #aaa;
        }
        .legend-swatch {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 0.3rem;
        }
      </style>
    </div>
  `;
}

// New function to fetch all playoff matches for a specific event and set
async function fetchSeriesMatches(eventKey, compLevel, setNumber) {
  try {
    // Fetch all matches for this event
    const response = await fetch(`${window.TBA_BASE_URL}/event/${eventKey}/matches`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) throw new Error('Failed to fetch matches');
    
    const matches = await response.json();
    
    // Filter to get only this playoff series
    return matches.filter(match => 
      match.comp_level === compLevel && 
      (compLevel === 'f' || match.set_number === setNumber)
    ).sort((a, b) => a.match_number - b.match_number);
    
  } catch (error) {
    console.error('Error fetching series matches:', error);
    return [];
  }
}

// New function to display playoff series status for a match
async function updatePlayoffSeriesInfo(matchData) {
  // Check if this is a playoff match
  if (matchData.comp_level !== 'sf' && matchData.comp_level !== 'f') return;
  
  try {
    const eventKey = matchData.event_key;
    const compLevel = matchData.comp_level;
    const setNumber = matchData.set_number;
    
    // Get all matches in this series
    const seriesMatches = await fetchSeriesMatches(eventKey, compLevel, setNumber);
    
    if (seriesMatches.length === 0) return;
    
    // Count wins for each alliance
    let blueWins = 0;
    let redWins = 0;
    
    seriesMatches.forEach(match => {
      if (match.winning_alliance === 'blue') blueWins++;
      else if (match.winning_alliance === 'red') redWins++;
    });
    
    // Create series indicator element if it doesn't exist
    let seriesIndicator = document.getElementById('playoff-series-indicator');
    if (!seriesIndicator) {
      const resultBanner = document.getElementById('match-result-banner');
      
      seriesIndicator = document.createElement('div');
      seriesIndicator.id = 'playoff-series-indicator';
      seriesIndicator.className = 'mt-4 p-4 rounded-lg text-center';
      
      // Insert before or after the result banner
      if (resultBanner) {
        resultBanner.parentNode.insertBefore(seriesIndicator, resultBanner.nextSibling);
      } else {
        document.getElementById('score-container').appendChild(seriesIndicator);
      }
    }
    
    // Update series indicator content
    let seriesStatus = '';
    
    if (compLevel === 'sf') {
      seriesStatus = `Semifinal ${setNumber}`;
    } else {
      seriesStatus = 'Finals: Best of 3';
    }
    
    const blueLeading = blueWins > redWins;
    const redLeading = redWins > blueWins;
    const seriesTied = blueWins === redWins;
    const seriesOver = blueWins === 2 || redWins === 2;
    
    // Format: [Blue] 2 - 1 [Red] (Blue Advances)
    seriesIndicator.innerHTML = `
      <div class="text-lg font-semibold mb-2">${seriesStatus}</div>
      <div class="flex items-center justify-center gap-3">
        <span class="text-blue-400 font-bold ${blueLeading ? 'text-2xl' : ''}">${blueWins}</span>
        <span class="text-gray-400">-</span>
        <span class="text-red-400 font-bold ${redLeading ? 'text-2xl' : ''}">${redWins}</span>
      </div>
      
      ${seriesOver ? `
        <div class="mt-2 ${blueWins > redWins ? 'text-blue-400' : 'text-red-400'} font-medium">
          ${blueWins > redWins ? 'Blue Alliance' : 'Red Alliance'} wins series
        </div>
      ` : ''}
    `;
    
    // Add styling based on series state
    seriesIndicator.classList.remove('blue-series-leading', 'red-series-leading', 'series-tied');
    if (blueLeading) {
      seriesIndicator.classList.add('blue-series-leading');
    } else if (redLeading) {
      seriesIndicator.classList.add('red-series-leading');
    } else {
      seriesIndicator.classList.add('series-tied');
    }
  } catch (error) {
    console.error('Error updating playoff series:', error);
  }
}

// Update team details section with match-specific playoff data
async function updateTeamDetails(matchData, teamData) {
  const teamDetailsElement = document.getElementById('team-details');
  
  // Create a map of team keys to team data for quick lookup
  const teamMap = {};
  teamData.forEach(team => {
    teamMap[team.key] = team;
  });
  
  // Determine if this is a playoff match
  const isPlayoff = matchData.comp_level !== 'qm';
  let allianceLabels = {};
  
  // For playoff matches, fetch the alliance data
  if (isPlayoff) {
    try {
      const response = await fetch(`${window.TBA_BASE_URL}/event/${matchData.event_key}/alliances`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (response.ok) {
        const alliances = await response.json();
        // Create mapping of team keys to alliance numbers
        const allianceMap = {};
        alliances.forEach((alliance, index) => {
          const allianceNum = index + 1;
          alliance.picks.forEach(teamKey => {
            allianceMap[teamKey] = allianceNum;
          });
        });
        
        // Set alliance labels based on team lookup
        const blueFirstTeam = matchData.alliances.blue.team_keys[0];
        const redFirstTeam = matchData.alliances.red.team_keys[0];
        allianceLabels = {
          blue: `Alliance ${allianceMap[blueFirstTeam] || '?'}`,
          red: `Alliance ${allianceMap[redFirstTeam] || '?'}`
        };
      }
    } catch (error) {
      console.error('Error fetching alliance data:', error);
      // Fallback to generic labels if fetch fails
      allianceLabels = {
        blue: 'Blue Alliance',
        red: 'Red Alliance'
      };
    }
  }
  
  // Create two columns of team info
  const blueTeamHTML = matchData.alliances.blue.team_keys.map((teamKey, index) => {
    const team = teamMap[teamKey];
    if (!team) return '';
    
    const teamNumber = teamKey.replace('frc', '');
    const allianceBadge = isPlayoff ? `<span class="text-xs bg-blue-900/60 px-2 py-1 rounded">${allianceLabels.blue}</span>` : 
                                     `<span class="text-xs bg-blue-900/30 px-2 py-1 rounded">Blue Alliance</span>`;
    
    return `
      <a href="team.html?team=${teamNumber}" class="block team-detail-card bg-blue-900/20 p-4 rounded-lg hover:bg-blue-900/30 transition-all">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-blue-400">${teamNumber}</h3>
          ${allianceBadge}
        </div>
        <h4 class="font-medium mb-1">${team.nickname}</h4>
        <div class="text-xs text-gray-400 mb-2">${team.city}, ${team.state_prov}${team.country !== 'USA' ? ', ' + team.country : ''}</div>
        <div class="mt-2 flex justify-between">
          <span class="text-xs text-blue-300">
            <i class="fas fa-external-link-alt mr-1"></i> View team details
          </span>
        </div>
      </a>
    `;
  }).join('');
  
  const redTeamHTML = matchData.alliances.red.team_keys.map((teamKey, index) => {
    const team = teamMap[teamKey];
    if (!team) return '';
    
    const teamNumber = teamKey.replace('frc', '');
    const allianceBadge = isPlayoff ? `<span class="text-xs bg-red-900/60 px-2 py-1 rounded">${allianceLabels.red}</span>` : 
                                     `<span class="text-xs bg-red-900/30 px-2 py-1 rounded">Red Alliance</span>`;
    
    return `
      <a href="team.html?team=${teamNumber}" class="block team-detail-card bg-red-900/20 p-4 rounded-lg hover:bg-red-900/30 transition-all">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-bold text-red-400">${teamNumber}</h3>
          ${allianceBadge}
        </div>
        <h4 class="font-medium mb-1">${team.nickname}</h4>
        <div class="text-xs text-gray-400 mb-2">${team.city}, ${team.state_prov}${team.country !== 'USA' ? ', ' + team.country : ''}</div>
        <div class="mt-2 flex justify-between">
          <span class="text-xs text-red-300">
            <i class="fas fa-external-link-alt mr-1"></i> View team details
          </span>
        </div>
      </a>
    `;
  }).join('');
  
  // Combine into a responsive grid
  teamDetailsElement.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-4">
        ${blueTeamHTML}
      </div>
      <div class="space-y-4">
        ${redTeamHTML}
      </div>
    </div>
  `;
}

// Update video section with match video if available
function updateMatchVideo(matchData) {
  const videoElement = document.getElementById('match-video');
  
  // Check if video is available
  if (matchData.videos && matchData.videos.length > 0) {
    // Find the first YouTube video
    const youtubeVideo = matchData.videos.find(v => v.type === 'youtube');
    
    if (youtubeVideo) {
      videoElement.innerHTML = `
        <div class="video-responsive">
          <iframe 
            src="https://www.youtube.com/embed/${youtubeVideo.key}" 
            title="Match Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
      `;
      return;
    }
  }
  
  // No video available
  videoElement.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-video-slash text-gray-600 text-4xl mb-3"></i>
      <p class="text-gray-400">No match video available yet</p>
      <p class="text-xs text-gray-500 mt-2">Check back later or watch on <a href="https://www.twitch.tv/firstinspires" class="text-baywatch-orange hover:text-white" target="_blank">FIRST Twitch</a></p>
    </div>
  `;
}

// Check for match details page and initialize if needed
document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('match.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const matchKey = urlParams.get('match');
    
    if (matchKey) {
      loadMatchDetails(matchKey);
    }
  }
});

// New function to load team overview data
async function loadTeamOverview() {
  try {
    // Get team from URL parameter, default to 7790 if not specified
    const urlParams = new URLSearchParams(window.location.search);
    const teamNumber = urlParams.get('team') || '7790';
    const teamKey = `frc${teamNumber}`;
    
    // 37 hour offset constant (in milliseconds)
    const OFFSET_MS = 37 * 3600 * 1000;
    
    // Update page title to reflect current team
    document.title = `Team ${teamNumber} Overview - FRC`;
    
    // Set initial loading state
    document.getElementById("rookie-year").textContent = "Loading...";
    document.getElementById("events-count").textContent = "Loading...";
    document.getElementById("avg-ranking").textContent = "Loading...";
    document.getElementById("win-rate").textContent = "Loading...";
    
    // Fetch team data from TBA API
    const teamResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}`, {
      headers: {
        'X-TBA-Auth-Key': window.TBA_AUTH_KEY
      }
    });
    
    if (!teamResponse.ok) {
      throw new Error('Failed to fetch team data');
    }
    
    const teamData = await teamResponse.json();
    
    // Update page title with team nickname
    document.title = `Team ${teamNumber} - ${teamData.nickname} - Overview`;
    
    // Update hero section with team name and number
    const heroTitle = document.querySelector('section.pt-36 h1');
    if (heroTitle) {
      heroTitle.innerHTML = `
        <span class="text-white inline-block animate__animated animate__fadeInUp" style="animation-delay: 0.2s">Team</span>
        <span class="text-baywatch-orange glow-orange inline-block animate__animated animate__fadeInUp" style="animation-delay: 0.4s">${teamNumber}</span>
      `;
    }
    
    const heroSubtitle = document.querySelector('section.pt-36 p');
    if (heroSubtitle) {
      heroSubtitle.textContent = teamData.nickname + (teamData.school_name ? ` - ${teamData.school_name}` : '');
    }
    
    // Update basic team stats
    document.getElementById("rookie-year").textContent = teamData.rookie_year || "N/A";
    document.getElementById("team-location").textContent = `${teamData.city}, ${teamData.state_prov}`;
    
    // Fetch current year events (using 2024 since we're in early 2024, will need update later)
    const currentYear = new Date().getFullYear();
    const eventsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/events/${currentYear}`, {
      headers: {
        'X-TBA-Auth-Key': window.TBA_AUTH_KEY
      }
    });
    
    if (!eventsResponse.ok) {
      throw new Error('Failed to fetch events data');
    }
    
    const eventsData = await eventsResponse.json();
    
    // Update events count
    document.getElementById("events-count").textContent = eventsData.length;
    
    // Process events data for the table
    let eventsTable = document.getElementById("events-table").querySelector("tbody");
    eventsTable.innerHTML = '';
    
    if (eventsData.length === 0) {
      eventsTable.innerHTML = `
        <tr>
          <td colspan="5" class="p-4 text-center">No events scheduled for ${currentYear} yet.</td>
      `;
    } else {
      // Sort events by start date
      eventsData.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
      
      // Calculate which event is current or next, applying the 37-hour offset
      const now = new Date();
      let currentEvent = null;
      let nextEvent = null;
      
      for (const event of eventsData) {
        // Apply 37-hour offset to start and end dates
        // Apply 37-hour offset to start and end dates
        const startDate = new Date(new Date(event.start_date).getTime() + OFFSET_MS);
        const endDate = new Date(new Date(event.end_date).getTime() + OFFSET_MS);
        endDate.setHours(23, 59, 59); // Set to end of day
        
        if (now >= startDate && now <= endDate) {
          currentEvent = event;
          break;
        } else if (now < startDate) {
          if (!nextEvent || startDate < new Date(new Date(nextEvent.start_date).getTime() + OFFSET_MS)) {
            nextEvent = event;
          }
        }
      }
      
      // Process and display each event
      for (const event of eventsData) {
        // Fetch team status at this event
        let ranking = "Not Available";
        let record = "N/A";
        let awards = "None";
        
        try {
          // Get team status (includes ranking)
          const statusResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/status`, {
            headers: {
              'X-TBA-Auth-Key': window.TBA_AUTH_KEY
            }
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData && statusData.qual && statusData.qual.ranking) {
              ranking = `${statusData.qual.ranking.rank} of ${statusData.qual.num_teams}`;
              
              if (statusData.qual.ranking.record) {
                record = `${statusData.qual.ranking.record.wins}-${statusData.qual.ranking.record.losses}-${statusData.qual.ranking.record.ties}`;
              }
            }
          }
          
          // Get awards
          const awardsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/awards`, {
            headers: {
              'X-TBA-Auth-Key': window.TBA_AUTH_KEY
            }
          });
          
          if (awardsResponse.ok) {
            const awardsData = await awardsResponse.json();
            if (awardsData.length > 0) {
              awards = awardsData.map(award => award.name).join(", ");
            }
          }
        } catch (error) {
          console.log(`Error fetching details for event ${event.key}:`, error);
        }
        
        // Format date with 37-hour offset
        const startDate = new Date(new Date(event.start_date).getTime() + OFFSET_MS);
        const endDate = new Date(new Date(event.end_date).getTime() + OFFSET_MS);
        const dateStr = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
        // Create row
        const row = document.createElement("tr");
        
        // Highlight current event
        if (currentEvent && currentEvent.key === event.key) {
          row.classList.add("bg-baywatch-orange/10");
        }
        
        row.innerHTML = `
          <td class="p-4">
            <a href="event.html?event=${event.key}" 
               class="hover:text-baywatch-orange transition-colors font-medium">
              ${event.name}
              ${currentEvent && currentEvent.key === event.key ? 
                '<span class="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Current</span>' : 
                (nextEvent && nextEvent.key === event.key ? 
                  '<span class="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Next</span>' : '')}
            </a>
          </td>
          <td class="p-4">${dateStr}</td>
          <td class="p-4">${ranking}</td>
          <td class="p-4">${record}</td>
          <td class="p-4">${awards}</td>
        `;
        
        eventsTable.appendChild(row);
      }
      
      // Calculate and update average ranking and win rate
      let totalRank = 0;
      let totalEvents = 0;
      let totalWins = 0;
      let totalMatches = 0;
      
      for (const event of eventsData) {
        try {
          const statusResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/status`, {
            headers: {
              'X-TBA-Auth-Key': window.TBA_AUTH_KEY
            }
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            if (statusData && statusData.qual && statusData.qual.ranking) {
              totalRank += statusData.qual.ranking.rank;
              totalEvents++;
              
              if (statusData.qual.ranking.record) {
                totalWins += statusData.qual.ranking.record.wins;
                totalMatches += statusData.qual.ranking.record.wins + 
                               statusData.qual.ranking.record.losses + 
                               statusData.qual.ranking.record.ties;
              }
            }
          }
        } catch (error) {
          console.log(`Error fetching status for event ${event.key}:`, error);
        }
      }
      
      // Update average ranking and win rate
      if (totalEvents > 0) {
        const avgRank = (totalRank / totalEvents).toFixed(1);
        document.getElementById("avg-ranking").textContent = avgRank;
      } else {
        document.getElementById("avg-ranking").textContent = "N/A";
      }
      
      if (totalMatches > 0) {
        const winRate = ((totalWins / totalMatches) * 100).toFixed(1) + "%";
        document.getElementById("win-rate").textContent = winRate;
      } else {
        document.getElementById("win-rate").textContent = "N/A";
      }
      
      // Update current event container
      const currentEventContainer = document.getElementById("current-event-container");
      if (currentEvent) {
        // Hide loading message
        document.getElementById("event-loading").style.display = "none";
        
        // Get team status at current event
        try {
          const statusResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${currentEvent.key}/status`, {
            headers: {
              'X-TBA-Auth-Key': window.TBA_AUTH_KEY
            }
          });
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            let rankHtml = "Ranking not available";
            let recordHtml = "Record not available";
            let nextMatchHtml = "No upcoming matches";
            
            if (statusData && statusData.qual && statusData.qual.ranking) {
              rankHtml = `
                <div class="text-center">
                  <span class="text-5xl font-bold mb-2 block">${statusData.qual.ranking.rank}</span>
                  <span class="text-sm text-gray-400">of ${statusData.qual.num_teams} teams</span>
                </div>
              `;
              
              if (statusData.qual.ranking.record) {
                recordHtml = `
                  <div class="flex justify-center items-center space-x-8">
                    <div class="text-center">
                      <span class="text-4xl font-bold text-green-400 block">${statusData.qual.ranking.record.wins}</span>
                      <span class="text-sm text-gray-400">Wins</span>
                    </div>
                    <div class="text-center">
                      <span class="text-4xl font-bold text-red-400 block">${statusData.qual.ranking.record.losses}</span>
                      <span class="text-sm text-gray-400">Losses</span>
                    </div>
                  </div>
                `;
              }
            }
            
            // Get next match
            const matchesResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${currentEvent.key}/matches`, {
              headers: {
                'X-TBA-Auth-Key': window.TBA_AUTH_KEY
              }
            });
            
            if (matchesResponse.ok) {
              const matches = await matchesResponse.json();
              
              // Find upcoming match
              const upcomingMatch = matches.find(match => !match.actual_time);
              
              if (upcomingMatch) {
                // Apply the 37-hour offset to the match time
                const matchTime = new Date((upcomingMatch.predicted_time * 1000) + OFFSET_MS);
                const timeStr = matchTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                
                const isBlue = upcomingMatch.alliances.blue.team_keys.includes(teamKey);
                const allianceClass = isBlue ? 'text-blue-400' : 'text-red-400';
                
                nextMatchHtml = `
                  <div class="p-3 bg-black/30 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-bold">Match ${upcomingMatch.match_number}</span>
                      <span class="text-sm text-gray-400">${timeStr}</span>
                    </div>
                    <div class="mt-1 text-sm">
                      <div class="flex justify-between items-center mb-1 ${isBlue ? 'font-bold' : ''}">
                        <span class="text-blue-400">Blue:</span>
                        <span>${upcomingMatch.alliances.blue.team_keys.map(t => t.replace('frc', '')).join(', ')}</span>
                      </div>
                      <div class="flex justify-between items-center ${!isBlue ? 'font-bold' : ''}">
                        <span class="text-red-400">Red:</span>
                        <span>${upcomingMatch.alliances.red.team_keys.map(t => t.replace('frc', '')).join(', ')}</span>
                      </div>
                    </div>
                    <a href="match.html?match=${upcomingMatch.key}" class="block mt-3 text-center text-xs bg-baywatch-orange/30 hover:bg-baywatch-orange/50 transition-colors py-1 rounded text-white">
                      View Match Details
                    </a>
                  </div>
                `;
              }
            }
            
            // Update the current event container
            currentEventContainer.innerHTML = `
              <div class="text-center">
                <h3 class="text-xl font-semibold mb-6">${currentEvent.name}</h3>
              </div>
              
              <div class="space-y-6">
                <div class="mb-4">
                  <h4 class="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Current Ranking</h4>
                  ${rankHtml}
                </div>
                
                <div class="mb-4">
                  <h4 class="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Record</h4>
                  ${recordHtml}
                </div>
                
                <div>
                  <h4 class="font-medium mb-3 text-sm uppercase text-gray-400 text-center">Next Match</h4>
                  ${nextMatchHtml}
                </div>
              </div>
            `;
          } else {
            // Handle case where status isn't available yet
            currentEventContainer.innerHTML = `
              <div class="text-center">
                <h3 class="text-xl font-semibold mb-4">${currentEvent.name}</h3>
                <p class="text-gray-400">This event is currently in progress, but complete data is not yet available.</p>
                <p class="text-sm mt-2">Check back soon for rankings and match information.</p>
              </div>
            `;
          }
        } catch (error) {
          console.log("Error fetching current event status:", error);
          currentEventContainer.innerHTML = `
            <div class="text-center">
              <h3 class="text-xl font-semibold mb-4">${currentEvent.name}</h3>
              <p class="text-gray-400">Unable to load event data at this time.</p>
              <p class="text-sm mt-2">Please try again later.</p>
            </div>
          `;
        }
      } else if (nextEvent) {
        // Show next event countdown with 37-hour offset
        document.getElementById("event-loading").style.display = "none";
        
        const startDate = new Date(new Date(nextEvent.start_date).getTime() + OFFSET_MS);
        const now = new Date();
        
        // Calculate difference with adjusted time
        const timeDiff = startDate.getTime() - now.getTime();
        const days = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        currentEventContainer.innerHTML = `
          <div class="text-center">
            <h3 class="text-xl font-semibold mb-4">${nextEvent.name}</h3>
            <div class="mt-4 mb-6">
              <span class="text-4xl font-bold text-baywatch-orange">${days}</span>
              <span class="text-xl ml-2">days away</span>
            </div>
            <div class="text-sm text-gray-400">
              ${startDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long', 
                day: 'numeric'
              })} - ${new Date(new Date(nextEvent.end_date).getTime() + OFFSET_MS).toLocaleDateString('en-US', {
                month: 'long', 
                day: 'numeric'
              })}
            </div>
          </div>
        `;
      } else {
        // No current or upcoming events
        document.getElementById("event-loading").style.display = "none";
        currentEventContainer.innerHTML = `
          <div class="text-center">
            <h3 class="text-xl font-semibold mb-4">No Current Event</h3>
            <p class="text-gray-400">There are no active or upcoming events scheduled at this time.</p>
          </div>
        `;
      }
      
      // Update team history section
      const teamHistoryElement = document.getElementById("team-history");
      
      // Fetch all historical events
      const allEventsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/events`, {
        headers: {
          'X-TBA-Auth-Key': window.TBA_AUTH_KEY
        }
      });
      
      if (allEventsResponse.ok) {
        const allEvents = await allEventsResponse.json();
        
        // Group events by year
        const eventsByYear = {};
        allEvents.forEach(event => {
          if (!eventsByYear[event.year]) {
            eventsByYear[event.year] = [];
          }
          eventsByYear[event.year].push(event);
        });
        
        // Sort years in descending order
        const years = Object.keys(eventsByYear).sort((a, b) => b - a);
        
        let historyHTML = '';
        
        for (const year of years) {
          if (year === currentYear.toString()) continue; // Skip current year as it's shown above
          
          const yearEvents = eventsByYear[year];
          yearEvents.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
          
          // Create year section
          historyHTML += `
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">${year} Season</h3>
              <div class="space-y-3">
          `;
          
          // Add events for this year
          for (const event of yearEvents) {
            // Try to fetch awards for this event
            let awardsHTML = '';
            try {
              const awardsResponse = await fetch(`${window.TBA_BASE_URL}/team/${teamKey}/event/${event.key}/awards`, {
                headers: {
                  'X-TBA-Auth-Key': window.TBA_AUTH_KEY
                }
              });
              
              if (awardsResponse.ok) {
                const awards = await awardsResponse.json();
                if (awards.length > 0) {
                  awardsHTML = `
                    <div class="mt-2">
                      <span class="text-sm text-baywatch-orange">Awards: </span>
                      <span class="text-sm">${awards.map(a => a.name).join(', ')}</span>
                    </div>
                  `;
                }
              }
            } catch (error) {
              console.log(`Error fetching awards for ${event.key}:`, error);
            }
            
            historyHTML += `
              <div class="bg-black/30 p-3 rounded">
                <div class="flex justify-between items-center">
                  <span class="font-medium">${event.name}</span>
                  <span class="text-sm text-gray-400">${new Date(event.start_date).toLocaleDateString('en-US', {
                    month: 'short', 
                    day: 'numeric'
                  })}</span>
                </div>
                ${awardsHTML}
              </div>
            `;
          }
          
          historyHTML += `
              </div>
            </div>
          `;
        }
        
        teamHistoryElement.innerHTML = historyHTML || `
          <div class="text-center py-4">
            <p class="text-gray-400">No historical data available</p>
          </div>
        `;
      } else {
        teamHistoryElement.innerHTML = `
          <div class="text-center py-4">
            <p class="text-gray-400">Unable to load team history</p>
          </div>
        `;
      }
    }
    
    // Update social media links for the specific team
    updateTeamSocialLinks(teamNumber);
    
  } catch (error) {
    console.error("Error loading team overview data:", error);
    
    // Update UI with error messages
    document.getElementById("rookie-year").textContent = "Error";
    document.getElementById("events-count").textContent = "Error";
    document.getElementById("avg-ranking").textContent = "Error";
    document.getElementById("win-rate").textContent = "Error";
    
    document.getElementById("events-table").querySelector("tbody").innerHTML = `
      <tr>
        <td colspan="5" class="p-4 text-center text-red-400">
          <i class="fas fa-circle-exclamation mr-1"></i> Error loading team data. Please try again later.
        </td>
      </tr>
    `;
    
    document.getElementById("event-loading").style.display = "none";
    document.getElementById("current-event-container").innerHTML = `
      <div class="text-center">
        <h3 class="text-xl font-semibold mb-4 text-red-400">Error</h3>
        <p class="text-gray-400">Unable to load event data at this time.</p>
        <p class="text-sm mt-2">Please try again later.</p>
      </div>
    `;
    
    document.getElementById("team-history").innerHTML = `
      <div class="text-center py-4">
        <p class="text-gray-400">Unable to load team history</p>
      </div>
    `;
  }
}

// New function to update social media links for the specific team
function updateTeamSocialLinks(teamNumber) {
  // Update social links container with consistent links for all teams
  const socialLinksContainer = document.getElementById('team-links-container');
  if (socialLinksContainer) {
    socialLinksContainer.innerHTML = `
      <a href="https://www.thebluealliance.com/team/${teamNumber}" target="_blank" class="flex items-center p-3 rounded-lg bg-black/30 hover:bg-black/50 transition-all group">
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
  // Add 37-hour offset to the official start date
  startDate.setHours(startDate.getHours() + 37);
  return now >= startDate;
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
    
    // Store event start date in localStorage for future reference
    localStorage.setItem(`${eventCode}_startDate`, eventData.start_date);
    
    // Update page title and header information
    updateEventPageHeader(eventData);
    
    // Check if the event has started (with 37 hour offset)
    const hasStarted = hasEventStarted(eventData.start_date);
    
    if (hasStarted) {
      // Event has started - show competition data sections
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
      updateEventCountdownDisplay(eventData.start_date);
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
    '2025milac': 'firstinspires32',
    '2025mitvc': 'firstinspires34'
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