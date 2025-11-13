# Live Sessions Testing Guide

## 🧪 Complete Testing Workflow

This document provides a step-by-step guide for testing the Live Session Management feature end-to-end.

---

## ✅ Prerequisites

Before testing, ensure:
- [ ] Database is migrated: `npx prisma migrate dev`
- [ ] Prisma Client is generated: `npx prisma generate`
- [ ] Development server is running: `npm run dev`
- [ ] You have a user account with CREATOR role
- [ ] Creator has an approved CreatorChannel

---

## 🎯 Test Scenarios

### Scenario 1: Schedule a New Live Session

**Objective**: Create a new scheduled session successfully

**Steps**:
1. Log in as a CREATOR user
2. Navigate to `/creator/live` via navigation "Creator Hub" → "Live Sessions"
3. Click "Schedule New Session" button
4. Fill in the form:
   - **Title (English)**: "Introduction to TypeScript"
   - **Title (Arabic)**: "مقدمة إلى TypeScript"
   - **Description (English)**: "Learn TypeScript basics in this live session"
   - **Description (Arabic)**: "تعلم أساسيات TypeScript في هذه الجلسة المباشرة"
   - **Scheduled Date/Time**: Tomorrow at 3:00 PM
   - **Duration**: 60 minutes
   - **Tier**: SILVER
   - **Max Attendees**: 50
5. Click "Schedule Session"

**Expected Results**:
- ✅ Success alert appears
- ✅ Redirected to `/creator/live`
- ✅ New session appears in "Scheduled" tab
- ✅ Session card shows correct information
- ✅ Status badge shows "SCHEDULED" in gray

**API Call**:
```
POST /api/creator/live-sessions
Body: {
  title, titleAr, description, descriptionAr,
  scheduledAt, duration: 60, tier: "SILVER", maxAttendees: 50
}
Response: 201 Created
```

---

### Scenario 2: View Sessions List with Filters

**Objective**: Verify session filtering and display

**Steps**:
1. From `/creator/live`, observe the sessions list
2. Click on "Scheduled" tab
3. Click on "Live" tab
4. Click on "Ended" tab
5. Click on "All" tab

**Expected Results**:
- ✅ Each tab shows correct count badge
- ✅ Sessions filter based on status
- ✅ Session cards display:
  - Title (bilingual)
  - Description preview
  - Scheduled date/time
  - Countdown timer (for upcoming)
  - Status badge (color-coded)
  - Tier badge (gradient)
  - Stats: attendees, duration, views
- ✅ Action buttons appear based on status:
  - SCHEDULED: "Start Session", "Edit", "Delete"
  - LIVE: "End Session"
  - ENDED: "Delete"

**API Call**:
```
GET /api/creator/live-sessions?status=scheduled
Response: 200 OK with sessions array
```

---

### Scenario 3: Edit a Scheduled Session

**Objective**: Update session details before going live

**Steps**:
1. From sessions list, find a SCHEDULED session
2. Click "Edit" button (pencil icon)
3. Update the form:
   - Change title to "Advanced TypeScript Patterns"
   - Change duration to 90 minutes
   - Change tier to GOLD
4. Click "Update Session"

**Expected Results**:
- ✅ Edit page loads with pre-filled data
- ✅ All fields are editable
- ✅ Success alert on update
- ✅ Redirected back to `/creator/live`
- ✅ Updated information displays correctly
- ✅ Status remains SCHEDULED

**API Calls**:
```
GET /api/creator/live-sessions/[id]
Response: 200 OK with session data

PATCH /api/creator/live-sessions/[id]
Body: { title, duration: 90, tier: "GOLD" }
Response: 200 OK
```

---

### Scenario 4: Attempt to Edit LIVE Session (Should Fail)

**Objective**: Verify restrictions on editing live sessions

**Steps**:
1. Start a session (see Scenario 5)
2. Try to navigate to `/creator/live/[id]/edit`

**Expected Results**:
- ✅ Error message displays: "You cannot edit a session that is currently live"
- ✅ Form is not shown
- ✅ "Back to Sessions" button appears

---

### Scenario 5: Start a Live Session

**Objective**: Transition session from SCHEDULED to LIVE

**Steps**:
1. From sessions list, find your SCHEDULED session
2. Click "Start Session" button
3. You'll be redirected to the live room page

**Expected Results**:
- ✅ Redirected to `/creator/live/[id]`
- ✅ Top bar shows:
  - Pulsing red "LIVE" indicator
  - Session title
  - View count (0 initially)
  - Active attendees count (0 initially)
  - "End Session" button
- ✅ Streaming credentials card displays:
  - RTMP Server URL (copy button)
  - Stream Key (copy button, private)
- ✅ Setup instructions visible (4 steps)
- ✅ Session info card shows:
  - Duration
  - Tier badge
  - Started time
- ✅ Session status changes to LIVE in database
- ✅ `actualStartAt` timestamp is set

**API Call**:
```
POST /api/creator/live-sessions/[id]/start
Response: 200 OK with streamUrl, streamKey
```

---

### Scenario 6: Copy Streaming Credentials

**Objective**: Verify copy-to-clipboard functionality

**Steps**:
1. From the live room page, click "Copy" button next to Server URL
2. Click "Copy" button next to Stream Key
3. Paste into a text editor to verify

**Expected Results**:
- ✅ Copy button shows checkmark briefly
- ✅ "Copied!" feedback appears
- ✅ Server URL is in clipboard (format: `rtmp://stream.example.com/live/{sessionId}`)
- ✅ Stream Key is in clipboard (UUID format)

---

### Scenario 7: Monitor Live Session

**Objective**: Verify real-time updates and UI

**Steps**:
1. Keep the live room page open
2. Wait for the 10-second polling interval
3. Observe the stats

**Expected Results**:
- ✅ Page auto-refreshes data every 10 seconds
- ✅ View count updates (if viewers join)
- ✅ Attendee count updates
- ✅ Chat tab shows placeholder: "Chat is empty"
- ✅ Attendees tab shows placeholder: "No attendees yet"
- ✅ Video preview shows placeholder with instructions

---

### Scenario 8: End a Live Session

**Objective**: Transition session from LIVE to ENDED

**Steps**:
1. From the live room page, click "End Session" button
2. Confirm in the modal dialog

**Expected Results**:
- ✅ Confirmation modal appears
- ✅ After confirming:
  - Success alert appears
  - Redirected to `/creator/live`
  - Session moves to "Ended" tab
  - Status badge shows "ENDED" in blue
  - `actualEndAt` timestamp is set
  - Attendee durations are calculated
- ✅ Session cannot be started again

**API Call**:
```
POST /api/creator/live-sessions/[id]/end
Response: 200 OK with final stats
```

---

### Scenario 9: Delete/Cancel a Session

**Objective**: Remove a session from the list

**Steps**:
1. From sessions list, click "Delete" button (trash icon)
2. Confirm in the modal dialog

**Expected Results**:
- ✅ Confirmation modal appears
- ✅ After confirming:
  - Session status changes to CANCELLED
  - Session remains in database (soft delete)
  - Session appears in list with red "CANCELLED" badge
  - Or session is removed from list if hard delete

**API Call**:
```
DELETE /api/creator/live-sessions/[id]
Response: 200 OK
```

---

### Scenario 10: Test with Different Tiers

**Objective**: Verify tier-based access control

**Steps**:
1. Schedule 4 sessions with different tiers:
   - Session A: BRONZE
   - Session B: SILVER
   - Session C: GOLD
   - Session D: ALL
2. Observe tier badges on each session card

**Expected Results**:
- ✅ BRONZE: Amber to Orange gradient
- ✅ SILVER: Gray to Dark Gray gradient
- ✅ GOLD: Yellow to Golden gradient
- ✅ ALL: Purple to Pink gradient
- ✅ Shield icon appears on each badge

---

### Scenario 11: Test Max Attendees Limit

**Objective**: Verify attendance limit enforcement

**Steps**:
1. Schedule a session with maxAttendees: 5
2. Start the session
3. (Future: Have 6 users try to join)

**Expected Results**:
- ✅ Session shows "5 max attendees" in details
- ✅ (Future) 6th user receives "Session is full" error

---

### Scenario 12: Test Bilingual Support

**Objective**: Verify Arabic translations

**Steps**:
1. Change language to Arabic in navigation
2. Navigate to Live Sessions
3. All UI elements should display in Arabic

**Expected Results**:
- ✅ Page title: "الجلسات المباشرة"
- ✅ "Schedule New Session" button: "جدولة جلسة جديدة"
- ✅ Status labels in Arabic
- ✅ Tier labels in Arabic
- ✅ All form labels in Arabic
- ✅ Error/success messages in Arabic
- ✅ RTL layout for text inputs

---

### Scenario 13: Test Validation Errors

**Objective**: Verify form validation works

**Steps**:
1. Navigate to schedule page
2. Try submitting with empty title
3. Try submitting with past date
4. Try submitting with only English title (no Arabic)

**Expected Results**:
- ✅ Error message: "English title is required"
- ✅ Error message: "Arabic title is required"
- ✅ Error message: "Scheduled date and time are required"
- ✅ Date picker prevents past dates
- ✅ Form doesn't submit until all required fields are valid

---

### Scenario 14: Test Permission Restrictions

**Objective**: Verify role-based access control

**Steps**:
1. Log out from creator account
2. Log in as a regular USER (not creator)
3. Try to navigate to `/creator/live`

**Expected Results**:
- ✅ Redirected to `/dashboard` or homepage
- ✅ 403 Forbidden error if API is accessed directly

---

### Scenario 15: Test Ownership Verification

**Objective**: Ensure creators can't edit others' sessions

**Steps**:
1. As Creator A, note a session ID
2. Log out and log in as Creator B
3. Try to access `/api/creator/live-sessions/{creatorA_sessionId}`

**Expected Results**:
- ✅ 403 Forbidden error
- ✅ Error message: "Not authorized to access this session"

---

## 🐛 Edge Cases to Test

### Edge Case 1: Session Starting in the Past
**Setup**: Schedule a session for yesterday  
**Expected**: Session still appears in SCHEDULED status (no auto-status change)

### Edge Case 2: Very Long Session Title
**Setup**: Enter 300-character title  
**Expected**: Validation error (max 200 characters)

### Edge Case 3: Very Short Duration
**Setup**: Try to schedule 5-minute session  
**Expected**: Validation error (min 15 minutes)

### Edge Case 4: Very Long Duration
**Setup**: Try to schedule 5-hour session  
**Expected**: Validation error (max 240 minutes = 4 hours)

### Edge Case 5: Network Failure During Submit
**Setup**: Disconnect internet, submit form  
**Expected**: Error alert with network error message

### Edge Case 6: Concurrent Edit Conflict
**Setup**: Two browser tabs editing same session  
**Expected**: Last save wins (or show conflict error)

---

## 📊 Database Verification

After each test scenario, verify in the database:

```sql
-- Check session was created
SELECT * FROM LiveSession WHERE id = 'session_id';

-- Check status transitions
SELECT id, title, status, actualStartAt, actualEndAt 
FROM LiveSession 
WHERE channelId = 'your_channel_id';

-- Check attendee tracking
SELECT * FROM SessionAttendee WHERE sessionId = 'session_id';
```

---

## 🔍 API Testing with Postman/cURL

### Test: Create Session
```bash
curl -X POST http://localhost:3000/api/creator/live-sessions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{
    "title": "Test Session",
    "titleAr": "جلسة تجريبية",
    "scheduledAt": "2025-01-10T15:00:00Z",
    "duration": 60,
    "tier": "BRONZE"
  }'
```

### Test: List Sessions
```bash
curl -X GET http://localhost:3000/api/creator/live-sessions?status=scheduled \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Test: Start Session
```bash
curl -X POST http://localhost:3000/api/creator/live-sessions/SESSION_ID/start \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

### Test: End Session
```bash
curl -X POST http://localhost:3000/api/creator/live-sessions/SESSION_ID/end \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

---

## ✅ Final Checklist

### Functionality
- [ ] Can schedule new sessions
- [ ] Can view sessions list with filters
- [ ] Can edit scheduled sessions
- [ ] Cannot edit live/ended sessions
- [ ] Can start sessions
- [ ] Can end sessions
- [ ] Can delete/cancel sessions
- [ ] Streaming credentials are generated
- [ ] Copy-to-clipboard works
- [ ] Real-time polling updates

### UI/UX
- [ ] All pages are responsive (mobile/tablet/desktop)
- [ ] Loading states show correctly
- [ ] Error messages display properly
- [ ] Success messages display properly
- [ ] Modals work correctly
- [ ] Navigation links work
- [ ] Active page highlighting works
- [ ] Empty states display

### Internationalization
- [ ] English translations complete
- [ ] Arabic translations complete
- [ ] RTL layout works for Arabic
- [ ] Language switcher works
- [ ] Dates format correctly for locale

### Security
- [ ] Non-creators cannot access pages
- [ ] Creators cannot edit others' sessions
- [ ] Input validation works
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (React escaping)

### Performance
- [ ] Pages load in < 2 seconds
- [ ] API responses < 500ms
- [ ] No memory leaks (check DevTools)
- [ ] No console errors
- [ ] Polling doesn't cause lag

---

## 🐛 Known Issues / Future Work

### Current Limitations:
1. **Streaming**: Using placeholder credentials (need real provider)
2. **Chat**: Shows empty placeholder (Socket.io not implemented)
3. **Attendees**: Shows empty placeholder (real-time tracking not implemented)
4. **Recording**: No auto-recording feature yet
5. **Notifications**: No email/push notifications when session starts

### Coming Soon:
- Real streaming integration (Agora/Daily)
- Live chat with Socket.io
- Session recording and replay
- Email notifications for attendees
- Advanced analytics dashboard

---

## 📞 Reporting Issues

When reporting bugs, include:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/video if possible
- Console errors (F12 → Console tab)
- Network tab logs (for API errors)

**Submit bugs to**: bugs@primeegypt.com

---

**Last Updated**: 2025-01-09  
**Tested By**: [Your Name]  
**Status**: Ready for QA  
**Version**: 1.0
