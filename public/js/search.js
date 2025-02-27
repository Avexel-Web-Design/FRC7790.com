document.addEventListener('DOMContentLoaded', function() {
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
      window.location.href = `team-overview.html?team=${searchTerm}`;
    } 
    // If input matches an exact event code pattern
    else if (/^\d{4}[a-z0-9]+$/.test(searchTerm)) {
      // It's a complete event code with year
      window.location.href = `event.html?event=${searchTerm}`;
    }
    // Check if it might be an event code without year (e.g. "milac")
    else if (/^[a-z]{2,6}[0-9]?$/i.test(searchTerm)) {
      // Add current year to the event code and go to event page
      const currentYear = new Date().getFullYear();
      window.location.href = `event.html?event=${currentYear}${searchTerm.toLowerCase()}`;
    }
    // Otherwise, perform a search
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
});
