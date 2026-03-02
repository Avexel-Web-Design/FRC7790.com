import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useActiveEvent } from '../../../hooks/useActiveEvent';
import { endEvent, startEvent } from '../../../utils/scoutingApi';
import { useState } from 'react';

export default function ScoutingDashboard() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const { activeEvent, loading } = useActiveEvent();
  const [eventCode, setEventCode] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    if (!eventCode) {
      setStatus('Event code required.');
      return;
    }
    try {
      setBusy(true);
      await startEvent(eventCode);
      window.location.reload();
    } catch {
      setStatus('Failed to start event.');
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async () => {
    try {
      setBusy(true);
      await endEvent();
      window.location.reload();
    } catch {
      setStatus('Failed to end event.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Scouting HQ</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-white">Team 7790 Scouting App</h1>
          <p className="max-w-3xl text-gray-400">
            Capture 2026 match and pit scouting, sync with TBA + Statbotics, and keep alliance planning in one place.
          </p>
        </header>

        {!loading && !activeEvent && (
          <section className="mt-10 rounded-2xl border border-gray-800 bg-black/60 p-6">
            <h2 className="text-xl font-semibold text-white">No active event</h2>
            <p className="mt-2 text-sm text-gray-400">
              Scouting is locked until an admin starts an event.
            </p>
            {isAdmin && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStart();
                }}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  placeholder="Enter event code (e.g. 2026okok)"
                  className="flex-1 rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-baywatch-orange px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
                >
                  Start event
                </button>
              </form>
            )}
            {status && <p className="mt-3 text-sm text-gray-400">{status}</p>}
          </section>
        )}

        {activeEvent && (
          <section className="mt-6 rounded-2xl border border-gray-800 bg-black/60 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Active Event</p>
                <h2 className="text-xl font-semibold text-white">
                  {activeEvent.name || activeEvent.event_code}
                </h2>
                <p className="text-sm text-gray-400">{activeEvent.event_code}</p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleEnd}
                  disabled={busy}
                  className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 hover:border-red-500 disabled:opacity-60"
                >
                  End event
                </button>
              )}
            </div>
          </section>
        )}

        {activeEvent && (
          <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 via-black to-gray-900 p-6">
            <h2 className="text-xl font-semibold text-white">Match Scouting</h2>
            <p className="mt-2 text-sm text-gray-400">
              Fast, mobile-first form for match data. Offline friendly with auto-sync.
            </p>
            <Link
              to="/dashboard/match"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-baywatch-orange px-4 py-2 text-sm font-semibold text-black hover:bg-baywatch-orange/80"
            >
              Start match scouting
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-950 via-black to-gray-900 p-6">
            <h2 className="text-xl font-semibold text-white">Pit Scouting</h2>
            <p className="mt-2 text-sm text-gray-400">
              Capture robot capabilities, drivetrain, and photos directly to R2.
            </p>
            <Link
              to="/dashboard/pit"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-baywatch-orange px-4 py-2 text-sm font-semibold text-black hover:bg-baywatch-orange/80"
            >
              Start pit scouting
            </Link>
          </div>
        </section>
        )}

        {activeEvent && isAdmin && (
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-800 bg-black/60 p-6">
              <h3 className="text-lg font-semibold text-white">Analytics</h3>
              <p className="mt-2 text-sm text-gray-400">
                Trends, rankings, and Statbotics-enhanced metrics.
              </p>
              <Link
                to="/dashboard/analytics"
                className="mt-3 inline-flex text-sm font-semibold text-baywatch-orange"
              >
                View analytics
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/60 p-6">
              <h3 className="text-lg font-semibold text-white">Alliance Selection</h3>
              <p className="mt-2 text-sm text-gray-400">
                Picklists, avoid lists, and recommendations.
              </p>
              <Link
                to="/dashboard/alliances"
                className="mt-3 inline-flex text-sm font-semibold text-baywatch-orange"
              >
                Open alliances
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/60 p-6">
              <h3 className="text-lg font-semibold text-white">Simulations</h3>
              <p className="mt-2 text-sm text-gray-400">
                Monte Carlo win probabilities powered by scouting + Statbotics.
              </p>
              <Link
                to="/dashboard/simulations"
                className="mt-3 inline-flex text-sm font-semibold text-baywatch-orange"
              >
                Run simulations
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/60 p-6">
              <h3 className="text-lg font-semibold text-white">Strategy Board</h3>
              <p className="mt-2 text-sm text-gray-400">
                Field drawings and shareable links for drive team.
              </p>
              <Link
                to="/dashboard/strategy"
                className="mt-3 inline-flex text-sm font-semibold text-baywatch-orange"
              >
                Open strategy
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
