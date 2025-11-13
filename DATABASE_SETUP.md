# Database Setup for Production

After your Vercel app is deployed and environment variables are set:

## Option 1: Run Locally (Recommended)

1. Create a local .env file with your production DATABASE_URL
2. Run these commands:

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed the database with demo data
npx prisma db seed
```

## Option 2: Vercel Function (Alternative)

Create a temporary API route to initialize your database:

1. Create file: `src/app/api/setup-db/route.ts`
2. Add this code:

```typescript
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Run migrations
    await prisma.$executeRaw`SELECT 1` // Test connection
    
    // You can add seeding logic here if needed
    
    return Response.json({ success: true, message: 'Database setup complete' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

3. Visit: `https://your-app.vercel.app/api/setup-db` (POST request)
4. Delete the file after setup

## Verification

Test your deployment:
1. Visit your Vercel URL
2. Try registering a new account
3. Check if courses load
4. Test mentor profiles

## Troubleshooting

**Database Connection Issues:**
- Verify DATABASE_URL is correct
- Check Neon dashboard for connection details
- Ensure database allows external connections

**Authentication Issues:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

**Build Errors:**
- Check Vercel function logs
- Verify all environment variables are set
- Look for TypeScript errors in build output