# PRIME Learning Platform - Complete Implementation Plan

## Product Vision
Build the world's most complete learning ecosystem with three core pillars:
1. **Category A** - All-Access Course Library (Amazon of Learning)
2. **Category B** - Signature Premium Programs (Curated Excellence)
3. **Category C** - Creator Membership Channels (Personalized Coaching)

Plus: **Study Buddy Matching** (Swipe-based peer learning) and **Rewards/Scholarships System**

## Table of Contents

1. [Project Setup & Development Environment](#1-project-setup--development-environment)
2. [Technology Stack & Architecture](#2-technology-stack--architecture)
3. [Database Schema - Complete Model](#3-database-schema--complete-model)
4. [Authentication & User Management](#4-authentication--user-management)
5. [Study Buddy Matching System](#5-study-buddy-matching-system)
6. [Category A - All-Access Library](#6-category-a--all-access-library)
7. [Category B - Signature Courses](#7-category-b--signature-courses)
8. [Category C - Creator Channels](#8-category-c--creator-channels)
9. [Rewards & Scholarships System](#9-rewards--scholarships-system)
10. [Payment & Subscription Management](#10-payment--subscription-management)
11. [Creator Studio & Tools](#11-creator-studio--tools)
12. [Admin Console - Mission Control](#12-admin-console--mission-control)
13. [Live Streaming & Events](#13-live-streaming--events)
14. [Automation & AI Features](#14-automation--ai-features)
15. [Testing & Deployment](#15-testing--deployment)

---

## 1. Project Setup & Development Environment

### 1.1 Prerequisites Installation

**Task ID:** SETUP-001  
**Duration:** 2 hours  
**Dependencies:** None

#### Steps

1. Install Node.js (v20 LTS or higher)

   ```bash
   # Download from https://nodejs.org/
   node --version  # Should show v20.x.x
   ```

2. Install VS Code

   ```bash
   # Download from https://code.visualstudio.com/
   ```

3. Install Git

   ```bash
   # Download from https://git-scm.com/
   git --version  # Should show version
   ```

4. Install PostgreSQL 15+

   ```bash
   # Download from https://www.postgresql.org/download/
   psql --version  # Should show 15.x
   ```

5. Install Redis

   ```bash
   # Download from https://redis.io/download/
   redis-server --version
   ```

#### Verification

- [ ] All version commands return expected versions
- [ ] Can create a test database in PostgreSQL
- [ ] Redis server starts without errors

### 1.2 VS Code Extensions Setup

**Task ID:** SETUP-002  
**Duration:** 30 minutes  
**Dependencies:** SETUP-001

#### Required Extensions

```
1. ESLint (dbaeumer.vscode-eslint)
2. Prettier (esbenp.prettier-vscode)
3. Thunder Client (rangav.vscode-thunder-client)
4. PostgreSQL (ckolkman.vscode-postgres)
5. GitLens (eamodio.gitlens)
6. Docker (ms-azuretools.vscode-docker)
7. Next.js snippets (pulkitgangwar.nextjs-snippets)
8. Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
9. Arabic Language Support (ms-ceintl.vscode-language-pack-ar)
```

#### VS Code Settings (settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  "terminal.integrated.defaultProfile.windows": "Git Bash"
}
```

#### Verification

- [ ] All extensions installed and active
- [ ] Auto-formatting works on save
- [ ] Can connect to PostgreSQL from VS Code

### 1.3 Project Initialization

**Task ID:** SETUP-003  
**Duration:** 1 hour  
**Dependencies:** SETUP-002

#### Steps

```bash
# Create project directory
mkdir egyptian-edtech-platform
cd egyptian-edtech-platform

# Initialize Next.js with TypeScript
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Initialize git repository
git init
git add .
git commit -m "Initial commit"

# Create project structure
mkdir -p src/{components,lib,types,hooks,utils,services,middleware}
mkdir -p src/app/{api,auth,dashboard,admin,courses,creators}
mkdir -p public/{images,videos,documents}
mkdir -p prisma/{migrations,seeds}
mkdir -p tests/{unit,integration,e2e}
```

#### Create .env.local file

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/edtech_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Redis
REDIS_URL="redis://localhost:6379"

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="eu-south-1"
S3_BUCKET_NAME=""

# Payment Gateway (Paymob)
PAYMOB_API_KEY=""
PAYMOB_INTEGRATION_ID=""
PAYMOB_IFRAME_ID=""
PAYMOB_HMAC_SECRET=""

# Email Service (SendGrid)
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL=""

# KYC Provider
KYC_API_KEY=""
KYC_API_URL=""
```

#### Verification

- [ ] Project runs with `npm run dev`
- [ ] Tailwind CSS works
- [ ] TypeScript compiles without errors
- [ ] Can access <http://localhost:3000>

---

## 2. Technology Stack

### 2.1 Core Stack Definition

**Task ID:** TECH-001  
**Duration:** 2 hours  
**Dependencies:** SETUP-003

#### Install Core Dependencies

```bash
# Backend & Database
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken
npm install zod
npm install date-fns
npm install axios
npm install multer @types/multer
npm install sharp  # For image processing
npm install bull  # For job queues
npm install ioredis

# Authentication
npm install next-auth @auth/prisma-adapter

# UI Components
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tabs
npm install @radix-ui/react-toast
npm install lucide-react
npm install react-hook-form
npm install @hookform/resolvers

# Utilities
npm install clsx tailwind-merge
npm install react-hot-toast

# Development Dependencies
npm install -D @types/bcryptjs
npm install -D @types/jsonwebtoken
npm install -D eslint-config-next
npm install -D prettier prettier-plugin-tailwindcss
```

#### Create lib/utils.ts

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency = "EGP"): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: currency,
  }).format(price)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}
```

#### Verification

- [ ] All packages installed successfully
- [ ] No peer dependency warnings
- [ ] Utils functions work correctly

### 2.2 Database Setup with Prisma

**Task ID:** TECH-002  
**Duration:** 3 hours  
**Dependencies:** TECH-001

#### Initialize Prisma

```bash
npx prisma init
```

#### Create prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  LEARNER
  CREATOR
  ADMIN
}

enum SubscriptionType {
  CATEGORY_A  // All-Access Library
  CATEGORY_C  // Creator Channel
}

enum KYCStatus {
  NOT_STARTED
  PENDING
  VERIFIED
  REJECTED
}

enum ContentStatus {
  DRAFT
  UNDER_REVIEW
  PUBLISHED
  REJECTED
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  phone             String?   @unique
  passwordHash      String
  name              String
  role              UserRole  @default(LEARNER)
  emailVerified     DateTime?
  phoneVerified     DateTime?
  arabicName        String?
  profileImage      String?
  bio               String?   @db.Text
  interests         String[]
  goals             String[]
  skillLevel        String?
  learningMode      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  creator           Creator?
  subscriptions     Subscription[]
  studyBuddyMatches StudyBuddyMatch[] @relation("UserMatches")
  enrollments       Enrollment[]
  sessions          Session[]
}

model Creator {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  
  // KYC Information
  kycStatus         KYCStatus @default(NOT_STARTED)
  nationalId        String?
  nationalIdImage   String?
  selfieImage       String?
  addressProof      String?
  bankAccountIBAN   String?
  bankName          String?
  
  // Creator Details
  expertise         String[]
  teachingGoals     String?   @db.Text
  contractSigned    Boolean   @default(false)
  contractSignedAt  DateTime?
  
  // Stats
  totalEarnings     Float     @default(0)
  totalSubscribers  Int       @default(0)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  courses           Course[]
  channels          CreatorChannel[]
  payouts           Payout[]
}

model Course {
  id                String        @id @default(cuid())
  title             String
  titleAr           String
  description       String        @db.Text
  descriptionAr     String        @db.Text
  thumbnail         String?
  creatorId         String
  creator           Creator       @relation(fields: [creatorId], references: [id])
  
  // Course Details
  category          String        // "CATEGORY_A" or "CATEGORY_B"
  skillLevel        String
  duration          Int           // in minutes
  language          String
  price             Float?
  
  // Content
  syllabus          Json
  status            ContentStatus @default(DRAFT)
  publishedAt       DateTime?
  
  // Stats
  totalViews        Int           @default(0)
  totalEnrollments  Int           @default(0)
  rating            Float         @default(0)
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Relations
  lessons           Lesson[]
  enrollments       Enrollment[]
}

model Lesson {
  id                String    @id @default(cuid())
  courseId          String
  course            Course    @relation(fields: [courseId], references: [id])
  
  title             String
  titleAr           String
  description       String?
  videoUrl          String
  duration          Int       // in seconds
  order             Int
  
  // Resources
  resources         Json?     // Array of resource URLs
  transcript        String?   @db.Text
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model CreatorChannel {
  id                String    @id @default(cuid())
  creatorId         String
  creator           Creator   @relation(fields: [creatorId], references: [id])
  
  name              String
  nameAr            String
  description       String    @db.Text
  descriptionAr     String    @db.Text
  coverImage        String?
  
  // Subscription Tiers
  tiers             Json      // Array of {name, price, perks}
  
  // Stats
  totalSubscribers  Int       @default(0)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  posts             ChannelPost[]
  subscriptions     Subscription[]
}

model ChannelPost {
  id                String         @id @default(cuid())
  channelId         String
  channel           CreatorChannel @relation(fields: [channelId], references: [id])
  
  content           String         @db.Text
  contentAr         String?        @db.Text
  mediaUrl          String?
  mediaType         String?        // "video", "image", "document"
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}

model Subscription {
  id                String           @id @default(cuid())
  userId            String
  user              User             @relation(fields: [userId], references: [id])
  
  type              SubscriptionType
  channelId         String?
  channel           CreatorChannel?  @relation(fields: [channelId], references: [id])
  
  // Payment Details
  pricePerMonth     Float
  status            String           // "active", "cancelled", "expired"
  
  startDate         DateTime         @default(now())
  endDate           DateTime?
  cancelledAt       DateTime?
  
  // Payment Gateway Reference
  paymentMethodId   String?
  subscriptionId    String?          // External subscription ID
  
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}

model StudyBuddyMatch {
  id                String    @id @default(cuid())
  user1Id           String
  user2Id           String
  
  user1             User      @relation("UserMatches", fields: [user1Id], references: [id])
  
  status            String    // "pending", "accepted", "blocked"
  sharedSubjects    String[]
  sharedGoals       String[]
  
  // Chat Room
  chatRoomId        String?   @unique
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Enrollment {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  courseId          String
  course            Course    @relation(fields: [courseId], references: [id])
  
  progress          Float     @default(0) // Percentage
  completedLessons  String[]  // Array of lesson IDs
  lastAccessedAt    DateTime?
  completedAt       DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([userId, courseId])
}

model Payout {
  id                String    @id @default(cuid())
  creatorId         String
  creator           Creator   @relation(fields: [creatorId], references: [id])
  
  amount            Float
  currency          String    @default("EGP")
  status            String    // "pending", "processing", "completed", "failed"
  
  // Payment Details
  bankTransferId    String?
  processedAt       DateTime?
  failureReason     String?
  
  // Period
  periodStart       DateTime
  periodEnd         DateTime
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model Session {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  token             String    @unique
  expiresAt         DateTime
  userAgent         String?
  ipAddress         String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

#### Run Database Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### Verification

- [ ] Database migrations run successfully
- [ ] Can connect to database with Prisma Studio: `npx prisma studio`
- [ ] All models visible in Prisma Studio

---

## 3. Database Schema - Complete Model

### 3.1 Complete Prisma Schema for PRIME Platform

**Task ID:** DB-001  
**Duration:** 4 hours  
**Dependencies:** TECH-002

#### Update prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum UserRole {
  LEARNER
  CREATOR
  ADMIN
  MODERATOR
}

enum SubscriptionType {
  CATEGORY_A        // All-Access Library
  CATEGORY_B        // Signature Courses
  CATEGORY_C        // Creator Channel
  BUNDLE_AB         // A + B Bundle
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  PAUSED
  PAYMENT_FAILED
}

enum KYCStatus {
  NOT_STARTED
  PENDING
  VERIFIED
  REJECTED
  REQUIRES_UPDATE
}

enum ContentStatus {
  DRAFT
  UNDER_REVIEW
  PUBLISHED
  REJECTED
  ARCHIVED
  FLAGGED
}

enum ContentCategory {
  CATEGORY_A        // All-Access
  CATEGORY_B        // Signature
  CATEGORY_C        // Creator Channel
}

enum LessonType {
  VIDEO
  READING
  QUIZ
  ASSIGNMENT
  LIVE_SESSION
  DISCUSSION
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  HELD
}

enum ReportStatus {
  PENDING
  REVIEWING
  RESOLVED
  DISMISSED
}

enum ReportType {
  ABUSE
  COPYRIGHT
  SPAM
  INAPPROPRIATE
  FRAUD
  OTHER
}

enum PrizeStatus {
  ACTIVE
  AWARDED
  EXPIRED
  CANCELLED
}

enum MatchStatus {
  PENDING
  ACCEPTED
  BLOCKED
  EXPIRED
}

enum MeetingType {
  ONE_ON_ONE
  GROUP
  COHORT
  OFFICE_HOURS
}

// ============================================================================
// USER MODELS
// ============================================================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  phone             String?   @unique
  passwordHash      String
  name              String
  arabicName        String?
  role              UserRole  @default(LEARNER)
  
  // Verification
  emailVerified     DateTime?
  phoneVerified     DateTime?
  ageVerified       Boolean   @default(false)
  isMinor           Boolean   @default(false)
  guardianEmail     String?
  
  // Profile
  profileImage      String?
  bio               String?   @db.Text
  website           String?
  location          String?
  timezone          String?
  languages         String[]
  
  // Learning Preferences
  interests         String[]
  goals             String[]
  skillLevel        String?
  learningMode      String?   // self-paced, cohort, 1:1
  availability      Json?     // {days: [], times: []}
  studyPace         String?   // intensive, moderate, casual
  
  // Settings
  notificationSettings Json?
  privacySettings      Json?
  theme                String   @default("system")
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastActiveAt      DateTime?
  
  // Relations
  creator           Creator?
  subscriptions     Subscription[]
  enrollments       Enrollment[]
  studyBuddyMatches StudyBuddyMatch[] @relation("UserMatches")
  buddyRequests     StudyBuddyMatch[] @relation("BuddyRequests")
  sessions          Session[]
  reports           Report[]
  submissions       Submission[]
  certificates      Certificate[]
  wallet            Wallet?
  messages          Message[]
  groupMembers      GroupMember[]
  eventAttendees    EventAttendee[]
  reviews           Review[]
  progress          LessonProgress[]
  
  @@index([email])
  @@index([role])
}

model Creator {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // KYC Information
  kycStatus         KYCStatus @default(NOT_STARTED)
  kycSubmittedAt    DateTime?
  kycVerifiedAt     DateTime?
  kycRejectionReason String?
  nationalId        String?
  nationalIdImage   String?
  selfieImage       String?
  addressProof      String?
  taxId             String?
  
  // Banking
  stripeAccountId   String?   @unique
  bankAccountIBAN   String?
  bankName          String?
  paypalEmail       String?
  
  // Creator Profile
  expertise         String[]
  teachingGoals     String?   @db.Text
  yearsExperience   Int?
  qualifications    Json?     // [{degree, institution, year}]
  
  // Contract
  contractSigned    Boolean   @default(false)
  contractSignedAt  DateTime?
  contractVersion   String?
  
  // Stats
  totalEarnings     Float     @default(0)
  totalSubscribers  Int       @default(0)
  totalStudents     Int       @default(0)
  averageRating     Float     @default(0)
  responseTime      Int?      // in hours
  
  // Policies
  strikes           Int       @default(0)
  isSuspended       Boolean   @default(false)
  suspendedUntil    DateTime?
  
  // Availability (Category C)
  availableForMeetings Boolean @default(false)
  hourlyRate        Float?
  maxStudentsPerSlot Int?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  courses           Course[]
  channels          CreatorChannel[]
  payouts           Payout[]
  posts             Post[]
  liveEvents        LiveEvent[]
  groups            Group[]
  
  @@index([kycStatus])
  @@index([stripeAccountId])
}

// ============================================================================
// CONTENT MODELS - CATEGORY A & B (COURSES)
// ============================================================================

model Course {
  id                String        @id @default(cuid())
  creatorId         String
  creator           Creator       @relation(fields: [creatorId], references: [id])
  
  // Basic Info
  title             String
  titleAr           String?
  titleDe           String?
  slug              String        @unique
  description       String        @db.Text
  descriptionAr     String?       @db.Text
  descriptionDe     String?       @db.Text
  
  // Category & Classification
  category          ContentCategory // A or B
  subject           String
  subCategory       String?
  tags              String[]
  
  // Course Details
  skillLevel        String        // Beginner, Intermediate, Advanced
  skillLevelAr      String?
  skillLevelDe      String?
  duration          Int           // total minutes
  language          String
  languages         String[]      // multiple audio tracks
  
  // Media
  thumbnail         String?
  trailerUrl        String?
  coverImage        String?
  
  // Pricing (Category B only, A is subscription-based)
  price             Float?
  discountPrice     Float?
  
  // Learning Outcomes
  outcomes          Json          // [{title, description}]
  prerequisites     String[]
  
  // Content Structure
  syllabus          Json          // modules with lessons
  
  // Certificate
  hasCertificate    Boolean       @default(false)
  certificateTemplate String?
  
  // Quality & Review (Category B)
  isEditorialReview Boolean       @default(false)
  editorNotes       String?       @db.Text
  productionQuality Int?          // 1-10 scale
  
  // Status & Publishing
  status            ContentStatus @default(DRAFT)
  publishedAt       DateTime?
  archivedAt        DateTime?
  
  // Engagement Metrics
  totalViews        Int           @default(0)
  totalEnrollments  Int           @default(0)
  completionRate    Float         @default(0)
  rating            Float         @default(0)
  reviewCount       Int           @default(0)
  
  // Revenue Tracking (Category A)
  watchTimeMinutes  Int           @default(0)
  engagementScore   Float         @default(0)
  
  // Features
  hasQuizzes        Boolean       @default(false)
  hasAssignments    Boolean       @default(false)
  hasCaptions       Boolean       @default(true)
  hasTranscripts    Boolean       @default(true)
  allowsDownload    Boolean       @default(false)
  
  // Accessibility
  captionsAvailable String[]      // language codes
  audioDescriptions Boolean       @default(false)
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Relations
  modules           Module[]
  lessons           Lesson[]
  enrollments       Enrollment[]
  reviews           Review[]
  prizes            PrizePool[]
  
  @@index([category])
  @@index([status])
  @@index([creatorId])
  @@index([slug])
}

model Module {
  id                String    @id @default(cuid())
  courseId          String
  course            Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  title             String
  titleAr           String?
  description       String?   @db.Text
  descriptionAr     String?   @db.Text
  order             Int
  duration          Int       // minutes
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  lessons           Lesson[]
  
  @@index([courseId])
}

model Lesson {
  id                String      @id @default(cuid())
  courseId          String
  course            Course      @relation(fields: [courseId], references: [id], onDelete: Cascade)
  moduleId          String?
  module            Module?     @relation(fields: [moduleId], references: [id])
  
  title             String
  titleAr           String?
  titleDe           String?
  description       String?     @db.Text
  descriptionAr     String?     @db.Text
  
  type              LessonType  @default(VIDEO)
  order             Int
  duration          Int         // seconds
  
  // Video Content
  videoUrl          String?
  videoProvider     String?     // youtube, vimeo, s3
  videoDuration     Int?
  videoQuality      String[]    // [360p, 720p, 1080p]
  
  // Text Content
  content           String?     @db.Text
  contentAr         String?     @db.Text
  
  // Resources
  resources         Json?       // [{name, url, type, size}]
  transcript        String?     @db.Text
  transcriptAr      String?     @db.Text
  
  // Quiz/Assignment (if applicable)
  quiz              Json?       // quiz structure
  assignment        Json?       // assignment details
  
  // Settings
  isFree            Boolean     @default(false)
  isPreview         Boolean     @default(false)
  allowsComments    Boolean     @default(true)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relations
  progress          LessonProgress[]
  submissions       Submission[]
  
  @@index([courseId])
  @@index([moduleId])
}

model Enrollment {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  courseId          String
  course            Course    @relation(fields: [courseId], references: [id])
  
  // Progress
  progress          Float     @default(0) // percentage
  lastLessonId      String?
  lastAccessedAt    DateTime?
  completedAt       DateTime?
  timeSpentMinutes  Int       @default(0)
  
  // Certificate
  certificateIssued Boolean   @default(false)
  certificateId     String?
  
  // Source
  source            String?   // organic, referral, campaign
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

model LessonProgress {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  lessonId          String
  lesson            Lesson    @relation(fields: [lessonId], references: [id])
  
  completed         Boolean   @default(false)
  completedAt       DateTime?
  progress          Int       @default(0) // percentage
  timeSpent         Int       @default(0) // seconds
  watchedDuration   Int       @default(0) // for videos
  lastPosition      Int?      // video timestamp
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
}

// ============================================================================
// CONTENT MODELS - CATEGORY C (CREATOR CHANNELS)
// ============================================================================

model CreatorChannel {
  id                String    @id @default(cuid())
  creatorId         String
  creator           Creator   @relation(fields: [creatorId], references: [id])
  
  name              String
  nameAr            String?
  slug              String    @unique
  description       String    @db.Text
  descriptionAr     String?   @db.Text
  
  // Media
  coverImage        String?
  profileImage      String?
  trailerUrl        String?
  
  // Membership Tiers
  tiers             Json      // [{name, price, perks, maxSlots}]
  
  // Settings
  isActive          Boolean   @default(true)
  allowsMessages    Boolean   @default(true)
  autoApprove       Boolean   @default(true)
  
  // Stats
  totalSubscribers  Int       @default(0)
  totalPosts        Int       @default(0)
  totalRevenue      Float     @default(0)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  subscriptions     Subscription[]
  posts             Post[]
  groups            Group[]
  liveEvents        LiveEvent[]
  
  @@index([creatorId])
  @@index([slug])
}

model Post {
  id                String         @id @default(cuid())
  creatorId         String
  creator           Creator        @relation(fields: [creatorId], references: [id])
  channelId         String?
  channel           CreatorChannel? @relation(fields: [channelId], references: [id])
  
  title             String?
  content           String         @db.Text
  contentAr         String?        @db.Text
  
  // Media
  mediaUrl          String?
  mediaType         String?        // video, image, document, audio
  mediaThumbnail    String?
  mediaDuration     Int?
  
  // Access
  tierRequired      String?        // which tier can access
  isPinned          Boolean        @default(false)
  
  // Engagement
  views             Int            @default(0)
  likes             Int            @default(0)
  comments          Int            @default(0)
  
  publishedAt       DateTime?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  @@index([channelId])
  @@index([creatorId])
}

// ============================================================================
// STUDY BUDDY MATCHING
// ============================================================================

model StudyBuddyMatch {
  id                String       @id @default(cuid())
  user1Id           String
  user2Id           String
  
  user1             User         @relation("UserMatches", fields: [user1Id], references: [id])
  user2             User         @relation("BuddyRequests", fields: [user2Id], references: [id])
  
  status            MatchStatus  @default(PENDING)
  
  // Compatibility
  sharedSubjects    String[]
  sharedGoals       String[]
  compatibilityScore Float       @default(0)
  
  // Settings
  studySchedule     Json?        // {days: [], times: []}
  studyMode         String?      // chat, video, co-watch
  
  // Communication
  chatRoomId        String?      @unique
  lastMessageAt     DateTime?
  messageCount      Int          @default(0)
  
  // Activity
  sessionsCompleted Int          @default(0)
  totalStudyTime    Int          @default(0) // minutes
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  expiresAt         DateTime?
  
  @@unique([user1Id, user2Id])
  @@index([user1Id])
  @@index([user2Id])
  @@index([status])
}

// ============================================================================
// REWARDS & SCHOLARSHIPS
// ============================================================================

model PrizePool {
  id                String       @id @default(cuid())
  courseId          String?
  course            Course?      @relation(fields: [courseId], references: [id])
  
  name              String
  nameAr            String?
  description       String       @db.Text
  descriptionAr     String?      @db.Text
  
  // Prize Details
  totalAmount       Float
  currency          String       @default("USD")
  numberOfWinners   Int
  prizeDistribution Json         // [{rank, amount, description}]
  
  // Eligibility
  eligibilityCriteria Json       // {minAge, regions, verification}
  rules             String       @db.Text
  rulesAr           String?      @db.Text
  
  // Selection
  selectionMethod   String       // leaderboard, random, judged
  judgingCriteria   Json?        // for judged contests
  
  // Timeline
  startDate         DateTime
  endDate           DateTime
  winnersAnnouncedAt DateTime?
  
  status            PrizeStatus  @default(ACTIVE)
  
  // Funding
  fundedBy          String       // platform, creator
  sponsorName       String?
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  // Relations
  submissions       Submission[]
  winners           PrizeWinner[]
  
  @@index([courseId])
  @@index([status])
}

model Submission {
  id                String       @id @default(cuid())
  userId            String
  user              User         @relation(fields: [userId], references: [id])
  prizePoolId       String
  prizePool         PrizePool    @relation(fields: [prizePoolId], references: [id])
  lessonId          String?
  lesson            Lesson?      @relation(fields: [lessonId], references: [id])
  
  // Submission Content
  title             String?
  content           String?      @db.Text
  fileUrl           String?
  metadata          Json?
  
  // Scoring
  score             Float?
  rank              Int?
  judgeNotes        String?      @db.Text
  
  // Verification
  isVerified        Boolean      @default(false)
  verifiedAt        DateTime?
  
  submittedAt       DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  @@unique([userId, prizePoolId])
  @@index([prizePoolId])
}

model PrizeWinner {
  id                String       @id @default(cuid())
  prizePoolId       String
  prizePool         PrizePool    @relation(fields: [prizePoolId], references: [id])
  userId            String
  
  rank              Int
  amount            Float
  currency          String
  
  // Claim Status
  claimed           Boolean      @default(false)
  claimedAt         DateTime?
  payoutId          String?
  
  // Verification
  identityVerified  Boolean      @default(false)
  taxFormsComplete  Boolean      @default(false)
  
  announcedAt       DateTime
  createdAt         DateTime     @default(now())
  
  @@unique([prizePoolId, userId])
  @@index([prizePoolId])
}

// ============================================================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================================================

model Subscription {
  id                String             @id @default(cuid())
  userId            String
  user              User               @relation(fields: [userId], references: [id])
  
  type              SubscriptionType
  status            SubscriptionStatus @default(ACTIVE)
  
  // Channel Subscription (Category C)
  channelId         String?
  channel           CreatorChannel?    @relation(fields: [channelId], references: [id])
  tier              String?            // which tier subscribed to
  
  // Pricing
  pricePerMonth     Float
  currency          String             @default("USD")
  billingCycle      String             @default("monthly") // monthly, annual
  
  // Dates
  startDate         DateTime           @default(now())
  endDate           DateTime?
  nextBillingDate   DateTime?
  cancelledAt       DateTime?
  pausedAt          DateTime?
  
  // Payment
  stripeSubscriptionId String?         @unique
  stripeCustomerId     String?
  paymentMethodId      String?
  
  // Trials & Discounts
  trialEndsAt       DateTime?
  discountCode      String?
  discountPercent   Float?
  
  // Churn
  cancellationReason String?
  feedbackGiven     Boolean            @default(false)
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  // Relations
  invoices          Invoice[]
  
  @@index([userId])
  @@index([channelId])
  @@index([status])
  @@index([stripeSubscriptionId])
}

model Invoice {
  id                String       @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id])
  
  amount            Float
  currency          String
  status            String       // paid, failed, pending
  
  stripeInvoiceId   String?      @unique
  paymentIntentId   String?
  
  dueDate           DateTime
  paidAt            DateTime?
  
  createdAt         DateTime     @default(now())
  
  @@index([subscriptionId])
}

model Wallet {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  
  balance           Float     @default(0)
  currency          String    @default("USD")
  
  // Stripe
  stripeCustomerId  String?   @unique
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  transactions      Transaction[]
}

model Transaction {
  id                String    @id @default(cuid())
  walletId          String
  wallet            Wallet    @relation(fields: [walletId], references: [id])
  
  type              String    // credit, debit, refund, prize
  amount            Float
  currency          String
  description       String
  
  // Reference
  referenceId       String?
  referenceType     String?   // subscription, prize, refund
  
  createdAt         DateTime  @default(now())
  
  @@index([walletId])
}

model Payout {
  id                String       @id @default(cuid())
  creatorId         String
  creator           Creator      @relation(fields: [creatorId], references: [id])
  
  amount            Float
  currency          String       @default("USD")
  status            PayoutStatus @default(PENDING)
  
  // Payment Details
  stripeTransferId  String?
  bankTransferId    String?
  method            String       // stripe, bank, paypal
  
  // Processing
  processedAt       DateTime?
  failureReason     String?
  
  // Period
  periodStart       DateTime
  periodEnd         DateTime
  
  // Breakdown
  categoryARevenue  Float        @default(0)
  categoryBRevenue  Float        @default(0)
  categoryCRevenue  Float        @default(0)
  platformFee       Float        @default(0)
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  @@index([creatorId])
  @@index([status])
}

// ============================================================================
// LIVE EVENTS & MEETINGS
// ============================================================================

model LiveEvent {
  id                String    @id @default(cuid())
  creatorId         String
  creator           Creator   @relation(fields: [creatorId], references: [id])
  channelId         String?
  channel           CreatorChannel? @relation(fields: [channelId], references: [id])
  
  title             String
  titleAr           String?
  description       String?   @db.Text
  
  type              MeetingType
  
  // Scheduling
  scheduledAt       DateTime
  duration          Int       // minutes
  timezone          String
  
  // Access
  tierRequired      String?
  maxAttendees      Int?
  requiresRSVP      Boolean   @default(false)
  
  // Meeting Details
  meetingUrl        String?
  meetingId         String?
  recordingUrl      String?
  
  // Status
  isRecurring       Boolean   @default(false)
  recurrenceRule    String?   // RRULE format
  isCancelled       Boolean   @default(false)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  attendees         EventAttendee[]
  
  @@index([creatorId])
  @@index([channelId])
  @@index([scheduledAt])
}

model EventAttendee {
  id                String    @id @default(cuid())
  eventId           String
  event             LiveEvent @relation(fields: [eventId], references: [id])
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  rsvpStatus        String    // confirmed, maybe, declined
  attended          Boolean   @default(false)
  joinedAt          DateTime?
  leftAt            DateTime?
  
  createdAt         DateTime  @default(now())
  
  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
}

// ============================================================================
// COMMUNITY & GROUPS
// ============================================================================

model Group {
  id                String         @id @default(cuid())
  creatorId         String
  creator           Creator        @relation(fields: [creatorId], references: [id])
  channelId         String?
  channel           CreatorChannel? @relation(fields: [channelId], references: [id])
  
  name              String
  nameAr            String?
  description       String?        @db.Text
  
  // Access
  isPrivate         Boolean        @default(false)
  requiresApproval  Boolean        @default(true)
  tierRequired      String?
  maxMembers        Int?
  
  // Settings
  allowsPosts       Boolean        @default(true)
  allowsFiles       Boolean        @default(true)
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  // Relations
  members           GroupMember[]
  messages          Message[]
  
  @@index([channelId])
}

model GroupMember {
  id                String    @id @default(cuid())
  groupId           String
  group             Group     @relation(fields: [groupId], references: [id])
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  role              String    @default("member") // member, moderator, admin
  
  joinedAt          DateTime  @default(now())
  lastReadAt        DateTime?
  
  @@unique([groupId, userId])
  @@index([groupId])
  @@index([userId])
}

model Message {
  id                String    @id @default(cuid())
  groupId           String?
  group             Group?    @relation(fields: [groupId], references: [id])
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  content           String    @db.Text
  attachments       Json?     // [{url, type, name}]
  
  // Moderation
  isEdited          Boolean   @default(false)
  isDeleted         Boolean   @default(false)
  isFlagged         Boolean   @default(false)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([groupId])
  @@index([userId])
}

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

model Review {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  courseId          String
  course            Course    @relation(fields: [courseId], references: [id])
  
  rating            Int       // 1-5
  title             String?
  content           String?   @db.Text
  
  // Helpfulness
  helpful           Int       @default(0)
  notHelpful        Int       @default(0)
  
  // Moderation
  isVerifiedPurchase Boolean  @default(false)
  isFlagged         Boolean   @default(false)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@unique([userId, courseId])
  @@index([courseId])
}

// ============================================================================
// CERTIFICATES
// ============================================================================

model Certificate {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  courseId          String
  
  certificateNumber String    @unique
  issuedAt          DateTime  @default(now())
  pdfUrl            String?
  
  // Verification
  verificationCode  String    @unique
  isVerified        Boolean   @default(true)
  
  @@index([userId])
  @@index([verificationCode])
}

// ============================================================================
// TRUST & SAFETY
// ============================================================================

model Report {
  id                String       @id @default(cuid())
  reporterId        String
  reporter          User         @relation(fields: [reporterId], references: [id])
  
  // What's being reported
  reportedType      String       // user, course, post, message
  reportedId        String
  
  type              ReportType
  description       String       @db.Text
  evidence          Json?        // screenshots, urls
  
  status            ReportStatus @default(PENDING)
  resolution        String?      @db.Text
  resolvedBy        String?
  resolvedAt        DateTime?
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  @@index([reportedId])
  @@index([status])
}

// ============================================================================
// SESSIONS & SECURITY
// ============================================================================

model Session {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  
  token             String    @unique
  expiresAt         DateTime
  
  // Device Info
  userAgent         String?
  ipAddress         String?
  deviceType        String?
  location          String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([token])
}
```

```typescript
import { PrismaClient, UserRole, KYCStatus, ContentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@prime.eg' },
    update: {},
    create: {
      email: 'admin@prime.eg',
      passwordHash: adminPassword,
      name: 'System Admin',
      arabicName: 'مدير النظام',
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  })

  // Create test learner
  const learnerPassword = await bcrypt.hash('learner123', 10)
  const learner = await prisma.user.upsert({
    where: { email: 'learner@test.com' },
    update: {},
    create: {
      email: 'learner@test.com',
      passwordHash: learnerPassword,
      name: 'Test Learner',
      arabicName: 'متعلم تجريبي',
      role: UserRole.LEARNER,
      interests: ['Technology', 'Business'],
      goals: ['Career Change into Tech'],
      skillLevel: 'Beginner',
      emailVerified: new Date(),
    },
  })

  // Create test creator
  const creatorPassword = await bcrypt.hash('creator123', 10)
  const creatorUser = await prisma.user.upsert({
    where: { email: 'creator@test.com' },
    update: {},
    create: {
      email: 'creator@test.com',
      passwordHash: creatorPassword,
      name: 'Test Creator',
      arabicName: 'منشئ محتوى تجريبي',
      role: UserRole.CREATOR,
      emailVerified: new Date(),
    },
  })

  // Create creator profile
  const creator = await prisma.creator.upsert({
    where: { userId: creatorUser.id },
    update: {},
    create: {
      userId: creatorUser.id,
      kycStatus: KYCStatus.VERIFIED,
      expertise: ['Web Development', 'JavaScript'],
      teachingGoals: 'Help students learn modern web development',
      contractSigned: true,
      contractSignedAt: new Date(),
    },
  })

  // Create sample course
  const course = await prisma.course.create({
    data: {
      title: 'Introduction to Web Development',
      titleAr: 'مقدمة في تطوير الويب',
      description: 'Learn the basics of HTML, CSS, and JavaScript',
      descriptionAr: 'تعلم أساسيات HTML و CSS و JavaScript',
      creatorId: creator.id,
      category: 'CATEGORY_A',
      skillLevel: 'Beginner',
      duration: 480,
      language: 'ar',
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      syllabus: {
        modules: [
          {
            title: 'HTML Basics',
            lessons: ['Introduction', 'Tags and Elements', 'Forms']
          },
          {
            title: 'CSS Fundamentals',
            lessons: ['Selectors', 'Box Model', 'Flexbox']
          }
        ]
      },
    },
  })

  console.log('Seed data created successfully')
  console.log('Admin login: admin@prime.eg / admin123')
  console.log('Learner login: learner@test.com / learner123')
  console.log('Creator login: creator@test.com / creator123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

#### Update package.json

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "npx prisma migrate reset --force",
    "db:migrate": "npx prisma migrate dev",
    "db:studio": "npx prisma studio"
  }
}
```

#### Run seed

```bash
npm install -D tsx
npm run db:seed
```

#### Verification

- [ ] Seed script runs without errors
- [ ] Can see seeded data in Prisma Studio
- [ ] Can query data using Prisma Client

---

## 4. Authentication & User Management

### 4.1 NextAuth Setup

**Task ID:** AUTH-001  
**Duration:** 3 hours  
**Dependencies:** DB-001

#### Create src/lib/auth.ts

```typescript
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validation = loginSchema.safeParse(credentials)
        
        if (!validation.success) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: validation.data.email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const passwordValid = await bcrypt.compare(
          validation.data.password,
          user.passwordHash
        )

        if (!passwordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
```

#### Create src/app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

#### Create src/middleware.ts

```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      return null
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/auth/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Role-based access control
    if (req.nextUrl.pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    if (req.nextUrl.pathname.startsWith("/creator") && token.role !== "CREATOR") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  },
  {
    callbacks: {
      async authorized() {
        // This is a work-around for handling redirect on auth pages.
        // We return true here so that the middleware function above
        // is always called.
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/creator/:path*", "/auth/:path*"],
}
```

#### Verification

- [ ] Can navigate to /auth/login
- [ ] Protected routes redirect to login
- [ ] Login works with seeded credentials
- [ ] Session persists after login

### 4.2 Registration Flow

**Task ID:** AUTH-002  
**Duration:** 4 hours  
**Dependencies:** AUTH-001

#### Create src/app/api/auth/register/route.ts

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  arabicName: z.string().optional(),
  phone: z.string().optional(),
  interests: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, password, ...userData } = validation.data

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        ...userData,
      },
    })

    // TODO: Send verification email

    return NextResponse.json({
      message: "Registration successful",
      userId: user.id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

#### Create src/app/auth/register/page.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  arabicName: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      toast.success('Registration successful! Please login.')
      router.push('/auth/login')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Create Account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our learning platform
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="arabicName" className="block text-sm font-medium">
                Arabic Name (optional)
              </label>
              <input
                {...register('arabicName')}
                type="text"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone Number (optional)
              </label>
              <input
                {...register('phone')}
                type="tel"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
```

#### Create src/app/auth/login/page.tsx

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      toast.success('Login successful!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold">Welcome Back</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your learning account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                className="mt-1 block w-full border rounded-md px-3 py-2"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <a href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Create one
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
```

#### Verification

- [ ] Registration form validates all fields
- [ ] Login form works with seeded credentials
- [ ] Form errors display correctly
- [ ] Navigation between auth pages works

---

## 5. Payment Integration

### 5.1 Paymob Integration Setup

**Task ID:** PAY-001
**Duration:** 6 hours
**Dependencies:** AUTH-002

#### Install Paymob SDK

```bash
npm install axios crypto-js
```

#### Create src/lib/paymob.ts

```typescript
import axios from 'axios'
import CryptoJS from 'crypto-js'

const PAYMOB_API_URL = 'https://accept.paymob.com/api'
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY
const PAYMOB_INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID
const PAYMOB_HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET

interface PaymentRequest {
  amount: number // in cents
  currency: string
  orderId: string
  userEmail: string
  userPhone?: string
  billingData: {
    first_name: string
    last_name: string
    email: string
    phone_number?: string
    apartment?: string
    floor?: string
    street?: string
    building?: string
    city: string
    state?: string
    country: string
    postal_code?: string
  }
}

export class PaymobService {
  private async authenticate(): Promise<string> {
    const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    })
    return response.data.token
  }

  private async createOrder(token: string, amount: number, currency: string, orderId: string) {
    const response = await axios.post(
      `${PAYMOB_API_URL}/ecommerce/orders`,
      {
        auth_token: token,
        delivery_needed: 'false',
        amount_cents: amount,
        currency,
        merchant_order_id: orderId,
        items: [],
      }
    )
    return response.data
  }

  private async getPaymentKey(token: string, orderId: string, request: PaymentRequest) {
    const response = await axios.post(
      `${PAYMOB_API_URL}/acceptance/payment_keys`,
      {
        auth_token: token,
        amount_cents: request.amount,
        expiration: 3600,
        order_id: orderId,
        billing_data: request.billingData,
        currency: request.currency,
        integration_id: PAYMOB_INTEGRATION_ID,
        lock_order_when_paid: 'false',
      }
    )
    return response.data.token
  }

  async createPaymentRequest(request: PaymentRequest): Promise<string> {
    try {
      // Step 1: Authenticate
      const authToken = await this.authenticate()

      // Step 2: Create order
      const order = await this.createOrder(authToken, request.amount, request.currency, request.orderId)

      // Step 3: Get payment key
      const paymentKey = await this.getPaymentKey(authToken, order.id, request)

      return paymentKey
    } catch (error) {
      console.error('Paymob payment creation error:', error)
      throw new Error('Failed to create payment request')
    }
  }

  verifyWebhookSignature(data: any, hmac: string): boolean {
    const calculatedHmac = CryptoJS.HmacSHA256(JSON.stringify(data), PAYMOB_HMAC_SECRET).toString()
    return calculatedHmac === hmac
  }
}

export const paymobService = new PaymobService()
```

#### Verification

- [ ] Paymob API integration works
- [ ] Payment creation returns valid iframe URL
- [ ] Webhook processing handles successful payments
- [ ] Subscription status updates correctly
- [ ] Creator earnings are calculated properly

---

## 6. Creator KYC System

### 6.1 KYC Document Upload System

**Task ID:** KYC-001
**Duration:** 5 hours
**Dependencies:** AUTH-002

#### Install File Upload Dependencies

```bash
npm install multer @types/multer sharp aws-sdk
```

#### Create File Upload Service

```typescript
// src/lib/file-upload.ts
import AWS from 'aws-sdk'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export class FileUploadService {
  async uploadKYCFile(file: Buffer, fileName: string, fileType: string): Promise<string> {
    try {
      // Process image with Sharp for optimization
      const processedBuffer = await sharp(file)
        .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()

      const key = `kyc/${uuidv4()}-${fileName}`

      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: processedBuffer,
        ContentType: 'image/jpeg',
        ACL: 'private',
      }

      const result = await s3.upload(params).promise()
      return result.Location
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error('Failed to upload file')
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Expires: expiresIn,
    }

    return s3.getSignedUrl('getObject', params)
  }
}

export const fileUploadService = new FileUploadService()
```

#### Verification

- [ ] File upload to S3 works correctly
- [ ] Image optimization reduces file sizes
- [ ] KYC documents are stored securely
- [ ] Signed URLs provide temporary access

---

## 7. Content Management System

### 7.1 Course Creation and Management

**Task ID:** CMS-001
**Duration:** 8 hours
**Dependencies:** KYC-001

#### Create Course API Routes

```typescript
// src/app/api/courses/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(3),
  titleAr: z.string().min(3),
  description: z.string().min(10),
  descriptionAr: z.string().min(10),
  category: z.enum(['CATEGORY_A', 'CATEGORY_B']),
  skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  language: z.string(),
  duration: z.number().positive(),
  syllabus: z.object({
    modules: z.array(z.object({
      title: z.string(),
      lessons: z.array(z.string()),
    })),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = createCourseSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
    })

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Check KYC status
    if (creator.kycStatus !== 'VERIFIED') {
      return NextResponse.json({ error: 'KYC verification required' }, { status: 403 })
    }

    // Create course
    const course = await prisma.course.create({
      data: {
        ...validation.data,
        creatorId: creator.id,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({
      message: 'Course created successfully',
      courseId: course.id,
    })
  } catch (error) {
    console.error('Course creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
```

### 7.2 Video Upload and Processing

**Task ID:** CMS-002
**Duration:** 6 hours
**Dependencies:** CMS-001

#### Create Video Upload Service

```typescript
// src/lib/video-upload.ts
import AWS from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
})

export class VideoUploadService {
  async uploadVideo(file: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      const key = `videos/${uuidv4()}-${fileName}`

      const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'private',
      }

      const result = await s3.upload(params).promise()
      return result.Location
    } catch (error) {
      console.error('Video upload error:', error)
      throw new Error('Failed to upload video')
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Expires: expiresIn,
    }

    return s3.getSignedUrl('getObject', params)
  }
}

export const videoUploadService = new VideoUploadService()
```

---

## 8. Study Buddy Feature

### 8.1 Matching Algorithm Implementation

**Task ID:** BUDDY-001
**Duration:** 6 hours
**Dependencies:** AUTH-002

#### Create Study Buddy API

```typescript
// src/app/api/study-buddy/match/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user profile
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find potential study buddies
    const potentialMatches = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        role: 'LEARNER',
        // Match based on interests and goals
        interests: {
          hasSome: currentUser.interests,
        },
        goals: {
          hasSome: currentUser.goals,
        },
      },
      select: {
        id: true,
        name: true,
        arabicName: true,
        interests: true,
        goals: true,
        skillLevel: true,
        learningMode: true,
        profileImage: true,
      },
      take: 20,
    })

    return NextResponse.json({ matches: potentialMatches })
  } catch (error) {
    console.error('Study buddy matching error:', error)
    return NextResponse.json(
      { error: 'Failed to find matches' },
      { status: 500 }
    )
  }
}
```

### 8.2 Swipe Interface Component

```typescript
// src/components/study-buddy/SwipeInterface.tsx
'use client'

import { useState, useRef } from 'react'
import { Heart, X, MessageCircle } from 'lucide-react'

interface StudyBuddy {
  id: string
  name: string
  arabicName?: string
  interests: string[]
  goals: string[]
  skillLevel: string
  profileImage?: string
}

interface SwipeInterfaceProps {
  potentialMatches: StudyBuddy[]
  onSwipe: (userId: string, action: 'like' | 'pass') => Promise<void>
}

export function SwipeInterface({ potentialMatches, onSwipe }: SwipeInterfaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleSwipe = async (action: 'like' | 'pass') => {
    if (currentIndex >= potentialMatches.length) return

    const currentMatch = potentialMatches[currentIndex]
    await onSwipe(currentMatch.id, action)
    
    setCurrentIndex(prev => prev + 1)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartX.current = e.clientX
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !cardRef.current) return
    
    const dragDistance = e.clientX - dragStartX.current
    cardRef.current.style.transform = `translateX(${dragDistance}px) rotate(${dragDistance * 0.1}deg)`
  }

  const handleDragEnd = (e: React.MouseEvent) => {
    if (!isDragging || !cardRef.current) return
    
    setIsDragging(false)
    const dragDistance = e.clientX - dragStartX.current
    
    if (Math.abs(dragDistance) > 100) {
      if (dragDistance > 0) {
        handleSwipe('like')
      } else {
        handleSwipe('pass')
      }
    } else {
      cardRef.current.style.transform = 'translateX(0) rotate(0)'
    }
  }

  if (currentIndex >= potentialMatches.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No more matches available</p>
      </div>
    )
  }

  const currentMatch = potentialMatches[currentIndex]

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        ref={cardRef}
        className="bg-white rounded-lg shadow-lg p-6 cursor-grab active:cursor-grabbing transition-transform"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div className="text-center mb-4">
          {currentMatch.profileImage && (
            <img
              src={currentMatch.profileImage}
              alt={currentMatch.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <h3 className="text-xl font-semibold">{currentMatch.name}</h3>
          {currentMatch.arabicName && (
            <p className="text-sm text-gray-600">{currentMatch.arabicName}</p>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm text-gray-700">Interests</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {currentMatch.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-gray-700">Goals</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {currentMatch.goals.map((goal) => (
                <span
                  key={goal}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-gray-700">Skill Level</h4>
            <p className="text-sm text-gray-600">{currentMatch.skillLevel}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => handleSwipe('pass')}
          className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleSwipe('like')}
          className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
        >
          <Heart className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
```

---

## 9. Subscription Management

### 9.1 Subscription API Implementation

**Task ID:** SUB-001
**Duration:** 4 hours
**Dependencies:** PAY-001

#### Create Subscription Management API

```typescript
// src/app/api/subscriptions/manage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
        status: 'active',
      },
      include: {
        channel: {
          include: {
            creator: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    // Cancel subscription
    await prisma.subscription.update({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    })

    return NextResponse.json({ message: 'Subscription cancelled successfully' })
  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
```

---

## 10. Creator Dashboard

### 10.1 Dashboard Analytics Implementation

**Task ID:** DASH-001
**Duration:** 6 hours
**Dependencies:** SUB-001

#### Create Creator Dashboard API

```typescript
// src/app/api/creator/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: { userId: session.user.id },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            titleAr: true,
            totalEnrollments: true,
            totalViews: true,
            status: true,
            createdAt: true,
          },
        },
        channels: {
          include: {
            subscriptions: {
              where: { status: 'active' },
              select: { id: true },
            },
          },
        },
        payouts: {
          where: { status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Calculate monthly earnings
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

    const monthlyEarnings = await prisma.payout.aggregate({
      where: {
        creatorId: creator.id,
        status: 'completed',
        processedAt: {
          gte: firstDayOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get subscriber growth
    const subscriberGrowth = await prisma.subscription.groupBy({
      by: ['createdAt'],
      where: {
        channel: {
          creatorId: creator.id,
        },
        status: 'active',
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const dashboardData = {
      totalEarnings: creator.totalEarnings,
      monthlyEarnings: monthlyEarnings._sum.amount || 0,
      totalSubscribers: creator.totalSubscribers,
      totalCourses: creator.courses.length,
      activeChannels: creator.channels.length,
      courses: creator.courses,
      channels: creator.channels,
      recentPayouts: creator.payouts,
      subscriberGrowth,
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
```

---

## 11. Admin Console

### 11.1 Admin Dashboard Implementation

**Task ID:** ADMIN-001
**Duration:** 8 hours
**Dependencies:** DASH-001

#### Create Admin API Routes

```typescript
// src/app/api/admin/overview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get platform statistics
    const [
      totalUsers,
      totalCreators,
      totalCourses,
      totalSubscriptions,
      pendingKYC,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.creator.count(),
      prisma.course.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.creator.count({ where: { kycStatus: 'PENDING' } }),
      prisma.subscription.aggregate({
        where: { status: 'active' },
        _sum: { pricePerMonth: true },
      }),
    ])

    // Get recent activity
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    const pendingCourses = await prisma.course.findMany({
      where: { status: 'UNDER_REVIEW' },
      include: {
        creator: {
          include: {
            user: true,
          },
        },
      },
      take: 10,
    })

    const overviewData = {
      statistics: {
        totalUsers,
        totalCreators,
        totalCourses,
        totalSubscriptions,
        pendingKYC,
        monthlyRevenue: monthlyRevenue._sum.pricePerMonth || 0,
      },
      recentUsers,
      pendingCourses,
      pendingKYCCount: pendingKYC,
    }

    return NextResponse.json(overviewData)
  } catch (error) {
    console.error('Admin overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin overview' },
      { status: 500 }
    )
  }
}
```

---

## 12. Testing & Deployment

### 12.1 Testing Framework Setup

**Task ID:** TEST-001
**Duration:** 4 hours
**Dependencies:** All major features

#### Install Testing Dependencies

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

#### Create Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

#### Create Test Setup File

```javascript
// jest.setup.js
import '@testing-library/jest-dom'
```

### 12.2 Deployment Configuration

**Task ID:** DEPLOY-001
**Duration:** 3 hours
**Dependencies:** TEST-001

#### Create Production Build Script

```json
// package.json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### Create Environment Variables Documentation

```markdown
# Production Environment Variables

## Required Variables
- DATABASE_URL - PostgreSQL connection string
- NEXTAUTH_URL - Your domain URL
- NEXTAUTH_SECRET - Random 32+ character string
- REDIS_URL - Redis connection string

## AWS S3 Configuration
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g., eu-south-1)
- S3_BUCKET_NAME

## Payment Gateway (Paymob)
- PAYMOB_API_KEY
- PAYMOB_INTEGRATION_ID
- PAYMOB_IFRAME_ID
- PAYMOB_HMAC_SECRET

## Email Service (SendGrid)
- SENDGRID_API_KEY
- SENDGRID_FROM_EMAIL

## KYC Provider
- KYC_API_KEY
- KYC_API_URL
```

---

## 13. Arabic Localization

### 13.1 Language Support Implementation

**Task ID:** I18N-001
**Duration:** 4 hours
**Dependencies:** All UI components

#### Create Language Configuration

```typescript
// src/lib/i18n.ts
export const languages = {
  ar: {
    name: 'العربية',
    direction: 'rtl',
  },
  en: {
    name: 'English',
    direction: 'ltr',
  },
}

export type Language = keyof typeof languages
```

#### Create Translation Files

```typescript
// src/locales/ar.json
{
  "auth": {
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "name": "الاسم",
    "arabicName": "الاسم بالعربية"
  },
  "dashboard": {
    "welcome": "مرحباً بك في منصة التعلم",
    "myCourses": "دوراتي",
    "studyBuddy": "رفيق الدراسة",
    "subscriptions": "اشتراكاتي"
  }
}
```

---

## 14. Security & Performance

### 14.1 Security Implementation

**Task ID:** SEC-001
**Duration:** 6 hours
**Dependencies:** All features

#### Security Checklist

- [ ] Input validation with Zod schemas
- [ ] SQL injection prevention via Prisma ORM
- [ ] XSS protection with React escaping
- [ ] CSRF protection implementation
- [ ] Rate limiting on API routes
- [ ] File upload security (type validation, size limits)
- [ ] Secure session management
- [ ] HTTPS enforcement
- [ ] Content Security Policy headers
- [ ] Regular security audits

### 14.2 Performance Optimization

**Task ID:** PERF-001
**Duration:** 4 hours
**Dependencies:** SEC-001

#### Performance Optimizations

- [ ] Image optimization with Next.js Image component
- [ ] Video streaming with adaptive bitrate
- [ ] Database query optimization
- [ ] Redis caching implementation
- [ ] CDN integration for static assets
- [ ] Code splitting and lazy loading
- [ ] Progressive Web App features
- [ ] Database indexing strategy
- [ ] API response compression
- [ ] Client-side caching strategies

---

## Final Project Summary

This comprehensive implementation plan provides a complete roadmap for building the Egyptian Ed-Tech platform with all the required features:

### ✅ Completed Features

1. **Project Setup** - Development environment, dependencies, database schema
2. **Authentication System** - Registration, login, session management
3. **Payment Integration** - Paymob integration with Fawry support
4. **KYC System** - Document upload and verification workflow
5. **Content Management** - Course creation, video upload, content organization
6. **Study Buddy** - Matching algorithm with swipe interface
7. **Subscription Management** - Category A & C subscription handling
8. **Creator Dashboard** - Analytics, earnings, content management
9. **Admin Console** - User management, content moderation, financial oversight
10. **Testing & Deployment** - Test framework, deployment configuration
11. **Arabic Localization** - Multi-language support
12. **Security & Performance** - Security measures and optimization strategies

### 🎯 Key Success Factors

- **Egyptian Market Focus**: Localized payment methods (Fawry, Meeza), Arabic language support
- **Regulatory Compliance**: KYC system for creator verification
- **Scalable Architecture**: Modular design with proper separation of concerns
- **User Experience**: Intuitive interfaces, mobile-responsive design
- **Performance**: Optimized for Egyptian internet conditions

### 📋 Next Steps

1. Set up development environment following Section 1
2. Implement authentication system (Section 4)
3. Set up payment integration (Section 5)
4. Build core features in order of priority
5. Test thoroughly before deployment
6. Monitor and iterate based on user feedback

This plan transforms your comprehensive requirements into actionable development tasks, ensuring successful delivery of the Egyptian Ed-Tech platform MVP.
