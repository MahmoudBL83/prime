# Learner Dashboard Enhancements Needed

Based on the business blueprint, here are the missing features that should be added to the learner dashboard:

## 1. Learning Streak Widget ✅ (Data exists, needs display)
- **Current Status**: Data structure exists in `learningStats.learningStreak`
- **Needs**: Visual widget showing current streak, longest streak, and last activity
- **Design**: Gamified card with flame icon, daily streak counter
- **Location**: Right column, above "Recent Activity"

## 2. Achievements/Badges Section ✅ (Data exists, needs display)
- **Current Status**: Data structure exists in `learningStats.achievements`
- **Needs**: Grid of unlocked achievements with icons and dates
- **Design**: Trophy/badge cards with colors and unlock animations
- **Location**: New tab or section in Overview

## 3. Study Buddy Profiles ✅ (Data exists, needs display)
- **Current Status**: Data structure exists in `learningStats.studyBuddies`
- **Needs**: List of matched study buddies with shared interests
- **Design**: Profile cards with avatars, shared subjects, and quick connect
- **Location**: Right column widget or Study Buddy tab

## 4. Upcoming Study Sessions ✅ (Data exists, needs display)
- **Current Status**: Data structure exists in `learningStats.upcomingSessions`
- **Needs**: Calendar view of scheduled study sessions with partners
- **Design**: Timeline/calendar cards with partner info and topics
- **Location**: Right column, integrated with meetings

## 5. Rewards & Scholarships Section ❌ (NOT implemented)
- **Current Status**: Not implemented
- **Needs**: 
  - Active contests/scholarships display
  - Leaderboard position in enrolled courses
  - Prize eligibility status
  - Rules and claim center
- **Design**: Gamified cards with progress bars and rankings
- **Location**: New "Rewards" tab or dedicated section

## 6. Subscription Status Indicator ✅ (Data exists, needs display)
- **Current Status**: Data exists in `userProfile.subscriptionStatus`
- **Needs**: Visual indicator for NONE/ACTIVE/EXPIRED/CANCELLED
- **Design**: Badge in header showing plan status
- **Location**: Top right of dashboard header

## 7. Creator Membership Channels (Category C) ❌ (NOT implemented)
- **Current Status**: Not implemented
- **Needs**:
  - Subscribed creators feed
  - Membership tier info
  - Access to creator posts and live sessions
  - 1:1 coaching slots
- **Design**: Creator cards with membership perks
- **Location**: New "My Creators" tab

## 8. Upcoming Live Events ❌ (NOT implemented)
- **Current Status**: Not implemented
- **Needs**:
  - Live sessions from enrolled courses
  - Creator channel live events
  - Group Q&A sessions
  - Calendar integration
- **Design**: Event cards with countdown and join button
- **Location**: Right column widget

## 9. Certificates Section ❌ (NOT visible)
- **Current Status**: May exist in backend
- **Needs**:
  - Earned certificates display
  - Download/share options
  - Certificate preview
- **Design**: Certificate cards with course info
- **Location**: New tab or in "My Learning"

## 10. Learning Analytics ❌ (Limited)
- **Current Status**: Basic stats shown
- **Needs**:
  - Weekly learning hours chart
  - Course completion rates over time
  - Subject/category breakdown
  - Comparison with goals
- **Design**: Charts and graphs
- **Location**: Progress page or new Analytics tab

## Priority Implementation Order:

### Phase 1 - Quick Wins (Use existing data):
1. Learning Streak Widget
2. Subscription Status Badge
3. Study Buddies Widget
4. Upcoming Sessions Widget
5. Achievements Display

### Phase 2 - New Features:
6. Rewards & Scholarships Section
7. Live Events Calendar
8. Creator Memberships Tab

### Phase 3 - Polish:
9. Certificates Gallery
10. Advanced Analytics Dashboard

## Technical Notes:
- Most Phase 1 items only need UI components, data already exists
- Phase 2 requires new API endpoints and database models
- Consider responsive design for all new widgets
- Maintain Netflix-style dark theme consistency
