import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { frcAPI } from '../../utils/frcAPI';
import { generateColor } from '../../utils/color';
import { PencilIcon } from '@heroicons/react/24/outline';
import '@melloware/coloris/dist/coloris.css';
import NebulaLoader from '../common/NebulaLoader';
import { fetchTeamPreferences, upsertTeamPreference, deleteTeamPreference, type TeamPreference } from '../../utils/preferences';
import { parseTeamsInput } from '../../utils/favorites';

interface Profile {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
  avatar_color?: string;
}

const Profile: React.FC = () => {
  const { logout, updateUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string>('');
  const colorInputRef = useRef<HTMLInputElement>(null);

  const [newUsername, setNewUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tempAvatarColor, setTempAvatarColor] = useState<string>('');
  const updateTimeoutRef = useRef<number | null>(null);
  // Team preferences (same as Settings, but here inside member Profile and without logout)
  const [teamPrefs, setTeamPrefs] = useState<TeamPreference[]>([]);
  const [tpLoading, setTpLoading] = useState(true);
  const [tpError, setTpError] = useState<string | null>(null);
  const [newTeamsInput, setNewTeamsInput] = useState('');

  // Calculate avatar color directly
  const avatarColor = tempAvatarColor || profile?.avatar_color || generateColor(profile?.username || '');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Load team preferences; default to 7790 if none present
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setTpLoading(true);
        const prefs = await fetchTeamPreferences();
        if (!active) return;
        if (!prefs || prefs.length === 0) {
          // Seed with 7790 as default favorite with all notifications enabled
          await upsertTeamPreference({
            team_number: '7790',
            highlight_color: '#ff6b00',
            notif_upcoming: true,
            notif_alliance: true,
            notif_results: true,
            notif_awards: true,
          });
          const seeded = await fetchTeamPreferences();
          if (!active) return;
          setTeamPrefs(seeded);
          try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(seeded)); } catch {}
        } else {
          setTeamPrefs(prefs);
          try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(prefs)); } catch {}
        }
      } catch (e: any) {
        setTpError(e?.message || 'Failed to load preferences');
      } finally {
        if (active) setTpLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // Initialize Coloris after component mounts
    const initColoris = async () => {
      try {
        const coloris = await import('@melloware/coloris');
        coloris.init();
        coloris.setInstance('#avatar-color-picker', {
          theme: 'polaroid',
          themeMode: 'dark',
          formatToggle: false,
          clearButton: false,
          swatches: [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
            '#feca57', '#48dbfb', '#0abde3', '#006ba6', '#ffa8a8'
          ]
        });
      } catch (error) {
        console.error('Error initializing coloris:', error);
      }
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(initColoris, 100);
  }, []);

  const updateAvatarColor = async (color: string) => {
    console.log('Updating avatar color to:', color);
    try {
      const response = await frcAPI.put('/profile', { avatar_color: color });
      if (response.ok) {
        setProfile((prev: Profile | null) => prev ? { ...prev, avatar_color: color } : null);
        updateUser({ avatarColor: color });
        setTempAvatarColor(''); // Clear temp color since we've saved to server
        console.log('Avatar color updated successfully');
      } else {
        console.error('Failed to update avatar color on server');
      }
    } catch (error) {
      console.error('Error updating avatar color:', error);
    }
  };

  const handleColorChange = (color: string) => {
    // Update the temporary color immediately for visual feedback
    setTempAvatarColor(color);
    
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set a new timeout to update the server after user stops changing color
    updateTimeoutRef.current = window.setTimeout(() => {
      updateAvatarColor(color);
    }, 500); // Wait 500ms after user stops changing color
  };

  const openColorPicker = () => {
    console.log('Avatar clicked! Opening color picker...');
    if (colorInputRef.current) {
      console.log('Color input ref found, triggering click');
      colorInputRef.current.click();
    } else {
      console.error('Color input ref not found');
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setNewUsername(data.username); // Initialize newUsername with current username
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameUpdate = async () => {
    setUsernameMessage(null);
    if (newUsername === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    try {
      const response = await frcAPI.put('/profile', { username: newUsername });
      if (response.ok) {
        setUsernameMessage({ type: 'success', text: 'Username updated successfully!' });
        fetchProfile(); // Re-fetch profile to update the displayed username
      } else {
        const errorData = await response.json();
        setUsernameMessage({ type: 'error', text: errorData.error || 'Failed to update username.' });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setUsernameMessage({ type: 'error', text: 'Network error or server unreachable.' });
    } finally {
      setIsEditingUsername(false);
      setTimeout(() => setUsernameMessage(null), 5000); // Clear message after 5 seconds
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordError('');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });

      if (response.ok) {
        setPasswordSuccess('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
        setEditingPassword(false);
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.error || 'Failed to update password');
      }
    } catch (error) {
      setPasswordError('Error updating password');
      console.error('Error updating password:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <NebulaLoader size={128} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="mt-2 text-sm text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-black border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Account Information</h3>
          </div>
          <div className="px-6 py-6">
            {/* Profile Picture & Basic Info */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0 relative group">
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-3xl transition-opacity relative overflow-hidden"
                  style={{ backgroundColor: avatarColor }}
                  onClick={openColorPicker}
                  title="Click to change avatar color"
                >
                  {profile?.username ? profile.username.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : ''}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <PencilIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <input
                  ref={colorInputRef}
                  id="avatar-color-picker"
                  type="text"
                  style={{ 
                    position: 'absolute', 
                    top: '0', 
                    left: '0', 
                    width: '100%', 
                    height: '100%', 
                    opacity: 0, 
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent'
                  }}
                  value={avatarColor}
                  data-coloris
                  onChange={(e) => handleColorChange(e.target.value)}
                  onInput={(e) => handleColorChange((e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{profile?.username}</h4>
                <p className="text-sm text-gray-400">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.is_admin 
                      ? 'bg-purple-600/25 text-purple-400' 
                      : 'bg-green-500/25 text-green-400'
                  }`}>
                    {profile?.is_admin ? 'Administrator' : 'Team Member'}
                  </span>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400">User ID</label>
                <div className="mt-1 text-sm text-white">{profile?.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Name</label>
                <div className="mt-1 text-sm text-white flex items-center">
                  {isEditingUsername ? (
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="p-1 border border-gray-600 rounded bg-black text-gray-100 flex-grow focus:outline-none"
                    />
                  ) : (
                    <span className="font-medium text-white">{profile?.username}</span>
                  )}
                  {!isEditingUsername ? (
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="ml-2 px-2 py-1 text-xs font-medium text-baywatch-orange bg-baywatch-orange/20 rounded-md hover:bg-baywatch-orange/30 focus:outline-none"
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      onClick={handleUsernameUpdate}
                      className="ml-2 px-2 py-1 text-xs font-medium text-green-400 bg-green-600/20 rounded-md hover:bg-green-600/30 focus:outline-none"
                    >
                      Save
                    </button>
                  )}
                </div>
                {usernameMessage && (
                  <p className={`mt-2 text-sm ${usernameMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {usernameMessage.text}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Role</label>
                <div className="mt-1 text-sm text-white">
                  {profile?.is_admin ? 'Administrator' : 'Team Member'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Account Created</label>
                <div className="mt-1 text-sm text-white">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {passwordSuccess && (
              <div className="mb-4 bg-green-500/25 border border-green-600 text-green-400 px-4 py-3 rounded">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 bg-red-500/25 border border-red-600 text-red-500 px-4 py-3 rounded">
                {passwordError}
              </div>
            )}

            {/* Password Section */}
            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-white">Password</h4>
                {!editingPassword && (
                  <button
                    onClick={() => setEditingPassword(true)}
                    className="text-baywatch-orange hover:text-white text-sm font-medium"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {editingPassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={updatePassword}
                      className="px-4 py-2 text-sm font-medium text-white bg-baywatch-orange hover:bg-baywatch-orange/70 rounded-md"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setEditingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-transparent hover:text-baywatch-orange rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Password last changed: Not available
                </p>
              )}
            </div>
          </div>
        </div>

          {/* Favorite Teams & Notifications (same as Settings, without logout) */}
          <div className="mt-6 bg-black border border-gray-700 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Favorite Teams & Notifications</h3>
              <p className="text-sm text-gray-400 mt-1">Pick a highlight color and choose notifications for the teams you follow.</p>
            </div>
            <div className="px-6 py-6">
              {tpError && <div className="mb-3 text-red-400 text-sm">{tpError}</div>}

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
                    onClick={async () => {
                      const teams = parseTeamsInput(newTeamsInput);
                      if (teams.length === 0) return;
                      try {
                        setTpLoading(true);
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
                        setTpError(e?.message || 'Failed to add team(s)');
                      } finally {
                        setTpLoading(false);
                      }
                    }}
                    disabled={tpLoading}
                    className="shrink-0 px-4 py-2 rounded bg-baywatch-orange text-black font-semibold hover:bg-baywatch-orange/80 disabled:opacity-60 w-full sm:w-auto text-center"
                  >
                    Add
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1">Separate with commas or spaces</p>
              </div>

              {/* List */}
              <div className="space-y-3">
                {teamPrefs.length === 0 && !tpLoading && (
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
                            upsertTeamPreference({
                              team_number: tp.team_number,
                              highlight_color: e.target.value,
                              notif_upcoming: !!tp.notif_upcoming,
                              notif_alliance: !!tp.notif_alliance,
                              notif_results: !!tp.notif_results,
                              notif_awards: !!tp.notif_awards,
                            }).catch(() => {});
                          }}
                          aria-label={`Highlight color for team ${tp.team_number}`}
                        />
                        <span className="text-gray-400 text-xs">{tp.highlight_color}</span>
                      </div>
                      <div className="flex-1" />
                      <button
                        onClick={async () => {
                          try {
                            setTpLoading(true);
                            await deleteTeamPreference(tp.team_number);
                            setTeamPrefs((prev) => prev.filter(p => p.team_number !== tp.team_number));
                            try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(teamPrefs.filter(p => p.team_number !== tp.team_number))); } catch {}
                          } catch (e: any) {
                            setTpError(e?.message || 'Failed to remove team');
                          } finally {
                            setTpLoading(false);
                          }
                        }}
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
                              upsertTeamPreference({
                                team_number: tp.team_number,
                                highlight_color: tp.highlight_color,
                                notif_upcoming: !!(next[idx] as any).notif_upcoming,
                                notif_alliance: !!(next[idx] as any).notif_alliance,
                                notif_results: !!(next[idx] as any).notif_results,
                                notif_awards: !!(next[idx] as any).notif_awards,
                              }).catch(() => {});
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
          </div>

          {/* Additional Actions */}
        <div className="mt-6 bg-black border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Account Actions</h3>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Logout</h4>
                  <p className="text-sm text-gray-400">Sign out of your account on this device</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
