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
async function updateRankingsTable(rankings) {
  const tbody = document.querySelector('#district-rankings-table tbody');
  
  if (!rankings || rankings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">No rankings available for this district</td></tr>';
    return;
  }
  
  // Update team count
  document.getElementById('district-team-count').textContent = rankings.length;
  
  // Fetch team details for all teams in parallel
  const teamDetails = await Promise.all(
    rankings.map(r => fetchTeamDetails(r.team_key.replace('frc', '')))
  );
  
  const html = rankings.map((ranking, index) => {
    const team = teamDetails[index];
    const teamNumber = ranking.team_key.replace('frc', '');
    
    // Sort events chronologically
    const sortedEvents = [...ranking.event_points].sort((a, b) => {
      // District Championship should always be last
      if (a.district_cmp) return 1;
      if (b.district_cmp) return -1;
      return a.event_key.localeCompare(b.event_key);
    });

    // Get points for events in order (first event, second event, championship)
    const eventPoints = ['0', '0', '0']; // Default values
    sortedEvents.forEach((event, idx) => {
      if (idx < 3) { // Only consider first 3 events
        eventPoints[idx] = event.total;
      }
    });
    
    return `
      <tr class="border-t border-gray-700 hover:bg-black/50 transition-colors">
        <td class="p-4">${ranking.rank}</td>
        <td class="p-4">
          <a href="team.html?team=${teamNumber}" 
             class="text-baywatch-orange hover:text-white transition-colors">
            ${teamNumber}
          </a>
        </td>
        <td class="p-4">${team ? team.nickname : 'Unknown'}</td>
        <td class="p-4">${ranking.point_total}</td>
        <td class="p-4">${eventPoints[0]}</td>
        <td class="p-4">${eventPoints[1]}</td>
        <td class="p-4">${eventPoints[2]}</td>
        <td class="p-4">${ranking.rookie_bonus || 0}</td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html;
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