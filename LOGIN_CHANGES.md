# Login System Changes Documentation

## Overview
Updated the login system from using `username` to `email` for user authentication across the entire application.

---

## 🔄 Changes Made

### 1. **Backend API - Login Endpoint**

#### Before:
```json
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

#### After:
```json
POST /auth/login
{
  "email": "admin@ithelp.com",
  "password": "admin123"
}
```

---

### 2. **Database Schema Changes**

#### user_account Table:
- **Removed**: `username` column (VARCHAR, UNIQUE)
- **Added**: `email` column (VARCHAR, UNIQUE)
- **Migration**: All existing users migrated to use their employee email

#### Migrated Users:
| Old Username | New Email |
|---|---|
| admin | admin@ithelp.com |
| juan.dela.cruz | juan.delacruz@company.com |

---

### 3. **Entity Changes**

#### UserAccount Entity
**File**: `src/entities/user-account.entity.ts`

```typescript
// BEFORE
@Column({ unique: true })
username!: string;

// AFTER
@Column({ unique: true })
email!: string;
```

---

### 4. **Service Layer Updates**

#### Auth Service (`src/auth/auth.service.ts`)

**Login Method - Before:**
```typescript
async login(loginDto: LoginDto) {
  const { username, password } = loginDto;
  const user = await this.userAccountRepository.findOne({
    where: { username },
    relations: ['employee', 'employee.branch'],
  });
  // ...
}
```

**Login Method - After:**
```typescript
async login(loginDto: LoginDto) {
  const { email, password } = loginDto;
  const user = await this.userAccountRepository
    .createQueryBuilder('ua')
    .leftJoinAndSelect('ua.employee', 'emp')
    .leftJoinAndSelect('emp.branch', 'branch')
    .where('emp.email = :email', { email })
    .getOne();
  // ...
}
```

#### Employee Service (`src/employee/employee.service.ts`)

**Before:**
```typescript
const username = `${createEmployeeDto.first_name}.${createEmployeeDto.last_name}`.toLowerCase();
const existingUsername = await this.userAccountRepository.findOne({
  where: { username },
});
// ...
userAccount.username = username;
```

**After:**
```typescript
const existingUserAccount = await this.userAccountRepository.findOne({
  where: { email: createEmployeeDto.email },
});
// ...
userAccount.email = savedEmployee.email;
```

#### User Account Service (`src/user-account/user-account.service.ts`)

**Method Renames:**
- `findByUsername(username)` → `findByEmail(email)`
- All `select` clauses updated: `username` → `email`

---

### 5. **DTO Changes**

#### LoginDto (`src/auth/dto/login.dto.ts`)

**Before:**
```typescript
export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email (used as username)' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', description: 'Password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
```

**After:**
```typescript
export class LoginDto {
  @ApiProperty({ example: 'admin@ithelp.com', description: 'Email address' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ssw0rd', description: 'Password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
```

---

### 6. **JWT Strategy Changes**

#### File: `src/auth/strategies/jwt.strategy.ts`

**Before:**
```typescript
return {
  sub: user.user_id,
  username: user.username,
  employee_id: user.employee_id,
  // ...
};
```

**After:**
```typescript
return {
  sub: user.user_id,
  username: user.email,
  employee_id: user.employee_id,
  // ...
};
```

---

### 7. **Controller Changes**

#### User Account Controller (`src/user-account/user-account.controller.ts`)

**Before:**
```typescript
@Get(':username')
findByUsername(@Param('username') username: string) {
  return this.userAccountService.findByUsername(username);
}
```

**After:**
```typescript
@Get(':email')
findByEmail(@Param('email') email: string) {
  return this.userAccountService.findByEmail(email);
}
```

---

## 📊 API Response Changes

### Login Response Format
The response structure remains the same, but now includes email:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "94091f2d-58aa-49ae-b1da-a52858a26df6",
    "username": "admin@ithelp.com",
    "password_changed": false,
    "employee": {
      "employee_id": "b8d6c401-b940-42e8-810f-a7d11ac72efc",
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@ithelp.com",
      "role": "admin",
      "branch_id": "0c97b1c2-be55-4082-926d-841df34bf588",
      "branch": { ... }
    }
  }
}
```

---

## 🔐 Authentication Flow

### Before (Username-based):
1. User enters username: `admin`
2. Frontend sends: `{ username: "admin", password: "admin123" }`
3. Backend queries: `WHERE username = 'admin'`
4. Returns token with `username: "admin"`

### After (Email-based):
1. User enters email: `admin@ithelp.com`
2. Frontend sends: `{ email: "admin@ithelp.com", password: "admin123" }`
3. Backend queries: `WHERE employee.email = 'admin@ithelp.com'`
4. Returns token with `username: "admin@ithelp.com"`

---

## 📝 Frontend Updates Required

### Login Service Update

Update your Angular `auth.service.ts` or authentication interceptor:

**Before:**
```typescript
login(username: string, password: string) {
  return this.http.post('/auth/login', {
    username,
    password
  });
}
```

**After:**
```typescript
login(email: string, password: string) {
  return this.http.post('/auth/login', {
    email,
    password
  });
}
```

### Login Component Update

**Before:**
```typescript
onLogin() {
  this.authService.login(this.loginForm.value.username, this.loginForm.value.password)
    .subscribe(...);
}
```

**After:**
```typescript
onLogin() {
  this.authService.login(this.loginForm.value.email, this.loginForm.value.password)
    .subscribe(...);
}
```

### Form Field Rename

```html
<!-- Before -->
<input formControlName="username" placeholder="Username" />

<!-- After -->
<input formControlName="email" type="email" placeholder="Email Address" />
```

---

## ✅ Testing Checklist

- [x] Database migration completed successfully
- [x] Email column populated from employee emails
- [x] Old username column removed
- [x] TypeScript compilation: 0 errors
- [x] Login endpoint works with email
- [x] JWT token generated correctly
- [x] New employees created with email in user_account
- [x] Backend deployed to Render
- [ ] Frontend updated to send email instead of username
- [ ] Frontend login tested in production
- [ ] Password change functionality works
- [ ] Signup flow works with email

---

## 🚀 Deployment Status

### Backend
- ✅ Code updated and compiled
- ✅ Database migration applied
- ✅ Deployed to Render.com
- ✅ Auto-deployment triggered on git push

### Frontend
- ⏳ Awaiting frontend code updates
- ⏳ Requires login form modification
- ⏳ Needs authentication service update

---

## 📋 Files Modified

### Backend Files:
1. `src/entities/user-account.entity.ts` - Entity definition
2. `src/auth/dto/login.dto.ts` - Login DTO validation
3. `src/auth/auth.service.ts` - Authentication logic
4. `src/auth/strategies/jwt.strategy.ts` - JWT validation
5. `src/employee/employee.service.ts` - Employee creation
6. `src/user-account/user-account.service.ts` - User account queries
7. `src/user-account/user-account.controller.ts` - User account endpoints
8. `src/asset/asset-history.service.ts` - Asset history (username references)
9. `src/sync-user-accounts.ts` - User sync script
10. `src/migrations/update-username-to-email.sql` - Database migration

---

## 🔍 Troubleshooting

### Error: "property username should not exist"
**Cause**: Frontend still sending `username` field
**Solution**: Update frontend to send `email` instead

### Error: "email must be an email"
**Cause**: Email format validation failed
**Solution**: Ensure email is in valid format (e.g., `user@domain.com`)

### Error: "Invalid credentials"
**Cause**: User not found or password incorrect
**Solution**: Verify email and password are correct

---

## 📞 Support

For questions about the login changes:
1. Check this documentation
2. Review the database schema
3. Check backend logs for detailed error messages
4. Verify frontend is sending correct email format
