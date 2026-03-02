import { useState, useEffect, useMemo } from 'react';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { fetchEventRankings } from '../../../utils/scoutingApi';

interface TBARanking {
  rank: number;
  team_key: string;
  record?: { wins: number; losses: number; ties: number };
  wins?: number;
  losses?: number;
  ties?: number;
  sort_orders?: number[];
  qual_average?: number;
  ranking_points?: number;
}

type SortField = 'rank' | 'team' | 'rp' | 'record';
type SortDir = 'asc' | 'desc';

export default function ScoutingRankings() {
  const { activeEvent, loading } = useActiveEvent();
  const [rankings, setRankings] = useState<TBARanking[]>([]);
  const [rankLoading, setRankLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    if (!activeEvent) return;
    setRankLoading(true);
    fetchEventRankings()
      .then((data) => setRankings(data as TBARanking[]))
      .finally(() => setRankLoading(false));
  }, [activeEvent]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const fmtTeam = (key: string) => key.replace('frc', '');
  const fmtRecord = (r: TBARanking) => {
    const rec = r.record;
    if (rec) return `${rec.wins}-${rec.losses}-${rec.ties}`;
    return `${r.wins ?? 0}-${r.losses ?? 0}-${r.ties ?? 0}`;
  };
  const getRp = (r: TBARanking) => r.ranking_points ?? r.sort_orders?.[0] ?? 0;

  const sorted = useMemo(() => {
    return [...rankings].sort((a, b) => {
      let av: number, bv: number;
      switch (sortField) {
        case 'rank': av = a.rank; bv = b.rank; break;
        case 'team': av = Number(fmtTeam(a.team_key)); bv = Number(fmtTeam(b.team_key)); break;
        case 'rp': av = getRp(a); bv = getRp(b); break;
        case 'record': av = a.record?.wins ?? a.wins ?? 0; bv = b.record?.wins ?? b.wins ?? 0; break;
        default: return 0;
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [rankings, sortField, sortDir]);

  const arrow = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold text-white">Rankings</h1>
          <p className="text-sm text-gray-400">
            Live TBA rankings for the active event.
          </p>
        </header>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        {activeEvent && rankLoading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-baywatch-orange/30 border-t-baywatch-orange" />
            Loading rankings...
          </div>
        )}

        {activeEvent && !rankLoading && rankings.length === 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Rankings not yet available. They appear once qualification matches are scored.
          </div>
        )}

        {activeEvent && !rankLoading && rankings.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-800">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="cursor-pointer px-4 py-3 text-baywatch-orange hover:bg-gray-900" onClick={() => toggleSort('rank')}>
                    Rank{arrow('rank')}
                  </th>
                  <th className="cursor-pointer px-4 py-3 text-baywatch-orange hover:bg-gray-900" onClick={() => toggleSort('team')}>
                    Team{arrow('team')}
                  </th>
                  <th className="cursor-pointer px-4 py-3 text-baywatch-orange hover:bg-gray-900" onClick={() => toggleSort('rp')}>
                    RP{arrow('rp')}
                  </th>
                  <th className="cursor-pointer px-4 py-3 text-baywatch-orange hover:bg-gray-900" onClick={() => toggleSort('record')}>
                    Record{arrow('record')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const num = fmtTeam(r.team_key);
                  const isUs = num === '7790';
                  return (
                    <tr
                      key={r.team_key}
                      className={`border-b border-gray-800/50 hover:bg-gray-900/50 ${isUs ? 'bg-baywatch-orange/10 border-l-4 border-l-baywatch-orange' : ''}`}
                    >
                      <td className="px-4 py-3 font-semibold">{r.rank}</td>
                      <td className={`px-4 py-3 font-bold ${isUs ? 'text-baywatch-orange' : 'text-white'}`}>
                        {num}
                      </td>
                      <td className="px-4 py-3">{getRp(r).toFixed(2)}</td>
                      <td className="px-4 py-3">{fmtRecord(r)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
