export type FavoritePrefs = {
  teams: string[];
  color: string; // hex color like #ff6b00
};

const KEY = 'user_favorites_v1';

const defaultPrefs: FavoritePrefs = {
  teams: [],
  color: '#ffd166', // pleasant amber default
};

export function getFavoritePrefs(): FavoritePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    const parsed = JSON.parse(raw);
    return {
      teams: Array.isArray(parsed?.teams) ? parsed.teams.map(String) : [],
      color: typeof parsed?.color === 'string' ? parsed.color : defaultPrefs.color,
    };
  } catch {
    return defaultPrefs;
  }
}

export function setFavoritePrefs(prefs: FavoritePrefs) {
  localStorage.setItem(KEY, JSON.stringify({
    teams: dedupeTeams(prefs.teams),
    color: prefs.color || defaultPrefs.color,
  }));
}

export function getFavoriteTeams(): string[] {
  return getFavoritePrefs().teams;
}

export function setFavoriteTeams(teams: string[]) {
  const prefs = getFavoritePrefs();
  setFavoritePrefs({ ...prefs, teams: dedupeTeams(teams) });
}

export function getFavoriteColor(): string {
  return getFavoritePrefs().color;
}

export function setFavoriteColor(color: string) {
  const prefs = getFavoritePrefs();
  setFavoritePrefs({ ...prefs, color });
}

export function isFavorite(teamNumber: string | number): boolean {
  const tn = String(teamNumber);
  return getFavoritePrefs().teams.includes(tn);
}

export function parseTeamsInput(input: string): string[] {
  // Accept comma/space separated numbers, strip non-digits except commas/spaces
  return input
    .split(/[^0-9]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => String(parseInt(s, 10)))
    .filter(s => !Number.isNaN(Number(s)));
}

function dedupeTeams(teams: string[]): string[] {
  // Normalize to numeric strings and dedupe
  const norm = teams
    .map(t => String(parseInt(String(t), 10)))
    .filter(t => !Number.isNaN(Number(t)));
  return Array.from(new Set(norm));
}
