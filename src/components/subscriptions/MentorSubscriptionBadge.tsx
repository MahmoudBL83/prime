'use client';

import { Check, Crown, Sparkles, Star } from 'lucide-react';

interface MentorSubscriptionBadgeProps {
  tier?: 'BASIC' | 'PREMIUM' | 'VIP';
  isSubscribed: boolean;
  locale?: string;
}

export default function MentorSubscriptionBadge({
  tier,
  isSubscribed,
  locale = 'en',
}: MentorSubscriptionBadgeProps) {
  const isArabic = locale === 'ar';

  if (!isSubscribed) return null;

  const tierConfig = {
    BASIC: {
      icon: Sparkles,
      gradient: 'from-blue-400 to-blue-600',
      label: isArabic ? 'مشترك - أساسي' : 'Subscribed - Basic',
    },
    PREMIUM: {
      icon: Star,
      gradient: 'from-purple-400 to-purple-600',
      label: isArabic ? 'مشترك - متميز' : 'Subscribed - Premium',
    },
    VIP: {
      icon: Crown,
      gradient: 'from-yellow-400 to-yellow-600',
      label: isArabic ? 'مشترك - VIP' : 'Subscribed - VIP',
    },
  };

  const config = tier && tierConfig[tier] ? tierConfig[tier] : tierConfig.BASIC;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-foreground shadow-lg`}>
      <Check className="w-4 h-4" />
      <span className="text-sm font-semibold">{config.label}</span>
      <Icon className="w-4 h-4" />
    </div>
  );
}
