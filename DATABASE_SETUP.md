# Database Setup Guide

## Local Development Setup (PostgreSQL)

### 1. Install PostgreSQL

- Download: https://www.postgresql.org/download/
- Install and remember your password

### 2. Create Local Database

Open PostgreSQL terminal (psql) or pgAdmin and run:

```sql
CREATE DATABASE ithelp_desk_local;
```

### 3. Update .env File

Make sure your `.env` file has correct credentials:

```
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_DATABASE=ithelp_desk_local
```

### 4. Run Development Server

```bash
npm run start:dev
```

The database tables will be created automatically (DB_SYNCHRONIZE=true).

---

## Production Setup (Supabase)

### 1. Create Supabase Project

- Go to https://supabase.com
- Click "New Project"
- Note your project credentials

### 2. Get Connection Details

From Supabase Dashboard → Settings → Database:

- Host: `db.xxxxxxxxxxxxx.supabase.co`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: (your project password)

### 3. Create .env.production File

Copy `.env.production.example` to `.env.production` and update:

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:

```
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_supabase_password
DB_DATABASE=postgres
DB_SYNCHRONIZE=false  # IMPORTANT: false in production!
JWT_SECRET=change-this-to-random-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### 4. Build and Deploy

```bash
# Build the application
npm run build

# Run with production env
NODE_ENV=production npm run start:prod
```

---

## Switching Between Environments

### Development (Local PostgreSQL):

```bash
npm run start:dev
```

Uses `.env` automatically

### Production (Supabase):

```bash
# Build first
npm run build

# Run production
NODE_ENV=production npm run start:prod
```

Uses `.env.production`

---

## Environment Variables Reference

| Variable         | Local                 | Production             |
| ---------------- | --------------------- | ---------------------- |
| `NODE_ENV`       | development           | production             |
| `DB_TYPE`        | postgres              | postgres               |
| `DB_HOST`        | localhost             | db.xxx.supabase.co     |
| `DB_DATABASE`    | ithelp_desk_local     | postgres               |
| `DB_SYNCHRONIZE` | true                  | false                  |
| `CORS_ORIGIN`    | http://localhost:4200 | https://yourdomain.com |

---

## Important Notes

⚠️ **NEVER commit `.env` or `.env.production` to Git!**  
✅ They are already in `.gitignore`

⚠️ **Set `DB_SYNCHRONIZE=false` in production!**  
✅ Use migrations instead for production schema changes

⚠️ **Change JWT_SECRET in production!**  
✅ Use a long random string

---

## Troubleshooting

### Can't connect to local PostgreSQL?

- Check if PostgreSQL service is running
- Verify username/password in `.env`
- Check if database exists: `psql -l`

### Can't connect to Supabase?

- Verify connection string in Supabase dashboard
- Check if IP is whitelisted (Supabase allows all by default)
- Test connection using pgAdmin or psql

### Tables not created?

- Local: Set `DB_SYNCHRONIZE=true` in `.env`
- Production: Run migrations or set temporarily to true (not recommended)

---

## Migration (SQLite → PostgreSQL)

If you have existing data in SQLite:

1. Export data from SQLite
2. Import to PostgreSQL using pg_dump/restore
3. Or recreate data manually via API endpoints

The entity structure is compatible, so no code changes needed!
