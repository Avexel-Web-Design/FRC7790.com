import { Hono } from 'hono';

interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

const debug = new Hono<{ Bindings: CloudflareEnv }>();

// Basic debug endpoint to test environment
debug.get('/', async (c) => {
  try {
    // Test database connection
    const { results } = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').all();
    
    // Test JWT_SECRET existence (don't expose the actual value)
    const hasJwtSecret = !!c.env.JWT_SECRET;
    
    return c.json({
      status: 'ok',
      database_accessible: true,
      user_count: results[0],
      jwt_secret_configured: hasJwtSecret,
      environment_keys: Object.keys(c.env),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return c.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment_keys: Object.keys(c.env || {}),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Test specific API endpoints
debug.get('/test-calendar', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM calendar_events LIMIT 5').all();
    return c.json({
      status: 'ok',
      calendar_events_count: results.length,
      sample_events: results
    });
  } catch (error) {
    console.error('Calendar test error:', error);
    return c.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

debug.get('/test-tasks', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM tasks LIMIT 5').all();
    return c.json({
      status: 'ok',
      tasks_count: results.length,
      sample_tasks: results
    });
  } catch (error) {
    console.error('Tasks test error:', error);
    return c.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

debug.get('/test-users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT id, username, is_admin, avatar_color FROM users LIMIT 5').all();
    return c.json({
      status: 'ok',
      users_count: results.length,
      sample_users: results
    });
  } catch (error) {
    console.error('Users test error:', error);
    return c.json({ 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default debug;
