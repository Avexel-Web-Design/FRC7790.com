import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';

const Login = () => {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { saveSession } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
  const res = await api.login({ fullName, password });
  saveSession(res.user, res.token);
  const saved = localStorage.getItem('frc7598_last_dashboard_route');
  if (saved && saved.startsWith('/')) {
    navigate(saved);
  } else {
    navigate('/channels');
  }
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 mt-12">
      <div className="w-full max-w-md bg-white/10 border border-sca-gold/20 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-1">Member Login</h1>
        <p className="text-white/70 mb-6">Use your full name and password</p>

        {error && (
          <div className="mb-4 text-sm text-red-300 bg-red-900/30 border border-red-500/30 rounded p-3">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-sca-gold"
              placeholder="Jane Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-sca-gold"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-sca-gold to-sca-gold-light text-sca-purple-dark font-semibold shadow-lg shadow-sca-gold/20 disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
