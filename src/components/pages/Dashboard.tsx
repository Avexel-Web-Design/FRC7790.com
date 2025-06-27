import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<{ id: number; username: string; is_admin: number } | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      // Decode the token to get user info
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUser(decodedToken);

      if (decodedToken.isAdmin) {
        fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => setUsers(data));
      }
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      {user && <p className="mb-4">Welcome, {user.username}!</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow-md rounded p-4">
          <h2 className="text-xl font-bold mb-2">Calendar</h2>
          <Link to="/calendar" className="text-blue-500 hover:underline">
            Go to Calendar
          </Link>
        </div>
        <div className="bg-white shadow-md rounded p-4">
          <h2 className="text-xl font-bold mb-2">Tasks</h2>
          <Link to="/tasks" className="text-blue-500 hover:underline">
            Go to Tasks
          </Link>
        </div>
      </div>

      {user?.is_admin === 1 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Admin - User Management</h2>
          <div className="bg-white shadow-md rounded p-4">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-500">{u.id}</td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-500">{u.username}</td>
                    <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-500">{u.is_admin ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
