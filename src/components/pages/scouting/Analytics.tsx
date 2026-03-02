import { useEffect, useState } from 'react';
import { fetchScoutingSettings, fetchTeamMetrics, syncStatbotics, syncTba, syncTbaOpr, updateScoutingSettings } from '../../../utils/scoutingApi';
import { useActiveEvent } from '../../../hooks/useActiveEvent';

const DATA_MODES = [
  { value: 'scouted_only', label: 'Scouted only' },
  { value: 'scouted_with_statbotics', label: 'Scouted + Statbotics' },
  { value: 'statbotics_only', label: 'Statbotics only' },
  { value: 'tba_opr_only', label: 'TBA OPR only' },
  { value: 'scouted_with_tba_opr', label: 'Scouted + TBA OPR' }
];

export default function ScoutingAnalytics() {
  const { activeEvent, loading } = useActiveEvent();
  const [dataMode, setDataMode] = useState('scouted_with_statbotics');
  const [status, setStatus] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchScoutingSettings().then((settings) => {
      if (settings?.data_source_mode) {
        setDataMode(settings.data_source_mode);
      }
    });
  }, []);

  useEffect(() => {
    fetchTeamMetrics().then((data) => setMetrics(data));
  }, []);

  const handleSaveMode = async () => {
    try {
      setBusy(true);
      await updateScoutingSettings(dataMode);
      setStatus('Saved data source mode.');
    } catch {
      setStatus('Failed to save data source mode.');
    } finally {
      setBusy(false);
    }
  };

  const runSync = async (kind: 'tba' | 'statbotics' | 'tba-opr') => {
    if (!activeEvent?.event_code) {
      setStatus('No active event.');
      return;
    }
    try {
      setBusy(true);
      if (kind === 'tba') await syncTba(activeEvent.event_code);
      if (kind === 'statbotics') await syncStatbotics(activeEvent.event_code);
      if (kind === 'tba-opr') await syncTbaOpr(activeEvent.event_code);
      setStatus('Sync complete.');
    } catch {
      setStatus('Sync failed. Check API keys.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Scouting Analytics</h1>
        <p className="mt-2 text-sm text-gray-400">Configure data sources and run syncs.</p>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Data Source</h2>
            <select
              value={dataMode}
              onChange={(e) => setDataMode(e.target.value)}
              className="mt-4 w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
            >
              {DATA_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSaveMode}
              disabled={busy}
              className="mt-4 rounded-lg bg-baywatch-orange px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
            >
              Save mode
            </button>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Sync Data</h2>
            <p className="mt-3 text-sm text-gray-400">
              Active event: {activeEvent?.event_code || 'None'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => runSync('tba')}
                disabled={busy}
                className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-60"
              >
                Sync TBA
              </button>
              <button
                type="button"
                onClick={() => runSync('statbotics')}
                disabled={busy}
                className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-60"
              >
                Sync Statbotics
              </button>
              <button
                type="button"
                onClick={() => runSync('tba-opr')}
                disabled={busy}
                className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 disabled:opacity-60"
              >
                Sync TBA OPR
              </button>
            </div>
          </div>
        </div>

        {status && <p className="mt-4 text-sm text-gray-300">{status}</p>}

        {metrics?.teams && (
          <div className="mt-8 rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Fallback Sources</h2>
            <p className="mt-2 text-sm text-gray-400">
              Active → Archived → Statbotics.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {metrics.teams.slice(0, 6).map((team: any) => (
                <div key={team.team_number} className="rounded-xl border border-gray-800 bg-black/40 p-4">
                  <p className="text-sm text-gray-200">{team.team_number}</p>
                  <p className="text-xs text-gray-500">Source: {team.source}</p>
                  {team.archived_event && (
                    <p className="text-xs text-gray-500">Archive: {team.archived_event}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
