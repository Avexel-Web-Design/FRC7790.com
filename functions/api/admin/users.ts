import { Hono } from 'hono';
import { Effect } from 'effect';
import { authMiddleware } from '../auth/middleware';
import {
  authEffectHandler,
  parseBody,
  type Env,
  query,
  queryOne,
  execute,
  ValidationError,
  AuthError,
  ConflictError
} from '../lib/effect-hono';

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface DbUser {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
  avatar_color: string | null;
  user_type: string;
}

interface UpdateUserBody {
  is_admin?: boolean;
  username?: string;
  password?: string;
}

// Simple password hashing using Web Crypto API
const hashPassword = (password: string): Effect.Effect<string, never, never> =>
  Effect.promise(async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });

const users = new Hono<{ 
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

users.use('*', authMiddleware);

// Get all users (admin only)
users.get('/', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');

    if (!user.isAdmin) {
      return yield* Effect.fail(AuthError.forbidden());
    }

    const type = c.req.query('user_type');
    
    if (type === 'member' || type === 'public') {
      const results = yield* query<DbUser>(
        'SELECT id, username, is_admin, created_at, avatar_color, user_type FROM users WHERE user_type = ? ORDER BY id ASC',
        type
      );
      return results;
    }
    
    const results = yield* query<DbUser>(
      'SELECT id, username, is_admin, created_at, avatar_color, user_type FROM users ORDER BY id ASC'
    );
    return results;
  })
));

// Update user (for changing admin status, username, or password)
users.put('/:userId', authEffectHandler((c) =>
  Effect.gen(function* () {
    const currentUser = c.get('user');
    
    if (!currentUser.isAdmin) {
      return yield* Effect.fail(AuthError.forbidden());
    }

    const userId = parseInt(c.req.param('userId'), 10);
    const body = yield* parseBody<UpdateUserBody>(c);
    
    // Prevent changing your own admin status
    if (userId === currentUser.id && body.is_admin !== undefined) {
      return yield* Effect.fail(ValidationError.single('Cannot modify your own admin status'));
    }
    
    const updates: string[] = [];
    const values: (string | number)[] = [];

    // Handle admin status update
    if (body.is_admin !== undefined) {
      const isAdmin = body.is_admin === true ? 1 : 0;
      updates.push('is_admin = ?');
      values.push(isAdmin);
    }

    // Handle username update
    if (body.username !== undefined && body.username.trim() !== '') {
      // Check if username already exists (excluding current user)
      const existingUser = yield* queryOne<{ id: number }>(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        body.username.trim(),
        userId
      );
      
      if (existingUser) {
        return yield* Effect.fail(ConflictError.field('username', 'Username already exists'));
      }
      
      updates.push('username = ?');
      values.push(body.username.trim());
    }

    // Handle password update
    if (body.password !== undefined && body.password.trim() !== '') {
      const hashedPassword = yield* hashPassword(body.password.trim());
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return yield* Effect.fail(ValidationError.single('No valid fields to update'));
    }

    // Add user ID to the end of values array
    values.push(userId);

    const queryStr = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    yield* execute(queryStr, ...values);
    
    return { success: true };
  })
));

// Delete user
users.delete('/:userId', authEffectHandler((c) =>
  Effect.gen(function* () {
    const currentUser = c.get('user');
    
    if (!currentUser.isAdmin) {
      return yield* Effect.fail(AuthError.forbidden());
    }

    const userId = parseInt(c.req.param('userId'), 10);
    
    // Prevent deleting your own account
    if (userId === currentUser.id) {
      return yield* Effect.fail(ValidationError.single('Cannot delete your own account'));
    }
    
    yield* execute('DELETE FROM users WHERE id = ?', userId);
    
    return { success: true };
  })
));

export default users;
