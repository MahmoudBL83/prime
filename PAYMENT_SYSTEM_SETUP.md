# Payment System Setup Guide

This guide covers the complete setup for the Stripe payment system with email payment links.

## ✅ Fixed Issues

1. **Prisma Schema Error** - Fixed duplicate `blockedUsers` field conflict by renaming message blocking relations
2. **Payment Flow** - Implemented Stripe Checkout Session with email payment links
3. **Verification System** - Added payment verification and subscription activation

## 📋 Prerequisites

1. Stripe account (sign up at https://stripe.com)
2. Email service (Gmail with App Password or another SMTP provider)

## 🔧 Setup Steps

### 1. Run Database Migration

```powershell
npx prisma migrate dev --name add-payment-and-messaging-features
```

This will create:
- `MessageRequest` table
- `BlockedUser` table  
- `PaymentLink` table

### 2. Configure Stripe

#### A. Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)

#### B. Add to `.env` file

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL for redirects
NEXTAUTH_URL=http://localhost:3000
```

### 3. Set Up Stripe Webhook

#### A. Install Stripe CLI (for local development)

```powershell
# Download from: https://stripe.com/docs/stripe-cli
# Or use Scoop on Windows:
scoop install stripe

# Login to Stripe
stripe login
```

#### B. Forward Webhooks to Local

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret (starts with `whsec_`). Add it to your `.env` file.

#### C. For Production

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.deleted`
5. Copy the webhook secret to your production `.env`

### 4. Configure Email Service (Gmail)

We now send payment links using Gmail + Nodemailer. Update these functions if you switch providers:
- `src/app/api/payments/create-link/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

#### A. Create a Gmail App Password
1. Enable 2-Step Verification on the Gmail account you want to send from.
2. Visit [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Generate an "App Password" for "Mail" on "Other (Custom name)".
4. Copy the 16-character password (no spaces).

#### B. Add credentials to `.env`

```env
# Gmail SMTP (App Password)
GMAIL_USER=youremail@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

#### C. Deploy Variables
Add the same `GMAIL_USER` and `GMAIL_APP_PASSWORD` values to your hosting provider or CI/CD secrets so production can send emails.

> ✅ The API will now throw an error if Gmail credentials are missing, preventing the UI from claiming that the email was sent when it was not.

## 🎯 How It Works

### User Flow

1. **User clicks "Accept Offer"**
   - If not logged in → Shows sign-in modal
   - If logged in → Shows payment modal

2. **Payment Modal**
   - Displays subscription details
   - Shows user's email
   - User clicks "Send Payment Link"

3. **Backend Creates Payment Link**
   - Creates Stripe Checkout Session
   - Saves to `PaymentLink` table
   - Sends email with secure link
   - Link expires in 24 hours

4. **User Receives Email**
   - Opens email
   - Clicks payment link
   - Redirected to Stripe Checkout

5. **User Completes Payment**
   - Enters card details on Stripe
   - Stripe processes payment
   - Sends webhook to your server

6. **Webhook Verifies Payment**
   - Updates `PaymentLink` to PAID
   - Creates/updates `Subscription` record
   - User redirected to success page

7. **Success Page**
   - Verifies payment was successful
   - Shows confirmation
   - Redirects to My Learning

## 📁 New Files Created

### API Routes
- ✅ `/api/payments/create-link/route.ts` - Creates Stripe payment link
- ✅ `/api/payments/verify/route.ts` - Verifies payment completion
- ✅ `/api/webhooks/stripe/route.ts` - Handles Stripe webhooks
- ✅ `/api/mentors/my-mentors/route.ts` - Fetches user's mentors
- ✅ `/api/study-buddies/my-buddies/route.ts` - Fetches study buddies
- ✅ `/api/users/recommended/route.ts` - Fetches recommended users
- ✅ `/api/messaging/requests/route.ts` - Fetches message requests
- ✅ `/api/messaging/requests/[requestId]/approve/route.ts` - Approve request
- ✅ `/api/messaging/requests/[requestId]/reject/route.ts` - Reject request
- ✅ `/api/messaging/requests/[requestId]/block/route.ts` - Block sender

### Pages
- ✅ `/[locale]/payment-success/page.tsx` - Payment success page

### Components
- ✅ Updated `PaymentModal.tsx` - New email payment link UI

### Database Models
- ✅ `MessageRequest` - Tracks message requests
- ✅ `BlockedUser` - Tracks blocked users in messaging
- ✅ `PaymentLink` - Tracks payment links sent to users

## 🧪 Testing

### Test the Payment Flow

1. Start your development server:
```powershell
npm run dev
```

2. Start Stripe webhook forwarding:
```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

3. Test the flow:
   - Go to `/courses`
   - Click "Accept Offer"
   - Sign in if needed
   - Click "Send Payment Link"
   - Check console for email output (or your email if configured)
   - Click the payment link
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete payment
   - Should redirect to success page

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`

## 🔒 Security Notes

1. **Never commit** `.env` file to git
2. Use **test keys** in development
3. Use **webhook secrets** to verify Stripe events
4. Payment links **expire after 24 hours**
5. All payment processing happens on **Stripe's servers**
6. User cards are **never** stored in your database

## 📊 Database Schema

```prisma
model PaymentLink {
  id               String            @id @default(cuid())
  userId           String
  email            String
  stripePaymentUrl String
  stripeSessionId  String?           @unique
  amount           Float
  currency         String            @default("eur")
  description      String?
  status           PaymentLinkStatus @default(PENDING)
  expiresAt        DateTime?
  paidAt           DateTime?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  
  user User @relation("UserPaymentLinks", fields: [userId], references: [id])
}

enum PaymentLinkStatus {
  PENDING
  PAID
  EXPIRED
  CANCELLED
}
```

## 🎨 UI Features

### Payment Modal
- ✅ Clean Apple TV design
- ✅ Shows subscription details
- ✅ Displays user email
- ✅ Loading states
- ✅ Success confirmation
- ✅ Next steps guide

### Success Page
- ✅ Payment verification
- ✅ Loading animation
- ✅ Success confirmation
- ✅ Subscription benefits
- ✅ Auto-redirect to My Learning

## 🐛 Troubleshooting

### Payment link not sent
- Check Stripe keys in `.env`
- Verify user is logged in
- Check console for errors

### Webhook not working
- Ensure Stripe CLI is running
- Check webhook secret matches
- Verify endpoint URL

### Payment not verified
- Check webhook is receiving events
- Verify database connection
- Check PaymentLink table

## 📚 Additional Resources

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

## ✨ Features Implemented

1. ✅ Stripe Checkout Session
2. ✅ Email payment links (24hr expiry)
3. ✅ Payment verification system
4. ✅ Automatic subscription activation
5. ✅ Webhook handling
6. ✅ Success page with verification
7. ✅ Email notifications (template ready)
8. ✅ Messaging tabs (Mentors, Study Buddies, Recommended)
9. ✅ Message request system
10. ✅ User blocking system

All systems are ready for production! 🚀
