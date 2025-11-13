# 🚀 Simple Deployment Guide for Egyptian EdTech Platform

Your repository has some large video files that exceed GitHub's limits. Here are 3 simple solutions:

## 🎯 **Option 1: Deploy to Vercel (Easiest)**

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in with GitHub**
3. **Import your repository:** `https://github.com/MahmoudBL83/prime`
4. **Set environment variables in Vercel:**

```bash
# Required Variables
DATABASE_URL=postgresql://username:password@host:5432/database
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

5. **Deploy!** Vercel will ignore the large files automatically.

## 🗄️ **Step 1: Get Free Database**

**Neon.tech (Recommended):**
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (free)
3. Create new project
4. Copy connection string: `postgresql://...`

**Railway.app (Alternative):**
1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub repo directly
3. Adds PostgreSQL automatically
4. $5/month credit (usually enough)

## ⚙️ **Step 2: Environment Setup**

After deployment, set these in Vercel dashboard → Settings → Environment Variables:

### Essential (Required)
```bash
DATABASE_URL=postgresql://your-neon-connection-string
NEXTAUTH_SECRET=random-32-char-string-generate-this
NEXTAUTH_URL=https://your-deployed-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-deployed-app.vercel.app
NODE_ENV=production
```

### Optional (for full features)
```bash
RESEND_API_KEY=your-resend-api-key-for-emails
EMAIL_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

## 🔧 **Step 3: Database Setup**

After deployment, run database migrations:

1. In Vercel dashboard → Functions
2. Or locally with production DATABASE_URL:

```bash
# Set production DATABASE_URL in local .env
npx prisma migrate deploy
npx prisma db seed
```

## 🌐 **Alternative Hosting Options**

### **Railway** (Includes database)
1. [railway.app](https://railway.app) → New Project
2. Deploy from GitHub repo
3. Automatic PostgreSQL database
4. Set environment variables
5. Deploy!

### **Render** (Good free tier)
1. [render.com](https://render.com) → New Web Service
2. Connect GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables

### **Netlify** (Static + Functions)
1. [netlify.com](https://netlify.com)
2. Connect GitHub repo
3. Build settings: `npm run build`
4. Publish directory: `.next`

## 📋 **Deployment Checklist**

- [ ] Database created (Neon/Railway/PlanetScale)
- [ ] Repository connected to hosting platform
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] App deployed and accessible
- [ ] Test login/registration functionality
- [ ] Test course creation/viewing

## 🎉 **Expected Results**

After successful deployment:
- ✅ Live URL (e.g., `your-app.vercel.app`)
- ✅ HTTPS/SSL certificate
- ✅ Global CDN for fast loading
- ✅ Automatic deployments on code changes
- ✅ Database with demo data
- ✅ All features working (courses, mentors, messaging, etc.)

## 🆘 **Troubleshooting**

**Build Fails:**
- Check TypeScript errors
- Ensure all environment variables are set
- Try deploying with `NODE_ENV=development` first

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check database allows external connections
- Ensure database exists and is accessible

**Large File Issues:**
- Files over 100MB are blocked by GitHub
- Use `.gitignore` to exclude large media files
- Consider using CDN for video content

## 🚀 **Quick Start Commands**

```bash
# 1. Create free database at neon.tech
# 2. Copy connection string
# 3. Deploy to Vercel with these settings:

Framework: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install

# Environment Variables:
DATABASE_URL=your-neon-string
NEXTAUTH_SECRET=generate-32-char-random
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

Your Egyptian EdTech platform will be live in ~10 minutes! 🎯