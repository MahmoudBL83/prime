# Production Database Setup Script

# 1. Install dependencies
npm install

# 2. Set your production DATABASE_URL temporarily
# Copy the Neon database URL to your local .env

# 3. Deploy migrations to production database
npx prisma migrate deploy

# 4. Seed the production database with initial data
npx prisma db seed

# 5. Verify the database
npx prisma studio

echo "✅ Production database setup complete!"
echo "🚀 Your app should now be live at your Vercel URL"