import { STATBOTICS_CONFIG } from '../config';

const BASE = STATBOTICS_CONFIG.BASE_URL;

export interface StatEvent {
  key: string;
  name: string;
  start_date: string;
  city?: string;
  state?: string;
  country?: string;
  team_count?: number;
}

export interface StatTeam {
  team: number;
  nickname: string;
  epa_auto: number;
  epa_teleop: number;
  epa_endgame: number;
  epa: number; // total
  opr: number;
  dpr: number;
  ccwm: number;
}

async function fetchFromStatbotics<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`Statbotics error ${res.status}`);
  }
  return res.json();
}

export async function fetchEvent(eventCode: string): Promise<StatEvent> {
  return fetchFromStatbotics(`/event/${eventCode}`);
}

interface StatboticsTeamEvent {
  team: number;
  team_name?: string;
  nickname?: string;
  epa?: {
    total_points?: number | { mean?: number };
    breakdown?: {
      auto_points?: number;
      teleop_points?: number;
      endgame_points?: number;
    };
  };
}

export async function fetchEventTeams(eventCode: string): Promise<StatTeam[]> {
  const data = await fetchFromStatbotics<StatboticsTeamEvent[]>(
    `/team_events?event=${eventCode}&limit=100`
  );
    return data.map((t) => {
    const epaObj = t.epa || {};
    const total = typeof epaObj.total_points === 'number' ? epaObj.total_points : (epaObj.total_points as { mean?: number } | undefined)?.mean ?? 0;
    const breakdown = epaObj.breakdown || {};
    return {
      team: t.team,
      nickname: t.team_name || t.nickname || '',
      epa_auto: breakdown.auto_points ?? 0,
      epa_teleop: breakdown.teleop_points ?? 0,
      epa_endgame: breakdown.endgame_points ?? 0,
      epa: total,
      opr: 0,
      dpr: 0,
      ccwm: 0,
    } as StatTeam;
  });
}
