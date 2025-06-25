import React from 'react';
import type { MatchData } from '../../../hooks/useMatchData';

interface MatchBreakdownProps {
  matchData: MatchData;
}

const MatchBreakdown: React.FC<MatchBreakdownProps> = ({ matchData }) => {
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
    } else {
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
    }

    // Remove Bonus section for playoff matches
    if (isPlayoffMatch && breakdownSections) {
      breakdownSections = breakdownSections.filter(section => section.title !== 'Bonus');
    }

    return (
      <div className="overflow-x-auto">
        {/* Reef Visualization for 2025 matches */}
        {reefVisualization}
        
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
