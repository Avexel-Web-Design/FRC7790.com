import { Hono } from 'hono';
import { Effect } from 'effect';
import { authMiddleware } from '../auth/middleware';
import {
  effectHandler,
  authEffectHandler,
  parseBody,
  type Env,
  query,
  execute,
  ValidationError
} from '../lib/effect-hono';

const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';

interface AuthUser {
  id: number;
  username: string;
  isAdmin: boolean;
}

interface SyncBody {
  event_code: string;
}

const sync = new Hono<{ Bindings: Env; Variables: { user: AuthUser } }>();

sync.use('*', authMiddleware);

const fetchTba = async <T>(endpoint: string, authKey: string): Promise<T> => {
  const res = await fetch(`${TBA_BASE_URL}${endpoint}`, {
    headers: { 'X-TBA-Auth-Key': authKey }
  });
  if (!res.ok) throw new Error(`TBA error ${res.status}`);
  return res.json() as Promise<T>;
};

sync.post('/tba', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }
    const body = yield* parseBody<SyncBody>(c);
    if (!body.event_code) {
      return yield* Effect.fail(ValidationError.single('event_code is required'));
    }

    const authKey = c.req.header('X-TBA-Auth-Key') || c.env.TBA_AUTH_KEY || '';
    if (!authKey) {
      return yield* Effect.fail(ValidationError.single('TBA auth key required'));
    }

    const eventCode = body.event_code;

    const event = yield* Effect.promise(async () =>
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
      event.name,
      event.start_date,
      event.end_date,
      event.city || null,
      event.state_prov || null,
      event.country || null
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

    return { message: 'TBA sync complete', event_code: eventCode, teams: teams.length, matches: matches.length };
  })
));

sync.post('/statbotics', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }
    const body = yield* parseBody<SyncBody>(c);
    if (!body.event_code) {
      return yield* Effect.fail(ValidationError.single('event_code is required'));
    }

    const eventCode = body.event_code;

    const teams = yield* query<{ team_number: number }>(
      `SELECT st.team_number FROM scouting_event_teams setmap
       JOIN scouting_events se ON se.id = setmap.event_id
       JOIN scouting_teams st ON st.id = setmap.team_id
       WHERE se.event_code = ?`,
      eventCode
    );

    const STATBOTICS_BASE = 'https://api.statbotics.io/v3';

    for (const team of teams) {
      const data = yield* Effect.promise(async () => {
        const url = `${STATBOTICS_BASE}/team_event/${team.team_number}/${eventCode}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return res.json() as Promise<{ epa?: { total_points?: { mean?: number }; auto_points?: { mean?: number }; teleop_points?: { mean?: number }; endgame_points?: { mean?: number } } }>;
      });

      if (!data?.epa) continue;
      const epa = data.epa;

      yield* execute(
        `INSERT INTO scouting_statbotics_cache (event_code, team_number, epa_total, epa_auto, epa_teleop, epa_endgame)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(event_code, team_number) DO UPDATE SET
           epa_total = excluded.epa_total,
           epa_auto = excluded.epa_auto,
           epa_teleop = excluded.epa_teleop,
           epa_endgame = excluded.epa_endgame,
           updated_at = CURRENT_TIMESTAMP`
        ,
        eventCode,
        team.team_number,
        epa.total_points?.mean || null,
        epa.auto_points?.mean || null,
        epa.teleop_points?.mean || null,
        epa.endgame_points?.mean || null
      );
    }

    return { message: 'Statbotics sync complete', event_code: eventCode, teams: teams.length };
  })
));

sync.post('/tba-opr', authEffectHandler((c) =>
  Effect.gen(function* () {
    const user = c.get('user');
    if (!user.isAdmin) {
      return yield* Effect.fail(ValidationError.single('Admin required'));
    }
    const body = yield* parseBody<SyncBody>(c);
    if (!body.event_code) {
      return yield* Effect.fail(ValidationError.single('event_code is required'));
    }

    const authKey = c.req.header('X-TBA-Auth-Key') || c.env.TBA_AUTH_KEY || '';
    if (!authKey) {
      return yield* Effect.fail(ValidationError.single('TBA auth key required'));
    }

    const eventCode = body.event_code;
    const opr = yield* Effect.promise(async () =>
      fetchTba<{ oprs?: Record<string, number>; dprs?: Record<string, number>; ccwms?: Record<string, number> }>(
        `/event/${eventCode}/oprs`,
        authKey
      )
    );

    const oprs = opr.oprs || {};
    const dprs = opr.dprs || {};
    const ccwms = opr.ccwms || {};

    for (const key of Object.keys(oprs)) {
      yield* execute(
        `INSERT INTO scouting_tba_opr_cache (event_code, team_key, opr, dpr, ccwm)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(event_code, team_key) DO UPDATE SET
           opr = excluded.opr,
           dpr = excluded.dpr,
           ccwm = excluded.ccwm,
           updated_at = CURRENT_TIMESTAMP`
        ,
        eventCode,
        key,
        oprs[key] || null,
        dprs[key] || null,
        ccwms[key] || null
      );
    }

    return { message: 'TBA OPR sync complete', event_code: eventCode, teams: Object.keys(oprs).length };
  })
));

export default sync;
