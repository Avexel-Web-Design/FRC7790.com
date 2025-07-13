/**
 * Processes division short names to make them more concise for display
 */
function processDivisionName(shortName: string, eventKey: string): string {
  // Handle Michigan championship divisions
  if (eventKey.includes('micmp')) {
    // Remove "MSC - " prefix and take only the first word
    let processed = shortName.replace(/^MSC\s*-\s*/, '');
    // Take only the first word
    const firstWord = processed.split(/\s+/)[0];
    return firstWord;
  }
  
  // Handle Ontario Provincial Championship divisions
  if (eventKey.includes('oncmp')) {
    // Remove "OPC - " prefix and take only the first word
    let processed = shortName.replace(/^OPC\s*-\s*/, '');
    // Take only the first word
    const firstWord = processed.split(/\s+/)[0];
    return firstWord;
  }
  
  // Handle Texas District Championship divisions
  if (eventKey.includes('txcmp')) {
    // Remove "TDC - " prefix and take only the first word
    let processed = shortName.replace(/^TDC\s*-\s*/, '');
    // Take only the first word
    const firstWord = processed.split(/\s+/)[0];
    return firstWord;
  }
  
  // For other events, return the short name as-is
  return shortName;
}

export interface DivisionMapping {
  [allianceNumber: number]: string;
}

export interface DivisionUtilsResult {
  isChampionshipEvent: boolean;
  divisionMapping: DivisionMapping;
  allianceMapping: Record<string, number>;
}

/**
 * Determines if an event is a championship event and maps alliance numbers to division names
 */
export async function getDivisionMapping(eventKey: string): Promise<DivisionUtilsResult> {
  try {
    const { frcAPI } = await import('./frcAPI');
    
    // First, check if this is a championship event by fetching event details
    const eventData = await frcAPI.fetchEventData(eventKey);
    const hasDivisions = eventData.division_keys && eventData.division_keys.length > 0;
    
    // Fetch alliances for the current event
    const alliances = await frcAPI.fetchEventAlliances(eventKey);
    const allianceMapping: Record<string, number> = {};
    alliances.forEach((alliance: any, index: number) => {
      const allianceNumber = index + 1;
      alliance.picks.forEach((teamKey: string) => {
        allianceMapping[teamKey] = allianceNumber;
      });
    });

    const divisionMapping: DivisionMapping = {};

    // If this is a championship event, map alliance numbers to division names
    if (hasDivisions) {
      // For each division, find which alliance actually won by looking at matches
      for (let i = 0; i < eventData.division_keys.length; i++) {
        const divisionKey = eventData.division_keys[i];
        try {
          const divisionData = await frcAPI.fetchEventData(divisionKey);
          const divisionMatches = await frcAPI.fetchEventMatches(divisionKey);
          
          // Find the finals matches to determine the winner
          const finalsMatches = divisionMatches
            .filter((match: any) => match.comp_level === 'f')
            .sort((a: any, b: any) => a.match_number - b.match_number);
          
          if (finalsMatches.length > 0) {
            // Find the last completed finals match to determine the winner
            const completedFinalsMatches = finalsMatches.filter((match: any) => match.winning_alliance);
            
            if (completedFinalsMatches.length > 0) {
              const lastMatch = completedFinalsMatches[completedFinalsMatches.length - 1];
              const winningAlliance = lastMatch.winning_alliance;
              
              // Find which teams were on the winning alliance
              if (winningAlliance && lastMatch?.alliances?.[winningAlliance]?.team_keys) {
                const winningTeams = lastMatch.alliances[winningAlliance].team_keys;
                
                if (winningTeams.length > 0) {
                  // Use the captain (first team) to find which championship alliance they're in
                  const captainTeam = winningTeams[0];
                  const championshipAllianceNumber = allianceMapping[captainTeam];
                  
                  if (championshipAllianceNumber) {
                    const processedName = processDivisionName(
                      divisionData.short_name || `Division ${i + 1}`, 
                      eventKey
                    );
                    divisionMapping[championshipAllianceNumber] = processedName;
                  }
                }
              }
            } else {
              // If finals haven't been completed, we can't determine the winner yet
              console.log(`Division ${divisionKey} finals not yet completed`);
            }
          }
          
        } catch (err) {
          console.warn(`Failed to load division data for ${divisionKey}`, err);
          // Fallback to generic name
          divisionMapping[i + 1] = processDivisionName(`Division ${i + 1}`, eventKey);
        }
      }
    }

    return {
      isChampionshipEvent: hasDivisions,
      divisionMapping,
      allianceMapping
    };
    
  } catch (err) {
    console.warn('Failed to load division mapping', err);
    return {
      isChampionshipEvent: false,
      divisionMapping: {},
      allianceMapping: {}
    };
  }
}

/**
 * Gets the display name for an alliance (division name for championships, alliance number for regular events)
 */
export function getAllianceDisplayName(
  allianceNumber: number | null,
  isChampionshipEvent: boolean,
  divisionMapping: DivisionMapping,
  fallback: string = 'TBD'
): string {
  if (!allianceNumber) return fallback;
  
  if (isChampionshipEvent && divisionMapping[allianceNumber]) {
    return divisionMapping[allianceNumber];
  }
  
  return `Alliance ${allianceNumber}`;
}
