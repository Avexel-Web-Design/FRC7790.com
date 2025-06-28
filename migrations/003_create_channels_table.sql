-- Migration script to create channels table
-- Run this with: wrangler d1 execute frc7790-com --file=migrations/003_create_channels_table.sql

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Insert default channels
INSERT INTO channels (id, name) VALUES 
('general', '# general'),
('random', '# random'),
('development', '# development'),
('announcements', '# announcements'); 