'use client';

import { Check, Crown } from 'lucide-react';

interface MentorSubscriptionBadgeProps {
  isSubscribed: boolean;
  locale?: string;
}

export default function MentorSubscriptionBadge({
  isSubscribed,
  locale = 'en',
}: MentorSubscriptionBadgeProps) {
  const isArabic = locale === 'ar';

  if (!isSubscribed) return null;

  // Single subscription model - one tier for all
  const config = {
    icon: Crown,
    gradient: 'from-purple-400 to-blue-500',
    label: isArabic ? 'مشترك' : 'Subscribed',
  };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-white shadow-lg`}>
      <Check className="w-4 h-4" />
      <span className="text-sm font-semibold">{config.label}</span>
      <Icon className="w-4 h-4" />
    </div>
  );
}
