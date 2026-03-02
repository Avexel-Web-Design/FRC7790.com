import { useState, useEffect, useMemo } from 'react';
import { useScoutingQueue } from '../../../hooks/useScoutingQueue';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { submitMatchEntry, fetchEventTeams, fetchEventMatches } from '../../../utils/scoutingApi';
import type { EventTeam, EventMatch } from '../../../utils/scoutingApi';
import SearchableSelect from '../../common/SearchableSelect';
import type { SearchableOption } from '../../common/SearchableSelect';

type EndgameClimb = 'None' | 'L1' | 'L2' | 'L3';

export default function MatchScouting() {
  const { enqueue, syncQueue, stats, syncing } = useScoutingQueue();
  const { activeEvent, loading } = useActiveEvent();
  const [matchNumber, setMatchNumber] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [autoActiveFuel, setAutoActiveFuel] = useState(0);
  const [autoClimbL1, setAutoClimbL1] = useState(false);
  const [teleopActiveFuel, setTeleopActiveFuel] = useState(0);
  const [endgameClimb, setEndgameClimb] = useState<EndgameClimb>('None');
  const [defenseRating, setDefenseRating] = useState(3);
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle'
  });
  const [teams, setTeams] = useState<EventTeam[]>([]);
  const [matches, setMatches] = useState<EventMatch[]>([]);

  useEffect(() => {
    if (!activeEvent) return;
    fetchEventTeams().then(setTeams);
    fetchEventMatches().then(setMatches);
  }, [activeEvent]);

  const matchOptions: SearchableOption[] = useMemo(
    () =>
      matches
        .filter((m) => m.match_type === 'qm')
        .map((m) => ({
          value: String(m.match_number),
          label: `Q${m.match_number}`,
          sublabel: `${m.red_teams.replace(/frc/g, '')} vs ${m.blue_teams.replace(/frc/g, '')}`,
        })),
    [matches],
  );

  const teamOptions: SearchableOption[] = useMemo(
    () =>
      teams.map((t) => ({
        value: String(t.team_number),
        label: String(t.team_number),
        sublabel: t.nickname || undefined,
      })),
    [teams],
  );

  const adjustCounter = (setter: (value: number) => void, value: number, delta: number) => {
    const next = Math.max(0, value + delta);
    setter(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchNum = Number(matchNumber);
    const teamNum = Number(teamNumber);
    if (!matchNum || !teamNum) {
      setStatus({ type: 'error', message: 'Match and team numbers are required.' });
      return;
    }

    const payload = {
      match_number: matchNum,
      team_number: teamNum,
      auto_active_fuel: autoActiveFuel,
      auto_climb_l1: autoClimbL1,
      teleop_active_fuel: teleopActiveFuel,
      endgame_climb: endgameClimb,
      defense_rating: defenseRating,
      general_comments: comments.trim() || undefined
    };

    if (!navigator.onLine) {
      enqueue({ type: 'match', payload });
      setStatus({ type: 'success', message: 'Saved offline. Will sync when online.' });
      return;
    }

    try {
      await submitMatchEntry(payload);
      setStatus({ type: 'success', message: 'Match submitted successfully.' });
    } catch {
      enqueue({ type: 'match', payload });
      setStatus({ type: 'success', message: 'Saved offline. Will sync when online.' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Match Scouting</h1>
            <p className="mt-1 text-sm text-gray-400">2026 REBUILT match form.</p>
          </div>
          <button
            type="button"
            onClick={syncQueue}
            className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-3 py-2 text-xs font-semibold text-gray-200 hover:border-baywatch-orange"
          >
            Sync queue ({stats.count}){syncing ? '...' : ''}
          </button>
        </div>

        {!loading && !activeEvent && (
          <div className="mt-6 rounded-2xl border border-gray-800 bg-black/50 p-6 text-sm text-gray-400">
            No active event. Start one from the dashboard.
          </div>
        )}

        {activeEvent && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Pre-Match</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <SearchableSelect
                options={matchOptions}
                value={matchNumber}
                onChange={setMatchNumber}
                placeholder="Match number"
                required
              />
              <SearchableSelect
                options={teamOptions}
                value={teamNumber}
                onChange={setTeamNumber}
                placeholder="Team number"
                required
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Auto (20s)</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-400">Active Fuel</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => adjustCounter(setAutoActiveFuel, autoActiveFuel, -1)}
                    className="h-10 w-10 rounded-full border border-gray-700 text-lg text-gray-200"
                  >
                    -
                  </button>
                  <div className="text-2xl font-semibold text-white">{autoActiveFuel}</div>
                  <button
                    type="button"
                    onClick={() => adjustCounter(setAutoActiveFuel, autoActiveFuel, 1)}
                    className="h-10 w-10 rounded-full border border-gray-700 text-lg text-gray-200"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustCounter(setAutoActiveFuel, autoActiveFuel, 10)}
                    className="ml-2 rounded-full border border-gray-700 px-3 py-2 text-xs text-gray-200"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Climb L1 Auto</p>
                <button
                  type="button"
                  onClick={() => setAutoClimbL1((prev) => !prev)}
                  className={`mt-2 inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold ${
                    autoClimbL1
                      ? 'border-baywatch-orange bg-baywatch-orange text-black'
                      : 'border-gray-700 text-gray-300'
                  }`}
                >
                  {autoClimbL1 ? 'Yes' : 'No'}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Teleop (135s)</h2>
            <div className="mt-4">
              <p className="text-sm text-gray-400">Active Fuel</p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustCounter(setTeleopActiveFuel, teleopActiveFuel, -1)}
                  className="h-10 w-10 rounded-full border border-gray-700 text-lg text-gray-200"
                >
                  -
                </button>
                <div className="text-2xl font-semibold text-white">{teleopActiveFuel}</div>
                <button
                  type="button"
                  onClick={() => adjustCounter(setTeleopActiveFuel, teleopActiveFuel, 1)}
                  className="h-10 w-10 rounded-full border border-gray-700 text-lg text-gray-200"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => adjustCounter(setTeleopActiveFuel, teleopActiveFuel, 10)}
                  className="ml-2 rounded-full border border-gray-700 px-3 py-2 text-xs text-gray-200"
                >
                  +10
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Endgame (30s)</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-gray-400">Climb</label>
                <select
                  value={endgameClimb}
                  onChange={(e) => setEndgameClimb(e.target.value as EndgameClimb)}
                  className="mt-2 w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
                >
                  {['None', 'L1', 'L2', 'L3'].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Defense Rating</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={defenseRating}
                  onChange={(e) => setDefenseRating(Number(e.target.value))}
                  className="mt-3 w-full"
                />
                <div className="mt-2 text-sm text-gray-300">{defenseRating} / 5</div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-800 bg-black/50 p-6">
            <h2 className="text-lg font-semibold text-white">Post-Match Notes</h2>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="General comments"
              className="mt-3 w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
              rows={4}
            />
          </section>

          <div className="flex flex-col items-start gap-3">
            <button
              type="submit"
              className="rounded-lg bg-baywatch-orange px-4 py-2 text-sm font-semibold text-black"
            >
              Submit Match
            </button>
            {status.type !== 'idle' && (
              <p className={`text-sm ${status.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {status.message}
              </p>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
