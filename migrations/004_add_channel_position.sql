-- Migration script to add position field to channels table
-- Run this with: wrangler d1 execute frc7790-com --file=migrations/004_add_channel_position.sql

-- Add position column to channels table
ALTER TABLE channels ADD COLUMN position INTEGER DEFAULT 0;

-- Update position for existing channels
UPDATE channels SET position = 1 WHERE id = 'general';
UPDATE channels SET position = 2 WHERE id = 'random';
UPDATE channels SET position = 3 WHERE id = 'development';
UPDATE channels SET position = 4 WHERE id = 'announcements';

-- Create index for faster ordering
CREATE INDEX idx_channels_position ON channels(position); 