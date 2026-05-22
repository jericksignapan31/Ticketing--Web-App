# Backend Signup Error Troubleshooting

## Current Error
```
Database error: null value in column "employee_id" of relation "employee" violates not-null constraint
```

---

## Root Cause Analysis

The error means **TypeORM is not auto-generating the UUID** for `employee_id`. This happens when:

1. ❌ Entity decorator not working (WRONG APPROACH):
   ```typescript
   // ❌ WRONG - doesn't trigger UUID generation
   const employee = new Employee();
   employee.first_name = 'John';
   ```

2. ✅ Correct approach (CURRENT CODE):
   ```typescript
   // ✅ CORRECT - triggers TypeORM UUID generation
   const employeeRepo = manager.getRepository(Employee);
   const employee = employeeRepo.create({
     first_name: 'John'
   });
   const saved = await employeeRepo.save(employee);
   ```

3. ⚠️ Possible issue: Database table doesn't match entity definition

---

## 🔧 Fix Options

### Option 1: Reset Employee Table (Nuclear Option)
This completely recreates the table with UUID support:

```sql
-- DROP existing table (WARNING: Deletes all employee records!)
DROP TABLE IF EXISTS employee CASCADE;

-- Create fresh employee table with UUID support
CREATE TABLE employee (
  employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID,
  department_id UUID,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  middle_name VARCHAR,
  email VARCHAR NOT NULL UNIQUE,
  role VARCHAR NOT NULL DEFAULT 'EMPLOYEE',
  position VARCHAR,
  contact_number VARCHAR,
  employment_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branch(branch_id),
  FOREIGN KEY (department_id) REFERENCES department(department_id)
);

CREATE INDEX idx_employee_email ON employee(email);
```

**When to use:** If employee table has wrong schema or old structure

---

### Option 2: Verify Current Schema (Recommended First)
Check what the actual table structure is:

```sql
-- View employee table structure
\d employee

-- Or detailed view:
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'employee'
ORDER BY ordinal_position;
```

**Expected output:**
```
column_name    | data_type | is_nullable | column_default
---
employee_id    | uuid      | NO          | gen_random_uuid()
first_name     | text      | NO          | NULL
last_name      | text      | NO          | NULL
email          | text      | NO          | NULL
...
```

If `employee_id` doesn't have `gen_random_uuid()` as default, run Option 1.

---

### Option 3: Add UUID Default to Existing Column
If table exists but column default is missing:

```sql
-- Add default if column exists
ALTER TABLE employee 
ALTER COLUMN employee_id SET DEFAULT gen_random_uuid();

-- Verify it was set
\d employee
```

---

## ✅ Verification Steps

### Step 1: Check Entity Definition
File: `src/entities/employee.entity.ts`

```typescript
@Entity('employee')
export class Employee {
  @PrimaryGeneratedColumn('uuid')  // ← MUST have this
  employee_id!: string;
  // ... rest of columns
}
```

✅ Should have `@PrimaryGeneratedColumn('uuid')`

### Step 2: Check Database Default
Run in Supabase:
```sql
SELECT column_default FROM information_schema.columns
WHERE table_name='employee' AND column_name='employee_id';
```

✅ Should show: `gen_random_uuid()`

### Step 3: Test Signup with Logging
The code already has console logs:

```typescript
console.log('✅ Employee created:', {
  employee_id: savedEmployee.employee_id,  // Should NOT be null
  email: savedEmployee.email,
});
```

**Look for in Render logs:**
- `📝 Signup request received` ← Signup started
- `✅ Employee created:` → Check employee_id value
  - If `employee_id: null` → UUID generation failed
  - If `employee_id: "550e8400..."` → Success ✅

---

## 🔍 How to Check Render Logs

1. Go to https://dashboard.render.com
2. Select your backend service
3. Click "Logs" tab
4. Search for "Signup request" or error messages
5. Look for employee_id value in the "Employee created" log

---

## Database Reset Steps (Full Recovery)

If table needs complete reset:

```sql
-- 1. Drop dependent tables first
DROP TABLE IF EXISTS user_account CASCADE;

-- 2. Drop employee table
DROP TABLE IF EXISTS employee CASCADE;

-- 3. Recreate with correct schema
CREATE TABLE employee (
  employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branch(branch_id),
  department_id UUID REFERENCES department(department_id),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
  position VARCHAR(255),
  contact_number VARCHAR(20),
  employment_status BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Recreate user_account table
CREATE TABLE user_account (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES employee(employee_id),
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  password_changed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes
CREATE INDEX idx_employee_email ON employee(email);
CREATE INDEX idx_user_account_username ON user_account(username);
```

---

## 📊 Quick Diagnosis

Run this query to see what's currently in the database:

```sql
-- Check employee table structure
SELECT 
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'employee'
ORDER BY ordinal_position;

-- Check if any employees exist
SELECT COUNT(*) as total_employees,
       COUNT(CASE WHEN employee_id IS NULL THEN 1 END) as null_ids
FROM employee;

-- Check user_account table structure
SELECT 
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_account'
ORDER BY ordinal_position;
```

---

## Next Steps

1. **Run verification query** above to see current database state
2. **Check Render logs** to see if employee_id is actually null or if there's another error
3. **If employee_id IS null:** Run Option 1 (reset table) or Option 3 (add default)
4. **If database looks correct:** Check that TypeORM entity definitions match
5. **Try signup again** after fix

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| employee_id NULL | Database default missing | Run Option 3 (add default) |
| employee_id NULL | TypeORM using wrong approach | Already fixed in code |
| Email duplicate | User signed up twice | Clear employee table or ask user to use different email |
| Branch/Dept not found | Invalid UUID | Verify branch/department IDs exist |
| Password hash failing | bcrypt error | Check SecurityConfig.password.saltRounds |

