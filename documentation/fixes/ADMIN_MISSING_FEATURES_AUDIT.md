# Admin Panel Missing Features Audit
**Date:** October 16, 2025  
**Blueprint Reference:** Section 4 (Company/Admin Perspective "Mission Control")

## Executive Summary

Based on comprehensive review of Blueprint Section 4.1 (Admin Console), Section 4.2 (Roles & Permissions), and Section 4.3 (Observability), the following **12 critical missing features** have been identified across 5 major areas:

### ✅ Already Implemented (Recent Additions)
- ✅ Support Ticket System (24/7 web ticketing)
- ✅ Enhanced User 360 (subscriptions, tickets, risk flags, activity log)
- ✅ Enhanced Creator 360 (strike history, payout details, contracts)
- ✅ DMCA Workflow System (72-hour auto-takedown)
- ✅ Safety Enhancements (keyword monitoring, message filters, age controls)
- ✅ Pricing & Catalog Manager (products, localized pricing, promotions)
- ✅ Financial Enhancements (AR tracking, ledger export, tax reporting)

---

## 🔴 Critical Missing Features (12 Total)

### 1. Content 360 - Category B Editorial Pipeline
**Blueprint Reference:** Section 4.1 - "Content 360: editorial pipeline for B"

**Current State:**
- ❌ No editorial pipeline for Signature Courses (Category B)
- ❌ No script review workflow
- ❌ No learning design review process
- ❌ No production review gates
- ❌ No invitation/curation system

**Required Features:**
```
Editorial Pipeline Dashboard:
├── Invitation Queue
│   ├── Search creators to invite
│   ├── Send invitation with guidelines
│   ├── Track invitation status (sent/accepted/declined)
│   └── Auto-reminder system
├── Script Review Gate
│   ├── Upload script for review
│   ├── Review status (pending/approved/revisions/rejected)
│   ├── Reviewer comments & feedback
│   ├── Version history
│   └── Approval signatures
├── Learning Design Review Gate
│   ├── Outcomes mapping checklist
│   ├── Assessment alignment review
│   ├── Syllabus structure analysis
│   ├── Learning path validation
│   └── Design approval workflow
├── Production Review Gate
│   ├── Video quality checklist
│   ├── Audio standards verification
│   ├── Caption quality review
│   ├── Workbook review
│   └── Final approval
└── Publishing Control
    ├── Schedule publish date
    ├── Marketing materials approval
    ├── Preview build
    └── Go-live checklist
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~1,200 lines  
**Files to Create:**
- `src/app/admin/signature/editorial/page.tsx` (Editorial Pipeline Dashboard)
- `src/components/admin/EditorialReviewCard.tsx` (Multi-gate review component)

---

### 2. Content 360 - Category C Monitoring Dashboard
**Blueprint Reference:** Section 4.1 - "Content 360: monitoring dashboard for C"

**Current State:**
- ❌ No real-time monitoring for Creator Membership Channels
- ❌ No automated policy compliance checking
- ❌ No education-focus validation
- ❌ No continuous monitoring metrics

**Required Features:**
```
Category C Monitoring Dashboard:
├── Real-Time Feed Monitor
│   ├── Recent posts across all channels (last 24h)
│   ├── Content type distribution (video/text/live)
│   ├── Auto-flagged content (AI moderation)
│   └── Manual review queue
├── Policy Compliance Tracker
│   ├── Education-only policy violations
│   ├── Prohibited content detection
│   ├── Entertainment vs Education scoring
│   └── Strike history per channel
├── Engagement Metrics
│   ├── Post frequency analysis
│   ├── Member activity levels
│   ├── Churn indicators
│   └── Content quality scores
├── Live Session Monitoring
│   ├── Ongoing live sessions
│   ├── Attendance tracking
│   ├── Real-time moderation alerts
│   └── Recording compliance
└── Channel Health Score
    ├── Compliance score (0-100)
    ├── Quality score (0-100)
    ├── Engagement score (0-100)
    └── Overall health status
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~900 lines  
**Files to Create:**
- `src/app/admin/channels/monitoring/page.tsx` (Monitoring Dashboard)
- `src/components/admin/ChannelHealthCard.tsx` (Health metrics component)

---

### 3. Rewards - Complete Scholarship Engine
**Blueprint Reference:** Section 4.1 - "Rewards: configure scholarship rules, eligibility, prize inventory, selection audits, and winner verification"

**Current State:**
- ✅ Basic rewards listing exists
- ❌ No eligibility rule builder
- ❌ No prize inventory management
- ❌ No selection audit trail
- ❌ No winner verification workflow
- ❌ No fraud detection system
- ❌ No compliance checks (region-specific, age verification)

**Required Features:**
```
Scholarship Engine Enhancement:
├── Rule Builder
│   ├── Eligibility criteria composer
│   │   ├── Course completion requirements
│   │   ├── Quiz score thresholds
│   │   ├── Project submission rules
│   │   ├── Age restrictions
│   │   ├── Geographic limitations
│   │   └── Account age requirements
│   ├── Scoring algorithm designer
│   │   ├── Weighted metrics (quiz 40%, project 40%, peer review 20%)
│   │   ├── Objective rubrics
│   │   ├── Instructor verification points
│   │   └── Bonus criteria
│   └── Legal compliance templates
│       ├── Region-specific rules (Egypt, Saudi, UAE)
│       ├── "No purchase necessary" disclaimers
│       ├── Tax implications (over E£600 = tax form)
│       └── Parent consent for minors
├── Prize Inventory
│   ├── Prize pool management
│   │   ├── Cash scholarships
│   │   ├── Learning equipment (laptops, tablets)
│   │   ├── Course credits
│   │   └── Certificates
│   ├── Inventory tracking
│   ├── Cost allocation
│   └── Fulfillment status
├── Selection & Audit
│   ├── Auto-ranking by objective metrics
│   ├── Manual review queue for edge cases
│   ├── Fraud detection
│   │   ├── Multiple accounts
│   │   ├── Plagiarism detection
│   │   ├── Quiz cheating patterns
│   │   └── IP analysis
│   ├── Selection audit log
│   │   ├── Calculation methodology
│   │   ├── Reviewer decisions
│   │   ├── Appeals process
│   │   └── Timestamp trail
│   └── Public transparency report
├── Winner Verification
│   ├── Identity verification (for prizes > E£1,000)
│   │   ├── ID upload
│   │   ├── Selfie verification
│   │   ├── Address proof
│   │   └── Tax information (if required)
│   ├── Eligibility re-check
│   ├── Winner notification workflow
│   ├── Claim deadline tracking
│   └── Prize fulfillment status
└── Compliance Dashboard
    ├── Regional law adherence checklist
    ├── Age verification for minors
    ├── Tax reporting (E£600+ requires forms)
    ├── Public winner announcements
    └── Audit-ready documentation
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~1,500 lines  
**Files to Create:**
- `src/app/admin/rewards/rules/page.tsx` (Rule Builder)
- `src/app/admin/rewards/verification/page.tsx` (Winner Verification)
- `src/components/admin/RuleBuilder.tsx` (Drag-drop rule composer)
- `src/components/admin/FraudDetectionPanel.tsx` (Fraud analysis)

---

### 4. Safety - Ban/Appeal Tooling
**Blueprint Reference:** Section 4.1 - "Safety: ban/appeal tooling"

**Current State:**
- ✅ Abuse reports dashboard exists
- ✅ Message filters exist
- ❌ No structured ban workflow
- ❌ No appeal management system
- ❌ No ban history tracking
- ❌ No auto-expiration system

**Required Features:**
```
Ban & Appeal Management:
├── Ban Workflow
│   ├── Ban Types
│   │   ├── Temporary (1 day, 7 days, 30 days)
│   │   ├── Permanent
│   │   ├── Feature-specific (messaging only, content upload, etc.)
│   │   └── Shadow ban (limited visibility)
│   ├── Ban Reason Categories
│   │   ├── Harassment
│   │   ├── Prohibited content
│   │   ├── Multiple strikes
│   │   ├── Fraud/cheating
│   │   ├── Payment disputes
│   │   └── Terms violation
│   ├── Evidence Attachment
│   │   ├── Screenshots
│   │   ├── Message logs
│   │   ├── Video evidence
│   │   └── Reports
│   ├── Notification Templates
│   │   ├── Email to banned user
│   │   ├── In-app notification
│   │   ├── Appeal instructions
│   │   └── Reinstatement notice
│   └── Auto-expiration (for temporary bans)
├── Appeal Management
│   ├── Appeal Submission Form
│   │   ├── User statement
│   │   ├── Evidence upload
│   │   ├── Circumstance explanation
│   │   └── Contact preferences
│   ├── Appeal Review Queue
│   │   ├── Priority sorting (severity-based)
│   │   ├── Assign to reviewer
│   │   ├── Original ban context display
│   │   ├── User history view
│   │   └── Decision timeline (7 days max)
│   ├── Appeal Decisions
│   │   ├── Uphold ban
│   │   ├── Reduce ban (permanent → temporary)
│   │   ├── Reinstate with warning
│   │   ├── Full reinstatement
│   │   └── Decision notes (visible to user)
│   └── Appeal Audit Trail
│       ├── Reviewer identity
│       ├── Decision rationale
│       ├── Evidence reviewed
│       └── Timestamp log
├── Ban History & Analytics
│   ├── User ban history view
│   ├── Platform-wide ban statistics
│   ├── Ban reason distribution
│   ├── Appeal success rates
│   ├── Repeat offender tracking
│   └── Policy effectiveness metrics
└── Reinstatement Process
    ├── Automatic reinstatement (temp bans)
    ├── Manual reinstatement workflow
    ├── Conditional reinstatement (e.g., complete training)
    ├── Probation period tracking
    └── Reinstatement notification
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~850 lines  
**Files to Create:**
- `src/app/admin/safety/bans/page.tsx` (Ban Management)
- `src/app/admin/safety/appeals/page.tsx` (Appeal Queue)
- `src/components/admin/BanWorkflowModal.tsx` (Ban creation modal)
- `src/components/admin/AppealReviewCard.tsx` (Appeal review interface)

---

### 5. Operations - Communication Templates
**Blueprint Reference:** Section 4.1 - "Operations: communication templates"

**Current State:**
- ❌ No email template management
- ❌ No in-app notification templates
- ❌ No SMS templates
- ❌ No multi-language template support

**Required Features:**
```
Communication Template Manager:
├── Template Categories
│   ├── Onboarding
│   │   ├── Welcome email (learner)
│   │   ├── Welcome email (creator)
│   │   ├── Email verification
│   │   ├── Onboarding tips (day 1, 3, 7)
│   │   └── First course recommendation
│   ├── Subscriptions
│   │   ├── Subscription activated
│   │   ├── Payment received
│   │   ├── Renewal reminder (7 days, 1 day)
│   │   ├── Payment failed
│   │   ├── Subscription cancelled
│   │   └── Refund processed
│   ├── Content & Learning
│   │   ├── Course published (to subscribers)
│   │   ├── New lesson available
│   │   ├── Certificate earned
│   │   ├── Milestone achieved
│   │   └── Course recommendation
│   ├── Safety & Moderation
│   │   ├── Content flagged for review
│   │   ├── Warning issued
│   │   ├── Strike notification
│   │   ├── Account suspended
│   │   ├── Ban appeal received
│   │   └── Reinstatement notice
│   ├── Creator
│   │   ├── Application received
│   │   ├── Application approved
│   │   ├── Application rejected
│   │   ├── Payout processed
│   │   ├── Payout on hold
│   │   ├── Content review required
│   │   └── Strike issued
│   ├── Rewards
│   │   ├── Contest announcement
│   │   ├── Eligibility confirmation
│   │   ├── Winner notification
│   │   ├── Prize shipped
│   │   └── Scholarship awarded
│   └── Support
│       ├── Ticket received
│       ├── Ticket updated
│       ├── Ticket resolved
│       └── Satisfaction survey
├── Template Editor
│   ├── Rich text editor (WYSIWYG)
│   ├── Variable insertion {{user.name}}, {{course.title}}
│   ├── Conditional blocks (if user.isPremium)
│   ├── Preview with sample data
│   ├── Subject line editor
│   ├── Preheader text
│   ├── CTA button customization
│   └── Footer customization
├── Multi-Language Support
│   ├── Arabic translations
│   ├── English translations
│   ├── RTL layout support
│   ├── Language auto-detection
│   └── Fallback language
├── Multi-Channel
│   ├── Email (HTML + plain text)
│   ├── In-app notifications
│   ├── SMS (limited to critical alerts)
│   ├── Push notifications (mobile)
│   └── WhatsApp (Egypt focus)
├── Testing & QA
│   ├── Send test email
│   ├── Preview across devices
│   ├── A/B testing variants
│   ├── Spam score checker
│   └── Link validation
├── Analytics
│   ├── Open rates
│   ├── Click-through rates
│   ├── Unsubscribe rates
│   ├── Delivery rates
│   └── Template performance comparison
└── Version Control
    ├── Template history
    ├── Rollback to previous version
    ├── Change log
    └── Approval workflow (for critical templates)
```

**Implementation Priority:** 🟡 MEDIUM  
**Estimated Lines of Code:** ~1,100 lines  
**Files to Create:**
- `src/app/admin/settings/communication/page.tsx` (Template Manager)
- `src/components/admin/TemplateEditor.tsx` (Rich text editor)
- `src/components/admin/TemplatePreview.tsx` (Multi-device preview)

---

### 6. Roles & Permissions - Granular Permission Assignment
**Blueprint Reference:** Section 4.2 - "Granular permissions by area"

**Current State:**
- ✅ Basic role/permission page exists
- ❌ No resource-level permissions (e.g., "edit only own team's content")
- ❌ No time-based permissions (temporary elevated access)
- ❌ No permission request workflow
- ❌ No permission audit trail

**Required Features:**
```
Enhanced Permission System:
├── Granular Permission Levels
│   ├── Global Permissions (entire platform)
│   ├── Department Permissions (Safety, Content, Finance)
│   ├── Resource Permissions (specific courses, creators, channels)
│   ├── Team Permissions (assigned team members only)
│   └── Time-based Permissions (expires after X days)
├── Permission Request Workflow
│   ├── Request elevated access
│   ├── Justification requirement
│   ├── Approval chain (manager → admin)
│   ├── Auto-approval for low-risk permissions
│   ├── Expiration date setting
│   └── Auto-revoke after expiration
├── Advanced Role Builder
│   ├── Clone existing role
│   ├── Permission bundles (common combinations)
│   ├── Custom role creation
│   ├── Permission dependencies (e.g., edit requires view)
│   ├── Risk level indicator per permission
│   └── Impact analysis ("5 users will be affected")
├── Permission Audit Trail
│   ├── Who granted permission
│   ├── When permission was granted
│   ├── Why permission was granted (justification)
│   ├── Permission usage log
│   ├── Permission revocation log
│   └── Suspicious activity alerts
├── Role Templates
│   ├── Super Admin (full access)
│   ├── Content Ops (content review focus)
│   ├── Trust & Safety (moderation focus)
│   ├── Finance Ops (financial operations)
│   ├── Editorial (Signature course curation)
│   ├── Creator Success (creator support)
│   ├── Support Agent (ticket handling)
│   ├── Analyst (read-only analytics)
│   └── Custom role (build from scratch)
└── Permission Policies
    ├── Separation of duties (no one can approve own actions)
    ├── Two-person rule (critical actions need 2 approvals)
    ├── Maximum permission duration (90 days max for temp access)
    ├── Mandatory permission review (every 6 months)
    └── Auto-suspend inactive admin accounts (30 days)
```

**Implementation Priority:** 🟡 MEDIUM  
**Estimated Lines of Code:** ~700 lines  
**Files to Modify:**
- `src/app/admin/permissions/page.tsx` (Enhance existing page)
- Create: `src/components/admin/PermissionRequestModal.tsx`
- Create: `src/components/admin/PermissionAuditLog.tsx`

---

### 7. Observability - Real-Time Metrics Dashboard
**Blueprint Reference:** Section 4.3 - "Real-time metrics (signups, activations, DAU/WAU/MAU, conversion, retention, LTV/CAC, refunds, creator churn, review SLA, abuse response time)"

**Current State:**
- ✅ Basic analytics page exists with some metrics
- ❌ No real-time monitoring (all stats are static)
- ❌ No DAU/WAU/MAU tracking
- ❌ No conversion funnel visualization
- ❌ No retention cohort analysis
- ❌ No LTV/CAC calculation
- ❌ No SLA monitoring
- ❌ No alerting system

**Required Features:**
```
Real-Time Observability Dashboard:
├── Live Activity Monitor
│   ├── Active users (last 5 min)
│   ├── Active sessions
│   ├── Current video plays
│   ├── Ongoing live sessions
│   ├── Messages per second
│   └── API requests per second
├── Growth Metrics
│   ├── Signups
│   │   ├── Today vs yesterday
│   │   ├── Last 7 days trend
│   │   ├── Source breakdown (organic, referral, paid)
│   │   └── Conversion rate (visitor → signup)
│   ├── Activations
│   │   ├── First lesson started (within 24h)
│   │   ├── Activation rate (signup → activated)
│   │   ├── Time to activation (median)
│   │   └── Activation funnel drop-offs
│   ├── DAU/WAU/MAU
│   │   ├── Daily Active Users (last 30 days trend)
│   │   ├── Weekly Active Users (last 12 weeks trend)
│   │   ├── Monthly Active Users (last 12 months trend)
│   │   ├── DAU/MAU ratio (stickiness)
│   │   └── WAU/MAU ratio
│   └── Conversion Funnels
│       ├── Visitor → Signup → Activation → Subscription
│       ├── Course view → Enroll → Complete
│       ├── Creator discovery → Profile view → Subscribe
│       └── Drop-off analysis at each stage
├── Retention & Engagement
│   ├── Retention Cohorts
│   │   ├── Day 1, 7, 30, 90 retention by cohort
│   │   ├── Cohort size
│   │   ├── Retention curve visualization
│   │   └── Retention by acquisition channel
│   ├── Churn Analysis
│   │   ├── User churn rate (monthly)
│   │   ├── Subscription cancellation rate
│   │   ├── Creator churn rate
│   │   ├── Churn reasons (survey data)
│   │   └── Predicted churn (ML model)
│   └── Engagement Metrics
│       ├── Average session duration
│       ├── Sessions per user per week
│       ├── Content consumption (hours/week)
│       ├── Study buddy match rate
│       └── Message frequency
├── Monetization Metrics
│   ├── LTV (Lifetime Value)
│   │   ├── Average LTV per user
│   │   ├── LTV by cohort
│   │   ├── LTV by acquisition channel
│   │   ├── LTV by subscription tier
│   │   └── LTV prediction model
│   ├── CAC (Customer Acquisition Cost)
│   │   ├── Total CAC
│   │   ├── CAC by channel (organic, paid, referral)
│   │   ├── CAC trend (last 6 months)
│   │   └── CAC payback period
│   ├── LTV/CAC Ratio
│   │   ├── Current ratio (target: 3:1)
│   │   ├── Trend over time
│   │   ├── By acquisition channel
│   │   └── Health indicator
│   ├── Revenue Metrics
│   │   ├── MRR (Monthly Recurring Revenue)
│   │   ├── ARR (Annual Recurring Revenue)
│   │   ├── ARPU (Average Revenue Per User)
│   │   ├── Revenue by category (A/B/C)
│   │   └── Revenue growth rate
│   └── Refund Metrics
│       ├── Refund rate (target: <5%)
│       ├── Refund amount
│       ├── Refund reasons
│       ├── Refund trend
│       └── Chargeback rate
├── Operational SLAs
│   ├── Content Review SLA
│   │   ├── Average review time (target: <24h)
│   │   ├── SLA breach count
│   │   ├── Queue size
│   │   └── Reviewer performance
│   ├── Creator Approval SLA
│   │   ├── Average approval time (target: <10 days)
│   │   ├── Pending applications
│   │   ├── SLA breach count
│   │   └── Approval rate
│   ├── Support Ticket SLA
│   │   ├── Average response time (target: <2h)
│   │   ├── Average resolution time (target: <24h)
│   │   ├── SLA breach count
│   │   └── CSAT score
│   ├── Payout SLA
│   │   ├── Average payout processing time (target: <3 days)
│   │   ├── Pending payouts
│   │   ├── On-hold payouts
│   │   └── Failed payout rate
│   └── Abuse Response SLA
│       ├── Average response time to reports (target: <1h critical, <24h others)
│       ├── Open abuse reports
│       ├── Response time by severity
│       └── False positive rate
├── Creator Health
│   ├── Active creators (published in last 30 days)
│   ├── Creator churn rate
│   ├── Average creator earnings
│   ├── Creator satisfaction score
│   ├── Content upload frequency
│   ├── Creator support ticket rate
│   └── At-risk creators (low engagement)
├── Platform Health
│   ├── Error rate (API errors)
│   ├── Average response time (API)
│   ├── Uptime percentage (target: 99.9%)
│   ├── Failed payment rate
│   ├── Video streaming quality (buffering rate)
│   ├── Search performance
│   └── Infrastructure costs
└── Alerting & Notifications
    ├── Metric threshold alerts (e.g., signups drop >20%)
    ├── SLA breach alerts
    ├── Anomaly detection (unusual patterns)
    ├── Critical system alerts
    ├── Daily digest email
    └── Slack/Teams integration
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~2,000 lines  
**Files to Create:**
- `src/app/admin/observability/page.tsx` (Real-time dashboard)
- `src/components/admin/LiveMetricCard.tsx` (Auto-updating metric cards)
- `src/components/admin/RetentionCohortChart.tsx` (Cohort visualization)
- `src/components/admin/ConversionFunnelChart.tsx` (Funnel visualization)
- `src/components/admin/SLAMonitor.tsx` (SLA tracking component)

---

### 8. Observability - Event Lake & Experimentation
**Blueprint Reference:** Section 4.3 - "Event lake for experimentation and ML ranking"

**Current State:**
- ❌ No event tracking system
- ❌ No A/B testing framework
- ❌ No experiment dashboard
- ❌ No ML ranking feedback loop

**Required Features:**
```
Event Lake & Experimentation Platform:
├── Event Tracking
│   ├── User Events
│   │   ├── Page views
│   │   ├── Course enrollments
│   │   ├── Video plays/pauses
│   │   ├── Search queries
│   │   ├── Study buddy swipes
│   │   └── Feature interactions
│   ├── System Events
│   │   ├── Content published
│   │   ├── Payouts processed
│   │   ├── Moderation actions
│   │   └── System errors
│   └── Business Events
│       ├── Subscriptions
│       ├── Refunds
│       ├── Conversions
│       └── Churn
├── Event Schema Management
│   ├── Event definition registry
│   ├── Schema validation
│   ├── Required vs optional properties
│   ├── Event versioning
│   └── Documentation
├── A/B Testing Framework
│   ├── Experiment Setup
│   │   ├── Hypothesis statement
│   │   ├── Success metrics
│   │   ├── Sample size calculator
│   │   ├── Duration estimator
│   │   └── Variant configuration
│   ├── Traffic Splitting
│   │   ├── User-based (consistent experience)
│   │   ├── Percentage allocation (e.g., 50/50)
│   │   ├── Audience targeting (new users, premium, etc.)
│   │   └── Gradual rollout (5% → 50% → 100%)
│   ├── Experiment Dashboard
│   │   ├── Active experiments
│   │   ├── Metric comparison (control vs variant)
│   │   ├── Statistical significance (p-value)
│   │   ├── Confidence intervals
│   │   ├── Sample size progress
│   │   └── Decision recommendation (ship/kill/iterate)
│   └── Experiment History
│       ├── Past experiments
│       ├── Results summary
│       ├── Learnings captured
│       └── Winning variants
├── ML Ranking System
│   ├── Recommendation Engine
│   │   ├── Course recommendations
│   │   ├── Creator recommendations
│   │   ├── Study buddy matching
│   │   └── Content discovery
│   ├── Feedback Signals
│   │   ├── Clicks (implicit)
│   │   ├── Enrollments (strong signal)
│   │   ├── Completions (strongest signal)
│   │   ├── Ratings (explicit)
│   │   └── Skip/dismiss (negative signal)
│   ├── Model Performance
│   │   ├── Click-through rate (CTR)
│   │   ├── Conversion rate
│   │   ├── Diversity metrics
│   │   ├── Novelty metrics
│   │   └── Model drift detection
│   └── Model Versioning
│       ├── Model registry
│       ├── A/B test models
│       ├── Rollback capability
│       └── Champion/challenger framework
└── Data Warehouse
    ├── Raw event storage (S3/Data Lake)
    ├── Processed data (Redshift/BigQuery)
    ├── Aggregated metrics tables
    ├── Query interface (SQL)
    └── Data export (CSV/Parquet)
```

**Implementation Priority:** 🟡 MEDIUM (Future Phase)  
**Estimated Lines of Code:** ~1,800 lines  
**Files to Create:**
- `src/app/admin/experiments/page.tsx` (Experiment dashboard)
- `src/app/admin/events/page.tsx` (Event tracking dashboard)
- `src/components/admin/ExperimentCard.tsx` (Experiment status card)
- `src/lib/experimentation.ts` (A/B testing logic)
- `src/lib/event-tracking.ts` (Event capture utilities)

---

### 9. Financial - Payout Batches Management
**Blueprint Reference:** Section 4.1 - "Financials: payout batches"

**Current State:**
- ✅ Financial page with basic revenue metrics exists
- ✅ AR tracking, ledger, tax reporting recently added
- ❌ No payout batch processing workflow
- ❌ No batch approval system
- ❌ No reserve management
- ❌ No failed payout handling

**Required Features:**
```
Payout Batch Management:
├── Batch Creation
│   ├── Auto-generate monthly batches
│   ├── Manual batch creation
│   ├── Batch criteria
│   │   ├── Minimum payout threshold (e.g., E£100)
│   │   ├── Account verification status
│   │   ├── Tax form status
│   │   └── Reserve requirements
│   └── Batch scheduling
├── Batch Review
│   ├── Batch Summary
│   │   ├── Total creators in batch
│   │   ├── Total payout amount
│   │   ├── Fee breakdown (platform + processing)
│   │   ├── Net amount to creators
│   │   └── Payment method distribution
│   ├── Creator List
│   │   ├── Creator name/ID
│   │   ├── Earnings breakdown (subscription/course/tips)
│   │   ├── Fees deducted
│   │   ├── Net payout
│   │   ├── Payment method
│   │   └── Status (ready/hold/failed)
│   ├── Hold Management
│   │   ├── Reasons (disputes, fraud review, missing docs)
│   │   ├── Hold duration
│   │   ├── Resolve hold action
│   │   └── Notify creator
│   └── Exclusions
│       ├── Below threshold (< E£100)
│       ├── Missing bank info
│       ├── Suspended accounts
│       └── Tax form incomplete
├── Batch Approval Workflow
│   ├── Initial review (Finance Ops)
│   ├── Second approval (Finance Manager) for batches > E£100k
│   ├── Approval notes
│   ├── Rejection with reason
│   └── Approval signatures
├── Batch Processing
│   ├── Payment gateway integration (Stripe, Bank Transfer)
│   ├── Bulk payment initiation
│   ├── Processing status tracking
│   │   ├── Pending
│   │   ├── In progress
│   │   ├── Completed
│   │   ├── Partially failed
│   │   └── Failed
│   ├── Success/failure notifications
│   └── Receipt generation
├── Failed Payout Handling
│   ├── Failure reason capture
│   │   ├── Invalid bank account
│   │   ├── Account closed
│   │   ├── Insufficient KYC
│   │   ├── Payment rejected
│   │   └── Technical error
│   ├── Retry mechanism (auto-retry 3 times)
│   ├── Manual intervention queue
│   ├── Hold amount for resolution
│   └── Creator notification with action items
├── Reserve Management
│   ├── Reserve percentage (e.g., 10% held for 30 days)
│   ├── Reserve reason (chargeback protection)
│   ├── Reserve release schedule
│   ├── Reserve balance per creator
│   └── Early release requests
└── Payout History & Reporting
    ├── Batch history (all past batches)
    ├── Payout history per creator
    ├── Export batch details (CSV/Excel)
    ├── Tax reporting (1099 equivalent for Egypt)
    ├── Platform fee revenue tracking
    └── Payment method cost analysis
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~1,000 lines  
**Files to Create:**
- `src/app/admin/financial/payouts/page.tsx` (Payout batch dashboard)
- `src/components/admin/PayoutBatchCard.tsx` (Batch summary card)
- `src/components/admin/PayoutApprovalModal.tsx` (Approval workflow)

---

### 10. Study Buddy - Admin Oversight Dashboard
**Blueprint Reference:** Blueprint Section 2.2 + Safety requirements

**Current State:**
- ✅ Basic study buddy page exists at `/admin/study-buddies`
- ❌ No match quality monitoring
- ❌ No abuse/harassment tracking in buddy pairs
- ❌ No match success metrics
- ❌ No age-appropriate matching verification

**Required Features:**
```
Study Buddy Admin Dashboard Enhancement:
├── Match Quality Monitoring
│   ├── Match success rate
│   │   ├── Matches that lead to >3 sessions
│   │   ├── Average session duration per match
│   │   ├── Long-term buddy retention (>30 days)
│   │   └── Unmatch rate
│   ├── Matching Algorithm Performance
│   │   ├── Compatibility score accuracy
│   │   ├── Subject overlap effectiveness
│   │   ├── Timezone alignment success
│   │   └── Algorithm A/B tests
│   └── User Feedback
│       ├── Buddy rating average
│       ├── Mismatch reasons
│       ├── Feature requests
│       └── Satisfaction score
├── Safety & Moderation
│   ├── Age-Appropriate Matching Verification
│   │   ├── Age group compliance (no 14yo matched with 22yo)
│   │   ├── Parental consent verification for minors
│   │   ├── Suspicious age patterns
│   │   └── Override requests review
│   ├── Abuse & Harassment Tracking
│   │   ├── Reported buddy pairs
│   │   ├── Block/report frequency
│   │   ├── Message pattern analysis (harassment keywords)
│   │   ├── Automatic flags (excessive messaging, late-night contact)
│   │   └── Investigation queue
│   ├── Match Termination Analytics
│   │   ├── Reasons for unmatch
│   │   ├── Unilateral vs mutual unmatch
│   │   ├── Time to unmatch (quick = bad match)
│   │   └── User feedback on termination
│   └── High-Risk Buddy Patterns
│       ├── Users with multiple reports
│       ├── Frequent unmatcher (>5 times/month)
│       ├── No-show pattern (accept but never chat)
│       └── Inappropriate behavior flags
├── Matching Analytics
│   ├── Total matches created
│   ├── Active buddy pairs
│   ├── Average time to first match
│   ├── Re-matching frequency
│   ├── Swipe-to-match conversion rate
│   └── Geographic distribution
├── User Behavior Insights
│   ├── Most matched subjects
│   ├── Peak matching times
│   ├── Session length distribution
│   ├── Co-watch usage rate
│   ├── Shared notes/resources usage
│   └── Calendar integration adoption
└── Interventions & Actions
    ├── Suspend matching for flagged users
    ├── Issue warnings for policy violations
    ├── Terminate problematic buddy pairs
    ├── Adjust matching algorithm parameters
    └── Export data for safety review
```

**Implementation Priority:** 🟡 MEDIUM  
**Estimated Lines of Code:** ~600 lines  
**Files to Modify:**
- `src/app/admin/study-buddies/page.tsx` (Enhance with safety/quality metrics)
- Create: `src/components/admin/BuddySafetyPanel.tsx`

---

### 11. Creator Onboarding - Application Review Dashboard Enhancement
**Blueprint Reference:** Section 3.1 - "Review timeline: up to 10 days to approve/decline or request revisions (status tracking in app)"

**Current State:**
- ✅ Basic creator applications page exists
- ❌ No SLA tracking (10-day timeline)
- ❌ No revision request workflow
- ❌ No identity verification integration
- ❌ No bulk review tools
- ❌ No automated pre-screening

**Required Features:**
```
Creator Application Review Enhancement:
├── Application Queue Management
│   ├── Queue Views
│   │   ├── New applications (0-2 days old)
│   │   ├── In review (2-5 days old)
│   │   ├── Awaiting revisions (from creator)
│   │   ├── Near SLA breach (8-10 days old)
│   │   ├── SLA breached (>10 days old) - ALERT
│   │   └── Completed (approved/declined)
│   ├── Priority Sorting
│   │   ├── SLA deadline (oldest first)
│   │   ├── Application quality score (high quality first)
│   │   ├── Creator tier (returning vs new)
│   │   └── Manual priority flag
│   ├── Bulk Actions
│   │   ├── Assign to reviewer
│   │   ├── Bulk approve (pre-screened high-quality)
│   │   ├── Bulk decline (spam/low-quality)
│   │   └── Export applications (CSV)
│   └── SLA Monitoring
│       ├── Average review time (target: <5 days)
│       ├── SLA breach count
│       ├── Reviewer performance
│       └── Daily queue size trend
├── Application Review Interface
│   ├── Application Details
│   │   ├── Bio & expertise
│   │   ├── Sample content preview (video player)
│   │   ├── Teaching goals
│   │   ├── Social proof (LinkedIn, portfolio)
│   │   ├── Requested pricing tier
│   │   └── Application submission date
│   ├── Identity Verification
│   │   ├── ID document display
│   │   ├── Selfie verification match
│   │   ├── KYC status (Stripe/manual)
│   │   ├── Address proof
│   │   └── Verification notes
│   ├── Quality Checklist
│   │   ├── Sample content quality (video/audio)
│   │   ├── Expertise demonstrated
│   │   ├── Teaching approach clarity
│   │   ├── Content uniqueness
│   │   ├── Platform policy understanding
│   │   └── Overall score (0-100)
│   ├── Reviewer Actions
│   │   ├── Approve (immediate access)
│   │   ├── Approve with notes (conditions)
│   │   ├── Request revisions (specific feedback)
│   │   ├── Decline with reason (detailed explanation)
│   │   └── Escalate to senior reviewer
│   └── Communication
│       ├── Email template selection (approval/decline/revisions)
│       ├── Custom message to creator
│       ├── Timeline display (application → review → decision)
│       └── Next steps instructions
├── Revision Request Workflow
│   ├── Request Specific Revisions
│   │   ├── Sample content quality improvement
│   │   ├── Expertise proof (certifications/portfolio)
│   │   ├── Bio/teaching goals clarity
│   │   ├── Identity verification re-submission
│   │   └── Custom revision notes
│   ├── Creator Resubmission
│   │   ├── Notification to creator with action items
│   │   ├── Revision deadline (5 days)
│   │   ├── Resubmission interface for creator
│   │   └── Auto-move to review queue on resubmit
│   ├── Re-review Process
│   │   ├── Highlight changes made
│   │   ├── Compare before/after
│   │   ├── Final approval decision
│   │   └── Escalation if still insufficient
│   └── Revision History
│       ├── Revision request dates
│       ├── Creator response times
│       ├── Reviewer notes
│       └── Number of iterations
├── Automated Pre-Screening
│   ├── Content Quality Checks
│   │   ├── Video resolution (min 720p)
│   │   ├── Audio quality (clear speech detection)
│   │   ├── Video length (min 5 min for sample)
│   │   ├── Profanity detection
│   │   └── Spam detection (auto-reject obvious spam)
│   ├── Identity Verification Pre-Check
│   │   ├── ID document quality check
│   │   ├── Face match confidence score
│   │   ├── Duplicate account detection
│   │   └── Fraud risk assessment
│   ├── Expertise Validation
│   │   ├── LinkedIn profile verification (if provided)
│   │   ├── Portfolio link validation
│   │   ├── Certification authenticity (manual review for high-tier)
│   │   └── Previous teaching experience
│   └── Auto-Approve Criteria (fast-track)
│       ├── All pre-checks passed
│       ├── High-quality sample content (AI score >85)
│       ├── Strong expertise proof
│       ├── Previous platform experience (returning creator)
│       └── Clean identity verification
├── Reviewer Tools
│   ├── Side-by-side comparison (multiple applications)
│   ├── Quick approve/decline hotkeys
│   ├── Sample content playback (video/audio player)
│   ├── Reviewer notes (internal)
│   ├── Collaboration (tag another reviewer for input)
│   └── Performance dashboard (applications reviewed, avg time)
└── Reporting & Analytics
    ├── Application volume (daily/weekly/monthly)
    ├── Approval rate
    ├── Decline reasons distribution
    ├── Average review time
    ├── SLA performance
    ├── Reviewer performance comparison
    ├── Revision request rate
    ├── Resubmission success rate
    └── Creator quality over time (post-approval tracking)
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~900 lines  
**Files to Modify:**
- `src/app/admin/applications/page.tsx` (Enhance with SLA tracking, revision workflow)
- Create: `src/components/admin/ApplicationReviewModal.tsx` (Full review interface)
- Create: `src/components/admin/RevisionRequestModal.tsx` (Revision workflow)

---

### 12. Content Review - Pre-Publish Queue for Category A
**Blueprint Reference:** Section 4.1 - "Content 360: review queues (pre-publish for A)"

**Current State:**
- ✅ Basic content review page exists at `/admin/content/reviews`
- ❌ No distinction between first-time vs ongoing reviews
- ❌ No mandatory pre-publish enforcement for first-time creators
- ❌ No automated quality checks integration
- ❌ No learning design validation

**Required Features:**
```
Category A Pre-Publish Review Queue:
├── Queue Segmentation
│   ├── First-Time Creator Submissions (MANDATORY REVIEW)
│   │   ├── All courses from first-time creators
│   │   ├── High priority queue
│   │   ├── Comprehensive review checklist
│   │   └── Educational approval before publish
│   ├── Ongoing Creator Submissions (SPOT CHECKS)
│   │   ├── Random sampling (10% of submissions)
│   │   ├── Risk-based selection (flagged creators)
│   │   ├── Viewer-reported content
│   │   └── Post-publish review queue
│   ├── Re-submission Queue
│   │   ├── Courses returned for revisions
│   │   ├── Changes highlighted
│   │   └── Fast-track re-review
│   └── Escalation Queue
│       ├── Edge cases
│       ├── Policy ambiguity
│       ├── Senior reviewer needed
│       └── Legal review required
├── First-Time Review Checklist (Comprehensive)
│   ├── Content Quality
│   │   ├── Video quality (resolution, lighting, audio)
│   │   ├── Audio clarity (no background noise)
│   │   ├── Pacing (not too fast/slow)
│   │   ├── Visual aids (slides, graphics)
│   │   └── Production value score (0-100)
│   ├── Learning Design
│   │   ├── Learning outcomes stated upfront
│   │   ├── Syllabus structure (logical progression)
│   │   ├── Assessments tied to outcomes
│   │   ├── Practice exercises included
│   │   └── Certificate criteria (if offered)
│   ├── Content Policy Compliance
│   │   ├── Educational focus (not entertainment)
│   │   ├── No prohibited content (violence, adult, hate)
│   │   ├── Original content (plagiarism check)
│   │   ├── Accurate information (fact-checking for sensitive topics)
│   │   └── Inclusive language
│   ├── Accessibility
│   │   ├── Captions available (auto-generated or manual)
│   │   ├── Transcript quality
│   │   ├── Visual contrast (readable text)
│   │   ├── Alt text for images
│   │   └── Keyboard navigation support
│   ├── Technical Validation
│   │   ├── All videos playable
│   │   ├── Downloads functional
│   │   ├── Links valid (no broken links)
│   │   ├── Quizzes functional
│   │   └── Mobile compatibility
│   └── Metadata Quality
│       ├── Title (clear, descriptive)
│       ├── Description (comprehensive)
│       ├── Tags (relevant, not spam)
│       ├── Category (correctly assigned)
│       ├── Level (beginner/intermediate/advanced)
│       └── Language (correctly identified)
├── Automated Quality Checks (Pre-Review)
│   ├── Video Quality Analysis
│   │   ├── Resolution check (min 720p recommended)
│   │   ├── Audio level check (not too quiet/loud)
│   │   ├── Frame rate check
│   │   └── File corruption check
│   ├── Content Policy Pre-Screening
│   │   ├── AI content moderation (adult/violence/hate)
│   │   ├── Profanity detection
│   │   ├── Spam keyword detection
│   │   └── Duplicate content detection
│   ├── Plagiarism Detection
│   │   ├── Video fingerprinting (match against existing content)
│   │   ├── Text similarity (description, captions)
│   │   └── Source attribution check
│   ├── Accessibility Pre-Check
│   │   ├── Caption availability
│   │   ├── Caption quality (auto-generated needs review)
│   │   └── Transcript completeness
│   └── Auto-Fail Criteria
│       ├── Copyright violation detected
│       ├── Adult content detected (high confidence)
│       ├── Resolution < 480p
│       ├── Audio unintelligible
│       └── Obvious spam/scam
├── Reviewer Interface
│   ├── Course Overview
│   │   ├── Creator name & profile
│   │   ├── First-time creator badge
│   │   ├── Course title, description, category
│   │   ├── Total lessons, duration
│   │   ├── Submission date (SLA tracking)
│   │   └── Automated pre-check results
│   ├── Video Player
│   │   ├── Embedded player for all lessons
│   │   ├── Playback speed control (0.5x, 1x, 1.5x, 2x)
│   │   ├── Skip to lesson feature
│   │   ├── Caption toggle
│   │   └── Quality selector
│   ├── Review Checklist (interactive)
│   │   ├── Check off each item
│   │   ├── Add notes per item
│   │   ├── Flag issues (minor/major)
│   │   └── Overall score calculation
│   ├── Reviewer Actions
│   │   ├── Approve & Publish (course goes live immediately)
│   │   ├── Approve with Notes (minor improvements suggested)
│   │   ├── Request Revisions (specific changes required, course returns to creator)
│   │   ├── Decline (course rejected, detailed reason)
│   │   └── Escalate (send to senior reviewer or policy team)
│   └── Communication
│       ├── Email template selection
│       ├── Custom feedback to creator
│       ├── Video timestamp references (link to specific issues)
│       └── Revision deadline (5 days)
├── Spot Check System (Ongoing Creators)
│   ├── Sampling Strategy
│   │   ├── 10% random sampling
│   │   ├── Risk-based (creators with past issues)
│   │   ├── Viewer-reported content (immediate review)
│   │   └── High-profile content (popular creators)
│   ├── Lighter Review Checklist
│   │   ├── Policy compliance (quick scan)
│   │   ├── Quality regression check (compare to previous)
│   │   ├── Viewer complaints validation
│   │   └── Fast approval/takedown decision
│   └── Post-Publish Actions
│       ├── Allow to remain live
│       ├── Request updates (non-urgent)
│       ├── Takedown (policy violation)
│       └── Issue strike (serious violation)
├── Revision Workflow
│   ├── Request Specific Changes
│   │   ├── Video re-upload (quality issues)
│   │   ├── Caption corrections
│   │   ├── Content edits (accuracy, policy)
│   │   ├── Metadata updates
│   │   └── Assessment improvements
│   ├── Creator Resubmission
│   │   ├── Notification with action items
│   │   ├── Revision deadline (5 days)
│   │   ├── Upload revised content
│   │   └── Resubmit for review
│   ├── Re-Review Process
│   │   ├── Highlight changes made
│   │   ├── Verify revisions address feedback
│   │   ├── Fast-track approval (if satisfactory)
│   │   └── Additional revisions (if needed)
│   └── Revision Tracking
│       ├── Number of revision cycles
│       ├── Creator response time
│       ├── Reviewer notes history
│       └── Final decision rationale
└── Review Analytics
    ├── Queue metrics (size, wait time, SLA)
    ├── Approval rate (first-time vs ongoing)
    ├── Decline reasons distribution
    ├── Average review time
    ├── Reviewer performance
    ├── Revision request rate
    ├── Content quality trends
    └── Policy violation trends
```

**Implementation Priority:** 🔴 HIGH  
**Estimated Lines of Code:** ~1,400 lines  
**Files to Modify:**
- `src/app/admin/content/reviews/page.tsx` (Enhance with first-time vs ongoing segmentation)
- Create: `src/components/admin/ContentReviewModal.tsx` (Full review interface with video player)
- Create: `src/components/admin/ReviewChecklist.tsx` (Interactive checklist component)
- Create: `src/components/admin/AutomatedQualityChecks.tsx` (Pre-screening results display)

---

## Summary of Missing Features

### By Priority

#### 🔴 HIGH Priority (Immediate Implementation Needed)
1. **Category B Editorial Pipeline** (~1,200 lines)
2. **Category C Monitoring Dashboard** (~900 lines)
3. **Rewards - Scholarship Engine Enhancement** (~1,500 lines)
4. **Ban/Appeal Tooling** (~850 lines)
5. **Real-Time Observability Dashboard** (~2,000 lines)
6. **Payout Batch Management** (~1,000 lines)
7. **Creator Application Review Enhancement** (~900 lines)
8. **Content Review - Pre-Publish Queue Enhancement** (~1,400 lines)

**Total HIGH Priority: ~9,750 lines of code**

#### 🟡 MEDIUM Priority (Phase 2 Implementation)
9. **Communication Templates** (~1,100 lines)
10. **Granular Permission Assignment** (~700 lines)
11. **Study Buddy Admin Oversight** (~600 lines)
12. **Event Lake & Experimentation** (~1,800 lines)

**Total MEDIUM Priority: ~4,200 lines of code**

### Grand Total
**~13,950 lines of new code needed** to achieve full Blueprint Section 4 compliance.

---

## Recommended Implementation Order

### Sprint 1 (Week 1-2) - Core Operations
1. Payout Batch Management (CRITICAL for creator payments)
2. Content Review - Pre-Publish Queue Enhancement (CRITICAL for quality control)
3. Creator Application Review Enhancement (CRITICAL for onboarding)

### Sprint 2 (Week 3-4) - Safety & Moderation
4. Ban/Appeal Tooling (CRITICAL for platform safety)
5. Category C Monitoring Dashboard (CRITICAL for compliance)

### Sprint 3 (Week 5-6) - Editorial & Rewards
6. Category B Editorial Pipeline (required for Signature launch)
7. Rewards - Scholarship Engine Enhancement (required for Phase 3)

### Sprint 4 (Week 7-8) - Observability
8. Real-Time Observability Dashboard (essential for operations)

### Sprint 5 (Week 9-10) - Polish & Enhancements
9. Communication Templates (improves user experience)
10. Granular Permission Assignment (improves security)
11. Study Buddy Admin Oversight (improves safety)

### Sprint 6 (Future Phase) - Advanced Features
12. Event Lake & Experimentation (Phase 4 - ML/Data science)

---

## Next Steps

1. **Review this audit** with product and engineering teams
2. **Prioritize based on business needs** (recommend following Sprint order above)
3. **Assign engineering resources** (~3-4 full-stack engineers for 10 weeks)
4. **Create detailed tickets** for each feature in project management tool
5. **Begin Sprint 1 implementation** (Payout Batches, Content Review, Creator Applications)

---

**Document Version:** 1.0  
**Last Updated:** October 16, 2025  
**Author:** Admin Audit System  
**Status:** Ready for Implementation Planning
