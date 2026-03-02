-- Scouting app core tables (2026 REBUILT)

CREATE TABLE IF NOT EXISTS scouting_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_code TEXT NOT NULL UNIQUE,
  name TEXT,
  start_date TEXT,
  end_date TEXT,
  city TEXT,
  state_prov TEXT,
  country TEXT,
  source TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS scouting_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_number INTEGER NOT NULL UNIQUE,
  nickname TEXT,
  source TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS scouting_event_teams (
  event_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  PRIMARY KEY (event_id, team_id)
);

CREATE TABLE IF NOT EXISTS scouting_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  match_key TEXT UNIQUE,
  match_type TEXT,
  match_number INTEGER,
  set_number INTEGER,
  red_teams TEXT,
  blue_teams TEXT,
  scheduled_time INTEGER,
  actual_time INTEGER,
  winning_alliance TEXT,
  source TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS scouting_match_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_code TEXT,
  match_number INTEGER NOT NULL,
  team_number INTEGER NOT NULL,
  scout_id INTEGER,
  scout_name TEXT,
  auto_active_fuel INTEGER DEFAULT 0,
  auto_climb_l1 INTEGER DEFAULT 0,
  teleop_active_fuel INTEGER DEFAULT 0,
  endgame_climb TEXT,
  defense_rating INTEGER,
  general_comments TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_scouting_match_entries_updated
AFTER UPDATE ON scouting_match_entries
FOR EACH ROW
BEGIN
  UPDATE scouting_match_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS scouting_pit_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_code TEXT,
  team_number INTEGER NOT NULL,
  scout_id INTEGER,
  scout_name TEXT,
  drivetrain TEXT,
  weight TEXT,
  dimensions TEXT,
  active_fuel_capability TEXT,
  climb_capability TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_scouting_pit_entries_updated
AFTER UPDATE ON scouting_pit_entries
FOR EACH ROW
BEGIN
  UPDATE scouting_pit_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS scouting_drawings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_code TEXT,
  match_number INTEGER,
  title TEXT,
  data_json TEXT NOT NULL,
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_scouting_drawings_updated
AFTER UPDATE ON scouting_drawings
FOR EACH ROW
BEGIN
  UPDATE scouting_drawings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TABLE IF NOT EXISTS scouting_share_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  resource_type TEXT NOT NULL,
  resource_id INTEGER NOT NULL,
  created_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scouting_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scouting_statbotics_cache (
  event_code TEXT NOT NULL,
  team_number INTEGER NOT NULL,
  epa_total REAL,
  epa_auto REAL,
  epa_teleop REAL,
  epa_endgame REAL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_code, team_number)
);

CREATE TABLE IF NOT EXISTS scouting_tba_opr_cache (
  event_code TEXT NOT NULL,
  team_key TEXT NOT NULL,
  opr REAL,
  dpr REAL,
  ccwm REAL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_code, team_key)
);

CREATE INDEX IF NOT EXISTS idx_scouting_match_entries_event_team ON scouting_match_entries (event_code, team_number);
CREATE INDEX IF NOT EXISTS idx_scouting_pit_entries_event_team ON scouting_pit_entries (event_code, team_number);
CREATE INDEX IF NOT EXISTS idx_scouting_drawings_event_match ON scouting_drawings (event_code, match_number);
