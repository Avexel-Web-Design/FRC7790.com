import { Hono } from 'hono';

// Declare expected environment bindings for type safety
interface EnvBindings {
  TBA_API_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
  AZURE_OPENAI_KEY?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_DEPLOYMENT?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_SITE_URL?: string;
  OPENROUTER_APP_NAME?: string;
}

// Minimal interface for incoming JSON body
interface MatchSummaryRequest {
  match_key?: string;
  match?: any; // full match object (optional to avoid refetch latency)
}

// Utility: build a concise stats line from match JSON
function buildStats(match: any): { prompt: string; fallback: string } {
  if (!match) {
    return { prompt: 'No match data provided.', fallback: 'Summary unavailable.' };
  }
  const blueTeams = match?.alliances?.blue?.team_keys?.map((t: string) => t.replace('frc','')).join(', ');
  const redTeams = match?.alliances?.red?.team_keys?.map((t: string) => t.replace('frc','')).join(', ');
  const blueScore = match?.alliances?.blue?.score;
  const redScore = match?.alliances?.red?.score;
  const winner = match?.winning_alliance;
  const comp = match?.comp_level;
  const key = match?.key;
  const base = `Match ${key} (${comp}) Blue [${blueTeams}] ${blueScore} - Red [${redTeams}] ${redScore}. Winner: ${winner || 'TBD'}.`;
  const breakdown = match?.score_breakdown;
  let extras = '';
  if (breakdown && breakdown.blue && breakdown.red) {
    // Pull a few interesting 2025 fields if they exist; fall back gracefully
    const pick = (side: any, fields: string[]) => fields.filter(f => side[f] !== undefined && side[f] !== null)
      .map(f => `${f}:${side[f]}`)
      .slice(0,6)
      .join(' ');
    extras = ` BlueStats(${pick(breakdown.blue, Object.keys(breakdown.blue))}) RedStats(${pick(breakdown.red, Object.keys(breakdown.red))})`;
  }
  return { 
    prompt: base + extras,
    fallback: `${blueScore != null && redScore != null ? (winner ? (winner==='blue'?'Blue':'Red') + ' Alliance victory' : 'Match tied') : 'Upcoming match'}: Blue ${blueScore ?? '--'} - Red ${redScore ?? '--'}`
  };
}

const ai = new Hono();

ai.post('/generate', async c => {
  const env = (c.env || {}) as EnvBindings; // typed view
  try {
    const body: MatchSummaryRequest = await c.req.json();
    const { match_key, match } = body;

    if (!match_key && !match) {
      return c.json({ error: 'match_key or match object required' }, 400);
    }

    // If full match object not supplied, fetch from TBA (server-side) for better caching
    let matchData = match;
    if (!matchData && match_key) {
      const resp = await fetch(`https://www.thebluealliance.com/api/v3/match/${match_key}`, {
        headers: { 'X-TBA-Auth-Key': env.TBA_API_KEY || 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf' }
      });
      if (!resp.ok) {
        return c.json({ error: 'Failed to fetch match data' }, 502);
      }
      matchData = await resp.json();
    }

    const { prompt, fallback } = buildStats(matchData);

    // If no AI key configured, return deterministic fallback so UI still shows something
  const openRouterKey = env.OPENROUTER_API_KEY; // Preferred if user wants OpenRouter (Grok)
  const apiKey = openRouterKey || env.OPENAI_API_KEY || env.AZURE_OPENAI_KEY || env.GROQ_API_KEY;
    if (!apiKey) {
      return c.json({ summary: fallback, model: 'fallback', cached: false });
    }

    // Simple provider selection (OpenAI compatible). Adjust base URL if Azure.
  // Provider precedence: openrouter -> azure -> openai (direct) -> groq
  const provider = openRouterKey ? 'openrouter' : (env.AZURE_OPENAI_DEPLOYMENT ? 'azure' : (env.OPENAI_API_KEY ? 'openai' : (env.GROQ_API_KEY ? 'groq' : 'fallback')));
    let summaryText = fallback;

    try {
      if (provider === 'openrouter') {
  const model = env.OPENROUTER_MODEL || 'xai/grok-2-1212'; // alias for Grok 4 fast if available
        const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': env.OPENROUTER_SITE_URL || 'https://www.frc7790.com',
            'X-Title': env.OPENROUTER_APP_NAME || 'FRC 7790'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: 'You are an expert FIRST Robotics Competition commentator. Produce a concise 1-2 sentence neutral match recap. Avoid speculation; use only provided data.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 120,
            temperature: 0.4
          })
        });
        if (resp.ok) {
          const data: any = await resp.json();
          summaryText = data.choices?.[0]?.message?.content?.trim() || fallback;
        }
      } else if (provider === 'azure') {
  const azureEndpoint = env.AZURE_OPENAI_ENDPOINT; // e.g., https://your-resource-name.openai.azure.com
  const deployment = env.AZURE_OPENAI_DEPLOYMENT;
        const resp = await fetch(`${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are an expert FIRST Robotics Competition commentator. Produce a concise 1-2 sentence neutral match recap. Avoid speculation; use only provided data.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 120,
            temperature: 0.4
          })
        });
        if (resp.ok) {
          const data: any = await resp.json();
          summaryText = data.choices?.[0]?.message?.content?.trim() || fallback;
        }
      } else if (provider === 'openai') {
        // OpenAI or other compat endpoint
  const baseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an expert FIRST Robotics Competition commentator. Produce a concise 1-2 sentence neutral match recap. Avoid speculation; use only provided data.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 120,
            temperature: 0.4
          })
        });
        if (resp.ok) {
          const data: any = await resp.json();
          summaryText = data.choices?.[0]?.message?.content?.trim() || fallback;
        }
      } else if (provider === 'groq') {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: env.GROQ_MODEL || 'llama-3.1-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an expert FIRST Robotics Competition commentator. Produce a concise 1-2 sentence neutral match recap. Avoid speculation; use only provided data.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 120,
            temperature: 0.4
          })
        });
        if (resp.ok) {
          const data: any = await resp.json();
          summaryText = data.choices?.[0]?.message?.content?.trim() || fallback;
        }
      }
    } catch (err) {
      console.error('AI generation error', err);
      // fall back silently
    }

    return c.json({ summary: summaryText, model: provider, promptUsed: prompt });
  } catch (err) {
    return c.json({ error: 'Bad request', details: (err as Error).message }, 400);
  }
});

export default ai;
