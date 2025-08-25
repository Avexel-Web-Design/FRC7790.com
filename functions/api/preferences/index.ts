import { Hono } from 'hono';
import { authMiddleware, AuthUser } from '../auth/middleware';

interface CloudflareEnv {
  DB: D1Database;
}

const preferences = new Hono<{ Bindings: CloudflareEnv; Variables: { user: AuthUser } }>();

preferences.use('*', authMiddleware);

// Get all per-team preferences for current user
preferences.get('/teams', async (c) => {
  const user = c.get('user');
  const rows = await c.env.DB.prepare(
    'SELECT team_number, highlight_color, notif_upcoming, notif_alliance, notif_results, notif_awards FROM user_team_preferences WHERE user_id = ? ORDER BY CAST(team_number AS INTEGER)'
  ).bind(user.id).all();
  return c.json({ teams: rows.results || [] });
});

// Upsert a team preference
preferences.post('/teams', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const team_number = String(body.team_number || '').trim();
  if (!team_number || !/^\d+$/.test(team_number)) {
    return c.json({ error: 'team_number must be digits' }, 400);
  }
  const color = typeof body.highlight_color === 'string' ? body.highlight_color : '#ffd166';
  const notif_upcoming = body.notif_upcoming ? 1 : 0;
  const notif_alliance = body.notif_alliance ? 1 : 0;
  const notif_results = body.notif_results ? 1 : 0;
  const notif_awards = body.notif_awards ? 1 : 0;

  await c.env.DB.prepare(
    `INSERT INTO user_team_preferences (user_id, team_number, highlight_color, notif_upcoming, notif_alliance, notif_results, notif_awards)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, team_number) DO UPDATE SET
       highlight_color = excluded.highlight_color,
       notif_upcoming = excluded.notif_upcoming,
       notif_alliance = excluded.notif_alliance,
       notif_results = excluded.notif_results,
       notif_awards = excluded.notif_awards,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(user.id, team_number, color, notif_upcoming, notif_alliance, notif_results, notif_awards).run();

  return c.json({ success: true });
});

// Delete a team preference
preferences.delete('/teams/:team_number', async (c) => {
  const user = c.get('user');
  const { team_number } = c.req.param();
  await c.env.DB.prepare('DELETE FROM user_team_preferences WHERE user_id = ? AND team_number = ?')
    .bind(user.id, team_number).run();
  return c.json({ success: true });
});

export default preferences;
