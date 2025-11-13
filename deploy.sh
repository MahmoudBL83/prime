#!/bin/bash

# Vercel Deployment Instructions for Egyptian EdTech Platform

echo "🚀 Deploying Egyptian EdTech Platform to Vercel..."

# 1. Build the project locally first
echo "📦 Building project..."
npm run build

# 2. Login to Vercel (if not already logged in)
echo "🔐 Login to Vercel..."
vercel login

# 3. Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set environment variables in Vercel dashboard"
echo "   2. Set up your database"
echo "   3. Run database migrations"
echo "   4. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL"