/*
 * FRC API Module 5 - Visualization & Series Tracking
 * 
 * This file handles visual elements including the reef node visualization for the
 * 2025 game and playoff series tracking. Provides detailed representations of game
 * elements and playoff elimination match status for best-of-three series.
 */

// New function to generate visual representation of reef nodes
function generateReefVisualization(blueBreakdown, redBreakdown) {
    // Helper function to generate node visualization for a single alliance
    const generateAllianceReef = (breakdown, allianceColor) => {
      const autoReef = breakdown.autoReef || { topRow: {}, midRow: {}, botRow: {} };
      const teleopReef = breakdown.teleopReef || { topRow: {}, midRow: {}, botRow: {} };
      
      // Function to determine node state class
      const getNodeClass = (row, node) => {
        const autoState = autoReef[row][node] === true;
        const teleopState = teleopReef[row][node] === true;
        
        if (autoState) return `${allianceColor}-auto-node`;
        if (teleopState) return `${allianceColor}-teleop-node`;
        return 'empty-node';
      };
      
      // Generate HTML for all nodes in the reef
      const generateRowHtml = (rowName) => {
        let rowHtml = `<div class="reef-row">`;
        
        // Generate nodes A through L
        for (let i = 0; i < 12; i++) {
          const nodeLetter = String.fromCharCode(65 + i); // Convert 0-11 to A-L
          const nodeId = `node${nodeLetter}`;
          const nodeClass = getNodeClass(rowName, nodeId);
          rowHtml += `<div class="reef-node ${nodeClass}"></div>`;
        }
        
        rowHtml += '</div>';
        return rowHtml;
      };
      
      return `
        <div class="reef-container ${allianceColor}-reef">
          <h4 class="reef-title ${allianceColor === 'blue' ? 'text-blue-400' : 'text-red-400'}">${allianceColor.toUpperCase()} ALLIANCE REEF</h4>
          ${generateRowHtml('topRow')}
          ${generateRowHtml('midRow')}
          ${generateRowHtml('botRow')}
        </div>
      `;
    };
    
    // Combine both alliances
    return `
      <div class="reef-visualization mb-8">
        <h3 class="text-xl font-bold text-baywatch-orange mb-4">Reef Node Placement</h3>
        <div class="reefs-container">
          ${generateAllianceReef(blueBreakdown, 'blue')}
          <div class="reef-divider"></div>
          ${generateAllianceReef(redBreakdown, 'red')}
        </div>
        <div class="reef-legend">
          <div class="legend-item"><span class="legend-swatch blue-auto-node"></span> Auto Coral</div>
          <div class="legend-item"><span class="legend-swatch blue-teleop-node"></span> Teleop Coral</div>
          <div class="legend-item"><span class="legend-swatch empty-node"></span> Empty Node</div>
        </div>
        <style>
          .reef-visualization {
            background: rgba(0,0,0,0.3);
            border-radius: 0.75rem;
            padding: 1rem;
            width: 100%;
          }
          .reefs-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            width: 100%;
          }
          .reef-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,107,0,0.3), transparent);
            margin: 0.5rem 0;
            width: 100%;
          }
          .reef-container {
            flex: 1;
            border-radius: 0.5rem;
            padding: 0.75rem;
            background: rgba(0,0,0,0.2);
            width: 100%;
          }
          .blue-reef {
            border: 1px solid rgba(59, 130, 246, 0.3);
          }
          .red-reef {
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .reef-title {
            text-align: center;
            margin-bottom: 0.75rem;
            font-weight: 600;
          }
          .reef-row {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
            width: 100%;
          }
          .reef-node {
            flex: 1;
            aspect-ratio: 1/1;
            max-width: calc(8.33% - 4px);
            margin: 0 2px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .empty-node {
            background-color: rgba(255,255,255,0.05);
          }
          .blue-auto-node {
            background-color: rgba(37, 99, 235, 0.9);
            border-color: rgba(37, 99, 235, 1);
          }
          .blue-teleop-node {
            background-color: rgba(37, 99, 235, 0.5);
            border-color: rgba(37, 99, 235, 0.7);
          }
          .red-auto-node {
            background-color: rgba(220, 38, 38, 0.9);
            border-color: rgba(220, 38, 38, 1);
          }
          .red-teleop-node {
            background-color: rgba(220, 38, 38, 0.5);
            border-color: rgba(220, 38, 38, 0.7);
          }
          .reef-legend {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }
          .legend-item {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
            color: #aaa;
          }
          .legend-swatch {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 0.3rem;
          }
        </style>
      </div>
    `;
  }
  
  // New function to fetch all playoff matches for a specific event and set
  async function fetchSeriesMatches(eventKey, compLevel, setNumber) {
    try {
      // Fetch all matches for this event
      const response = await fetch(`${window.TBA_BASE_URL}/event/${eventKey}/matches`, {
        headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
      });
      
      if (!response.ok) throw new Error('Failed to fetch matches');
      
      const matches = await response.json();
      
      // Filter to get only this playoff series
      return matches.filter(match => 
        match.comp_level === compLevel && 
        (compLevel === 'f' || match.set_number === setNumber)
      ).sort((a, b) => a.match_number - b.match_number);
      
    } catch (error) {
      console.error('Error fetching series matches:', error);
      return [];
    }
  }
  
  // New function to display playoff series status for a match
  async function updatePlayoffSeriesInfo(matchData) {
    // Check if this is a playoff match
    if (matchData.comp_level !== 'sf' && matchData.comp_level !== 'f') return;
    
    try {
      const eventKey = matchData.event_key;
      const compLevel = matchData.comp_level;
      const setNumber = matchData.set_number;
      
      // Get all matches in this series
      const seriesMatches = await fetchSeriesMatches(eventKey, compLevel, setNumber);
      
      if (seriesMatches.length === 0) return;
      
      // Count wins for each alliance
      let blueWins = 0;
      let redWins = 0;
      
      seriesMatches.forEach(match => {
        if (match.winning_alliance === 'blue') blueWins++;
        else if (match.winning_alliance === 'red') redWins++;
      });
      
      // Create series indicator element if it doesn't exist
      let seriesIndicator = document.getElementById('playoff-series-indicator');
      if (!seriesIndicator) {
        const resultBanner = document.getElementById('match-result-banner');
        
        seriesIndicator = document.createElement('div');
        seriesIndicator.id = 'playoff-series-indicator';
        seriesIndicator.className = 'mt-4 p-4 rounded-lg text-center';
        
        // Insert before or after the result banner
        if (resultBanner) {
          resultBanner.parentNode.insertBefore(seriesIndicator, resultBanner.nextSibling);
        } else {
          document.getElementById('score-container').appendChild(seriesIndicator);
        }
      }
      
      // Update series indicator content
      let seriesStatus = '';
      
      if (compLevel === 'sf') {
        seriesStatus = `Semifinal ${setNumber}`;
      } else {
        seriesStatus = 'Finals: Best of 3';
      }
      
      const blueLeading = blueWins > redWins;
      const redLeading = redWins > blueWins;
      const seriesTied = blueWins === redWins;
      const seriesOver = blueWins === 2 || redWins === 2;
      
      // Format: [Blue] 2 - 1 [Red] (Blue Advances)
      seriesIndicator.innerHTML = `
        <div class="text-lg font-semibold mb-2">${seriesStatus}</div>
        <div class="flex items-center justify-center gap-3">
          <span class="text-blue-400 font-bold ${blueLeading ? 'text-2xl' : ''}">${blueWins}</span>
          <span class="text-gray-400">-</span>
          <span class="text-red-400 font-bold ${redLeading ? 'text-2xl' : ''}">${redWins}</span>
        </div>
        
        ${seriesOver ? `
          <div class="mt-2 ${blueWins > redWins ? 'text-blue-400' : 'text-red-400'} font-medium">
            ${blueWins > redWins ? 'Blue Alliance' : 'Red Alliance'} wins series
          </div>
        ` : ''}
      `;
      
      // Add styling based on series state
      seriesIndicator.classList.remove('blue-series-leading', 'red-series-leading', 'series-tied');
      if (blueLeading) {
        seriesIndicator.classList.add('blue-series-leading');
      } else if (redLeading) {
        seriesIndicator.classList.add('red-series-leading');
      } else {
        seriesIndicator.classList.add('series-tied');
      }
    } catch (error) {
      console.error('Error updating playoff series:', error);
    }
  }
  
  // Update team details section with match-specific playoff data
  async function updateTeamDetails(matchData, teamData) {
    const teamDetailsElement = document.getElementById('team-details');
    
    // Create a map of team keys to team data for quick lookup
    const teamMap = {};
    teamData.forEach(team => {
      teamMap[team.key] = team;
    });
    
    // Determine if this is a playoff match
    const isPlayoff = matchData.comp_level !== 'qm';
    let allianceLabels = {};
    
    // For playoff matches, fetch the alliance data
    if (isPlayoff) {
      try {
        const response = await fetch(`${window.TBA_BASE_URL}/event/${matchData.event_key}/alliances`, {
          headers: { "X-TBA-Auth-Key": window.TBA_AUTH_KEY }
        });
        
        if (response.ok) {
          const alliances = await response.json();
          // Create mapping of team keys to alliance numbers
          const allianceMap = {};
          alliances.forEach((alliance, index) => {
            const allianceNum = index + 1;
            alliance.picks.forEach(teamKey => {
              allianceMap[teamKey] = allianceNum;
            });
          });
          
          // Set alliance labels based on team lookup
          const blueFirstTeam = matchData.alliances.blue.team_keys[0];
          const redFirstTeam = matchData.alliances.red.team_keys[0];
          allianceLabels = {
            blue: `Alliance ${allianceMap[blueFirstTeam] || '?'}`,
            red: `Alliance ${allianceMap[redFirstTeam] || '?'}`
          };
        }
      } catch (error) {
        console.error('Error fetching alliance data:', error);
        // Fallback to generic labels if fetch fails
        allianceLabels = {
          blue: 'Blue Alliance',
          red: 'Red Alliance'
        };
      }
    }
    
    // Create two columns of team info
    const blueTeamHTML = matchData.alliances.blue.team_keys.map((teamKey, index) => {
      const team = teamMap[teamKey];
      if (!team) return '';
      
      const teamNumber = teamKey.replace('frc', '');
      const allianceBadge = isPlayoff ? `<span class="text-xs bg-blue-900/60 px-2 py-1 rounded">${allianceLabels.blue}</span>` : 
                                       `<span class="text-xs bg-blue-900/30 px-2 py-1 rounded">Blue Alliance</span>`;
      
      return `
        <a href="team.html?team=${teamNumber}" class="block team-detail-card bg-blue-900/20 p-4 rounded-lg hover:bg-blue-900/30 transition-all">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold text-blue-400">${teamNumber}</h3>
            ${allianceBadge}
          </div>
          <h4 class="font-medium mb-1">${team.nickname}</h4>
          <div class="text-xs text-gray-400 mb-2">${team.city}, ${team.state_prov}${team.country !== 'USA' ? ', ' + team.country : ''}</div>
          <div class="mt-2 flex justify-between">
            <span class="text-xs text-blue-300">
              <i class="fas fa-external-link-alt mr-1"></i> View team details
            </span>
          </div>
        </a>
      `;
    }).join('');
    
    const redTeamHTML = matchData.alliances.red.team_keys.map((teamKey, index) => {
      const team = teamMap[teamKey];
      if (!team) return '';
      
      const teamNumber = teamKey.replace('frc', '');
      const allianceBadge = isPlayoff ? `<span class="text-xs bg-red-900/60 px-2 py-1 rounded">${allianceLabels.red}</span>` : 
                                       `<span class="text-xs bg-red-900/30 px-2 py-1 rounded">Red Alliance</span>`;
      
      return `
        <a href="team.html?team=${teamNumber}" class="block team-detail-card bg-red-900/20 p-4 rounded-lg hover:bg-red-900/30 transition-all">
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-bold text-red-400">${teamNumber}</h3>
            ${allianceBadge}
          </div>
          <h4 class="font-medium mb-1">${team.nickname}</h4>
          <div class="text-xs text-gray-400 mb-2">${team.city}, ${team.state_prov}${team.country !== 'USA' ? ', ' + team.country : ''}</div>
          <div class="mt-2 flex justify-between">
            <span class="text-xs text-red-300">
              <i class="fas fa-external-link-alt mr-1"></i> View team details
            </span>
          </div>
        </a>
      `;
    }).join('');
    
    // Combine into a responsive grid
    teamDetailsElement.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-4">
          ${blueTeamHTML}
        </div>
        <div class="space-y-4">
          ${redTeamHTML}
        </div>
      </div>
    `;
  }
  
  // Update video section with match video if available
  function updateMatchVideo(matchData) {
    const videoElement = document.getElementById('match-video');
    
    // Check if video is available
    if (matchData.videos && matchData.videos.length > 0) {
      // Find the first YouTube video
      const youtubeVideo = matchData.videos.find(v => v.type === 'youtube');
      
      if (youtubeVideo) {
        videoElement.innerHTML = `
          <div class="video-responsive">
            <iframe 
              src="https://www.youtube.com/embed/${youtubeVideo.key}" 
              title="Match Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        `;
        return;
      }
    }
    
    // No video available
    videoElement.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-video-slash text-gray-600 text-4xl mb-3"></i>
        <p class="text-gray-400">No match video available yet</p>
        <p class="text-xs text-gray-500 mt-2">Check back later or watch on <a href="https://www.twitch.tv/firstinspires" class="text-baywatch-orange hover:text-white" target="_blank">FIRST Twitch</a></p>
      </div>
    `;
  }
  
  // Check for match details page and initialize if needed
  document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('match.html')) {
      const urlParams = new URLSearchParams(window.location.search);
      const matchKey = urlParams.get('match');
      
      if (matchKey) {
        loadMatchDetails(matchKey);
      }
    }
  });
