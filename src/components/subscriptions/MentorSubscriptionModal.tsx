'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MentorSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: {
    id: string;
    name: string;
    arabicName?: string;
    profileImage?: string;
    bio?: string;
    totalSubscribers?: number;
    monthlyPrice?: number; // Single tier in EUR
  };
  currentSubscription?: { tier: string } | null;
  onSubscribe: () => void;
  locale?: string;
}

export default function MentorSubscriptionModal({
  isOpen,
  onClose,
  mentor,
  currentSubscription,
  onSubscribe,
  locale = 'en',
}: MentorSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const isArabic = locale === 'ar';
  const isSubscribed = !!currentSubscription;
  const price = mentor.monthlyPrice || 29; // Default €29

  const benefits = isArabic
    ? [
        'كل المنشورات والوسائط الحصرية',
        'جلسات مباشرة أسبوعية',
        'وصول للمجتمع والمناقشات',
        'مراسلات ذات أولوية',
        'حجوزات عبر التقويم',
        'دعم على مدار الساعة',
      ]
    : [
        'All exclusive posts & media',
        'Weekly live sessions',
        'Community & discussions access',
        'Priority messaging',
        'Calendar bookings',
        '24/7 support',
      ];

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/mentor-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: mentor.id,
          tier: 'ALL_ACCESS',
          billingPeriod: 'MONTHLY',
        }),
      });

      if (!response.ok) throw new Error('Failed to create subscription');

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#3B82F6', '#EC4899'],
      });

      onSubscribe();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-border"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="relative p-6 pb-4 border-b border-border/50">
            <div className="flex items-start gap-4">
              {mentor.profileImage && (
                <img
                  src={mentor.profileImage}
                  alt={mentor.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-purple-500/30"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {isArabic ? `اشترك مع ${mentor.arabicName || mentor.name}` : `Subscribe to ${mentor.arabicName || mentor.name}`}
                </h2>
                <p className="text-muted-foreground text-sm">{mentor.bio || (isArabic ? 'مرشد خبير ومعلم' : 'Expert mentor and educator')}</p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">{mentor.totalSubscribers || 0} {isArabic ? 'مشترك' : 'subscribers'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* All-Access Plan */}
          <div className="p-6">
            <div className="relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  <Crown className="w-3 h-3 inline mr-1" />
                  {isArabic ? 'وصول شامل' : 'All-Access'}
                </div>
              </div>

              <div className={`bg-gray-800/50 border rounded-2xl p-6 ${isSubscribed ? 'border-green-500 ring-2 ring-green-500' : 'border-purple-500/50'}`}>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {isArabic ? 'خطة وصول شامل' : 'All-Access Plan'}
                </h3>

                <div className="mb-4">
                  <span className="text-4xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    €{price}
                  </span>
                  <span className="text-muted-foreground ml-2">{isArabic ? '/شهر' : '/mo'}</span>
                </div>

                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-400 text-sm font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>{isArabic ? 'جلسات مباشرة أسبوعية' : 'Weekly Live Sessions Included'}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleSubscribe}
                  disabled={loading || isSubscribed}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${
                    isSubscribed
                      ? 'bg-green-600 hover:bg-green-600 cursor-default'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400'
                  }`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                  ) : isSubscribed ? (
                    <>✓ {isArabic ? 'مشترك بالفعل' : 'Already Subscribed'}</>
                  ) : (
                    isArabic ? 'اشترك الآن' : 'Subscribe Now'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Trust Indicators */}
          <div className="border-t border-border/50 p-4 bg-gray-800/30">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>{isArabic ? 'آمن ومضمون' : 'Safe & Secure'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>{isArabic ? 'إلغاء في أي وقت' : 'Cancel Anytime'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>{isArabic ? 'وصول فوري' : 'Instant Access'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
