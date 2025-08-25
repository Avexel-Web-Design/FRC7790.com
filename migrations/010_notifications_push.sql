-- Add tables for per-channel/DM notification preferences and device tokens
-- Run with:
-- wrangler d1 execute frc7790-com --file=migrations/010_notifications_push.sql

-- Per-channel/DM mute settings
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id INTEGER NOT NULL,
  channel_id TEXT NOT NULL,
  muted INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, channel_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Device tokens for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL, -- 'android' | 'ios' | 'web'
  token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, token),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(token);