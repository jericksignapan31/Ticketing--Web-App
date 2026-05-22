-- Admin User Account Setup
-- Run this on Supabase SQL Editor to create admin user account

-- Step 1: Check if admin user account already exists
SELECT COUNT(*) as count FROM "user_account" WHERE employee_id = 'EMP001';

-- Step 2: If count is 0, run this INSERT:
-- Password hash for "admin123": $2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W

INSERT INTO "user_account" (user_id, employee_id, username, password, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'EMP001',
    'admin@ithelp.com',
    '$2b$10$N3BriWpximX09H/awlnR2OEJucuxUSwojj0gc5VreU31IL7yIjG.W',
    NOW(),
    NOW()
  )
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  updated_at = NOW();

-- Step 3: Verify admin account
SELECT u.user_id, u.username, u.employee_id, e.email, e.employment_status
FROM "user_account" u
LEFT JOIN "employee" e ON u.employee_id = e.employee_id
WHERE u.username = 'admin@ithelp.com';
