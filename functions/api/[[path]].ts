import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { corsMiddleware, errorMiddleware, rateLimitMiddleware } from './middleware';

// Import route modules
import register from './auth/register';
import login from './auth/login';
import adminUsers from './admin/users';
import calendar from './calendar';
import tasks from './tasks';
import profile from './profile';
import preferences from './preferences';
import scouting from './scouting/scouting';
import scoutingDrawings from './scouting/drawings';
import scoutingShare from './scouting/share';
import scoutingSync from './scouting/sync';
import scoutingUploads from './scouting/uploads';
import scoutingEvent from './scouting/event';
import scoutingMetrics from './scouting/metrics';

import chat from './chat';
import aiMatchSummary from './ai/matchSummary';

const app = new Hono().basePath('/api');

// Apply global middleware
app.use('*', corsMiddleware);
app.use('*', errorMiddleware);
app.use('*', rateLimitMiddleware);

// Mount route modules
app.route('/auth/register', register);
app.route('/auth/login', login);
app.route('/admin/users', adminUsers);
app.route('/calendar', calendar);
app.route('/tasks', tasks);
app.route('/profile', profile);
app.route('/preferences', preferences);
app.route('/scouting', scouting);
app.route('/scouting/drawings', scoutingDrawings);
app.route('/scouting/share', scoutingShare);
app.route('/scouting/sync', scoutingSync);
app.route('/scouting/uploads', scoutingUploads);
app.route('/scouting/event', scoutingEvent);
app.route('/scouting/metrics', scoutingMetrics);
app.route('/chat', chat);
app.route('/ai/match-summary', aiMatchSummary);


// Health check endpoint
app.get('/health', (c) => c.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  version: '1.0.0'
}));

// Root endpoint
app.get('/', (c) => c.json({ 
  message: 'FRC 7790 Baywatch Robotics API',
  version: '1.0.0',
  endpoints: [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register', 
    '/api/profile',
    '/api/calendar',
    '/api/tasks',
    '/api/preferences/teams',
    '/api/admin/users'
  ]
}));

export const onRequest = handle(app);
