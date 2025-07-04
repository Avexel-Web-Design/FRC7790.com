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
  avatar: string;
}

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple password verification using Web Crypto API
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === hashedPassword;
}

const profile = new Hono<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>();

profile.use('*', authMiddleware);

// Get current user profile
profile.get('/', async (c) => {
  try {
    const user = c.get('user');
    
    const dbUser = await c.env.DB.prepare('SELECT id, username, is_admin, created_at, avatar_color FROM users WHERE id = ?')
      .bind(user.id)
      .first() as { id: number; username: string; is_admin: number; created_at: string; avatar_color: string | null } | null;

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: dbUser.id,
      username: dbUser.username,
      is_admin: !!dbUser.is_admin,
      created_at: dbUser.created_at,
      avatar_color: dbUser.avatar_color
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user profile
profile.put('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    
    // Handle password update
    if (body.password) {
      if (body.password.length < 6) {
        return c.json({ error: 'Password must be at least 6 characters long' }, 400);
      }

      // Hash new password
      const hashedPassword = await hashPassword(body.password);

      // Update password
      const { success } = await c.env.DB.prepare(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(hashedPassword, user.id)
        .run();

      if (success) {
        return c.json({ message: 'Password updated successfully' });
      }

      return c.json({ error: 'Failed to update password' }, 500);
    }

    // Handle avatar color update
    if (body.avatar_color !== undefined) {
      const { success } = await c.env.DB.prepare(
        'UPDATE users SET avatar_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(body.avatar_color, user.id)
        .run();

      if (success) {
        return c.json({ message: 'Avatar color updated successfully' });
      }

      return c.json({ error: 'Failed to update avatar color' }, 500);
    }

    // Handle username update
    if (body.username !== undefined) { // Check if username field is present in the request body
      const newUsername = String(body.username).trim(); // Ensure it's a string and trim whitespace

      if (newUsername.length < 3) {
        return c.json({ error: 'Username must be at least 3 characters long' }, 400);
      }

      // Check if username is already taken by another user (case-insensitive)
      const existingUser = await c.env.DB.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?')
        .bind(newUsername, user.id)
        .first();

      if (existingUser) {
        return c.json({ error: 'Username already taken' }, 409);
      }

      const { success } = await c.env.DB.prepare(
        'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
        .bind(newUsername, user.id)
        .run();

      if (success) {
        return c.json({ message: 'Profile updated successfully' });
      }

      return c.json({ error: 'Failed to update profile' }, 500);
    }

    return c.json({ error: 'No valid fields to update' }, 400);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Change password
profile.post('/change-password', async (c) => {
  try {
    const user = c.get('user');
    const { currentPassword, newPassword, confirmPassword } = await c.req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.json({ error: 'All password fields are required' }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ error: 'New passwords do not match' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'New password must be at least 6 characters long' }, 400);
    }

    // Get current user with password
    const dbUser = await c.env.DB.prepare('SELECT password FROM users WHERE id = ?')
      .bind(user.id)
      .first() as { password: string } | null;

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Verify current password
    const validPassword = await verifyPassword(currentPassword, dbUser.password);
    if (!validPassword) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    const { success } = await c.env.DB.prepare(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(hashedPassword, user.id)
      .run();

    if (success) {
      return c.json({ message: 'Password changed successfully' });
    }

    return c.json({ error: 'Failed to change password' }, 500);
  } catch (error) {
    console.error('Error changing password:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default profile;
