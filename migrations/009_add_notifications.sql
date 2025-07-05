-- Migration script to add notification system for unread messages
-- Run with: wrangler d1 execute frc7790-com --file=migrations/009_add_notifications.sql

-- Table to track user's last read timestamp per channel/DM/group
CREATE TABLE IF NOT EXISTS user_read_status (
  user_id INTEGER NOT NULL,
  channel_id TEXT NOT NULL,
  last_read_timestamp TEXT NOT NULL,
  PRIMARY KEY (user_id, channel_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_read_status_user_id ON user_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_read_status_channel_id ON user_read_status(channel_id);
