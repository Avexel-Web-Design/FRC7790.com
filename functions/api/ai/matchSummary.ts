import { Hono } from 'hono';
import { Effect } from 'effect';
import { 
  effectHandler, 
  parseBody,
  ValidationError
} from '../lib/effect-hono';

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

interface Factor {
  name: string;
  blue: number;
  red: number;
  diff: number; // blue - red (positive means blue advantage)
  impactRank?: number;
}

// Utility: build a concise stats line from match JSON
function humanCompLevel(match: any): string {
  switch (match?.comp_level) {
    case 'qm': return 'qualification match';
    case 'ef': return 'eighth-final playoff match';
    case 'qf': return 'quarterfinal match';
    case 'sf': return 'semifinal match';
    case 'f': return 'finals match';
    default: return 'match';
  }
}

function classifyMargin(margin: number): string {
  if (margin <= 5) return 'narrow';
  if (margin <= 25) return 'moderate';
  if (margin <= 50) return 'decisive';
  return 'dominant';
}

function pickVerb(marginClass: string): string {
  switch (marginClass) {
    case 'narrow': return 'edges out';
    case 'moderate': return 'prevails over';
    case 'decisive': return 'defeats';
    default: return 'dominates';
  }
}

function buildStats(match: any): { prompt: string; fallback: string; factors: Factor[] } {
  if (!match) {
    return { prompt: 'No match data provided.', fallback: 'Summary unavailable.', factors: [] };
  }
  const blueTeams = match?.alliances?.blue?.team_keys?.map((t: string) => t.replace('frc','')).join(', ');
  const redTeams = match?.alliances?.red?.team_keys?.map((t: string) => t.replace('frc','')).join(', ');
  const blueScore = match?.alliances?.blue?.score;
  const redScore = match?.alliances?.red?.score;
  const winner = match?.winning_alliance;
  const key = match?.key;
  const round = humanCompLevel(match);
  const base = `${round} ${key}: Blue [${blueTeams}] ${blueScore} - Red [${redTeams}] ${redScore}. Winner: ${winner || 'TBD'}.`;
  const breakdown = match?.score_breakdown;
  const factors: Factor[] = [];
  if (breakdown && breakdown.blue && breakdown.red) {
    const blue = breakdown.blue;
    const red = breakdown.red;
    // Candidate numeric fields
    const candidateFields = Object.keys(blue).filter(k => typeof blue[k] === 'number' && typeof red[k] === 'number');
    for (const f of candidateFields) {
      const bVal = Number(blue[f]);
      const rVal = Number(red[f]);
      if (Number.isFinite(bVal) && Number.isFinite(rVal)) {
        // exclude obvious total duplication fields to reduce noise
        if (/^total/i.test(f)) continue;
        factors.push({ name: f, blue: bVal, red: rVal, diff: bVal - rVal });
      }
    }
    // Rank by absolute diff (importance) ignoring fields with zero diff
    factors.sort((a,b) => Math.abs(b.diff) - Math.abs(a.diff));
    // Keep top 8 raw, then assign impactRank to top 3 for summarization
    factors.slice(0,3).forEach((f,i)=> f.impactRank = i+1);
  }

  const margin = (blueScore != null && redScore != null) ? Math.abs((blueScore as number) - (redScore as number)) : null;
  const marginClass = margin != null ? classifyMargin(margin) : 'pending';
  const verb = winner ? pickVerb(marginClass) : 'ties';
  const winnerPhrase = winner ? (winner === 'blue' ? `Blue alliance ${verb} Red` : `Red alliance ${verb} Blue`) : 'Match tied';

  // Determine potential decisive factor keywords
  // Only count factors that actually favor the winning team
  const factorHints: string[] = [];
  const findField = (names: string[]) => factors.find(f => names.includes(f.name));
  const autoF = findField(['autoPoints','autoScore','auto']);
  const endF = findField(['endGamePoints','endgamePoints','endGameScore']);
  const foulF = findField(['foulPoints','foulScore']);
  
  // Check if factor favors winner: blue winner needs positive diff, red winner needs negative diff
  const favorsWinner = (f: Factor) => {
    if (!winner) return false;
    return winner === 'blue' ? f.diff > 0 : f.diff < 0;
  };
  
  if (foulF && Math.abs(foulF.diff) > 0 && margin && Math.abs(foulF.diff) >= margin * 0.5 && favorsWinner(foulF)) factorHints.push('penalties');
  if (autoF && margin && Math.abs(autoF.diff) >= margin * 0.35 && favorsWinner(autoF)) factorHints.push('auto performance');
  if (endF && margin && Math.abs(endF.diff) >= margin * 0.35 && favorsWinner(endF)) factorHints.push('endgame execution');

  const fallback = (blueScore != null && redScore != null)
    ? `${winnerPhrase}: ${blueScore} - ${redScore}${factorHints.length?` (factor: ${factorHints[0]})`:''}`
    : 'Upcoming match';

  const structured = {
    meta: { key, round, winner, margin, marginClass },
    alliances: { blue: { teams: blueTeams, score: blueScore }, red: { teams: redTeams, score: redScore } },
    topFactors: factors.slice(0,8),
    decisiveHints: factorHints
  };

  const prompt = `${base}\nSTRUCTURED_JSON=${JSON.stringify(structured)}`;
  return { prompt, fallback, factors };
}

// System prompt for AI match summaries (used across all providers)
const SYSTEM_PROMPT = 'You are an expert FIRST Robotics Competition commentator. Produce a concise 1-2 sentence recap. FIRST sentence: outcome & margin (if decisive). SECOND sentence (optional): key deciding factors using provided stats only (auto/endgame/penalties/objective bonuses). Do NOT repeat the raw score at the start. Do NOT mention event codes or match keys (e.g., say "qualification match 2" not "2025mitvc_qm2"). IMPORTANT: Convert technical field names into natural language (e.g., "teleopCoral" → "teleop coral", "autoPoints" → "auto points", "endGamePoints" → "endgame points", "foulPoints" → "foul points"). Break up camelCase and technical names into conversational phrases. Avoid speculation.';

// Fetch match data from TBA
const fetchMatchFromTBA = (matchKey: string, apiKey: string): Effect.Effect<any, Error, never> =>
  Effect.tryPromise({
    try: async () => {
      const resp = await fetch(`https://www.thebluealliance.com/api/v3/match/${matchKey}`, {
        headers: { 'X-TBA-Auth-Key': apiKey }
      });
      if (!resp.ok) {
        throw new Error('Failed to fetch match data from TBA');
      }
      return resp.json();
    },
    catch: (err) => new Error(String(err))
  });

// Call OpenRouter API
const callOpenRouter = (
  apiKey: string, 
  model: string, 
  prompt: string,
  siteUrl: string,
  appName: string
): Effect.Effect<string | null, never, never> =>
  Effect.promise(async () => {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': siteUrl,
          'X-Title': appName
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 160,
          temperature: 0.5
        })
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const candidate = data.choices?.[0]?.message?.content?.trim();
        if (candidate && candidate.length > 0) {
          return candidate;
        }
      }
    } catch (err) {
      console.error('OpenRouter API error', err);
    }
    return null;
  });

// Call Azure OpenAI API
const callAzureOpenAI = (
  endpoint: string,
  deployment: string,
  apiKey: string,
  prompt: string
): Effect.Effect<string | null, never, never> =>
  Effect.promise(async () => {
    try {
      const resp = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 160,
          temperature: 0.5
        })
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const candidate = data.choices?.[0]?.message?.content?.trim();
        if (candidate && candidate.length > 0) {
          return candidate;
        }
      }
    } catch (err) {
      console.error('Azure OpenAI API error', err);
    }
    return null;
  });

// Call OpenAI API
const callOpenAI = (
  baseUrl: string,
  model: string,
  apiKey: string,
  prompt: string
): Effect.Effect<string | null, never, never> =>
  Effect.promise(async () => {
    try {
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 160,
          temperature: 0.5
        })
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const candidate = data.choices?.[0]?.message?.content?.trim();
        if (candidate && candidate.length > 0) {
          return candidate;
        }
      }
    } catch (err) {
      console.error('OpenAI API error', err);
    }
    return null;
  });

// Call Groq API
const callGroq = (
  model: string,
  apiKey: string,
  prompt: string
): Effect.Effect<string | null, never, never> =>
  Effect.promise(async () => {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          max_tokens: 160,
          temperature: 0.5
        })
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const candidate = data.choices?.[0]?.message?.content?.trim();
        if (candidate && candidate.length > 0) {
          return candidate;
        }
      }
    } catch (err) {
      console.error('Groq API error', err);
    }
    return null;
  });

const ai = new Hono<{ Bindings: EnvBindings }>();

ai.post('/generate', effectHandler((c) =>
  Effect.gen(function* () {
    const env = (c.env || {}) as EnvBindings;
    
    const body = yield* parseBody<MatchSummaryRequest>(c);
    const { match_key, match } = body;

    if (!match_key && !match) {
      return yield* Effect.fail(ValidationError.single('match_key or match object required'));
    }

    // If full match object not supplied, fetch from TBA (server-side) for better caching
    let matchData = match;
    if (!matchData && match_key) {
      const tbaApiKey = env.TBA_API_KEY || 'gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf';
      matchData = yield* Effect.catchAll(
        fetchMatchFromTBA(match_key, tbaApiKey),
        () => Effect.succeed(null)
      );
      
      if (!matchData) {
        return { 
          summary: 'Failed to fetch match data', 
          model: 'fallback', 
          cached: false, 
          fallbackUsed: true, 
          factors: [] 
        };
      }
    }

    const { prompt, fallback, factors } = buildStats(matchData);

    // If no AI key configured, return deterministic fallback so UI still shows something
    const openRouterKey = env.OPENROUTER_API_KEY; // Preferred if user wants OpenRouter
    const apiKey = openRouterKey || env.OPENAI_API_KEY || env.AZURE_OPENAI_KEY || env.GROQ_API_KEY;
    
    if (!apiKey) {
      return { 
        summary: fallback, 
        model: 'fallback', 
        cached: false, 
        fallbackUsed: true, 
        factors: [] 
      };
    }

    // Provider precedence: openrouter -> azure -> openai (direct) -> groq
    const provider = openRouterKey ? 'openrouter' : 
                     (env.AZURE_OPENAI_DEPLOYMENT ? 'azure' : 
                     (env.OPENAI_API_KEY ? 'openai' : 
                     (env.GROQ_API_KEY ? 'groq' : 'fallback')));
    
    let summaryText = fallback;
    let usedAI = false;

    if (provider === 'openrouter' && openRouterKey) {
      const model = env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free';
      const siteUrl = env.OPENROUTER_SITE_URL || 'https://www.frc7790.com';
      const appName = env.OPENROUTER_APP_NAME || 'FRC 7790';
      const result = yield* callOpenRouter(openRouterKey, model, prompt, siteUrl, appName);
      if (result) {
        summaryText = result;
        usedAI = true;
      }
    } else if (provider === 'azure' && env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_DEPLOYMENT && env.AZURE_OPENAI_KEY) {
      const result = yield* callAzureOpenAI(
        env.AZURE_OPENAI_ENDPOINT,
        env.AZURE_OPENAI_DEPLOYMENT,
        env.AZURE_OPENAI_KEY,
        prompt
      );
      if (result) {
        summaryText = result;
        usedAI = true;
      }
    } else if (provider === 'openai' && env.OPENAI_API_KEY) {
      const baseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
      const model = env.OPENAI_MODEL || 'gpt-4o-mini';
      const result = yield* callOpenAI(baseUrl, model, env.OPENAI_API_KEY, prompt);
      if (result) {
        summaryText = result;
        usedAI = true;
      }
    } else if (provider === 'groq' && env.GROQ_API_KEY) {
      const model = env.GROQ_MODEL || 'llama-3.1-70b-versatile';
      const result = yield* callGroq(model, env.GROQ_API_KEY, prompt);
      if (result) {
        summaryText = result;
        usedAI = true;
      }
    }

    const fallbackUsed = !usedAI || summaryText === fallback;
    return { 
      summary: summaryText, 
      model: provider, 
      promptUsed: prompt, 
      fallbackUsed, 
      factors 
    };
  })
));

export default ai;
