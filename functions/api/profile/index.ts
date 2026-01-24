import { Hono } from 'hono';
import { Effect, pipe } from 'effect';
import { authMiddleware, AuthUser } from '../auth/middleware';
import { 
  authEffectHandler, 
  parseBody, 
  type Env, 
  queryOne, 
  execute,
  ValidationError,
  AuthError,
  NotFoundError,
  ConflictError
} from '../lib/effect-hono';

// Simple password hashing using Web Crypto API
const hashPassword = (password: string): Effect.Effect<string, never, never> =>
  Effect.promise(async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });

// Simple password verification using Web Crypto API
const verifyPassword = (password: string, hashedPassword: string): Effect.Effect<boolean, never, never> =>
  Effect.promise(async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return computedHash === hashedPassword;
  });

interface DbUser {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
  avatar_color: string | null;
  user_type: string;
}

interface DbUserWithPassword {
  password: string;
}

interface ProfileUpdateBody {
  password?: string;
  avatar_color?: string;
  username?: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const profile = new Hono<{ 
  Bindings: Env;
  Variables: { user: AuthUser };
}>();

profile.use('*', authMiddleware);

// Get current user profile
profile.get('/', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    
    const dbUser = yield* queryOne<DbUser>(
      'SELECT id, username, is_admin, created_at, avatar_color, user_type FROM users WHERE id = ?',
      user.id
    );

    if (!dbUser) {
      return yield* Effect.fail(NotFoundError.resource('User'));
    }

    return {
      id: dbUser.id,
      username: dbUser.username,
      is_admin: !!dbUser.is_admin,
      user_type: dbUser.user_type,
      created_at: dbUser.created_at,
      avatar_color: dbUser.avatar_color
    };
  })
));

// Update user profile
profile.put('/', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const body = yield* parseBody<ProfileUpdateBody>(c);
    
    // Handle password update
    if (body.password) {
      if (body.password.length < 6) {
        return yield* Effect.fail(ValidationError.single('Password must be at least 6 characters long'));
      }

      const hashedPassword = yield* hashPassword(body.password);

      yield* execute(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        hashedPassword,
        user.id
      );

      return { message: 'Password updated successfully' };
    }

    // Handle avatar color update
    if (body.avatar_color !== undefined) {
      yield* execute(
        'UPDATE users SET avatar_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        body.avatar_color,
        user.id
      );

      return { message: 'Avatar color updated successfully' };
    }

    // Handle username update
    if (body.username !== undefined) {
      const newUsername = String(body.username).trim();

      if (newUsername.length < 3) {
        return yield* Effect.fail(ValidationError.single('Username must be at least 3 characters long'));
      }

      // Check if username is already taken by another user (case-insensitive)
      const existingUser = yield* queryOne<{ id: number }>(
        'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
        newUsername,
        user.id
      );

      if (existingUser) {
        return yield* Effect.fail(ConflictError.field('username', 'Username already taken'));
      }

      yield* execute(
        'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        newUsername,
        user.id
      );

      return { message: 'Profile updated successfully' };
    }

    return yield* Effect.fail(ValidationError.single('No valid fields to update'));
  })
));

// Change password
profile.post('/change-password', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const body = yield* parseBody<ChangePasswordBody>(c);
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return yield* Effect.fail(ValidationError.single('All password fields are required'));
    }

    if (newPassword !== confirmPassword) {
      return yield* Effect.fail(ValidationError.single('New passwords do not match'));
    }

    if (newPassword.length < 6) {
      return yield* Effect.fail(ValidationError.single('New password must be at least 6 characters long'));
    }

    // Get current user with password
    const dbUser = yield* queryOne<DbUserWithPassword>(
      'SELECT password FROM users WHERE id = ?',
      user.id
    );

    if (!dbUser) {
      return yield* Effect.fail(NotFoundError.resource('User'));
    }

    // Verify current password
    const validPassword = yield* verifyPassword(currentPassword, dbUser.password);
    if (!validPassword) {
      return yield* Effect.fail(AuthError.invalidCredentials('Current password is incorrect'));
    }

    // Hash new password
    const hashedPassword = yield* hashPassword(newPassword);

    // Update password
    yield* execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      hashedPassword,
      user.id
    );

    return { message: 'Password changed successfully' };
  })
));

export default profile;
