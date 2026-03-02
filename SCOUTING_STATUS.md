# Scouting App Status (FRC7790)

## Current Status
- Event-first structure implemented (single active event required).
- Admin can start/end event; start triggers TBA sync for teams + matches.
- Scouting writes auto-bind to active event; no event code inputs on pages.
- Archive page exists and is read-only, with event detail counts.
- Fallback metrics implemented: Active event scouting → Archived scouting → Statbotics → None.

## Implemented Features
- Routes: `/dashboard` + `/dashboard/match`, `/dashboard/pit`, `/dashboard/analytics`, `/dashboard/alliances`, `/dashboard/simulations`, `/dashboard/strategy`, `/dashboard/archive`.
- Active event API:
  - `GET /api/scouting/event/active`
  - `POST /api/scouting/event/start`
  - `POST /api/scouting/event/end`
  - `GET /api/scouting/event/archives`
  - `GET /api/scouting/event/archives/:eventCode`
- Scouting APIs:
  - `POST /api/scouting/match`
  - `POST /api/scouting/pit`
  - `POST /api/scouting/drawings`
  - `POST /api/scouting/share`
  - `GET /api/scouting/share/:token`
- Metrics API:
  - `GET /api/scouting/metrics/teams`

## Local Dev Notes
- Frontend: `npm run dev` → http://localhost:7790
- Backend: `npx wrangler pages dev --port 8788`
- Ensure local TBA key exists for start-event sync:
  - `npx wrangler pages secret put TBA_AUTH_KEY --env preview`

## Known Issues
- Local `/chat/notifications/all` can 500 due to missing chat tables in local D1.
- `POST /api/scouting/event/start` fails if TBA key is missing in local Pages env.

## Immediate Goals
1) Add archive drill-down views (teams, matches, scouting entries per event).
2) Use fallback metrics in simulations + alliances views.
3) Add event banner + sync status across scouting pages (not just Dashboard).

## Later Goals
- Strategy canvas UI (replace JSON textarea).
- Analytics visualizations (charts, trends, rankings).
- Alliance selection tooling (picklist, avoid/do-not-pick, recommendations).
- Simulation UI (3v3 selection + win probability).
