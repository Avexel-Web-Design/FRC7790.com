import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { UserIcon, UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { generateColor } from '../../../utils/color';
import NebulaLoader from '../../common/NebulaLoader';

interface User {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
  avatar_color?: string;
}

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    is_admin: false
  });
  const [editUser, setEditUser] = useState({
    username: '',
    password: '',
    is_admin: false
  });
  const [error, setError] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        await fetchUsers();
        setShowModal(false);
        setNewUser({ username: '', password: '', is_admin: false });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Error creating user');
      console.error('Error creating user:', error);
    }
  };

  const updateUserAdmin = async (userId: number, isAdmin: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_admin: isAdmin })
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, is_admin: isAdmin } : u
        ));
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const openEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditUser({
      username: userToEdit.username,
      password: '', // Don't populate existing password
      is_admin: userToEdit.is_admin
    });
    setEditError('');
    setShowEditModal(true);
  };

  const updateUser = async () => {
    if (!editingUser) return;

    try {
      setEditError('');
      const token = localStorage.getItem('token');
      
      // Only send fields that have been changed
      const updateData: any = {};
      
      if (editUser.username.trim() !== editingUser.username) {
        updateData.username = editUser.username.trim();
      }
      
      if (editUser.password.trim() !== '') {
        updateData.password = editUser.password.trim();
      }
      
      if (editUser.is_admin !== editingUser.is_admin) {
        updateData.is_admin = editUser.is_admin;
      }

      // Don't send request if nothing changed
      if (Object.keys(updateData).length === 0) {
        setShowEditModal(false);
        return;
      }

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Update the local users state
        setUsers(users.map(u => 
          u.id === editingUser.id ? { 
            ...u, 
            username: updateData.username || u.username,
            is_admin: updateData.is_admin !== undefined ? updateData.is_admin : u.is_admin
          } : u
        ));
        setShowEditModal(false);
        setEditingUser(null);
      } else {
        const errorData = await response.json();
        setEditError(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      setEditError('Error updating user');
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    if (userId === user?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setUsers(users.filter(u => u.id !== userId));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <NebulaLoader size={128} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
            <p className="mt-2 text-sm text-gray-400">
              Manage team members and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium bg-baywatch-orange hover:bg-baywatch-orange/70 text-white"
          >
            Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
          <div className="bg-black border border-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-baywatch-orange rounded-md flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-white">{users.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black border border-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-baywatch-orange rounded-md flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Administrators</dt>
                    <dd className="text-lg font-medium text-white">
                      {users.filter(u => u.is_admin).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black border border-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-baywatch-orange rounded-md flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Members</dt>
                    <dd className="text-lg font-medium text-white">
                      {users.filter(u => !u.is_admin).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table - Desktop */}
        <div className="hidden md:block bg-black border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">All Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-black">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black divide-y divide-gray-700">
                {users.map((userItem) => (
                  <tr key={userItem.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: userItem.avatar_color || generateColor(userItem.username, null) }}
                          >
                            <span className="text-md font-bold text-white">
                              {userItem.username.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-300">
                            {userItem.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userItem.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userItem.is_admin 
                          ? 'bg-purple-500/25 text-purple-500' 
                          : 'bg-green-500/25 text-green-500'
                      }`}>
                        {userItem.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(userItem)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => updateUserAdmin(userItem.id, !userItem.is_admin)}
                          disabled={userItem.id === user?.id}
                          className={`text-blue-600 hover:text-blue-900 ${
                            userItem.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {userItem.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => deleteUser(userItem.id)}
                          disabled={userItem.id === user?.id}
                          className={`text-red-600 hover:text-red-900 ${
                            userItem.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Cards - Mobile */}
        <div className="md:hidden space-y-4">
          <h3 className="text-lg font-medium text-white px-4">All Users</h3>
          {users.map((userItem) => (
            <div key={userItem.id} className="bg-black border border-gray-700 rounded-lg mx-4">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div 
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: userItem.avatar_color || generateColor(userItem.username, null) }}
                      >
                        <span className="text-lg font-bold text-white">
                          {userItem.username.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-300">
                        {userItem.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {userItem.id}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    userItem.is_admin 
                      ? 'bg-purple-500/25 text-purple-500' 
                      : 'bg-green-500/25 text-green-500'
                  }`}>
                    {userItem.is_admin ? 'Admin' : 'User'}
                  </span>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => openEditModal(userItem)}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-indigo-400 hover:text-indigo-300 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => updateUserAdmin(userItem.id, !userItem.is_admin)}
                    disabled={userItem.id === user?.id}
                    className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      userItem.id === user?.id 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-900/50 hover:bg-blue-800/50 text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    {userItem.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    onClick={() => deleteUser(userItem.id)}
                    disabled={userItem.id === user?.id}
                    className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      userItem.id === user?.id 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-900/50 hover:bg-red-800/50 text-red-400 hover:text-red-300'
                    }`}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative p-6 md:p-8 bg-black w-full max-w-md m-auto rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Add New User</h3>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-baywatch-orange focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-baywatch-orange focus:border-transparent"
                  required
                />
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={newUser.is_admin}
                    onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="isAdmin" 
                    className={`w-4 h-4 border-2 rounded flex items-center justify-center cursor-pointer ${
                      newUser.is_admin 
                        ? 'bg-baywatch-orange border-baywatch-orange' 
                        : 'border-gray-300 bg-transparent'
                    }`}
                  >
                    {newUser.is_admin && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                </div>
                <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-300 cursor-pointer">
                  Admin
                </label>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setError('');
                  setNewUser({ username: '', password: '', is_admin: false });
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-baywatch-orange hover:bg-baywatch-orange/70 rounded-md transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="relative p-6 md:p-8 bg-black w-full max-w-md m-auto rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Edit User: {editingUser.username}</h3>
            {editError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {editError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-baywatch-orange focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="New Password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-baywatch-orange focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="editIsAdmin"
                    checked={editUser.is_admin}
                    onChange={(e) => setEditUser({ ...editUser, is_admin: e.target.checked })}
                    disabled={editingUser.id === user?.id}
                    className="sr-only"
                  />
                  <label 
                    htmlFor="editIsAdmin" 
                    className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      editUser.is_admin 
                        ? 'bg-baywatch-orange border-baywatch-orange' 
                        : 'border-gray-300 bg-transparent'
                    } ${editingUser.id === user?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {editUser.is_admin && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                </div>
                <label htmlFor="editIsAdmin" className={`ml-2 block text-sm text-gray-300 ${
                  editingUser.id === user?.id ? 'opacity-50' : 'cursor-pointer'
                }`}>
                  Admin {editingUser.id === user?.id ? '(cannot modify your own status)' : ''}
                </label>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditError('');
                  setEditingUser(null);
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateUser}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-baywatch-orange hover:bg-baywatch-orange/70 rounded-md transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
