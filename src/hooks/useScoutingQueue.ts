import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MatchEntryPayload, PitEntryPayload } from '../utils/scoutingApi';
import { submitMatchEntry, submitPitEntry } from '../utils/scoutingApi';

type QueueItem =
  | { id: string; type: 'match'; payload: MatchEntryPayload; createdAt: number }
  | { id: string; type: 'pit'; payload: PitEntryPayload; createdAt: number };

const STORAGE_KEY = 'scouting_queue_v1';

function loadQueue(): QueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueue(items: QueueItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function useScoutingQueue() {
  const [queue, setQueue] = useState<QueueItem[]>(() => loadQueue());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  const enqueue = useCallback((item: Omit<QueueItem, 'id' | 'createdAt'>) => {
    const entry: QueueItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    } as QueueItem;
    setQueue((prev) => [...prev, entry]);
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncing) return;
    if (!navigator.onLine) return;
    if (queue.length === 0) return;
    setSyncing(true);
    try {
      const remaining: QueueItem[] = [];
      for (const item of queue) {
        try {
          if (item.type === 'match') {
            await submitMatchEntry(item.payload);
          } else {
            await submitPitEntry(item.payload);
          }
        } catch {
          remaining.push(item);
        }
      }
      setQueue(remaining);
    } finally {
      setSyncing(false);
    }
  }, [queue, syncing]);

  useEffect(() => {
    const handler = () => {
      if (navigator.onLine) {
        void syncQueue();
      }
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
  }, [syncQueue]);

  const stats = useMemo(() => ({
    count: queue.length,
    oldest: queue[0]?.createdAt || null
  }), [queue]);

  return {
    queue,
    enqueue,
    syncQueue,
    syncing,
    stats
  };
}
