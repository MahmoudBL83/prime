# Member Live Session Features - Documentation

## 📋 Overview

This document covers the member-facing features for joining and watching live sessions hosted by creators.

**Status**: ✅ Complete  
**Date**: January 9, 2025  
**Files Created**: 4 (3 API routes + 1 UI page)

---

## 🏗️ Architecture

### Member Session Flow

```
1. Member discovers live session (notification/browse)
   ↓
2. Navigate to /sessions/[id]
   ↓
3. System checks:
   - Is session LIVE?
   - Does member have required tier subscription?
   - Is session full (maxAttendees)?
   ↓
4. If all checks pass → Show "Join Session" button
   ↓
5. Member clicks "Join Session"
   ↓
6. POST /api/sessions/[id]/join
   - Creates SessionAttendee record
   - Increments viewCount
   - Returns stream URL
   ↓
7. Video player loads stream
8. Member watches session
   ↓
9. On page close → POST /api/sessions/[id]/leave
   - Updates leftAt timestamp
   - Calculates watch duration
```

---

## 📁 Files Created

### 1. `/api/sessions/[id]/join/route.ts` (180 lines)

**Purpose**: Member joins a live session

**Method**: POST

**Authentication**: Required (any authenticated user)

**Request**: No body required

**Response**:
```json
{
  "message": "Successfully joined session",
  "attendee": {
    "id": "attendee_id",
    "sessionId": "session_id",
    "userId": "user_id",
    "joinedAt": "2025-01-09T15:30:00Z"
  },
  "session": {
    "id": "session_id",
    "title": "Introduction to TypeScript",
    "streamUrl": "rtmp://stream.example.com/live/session_id",
    "actualStartAt": "2025-01-09T15:00:00Z",
    "duration": 60
  }
}
```

**Access Control Logic**:

1. **Tier Verification**:
```typescript
if (session.tier !== 'ALL') {
  // Check if user has active subscription
  const hasSubscription = channel.subscriptions.length > 0;
  
  if (!hasSubscription) {
    return 403: "You need an active subscription"
  }
  
  // Check tier hierarchy
  const tierHierarchy = { 'BRONZE': 1, 'SILVER': 2, 'GOLD': 3 };
  const userLevel = tierHierarchy[user.tier];
  const requiredLevel = tierHierarchy[session.tier];
  
  if (userLevel < requiredLevel) {
    return 403: "This session requires GOLD tier or higher"
  }
}
```

2. **Capacity Check**:
```typescript
if (session.maxAttendees) {
  const currentCount = attendees.filter(a => !a.leftAt).length;
  
  if (currentCount >= session.maxAttendees) {
    return 400: "Session is full"
  }
}
```

3. **Duplicate Check**:
```typescript
const existing = sessionAttendees.find(
  a => a.userId === userId && a.leftAt === null
);

if (existing) {
  return 200: "Already attending" // Idempotent
}
```

**Error Responses**:
- `401`: Not authenticated
- `404`: Session not found
- `400`: Session not live / Session full
- `403`: Insufficient tier / No subscription
- `500`: Server error

---

### 2. `/api/sessions/[id]/leave/route.ts` (90 lines)

**Purpose**: Member leaves a live session

**Method**: POST

**Authentication**: Required

**Request**: No body required

**Response**:
```json
{
  "message": "Successfully left session",
  "attendee": {
    "id": "attendee_id",
    "sessionId": "session_id",
    "userId": "user_id",
    "joinedAt": "2025-01-09T15:30:00Z",
    "leftAt": "2025-01-09T16:15:00Z",
    "duration": 2700
  },
  "watchDuration": {
    "seconds": 2700,
    "minutes": 45,
    "formatted": "45m 0s"
  }
}
```

**Duration Calculation**:
```typescript
const leftAt = new Date();
const joinedAt = new Date(attendee.joinedAt);
const durationSeconds = Math.floor((leftAt - joinedAt) / 1000);

// Format as HH:MM:SS or MM:SS or SS
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
```

**Error Responses**:
- `401`: Not authenticated
- `400`: Not currently attending
- `500`: Server error

**Use Cases**:
- User manually closes browser tab
- User navigates away from page
- User clicks "Leave Session" button
- Session ends (creator ends it)

---

### 3. `/api/sessions/[id]/route.ts` (150 lines)

**Purpose**: Get session details for members

**Method**: GET

**Authentication**: Required

**Request**: No body required

**Response**:
```json
{
  "session": {
    "id": "session_id",
    "title": "Introduction to TypeScript",
    "titleAr": "مقدمة إلى TypeScript",
    "description": "Learn TypeScript basics",
    "scheduledAt": "2025-01-09T15:00:00Z",
    "duration": 60,
    "status": "LIVE",
    "tier": "SILVER",
    "maxAttendees": 50,
    "streamUrl": "rtmp://...",  // null if no access
    "actualStartAt": "2025-01-09T15:00:00Z",
    "viewCount": 45,
    "activeAttendees": 32,
    "elapsedSeconds": 1800,
    "creator": {
      "id": "creator_id",
      "name": "John Doe",
      "profileImage": "https://...",
      "channelName": "Programming Pro"
    }
  },
  "userAccess": {
    "hasAccess": true,
    "userTier": "GOLD",
    "requiredTier": "SILVER",
    "isAttending": true,
    "attendeeId": "attendee_id"
  }
}
```

**Access Logic**:
- `streamUrl` is only included if `hasAccess = true`
- `hasAccess` is determined by tier hierarchy check
- `isAttending` tracks current attendance status

**Error Responses**:
- `401`: Not authenticated
- `404`: Session not found
- `500`: Server error

---

### 4. `/sessions/[id]/page.tsx` (400 lines)

**Purpose**: Member-facing live session viewer page

**Route**: `/sessions/[id]` (e.g., `/sessions/clw123xyz`)

**Features**:

#### Top Bar (Sticky):
- 🔴 Live indicator (pulsing red dot)
- Session title
- View count (👁️ 45 views)
- Active attendees (👥 32 watching)
- Elapsed time (⏱️ 00:30:15)

#### Main Content Area:

**Video Player** (16:9 aspect ratio):
- Before joining: "Join Session" button
- After joining: Video stream placeholder
- Loading state while joining
- Auto-leaves on page unload

**Session Info**:
- Full title and description
- Creator profile (avatar + name + channel)
- Tier badge (gradient styling)

**Live Chat Sidebar**:
- Placeholder: "Chat will appear here"
- "Coming soon with real-time messaging"

#### Access Control States:

**1. Not Authenticated**:
```tsx
Redirects to /auth/signin
```

**2. Session Not LIVE**:
```tsx
<Message>
  Session Not Live
  Status: SCHEDULED / ENDED
  [Back to Dashboard]
</Message>
```

**3. Insufficient Tier**:
```tsx
<Message>
  🔒 Subscription Required
  This session requires GOLD tier
  Your tier: SILVER
  [Subscribe Now] [Back]
</Message>
```

**4. Has Access & Not Joined**:
```tsx
<VideoPlaceholder>
  Click below to join and start watching
  [Join Session]
</VideoPlaceholder>
```

**5. Attending Session**:
```tsx
<VideoPlayer>
  Stream will appear here
  (Streaming provider integration required)
</VideoPlayer>
```

#### Real-time Updates:
- Polls session data every 10 seconds while LIVE
- Updates: view count, attendee count, elapsed time
- Auto-refreshes attendance status

#### Automatic Leave on Exit:
```typescript
useEffect(() => {
  const handleBeforeUnload = async () => {
    if (isAttending) {
      await fetch(`/api/sessions/${id}/leave`, {
        method: 'POST',
        keepalive: true  // Ensures request completes
      });
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isAttending]);
```

---

## 🔐 Security & Validation

### Tier-Based Access Control

**Tier Hierarchy**:
```
BRONZE (Level 1) < SILVER (Level 2) < GOLD (Level 3)
```

**Access Rules**:
- `tier: 'ALL'` → Anyone can join (no subscription needed)
- `tier: 'BRONZE'` → Requires BRONZE, SILVER, or GOLD
- `tier: 'SILVER'` → Requires SILVER or GOLD
- `tier: 'GOLD'` → Requires GOLD only

**Verification Process**:
1. Check if user has active subscription to channel
2. Get user's tier from subscription
3. Compare tier levels using hierarchy
4. Grant access if `userLevel >= requiredLevel`

### Capacity Management

**Max Attendees Enforcement**:
```typescript
// Count only active attendees (haven't left yet)
const activeCount = attendees.filter(a => a.leftAt === null).length;

if (maxAttendees && activeCount >= maxAttendees) {
  return error: "Session is full"
}
```

**Edge Cases Handled**:
- User rejoins after leaving: Creates new attendee record
- Multiple tabs: Each treated as separate attendance
- Network disconnect: Previous record remains until manual leave

### Idempotent Join

**If user already attending**:
```typescript
if (alreadyAttending) {
  return {
    message: "Already attending this session",
    attendee: existingRecord,
    session: sessionData
  };
}
```

This prevents:
- Duplicate attendee records
- Double-counting views
- Error on accidental double-click

---

## 📊 Database Operations

### Join Session:

**1. Create SessionAttendee**:
```sql
INSERT INTO SessionAttendee (sessionId, userId, joinedAt)
VALUES ('session_id', 'user_id', NOW());
```

**2. Increment ViewCount**:
```sql
UPDATE LiveSession
SET viewCount = viewCount + 1
WHERE id = 'session_id';
```

### Leave Session:

**Update SessionAttendee**:
```sql
UPDATE SessionAttendee
SET 
  leftAt = NOW(),
  duration = TIMESTAMPDIFF(SECOND, joinedAt, NOW())
WHERE id = 'attendee_id';
```

### Get Active Attendees:

```sql
SELECT COUNT(*) as activeCount
FROM SessionAttendee
WHERE sessionId = 'session_id'
  AND leftAt IS NULL;
```

---

## 🎯 User Experience Features

### 1. **Loading States**

**Initial Load**:
```tsx
<Loader2 className="animate-spin" />
Loading session...
```

**Joining Session**:
```tsx
<Button disabled>
  <Loader2 className="animate-spin" />
  Joining...
</Button>
```

### 2. **Error Handling**

**Session Not Found**:
```tsx
<AlertCircle />
Error: Session not found
[Back to Dashboard]
```

**Access Denied**:
```tsx
<Lock />
Subscription Required
This session requires GOLD tier
[Subscribe Now]
```

### 3. **Real-time Updates**

**Auto-refresh every 10 seconds**:
- View count
- Active attendees
- Elapsed time
- Attendance status

### 4. **Responsive Design**

**Mobile** (< 768px):
- Stacked layout
- Full-width video
- Chat below video

**Tablet** (768px - 1024px):
- 2-column grid
- Video on left
- Chat on right

**Desktop** (> 1024px):
- 3-column grid (2:1 ratio)
- Video + info on left
- Chat sidebar on right

---

## 🧪 Testing Scenarios

### Test 1: Join Public Session (ALL tier)

**Setup**: Session with `tier: 'ALL'`

**Steps**:
1. Navigate to `/sessions/[id]`
2. Click "Join Session"

**Expected**:
- ✅ Join succeeds without subscription check
- ✅ Attendee record created
- ✅ View count increments
- ✅ Video player becomes visible

---

### Test 2: Join Tier-Restricted Session

**Setup**: Session with `tier: 'GOLD'`, user has SILVER

**Steps**:
1. Navigate to `/sessions/[id]`

**Expected**:
- ✅ Access denied screen shows
- ✅ Message: "This session requires GOLD tier"
- ✅ Shows current tier: SILVER
- ✅ "Subscribe Now" button visible

---

### Test 3: Join Full Session

**Setup**: Session with `maxAttendees: 5`, currently 5 active

**Steps**:
1. Navigate to `/sessions/[id]`
2. Click "Join Session"

**Expected**:
- ✅ Error alert: "Session is full"
- ✅ Shows max (5) and current (5) counts
- ✅ Join button remains disabled

---

### Test 4: Rejoin After Leaving

**Setup**: User previously attended and left

**Steps**:
1. Join session
2. Leave session (close tab)
3. Return and join again

**Expected**:
- ✅ New attendee record created
- ✅ View count increments again
- ✅ Previous record has leftAt and duration set

---

### Test 5: Watch Duration Calculation

**Setup**: User joins at 15:30:00

**Steps**:
1. Join session
2. Wait 15 minutes
3. Leave session at 15:45:00

**Expected**:
- ✅ Duration = 900 seconds (15 minutes)
- ✅ Formatted as "15m 0s"
- ✅ leftAt timestamp matches close time

---

### Test 6: Multiple Tabs

**Setup**: Same user, two browser tabs

**Steps**:
1. Open session in Tab 1
2. Join in Tab 1
3. Open session in Tab 2
4. Join in Tab 2

**Expected**:
- ✅ Tab 1: Creates first attendee record
- ✅ Tab 2: Returns "Already attending"
- ✅ Only one active attendee record exists
- ✅ View count only increments once

---

### Test 7: Auto-leave on Browser Close

**Setup**: User is actively watching

**Steps**:
1. Join session
2. Close browser tab/window

**Expected**:
- ✅ `beforeunload` event fires
- ✅ POST /leave is called with `keepalive: true`
- ✅ leftAt timestamp is set
- ✅ Duration is calculated
- ✅ Active attendee count decrements

---

## 🚀 Future Enhancements

### 1. **Real-time Chat Integration**

**Priority**: HIGH

**Implementation**:
```typescript
// Socket.io client
const socket = io('/sessions');

socket.emit('join', { sessionId, userId });

socket.on('message', (message) => {
  // Display in chat sidebar
});

socket.on('user-joined', ({ userId, name }) => {
  // Show notification
});
```

**Estimated**: 20 hours

---

### 2. **Video Player Integration**

**Priority**: HIGH

**Options**:
- **Agora**: Best for scalability
- **Daily.co**: Easiest integration
- **AWS IVS**: Best for AWS users

**Implementation**:
```tsx
<AgoraVideoPlayer
  appId={process.env.AGORA_APP_ID}
  channel={sessionId}
  token={streamToken}
  uid={userId}
/>
```

**Estimated**: 40 hours

---

### 3. **Reactions & Emojis**

**Priority**: MEDIUM

**Features**:
- 👍 👏 ❤️ 🎉 🤔 floating reactions
- Real-time broadcast to all viewers
- Animation on screen

**Estimated**: 8 hours

---

### 4. **Raise Hand Feature**

**Priority**: MEDIUM

**Features**:
- Member clicks "Raise Hand" button
- Creator sees list of raised hands
- Creator can call on member
- Two-way audio/video (optional)

**Estimated**: 12 hours

---

### 5. **Session Recording Playback**

**Priority**: MEDIUM

**Features**:
- Members can watch replay after session ends
- Seekable video player
- Chapter markers
- Speed control (0.5x, 1x, 1.5x, 2x)

**Estimated**: 16 hours

---

### 6. **Analytics for Members**

**Priority**: LOW

**Features**:
- Total watch time across all sessions
- Sessions attended count
- Favorite creators
- Learning streak

**Estimated**: 10 hours

---

## 📈 Performance Considerations

### Database Optimization

**Indexes**:
```sql
CREATE INDEX idx_attendee_session_user 
ON SessionAttendee(sessionId, userId, leftAt);

CREATE INDEX idx_session_status_tier 
ON LiveSession(status, tier);
```

### API Response Times

**Target**:
- GET `/sessions/[id]`: < 200ms
- POST `/sessions/[id]/join`: < 300ms
- POST `/sessions/[id]/leave`: < 100ms

### Caching Strategy

**Session Data**:
```typescript
// Cache for 10 seconds
const sessionCache = new Map();

const getCachedSession = (id) => {
  const cached = sessionCache.get(id);
  if (cached && Date.now() - cached.time < 10000) {
    return cached.data;
  }
  return null;
};
```

### Real-time Polling

**Optimization**:
- Only poll when session is LIVE
- Increase interval when tab is inactive
- Use WebSocket for future implementation

---

## 🔍 Monitoring & Logging

### Key Metrics to Track

1. **Join Success Rate**: `joins / join_attempts`
2. **Average Watch Duration**: `sum(durations) / attendees`
3. **Peak Concurrent Viewers**: `max(active_attendees)`
4. **Session Capacity Hits**: Count of "Session is full" errors
5. **Tier Denials**: Count of "Insufficient tier" errors

### Error Logging

```typescript
if (error) {
  logger.error('Session join failed', {
    sessionId,
    userId,
    error: error.message,
    tier: session.tier,
    userTier: user.tier
  });
}
```

---

## ✅ Completion Checklist

### API Routes:
- [x] POST `/sessions/[id]/join` - Join session
- [x] POST `/sessions/[id]/leave` - Leave session
- [x] GET `/sessions/[id]` - Get session details

### UI Pages:
- [x] `/sessions/[id]/page.tsx` - Member viewer

### Features:
- [x] Tier-based access control
- [x] Capacity management (maxAttendees)
- [x] Watch duration tracking
- [x] Auto-leave on browser close
- [x] Real-time polling (10s interval)
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] Access denial screens

### Documentation:
- [x] API endpoint documentation
- [x] Access control rules
- [x] Testing scenarios
- [x] Future enhancements roadmap

---

## 🎉 Summary

**Status**: ✅ Complete

**Files Created**: 4
- 3 API routes
- 1 UI page

**Lines of Code**: ~820 lines

**Key Features**:
- ✅ Members can join live sessions
- ✅ Tier-based access control
- ✅ Automatic attendance tracking
- ✅ Watch duration calculation
- ✅ Real-time statistics
- ✅ Capacity enforcement
- ✅ Auto-leave on exit

**Ready For**:
- QA testing with real sessions
- Streaming provider integration
- Real-time chat implementation

---

**Last Updated**: January 9, 2025  
**Version**: 1.0  
**Next Steps**: Integrate streaming provider & real-time chat
