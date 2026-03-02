import { Hono } from 'hono';
import { Effect } from 'effect';
import {
  effectHandler,
  type Env,
  query,
  queryOne
} from '../lib/effect-hono';

const metrics = new Hono<{ Bindings: Env }>();

metrics.get('/teams', effectHandler((c) =>
  Effect.gen(function* () {
    const activeSetting = yield* queryOne<{ value: string }>('SELECT value FROM scouting_settings WHERE key = ?', 'active_event_code');
    const activeEvent = activeSetting?.value || null;
    if (!activeEvent) return { teams: [] };

    const eventIdRow = yield* queryOne<{ id: number }>('SELECT id FROM scouting_events WHERE event_code = ?', activeEvent);
    const eventId = eventIdRow?.id || null;
    if (!eventId) return { teams: [] };

    const teams = yield* query<{ team_number: number; nickname?: string }>(
      `SELECT st.team_number, st.nickname
       FROM scouting_event_teams setmap
       JOIN scouting_teams st ON st.id = setmap.team_id
       WHERE setmap.event_id = ?
       ORDER BY st.team_number ASC`,
      eventId
    );

    const results: Array<Record<string, unknown>> = [];

    for (const team of teams) {
      const activeStats = yield* queryOne<Record<string, unknown>>(
        `SELECT
           COUNT(*) as matches,
           AVG(auto_active_fuel) as auto_active_fuel,
           AVG(teleop_active_fuel) as teleop_active_fuel,
           AVG(defense_rating) as defense_rating
         FROM scouting_match_entries
         WHERE event_code = ? AND team_number = ?`,
        activeEvent,
        team.team_number
      );

      const activeMatches = Number((activeStats as any)?.matches || 0);

      if (activeMatches > 0) {
        results.push({
          team_number: team.team_number,
          nickname: team.nickname || null,
          source: 'active',
          stats: activeStats
        });
        continue;
      }

      const archivedEventRow = yield* queryOne<{ event_code: string }>(
        `SELECT event_code FROM scouting_match_entries
         WHERE team_number = ? AND event_code != ?
         ORDER BY created_at DESC
         LIMIT 1`,
        team.team_number,
        activeEvent
      );

      if (archivedEventRow?.event_code) {
        const archivedStats = yield* queryOne<Record<string, unknown>>(
          `SELECT
             COUNT(*) as matches,
             AVG(auto_active_fuel) as auto_active_fuel,
             AVG(teleop_active_fuel) as teleop_active_fuel,
             AVG(defense_rating) as defense_rating
           FROM scouting_match_entries
           WHERE event_code = ? AND team_number = ?`,
          archivedEventRow.event_code,
          team.team_number
        );
        results.push({
          team_number: team.team_number,
          nickname: team.nickname || null,
          source: 'archived',
          archived_event: archivedEventRow.event_code,
          stats: archivedStats
        });
        continue;
      }

      const statbotics = yield* queryOne<Record<string, unknown>>(
        'SELECT epa_total, epa_auto, epa_teleop, epa_endgame FROM scouting_statbotics_cache WHERE event_code = ? AND team_number = ?',
        activeEvent,
        team.team_number
      );

      results.push({
        team_number: team.team_number,
        nickname: team.nickname || null,
        source: statbotics ? 'statbotics' : 'none',
        stats: statbotics || null
      });
    }

    return { event_code: activeEvent, teams: results };
  })
));

export default metrics;
