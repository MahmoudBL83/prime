# Dual Role System: Creator + Learner

## Overview
Based on the business blueprint, **users can be both creators AND learners simultaneously**. This is a key feature of the platform that allows:

- Creators to also learn from other creators
- Learners to become creators without losing their learning progress
- Seamless switching between creator and learner modes

## Implementation

### 1. User Roles
- **Role field**: Users have a `role` field in the database (LEARNER, CREATOR, ADMIN)
- **Creator status**: When a user becomes a creator, their role is updated to `CREATOR`
- **Dual functionality**: Creators still have access to all learner features

### 2. Navigation System

#### Dashboard Switcher (for Creators)
When a user has `role: CREATOR`, the Dashboard button in the navigation becomes a **dropdown menu** with two options:

```
Dashboard ▼
├── Learner Dashboard  (📚 icon)
└── Creator Dashboard  (🏆 icon)
```

#### Regular Users (Learners)
For users with `role: LEARNER`, the Dashboard button is a simple link to `/[locale]/dashboard`

### 3. Routes Structure

```
/[locale]/dashboard              → Learner Dashboard (courses, progress, study buddy)
/[locale]/creator/dashboard      → Creator Dashboard (earnings, content, analytics)
/[locale]/creator/content        → Content management
/[locale]/creator/live           → Live sessions
/[locale]/creator/earnings       → Earnings & payouts
/[locale]/creator/analytics      → Analytics & insights
/[locale]/creator/onboarding     → Creator application (first-time)
```

### 4. Creator Hub Dropdown
Creators also get a **Creator Hub dropdown** with quick access to:
- Content
- Live Sessions
- Earnings
- Analytics

### 5. Onboarding Flow

When a learner applies to become a creator:

1. Click "Become a Mentor" → redirects to `/creator/onboarding`
2. Fill 4-step application:
   - Personal Information
   - Expertise & Experience
   - Verification Documents (ID upload)
   - Platform Guidelines (accept terms)
3. Submit application
4. System updates:
   - User `role` → `CREATOR`
   - Creator profile → `kycStatus: PENDING`
   - Creator profile → `onboardingCompleted: true`
5. Redirect to Creator Dashboard
6. Admin reviews KYC documents

### 6. Data Storage

#### User Model (Personal Info)
```typescript
{
  name: string          // Full name
  arabicName: string    // Arabic name
  phone: string         // Phone number
  bio: string          // Bio
  role: 'CREATOR'      // Updated from LEARNER
  onboardingCompleted: true
}
```

#### Creator Model (Professional Info)
```typescript
{
  expertise: string          // Area of expertise
  languages: string          // Languages taught (comma-separated)
  socialLinks: JSON          // Social media links
  nationalIdImage: string    // ID document path
  selfieImage: string        // Certificate path (repurposed)
  addressProof: string       // Tax form path (repurposed)
  kycStatus: 'PENDING'       // KYC verification status
  certifications: JSON       // Additional info (education, experience, location)
}
```

### 7. Benefits of Dual Role

✅ **For Users:**
- Learn from others while teaching
- Single account, dual functionality
- Seamless experience switching modes
- Build credibility as learner before becoming creator

✅ **For Platform:**
- Encourage user growth (learner → creator conversion)
- Retain users in both roles
- Single user management system
- Clear separation of concerns (learner vs creator features)

## Key Points

1. **One Account**: Users don't need separate accounts for learning and creating
2. **Role-Based Access**: Features are unlocked based on role (CREATOR gets extra features)
3. **Persistent Learning**: When becoming a creator, users keep all their learning progress
4. **Dashboard Switcher**: Easy navigation between learner and creator modes
5. **KYC Verification**: Admin reviews creator applications before approval

## Future Enhancements

- [ ] Quick toggle in top-right corner (Learner/Creator mode badge)
- [ ] Unified notifications for both roles
- [ ] Cross-promote: "Your students might like X" or "This creator teaches what you're learning"
- [ ] Creator analytics showing "learners who are also creators"
- [ ] Mentor matching: pair learners with creators in same subject

---

**Current Status**: ✅ Implemented
- Dashboard dropdown switcher
- Creator onboarding flow
- Dual role navigation
- KYC submission API
