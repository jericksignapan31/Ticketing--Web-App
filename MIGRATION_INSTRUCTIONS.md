# 🔧 Database Migration Instructions

## Add `password_changed` Column to `user_account` Table

### 🚨 Current Issue
- Frontend signup returns: **500 Internal Server Error**
- Reason: Backend entity expects `password_changed` column, but database table doesn't have it yet
- Solution: Run this migration on Supabase

---

## ✅ How to Execute Migration

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: **IT Help Desk** (aws-1-ap-southeast-1)
3. Click **SQL Editor** in left sidebar

### Step 2: Create New Query
1. Click **New Query** button
2. Name it: `Add password_changed column`
3. Paste this SQL:

```sql
-- Add password_changed column to user_account table
ALTER TABLE "user_account" 
ADD COLUMN "password_changed" boolean NOT NULL DEFAULT false;
```

### Step 3: Execute Query
1. Click **Run** button (or Ctrl+Enter)
2. Wait for success message: "Success. No rows returned"

### Step 4: Verify Migration (Optional)
Run this query to confirm the column was added:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_account' 
ORDER BY ordinal_position;
```

Should show new column:
- `column_name`: password_changed
- `data_type`: boolean
- `is_nullable`: false
- `column_default`: false

---

## 🔄 After Migration

1. ✅ Column will exist in database
2. ✅ Backend signup endpoint will work
3. ✅ New users can register with auto-generated 6-digit temporary password
4. ✅ `password_changed` flag will be tracked for password change requirement

---

## 📝 Migration Details

| Property | Value |
|----------|-------|
| Table | user_account |
| Column Name | password_changed |
| Data Type | boolean |
| Nullable | No (NOT NULL) |
| Default Value | false |
| Purpose | Track if user has changed temporary password after first login |

---

## ✨ What Happens After Migration

### Signup Flow
```
User signs up
  ↓
Backend creates UserAccount with password_changed = false (default)
  ↓
Response: { temporaryPassword: "482917", email: "user@example.com" }
  ↓
Frontend displays temp password ✅
```

### Login Flow
```
User logs in with temp password
  ↓
Backend returns: { user: { password_changed: false } }
  ↓
Frontend redirects to /change-password page
  ↓
User changes password
  ↓
Backend sets password_changed = true
  ↓
Next login returns: { user: { password_changed: true } }
  ↓
Frontend allows access to dashboard ✅
```

---

## 🆘 Troubleshooting

### Error: "Column already exists"
- Migration already ran ✅
- You can safely try again (it will just show this error)
- Verify with the SELECT query above

### Error: "Relation 'user_account' does not exist"
- Table name might be different
- Run this to find correct table name:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Error: "Permission denied"
- Make sure you're logged in as database admin
- Check Supabase project settings → Database → Users

---

## 🚀 Once Migration is Done

1. The signup endpoint will work
2. All new registrations will have `password_changed = false`
3. Frontend must check this flag after login
4. Frontend must redirect to /change-password if `password_changed` is false

**Result: 500 error will be resolved ✅**
