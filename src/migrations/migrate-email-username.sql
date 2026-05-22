-- Migration: Update user_account usernames to use email
-- Purpose: Change authentication to use email as username instead of employee_id/custom username

-- Step 1: Update existing admin user account username from 'admin' to email
UPDATE "user_account" 
SET username = (
    SELECT email FROM "employee" 
    WHERE "employee"."employee_id" = "user_account"."employee_id"
)
WHERE username IN ('admin', 'EMP001') 
  AND employee_id IN (
    SELECT employee_id FROM "employee" WHERE email = 'admin@ithelp.com'
  );

-- Step 2: Verify migration (view updated accounts)
SELECT 
  u.user_id,
  u.username,
  e.email,
  e.first_name,
  e.last_name,
  u.created_at
FROM "user_account" u
LEFT JOIN "employee" e ON u.employee_id = e.employee_id
ORDER BY u.created_at DESC;
