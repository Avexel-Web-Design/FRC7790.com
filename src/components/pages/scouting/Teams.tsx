import { useState, useEffect } from 'react';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { fetchEventTeams } from '../../../utils/scoutingApi';
import type { EventTeam } from '../../../utils/scoutingApi';

export default function ScoutingTeams() {
  const { activeEvent, loading } = useActiveEvent();
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activeEvent) return;
    setTeamsLoading(true);
    fetchEventTeams()
      .then(setTeams)
      .finally(() => setTeamsLoading(false));
  }, [activeEvent]);

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase();
    return (
      String(t.team_number).includes(q) ||
      (t.nickname?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-white">Teams</h1>
          <p className="text-sm text-gray-400">
            All teams attending the active event.
          </p>
        </header>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        {activeEvent && (
          <>
            <div className="mt-6">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teams..."
                className="w-full max-w-sm rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-baywatch-orange focus:outline-none"
              />
            </div>

            {teamsLoading ? (
              <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-baywatch-orange/30 border-t-baywatch-orange" />
                Loading teams...
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-8 text-center text-sm text-gray-500">
                {search ? 'No teams match your search.' : 'No teams found.'}
              </div>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((team) => (
                  <div
                    key={team.team_number}
                    className="rounded-xl border border-gray-800 bg-black/50 p-4 hover:border-baywatch-orange/40 transition-colors"
                  >
                    <p className="text-lg font-bold text-baywatch-orange">
                      {team.team_number}
                    </p>
                    <p className="mt-1 text-sm text-gray-400 truncate">
                      {team.nickname || 'Unknown'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-600">
              {filtered.length} of {teams.length} teams
            </p>
          </>
        )}
      </div>
    </div>
  );
}
