import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const USERNAME_REGEX = /^[A-Za-z0-9._]+$/;

const CreateAccount: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!USERNAME_REGEX.test(username)) {
      setError('Username may only contain letters, numbers, underscores, and periods.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const success = await register(username, password);
      if (success) {
        // Public accounts are directed to Settings per requirements
        navigate('/settings');
      } else {
        setError('Could not create account. The username might be taken.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-baywatch-orange">
            Create a Public Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Public accounts can access match, event, and team overviews and scouting data.
          </p>
        </div>
        <form className="card-gradient shadow-lg rounded-lg px-8 pt-6 pb-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <input
              className="bg-transparent shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-baywatch-orange leading-tight focus:outline-none focus:shadow-outline focus:border-baywatch-orange [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-baywatch-orange [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset]"
              id="username"
              type="text"
              placeholder="Username (letters, numbers, _ .)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <input
              className="bg-transparent shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-baywatch-orange leading-tight focus:outline-none focus:shadow-outline focus:border-baywatch-orange [&:-webkit-autofill]:bg-transparent [&:-webkit-autofill]:text-baywatch-orange [&:-webkit-autofill]:shadow-[0_0_0_1000px_transparent_inset]"
              id="password"
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <button
              className="w-full card-gradient hover:bg-baywatch-orange text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link className="text-baywatch-orange hover:underline" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default CreateAccount;
