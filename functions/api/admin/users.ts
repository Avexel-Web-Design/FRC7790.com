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

// Update user (for changing admin status)
users.put('/:userId', async (c) => {
  const currentUser = c.get('user');
  if (!currentUser.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const userId = parseInt(c.req.param('userId'), 10);
  const body = await c.req.json();
  
  // Prevent changing your own admin status
  if (userId === currentUser.id) {
    return c.json({ error: 'Cannot modify your own admin status' }, 400);
  }
  
  try {
    const isAdmin = body.is_admin === true ? 1 : 0;
    await c.env.DB.prepare('UPDATE users SET is_admin = ? WHERE id = ?')
      .bind(isAdmin, userId)
      .run();
    
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
