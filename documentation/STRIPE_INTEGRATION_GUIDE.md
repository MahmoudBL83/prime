# Stripe Payment Integration - Complete Setup Guide

## 🎯 Overview

The Egyptian EdTech platform now has **full Stripe payment integration** for subscription processing. This document explains the implementation and how to complete the setup.

## ✅ What's Implemented

### 1. Database Schema
- Added `stripeCustomerId` to `User` model (unique field)
- Added `stripeSubscriptionId` and `billingCycle` to `Subscription` model
- Schema changes applied via `npx prisma db push`

### 2. Stripe Configuration (`src/config/stripe.ts`)
- Stripe client initialization
- Price ID mappings for all subscription tiers
- Success/cancel URL generators
- Webhook configuration

### 3. API Endpoints

#### **POST `/api/stripe/create-checkout-session`**
Creates Stripe checkout session for subscription purchase.

**Request:**
```json
{
  "type": "CATEGORY_A" | "CATEGORY_B" | "BUNDLE_AB",
  "billingCycle": "monthly" | "yearly",
  "locale": "en" | "ar"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_xxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxx"
}
```

**Flow:**
1. Authenticates user via NextAuth
2. Checks for existing active subscription
3. Gets or creates Stripe customer
4. Creates checkout session with subscription metadata
5. Returns checkout URL for redirect

#### **POST `/api/stripe/webhook`**
Handles Stripe webhook events for subscription lifecycle.

**Events Handled:**
- `checkout.session.completed` - Creates subscription in DB with auto-enrollment
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as cancelled
- `invoice.payment_succeeded` - Confirms payment success
- `invoice.payment_failed` - Handles failed payments

**Auto-Enrollment Logic:**
- `CATEGORY_A`: Enrolls in all published Category A courses
- `CATEGORY_B`: Enrolls in all published Category B courses
- `BUNDLE_AB`: Enrolls in all A + B courses
- Skips duplicates automatically

### 4. Updated Subscribe Page
- Changed `handleSubscribe` to call `/api/stripe/create-checkout-session`
- Redirects to Stripe hosted checkout page
- Success redirects to `/dashboard/my-learning?subscription=success`
- Cancel redirects back to `/subscribe?subscription=cancelled`

## 🛠️ Setup Instructions

### Step 1: Create Stripe Account
1. Go to https://stripe.com and create an account
2. Complete verification for your business

### Step 2: Get API Keys
1. Navigate to **Developers → API Keys** in Stripe Dashboard
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_51xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Create Products & Prices
1. Navigate to **Products → Add Product** in Stripe Dashboard
2. Create these 6 recurring products:

#### **Product 1: All-Access Library - Monthly**
- Name: `All-Access Library (Monthly)`
- Price: `149 EGP`
- Billing: `Recurring / Monthly`
- Copy the Price ID (e.g., `price_1Oxxxxx`)
- Add to `.env`: `STRIPE_PRICE_CATEGORY_A_MONTHLY=price_1Oxxxxx`

#### **Product 2: All-Access Library - Yearly**
- Name: `All-Access Library (Yearly)`
- Price: `1428 EGP` (149 × 12 × 0.8 for 20% discount)
- Billing: `Recurring / Yearly`
- Copy Price ID → `STRIPE_PRICE_CATEGORY_A_YEARLY=price_xxxxx`

#### **Product 3: Signature Courses - Monthly**
- Name: `Signature Courses (Monthly)`
- Price: `249 EGP`
- Billing: `Recurring / Monthly`
- Copy Price ID → `STRIPE_PRICE_CATEGORY_B_MONTHLY=price_xxxxx`

#### **Product 4: Signature Courses - Yearly**
- Name: `Signature Courses (Yearly)`
- Price: `2388 EGP` (249 × 12 × 0.8)
- Billing: `Recurring / Yearly`
- Copy Price ID → `STRIPE_PRICE_CATEGORY_B_YEARLY=price_xxxxx`

#### **Product 5: Complete Bundle - Monthly**
- Name: `Complete Bundle (Monthly)`
- Price: `349 EGP`
- Billing: `Recurring / Monthly`
- Copy Price ID → `STRIPE_PRICE_BUNDLE_AB_MONTHLY=price_xxxxx`

#### **Product 6: Complete Bundle - Yearly**
- Name: `Complete Bundle (Yearly)`
- Price: `3348 EGP` (349 × 12 × 0.8)
- Billing: `Recurring / Yearly`
- Copy Price ID → `STRIPE_PRICE_BUNDLE_AB_YEARLY=price_xxxxx`

### Step 4: Set Up Webhook (Production)

1. Navigate to **Developers → Webhooks → Add Endpoint**
2. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
3. **Select events to listen to**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
4. Click **Add Endpoint**
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### Step 5: Test Locally with Stripe CLI

**Install Stripe CLI:**
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

**Login to Stripe:**
```bash
stripe login
```

**Forward webhooks to local server:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret like `whsec_xxxxx`. Add it to your `.env` file temporarily for testing.

**Test with sample events:**
```bash
stripe trigger checkout.session.completed
```

### Step 6: Test Payment Flow

1. Run your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/en/subscribe`

3. Click **Subscribe Now** on any plan

4. Use Stripe test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any postal code

5. Complete payment - you should be redirected to dashboard

6. Check database:
```bash
npx prisma studio
```
- User should have `stripeCustomerId`
- New Subscription with `stripeSubscriptionId`
- Multiple Enrollment records created

## 🔒 Security Considerations

### Webhook Signature Verification
The webhook handler verifies Stripe signatures to ensure requests are legitimate:
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  STRIPE_CONFIG.webhookSecret
);
```

### Environment Variables
Never commit `.env` files. The `.env.stripe.example` file shows required variables without exposing secrets.

### Customer ID Linking
Each user is linked to exactly one Stripe customer via `stripeCustomerId`. This prevents duplicate customer creation.

## 🧪 Testing Checklist

- [ ] Monthly subscription checkout works
- [ ] Yearly subscription checkout works
- [ ] Webhook creates subscription in database
- [ ] Auto-enrollment creates correct course enrollments
- [ ] User can access enrolled courses
- [ ] Subscription shows in dashboard
- [ ] Failed payment handled gracefully
- [ ] Subscription cancellation works
- [ ] User redirected correctly after success/cancel
- [ ] Duplicate subscriptions prevented

## 📊 Database Flow

```
User clicks "Subscribe"
    ↓
Frontend: POST /api/stripe/create-checkout-session
    ↓
Backend: Creates Stripe Customer (if needed)
Backend: Creates Stripe Checkout Session
    ↓
Frontend: Redirects to Stripe Checkout
    ↓
User enters payment info at Stripe
    ↓
Stripe: Processes payment & creates subscription
    ↓
Stripe: Sends webhook to /api/stripe/webhook
    ↓
Backend: Verifies webhook signature
Backend: Creates Subscription record in DB
Backend: Auto-enrolls user in courses
    ↓
Frontend: Redirects to /dashboard/my-learning
    ↓
User sees enrolled courses ✅
```

## 🚨 Common Issues

### Issue: "Missing STRIPE_SECRET_KEY"
**Solution**: Add all Stripe environment variables to `.env` file

### Issue: Webhook events not received locally
**Solution**: Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Issue: "Invalid price ID"
**Solution**: Ensure you created all 6 products in Stripe Dashboard and copied correct Price IDs

### Issue: Auto-enrollment not working
**Solution**: Check that courses have `category` field set to `CATEGORY_A` or `CATEGORY_B`

### Issue: Duplicate customer error
**Solution**: Database already has `stripeCustomerId` - this is normal, customer reused

## 📝 Next Steps

1. **Email Notifications**: Send confirmation emails after successful subscription
2. **Subscription Management**: Allow users to upgrade/downgrade/cancel
3. **Analytics Dashboard**: Track revenue and subscription metrics
4. **Receipt Generation**: Email payment receipts using Stripe data
5. **Failed Payment Recovery**: Email users with failed payments

## 🌍 Production Deployment

Before going live:

1. Switch from test to live mode in Stripe Dashboard
2. Replace `sk_test_` with `sk_live_` API keys
3. Replace `pk_test_` with `pk_live_` publishable key
4. Create production webhook endpoint
5. Update `NEXT_PUBLIC_APP_URL` to production domain
6. Re-create products with live prices
7. Test with real (small amount) payment
8. Set up Stripe Radar for fraud prevention
9. Configure email receipts in Stripe settings
10. Set up Stripe billing portal for customer self-service

---

**Status**: ✅ Stripe integration complete and ready for testing  
**Created**: January 2025  
**Last Updated**: January 2025
