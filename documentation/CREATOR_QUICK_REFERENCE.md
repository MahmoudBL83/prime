# Creator Dashboard Quick Reference

## 🎯 Available Pages

### 1. Course Builder
**URL:** `http://localhost:3000/en/creator/courses/new`

**What it does:**
- Create new courses (Category A, B, or C)
- 4-step wizard: Info → Curriculum → Pricing → Settings
- Upload videos, generate transcripts/captions
- Set pricing and DRM options

**Key Features:**
- Category selection with revenue info
- Lesson management (video, quiz, assignment)
- AI-powered transcript/caption generation
- Save draft functionality

---

### 2. Live Studio
**URL:** `http://localhost:3000/en/creator/live-studio`

**What it does:**
- Start live streaming sessions
- Control camera, mic, screen sharing
- Monitor stream health and viewer stats
- Manage live chat

**Key Features:**
- Real-time stream health (bitrate, FPS, latency)
- Viewer count & engagement metrics
- Recording controls
- Stream key for OBS integration

---

### 3. Analytics Dashboard
**URL:** `http://localhost:3000/en/creator/analytics`

**What it does:**
- View comprehensive performance metrics
- Track revenue by category
- Monitor student engagement
- Analyze geographic distribution

**Key Features:**
- Time range selector (7d, 30d, 90d, 1y, all)
- Revenue breakdown (A/B/C categories)
- Top performing courses
- Export to CSV

---

## 💰 Pricing System

### Current Prices (from `/config/pricing.ts`)

| Category | Monthly | Yearly (20% off) | Description |
|----------|---------|------------------|-------------|
| Category A | 199 EGP | 1,910 EGP | All-Access Library |
| Category B | 299 EGP | 2,870 EGP | Signature Courses |
| Category C | 99 EGP | 950 EGP | Creator Channel (base) |
| Bundle A+B | 399 EGP | 3,830 EGP | Save 99 EGP/month |
| Bundle ABC | 449 EGP | 4,310 EGP | Save 148 EGP/month |

### Creator Revenue Share

- **Category A:** Usage-based (watch time weighted)
- **Category B:** Negotiated (fixed fee + revenue share)
- **Category C:** 80% (after 20% platform fee + processing)

---

## 🔗 Navigation

### Main Creator Hub (Profile Menu)
When logged in as CREATOR, the profile dropdown includes:
- Content → `/creator/content/posts`
- Live Sessions → `/creator/live`
- Earnings → `/creator/earnings`
- Analytics → `/creator/analytics`

### Creator Dashboard
- Main Dashboard → `/creator/dashboard`
- Create Course → `/creator/courses/new`
- Live Studio → `/creator/live-studio`
- Analytics → `/creator/analytics`

---

## 🎨 UI Components Used

### Common Elements
- `Button` - Primary actions
- `Badge` - Status indicators
- `Progress` - Upload/loading bars
- `Card` - Content containers

### Icons (Lucide React)
- `BookOpen` - Course content
- `Radio` - Live streaming
- `BarChart3` - Analytics
- `Video`, `Mic`, `Monitor` - AV controls
- `DollarSign` - Revenue/pricing
- `Users` - Students/viewers

---

## ⚙️ Settings Available

### Course Settings
- **DRM:** Protect videos from copying
- **Watermark:** Add overlay to videos
- **Offline Download:** Allow/disallow downloads
- **Certificate:** Issue completion certificates
- **Max Students:** Limit enrollment (Category B only)

### Live Stream Settings
- **Title & Description:** Stream metadata
- **Category:** Lecture/Q&A/Workshop/Demo/Other
- **Public/Private:** Visibility control
- **Enable Chat:** Live chat toggle
- **Auto-Record:** Save stream automatically

---

## 📊 Metrics Explained

### Views
Total number of video views across all content

### Watch Time
Average minutes:seconds per student per session

### Completion Rate
Percentage of students who finish courses

### Churn Rate
Percentage of students who stop engaging
- < 5%: Excellent
- 5-10%: Good
- > 10%: Needs improvement

### Revenue
Total earnings across all categories (before payout)

---

## 🚦 Status Indicators

### Course Status
- **Draft:** Not published, editable
- **Under Review:** Submitted for approval (Category A)
- **Published:** Live and accessible
- **Archived:** Hidden from students

### Stream Health
- **Excellent:** All metrics optimal (green)
- **Good:** Stable streaming (blue)
- **Fair:** Minor issues (yellow)
- **Poor:** Connection problems (red)

---

## 🔑 Access Requirements

### All Creator Pages
- Must be logged in
- Role must be `CREATOR`
- Otherwise redirected to login or dashboard

### Special Requirements
- **Category B:** Invitation-only (shows warning)
- **Live Studio:** Camera/mic permissions required
- **Analytics:** Data available after first content published

---

## 🌍 Language Support

### Available Languages
- **English (en):** Default
- **Arabic (ar):** Full RTL support

### Switch Language
Change URL: `/en/...` → `/ar/...`

Example:
- English: `http://localhost:3000/en/creator/analytics`
- Arabic: `http://localhost:3000/ar/creator/analytics`

---

## 🐛 Known Limitations (Current Demo)

### Backend Not Implemented
- API endpoints return 404 (handled gracefully)
- No actual video upload storage
- No real-time streaming backend
- Analytics data is simulated

### Workarounds for Demo
- Mock data in frontend state
- Simulated progress bars
- Toast notifications for feedback
- No database persistence

---

## 📱 Responsive Breakpoints

- **Mobile:** < 768px (single column)
- **Tablet:** 768px - 1024px (2 columns)
- **Desktop:** > 1024px (3-4 columns)

All pages tested and working across devices.

---

## 🎬 Demo Flow

### Creating a Course
1. Go to `/creator/courses/new`
2. Select category (A, B, or C)
3. Fill in title, description, thumbnail
4. Add learning outcomes
5. Next → Add lessons with videos
6. Next → Set pricing (if Category C)
7. Next → Configure settings (DRM, etc.)
8. Submit for Review or Publish

### Going Live
1. Go to `/creator/live-studio`
2. Set stream title in settings
3. Allow camera/mic permissions
4. Click "GO LIVE" button
5. Monitor viewer count and health
6. Interact via live chat
7. Click "END STREAM" when done

### Viewing Analytics
1. Go to `/creator/analytics`
2. Select time range (default: 30 days)
3. Review key metrics cards
4. Check revenue breakdown
5. View top performing courses
6. Export data (CSV download)

---

## 🔧 Troubleshooting

### "Access Denied" Error
- Ensure logged in as CREATOR role
- Check session in profile menu

### Camera/Mic Not Working
- Grant browser permissions
- Check device settings
- Reload page and try again

### Upload Progress Stuck
- Simulated upload (no backend)
- Progress completes after few seconds
- Check console for errors

### Analytics Not Loading
- API endpoint not implemented
- Shows loading state indefinitely
- Add mock data in component for demo

---

**Last Updated:** January 2025  
**Version:** 1.0.0 (Frontend Complete)
