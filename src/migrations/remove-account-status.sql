-- Migration: Remove account_status from user_account table
-- The account status is now linked to employee.employment_status

-- Drop the account_status column from user_account table
ALTER TABLE "user_account" DROP COLUMN IF EXISTS "account_status";

-- Note: Login access is now controlled by employee.employment_status
-- When employment_status = true, user can login
-- When employment_status = false, user cannot login
