#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Building Next.js application..."
npm run build

echo "Vercel build completed successfully!"
