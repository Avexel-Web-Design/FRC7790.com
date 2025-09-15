import type { MatchData, EventData } from '../hooks/useMatchData';
import type { Match, TeamRanking, Award } from '../hooks/useEventData';
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
  eventData: EventData
): Promise<string> {
  try {
    const matchType = getMatchType(matchData.comp_level, matchData.set_number, matchData.match_number);

    // Data dump for match analysis
    const matchDataDump = `
**Event Information:**
- Name: ${eventData.name}
- Key: ${eventData.key}
- Start Date: ${eventData.start_date}
- End Date: ${eventData.end_date}

**Match Information:**
- Type: ${matchType}
- Comp Level: ${matchData.comp_level}
- Set Number: ${matchData.set_number}
- Match Number: ${matchData.match_number}
- Predicted Time: ${matchData.predicted_time ? new Date(matchData.predicted_time).toISOString() : 'N/A'}

**Blue Alliance Complete Data:**
- Teams: ${JSON.stringify(matchData.alliances.blue.team_keys, null, 2)}
- Score: ${matchData.alliances.blue.score !== undefined ? matchData.alliances.blue.score : 'TBD'}

**Red Alliance Complete Data:**
- Teams: ${JSON.stringify(matchData.alliances.red.team_keys, null, 2)}
- Score: ${matchData.alliances.red.score !== undefined ? matchData.alliances.red.score : 'TBD'}

**Videos:**
- Available: ${matchData.videos ? matchData.videos.length : 0} video(s)
`;

    const prompt = `Here is complete data for an FRC match. Analyze all statistics and provide a strategic summary.

${matchDataDump}

**Analysis Instructions:**
Based on the complete match data above, provide a comprehensive strategic analysis:

1. **Match Outcome Analysis:** Explain the final score and key factors that contributed to the result.

2. **Blue Alliance Strategy:** 
   - Analyze their performance based on team composition and score
   - Identify their likely primary scoring strategy
   - Evaluate effectiveness of their approach
   - Highlight strengths and weaknesses

3. **Red Alliance Strategy:**
   - Analyze their performance based on team composition and score
   - Identify their likely primary scoring strategy 
   - Evaluate effectiveness of their approach
   - Highlight strengths and weaknesses

4. **Key Match Dynamics:**
   - Critical factors in the outcome
   - Team strengths that influenced the result
   - Strategic insights from the matchup

5. **Team Performance Insights:**
   - Which teams likely carried their alliance?
   - Notable performances based on team reputation and score
   - Alliance composition analysis

6. **Strategic Recommendations:**
   - What each alliance could improve
   - Tactical adjustments for future matches
   - How the winning strategy could be countered

Format as clean Markdown with clear sections and bullet points. Focus on strategic insights derived from the actual performance data.`;

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
        max_tokens: 400,
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
  rankings: TeamRanking[],
  matches: Match[],
  awards: Award[]
): Promise<string> {
  try {
    // Complete event data dump
    const eventDataDump = `
**Event Rankings (All Teams):**
${rankings.map((rank, index) => `
**Rank ${index + 1}: ${rank.team_key.replace('frc', '')}**
- Record: ${rank.wins}W-${rank.losses}L-${rank.ties}T
- Match Points: ${rank.sort_orders?.[0] || 'N/A'}
- Ranking Points: ${rank.sort_orders?.[1] || 'N/A'}
- Tiebreaker 1: ${rank.sort_orders?.[2] || 'N/A'}
- Tiebreaker 2: ${rank.sort_orders?.[3] || 'N/A'}
- Tiebreaker 3: ${rank.sort_orders?.[4] || 'N/A'}
`).join('\n')}

**All Matches Data:**
${matches.map(match => {
  const matchType = getMatchType(match.comp_level, match.set_number, match.match_number);
  const blueTeams = match.alliances.blue.team_keys.map(k => k.replace('frc', '')).join(', ');
  const redTeams = match.alliances.red.team_keys.map(k => k.replace('frc', '')).join(', ');
  const blueScore = match.alliances.blue.score !== undefined ? match.alliances.blue.score : 'TBD';
  const redScore = match.alliances.red.score !== undefined ? match.alliances.red.score : 'TBD';
  const winner = match.winning_alliance ? match.winning_alliance.toUpperCase() : 'TBD';
  
  return `**${matchType}:**
- Blue: ${blueTeams} (${blueScore})
- Red: ${redTeams} (${redScore})
- Winner: ${winner}`;
}).join('\n\n')}

**Awards Data:**
${awards.map(award => `
**${award.name}:**
- Recipient: ${award.recipient_list?.map(r => {
  if (r.team_key) {
    return r.team_key.replace('frc', '');
  }
  if (r.awardee) {
    return r.awardee;
  }
  return 'Unknown';
}).join(', ') || 'Unknown'}
- Year: ${award.year}
`).join('\n')}

**Playoff Structure Analysis:**
- Total Qualification Matches: ${matches.filter(m => m.comp_level === 'qm').length}
- Total Playoff Matches: ${matches.filter(m => ['qf', 'sf', 'f'].includes(m.comp_level)).length}`;

    const prompt = `Here is complete data for an FRC event. Analyze all statistics and provide a comprehensive event summary.

${eventDataDump}

**Event Analysis Instructions:**
Based on the complete event data above, create a detailed summary focusing on key events, team performances, and strategic insights:

1. **Overall Event Narrative:**
   - Championship story and progression
   - Key turning points and momentum shifts
   - Dominant themes or strategies that defined the event

2. **Top Performers Analysis:**
   - Break down the top 3-5 teams' performance
   - What made them successful (consistency, clutch plays)
   - How their strategies evolved through the event

3. **Alliance Dynamics:**
   - How qualification rankings influenced playoff seeding
   - Successful alliance combinations and why they worked
   - Surprising upsets or underdog stories

4. **Scoring Trends:**
   - Event-wide scoring patterns
   - Most effective strategies across different match types
   - Impact of team matchups on outcomes

5. **Playoff Breakdown:**
   - Key series and their outcomes
   - Critical matches that decided the bracket
   - How teams adapted between qualification and playoffs

6. **Awards and Recognition:**
   - Significance of major awards
   - Teams that exceeded or fell short of expectations
   - Event MVP performances

7. **Strategic Insights:**
   - What strategies proved most successful
   - Lessons learned for future competitions
   - Team development observations

Format as clean Markdown with clear sections, bullet points, and bold key information. Prioritize data-driven insights over speculation. Keep the summary comprehensive but focused on the most impactful elements of the event.`;

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
        max_tokens: 600,
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