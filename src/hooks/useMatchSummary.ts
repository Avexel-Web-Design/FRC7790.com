import { useEffect, useState, useCallback } from 'react';
import type { MatchData } from './useMatchData';

interface MatchSummaryResponse {
  summary: string;
  model?: string;
  promptUsed?: string;
  fallbackUsed?: boolean;
}

interface UseMatchSummaryReturn {
  summary: string | null;
  loading: boolean;
  error: string | null;
  regenerate: () => void;
  model?: string | null;
  fallbackUsed: boolean;
}

// Bump version to invalidate old terse cache entries
const STORAGE_KEY_PREFIX = 'match_summary_v2:';

export function useMatchSummary(match: MatchData | null): UseMatchSummaryReturn {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [model, setModel] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const regenerate = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    if (!match) {
      setSummary(null); setError(null); return;
    }

    const cacheKey = STORAGE_KEY_PREFIX + match.key;
    const cached = localStorage.getItem(cacheKey);
  if (cached) setSummary(cached);

    let cancelled = false;
    const run = async () => {
      setLoading(true); setError(null);
      try {
        const resp = await fetch('/api/ai/match-summary/generate', {
          method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ match_key: match.key, match })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data: MatchSummaryResponse = await resp.json();
        if (!cancelled) {
          setSummary(data.summary);
          setModel(data.model || null);
          setFallbackUsed(Boolean(data.fallbackUsed || data.model === 'fallback'));
          localStorage.setItem(cacheKey, data.summary);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Only fetch if no cached value or forced regenerate
    if (!cached || nonce > 0) {
      run();
    }

    return () => { cancelled = true; };
  }, [match, nonce]);

  return { summary, loading, error, regenerate, model, fallbackUsed };
}
