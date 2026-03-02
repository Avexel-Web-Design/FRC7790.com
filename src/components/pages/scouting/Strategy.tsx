import { useState } from 'react';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { frcAPI } from '../../../utils/frcAPI';

export default function ScoutingStrategy() {
  const { activeEvent, loading } = useActiveEvent();
  const [matchNumber, setMatchNumber] = useState('');
  const [title, setTitle] = useState('');
  const [dataJson, setDataJson] = useState('');
  const [shareToken, setShareToken] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const saveDrawing = async () => {
    try {
      setStatus(null);
      const res = await frcAPI.post('/scouting/drawings', {
        match_number: matchNumber ? Number(matchNumber) : undefined,
        title: title || undefined,
        data_json: dataJson || '{}'
      });
      if (!res.ok) throw new Error('save failed');
      const data = await res.json();
      if (data?.id) {
        const shareRes = await frcAPI.post('/scouting/share', {
          resource_type: 'drawing',
          resource_id: data.id
        });
        if (shareRes.ok) {
          const shareData = await shareRes.json();
          setShareToken(shareData.token || '');
        }
      }
      setStatus('Drawing saved.');
    } catch {
      setStatus('Failed to save drawing.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Strategy Board</h1>
        <p className="mt-2 text-sm text-gray-400">
          Lightweight placeholder for drawing data. Canvas UI will replace this.
        </p>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        {activeEvent && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            type="number"
            value={matchNumber}
            onChange={(e) => setMatchNumber(e.target.value)}
            placeholder="Match number"
            className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Drawing title"
            className="rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
          />
        </div>
        )}

        {activeEvent && (
          <textarea
            value={dataJson}
            onChange={(e) => setDataJson(e.target.value)}
            placeholder="Paste drawing JSON payload"
            className="mt-4 w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
            rows={8}
          />
        )}

        {activeEvent && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={saveDrawing}
              className="rounded-lg bg-baywatch-orange px-4 py-2 text-sm font-semibold text-black"
            >
              Save + Create Share Link
            </button>
            {shareToken && (
              <a
                href={`/scouting/share/${shareToken}`}
                className="text-sm text-baywatch-orange"
              >
                Open share link
              </a>
            )}
            {status && <span className="text-xs text-gray-400">{status}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
