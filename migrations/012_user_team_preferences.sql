-- Per-user, per-team notification preferences and highlight color
CREATE TABLE IF NOT EXISTS user_team_preferences (
  user_id INTEGER NOT NULL,
  team_number TEXT NOT NULL,
  highlight_color TEXT DEFAULT '#ffd166',
  notif_upcoming INTEGER NOT NULL DEFAULT 1, -- next match (3 prior played)
  notif_alliance INTEGER NOT NULL DEFAULT 1,
  notif_results INTEGER NOT NULL DEFAULT 1,
  notif_awards INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, team_number)
);

-- Trigger to auto-update updated_at
CREATE TRIGGER IF NOT EXISTS trg_user_team_preferences_updated
AFTER UPDATE ON user_team_preferences
FOR EACH ROW
BEGIN
  UPDATE user_team_preferences SET updated_at = CURRENT_TIMESTAMP
  WHERE user_id = OLD.user_id AND team_number = OLD.team_number;
END;
