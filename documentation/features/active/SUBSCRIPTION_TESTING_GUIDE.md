# Subscription System Testing Guide

## ✅ Completed Steps

1. **Database Migration** ✅
   - Added `contentCategory` field to Course model
   - Added `ContentCategory` enum (A/B/C)
   - Expanded `SubscriptionType` enum (added BUNDLE_AB, BUNDLE_ABC)
   - Migration ran successfully

2. **Course Data Migration** ✅
   - Updated 17 existing courses
   - Categorized: 5 Category A, 12 Category B, 0 Category C
   - Set prices to NULL for subscription-only courses (A & B)

3. **Subscribe Page Updated** ✅
   - Shows all 5 subscription options (A, B, C, AB, ABC)
   - Monthly/Yearly toggle with 20% discount
   - Real-time course counts
   - Bundle savings displayed
   - Auto-access messaging

## 🧪 Test Plan

### Test 1: Subscribe to Category A
**Expected Behavior:**
1. User clicks "Subscribe Now" on Category A
2. API creates subscription
3. User auto-enrolled in ALL 5 Category A courses
4. Response shows `enrollmentCount: 5`
5. User redirected to My Learning dashboard

**Test Command:**
```bash
# From browser console or API tool:
POST /api/subscriptions/subscribe
{
  "type": "CATEGORY_A",
  "billingCycle": "monthly",
  "paymentMethodId": "test_pm_123"
}
```

**Verify:**
```sql
-- Check subscription created
SELECT * FROM Subscription WHERE userId = '<user_id>';

-- Check enrollments created
SELECT COUNT(*) FROM Enrollment WHERE userId = '<user_id>';
-- Should be 5 (all Category A courses)

-- Check course access
SELECT c.title, c.contentCategory 
FROM Enrollment e 
JOIN Course c ON e.courseId = c.id 
WHERE e.userId = '<user_id>';
```

### Test 2: Subscribe to Bundle A+B
**Expected Behavior:**
1. User subscribes to BUNDLE_AB
2. Auto-enrolled in Category A (5) + Category B (12) = 17 courses
3. `enrollmentCount: 17`
4. Savings shown: 49 EGP/month or 590 EGP/year

**Test Command:**
```bash
POST /api/subscriptions/subscribe
{
  "type": "BUNDLE_AB",
  "billingCycle": "yearly",
  "paymentMethodId": "test_pm_456"
}
```

**Verify:**
```sql
SELECT COUNT(*) FROM Enrollment WHERE userId = '<user_id>';
-- Should be 17 (all courses)
```

### Test 3: Check Subscription Status
**Test Command:**
```bash
GET /api/subscriptions/status
```

**Expected Response:**
```json
{
  "subscriptions": [...],
  "access": {
    "hasCategoryA": true,
    "hasCategoryB": true,
    "categoryCChannels": []
  },
  "enrollmentCount": 17,
  "availableCourseCounts": {
    "categoryA": 5,
    "categoryB": 12,
    "categoryC": 0
  },
  "hasActiveSubscription": true
}
```

### Test 4: My Learning Dashboard
**Test Command:**
```bash
GET /api/my-learning
```

**Expected Response:**
```json
{
  "stats": {
    "totalAccessibleCourses": 17,
    "totalEnrolled": 17,
    "inProgress": 0,
    "completed": 0,
    "notStarted": 17
  },
  "courses": {
    "continueWatching": [],
    "completed": [],
    "recommended": [/* 17 courses */]
  }
}
```

### Test 5: Cancel Subscription
**Test Command:**
```bash
POST /api/subscriptions/cancel
{
  "subscriptionId": "<sub_id>",
  "cancellationReason": "Testing cancellation flow"
}
```

**Expected:**
- Subscription status → CANCELLED
- `cancelledAt` timestamp set
- User retains access until `endDate`
- Enrollments NOT deleted

### Test 6: Course Access Check
**Test Command:**
```bash
# From lib/subscription-access.ts
const access = await checkCourseAccess(userId, courseId)
```

**Test Cases:**
- User with Category A → Can access Category A course ✅
- User with Category A → Cannot access Category B course ❌
- User with Bundle AB → Can access both A & B ✅
- User with no subscription → Cannot access any course ❌

## 🐛 Known Issues & TODO

### Issues Found:
- [ ] None yet - needs testing

### Next Steps:
1. **Create My Learning Dashboard UI Page**
   - Location: `src/app/[locale]/dashboard/my-learning/page.tsx`
   - Show Continue Watching, Completed, Explore sections
   - Display subscription status
   - Link to courses

2. **Update Course Detail Pages**
   - Add "Subscribe to Watch" button if no access
   - Show which subscription tier grants access
   - Auto-enroll on access if user has subscription

3. **Integrate Payment Gateway**
   - Paymob webhook integration
   - Stripe (future)
   - Handle successful payment → create subscription → auto-enroll

4. **Add Subscription Management Page**
   - View active subscriptions
   - Upgrade/downgrade options
   - Billing history
   - Cancel subscription

## 📊 Current Database State

**Courses:**
- Category A: 5 courses
- Category B: 12 courses
- Category C: 0 courses
- Total: 17 courses

**Subscriptions:**
- Active: 0 (needs user to subscribe)

**Enrollments:**
- Will be created automatically on subscription

## 🚀 Quick Start Testing

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Visit subscribe page:**
   ```
   http://localhost:3000/en/subscribe
   ```

3. **Login as test user**

4. **Subscribe to a plan** (currently mock - will create subscription + auto-enroll)

5. **Check My Learning:**
   ```
   GET http://localhost:3000/api/my-learning
   ```

6. **Verify enrollments in database:**
   ```bash
   npx prisma studio
   ```

## ✅ Success Criteria

- [ ] User can view all 5 subscription options
- [ ] Clicking subscribe creates subscription record
- [ ] Auto-enrollment creates enrollment records
- [ ] User can access all enrolled courses
- [ ] My Learning API returns correct data
- [ ] Course counts are accurate
- [ ] Bundle savings calculated correctly
- [ ] Yearly discount applied (20%)
- [ ] Cancel retains access until period end
- [ ] No cart/checkout flow exists

## 🎯 Next Implementation Phase

After testing is complete:

1. **Payment Integration**
   - Paymob for Egyptian market
   - Stripe for international

2. **My Learning Dashboard UI**
   - React component with tabs
   - Progress tracking
   - Course thumbnails

3. **Course Player Updates**
   - Check subscription before playing
   - Auto-enroll on access
   - Show upgrade prompts

4. **Email Notifications**
   - Welcome email on subscription
   - Enrollment confirmations
   - Cancellation confirmation

5. **Admin Dashboard**
   - Subscription analytics
   - Revenue tracking
   - Churn analysis
