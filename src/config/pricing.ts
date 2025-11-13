/**
 * Centralized Pricing Configuration
 * Based on Business Blueprint Section 5: Monetization & Pricing
 * 
 * All prices are in EGP (Egyptian Pounds)
 * 
 * Pricing Structure:
 * - Category A (All-Access Library): Access to open contribution courses
 * - Category B (Signature Courses): Premium curated programs  
 * - Category C (Creator Channels): Per-creator subscriptions
 * - Bundles: Discounted combinations
 */

export type SubscriptionType = 'CATEGORY_A' | 'CATEGORY_B' | 'CATEGORY_C' | 'BUNDLE_AB' | 'BUNDLE_ABC'
export type BillingCycle = 'MONTHLY' | 'YEARLY'

/**
 * Monthly Pricing (Base Prices in EGP)
 */
export const MONTHLY_PRICES: Record<SubscriptionType, number> = {
  // Category A - All-Access Library
  // One subscription unlocks large library of courses
  CATEGORY_A: 199,
  
  // Category B - Signature Courses  
  // Separate premium subscription for curated content
  CATEGORY_B: 299,
  
  // Category C - Creator Channels
  // Per-creator monthly fee (example base price)
  // Actual price varies by creator within platform ranges
  CATEGORY_C: 99,
  
  // Bundle A+B - Best value for complete access
  // Discounted vs buying separately (199 + 299 = 498)
  BUNDLE_AB: 399,
  
  // Bundle A+B+C - Ultimate package
  // Maximum discount for full platform access
  BUNDLE_ABC: 449
}

/**
 * Yearly Discount Percentage
 * Save 20% when paying annually
 */
export const YEARLY_DISCOUNT = 0.20 // 20% off

/**
 * Calculate price based on subscription type and billing cycle
 */
export function getSubscriptionPrice(
  type: SubscriptionType, 
  billingCycle: BillingCycle = 'MONTHLY'
): number {
  const monthlyPrice = MONTHLY_PRICES[type]
  
  if (billingCycle === 'YEARLY') {
    // Annual price: (monthly × 12) - 20% discount
    return Math.round(monthlyPrice * 12 * (1 - YEARLY_DISCOUNT))
  }
  
  return monthlyPrice
}

/**
 * Calculate monthly equivalent for yearly plans
 * Shows "X EGP/month when billed annually"
 */
export function getYearlyMonthlyEquivalent(type: SubscriptionType): number {
  const yearlyTotal = getSubscriptionPrice(type, 'YEARLY')
  return Math.round(yearlyTotal / 12)
}

/**
 * Calculate savings amount
 */
export function getYearlySavings(type: SubscriptionType): number {
  const monthlyTotal = MONTHLY_PRICES[type] * 12
  const yearlyTotal = getSubscriptionPrice(type, 'YEARLY')
  return monthlyTotal - yearlyTotal
}

/**
 * Calculate bundle savings vs individual subscriptions
 */
export function getBundleSavings(bundleType: 'BUNDLE_AB' | 'BUNDLE_ABC'): number {
  if (bundleType === 'BUNDLE_AB') {
    const individual = MONTHLY_PRICES.CATEGORY_A + MONTHLY_PRICES.CATEGORY_B
    return individual - MONTHLY_PRICES.BUNDLE_AB
  }
  
  if (bundleType === 'BUNDLE_ABC') {
    const individual = MONTHLY_PRICES.CATEGORY_A + MONTHLY_PRICES.CATEGORY_B + MONTHLY_PRICES.CATEGORY_C
    return individual - MONTHLY_PRICES.BUNDLE_ABC
  }
  
  return 0
}

/**
 * Creator Channel Pricing Ranges
 * Platform allows creators to set prices within these ranges
 */
export const CREATOR_CHANNEL_PRICING = {
  MIN: 49,   // Minimum monthly price
  MAX: 499,  // Maximum monthly price
  SUGGESTED: 99, // Platform suggested starting price
  PLATFORM_FEE_PERCENTAGE: 20 // Platform takes 20% + payment processing
}

/**
 * Student & Educator Discounts
 */
export const DISCOUNTS = {
  STUDENT: 0.25,    // 25% off with verification
  EDUCATOR: 0.30,   // 30% off with verification
  FAMILY: 0.15      // 15% off for family plan (2-6 members)
}

/**
 * Refund Policy
 */
export const REFUND_POLICY = {
  PERIOD_DAYS: 7,
  AUTO_REFUND_THRESHOLD: 50 // Auto-approve refunds under 50 EGP
}

/**
 * Display names for subscription types
 */
export const SUBSCRIPTION_NAMES: Record<SubscriptionType, { en: string; ar: string }> = {
  CATEGORY_A: {
    en: 'All-Access Library',
    ar: 'المكتبة الشاملة'
  },
  CATEGORY_B: {
    en: 'Signature Courses',
    ar: 'الدورات المميزة'
  },
  CATEGORY_C: {
    en: 'Creator Channel',
    ar: 'قناة المنشئ'
  },
  BUNDLE_AB: {
    en: 'Complete Learning Bundle',
    ar: 'باقة التعلم الكاملة'
  },
  BUNDLE_ABC: {
    en: 'Ultimate Bundle',
    ar: 'الباقة الشاملة'
  }
}

/**
 * Subscription descriptions
 */
export const SUBSCRIPTION_DESCRIPTIONS: Record<SubscriptionType, { en: string; ar: string }> = {
  CATEGORY_A: {
    en: 'Access thousands of courses across all topics',
    ar: 'الوصول إلى آلاف الدورات في جميع المجالات'
  },
  CATEGORY_B: {
    en: 'Premium curated programs from top experts',
    ar: 'برامج مميزة من كبار الخبراء'
  },
  CATEGORY_C: {
    en: 'Personalized coaching from your favorite creator',
    ar: 'تدريب شخصي من منشئك المفضل'
  },
  BUNDLE_AB: {
    en: 'All courses + signature programs',
    ar: 'جميع الدورات + البرامج المميزة'
  },
  BUNDLE_ABC: {
    en: 'Everything: Courses + Programs + Creator Access',
    ar: 'كل شيء: الدورات + البرامج + قنوات المنشئين'
  }
}

/**
 * Features included in each subscription type
 */
export const SUBSCRIPTION_FEATURES: Record<SubscriptionType, { en: string[]; ar: string[] }> = {
  CATEGORY_A: {
    en: [
      'Unlimited course access',
      'Download for offline learning',
      'Progress tracking & analytics',
      'Completion certificates',
      'Mobile app access',
      'Study Buddy matching'
    ],
    ar: [
      'وصول غير محدود للدورات',
      'تحميل للتعلم دون اتصال',
      'تتبع التقدم والتحليلات',
      'شهادات إتمام',
      'الوصول عبر التطبيق',
      'مطابقة شريك الدراسة'
    ]
  },
  CATEGORY_B: {
    en: [
      'Premium curated courses',
      'High-production quality content',
      'Structured learning pathways',
      'Expert Q&A sessions',
      'Advanced workbooks & resources',
      'Priority support',
      'Cohort-based learning'
    ],
    ar: [
      'دورات مميزة منتقاة',
      'محتوى عالي الجودة',
      'مسارات تعليمية منظمة',
      'جلسات أسئلة مع الخبراء',
      'كتب عمل وموارد متقدمة',
      'دعم ذو أولوية',
      'التعلم الجماعي'
    ]
  },
  CATEGORY_C: {
    en: [
      'Creator exclusive content',
      '1:1 coaching sessions',
      'Private community access',
      'Live workshops & Q&A',
      'Direct creator feedback',
      'Early access to new content'
    ],
    ar: [
      'محتوى حصري من المنشئ',
      'جلسات تدريب فردية',
      'الوصول للمجتمع الخاص',
      'ورش عمل مباشرة وأسئلة',
      'ملاحظات مباشرة من المنشئ',
      'وصول مبكر للمحتوى الجديد'
    ]
  },
  BUNDLE_AB: {
    en: [
      'Everything in All-Access',
      'Everything in Signature',
      'Complete course library access',
      'All premium features',
      'Save 99 EGP/month'
    ],
    ar: [
      'كل ميزات المكتبة الشاملة',
      'كل ميزات الدورات المميزة',
      'وصول كامل لمكتبة الدورات',
      'جميع الميزات المميزة',
      'وفر 99 جنيه/شهر'
    ]
  },
  BUNDLE_ABC: {
    en: [
      'Everything in A+B Bundle',
      'Creator Channel subscriptions',
      'Unlimited everything',
      'Maximum platform access',
      'Save 148 EGP/month',
      'Best value'
    ],
    ar: [
      'كل ميزات باقة A+B',
      'اشتراكات قنوات المنشئين',
      'كل شيء غير محدود',
      'أقصى وصول للمنصة',
      'وفر 148 جنيه/شهر',
      'أفضل قيمة'
    ]
  }
}
