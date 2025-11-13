# Cohort System - Navigation Guide

## 🎯 How to Access Cohorts in the UI

### For **CREATORS** (Instructors):

#### 1. **Creator Dashboard** (`/creator/dashboard`)
- ✅ **Added in sidebar navigation**
- Look for: **"Cohorts"** button with Users icon
- Located between "Analytics" and "Settings"
- Click to go to `/creator/cohorts`

#### 2. **Creator Courses Page** (`/creator/courses`)
- ✅ **Added in sidebar navigation**
- Same navigation as dashboard
- Click "Cohorts" in left sidebar

#### 3. **Creator Analytics Page** (`/creator/analytics`)
- ✅ **Added in sidebar navigation**
- Same consistent sidebar across all creator pages
- Click "Cohorts" to access

#### 4. **Direct URL**
```
/en/creator/cohorts  (English)
/ar/creator/cohorts  (Arabic)
```

---

### For **STUDENTS** (Learners):

#### 1. **Student Dashboard** (`/student/dashboard`)
- Direct URL: `/en/student/dashboard` or `/ar/student/dashboard`
- Shows all enrolled cohorts
- View progress, upcoming sessions, unread announcements

#### 2. **Browse Cohorts** (`/student/cohorts`)
- Direct URL: `/en/student/cohorts` or `/ar/student/cohorts`
- Discover all available cohorts
- Filter by: Open for Enrollment, Starting Soon, Active
- Search by title/description

#### 3. **Cohort Detail Page** (`/student/cohorts/[id]`)
- View full cohort information
- Apply to join
- See enrollment status

---

## 📍 Navigation Structure

### Creator Flow:
```
Creator Dashboard
    └── Sidebar Navigation
        ├── Dashboard
        ├── Courses
        ├── Analytics
        ├── Cohorts ⭐ (NEW)
        ├── ─────────
        └── Settings
```

### Cohorts Management:
```
/creator/cohorts
    ├── Create New Cohort
    ├── View All Cohorts (Draft, Open, Active, Completed)
    └── Click on Cohort
        └── /creator/cohorts/[id]
            ├── Overview Tab
            ├── Members Tab (Approve/Manage)
            ├── Sessions Tab (Schedule/Attendance)
            ├── Announcements Tab (Post updates)
            ├── Milestones Tab (Assign deadlines)
            └── Analytics Tab (Track progress)
```

### Student Flow:
```
Student Experience
    ├── Browse Cohorts (/student/cohorts)
    │   ├── Filter & Search
    │   ├── View Cohort Card
    │   └── Click → Cohort Detail
    │
    ├── Cohort Detail (/student/cohorts/[id])
    │   ├── View Info
    │   ├── Apply to Join
    │   └── If Enrolled → Go to Dashboard
    │
    └── Student Dashboard (/student/dashboard)
        ├── View All My Cohorts
        ├── See Progress
        ├── Upcoming Sessions
        └── Click Cohort → Student Cohort Dashboard
            └── /student/cohorts/[id]/dashboard (TODO)
```

---

## 🔗 Quick Access URLs

### Creator URLs:
| Page | English | Arabic |
|------|---------|--------|
| Cohorts List | `/en/creator/cohorts` | `/ar/creator/cohorts` |
| Create Cohort | Click "Create Cohort" button | Click "إنشاء مجموعة" button |
| Cohort Detail | `/en/creator/cohorts/[id]` | `/ar/creator/cohorts/[id]` |

### Student URLs:
| Page | English | Arabic |
|------|---------|--------|
| Browse Cohorts | `/en/student/cohorts` | `/ar/student/cohorts` |
| My Dashboard | `/en/student/dashboard` | `/ar/student/dashboard` |
| Cohort Detail | `/en/student/cohorts/[id]` | `/ar/student/cohorts/[id]` |

---

## 🎨 Visual Navigation Elements

### Sidebar Button Design:
```
┌─────────────────────────────┐
│  👥 Cohorts                 │ ← Users icon
│                             │
│  (Active: Purple gradient)  │
│  (Inactive: Gray text)      │
└─────────────────────────────┘
```

### Arabic Version:
```
┌─────────────────────────────┐
│  المجموعات التعليمية 👥     │
└─────────────────────────────┘
```

---

## 🚀 How to Test Navigation

### Test as Creator:
1. Login as creator account
2. Go to `/en/creator/dashboard`
3. Look at left sidebar
4. Click "Cohorts" button
5. Should navigate to `/en/creator/cohorts`
6. See empty state or existing cohorts
7. Click "Create Cohort" to start

### Test as Student:
1. Login as student account
2. Navigate to `/en/student/cohorts` (or add link in main nav)
3. Browse available cohorts
4. Click "Apply Now" on any cohort
5. Go to `/en/student/dashboard` to see applications
6. Once approved, view cohort dashboard

---

## 🔧 Adding More Navigation Points

### Suggested Additional Access Points:

#### 1. **Main Student Homepage**
Add a "Browse Cohorts" card or link:
```tsx
<Link href="/student/cohorts">
  <Users className="w-6 h-6" />
  <span>Discover Cohorts</span>
</Link>
```

#### 2. **Course Detail Page**
Add "Join Cohort" section if course has active cohorts:
```tsx
{course.cohorts?.length > 0 && (
  <div className="cohort-section">
    <h3>Learn with a Cohort</h3>
    <Link href={`/student/cohorts?courseId=${course.id}`}>
      View Available Cohorts
    </Link>
  </div>
)}
```

#### 3. **User Profile Dropdown**
Add quick link in user menu:
```tsx
<DropdownMenuItem>
  <Users className="w-4 h-4 mr-2" />
  My Cohorts
</DropdownMenuItem>
```

#### 4. **Main Navigation Bar**
Add to top navigation for logged-in users:
```tsx
{session?.user && (
  <Link href="/student/cohorts">
    Cohorts
  </Link>
)}
```

---

## 📝 Current Implementation Status

### ✅ Implemented:
- [x] Creator Dashboard sidebar link
- [x] Creator Courses page sidebar link
- [x] Creator Analytics page sidebar link
- [x] Direct URL access for all pages
- [x] Student cohorts browse page (`/student/cohorts`)
- [x] Student cohort detail page (`/student/cohorts/[id]`)
- [x] Student dashboard page (`/student/dashboard`)

### ⏳ Pending (Future Enhancements):
- [ ] Main homepage cohorts section
- [ ] Top navigation bar link
- [ ] User profile dropdown quick access
- [ ] Course detail page cohort integration
- [ ] Mobile navigation menu
- [ ] Notifications for cohort updates
- [ ] Calendar view integration

---

## 🎯 Recommended Next Steps

1. **Test Current Navigation**
   - Login as creator → Click "Cohorts" in sidebar
   - Should work from dashboard, courses, and analytics pages

2. **Add Main Navigation Link** (Optional)
   - Add "Cohorts" to main site navigation
   - Make it visible only for logged-in users
   - Split by role: Creators see "Manage Cohorts", Students see "Browse Cohorts"

3. **Add Dashboard Widget** (Optional)
   - Add "My Cohorts" widget to student main dashboard
   - Show count of enrolled/pending cohorts
   - Quick link to cohort dashboard

4. **Mobile Menu**
   - Ensure cohorts link appears in mobile hamburger menu
   - Test responsive navigation

---

## 💡 Usage Examples

### Creator Starting a Cohort:
```
1. Go to Creator Dashboard
2. Click "Cohorts" in sidebar
3. Click "Create Cohort"
4. Fill out form (course, dates, max members)
5. Click "Create"
6. Manage members, schedule sessions, post announcements
```

### Student Joining a Cohort:
```
1. Go to /student/cohorts (or click "Browse Cohorts")
2. Filter by "Open for Enrollment"
3. Search for specific topics
4. Click cohort card → View details
5. Click "Apply to Join"
6. Wait for creator approval
7. Once approved, access from /student/dashboard
```

---

## ✅ Conclusion

**Current Access Methods:**

**Creators:**
- ✅ Sidebar navigation on all creator pages
- ✅ Direct URL: `/creator/cohorts`

**Students:**
- ✅ Direct URL: `/student/cohorts` (browse)
- ✅ Direct URL: `/student/dashboard` (my cohorts)

**Recommendations:**
- Add top navigation link for easier discovery
- Add cohorts section to main student homepage
- Add notifications for cohort invitations/updates

The system is **fully functional** and accessible via sidebar navigation and direct URLs! 🚀
