import { useState, useEffect, useMemo, useCallback } from 'react';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { fetchEventTeams, fetchTeamMetrics } from '../../../utils/scoutingApi';
import type { EventTeam } from '../../../utils/scoutingApi';

// ── Types ──────────────────────────────────────────────────────────────
interface TeamMetric {
  team_number: number;
  nickname?: string;
  avg_auto_fuel?: number;
  avg_teleop_fuel?: number;
  avg_defense?: number;
  matches_scouted?: number;
  epa?: number;
}

interface Alliance {
  captain: number | null;
  picks: (number | null)[];
}

type Tab = 'picklist' | 'board' | 'compare';

const EMPTY_ALLIANCE = (): Alliance => ({ captain: null, picks: [null, null] });

// ── Component ──────────────────────────────────────────────────────────
export default function ScoutingAlliances() {
  const { activeEvent, loading } = useActiveEvent();
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [metrics, setMetrics] = useState<TeamMetric[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('picklist');

  // Picklist state (persisted in localStorage per event)
  const storageKey = `alliances_picklist_${activeEvent?.event_code ?? ''}`;
  const [picklist, setPicklist] = useState<number[]>([]);
  const [avoidList, setAvoidList] = useState<number[]>([]);

  // Alliance board state
  const [alliances, setAlliances] = useState<Alliance[]>(
    Array.from({ length: 8 }, EMPTY_ALLIANCE),
  );

  // Compare state
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeEvent) return;
    setDataLoading(true);
    Promise.all([fetchEventTeams(), fetchTeamMetrics()])
      .then(([t, m]) => {
        setTeams(t);
        setMetrics((m as { teams?: TeamMetric[] })?.teams ?? []);
      })
      .finally(() => setDataLoading(false));
  }, [activeEvent]);

  // Load picklist from localStorage
  useEffect(() => {
    if (!activeEvent) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPicklist(parsed.picklist ?? []);
        setAvoidList(parsed.avoidList ?? []);
        if (parsed.alliances) setAlliances(parsed.alliances);
      } else {
        // Default: sort by metrics
        const sorted = [...teams]
          .sort((a, b) => {
            const ma = metrics.find((m) => m.team_number === a.team_number);
            const mb = metrics.find((m) => m.team_number === b.team_number);
            const sa = (ma?.avg_auto_fuel ?? 0) + (ma?.avg_teleop_fuel ?? 0);
            const sb = (mb?.avg_auto_fuel ?? 0) + (mb?.avg_teleop_fuel ?? 0);
            return sb - sa;
          })
          .map((t) => t.team_number);
        setPicklist(sorted);
      }
    } catch {
      /* ignore */
    }
  }, [activeEvent, teams, metrics, storageKey]);

  // Save picklist to localStorage
  const persist = useCallback(() => {
    if (!activeEvent) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ picklist, avoidList, alliances }),
      );
    } catch {
      /* ignore */
    }
  }, [activeEvent, storageKey, picklist, avoidList, alliances]);

  useEffect(() => {
    persist();
  }, [persist]);

  // ── Helpers ──────────────────────────────────────────────────────────
  const teamName = (num: number) =>
    teams.find((t) => t.team_number === num)?.nickname ?? `Team ${num}`;

  const teamMetric = (num: number) =>
    metrics.find((m) => m.team_number === num);

  // Teams already placed on the board
  const boardTeams = useMemo(() => {
    const set = new Set<number>();
    for (const a of alliances) {
      if (a.captain) set.add(a.captain);
      for (const p of a.picks) if (p) set.add(p);
    }
    return set;
  }, [alliances]);

  // Available teams for the board (on picklist, not avoided, not placed)
  const availableForBoard = picklist.filter(
    (n) => !avoidList.includes(n) && !boardTeams.has(n),
  );

  // ── Picklist drag handlers ──────────────────────────────────────────
  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setPicklist((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDragIdx(idx);
  };
  const onDragEnd = () => setDragIdx(null);

  const moveToAvoid = (num: number) => {
    setPicklist((p) => p.filter((n) => n !== num));
    setAvoidList((a) => [...a, num]);
  };

  const moveToPicklist = (num: number) => {
    setAvoidList((a) => a.filter((n) => n !== num));
    setPicklist((p) => [...p, num]);
  };

  // ── Board handlers ──────────────────────────────────────────────────
  const assignToSlot = (
    allianceIdx: number,
    slot: 'captain' | 0 | 1,
    teamNum: number | null,
  ) => {
    setAlliances((prev) => {
      const next = [...prev];
      const a = { ...next[allianceIdx], picks: [...next[allianceIdx].picks] };
      if (slot === 'captain') a.captain = teamNum;
      else a.picks[slot] = teamNum;
      next[allianceIdx] = a;
      return next;
    });
  };

  // ── Compare helpers ──────────────────────────────────────────────────
  const metricA = compareA ? teamMetric(Number(compareA)) : null;
  const metricB = compareB ? teamMetric(Number(compareB)) : null;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">Alliance Selection</h1>
        <p className="mt-2 text-sm text-gray-400">
          Drag-to-rank picklist, 8-alliance board, and team comparison.
        </p>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        {activeEvent && dataLoading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-baywatch-orange/30 border-t-baywatch-orange" />
            Loading data...
          </div>
        )}

        {activeEvent && !dataLoading && (
          <>
            {/* Tabs */}
            <div className="mt-6 flex gap-2">
              {(['picklist', 'board', 'compare'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    tab === t
                      ? 'bg-baywatch-orange text-black'
                      : 'border border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'picklist' ? 'Picklist' : t === 'board' ? 'Alliance Board' : 'Compare'}
                </button>
              ))}
            </div>

            {/* ── Picklist Tab ── */}
            {tab === 'picklist' && (
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Want list */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    Ranked Picklist
                    <span className="ml-2 text-xs text-gray-500">drag to reorder</span>
                  </h2>
                  {picklist.length === 0 && (
                    <p className="text-sm text-gray-500">No teams in picklist.</p>
                  )}
                  <div className="space-y-1">
                    {picklist.map((num, idx) => {
                      const m = teamMetric(num);
                      const score = ((m?.avg_auto_fuel ?? 0) + (m?.avg_teleop_fuel ?? 0)).toFixed(1);
                      return (
                        <div
                          key={num}
                          draggable
                          onDragStart={() => onDragStart(idx)}
                          onDragOver={(e) => onDragOver(e, idx)}
                          onDragEnd={onDragEnd}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-grab active:cursor-grabbing transition-colors ${
                            dragIdx === idx
                              ? 'border-baywatch-orange bg-baywatch-orange/10'
                              : 'border-gray-800 bg-black/50 hover:border-gray-700'
                          }`}
                        >
                          <span className="w-6 text-right text-xs text-gray-500 font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-baywatch-orange w-14">{num}</span>
                          <span className="flex-1 truncate text-gray-400 text-xs">
                            {teamName(num)}
                          </span>
                          <span className="text-xs text-gray-500">{score} avg</span>
                          <button
                            type="button"
                            onClick={() => moveToAvoid(num)}
                            className="text-xs text-red-400 hover:text-red-300"
                            title="Move to avoid list"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Avoid list */}
                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">Avoid List</h2>
                  {avoidList.length === 0 && (
                    <p className="text-sm text-gray-500">No teams in avoid list.</p>
                  )}
                  <div className="space-y-1">
                    {avoidList.map((num) => (
                      <div
                        key={num}
                        className="flex items-center gap-3 rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-2 text-sm"
                      >
                        <span className="font-bold text-red-400 w-14">{num}</span>
                        <span className="flex-1 truncate text-gray-400 text-xs">
                          {teamName(num)}
                        </span>
                        <button
                          type="button"
                          onClick={() => moveToPicklist(num)}
                          className="text-xs text-green-400 hover:text-green-300"
                          title="Move back to picklist"
                        >
                          ↩
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Alliance Board Tab ── */}
            {tab === 'board' && (
              <div className="mt-6">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {alliances.map((alliance, ai) => (
                    <div
                      key={ai}
                      className="rounded-xl border border-gray-800 bg-black/50 p-4"
                    >
                      <h3 className="text-sm font-semibold text-baywatch-orange mb-3">
                        Alliance {ai + 1}
                      </h3>
                      {/* Captain */}
                      <div className="mb-2">
                        <label className="text-[10px] uppercase tracking-wider text-gray-500">
                          Captain
                        </label>
                        <select
                          value={alliance.captain ?? ''}
                          onChange={(e) =>
                            assignToSlot(ai, 'captain', e.target.value ? Number(e.target.value) : null)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-700 bg-black px-2 py-1.5 text-sm text-white"
                        >
                          <option value="">--</option>
                          {(alliance.captain
                            ? [alliance.captain, ...availableForBoard]
                            : availableForBoard
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n} — {teamName(n)}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* Picks */}
                      {alliance.picks.map((pick, pi) => (
                        <div key={pi} className="mb-2">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500">
                            Pick {pi + 1}
                          </label>
                          <select
                            value={pick ?? ''}
                            onChange={(e) =>
                              assignToSlot(ai, pi as 0 | 1, e.target.value ? Number(e.target.value) : null)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-700 bg-black px-2 py-1.5 text-sm text-white"
                          >
                            <option value="">--</option>
                            {(pick
                              ? [pick, ...availableForBoard]
                              : availableForBoard
                            ).map((n) => (
                              <option key={n} value={n}>
                                {n} — {teamName(n)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Compare Tab ── */}
            {tab === 'compare' && (
              <div className="mt-6">
                <div className="flex gap-4 flex-wrap">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Team A</label>
                    <select
                      value={compareA}
                      onChange={(e) => setCompareA(e.target.value)}
                      className="mt-1 block w-40 rounded-lg border border-gray-700 bg-black px-2 py-2 text-sm text-white"
                    >
                      <option value="">Select...</option>
                      {teams.map((t) => (
                        <option key={t.team_number} value={t.team_number}>
                          {t.team_number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-2 text-gray-500 font-bold">vs</div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Team B</label>
                    <select
                      value={compareB}
                      onChange={(e) => setCompareB(e.target.value)}
                      className="mt-1 block w-40 rounded-lg border border-gray-700 bg-black px-2 py-2 text-sm text-white"
                    >
                      <option value="">Select...</option>
                      {teams.map((t) => (
                        <option key={t.team_number} value={t.team_number}>
                          {t.team_number}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(metricA || metricB) && (
                  <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-800">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-left">
                          <th className="px-4 py-3 text-gray-500">Metric</th>
                          <th className="px-4 py-3 text-baywatch-orange">
                            {compareA || '--'}
                          </th>
                          <th className="px-4 py-3 text-baywatch-orange">
                            {compareB || '--'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: 'Avg Auto Fuel', key: 'avg_auto_fuel' as const },
                          { label: 'Avg Teleop Fuel', key: 'avg_teleop_fuel' as const },
                          { label: 'Avg Defense', key: 'avg_defense' as const },
                          { label: 'Matches Scouted', key: 'matches_scouted' as const },
                        ].map(({ label, key }) => {
                          const a = metricA?.[key] ?? 0;
                          const b = metricB?.[key] ?? 0;
                          return (
                            <tr key={key} className="border-b border-gray-800/50">
                              <td className="px-4 py-3 text-gray-400">{label}</td>
                              <td className={`px-4 py-3 font-semibold ${a > b ? 'text-green-400' : a < b ? 'text-red-400' : 'text-white'}`}>
                                {typeof a === 'number' ? a.toFixed(1) : '--'}
                              </td>
                              <td className={`px-4 py-3 font-semibold ${b > a ? 'text-green-400' : b < a ? 'text-red-400' : 'text-white'}`}>
                                {typeof b === 'number' ? b.toFixed(1) : '--'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!metricA && !metricB && compareA === '' && compareB === '' && (
                  <p className="mt-6 text-sm text-gray-500">
                    Select two teams to compare their scouting metrics side by side.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
