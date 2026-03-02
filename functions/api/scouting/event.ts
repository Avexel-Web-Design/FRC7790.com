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

const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface StartBody {
  event_code: string;
}

const event = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();

event.use('*', authMiddleware);

const fetchTba = async <T>(endpoint: string, authKey: string): Promise<T> => {
  const res = await fetch(`${TBA_BASE_URL}${endpoint}`, {
    headers: { 'X-TBA-Auth-Key': authKey }
  });
  if (!res.ok) throw new Error(`TBA error ${res.status}`);
  return res.json() as Promise<T>;
};

event.get('/active', effectHandler((c) =>
  Effect.gen(function* () {
    const active = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeCode = active?.value || null;
    if (!activeCode) return { active_event: null };

    const eventRow = yield* queryOne<Record<string, unknown>>(
      'SELECT event_code, name, start_date, end_date, city, state_prov, country, synced_at FROM scouting_events WHERE event_code = ?',
      activeCode
    );
    return { active_event: eventRow || { event_code: activeCode } };
  })
));

event.post('/start', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }

    const body = yield* parseBody<StartBody>(c);
    if (!body.event_code) {
      return yield* Effect.fail(ValidationError.single('event_code is required'));
    }

    const authKey = c.req.header('X-TBA-Auth-Key') || c.env.TBA_AUTH_KEY || '';
    if (!authKey) {
      return yield* Effect.fail(ValidationError.single('TBA auth key required'));
    }

    const eventCode = body.event_code;

    const eventInfo = yield* Effect.promise(async () =>
      fetchTba<{ key: string; name: string; start_date: string; end_date: string; city?: string; state_prov?: string; country?: string }>(
        `/event/${eventCode}`,
        authKey
      )
    );

    yield* execute(
      `INSERT INTO scouting_events (event_code, name, start_date, end_date, city, state_prov, country, source, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'tba', CURRENT_TIMESTAMP)
       ON CONFLICT(event_code) DO UPDATE SET
         name = excluded.name,
         start_date = excluded.start_date,
         end_date = excluded.end_date,
         city = excluded.city,
         state_prov = excluded.state_prov,
         country = excluded.country,
         source = 'tba',
         synced_at = CURRENT_TIMESTAMP`
      ,
      eventCode,
      eventInfo.name,
      eventInfo.start_date,
      eventInfo.end_date,
      eventInfo.city || null,
      eventInfo.state_prov || null,
      eventInfo.country || null
    );

    yield* execute(
      'INSERT INTO scouting_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP',
      'active_event_code',
      eventCode
    );

    const teams = yield* Effect.promise(async () =>
      fetchTba<Array<{ key: string; team_number: number; nickname?: string }>>(
        `/event/${eventCode}/teams/simple`,
        authKey
      )
    );

    for (const team of teams) {
      yield* execute(
        `INSERT INTO scouting_teams (team_number, nickname, source, synced_at)
         VALUES (?, ?, 'tba', CURRENT_TIMESTAMP)
         ON CONFLICT(team_number) DO UPDATE SET
           nickname = excluded.nickname,
           source = 'tba',
           synced_at = CURRENT_TIMESTAMP`
        ,
        team.team_number,
        team.nickname || null
      );
    }

    const teamRows = yield* query<{ id: number; team_number: number }>(
      'SELECT id, team_number FROM scouting_teams'
    );
    const teamMap = new Map(teamRows.map((t) => [t.team_number, t.id]));

    const eventRow = yield* query<{ id: number }>('SELECT id FROM scouting_events WHERE event_code = ?', eventCode);
    const eventId = eventRow[0]?.id;

    if (eventId) {
      for (const team of teams) {
        const teamId = teamMap.get(team.team_number);
        if (!teamId) continue;
        yield* execute(
          'INSERT OR IGNORE INTO scouting_event_teams (event_id, team_id) VALUES (?, ?)',
          eventId,
          teamId
        );
      }
    }

    const matches = yield* Effect.promise(async () =>
      fetchTba<Array<{
        key: string;
        comp_level: string;
        match_number: number;
        set_number: number;
        alliances: { red: { team_keys: string[] }; blue: { team_keys: string[] } };
        winning_alliance?: string;
        predicted_time?: number;
        actual_time?: number;
      }>>(`/event/${eventCode}/matches`, authKey)
    );

    for (const match of matches) {
      yield* execute(
        `INSERT INTO scouting_matches (
          event_id, match_key, match_type, match_number, set_number, red_teams, blue_teams,
          scheduled_time, actual_time, winning_alliance, source, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'tba', CURRENT_TIMESTAMP)
        ON CONFLICT(match_key) DO UPDATE SET
          match_type = excluded.match_type,
          match_number = excluded.match_number,
          set_number = excluded.set_number,
          red_teams = excluded.red_teams,
          blue_teams = excluded.blue_teams,
          scheduled_time = excluded.scheduled_time,
          actual_time = excluded.actual_time,
          winning_alliance = excluded.winning_alliance,
          source = 'tba',
          synced_at = CURRENT_TIMESTAMP`
        ,
        eventId || null,
        match.key,
        match.comp_level,
        match.match_number,
        match.set_number,
        match.alliances.red.team_keys.join(','),
        match.alliances.blue.team_keys.join(','),
        match.predicted_time || null,
        match.actual_time || null,
        match.winning_alliance || null
      );
    }

    return { message: 'Event started', event_code: eventCode, teams: teams.length, matches: matches.length };
  })
));

event.post('/end', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }

    yield* execute(
      'DELETE FROM scouting_settings WHERE key = ?',
      'active_event_code'
    );

    return { message: 'Event ended' };
  })
));

event.get('/archives', effectHandler((c) =>
  Effect.gen(function* () {
    const rows = yield* query<Record<string, unknown>>(
      'SELECT event_code, name, start_date, end_date, city, state_prov, country, synced_at FROM scouting_events ORDER BY start_date DESC'
    );
    return { events: rows };
  })
));

event.delete('/archives/:eventCode', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }

    const { eventCode } = c.req.param();

    // Get event id for cascade deletes
    const eventRow = yield* queryOne<{ id: number }>('SELECT id FROM scouting_events WHERE event_code = ?', eventCode);
    const eventId = eventRow?.id || null;

    // Delete all related data
    yield* execute('DELETE FROM scouting_match_entries WHERE event_code = ?', eventCode);
    yield* execute('DELETE FROM scouting_pit_entries WHERE event_code = ?', eventCode);
    yield* execute('DELETE FROM scouting_drawings WHERE event_code = ?', eventCode);
    // share_links don't have event_code, skip them
    yield* execute('DELETE FROM scouting_statbotics_cache WHERE event_code = ?', eventCode);
    yield* execute('DELETE FROM scouting_tba_opr_cache WHERE event_code = ?', eventCode);

    if (eventId) {
      yield* execute('DELETE FROM scouting_matches WHERE event_id = ?', eventId);
      yield* execute('DELETE FROM scouting_event_teams WHERE event_id = ?', eventId);
    }

    yield* execute('DELETE FROM scouting_events WHERE event_code = ?', eventCode);

    // Clear active event if this was the active one
    const active = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    if (active?.value === eventCode) {
      yield* execute('DELETE FROM scouting_settings WHERE key = ?', 'active_event_code');
    }

    return { message: 'Event deleted', event_code: eventCode };
  })
));

event.get('/archives/:eventCode', effectHandler((c) =>
  Effect.gen(function* () {
    const { eventCode } = c.req.param();
    const eventRow = yield* queryOne<Record<string, unknown>>(
      'SELECT event_code, name, start_date, end_date, city, state_prov, country, synced_at FROM scouting_events WHERE event_code = ?',
      eventCode
    );

    const eventIdRow = yield* queryOne<{ id: number }>('SELECT id FROM scouting_events WHERE event_code = ?', eventCode);
    const eventId = eventIdRow?.id || null;

    const teamRows = eventId
      ? yield* query<Record<string, unknown>>(
          `SELECT st.team_number, st.nickname
           FROM scouting_event_teams setmap
           JOIN scouting_teams st ON st.id = setmap.team_id
           WHERE setmap.event_id = ?
           ORDER BY st.team_number ASC`,
          eventId
        )
      : [];

    const matchRows = eventId
      ? yield* query<Record<string, unknown>>(
          `SELECT match_key, match_type, match_number, set_number, red_teams, blue_teams
           FROM scouting_matches
           WHERE event_id = ?
           ORDER BY match_type ASC, match_number ASC`,
          eventId
        )
      : [];

    const matchEntries = yield* query<{ count: number }>(
      'SELECT COUNT(*) as count FROM scouting_match_entries WHERE event_code = ?',
      eventCode
    );
    const pitEntries = yield* query<{ count: number }>(
      'SELECT COUNT(*) as count FROM scouting_pit_entries WHERE event_code = ?',
      eventCode
    );
    const drawingEntries = yield* query<{ count: number }>(
      'SELECT COUNT(*) as count FROM scouting_drawings WHERE event_code = ?',
      eventCode
    );

    return {
      event: eventRow || { event_code: eventCode },
      teams: teamRows,
      matches: matchRows,
      counts: {
        match_entries: Number(matchEntries[0]?.count || 0),
        pit_entries: Number(pitEntries[0]?.count || 0),
        drawings: Number(drawingEntries[0]?.count || 0)
      }
    };
  })
));

export default event;
