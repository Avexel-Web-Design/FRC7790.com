import React, { useEffect, useMemo, useState } from 'react';
import NebulaLoader from '@/components/common/NebulaLoader';
import frcAPI from '@/utils/frcApiClient';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export default function Planner() {
  const { user } = useAuth();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });

  // On mount, honor ?filter=assigned deeplink and normalize unknown values
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const f = params.get('filter');
    if (f === 'assigned') {
      setFilter('assigned');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchTasks(); fetchUsers(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await frcAPI.get('/tasks');
      if (res.ok) setTasks(await res.json());
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      if (user?.isAdmin) {
        const res = await frcAPI.get('/admin/users');
        if (res.ok) setUsers(await res.json());
      }
    } catch {}
  };

  const createTask = async () => {
    const payload = { ...newTask, assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null };
    const res = await frcAPI.post('/tasks', payload);
    if (res.ok) {
      await fetchTasks();
      setShowModal(false);
      setNewTask({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
    }
  };

  const updateTask = async (id, updates) => {
    const res = await frcAPI.put(`/tasks/${id}`, updates);
    if (res.ok) { await fetchTasks(); setEditingTask(null); }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    const res = await frcAPI.delete(`/tasks/${id}`);
    if (res.ok) setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleTaskCompletion = async (task) => {
    const res = await frcAPI.request('PATCH', `/tasks/${task.id}/complete`, { completed: !task.completed });
    if (res.ok) setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
  };

  const filteredTasks = useMemo(() => {
    if (filter === 'completed') return tasks.filter(t => t.completed);
    if (filter === 'assigned') return tasks.filter(t => !t.completed && t.assigned_to === user?.id);
    return tasks.filter(t => !t.completed);
  }, [tasks, filter, user?.id]);
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length,
  };

  if (loading) {
    return <div className="flex-1 min-h-0 flex items-center justify-center"><NebulaLoader size={96} /></div>;
  }

  const priorityChip = (p) => ({
    high: 'bg-red-500/20 text-red-300',
    medium: 'bg-yellow-500/20 text-yellow-200',
    low: 'bg-green-500/20 text-green-300',
  })[p] || 'bg-gray-500/20 text-gray-300';

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <h1 className="text-xl font-semibold">Planner</h1>
          <p className="text-sm text-gray-400">Track and manage team tasks</p>
        </div>
        <button onClick={()=>setShowModal(true)} className="px-3 py-2 text-sm font-medium text-black bg-sca-gold hover:bg-yellow-400 rounded">Add Task</button>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sca-purple rounded-md flex items-center justify-center text-sca-gold font-bold">{stats.pending}</div>
            <div>
              <div className="text-sm text-gray-400">Pending</div>
              <div className="text-white text-lg font-medium">{stats.pending}</div>
            </div>
          </div>
        </div>
        <div className="border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center text-white font-bold">{stats.completed}</div>
            <div>
              <div className="text-sm text-gray-400">Completed</div>
              <div className="text-white text-lg font-medium">{stats.completed}</div>
            </div>
          </div>
        </div>
        <div className="border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center text-white font-bold">{stats.overdue}</div>
            <div>
              <div className="text-sm text-gray-400">Overdue</div>
              <div className="text-white text-lg font-medium">{stats.overdue}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="border border-white/10 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>setFilter('pending')} className={`px-3 py-2 rounded text-sm ${filter==='pending' ? 'bg-sca-purple/30 text-sca-gold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Pending</button>
            <button onClick={()=>setFilter('assigned')} className={`px-3 py-2 rounded text-sm ${filter==='assigned' ? 'bg-yellow-600/25 text-yellow-200' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Assigned to me</button>
            <button onClick={()=>setFilter('completed')} className={`px-3 py-2 rounded text-sm ${filter==='completed' ? 'bg-green-600/25 text-green-300' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>Completed</button>
          </div>
        </div>

        <div className="border border-white/10 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-medium">{filter==='pending' ? 'Pending Tasks' : filter==='assigned' ? 'Assigned to Me' : 'Completed Tasks'}</h3>
          </div>
          <div className="divide-y divide-white/10">
            {filteredTasks.length > 0 ? filteredTasks.map(task => (
              <div key={task.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={!!task.completed} onChange={()=>toggleTaskCompletion(task)} className="h-4 w-4 text-sca-purple focus:ring-sca-purple border-gray-600 rounded bg-black" />
                    <div>
                      <h4 className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</h4>
                      <p className={`text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>{task.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span>Created by: {task.creator_username || 'Unknown'}</span>
                        {task.assignee_username && <span>Assigned to: {task.assignee_username}</span>}
                        {task.due_date && (
                          <span className={new Date(task.due_date) < new Date() && !task.completed ? 'text-red-400' : ''}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityChip(task.priority)}`}>{task.priority}</span>
                    {(user?.isAdmin || task.created_by === user?.id) && (
                      <>
                        <button onClick={()=>setEditingTask(task)} className="text-sca-gold hover:text-white text-sm">Edit</button>
                        <button onClick={()=>deleteTask(task.id)} className="text-red-500 hover:text-red-400 text-sm">Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-gray-400">No tasks found</div>
            )}
          </div>
        </div>
      </div>

      {(showModal || editingTask) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="relative p-6 bg-black w-full max-w-md rounded-lg border border-white/10">
            <h3 className="text-lg font-medium mb-4">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Title</label>
                <input type="text" value={editingTask ? editingTask.title : newTask.title}
                       onChange={(e)=>editingTask ? setEditingTask({ ...editingTask, title: e.target.value }) : setNewTask({ ...newTask, title: e.target.value })}
                       className="mt-1 block w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea rows={3} value={editingTask ? editingTask.description : newTask.description}
                          onChange={(e)=>editingTask ? setEditingTask({ ...editingTask, description: e.target.value }) : setNewTask({ ...newTask, description: e.target.value })}
                          className="mt-1 block w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Priority</label>
                <select value={editingTask ? editingTask.priority : newTask.priority}
                        onChange={(e)=>editingTask ? setEditingTask({ ...editingTask, priority: e.target.value }) : setNewTask({ ...newTask, priority: e.target.value })}
                        className="mt-1 block w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Due Date</label>
                <input type="date" value={editingTask ? (editingTask.due_date || '') : newTask.due_date}
                       onChange={(e)=>editingTask ? setEditingTask({ ...editingTask, due_date: e.target.value }) : setNewTask({ ...newTask, due_date: e.target.value })}
                       className="mt-1 block w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple"/>
              </div>
              {user?.isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300">Assign To</label>
                  <select value={editingTask ? (editingTask.assigned_to ?? '') : newTask.assigned_to}
                          onChange={(e)=>editingTask ? setEditingTask({ ...editingTask, assigned_to: e.target.value ? parseInt(e.target.value) : null }) : setNewTask({ ...newTask, assigned_to: e.target.value })}
                          className="mt-1 block w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sca-purple">
                    <option value="">Unassigned</option>
                    {users.map(u => (<option key={u.id} value={u.id}>{u.username}</option>))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>{ setShowModal(false); setEditingTask(null); }} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white">Cancel</button>
              <button onClick={()=>{ editingTask ? updateTask(editingTask.id, editingTask) : createTask(); }} className="px-4 py-2 text-sm font-medium text-black bg-sca-gold hover:bg-yellow-400 rounded">{editingTask ? 'Update' : 'Create'} Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
