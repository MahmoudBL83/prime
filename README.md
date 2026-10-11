# Prime

[Live app on Vercel](https://prime-six-self.vercel.app)

Prime is an Egyptian learning platform with courses, creator and mentor workspaces, quizzes, study groups, messaging, and learner progress. The application supports Arabic and English and includes optional payment, email, and video integrations.

## Stack

- Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS
- NextAuth.js for sign-in
- Prisma 6 with PostgreSQL
- `next-intl` for localization
- Stripe, Paymob, Mux, and Resend integration code

## Run locally

Requirements: Node.js 20 or newer and a PostgreSQL database.

```bash
cp .env.example .env
npm ci
npm run db:push
npm run dev
```

Set `DATABASE_URL` and a unique `NEXTAUTH_SECRET` in `.env` before starting. `db:push` applies the schema to the database named in `DATABASE_URL`; use a disposable database for local work. Open [http://localhost:3000](http://localhost:3000).

## ⚡ Performance & deployment notes
- **Keep the app and the database in the same region.** The Neon database is in `us-east-1`; deploy the Vercel project to `iad1` (Washington, D.C.). Every query is a network round trip, so cross-region deployments are many times slower.
- **Neon auto-suspend:** after ~5 minutes idle the first request wakes the database (a few seconds). Disable auto-suspend on paid plans if that matters. `src/lib/prisma.ts` adds connect/socket timeouts and retries dropped connections automatically.
- **Caching:** the public mentors list (`/api/creators`) and feed (`/api/channel-posts/feed`) are cached for 60s / 20s and invalidated automatically whenever posts, creators or likes change.
- **Sensitive columns** (`User.passwordHash`, creator KYC/bank fields) are omitted from every Prisma query by default. Opt in explicitly with `select` or `omit: INCLUDE_SENSITIVE_CREATOR_FIELDS` (admin only).
- **Post visibility** rules live in `src/lib/content-access.ts` (`BRONZE`/`PUBLIC` posts are free; everything else needs a subscription).

The repository does not include production credentials or personal seed data. Create accounts through the application after setting up your own database. Payment, email, and video features need their respective provider credentials.

## Validate

```bash
npx prisma generate
npx tsc --noEmit
npm run build
```

The build generates the Prisma client and compiles Next.js. It does not change the database schema. For a new deployment, prepare the target database separately with `npm run db:push` after reviewing the schema changes.

## Deploy to Vercel

Connect this repository to a Vercel project using the Next.js preset. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_APP_URL` for the target environment. Add integration credentials only for features you enable. The build command is `npm run build`.

Never commit `.env` files. Rotate any credential that was previously published in repository history.
