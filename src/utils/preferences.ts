import { frcAPI } from './frcAPI';

export type TeamPreference = {
  team_number: string;
  highlight_color: string;
  notif_upcoming: number; // 0/1 from server
  notif_alliance: number;
  notif_results: number;
  notif_awards: number;
};

export async function fetchTeamPreferences(): Promise<TeamPreference[]> {
  const res = await frcAPI.get('/preferences/teams');
  if (!res.ok) throw new Error('Failed to load team preferences');
  const data = await res.json();
  return (data.teams || []) as TeamPreference[];
}

export async function upsertTeamPreference(p: {
  team_number: string | number;
  highlight_color: string;
  notif_upcoming: boolean;
  notif_alliance: boolean;
  notif_results: boolean;
  notif_awards: boolean;
}): Promise<void> {
  const payload = {
    team_number: String(p.team_number),
    highlight_color: p.highlight_color,
    notif_upcoming: !!p.notif_upcoming,
    notif_alliance: !!p.notif_alliance,
    notif_results: !!p.notif_results,
    notif_awards: !!p.notif_awards,
  };
  const res = await frcAPI.post('/preferences/teams', payload);
  if (!res.ok) throw new Error('Failed to save team preference');
}

export async function deleteTeamPreference(team_number: string | number): Promise<void> {
  const res = await frcAPI.delete(`/preferences/teams/${team_number}`);
  if (!res.ok) throw new Error('Failed to delete team preference');
}
