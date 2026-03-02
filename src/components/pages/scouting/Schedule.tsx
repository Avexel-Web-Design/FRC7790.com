import { useState, useEffect, useMemo } from 'react';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { fetchEventMatches } from '../../../utils/scoutingApi';
import type { EventMatch } from '../../../utils/scoutingApi';

const MATCH_TYPE_ORDER: Record<string, number> = { qm: 1, sf: 2, f: 3 };
const MATCH_TYPE_LABEL: Record<string, string> = { qm: 'Qual', sf: 'Semi', f: 'Final' };

function fmtTeams(csv: string) {
  return csv
    .split(',')
    .map((k) => k.replace('frc', '').trim())
    .filter(Boolean);
}

export default function ScoutingSchedule() {
  const { activeEvent, loading } = useActiveEvent();
  const [matches, setMatches] = useState<EventMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (!activeEvent) return;
    setMatchLoading(true);
    fetchEventMatches()
      .then(setMatches)
      .finally(() => setMatchLoading(false));
  }, [activeEvent]);

  const matchTypes = useMemo(() => {
    const types = new Set(matches.map((m) => m.match_type));
    return ['all', ...Array.from(types).sort((a, b) => (MATCH_TYPE_ORDER[a] ?? 9) - (MATCH_TYPE_ORDER[b] ?? 9))];
  }, [matches]);

  const sorted = useMemo(() => {
    let list = [...matches];
    if (filterType !== 'all') list = list.filter((m) => m.match_type === filterType);
    return list.sort(
      (a, b) =>
        (MATCH_TYPE_ORDER[a.match_type] ?? 9) - (MATCH_TYPE_ORDER[b.match_type] ?? 9) ||
        a.match_number - b.match_number,
    );
  }, [matches, filterType]);

  const isOurMatch = (m: EventMatch) => {
    const all = `${m.red_teams},${m.blue_teams}`;
    return all.includes('frc7790');
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-white">Schedule</h1>
          <p className="text-sm text-gray-400">
            Match schedule for the active event.
          </p>
        </header>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        {activeEvent && matchLoading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-baywatch-orange/30 border-t-baywatch-orange" />
            Loading schedule...
          </div>
        )}

        {activeEvent && !matchLoading && matches.length === 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            No matches scheduled yet.
          </div>
        )}

        {activeEvent && !matchLoading && matches.length > 0 && (
          <>
            {/* Filter tabs */}
            <div className="mt-6 flex gap-2">
              {matchTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filterType === t
                      ? 'bg-baywatch-orange text-black'
                      : 'border border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All' : MATCH_TYPE_LABEL[t] ?? t.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-800">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 text-baywatch-orange">Match</th>
                    <th className="px-4 py-3 text-baywatch-orange">Red Alliance</th>
                    <th className="px-4 py-3 text-baywatch-orange">Blue Alliance</th>
                    <th className="px-4 py-3 text-baywatch-orange">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m) => {
                    const ours = isOurMatch(m);
                    const label = `${MATCH_TYPE_LABEL[m.match_type] ?? m.match_type.toUpperCase()} ${m.match_number}`;
                    const redTeams = fmtTeams(m.red_teams);
                    const blueTeams = fmtTeams(m.blue_teams);
                    return (
                      <tr
                        key={m.match_key}
                        className={`border-b border-gray-800/50 hover:bg-gray-900/50 ${ours ? 'bg-baywatch-orange/10 border-l-4 border-l-baywatch-orange' : ''}`}
                      >
                        <td className="px-4 py-3 font-semibold text-white">{label}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {redTeams.map((n) => (
                              <span
                                key={n}
                                className={`${n === '7790' ? 'font-bold text-baywatch-orange' : 'text-red-400'}`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {blueTeams.map((n) => (
                              <span
                                key={n}
                                className={`${n === '7790' ? 'font-bold text-baywatch-orange' : 'text-blue-400'}`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {m.winning_alliance ? (
                            <span
                              className={
                                m.winning_alliance === 'red'
                                  ? 'font-semibold text-red-400'
                                  : 'font-semibold text-blue-400'
                              }
                            >
                              {m.winning_alliance.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-600">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-gray-600">
              {sorted.length} matches shown
            </p>
          </>
        )}
      </div>
    </div>
  );
}
