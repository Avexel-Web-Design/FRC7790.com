import { useEffect, useState } from 'react';
import { fetchArchiveDetail, fetchArchives } from '../../../utils/scoutingApi';

type ArchiveEvent = {
  event_code: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  city?: string;
  state_prov?: string;
  country?: string;
};

export default function Archive() {
  const [events, setEvents] = useState<ArchiveEvent[]>([]);
  const [selected, setSelected] = useState<ArchiveEvent | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetchArchives();
        if (!mounted) return;
        setEvents((res?.events as ArchiveEvent[]) || []);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const loadDetail = async (eventCode: string) => {
    setDetailLoading(true);
    try {
      const res = await fetchArchiveDetail(eventCode);
      setDetail(res);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Event Archive</h1>
        <p className="mt-2 text-sm text-gray-400">Browse past events (read-only).</p>

        {loading && <p className="mt-4 text-sm text-gray-400">Loading archive...</p>}

        {!loading && events.length === 0 && (
          <p className="mt-4 text-sm text-gray-400">No archived events yet.</p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <button
              key={event.event_code}
              type="button"
              onClick={() => {
                setSelected(event);
                void loadDetail(event.event_code);
              }}
              className="rounded-2xl border border-gray-800 bg-black/50 p-6 text-left hover:border-baywatch-orange"
            >
              <h2 className="text-lg font-semibold text-white">{event.name || event.event_code}</h2>
              <p className="mt-1 text-sm text-gray-400">{event.event_code}</p>
              <p className="mt-2 text-xs text-gray-500">
                {event.city || ''} {event.state_prov || ''} {event.country || ''}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                {event.start_date || 'TBD'} - {event.end_date || 'TBD'}
              </p>
            </button>
          ))}
        </div>

        {selected && (
          <div className="mt-8 rounded-2xl border border-gray-800 bg-black/60 p-6">
            <h2 className="text-xl font-semibold text-white">{selected.name || selected.event_code}</h2>
            <p className="mt-1 text-sm text-gray-400">{selected.event_code}</p>

            {detailLoading && <p className="mt-3 text-sm text-gray-400">Loading event details...</p>}

            {!detailLoading && detail && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
                  <p className="text-xs text-gray-500">Teams</p>
                  <p className="text-2xl font-semibold text-white">{detail.teams?.length || 0}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
                  <p className="text-xs text-gray-500">Match Entries</p>
                  <p className="text-2xl font-semibold text-white">{detail.counts?.match_entries || 0}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
                  <p className="text-xs text-gray-500">Pit Entries</p>
                  <p className="text-2xl font-semibold text-white">{detail.counts?.pit_entries || 0}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4">
                  <p className="text-xs text-gray-500">Drawings</p>
                  <p className="text-2xl font-semibold text-white">{detail.counts?.drawings || 0}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/40 p-4 md:col-span-2">
                  <p className="text-xs text-gray-500">Matches Synced</p>
                  <p className="text-2xl font-semibold text-white">{detail.matches?.length || 0}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
