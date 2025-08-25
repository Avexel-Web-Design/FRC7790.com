-- Add user_type column to users table to distinguish members vs public
-- Existing users default to 'member'
ALTER TABLE users ADD COLUMN user_type TEXT NOT NULL DEFAULT 'member';

-- Optional: backfill nulls just in case (older SQLite versions may set default but be safe)
UPDATE users SET user_type = 'member' WHERE user_type IS NULL;
