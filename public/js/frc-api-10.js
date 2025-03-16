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

// Function to update the rankings table
async function updateRankingsTable(data, tableBodyElement) {
  try {
    // Default to the rankings-table tbody if no element provided
    if (!tableBodyElement) {
      const table = document.getElementById('district-rankings-table');
      if (!table) {
        throw new Error('Rankings table element not found');
      }
      tableBodyElement = table.querySelector('tbody');
      if (!tableBodyElement) {
        throw new Error('Rankings table body not found');
      }
    }

    // Handle no rankings data
    if (!data || !Array.isArray(data)) {
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

    // Update team count
    const teamCountEl = document.getElementById('district-team-count');
    if (teamCountEl) {
      teamCountEl.textContent = data.length;
    }

    // Build table rows
    const rows = await Promise.all(data.map(async (team) => {
      const teamNumber = team.team_key.replace('frc', '');
      const is7790 = teamNumber === '7790';
      const teamClass = is7790 ? 'bg-baywatch-orange/30 font-bold' : '';
      
      // Fetch team name
      const teamDetails = await fetchTeamDetails(teamNumber);
      const teamName = teamDetails?.nickname || 'Unknown Team';

      // Format event points safely
      const formatPoints = (points) => {
        if (typeof points === 'number') {
          return points.toFixed(1);
        }
        return '0.0';
      };

      // Get event points safely
      const event1Points = team.event_points && team.event_points.length > 0 ? formatPoints(team.event_points[0]) : '0.0';
      const event2Points = team.event_points && team.event_points.length > 1 ? formatPoints(team.event_points[1]) : '0.0';
      const dcmpPoints = typeof team.district_cmp_points === 'number' ? formatPoints(team.district_cmp_points) : '0.0';
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
    }));
    
    tableBodyElement.innerHTML = rows.join('');
    
  } catch (error) {
    console.error('Error updating rankings table:', error);
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