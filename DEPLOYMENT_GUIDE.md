# Egyptian EdTech Platform - Deployment Guide

## 🚀 Quick Deploy to Vercel (Free)

### Prerequisites
1. GitHub account
2. Vercel account (sign up at vercel.com)
3. Database (Neon.tech recommended - free)

### Step-by-Step Deployment

#### 1. Database Setup (Choose one)

**Option A: Neon PostgreSQL (Recommended)**
```bash
# 1. Go to https://neon.tech
# 2. Sign up with GitHub
# 3. Create new project
# 4. Copy connection string (starts with postgresql://)
```

**Option B: PlanetScale MySQL**
```bash
# 1. Go to https://planetscale.com
# 2. Sign up with GitHub
# 3. Create database
# 4. Get connection string
```

#### 2. GitHub Setup
```bash
# 1. Initialize git repository
git init
git add .
git commit -m "Initial commit"

# 2. Create GitHub repository
# 3. Push code to GitHub
git remote add origin https://github.com/yourusername/egyptian-edtech-platform.git
git push -u origin main
```

#### 3. Vercel Deployment
```bash
# 1. Go to https://vercel.com
# 2. Sign up with GitHub
# 3. Click "New Project"
# 4. Import your GitHub repository
# 5. Configure environment variables (see below)
# 6. Deploy!
```

#### 4. Environment Variables (Set in Vercel Dashboard)
```
DATABASE_URL=your-database-connection-string
NEXTAUTH_SECRET=your-super-secret-key-32-chars-min
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# Optional (for full functionality)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_PUBLISHABLE_KEY=your-stripe-pub-key
```

#### 5. Database Migration (After deployment)
```bash
# Run this in Vercel's function terminal or locally
npx prisma migrate deploy
npx prisma db seed
```

## 🌐 Alternative Free Hosting Options

### Netlify
- Good for static sites, but limited for full-stack apps
- Free: 100GB bandwidth/month

### Railway
- Great for full-stack apps with database
- Free: $5/month credit
- Easy PostgreSQL setup

### Render
- Free tier with 750 hours/month
- Built-in PostgreSQL database

## 📊 What's Included in Free Tiers

| Platform | Bandwidth | Build Time | Database | Custom Domain |
|----------|-----------|------------|----------|---------------|
| Vercel   | 100GB     | 6000 min   | External | ✅ |
| Netlify  | 100GB     | 300 min    | External | ✅ |
| Railway  | $5 credit | Unlimited  | Included | ✅ |
| Render   | 750h      | 500 min    | Included | ✅ |

## 🔧 Troubleshooting

### Common Issues
1. **Build fails**: Check TypeScript errors
2. **Database connection**: Verify connection string
3. **Environment variables**: Make sure all required vars are set
4. **Authentication**: Update NEXTAUTH_URL after deployment

### Performance Tips
1. Use Image optimization
2. Enable Static Site Generation where possible
3. Minimize bundle size
4. Use CDN for assets

## 📱 Mobile App (Future)
Consider deploying as PWA:
```javascript
// Add to next.config.js
const withPWA = require('next-pwa')({
  dest: 'public'
})

module.exports = withPWA({
  // your config
})
```

## 🎯 Next Steps After Deployment
1. Set up custom domain
2. Configure SSL certificate (automatic on Vercel)
3. Set up monitoring and analytics
4. Configure email service
5. Test all functionality
6. Set up CI/CD pipeline