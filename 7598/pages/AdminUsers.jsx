import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import frcAPI from '@/utils/frcApiClient';
import NebulaLoader from '@/components/common/NebulaLoader';
import { generateColor } from '@/utils/color';

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', password: '', is_admin: false });
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', password: '', is_admin: false });
  const [editError, setEditError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await frcAPI.get('/admin/users');
      if (!res.ok) throw new Error('Failed to load users');
      setUsers(await res.json());
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const createUser = async () => {
    setError('');
    try {
      const body = { fullName: createForm.fullName, password: createForm.password, is_admin: !!createForm.is_admin };
      const res = await frcAPI.post('/auth/register', body);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to create user');
      }
      setShowCreate(false);
      setCreateForm({ fullName: '', password: '', is_admin: false });
      await loadUsers();
    } catch (e) {
      setError(e.message || 'Failed to create user');
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ fullName: u.username, password: '', is_admin: !!u.is_admin });
    setEditError('');
  };

  const submitEdit = async () => {
    if (!editUser) return;
    setEditError('');
    try {
      const data = {};
      if (editForm.fullName.trim() !== editUser.username) data.fullName = editForm.fullName.trim();
      if (editForm.password.trim()) data.password = editForm.password.trim();
      if (editForm.is_admin !== editUser.is_admin) data.is_admin = editForm.is_admin;
      if (Object.keys(data).length === 0) { setEditUser(null); return; }
      const res = await frcAPI.put(`/admin/users/${editUser.id}`, data);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to update user');
      }
      setEditUser(null);
      await loadUsers();
    } catch (e) {
      setEditError(e.message || 'Failed to update user');
    }
  };

  const toggleAdmin = async (u) => {
    if (u.id === user?.id) return; // can't change own status
    try {
      const res = await frcAPI.put(`/admin/users/${u.id}`, { is_admin: !u.is_admin });
      if (res.ok) {
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_admin: !u.is_admin } : x));
      }
    } catch {}
  };

  const deleteUser = async (u) => {
    if (u.id === user?.id) return;
    if (!window.confirm(`Delete user ${u.username}?`)) return;
    try {
      const res = await frcAPI.delete(`/admin/users/${u.id}`);
      if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch {}
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <NebulaLoader size={96} />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black text-gray-100 p-4 md:p-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
            <p className="text-sm text-gray-400">Manage team members and their permissions</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-md bg-sca-purple text-white hover:bg-sca-purple/80">Add User</button>
        </div>

        {error && (<div className="mb-4 bg-red-500/20 text-red-200 border border-red-500/40 rounded p-3">{error}</div>)}

  <div className="hidden md:block bg-black border border-white/10 rounded-lg overflow-hidden">
          <div className="px-6 py-3 border-b border-white/10">All Users</div>
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: u.avatar_color || generateColor(u.username, null) }}>
                        {u.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <div>
                        <div className="font-medium">{u.username}</div>
                        <div className="text-xs text-gray-500">ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.is_admin ? 'bg-purple-500/25 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-3 text-sm">
                      <button onClick={() => openEdit(u)} className="text-indigo-400 hover:text-indigo-300">Edit</button>
                      <button onClick={() => toggleAdmin(u)} disabled={u.id === user?.id} className={`text-blue-400 hover:text-blue-300 ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}>{u.is_admin ? 'Remove Admin' : 'Make Admin'}</button>
                      <button onClick={() => deleteUser(u)} disabled={u.id === user?.id} className={`text-red-400 hover:text-red-300 ${u.id === user?.id ? 'opacity-50 cursor-not-allowed' : ''}`}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

  <div className="md:hidden space-y-3 overflow-y-auto pb-24">
          {users.map(u => (
            <div key={u.id} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: u.avatar_color || generateColor(u.username, null) }}>
                    {u.username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div>
                    <div className="font-medium">{u.username}</div>
                    <div className="text-xs text-gray-500">ID: {u.id}</div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.is_admin ? 'bg-purple-500/25 text-purple-400' : 'bg-green-500/20 text-green-400'}`}>
                  {u.is_admin ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <button onClick={() => openEdit(u)} className="px-3 py-2 rounded bg-white/5">Edit</button>
                <button onClick={() => toggleAdmin(u)} disabled={u.id === user?.id} className={`px-3 py-2 rounded ${u.id === user?.id ? 'bg-white/5 text-gray-500' : 'bg-blue-900/40 text-blue-300'}`}>{u.is_admin ? 'Remove' : 'Make'} Admin</button>
                <button onClick={() => deleteUser(u)} disabled={u.id === user?.id} className={`px-3 py-2 rounded ${u.id === user?.id ? 'bg-white/5 text-gray-500' : 'bg-red-900/40 text-red-300'}`}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-gray-900 border border-white/10 rounded-lg p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Add New User</h3>
            {error && (<div className="mb-2 bg-red-500/20 text-red-200 border border-red-500/40 rounded p-2">{error}</div>)}
            <div className="space-y-3">
              <input value={createForm.fullName} onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10" />
              <input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Password" type="password" className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={createForm.is_admin} onChange={(e) => setCreateForm({ ...createForm, is_admin: e.target.checked })} />
                <span>Admin</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded bg-white/10">Cancel</button>
              <button onClick={createUser} className="px-4 py-2 rounded bg-sca-purple">Create</button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-lg p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Edit User: {editUser.username}</h3>
            {editError && (<div className="mb-2 bg-red-500/20 text-red-200 border border-red-500/40 rounded p-2">{editError}</div>)}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400">Full name</label>
                <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10" />
              </div>
              <div>
                <label className="text-xs text-gray-400">New password (optional)</label>
                <input value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} type="password" className="w-full px-3 py-2 rounded bg-gray-800 border border-white/10" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editForm.is_admin} onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })} disabled={editUser.id === user?.id} />
                <span>Admin {editUser.id === user?.id ? '(cannot modify own status)' : ''}</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 rounded bg-white/10">Cancel</button>
              <button onClick={submitEdit} className="px-4 py-2 rounded bg-sca-purple">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
