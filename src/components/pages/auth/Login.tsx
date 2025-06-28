import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-baywatch-orange">
            Sign in to FRC 7790
          </h2>
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
              placeholder="Name"
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
              placeholder="Password"
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
      <style>
        {`
          /* Global styles to override autofill */
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus,
          input:-webkit-autofill:active {
            transition: background-color 5000s ease-in-out 0s;
            -webkit-text-fill-color: rgb(249, 115, 22) !important;
            box-shadow: 0 0 0 1000px transparent inset !important;
            background-color: transparent !important;
          }
        `}
      </style>
    </div>
  );
};

export default Login;
