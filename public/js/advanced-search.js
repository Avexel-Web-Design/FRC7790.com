// Ensure TBA API variables are available
// If they're not defined in the global scope, provide defaults
if (typeof TBA_BASE_URL === 'undefined') {
  console.warn('TBA_BASE_URL not defined, using default');
  var TBA_BASE_URL = "https://www.thebluealliance.com/api/v3";
}

if (typeof TBA_AUTH_KEY === 'undefined') {
  console.warn('TBA_AUTH_KEY not defined, using default');
  var TBA_AUTH_KEY = "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";
}

// Cache for API results to reduce redundant requests
const searchCache = {
  teams: {},
  events: {},
  teamSearches: {},
  eventSearches: {}
};

// Maximum age for cached items (10 minutes)
const CACHE_MAX_AGE = 10 * 60 * 1000;

/**
 * Search for teams with advanced ranking algorithm
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Sorted team results
 */
async function advancedTeamSearch(query, options = {}) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  // Check cache first
  const cacheKey = `${query.toLowerCase()}_${JSON.stringify(options)}`;
  if (searchCache.teamSearches[cacheKey]) {
    const cachedResult = searchCache.teamSearches[cacheKey];
    if (Date.now() - cachedResult.timestamp < CACHE_MAX_AGE) {
      console.log('Using cached team search results for:', query);
      return cachedResult.data;
    }
  }
  
  try {
    // For exact team number searches, prioritize direct lookup
    if (/^\d+$/.test(query)) {
      const teamNumber = query;
      const teamKey = `frc${teamNumber}`;
      
      // Check team cache
      if (searchCache.teams[teamKey] && Date.now() - searchCache.teams[teamKey].timestamp < CACHE_MAX_AGE) {
        return [searchCache.teams[teamKey].data];
      }
      
      // Direct team lookup
      try {
        const response = await fetch(`${TBA_BASE_URL}/team/${teamKey}`, {
          headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
        });
        
        if (response.ok) {
          const teamData = await response.json();
          // Cache the result
          searchCache.teams[teamKey] = {
            data: teamData,
            timestamp: Date.now()
          };
          
          // Cache the search result
          searchCache.teamSearches[cacheKey] = {
            data: [teamData],
            timestamp: Date.now()
          };
          
          return [teamData];
        }
      } catch (error) {
        console.warn('Error in direct team lookup:', error);
        // Continue with general search if direct lookup fails
      }
    }
    
    // General team search - fetch pages of teams and filter
    const teamPages = [];
    
    // Determine how many pages to fetch based on search specificity
    const pagesToFetch = query.length <= 2 ? 3 : 5;
    
    // Add better error handling for network failures
    const fetchWithTimeout = async (url, options, timeout = 5000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };
    
    // Use fetchWithTimeout for API calls
    const fetchPromises = [];
    for (let i = 0; i < pagesToFetch; i++) {
      fetchPromises.push(
        fetchWithTimeout(`${TBA_BASE_URL}/teams/${i}`, {
          headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
        }, 8000).then(response => {
          if (!response.ok) {
            if (response.status === 429) {
              throw new Error(`API rate limit exceeded (429)`);
            }
            throw new Error(`API error: ${response.status}`);
          }
          return response.json();
        }).catch(err => {
          // Return empty array for this page on error
          console.warn(`Error fetching team page ${i}:`, err);
          return [];
        })
      );
    }
    
    const teamPageResults = await Promise.all(fetchPromises);
    const allTeams = teamPageResults.flat();
    
    // Scoring and filtering logic
    const lowercaseQuery = query.toLowerCase();
    const queryTerms = lowercaseQuery.split(/\s+/).filter(term => term.length > 0);
    
    // Only include teams with some match to any term
    const scoredTeams = allTeams
      .map(team => {
        // Extract searchable text
        const teamNumber = team.team_number.toString();
        const teamName = (team.nickname || '').toLowerCase();
        const teamLocation = `${team.city || ''} ${team.state_prov || ''} ${team.country || ''}`.toLowerCase();
        const searchText = `${teamNumber} ${teamName} ${teamLocation}`.toLowerCase();
        
        // Calculate relevance score
        let score = 0;
        
        // Direct number match
        if (teamNumber === query) {
          score += 1000; // Huge bonus for exact number match
        } else if (teamNumber.includes(query)) {
          score += 100; // Bonus for partial number match
        }
        
        // Term-based scoring
        for (const term of queryTerms) {
          if (searchText.includes(term)) {
            // Points for each matching term
            score += 10;
            
            // Extra points for term in team name
            if (teamName.includes(term)) {
              score += 5;
            }
            
            // Extra points for start of word matches
            const wordBoundaryRegex = new RegExp(`(^|\\s)${term}`, 'i');
            if (wordBoundaryRegex.test(searchText)) {
              score += 5;
            }
            
            // More points for longer term matches
            if (term.length > 3) {
              score += term.length - 3;
            }
          }
        }
        
        // Exact name matches
        if (teamName === lowercaseQuery) {
          score += 50;
        }
        
        // Location matches
        if (teamLocation.includes(lowercaseQuery)) {
          score += 8;
        }
        
        return {
          team,
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.team);
      
    // Cache search results
    searchCache.teamSearches[cacheKey] = {
      data: scoredTeams,
      timestamp: Date.now()
    };
      
    return scoredTeams;
    
  } catch (error) {
    console.error('Error in advanced team search:', error);
    throw error;
  }
}

/**
 * Search for events with advanced ranking algorithm
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Sorted event results
 */
async function advancedEventSearch(query, options = {}) {
  // Check cache first
  const cacheKey = `${query.toLowerCase()}_${JSON.stringify(options)}`;
  if (searchCache.eventSearches[cacheKey]) {
    const cachedResult = searchCache.eventSearches[cacheKey];
    if (Date.now() - cachedResult.timestamp < CACHE_MAX_AGE) {
      console.log('Using cached event search results for:', query);
      return cachedResult.data;
    }
  }
  
  try {
    // Direct event code lookup for exact matches (e.g. 2025milac)
    if (/^\d{4}[a-z0-9]+$/.test(query.toLowerCase())) {
      const eventKey = query.toLowerCase();
      
      // Check event cache
      if (searchCache.events[eventKey] && Date.now() - searchCache.events[eventKey].timestamp < CACHE_MAX_AGE) {
        return [searchCache.events[eventKey].data];
      }
      
      try {
        const response = await fetch(`${TBA_BASE_URL}/event/${eventKey}`, {
          headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
        });
        
        if (response.ok) {
          const eventData = await response.json();
          // Cache the result
          searchCache.events[eventKey] = {
            data: eventData,
            timestamp: Date.now()
          };
          
          // Cache the search result
          searchCache.eventSearches[cacheKey] = {
            data: [eventData],
            timestamp: Date.now()
          };
          
          return [eventData];
        }
      } catch (error) {
        console.warn('Error in direct event lookup:', error);
        // Continue with general search if direct lookup fails
      }
    }
    
    // General event search
    // Determine which years to search based on query
    const currentYear = new Date().getFullYear();
    const yearToSearch = [];
    
    // Try to extract year from query
    const yearMatch = query.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      yearToSearch.push(parseInt(yearMatch[1]));
    } else {
      // Default to current year and previous year
      yearToSearch.push(currentYear, currentYear - 1);
      
      // If we're early in the calendar year, also include next year's events
      const currentMonth = new Date().getMonth();
      if (currentMonth >= 9) { // October or later
        yearToSearch.push(currentYear + 1);
      }
    }
    
    // Fetch events for each year in parallel
    const fetchPromises = yearToSearch.map(year => 
      fetch(`${TBA_BASE_URL}/events/${year}`, {
        headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
      }).then(response => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        return response.json();
      })
    );
    
    const eventResults = await Promise.all(fetchPromises);
    const allEvents = eventResults.flat();
    
    // Scoring and filtering logic
    const lowercaseQuery = query.toLowerCase();
    const queryTerms = lowercaseQuery.split(/\s+/).filter(term => term.length > 0);
    
    // Special case: Check if query might be a short event code without year
    let potentialEventCodeMatches = [];
    if (query.length >= 3 && query.length <= 6 && /^[a-z0-9]+$/i.test(query)) {
      potentialEventCodeMatches = allEvents.filter(event => {
        // Extract the district code portion of the event key (after year)
        const codeMatch = event.key.match(/^\d{4}([a-z0-9]+)$/);
        if (codeMatch) {
          const code = codeMatch[1].toLowerCase();
          return code === lowercaseQuery || code.includes(lowercaseQuery);
        }
        return false;
      });
      
      // If we have potential event code matches, boost their scores significantly
      if (potentialEventCodeMatches.length > 0) {
        console.log(`Found ${potentialEventCodeMatches.length} potential event code matches for: ${query}`);
      }
    }
    
    // Score events
    const scoredEvents = allEvents
      .map(event => {
        // Extract searchable text
        const eventName = (event.name || '').toLowerCase();
        const eventKey = (event.key || '').toLowerCase();
        const eventLocation = `${event.city || ''} ${event.state_prov || ''} ${event.country || ''}`.toLowerCase();
        const searchText = `${eventName} ${eventKey} ${eventLocation}`.toLowerCase();
        
        // Calculate relevance score
        let score = 0;
        
        // Direct key match
        if (eventKey === lowercaseQuery) {
          score += 1000; // Huge bonus for exact key match
        }
        
        // Potential event code match bonus
        if (potentialEventCodeMatches.some(e => e.key === event.key)) {
          score += 250; // Large bonus for event code match
        }
        
        // Term-based scoring
        for (const term of queryTerms) {
          if (searchText.includes(term)) {
            // Points for each matching term
            score += 10;
            
            // Extra points for term in event name
            if (eventName.includes(term)) {
              score += 5;
            }
            
            // Extra points for start of word matches
            const wordBoundaryRegex = new RegExp(`(^|\\s)${term}`, 'i');
            if (wordBoundaryRegex.test(searchText)) {
              score += 5;
            }
            
            // More points for longer term matches
            if (term.length > 3) {
              score += term.length - 3;
            }
          }
        }
        
        // Exact event name or location match
        if (eventName === lowercaseQuery) {
          score += 50;
        }
        if (eventLocation.includes(lowercaseQuery)) {
          score += 8;
        }
        
        // Year recency bonus - more recent events score higher
        const currentYear = new Date().getFullYear();
        const yearDiff = Math.abs(event.year - currentYear);
        if (yearDiff === 0) {
          score += 15; // Current year bonus
        } else if (yearDiff === 1) {
          score += 10; // Last/next year bonus
        } else {
          score += Math.max(0, 10 - yearDiff); // Diminishing bonus for older/future events
        }
        
        return {
          event,
          score
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.event);
      
    // Cache search results
    searchCache.eventSearches[cacheKey] = {
      data: scoredEvents,
      timestamp: Date.now()
    };
      
    return scoredEvents;
    
  } catch (error) {
    console.error('Error in advanced event search:', error);
    throw error;
  }
}

// Make functions available globally for the search results page
window.advancedTeamSearch = advancedTeamSearch;
window.advancedEventSearch = advancedEventSearch;
