import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

export const authMiddleware = createMiddleware<{ 
  Bindings: CloudflareEnv;
  Variables: { user: AuthUser };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await verify(token, c.env.JWT_SECRET);
    const user: AuthUser = {
      id: decoded.id as number,
      username: decoded.username as string,
      isAdmin: decoded.isAdmin as boolean
    };
    c.set('user', user);
    await next();
  } catch (e) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});
