import { useActiveEvent } from '../../../hooks/useActiveEvent';

export default function ScoutingAlliances() {
  const { activeEvent, loading } = useActiveEvent();

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Alliance Selection</h1>
        <p className="mt-2 text-sm text-gray-400">
          Picklists, avoid lists, and real-time recommendations will live here.
        </p>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Recommendations</h2>
            <p className="mt-2 text-sm text-gray-400">
              Coming next: ranked list from scouting + Statbotics.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Lists</h2>
            <p className="mt-2 text-sm text-gray-400">
              Avoid, do-not-pick, and want lists with rank ordering.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-black/50 p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-white">Alliance Board</h2>
            <p className="mt-2 text-sm text-gray-400">
              Eight alliances grid with live updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
