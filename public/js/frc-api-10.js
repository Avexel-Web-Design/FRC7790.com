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
    const response = await fetch(`${window.TBA_BASE_URL}/district/${districtKey}/rankings`, {
      headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching district rankings: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching district rankings:', error);
    return [];
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
  const year = districtKey.substring(0, 4);
  const code = districtKey.substring(4);
  tbaLink.href = `https://www.thebluealliance.com/events/${code}/${year}#rankings`;
}

// Function to update the rankings table
async function updateRankingsTable(data, tableBodyElement) {
  try {
    // Handle case where the tableBodyElement is not provided
    if (!tableBodyElement) {
      const rankingsTable = document.getElementById('rankings-table');
      if (!rankingsTable) {
        console.error('Rankings table element not found');
        return;
      }
      
      tableBodyElement = rankingsTable.querySelector('tbody');
      if (!tableBodyElement) {
        console.error('Rankings table body not found');
        return;
      }
    }

    // Clear any existing content
    tableBodyElement.innerHTML = '';
    
    // Get rankings data
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
    
    // Build table rows
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
    
  } catch (error) {
    console.error('Error updating rankings table:', error);
    
    // Show error in table
    if (tableBodyElement) {
      tableBodyElement.innerHTML = `
        <tr>
          <td colspan="5" class="p-8 text-center">
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

// Function to show error message
function showError() {
  document.getElementById('error-message').classList.remove('hidden');
  document.getElementById('district-links').classList.add('hidden');
  document.getElementById('rankings-section').classList.add('hidden');
}

// Function to load district rankings
async function loadDistrictRankings(districtKey) {
  if (!districtKey) {
    showError();
    return;
  }
  
  // Fetch district info
  const districts = await fetchDistrictList();
  const district = districts.find(d => d.key === districtKey);
  
  if (!district) {
    showError();
    return;
  }
  
  // Update page title and district name
  document.title = `${district.display_name} Rankings - Baywatch Robotics | FRC Team 7790`;
  document.getElementById('district-name').textContent = district.display_name;
  
  // Show sections
  document.getElementById('district-links').classList.remove('hidden');
  document.getElementById('rankings-section').classList.remove('hidden');
  document.getElementById('error-message').classList.add('hidden');
  
  // Update external links
  updateExternalLinks(districtKey);
  
  // Fetch and display rankings
  const rankings = await fetchDistrictRankings(districtKey);
  await updateRankingsTable(rankings);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const districtKey = urlParams.get('district');
  loadDistrictRankings(districtKey);
});