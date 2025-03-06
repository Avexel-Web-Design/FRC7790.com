

// Update match breakdown section with more detailed statistics
function updateMatchBreakdown(matchData) {
    const breakdownElement = document.getElementById('match-breakdown');
    
    // Check if breakdown data is available
    if (!matchData.score_breakdown || !matchData.alliances.blue.score) {
      breakdownElement.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-chart-simple text-gray-600 text-3xl mb-3"></i>
          <p class="text-gray-400">Match breakdown not available yet</p>
          <p class="text-xs text-gray-500 mt-2">Detailed scores appear after the match is played</p>
        </div>
      `;
      return;
    }
    
    // Get score breakdown
    const blueBreakdown = matchData.score_breakdown.blue;
    const redBreakdown = matchData.score_breakdown.red;
    
    // Create a more detailed table with expanded breakdown
    // Extract common properties dynamically to handle different years' scoring structures
    
    // Auto categories based on the game year - support 2024 Crescendo and 2025 Reefscape
    const autoCategories = [];
    let gameYear = "unknown";
    
    // Detect game by looking at breakdown fields
    if ('autoSpeakerNoteCount' in blueBreakdown) {
      // 2024 Crescendo
      gameYear = "2024";
      autoCategories.push({ name: 'Auto Speaker Notes', blue: blueBreakdown.autoSpeakerNoteCount || '0', red: redBreakdown.autoSpeakerNoteCount || '0' });
      autoCategories.push({ name: 'Auto Amp Notes', blue: blueBreakdown.autoAmpNoteCount || '0', red: redBreakdown.autoAmpNoteCount || '0' });
      autoCategories.push({ name: 'Auto Leave', blue: blueBreakdown.autoLeave ? 'Yes' : 'No', red: redBreakdown.autoLeave ? 'Yes' : 'No' });
    } 
    // 2025 Reefscape game detection
    else if ('autoCoralCount' in blueBreakdown) {
      gameYear = "2025";
      autoCategories.push({ name: 'Auto Coral Nodes', blue: blueBreakdown.autoCoralCount || '0', red: redBreakdown.autoCoralCount || '0' });
      autoCategories.push({ name: 'Auto Coral Points', blue: blueBreakdown.autoCoralPoints || '0', red: redBreakdown.autoCoralPoints || '0' });
      
      // Add robot mobility status in autonomous
      const blueRobotsAuto = [];
      const redRobotsAuto = [];
      
      for (let i = 1; i <= 3; i++) {
        blueRobotsAuto.push(blueBreakdown[`autoLineRobot${i}`] || 'No');
        redRobotsAuto.push(redBreakdown[`autoLineRobot${i}`] || 'No');
      }
      
      autoCategories.push({ 
        name: 'Auto Mobility', 
        blue: `${blueRobotsAuto.filter(status => status === 'Yes').length}/3`, 
        red: `${redRobotsAuto.filter(status => status === 'Yes').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Auto Mobility Points', 
        blue: blueBreakdown.autoMobilityPoints || '0', 
        red: redBreakdown.autoMobilityPoints || '0' 
      });
      
      // Add Bonus (if applicable)
      autoCategories.push({ 
        name: 'Auto Bonus', 
        blue: blueBreakdown.autoBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown.autoBonusAchieved ? 'Yes' : 'No' 
      });
    }
    
    // Teleop categories based on the game year
    const teleopCategories = [];
    if (gameYear === "2024") {
      // 2024 Crescendo
      teleopCategories.push({ name: 'Speaker Notes', blue: blueBreakdown.teleopSpeakerNoteCount || '0', red: redBreakdown.teleopSpeakerNoteCount || '0' });
      teleopCategories.push({ name: 'Amped Speaker Notes', blue: blueBreakdown.teleopSpeakerNoteAmplifiedCount || '0', red: redBreakdown.teleopSpeakerNoteAmplifiedCount || '0' });
      teleopCategories.push({ name: 'Amp Notes', blue: blueBreakdown.teleopAmpNoteCount || '0', red: redBreakdown.teleopAmpNoteCount || '0' });
      if ('coopertitionBonus' in blueBreakdown) {
        teleopCategories.push({ name: 'Coopertition', blue: blueBreakdown.coopertitionBonus ? 'Yes' : 'No', red: redBreakdown.coopertitionBonus ? 'Yes' : 'No' });
      }
    } 
    // 2025 Reefscape teleop details
    else if (gameYear === "2025") {
      teleopCategories.push({ 
        name: 'Teleop Coral Nodes', 
        blue: blueBreakdown.teleopCoralCount || '0', 
        red: redBreakdown.teleopCoralCount || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Teleop Coral Points', 
        blue: blueBreakdown.teleopCoralPoints || '0', 
        red: redBreakdown.teleopCoralPoints || '0' 
      });
      
      // Add Reef row counts for detailed node placement
      if (blueBreakdown.teleopReef && redBreakdown.teleopReef) {
        const blueTopNodes = blueBreakdown.teleopReef.tba_topRowCount || 0;
        const blueMidNodes = blueBreakdown.teleopReef.tba_midRowCount || 0;
        const blueBotNodes = blueBreakdown.teleopReef.tba_botRowCount || 0;
        
        const redTopNodes = redBreakdown.teleopReef.tba_topRowCount || 0;
        const redMidNodes = redBreakdown.teleopReef.tba_midRowCount || 0;
        const redBotNodes = redBreakdown.teleopReef.tba_botRowCount || 0;
        
        teleopCategories.push({ 
          name: 'Top Row Nodes', 
          blue: blueTopNodes, 
          red: redTopNodes 
        });
        
        teleopCategories.push({ 
          name: 'Mid Row Nodes', 
          blue: blueMidNodes, 
          red: redMidNodes 
        });
        
        teleopCategories.push({ 
          name: 'Bottom Row Nodes', 
          blue: blueBotNodes, 
          red: redBotNodes 
        });
        
        // Add trough count if available
        if ('trough' in blueBreakdown.teleopReef && 'trough' in redBreakdown.teleopReef) {
          teleopCategories.push({ 
            name: 'Trough', 
            blue: blueBreakdown.teleopReef.trough || 0, 
            red: redBreakdown.teleopReef.trough || 0 
          });
        }
      }
      
      // Add algae data if available
      if ('netAlgaeCount' in blueBreakdown && 'netAlgaeCount' in redBreakdown) {
        teleopCategories.push({ 
          name: 'Net Algae Count', 
          blue: blueBreakdown.netAlgaeCount || 0, 
          red: redBreakdown.netAlgaeCount || 0 
        });
        
        teleopCategories.push({ 
          name: 'Algae Points', 
          blue: blueBreakdown.algaePoints || 0, 
          red: redBreakdown.algaePoints || 0 
        });
      }
      
      // Add wall algae if available
      if ('wallAlgaeCount' in blueBreakdown && 'wallAlgaeCount' in redBreakdown) {
        teleopCategories.push({ 
          name: 'Wall Algae Count', 
          blue: blueBreakdown.wallAlgaeCount || 0, 
          red: redBreakdown.wallAlgaeCount || 0 
        });
      }
      
      // Add coopertition criteria
      teleopCategories.push({ 
        name: 'Coopertition Met', 
        blue: blueBreakdown.coopertitionCriteriaMet ? 'Yes' : 'No', 
        red: redBreakdown.coopertitionCriteriaMet ? 'Yes' : 'No' 
      });
    }
    
    // Endgame-specific categories
    const endgameCategories = [];
    if (gameYear === "2024") {
      // 2024 Crescendo
      const convertEndgameStatus = (status) => {
        if (status === 'None') return '-';
        return status || '-';
      };
      
      endgameCategories.push({ 
        name: 'Robot 1 Endgame', 
        blue: convertEndgameStatus(blueBreakdown.endGameRobot1 || 'None'), 
        red: convertEndgameStatus(redBreakdown.endGameRobot1 || 'None')
      });
      
      endgameCategories.push({ 
        name: 'Robot 2 Endgame', 
        blue: convertEndgameStatus(blueBreakdown.endGameRobot2 || 'None'), 
        red: convertEndgameStatus(redBreakdown.endGameRobot2 || 'None')
      });
      
      endgameCategories.push({ 
        name: 'Robot 3 Endgame', 
        blue: convertEndgameStatus(blueBreakdown.endGameRobot3 || 'None'), 
        red: convertEndgameStatus(redBreakdown.endGameRobot3 || 'None')
      });
      
      endgameCategories.push({ 
        name: 'Trap Notes', 
        blue: blueBreakdown.trapNotePoints / 5 || '0', 
        red: redBreakdown.trapNotePoints / 5 || '0'
      });
    }
    // 2025 Reefscape endgame
    else if (gameYear === "2025") {
      const convertReefscapeEndgame = (status) => {
        if (!status || status === 'None') return '-';
        return status;
      };
      
      // Add robot endgame positions
      endgameCategories.push({ 
        name: 'Robot 1 Endgame', 
        blue: convertReefscapeEndgame(blueBreakdown.endGameRobot1), 
        red: convertReefscapeEndgame(redBreakdown.endGameRobot1)
      });
      
      endgameCategories.push({ 
        name: 'Robot 2 Endgame', 
        blue: convertReefscapeEndgame(blueBreakdown.endGameRobot2), 
        red: convertReefscapeEndgame(redBreakdown.endGameRobot2)
      });
      
      endgameCategories.push({ 
        name: 'Robot 3 Endgame', 
        blue: convertReefscapeEndgame(blueBreakdown.endGameRobot3), 
        red: convertReefscapeEndgame(redBreakdown.endGameRobot3)
      });
      
      // Add barge points
      endgameCategories.push({ 
        name: 'Barge Points', 
        blue: blueBreakdown.endGameBargePoints || '0', 
        red: redBreakdown.endGameBargePoints || '0'
      });
    }
    
    // Game-specific bonus points
    const bonusCategories = [];
    if (gameYear === "2024") {
      // 2024 Crescendo
      bonusCategories.push({ name: 'Center Stage', blue: blueBreakdown.micCenterStage ? 'Yes' : 'No', red: redBreakdown.micCenterStage ? 'Yes' : 'No' });
      bonusCategories.push({ name: 'Harmony', blue: blueBreakdown.endGameHarmonyPoints > 0 ? 'Yes' : 'No', red: redBreakdown.endGameHarmonyPoints > 0 ? 'Yes' : 'No' });
      bonusCategories.push({ name: 'Melody', blue: blueBreakdown.melodyPoints || '0', red: redBreakdown.melodyPoints || '0' });
    }
    // 2025 Reefscape bonuses
    else if (gameYear === "2025") {
      bonusCategories.push({ 
        name: 'Coral Bonus', 
        blue: blueBreakdown.coralBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown.coralBonusAchieved ? 'Yes' : 'No' 
      });
      
      bonusCategories.push({ 
        name: 'Barge Bonus', 
        blue: blueBreakdown.bargeBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown.bargeBonusAchieved ? 'Yes' : 'No' 
      });
      
      // Adjustment points (if any)
      if ((blueBreakdown.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown.adjustPoints || '0', 
          red: redBreakdown.adjustPoints || '0' 
        });
      }
    }
    
    // Additional ranking point info - only show for qualification matches
    const rpCategories = [];
    const isQualMatch = matchData.comp_level === 'qm';
    
    if (isQualMatch) {
      if (gameYear === "2024") {
        // 2024 Crescendo
        rpCategories.push({ name: 'Sustainability', blue: blueBreakdown.sustainability ? 'Yes' : 'No', red: redBreakdown.sustainability ? 'Yes' : 'No' });
        rpCategories.push({ name: 'Activation', blue: blueBreakdown.activation ? 'Yes' : 'No', red: redBreakdown.activation ? 'Yes' : 'No' });
      }
      // 2025 Reefscape ranking points
      else if (gameYear === "2025") {
        // Display Reefscape RPs (based on the provided score breakdown)
        // This will need to be updated when the actual RP criteria are finalized
        rpCategories.push({ 
          name: 'Total RP', 
          blue: blueBreakdown.rp || '0', 
          red: redBreakdown.rp || '0' 
        });
      }
    }
    
    // Build rows for the table
    let rowsHTML = '';
    
    // Build Auto section
    if (autoCategories.length > 0) {
      rowsHTML += `
        <tr class="section-header">
          <td class="score-category" colspan="3">Autonomous Period</td>
        </tr>
      `;
      
      autoCategories.forEach(category => {
        rowsHTML += `
          <tr>
            <td class="score-category">${category.name}</td>
            <td class="blue-value">${category.blue}</td>
            <td class="red-value">${category.red}</td>
          </tr>
        `;
      });
      
      rowsHTML += `
        <tr>
          <td class="score-category font-semibold">Total Auto Points</td>
          <td class="blue-value font-semibold">${blueBreakdown.autoPoints || '0'}</td>
          <td class="red-value font-semibold">${redBreakdown.autoPoints || '0'}</td>
        </tr>
      `;
    }
    
    // Build Teleop section
    if (teleopCategories.length > 0) {
      rowsHTML += `
        <tr class="section-header">
          <td class="score-category" colspan="3">Teleop Period</td>
        </tr>
      `;
      
      teleopCategories.forEach(category => {
        rowsHTML += `
          <tr>
            <td class="score-category">${category.name}</td>
            <td class="blue-value">${category.blue}</td>
            <td class="red-value">${category.red}</td>
          </tr>
        `;
      });
      
      rowsHTML += `
        <tr>
          <td class="score-category font-semibold">Total Teleop Points</td>
          <td class="blue-value font-semibold">${blueBreakdown.teleopPoints || '0'}</td>
          <td class="red-value font-semibold">${redBreakdown.teleopPoints || '0'}</td>
        </tr>
      `;
    }
    
    // Build Endgame section
    if (endgameCategories.length > 0) {
      rowsHTML += `
        <tr class="section-header">
          <td class="score-category" colspan="3">Endgame</td>
        </tr>
      `;
      
      endgameCategories.forEach(category => {
        rowsHTML += `
          <tr>
            <td class="score-category">${category.name}</td>
            <td class="blue-value">${category.blue}</td>
            <td class="red-value">${category.red}</td>
          </tr>
        `;
      });
    }
    
    // Build bonus section
    if (bonusCategories.length > 0) {
      rowsHTML += `
        <tr class="section-header">
          <td class="score-category" colspan="3">Bonus Points</td>
        </tr>
      `;
      
      bonusCategories.forEach(category => {
        rowsHTML += `
          <tr>
            <td class="score-category">${category.name}</td>
            <td class="blue-value">${category.blue}</td>
            <td class="red-value">${category.red}</td>
          </tr>
        `;
      });
    }
    
    // Add penalties section
    rowsHTML += `
      <tr class="section-header">
        <td class="score-category" colspan="3">Penalties</td>
      </tr>
    `;
    
    // Add detailed foul information
    rowsHTML += `
      <tr>
        <td class="score-category">Fouls</td>
        <td class="blue-value">${blueBreakdown.foulCount || '0'}</td>
        <td class="red-value">${redBreakdown.foulCount || '0'}</td>
      </tr>
      <tr>
        <td class="score-category">Tech Fouls</td>
        <td class="blue-value">${blueBreakdown.techFoulCount || '0'}</td>
        <td class="red-value">${redBreakdown.techFoulCount || '0'}</td>
      </tr>
      <tr>
        <td class="score-category">Foul Points</td>
        <td class="blue-value">${blueBreakdown.foulPoints || '0'}</td>
        <td class="red-value">${redBreakdown.foulPoints || '0'}</td>
      </tr>
    `;
    
    // Add 2025-specific penalties if present
    if (gameYear === "2025") {
      const blueSpecificPenalties = [];
      const redSpecificPenalties = [];
      
      // Check for specific penalty types
      if (blueBreakdown.g206Penalty) blueSpecificPenalties.push("G206");
      if (blueBreakdown.g410Penalty) blueSpecificPenalties.push("G410");
      if (blueBreakdown.g418Penalty) blueSpecificPenalties.push("G418");
      if (blueBreakdown.g428Penalty) blueSpecificPenalties.push("G428");
      
      if (redBreakdown.g206Penalty) redSpecificPenalties.push("G206");
      if (redBreakdown.g410Penalty) redSpecificPenalties.push("G410");
      if (redBreakdown.g418Penalty) redSpecificPenalties.push("G418");
      if (redBreakdown.g428Penalty) redSpecificPenalties.push("G428");
      
      // Only add the row if there are specific penalties
      if (blueSpecificPenalties.length > 0 || redSpecificPenalties.length > 0) {
        rowsHTML += `
          <tr>
            <td class="score-category">Specific Penalties</td>
            <td class="blue-value">${blueSpecificPenalties.length > 0 ? blueSpecificPenalties.join(", ") : "None"}</td>
            <td class="red-value">${redSpecificPenalties.length > 0 ? redSpecificPenalties.join(", ") : "None"}</td>
          </tr>
        `;
      }
    }
    
    // Add total score
    rowsHTML += `
      <tr class="total-row">
        <td class="score-category font-bold">TOTAL SCORE</td>
        <td class="blue-value font-bold text-lg">${matchData.alliances.blue.score}</td>
        <td class="red-value font-bold text-lg">${matchData.alliances.red.score}</td>
      </tr>
    `;
    
    // Add RP section if applicable (only for qualification matches)
    if (rpCategories.length > 0 && matchData.comp_level === 'qm') {
      rowsHTML += `
        <tr class="section-header">
          <td class="score-category" colspan="3">Ranking Points</td>
        </tr>
      `;
      
      rpCategories.forEach(category => {
        rowsHTML += `
          <tr>
            <td class="score-category">${category.name}</td>
            <td class="blue-value">${category.blue}</td>
            <td class="red-value">${category.red}</td>
          </tr>
        `;
      });
    }
    
    // Create the final table with the generated rows
    const breakdownHTML = `
      <table class="score-table">
        <thead>
          <tr>
            <th class="score-category">Category</th>
            <th>Blue Alliance</th>
            <th>Red Alliance</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>
    `;
    
    // Generate visual reef representation for Reefscape matches
    let reefVisualizationHTML = '';
    if (gameYear === "2025" && blueBreakdown.teleopReef && redBreakdown.teleopReef) {
      reefVisualizationHTML = generateReefVisualization(blueBreakdown, redBreakdown);
    }
    
    // Combine breakdown table with reef visualization
    breakdownElement.innerHTML = reefVisualizationHTML + breakdownHTML;
  }