-- Migration: Change user_account username column to email
-- Description: Rename username column to email and populate from employee table

BEGIN;

-- Step 1: Add new email column temporarily
ALTER TABLE "user_account" 
ADD COLUMN "email_temp" VARCHAR UNIQUE;

-- Step 2: Populate email_temp from employee table
UPDATE "user_account" ua
SET "email_temp" = e."email"
FROM "employee" e
WHERE e."employee_id" = ua."employee_id";

-- Step 3: Drop the old unique constraint on username
ALTER TABLE "user_account" 
DROP CONSTRAINT IF EXISTS "UQ_7234c7c87fb9b3e4c6b4d2f2d5e";

-- Step 4: Drop the username column
ALTER TABLE "user_account" 
DROP COLUMN "username";

-- Step 5: Rename email_temp to email
ALTER TABLE "user_account" 
RENAME COLUMN "email_temp" TO "email";

-- Step 6: Verify the email column has data
-- SELECT user_id, employee_id, email, password_changed FROM "user_account" LIMIT 5;

COMMIT;
