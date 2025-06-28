-- Migration script to enable private channels and membership control
-- Run with: wrangler d1 execute frc7790-com --file=migrations/005_add_private_channels.sql

-- 1) Add a privacy flag to the channels table.
ALTER TABLE channels ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;

-- 2) Create a mapping table that links users to the private channels they have access to.
CREATE TABLE IF NOT EXISTS channel_members (
  channel_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  PRIMARY KEY (channel_id, user_id),
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id    ON channel_members(user_id); 