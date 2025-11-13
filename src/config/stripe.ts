import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Load configuration from database if not in environment
async function getConfig(key: string): Promise<string> {
  // First check environment
  const envValue = process.env[key];
  if (envValue) return envValue;

  // Fallback to database
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });
    return config?.value || '';
  } catch {
    return '';
  }
}

// Initialize Stripe (will be lazy-loaded)
let stripeInstance: Stripe | null = null;

export async function getStripe(): Promise<Stripe> {
  if (stripeInstance) return stripeInstance;

  const secretKey = await getConfig('STRIPE_SECRET_KEY');
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY - Configure in Admin Panel → Settings → Stripe');
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
  });

  return stripeInstance;
}

// Synchronous version for existing code (uses env vars only)
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY not found in environment. Configure in Admin Panel.');
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null as any; // Will fail if used before configuration

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  currency: 'egp',
  
  // Success/Cancel URLs
  getSuccessUrl: (locale: string = 'en') => 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/dashboard/my-learning?subscription=success`,
  getCancelUrl: (locale: string = 'en') => 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${locale}/subscribe?subscription=cancelled`,
  
  // Webhook endpoint
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

// Subscription price IDs (to be created in Stripe Dashboard or configured in Admin Panel)
export const SUBSCRIPTION_PRICE_IDS = {
  CATEGORY_A: {
    monthly: process.env.STRIPE_PRICE_CATEGORY_A_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_CATEGORY_A_YEARLY || '',
  },
  CATEGORY_B: {
    monthly: process.env.STRIPE_PRICE_CATEGORY_B_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_CATEGORY_B_YEARLY || '',
  },
  BUNDLE_AB: {
    monthly: process.env.STRIPE_PRICE_BUNDLE_AB_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_BUNDLE_AB_YEARLY || '',
  },
};

// Helper to get price IDs from database if needed
export async function getPriceIds() {
  const keys = [
    'STRIPE_PRICE_CATEGORY_A_MONTHLY',
    'STRIPE_PRICE_CATEGORY_A_YEARLY',
    'STRIPE_PRICE_CATEGORY_B_MONTHLY',
    'STRIPE_PRICE_CATEGORY_B_YEARLY',
    'STRIPE_PRICE_BUNDLE_AB_MONTHLY',
    'STRIPE_PRICE_BUNDLE_AB_YEARLY',
  ];

  const prices: Record<string, string> = {};
  
  for (const key of keys) {
    prices[key] = await getConfig(key);
  }

  return {
    CATEGORY_A: {
      monthly: prices.STRIPE_PRICE_CATEGORY_A_MONTHLY,
      yearly: prices.STRIPE_PRICE_CATEGORY_A_YEARLY,
    },
    CATEGORY_B: {
      monthly: prices.STRIPE_PRICE_CATEGORY_B_MONTHLY,
      yearly: prices.STRIPE_PRICE_CATEGORY_B_YEARLY,
    },
    BUNDLE_AB: {
      monthly: prices.STRIPE_PRICE_BUNDLE_AB_MONTHLY,
      yearly: prices.STRIPE_PRICE_BUNDLE_AB_YEARLY,
    },
  };
}
