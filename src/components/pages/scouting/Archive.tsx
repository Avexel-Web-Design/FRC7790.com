import { useEffect, useState } from 'react';
import { fetchArchiveDetail, fetchArchives, deleteArchivedEvent } from '../../../utils/scoutingApi';
import { useAuth } from '../../../contexts/AuthContext';

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
  const { user } = useAuth();
  const [events, setEvents] = useState<ArchiveEvent[]>([]);
  const [selected, setSelected] = useState<ArchiveEvent | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async (eventCode: string) => {
    setDeleting(true);
    try {
      await deleteArchivedEvent(eventCode);
      setEvents((prev) => prev.filter((e) => e.event_code !== eventCode));
      if (selected?.event_code === eventCode) {
        setSelected(null);
        setDetail(null);
      }
    } catch {
      // Could show error toast here
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
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
            <div
              key={event.event_code}
              className="relative rounded-2xl border border-gray-800 bg-black/50 hover:border-baywatch-orange"
            >
              <button
                type="button"
                onClick={() => {
                  setSelected(event);
                  void loadDetail(event.event_code);
                }}
                className="w-full p-6 text-left"
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

              {user?.isAdmin && (
                <div className="absolute top-3 right-3">
                  {confirmDelete === event.event_code ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(event.event_code)}
                        disabled={deleting}
                        className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="rounded-lg bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(event.event_code)}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
                      title="Delete event"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
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
