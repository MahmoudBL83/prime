'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionTier {
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  name: string;
  nameAr: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavings: number;
  benefits: {
    monthlyMessages: number | null;
    monthlyMeetings: number | null;
    meetingDuration: number;
    accessToContent: boolean;
    prioritySupport: boolean;
  };
}

interface SubscriptionTierCardProps {
  tier: SubscriptionTier;
  billingPeriod: 'MONTHLY' | 'YEARLY';
  creatorId: string;
  isSubscribed?: boolean;
  onSubscribe: (tier: string, billingPeriod: string) => Promise<void>;
  locale?: string;
}

export default function SubscriptionTierCard({
  tier,
  billingPeriod,
  creatorId,
  isSubscribed = false,
  onSubscribe,
  locale = 'en',
}: SubscriptionTierCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isArabic = locale === 'ar';

  const price = billingPeriod === 'MONTHLY' ? tier.monthlyPrice : tier.yearlyPrice;
  const priceLabel = billingPeriod === 'MONTHLY' 
    ? (isArabic ? 'شهرياً' : 'per month')
    : (isArabic ? 'سنوياً' : 'per year');

  // Tier colors and icons
  const tierConfig = {
    BASIC: {
      gradient: 'from-blue-400 to-blue-600',
      icon: Sparkles,
      badge: isArabic ? 'للمبتدئين' : 'STARTER',
    },
    PREMIUM: {
      gradient: 'from-purple-400 to-purple-600',
      icon: Star,
      badge: isArabic ? 'الأكثر شعبية' : 'POPULAR',
    },
    VIP: {
      gradient: 'from-yellow-400 to-yellow-600',
      icon: Crown,
      badge: isArabic ? 'الأفضل قيمة' : 'BEST VALUE',
    },
  };

  const config = tierConfig[tier.tier];
  const Icon = config.icon;

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await onSubscribe(tier.tier, billingPeriod);
      
      // Celebrate subscription!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#8B5CF6', '#F59E0B'],
      });
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`relative bg-background dark:bg-card rounded-2xl shadow-lg p-6 ${
        tier.tier === 'PREMIUM' ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      {/* Popular Badge */}
      {tier.tier === 'PREMIUM' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className={`bg-gradient-to-r ${config.gradient} text-foreground px-4 py-1 rounded-full text-xs font-bold shadow-lg`}>
            {config.badge}
          </div>
        </div>
      )}

      {/* Tier Icon */}
      <div className={`w-16 h-16 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center mb-4 mx-auto`}>
        <Icon className="w-8 h-8 text-foreground" />
      </div>

      {/* Tier Name */}
      <h3 className="text-2xl font-bold text-center text-foreground dark:text-foreground mb-2">
        {isArabic ? tier.nameAr : tier.name}
      </h3>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {price}
          </span>
          <span className="text-muted-foreground dark:text-muted-foreground">
            {isArabic ? 'ج.م' : 'EGP'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
          {priceLabel}
        </div>

        {/* Yearly Savings Badge */}
        {billingPeriod === 'YEARLY' && tier.yearlySavings > 0 && (
          <div className="mt-2 inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
            {isArabic ? `وفّر ${tier.yearlySavings} ج.م` : `Save ${tier.yearlySavings} EGP`}
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="space-y-3 mb-6">
        {/* Messages */}
        <div className="flex items-start gap-2">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-foreground dark:text-muted-foreground">
            {tier.benefits.monthlyMessages === null
              ? (isArabic ? 'رسائل غير محدودة' : 'Unlimited messages')
              : isArabic
              ? `${tier.benefits.monthlyMessages} رسالة شهرياً`
              : `${tier.benefits.monthlyMessages} messages/month`}
          </span>
        </div>

        {/* Meetings */}
        <div className="flex items-start gap-2">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-foreground dark:text-muted-foreground">
            {tier.benefits.monthlyMeetings === null
              ? (isArabic ? 'اجتماعات غير محدودة' : 'Unlimited meetings')
              : isArabic
              ? `${tier.benefits.monthlyMeetings} اجتماع شهرياً`
              : `${tier.benefits.monthlyMeetings} meeting${tier.benefits.monthlyMeetings > 1 ? 's' : ''}/month`}
          </span>
        </div>

        {/* Meeting Duration */}
        <div className="flex items-start gap-2">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-foreground dark:text-muted-foreground">
            {isArabic 
              ? `${tier.benefits.meetingDuration} دقيقة لكل اجتماع`
              : `${tier.benefits.meetingDuration} min per meeting`}
          </span>
        </div>

        {/* Content Access */}
        {tier.benefits.accessToContent && (
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-foreground dark:text-muted-foreground">
              {isArabic ? 'الوصول إلى جميع الدورات' : 'Access to all courses'}
            </span>
          </div>
        )}

        {/* Priority Support */}
        {tier.benefits.prioritySupport && (
          <div className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-foreground dark:text-muted-foreground">
              {isArabic ? 'دعم ذو أولوية' : 'Priority support'}
            </span>
          </div>
        )}
      </div>

      {/* Subscribe Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubscribe}
        disabled={isLoading || isSubscribed}
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          isSubscribed
            ? 'bg-gray-300 dark:bg-gray-700 text-muted-foreground dark:text-muted-foreground cursor-not-allowed'
            : `bg-gradient-to-r ${config.gradient} text-foreground hover:shadow-lg`
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{isArabic ? 'جاري الاشتراك...' : 'Subscribing...'}</span>
          </div>
        ) : isSubscribed ? (
          isArabic ? 'مشترك حالياً' : 'Current Plan'
        ) : (
          isArabic ? 'ابدأ الآن' : 'Get Started'
        )}
      </motion.button>

      {/* Auto-renew Notice */}
      <p className="text-xs text-center text-muted-foreground dark:text-muted-foreground mt-3">
        {isArabic ? 'يتجدد تلقائياً. يمكن الإلغاء في أي وقت.' : 'Auto-renews. Cancel anytime.'}
      </p>
    </motion.div>
  );
}
