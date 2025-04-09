// Search configuration and API settings
window.TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";
window.TBA_AUTH_KEY = "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";
const API_CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Local database for frequently accessed content and pages
const localSearchDatabase = {
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
      title: "Robots", 
      description: "View all robots built by Team 7790 Baywatch Robotics",
      content: "See our robot RIPTIDE for the 2025 REEFSCAPE season and past competition robots like.",
      type: "page",
      url: "robots.html"
    },
    {
      id: "sponsors",
      title: "Sponsors", 
      description: "Organizations and individuals supporting Team 7790",
      content: "Learn about the generous sponsors and partners that make our team possible.",
      type: "page",
      url: "sponsors.html"
    },
    {
      id: "schedule",
      title: "Schedule", 
      description: "FRC competition schedule for Team 7790",
      content: "See our upcoming competitions.",
      type: "page",
      url: "schedule.html"
    },
    {
      id: "ftc",
      title: "FTC", 
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
  districts: new Map(), // Add districts cache
  districtSearch: new Map(),
  lastTeamFetch: 0,
  lastEventFetch: 0,
  lastDistrictFetch: 0,
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
  
  // Improved retry mechanism
  const MAX_RETRIES = 2;
  let retries = 0;
  
  const attemptFetch = async () => {
    try {
      requestCount++;
      
      const response = await fetch(`${window.TBA_BASE_URL}${endpoint}`, {
        headers: {
          "X-TBA-Auth-Key": window.TBA_AUTH_KEY,
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        // Special handling for 404 (not found)
        if (response.status === 404) {
          console.warn(`Resource not found: ${endpoint}`);
          return null;
        }
        
        // For server errors, we might want to retry
        if (response.status >= 500 && retries < MAX_RETRIES) {
          retries++;
          console.warn(`API error, retrying (${retries}/${MAX_RETRIES}): ${response.status} on ${endpoint}`);
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          return attemptFetch();
        }
        
        console.error(`TBA API Error: ${response.status} on ${endpoint}`);
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && retries < MAX_RETRIES) {
        retries++;
        console.warn(`Network error, retrying (${retries}/${MAX_RETRIES}): ${error.message}`);
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        return attemptFetch();
      }
      
      throw error;
    }
  };
  
  try {
    // Create a promise for this request
    const requestPromise = attemptFetch();
    
    // Store the promise in the pending queries
    apiCache.pendingQueries.set(cacheKey, requestPromise);
    
    // Remove from pending after completion
    requestPromise.finally(() => {
      setTimeout(() => {
        apiCache.pendingQueries.delete(cacheKey);
      }, 100);
    });
    
    return requestPromise;
  } catch (error) {
    console.error(`Error setting up TBA fetch: ${error.message}`);
    throw error;
  }
}

// Search for teams via TBA API - MODIFIED to be more comprehensive
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
        
        // Check if team is participating in 2025 events
        const events2025 = await fetchFromTBA(`/team/frc${query}/events/2025`).catch(() => []);
        if (events2025 && events2025.length > 0) {
          formattedTeam.in2025 = true;
          formattedTeam.eventCount2025 = events2025.length;
        }
        
        // Cache this team
        apiCache.teams.set(team.team_number.toString(), formattedTeam);
        apiCache.teamSearch.set(cacheKey, [formattedTeam]);
        apiCache.lastTeamFetch = Date.now();
        
        return [formattedTeam];
      }
    }
    
    // Full text search for team name/location
    if (query.length >= 1) { // Reduced minimum query length to 1 character
      // Fetch teams using pagination to get ALL teams
      let allTeams = [];
      
      // If we haven't fetched teams in a while, get fresh data
      if (Date.now() - apiCache.lastTeamFetch > API_CACHE_DURATION || apiCache.teams.size < 1000) {
        // Fetch up to 20 pages of teams (10,000 teams) - this should cover all FRC teams
        // We'll stop if we get an empty page or hit API limits
        let currentPage = 0;
        let keepFetching = true;
        
        while (keepFetching && currentPage < 20) {
          try {
            console.log(`Fetching teams page ${currentPage}`);
            const teams = await fetchFromTBA(`/teams/${currentPage}`);
            
            if (!teams || teams.length === 0) {
              // No more teams to fetch
              keepFetching = false;
            } else {
              allTeams = [...allTeams, ...teams];
              currentPage++;
              
              // Add a small delay between requests to prevent rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            // If we hit rate limits, use what we have so far
            if (error.message.includes("rate limit")) {
              console.warn("Hit rate limit while fetching teams, using partial results");
              keepFetching = false;
            } else {
              throw error; // Re-throw other errors
            }
          }
        }
        
        console.log(`Fetched ${allTeams.length} teams in total`);
        
        // Cache all teams to reduce future API calls
        allTeams.forEach(team => {
          if (team && team.team_number) {
            const formattedTeam = {
              id: team.team_number.toString(),
              name: team.nickname || `Team ${team.team_number}`,
              location: `${team.city || ''}, ${team.state_prov || ''}${team.country ? ', ' + team.country : ''}`,
              type: "team",
              url: `team.html?team=${team.team_number}`
            };
            apiCache.teams.set(team.team_number.toString(), formattedTeam);
          }
        });
        
        // Now, fetch 2025 event participation information for prioritization
        try {
          // Fetch the list of teams in 2025 events
          const teams2025Response = await fetchFromTBA(`/events/2025/teams/keys`);
          if (teams2025Response && teams2025Response.length > 0) {
            // Create a set of team keys for quick lookup
            const teams2025Set = new Set(teams2025Response.map(key => key.replace('frc', '')));
            
            // Update cached teams with 2025 participation flag
            apiCache.teams.forEach((team, key) => {
              team.in2025 = teams2025Set.has(key);
            });
          }
        } catch (error) {
          console.warn("Error fetching 2025 team participation:", error);
        }
        
        apiCache.lastTeamFetch = Date.now();
      } else {
        // Use cached teams
        allTeams = Array.from(apiCache.teams.values());
      }
      
      // Get all teams to filter through (using both API results and cached teams)
      const teamsToFilter = allTeams.length > 0 ? allTeams : Array.from(apiCache.teams.values());
      
      // More lenient filtering for team search
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0);
      
      const filteredTeams = teamsToFilter.filter(team => {
        // Check if we have a formatted version
        const formattedTeam = team.team_number ? 
                             apiCache.teams.get(team.team_number.toString()) : 
                             team;
        
        // Use both raw and formatted data for search
        const teamNumber = (formattedTeam?.id || team.team_number || '').toString();
        const teamName = (formattedTeam?.name || team.nickname || '').toLowerCase();
        const teamLocation = (formattedTeam?.location || 
                          `${team.city || ''} ${team.state_prov || ''} ${team.country || ''}`).toLowerCase();
        
        // Check for exact matches first
        if (teamNumber === queryLower) return true;
        if (teamName === queryLower) return true;
        
        // Then check for substring matches
        if (teamNumber.includes(queryLower)) return true;
        if (teamName.includes(queryLower)) return true;
        if (teamLocation.includes(queryLower)) return true;
        
        // If we have multiple terms, check if all terms appear somewhere in the team data
        if (queryTerms.length > 1) {
          const combinedText = `${teamNumber} ${teamName} ${teamLocation}`.toLowerCase();
          return queryTerms.every(term => combinedText.includes(term));
        }
        
        return false;
      });
      
      // Format and sort results
      let results = filteredTeams.map(team => {
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
          url: `team.html?team=${team.team_number || team.id}`,
          in2025: team.in2025 || false
        };
      });
      
      // Sort results to prioritize teams in 2025
      results.sort((a, b) => {
        // First, prioritize 2025 teams
        if (a.in2025 && !b.in2025) return -1;
        if (!a.in2025 && b.in2025) return 1;
        
        // Direct number matches should be ranked highest for number queries
        if (/^\d+$/.test(queryLower)) {
          if (a.id === queryLower && b.id !== queryLower) return -1;
          if (a.id !== queryLower && b.id === queryLower) return 1;
          if (a.id.startsWith(queryLower) && !b.id.startsWith(queryLower)) return -1;
          if (!a.id.startsWith(queryLower) && b.id.startsWith(queryLower)) return 1;
        }
        
        // If both or neither are in 2025, sort by relevance to query
        const aNameMatch = a.name.toLowerCase().includes(queryLower);
        const bNameMatch = b.name.toLowerCase().includes(queryLower);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // If still tied, sort by team number for consistency
        return parseInt(a.id) - parseInt(b.id);
      });
      
      // Cache the search results
      apiCache.teamSearch.set(cacheKey, results);
      
      // Log stats about the search
      console.log(`Search for "${query}" found ${results.length} teams`);
      
      return results;
    }
    
    return [];
  } catch (error) {
    console.error("Error searching teams with TBA:", error);
    return [];
  }
}

// Add this new function for string similarity calculation
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Helper function to determine if two strings are similar enough (accounting for typos)
function stringSimilarity(str1, str2, threshold = 0.7) {
  if (!str1 || !str2) return false;
  
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  
  // Exact match is always a hit
  if (str1 === str2) return true;
  
  // For very short strings, require higher precision
  if (str1.length <= 3 || str2.length <= 3) {
    return str1.includes(str2) || str2.includes(str1);
  }
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = 1 - distance / maxLength;
  
  return similarity >= threshold;
}

// Search for events via TBA API with improved fuzzy matching
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
      return []; // Event not found
    }
    
    // Full text search for event name/location - FETCH ALL EVENTS, NOT JUST 2025
    if (query.length >= 1) { // Reduced minimum query length to 1 character
      const currentYear = new Date().getFullYear();
      let allEvents = [];
      
      // If we haven't fetched events in a while, get fresh data
      if (Date.now() - apiCache.lastEventFetch > API_CACHE_DURATION || !apiCache.events.size) {
        try {
          console.log(`Fetching events for ${currentYear} and ${currentYear + 1}`);
          
          // Fetch events for current year and next year
          const [eventsCurrentYear, eventsNextYear] = await Promise.all([
            fetchFromTBA(`/events/${currentYear}`).catch(() => []),
            fetchFromTBA(`/events/${currentYear + 1}`).catch(() => [])
          ]);
          
          if (eventsCurrentYear && eventsCurrentYear.length > 0) {
            allEvents = [...eventsCurrentYear];
          }
          
          if (eventsNextYear && eventsNextYear.length > 0) {
            allEvents = [...allEvents, ...eventsNextYear];
          }
        } catch (error) {
          // If we hit rate limits, use what we have so far
          if (error.message.includes("rate limit")) {
            console.warn(`Hit rate limit while fetching events, using partial results`);
          } else {
            throw error; // Re-throw other errors
          }
        }
        
        // Cache all fetched events
        allEvents.forEach(event => {
          if (event && event.key) {
            const formattedEvent = {
              id: event.key,
              name: event.name,
              location: `${event.city || ''}, ${event.state_prov || ''}${event.country ? ', ' + event.country : ''}`,
              date: formatEventDate(event.start_date, event.end_date),
              type: "event",
              url: `event.html?event=${event.key}`
            };
            apiCache.events.set(event.key, formattedEvent);
          }
        });
        
        apiCache.lastEventFetch = Date.now();
      } else {
        // Use cached events - DON'T filter for specific year
        allEvents = Array.from(apiCache.events.values());
      }
      
      // More lenient filtering for events
      const queryLower = query.toLowerCase();
      const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0);
      
      const filteredEvents = allEvents.filter(event => {
        // Don't filter by year anymore - accept all events that match the query
        
        // Check if we have a formatted version
        const formattedEvent = event.key ? 
                              apiCache.events.get(event.key) :
                              event;
        
        if (!formattedEvent) return false;
        
        // We might have both formatted and raw - check fields in both
        const eventKey = (formattedEvent?.id || event.key || '').toLowerCase();
        const eventName = (formattedEvent?.name || event.name || '').toLowerCase();
        const eventLocation = (formattedEvent?.location || 
                          `${event.city || ''} ${event.state_prov || ''} ${event.country || ''}`).toLowerCase();
        
        // Check for exact matches first
        if (eventKey === queryLower) return true;
        if (eventName === queryLower) return true;
        
        // Then check for substring matches
        if (eventKey.includes(queryLower)) return true;
        if (eventName.includes(queryLower)) return true;
        if (eventLocation.includes(queryLower)) return true;
        
        // Check for short event code matches without year prefix
        // For example, if searching for "milac", match "2025milac", "2024milac", etc.
        const shortCode = eventKey.substring(4); // Remove year prefix
        if (shortCode === queryLower) return true;
        
        // Check for similar event short codes (fuzzy matching) - NEW!
        // This handles typos in event codes like "milc" instead of "milac"
        if (stringSimilarity(shortCode, queryLower, 0.6)) return true;
        
        // NEW: Fuzzy match event names for better typo handling
        // This handles things like "traverse" vs "traversee" or "lake cty" vs "lake city"
        const eventNameWords = eventName.split(/\s+/);
        
        // Check if any word in the query has a fuzzy match with any word in the event name
        for (const term of queryTerms) {
          if (term.length <= 2) continue; // Skip very short terms
          
          // Try to match the term against the full event name
          if (stringSimilarity(eventName, term, 0.6)) {
            return true;
          }
          
          // Try to match the term against individual words in the event name
          for (const word of eventNameWords) {
            if (word.length <= 2) continue; // Skip very short words
            if (stringSimilarity(word, term, 0.7)) {
              return true;
            }
          }
        }
        
        // If we have multiple terms, check if all terms appear somewhere in the event data
        if (queryTerms.length > 1) {
          const combinedText = `${eventKey} ${eventName} ${eventLocation}`.toLowerCase();
          return queryTerms.every(term => combinedText.includes(term));
        }
        
        return false;
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
      
      // Sort results - prioritize exact matches, then by fuzzy match quality
      results.sort((a, b) => {
        // Exact match priority
        if (a.id.toLowerCase() === queryLower) return -1;
        if (b.id.toLowerCase() === queryLower) return 1;
        
        // Next, prioritize short code matches
        const aShortCode = a.id.toLowerCase().substring(4);
        const bShortCode = b.id.toLowerCase().substring(4);
        
        if (aShortCode === queryLower && bShortCode !== queryLower) return -1;
        if (aShortCode !== queryLower && bShortCode === queryLower) return 1;
        
        // Calculate similarity scores for sorting by match quality
        const aNameSimilarity = Math.max(
          stringSimilarity(a.name.toLowerCase(), queryLower) ? 0.8 : 0,
          stringSimilarity(aShortCode, queryLower) ? 0.7 : 0
        );
        
        const bNameSimilarity = Math.max(
          stringSimilarity(b.name.toLowerCase(), queryLower) ? 0.8 : 0,
          stringSimilarity(bShortCode, queryLower) ? 0.7 : 0
        );
        
        // If similarity scores differ significantly, sort by them
        if (Math.abs(aNameSimilarity - bNameSimilarity) > 0.2) {
          return bNameSimilarity - aNameSimilarity;
        }
        
        // Next, prioritize matches in the name
        const aNameMatch = a.name.toLowerCase().includes(queryLower);
        const bNameMatch = b.name.toLowerCase().includes(queryLower);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Sort by date (closest events first)
        return parseEventDate(a.date) - parseEventDate(b.date);
      });
      
      // Cache the search results
      apiCache.eventSearch.set(cacheKey, results);
      
      // Log stats about the search
      console.log(`Search for "${query}" found ${results.length} events`);
      
      return results;
    }
    
    return [];
  } catch (error) {
    console.error("Error searching events with TBA:", error);
    return [];
  }
}

// Search for districts via TBA API
async function searchDistrictsWithTBA(query) {
  // Check cache first
  const cacheKey = query.toLowerCase();
  if (apiCache.districtSearch.has(cacheKey) && 
      Date.now() - apiCache.lastDistrictFetch < API_CACHE_DURATION) {
    return apiCache.districtSearch.get(cacheKey);
  }

  try {
    const currentYear = new Date().getFullYear();
    
    // Get districts for current year and next year
    const [districtsCurrentYear, districtsNextYear] = await Promise.all([
      fetchFromTBA(`/districts/${currentYear}`).catch(() => []),
      fetchFromTBA(`/districts/${currentYear + 1}`).catch(() => [])
    ]);

    let allDistricts = [...(districtsCurrentYear || []), ...(districtsNextYear || [])];

    // Cache all districts
    allDistricts.forEach(district => {
      const formattedDistrict = {
        id: district.key,
        name: district.display_name,
        type: "district",
        url: `district.html?district=${district.key}`,
        year: district.year
      };
      apiCache.districts.set(district.key, formattedDistrict);
    });

    apiCache.lastDistrictFetch = Date.now();

    // Filter districts based on query
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 0);

    const filteredDistricts = allDistricts.filter(district => {
      const districtName = district.display_name.toLowerCase();
      const districtKey = district.key.toLowerCase();

      // Check for exact matches first
      if (districtKey === queryLower) return true;
      if (districtName === queryLower) return true;

      // Then check for substring matches
      if (districtKey.includes(queryLower)) return true;
      if (districtName.includes(queryLower)) return true;

      // If we have multiple terms, check if all terms appear somewhere
      if (queryTerms.length > 1) {
        const combinedText = `${districtKey} ${districtName}`.toLowerCase();
        return queryTerms.every(term => combinedText.includes(term));
      }

      return false;
    });

    // Format results
    const results = filteredDistricts.map(district => {
      // Use cached formatted district if available
      if (apiCache.districts.has(district.key)) {
        return apiCache.districts.get(district.key);
      }

      // Otherwise format on the fly
      return {
        id: district.key,
        name: district.display_name,
        type: "district",
        url: `district.html?district=${district.key}`,
        year: district.year
      };
    });

    // Sort results by year (newest first) then by name
    results.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.name.localeCompare(b.name);
    });

    // Cache the search results
    apiCache.districtSearch.set(cacheKey, results);

    return results;
  } catch (error) {
    console.error("Error searching districts with TBA:", error);
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

// Function to perform fuzzy search on text and highlight matches - REMOVE YEAR HIGHLIGHTING
function fuzzySearch(text, query) {
  if (!query || !text) return { score: 0, highlighted: text || '' };
  
  // Normalize both strings for better matching
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Remove special handling of "2025" that was causing irrelevant results
  // We'll let normal matching handle it if the user specifically searches for 2025
  
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
  }
  
  return { score: Math.min(score, 1.0), highlighted };
}

// Modified search function that combines local and API results
async function searchAllItems(query) {
  if (!query || query.trim() === '') return [];
  
  // Search local content first for immediate results - DO NOT FILTER BY 2025
  const localItems = [
    ...localSearchDatabase.teams,
    ...localSearchDatabase.events, // Include ALL events regardless of year
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
      case 'district':
        searchableText = `${item.id} ${item.name}`;
        nameMatch = fuzzySearch(item.name, query);
        descriptionMatch = fuzzySearch(item.id, query);
        contentMatch = { score: 0, highlighted: '' };
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
    searchEventsWithTBA(query),
    searchDistrictsWithTBA(query)
  ];
  
  try {
    const [tbaTeams, tbaEvents, tbaDistricts] = await Promise.all(apiPromises);
    
    // Process TBA team results
    const teamResults = tbaTeams.map(team => {
      const nameMatch = fuzzySearch(`${team.id} - ${team.name}`, query);
      const descriptionMatch = fuzzySearch(team.location, query);
      
      return {
        ...team,
        // Use match quality for scoring, not 2025 participation
        score: nameMatch.score * 0.7 + descriptionMatch.score * 0.3,
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
        // Score based on match quality
        score: nameMatch.score * 0.6 + descriptionMatch.score * 0.3 + contentMatch.score * 0.1,
        nameHighlighted: nameMatch.highlighted,
        descriptionHighlighted: descriptionMatch.highlighted,
        contentHighlighted: contentMatch.highlighted
      };
    });
    
    // Process district results
    const districtResults = tbaDistricts.map(district => {
      const nameMatch = fuzzySearch(district.name, query);
      const descriptionMatch = fuzzySearch(district.id, query);

      return {
        ...district,
        score: nameMatch.score * 0.7 + descriptionMatch.score * 0.3,
        nameHighlighted: nameMatch.highlighted,
        descriptionHighlighted: descriptionMatch.highlighted,
        contentHighlighted: ''
      };
    });

    // Combine all results
    let allResults = [
      ...localResults,
      ...teamResults,
      ...eventResults,
      ...districtResults
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
    
    // Get all results without 2025 filtering
    const filteredResults = Array.from(uniqueResults.values());
    
    // Sort results by score, not by 2025 priority
    return filteredResults.sort((a, b) => {
      // First prioritize by type
      const typeOrder = { district: 0, team: 1, event: 2, page: 3 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }

      // For same types, sort by score
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      // For events with same score, prioritize upcoming events
      if (a.type === 'event' && b.type === 'event') {
        const aIsPast = isEventPast(a.date);
        const bIsPast = isEventPast(b.date);
        
        if (!aIsPast && bIsPast) return -1;
        if (aIsPast && !bIsPast) return 1;
        
        // Both past or both upcoming, sort by date
        const dateA = parseEventDate(a.date);
        const dateB = parseEventDate(b.date);
        return !aIsPast ? dateA - dateB : dateB - dateA;
      }

      // Default to alphabetical sorting by name
      return (a.name || '').localeCompare(b.name || '');
    });

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
                     result.type === 'district' ? 'district-badge' :
                     'page-badge';
  
  // Don't mention 2025 in the badge text
  const badgeText = result.type === 'team' ? 'Team' : 
                    result.type === 'event' ? 'Event' : 
                    result.type === 'district' ? 'District' :
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

// Update the results display with the given results array
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
  
  // Always hide no results message first
  if (noResultsMessage) {
    noResultsMessage.classList.add('hidden');
    noResultsMessage.setAttribute('aria-hidden', 'true');
    noResultsMessage.style.display = 'none';
  }
  
  // Handle empty results
  if (results.length === 0) {
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (noResultsMessage) {
      noResultsMessage.classList.remove('hidden');
      noResultsMessage.removeAttribute('aria-hidden');
      noResultsMessage.style.display = 'block';
    }
    if (searchSummary) searchSummary.textContent = `No results found for "${query}"`;
    return;
  }
  
  // Show results
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
  const districtsButton = document.getElementById('filter-districts');
  const pagesButton = document.getElementById('filter-pages');
  
  // Make sure we update counters when we first set up buttons
  updateCountersFromResults(allResults);
  
  // Simple function to filter and display results with proper type mapping
  function filterAndDisplay(type) {
    // Remove active class from all buttons
    [allButton, teamsButton, eventsButton, districtsButton, pagesButton].forEach(btn => {
      if (btn) btn.classList.remove('active-filter');
    });
    
    // Add active class to clicked button
    const buttonMap = {
      'all': allButton,
      'team': teamsButton, // Map singular type to button
      'event': eventsButton,
      'district': districtsButton,
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
  
  if (districtsButton) {
    districtsButton.onclick = () => filterAndDisplay('district'); // Use singular 'district' for filtering
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
      'districts': 'district',
      'district': 'district',
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
      case 'district':
        if (districtsButton) districtsButton.click();
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
  
  // Always hide no results message first
  noResultsMessage.classList.add('hidden');
  noResultsMessage.setAttribute('aria-hidden', 'true');
  noResultsMessage.style.display = 'none';
  
  // Handle empty results
  if (!results || results.length === 0) {
    resultsContainer.innerHTML = '';
    noResultsMessage.classList.remove('hidden');
    noResultsMessage.removeAttribute('aria-hidden');
    noResultsMessage.style.display = 'block';
    return;
  }
  
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
    // Initialize the teams array if it doesn't exist
    if (!localSearchDatabase.teams) {
      localSearchDatabase.teams = [];
    }
    
    // Initialize the events array if it doesn't exist
    if (!localSearchDatabase.events) {
      localSearchDatabase.events = [];
    }

    // Add recently viewed teams if stored in localStorage
    const recentTeams = JSON.parse(localStorage.getItem('recentlyViewedTeams') || '[]');
    recentTeams.forEach(team => {
      // Check if team is already in database to avoid duplicates
      // Added null check to prevent error when teams array doesn't exist
      if (team && team.id && !localSearchDatabase.teams.some(t => t && t.id === team.id)) {
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
      // Added null check to prevent error when events array doesn't exist
      if (event && event.id && !localSearchDatabase.events.some(e => e && e.id === event.id)) {
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
    
    // Add common FRC teams for immediate results
    const commonTeams = [
      { id: "254", name: "The Cheesy Poofs", location: "San Jose, CA" },
      { id: "33", name: "Killer Bees", location: "Auburn Hills, MI" },
      { id: "118", name: "Robonauts", location: "League City, TX" },
      { id: "148", name: "Robowranglers", location: "Greenville, TX" },
      { id: "2056", name: "OP Robotics", location: "Stoney Creek, ON" },
      { id: "1114", name: "Simbotics", location: "St. Catharines, ON" },
      { id: "195", name: "CyberKnights", location: "Southington, CT" },
      { id: "67", name: "The HOT Team", location: "Milford, MI" },
      { id: "27", name: "Team RUSH", location: "Clarkston, MI" },
      { id: "217", name: "ThunderChickens", location: "Sterling Heights, MI" }
    ];
    
    commonTeams.forEach(team => {
      if (!localSearchDatabase.teams.some(t => t && t.id === team.id)) {
        localSearchDatabase.teams.push({
          ...team,
          type: "team",
          url: `team.html?team=${team.id}`
        });
      }
    });
    
    // Include additional events from other years, not just 2025
    const additionalEvents = [
      // Previous years events - adding a few examples
      { id: "2024milac", name: "FIM District Lake City Event", location: "Lake City, Michigan", date: "March 5-7, 2024" },
      { id: "2024mitvc", name: "FIM District Traverse City Event", location: "Traverse City, Michigan", date: "March 19-21, 2024" },
      // 2025 events
      { id: "2025milac", name: "FIM District Lake City Event", location: "Lake City, Michigan", date: "March 12-14, 2025" },
      { id: "2025mitvc", name: "FIM District Traverse City Event", location: "Traverse City, Michigan", date: "March 26-28, 2025" },
      { id: "2025midet", name: "FIM District Detroit Event", location: "Detroit, Michigan", date: "April 2-4, 2025" },
      { id: "2025mifor", name: "FIM District Forest Hills Event", location: "Grand Rapids, Michigan", date: "April 9-11, 2025" },
      { id: "2025micen", name: "FIM District Central Michigan University Event", location: "Mount Pleasant, Michigan", date: "March 5-7, 2025" },
      { id: "2025misjo", name: "FIM District St. Joseph Event", location: "St. Joseph, Michigan", date: "March 19-21, 2025" },
      { id: "2025mimid", name: "FIM District Midland Event", location: "Midland, Michigan", date: "April 2-4, 2025" }
    ];
    
    additionalEvents.forEach(event => {
      if (!localSearchDatabase.events.some(e => e && e.id === event.id)) {
        localSearchDatabase.events.push({
          ...event,
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
  
  // Pre-fetch common search data to improve user experience
  setTimeout(async () => {
    try {
      // Preload 2025 events in the background
      const events2025 = await fetchFromTBA(`/events/2025`).catch(() => []);
      if (events2025 && events2025.length > 0) {
        console.log(`Preloaded ${events2025.length} events for 2025`);
        
        events2025.forEach(event => {
          if (event && event.key) {
            const formattedEvent = {
              id: event.key,
              name: event.name,
              location: `${event.city || ''}, ${event.state_prov || ''}${event.country ? ', ' + event.country : ''}`,
              date: formatEventDate(event.start_date, event.end_date),
              type: "event",
              url: `event.html?event=${event.key}`
            };
            apiCache.events.set(event.key, formattedEvent);
          }
        });
        
        apiCache.lastEventFetch = Date.now();
      }
      
      // Preload some common FRC teams
      const commonTeamNumbers = [
        // Michigan teams
        "7790", "217", "33", "314", "67", "494", "548", 
        
        // Top teams from various regions
        "254", "1114", "2056", "118", "148", "195", "27",
        
        // Other well-known teams
        "971", "1678", "1323", "2767", "16", "610", "1241"
      ];
      
      // Fetch teams in batches to avoid rate limits
      const batchSize = 5;
      const teamBatches = [];
      
      for (let i = 0; i < commonTeamNumbers.length; i += batchSize) {
        teamBatches.push(commonTeamNumbers.slice(i, i + batchSize));
      }
      
      for (const batch of teamBatches) {
        await Promise.all(batch.map(async (teamNumber) => {
          try {
            const teamData = await fetchFromTBA(`/team/frc${teamNumber}`);
            if (teamData) {
              const formattedTeam = {
                id: teamData.team_number.toString(),
                name: teamData.nickname || `Team ${teamData.team_number}`,
                location: `${teamData.city || ''}, ${teamData.state_prov || ''}${teamData.country ? ', ' + teamData.country : ''}`,
                type: "team",
                url: `team.html?team=${teamData.team_number}`
              };
              
              apiCache.teams.set(teamData.team_number.toString(), formattedTeam);
            }
          } catch (error) {
            console.warn(`Error pre-fetching team ${teamNumber}:`, error);
          }
        }));
        
        // Add a small delay between batches
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log(`Preloaded ${apiCache.teams.size} team records`);
      apiCache.lastTeamFetch = Date.now();
    } catch (error) {
      console.warn("Error preloading search data:", error);
    }
  }, 2000); // Wait 2 seconds after page load to start prefetching
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
                      result.type === 'event' ? 'fa-calendar' : 
                      result.type === 'district' ? 'fa-trophy' :
                      'fa-file';
          
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
  const districtCount = results.filter(r => r.type === 'district').length;
  const pageCount = results.filter(r => r.type === 'page').length;
  const totalCount = results.length;
  
  // Log what we're doing for debugging
  console.log(`COUNTER UPDATE - Setting filter counters:`, { 
    all: totalCount, 
    team: teamCount, 
    event: eventCount, 
    district: districtCount,
    page: pageCount 
  });
  
  // Get all counter elements
  const allCounter = document.querySelector('#filter-all .counter');
  const teamsCounter = document.querySelector('#filter-teams .counter');
  const eventsCounter = document.querySelector('#filter-events .counter');
  const districtsCounter = document.querySelector('#filter-districts .counter');
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
  updateCounterElement(districtsCounter, districtCount);
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
      
      // Add active class to clicked button      this.classList.add('active-filter');            // Apply filter to search results      if (window.searchResults) {        const results = window.searchResults;        const filteredResults = filterType === 'all' ?           results :           results.filter(result => result.type === filterType);                // Get search query from URL        const urlParams = new URLSearchParams(window.location.search);        const query = urlParams.get('q') || '';                // Display filtered results        displayFilteredResults(filteredResults, query);      }
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
    district: results.filter(r => r.type === 'district').length,
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
  updateCounter('filter-districts', counts.district);
  updateCounter('filter-pages', counts.page);
}

// Direct and simplified filter button handling to ensure it works reliably
function setupFilterButtons(allResults, query) {
  // Get all filter buttons
  const allButton = document.getElementById('filter-all');
  const teamsButton = document.getElementById('filter-teams');
  const eventsButton = document.getElementById('filter-events');
  const districtsButton = document.getElementById('filter-districts');
  const pagesButton = document.getElementById('filter-pages');
  
  // Make sure we update counters when we first set up buttons
  updateCountersFromResults(allResults);
  
  // Simple function to filter and display results with proper type mapping
  function filterAndDisplay(type) {
    // Remove active class from all buttons
    [allButton, teamsButton, eventsButton, districtsButton, pagesButton].forEach(btn => {
      if (btn) btn.classList.remove('active-filter');
    });
    
    // Add active class to clicked button
    const buttonMap = {
      'all': allButton,
      'team': teamsButton, // Map singular type to button
      'event': eventsButton,
      'district': districtsButton,
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
  
  if (districtsButton) {
    districtsButton.onclick = () => filterAndDisplay('district'); // Use singular 'district' for filtering
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
      'districts': 'district',
      'district': 'district',
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
      case 'district':
        if (districtsButton) districtsButton.click();
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

// Global constants for search functionality
const TBA_AUTH_KEY = "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";
const TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";

// Set up search functionality when the document loads
document.addEventListener('DOMContentLoaded', setupGlobalSearch);

// Main function to set up search across all pages
function setupGlobalSearch() {
  // Handle desktop search
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');
  
  // Handle mobile search
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchButton = document.getElementById('mobile-search-button');
  
  // Function to process search
  function handleSearch(searchTerm) {
    if (!searchTerm) return;
    
    searchTerm = searchTerm.trim().toLowerCase();
    
    // Check if input consists of ONLY digits (team number)
    if (/^\d+$/.test(searchTerm)) {
      // It's a team number
      window.location.href = `team.html?team=${searchTerm}`;
    }
    // For all other searches, go to search results page with the exact term
    else {
      window.location.href = `search-results.html?q=${encodeURIComponent(searchTerm)}`;
    }
  }
  
  // Desktop search listeners
  if (searchButton) {
    searchButton.addEventListener('click', function() {
      handleSearch(searchInput.value);
    });
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSearch(searchInput.value);
      }
    });
  }
  
  // Mobile search listeners
  if (mobileSearchButton) {
    mobileSearchButton.addEventListener('click', function() {
      handleSearch(mobileSearchInput.value);
    });
  }
  
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSearch(mobileSearchInput.value);
      }
    });
  }
  
  // Initialize search-specific page functionality if applicable
  if (window.location.pathname.includes('search-results.html')) {
    initializeSearchResults();
  }
}

// Function to handle search results page
function initializeSearchResults() {
  // Get the query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  
  // Update the page with the search query
  const searchQueryElement = document.getElementById('search-query');
  const searchInputElement = document.getElementById('search-input');
  const mobileSearchInputElement = document.getElementById('mobile-search-input');
  
  if (searchQueryElement) {
    searchQueryElement.textContent = searchQuery || 'No search term';
  }
  
  // Update search inputs with the current query
  if (searchInputElement) {
    searchInputElement.value = searchQuery || '';
  }
  
  if (mobileSearchInputElement) {
    mobileSearchInputElement.value = searchQuery || '';
  }
  
  // Perform the search if there's a query
  if (searchQuery) {
    performSearch(searchQuery);
  } else {
    displayNoSearchResults();
  }
}

// Function to perform search
async function performSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;
  
  // Show loading state
  resultsContainer.innerHTML = `
    <div class="flex justify-center items-center py-12">
      <div class="w-12 h-12 border-4 border-baywatch-orange/30 border-t-baywatch-orange rounded-full animate-spin"></div>
    </div>
  `;
  
  try {
    // Search for teams
    const teams = await searchTeams(query);
    
    // Search for events
    const events = await searchEvents(query);
    
    // Generate HTML for results
    let resultsHtml = '';
    
    // Add team results
    if (teams.length > 0) {
      resultsHtml += `
        <div class="mb-8">
          <h2 class="text-xl font-bold mb-4 text-baywatch-orange">Teams (${teams.length})</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            ${teams.map(team => generateTeamCard(team)).join('')}
          </div>
        </div>
      `;
    }
    
    // Add event results
    if (events.length > 0) {
      resultsHtml += `
        <div class="mb-8">
          <h2 class="text-xl font-bold mb-4 text-baywatch-orange">Events (${events.length})</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${events.map(event => generateEventCard(event)).join('')}
          </div>
        </div>
      `;
    }
    
    // Update the results container
    if (teams.length === 0 && events.length === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center py-12">
          <div class="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-search text-gray-500 text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-400 mb-2">No Results Found</h3>
          <p class="text-gray-500">Try different search terms or check the spelling</p>
        </div>
      `;
    } else {
      resultsContainer.innerHTML = resultsHtml;
    }
    
  } catch (error) {
    console.error('Error performing search:', error);
    resultsContainer.innerHTML = `
      <div class="text-center py-12">
        <div class="w-20 h-20 bg-red-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
        </div>
        <h3 class="text-xl font-bold text-red-400 mb-2">Error</h3>
        <p class="text-gray-400">There was a problem processing your search. Please try again later.</p>
      </div>
    `;
  }
}

// Function to search for teams
async function searchTeams(query) {
  try {
    // Fetch all teams (up to page 10) - this is a limitation of TBA API
    const teams = [];
    for (let page = 0; page < 10; page++) {
      const response = await fetch(`${TBA_BASE_URL}/teams/${page}/simple`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        break;
      }
      
      const pageTeams = await response.json();
      teams.push(...pageTeams);
      
      // Break if we got less than expected (reached the end)
      if (pageTeams.length < 500) {
        break;
      }
    }
    
    // Filter teams based on query
    return teams.filter(team => {
      const teamNumber = team.team_number.toString();
      const teamName = team.nickname.toLowerCase();
      const teamKey = team.key.replace('frc', '');
      
      return teamNumber.includes(query) || 
             teamName.includes(query.toLowerCase()) ||
             teamKey === query;
    });
    
  } catch (error) {
    console.error('Error searching teams:', error);
    return [];
  }
}

// Function to search for events with better fuzzy matching
async function searchEvents(query) {
  try {
    // Get events for current year and next year
    const currentYear = new Date().getFullYear();
    const yearResponses = await Promise.all([
      fetch(`${TBA_BASE_URL}/events/${currentYear}/simple`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      }),
      fetch(`${TBA_BASE_URL}/events/${currentYear + 1}/simple`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      })
    ]);
    
    // Combine events from both years
    const events = [];
    for (const response of yearResponses) {
      if (response.ok) {
        const yearEvents = await response.json();
        events.push(...yearEvents);
      }
    }
    
    const queryLower = query.toLowerCase();
    
    // Filter events based on query with fuzzy matching
    return events.filter(event => {
      // Extract relevant fields for searching
      const eventName = event.name.toLowerCase();
      const eventKey = event.key.toLowerCase();
      const shortName = eventKey.substring(4); // Remove the year prefix (e.g., "2025") for matching
      const eventLocation = `${event.city} ${event.state_prov} ${event.country}`.toLowerCase();
      
      // Check if any field contains the query string (exact matches)
      if (eventName.includes(queryLower) || 
          eventKey.includes(queryLower) ||
          shortName.includes(queryLower) ||
          eventLocation.includes(queryLower)) {
        return true;
      }
      
      // Fuzzy matching for names and short codes
      if (stringSimilarity(eventName, queryLower, 0.6)) return true;
      if (stringSimilarity(shortName, queryLower, 0.7)) return true;
      
      // Check individual words in event name for partial matches
      const nameWords = eventName.split(/\s+/);
      const queryWords = queryLower.split(/\s+/);
      
      for (const queryWord of queryWords) {
        if (queryWord.length <= 2) continue; // Skip very short words
        
        for (const nameWord of nameWords) {
          if (nameWord.length <= 2) continue; // Skip very short words
          if (stringSimilarity(nameWord, queryWord, 0.7)) return true;
        }
      }
      
      return false;
    });
    
  } catch (error) {
    console.error('Error searching events:', error);
    return [];
  }
}

// Function to generate HTML for team card
function generateTeamCard(team) {
  const teamNumber = team.team_number;
  
  return `
    <a href="team.html?team=${teamNumber}" class="team-card-container block">
      <div class="team-card p-4 card-gradient rounded-lg hover:scale-105 transition-all duration-300">
        <h3 class="text-xl font-bold text-baywatch-orange">${teamNumber}</h3>
        <p class="font-medium text-white">${team.nickname}</p>
        <p class="text-sm text-gray-400">${team.city}, ${team.state_prov}</p>
      </div>
    </a>
  `;
}

// Function to generate HTML for event card
function generateEventCard(event) {
  const eventDates = formatEventDates(event.start_date, event.end_date);
  
  return `
    <a href="event.html?event=${event.key}" class="block">
      <div class="p-4 card-gradient rounded-lg hover:scale-105 transition-all duration-300">
        <div class="flex gap-4 items-start">
          <div class="rounded-lg bg-baywatch-orange/20 p-2 flex flex-col items-center justify-center text-center min-w-[60px]">
            <span class="text-xs text-gray-400">${new Date(event.start_date).toLocaleString('default', { month: 'short' })}</span>
            <span class="text-2xl font-bold text-baywatch-orange">${new Date(event.start_date).getDate()}</span>
          </div>
          <div>
            <h3 class="font-bold text-white">${event.name}</h3>
            <p class="text-sm text-gray-400">${event.city}, ${event.state_prov}</p>
            <p class="text-xs text-baywatch-orange mt-2">${eventDates}</p>
          </div>
        </div>
      </div>
    </a>
  `;
}

// Function to format event dates
function formatEventDates(startDate, endDate) {
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

// Function to display no search results
function displayNoSearchResults() {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;
  
  resultsContainer.innerHTML = `
    <div class="text-center py-12">
      <div class="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <i class="fas fa-search text-gray-500 text-3xl"></i>
      </div>
      <h3 class="text-xl font-bold text-gray-400 mb-2">Enter Search Terms</h3>
      <p class="text-gray-500">Type a team number or event name to search</p>
    </div>
  `;
}