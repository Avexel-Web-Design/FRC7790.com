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

interface DrawingBody {
  event_code?: string;
  match_number?: number;
  title?: string;
  data_json: string;
}

const drawings = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();

drawings.use('*', authMiddleware);

drawings.post('/', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }
    const body = yield* parseBody<DrawingBody>(c);
    if (!body.data_json) {
      return yield* Effect.fail(ValidationError.single('data_json is required'));
    }
    const activeSetting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeEvent = activeSetting?.value || null;
    if (!activeEvent) {
      return yield* Effect.fail(ValidationError.single('No active event'));
    }
    const result = yield* execute(
      `INSERT INTO scouting_drawings (event_code, match_number, title, data_json, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`
      ,
      activeEvent,
      body.match_number || null,
      body.title || null,
      body.data_json,
      user.id,
      user.id
    );
    return { message: 'Drawing saved', id: result.lastRowId };
  })
));

drawings.put('/:id', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }
    const { id } = c.req.param();
    const body = yield* parseBody<DrawingBody>(c);
    if (!body.data_json) {
      return yield* Effect.fail(ValidationError.single('data_json is required'));
    }
    const activeSetting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeEvent = activeSetting?.value || null;
    if (!activeEvent) {
      return yield* Effect.fail(ValidationError.single('No active event'));
    }
    yield* execute(
      `UPDATE scouting_drawings
       SET event_code = ?, match_number = ?, title = ?, data_json = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
      ,
      activeEvent,
      body.match_number || null,
      body.title || null,
      body.data_json,
      user.id,
      Number(id)
    );
    return { message: 'Drawing updated' };
  })
));

drawings.get('/', effectHandler((c) =>
  Effect.gen(function* () {
    const eventCode = c.req.query('event');
    const matchNumber = c.req.query('match');
    let sql = 'SELECT * FROM scouting_drawings WHERE 1=1';
    const params: Array<string | number> = [];
    if (eventCode) {
      sql += ' AND event_code = ?';
      params.push(eventCode);
    }
    if (matchNumber) {
      sql += ' AND match_number = ?';
      params.push(Number(matchNumber));
    }
    sql += ' ORDER BY updated_at DESC';
    return yield* query<Record<string, unknown>>(sql, ...params);
  })
));

drawings.get('/:id', effectHandler((c) =>
  Effect.gen(function* () {
    const { id } = c.req.param();
    const row = yield* queryOne<Record<string, unknown>>('SELECT * FROM scouting_drawings WHERE id = ?', Number(id));
    return row || { error: 'not_found' };
  })
));

export default drawings;
