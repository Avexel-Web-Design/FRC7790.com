import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Profile {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
}

const Profile: React.FC = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setError('');
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
        setSuccess('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
        setEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update password');
      }
    } catch (error) {
      setError('Error updating password');
      console.error('Error updating password:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
          </div>
          <div className="px-6 py-6">
            {/* Profile Picture & Basic Info */}
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-700">
                    {profile?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">{profile?.username}</h4>
                <p className="text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profile?.is_admin 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {profile?.is_admin ? 'Administrator' : 'Team Member'}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <div className="mt-1 text-sm text-gray-900">{profile?.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1 text-sm text-gray-900">{profile?.username}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1 text-sm text-gray-900">
                  {profile?.is_admin ? 'Administrator' : 'Team Member'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Created</label>
                <div className="mt-1 text-sm text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {success && (
              <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Password Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Password</h4>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={updatePassword}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setError('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Password last changed: Not available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Logout</h4>
                  <p className="text-sm text-gray-500">Sign out of your account on this device</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                >
                  Logout
                </button>
              </div>

              {profile?.is_admin && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Admin Dashboard</h4>
                      <p className="text-sm text-gray-500">Access administrative functions</p>
                    </div>
                    <a
                      href="/admin/users"
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md"
                    >
                      Go to Admin
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
