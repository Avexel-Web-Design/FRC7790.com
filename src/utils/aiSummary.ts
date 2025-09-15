import type { MatchData, EventData } from '../hooks/useMatchData';
import type { EventData as EventDataExtended, Match, TeamRanking, Award } from '../hooks/useEventData';

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
  teamData: any[]
): Promise<string> {
  try {
    const teamInfo = teamData.map(team => `${team.team_number} (${team.nickname})`).join(', ');
    
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
    return data.choices[0]?.message?.content || 'Summary unavailable';
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
    const topTeams = rankings.slice(0, 5).map(r => `${r.team_key.replace('frc', '')} (${r.team_name || r.nickname || 'Unknown'})`).join(', ');
    
    const matchStats = {
      total: matches.length,
      completed: matches.filter(m => m.alliances.blue.score !== -1 && m.alliances.red.score !== -1).length
    };

    const eventStatus = new Date(eventData.start_date) > new Date() ? 'upcoming' : 
                       new Date(eventData.end_date) < new Date() ? 'completed' : 'ongoing';

    const prompt = `Generate an engaging summary for this FRC (FIRST Robotics Competition) event. Keep it under 200 words and highlight the most important aspects.

Event Details:
- Event: ${eventData.name}
- Location: ${eventData.city}, ${eventData.state_prov}, ${eventData.country}
- Date: ${eventData.start_date} to ${eventData.end_date}
- Status: ${eventStatus}
- Total Teams: ${rankings.length}
- Matches: ${matchStats.completed}/${matchStats.total} completed
${rankings.length > 0 ? `- Top 5 Teams: ${topTeams}` : ''}
${awards.length > 0 ? `- Awards Presented: ${awards.length}` : ''}

Please provide an exciting summary that captures the spirit of FIRST Robotics Competition, highlighting competition intensity, team achievements, and the collaborative nature of FRC. Use appropriate robotics and competition terminology.`;

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
        max_tokens: 250,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || 'Summary unavailable';
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