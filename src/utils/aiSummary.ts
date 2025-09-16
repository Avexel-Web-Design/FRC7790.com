import type { MatchData, EventData } from '../hooks/useMatchData';
import type { EventData as EventDataExtended, Match, TeamRanking, Award } from '../hooks/useEventData';
import { marked } from 'marked';

const OPENROUTER_API_KEY = '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';
const MODEL = 'mistralai/mistral-small-3.2-24b-instruct:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Generate AI summary for a match
 */
export async function generateMatchSummary(
  matchData: MatchData,
  eventData: EventData,
  teamData: unknown[]
): Promise<string> {
  try {
    const teamInfo = teamData.map(team => {
      const teamObj = team as { team_number: number; nickname: string };
      return `${teamObj.team_number} (${teamObj.nickname})`;
    }).join(', ');
    
    const matchType = getMatchType(matchData.comp_level, matchData.set_number, matchData.match_number);
    
    const scoreInfo = matchData.alliances.blue.score !== null && matchData.alliances.red.score !== null
      ? `Blue Alliance scored ${matchData.alliances.blue.score} points, Red Alliance scored ${matchData.alliances.red.score} points. Winning alliance: ${matchData.winning_alliance || 'TBD'}`
      : 'Match scores not yet available';

    const prompt = `Generate a concise, engaging summary for this FRC (FIRST Robotics Competition) match. Keep it under 150 words and focus on the key highlights.

Match Details:
- Event: ${eventData.name}
- Match: ${matchType}
- Teams: Blue Alliance (${matchData.alliances.blue.team_keys.map(k => k.replace('frc', '')).join(', ')}) vs Red Alliance (${matchData.alliances.red.team_keys.map(k => k.replace('frc', '')).join(', ')})
- Team Names: ${teamInfo}
- ${scoreInfo}

Please provide an exciting, informative summary that would engage FRC fans, highlighting the competition aspect and team performance. Use robotics terminology appropriately.`;

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FRC 7790 Match Summary'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    const rawContent = data.choices[0]?.message?.content || 'Summary unavailable';
    return marked(rawContent);
  } catch (error) {
    console.error('Error generating match summary:', error);
    return 'Unable to generate match summary at this time.';
  }
}

/**
 * Generate AI summary for an event
 */
export async function generateEventSummary(
  eventData: EventDataExtended,
  rankings: TeamRanking[],
  matches: Match[],
  awards: Award[]
): Promise<string> {
  try {
    const prompt = `Using the FRC event data provided, generate a concise summary focusing on key results and playoff progression.

**Playoff Bracket:**
${matches.filter(m => ['qf', 'sf', 'f'].includes(m.comp_level)).length > 0 ? 
  matches.filter(m => ['qf', 'sf', 'f'].includes(m.comp_level))
    .sort((a, b) => {
      const order: Record<string, number> = { 'qf': 1, 'sf': 2, 'f': 3 };
      return order[a.comp_level] - order[b.comp_level] || a.set_number - b.set_number || a.match_number - b.match_number;
    })
    .map(m => {
      const type = m.comp_level === 'qf' ? 'Quarterfinal' : m.comp_level === 'sf' ? 'Semifinal' : 'Final';
      const blueTeams = m.alliances.blue.team_keys.map(k => k.replace('frc', '')).join(', ');
      const redTeams = m.alliances.red.team_keys.map(k => k.replace('frc', '')).join(', ');
      const blueScore = m.alliances.blue.score !== -1 ? m.alliances.blue.score : 'TBD';
      const redScore = m.alliances.red.score !== -1 ? m.alliances.red.score : 'TBD';
      const winner = m.winning_alliance ? `**${m.winning_alliance.toUpperCase()}**` : 'TBD';
      return `**${type} ${m.set_number || ''} Match ${m.match_number}:**\n- Blue: ${blueTeams} (${blueScore})\n- Red: ${redTeams} (${redScore})\n- Winner: ${winner}`;
    }).join('\n\n') : 'No playoff matches available'}

**Key Results:**
- **Winner:** ${rankings.length > 0 ? `**${rankings[0].team_key.replace('frc', '')}** (${rankings[0].wins}W-${rankings[0].losses}L-${rankings[0].ties}T)` : 'TBD'}
- **Final Match:** ${matches.filter(m => m.comp_level === 'f').length > 0 ? 
  (() => {
    const final = matches.filter(m => m.comp_level === 'f')[0];
    const blueTeams = final.alliances.blue.team_keys.map(k => k.replace('frc', '')).join(', ');
    const redTeams = final.alliances.red.team_keys.map(k => k.replace('frc', '')).join(', ');
    return `Blue: ${blueTeams} vs Red: ${redTeams}`;
  })() : 'No final match data'}
- **Dominant Teams:** ${rankings.length > 0 ? rankings.slice(0, 3).map(r => `${r.team_key.replace('frc', '')} (${r.wins}W)`).join(', ') : 'No ranking data'}

**Awards:** ${awards.length > 0 ? awards.slice(0, 5).map(a => `- ${a.name}: ${a.recipient_list?.map(r => r.team_key?.replace('frc', '') || r.awardee).join(', ') || 'TBD'}`).join('\n') : 'No awards data available'}

**Story Summary:**
${matches.filter(m => ['qf', 'sf', 'f'].includes(m.comp_level)).length > 0 ? 
  (() => {
    const playoffMatches = matches.filter(m => ['qf', 'sf', 'f'].includes(m.comp_level))
      .sort((a, b) => {
        const order: Record<string, number> = { 'qf': 1, 'sf': 2, 'f': 3 };
        return order[a.comp_level] - order[b.comp_level] || a.set_number - b.set_number || a.match_number - b.match_number;
      });
    
    const winner = playoffMatches.find(m => m.comp_level === 'f' && m.winning_alliance)?.winning_alliance;
    if (!winner) return 'Event results pending.';
    
    const finalMatch = playoffMatches.find(m => m.comp_level === 'f');
    const winningTeams = finalMatch && finalMatch.winning_alliance ? finalMatch.alliances[finalMatch.winning_alliance].team_keys.map((k: string) => k.replace('frc', '')).join(', ') : 'Unknown';
    
    // Count wins for the winning alliance
    const winningAllianceWins = playoffMatches.filter(m => m.winning_alliance === winner).length;
    const totalPlayoffMatches = playoffMatches.length;
    
    let story = `The championship alliance (${winningTeams})`;
    
    if (winningAllianceWins === totalPlayoffMatches) {
      story += ' dominated the entire playoff bracket, sweeping every match to claim victory.';
    } else if (winningAllianceWins >= totalPlayoffMatches * 0.7) {
      story += ' powered through the playoffs, winning most matches on their path to the championship.';
    } else {
      story += ' overcame playoff challenges to secure the event win.';
    }
    
    return story;
  })() : 'No playoff data available for story summary.'}

Format in clean Markdown with bold key information. Keep under 150 words and focus on the most important results.`;

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FRC 7790 Event Summary'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    const rawContent = data.choices[0]?.message?.content || 'Summary unavailable';
    return marked(rawContent);
  } catch (error) {
    console.error('Error generating event summary:', error);
    return 'Unable to generate event summary at this time.';
  }
}

/**
 * Helper function to get readable match type
 */
function getMatchType(compLevel: string, setNumber: number, matchNumber: number): string {
  switch (compLevel) {
    case 'qm':
      return `Qualification Match ${matchNumber}`;
    case 'ef':
      return `Elimination Round ${setNumber}, Match ${matchNumber}`;
    case 'qf':
      return `Quarterfinal ${setNumber}, Match ${matchNumber}`;
    case 'sf':
      return `Semifinal ${setNumber}, Match ${matchNumber}`;
    case 'f':
      return `Final Match ${matchNumber}`;
    default:
      return `Match ${matchNumber}`;
  }
}