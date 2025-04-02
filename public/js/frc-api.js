/*
 * FRC API Main Module - Core Functions
 * 
 * This file contains core functions for updating team record, next match,
 * and other essential real-time competition data. These functions power
 * the main dashboard components and provide live updates during events.
 */

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

// Constant for the start time offsets (in milliseconds)
const OFFSET_MS = 37 * 3600 * 1000; // 37 hour offset for district events
const MICMP_OFFSET_MS = 20.5 * 3600 * 1000; // 20.5 hour offset for FiM championship
const TXCMP_OFFSET_MS = 17.5 * 3600 * 1000; // 17.5 hour offset for FiT championship
const NECMP_OFFSET_MS = (17+(1/6)) * 3600 * 1000; // 17.5 hour offset for NE championship

// Helper function to determine which offset to use based on event key
function getOffsetForEvent(eventKey) {
  if (!eventKey) return OFFSET_MS;
  
  // Convert to lowercase for case-insensitive comparison
  const eventLower = eventKey.toLowerCase();
  
  // Check for Michigan state championship (micmp)
  if (eventLower.includes('micmp')) {
    return MICMP_OFFSET_MS;
  }
  
  // Check for Texas state championship (txcmp only)
  if (eventLower.includes('txcmp')) {
    return TXCMP_OFFSET_MS;
  }
  
  // Check for New England state championship (necmp)
  if (eventLower.includes('necmp')) {
    return NECMP_OFFSET_MS;
  }
  
  // Default offset for district and other events
  return OFFSET_MS;
}

// Make getOffsetForEvent function available globally
window.getOffsetForEvent = getOffsetForEvent;

// Helper function to format ranking with proper suffix (1st, 2nd, 3rd, etc.)
function formatRankSuffix(rank) {
  if (rank === 1) {
    return "st";
  } else if (rank === 2) {
    return "nd";
  } else if (rank === 3) {
    return "rd";
  } else {
    return "th";
  }
}

// Make formatRankSuffix function available globally
window.formatRankSuffix = formatRankSuffix;

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
        // Update the suffix span with the correctly formatted suffix
        const rankingSuffix = document.querySelector('#ranking-number + span');
        if (rankingSuffix) {
          rankingSuffix.textContent = formatRankSuffix(teamRanking.rank);
        }
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

// New function for event countdown - Updated to use event-specific offset
function updateEventCountdown(startDate, eventKey) {
  const countdownEl = document.getElementById("countdown-timer");
  if (!countdownEl) {
    // No countdown timer element found, possibly on team.html
    return;
  }

  const now = new Date().getTime();
  // Use the appropriate offset based on the event key
  const offset = getOffsetForEvent(eventKey);
  const eventStart = new Date(startDate).getTime() + offset;
  let timeLeft = eventStart - now;
  if (timeLeft < 0) timeLeft = 0;

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  if (countdownEl) {
    countdownEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}

// New function to update event links with dynamic event key
function updateEventLinks(eventKey) {
  if (!eventKey) return;
  
  // Get all links that should be updated with the dynamic event
  const eventLinks = document.querySelectorAll('.event-link, [data-card] a');
  
  // Update each link with the correct event key
  eventLinks.forEach(link => {
    if (link && link.href && link.href.includes('event.html')) {
      link.href = `event.html?event=${eventKey}`;
    }
  });
  
  console.log(`Updated event links to point to: ${eventKey}`);
}

// Initialize and update all data with loading states
async function initializeEventData() {
  console.log("Initializing event data...");
  try {
    // Use calculated next event instead of a hardcoded one
    console.log("Fetching next event with team key:", window.FRC_TEAM_KEY);
    const currentEvent = await getNextEvent();
    console.log("Next event data:", currentEvent);
    
    // Get necessary DOM elements with null checks
    const countdownSection = document.getElementById("countdown-section");
    const liveUpdates = document.getElementById("live-updates");
    
    // Check if we're on a page with these elements before proceeding
    if (!countdownSection && !liveUpdates) {
      console.log("Required DOM elements not found - might be on team.html or another page without event status UI");
      return;
    }
    
    if (currentEvent) {
      const currentDate = new Date().getTime();
      const eventStart = new Date(currentEvent.start_date).getTime();
      
      // Use event-specific offset
      const offset = getOffsetForEvent(currentEvent.key);
      const eventEnd = new Date(currentEvent.end_date).getTime() + offset;
      
      // Add event-specific offset to event start date for comparison
      const actualEventStart = eventStart + offset;
      // Update the event links to point to the next event
      updateEventLinks(currentEvent.key);
      // Check against actual start time (with offset) for determining if the event has started
      if (countdownSection && liveUpdates) {
        if (currentDate >= actualEventStart && currentDate <= eventEnd) {
          // We're currently at an event - show live data
          const eventKey = currentEvent.key;
          countdownSection.classList.add("hidden");
          liveUpdates.classList.remove("hidden");
          updateRankings(eventKey);
          updateRecord(eventKey);
          updateNextMatch(eventKey);
        } else if (currentDate < actualEventStart) {
          // We're before the actual start time - show countdown
          countdownSection.classList.remove("hidden");
          liveUpdates.classList.add("hidden");
          // Pass the original TBA date and event key - the function will add the offset
          updateEventCountdown(currentEvent.start_date, currentEvent.key);
          setInterval(() => updateEventCountdown(currentEvent.start_date, currentEvent.key), 1000);
        }
      }
    } else {
      console.error("No upcoming events found");
      
      // Use a hard-coded date for Lake City event as fallback
      const fallbackDate = "2025-04-03";
      const fallbackEvent = "2025milac";
      console.log("Using fallback date:", fallbackDate);
      
      // Update links to fallback event
      updateEventLinks(fallbackEvent);
      
      // Only update UI elements if they exist
      if (countdownSection && liveUpdates) {
        countdownSection.classList.remove("hidden");
        liveUpdates.classList.add("hidden");
        updateEventCountdown(fallbackDate, fallbackEvent);
        setInterval(() => updateEventCountdown(fallbackDate, fallbackEvent), 1000);
      }
    }
  } catch (error) {
    console.error("Error initializing data:", error);
    
    // Use a hard-coded date for Lake City event as fallback
    const fallbackDate = "2025-04-03";
    const fallbackEvent = "2025milac";
    console.log("Using fallback date due to error:", fallbackDate);
    
    // Update links to fallback event
    updateEventLinks(fallbackEvent);
    
    // Only update UI elements if they exist
    const countdownSection = document.getElementById("countdown-section");
    const liveUpdates = document.getElementById("live-updates");
    
    if (countdownSection && liveUpdates) {
      countdownSection.classList.remove("hidden");
      liveUpdates.classList.add("hidden");
      updateEventCountdown(fallbackDate, fallbackEvent);
      setInterval(() => updateEventCountdown(fallbackDate, fallbackEvent), 1000);
    }
  }
}

// Start updates when document is loaded
document.addEventListener("DOMContentLoaded", initializeEventData);

// Functions for Lake City Regional page
async function loadEventRankings(eventCode) {
  try {
    console.log(`Loading rankings for event: ${eventCode}`);
    
    // Ensure rankings table element exists before proceeding
    const rankingsTable = document.getElementById('rankings-table');
    if (!rankingsTable) {
      console.error('Rankings table element not found in DOM');
      return;
    }
    
    const rankingsTableBody = rankingsTable.querySelector('tbody');
    if (!rankingsTableBody) {
      console.error('Rankings table body not found');
      return;
    }
    
    // Show loading state
    rankingsTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Loading rankings data...</td></tr>';
    
    // Fetch rankings data with timeout for better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/rankings`, {
      headers: {
        "X-TBA-Auth-Key": window.TBA_AUTH_KEY
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Rankings data fetch failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if we have valid rankings data
    if (!data || !data.rankings || data.rankings.length === 0) {
      // No rankings available yet
      rankingsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="p-8 text-center">
            <div class="flex flex-col items-center justify-center">
              <i class="fas fa-chart-line text-gray-600 text-4xl mb-3"></i>
              <p class="text-lg text-gray-400">No rankings available yet</p>
              <p class="text-sm text-gray-500 mt-2">Check back during the event</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }
    
    // Update the rankings table with data
    updateRankingsTable(data, rankingsTableBody);
    
  } catch (error) {
    console.error('Error loading event rankings:', error);
    
    // Ensure rankings table element exists before updating error message
    const rankingsTable = document.getElementById('rankings-table');
    if (rankingsTable) {
      const rankingsTableBody = rankingsTable.querySelector('tbody');
      if (rankingsTableBody) {
        rankingsTableBody.innerHTML = `
          <tr>
            <td colspan="5" class="p-8 text-center">
              <div class="flex flex-col items-center justify-center">
                <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
                <p class="text-lg text-gray-400">Error loading rankings</p>
                <p class="text-sm text-gray-500 mt-2">${error.message || 'Please try again later'}</p>
              </div>
            </td>
          </tr>
        `;
      }
    }
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