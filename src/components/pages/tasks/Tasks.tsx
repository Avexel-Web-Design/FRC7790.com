import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import NebulaLoader from '../../common/NebulaLoader';

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  assigned_to: number | null;
  created_by: number;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  assignee_username?: string;
  creator_username?: string;
}

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [users, setUsers] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (user?.isAdmin) {
        const response = await fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const taskData = {
        ...newTask,
        assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        await fetchTasks();
        setShowModal(false);
        setNewTask({
          title: '',
          description: '',
          assigned_to: '',
          due_date: '',
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchTasks();
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          setTasks(tasks.filter(task => task.id !== taskId));
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const toggleTaskCompletion = async (task: Task) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !task.completed })
      });

      if (response.ok) {
        setTasks(tasks.map(t => 
          t.id === task.id ? { ...t, completed: !t.completed } : t
        ));
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending':
        return !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => 
      !t.completed && 
      t.due_date && 
      new Date(t.due_date) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <NebulaLoader size={128} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Task Management</h1>
            <p className="mt-2 text-sm text-gray-400">
              Track and manage team tasks and assignments
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-baywatch-orange hover:bg-baywatch-orange/70 text-white transition-colors"
          >
            Add Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-black border border-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-baywatch-orange rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">{stats.pending}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Pending</dt>
                    <dd className="text-lg font-medium text-white">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black border border-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">{stats.completed}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Completed</dt>
                    <dd className="text-lg font-medium text-white">{stats.completed}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black border border-gray-700 rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">{stats.overdue}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Overdue</dt>
                    <dd className="text-lg font-medium text-white">{stats.overdue}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-black border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-baywatch-orange/25 text-baywatch-orange'
                  : 'bg-gray-800 text-gray-400 hover:text-baywatch-orange'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'completed'
                  ? 'bg-green-500/25 text-green-500'
                  : 'bg-gray-800 text-gray-400 hover:text-green-500'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-black border border-gray-700 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">
              {filter === 'pending' ? 'Pending Tasks' : 'Completed Tasks'}
            </h3>
          </div>
          <div className="divide-y divide-gray-700">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task)}
                        className="h-4 w-4 text-baywatch-orange focus:ring-baywatch-orange border-gray-600 rounded bg-black"
                      />
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          task.completed ? 'text-gray-500 line-through' : 'text-white'
                        }`}>
                          {task.title}
                        </h4>
                        <p className={`text-sm ${
                          task.completed ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {task.description}
                        </p>
                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-400">
                          <span>Created by: {task.creator_username || 'Unknown'}</span>
                          {task.assignee_username && (
                            <span>Assigned to: {task.assignee_username}</span>
                          )}
                          {task.due_date && (
                            <span className={new Date(task.due_date) < new Date() && !task.completed ? 'text-red-600' : ''}>
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {(user?.isAdmin || task.created_by === user?.id) && (
                        <>
                          <button
                            onClick={() => setEditingTask(task)}
                            className="text-baywatch-orange hover:text-white text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="text-red-600 hover:text-red-500 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">
                No tasks found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {(showModal || editingTask) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-8 bg-black w-full max-w-md m-auto rounded-lg shadow-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  placeholder="Title"
                  value={editingTask ? editingTask.title : newTask.title}
                  onChange={(e) => editingTask 
                    ? setEditingTask({ ...editingTask, title: e.target.value })
                    : setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Description"
                  value={editingTask ? editingTask.description : newTask.description}
                  onChange={(e) => editingTask
                    ? setEditingTask({ ...editingTask, description: e.target.value })
                    : setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  value={editingTask ? editingTask.priority : newTask.priority}
                  onChange={(e) => editingTask
                    ? setEditingTask({ ...editingTask, priority: e.target.value as 'low' | 'medium' | 'high' })
                    : setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })
                  }
                  className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  value={editingTask ? editingTask.due_date || '' : newTask.due_date}
                  onChange={(e) => editingTask
                    ? setEditingTask({ ...editingTask, due_date: e.target.value })
                    : setNewTask({ ...newTask, due_date: e.target.value })
                  }
                  className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none"
                />
              </div>
              {user?.isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign To</label>
                  <select
                    value={editingTask ? editingTask.assigned_to || '' : newTask.assigned_to}
                    onChange={(e) => editingTask
                      ? setEditingTask({ ...editingTask, assigned_to: e.target.value ? parseInt(e.target.value) : null })
                      : setNewTask({ ...newTask, assigned_to: e.target.value })
                    }
                    className="mt-1 block w-full bg-black border-gray-600 text-gray-100 rounded-md shadow-sm focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-transparent hover:text-baywatch-orange rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingTask) {
                    updateTask(editingTask.id, editingTask);
                  } else {
                    createTask();
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-baywatch-orange hover:bg-baywatch-orange/70 rounded-md"
              >
                {editingTask ? 'Update' : 'Create'} Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
