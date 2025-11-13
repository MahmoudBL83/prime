# Egyptian EdTech Platform

A comprehensive educational technology platform built with Next.js, featuring:

## 🚀 Features
- **Multi-language support** (Arabic/English)
- **Course management system** with video streaming
- **Creator dashboard** with analytics
- **Student learning paths** and progress tracking
- **OnlyFans-style social features** with comments and media
- **Quiz and assessment system**
- **Subscription and payment integration**
- **Dark/Light mode** with modern UI

## 🛠 Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Prisma ORM
- **Database:** PostgreSQL (SQLite for development)
- **Authentication:** NextAuth.js
- **Payments:** Stripe integration
- **UI:** Radix UI, Lucide icons, Framer Motion
- **Internationalization:** next-intl

## 🚀 Quick Deploy

### Option 1: Vercel (Recommended)
1. Fork this repository
2. Connect to [Vercel](https://vercel.com)
3. Set environment variables
4. Deploy!

### Option 2: Railway
1. Connect to [Railway](https://railway.app)
2. Auto-deploy with free PostgreSQL
3. $5/month credit included

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

## 📱 Demo Features
- Responsive design for all devices
- Real-time notifications
- Video streaming capabilities
- Social learning features
- Progress tracking and analytics

## 🌍 Internationalization
- Arabic (ar) - العربية
- English (en)

## 📄 License
MIT License

## 🤝 Contributing
Pull requests are welcome! Please read our contributing guidelines.

---

Built with ❤️ for the Egyptian educational community