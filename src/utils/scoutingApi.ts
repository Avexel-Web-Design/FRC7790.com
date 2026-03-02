import { frcAPI } from './frcAPI';

export interface MatchEntryPayload {
  match_number: number;
  team_number: number;
  auto_active_fuel?: number;
  auto_climb_l1?: boolean;
  teleop_active_fuel?: number;
  endgame_climb?: string;
  defense_rating?: number;
  general_comments?: string;
}

export interface PitEntryPayload {
  team_number: number;
  drivetrain?: string;
  weight?: string;
  dimensions?: string;
  active_fuel_capability?: string;
  climb_capability?: string;
  notes?: string;
  image_url?: string;
}

export async function submitMatchEntry(payload: MatchEntryPayload): Promise<void> {
  const res = await frcAPI.post('/scouting/match', payload);
  if (!res.ok) throw new Error('Failed to save match entry');
}

export async function submitPitEntry(payload: PitEntryPayload): Promise<void> {
  const res = await frcAPI.post('/scouting/pit', payload);
  if (!res.ok) throw new Error('Failed to save pit entry');
}

export async function uploadPitImage(file: File): Promise<string> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/scouting/uploads/pit-image', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  if (!res.ok) throw new Error('Failed to upload image');
  const data = await res.json();
  return data.url as string;
}

export async function fetchScoutingSettings(): Promise<{ data_source_mode: string } | null> {
  const res = await frcAPI.get('/scouting/settings');
  if (!res.ok) return null;
  return res.json();
}

export async function updateScoutingSettings(data_source_mode: string): Promise<void> {
  const res = await frcAPI.post('/scouting/settings', { data_source_mode });
  if (!res.ok) throw new Error('Failed to update settings');
}

export async function syncTba(event_code: string): Promise<void> {
  const res = await frcAPI.post('/scouting/sync/tba', { event_code });
  if (!res.ok) throw new Error('TBA sync failed');
}

export async function syncStatbotics(event_code: string): Promise<void> {
  const res = await frcAPI.post('/scouting/sync/statbotics', { event_code });
  if (!res.ok) throw new Error('Statbotics sync failed');
}

export async function syncTbaOpr(event_code: string): Promise<void> {
  const res = await frcAPI.post('/scouting/sync/tba-opr', { event_code });
  if (!res.ok) throw new Error('TBA OPR sync failed');
}

export async function fetchActiveEvent(): Promise<{ active_event: unknown } | null> {
  const res = await frcAPI.get('/scouting/event/active');
  if (!res.ok) return null;
  return res.json();
}

export async function startEvent(event_code: string): Promise<void> {
  const res = await frcAPI.post('/scouting/event/start', { event_code });
  if (!res.ok) throw new Error('Failed to start event');
}

export async function endEvent(): Promise<void> {
  const res = await frcAPI.post('/scouting/event/end', {});
  if (!res.ok) throw new Error('Failed to end event');
}

export async function fetchArchives(): Promise<{ events: unknown[] } | null> {
  const res = await frcAPI.get('/scouting/event/archives');
  if (!res.ok) return null;
  return res.json();
}

export async function fetchArchiveDetail(eventCode: string): Promise<unknown | null> {
  const res = await frcAPI.get(`/scouting/event/archives/${eventCode}`);
  if (!res.ok) return null;
  return res.json();
}

export async function deleteArchivedEvent(eventCode: string): Promise<void> {
  const res = await frcAPI.delete(`/scouting/event/archives/${eventCode}`);
  if (!res.ok) throw new Error('Failed to delete event');
}

export async function fetchTeamMetrics(): Promise<unknown | null> {
  const res = await frcAPI.get('/scouting/metrics/teams');
  if (!res.ok) return null;
  return res.json();
}

export interface EventTeam {
  team_number: number;
  nickname: string | null;
}

export interface EventMatch {
  match_key: string;
  match_type: string;
  match_number: number;
  set_number: number;
  red_teams: string;
  blue_teams: string;
  scheduled_time: number | null;
  actual_time: number | null;
  winning_alliance: string | null;
}

export async function fetchEventTeams(): Promise<EventTeam[]> {
  const res = await frcAPI.get('/scouting/event/teams');
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.teams as EventTeam[]) || [];
}

export async function fetchEventMatches(): Promise<EventMatch[]> {
  const res = await frcAPI.get('/scouting/event/matches');
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.matches as EventMatch[]) || [];
}

export async function fetchEventRankings(): Promise<unknown[]> {
  const res = await frcAPI.get('/scouting/event/rankings');
  if (!res.ok) return [];
  const data = await res.json();
  return (data?.rankings as unknown[]) || [];
}
