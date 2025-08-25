import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { authMiddleware } from './middleware';

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const register = new Hono<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>();

register.post('/', async (c) => {
  try {
    const { username, password, is_admin } = await c.req.json();
    
    // Check if this is an admin creating a user with admin privileges
    const authHeader = c.req.header('Authorization');
  let isAdmin = false;
  let creatorIsAdmin = false; // whether requester is admin (for user_type decision)
    
    if (is_admin === true) {
      // Admin privileges requested, verify if requester is an admin
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Admin privileges cannot be assigned by non-admin users' }, 403);
      }
      
      try {
        const token = authHeader.split(' ')[1];
        const decoded = await verify(token, c.env.JWT_SECRET);
        if (!(decoded.isAdmin === true || decoded.isAdmin === 1)) {
          return c.json({ error: 'Only administrators can create admin users' }, 403);
        }
        isAdmin = true;
        creatorIsAdmin = true;
      } catch (e) {
        return c.json({ error: 'Invalid authorization for admin user creation' }, 401);
      }
    }
    
    // Convert isAdmin to integer for DB
    const isAdminValue = isAdmin ? 1 : 0;

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters long' }, 400);
    }

    // Determine account type: self-registered (public) vs admin-created (member)
    // If a requester is admin (via Authorization), create a member by default; otherwise, create a public account.
    const userType = creatorIsAdmin ? 'member' : 'public';

    // For created (public) accounts, enforce username pattern [A-Za-z0-9._]+
    const allowedUsername = /^[A-Za-z0-9._]+$/;
    if (userType === 'public') {
      if (!allowedUsername.test(username)) {
        return c.json({ error: 'Username may only contain letters, numbers, underscores, and periods' }, 400);
      }
    }

    const hashedPassword = await hashPassword(password);

    const avatarValue = userType === 'member' ? `https://api.dicebear.com/7.x/initials/svg?seed=${username}` : null;
    const { success, meta } = await c.env.DB.prepare(
      'INSERT INTO users (username, password, avatar, is_admin, user_type) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(
        username,
        hashedPassword,
        avatarValue,
        isAdminValue,
        userType
      )
      .run();

    if (success) {
      const userId = meta.last_row_id;
      const token = await sign(
        { 
          id: userId, 
          username: username,
          isAdmin: isAdminValue,
          userType,
          avatar: avatarValue || undefined,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }, 
        c.env.JWT_SECRET
      );

      return c.json({ 
        token,
        user: {
          id: userId,
          username: username,
          isAdmin: isAdminValue === 1,
          userType,
          avatar: avatarValue || undefined
        },
        message: 'Registration successful'
      });
    }

    return c.json({ error: 'Failed to register user' }, 500);
  } catch (e) {
    if (e instanceof Error && e.message.includes('UNIQUE constraint failed')) {
      return c.json({ error: 'Username already exists' }, 409);
    }
    console.error('Registration error:', e);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default register;
