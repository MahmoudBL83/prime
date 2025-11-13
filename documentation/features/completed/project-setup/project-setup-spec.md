# Project Setup & Development Environment Technical Specification

**Document Name:** Project Setup Implementation Plan  
**Date:** 2025-09-09  
**Version:** 1.0  
**Status:** Active

## Executive Summary

This specification covers the complete project setup and development environment configuration for the Egyptian Ed-Tech platform. This includes prerequisites installation, VS Code extensions setup, and Next.js project initialization with proper folder structure and environment configuration.

## Architecture Overview

The project setup creates a Next.js 14+ application with TypeScript, Tailwind CSS, and the foundational structure for the ed-tech platform. This includes:

- Next.js app router structure
- TypeScript configuration
- Database connection setup via Prisma
- Environment configuration
- Development tooling setup

## Implementation Phases

### Phase 1.1: Prerequisites Installation (2 hours)

**Task ID:** SETUP-001

#### Steps

1. Install Node.js (v20 LTS or higher)
2. Install VS Code
3. Install Git
4. Install PostgreSQL 15+
5. Install Redis

#### Verification

- All version commands return expected versions
- Can create a test database in PostgreSQL
- Redis server starts without errors

### Phase 1.2: VS Code Extensions Setup (30 minutes)

**Task ID:** SETUP-002

#### Required Extensions

- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Thunder Client (rangav.vscode-thunder-client)
- PostgreSQL (ckolkman.vscode-postgres)
- GitLens (eamodio.gitlens)
- Docker (ms-azuretools.vscode-docker)
- Next.js snippets (pulkitgangwar.nextjs-snippets)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- Arabic Language Support (ms-ceintl.vscode-language-pack-ar)

#### VS Code Settings

Create settings.json with auto-formatting and ESLint configuration.

### Phase 1.3: Project Initialization (1 hour)

**Task ID:** SETUP-003

#### Steps

1. Create project directory
2. Initialize Next.js with TypeScript, Tailwind, app router
3. Initialize git repository
4. Create project folder structure
5. Create .env.local file with all required environment variables

#### Project Structure

```
egyptian-edtech-platform/
├── src/
│   ├── app/ (Next.js app router)
│   │   ├── api/ (API routes)
│   │   ├── auth/ (Authentication pages)
│   │   ├── dashboard/ (User dashboard)
│   │   ├── admin/ (Admin console)
│   │   ├── courses/ (Course pages)
│   │   └── creators/ (Creator pages)
│   ├── components/ (Reusable components)
│   ├── lib/ (Utility functions and configurations)
│   ├── types/ (TypeScript type definitions)
│   ├── hooks/ (Custom React hooks)
│   ├── utils/ (Utility functions)
│   ├── services/ (External service integrations)
│   └── middleware.ts (Route protection)
├── public/ (Static assets)
├── prisma/ (Database schema and migrations)
└── tests/ (Test files)
```

## Testing & Verification

- Project runs successfully with npm run dev
- Tailwind CSS works correctly
- TypeScript compiles without errors
- Can access <http://localhost:3000>
- Database connection works via Prisma
- All VS Code extensions are functional

## Security Considerations

- Environment variables are properly configured
- .env.local is added to .gitignore
- Database credentials are secured
- API keys are not committed to version control

## Dependencies

- None (this is the foundation phase)
