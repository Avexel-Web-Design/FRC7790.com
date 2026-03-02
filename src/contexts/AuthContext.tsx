import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerPushToken, initPushListeners } from '../utils/pushClient';
import { fetchTeamPreferences } from '../utils/preferences';
import type { ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  avatar?: string;
  avatarColor?: string;
  userType?: 'member' | 'public';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/** Shared profile response shape from /api/profile */
interface ProfileResponse {
  id: number;
  username: string;
  is_admin: boolean;
  user_type?: 'member' | 'public';
  avatar?: string;
  avatar_color?: string;
}

/** Map API profile response to internal User shape. */
function mapProfileToUser(data: ProfileResponse): User {
  return {
    id: data.id,
    username: data.username,
    isAdmin: data.is_admin,
    userType: data.user_type,
    avatar: data.avatar,
    avatarColor: data.avatar_color,
  };
}

/**
 * Fetch the user's profile from the API and run side-effects
 * (push registration, team preferences caching).
 * Returns the User on success, or null on failure.
 */
async function fetchProfileAndSetup(token: string): Promise<User | null> {
  const response = await fetch('/api/profile', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const data: ProfileResponse = await response.json();
  const user = mapProfileToUser(data);

  // Best-effort side-effects (push registration + team prefs cache)
  initPushListeners().catch(() => {});
  registerPushToken(user.id).catch(() => {});
  fetchTeamPreferences()
    .then((prefs) => {
      try { localStorage.setItem('team_prefs_cache_v1', JSON.stringify(prefs)); } catch {}
    })
    .catch(() => {});

  return user;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from stored token
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const restored = await fetchProfileAndSetup(token);
          if (restored) {
            setUser(restored);
          } else {
            localStorage.removeItem('token');
          }
        } catch {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };
    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) return false;

      const { token } = await response.json();
      localStorage.setItem('token', token);

      try { localStorage.removeItem('team_prefs_cache_v1'); } catch {}

      const profileUser = await fetchProfileAndSetup(token);
      setUser(profileUser ?? { id: 0, username, isAdmin: false });

      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) return false;

      const { token } = await response.json();
      if (!token) return false;
      localStorage.setItem('token', token);

      try { localStorage.removeItem('team_prefs_cache_v1'); } catch {}

      const profileUser = await fetchProfileAndSetup(token);
      setUser(profileUser ?? { id: 0, username, isAdmin: false });

      return true;
    } catch {
      return false;
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
