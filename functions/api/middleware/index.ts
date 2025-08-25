import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

// Simple CORS middleware without hono/cors dependency
export const corsMiddleware = createMiddleware(async (c, next) => {
  // Echo the Origin for better compatibility with credentialed requests and WebViews
  const origin = c.req.header('Origin') || '*';
  c.header('Access-Control-Allow-Origin', origin);
  if (origin !== '*') {
    c.header('Vary', 'Origin');
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // If the browser sent Access-Control-Request-Headers, reflect them; otherwise provide a safe default
  const reqHdrs = c.req.header('Access-Control-Request-Headers');
  c.header('Access-Control-Allow-Headers', reqHdrs || 'Content-Type, Authorization, X-Session-ID');
  // Only meaningful when the origin isn’t '*'; harmless otherwise
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header('Access-Control-Max-Age', '600');

  // Handle preflight requests early
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }

  await next();
});

// Error handling middleware
export const errorMiddleware = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof Error) {
      return c.json({ 
        error: 'Internal Server Error',
        message: error.message 
      }, 500);
    }
    
    return c.json({ 
      error: 'Internal Server Error',
      message: 'An unexpected error occurred' 
    }, 500);
  }
});

// Rate limiting middleware (enhanced and safer implementation)
type Bucket = { count: number; resetTime: number };
const requestCounts = new Map<string, Bucket>();

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const path = c.req.path;
  const method = c.req.method.toUpperCase();

  // Skip rate limit for health checks and preflight already handled by CORS
  if (path.endsWith('/health')) {
    return next();
  }

  // Build a stable client key preference order:
  // 1) Authenticated user id (from JWT)
  // 2) CF-Connecting-IP or first X-Forwarded-For
  // 3) Explicit X-Session-ID header (we will also send from client)
  // 4) CF-Ray (per POP trace) or User-Agent as a last resort
  let key: string | null = null;
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring('Bearer '.length);
    try {
      const decoded: any = await verify(token, c.env.JWT_SECRET);
      if (decoded && typeof decoded.id === 'number') {
        key = `user:${decoded.id}`;
      }
    } catch {
      // ignore verify errors for rate limit keying
    }
  }
  if (!key) {
    const fwd = c.req.header('X-Forwarded-For');
    const ip = c.req.header('CF-Connecting-IP') || (fwd ? fwd.split(',')[0].trim() : undefined);
    if (ip) key = `ip:${ip}`;
  }
  if (!key) {
    const sess = c.req.header('X-Session-ID');
    if (sess) key = `sess:${sess}`;
  }
  if (!key) {
    const ray = c.req.header('CF-Ray');
    const ua = c.req.header('User-Agent');
    if (ray) key = `ray:${ray}`;
    else if (ua) key = `ua:${ua.substring(0, 64)}`; // cap length
  }

  // If we still can't find a stable key, don't rate limit this request to avoid global lockout
  if (!key) {
    return next();
  }

  // Higher limits for GET and notification endpoints, stricter for mutating requests
  const isNotificationEndpoint = path.includes('/notifications/');
  const isChatPoll = isNotificationEndpoint && (path.includes('/all') || path.includes('/total') || path.includes('/unread'));
  let maxRequests = 0;
  if (method === 'GET') {
    maxRequests = isChatPoll ? 2000 : 1000;
  } else {
    maxRequests = 300; // POST/PUT/DELETE
  }

  let bucket = requestCounts.get(key);
  if (!bucket || now > bucket.resetTime) {
    bucket = { count: 1, resetTime: now + windowMs };
    requestCounts.set(key, bucket);
  } else {
    bucket.count++;
  }

  // Set rate limit headers early so clients can read even on 429
  c.header('X-RateLimit-Limit', String(maxRequests));
  c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - bucket.count)));
  c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetTime / 1000)));

  if (bucket.count > maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetTime - now) / 1000));
    c.header('Retry-After', String(retryAfterSec));
    console.log(`Rate limit 429 for key=${key} path=${path} method=${method} count=${bucket.count}/${maxRequests}`);
    return c.json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please wait ${retryAfterSec}s and try again.`,
      retryAfter: retryAfterSec
    }, 429);
  }

  await next();
});
