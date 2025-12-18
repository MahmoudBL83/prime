/**
 * Platform Subscription Pricing Configuration
 * 
 * This file centralizes all platform subscription pricing.
 * In production, these values should come from:
 * - Environment variables, or
 * - A database settings table, or
 * - An admin-configurable pricing API
 * 
 * For now, these are the default prices used across the platform.
 */

export const PLATFORM_PRICING = {
  // Category A: All-Access Library
  CATEGORY_A: {
    monthly: 199,  // EUR
    yearly: 1910,  // EUR (20% discount)
    name: 'All-Access Library',
    nameAr: 'مكتبة الوصول الكامل',
    description: 'Access to all Category A courses',
    descriptionAr: 'الوصول لجميع دورات الفئة أ'
  },
  // Category B: Signature/Premium Courses
  CATEGORY_B: {
    monthly: 149,  // EUR
    yearly: 1432,  // EUR (20% discount)
    name: 'Signature Programs',
    nameAr: 'البرامج المميزة',
    description: 'Access to premium curated courses',
    descriptionAr: 'الوصول للدورات المميزة المنسقة'
  },
  // Category C: Exclusive Creator Content
  CATEGORY_C: {
    monthly: 79,   // EUR
    yearly: 758,   // EUR (20% discount)
    name: 'Exclusive Content',
    nameAr: 'محتوى حصري',
    description: 'Access to exclusive creator content',
    descriptionAr: 'الوصول لمحتوى المنشئين الحصري'
  },
  // Bundle: Category A + B
  BUNDLE_AB: {
    monthly: 299,  // EUR (saves €49/month)
    yearly: 2870,  // EUR (20% discount)
    name: 'All-Access + Signature Bundle',
    nameAr: 'باقة الوصول الكامل + المميزة',
    description: 'Access to both Category A and B',
    descriptionAr: 'الوصول للفئة أ و ب معاً',
    savings: 49  // Monthly savings compared to buying separately
  },
  // Bundle: All Categories
  BUNDLE_ABC: {
    monthly: 399,  // EUR (saves €28/month)
    yearly: 3830,  // EUR (20% discount)
    name: 'Ultimate Bundle',
    nameAr: 'الباقة النهائية',
    description: 'Access to all categories',
    descriptionAr: 'الوصول لجميع الفئات',
    savings: 28  // Monthly savings compared to buying separately
  }
} as const

export type PlanType = keyof typeof PLATFORM_PRICING

/**
 * Get the price for a plan based on billing cycle
 */
export function getPlanPrice(planType: PlanType, billingCycle: 'monthly' | 'yearly' = 'monthly'): number {
  const plan = PLATFORM_PRICING[planType]
  return billingCycle === 'monthly' ? plan.monthly : plan.yearly
}

/**
 * Get savings amount for bundle plans
 */
export function getBundleSavings(planType: PlanType, billingCycle: 'monthly' | 'yearly' = 'monthly'): number {
  const plan = PLATFORM_PRICING[planType]
  if ('savings' in plan) {
    return billingCycle === 'monthly' ? plan.savings : plan.savings * 12
  }
  return 0
}

/**
 * Get the annual discount percentage (currently 20%)
 */
export const ANNUAL_DISCOUNT_PERCENT = 20
