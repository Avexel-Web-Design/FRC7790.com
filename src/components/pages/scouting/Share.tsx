import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

type ShareResponse = {
  resource_type?: string;
  drawing?: {
    id: number;
    event_code?: string;
    match_number?: number;
    title?: string;
    data_json: string;
    updated_at?: string;
  };
  error?: string;
};

export default function ScoutingShare() {
  const { token } = useParams();
  const [data, setData] = useState<ShareResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) return;
      try {
        const res = await fetch(`/api/scouting/share/${token}`);
        const json = (await res.json()) as ShareResponse;
        if (active) setData(json);
      } catch {
        if (active) setData({ error: 'not_found' });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading shared view...</p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Shared link not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Shared Strategy</h1>
        {data.drawing && (
          <div className="mt-4 rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">{data.drawing.title || 'Strategy Drawing'}</h2>
            <p className="mt-2 text-xs text-gray-500">
              Event: {data.drawing.event_code || 'N/A'} · Match {data.drawing.match_number ?? 'N/A'}
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-gray-800 bg-black p-4 text-xs text-gray-300">
              {data.drawing.data_json}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
