# Vercel Deployment Checklist

## Environment Variables Required

Make sure these are set in your Vercel project settings:

### 1. Database
```
DATABASE_URL=your_postgresql_connection_string
```

### 2. NextAuth
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_key
```

### 3. OAuth Providers (if using)
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

## Common Deployment Issues & Fixes

### 500 Error on /api/auth/register

**Possible Causes:**

1. **DATABASE_URL not set**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `DATABASE_URL` with your PostgreSQL connection string

2. **Prisma Client not generated**
   - Ensure your `package.json` has the postinstall script:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

3. **Database not accessible from Vercel**
   - If using Railway/Render/Supabase, ensure the database allows connections from `0.0.0.0/0`
   - Add Vercel's IP ranges to database allowlist if needed

4. **Missing Prisma migrations**
   - Run migrations on your production database:
   ```bash
   npx prisma migrate deploy
   ```

## How to Check Errors

### 1. Check Vercel Function Logs
```
Vercel Dashboard → Your Project → Deployments → Click on deployment → Functions tab
```

### 2. Check Database Connection
```bash
# Test database connection locally with production URL
DATABASE_URL="your_production_db_url" npx prisma db pull
```

### 3. Check Build Logs
```
Vercel Dashboard → Your Project → Deployments → Click on deployment → Build Logs
```

## Quick Fixes

### Fix 1: Add Environment Variables
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all required variables
5. Redeploy

### Fix 2: Force Rebuild
1. Go to Deployments
2. Click on latest deployment
3. Click "..." menu → Redeploy

### Fix 3: Update Build Command (if needed)
```json
// vercel.json or Project Settings
{
  "buildCommand": "prisma generate && next build"
}
```

## Testing Registration Locally

```bash
# Test the registration endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

## Production Database Setup

### If using Railway:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link project
railway login
railway link

# Get DATABASE_URL
railway variables
```

### If using Supabase:
1. Go to Project Settings → Database
2. Copy "Connection string" (Transaction mode)
3. Add to Vercel as `DATABASE_URL`

### If using Render:
1. Go to your PostgreSQL database
2. Copy "External Database URL"
3. Add to Vercel as `DATABASE_URL`

## After Adding Environment Variables

1. **Redeploy**:
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push
   ```

2. **Or use Vercel CLI**:
   ```bash
   vercel --prod
   ```

## Verify Deployment

```bash
# Test if registration works
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

## Still Having Issues?

Check the function logs in Vercel for the actual error message:
1. Vercel Dashboard → Your Project
2. Deployments → Latest Deployment
3. Functions → /api/auth/register
4. View logs for detailed error messages
