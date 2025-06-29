import { createMiddleware } from 'hono/factory';

// Simple CORS middleware without hono/cors dependency
export const corsMiddleware = createMiddleware(async (c, next) => {
  // Set CORS headers
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
  c.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
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

// Rate limiting middleware (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // max requests per window
  
  const clientData = requestCounts.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
  } else {
    clientData.count++;
    if (clientData.count > maxRequests) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
  }
  
  await next();
});
