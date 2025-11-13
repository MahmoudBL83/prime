# Session Analytics - Documentation

## 📊 Overview

The Session Analytics feature provides creators with comprehensive insights into their live session performance, helping them understand viewer engagement, retention, and overall session effectiveness.

**Status**: ✅ Complete  
**Date**: October 9, 2025  
**Files Created**: 2 (1 API + 1 UI page)

---

## 🎯 Features

### Analytics Dashboard

Access detailed analytics for any completed or live session including:

- **Total Views & Unique Viewers**
- **Peak Concurrent Viewers**
- **Average Watch Duration**
- **Retention Rate** (% who watched 50%+ of session)
- **Engagement Score** (0-100 composite metric)
- **Viewer Timeline Chart** (real-time viewer count over session duration)
- **Top Viewers Leaderboard** (ranked by watch time)

---

## 📁 Files

### 1. Analytics API

**File**: `/api/creator/live-sessions/[id]/analytics/route.ts` (245 lines)

**Endpoint**: `GET /api/creator/live-sessions/[id]/analytics`

**Purpose**: Fetches comprehensive analytics data for a specific live session

**Authentication**: Required (creator must own the session)

**Response Structure**:
```json
{
  "session": {
    "id": "session_id",
    "title": "Introduction to TypeScript",
    "titleAr": "مقدمة إلى TypeScript",
    "status": "ENDED",
    "tier": "SILVER",
    "scheduledAt": "2025-10-09T15:00:00Z",
    "actualStartAt": "2025-10-09T15:05:00Z",
    "actualEndAt": "2025-10-09T16:10:00Z",
    "duration": 60
  },
  "overview": {
    "totalViews": 125,
    "uniqueViewers": 98,
    "totalAttendees": 125,
    "peakConcurrent": 45,
    "averageWatchDuration": 2700,
    "totalWatchTime": 337500,
    "retentionRate": 72,
    "engagementScore": 85
  },
  "viewerTimeline": [
    {
      "timestamp": "2025-10-09T15:05:00Z",
      "viewers": 12
    },
    {
      "timestamp": "2025-10-09T15:10:00Z",
      "viewers": 28
    }
    // ... more data points
  ],
  "topViewers": [
    {
      "id": "user_id",
      "name": "John Doe",
      "profileImage": "https://...",
      "watchDuration": 3600,
      "joinedAt": "2025-10-09T15:05:00Z",
      "leftAt": "2025-10-09T16:05:00Z"
    }
    // ... up to 10 viewers
  ],
  "tierBreakdown": {
    "total": 125
  },
  "metrics": {
    "averageWatchDurationFormatted": "45m 0s",
    "totalWatchTimeFormatted": "93h 45m 0s",
    "sessionDurationFormatted": "60m 0s"
  }
}
```

---

### 2. Analytics Dashboard UI

**File**: `/creator/live/[id]/analytics/page.tsx` (420 lines)

**Route**: `/creator/live/[id]/analytics`

**Purpose**: Visual dashboard displaying session analytics

**Features**:
- 4 stat cards (Total Views, Peak Viewers, Avg Watch Time, Retention)
- Engagement score meter with breakdown
- Interactive viewer timeline chart
- Top 10 viewers leaderboard
- Export button (ready for CSV/PDF implementation)

---

## 📈 Key Metrics Explained

### 1. Total Views
**What it is**: The total number of times users joined the session

**How it's calculated**: Sum of all SessionAttendee records for this session

**Why it matters**: Indicates overall reach and interest in your content

**Example**: If 100 users each joined once, total views = 100. If 50 users joined twice (rejoined after leaving), total views = 100.

---

### 2. Unique Viewers
**What it is**: The number of distinct users who attended

**How it's calculated**: Count of unique userIds in SessionAttendee records

**Why it matters**: Shows true audience size (removes duplicates)

**Example**: 125 total views might be from only 98 unique viewers

---

### 3. Peak Concurrent Viewers
**What it is**: Maximum number of people watching at the same time

**How it's calculated**: 
1. Create timeline of all join/leave events
2. Sort by timestamp
3. Track running count (increment on join, decrement on leave)
4. Record maximum value

**Why it matters**: Indicates session popularity and engagement peak moments

**Example**: Session might have 100 total viewers, but only 45 were watching simultaneously at peak

---

### 4. Average Watch Duration
**What it is**: Average time each viewer spent watching

**How it's calculated**: 
```typescript
totalWatchTime / numberOfViewersWithDuration
```

**Why it matters**: Indicates content quality and viewer engagement

**Best Practices**:
- Aim for >50% of session duration
- Compare across sessions to identify engaging topics

---

### 5. Retention Rate
**What it is**: Percentage of viewers who watched at least 50% of the session

**How it's calculated**:
```typescript
retentionRate = (viewersWhoWatched50Percent / totalViewers) * 100
```

**Why it matters**: Strong indicator of content quality

**Benchmarks**:
- 🟢 **Excellent**: 70%+
- 🟡 **Good**: 50-69%
- 🔴 **Needs Improvement**: <50%

---

### 6. Engagement Score
**What it is**: Composite metric (0-100) combining multiple engagement factors

**How it's calculated**:
```typescript
engagementScore = 
  (retentionRate * 0.4) +        // 40% weight
  (capacityUtilization * 30) +   // 30% weight
  (reachScore * 30)              // 30% weight

where:
- capacityUtilization = peakConcurrent / maxAttendees
- reachScore = uniqueViewers / 50 (capped at 100%)
```

**Why it matters**: Single number to compare session success

**Interpretation**:
- 🏆 **90-100**: Outstanding engagement
- 🥇 **75-89**: Excellent engagement
- 🥈 **60-74**: Good engagement
- 🥉 **45-59**: Average engagement
- ⚠️ **<45**: Needs improvement

---

## 📊 Viewer Timeline Chart

### Purpose
Visualizes how viewership changed throughout the session

### How It Works
1. Divides session into ~20 equal time intervals
2. Counts active viewers at each interval
3. Displays as bar chart

### What to Look For

**Ideal Pattern** (👍):
```
|     _____
|    /     \
|   /       \___
|__/            \___
```
- Steady climb
- Sustained peak
- Gradual decline

**Concerning Pattern** (⚠️):
```
|  _
| / \
|/   \___________
```
- Quick spike then sharp drop
- Indicates content didn't meet expectations

**Discovery Opportunity** (💡):
```
|         _____
|  __    /     \
| /  \  /       \
|/    \/         \
```
- Multiple peaks
- Check what topics caused the peaks

---

## 🏆 Top Viewers Leaderboard

### Purpose
Recognize and engage with your most dedicated viewers

### What It Shows
Top 10 viewers ranked by watch duration, including:
- Viewer name and profile picture
- Total watch duration
- Completion percentage

### Use Cases

1. **Thank Your Supporters**
   - Message top viewers personally
   - Offer exclusive content/perks

2. **Identify Super Fans**
   - Invite to private sessions
   - Ask for feedback

3. **Community Building**
   - Feature in shoutouts
   - Create rewards program

---

## 🎯 Using Analytics to Improve

### 1. Analyze Retention Patterns

**Low Retention (<50%)**:
- ❓ Problem: Content not matching expectations
- ✅ Solution: Improve titles/descriptions, set clear expectations

**High Drop-off at Specific Time**:
- ❓ Problem: Technical issues or boring segment
- ✅ Solution: Review recording, improve pacing

**Gradual Decline Throughout**:
- ❓ Problem: Session too long
- ✅ Solution: Shorten duration or add breaks

---

### 2. Optimize Session Timing

**Low Peak Concurrent Viewers**:
- ❓ Problem: Poor scheduling
- ✅ Solution: 
  - Survey audience for preferred times
  - Test different time slots
  - Check when your audience is most active

**High Total Views, Low Concurrent**:
- ❓ Problem: Viewers joining/leaving frequently
- ✅ Solution:
  - Improve session structure
  - Add clear agenda
  - Reduce technical issues

---

### 3. Content Strategy

**Compare Engagement Scores Across Sessions**:

| Session Topic | Engagement Score | Action |
|--------------|------------------|--------|
| TypeScript Basics | 85 | ✅ Create more beginner content |
| Advanced Patterns | 52 | ⚠️ Simplify or add prerequisites |
| Q&A Session | 78 | ✅ Schedule regularly |
| Code Review | 45 | ⚠️ Re-think format |

---

### 4. Audience Growth

**Track Month-over-Month**:
- Unique viewers trend
- Retention rate improvement
- Engagement score progression

**Set Goals**:
- Increase unique viewers by 20% next month
- Improve retention from 60% to 70%
- Maintain engagement score >75

---

## 💡 Best Practices

### Before Session
1. **Set Clear Learning Objectives**
   - Tell viewers what they'll learn
   - Deliver on promises

2. **Promote Effectively**
   - Email subscribers
   - Post on social media
   - Send reminders

3. **Test Tech Setup**
   - Check stream quality
   - Test audio/video
   - Prepare backup plan

### During Session
1. **Monitor Live Stats**
   - Check concurrent viewers
   - Watch for drop-offs
   - Adjust pacing if needed

2. **Engage Audience**
   - Ask questions
   - Respond to chat
   - Do polls

3. **Maintain Energy**
   - Take breaks if long session
   - Vary content type
   - Use visuals

### After Session
1. **Review Analytics Within 24 Hours**
   - Identify what worked
   - Note what to improve

2. **Follow Up**
   - Thank attendees
   - Share recording
   - Ask for feedback

3. **Plan Next Session**
   - Apply learnings
   - Build on successes
   - Fix issues

---

## 📥 Export Analytics (Coming Soon)

### Planned Formats

**CSV Export**:
- Raw data for Excel/Sheets
- Timestamp-level granularity
- All attendee details

**PDF Report**:
- Professional summary
- Charts and graphs
- Shareable with team

### Use Cases
- Monthly performance reports
- Team presentations
- Track progress over time
- Compare with competitors

---

## 🔍 Advanced Analytics (Future)

### Planned Features

1. **Comparative Analytics**
   - Compare sessions side-by-side
   - Identify trends
   - Benchmark against averages

2. **Audience Demographics**
   - Location breakdown
   - Device types
   - Subscription tier analysis

3. **Revenue Analytics**
   - Earnings per session
   - ROI by tier
   - Conversion tracking

4. **Predictive Insights**
   - Optimal session length
   - Best time slots
   - Topic recommendations

5. **Real-time Dashboard**
   - Live viewer map
   - Engagement heatmap
   - Chat sentiment analysis

---

## 🧪 Testing the Analytics

### Test Scenario 1: View Basic Analytics

1. Sign in as creator
2. Go to `/creator/live`
3. Find a completed session
4. Click "View Analytics" (or navigate to `/creator/live/[id]/analytics`)
5. Verify all metrics display correctly

**Expected Results**:
- ✅ All 4 stat cards show data
- ✅ Engagement score meter displays
- ✅ Viewer timeline chart renders
- ✅ Top viewers list populated

---

### Test Scenario 2: Check Calculations

**Setup**: Session with known data
- Duration: 60 minutes
- 3 attendees:
  - User A: Watched 60 minutes (100%)
  - User B: Watched 45 minutes (75%)
  - User C: Watched 15 minutes (25%)

**Expected Calculations**:
- Total Views: 3
- Unique Viewers: 3
- Average Watch Duration: 40 minutes
- Retention Rate: 67% (2 out of 3 watched 50%+)

---

### Test Scenario 3: Timeline Accuracy

**Setup**: Session with staggered joins
- T+0: User A joins
- T+5: User B joins
- T+10: User C joins
- T+15: User A leaves
- T+20: User B leaves
- T+25: User C leaves

**Expected Timeline**:
- T+0 to T+5: 1 viewer
- T+5 to T+10: 2 viewers
- T+10 to T+15: 3 viewers (peak!)
- T+15 to T+20: 2 viewers
- T+20 to T+25: 1 viewer
- T+25+: 0 viewers

**Peak Concurrent**: 3 viewers

---

## ❓ FAQ

### Q: How long does it take for analytics to update?
**A**: Analytics are calculated in real-time when you access the page. For live sessions, metrics update as viewers join/leave.

### Q: Can I see analytics for scheduled sessions?
**A**: No, analytics are only available for sessions that have started (LIVE or ENDED status).

### Q: Why is my retention rate 0%?
**A**: This means no viewers watched at least 50% of your session. Consider:
- Was the content engaging?
- Did technical issues occur?
- Was the session too long?

### Q: What's a good engagement score?
**A**: 
- **75+**: Excellent! Keep doing what you're doing
- **60-74**: Good, with room for improvement
- **Below 60**: Review content and format

### Q: Can viewers see these analytics?
**A**: No, analytics are creator-only. Members only see basic stats (view count, active attendees).

### Q: How far back can I view analytics?
**A**: Analytics are available for all past sessions indefinitely.

---

## 🎉 Summary

Session Analytics provides creators with actionable insights to:
- ✅ Understand what content resonates
- ✅ Optimize session timing and length
- ✅ Identify and reward top supporters
- ✅ Track growth over time
- ✅ Make data-driven improvements

**Key Benefits**:
- 📊 Comprehensive metrics
- 📈 Visual timeline
- 🏆 Top viewers leaderboard
- 💯 Engagement scoring
- 📥 Export capabilities (coming soon)

---

**Last Updated**: October 9, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
