import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFavoritePrefs, setFavoritePrefs, parseTeamsInput, type FavoritePrefs } from '../../utils/favorites';

const Settings: React.FC = () => {
  const { logout } = useAuth();
  const [prefs, setPrefs] = useState<FavoritePrefs>(() => getFavoritePrefs());
  const [teamsInput, setTeamsInput] = useState<string>('');

  useEffect(() => {
    setTeamsInput(prefs.teams.join(', '));
  }, []);

  const handleSave = () => {
    const teams = parseTeamsInput(teamsInput);
    const updated = { teams, color: prefs.color };
    setFavoritePrefs(updated);
    setPrefs(updated);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...prefs, color: e.target.value };
    setPrefs(updated);
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

      <div className="grid gap-6 max-w-2xl">
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

        {/* Favorites */}
        <div className="card-gradient border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Favorite Teams</h2>
          <p className="text-gray-400 text-sm mb-3">
            Add team numbers you want to highlight across event, match, and team pages. Separate with commas or spaces.
          </p>
          <label className="block text-sm text-gray-300 mb-2">Team numbers</label>
          <input
            type="text"
            value={teamsInput}
            onChange={(e) => setTeamsInput(e.target.value)}
            className="w-full bg-transparent border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-baywatch-orange"
            placeholder="e.g. 33, 67 2056"
          />

          <div className="mt-4">
            <label className="block text-sm text-gray-300 mb-2">Highlight color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={prefs.color}
                onChange={handleColorChange}
                className="w-10 h-10 p-0 border border-gray-700 rounded cursor-pointer bg-transparent"
                aria-label="Favorite highlight color"
              />
              <span className="text-gray-400 text-sm">{prefs.color}</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-baywatch-orange text-black font-semibold hover:bg-baywatch-orange/80 transition-colors"
            >
              Save Favorites
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Settings;
