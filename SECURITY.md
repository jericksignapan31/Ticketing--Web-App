# Security Features

This document outlines the comprehensive security measures implemented in the ITHelp Desk system.

## 🔒 Security Features Overview

### 1. HTTP Security Headers (Helmet)

- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables XSS filter in browsers
- **Strict-Transport-Security**: Enforces HTTPS connections
- **Content-Security-Policy**: Controls resource loading

### 2. CORS (Cross-Origin Resource Sharing)

- **Allowed Origins**: `http://localhost:4200`, `http://localhost:3000`
- **Credentials**: Enabled for authenticated requests
- **Configured in**: `src/main.ts`

### 3. Rate Limiting

- **Limit**: 100 requests per 60 seconds per IP
- **Protection**: Prevents brute force and DoS attacks
- **Implementation**: `@nestjs/throttler` with global guard
- **Configured in**: `src/app.module.ts`

### 4. Input Validation

- **Whitelist**: Strips properties not defined in DTOs
- **Forbidden Non-Whitelisted**: Throws error if unknown properties are sent
- **Transform**: Automatically transforms payloads to DTO instances
- **Implementation**: `class-validator` and `class-transformer`

### 5. Password Security

#### Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&\*(),.?":{}|<>)

#### Password Storage

- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Never stored in plain text**

#### Password Validation

- Enforced on password change via `PasswordValidator` utility
- Initial passwords (employee_id) are hashed but not validated
- Users must change password to meet security requirements

### 6. Authentication & Authorization

#### JWT Authentication

- **Algorithm**: HS256
- **Access Token Expiry**: 1 hour
- **Bearer Token**: Required in Authorization header
- **Implementation**: `@nestjs/jwt` and `passport-jwt`

#### Role-Based Access Control (RBAC)

- **Roles**: `admin`, `user`
- **Admin-Only Endpoints**:
  - `POST /employees` - Create employee
  - `PATCH /employees/:id` - Update employee
  - `DELETE /employees/:id` - Delete employee

#### Decorators

- `@Roles('admin')` - Restrict endpoint to specific roles
- `@CurrentUser()` - Extract current user from JWT token
- `@UseGuards(JwtAuthGuard)` - Require authentication
- `@UseGuards(RolesGuard)` - Check user role

### 7. Auto-Generated Account Creation

- When an employee is created, a user account is automatically generated
- Username: `employee_id`
- Initial Password: `employee_id` (must be changed on first login)
- **Transaction-based**: Ensures data consistency

## 🛡️ Security Configuration

All security settings are centralized in `src/common/config/security.config.ts`:

```typescript
export const SecurityConfig = {
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 10,
  },
  jwt: {
    accessTokenExpiry: '1h',
    refreshTokenExpiry: '7d',
  },
  rateLimit: {
    ttl: 60000, // 60 seconds
    limit: 100,
  },
  cors: {
    allowedOrigins: ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  },
};
```

## 🔑 Authentication Endpoints

### Login

```
POST /auth/login
Body: { "username": "string", "password": "string" }
Response: { "access_token": "string", "user": {...} }
```

### Change Password (Authenticated)

```
POST /auth/change-password
Headers: { "Authorization": "Bearer <token>" }
Body: { "currentPassword": "string", "newPassword": "string" }
Response: { "message": "Password changed successfully" }
```

## 🚦 Using Security Features

### Protecting Endpoints with Roles

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Post('sensitive-operation')
  @Roles('admin') // Only admin can access
  sensitiveOperation() {
    // ...
  }
}
```

### Getting Current User

```typescript
import { CurrentUser } from './auth/decorators/current-user.decorator';

@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: any) {
  return user; // { sub: userId, username, employeeId, role }
}
```

## 📋 Security Best Practices

1. **Never commit sensitive data**
   - Use `.env` file for secrets
   - Add `.env` to `.gitignore`

2. **Always validate input**
   - Use DTOs with `class-validator`
   - Enable `whitelist` and `forbidNonWhitelisted`

3. **Use HTTPS in production**
   - Configure SSL/TLS certificates
   - Redirect HTTP to HTTPS

4. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages with security patches

5. **Implement logging**
   - Log authentication attempts
   - Monitor suspicious activity
   - Track rate limit violations

6. **Database Security**
   - Use parameterized queries (TypeORM handles this)
   - Limit database user permissions
   - Regular backups

## 🔍 Testing Security

### Test Rate Limiting

```bash
# Should block after 100 requests
for i in {1..150}; do curl http://localhost:3005/api; done
```

### Test CORS

```bash
# Should be blocked from unauthorized origin
curl -H "Origin: http://evil-site.com" http://localhost:3005/api
```

### Test Role-Based Access

```bash
# Should return 403 Forbidden for non-admin users
curl -X POST http://localhost:3005/employees \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{"employee_id": "EMP123", ...}'
```

## 📝 Security Checklist for Production

- [ ] Change JWT secret in production environment
- [ ] Enable HTTPS
- [ ] Update CORS allowed origins to production URLs
- [ ] Set up database with proper authentication
- [ ] Implement request logging and monitoring
- [ ] Set up firewall rules
- [ ] Regular security audits
- [ ] Implement backup strategy
- [ ] Set up SSL certificate auto-renewal
- [ ] Configure proper error handling (don't expose stack traces)
- [ ] Implement session management
- [ ] Set up intrusion detection system
- [ ] Regular penetration testing

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Password Hashing with bcrypt](https://github.com/kelektiv/node.bcrypt.js)
