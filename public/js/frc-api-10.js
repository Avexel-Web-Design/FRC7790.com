// Helper function to fetch district list for the current year
async function fetchDistrictList(year = new Date().getFullYear()) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/districts/${year}`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching districts: ${response.status}`);
    }
    
    const districts = await response.json();
    return districts;
  } catch (error) {
    console.error('Error fetching district list:', error);
    return [];
  }
}

// Helper function to fetch district rankings
async function fetchDistrictRankings(districtKey) {
  try {
    const year = districtKey.substring(0, 4);
    const response = await fetch(`${window.TBA_BASE_URL}/district/${districtKey}/rankings`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching district rankings: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching district rankings:', error);
    return null;
  }
}

// Helper function to fetch team details for displaying names
async function fetchTeamDetails(teamNumber) {
  try {
    const response = await fetch(`${window.TBA_BASE_URL}/team/frc${teamNumber}`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching team details: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching details for team ${teamNumber}:`, error);
    return null;
  }
}

// Function to update external links
function updateExternalLinks(districtKey) {
  const tbaLink = document.getElementById('tba-district-link');
  if (!tbaLink) return;
  
  const year = districtKey.substring(0, 4);
  const code = districtKey.substring(4);
  tbaLink.href = `https://www.thebluealliance.com/district/${code}/${year}`;
}

// Function to show error message
function showError() {
  document.getElementById('district-links')?.classList.add('hidden');
  document.getElementById('rankings-section')?.classList.add('hidden');
  document.getElementById('error-message')?.classList.remove('hidden');
}

// Global variable to store the rankings data for sorting
let districtRankingsData = [];

// Function to update the rankings table
async function updateRankingsTable(data, tableBodyElement) {
  try {
    // Default to the rankings-table tbody if no element provided
    if (!tableBodyElement) {
      // First try district-rankings-table (for district page)
      let table = document.getElementById('district-rankings-table');
      
      // If not found, try rankings-table (for event page)
      if (!table) {
        table = document.getElementById('rankings-table');
      }
      
      if (!table) {
        throw new Error('Rankings table element not found');
      }
      
      tableBodyElement = table.querySelector('tbody');
      if (!tableBodyElement) {
        throw new Error('Rankings table body not found');
      }
    }

    // Handle district rankings data (array of team objects)
    if (Array.isArray(data)) {
      // This is district rankings data
      
      // Store the data globally for sorting
      districtRankingsData = data;
      
      // Handle no rankings data
      if (data.length === 0) {
        tableBodyElement.innerHTML = `
          <tr>
            <td colspan="8" class="p-8 text-center">
              <div class="flex flex-col items-center justify-center">
                <i class="fas fa-chart-line text-gray-600 text-4xl mb-3"></i>
                <p class="text-lg text-gray-400">No rankings available yet</p>
                <p class="text-sm text-gray-500 mt-2">Check back during the season</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      // Update team count for district page
      const teamCountEl = document.getElementById('district-team-count');
      if (teamCountEl) {
        teamCountEl.textContent = data.length;
      }

      // Fetch all team details in parallel to improve performance
      const teamDetailsPromises = data.map(team => {
        const teamNumber = team.team_key.replace('frc', '');
        return fetchTeamDetails(teamNumber).then(details => {
          return { teamNumber, nickname: details?.nickname || 'Unknown Team' };
        });
      });
      
      // Wait for all team details to load
      const teamDetails = await Promise.all(teamDetailsPromises);
      
      // Create a map for quick lookup
      const teamNameMap = {};
      teamDetails.forEach(team => {
        teamNameMap[team.teamNumber] = team.nickname;
      });

      // Now render the table with the team details
      await renderDistrictRankingsTable(data, tableBodyElement, teamNameMap);
      
      // Add sorting functionality to table headers
      setupTableSorting();
    }
    // Handle event rankings data (with rankings property)
    else if (data && data.rankings) {
      // This is event rankings data
      const rankings = data.rankings || [];
      
      if (rankings.length === 0) {
        tableBodyElement.innerHTML = `
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
      
      // Build table rows for event rankings
      const rows = rankings.map(team => {
        const teamNumber = team.team_key.replace('frc', '');
        const is7790 = teamNumber === '7790';
        const teamClass = is7790 ? 'bg-baywatch-orange/30 font-bold' : '';
        
        return `
          <tr class="${teamClass} hover:bg-black/40 transition-colors">
            <td class="p-4 font-semibold">${team.rank}</td>
            <td class="p-4">
              <a href="team.html?team=${teamNumber}" class="text-baywatch-orange hover:underline">
                ${teamNumber}
              </a>
            </td>
            <td class="p-4">${team.extra_stats[0].toFixed(2)}</td>
            <td class="p-4">${team.record.wins}-${team.record.losses}-${team.record.ties}</td>
            <td class="p-4">${team.sort_orders[0].toFixed(2)}</td>
          </tr>
        `;
      }).join('');
      
      // Update table content
      tableBodyElement.innerHTML = rows;
      
      // Update ranking count if the element exists
      const countElement = document.getElementById('ranking-count');
      if (countElement) {
        countElement.textContent = rankings.length;
      }
    } 
    // Handle empty/invalid data
    else {
      tableBodyElement.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center">
            <div class="flex flex-col items-center justify-center">
              <i class="fas fa-chart-line text-gray-600 text-4xl mb-3"></i>
              <p class="text-lg text-gray-400">No rankings available yet</p>
              <p class="text-sm text-gray-500 mt-2">Check back during the event</p>
            </div>
          </td>
        </tr>
      `;
    }
    
  } catch (error) {
    console.error('Error updating rankings table:', error);
    
    // Show error in table
    if (tableBodyElement) {
      tableBodyElement.innerHTML = `
        <tr>
          <td colspan="8" class="p-8 text-center">
            <div class="flex flex-col items-center justify-center">
              <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-3"></i>
              <p class="text-lg text-gray-400">Error displaying rankings</p>
              <p class="text-sm text-gray-500 mt-2">${error.message || 'Please try again later'}</p>
            </div>
          </td>
        </tr>
      `;
    }
  }
}

// New function to render the district rankings table
async function renderDistrictRankingsTable(data, tableBodyElement, teamNameMap) {
  // Build table rows for district rankings
  const rows = data.map(team => {
    const teamNumber = team.team_key.replace('frc', '');
    const is7790 = teamNumber === '7790';
    const teamClass = is7790 ? 'bg-baywatch-orange/30 font-bold' : '';
    
    // Get team name from our map
    const teamName = teamNameMap[teamNumber] || 'Unknown Team';

    // Format event points safely
    const formatPoints = (points) => {
      if (typeof points === 'number') {
        return points.toFixed(1);
      }
      return '0.0';
    };

    // Get individual event points from the event_points array structure
    let event1Points = '0.0';
    let event2Points = '0.0';
    let dcmpPoints = '0.0';
    
    // Process each event in the event_points array
    if (Array.isArray(team.event_points)) {
      team.event_points.forEach((event, index) => {
        // Each event entry should have total and event_key properties
        if (event && typeof event.total === 'number') {
          const isChampionship = event.event_key && event.event_key.includes('dcmp');
          
          if (isChampionship) {
            dcmpPoints = formatPoints(event.total);
          } else if (index === 0) {
            event1Points = formatPoints(event.total);
          } else if (index === 1) {
            event2Points = formatPoints(event.total);
          }
        }
      });
    }
    
    // If we didn't find DCMP points in event_points, use the district_cmp_points field
    if (dcmpPoints === '0.0' && typeof team.district_cmp_points === 'number') {
      dcmpPoints = formatPoints(team.district_cmp_points);
    }
    
    const rookieBonus = typeof team.rookie_bonus === 'number' ? formatPoints(team.rookie_bonus) : '0.0';
    const totalPoints = typeof team.point_total === 'number' ? formatPoints(team.point_total) : '0.0';

    return `
      <tr class="${teamClass} hover:bg-black/40 transition-colors">
        <td class="p-4 font-semibold">${team.rank}</td>
        <td class="p-4">
          <a href="team.html?team=${teamNumber}" class="text-baywatch-orange hover:underline">
            ${teamNumber}
          </a>
        </td>
        <td class="p-4">${teamName}</td>
        <td class="p-4 font-semibold">${totalPoints}</td>
        <td class="p-4">${event1Points}</td>
        <td class="p-4">${event2Points}</td>
        <td class="p-4">${dcmpPoints}</td>
        <td class="p-4">${rookieBonus}</td>
      </tr>
    `;
  }).join('');
  
  tableBodyElement.innerHTML = rows;
}

// Modified function to set up the table sorting functionality - removing arrows
function setupTableSorting() {
  const table = document.getElementById('district-rankings-table');
  if (!table) return;
  
  const headers = table.querySelectorAll('th');
  
  // Add click handlers to each header
  headers.forEach((header, index) => {
    // Add cursor pointer to indicate it's clickable
    header.style.cursor = 'pointer';
    
    // Track sorting state (1 = ascending, -1 = descending, 0 = default order)
    header.sortDirection = 0;
    
    // Add click event listener
    header.addEventListener('click', () => {
      // Update all headers
      headers.forEach(h => {
        if (h !== header) {
          h.sortDirection = 0;
        }
      });
      
      // Update this header's sort direction
      header.sortDirection = header.sortDirection === 1 ? -1 : 1;
      
      // Sort the table based on the column
      sortDistrictTable(index, header.sortDirection);
    });
  });
}

// Function to sort the district rankings table
function sortDistrictTable(columnIndex, direction) {
  if (!districtRankingsData || !Array.isArray(districtRankingsData)) return;
  
  // Make a copy of the data to sort
  let sortedData = [...districtRankingsData];
  
  // Sort based on column index
  sortedData.sort((a, b) => {
    let aValue, bValue;
    
    switch(columnIndex) {
      case 0: // Rank
        aValue = a.rank;
        bValue = b.rank;
        break;
        
      case 1: // Team Number
        aValue = parseInt(a.team_key.replace('frc', ''));
        bValue = parseInt(b.team_key.replace('frc', ''));
        break;
        
      case 2: // Team Name - requires special handling
        // Since we don't have direct access to names here, sort by team number as fallback
        aValue = parseInt(a.team_key.replace('frc', ''));
        bValue = parseInt(b.team_key.replace('frc', ''));
        break;
        
      case 3: // Total Points
        aValue = a.point_total || 0;
        bValue = b.point_total || 0;
        break;
        
      case 4: // Event 1
        const aEvent1 = Array.isArray(a.event_points) && a.event_points[0] ? a.event_points[0].total || 0 : 0;
        const bEvent1 = Array.isArray(b.event_points) && b.event_points[0] ? b.event_points[0].total || 0 : 0;
        aValue = aEvent1;
        bValue = bEvent1;
        break;
        
      case 5: // Event 2
        const aEvent2 = Array.isArray(a.event_points) && a.event_points[1] ? a.event_points[1].total || 0 : 0;
        const bEvent2 = Array.isArray(b.event_points) && b.event_points[1] ? b.event_points[1].total || 0 : 0;
        aValue = aEvent2;
        bValue = bEvent2;
        break;
        
      case 6: // DCMP
        // First check for DCMP in event_points
        let aDcmp = 0;
        let bDcmp = 0;
        
        if (Array.isArray(a.event_points)) {
          a.event_points.forEach(event => {
            if (event && event.event_key && event.event_key.includes('dcmp')) {
              aDcmp = event.total || 0;
            }
          });
        }
        
        if (Array.isArray(b.event_points)) {
          b.event_points.forEach(event => {
            if (event && event.event_key && event.event_key.includes('dcmp')) {
              bDcmp = event.total || 0;
            }
          });
        }
        
        // If not found in event_points, use district_cmp_points
        if (aDcmp === 0 && typeof a.district_cmp_points === 'number') {
          aDcmp = a.district_cmp_points;
        }
        
        if (bDcmp === 0 && typeof b.district_cmp_points === 'number') {
          bDcmp = b.district_cmp_points;
        }
        
        aValue = aDcmp;
        bValue = bDcmp;
        break;
        
      case 7: // Rookie Bonus
        aValue = a.rookie_bonus || 0;
        bValue = b.rookie_bonus || 0;
        break;
        
      default:
        aValue = 0;
        bValue = 0;
    }
    
    // Compare the values based on direction
    if (aValue === bValue) {
      return 0;
    } else {
      return direction * (aValue > bValue ? 1 : -1);
    }
  });
  
  // Re-render the table with sorted data
  const tableBodyElement = document.querySelector('#district-rankings-table tbody');
  if (tableBodyElement) {
    fetchTeamDetailsForSortedData(sortedData, tableBodyElement);
  }
}

// Helper function to fetch team details for sorted data and render the table
async function fetchTeamDetailsForSortedData(sortedData, tableBodyElement) {
  // Show loading indicator
  tableBodyElement.innerHTML = `
    <tr>
      <td colspan="8" class="p-4 text-center">
        <div class="animate-pulse text-gray-400">
          <i class="fas fa-spinner fa-spin mr-2"></i> Sorting rankings...
        </div>
      </td>
    </tr>
  `;
  
  // Fetch all team details in parallel
  const teamDetailsPromises = sortedData.map(team => {
    const teamNumber = team.team_key.replace('frc', '');
    return fetchTeamDetails(teamNumber).then(details => {
      return { teamNumber, nickname: details?.nickname || 'Unknown Team' };
    });
  });
  
  // Wait for all team details to load
  const teamDetails = await Promise.all(teamDetailsPromises);
  
  // Create a map for quick lookup
  const teamNameMap = {};
  teamDetails.forEach(team => {
    teamNameMap[team.teamNumber] = team.nickname;
  });
  
  // Render the table with sorted data
  renderDistrictRankingsTable(sortedData, tableBodyElement, teamNameMap);
}

// Function to load district rankings
async function loadDistrictRankings(districtKey) {
  if (!districtKey) {
    showError();
    return;
  }
  
  try {
    // Fetch district info
    const year = districtKey.substring(0, 4);
    const districts = await fetchDistrictList(year);
    const district = districts.find(d => d.key === districtKey);
    
    if (!district) {
      showError();
      return;
    }
    
    // Update page title and district name
    document.title = `${district.display_name} Rankings - Baywatch Robotics | FRC Team 7790`;
    document.getElementById('district-name').textContent = district.display_name;
    
    // Show sections
    document.getElementById('district-links')?.classList.remove('hidden');
    document.getElementById('rankings-section')?.classList.remove('hidden');
    document.getElementById('error-message')?.classList.add('hidden');
    
    // Update external links
    updateExternalLinks(districtKey);
    
    // Fetch and display rankings
    const rankings = await fetchDistrictRankings(districtKey);
    if (!rankings) {
      showError();
      return;
    }
    
    await updateRankingsTable(rankings);
  } catch (error) {
    console.error('Error loading district rankings:', error);
    showError();
  }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const districtKey = urlParams.get('district');
  loadDistrictRankings(districtKey);
});