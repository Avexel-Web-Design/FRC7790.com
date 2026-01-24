import { Hono } from 'hono';
import { Effect } from 'effect';
import { authMiddleware, AuthUser } from '../auth/middleware';
import { 
  authEffectHandler, 
  parseBody,
  type Env,
  query,
  execute,
  ValidationError
} from '../lib/effect-hono';

interface TeamPreference {
  team_number: string;
  highlight_color: string;
  notif_upcoming: number;
  notif_alliance: number;
  notif_results: number;
  notif_awards: number;
}

interface TeamPreferenceBody {
  team_number?: string;
  highlight_color?: string;
  notif_upcoming?: boolean;
  notif_alliance?: boolean;
  notif_results?: boolean;
  notif_awards?: boolean;
}

const preferences = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();

preferences.use('*', authMiddleware);

// Get all per-team preferences for current user
preferences.get('/teams', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const rows = yield* query<TeamPreference>(
      'SELECT team_number, highlight_color, notif_upcoming, notif_alliance, notif_results, notif_awards FROM user_team_preferences WHERE user_id = ? ORDER BY CAST(team_number AS INTEGER)',
      user.id
    );
    return { teams: rows };
  })
));

// Upsert a team preference
preferences.post('/teams', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const body = yield* parseBody<TeamPreferenceBody>(c);
    
    const team_number = String(body.team_number || '').trim();
    if (!team_number || !/^\d+$/.test(team_number)) {
      return yield* Effect.fail(ValidationError.single('team_number must be digits'));
    }
    
    const color = typeof body.highlight_color === 'string' ? body.highlight_color : '#ffd166';
    const notif_upcoming = body.notif_upcoming ? 1 : 0;
    const notif_alliance = body.notif_alliance ? 1 : 0;
    const notif_results = body.notif_results ? 1 : 0;
    const notif_awards = body.notif_awards ? 1 : 0;

    yield* execute(
      `INSERT INTO user_team_preferences (user_id, team_number, highlight_color, notif_upcoming, notif_alliance, notif_results, notif_awards)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, team_number) DO UPDATE SET
         highlight_color = excluded.highlight_color,
         notif_upcoming = excluded.notif_upcoming,
         notif_alliance = excluded.notif_alliance,
         notif_results = excluded.notif_results,
         notif_awards = excluded.notif_awards,
         updated_at = CURRENT_TIMESTAMP`,
      user.id,
      team_number,
      color,
      notif_upcoming,
      notif_alliance,
      notif_results,
      notif_awards
    );

    return { success: true };
  })
));

// Delete a team preference
preferences.delete('/teams/:team_number', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const { team_number } = c.req.param();
    
    yield* execute(
      'DELETE FROM user_team_preferences WHERE user_id = ? AND team_number = ?',
      user.id,
      team_number
    );
    
    return { success: true };
  })
));

export default preferences;
