import { Hono } from 'hono';
import { authMiddleware } from '../auth/middleware';

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

const users = new Hono<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>();

users.use('*', authMiddleware);

users.get('/', async (c) => {
  const user = c.get('user');

  if (!user.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare('SELECT id, username, is_admin, created_at, avatar_color FROM users').all();
    return c.json(results);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user (for changing admin status, username, or password)
users.put('/:userId', async (c) => {
  const currentUser = c.get('user');
  if (!currentUser.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const userId = parseInt(c.req.param('userId'), 10);
  const body = await c.req.json();
  
  // Prevent changing your own admin status
  if (userId === currentUser.id && body.is_admin !== undefined) {
    return c.json({ error: 'Cannot modify your own admin status' }, 400);
  }
  
  try {
    const updates: string[] = [];
    const values: any[] = [];

    // Handle admin status update
    if (body.is_admin !== undefined) {
      const isAdmin = body.is_admin === true ? 1 : 0;
      updates.push('is_admin = ?');
      values.push(isAdmin);
    }

    // Handle username update
    if (body.username !== undefined && body.username.trim() !== '') {
      // Check if username already exists (excluding current user)
      const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE username = ? AND id != ?')
        .bind(body.username.trim(), userId)
        .first();
      
      if (existingUser) {
        return c.json({ error: 'Username already exists' }, 400);
      }
      
      updates.push('username = ?');
      values.push(body.username.trim());
    }

    // Handle password update
    if (body.password !== undefined && body.password.trim() !== '') {
      const hashedPassword = await hashPassword(body.password.trim());
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    // Add user ID to the end of values array
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await c.env.DB.prepare(query).bind(...values).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete user
users.delete('/:userId', async (c) => {
  const currentUser = c.get('user');
  if (!currentUser.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const userId = parseInt(c.req.param('userId'), 10);
  
  // Prevent deleting your own account
  if (userId === currentUser.id) {
    return c.json({ error: 'Cannot delete your own account' }, 400);
  }
  
  try {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?')
      .bind(userId)
      .run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default users;
