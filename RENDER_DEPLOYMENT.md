# Render Deployment Guide

## Prerequisites

- GitHub account with the repository
- Render account (https://render.com)

## Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Setup for Render deployment"
git push origin main
```

### 2. Create Render Account

- Go to https://render.com
- Sign up with GitHub

### 3. Connect Repository

1. Click "New +" → "Web Service"
2. Select "Build and deploy from a Git repository"
3. Connect your GitHub account
4. Select the repository: `ITHELPDESK/it-help-desk-be`
5. Choose branch: `main`

### 4. Configure Service

**Name:** `it-helpdesk-api`

**Environment:** Node

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run start:prod
```

**Plan:** Free (or paid if needed)

**Region:** Singapore (or closest to your users)

### 5. Environment Variables

Set these in Render dashboard (Settings → Environment):

```
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.cqalrtavantwnbidbwdo
DB_PASSWORD=t3cfu3l2026
DB_DATABASE=postgres
DB_SYNCHRONIZE=false
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=a7f9b2c3e8d1f4a6k9m2n5p8q1r4t7u0v3w6x9y2z5c8f1g4h7j0k3l6m9n2p5
CORS_ORIGIN=https://yourdomain.com
PORT=3000
```

### 6. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Check logs for any errors
4. Once deployed, you'll get a URL like: `https://it-helpdesk-api.onrender.com`

## Manual Deployment via CLI

If using Render CLI:

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Deploy
render create
```

## Testing Deployment

```bash
curl https://it-helpdesk-api.onrender.com/api
```

## Important Notes

⚠️ **Free tier limitations:**
- Service will spin down after 15 minutes of inactivity
- Database query limits apply
- CPU/Memory limitations

💡 **For production:**
- Upgrade to paid plan to avoid spin-down
- Add custom domain
- Set up monitoring and logs
- Use environment variables for secrets (don't commit them)

## Troubleshooting

### Build Fails
- Check logs: Render Dashboard → Service → Logs
- Ensure all dependencies are in `package.json`
- Check Node version compatibility

### Database Connection Error
- Verify Supabase credentials in environment variables
- Ensure Supabase allows connections from Render
- Check SSL settings

### Service Not Starting
- Review start command in package.json
- Check if `dist/main.js` exists after build
- Look for runtime errors in logs

## Post-Deployment

1. **Update CORS_ORIGIN** with your actual frontend URL
2. **Set strong JWT_SECRET** (change the default)
3. **Monitor** logs regularly
4. **Set up** automated deployments from GitHub

---

For more help: https://render.com/docs
