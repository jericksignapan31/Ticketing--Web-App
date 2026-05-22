-- Migration: Add password_changed column to user_account table
-- Purpose: Track if user has changed their temporary password after first login

-- Add column
ALTER TABLE "user_account" 
ADD COLUMN "password_changed" boolean NOT NULL DEFAULT false;

-- Verify migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_account' AND column_name = 'password_changed';
