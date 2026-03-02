import { Hono } from 'hono';
import { Effect } from 'effect';
import { authMiddleware } from '../auth/middleware';
import {
  effectHandler,
  authEffectHandler,
  parseBody,
  type Env,
  query,
  queryOne,
  execute,
  ValidationError
} from '../lib/effect-hono';

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface MatchEntryBody {
  event_code?: string;
  match_number: number;
  team_number: number;
  auto_active_fuel?: number;
  auto_climb_l1?: boolean;
  teleop_active_fuel?: number;
  endgame_climb?: string;
  defense_rating?: number;
  general_comments?: string;
}

interface PitEntryBody {
  event_code?: string;
  team_number: number;
  drivetrain?: string;
  weight?: string;
  dimensions?: string;
  active_fuel_capability?: string;
  climb_capability?: string;
  notes?: string;
  image_url?: string;
}

const scouting = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();

scouting.use('*', authMiddleware);

scouting.post('/match', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const body = yield* parseBody<MatchEntryBody>(c);

    const activeSetting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeEvent = activeSetting?.value || null;
    if (!activeEvent) {
      return yield* Effect.fail(ValidationError.single('No active event'));
    }

    if (!body.match_number || !body.team_number) {
      return yield* Effect.fail(ValidationError.single('match_number and team_number are required'));
    }

    yield* execute(
      `INSERT INTO scouting_match_entries (
        event_code, match_number, team_number, scout_id, scout_name,
        auto_active_fuel, auto_climb_l1, teleop_active_fuel, endgame_climb,
        defense_rating, general_comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      activeEvent,
      body.match_number,
      body.team_number,
      user.id,
      user.username,
      body.auto_active_fuel || 0,
      body.auto_climb_l1 ? 1 : 0,
      body.teleop_active_fuel || 0,
      body.endgame_climb || null,
      body.defense_rating || null,
      body.general_comments || null
    );

    return { message: 'Match entry saved' };
  })
));

scouting.post('/pit', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    const body = yield* parseBody<PitEntryBody>(c);

    const activeSetting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeEvent = activeSetting?.value || null;
    if (!activeEvent) {
      return yield* Effect.fail(ValidationError.single('No active event'));
    }

    if (!body.team_number) {
      return yield* Effect.fail(ValidationError.single('team_number is required'));
    }

    yield* execute(
      `INSERT INTO scouting_pit_entries (
        event_code, team_number, scout_id, scout_name,
        drivetrain, weight, dimensions, active_fuel_capability,
        climb_capability, notes, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      activeEvent,
      body.team_number,
      user.id,
      user.username,
      body.drivetrain || null,
      body.weight || null,
      body.dimensions || null,
      body.active_fuel_capability || null,
      body.climb_capability || null,
      body.notes || null,
      body.image_url || null
    );

    return { message: 'Pit entry saved' };
  })
));

scouting.get('/match', effectHandler((c) =>
  Effect.gen(function* () {
    const eventCode = c.req.query('event');
    const matchNumber = c.req.query('match');
    const teamNumber = c.req.query('team');

    const activeSetting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeEvent = activeSetting?.value || null;

    let sql = 'SELECT * FROM scouting_match_entries WHERE 1=1';
    const params: Array<string | number> = [];

    if (eventCode) {
      sql += ' AND event_code = ?';
      params.push(eventCode);
    } else if (activeEvent) {
      sql += ' AND event_code = ?';
      params.push(activeEvent);
    }
    if (matchNumber) {
      sql += ' AND match_number = ?';
      params.push(Number(matchNumber));
    }
    if (teamNumber) {
      sql += ' AND team_number = ?';
      params.push(Number(teamNumber));
    }

    sql += ' ORDER BY created_at DESC';

    const rows = yield* query<Record<string, unknown>>(sql, ...params);
    return rows;
  })
));

scouting.get('/pit', effectHandler((c) =>
  Effect.gen(function* () {
    const eventCode = c.req.query('event');
    const teamNumber = c.req.query('team');

    const activeSetting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeEvent = activeSetting?.value || null;

    let sql = 'SELECT * FROM scouting_pit_entries WHERE 1=1';
    const params: Array<string | number> = [];

    if (eventCode) {
      sql += ' AND event_code = ?';
      params.push(eventCode);
    } else if (activeEvent) {
      sql += ' AND event_code = ?';
      params.push(activeEvent);
    }
    if (teamNumber) {
      sql += ' AND team_number = ?';
      params.push(Number(teamNumber));
    }

    sql += ' ORDER BY created_at DESC';

    const rows = yield* query<Record<string, unknown>>(sql, ...params);
    return rows;
  })
));

scouting.get('/settings', effectHandler((c) =>
  Effect.gen(function* () {
    const setting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'data_source_mode');
    return { data_source_mode: setting?.value || 'scouted_with_statbotics' };
  })
));

scouting.post('/settings', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }
    const body = yield* parseBody<{ data_source_mode?: string }>(c);
    if (!body.data_source_mode) {
      return yield* Effect.fail(ValidationError.single('data_source_mode is required'));
    }
    yield* execute(
      'INSERT INTO scouting_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
      'data_source_mode',
      body.data_source_mode
    );
    return { message: 'Settings updated' };
  })
));

export default scouting;
