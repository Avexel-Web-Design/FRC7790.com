import type { Match } from '../hooks/useEventData';

export interface EventHighScores {
  overallHighScore: number;
  highScoringMatch: Match | null;
  blueHighScore: number;
  redHighScore: number;
  averageScore: number;
}

/**
 * Calculate high scores and statistics for an event
 * @param matches Array of matches from the event
 * @returns EventHighScores object with calculated statistics
 */
export function calculateEventHighScores(matches: Match[]): EventHighScores {
  if (!matches || matches.length === 0) {
    return {
      overallHighScore: 0,
      highScoringMatch: null,
      blueHighScore: 0,
      redHighScore: 0,
      averageScore: 0
    };
  }

  // Filter out matches without scores
  const scoredMatches = matches.filter(match => 
    match.alliances.blue.score !== null && 
    match.alliances.red.score !== null
  );

  if (scoredMatches.length === 0) {
    return {
      overallHighScore: 0,
      highScoringMatch: null,
      blueHighScore: 0,
      redHighScore: 0,
      averageScore: 0
    };
  }

  let overallHighScore = 0;
  let highScoringMatch: Match | null = null;
  let blueHighScore = 0;
  let redHighScore = 0;
  let totalScore = 0;
  let scoreCount = 0;

  scoredMatches.forEach(match => {
    const blueScore = match.alliances.blue.score || 0;
    const redScore = match.alliances.red.score || 0;

    // Check for overall high score
    if (blueScore > overallHighScore) {
      overallHighScore = blueScore;
      highScoringMatch = match;
    }
    if (redScore > overallHighScore) {
      overallHighScore = redScore;
      highScoringMatch = match;
    }

    // Track alliance-specific high scores
    if (blueScore > blueHighScore) {
      blueHighScore = blueScore;
    }
    if (redScore > redHighScore) {
      redHighScore = redScore;
    }

    // Calculate total for average
    totalScore += blueScore + redScore;
    scoreCount += 2;
  });

  const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  return {
    overallHighScore,
    highScoringMatch,
    blueHighScore,
    redHighScore,
    averageScore
  };
}

/**
 * Format match name for display
 * @param match Match object
 * @returns Formatted match name string
 */
export function formatMatchNameForHighScore(match: Match): string {
  if (!match) return '';
  
  switch (match.comp_level) {
    case 'qm':
      return `Q${match.match_number}`;
    case 'ef':
      return `EF${match.set_number}M${match.match_number}`;
    case 'qf':
      return `QF${match.set_number}M${match.match_number}`;
    case 'sf':
      return `SF${match.set_number}M${match.match_number}`;
    case 'f':
      return `F${match.match_number}`;
    default:
      return match.key.split('_')[1] || 'Match';
  }
}