import { useActiveEvent } from '../../../hooks/useActiveEvent';

export default function ScoutingSimulations() {
  const { activeEvent, loading } = useActiveEvent();

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Match Simulations</h1>
        <p className="mt-2 text-sm text-gray-400">
          Monte Carlo win probabilities based on scouting + Statbotics.
        </p>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}
        {activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6">
            <p className="text-sm text-gray-400">
              Active event: {activeEvent.event_code}
            </p>
            <p className="mt-3 text-sm text-gray-400">
              Simulation UI will allow picking 3 red + 3 blue teams.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
