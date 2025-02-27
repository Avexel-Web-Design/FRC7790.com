// Search database - teams, events, and page content
const searchDatabase = {
  teams: [
    { 
      id: "7790", 
      name: "Baywatch Robotics", 
      location: "Harbor Springs, MI",
      type: "team",
      url: "team-overview.html?team=7790" 
    },
    { 
      id: "254", 
      name: "The Cheesy Poofs", 
      location: "San Jose, CA",
      type: "team",
      url: "team-overview.html?team=254" 
    },
    { 
      id: "2767", 
      name: "Stryke Force", 
      location: "Kalamazoo, MI",
      type: "team",
      url: "team-overview.html?team=2767" 
    },
    { 
      id: "217", 
      name: "ThunderChickens", 
      location: "Sterling Heights, MI",
      type: "team",
      url: "team-overview.html?team=217" 
    },
    { 
      id: "27", 
      name: "Team RUSH", 
      location: "Clarkston, MI",
      type: "team",
      url: "team-overview.html?team=27" 
    },
    { 
      id: "33", 
      name: "Killer Bees", 
      location: "Auburn Hills, MI",
      type: "team",
      url: "team-overview.html?team=33" 
    },
    { 
      id: "1918", 
      name: "NC GEARS", 
      location: "Harbor Springs, MI",
      type: "team",
      url: "team-overview.html?team=1918" 
    },
    { 
      id: "3538", 
      name: "RoboJackets", 
      location: "Flint, MI",
      type: "team",
      url: "team-overview.html?team=3538" 
    },
    { 
      id: "4004", 
      name: "M.A.R.S. Rovers", 
      location: "Harbor Beach, MI",
      type: "team",
      url: "team-overview.html?team=4004" 
    },
    { 
      id: "5676", 
      name: "SPARTRONICS", 
      location: "Traverse City, MI",
      type: "team",
      url: "team-overview.html?team=5676" 
    },
    {
      id: "302",
      name: "The Dragons",
      location: "Lake Orion, MI",
      type: "team",
      url: "team-overview.html?team=302"
    }
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
    {
      id: "2025mirec",
      name: "FIM District Recycle Rush District",
      location: "Recycle City, Michigan",
      date: "April 2-4, 2025",
      type: "event",
      url: "event.html?event=2025mirec"
    },
    {
      id: "2025mike2",
      name: "FIM District Kentwood Event",
      location: "Kentwood, Michigan",
      date: "April 9-11, 2025",
      type: "event", 
      url: "event.html?event=2025mike2"
    },
    {
      id: "2025miket",
      name: "FIM District Kettering University Event",
      location: "Flint, Michigan",
      date: "April 16-18, 2025",
      type: "event",
      url: "event.html?event=2025miket"
    },
    {
      id: "2025micmp",
      name: "FIM State Championship",
      location: "Saginaw, Michigan",
      date: "April 23-26, 2025",
      type: "event",
      url: "event.html?event=2025micmp"
    },
    {
      id: "2025cmptx",
      name: "FIRST Championship - Houston",
      location: "Houston, Texas",
      date: "May 20-23, 2025",
      type: "event",
      url: "event.html?event=2025cmptx"
    }
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

// Function to perform fuzzy search on text and highlight matches
function fuzzySearch(text, query) {
  if (!query) return { score: 0, highlighted: text };
  
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

// Search all items in the database and return results with scores
function searchAllItems(query) {
  if (!query || query.trim() === '') return [];
  
  const allItems = [
    ...searchDatabase.teams,
    ...searchDatabase.events,
    ...searchDatabase.pages
  ];
  
  // Search each item
  const results = allItems.map(item => {
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
  });
  
  // Sort results by score and return those with non-zero scores
  return results
    .filter(item => item.score > 0.05) // Minimum threshold to consider a match
    .sort((a, b) => b.score - a.score);
}

// Generate HTML for a search result
function renderSearchResult(result) {
  const badgeClass = result.type === 'team' ? 'team-badge' : 
                     result.type === 'event' ? 'event-badge' : 
                     'page-badge';
  
  const badgeText = result.type === 'team' ? 'Team' : 
                    result.type === 'event' ? 'Event' : 
                    'Page';
  
  return `
    <a href="${result.url}" class="result-card card-gradient rounded-xl p-6 block hover:shadow-lg transition-all">
      <div class="flex justify-between items-start mb-2">
        <h3 class="font-bold text-lg">${result.nameHighlighted}</h3>
        <span class="result-type-badge ${badgeClass}">${badgeText}</span>
      </div>
      <p class="text-gray-400 text-sm mb-3">${result.descriptionHighlighted}</p>
      ${result.contentHighlighted ? `<p class="text-gray-500 text-xs">${result.contentHighlighted}</p>` : ''}
      <div class="mt-3 flex items-center text-xs text-baywatch-orange">
        <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">View details</span>
        <i class="fas fa-arrow-right ml-1 transition-transform group-hover:translate-x-1"></i>
      </div>
    </a>
  `;
}

// Update the results display with the given results array
function displaySearchResults(results, query) {
  const resultsContainer = document.getElementById('search-results');
  const noResultsMessage = document.getElementById('no-results-message');
  const searchSummary = document.getElementById('search-summary');
  
  // Update counter badges
  const teamCount = results.filter(r => r.type === 'team').length;
  const eventCount = results.filter(r => r.type === 'event').length;
  const pageCount = results.filter(r => r.type === 'page').length;
  
  document.querySelector('#filter-teams .counter').textContent = teamCount;
  document.querySelector('#filter-events .counter').textContent = eventCount;
  document.querySelector('#filter-pages .counter').textContent = pageCount;
  
  // Hide loading overlay
  document.getElementById('loading-overlay').classList.add('hidden');
  
  // Handle empty results
  if (results.length === 0) {
    resultsContainer.innerHTML = '';
    noResultsMessage.classList.remove('hidden');
    searchSummary.textContent = `No results found for "${query}"`;
    return;
  }
  
  // Show results
  noResultsMessage.classList.add('hidden');
  searchSummary.textContent = `Found ${results.length} results for "${query}"`;
  
  // Generate HTML for all results
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

// Filter results by type
function filterResultsByType(results, type) {
  if (type === 'all') return results;
  return results.filter(result => result.type === type);
}

// Initialize the search results page
function initSearchPage() {
  // Get search query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  // Set the query in the search input
  const searchInput = document.getElementById('results-search-input');
  if (searchInput && query) {
    searchInput.value = query;
  }
  
  // Show loading state initially
  document.getElementById('loading-overlay').classList.remove('hidden');
  
  // If no query provided, show empty state
  if (!query) {
    document.getElementById('search-summary').textContent = 'Enter a search term to find results';
    document.getElementById('loading-overlay').classList.add('hidden');
    return;
  }
  
  // Perform search
  setTimeout(() => {
    const results = searchAllItems(query);
    
    // Store results in a global variable for filtering
    window.searchResults = results;
    
    // Display results
    displaySearchResults(results, query);
    
    // Set up filter buttons
    setupFilterButtons(results, query);
  }, 500); // Small delay for visual feedback
}

// Set up filter button event listeners
function setupFilterButtons(allResults, query) {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active-filter'));
      
      // Add active class to clicked button
      button.classList.add('active-filter');
      
      // Get filter type from button ID
      const filterType = button.id.replace('filter-', '');
      
      // Filter and display results
      const filteredResults = filterResultsByType(allResults, filterType);
      displayFilteredResults(filteredResults, query);
    });
  });
}

// Display filtered results without changing the counters
function displayFilteredResults(results, query) {
  const resultsContainer = document.getElementById('search-results');
  const noResultsMessage = document.getElementById('no-results-message');
  
  // Handle empty results
  if (results.length === 0) {
    resultsContainer.innerHTML = '';
    noResultsMessage.classList.remove('hidden');
    return;
  }
  
  // Show results
  noResultsMessage.classList.add('hidden');
  
  // Generate HTML for filtered results
  resultsContainer.innerHTML = results
    .map((result, index) => {
      // Add a staggered animation delay based on index
      const delay = 0.05 * (index % 10);
      return `
        <div class="animate__animated animate__fadeInUp" style="animation-delay: ${delay}s;">
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
    resultsSearchButton.addEventListener('click', () => {
      const query = resultsSearchInput.value.trim();
      if (query) {
        // Show loading state
        document.getElementById('loading-overlay').classList.remove('hidden');
        
        // Update URL to reflect new search
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('q', query);
        window.history.replaceState({}, '', currentUrl);
        
        // Perform new search
        setTimeout(() => {
          const results = searchAllItems(query);
          window.searchResults = results;
          displaySearchResults(results, query);
          setupFilterButtons(results, query);
        }, 300);
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
      if (!searchDatabase.teams.some(t => t.id === team.id)) {
        searchDatabase.teams.push({
          id: team.id,
          name: team.name,
          location: team.location || "Unknown location",
          type: "team",
          url: `team-overview.html?team=${team.id}`
        });
      }
    });
    
    // Add recently viewed events if stored in localStorage
    const recentEvents = JSON.parse(localStorage.getItem('recentlyViewedEvents') || '[]');
    recentEvents.forEach(event => {
      // Check if event is already in database to avoid duplicates
      if (!searchDatabase.events.some(e => e.id === event.id)) {
        searchDatabase.events.push({
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
      window.location.href = `team-overview.html?team=${searchTerm}`;
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