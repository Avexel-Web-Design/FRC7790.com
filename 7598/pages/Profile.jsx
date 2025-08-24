import React, { useEffect, useRef, useState } from 'react';
import NebulaLoader from '@/components/common/NebulaLoader';
import frcAPI from '@/utils/frcApiClient';
import { generateColor } from '@/utils/color';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState(null);

  const colorInputRef = useRef(null);
  const [tempAvatarColor, setTempAvatarColor] = useState('');
  const updateTimeoutRef = useRef(null);

  const avatarColor = tempAvatarColor || profile?.avatar_color || generateColor(profile?.username || '');

  useEffect(() => {
    fetchProfile();
    return () => { if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current); };
  }, []);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await frcAPI.get('/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setNewUsername(data.username || '');
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      setLoading(false);
    }
  }

  async function updateAvatarColor(color) {
    try {
      const res = await frcAPI.put('/profile', { avatar_color: color });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, avatar_color: color } : prev);
        setTempAvatarColor('');
  updateUser({ avatarColor: color });
      }
    } catch (e) {
      console.error('Failed to update avatar color', e);
    }
  }

  function handleColorChange(color) {
    setTempAvatarColor(color);
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => updateAvatarColor(color), 500);
  }

  async function handleUsernameUpdate() {
    setUsernameMessage(null);
    if (newUsername === profile?.username) { setIsEditingUsername(false); return; }
    try {
      const res = await frcAPI.put('/profile', { username: newUsername });
      if (res.ok) {
        setUsernameMessage({ type: 'success', text: 'Username updated successfully!' });
        fetchProfile();
  updateUser({ name: newUsername });
      } else {
        const data = await res.json().catch(() => ({}));
        setUsernameMessage({ type: 'error', text: data.error || 'Failed to update username.' });
      }
    } catch (e) {
      setUsernameMessage({ type: 'error', text: 'Network error or server unreachable.' });
    } finally {
      setIsEditingUsername(false);
      setTimeout(() => setUsernameMessage(null), 5000);
    }
  }

  async function updatePassword() {
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters long'); return; }
    try {
      setPasswordError('');
      const res = await frcAPI.put('/profile', { password: newPassword });
      if (res.ok) {
        setPasswordSuccess('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
        setEditingPassword(false);
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setPasswordError(data.error || 'Failed to update password');
      }
    } catch (e) {
      setPasswordError('Error updating password');
      console.error('Error updating password', e);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <NebulaLoader size={96} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-black text-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="mt-2 text-sm text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="bg-black border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Account Information</h3>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0 relative group">
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center text-white font-bold text-3xl transition-opacity relative overflow-hidden cursor-pointer"
                  style={{ backgroundColor: avatarColor }}
                  title="Click to change avatar color"
                  onClick={() => colorInputRef.current?.click()}
                >
                  {profile?.username ? profile.username.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : ''}
                </div>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={avatarColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Avatar color"
                />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">{profile?.username}</h4>
                <p className="text-sm text-gray-400">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile?.is_admin ? 'bg-sca-purple/25 text-sca-purple' : 'bg-green-500/25 text-green-400'}`}>
                    {profile?.is_admin ? 'Administrator' : 'Team Member'}
                  </span>
                </p>
                <p className="text-sm text-gray-400 mt-1">Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </div>

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
                    <button onClick={() => setIsEditingUsername(true)} className="ml-2 px-2 py-1 text-xs font-medium text-sca-purple bg-sca-purple/20 rounded-md hover:bg-sca-purple/30">Edit</button>
                  ) : (
                    <button onClick={handleUsernameUpdate} className="ml-2 px-2 py-1 text-xs font-medium text-green-400 bg-green-600/20 rounded-md hover:bg-green-600/30">Save</button>
                  )}
                </div>
                {usernameMessage && (
                  <p className={`mt-2 text-sm ${usernameMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{usernameMessage.text}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Role</label>
                <div className="mt-1 text-sm text-white">{profile?.is_admin ? 'Administrator' : 'Team Member'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Account Created</label>
                <div className="mt-1 text-sm text-white">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</div>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 bg-green-500/25 border border-green-600 text-green-400 px-4 py-3 rounded">{passwordSuccess}</div>
            )}
            {passwordError && (
              <div className="mb-4 bg-red-500/25 border border-red-600 text-red-500 px-4 py-3 rounded">{passwordError}</div>
            )}

            <div className="border-t border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-white">Password</h4>
                {!editingPassword && (
                  <button onClick={() => setEditingPassword(true)} className="text-sca-purple hover:text-white text-sm font-medium">Change Password</button>
                )}
              </div>

              {editingPassword ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none" placeholder="Confirm new password" />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={updatePassword} className="px-4 py-2 text-sm font-medium text-white bg-sca-purple hover:bg-sca-purple/80 rounded-md">Update Password</button>
                    <button onClick={() => { setEditingPassword(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }} className="px-4 py-2 text-sm font-medium text-white bg-transparent hover:text-sca-purple rounded-md">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Password last changed: Not available</p>
              )}
            </div>
          </div>
        </div>

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
                <button onClick={() => { localStorage.removeItem('frc7598_auth'); window.location.href = '/'; }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md">Logout</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
