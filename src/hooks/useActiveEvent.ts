import { useEffect, useState } from 'react';
import { fetchActiveEvent } from '../utils/scoutingApi';

export interface ActiveEvent {
  event_code: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  city?: string;
  state_prov?: string;
  country?: string;
  synced_at?: string;
}

export function useActiveEvent() {
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetchActiveEvent();
        if (!mounted) return;
        setActiveEvent((res?.active_event as ActiveEvent) || null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { activeEvent, loading };
}
