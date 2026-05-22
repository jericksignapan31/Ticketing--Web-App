-- Database Cleanup & Reset
-- This script will:
-- 1. Delete all existing data
-- 2. Create one admin user for testing
-- 3. No branch/department associations

-- ==========================================
-- STEP 1: Delete all user_account records
-- ==========================================
DELETE FROM user_account;

-- ==========================================
-- STEP 2: Delete all employee records
-- ==========================================
DELETE FROM employee;

-- ==========================================
-- STEP 3: Create one admin user (no branch/dept)
-- ==========================================
INSERT INTO employee (
  employee_id,
  first_name,
  last_name,
  email,
  role,
  employment_status,
  branch_id,
  department_id,
  position,
  contact_number
) VALUES (
  gen_random_uuid(),
  'Admin',
  'User',
  'admin@example.com',
  'ADMIN',
  true,
  NULL,
  NULL,
  'Administrator',
  '09000000000'
);

-- ==========================================
-- STEP 4: Get the admin employee_id (for reference)
-- ==========================================
-- This will show you the admin's ID
SELECT employee_id, email FROM employee WHERE email = 'admin@example.com';

-- ==========================================
-- STEP 5: Create user_account for admin
-- ==========================================
-- Note: Replace 'ADMIN_EMPLOYEE_ID' with the actual UUID from step 4
-- Password: admin123 (hashed with bcrypt)
-- You can use online bcrypt generator or get from running signup

INSERT INTO user_account (
  user_id,
  employee_id,
  username,
  password,
  password_changed
) VALUES (
  gen_random_uuid(),
  (SELECT employee_id FROM employee WHERE email = 'admin@example.com'),
  'admin@example.com',
  '$2b$10$YFz5A4V6nWZqDsqJuXmrTe2N9d7Ri.XqLMqKh7nMBvEo7q1vl0b46',
  true
);

-- ==========================================
-- VERIFICATION: Check the result
-- ==========================================
SELECT 
  e.employee_id,
  e.email,
  e.role,
  e.employment_status,
  ua.username,
  ua.password_changed
FROM employee e
LEFT JOIN user_account ua ON e.employee_id = ua.employee_id;
