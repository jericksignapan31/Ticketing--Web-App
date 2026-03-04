# IT Help Desk System - Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)

## Database Setup

### 1. Install PostgreSQL

If you don't have PostgreSQL installed, download and install it from:
https://www.postgresql.org/download/

### 2. Create Database

```sql
-- Connect to PostgreSQL and create the database
CREATE DATABASE ithelp_desk;
```

### 3. Update Environment Variables

Copy the `.env` file and update the database credentials if needed:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_NAME=ithelp_desk
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev
```

## Testing the Login API

### Creating a Test User (SQL Script)

Run these SQL commands to create a test user:

```sql
-- Insert test employee
INSERT INTO employee (
  employee_id,
  first_name,
  last_name,
  email,
  role,
  employment_status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Admin',
  'User',
  'admin@example.com',
  'admin',
  'active',
  NOW(),
  NOW()
);

-- Insert test user account (password is 'password123')
INSERT INTO user_account (
  user_id,
  employee_id,
  username,
  password,
  account_status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT employee_id FROM employee WHERE email = 'admin@example.com'),
  'admin',
  '$2b$10$YourHashedPasswordHere',
  'active',
  NOW(),
  NOW()
);
```

**Note:** The password needs to be hashed with bcrypt. You can use the API to help with this.

### Alternative: Create User via Code

You can also create a user programmatically. Add this temporary endpoint or use Node.js console:

```typescript
import * as bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash('password123', 10);
console.log(hashedPassword);
```

### Login via API

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid",
    "username": "admin",
    "employee": {
      "employee_id": "uuid",
      "first_name": "Admin",
      "last_name": "User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

- **Swagger UI:** http://localhost:3005/api

## Project Structure

```
src/
├── auth/                  # Authentication module
│   ├── dto/              # Data transfer objects
│   ├── strategies/       # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── entities/             # Database entities
│   ├── employee.entity.ts
│   └── user-account.entity.ts
├── app.module.ts
└── main.ts
```

## Next Steps

After setting up login, you can proceed with:

1. Protected routes with JWT guards
2. Employee management
3. Ticket system
4. Asset management
5. Other features from the ERD
