# PRIME Subscription & Enrollment Model

## Overview

The PRIME platform uses a **subscription-based, auto-enrollment model** with **NO shopping cart**. This document explains the complete system architecture and user flows.

---

## Content Categories

### Category A: All-Access Library
- **Access Model**: Subscription-only (monthly/yearly)
- **Content**: 500+ courses from various creators
- **Pricing**: 199 EGP/month or 1910 EGP/year (20% discount)
- **Auto-Enrollment**: YES - instant access to all Category A courses
- **Individual Purchase**: NO
- **Target Audience**: Learners who want broad access to learning content

### Category B: Signature Courses
- **Access Model**: Subscription-only (monthly/yearly) OR bundled with A
- **Content**: Premium, editorially-curated courses
- **Pricing**: 149 EGP/month or 1140 EGP/year (20% discount)
- **Auto-Enrollment**: YES - instant access to all Category B courses
- **Individual Purchase**: NO (was considered, decided against for simplicity)
- **Target Audience**: Learners seeking high-quality, vetted content

### Category C: Creator Channels
- **Access Model**: Per-creator subscription with tiered membership
- **Content**: Exclusive content from individual creators
- **Pricing**: 79 EGP/month (base) or 760 EGP/year
  - **Tiers**: Basic (1.0x), Premium (1.5x), VIP (2.0x)
- **Auto-Enrollment**: YES - access to that creator's courses and content
- **Individual Purchase**: NO
- **Features**: Live sessions, community access, direct interaction

---

## Subscription Bundles

### Bundle A+B
- **Price**: 299 EGP/month or 2870 EGP/year (20% discount)
- **Access**: All Category A + Category B courses
- **Savings**: 49 EGP/month vs separate subscriptions

### Bundle A+B+C (Everything)
- **Price**: 399 EGP/month or 3830 EGP/year (20% discount)
- **Access**: ALL courses across all categories
- **Savings**: Maximum discount for comprehensive access

---

## Why NO Shopping Cart?

Based on the PRIME blueprint, we eliminated the traditional e-commerce cart for these reasons:

### 1. **Subscription-First Business Model**
- Focus on recurring revenue, not one-time transactions
- Simpler user experience - subscribe and get instant access
- Reduces decision fatigue (no "which courses should I buy?")

### 2. **All-Access Library Philosophy**
- Category A is like "Netflix for education" - you don't buy individual movies
- Encourages exploration and discovery
- Higher perceived value

### 3. **Technical Simplification**
- No cart state management
- No checkout flow complexity
- No abandoned cart recovery needed
- Simpler payment integration (subscription webhooks only)

### 4. **Auto-Enrollment Benefits**
- Instant gratification - subscribe and start learning immediately
- No additional "enroll" action required
- Automatic access to new courses as they're added

---

## Database Schema

### Key Models

```prisma
enum ContentCategory {
  CATEGORY_A  // All-Access Library
  CATEGORY_B  // Signature Courses
  CATEGORY_C  // Creator Channel content
}

enum SubscriptionType {
  CATEGORY_A        // All-Access only
  CATEGORY_B        // Signature only
  CATEGORY_C        // Creator Channel
  BUNDLE_AB         // A + B bundle
  BUNDLE_ABC        // Everything
}

model Course {
  contentCategory  ContentCategory  // Determines access model
  price            Float?           // NULL for A/B, optional for C
  // ... other fields
}

model Subscription {
  type             SubscriptionType
  channelId        String?          // For CATEGORY_C
  status           String           // ACTIVE, CANCELLED, EXPIRED
  startDate        DateTime
  endDate          DateTime?
  // ... payment fields
}

model Enrollment {
  // Created automatically when user subscribes
  // NOT created manually by user
  progress         Float
  lastAccessedAt   DateTime?
  completedAt      DateTime?
}
```

---

## User Flows

### 1. New User Journey

```
1. User visits platform → Browse courses
2. Clicks "Watch Course" → Sees subscription prompt
3. Chooses subscription tier:
   - Category A (All-Access)
   - Category B (Signature) 
   - Bundle A+B
   - Creator Channel (Category C)
4. Completes payment → Subscription ACTIVE
5. **AUTO-ENROLLED** in all relevant courses
6. Immediately starts learning
```

### 2. Existing Subscriber Journey

```
1. User logs in → Dashboard shows "My Learning"
2. Sees all courses they have access to via subscriptions
3. Courses organized by:
   - Continue Watching (in progress)
   - Completed
   - Recommended (not started but have access)
4. Clicks any course → Auto-enrolled if not already
5. Starts watching → Progress tracked
```

### 3. Subscription Management

```
1. User visits Account → Subscriptions
2. Sees active subscriptions with:
   - Type (Category A/B/C)
   - Status (Active/Cancelled)
   - Next billing date
   - Access details
3. Can:
   - Upgrade (A → A+B → A+B+C)
   - Add creator channels
   - Cancel (retains access until end of period)
4. Cannot:
   - Downgrade mid-period (must cancel and resubscribe)
```

---

## API Endpoints

### Subscription Management

#### `POST /api/subscriptions/subscribe`
Creates new subscription and auto-enrolls user.

**Request:**
```json
{
  "type": "CATEGORY_A" | "CATEGORY_B" | "CATEGORY_C" | "BUNDLE_AB" | "BUNDLE_ABC",
  "channelId": "string", // Required for CATEGORY_C
  "tier": "Basic" | "Premium" | "VIP", // Required for CATEGORY_C
  "billingCycle": "monthly" | "yearly",
  "paymentMethodId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "type": "CATEGORY_A",
    "status": "ACTIVE",
    "pricePerMonth": 199
  },
  "enrollmentCount": 523 // How many courses they now have access to
}
```

#### `POST /api/subscriptions/cancel`
Cancels subscription but retains access until end of billing period.

#### `GET /api/subscriptions/status`
Returns user's current subscriptions and what they have access to.

**Response:**
```json
{
  "subscriptions": [...],
  "access": {
    "hasCategoryA": true,
    "hasCategoryB": false,
    "categoryCChannels": [...]
  },
  "enrollmentCount": 523,
  "availableCourseCounts": {
    "categoryA": 523,
    "categoryB": 87,
    "categoryC": 142
  }
}
```

### Learning Dashboard

#### `GET /api/my-learning`
Returns all courses user has access to based on subscriptions.

**Response:**
```json
{
  "stats": {
    "totalAccessibleCourses": 610,
    "totalEnrolled": 45,
    "inProgress": 12,
    "completed": 8,
    "notStarted": 565
  },
  "courses": {
    "continueWatching": [...],
    "completed": [...],
    "recommended": [...]
  }
}
```

---

## Access Control Logic

### Course Access Checker (`lib/subscription-access.ts`)

```typescript
// Check if user has access to a specific course
const access = await checkCourseAccess(userId, courseId)

// Returns:
{
  hasAccess: boolean,
  reason?: string,
  subscriptionType?: string
}

// Logic:
- Category A courses → Requires CATEGORY_A, BUNDLE_AB, or BUNDLE_ABC
- Category B courses → Requires CATEGORY_B, BUNDLE_AB, or BUNDLE_ABC  
- Category C courses → Requires creator's CATEGORY_C subscription or BUNDLE_ABC
```

### Auto-Enrollment

When user subscribes:
1. Transaction begins
2. Create subscription record
3. Query relevant courses based on subscription type
4. Create/upsert enrollment records for ALL matching courses
5. Commit transaction
6. User has instant access

**Implementation:**
```typescript
// In subscribe endpoint
const enrollments = await autoEnrollUser(tx, userId, subscriptionType, channelId)

// Category A → Enrolls in ALL Category A courses
// Category B → Enrolls in ALL Category B courses
// Category C → Enrolls in specific creator's courses
// Bundle AB → Enrolls in Category A + B courses
// Bundle ABC → Enrolls in ALL courses
```

---

## Frontend Components

### Subscribe Page (`/subscribe`)
- Shows 2-5 subscription tiers with clear benefits
- Monthly/Yearly toggle with 20% discount badge
- Pricing calculator
- "Subscribe Now" button → Direct to payment
- NO "Add to Cart" button

### Course Detail Page
- **If not subscribed**: "Subscribe to Watch" button
- **If subscribed**: "Start Watching" button → Auto-enrolls and plays
- Shows which subscription tier grants access
- Displays subscription upgrade prompts if needed

### My Learning Dashboard (`/dashboard/my-learning`)
- Three tabs:
  1. **Continue Watching**: In-progress courses
  2. **Completed**: Finished courses with certificates
  3. **Explore**: Courses they have access to but haven't started
- Filtered by active subscriptions
- No "enroll" buttons - all accessible courses are ready to watch

---

## Payment Integration

### Paymob Integration (Egyptian Market)
1. User selects subscription → Redirect to Paymob
2. Paymob processes payment → Webhook to `/api/payments/webhook`
3. Webhook validates payment → Creates subscription
4. Auto-enrollment triggered → User receives email
5. User redirected to dashboard → Can start learning

### Stripe (International - Future)
1. Create Stripe subscription with recurring billing
2. Store `stripeSubscriptionId` in Subscription model
3. Handle webhooks for:
   - `subscription.created`
   - `invoice.payment_succeeded`
   - `subscription.updated`
   - `subscription.deleted`

---

## Key Decisions

### ✅ Implemented
- **No shopping cart** - Subscription-only model
- **Auto-enrollment** - Instant access upon subscription
- **Bundle pricing** - Discounts for combined subscriptions
- **Category system** - Clear content tiers (A/B/C)
- **Access-based learning** - Dashboard shows only accessible courses

### ❌ Not Implemented (By Design)
- Individual course purchases
- Course bundles (replaced by subscription bundles)
- "Add to Cart" functionality
- Manual enrollment process
- Course gift cards (future consideration)
- Pay-per-view courses

### 🔮 Future Enhancements
- **Family Plans**: Multiple user accounts under one subscription
- **Student Discounts**: Verified .edu email discounts
- **Corporate Licenses**: Team/enterprise subscriptions
- **Trial Periods**: 7-day free trial for Category A
- **Subscription Gifting**: Buy subscription for others

---

## Migration Path

For existing platforms with cart systems, migration steps:

1. **Phase 1**: Add subscription alongside existing cart
2. **Phase 2**: Encourage subscription with incentives
3. **Phase 3**: Grandfather existing course purchases
4. **Phase 4**: Remove cart, keep course access for legacy users
5. **Phase 5**: Migrate remaining users to subscription

---

## Summary

**PRIME uses subscription-based auto-enrollment because:**
- ✅ Simpler user experience
- ✅ Predictable recurring revenue
- ✅ Encourages course exploration
- ✅ Aligns with streaming service model
- ✅ Reduces technical complexity
- ✅ Better for learner engagement (access to everything)

**No cart needed because:**
- ❌ Courses are not sold individually
- ❌ No product combinations to manage
- ❌ Single-click subscribe is faster
- ❌ Reduces abandoned cart issues
- ❌ Subscription model is primary revenue

This approach maximizes learning engagement while simplifying both user experience and technical implementation.
