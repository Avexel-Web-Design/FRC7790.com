import React from 'react';
import type { MatchData } from '../../../hooks/useMatchData';

interface MatchBreakdownProps {
  matchData: MatchData;
}

const MatchBreakdown: React.FC<MatchBreakdownProps> = ({ matchData }) => {
  // Generate grid visualization for 2023 Charged Up
  const generateGridVisualization = (blueBreakdown: any, redBreakdown: any) => {
    // Helper function to generate grid visualization for a single alliance
    const generateAllianceGrid = (breakdown: any, allianceColor: 'blue' | 'red') => {
      const autoCommunity = breakdown.autoCommunity || { T: [], M: [], B: [] };
      const teleopCommunity = breakdown.teleopCommunity || { T: [], M: [], B: [] };
      
      // Function to determine node state and piece type
      const getNodeInfo = (row: string, nodeIndex: number) => {
        const autoState = autoCommunity[row]?.[nodeIndex];
        const teleopState = teleopCommunity[row]?.[nodeIndex];
        
        if (autoState && autoState !== 'None') {
          return { 
            state: `${allianceColor}-auto-node`,
            piece: autoState.toLowerCase(),
            period: 'auto'
          };
        }
        if (teleopState && teleopState !== 'None') {
          return { 
            state: `${allianceColor}-teleop-node`,
            piece: teleopState.toLowerCase(),
            period: 'teleop'
          };
        }
        return { 
          state: 'empty-node',
          piece: 'none',
          period: 'none'
        };
      };
      
      // Generate HTML for all nodes in a row
      const generateRowNodes = (rowName: string, rowLabel: string) => {
        const nodes = [];
        for (let i = 0; i < 9; i++) {
          const nodeInfo = getNodeInfo(rowName, i);
          
          nodes.push(
            <div 
              key={`${rowName}-${i}`} 
              className={`grid-node ${nodeInfo.piece !== 'none' ? `${nodeInfo.piece}-${nodeInfo.period}` : 'empty-node'}`}
              data-tooltip={`${rowLabel} Node ${i + 1}: ${nodeInfo.piece !== 'none' ? `${nodeInfo.piece} (${nodeInfo.period})` : 'Empty'}`}
            >
            </div>
          );
        }
        return nodes;
      };
      
      return (
        <div className={`grid-container ${allianceColor}-grid`}>
          <h4 className={`grid-title ${allianceColor === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
            {allianceColor.toUpperCase()} ALLIANCE GRID
          </h4>
          <div className="grid-level top-level">
            <div className="level-label">HIGH</div>
            <div className="grid-row">
              {generateRowNodes('T', 'High')}
            </div>
          </div>
          <div className="grid-level mid-level">
            <div className="level-label">MID</div>
            <div className="grid-row">
              {generateRowNodes('M', 'Mid')}
            </div>
          </div>
          <div className="grid-level bot-level">
            <div className="level-label">LOW</div>
            <div className="grid-row">
              {generateRowNodes('B', 'Low')}
            </div>
          </div>
        </div>
      );
    };
    
    return (
      <div className="grid-visualization mb-8">
        <h3 className="text-xl font-bold text-baywatch-orange mb-4">Grid Scoring</h3>
        <div className="grids-container">
          {generateAllianceGrid(blueBreakdown, 'blue')}
          <div className="grid-divider"></div>
          {generateAllianceGrid(redBreakdown, 'red')}
        </div>
        <div className="grid-legend">
          <div className="legend-section">
            <div className="legend-title">Game Pieces</div>
            <div className="legend-item">
              <span className="legend-swatch cone-piece"></span> Cone
            </div>
            <div className="legend-item">
              <span className="legend-swatch cube-piece"></span> Cube
            </div>
          </div>
          <div className="legend-section">
            <div className="legend-title">Placement Period</div>
            <div className="legend-item">
              <span className="legend-swatch cone-auto"></span>
              <span className="legend-swatch cube-auto"></span>
              Auto
            </div>
            <div className="legend-item">
              <span className="legend-swatch cone-teleop"></span>
              <span className="legend-swatch cube-teleop"></span>
              Teleop
            </div>
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
          .grid-visualization {
            background: rgba(0,0,0,0.3);
            border-radius: 0.75rem;
            padding: 1rem;
            width: 100%;
          }
          .grids-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            width: 100%;
          }
          .grid-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,107,0,0.3), transparent);
            margin: 0.5rem 0;
            width: 100%;
          }
          .grid-container {
            flex: 1;
            border-radius: 0.5rem;
            padding: 0.75rem;
            background: rgba(0,0,0,0.2);
            width: 100%;
          }
          .blue-grid {
            border: 1px solid rgba(59, 130, 246, 0.3);
          }
          .red-grid {
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .grid-title {
            text-align: center;
            margin-bottom: 0.75rem;
            font-weight: 600;
          }
          .grid-level {
            display: flex;
            align-items: center;
            margin-bottom: 0.5rem;
            width: 100%;
          }
          .level-label {
            width: 50px;
            text-align: center;
            font-size: 0.7rem;
            color: rgba(255,255,255,0.6);
            font-weight: 600;
          }
          .grid-row {
            display: flex;
            flex: 1;
            gap: 2px;
          }
          .grid-node {
            flex: 1;
            aspect-ratio: 1/1;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: help;
            transition: all 0.2s;
          }
          .grid-node:hover {
            transform: scale(1.05);
            z-index: 10;
          }
          .empty-node {
            background-color: rgba(255,255,255,0.05);
          }
          .cone-auto {
            background-color: #FFD700;
            border-color: #FFA500;
          }
          .cone-teleop {
            background-color: #B8860B;
            border-color: #9A6B0A;
          }
          .cube-auto {
            background-color: #7C3AED;
            border-color: #6D28D9;
          }
          .cube-teleop {
            background-color: #4C1D95;
            border-color: #3730A3;
          }
          .grid-stats {
            margin-top: 1rem;
            text-align: center;
            font-size: 0.8rem;
          }
          .stat-row {
            margin: 0.2rem 0;
            color: rgba(255,255,255,0.7);
          }
          .grid-legend {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }
          .legend-section {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .legend-title {
            font-size: 0.7rem;
            color: rgba(255,255,255,0.8);
            margin-bottom: 0.3rem;
            font-weight: 600;
            text-transform: uppercase;
          }
          .legend-item {
            display: flex;
            align-items: center;
            font-size: 0.7rem;
            color: #aaa;
            margin: 0.1rem 0;
          }
          .legend-swatch {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 3px;
            margin-right: 0.3rem;
          }
          .cone-piece {
            background-color: #FFD700;
          }
          .cube-piece {
            background-color: #7C3AED;
          }
          .cone-auto {
            background-color: #FFD700;
          }
          .cone-teleop {
            background-color: #B8860B;
          }
          .cube-auto {
            background-color: #7C3AED;
          }
          .cube-teleop {
            background-color: #4C1D95;
          }
        `}} />
      </div>
    );
  };

  // Generate reef visualization for 2025 Reefscape
  const generateReefVisualization = (blueBreakdown: any, redBreakdown: any) => {
    // Helper function to generate node visualization for a single alliance
    const generateAllianceReef = (breakdown: any, allianceColor: 'blue' | 'red') => {
      const autoReef = breakdown.autoReef || { topRow: {}, midRow: {}, botRow: {} };
      const teleopReef = breakdown.teleopReef || { topRow: {}, midRow: {}, botRow: {} };
      
      // Function to determine node state class
      const getNodeClass = (row: string, node: string) => {
        const autoState = autoReef[row]?.[node] === true;
        const teleopState = teleopReef[row]?.[node] === true;
        
        if (autoState) return `${allianceColor}-auto-node`;
        if (teleopState) return `${allianceColor}-teleop-node`;
        return 'empty-node';
      };
      
      // Generate HTML for all nodes in the reef
      const generateRowNodes = (rowName: string) => {
        const nodes = [];
        // Generate nodes A through L
        for (let i = 0; i < 12; i++) {
          const nodeLetter = String.fromCharCode(65 + i); // Convert 0-11 to A-L
          const nodeId = `node${nodeLetter}`;
          const nodeClass = getNodeClass(rowName, nodeId);
          nodes.push(
            <div key={`${rowName}-${nodeId}`} className={`reef-node ${nodeClass}`}></div>
          );
        }
        return nodes;
      };
      
      return (
        <div className={`reef-container ${allianceColor}-reef`}>
          <h4 className={`reef-title ${allianceColor === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
            {allianceColor.toUpperCase()} ALLIANCE REEF
          </h4>
          <div className="reef-row">
            {generateRowNodes('topRow')}
          </div>
          <div className="reef-row">
            {generateRowNodes('midRow')}
          </div>
          <div className="reef-row">
            {generateRowNodes('botRow')}
          </div>
          {/* Display trough (L1) count below reef rows */}
          <p className={`trough-count text-sm mt-2 text-center text-gray-400`}>
            <span className={`font-mono font-semibold ${allianceColor === 'blue' ? 'text-blue-500' : 'text-red-500'}`}>{breakdown?.autoReef?.trough ?? 0}</span> |{' '}
            <span className={`font-mono font-semibold ${allianceColor === 'blue' ? 'text-blue-800' : 'text-red-800'}`}>{breakdown?.teleopReef?.trough ?? 0}</span> Trough
          </p>
        </div>
      );
    };
    
    return (
      <div className="reef-visualization mb-8">
        <h3 className="text-xl font-bold text-baywatch-orange mb-4">Reef Node Placement</h3>
        <div className="reefs-container">
          {generateAllianceReef(blueBreakdown, 'blue')}
          <div className="reef-divider"></div>
          {generateAllianceReef(redBreakdown, 'red')}
        </div>
        <div className="reef-legend">
          <div className="legend-item">
            <span className="legend-swatch red-auto-node"></span> Auto Coral
          </div>
          <div className="legend-item">
            <span className="legend-swatch red-teleop-node"></span> Teleop Coral
          </div>
          <div className="legend-item">
            <span className="legend-swatch empty-node"></span> Empty Branch
          </div>
        </div>
        
        <style dangerouslySetInnerHTML={{
          __html: `
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
        `}} />
      </div>
    );
  };

  const renderBreakdownTable = () => {
    if (!matchData.score_breakdown) {
      return (
        <div className="text-center text-gray-400 py-8">
          <i className="fas fa-table-list text-gray-600 text-3xl mb-4"></i>
          <p>Match breakdown unavailable</p>
        </div>
      );
    }

    const blueBreakdown = matchData.score_breakdown.blue;
    const redBreakdown = matchData.score_breakdown.red;

    // Determine game year from event key
    const eventYear = parseInt(matchData.event_key.substring(0, 4));
    // Determine if the match is a playoff (semifinals or finals)
    const isPlayoffMatch = matchData.key.includes('_sf') || matchData.key.includes('_f');
    
    let breakdownSections;
    let reefVisualization = null;
    let gridVisualization = null;

    if (eventYear >= 2025) {
      // 2025 Reefscape breakdown - comprehensive like the original
      
      // Auto categories
      const autoCategories = [];
      autoCategories.push({ 
        name: 'Coral', 
        blue: blueBreakdown?.autoCoralCount || '0', 
        red: redBreakdown?.autoCoralCount || '0' 
      });
      
      autoCategories.push({ 
        name: 'Coral Points', 
        blue: blueBreakdown?.autoCoralPoints || '0', 
        red: redBreakdown?.autoCoralPoints || '0' 
      });
      // Add Reef row counts for detailed node placement
      if (blueBreakdown?.autoReef && redBreakdown?.autoReef) {
        const blueTopNodes = blueBreakdown.autoReef.tba_topRowCount || 0;
        const blueMidNodes = blueBreakdown.autoReef.tba_midRowCount || 0;
        const blueBotNodes = blueBreakdown.autoReef.tba_botRowCount || 0;
        const blueTrough = blueBreakdown.autoReef.trough || 0;
        
        const redTopNodes = redBreakdown.autoReef.tba_topRowCount || 0;
        const redMidNodes = redBreakdown.autoReef.tba_midRowCount || 0;
        const redBotNodes = redBreakdown.autoReef.tba_botRowCount || 0;
        const redTrough = redBreakdown.autoReef.trough || 0;
        
        autoCategories.push({ 
          name: 'L4', 
          blue: blueTopNodes, 
          red: redTopNodes 
        });
        
        autoCategories.push({ 
          name: 'L3', 
          blue: blueMidNodes, 
          red: redMidNodes 
        });
        
        autoCategories.push({ 
          name: 'L2', 
          blue: blueBotNodes, 
          red: redBotNodes 
        });
        
        autoCategories.push({ 
          name: 'L1', 
          blue: blueTrough, 
          red: redTrough 
        });
        
        
      }
      // Add robot mobility status in autonomous
      const blueRobotsAuto = [];
      const redRobotsAuto = [];
      
      for (let i = 1; i <= 3; i++) {
        blueRobotsAuto.push(blueBreakdown?.[`autoLineRobot${i}`] || 'No');
        redRobotsAuto.push(redBreakdown?.[`autoLineRobot${i}`] || 'No');
      }
      
      autoCategories.push({ 
        name: 'Mobility', 
        blue: `${blueRobotsAuto.filter(status => status === 'Yes').length}/3`, 
        red: `${redRobotsAuto.filter(status => status === 'Yes').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Mobility Points', 
        blue: blueBreakdown?.autoMobilityPoints || '0', 
        red: redBreakdown?.autoMobilityPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      teleopCategories.push({ 
        name: 'Coral', 
        blue: blueBreakdown?.teleopCoralCount || '0', 
        red: redBreakdown?.teleopCoralCount || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Coral Points', 
        blue: blueBreakdown?.teleopCoralPoints || '0', 
        red: redBreakdown?.teleopCoralPoints || '0' 
      });
      
      // Add Reef row counts for detailed node placement
      if (blueBreakdown?.teleopReef && redBreakdown?.teleopReef) {
        const blueTopNodes = blueBreakdown.teleopReef.tba_topRowCount || 0;
        const blueMidNodes = blueBreakdown.teleopReef.tba_midRowCount || 0;
        const blueBotNodes = blueBreakdown.teleopReef.tba_botRowCount || 0;
        const blueTrough = blueBreakdown.teleopReef.trough || 0;
        
        const redTopNodes = redBreakdown.teleopReef.tba_topRowCount || 0;
        const redMidNodes = redBreakdown.teleopReef.tba_midRowCount || 0;
        const redBotNodes = redBreakdown.teleopReef.tba_botRowCount || 0;
        const redTrough = redBreakdown.teleopReef.trough || 0;
        
        teleopCategories.push({ 
          name: 'L4', 
          blue: blueTopNodes, 
          red: redTopNodes 
        });
        
        teleopCategories.push({ 
          name: 'L3', 
          blue: blueMidNodes, 
          red: redMidNodes 
        });
        
        teleopCategories.push({ 
          name: 'L2', 
          blue: blueBotNodes, 
          red: redBotNodes 
        });
        
        teleopCategories.push({ 
          name: 'L1', 
          blue: blueTrough, 
          red: redTrough 
        });
        
        
      }
      
      teleopCategories.push({ 
        name: 'Net', 
        blue: blueBreakdown.netAlgaeCount || 0, 
        red: redBreakdown.netAlgaeCount || 0 
      });
      
      teleopCategories.push({ 
        name: 'Processor', 
        blue: blueBreakdown.wallAlgaeCount || 0, 
        red: redBreakdown.wallAlgaeCount || 0 
      });
        
      teleopCategories.push({ 
        name: 'Algae Points', 
        blue: blueBreakdown.algaePoints || 0, 
        red: redBreakdown.algaePoints || 0 
      });
        
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown.teleopPoints || 0, 
        red: redBreakdown.teleopPoints || 0 
      });

      // Endgame categories
      const convertReefscapeEndgame = (status: any) => {
        if (!status || status === 'None') return '-';
        return status;
      };
      
      const endgameCategories = [];
      endgameCategories.push({ 
        name: 'Robot 1 Endgame', 
        blue: convertReefscapeEndgame(blueBreakdown?.endGameRobot1), 
        red: convertReefscapeEndgame(redBreakdown?.endGameRobot1)
      });
      
      endgameCategories.push({ 
        name: 'Robot 2 Endgame', 
        blue: convertReefscapeEndgame(blueBreakdown?.endGameRobot2), 
        red: convertReefscapeEndgame(redBreakdown?.endGameRobot2)
      });
      
      endgameCategories.push({ 
        name: 'Robot 3 Endgame', 
        blue: convertReefscapeEndgame(blueBreakdown?.endGameRobot3), 
        red: convertReefscapeEndgame(redBreakdown?.endGameRobot3)
      });
      
      endgameCategories.push({ 
        name: 'Barge Points', 
        blue: blueBreakdown?.endGameBargePoints || '0', 
        red: redBreakdown?.endGameBargePoints || '0'
      });

      // Bonus categories
      const bonusCategories = [];
      bonusCategories.push({ 
        name: 'Coopertition Met', 
        blue: blueBreakdown?.coopertitionCriteriaMet ? 'Yes' : 'No', 
        red: redBreakdown?.coopertitionCriteriaMet ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'Auto Bonus', 
        blue: blueBreakdown?.autoBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.autoBonusAchieved ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'Coral Bonus', 
        blue: blueBreakdown?.coralBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.coralBonusAchieved ? 'Yes' : 'No' 
      });
      
      bonusCategories.push({ 
        name: 'Barge Bonus', 
        blue: blueBreakdown?.bargeBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.bargeBonusAchieved ? 'Yes' : 'No' 
      });
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      breakdownSections = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Endgame', items: endgameCategories },
        { title: 'Bonus', items: bonusCategories }
      ];

      // Generate reef visualization if reef data is available
      if (blueBreakdown?.teleopReef && redBreakdown?.teleopReef) {
        reefVisualization = generateReefVisualization(blueBreakdown, redBreakdown);
      }
    } else if (eventYear === 2024) {
      // 2024 Crescendo breakdown
      breakdownSections = [
        {
          title: 'Auto',
          items: [
            { name: 'Leave', blue: blueBreakdown?.autoLeave || 0, red: redBreakdown?.autoLeave || 0 },
            { name: 'Amp', blue: blueBreakdown?.autoAmpNoteCount || 0, red: redBreakdown?.autoAmpNoteCount || 0 },
            { name: 'Speaker', blue: blueBreakdown?.autoSpeakerNoteCount || 0, red: redBreakdown?.autoSpeakerNoteCount || 0 },
            { name: 'Points', blue: blueBreakdown?.autoPoints || 0, red: redBreakdown?.autoPoints || 0 }
          ]
        },
        {
          title: 'Teleop',
          items: [
            { name: 'Amp', blue: blueBreakdown?.teleopAmpNoteCount || 0, red: redBreakdown?.teleopAmpNoteCount || 0 },
            { name: 'Speaker', blue: blueBreakdown?.teleopSpeakerNoteCount || 0, red: redBreakdown?.teleopSpeakerNoteCount || 0 },
            { name: 'Amplified', blue: blueBreakdown?.teleopSpeakerNoteAmplifiedCount || 0, red: redBreakdown?.teleopSpeakerNoteAmplifiedCount || 0 },
            { name: 'Points', blue: blueBreakdown?.teleopPoints || 0, red: redBreakdown?.teleopPoints || 0 }
          ]
        },
        {
          title: 'Endgame',
          items: [
            { name: 'Park', blue: blueBreakdown?.endGameParkPoints || 0, red: redBreakdown?.endGameParkPoints || 0 },
            { name: 'Onstage', blue: blueBreakdown?.endGameOnStagePoints || 0, red: redBreakdown?.endGameOnStagePoints || 0 },
            { name: 'Harmony', blue: blueBreakdown?.endGameHarmonyPoints || 0, red: redBreakdown?.endGameHarmonyPoints || 0 },
            { name: 'Trap', blue: blueBreakdown?.trapPoints || 0, red: redBreakdown?.trapPoints || 0 }
          ]
        },
        {
          title: 'Bonus',
          items: [
            { name: 'Melody RP', blue: blueBreakdown?.melodyBonusAchieved ? 1 : 0, red: redBreakdown?.melodyBonusAchieved ? 1 : 0 },
            { name: 'Ensemble RP', blue: blueBreakdown?.ensembleBonusAchieved ? 1 : 0, red: redBreakdown?.ensembleBonusAchieved ? 1 : 0 }
          ]
        }
      ];
    } else if (eventYear === 2023) {
      // 2023 Charged Up breakdown
      
      // Auto categories
      const autoCategories = [];
      autoCategories.push({ 
        name: 'Game Pieces', 
        blue: blueBreakdown?.autoGamePieceCount || '0', 
        red: redBreakdown?.autoGamePieceCount || '0' 
      });
      
      autoCategories.push({ 
        name: 'Game Piece Points', 
        blue: blueBreakdown?.autoGamePiecePoints || '0', 
        red: redBreakdown?.autoGamePiecePoints || '0' 
      });
      
      // Charge Station in Auto
      const blueAutoCharge = [];
      const redAutoCharge = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotCharge = blueBreakdown?.[`autoChargeStationRobot${i}`] || 'None';
        const redRobotCharge = redBreakdown?.[`autoChargeStationRobot${i}`] || 'None';
        blueAutoCharge.push(blueRobotCharge);
        redAutoCharge.push(redRobotCharge);
      }
      
      autoCategories.push({ 
        name: 'Docked', 
        blue: blueBreakdown?.autoDocked ? 'Yes' : 'No', 
        red: redBreakdown?.autoDocked ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Engaged', 
        blue: (blueBreakdown?.autoBridgeState === 'Level' && blueBreakdown?.autoDocked) ? 'Yes' : 'No', 
        red: (redBreakdown?.autoBridgeState === 'Level' && redBreakdown?.autoDocked) ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Charge Station Points', 
        blue: blueBreakdown?.autoChargeStationPoints || '0', 
        red: redBreakdown?.autoChargeStationPoints || '0' 
      });
      
      // Mobility in auto
      const blueMobility = [];
      const redMobility = [];
      
      for (let i = 1; i <= 3; i++) {
        blueMobility.push(blueBreakdown?.[`mobilityRobot${i}`] || 'No');
        redMobility.push(redBreakdown?.[`mobilityRobot${i}`] || 'No');
      }
      
      autoCategories.push({ 
        name: 'Mobility', 
        blue: `${blueMobility.filter(status => status === 'Yes').length}/3`, 
        red: `${redMobility.filter(status => status === 'Yes').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Mobility Points', 
        blue: blueBreakdown?.autoMobilityPoints || '0', 
        red: redBreakdown?.autoMobilityPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      teleopCategories.push({ 
        name: 'Game Pieces', 
        blue: blueBreakdown?.teleopGamePieceCount || '0', 
        red: redBreakdown?.teleopGamePieceCount || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Game Piece Points', 
        blue: blueBreakdown?.teleopGamePiecePoints || '0', 
        red: redBreakdown?.teleopGamePiecePoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Links', 
        blue: blueBreakdown?.links?.length || '0', 
        red: redBreakdown?.links?.length || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Link Points', 
        blue: blueBreakdown?.linkPoints || '0', 
        red: redBreakdown?.linkPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: (blueBreakdown?.teleopGamePiecePoints || 0) + (blueBreakdown?.linkPoints || 0), 
        red: (redBreakdown?.teleopGamePiecePoints || 0) + (redBreakdown?.linkPoints || 0) 
      });

      // Endgame categories
      const endgameCategories = [];
      
      const blueEndCharge = [];
      const redEndCharge = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotEndCharge = blueBreakdown?.[`endGameChargeStationRobot${i}`] || 'None';
        const redRobotEndCharge = redBreakdown?.[`endGameChargeStationRobot${i}`] || 'None';
        blueEndCharge.push(blueRobotEndCharge);
        redEndCharge.push(redRobotEndCharge);
      }
      
      endgameCategories.push({ 
        name: 'Parked', 
        blue: `${blueEndCharge.filter(status => status === 'Park').length}/3`, 
        red: `${redEndCharge.filter(status => status === 'Park').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Docked', 
        blue: `${blueEndCharge.filter(status => status === 'Docked').length}/3`, 
        red: `${redEndCharge.filter(status => status === 'Docked').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Engaged', 
        blue: (blueBreakdown?.endGameBridgeState === 'Level' && blueEndCharge.filter(status => status === 'Docked').length > 0) ? 'Yes' : 'No', 
        red: (redBreakdown?.endGameBridgeState === 'Level' && redEndCharge.filter(status => status === 'Docked').length > 0) ? 'Yes' : 'No' 
      });
      
      endgameCategories.push({ 
        name: 'Park Points', 
        blue: blueBreakdown?.endGameParkPoints || '0', 
        red: redBreakdown?.endGameParkPoints || '0' 
      });
      
      endgameCategories.push({ 
        name: 'Charge Station Points', 
        blue: blueBreakdown?.endGameChargeStationPoints || '0', 
        red: redBreakdown?.endGameChargeStationPoints || '0' 
      });

      // Bonus categories
      const bonusCategories = [];
      bonusCategories.push({ 
        name: 'Coopertition', 
        blue: blueBreakdown?.coopertitionCriteriaMet ? 'Yes' : 'No', 
        red: redBreakdown?.coopertitionCriteriaMet ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'Sustainability RP', 
        blue: blueBreakdown?.sustainabilityBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.sustainabilityBonusAchieved ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'Activation RP', 
        blue: blueBreakdown?.activationBonusAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.activationBonusAchieved ? 'Yes' : 'No' 
      });
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      breakdownSections = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Endgame', items: endgameCategories },
        { title: 'Bonus', items: bonusCategories }
      ];

      // Generate grid visualization if community data is available
      if (blueBreakdown?.teleopCommunity && redBreakdown?.teleopCommunity) {
        gridVisualization = generateGridVisualization(blueBreakdown, redBreakdown);
      }
    } else if (eventYear === 2022) {
      // 2022 Rapid React breakdown
      
      // Auto categories
      const autoCategories = [];
      autoCategories.push({ 
        name: 'Cargo Total', 
        blue: blueBreakdown?.autoCargoTotal || '0', 
        red: redBreakdown?.autoCargoTotal || '0' 
      });
      
      autoCategories.push({ 
        name: 'Upper Hub', 
        blue: (blueBreakdown?.autoCargoUpperBlue || 0) + (blueBreakdown?.autoCargoUpperRed || 0) + (blueBreakdown?.autoCargoUpperFar || 0) + (blueBreakdown?.autoCargoUpperNear || 0), 
        red: (redBreakdown?.autoCargoUpperBlue || 0) + (redBreakdown?.autoCargoUpperRed || 0) + (redBreakdown?.autoCargoUpperFar || 0) + (redBreakdown?.autoCargoUpperNear || 0) 
      });
      
      autoCategories.push({ 
        name: 'Lower Hub', 
        blue: (blueBreakdown?.autoCargoLowerBlue || 0) + (blueBreakdown?.autoCargoLowerRed || 0) + (blueBreakdown?.autoCargoLowerFar || 0) + (blueBreakdown?.autoCargoLowerNear || 0), 
        red: (redBreakdown?.autoCargoLowerBlue || 0) + (redBreakdown?.autoCargoLowerRed || 0) + (redBreakdown?.autoCargoLowerFar || 0) + (redBreakdown?.autoCargoLowerNear || 0) 
      });
      
      autoCategories.push({ 
        name: 'Cargo Points', 
        blue: blueBreakdown?.autoCargoPoints || '0', 
        red: redBreakdown?.autoCargoPoints || '0' 
      });
      
      // Taxi in auto
      const blueTaxi = [];
      const redTaxi = [];
      
      for (let i = 1; i <= 3; i++) {
        blueTaxi.push(blueBreakdown?.[`taxiRobot${i}`] || 'No');
        redTaxi.push(redBreakdown?.[`taxiRobot${i}`] || 'No');
      }
      
      autoCategories.push({ 
        name: 'Taxi', 
        blue: `${blueTaxi.filter(status => status === 'Yes').length}/3`, 
        red: `${redTaxi.filter(status => status === 'Yes').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Taxi Points', 
        blue: blueBreakdown?.autoTaxiPoints || '0', 
        red: redBreakdown?.autoTaxiPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      teleopCategories.push({ 
        name: 'Cargo Total', 
        blue: blueBreakdown?.teleopCargoTotal || '0', 
        red: redBreakdown?.teleopCargoTotal || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Upper Hub', 
        blue: (blueBreakdown?.teleopCargoUpperBlue || 0) + (blueBreakdown?.teleopCargoUpperRed || 0) + (blueBreakdown?.teleopCargoUpperFar || 0) + (blueBreakdown?.teleopCargoUpperNear || 0), 
        red: (redBreakdown?.teleopCargoUpperBlue || 0) + (redBreakdown?.teleopCargoUpperRed || 0) + (redBreakdown?.teleopCargoUpperFar || 0) + (redBreakdown?.teleopCargoUpperNear || 0) 
      });
      
      teleopCategories.push({ 
        name: 'Lower Hub', 
        blue: (blueBreakdown?.teleopCargoLowerBlue || 0) + (blueBreakdown?.teleopCargoLowerRed || 0) + (blueBreakdown?.teleopCargoLowerFar || 0) + (blueBreakdown?.teleopCargoLowerNear || 0), 
        red: (redBreakdown?.teleopCargoLowerBlue || 0) + (redBreakdown?.teleopCargoLowerRed || 0) + (redBreakdown?.teleopCargoLowerFar || 0) + (redBreakdown?.teleopCargoLowerNear || 0) 
      });
      
      teleopCategories.push({ 
        name: 'Cargo Points', 
        blue: blueBreakdown?.teleopCargoPoints || '0', 
        red: redBreakdown?.teleopCargoPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Quintet Achieved', 
        blue: blueBreakdown?.quintetAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.quintetAchieved ? 'Yes' : 'No' 
      });
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.teleopCargoPoints || '0', 
        red: redBreakdown?.teleopCargoPoints || '0' 
      });

      // Endgame categories
      const endgameCategories = [];
      
      const blueEndgame = [];
      const redEndgame = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotEndgame = blueBreakdown?.[`endgameRobot${i}`] || 'None';
        const redRobotEndgame = redBreakdown?.[`endgameRobot${i}`] || 'None';
        blueEndgame.push(blueRobotEndgame);
        redEndgame.push(redRobotEndgame);
      }
      
      endgameCategories.push({ 
        name: 'Low Rung', 
        blue: `${blueEndgame.filter(status => status === 'Low').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Low').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Mid Rung', 
        blue: `${blueEndgame.filter(status => status === 'Mid').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Mid').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'High Rung', 
        blue: `${blueEndgame.filter(status => status === 'High').length}/3`, 
        red: `${redEndgame.filter(status => status === 'High').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Traversal Rung', 
        blue: `${blueEndgame.filter(status => status === 'Traversal').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Traversal').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Endgame Points', 
        blue: blueBreakdown?.endgamePoints || '0', 
        red: redBreakdown?.endgamePoints || '0' 
      });

      // Bonus categories
      const bonusCategories = [];
      bonusCategories.push({ 
        name: 'Cargo RP', 
        blue: blueBreakdown?.cargoBonusRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.cargoBonusRankingPoint ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'Hangar RP', 
        blue: blueBreakdown?.hangarBonusRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.hangarBonusRankingPoint ? 'Yes' : 'No' 
      });
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      breakdownSections = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Endgame', items: endgameCategories },
        { title: 'Bonus', items: bonusCategories }
      ];
    } else if (eventYear === 2020) {
      // 2020 Infinite Recharge breakdown
      
      // Auto categories
      const autoCategories = [];
      autoCategories.push({ 
        name: 'Cell Total', 
        blue: (blueBreakdown?.autoCellsBottom || 0) + (blueBreakdown?.autoCellsOuter || 0) + (blueBreakdown?.autoCellsInner || 0), 
        red: (redBreakdown?.autoCellsBottom || 0) + (redBreakdown?.autoCellsOuter || 0) + (redBreakdown?.autoCellsInner || 0) 
      });
      
      autoCategories.push({ 
        name: 'Bottom Port', 
        blue: blueBreakdown?.autoCellsBottom || '0', 
        red: redBreakdown?.autoCellsBottom || '0' 
      });
      
      autoCategories.push({ 
        name: 'Outer Port', 
        blue: blueBreakdown?.autoCellsOuter || '0', 
        red: redBreakdown?.autoCellsOuter || '0' 
      });
      
      autoCategories.push({ 
        name: 'Inner Port', 
        blue: blueBreakdown?.autoCellsInner || '0', 
        red: redBreakdown?.autoCellsInner || '0' 
      });
      
      autoCategories.push({ 
        name: 'Cell Points', 
        blue: blueBreakdown?.autoCellPoints || '0', 
        red: redBreakdown?.autoCellPoints || '0' 
      });
      
      // Initiation Line in auto
      const blueInitLine = [];
      const redInitLine = [];
      
      for (let i = 1; i <= 3; i++) {
        blueInitLine.push(blueBreakdown?.[`initLineRobot${i}`] || 'None');
        redInitLine.push(redBreakdown?.[`initLineRobot${i}`] || 'None');
      }
      
      autoCategories.push({ 
        name: 'Init Line', 
        blue: `${blueInitLine.filter(status => status === 'Exited').length}/3`, 
        red: `${redInitLine.filter(status => status === 'Exited').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Init Line Points', 
        blue: blueBreakdown?.autoInitLinePoints || '0', 
        red: redBreakdown?.autoInitLinePoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      teleopCategories.push({ 
        name: 'Cell Total', 
        blue: (blueBreakdown?.teleopCellsBottom || 0) + (blueBreakdown?.teleopCellsOuter || 0) + (blueBreakdown?.teleopCellsInner || 0), 
        red: (redBreakdown?.teleopCellsBottom || 0) + (redBreakdown?.teleopCellsOuter || 0) + (redBreakdown?.teleopCellsInner || 0) 
      });
      
      teleopCategories.push({ 
        name: 'Bottom Port', 
        blue: blueBreakdown?.teleopCellsBottom || '0', 
        red: redBreakdown?.teleopCellsBottom || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Outer Port', 
        blue: blueBreakdown?.teleopCellsOuter || '0', 
        red: redBreakdown?.teleopCellsOuter || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Inner Port', 
        blue: blueBreakdown?.teleopCellsInner || '0', 
        red: redBreakdown?.teleopCellsInner || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Cell Points', 
        blue: blueBreakdown?.teleopCellPoints || '0', 
        red: redBreakdown?.teleopCellPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Control Panel Points', 
        blue: blueBreakdown?.controlPanelPoints || '0', 
        red: redBreakdown?.controlPanelPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Stage 1 Activated', 
        blue: blueBreakdown?.stage1Activated ? 'Yes' : 'No', 
        red: redBreakdown?.stage1Activated ? 'Yes' : 'No' 
      });
      
      teleopCategories.push({ 
        name: 'Stage 2 Activated', 
        blue: blueBreakdown?.stage2Activated ? 'Yes' : 'No', 
        red: redBreakdown?.stage2Activated ? 'Yes' : 'No' 
      });
      
      teleopCategories.push({ 
        name: 'Stage 3 Activated', 
        blue: blueBreakdown?.stage3Activated ? 'Yes' : 'No', 
        red: redBreakdown?.stage3Activated ? 'Yes' : 'No' 
      });
      
      // Calculate teleop points (excluding endgame and control panel)
      const blueTeleopOnlyPoints = (blueBreakdown?.teleopCellPoints || 0);
      const redTeleopOnlyPoints = (redBreakdown?.teleopCellPoints || 0);
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueTeleopOnlyPoints, 
        red: redTeleopOnlyPoints 
      });

      // Endgame categories
      const endgameCategories = [];
      
      const blueEndgame = [];
      const redEndgame = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotEndgame = blueBreakdown?.[`endgameRobot${i}`] || 'None';
        const redRobotEndgame = redBreakdown?.[`endgameRobot${i}`] || 'None';
        blueEndgame.push(blueRobotEndgame);
        redEndgame.push(redRobotEndgame);
      }
      
      endgameCategories.push({ 
        name: 'Parked', 
        blue: `${blueEndgame.filter(status => status === 'Park').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Park').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Hanging', 
        blue: `${blueEndgame.filter(status => status === 'Hang').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Hang').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Generator Switch Level', 
        blue: blueBreakdown?.endgameRungIsLevel === 'IsLevel' ? 'Yes' : 'No', 
        red: redBreakdown?.endgameRungIsLevel === 'IsLevel' ? 'Yes' : 'No' 
      });
      
      endgameCategories.push({ 
        name: 'Endgame Points', 
        blue: blueBreakdown?.endgamePoints || '0', 
        red: redBreakdown?.endgamePoints || '0' 
      });

      // Bonus categories
      const bonusCategories = [];
      bonusCategories.push({ 
        name: 'Shield Operational RP', 
        blue: blueBreakdown?.shieldOperationalRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.shieldOperationalRankingPoint ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'Shield Energized RP', 
        blue: blueBreakdown?.shieldEnergizedRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.shieldEnergizedRankingPoint ? 'Yes' : 'No' 
      });
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      breakdownSections = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Endgame', items: endgameCategories },
        { title: 'Bonus', items: bonusCategories }
      ];
    } else if (eventYear === 2019) {
      // 2019 Destination: Deep Space breakdown
      
      // Auto categories (Sandstorm period)
      const autoCategories = [];
      
      // HAB Line crossing in sandstorm
      const blueHabLine = [];
      const redHabLine = [];
      
      for (let i = 1; i <= 3; i++) {
        blueHabLine.push(blueBreakdown?.[`habLineRobot${i}`] || 'None');
        redHabLine.push(redBreakdown?.[`habLineRobot${i}`] || 'None');
      }
      
      autoCategories.push({ 
        name: 'Crossed HAB Line', 
        blue: `${blueHabLine.filter(status => status === 'CrossedHabLineInSandstorm').length}/3`, 
        red: `${redHabLine.filter(status => status === 'CrossedHabLineInSandstorm').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Sandstorm Bonus Points', 
        blue: blueBreakdown?.sandStormBonusPoints || '0', 
        red: redBreakdown?.sandStormBonusPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      
      // Count hatch panels and cargo
      const countCargoShipItems = (breakdown: any, itemType: string) => {
        let count = 0;
        for (let i = 1; i <= 8; i++) {
          const bay = breakdown?.[`bay${i}`] || 'None';
          if (itemType === 'panels' && (bay === 'Panel' || bay === 'PanelAndCargo')) count++;
          if (itemType === 'cargo' && (bay === 'Cargo' || bay === 'PanelAndCargo')) count++;
        }
        return count;
      };
      
      const countRocketItems = (breakdown: any, itemType: string) => {
        let count = 0;
        const positions = [
          'lowLeftRocketNear', 'lowRightRocketNear', 'lowLeftRocketFar', 'lowRightRocketFar',
          'midLeftRocketNear', 'midRightRocketNear', 'midLeftRocketFar', 'midRightRocketFar',
          'topLeftRocketNear', 'topRightRocketNear', 'topLeftRocketFar', 'topRightRocketFar'
        ];
        
        positions.forEach(pos => {
          const state = breakdown?.[pos] || 'None';
          if (itemType === 'panels' && (state === 'Panel' || state === 'PanelAndCargo')) count++;
          if (itemType === 'cargo' && (state === 'Cargo' || state === 'PanelAndCargo')) count++;
        });
        
        return count;
      };
      
      const bluePanelsCargoShip = countCargoShipItems(blueBreakdown, 'panels');
      const redPanelsCargoShip = countCargoShipItems(redBreakdown, 'panels');
      const blueCargoCargoShip = countCargoShipItems(blueBreakdown, 'cargo');
      const redCargoCargoShip = countCargoShipItems(redBreakdown, 'cargo');
      
      const bluePanelsRocket = countRocketItems(blueBreakdown, 'panels');
      const redPanelsRocket = countRocketItems(redBreakdown, 'panels');
      const blueCargoRocket = countRocketItems(blueBreakdown, 'cargo');
      const redCargoRocket = countRocketItems(redBreakdown, 'cargo');
      
      teleopCategories.push({ 
        name: 'Hatch Panels Total', 
        blue: bluePanelsCargoShip + bluePanelsRocket, 
        red: redPanelsCargoShip + redPanelsRocket 
      });
      
      teleopCategories.push({ 
        name: 'Panels - Cargo Ship', 
        blue: bluePanelsCargoShip, 
        red: redPanelsCargoShip 
      });
      
      teleopCategories.push({ 
        name: 'Panels - Rocket', 
        blue: bluePanelsRocket, 
        red: redPanelsRocket 
      });
      
      teleopCategories.push({ 
        name: 'Hatch Panel Points', 
        blue: blueBreakdown?.hatchPanelPoints || '0', 
        red: redBreakdown?.hatchPanelPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Cargo Total', 
        blue: blueCargoCargoShip + blueCargoRocket, 
        red: redCargoCargoShip + redCargoRocket 
      });
      
      teleopCategories.push({ 
        name: 'Cargo - Cargo Ship', 
        blue: blueCargoCargoShip, 
        red: redCargoCargoShip 
      });
      
      teleopCategories.push({ 
        name: 'Cargo - Rocket', 
        blue: blueCargoRocket, 
        red: redCargoRocket 
      });
      
      teleopCategories.push({ 
        name: 'Cargo Points', 
        blue: blueBreakdown?.cargoPoints || '0', 
        red: redBreakdown?.cargoPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Completed Rockets', 
        blue: (blueBreakdown?.completedRocketNear ? 1 : 0) + (blueBreakdown?.completedRocketFar ? 1 : 0), 
        red: (redBreakdown?.completedRocketNear ? 1 : 0) + (redBreakdown?.completedRocketFar ? 1 : 0) 
      });
      
      // Calculate teleop points (excluding sandstorm bonus and endgame)
      const blueTeleopOnlyPoints = (blueBreakdown?.hatchPanelPoints || 0) + (blueBreakdown?.cargoPoints || 0);
      const redTeleopOnlyPoints = (redBreakdown?.hatchPanelPoints || 0) + (redBreakdown?.cargoPoints || 0);
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueTeleopOnlyPoints, 
        red: redTeleopOnlyPoints 
      });

      // Endgame categories
      const endgameCategories = [];
      
      const blueEndgame = [];
      const redEndgame = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotEndgame = blueBreakdown?.[`endgameRobot${i}`] || 'None';
        const redRobotEndgame = redBreakdown?.[`endgameRobot${i}`] || 'None';
        blueEndgame.push(blueRobotEndgame);
        redEndgame.push(redRobotEndgame);
      }
      
      endgameCategories.push({ 
        name: 'HAB Level 1', 
        blue: `${blueEndgame.filter(status => status === 'HabLevel1').length}/3`, 
        red: `${redEndgame.filter(status => status === 'HabLevel1').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'HAB Level 2', 
        blue: `${blueEndgame.filter(status => status === 'HabLevel2').length}/3`, 
        red: `${redEndgame.filter(status => status === 'HabLevel2').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'HAB Level 3', 
        blue: `${blueEndgame.filter(status => status === 'HabLevel3').length}/3`, 
        red: `${redEndgame.filter(status => status === 'HabLevel3').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'HAB Climb Points', 
        blue: blueBreakdown?.habClimbPoints || '0', 
        red: redBreakdown?.habClimbPoints || '0' 
      });

      // Bonus categories
      const bonusCategories = [];
      bonusCategories.push({ 
        name: 'Complete Rocket RP', 
        blue: blueBreakdown?.completeRocketRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.completeRocketRankingPoint ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'HAB Docking RP', 
        blue: blueBreakdown?.habDockingRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.habDockingRankingPoint ? 'Yes' : 'No' 
      });
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      breakdownSections = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Endgame', items: endgameCategories },
        { title: 'Bonus', items: bonusCategories }
      ];
    } else if (eventYear === 2018) {
      // 2018 FIRST POWER UP breakdown
      
      // Auto categories
      const autoCategories = [];
      
      // Auto run
      const blueAutoRun = [];
      const redAutoRun = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotAuto = blueBreakdown?.[`autoRobot${i}`] || 'None';
        const redRobotAuto = redBreakdown?.[`autoRobot${i}`] || 'None';
        blueAutoRun.push(blueRobotAuto);
        redAutoRun.push(redRobotAuto);
      }
      
      autoCategories.push({ 
        name: 'Auto Run', 
        blue: `${blueAutoRun.filter(status => status === 'AutoRun').length}/3`, 
        red: `${redAutoRun.filter(status => status === 'AutoRun').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Auto Run Points', 
        blue: blueBreakdown?.autoRunPoints || '0', 
        red: redBreakdown?.autoRunPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Switch at Zero', 
        blue: blueBreakdown?.autoSwitchAtZero ? 'Yes' : 'No', 
        red: redBreakdown?.autoSwitchAtZero ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Switch Ownership (sec)', 
        blue: blueBreakdown?.autoSwitchOwnershipSec || '0', 
        red: redBreakdown?.autoSwitchOwnershipSec || '0' 
      });
      
      autoCategories.push({ 
        name: 'Scale Ownership (sec)', 
        blue: blueBreakdown?.autoScaleOwnershipSec || '0', 
        red: redBreakdown?.autoScaleOwnershipSec || '0' 
      });
      
      autoCategories.push({ 
        name: 'Ownership Points', 
        blue: blueBreakdown?.autoOwnershipPoints || '0', 
        red: redBreakdown?.autoOwnershipPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      
      teleopCategories.push({ 
        name: 'Switch Ownership (sec)', 
        blue: blueBreakdown?.teleopSwitchOwnershipSec || '0', 
        red: redBreakdown?.teleopSwitchOwnershipSec || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Scale Ownership (sec)', 
        blue: blueBreakdown?.teleopScaleOwnershipSec || '0', 
        red: redBreakdown?.teleopScaleOwnershipSec || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Switch Boost (sec)', 
        blue: blueBreakdown?.teleopSwitchBoostSec || '0', 
        red: redBreakdown?.teleopSwitchBoostSec || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Scale Boost (sec)', 
        blue: blueBreakdown?.teleopScaleBoostSec || '0', 
        red: redBreakdown?.teleopScaleBoostSec || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Switch Force (sec)', 
        blue: blueBreakdown?.teleopSwitchForceSec || '0', 
        red: redBreakdown?.teleopSwitchForceSec || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Scale Force (sec)', 
        blue: blueBreakdown?.teleopScaleForceSec || '0', 
        red: redBreakdown?.teleopScaleForceSec || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Ownership Points', 
        blue: blueBreakdown?.teleopOwnershipPoints || '0', 
        red: redBreakdown?.teleopOwnershipPoints || '0' 
      });
      
      // Calculate teleop points (excluding vault and endgame)
      const blueTeleopOnlyPoints = (blueBreakdown?.teleopOwnershipPoints || 0);
      const redTeleopOnlyPoints = (redBreakdown?.teleopOwnershipPoints || 0);
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueTeleopOnlyPoints, 
        red: redTeleopOnlyPoints 
      });

      // Vault categories (part of teleop but separate section for clarity)
      const vaultCategories = [];
      
      vaultCategories.push({ 
        name: 'Boost Cubes', 
        blue: `${blueBreakdown?.vaultBoostTotal || 0}/3`, 
        red: `${redBreakdown?.vaultBoostTotal || 0}/3` 
      });
      
      vaultCategories.push({ 
        name: 'Force Cubes', 
        blue: `${blueBreakdown?.vaultForceTotal || 0}/3`, 
        red: `${redBreakdown?.vaultForceTotal || 0}/3` 
      });
      
      vaultCategories.push({ 
        name: 'Levitate Cubes', 
        blue: `${blueBreakdown?.vaultLevitateTotal || 0}/3`, 
        red: `${redBreakdown?.vaultLevitateTotal || 0}/3` 
      });
      
      vaultCategories.push({ 
        name: 'Boost Played', 
        blue: blueBreakdown?.vaultBoostPlayed || '0', 
        red: redBreakdown?.vaultBoostPlayed || '0' 
      });
      
      vaultCategories.push({ 
        name: 'Force Played', 
        blue: blueBreakdown?.vaultForcePlayed || '0', 
        red: redBreakdown?.vaultForcePlayed || '0' 
      });
      
      vaultCategories.push({ 
        name: 'Levitate Played', 
        blue: blueBreakdown?.vaultLevitatePlayed || '0', 
        red: redBreakdown?.vaultLevitatePlayed || '0' 
      });
      
      vaultCategories.push({ 
        name: 'Vault Points', 
        blue: blueBreakdown?.vaultPoints || '0', 
        red: redBreakdown?.vaultPoints || '0' 
      });

      // Endgame categories
      const endgameCategories = [];
      
      const blueEndgame = [];
      const redEndgame = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotEndgame = blueBreakdown?.[`endgameRobot${i}`] || 'None';
        const redRobotEndgame = redBreakdown?.[`endgameRobot${i}`] || 'None';
        blueEndgame.push(blueRobotEndgame);
        redEndgame.push(redRobotEndgame);
      }
      
      endgameCategories.push({ 
        name: 'Parking', 
        blue: `${blueEndgame.filter(status => status === 'Parking').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Parking').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Climbing', 
        blue: `${blueEndgame.filter(status => status === 'Climbing').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Climbing').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Levitate', 
        blue: `${blueEndgame.filter(status => status === 'Levitate').length}/3`, 
        red: `${redEndgame.filter(status => status === 'Levitate').length}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Endgame Points', 
        blue: blueBreakdown?.endgamePoints || '0', 
        red: redBreakdown?.endgamePoints || '0' 
      });

      // Bonus categories
      const bonusCategories = [];
      bonusCategories.push({ 
        name: 'Auto Quest RP', 
        blue: blueBreakdown?.autoQuestRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.autoQuestRankingPoint ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'Face the Boss RP', 
        blue: blueBreakdown?.faceTheBossRankingPoint ? 'Yes' : 'No', 
        red: redBreakdown?.faceTheBossRankingPoint ? 'Yes' : 'No' 
      });
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      breakdownSections = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Vault', items: vaultCategories },
        { title: 'Endgame', items: endgameCategories },
        { title: 'Bonus', items: bonusCategories }
      ];
    } else if (eventYear === 2017) {
      // 2017 FIRST Steamworks breakdown
      
      // Auto categories
      const autoCategories = [];
      
      // Mobility
      const blueMobility = [];
      const redMobility = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotAuto = blueBreakdown?.[`robot${i}Auto`] || 'None';
        const redRobotAuto = redBreakdown?.[`robot${i}Auto`] || 'None';
        blueMobility.push(blueRobotAuto);
        redMobility.push(redRobotAuto);
      }
      
      autoCategories.push({ 
        name: 'Mobility', 
        blue: `${blueMobility.filter(status => status === 'Mobility').length}/3`, 
        red: `${redMobility.filter(status => status === 'Mobility').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Mobility Points', 
        blue: blueBreakdown?.autoMobilityPoints || '0', 
        red: redBreakdown?.autoMobilityPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Fuel High', 
        blue: blueBreakdown?.autoFuelHigh || '0', 
        red: redBreakdown?.autoFuelHigh || '0' 
      });
      
      autoCategories.push({ 
        name: 'Fuel Low', 
        blue: blueBreakdown?.autoFuelLow || '0', 
        red: redBreakdown?.autoFuelLow || '0' 
      });
      
      autoCategories.push({ 
        name: 'Fuel Points', 
        blue: blueBreakdown?.autoFuelPoints || '0', 
        red: redBreakdown?.autoFuelPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Rotor 1 Engaged', 
        blue: blueBreakdown?.rotor1Auto ? 'Yes' : 'No', 
        red: redBreakdown?.rotor1Auto ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Rotor Points', 
        blue: blueBreakdown?.autoRotorPoints || '0', 
        red: redBreakdown?.autoRotorPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      
      teleopCategories.push({ 
        name: 'Fuel High', 
        blue: blueBreakdown?.teleopFuelHigh || '0', 
        red: redBreakdown?.teleopFuelHigh || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Fuel Low', 
        blue: blueBreakdown?.teleopFuelLow || '0', 
        red: redBreakdown?.teleopFuelLow || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Fuel Points', 
        blue: blueBreakdown?.teleopFuelPoints || '0', 
        red: redBreakdown?.teleopFuelPoints || '0' 
      });
      
      // Rotor status
      const blueRotorsEngaged = [
        blueBreakdown?.rotor1Engaged,
        blueBreakdown?.rotor2Engaged, 
        blueBreakdown?.rotor3Engaged,
        blueBreakdown?.rotor4Engaged
      ].filter(Boolean).length;
      
      const redRotorsEngaged = [
        redBreakdown?.rotor1Engaged,
        redBreakdown?.rotor2Engaged, 
        redBreakdown?.rotor3Engaged,
        redBreakdown?.rotor4Engaged
      ].filter(Boolean).length;
      
      teleopCategories.push({ 
        name: 'Rotors Engaged', 
        blue: `${blueRotorsEngaged}/4`, 
        red: `${redRotorsEngaged}/4` 
      });
      
      teleopCategories.push({ 
        name: 'Rotor 1', 
        blue: blueBreakdown?.rotor1Engaged ? 'Yes' : 'No', 
        red: redBreakdown?.rotor1Engaged ? 'Yes' : 'No' 
      });
      
      teleopCategories.push({ 
        name: 'Rotor 2', 
        blue: blueBreakdown?.rotor2Engaged ? 'Yes' : 'No', 
        red: redBreakdown?.rotor2Engaged ? 'Yes' : 'No' 
      });
      
      teleopCategories.push({ 
        name: 'Rotor 3', 
        blue: blueBreakdown?.rotor3Engaged ? 'Yes' : 'No', 
        red: redBreakdown?.rotor3Engaged ? 'Yes' : 'No' 
      });
      
      teleopCategories.push({ 
        name: 'Rotor 4', 
        blue: blueBreakdown?.rotor4Engaged ? 'Yes' : 'No', 
        red: redBreakdown?.rotor4Engaged ? 'Yes' : 'No' 
      });
      
      teleopCategories.push({ 
        name: 'Rotor Points', 
        blue: blueBreakdown?.teleopRotorPoints || '0', 
        red: redBreakdown?.teleopRotorPoints || '0' 
      });
      
      // Calculate teleop points (excluding takeoff)
      const blueTeleopOnlyPoints = (blueBreakdown?.teleopFuelPoints || 0) + (blueBreakdown?.teleopRotorPoints || 0);
      const redTeleopOnlyPoints = (redBreakdown?.teleopFuelPoints || 0) + (redBreakdown?.teleopRotorPoints || 0);
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueTeleopOnlyPoints, 
        red: redTeleopOnlyPoints 
      });

      // Endgame categories
      const endgameCategories = [];
      
      // Count touchpad positions
      const blueTouchpads = [
        blueBreakdown?.touchpadNear,
        blueBreakdown?.touchpadMiddle,
        blueBreakdown?.touchpadFar
      ];
      
      const redTouchpads = [
        redBreakdown?.touchpadNear,
        redBreakdown?.touchpadMiddle,
        redBreakdown?.touchpadFar
      ];
      
      const blueReadyForTakeoff = blueTouchpads.filter(status => status === 'ReadyForTakeoff').length;
      const redReadyForTakeoff = redTouchpads.filter(status => status === 'ReadyForTakeoff').length;
      
      endgameCategories.push({ 
        name: 'Ready for Takeoff', 
        blue: `${blueReadyForTakeoff}/3`, 
        red: `${redReadyForTakeoff}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Near Touchpad', 
        blue: blueBreakdown?.touchpadNear || 'None', 
        red: redBreakdown?.touchpadNear || 'None' 
      });
      
      endgameCategories.push({ 
        name: 'Middle Touchpad', 
        blue: blueBreakdown?.touchpadMiddle || 'None', 
        red: redBreakdown?.touchpadMiddle || 'None' 
      });
      
      endgameCategories.push({ 
        name: 'Far Touchpad', 
        blue: blueBreakdown?.touchpadFar || 'None', 
        red: redBreakdown?.touchpadFar || 'None' 
      });
      
      endgameCategories.push({ 
        name: 'Takeoff Points', 
        blue: blueBreakdown?.teleopTakeoffPoints || '0', 
        red: redBreakdown?.teleopTakeoffPoints || '0' 
      });

      // Bonus categories
      const bonusCategories = [];
      bonusCategories.push({ 
        name: 'Rotor RP', 
        blue: blueBreakdown?.rotorRankingPointAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.rotorRankingPointAchieved ? 'Yes' : 'No' 
      });

      bonusCategories.push({ 
        name: 'kPa RP', 
        blue: blueBreakdown?.kPaRankingPointAchieved ? 'Yes' : 'No', 
        red: redBreakdown?.kPaRankingPointAchieved ? 'Yes' : 'No' 
      });
      
      // kPa bonus points (if any)
      if ((blueBreakdown?.kPaBonusPoints && blueBreakdown.kPaBonusPoints > 0) || 
          (redBreakdown?.kPaBonusPoints && redBreakdown.kPaBonusPoints > 0)) {
        bonusCategories.push({ 
          name: 'kPa Bonus Points', 
          blue: blueBreakdown?.kPaBonusPoints || '0', 
          red: redBreakdown?.kPaBonusPoints || '0' 
        });
      }
      
      // Rotor bonus points (if any)
      if ((blueBreakdown?.rotorBonusPoints && blueBreakdown.rotorBonusPoints > 0) || 
          (redBreakdown?.rotorBonusPoints && redBreakdown.rotorBonusPoints > 0)) {
        bonusCategories.push({ 
          name: 'Rotor Bonus Points', 
          blue: blueBreakdown?.rotorBonusPoints || '0', 
          red: redBreakdown?.rotorBonusPoints || '0' 
        });
      }
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      breakdownSections = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Endgame', items: endgameCategories },
        { title: 'Bonus', items: bonusCategories }
      ];
    } else if (eventYear === 2016) {
      // 2016 FIRST Stronghold breakdown
      
      // Auto categories
      const autoCategories = [];
      
      // Auto crossing
      const blueAutoCrossing = [];
      const redAutoCrossing = [];
      
      for (let i = 1; i <= 3; i++) {
        const blueRobotAuto = blueBreakdown?.[`robot${i}Auto`] || 'None';
        const redRobotAuto = redBreakdown?.[`robot${i}Auto`] || 'None';
        blueAutoCrossing.push(blueRobotAuto);
        redAutoCrossing.push(redRobotAuto);
      }
      
      autoCategories.push({ 
        name: 'Crossed Defenses', 
        blue: `${blueAutoCrossing.filter(status => status === 'Crossed').length}/3`, 
        red: `${redAutoCrossing.filter(status => status === 'Crossed').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Reaching Defenses', 
        blue: `${blueAutoCrossing.filter(status => status === 'Reached').length}/3`, 
        red: `${redAutoCrossing.filter(status => status === 'Reached').length}/3` 
      });
      
      autoCategories.push({ 
        name: 'Crossing Points', 
        blue: blueBreakdown?.autoCrossingPoints || '0', 
        red: redBreakdown?.autoCrossingPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Reach Points', 
        blue: blueBreakdown?.autoReachPoints || '0', 
        red: redBreakdown?.autoReachPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Boulders High', 
        blue: blueBreakdown?.autoBouldersHigh || '0', 
        red: redBreakdown?.autoBouldersHigh || '0' 
      });
      
      autoCategories.push({ 
        name: 'Boulders Low', 
        blue: blueBreakdown?.autoBouldersLow || '0', 
        red: redBreakdown?.autoBouldersLow || '0' 
      });
      
      autoCategories.push({ 
        name: 'Boulder Points', 
        blue: blueBreakdown?.autoBoulderPoints || '0', 
        red: redBreakdown?.autoBoulderPoints || '0' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.autoPoints || '0', 
        red: redBreakdown?.autoPoints || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      
      // Defense information
      const defenseTypes: { [key: string]: string } = {
        'A_Portcullis': 'Portcullis',
        'A_ChevalDeFrise': 'Cheval de Frise',
        'B_Ramparts': 'Ramparts',
        'B_Moat': 'Moat',
        'C_SallyPort': 'Sally Port',
        'C_Drawbridge': 'Drawbridge',
        'D_RoughTerrain': 'Rough Terrain',
        'D_RockWall': 'Rock Wall'
      };
      
      teleopCategories.push({ 
        name: 'Low Bar Crossings', 
        blue: blueBreakdown?.position1crossings || '0', 
        red: redBreakdown?.position1crossings || '0' 
      });
      
      for (let pos = 2; pos <= 5; pos++) {
        const blueDefense = blueBreakdown?.[`position${pos}`];
        const redDefense = redBreakdown?.[`position${pos}`];
        const blueCrossings = blueBreakdown?.[`position${pos}crossings`] || 0;
        const redCrossings = redBreakdown?.[`position${pos}crossings`] || 0;
        
        if (blueDefense || redDefense) {
          teleopCategories.push({ 
            name: `Pos ${pos}: ${defenseTypes[blueDefense] || defenseTypes[redDefense] || 'Unknown'}`, 
            blue: blueCrossings, 
            red: redCrossings 
          });
        }
      }
      
      teleopCategories.push({ 
        name: 'Crossing Points', 
        blue: blueBreakdown?.teleopCrossingPoints || '0', 
        red: redBreakdown?.teleopCrossingPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Boulders High', 
        blue: blueBreakdown?.teleopBouldersHigh || '0', 
        red: redBreakdown?.teleopBouldersHigh || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Boulders Low', 
        blue: blueBreakdown?.teleopBouldersLow || '0', 
        red: redBreakdown?.teleopBouldersLow || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Boulder Points', 
        blue: blueBreakdown?.teleopBoulderPoints || '0', 
        red: redBreakdown?.teleopBoulderPoints || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Defenses Breached', 
        blue: blueBreakdown?.teleopDefensesBreached ? 'Yes' : 'No', 
        red: redBreakdown?.teleopDefensesBreached ? 'Yes' : 'No' 
      });
      
      // Calculate teleop points (excluding tower challenges/scaling)
      const blueTeleopOnlyPoints = (blueBreakdown?.teleopCrossingPoints || 0) + (blueBreakdown?.teleopBoulderPoints || 0);
      const redTeleopOnlyPoints = (redBreakdown?.teleopCrossingPoints || 0) + (redBreakdown?.teleopBoulderPoints || 0);
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueTeleopOnlyPoints, 
        red: redTeleopOnlyPoints 
      });

      // Endgame categories (Tower)
      const endgameCategories = [];
      
      endgameCategories.push({ 
        name: 'Tower Face A', 
        blue: blueBreakdown?.towerFaceA || 'None', 
        red: redBreakdown?.towerFaceA || 'None' 
      });
      
      endgameCategories.push({ 
        name: 'Tower Face B', 
        blue: blueBreakdown?.towerFaceB || 'None', 
        red: redBreakdown?.towerFaceB || 'None' 
      });
      
      endgameCategories.push({ 
        name: 'Tower Face C', 
        blue: blueBreakdown?.towerFaceC || 'None', 
        red: redBreakdown?.towerFaceC || 'None' 
      });
      
      // Count challenges and scales
      const blueTowerFaces = [
        blueBreakdown?.towerFaceA,
        blueBreakdown?.towerFaceB,
        blueBreakdown?.towerFaceC
      ];
      
      const redTowerFaces = [
        redBreakdown?.towerFaceA,
        redBreakdown?.towerFaceB,
        redBreakdown?.towerFaceC
      ];
      
      const blueChallenged = blueTowerFaces.filter(face => face === 'Challenged').length;
      const redChallenged = redTowerFaces.filter(face => face === 'Challenged').length;
      const blueScaled = blueTowerFaces.filter(face => face === 'Scaled').length;
      const redScaled = redTowerFaces.filter(face => face === 'Scaled').length;
      
      endgameCategories.push({ 
        name: 'Faces Challenged', 
        blue: `${blueChallenged}/3`, 
        red: `${redChallenged}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Faces Scaled', 
        blue: `${blueScaled}/3`, 
        red: `${redScaled}/3` 
      });
      
      endgameCategories.push({ 
        name: 'Challenge Points', 
        blue: blueBreakdown?.teleopChallengePoints || '0', 
        red: redBreakdown?.teleopChallengePoints || '0' 
      });
      
      endgameCategories.push({ 
        name: 'Scale Points', 
        blue: blueBreakdown?.teleopScalePoints || '0', 
        red: redBreakdown?.teleopScalePoints || '0' 
      });
      
      endgameCategories.push({ 
        name: 'Tower Captured', 
        blue: blueBreakdown?.teleopTowerCaptured ? 'Yes' : 'No', 
        red: redBreakdown?.teleopTowerCaptured ? 'Yes' : 'No' 
      });
      
      endgameCategories.push({ 
        name: 'Tower Strength', 
        blue: blueBreakdown?.towerEndStrength || '0', 
        red: redBreakdown?.towerEndStrength || '0' 
      });

      // Bonus categories
      const bonusCategories = [];
      
      // Breach and capture points
      if ((blueBreakdown?.breachPoints && blueBreakdown.breachPoints > 0) || 
          (redBreakdown?.breachPoints && redBreakdown.breachPoints > 0)) {
        bonusCategories.push({ 
          name: 'Breach Points', 
          blue: blueBreakdown?.breachPoints || '0', 
          red: redBreakdown?.breachPoints || '0' 
        });
      }
      
      if ((blueBreakdown?.capturePoints && blueBreakdown.capturePoints > 0) || 
          (redBreakdown?.capturePoints && redBreakdown.capturePoints > 0)) {
        bonusCategories.push({ 
          name: 'Capture Points', 
          blue: blueBreakdown?.capturePoints || '0', 
          red: redBreakdown?.capturePoints || '0' 
        });
      }
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjustPoints && blueBreakdown.adjustPoints > 0) || 
          (redBreakdown?.adjustPoints && redBreakdown.adjustPoints > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      // Only include bonus section if there are bonus items
      const breakdownSectionsList = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Endgame', items: endgameCategories }
      ];
      
      if (bonusCategories.length > 0) {
        breakdownSectionsList.push({ title: 'Bonus', items: bonusCategories });
      }

      breakdownSections = breakdownSectionsList;
    } else if (eventYear === 2015) {
      // 2015 Recycle Rush breakdown
      
      // Auto categories
      const autoCategories = [];
      
      autoCategories.push({ 
        name: 'Robot Set', 
        blue: blueBreakdown?.robot_set ? 'Yes' : 'No', 
        red: redBreakdown?.robot_set ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Tote Set', 
        blue: blueBreakdown?.tote_set ? 'Yes' : 'No', 
        red: redBreakdown?.tote_set ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Container Set', 
        blue: blueBreakdown?.container_set ? 'Yes' : 'No', 
        red: redBreakdown?.container_set ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Tote Stack', 
        blue: blueBreakdown?.tote_stack ? 'Yes' : 'No', 
        red: redBreakdown?.tote_stack ? 'Yes' : 'No' 
      });
      
      autoCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.auto_points || '0', 
        red: redBreakdown?.auto_points || '0' 
      });

      // Teleop categories
      const teleopCategories = [];
      
      // Tote scoring
      teleopCategories.push({ 
        name: 'Totes Near Zone', 
        blue: blueBreakdown?.tote_count_near || '0', 
        red: redBreakdown?.tote_count_near || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Totes Far Zone', 
        blue: blueBreakdown?.tote_count_far || '0', 
        red: redBreakdown?.tote_count_far || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Total Totes', 
        blue: (blueBreakdown?.tote_count_near || 0) + (blueBreakdown?.tote_count_far || 0), 
        red: (redBreakdown?.tote_count_near || 0) + (redBreakdown?.tote_count_far || 0) 
      });
      
      teleopCategories.push({ 
        name: 'Tote Points', 
        blue: blueBreakdown?.tote_points || '0', 
        red: redBreakdown?.tote_points || '0' 
      });
      
      // Container scoring by level
      teleopCategories.push({ 
        name: 'Containers Level 1', 
        blue: blueBreakdown?.container_count_level1 || '0', 
        red: redBreakdown?.container_count_level1 || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Containers Level 2', 
        blue: blueBreakdown?.container_count_level2 || '0', 
        red: redBreakdown?.container_count_level2 || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Containers Level 3', 
        blue: blueBreakdown?.container_count_level3 || '0', 
        red: redBreakdown?.container_count_level3 || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Containers Level 4', 
        blue: blueBreakdown?.container_count_level4 || '0', 
        red: redBreakdown?.container_count_level4 || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Containers Level 5', 
        blue: blueBreakdown?.container_count_level5 || '0', 
        red: redBreakdown?.container_count_level5 || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Containers Level 6', 
        blue: blueBreakdown?.container_count_level6 || '0', 
        red: redBreakdown?.container_count_level6 || '0' 
      });
      
      // Total containers
      const blueTotalContainers = (blueBreakdown?.container_count_level1 || 0) + 
                                   (blueBreakdown?.container_count_level2 || 0) + 
                                   (blueBreakdown?.container_count_level3 || 0) + 
                                   (blueBreakdown?.container_count_level4 || 0) + 
                                   (blueBreakdown?.container_count_level5 || 0) + 
                                   (blueBreakdown?.container_count_level6 || 0);
      
      const redTotalContainers = (redBreakdown?.container_count_level1 || 0) + 
                                 (redBreakdown?.container_count_level2 || 0) + 
                                 (redBreakdown?.container_count_level3 || 0) + 
                                 (redBreakdown?.container_count_level4 || 0) + 
                                 (redBreakdown?.container_count_level5 || 0) + 
                                 (redBreakdown?.container_count_level6 || 0);
      
      teleopCategories.push({ 
        name: 'Total Containers', 
        blue: blueTotalContainers, 
        red: redTotalContainers 
      });
      
      teleopCategories.push({ 
        name: 'Container Points', 
        blue: blueBreakdown?.container_points || '0', 
        red: redBreakdown?.container_points || '0' 
      });
      
      // Litter scoring
      teleopCategories.push({ 
        name: 'Litter in Container', 
        blue: blueBreakdown?.litter_count_container || '0', 
        red: redBreakdown?.litter_count_container || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Litter in Landfill', 
        blue: blueBreakdown?.litter_count_landfill || '0', 
        red: redBreakdown?.litter_count_landfill || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Unprocessed Litter', 
        blue: blueBreakdown?.litter_count_unprocessed || '0', 
        red: redBreakdown?.litter_count_unprocessed || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Litter Points', 
        blue: blueBreakdown?.litter_points || '0', 
        red: redBreakdown?.litter_points || '0' 
      });
      
      teleopCategories.push({ 
        name: 'Points', 
        blue: blueBreakdown?.teleop_points || '0', 
        red: redBreakdown?.teleop_points || '0' 
      });

      // Coopertition (shared between alliances)
      const coopertitionCategories = [];
      
      const coopertitionStatus = (matchData?.score_breakdown as any)?.coopertition || 'None';
      const coopertitionPoints = (matchData?.score_breakdown as any)?.coopertition_points || 0;
      
      coopertitionCategories.push({ 
        name: 'Coopertition', 
        blue: coopertitionStatus, 
        red: coopertitionStatus 
      });
      
      coopertitionCategories.push({ 
        name: 'Coopertition Points', 
        blue: coopertitionPoints, 
        red: coopertitionPoints 
      });

      // Bonus categories
      const bonusCategories = [];
      
      // Adjustment points (if any)
      if ((blueBreakdown?.adjust_points && blueBreakdown.adjust_points > 0) || 
          (redBreakdown?.adjust_points && redBreakdown.adjust_points > 0)) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjust_points || '0', 
          red: redBreakdown?.adjust_points || '0' 
        });
      }

      // Build sections list
      const breakdownSectionsList = [
        { title: 'Auto', items: autoCategories },
        { title: 'Teleop', items: teleopCategories },
        { title: 'Coopertition', items: coopertitionCategories }
      ];
      
      if (bonusCategories.length > 0) {
        breakdownSectionsList.push({ title: 'Bonus', items: bonusCategories });
      }

      breakdownSections = breakdownSectionsList;
    } else {
      // Generic breakdown for other years - show common elements that appear in most games
      const autoCategories = [];
      const teleopCategories = [];
      const endgameCategories = [];
      const bonusCategories = [];

      // Auto section - common elements
      if (blueBreakdown?.autoPoints !== undefined || redBreakdown?.autoPoints !== undefined) {
        autoCategories.push({ 
          name: 'Points', 
          blue: blueBreakdown?.autoPoints || '0', 
          red: redBreakdown?.autoPoints || '0' 
        });
      }

      // Teleop section - common elements  
      if (blueBreakdown?.teleopPoints !== undefined || redBreakdown?.teleopPoints !== undefined) {
        teleopCategories.push({ 
          name: 'Points', 
          blue: blueBreakdown?.teleopPoints || '0', 
          red: redBreakdown?.teleopPoints || '0' 
        });
      }

      // Endgame section - common elements
      if (blueBreakdown?.endgamePoints !== undefined || redBreakdown?.endgamePoints !== undefined) {
        endgameCategories.push({ 
          name: 'Points', 
          blue: blueBreakdown?.endgamePoints || '0', 
          red: redBreakdown?.endgamePoints || '0' 
        });
      }

      // Foul points - appears in most games
      if (blueBreakdown?.foulPoints !== undefined || redBreakdown?.foulPoints !== undefined) {
        bonusCategories.push({ 
          name: 'Foul Points', 
          blue: blueBreakdown?.foulPoints || '0', 
          red: redBreakdown?.foulPoints || '0' 
        });
      }

      // Tech foul points
      if (blueBreakdown?.techFoulPoints !== undefined || redBreakdown?.techFoulPoints !== undefined) {
        bonusCategories.push({ 
          name: 'Tech Foul Points', 
          blue: blueBreakdown?.techFoulPoints || '0', 
          red: redBreakdown?.techFoulPoints || '0' 
        });
      }

      // Adjustment points - appears in most games
      if (blueBreakdown?.adjustPoints !== undefined || redBreakdown?.adjustPoints !== undefined) {
        bonusCategories.push({ 
          name: 'Adjustment Points', 
          blue: blueBreakdown?.adjustPoints || '0', 
          red: redBreakdown?.adjustPoints || '0' 
        });
      }

      // Build sections list
      const breakdownSectionsList = [];
      
      if (autoCategories.length > 0) {
        breakdownSectionsList.push({ title: 'Auto', items: autoCategories });
      }
      
      if (teleopCategories.length > 0) {
        breakdownSectionsList.push({ title: 'Teleop', items: teleopCategories });
      }
      
      if (endgameCategories.length > 0) {
        breakdownSectionsList.push({ title: 'Endgame', items: endgameCategories });
      }
      
      if (bonusCategories.length > 0) {
        breakdownSectionsList.push({ title: 'Bonus', items: bonusCategories });
      }

      // If no specific categories found, show basic total points
      if (breakdownSectionsList.length === 0) {
        breakdownSectionsList.push({
          title: 'Total',
          items: [
            { 
              name: 'Score', 
              blue: matchData?.alliances?.blue?.score || '0', 
              red: matchData?.alliances?.red?.score || '0' 
            }
          ]
        });
      }

      breakdownSections = breakdownSectionsList;
    }

    // Remove Bonus section for playoff matches
    if (isPlayoffMatch && breakdownSections) {
      breakdownSections = breakdownSections.filter(section => section.title !== 'Bonus');
    }

    return (
      <div className="overflow-x-auto">
        {/* Reef Visualization for 2025 matches */}
        {reefVisualization}
        
        {/* Grid Visualization for 2023 matches */}
        {gridVisualization}
        
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-gray-300 font-semibold">Category</th>
              <th className="text-center p-3 text-blue-400 font-semibold">Blue</th>
              <th className="text-center p-3 text-red-400 font-semibold">Red</th>
            </tr>
          </thead>
          <tbody>
            {breakdownSections.map((section ) => (
              <React.Fragment key={section.title}>
                {/* Section Header */}
                <tr className="bg-white/5">
                  <td colSpan={3} className="p-3 text-baywatch-orange/80 font-semibold text-sm uppercase tracking-wide">
                    {section.title}
                  </td>
                </tr>
                {/* Section Items */}
                {section.items.map((item ) => (
                  <tr key={`${section.title}-${item.name}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-gray-300">{item.name}</td>
                    <td className="p-3 text-center text-blue-400 font-mono font-semibold">{item.blue}</td>
                    <td className="p-3 text-center text-red-400 font-mono font-semibold">{item.red}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            
            {/* Penalties Section */}
            <tr className="bg-white/5">
              <td colSpan={3} className="p-3 text-baywatch-orange/80 font-semibold text-sm uppercase tracking-wide">
                Penalties
              </td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-3 text-gray-300">Fouls</td>
              <td className="p-3 text-center text-blue-400 font-mono font-semibold">{blueBreakdown?.foulCount || '0'}</td>
              <td className="p-3 text-center text-red-400 font-mono font-semibold">{redBreakdown?.foulCount || '0'}</td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-3 text-gray-300">Tech Fouls</td>
              <td className="p-3 text-center text-blue-400 font-mono font-semibold">{blueBreakdown?.techFoulCount || '0'}</td>
              <td className="p-3 text-center text-red-400 font-mono font-semibold">{redBreakdown?.techFoulCount || '0'}</td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-3 text-gray-300">Foul Points</td>
              <td className="p-3 text-center text-blue-400 font-mono font-semibold">{blueBreakdown?.foulPoints || '0'}</td>
              <td className="p-3 text-center text-red-400 font-mono font-semibold">{redBreakdown?.foulPoints || '0'}</td>
            </tr>
            
            {/* Total Row */}
            <tr className="bg-baywatch-orange/10 border-t-2 border-baywatch-orange/20">
              <td className="p-3 font-bold text-white">Total Score</td>
              <td className="p-3 text-center text-blue-400 font-mono font-bold text-lg">
                {matchData.alliances.blue.score || 0}
              </td>
              <td className="p-3 text-center text-red-400 font-mono font-bold text-lg">
                {matchData.alliances.red.score || 0}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Match Breakdown</h2>
      <div className="card-gradient backdrop-blur-sm border border-white/10 rounded-xl p-6">
        {renderBreakdownTable()}
      </div>
    </>
  );
};

export default MatchBreakdown;
