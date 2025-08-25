import { createMiddleware } from 'hono/factory';

// Strict CORS middleware that reflects allowed Origin and supports Capacitor
export const corsMiddleware = createMiddleware(async (c, next) => {
  const origin = c.req.header('Origin') || '';

  // Allowed origins: production domains, pages.dev, local dev, and Capacitor
  const allowedOrigins = new Set<string>([
    'https://www.frc7790.com',
    'https://frc7790.com',
    'https://frc7790-com.pages.dev',
    'https://frc7790.pages.dev',
    'http://localhost:5173',
    'http://localhost',
    'http://127.0.0.1:5173',
    // Capacitor WebView origins
    'capacitor://localhost',
    'capacitor://app'
  ]);

  const isPreflight = c.req.method === 'OPTIONS';
  const reqHeaders = c.req.header('Access-Control-Request-Headers');
  // Allow explicit list plus common localhost and capacitor schemes
  const isLocalhost = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  const isCapacitor = origin.startsWith('capacitor://');
  const isNullOrigin = origin === 'null';
  const isAllowed = origin && (allowedOrigins.has(origin) || isLocalhost || isCapacitor || isNullOrigin);

  // Always vary on Origin for cache correctness
  c.header('Vary', 'Origin');

  if (isAllowed) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Non-CORS request (same-origin or no origin like curl) – allow generically
    c.header('Access-Control-Allow-Origin', '*');
    // Do NOT set Allow-Credentials with wildcard
  } else {
    // Unknown origin – do not reflect credentials
    c.header('Access-Control-Allow-Origin', 'null');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', reqHeaders || 'Content-Type, Authorization, X-Session-ID');
  c.header('Access-Control-Max-Age', '86400');

  if (isPreflight) {
    // Short-circuit preflight (200 OK is acceptable for preflight)
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
  
  // Check if this is a notification endpoint - be more generous with these
  const path = c.req.path;
  const isNotificationEndpoint = path.includes('/notifications/');
  
  // Different limits for different endpoint types
  const maxRequests = isNotificationEndpoint ? 200 : 150; // Higher limit for notifications
  
  const clientData = requestCounts.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
  } else {
    clientData.count++;
    if (clientData.count > maxRequests) {
      console.log(`Rate limit exceeded for IP ${clientIP}: ${clientData.count}/${maxRequests} requests`);
      return c.json({ 
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per 15 minutes.`,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      }, 429);
    }
  }
  
  // Add rate limit headers
  c.header('X-RateLimit-Limit', maxRequests.toString());
  c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - (clientData?.count || 0)).toString());
  c.header('X-RateLimit-Reset', Math.ceil((clientData?.resetTime || now + windowMs) / 1000).toString());
  
  await next();
});
