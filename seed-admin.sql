-- Create Default Admin Account
-- Run this SQL in your database (local PostgreSQL or Supabase)

-- 1. Create a default branch
INSERT INTO "branch" (branch_name, location, contact_number)
VALUES ('Main Office', 'Head Office', '+63-123-4567')
ON CONFLICT DO NOTHING;

-- 2. Create a default department
INSERT INTO "department" (department_name, description)
VALUES ('IT Department', 'Information Technology')
ON CONFLICT DO NOTHING;

-- 3. Create admin employee
INSERT INTO "employee" (
    first_name, 
    last_name, 
    email, 
    phone_number, 
    position, 
    branch_id, 
    department_id,
    hire_date,
    is_active
)
VALUES (
    'Admin',
    'User',
    'admin@ithelp.com',
    '+63-999-999-9999',
    'System Administrator',
    (SELECT branch_id FROM "branch" WHERE branch_name = 'Main Office' LIMIT 1),
    (SELECT department_id FROM "department" WHERE department_name = 'IT Department' LIMIT 1),
    CURRENT_DATE,
    true
)
ON CONFLICT (email) DO NOTHING;

-- 4. Create admin user account
-- Password: admin123 (bcrypt hash)
INSERT INTO "user_account" (
    employee_id,
    username,
    password_hash,
    role,
    is_active
)
VALUES (
    (SELECT employee_id FROM "employee" WHERE email = 'admin@ithelp.com' LIMIT 1),
    'admin',
    '$2b$10$rQW5Y5Y5Y5Y5Y5Y5Y5Y5Y.5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5',  -- This will be replaced by the app
    'admin',
    true
)
ON CONFLICT (username) DO NOTHING;

-- Display created accounts
SELECT 
    u.username,
    u.role,
    e.first_name,
    e.last_name,
    e.email,
    'Password: admin123' as note
FROM "user_account" u
JOIN "employee" e ON u.employee_id = e.employee_id
WHERE u.username = 'admin';
