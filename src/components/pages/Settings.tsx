import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFavoritePrefs, parseTeamsInput } from '../../utils/favorites';
import { fetchTeamPreferences, upsertTeamPreference, deleteTeamPreference, type TeamPreference } from '../../utils/preferences';

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamPrefs, setTeamPrefs] = useState<TeamPreference[]>([]);
  const [newTeamsInput, setNewTeamsInput] = useState('');

  // Load server preferences on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const prefs = await fetchTeamPreferences();
        if (!active) return;
        if (prefs.length === 0) {
          // One-time import from old local favorites, if present
          const old = getFavoritePrefs();
          if (old.teams.length > 0) {
            // Seed server with a single-color across all teams
            await Promise.all(old.teams.map((t) => upsertTeamPreference({
              team_number: t,
              highlight_color: old.color,
              notif_upcoming: true,
              notif_alliance: true,
              notif_results: true,
              notif_awards: true,
            })));
            const seeded = await fetchTeamPreferences();
            if (!active) return;
            setTeamPrefs(seeded);
            try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(seeded)); } catch {}
          } else {
            setTeamPrefs([]);
          }
        } else {
          setTeamPrefs(prefs);
          try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(prefs)); } catch {}
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load preferences');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Derived maps or memoized helpers can be added if needed later

  const handleAddTeams = async () => {
    const teams = parseTeamsInput(newTeamsInput);
    if (teams.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(teams.map((t) => upsertTeamPreference({
        team_number: t,
        highlight_color: '#ffd166',
        notif_upcoming: true,
        notif_alliance: true,
        notif_results: true,
        notif_awards: true,
      })));
      const updated = await fetchTeamPreferences();
      setTeamPrefs(updated);
      try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(updated)); } catch {}
      setNewTeamsInput('');
    } catch (e: any) {
      setError(e?.message || 'Failed to add team(s)');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (tp: TeamPreference) => {
    try {
      await upsertTeamPreference({
        team_number: tp.team_number,
        highlight_color: tp.highlight_color,
        notif_upcoming: !!tp.notif_upcoming,
        notif_alliance: !!tp.notif_alliance,
        notif_results: !!tp.notif_results,
        notif_awards: !!tp.notif_awards,
      });
      // local state already updated by caller
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    }
  };

  const handleRemove = async (team_number: string) => {
    try {
      setLoading(true);
      await deleteTeamPreference(team_number);
      setTeamPrefs((prev) => prev.filter(p => p.team_number !== team_number));
    } catch (e: any) {
      setError(e?.message || 'Failed to remove team');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    // Optional: navigate to home
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

  <div className="grid gap-6 max-w-3xl mx-auto">
        {/* Per-team preferences */}
        <div className="card-gradient border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Favorite Teams & Notifications</h2>
          <p className="text-gray-400 text-sm mb-3">
            Add teams you care about, pick a highlight color for each, and choose the notifications you want.
          </p>

          {error && (
            <div className="mb-3 text-red-400 text-sm">{error}</div>
          )}

          {/* Add teams */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-2">Add team numbers</label>
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                value={newTeamsInput}
                onChange={(e) => setNewTeamsInput(e.target.value)}
                className="flex-1 min-w-0 w-full sm:w-auto bg-transparent border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-baywatch-orange"
                placeholder="e.g. 33, 67 2056"
              />
              <button
                onClick={handleAddTeams}
                disabled={loading}
                className="shrink-0 px-4 py-2 rounded bg-baywatch-orange text-black font-semibold hover:bg-baywatch-orange/80 disabled:opacity-60 w-full sm:w-auto text-center"
              >
                Add
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-1">Separate with commas or spaces</p>
          </div>

          {/* Team list */}
          <div className="space-y-3">
            {teamPrefs.length === 0 && !loading && (
              <div className="text-gray-400 text-sm">No favorite teams yet.</div>
            )}
            {teamPrefs.map((tp, idx) => (
              <div key={tp.team_number} className="rounded-lg border border-gray-700/60 p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-lg font-semibold" style={{ color: tp.highlight_color }}>Team {tp.team_number}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-8 h-8 p-0 border border-gray-700 rounded bg-transparent"
                      value={tp.highlight_color}
                      onChange={(e) => {
                        const next = [...teamPrefs];
                        next[idx] = { ...tp, highlight_color: e.target.value };
                        setTeamPrefs(next);
                        try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(next)); } catch {}
                        handleUpdate(next[idx]);
                      }}
                      aria-label={`Highlight color for team ${tp.team_number}`}
                    />
                    <span className="text-gray-400 text-xs">{tp.highlight_color}</span>
                  </div>
                  <div className="flex-1" />
                  <button
                    onClick={() => handleRemove(tp.team_number)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >Remove</button>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {[
                    { key: 'notif_upcoming', label: 'Upcoming match' },
                    { key: 'notif_alliance', label: 'Alliance selection' },
                    { key: 'notif_results', label: 'Match results' },
                    { key: 'notif_awards', label: 'Awards' },
                  ].map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean((tp as any)[opt.key])}
                        onChange={(e) => {
                          const next = [...teamPrefs];
                          next[idx] = { ...tp, [opt.key]: e.target.checked ? 1 : 0 } as any;
                          setTeamPrefs(next);
                          try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(next)); } catch {}
                          handleUpdate(next[idx]);
                        }}
                      />
                      <span className="text-gray-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account actions */}
        <div className="card-gradient border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 rounded bg-red-600 hover:bg-red-500 transition-colors font-semibold"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Log out
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Settings;
