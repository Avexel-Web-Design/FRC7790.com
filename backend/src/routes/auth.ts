import { Router, type IRequest } from 'itty-router';
import { Env, AuthenticatedRequest } from '../types.js';
import { AuthService } from '../auth.js';
import { DatabaseService } from '../database.js';
import { corsHeaders, jsonResponse, errorResponse, successResponse, getClientIP, getUserAgent } from '../utils.js';

export function createAuthRoutes(router: Router<IRequest>, env: Env) {
  const authService = new AuthService(env);
  const dbService = new DatabaseService(env);

  // Login endpoint
  router.post('/api/auth/login', async (request: Request) => {
    try {
      const body = await request.json() as any;
      const { email, password } = body;

      if (!email || !password) {
        return errorResponse('Email and password are required', 400, corsHeaders(env.CORS_ORIGIN));
      }

      const user = await dbService.getUserByEmail(email);
      if (!user) {
        return errorResponse('Invalid credentials', 401, corsHeaders(env.CORS_ORIGIN));
      }

      const isValidPassword = await authService.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return errorResponse('Invalid credentials', 401, corsHeaders(env.CORS_ORIGIN));
      }

      const sessionId = await authService.createSession(user.id);
      const token = await authService.generateToken(user);

      // Log successful login
      await dbService.logAudit(
        user.id,
        'LOGIN',
        'AUTH',
        user.id.toString(),
        'User logged in',
        getClientIP(request),
        getUserAgent(request)
      );

      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token,
        sessionId
      }, 'Login successful', corsHeaders(env.CORS_ORIGIN));

    } catch (error) {
      console.error('Login error:', error);
      return errorResponse('Internal server error', 500, corsHeaders(env.CORS_ORIGIN));
    }
  });

  // Register endpoint (if enabled)
  router.post('/api/auth/register', async (request: Request) => {
    try {
      const settings = await dbService.getSiteSetting('registration_enabled');
      if (!settings || settings.value !== 'true') {
        return errorResponse('Registration is currently disabled', 403, corsHeaders(env.CORS_ORIGIN));
      }

      const body = await request.json() as any;
      const { email, password, name, confirmPassword } = body;

      if (!email || !password || !name) {
        return errorResponse('Email, password, and name are required', 400, corsHeaders(env.CORS_ORIGIN));
      }

      if (password !== confirmPassword) {
        return errorResponse('Passwords do not match', 400, corsHeaders(env.CORS_ORIGIN));
      }

      // Check if user already exists
      const existingUser = await dbService.getUserByEmail(email);
      if (existingUser) {
        return errorResponse('User already exists', 409, corsHeaders(env.CORS_ORIGIN));
      }

      const passwordHash = await authService.hashPassword(password);
      const user = await dbService.createUser(email, passwordHash, name);

      const sessionId = await authService.createSession(user.id);
      const token = await authService.generateToken(user);

      return successResponse({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token,
        sessionId
      }, 'Registration successful', corsHeaders(env.CORS_ORIGIN));

    } catch (error) {
      console.error('Registration error:', error);
      return errorResponse('Internal server error', 500, corsHeaders(env.CORS_ORIGIN));
    }
  });

  // Logout endpoint
  router.post('/api/auth/logout', async (request: AuthenticatedRequest) => {
    try {
      const sessionId = request.headers.get('X-Session-ID');
      
      if (sessionId) {
        await authService.deleteSession(sessionId);
      }

      if (request.user) {
        await dbService.logAudit(
          request.user.id,
          'LOGOUT',
          'AUTH',
          request.user.id.toString(),
          'User logged out',
          getClientIP(request),
          getUserAgent(request)
        );
      }

      return successResponse(null, 'Logout successful', corsHeaders(env.CORS_ORIGIN));

    } catch (error) {
      console.error('Logout error:', error);
      return errorResponse('Internal server error', 500, corsHeaders(env.CORS_ORIGIN));
    }
  });

  // Get current user
  router.get('/api/auth/me', async (request: AuthenticatedRequest) => {
    try {
      if (!request.user) {
        return errorResponse('Unauthorized', 401, corsHeaders(env.CORS_ORIGIN));
      }

      return successResponse({
        user: {
          id: request.user.id,
          email: request.user.email,
          name: request.user.name,
          role: request.user.role,
          created_at: request.user.created_at
        }
      }, undefined, corsHeaders(env.CORS_ORIGIN));

    } catch (error) {
      console.error('Get user error:', error);
      return errorResponse('Internal server error', 500, corsHeaders(env.CORS_ORIGIN));
    }
  });

  // Change password
  router.post('/api/auth/change-password', async (request: AuthenticatedRequest) => {
    try {
      if (!request.user) {
        return errorResponse('Unauthorized', 401, corsHeaders(env.CORS_ORIGIN));
      }

      const body = await request.json() as any;
      const { currentPassword, newPassword, confirmPassword } = body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return errorResponse('All password fields are required', 400, corsHeaders(env.CORS_ORIGIN));
      }

      if (newPassword !== confirmPassword) {
        return errorResponse('New passwords do not match', 400, corsHeaders(env.CORS_ORIGIN));
      }

      // Verify current password
      const user = await dbService.getUserByEmail(request.user.email);
      if (!user) {
        return errorResponse('User not found', 404, corsHeaders(env.CORS_ORIGIN));
      }

      const userWithPassword = user as any;
      const isValidPassword = await authService.verifyPassword(currentPassword, userWithPassword.password_hash);
      if (!isValidPassword) {
        return errorResponse('Current password is incorrect', 401, corsHeaders(env.CORS_ORIGIN));
      }

      // Hash new password and update
      const newPasswordHash = await authService.hashPassword(newPassword);
      await dbService.updateUser(request.user.id, { password_hash: newPasswordHash } as any, request.user.id);

      await dbService.logAudit(
        request.user.id,
        'CHANGE_PASSWORD',
        'AUTH',
        request.user.id.toString(),
        'Password changed',
        getClientIP(request),
        getUserAgent(request)
      );

      return successResponse(null, 'Password changed successfully', corsHeaders(env.CORS_ORIGIN));

    } catch (error) {
      console.error('Change password error:', error);
      return errorResponse('Internal server error', 500, corsHeaders(env.CORS_ORIGIN));
    }
  });
}
