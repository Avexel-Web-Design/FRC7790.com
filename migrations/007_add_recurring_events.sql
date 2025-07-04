-- Add recurring events functionality
-- Run this with: wrangler d1 execute frc7790-com --file=migrations/007_add_recurring_events.sql

-- Add columns for recurring events to calendar_events table
ALTER TABLE calendar_events ADD COLUMN is_recurring INTEGER DEFAULT 0;
ALTER TABLE calendar_events ADD COLUMN recurrence_type TEXT; -- 'daily', 'weekly', 'monthly', 'yearly', 'custom'
ALTER TABLE calendar_events ADD COLUMN recurrence_interval INTEGER DEFAULT 1; -- every X days/weeks/months/years
ALTER TABLE calendar_events ADD COLUMN recurrence_days_of_week TEXT; -- JSON array: ["monday", "tuesday", etc] for weekly
ALTER TABLE calendar_events ADD COLUMN recurrence_day_of_month INTEGER; -- for monthly: specific day (1-31)
ALTER TABLE calendar_events ADD COLUMN recurrence_week_of_month INTEGER; -- for monthly: 1st, 2nd, 3rd, 4th, -1 (last)
ALTER TABLE calendar_events ADD COLUMN recurrence_day_of_week TEXT; -- for monthly: "monday", "tuesday", etc
ALTER TABLE calendar_events ADD COLUMN recurrence_months TEXT; -- JSON array: [1,2,3] for yearly custom months
ALTER TABLE calendar_events ADD COLUMN recurrence_end_type TEXT; -- 'never', 'after_occurrences', 'end_date'
ALTER TABLE calendar_events ADD COLUMN recurrence_end_date TEXT; -- YYYY-MM-DD format
ALTER TABLE calendar_events ADD COLUMN recurrence_occurrences INTEGER; -- number of occurrences
ALTER TABLE calendar_events ADD COLUMN parent_event_id INTEGER; -- NULL for parent, ID for generated instances
ALTER TABLE calendar_events ADD COLUMN recurrence_exceptions TEXT; -- JSON array of dates to skip: ["2025-07-15", "2025-07-22"]
ALTER TABLE calendar_events ADD COLUMN recurrence_end_time TEXT; -- HH:MM format for duration calculation

-- Create indexes for better performance
CREATE INDEX idx_calendar_events_recurring ON calendar_events(is_recurring);
CREATE INDEX idx_calendar_events_parent ON calendar_events(parent_event_id);
CREATE INDEX idx_calendar_events_recurrence_type ON calendar_events(recurrence_type);
