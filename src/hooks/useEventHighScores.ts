import { useState, useEffect } from 'react';
import type { Match } from './useEventData';
import { calculateEventHighScores, type EventHighScores } from '../utils/eventStats';

const TBA_AUTH_KEY = "gdgkcwgh93dBGQjVXlh0ndD4GIkiQlzzbaRu9NUHGfk72tPVG2a69LF2BoYB1QNf";

interface UseEventHighScoresReturn {
  highScores: EventHighScores | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and calculate event high scores
 * @param eventKey The event key (e.g., "2025milac")
 * @returns Object containing high scores data, loading state, and error state
 */
export function useEventHighScores(eventKey: string | null): UseEventHighScoresReturn {
  const [highScores, setHighScores] = useState<EventHighScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventKey) {
      setHighScores(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchEventHighScores = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all matches for the event
        const matchesResponse = await fetch(`https://www.thebluealliance.com/api/v3/event/${eventKey}/matches`, {
          headers: { "X-TBA-Auth-Key": TBA_AUTH_KEY }
        });

        if (!matchesResponse.ok) {
          throw new Error(`Failed to fetch event matches: ${matchesResponse.status}`);
        }

        const matches: Match[] = await matchesResponse.json();
        
        // Calculate high scores from the matches
        const calculatedHighScores = calculateEventHighScores(matches);
        setHighScores(calculatedHighScores);

      } catch (err) {
        console.error('Error fetching event high scores:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event high scores');
        setHighScores(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventHighScores();
  }, [eventKey]);

  return {
    highScores,
    loading,
    error
  };
}