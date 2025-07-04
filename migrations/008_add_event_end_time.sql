-- Add event_end_time column for general event end times
-- Run this with: wrangler d1 execute frc7790-com --file=migrations/008_add_event_end_time.sql

-- Add event_end_time column for storing event end times
ALTER TABLE calendar_events ADD COLUMN event_end_time TEXT; -- HH:MM format for event end time
