import { Hono } from 'hono';
import { Effect } from 'effect';
import { authMiddleware } from '../auth/middleware';
import {
  effectHandler,
  authEffectHandler,
  parseBody,
  type Env,
  queryOne,
  execute,
  ValidationError
} from '../lib/effect-hono';

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface ShareBody {
  resource_type: 'drawing';
  resource_id: number;
}

const share = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();

share.post('/', authMiddleware, authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }
    const body = yield* parseBody<ShareBody>(c);
    if (!body.resource_type || !body.resource_id) {
      return yield* Effect.fail(ValidationError.single('resource_type and resource_id are required'));
    }

    const token = crypto.randomUUID().replace(/-/g, '');
    yield* execute(
      'INSERT INTO scouting_share_links (token, resource_type, resource_id, created_by) VALUES (?, ?, ?, ?)',
      token,
      body.resource_type,
      body.resource_id,
      user.id
    );

    return { token };
  })
));

share.get('/:token', effectHandler((c) =>
  Effect.gen(function* () {
    const { token } = c.req.param();
    const row = yield* queryOne<{ resource_type: string; resource_id: number }>(
      'SELECT resource_type, resource_id FROM scouting_share_links WHERE token = ?',
      token
    );
    if (!row) return { error: 'not_found' };

    if (row.resource_type === 'drawing') {
      const drawing = yield* queryOne<Record<string, unknown>>(
        'SELECT id, event_code, match_number, title, data_json, updated_at FROM scouting_drawings WHERE id = ?',
        row.resource_id
      );
      if (!drawing) return { error: 'not_found' };
      return { resource_type: 'drawing', drawing };
    }

    return row;
  })
));

export default share;
