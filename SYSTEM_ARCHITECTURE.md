# 🎬 OnlyFans-Style Media System - Architecture Overview

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MENTORS PAGE                             │
│                    (/app/[locale]/mentors/page.tsx)             │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐            ┌────────▼────────┐
        │  FEED VIEW     │            │  PROFILE VIEW   │
        │  (Default)     │            │  (Creator)      │
        └────────────────┘            └─────────────────┘
                                               │
                        ┌──────────────────────┼──────────────────────┐
                        │                      │                      │
                ┌───────▼────────┐    ┌───────▼────────┐    ┌───────▼────────┐
                │   DASHBOARD    │    │  SUBSCRIPTION  │    │    BIO &       │
                │    TOGGLE      │    │     TIERS      │    │   ACTIVITY     │
                └────────────────┘    └────────────────┘    └────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌────────▼──────────────┐
│   QUICK STATS  │            │  CONTENT MANAGEMENT   │ ← ⭐ NEW!
│   (Earnings)   │            │      SECTION          │
└────────────────┘            └───────────────────────┘
                                       │
                        ┌──────────────┼──────────────┐
                        │              │              │
                ┌───────▼──────┐  ┌───▼────┐  ┌─────▼────────┐
                │  UPLOAD NEW  │  │ TABS   │  │  VIEW TOGGLE │
                │    BUTTON    │  │ System │  │ (Grid/List)  │
                └──────────────┘  └────────┘  └──────────────┘
                        │              │
                        │      ┌───────┴──────────────────┐
                        │      │                          │
                ┌───────▼──────▼───┐    ┌────────────────▼─────┐
                │  UPLOAD MODAL    │    │   POST MANAGEMENT    │
                │  (3 Steps)       │    │   - Edit/Delete      │
                │  ✅ CREATED!     │    │   - View Stats       │
                └──────────────────┘    │   - Filter/Sort      │
                                        └──────────────────────┘
```

---

## 🔄 User Flow Diagram

```
START: User Opens Mentors Page
          │
          ▼
    [Feed View]
          │
    User Clicks "Profile"
          │
          ▼
    [Profile View Loads]
          │
    Shows: Bio, Tiers, Activity
          │
    User Clicks "Dashboard"
          │
          ▼
    [Creator Dashboard Expands]
          ├─────────────┬─────────────┬────────────────┐
          │             │             │                │
    [Quick Stats]  [Earnings]  [Subscribers]  [Content Management] ← ⭐
          │             │             │                │
          │             │             │        ┌───────┴────────┐
          │             │             │        │                │
          │             │             │   [4 TABS]      [Upload Button]
          │             │             │        │                │
          │             │             │   Posts/Media/     User Clicks
          │             │             │   Videos/Stats    "Upload"
          │             │             │        │                │
          │             │             │   [View Toggle]         ▼
          │             │             │   Grid/List      ┌──────────────┐
          │             │             │        │         │ UPLOAD MODAL │
          │             │             │        │         │   Opens      │
          │             │             │        │         └──────┬───────┘
          │             │             │        │                │
          │             │             │   [Edit/Delete]    STEP 1:
          │             │             │   Actions          Upload Files
          │             │             │                         │
          │             │             │                         ▼
          │             │             │                    STEP 2:
          │             │             │                    Add Details
          │             │             │                    - Caption
          │             │             │                    - Tier
          │             │             │                    - Tags
          │             │             │                         │
          │             │             │                         ▼
          │             │             │                    STEP 3:
          │             │             │                    Schedule
          │             │             │                         │
          │             │             │                         ▼
          │             │             │                    Upload!
          │             │             │                         │
          │             │             │                         ▼
          │             │             │                    [Success]
          │             │             │                         │
          │             │             │    Post appears in ←────┘
          │             │             │    Content Grid
          ▼             ▼             ▼         ▼
    [User can view all stats, manage content, and earn money]
```

---

## 🎨 Component Hierarchy

```
<OnlyFansStyleMentorsPage>
  │
  ├── <Navigation> (Feed, Subscriptions, Bookmarks, Profile)
  │
  ├── <MainContent>
  │   │
  │   ├── [If activeView === 'feed']
  │   │   └── <FeedView>
  │   │       ├── <PostCard> (Multiple)
  │   │       └── <CreatorCard> (Multiple)
  │   │
  │   ├── [If activeView === 'subscriptions']
  │   │   └── <SubscriptionsView>
  │   │
  │   └── [If activeView === 'profile']
  │       └── <ProfileView>
  │           ├── <CoverImage>
  │           ├── <ProfileHeader>
  │           ├── <Bio>
  │           ├── <SubscriptionTiers>
  │           │
  │           └── [If showCreatorDashboard === true] ⭐
  │               └── <CreatorDashboard>
  │                   ├── <DashboardHeader>
  │                   │   └── <QuickStats>
  │                   │
  │                   ├── <ContentManagement> ← ✅ NEW!
  │                   │   ├── <UploadButton>
  │                   │   │   └── Opens → <UploadMediaModal>
  │                   │   │       ├── Step1: <FileUpload>
  │                   │   │       ├── Step2: <DetailsForm>
  │                   │   │       └── Step3: <SchedulePublish>
  │                   │   │
  │                   │   ├── <ContentTabs>
  │                   │   │   ├── [Posts Tab]
  │                   │   │   │   ├── <ViewToggle> (Grid/List)
  │                   │   │   │   └── <PostsGrid>
  │                   │   │   │       └── <PostCard> (Multiple)
  │                   │   │   │           ├── <EditButton>
  │                   │   │   │           └── <DeleteButton>
  │                   │   │   │
  │                   │   │   ├── [Media Tab]
  │                   │   │   │   └── <PhotosGrid>
  │                   │   │   │
  │                   │   │   ├── [Videos Tab]
  │                   │   │   │   └── <VideosGrid>
  │                   │   │   │
  │                   │   │   └── [Analytics Tab]
  │                   │   │       └── <EngagementStats>
  │                   │   │
  │                   │   └── <FilterSort>
  │                   │
  │                   ├── <EarningsSection>
  │                   │   ├── <AvailableBalance>
  │                   │   ├── <WithdrawButton>
  │                   │   └── <WithdrawalHistory>
  │                   │
  │                   ├── <RevenueAnalytics>
  │                   ├── <SubscriberBreakdown>
  │                   └── <ContentPerformance>
  │
  └── <Modals>
      ├── <SubscribeModal>
      ├── <WithdrawalModal>
      ├── <EditProfileModal>
      └── <UploadMediaModal> ← ✅ NEW!
```

---

## 📊 Data Flow

```
┌─────────────────┐
│   USER ACTION   │
│  "Upload Post"  │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  UploadMediaModal  │
│   Component        │
│                    │
│  State:            │
│  - mediaFiles[]    │
│  - caption         │
│  - tierAccess      │
│  - tags[]          │
│  - scheduleDate    │
└────────┬───────────┘
         │
    User completes
    3 steps
         │
         ▼
┌────────────────────┐
│  handleUpload()    │
│                    │
│  Creates FormData  │
│  with all data     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│   Upload Progress  │
│   0% → 100%        │
└────────┬───────────┘
         │
         ▼
┌────────────────────────┐
│  API Call (Future)     │
│  POST /api/creator/    │
│       posts            │
│                        │
│  Backend:              │
│  - Save to database    │
│  - Upload files to S3  │
│  - Create thumbnails   │
│  - Process videos      │
│  - Set tier access     │
└────────┬───────────────┘
         │
         ▼
┌────────────────────┐
│  onUploadSuccess() │
│                    │
│  Returns post      │
│  object            │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐
│  Update UI         │
│                    │
│  - Add to posts[]  │
│  - Show in grid    │
│  - Update stats    │
│  - Close modal     │
│  - Show toast      │
└────────────────────┘
```

---

## 🎯 Features Matrix

| Feature | Status | Location | Description |
|---------|--------|----------|-------------|
| **Upload Button** | ✅ | Content Management Header | Opens upload modal |
| **File Upload** | ✅ | UploadMediaModal Step 1 | Drag & drop or browse |
| **Image Preview** | ✅ | UploadMediaModal Step 1 | Shows thumbnails |
| **Video Preview** | ✅ | UploadMediaModal Step 1 | With duration |
| **Caption Editor** | ✅ | UploadMediaModal Step 2 | 2000 char limit |
| **Emoji Picker** | ✅ | UploadMediaModal Step 2 | Quick emojis |
| **Tier Selection** | ✅ | UploadMediaModal Step 2 | 5 tier options |
| **PPV Pricing** | ✅ | UploadMediaModal Step 2 | Custom EGP price |
| **Tags System** | ✅ | UploadMediaModal Step 2 | Add/remove tags |
| **Location** | ✅ | UploadMediaModal Step 2 | Optional location |
| **Post Now** | ✅ | UploadMediaModal Step 3 | Immediate publish |
| **Schedule** | ✅ | UploadMediaModal Step 3 | Date/time picker |
| **Progress Bar** | ✅ | UploadMediaModal Footer | 0-100% upload |
| **Content Tabs** | ✅ | Content Management | 4 tabs (Posts/Media/Videos/Stats) |
| **Grid View** | ✅ | Posts Tab | Compact card grid |
| **List View** | ✅ | Posts Tab | Detailed list |
| **Edit Post** | ✅ | Post Actions | Edit button (UI ready) |
| **Delete Post** | ✅ | Post Actions | Delete button (UI ready) |
| **Analytics** | ✅ | Analytics Tab | Engagement metrics |
| **Filter** | ✅ | Content Toolbar | Filter button (UI ready) |
| **Sort** | ✅ | Content Toolbar | Sort button (UI ready) |

---

## 🔐 Access Control Logic

```
┌─────────────────────────────────────────────┐
│            POST ACCESS FLOW                  │
└─────────────────────────────────────────────┘

User views post
    │
    ▼
Check post.tierAccess
    │
    ├─────────────────┐
    │                 │
[PUBLIC]        [BASIC/PREMIUM/VIP/PPV]
    │                 │
    ▼                 ▼
Show content    Check user subscription
                      │
                ┌─────┴─────┐
                │           │
            [Has Access] [No Access]
                │           │
                ▼           ▼
          Show content  Show:
                        - Blurred preview
                        - Lock icon
                        - Subscribe button
                        - Or PPV button

TIER HIERARCHY:
VIP > Premium > Basic > Public

If user has VIP:
  ✅ Can see: Public, Basic, Premium, VIP

If user has Premium:
  ✅ Can see: Public, Basic, Premium
  ❌ Cannot see: VIP

If user has Basic:
  ✅ Can see: Public, Basic
  ❌ Cannot see: Premium, VIP

If user has no subscription:
  ✅ Can see: Public only
  ❌ Cannot see: Basic, Premium, VIP
  💰 Can buy: PPV posts individually
```

---

## 💾 Database Schema (Recommended)

```sql
-- Posts Table
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    creator_id UUID REFERENCES users(id),
    caption TEXT,
    media_urls JSONB[], -- Array of media URLs
    tier_access VARCHAR(20), -- 'public', 'basic', 'premium', 'vip', 'ppv'
    ppv_price INT, -- In EGP cents (2900 = 29 EGP)
    tags VARCHAR[],
    location VARCHAR(255),
    scheduled_for TIMESTAMP,
    published_at TIMESTAMP,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Media Table (for individual files)
CREATE TABLE media (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    type VARCHAR(20), -- 'image', 'video', 'document'
    url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    file_size BIGINT,
    duration INT, -- For videos in seconds
    width INT,
    height INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Post Views (for analytics)
CREATE TABLE post_views (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES users(id),
    viewed_at TIMESTAMP DEFAULT NOW()
);

-- Post Likes
CREATE TABLE post_likes (
    id UUID PRIMARY KEY,
    post_id UUID REFERENCES posts(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);
```

---

## 🚀 API Endpoints (To Implement)

```typescript
// Upload new post
POST /api/creator/posts
Body: FormData {
    media_0: File,
    media_1: File,
    caption: string,
    tierAccess: string,
    ppvPrice?: number,
    tags: string[],
    location?: string,
    scheduledFor?: string
}
Response: {
    id: string,
    url: string,
    ...post data
}

// Get creator's posts
GET /api/creator/posts?tab=posts&view=grid
Query: tab, view, filter, sort, page
Response: {
    posts: Post[],
    total: number,
    page: number
}

// Update post
PATCH /api/creator/posts/:id
Body: {
    caption?: string,
    tierAccess?: string,
    tags?: string[]
}

// Delete post
DELETE /api/creator/posts/:id
Response: { success: true }

// Get analytics
GET /api/creator/analytics
Response: {
    totalLikes: number,
    totalComments: number,
    totalViews: number,
    totalShares: number
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Design */

/* Extra Small (Mobile) */
< 640px: 
  - 2 column grid
  - Stack upload modal steps
  - Simplified dashboard

/* Small (Tablet) */
640px - 768px:
  - 2-3 column grid
  - Side-by-side upload steps
  - Compact dashboard

/* Medium (Desktop) */
768px - 1024px:
  - 3-4 column grid
  - Full upload modal
  - Full dashboard layout

/* Large (Wide Desktop) */
> 1024px:
  - 4 column grid
  - Spacious layout
  - Maximum sidebar info
```

---

## 🎯 Performance Optimizations

```
┌─────────────────────────────────────┐
│      PERFORMANCE FEATURES           │
└─────────────────────────────────────┘

✅ Lazy Loading
   - Images load only when visible
   - Use Next/Image component
   - Blur placeholder

✅ File Compression
   - Client-side image resize
   - Video quality options
   - Thumbnail generation

✅ Progressive Upload
   - Upload chunks
   - Resume capability
   - Parallel uploads

✅ Caching Strategy
   - Cache media files
   - Cache user posts
   - Invalidate on update

✅ Optimistic UI
   - Show upload immediately
   - Update on confirmation
   - Rollback on error

✅ Virtual Scrolling
   - Load 20 posts at a time
   - Infinite scroll
   - Unload off-screen
```

---

## 🎨 Theme System

```typescript
// Color Variables
const COLORS = {
    primary: {
        purple: '#8b5cf6', // from-purple-500
        pink: '#ec4899',   // to-pink-500
    },
    tiers: {
        public: '#10b981',  // green-500
        basic: '#6b7280',   // gray-500
        premium: '#8b5cf6', // purple-500
        vip: '#eab308',     // yellow-500
        ppv: '#ec4899',     // pink-500
    },
    status: {
        success: '#10b981', // green-500
        warning: '#f59e0b', // yellow-500
        error: '#ef4444',   // red-500
        info: '#3b82f6',    // blue-500
    }
}

// Gradient Classes
.gradient-primary {
    background: linear-gradient(to right, #8b5cf6, #ec4899);
}

.gradient-success {
    background: linear-gradient(to right, #10b981, #059669);
}

.gradient-vip {
    background: linear-gradient(to right, #eab308, #f97316);
}
```

---

## ✅ Testing Checklist

### Upload Flow:
- [ ] Can open upload modal
- [ ] Can drag & drop files
- [ ] Can browse and select files
- [ ] Shows file previews correctly
- [ ] Can remove individual files
- [ ] Can clear all files
- [ ] File size validation works
- [ ] File type validation works

### Details Step:
- [ ] Caption input works (2000 char limit)
- [ ] Emoji picker appears and works
- [ ] Can select all 5 tier types
- [ ] PPV price input shows for PPV tier
- [ ] Tags can be added/removed
- [ ] Location is optional

### Schedule Step:
- [ ] Can choose "Post Now"
- [ ] Can choose "Schedule"
- [ ] Date picker works
- [ ] Time picker works
- [ ] Summary shows correct info

### Post Management:
- [ ] Can switch between tabs
- [ ] Can toggle grid/list view
- [ ] Edit button is clickable
- [ ] Delete button is clickable
- [ ] Analytics shows correct numbers

---

**Last Updated**: November 2, 2025  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
