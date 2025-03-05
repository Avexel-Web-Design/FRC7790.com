
  
  // Helper function to fetch team status at an event
  async function fetchTeamStatusAtEvent(eventCode, teamNumber) {
    try {
      const response = await fetch(`${window.TBA_BASE_URL}/team/frc${teamNumber}/event/${eventCode}/status`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching team status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Fix: Log the data to see what we're working with
      console.log(`Fetched team status for ${teamNumber} at ${eventCode}:`, data);
      
      // Fix: If the data looks empty but response was OK, create a minimal structure
      if (data && Object.keys(data).length === 0) {
        return {
          qual: { ranking: { rank: '--', record: { wins: '--', losses: '--', ties: '--' } } },
          alliance: null,
          playoff: null
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching team status:', error);
      return null;
    }
  }
  
  // Fix: Add helper function to set fallback display when status data isn't available
  function setFallbackEventDisplay(liveUpdates, eventCode) {
    // Set fallback for ranking
    const rankingNumberEl = liveUpdates.querySelector('#ranking-number');
    if (rankingNumberEl) rankingNumberEl.textContent = '--';
  
    const qualRecordEl = liveUpdates.querySelector('#qual-record');
    if (qualRecordEl) qualRecordEl.textContent = '--W--L--T';
  
    // Set fallback for alliance
    const allianceNumberEl = liveUpdates.querySelector('#alliance-number');
    if (allianceNumberEl) allianceNumberEl.textContent = '--';
  
    const alliancePickEl = liveUpdates.querySelector('#alliance-pick');
    if (alliancePickEl) alliancePickEl.textContent = '';
  
    const partnersEl = liveUpdates.querySelector('#alliance-partners');
    if (partnersEl) partnersEl.textContent = "Data unavailable";
  
    // Set fallback for playoffs
    const playoffResultEl = liveUpdates.querySelector('#playoff-result');
    if (playoffResultEl) playoffResultEl.textContent = "Unknown";
  
    const playoffRecordEl = liveUpdates.querySelector('#playoff-record');
    if (playoffRecordEl) playoffRecordEl.textContent = "Data unavailable";
  
    // Add data unavailable message
    const statusIndicator = document.createElement('div');
    statusIndicator.className = 'mt-4 text-center';
    statusIndicator.innerHTML = `
      <div class="inline-block px-3 py-1 bg-gray-500/20 rounded-full text-gray-400 text-sm">
        <i class="fas fa-exclamation-circle mr-1"></i> Some data unavailable
      </div>
    `;
    liveUpdates.appendChild(statusIndicator);
    
    // Log event code for debugging
    console.log(`Fallback display set for event ${eventCode}`);
  }
  
  // Fix: Add helper function to set qualification pending display
  function setQualificationPendingDisplay(liveUpdates) {
    // Update alliance number to show pending status
    const allianceNumberEl = liveUpdates.querySelector('#alliance-number');
    if (allianceNumberEl) allianceNumberEl.innerHTML = `<i class="fas fa-question-circle"></i>`;
  
    const alliancePickEl = liveUpdates.querySelector('#alliance-pick');
    if (alliancePickEl) alliancePickEl.textContent = 'Pending';
  
    const partnersEl = liveUpdates.querySelector('#alliance-partners');
    if (partnersEl) partnersEl.textContent = "Qualification pending";
  
    // Update playoff section to show pending status
    const playoffResultEl = liveUpdates.querySelector('#playoff-result');
    if (playoffResultEl) {
      playoffResultEl.className = 'text-2xl font-bold text-gray-400';
      playoffResultEl.innerHTML = `<i class="fas fa-question-circle"></i>`;
    }
  
    const playoffRecordEl = liveUpdates.querySelector('#playoff-record');
    if (playoffRecordEl) playoffRecordEl.textContent = "Qualification pending";
  }
  
  // Helper function to fetch event awards
  async function fetchEventAwards(eventCode) {
    try {
      const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/awards`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching event awards: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching event awards:', error);
      return [];
    }
  }
  
  // Helper function to get the playoff stage name based on level
  function getPlayoffStageName(level) {
    switch(level) {
      case 'f':
        return 'Finals';
      case 'sf':
        return 'Semifinals';
      case 'qf':
        return 'Quarterfinals';
      case 'ef':
        return 'Octofinals'; // (Eighth-finals)
      case 'qm':
        return 'Qualification Matches';
      default:
        return level ? `Level: ${level}` : '';
    }
  }
  
  // Helper function to determine playoff placement based on level and alliance number
  function determinePlayoffPlacement(level, allianceNumber) {
    // Default styling
    let placementClass = 'text-red-500';
    let placementText = 'Eliminated';
    
    // If we reached finals but lost, we're 2nd place
    if (level === 'f') {
      placementText = '2nd Place';
      placementClass = 'text-silver';
      return { placementText, placementClass };
    }
    
    // If we reached semifinals
    if (level === 'sf') {
      placementText = '3rd Place';
      placementClass = 'text-baywatch-orange';
      return { placementText, placementClass };
    }
    
    // Default case where we can't determine exact placement
    return { placementText, placementClass };
  }
  
  // Helper function to fetch detailed playoff results to determine exact placement
  async function fetchDetailedPlayoffResults(eventCode, teamStatus) {
    try {
      // Default to the basic placement in case specific match info isn't available
      const playoffLevel = teamStatus.playoff.level;
      const allianceNumber = teamStatus.playoff.alliance;
      const basicPlacement = determinePlayoffPlacement(playoffLevel, allianceNumber);
      
      // For teams eliminated in semifinals, we need to check which specific match they were eliminated in
      if (playoffLevel === 'sf') {
        // Fetch the playoff match results
        const response = await fetch(`${window.TBA_BASE_URL}/event/${eventCode}/matches/playoff`, {
          headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching playoff matches: ${response.status}`);
        }
        
        const matches = await response.json();
        const sfMatches = matches.filter(m => m.comp_level === 'sf');
        
        // Find the specific match where our team's alliance was eliminated
        const ourAlliance = `frc7790`;
        let ourLastMatch = null;
        
        for (const match of sfMatches) {
          const redAlliance = match.alliances.red.team_keys;
          const blueAlliance = match.alliances.blue.team_keys;
          
          if (redAlliance.includes(ourAlliance) || blueAlliance.includes(ourAlliance)) {
            if (!ourLastMatch || match.match_number > ourLastMatch.match_number) {
              ourLastMatch = match;
            }
          }
        }
        
        if (ourLastMatch) {
          // Match 13 is semifinal 2, which determines 3rd place
          // Match 12 is semifinal 1, which determines 4th place
          if (ourLastMatch.match_number === 13 || ourLastMatch.key.endsWith('_sf2m3')) {
            return {
              placementText: '3rd Place',
              placementClass: 'text-baywatch-orange'
            };
          } else if (ourLastMatch.match_number === 12 || ourLastMatch.key.endsWith('_sf1m3')) {
            return {
              placementText: '4th Place',
              placementClass: 'text-baywatch-orange'
            };
          }
        }
        
        // If we couldn't determine exact match, return the basic placement
        return basicPlacement;
      }
      
      // For quarterfinals, we can potentially distinguish 5th-8th places 
      if (playoffLevel === 'qf') {
        // Strategy: Check if team won any QF matches - teams winning at least one match
        // generally performed better than those who didn't win any
        const response = await fetch(`${window.TBA_BASE_URL}/team/${ourAlliance}/event/${eventCode}/matches`, {
          headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching team matches: ${response.status}`);
        }
        
        const matches = await response.json();
        const qfMatches = matches.filter(m => m.comp_level === 'qf');
        
        // Check if we won any quarterfinal matches
        const ourAlliance = `frc7790`;
        let wonAnyMatch = false;
        
        for (const match of qfMatches) {
          const redAlliance = match.alliances.red.team_keys;
          const blueAlliance = match.alliances.blue.team_keys;
          let ourAllianceColor = null;
          
          if (redAlliance.includes(ourAlliance)) {
            ourAllianceColor = 'red';
          } else if (blueAlliance.includes(ourAlliance)) {
            ourAllianceColor = 'blue';
          }
          
          if (ourAllianceColor && match.winning_alliance === ourAllianceColor) {
            wonAnyMatch = true;
            break;
          }
        }
      }
      
      // For other playoff levels, return the basic placement
      return basicPlacement;
    } catch (error) {
      console.error('Error determining detailed playoff placement:', error);
      // Fall back to basic placement if we hit any errors
      return determinePlayoffPlacement(teamStatus.playoff.level, teamStatus.playoff.alliance);
    }
  }
  
  // Add these styles to support silver/bronze colors
  document.addEventListener('DOMContentLoaded', function() {
    // Add custom colors for silver and bronze medals
    const style = document.createElement('style');
    style.textContent = `
      .text-silver {
        color: #C0C0C0;
      }
      .text-bronze {
        color: #CD7F32;
      }
    `;
    document.head.appendChild(style);
  });