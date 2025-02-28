// Search configuration and API settings
window.TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";
window.TBA_AUTH_KEY = "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";
const API_CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Local database for frequently accessed content and pages
const localSearchDatabase = {
  teams: [
    { 
      id: "7790", 
      name: "Baywatch Robotics", 
      location: "Harbor Springs, MI",
      type: "team",
      url: "team.html?team=7790" 
    },
    // Keep a small number of key teams for instant results - less than before
    // The rest will be loaded from TBA API
    { 
      id: "254", 
      name: "The Cheesy Poofs", 
      location: "San Jose, CA",
      type: "team",
      url: "team.html?team=254" 
    },
    { 
      id: "33", 
      name: "Killer Bees", 
      location: "Auburn Hills, MI",
      type: "team",
      url: "team.html?team=33" 
    },
  ],
  events: [
    {
      id: "2025milac",
      name: "FIM District Lake City Event",
      location: "Lake City, Michigan",
      date: "March 12-14, 2025",
      type: "event",
      url: "event.html?event=2025milac"
    },
    {
      id: "2025mitvc",
      name: "FIM District Traverse City Event",
      location: "Traverse City, Michigan",
      date: "March 26-28, 2025",
      type: "event",
      url: "event.html?event=2025mitvc"
    },
  ],
  pages: [
    {
      id: "home",
      title: "Home", 
      description: "FRC Team 7790 Baywatch Robotics from Harbor Springs High School",
      content: "FIRST Robotics Competition team from Harbor Springs Michigan participating in the FRC REEFSCAPE challenge.",
      type: "page",
      url: "index.html"
    },
    {
      id: "robots",
      title: "Our Robots", 
      description: "View all robots built by Team 7790 Baywatch Robotics",
      content: "See our robot RIPTIDE for the 2025 REEFSCAPE season and past competition robots like SURGE and FLUID.",
      type: "page",
      url: "robots.html"
    },
    {
      id: "sponsors",
      title: "Sponsors", 
      description: "Organizations and individuals supporting Team 7790",
      content: "Learn about the generous sponsors and partners that make our team possible. Become a sponsor to support STEM education.",
      type: "page",
      url: "sponsors.html"
    },
    {
      id: "schedule",
      title: "Competition Schedule", 
      description: "FRC competition schedule for Team 7790",
      content: "See our upcoming competitions including Lake City, Traverse City, and Championship events.",
      type: "page",
      url: "schedule.html"
    },
    {
      id: "ftc",
      title: "FTC Team", 
      description: "Our middle school FIRST Tech Challenge team",
      content: "Information about our middle school robotics program and FTC team.",
      type: "page",
      url: "ftc.html"
    }
  ]
};

// In-memory cache for API results
const apiCache = {
  teams: new Map(),
  teamSearch: new Map(),
  events: new Map(),
  eventSearch: new Map(),
  lastTeamFetch: 0,
  lastEventFetch: 0,
  pendingQueries: new Map() // Track active API requests to prevent duplicates
};

// Rate limiting to avoid excessive API calls
let requestCount = 0;
const MAX_REQUESTS_PER_MINUTE = 30; // TBA recommends not exceeding 30 requests/minute
const REQUEST_RESET_INTERVAL = 60000; // 1 minute in milliseconds

// Reset request count every minute
setInterval(() => {
  requestCount = 0;
}, REQUEST_RESET_INTERVAL);

// Function to fetch data from The Blue Alliance API
async function fetchFromTBA(endpoint) {
  // Check rate limiting
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    console.warn(`Rate limit reached: ${requestCount}/${MAX_REQUESTS_PER_MINUTE} requests this minute`);
    throw new Error("API rate limit reached. Please try again later.");
  }
  
  // Check if this exact request is already in progress
  const cacheKey = `request-${endpoint}`;
  if (apiCache.pendingQueries.has(cacheKey)) {
    // Return the existing promise instead of making a duplicate request
    return apiCache.pendingQueries.get(cacheKey);
  }
  
  try {
    // Create a promise for this request
    const requestPromise = new Promise(async (resolve, reject) => {
      try {
        requestCount++;
        
        const response = await fetch(`${TBA_BASE_URL}${endpoint}`, {
          headers: {
            "X-TBA-Auth-Key": TBA_AUTH_KEY,
            "Accept": "application/json"
          }
        });
        
        if (!response.ok) {
          console.error(`TBA API Error: ${response.status} on ${endpoint}`);
          reject(new Error(`API returned ${response.status}: ${response.statusText}`));
          return;
        }
        
        const data = await response.json();
        resolve(data);
      } catch (error) {
        console.error(`Error fetching from TBA: ${error.message}`);
        reject(error);
      } finally {
        // Remove this request from pending queries regardless of success/failure
        setTimeout(() => {
          apiCache.pendingQueries.delete(cacheKey);
        }, 100); // Small delay to prevent race conditions
      }
    });
    
    // Store the promise in the pending queries
    apiCache.pendingQueries.set(cacheKey, requestPromise);
    
    return requestPromise;
  } catch (error) {
    console.error(`Error setting up TBA fetch: ${error.message}`);
    throw error;
  }
}

// Search for teams via TBA API
async function searchTeamsWithTBA(query) {
  // Check cache first
  const cacheKey = query.toLowerCase();
  if (apiCache.teamSearch.has(cacheKey) && 
      Date.now() - apiCache.lastTeamFetch < API_CACHE_DURATION) {
    return apiCache.teamSearch.get(cacheKey);
  }

  try {
    // Exact team number match (fast path)
    if (/^\d+$/.test(query)) {
      const team = await fetchFromTBA(`/team/frc${query}`);
      if (team) {
        const formattedTeam = {
          id: team.team_number.toString(),
          name: team.nickname || `Team ${team.team_number}`,
          location: `${team.city || ''}, ${team.state_prov || ''}${team.country ? ', ' + team.country : ''}`,
          type: "team",
          url: `team.html?team=${team.team_number}`
        };
        
        // Cache this team
        apiCache.teams.set(team.team_number.toString(), formattedTeam);
        apiCache.teamSearch.set(cacheKey, [formattedTeam]);
        apiCache.lastTeamFetch = Date.now();
        
        return [formattedTeam];
      }
    }
    
    // Full text search for team name/location
    if (query.length >= 2) {
      // Fetch a batch of teams
      const PAGE_SIZE = 500;
      let allTeams = [];
      let currentPage = 0;
      
      // If we haven't fetched teams in a while, get fresh data
      if (Date.now() - apiCache.lastTeamFetch > API_CACHE_DURATION || apiCache.teams.size === 0) {
        while (true) {
          try {
            const teams = await fetchFromTBA(`/teams/${currentPage}`);
            if (!teams || teams.length === 0) break;
            allTeams = [...allTeams, ...teams];
            currentPage++;
            // Limit to 1000 teams for performance
            if (allTeams.length > 1000) break;
          } catch (error) {
            // If we hit rate limits, use what we have so far
            if (error.message.includes("rate limit")) {
              console.warn("Hit rate limit while fetching teams, using partial results");
              break;
            }
            throw error; // Re-throw other errors
          }
        }
        
        // Cache all fetched teams
        allTeams.forEach(team => {
          const formattedTeam = {
            id: team.team_number.toString(),
            name: team.nickname || `Team ${team.team_number}`,
            location: `${team.city || ''}, ${team.state_prov || ''}${team.country ? ', ' + team.country : ''}`,
            type: "team",
            url: `team.html?team=${team.team_number}`
          };
          apiCache.teams.set(team.team_number.toString(), formattedTeam);
        });
        
        apiCache.lastTeamFetch = Date.now();
      } else {
        // Use cached teams
        allTeams = Array.from(apiCache.teams.values());
      }
      
      // Filter teams based on search query
      const queryLower = query.toLowerCase();
      const filteredTeams = allTeams.filter(team => {
        // Check if we have a formatted version
        const formattedTeam = apiCache.teams.get(team.team_number?.toString()) || team;
        
        // We might have both formatted and raw - check fields in both
        const teamNumber = (formattedTeam.id || team.team_number || '').toString();
        const teamName = (formattedTeam.name || team.nickname || '').toLowerCase();
        const teamLocation = (formattedTeam.location || `${team.city || ''} ${team.state_prov || ''} ${team.country || ''}`).toLowerCase();
        
        return teamNumber.includes(queryLower) || 
               teamName.includes(queryLower) || 
               teamLocation.includes(queryLower);
      });
      
      // Format results
      const results = filteredTeams.map(team => {
        // Use cached formatted team if available
        if (team.team_number && apiCache.teams.has(team.team_number.toString())) {
          return apiCache.teams.get(team.team_number.toString());
        }
        
        // Otherwise format on the fly
        return {
          id: team.team_number ? team.team_number.toString() : team.id,
          name: team.nickname || team.name || `Team ${team.team_number || team.id}`,
          location: team.location || `${team.city || ''}, ${team.state_prov || ''}${team.country ? ', ' + team.country : ''}`,
          type: "team",
          url: `team.html?team=${team.team_number || team.id}`
        };
      });
      
      // Cache the search results
      apiCache.teamSearch.set(cacheKey, results);
      return results;
    }
    
    return [];
  } catch (error) {
    console.error("Error searching teams with TBA:", error);
    return [];
  }
}

// Search for events via TBA API
async function searchEventsWithTBA(query) {
  // Check cache first
  const cacheKey = query.toLowerCase();
  if (apiCache.eventSearch.has(cacheKey) && 
      Date.now() - apiCache.lastEventFetch < API_CACHE_DURATION) {
    return apiCache.eventSearch.get(cacheKey);
  }

  try {
    // Exact event key match (fast path)
    if (/^\d{4}[a-z0-9]+$/.test(query)) {
      const event = await fetchFromTBA(`/event/${query}`);
      if (event) {
        const formattedEvent = {
          id: event.key,
          name: event.name,
          location: `${event.city || ''}, ${event.state_prov || ''}${event.country ? ', ' + event.country : ''}`,
          date: formatEventDate(event.start_date, event.end_date),
          type: "event",
          url: `event.html?event=${event.key}`
        };
        
        // Cache this event
        apiCache.events.set(event.key, formattedEvent);
        apiCache.eventSearch.set(cacheKey, [formattedEvent]);
        apiCache.lastEventFetch = Date.now();
        
        return [formattedEvent];
      }
    }
    
    // Full text search for event name/location
    if (query.length >= 2) {
      // Current year and nearby years for relevance
      const currentYear = new Date().getFullYear();
      const yearRange = [currentYear - 1, currentYear, currentYear + 1];
      let allEvents = [];
      
      // If we haven't fetched events in a while, get fresh data
      if (Date.now() - apiCache.lastEventFetch > API_CACHE_DURATION || apiCache.events.size === 0) {
        // Fetch events for the year range
        for (const year of yearRange) {
          try {
            const events = await fetchFromTBA(`/events/${year}`);
            if (events && events.length > 0) {
              allEvents = [...allEvents, ...events];
            }
          } catch (error) {
            // If we hit rate limits, use what we have so far
            if (error.message.includes("rate limit")) {
              console.warn(`Hit rate limit while fetching events for ${year}, using partial results`);
              continue; // Try the next year
            }
            throw error; // Re-throw other errors
          }
        }
        
        // Cache all fetched events
        allEvents.forEach(event => {
          const formattedEvent = {
            id: event.key,
            name: event.name,
            location: `${event.city || ''}, ${event.state_prov || ''}${event.country ? ', ' + event.country : ''}`,
            date: formatEventDate(event.start_date, event.end_date),
            type: "event",
            url: `event.html?event=${event.key}`
          };
          apiCache.events.set(event.key, formattedEvent);
        });
        
        apiCache.lastEventFetch = Date.now();
      } else {
        // Use cached events
        allEvents = Array.from(apiCache.events.values());
      }
      
      // Filter events based on search query
      const queryLower = query.toLowerCase();
      const filteredEvents = allEvents.filter(event => {
        // Check if we have a formatted version
        const formattedEvent = event.key ? apiCache.events.get(event.key) : event;
        
        // We might have both formatted and raw - check fields in both
        const eventKey = (formattedEvent?.id || event.key || '').toLowerCase();
        const eventName = (formattedEvent?.name || event.name || '').toLowerCase();
        const eventLocation = (formattedEvent?.location || 
                              `${event.city || ''} ${event.state_prov || ''} ${event.country || ''}`).toLowerCase();
        
        return eventKey.includes(queryLower) || 
               eventName.includes(queryLower) || 
               eventLocation.includes(queryLower);
      });
      
      // Format results
      const results = filteredEvents.map(event => {
        // Use cached formatted event if available
        if (event.key && apiCache.events.has(event.key)) {
          return apiCache.events.get(event.key);
        }
        
        // Otherwise format on the fly
        return {
          id: event.key || event.id,
          name: event.name,
          location: event.location || `${event.city || ''}, ${event.state_prov || ''}${event.country ? ', ' + event.country : ''}`,
          date: formatEventDate(event.start_date, event.end_date) || event.date,
          type: "event",
          url: `event.html?event=${event.key || event.id}`
        };
      });
      
      // Cache the search results
      apiCache.eventSearch.set(cacheKey, results);
      return results;
    }
    
    return [];
  } catch (error) {
    console.error("Error searching events with TBA:", error);
    return [];
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

// Helper function to parse event dates for comparison
function parseEventDate(dateStr) {
  // If no date is provided, set it far in the future to appear at the bottom of the list
  if (!dateStr || dateStr === "Date TBD") return new Date(9999, 0, 1);
  
  try {
    // Handle date ranges like "Mar 12, 2025 - Mar 14, 2025"
    if (dateStr.includes('-')) {
      // Extract the start date (first part before the dash)
      const startDate = dateStr.split('-')[0].trim();
      return new Date(startDate);
    }
    
    // Regular date string
    return new Date(dateStr);
  } catch (e) {
    // If parsing fails, return a far future date
    console.warn(`Failed to parse date: ${dateStr}`, e);
    return new Date(9999, 0, 1);
  }
}

// Helper function to determine if an event is in the past
function isEventPast(dateStr) {
  const eventDate = parseEventDate(dateStr);
  const now = new Date();
  
  // Accounting for multi-day events, add 2 days to the event date for comparison
  const eventEndEstimate = new Date(eventDate);
  eventEndEstimate.setDate(eventEndEstimate.getDate() + 2);
  
  return eventEndEstimate < now;
}

// Function to perform fuzzy search on text and highlight matches
function fuzzySearch(text, query) {
  if (!query || !text) return { score: 0, highlighted: text || '' };
  
  // Normalize both strings for better matching
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (textLower.includes(queryLower)) {
    // Exact substring match
    const index = textLower.indexOf(queryLower);
    const highlighted = text.substring(0, index) + 
      '<span class="highlight">' + text.substring(index, index + query.length) + '</span>' + 
      text.substring(index + query.length);
    return { score: 1.0, highlighted };
  }

  // Check for partial matches
  let score = 0;
  let highlighted = text;
  const queryTokens = queryLower.split(/\s+/);
  
  // Calculate match score and build highlighted text
  for (const token of queryTokens) {
    if (token.length < 2) continue; // Skip very short tokens
    
    if (textLower.includes(token)) {
      score += 0.5 / queryTokens.length;
      
      // Highlight this token in the text (case-insensitive)
      const regex = new RegExp(token, 'gi');
      highlighted = highlighted.replace(regex, '<span class="highlight">$&</span>');
    }
  }
  
  // Check for initial characters matching (acronym match)
  const words = textLower.split(/\s+/);
  const initials = words.map(word => word[0] || '').join('');
  
  if (initials.includes(queryLower)) {
    score += 0.3;
  }
  
  // Levenshtein-like fuzzy matching for team numbers and event codes
  if (queryLower.length >= 3 && textLower.length >= 3) {
    // Check for partial number matches
    if (/^\d+$/.test(queryLower) && /\d+/.test(textLower)) {
      const numbers = textLower.match(/\d+/g) || [];
      for (const num of numbers) {
        if (num.includes(queryLower) || queryLower.includes(num)) {
          score += 0.4;
          // Highlight matching numbers
          const regex = new RegExp(num, 'g');
          highlighted = highlighted.replace(regex, '<span class="highlight">$&</span>');
          break;
        }
      }
    }
    
    // Location or event name matches
    const commonTerms = ["michigan", "event", "district", "championship", "regional", "first"];
    for (const term of commonTerms) {
      if (queryLower.includes(term) && textLower.includes(term)) {
        score += 0.2;
      }
    }
  }
  
  return { score: Math.min(score, 1.0), highlighted };
}

// Modified search function that combines local and API results
async function searchAllItems(query) {
  if (!query || query.trim() === '') return [];
  
  // Search local content first for immediate results
  const localItems = [
    ...localSearchDatabase.teams,
    ...localSearchDatabase.events,
    ...localSearchDatabase.pages
  ];
  
  // Process local results while waiting for API
  const localResults = localItems.map(item => {
    // Create a combined text string to search
    let searchableText;
    let nameMatch, descriptionMatch, contentMatch;
    
    switch(item.type) {
      case 'team':
        searchableText = `${item.id} ${item.name} ${item.location}`;
        nameMatch = fuzzySearch(`${item.id} - ${item.name}`, query);
        descriptionMatch = fuzzySearch(item.location, query);
        contentMatch = { score: 0, highlighted: '' };
        break;
      case 'event':
        searchableText = `${item.id} ${item.name} ${item.location} ${item.date}`;
        nameMatch = fuzzySearch(item.name, query);
        descriptionMatch = fuzzySearch(`${item.location} - ${item.date}`, query);
        contentMatch = fuzzySearch(item.id, query);
        break;
      case 'page':
        searchableText = `${item.title} ${item.description} ${item.content}`;
        nameMatch = fuzzySearch(item.title, query);
        descriptionMatch = fuzzySearch(item.description, query);
        contentMatch = fuzzySearch(item.content, query);
        break;
    }
    
    // Calculate combined score - giving more weight to name matches
    const totalScore = nameMatch.score * 2 + descriptionMatch.score + contentMatch.score * 0.5;
    
    return {
      ...item,
      score: totalScore / 3.5, // Normalize to 0-1
      nameHighlighted: nameMatch.highlighted,
      descriptionHighlighted: descriptionMatch.highlighted,
      contentHighlighted: contentMatch.highlighted
    };
  }).filter(item => item.score > 0.05); // Minimum threshold
  
  // Start API searches - run in parallel
  const apiPromises = [
    searchTeamsWithTBA(query),
    searchEventsWithTBA(query)
  ];
  
  try {
    const [tbaTeams, tbaEvents] = await Promise.all(apiPromises);
    
    // Process TBA team results
    const teamResults = tbaTeams.map(team => {
      const nameMatch = fuzzySearch(`${team.id} - ${team.name}`, query);
      const descriptionMatch = fuzzySearch(team.location, query);
      
      return {
        ...team,
        score: 0.7, // Give API results good but not perfect score
        nameHighlighted: nameMatch.highlighted,
        descriptionHighlighted: descriptionMatch.highlighted,
        contentHighlighted: ''
      };
    });
    
    // Process TBA event results
    const eventResults = tbaEvents.map(event => {
      const nameMatch = fuzzySearch(event.name, query);
      const descriptionMatch = fuzzySearch(`${event.location} - ${event.date}`, query);
      const contentMatch = fuzzySearch(event.id, query);
      
      return {
        ...event,
        score: 0.7, // Give API results good but not perfect score
        nameHighlighted: nameMatch.highlighted,
        descriptionHighlighted: descriptionMatch.highlighted,
        contentHighlighted: contentMatch.highlighted
      };
    });
    
    // Combine all results
    let allResults = [
      ...localResults,
      ...teamResults,
      ...eventResults
    ];
    
    // Remove duplicates by ID
    const uniqueResults = new Map();
    allResults.forEach(result => {
      const key = `${result.type}-${result.id || result.title}`;
      
      // Keep the result with the higher score
      if (!uniqueResults.has(key) || uniqueResults.get(key).score < result.score) {
        uniqueResults.set(key, result);
      }
    });
    
    // Sort by score and return
    const sortedResults = Array.from(uniqueResults.values()).sort((a, b) => {
      // First sort by type: current/upcoming events at the top for event type
      if (a.type === 'event' && b.type === 'event') {
        // Check if one event is past and the other is upcoming
        const aIsPast = isEventPast(a.date);
        const bIsPast = isEventPast(b.date);
        
        if (!aIsPast && bIsPast) {
          return -1; // A is upcoming, B is past, so A comes first
        } else if (aIsPast && !bIsPast) {
          return 1;  // B is upcoming, A is past, so B comes first
        }
        
        // Both are past or both are upcoming, sort by date
        const dateA = parseEventDate(a.date);
        const dateB = parseEventDate(b.date);
        
        // For upcoming events (both not past), sort by nearest date first
        if (!aIsPast && !bIsPast) {
          return dateA - dateB; 
        }
        
        // For past events, sort by most recent first
        return dateB - dateA;
      }
      
      // For different result types or non-event results, sort by score
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      
      // If scores are identical, prioritize certain result types
      const typeOrder = { team: 0, event: 1, page: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return sortedResults;
    
  } catch (error) {
    console.error("Error in API search:", error);
    // Fall back to local results if API fails
    return localResults.sort((a, b) => b.score - a.score);
  }
}

// Generate HTML for a search result with improved layout
function renderSearchResult(result) {
  const badgeClass = result.type === 'team' ? 'team-badge' : 
                     result.type === 'event' ? 'event-badge' : 
                     'page-badge';
  
  const badgeText = result.type === 'team' ? 'Team' : 
                    result.type === 'event' ? 'Event' : 
                    'Page';
  
  return `
    <a href="${result.url}" class="result-card card-gradient rounded-xl p-6 block transition-all group">
      <div class="result-card-content">
        <div class="flex justify-between items-start mb-3">
          <h3 class="font-bold text-lg search-result-title text-white group-hover:text-white">${result.nameHighlighted}</h3>
          <span class="result-type-badge ${badgeClass} shrink-0 ml-2">${badgeText}</span>
        </div>
        <p class="text-gray-400 text-sm mb-3 group-hover:text-gray-300">${result.descriptionHighlighted}</p>
        ${result.contentHighlighted ? `<p class="text-gray-500 text-xs mb-3 group-hover:text-gray-400">${result.contentHighlighted}</p>` : ''}
      </div>
      
      <div class="result-card-footer flex items-center justify-end">
        <span class="text-xs text-baywatch-orange mr-1 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          View details
        </span>
        <i class="fas fa-arrow-right text-baywatch-orange transition-transform duration-300 transform group-hover:translate-x-1"></i>
      </div>
    </a>
  `;
}

// Update the results display with the given results array - Fix counter updating
async function displaySearchResults(results, query) {
  const resultsContainer = document.getElementById('search-results');
  const noResultsMessage = document.getElementById('no-results-message');
  const searchSummary = document.getElementById('search-summary');
  const loadingOverlay = document.getElementById('loading-overlay');
  
  // Always ensure loading overlay is hidden
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }
  
  // Make sure we have results before continuing
  if (!results || !Array.isArray(results)) {
    console.warn('No valid results array to display');
    results = [];
  }
  
  // Store results globally for later use by filters
  window.searchResults = results;
  
  // Update counters with actual result counts - IMPORTANT: Do this AFTER setting searchResults
  updateCountersFromResults(results);
  
  // Handle empty results
  if (results.length === 0) {
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (noResultsMessage) noResultsMessage.classList.remove('hidden');
    if (searchSummary) searchSummary.textContent = `No results found for "${query}"`;
    return;
  }
  
  // Show results
  if (noResultsMessage) noResultsMessage.classList.add('hidden');
  if (searchSummary) searchSummary.textContent = `Found ${results.length} results for "${query}"`;
  
  // Generate HTML for all results
  if (resultsContainer) {
    resultsContainer.innerHTML = results
      .map((result, index) => {
        // Add a staggered animation delay based on index
        const delay = 0.1 * (index % 10);
        return `
          <div class="animate__animated animate__fadeInUp" style="animation-delay: ${delay}s;">
            ${renderSearchResult(result)}
          </div>
        `;
      })
      .join('');
  }
}

// Filter results by type
function filterResultsByType(results, type) {
  if (type === 'all') return results;
  return results.filter(result => result.type === type);
}

// Initialize the search results page
async function initSearchPage() {
  // Get search query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  // Set the query in the search input
  const searchInput = document.getElementById('results-search-input');
  if (searchInput && query) {
    searchInput.value = query;
  }
  
  // Show loading state initially
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('hidden');
  }
  
  // If no query provided, show empty state
  if (!query) {
    const searchSummary = document.getElementById('search-summary');
    if (searchSummary) {
      searchSummary.textContent = 'Enter a search term to find results';
    }
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
      noResultsMessage.classList.remove('hidden');
    }
    return;
  }
  
  // Perform search with proper error handling
  try {
    // Store results globally for access by filter functions
    window.searchResults = await searchAllItems(query);
    
    // Always hide loading overlay before proceeding
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    
    // Log results for debugging
    console.log(`Search returned ${window.searchResults.length} results`);
    
    // Update counters immediately after getting results
    updateCountersFromResults(window.searchResults);
    
    // Display results
    await displaySearchResults(window.searchResults, query);
    
    // Set up filter buttons after results are loaded
    setupFilterButtons(window.searchResults, query);
  } catch (error) {
    console.error("Error performing search:", error);
    
    // Always hide loading overlay on error
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    
    const searchSummary = document.getElementById('search-summary');
    if (searchSummary) {
      searchSummary.textContent = 'An error occurred while searching';
    }
    
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
      noResultsMessage.classList.remove('hidden');
    }
  }
}

// Direct and simplified filter button handling to ensure it works reliably
function setupFilterButtons(allResults, query) {
  // Get all filter buttons
  const allButton = document.getElementById('filter-all');
  const teamsButton = document.getElementById('filter-teams');
  const eventsButton = document.getElementById('filter-events');
  const pagesButton = document.getElementById('filter-pages');
  
  // Make sure we update counters when we first set up buttons
  updateCountersFromResults(allResults);
  
  // Simple function to filter and display results with proper type mapping
  function filterAndDisplay(type) {
    // Remove active class from all buttons
    [allButton, teamsButton, eventsButton, pagesButton].forEach(btn => {
      if (btn) btn.classList.remove('active-filter');
    });
    
    // Add active class to clicked button
    const buttonMap = {
      'all': allButton,
      'team': teamsButton, // Map singular type to button
      'event': eventsButton,
      'page': pagesButton
    };
    
    if (buttonMap[type]) {
      buttonMap[type].classList.add('active-filter');
    }
    
    // Filter results using the singular type name
    let filteredResults;
    if (type === 'all') {
      filteredResults = allResults;
    } else {
      filteredResults = allResults.filter(result => result.type === type);
    }
    
    // Display filtered results
    displayFilteredResults(filteredResults, query);
    
    // Update URL without reloading page
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('filter', type);
      window.history.replaceState({}, '', currentUrl);
    } catch (e) {
      console.warn('Could not update URL with filter parameter', e);
    }
  }
  
  // Add click listeners with proper type mapping
  if (allButton) {
    allButton.onclick = () => filterAndDisplay('all');
  }
  
  if (teamsButton) {
    teamsButton.onclick = () => filterAndDisplay('team'); // Use singular 'team' for filtering
  }
  
  if (eventsButton) {
    eventsButton.onclick = () => filterAndDisplay('event'); // Use singular 'event' for filtering
  }
  
  if (pagesButton) {
    pagesButton.onclick = () => filterAndDisplay('page'); // Use singular 'page' for filtering
  }
  
  // Set initial active filter from URL with proper type mapping
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const activeFilter = urlParams.get('filter') || 'all';
    
    // Map URL parameter values to singular type values
    const filterMap = {
      'all': 'all',
      'teams': 'team',
      'team': 'team',
      'events': 'event',
      'event': 'event',
      'pages': 'page',
      'page': 'page'
    };
    
    const normalizedFilter = filterMap[activeFilter] || 'all';
    
    // Apply the correct filter based on normalized filter type
    switch (normalizedFilter) {
      case 'team':
        if (teamsButton) teamsButton.click();
        break;
      case 'event':
        if (eventsButton) eventsButton.click();
        break;
      case 'page':
        if (pagesButton) pagesButton.click();
        break;
      default:
        if (allButton) allButton.click();
        break;
    }
  } catch (e) {
    // Default to all if there's an error
    if (allButton) allButton.click();
  }
}

// Clean and simplified filtered results display
function displayFilteredResults(results, query) {
  const resultsContainer = document.getElementById('search-results');
  const noResultsMessage = document.getElementById('no-results-message');
  
  if (!resultsContainer || !noResultsMessage) {
    console.error('Required DOM elements not found');
    return;
  }
  
  // Handle empty results
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = '';
    noResultsMessage.classList.remove('hidden');
    return;
  }
  
  // Hide no results message
  noResultsMessage.classList.add('hidden');
  
  // Generate HTML for results
  resultsContainer.innerHTML = results
    .map((result, index) => {
      const delay = 0.05 * (index % 10);
      return `
        <div class="result-card-container animate__animated animate__fadeIn" style="animation-delay: ${delay}s;">
          ${renderSearchResult(result)}
        </div>
      `;
    })
    .join('');
}

// Add search functionality to results page search bar
function setupResultsPageSearch() {
  const resultsSearchInput = document.getElementById('results-search-input');
  const resultsSearchButton = document.getElementById('results-search-button');
  
  if (resultsSearchButton && resultsSearchInput) {
    // Handle button click
    resultsSearchButton.addEventListener('click', async () => {
      const query = resultsSearchInput.value.trim();
      if (query) {
        // Show loading state
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
          loadingOverlay.classList.remove('hidden');
        }
        
        // Get current filter type to preserve it
        const urlParams = new URLSearchParams(window.location.search);
        const currentFilter = urlParams.get('filter') || 'all';
        
        // Update URL to reflect new search but keep filter
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('q', query);
        currentUrl.searchParams.set('filter', currentFilter);
        window.history.replaceState({}, '', currentUrl);
        
        // Perform new search
        try {
          window.searchResults = await searchAllItems(query);
          await displaySearchResults(window.searchResults, query);
          setupFilterButtons(window.searchResults, query);
        } catch (error) {
          console.error("Error in search:", error);
          const searchSummary = document.getElementById('search-summary');
          if (searchSummary) {
            searchSummary.textContent = 'An error occurred while searching';
          }
          if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
          }
        }
      }
    });
    
    // Handle enter key
    resultsSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        resultsSearchButton.click();
      }
    });
  }
}

// Add data from URL query parameters to the search database
function addDynamicSearchData() {
  try {
    // Add recently viewed teams if stored in localStorage
    const recentTeams = JSON.parse(localStorage.getItem('recentlyViewedTeams') || '[]');
    recentTeams.forEach(team => {
      // Check if team is already in database to avoid duplicates
      if (!localSearchDatabase.teams.some(t => t.id === team.id)) {
        localSearchDatabase.teams.push({
          id: team.id,
          name: team.name,
          location: team.location || "Unknown location",
          type: "team",
          url: `team.html?team=${team.id}`
        });
      }
    });
    
    // Add recently viewed events if stored in localStorage
    const recentEvents = JSON.parse(localStorage.getItem('recentlyViewedEvents') || '[]');
    recentEvents.forEach(event => {
      // Check if event is already in database to avoid duplicates
      if (!localSearchDatabase.events.some(e => e.id === event.id)) {
        localSearchDatabase.events.push({
          id: event.id,
          name: event.name,
          location: event.location || "Unknown location",
          date: event.date || "TBD",
          type: "event",
          url: `event.html?event=${event.id}`
        });
      }
    });
  } catch (error) {
    console.error("Error loading dynamic search data:", error);
  }
}

// The main initialization function that runs when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add any dynamically stored search data
  addDynamicSearchData();
  
  // Set up search on all pages
  setupGlobalSearch();
  
  // Special handling for search results page
  if (window.location.pathname.includes('search-results.html')) {
    initSearchPage();
    setupResultsPageSearch();
  }
});

// Setup global search functionality on all pages
function setupGlobalSearch() {
  // Desktop search
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  
  // Mobile search
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchButton = document.getElementById('mobile-search-button');
  
  // Function to process search
  function handleSearch(searchTerm) {
    if (!searchTerm) return;
    
    searchTerm = searchTerm.trim().toLowerCase();
    
    // Check if input matches a team number pattern (all digits)
    if (/^\d+$/.test(searchTerm)) {
      window.location.href = `team.html?team=${searchTerm}`;
      return;
    }
    
    // Check for exact event code pattern (4 digits + letters)
    if (/^\d{4}[a-z0-9]+$/.test(searchTerm)) {
      window.location.href = `event.html?event=${searchTerm}`;
      return;
    }
    
    // Perform a fuzzy search on the database
    const results = searchAllItems(searchTerm);
    
    // If we have an exact match with high confidence, go directly to that page
    if (results.length > 0 && results[0].score > 0.8) {
      window.location.href = results[0].url;
      return;
    }
    
    // Otherwise go to search results page
    window.location.href = `search-results.html?q=${encodeURIComponent(searchTerm)}`;
  }
  
  // Attach event listeners
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      handleSearch(searchInput.value);
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch(searchInput.value);
      }
    });
  }
  
  if (mobileSearchButton) {
    mobileSearchButton.addEventListener('click', () => {
      handleSearch(mobileSearchInput.value);
    });
  }
  
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSearch(mobileSearchInput.value);
      }
    });
  }
}

// Add functionality to store recently viewed teams and events for better search results
function storeRecentlyViewed(type, id, name, extraData = {}) {
  try {
    const key = `recentlyViewed${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const recent = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Check if item already exists
    const existingIndex = recent.findIndex(item => item.id === id);
    if (existingIndex !== -1) {
      // Remove existing item so we can move it to the top
      recent.splice(existingIndex, 1);
    }
    
    // Add to beginning of array (most recent first)
    recent.unshift({
      id,
      name,
      timestamp: Date.now(),
      ...extraData
    });
    
    // Keep only the 10 most recent items
    const trimmed = recent.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.error(`Error storing recently viewed ${type}:`, error);
  }
}

// Add auto-suggestion feature for search inputs
function setupSearchSuggestions() {
  const searchInputs = [
    document.getElementById('search-input'),
    document.getElementById('mobile-search-input'),
    document.getElementById('results-search-input')
  ].filter(Boolean);
  
  searchInputs.forEach(input => {
    // Create suggestion container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'absolute z-50 w-full mt-1 bg-gray-900/95 border border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto hidden';
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(suggestionsContainer);
    
    // Add input event listener
    input.addEventListener('input', debounce(() => {
      const query = input.value.trim();
      
      // Hide suggestions if query is empty
      if (!query) {
        suggestionsContainer.classList.add('hidden');
        return;
      }
      
      // Show at most 5 suggestions
      const results = searchAllItems(query).slice(0, 5);
      
      if (results.length > 0) {
        // Generate suggestion HTML
        suggestionsContainer.innerHTML = results.map(result => {
          const icon = result.type === 'team' ? 'fa-users' : 
                      result.type === 'event' ? 'fa-calendar' : 'fa-file';
          
          let secondaryInfo = '';
          if (result.type === 'team') {
            secondaryInfo = result.location;
          } else if (result.type === 'event') {
            secondaryInfo = result.date;
          }
          
          return `
            <div class="suggestion-item p-2 hover:bg-gray-800 cursor-pointer" data-url="${result.url}">
              <div class="flex items-center">
                <i class="fas ${icon} text-baywatch-orange w-6"></i>
                <div class="ml-2">
                  <div class="font-medium">${result.nameHighlighted}</div>
                  ${secondaryInfo ? `<div class="text-xs text-gray-400">${secondaryInfo}</div>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
        
        // Show suggestions
        suggestionsContainer.classList.remove('hidden');
        
        // Add click event listeners to suggestions
        const suggestionItems = suggestionsContainer.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(item => {
          item.addEventListener('click', () => {
            window.location.href = item.dataset.url;
          });
        });
      } else {
        suggestionsContainer.classList.add('hidden');
      }
    }, 300));
    
    // Hide suggestions when focus is lost
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.classList.add('hidden');
      }
    });
  });
}

// Helper function to debounce input events
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Call setupSearchSuggestions when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  setupSearchSuggestions();
});

// Add this function to update filter counters
function updateCountersFromResults(results) {
  if (!results || !Array.isArray(results)) {
    console.warn('Invalid results provided to updateCountersFromResults');
    results = [];
  }
  
  // Get actual counts by type
  const teamCount = results.filter(r => r.type === 'team').length;
  const eventCount = results.filter(r => r.type === 'event').length;
  const pageCount = results.filter(r => r.type === 'page').length;
  const totalCount = results.length;
  
  // Log what we're doing for debugging
  console.log(`COUNTER UPDATE - Setting filter counters:`, { 
    all: totalCount, 
    team: teamCount, 
    event: eventCount, 
    page: pageCount 
  });
  
  // Get all counter elements
  const allCounter = document.querySelector('#filter-all .counter');
  const teamsCounter = document.querySelector('#filter-teams .counter');
  const eventsCounter = document.querySelector('#filter-events .counter');
  const pagesCounter = document.querySelector('#filter-pages .counter');
  
  // Update function with gentler animation, only if value actually changed
  const updateCounterElement = (element, value) => {
    if (!element) return;
    
    // Parse current value, default to 0 if not a number
    const currentValue = parseInt(element.textContent, 10) || 0;
    
    // Only animate if value is actually changing
    if (currentValue !== value) {
      // Update the text first to prevent layout shift
      element.textContent = value;
      
      // Then add animation class
      element.classList.add('counter-updated');
      
      // Remove animation class after animation completes
      setTimeout(() => {
        element.classList.remove('counter-updated');
      }, 300); // Match the animation duration
    } else {
      // Even if not changing, ensure the text is set correctly
      element.textContent = value;
    }
  };
  
  // Update all counters with gentle animation
  updateCounterElement(allCounter, totalCount);
  updateCounterElement(teamsCounter, teamCount);
  updateCounterElement(eventsCounter, eventCount);
  updateCounterElement(pagesCounter, pageCount);
}

// Function to display search results
function displaySearchResults(results, query) {
  // Store results globally for filtering
  window.searchResults = results;
  
  // Update the filter counters
  updateCountersFromResults(results);
  
  // Rest of the existing display logic
  // ...
}

// Function to display filtered results
function displayFilteredResults(filteredResults, query) {
  const resultsContainer = document.getElementById('search-results');
  const noResultsMessage = document.getElementById('no-results-message');
  
  if (filteredResults.length === 0) {
    resultsContainer.innerHTML = '';
    noResultsMessage.classList.remove('hidden');
  } else {
    noResultsMessage.classList.add('hidden');
    resultsContainer.innerHTML = filteredResults
      .map(result => `<div class="result-card-container">${renderSearchResult(result, query)}</div>`)
      .join('');
  }
}

// Handle filter button clicks
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filterType = this.id.replace('filter-', '');
      
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active-filter'));
      
      // Add active class to clicked button
      this.classList.add('active-filter');
      
      // Apply filter to search results
      if (window.searchResults) {
        const results = window.searchResults;
        const filteredResults = filterType === 'all' ? 
          results : 
          results.filter(result => result.type === filterType);
        
        // Get search query from URL
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q') || '';
        
        // Display filtered results
        displayFilteredResults(filteredResults, query);
      }
    });
  });
  
  // Process search query from URL on page load
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || '';
  
  if (query) {
    // Set search input value
    document.getElementById('results-search-input').value = query;
    document.getElementById('search-input').value = query;
    if (document.getElementById('mobile-search-input')) {
      document.getElementById('mobile-search-input').value = query;
    }
    
    // Update search summary
    const searchSummary = document.getElementById('search-summary');
    if (searchSummary) {
      searchSummary.textContent = `Showing results for "${query}"`;
    }
    
    // Perform search (implement or call your actual search function)
    initSearchPage();
    
    // Safety timeout to hide loading overlay if search takes too long
    setTimeout(() => {
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
        console.warn('Search taking too long, hiding loading overlay');
        loadingOverlay.classList.add('hidden');
      }
    }, 8000); // 8 second timeout
  } else {
    // Hide loading overlay if no query
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
    // Show no results message
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
      noResultsMessage.classList.remove('hidden');
    }
  }
});

// Additional code for search functionality
// ...

// Add a global failsafe to hide the loading overlay
window.addEventListener('load', function() {
  setTimeout(() => {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
      console.warn('Loading overlay still visible after page load, hiding it');
      loadingOverlay.classList.add('hidden');
    }
  }, 3000); // 3 seconds after page load
});

// Fix updateFilterCounters function to properly map button IDs to result types
function updateCountersFromResults(results) {
  if (!results || !Array.isArray(results)) {
    console.warn('Invalid results provided to updateCountersFromResults');
    return;
  }
  
  // Log for debugging
  console.log(`Updating counters with ${results.length} results`, {
    teams: results.filter(r => r.type === 'team').length,
    events: results.filter(r => r.type === 'event').length,
    pages: results.filter(r => r.type === 'page').length
  });
  
  // Count items by type
  const counts = {
    team: results.filter(r => r.type === 'team').length,
    event: results.filter(r => r.type === 'event').length,
    page: results.filter(r => r.type === 'page').length,
    all: results.length
  };

  // Update counter elements with animation
  const updateCounter = (elementId, count) => {
    const counterElement = document.querySelector(`#${elementId} .counter`);
    if (counterElement) {
      // Add animation class
      counterElement.classList.add('counter-updated');
      
      // Update the text
      counterElement.textContent = count;
      
      // Remove animation class after animation completes
      setTimeout(() => {
        counterElement.classList.remove('counter-updated');
      }, 500);
    }
  };
  
  // Update all counters
  updateCounter('filter-all', counts.all);
  updateCounter('filter-teams', counts.team);
  updateCounter('filter-events', counts.event);
  updateCounter('filter-pages', counts.page);
}

// Direct and simplified filter button handling to ensure it works reliably
function setupFilterButtons(allResults, query) {
  // Get all filter buttons
  const allButton = document.getElementById('filter-all');
  const teamsButton = document.getElementById('filter-teams');
  const eventsButton = document.getElementById('filter-events');
  const pagesButton = document.getElementById('filter-pages');
  
  // Make sure we update counters when we first set up buttons
  updateCountersFromResults(allResults);
  
  // Simple function to filter and display results with proper type mapping
  function filterAndDisplay(type) {
    // Remove active class from all buttons
    [allButton, teamsButton, eventsButton, pagesButton].forEach(btn => {
      if (btn) btn.classList.remove('active-filter');
    });
    
    // Add active class to clicked button
    const buttonMap = {
      'all': allButton,
      'team': teamsButton, // Map singular type to button
      'event': eventsButton,
      'page': pagesButton
    };
    
    if (buttonMap[type]) {
      buttonMap[type].classList.add('active-filter');
    }
    
    // Filter results using the singular type name
    let filteredResults;
    if (type === 'all') {
      filteredResults = allResults;
    } else {
      filteredResults = allResults.filter(result => result.type === type);
    }
    
    // Display filtered results
    displayFilteredResults(filteredResults, query);
    
    // Update URL without reloading page
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('filter', type);
      window.history.replaceState({}, '', currentUrl);
    } catch (e) {
      console.warn('Could not update URL with filter parameter', e);
    }
  }
  
  // Add click listeners with proper type mapping
  if (allButton) {
    allButton.onclick = () => filterAndDisplay('all');
  }
  
  if (teamsButton) {
    teamsButton.onclick = () => filterAndDisplay('team'); // Use singular 'team' for filtering
  }
  
  if (eventsButton) {
    eventsButton.onclick = () => filterAndDisplay('event'); // Use singular 'event' for filtering
  }
  
  if (pagesButton) {
    pagesButton.onclick = () => filterAndDisplay('page'); // Use singular 'page' for filtering
  }
  
  // Set initial active filter from URL with proper type mapping
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const activeFilter = urlParams.get('filter') || 'all';
    
    // Map URL parameter values to singular type values
    const filterMap = {
      'all': 'all',
      'teams': 'team',
      'team': 'team',
      'events': 'event',
      'event': 'event',
      'pages': 'page',
      'page': 'page'
    };
    
    const normalizedFilter = filterMap[activeFilter] || 'all';
    
    // Apply the correct filter based on normalized filter type
    switch (normalizedFilter) {
      case 'team':
        if (teamsButton) teamsButton.click();
        break;
      case 'event':
        if (eventsButton) eventsButton.click();
        break;
      case 'page':
        if (pagesButton) pagesButton.click();
        break;
      default:
        if (allButton) allButton.click();
        break;
    }
  } catch (e) {
    // Default to all if there's an error
    if (allButton) allButton.click();
  }
}

// Add this fix to the generic filter button handling
document.addEventListener('DOMContentLoaded', function() {
  // Only run this if we're not handling it through setupFilterButtons
  if (!window.filtersInitialized) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        let filterType = this.id.replace('filter-', '');
        
        // Map plural filter names to singular result types
        const typeMap = {
          'all': 'all',
          'teams': 'team',
          'events': 'event',
          'pages': 'page'
        };
        
        // Get the correct singular filter type
        const mappedType = typeMap[filterType] || filterType;
        
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active-filter'));
        
        // Add active class to clicked button
        this.classList.add('active-filter');
        
        // Apply filter to search results
        if (window.searchResults) {
          const results = window.searchResults;
          const filteredResults = mappedType === 'all' ? 
            results : 
            results.filter(result => result.type === mappedType);
          
          // Get search query from URL
          const urlParams = new URLSearchParams(window.location.search);
          const query = urlParams.get('q') || '';
          
          // Display filtered results
          displayFilteredResults(filteredResults, query);
        }
      });
    });
  }
  
  // Mark filters as initialized to avoid duplicate event handlers
  window.filtersInitialized = true;
});