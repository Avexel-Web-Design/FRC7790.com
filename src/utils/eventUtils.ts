import type { Match } from '../hooks/useEventData';

/**
 * Calculate the overall high score from all matches in an event
 * @param matches Array of matches from both qualification and playoff rounds
 * @param playoffMatches Array of playoff matches
 * @returns Object containing high score, match info, and alliance
 */
export function calculateEventHighScore(matches: Match[], playoffMatches: Match[]) {
  const allMatches = [...matches, ...playoffMatches];
  
  let highScore = 0;
  let highScoreMatch: Match | null = null;
  let highScoreAlliance: 'red' | 'blue' | null = null;

  // Iterate through all completed matches (those with scores)
  for (const match of allMatches) {
    if (match.alliances.blue.score !== null && match.alliances.blue.score !== undefined) {
      if (match.alliances.blue.score > highScore) {
        highScore = match.alliances.blue.score;
        highScoreMatch = match;
        highScoreAlliance = 'blue';
      }
    }

    if (match.alliances.red.score !== null && match.alliances.red.score !== undefined) {
      if (match.alliances.red.score > highScore) {
        highScore = match.alliances.red.score;
        highScoreMatch = match;
        highScoreAlliance = 'red';
      }
    }
  }

  return {
    highScore,
    match: highScoreMatch,
    alliance: highScoreAlliance,
    hasMatches: allMatches.length > 0,
    hasCompletedMatches: allMatches.some(
      match => match.alliances.blue.score !== null || match.alliances.red.score !== null
    )
  };
}

/**
 * Format match name for display
 */
export function formatMatchName(match: Match): string {
  if (match.comp_level === 'qm') {
    return `Q${match.match_number}`;
  } else if (match.comp_level === 'ef') {
    return `EF${match.set_number}M${match.match_number}`;
  } else if (match.comp_level === 'qf') {
    return `QF${match.set_number}M${match.match_number}`;
  } else if (match.comp_level === 'sf') {
    return `SF${match.set_number}M${match.match_number}`;
  } else if (match.comp_level === 'f') {
    return `F${match.match_number}`;
  }
  return match.key.split('_')[1].toUpperCase();
}