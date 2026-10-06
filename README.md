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
