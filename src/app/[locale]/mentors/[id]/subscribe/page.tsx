'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Crown,
  Star,
  Sparkles,
  Check,
  MessageCircle,
  Video,
  Clock,
  Shield,
  ArrowLeft,
  Zap,
  Users,
} from 'lucide-react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';

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

interface Creator {
  id: string;
  user: {
    name: string;
    arabicName: string;
    profileImage?: string;
    bio?: string;
  };
  expertise?: string;
  totalSubscribers: number;
}

export default function MentorSubscribePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const currentLocale = useLocaleSafe();
  const isArabic = currentLocale === 'ar';

  const mentorId = params.id as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptionTiers();
    checkExistingSubscription();
  }, [mentorId]);

  const fetchSubscriptionTiers = async () => {
    try {
      const response = await fetch(`/api/creators/${mentorId}/subscription-tiers`);
      if (response.ok) {
        const data = await response.json();
        setCreator({
          id: data.creatorId,
          user: {
            name: data.creatorName,
            arabicName: data.creatorNameAr,
            profileImage: data.creatorImage,
          },
          totalSubscribers: 0,
        });
        setTiers(data.tiers);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSubscription = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/mentor-subscriptions');
      if (response.ok) {
        const subscriptions = await response.json();
        const existing = subscriptions.find(
          (sub: any) => sub.creatorId === mentorId && sub.status === 'ACTIVE'
        );
        setCurrentSubscription(existing);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (!session) {
      router.push(`/${currentLocale}/auth/signin?callbackUrl=/mentors/${mentorId}/subscribe`);
      return;
    }

    setSubscribing(tier);
    try {
      const response = await fetch('/api/mentor-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: mentorId,
          tier,
          billingPeriod,
        }),
      });

      if (response.ok) {
        // Celebrate! 🎉
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
        });

        // Show success message
        setTimeout(() => {
          router.push(`/${currentLocale}/subscriptions?success=true`);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-300/30 border-t-purple-400 rounded-full animate-spin"></div>
          <p className="text-white text-lg">
            {isArabic ? 'جاري التحميل...' : 'Loading subscription plans...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-8 shadow-xl">
        <div className="container mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isArabic ? 'رجوع' : 'Back'}
          </button>

          <div className="flex items-center gap-6">
            {/* Creator Avatar */}
            {creator?.user.profileImage ? (
              <img
                src={creator.user.profileImage}
                alt={creator.user.name}
                className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/20 shadow-xl">
                {creator?.user.name[0]}
              </div>
            )}

            {/* Creator Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {isArabic ? creator?.user.arabicName : creator?.user.name}
              </h1>
              <p className="text-blue-100 text-lg">
                {isArabic ? 'اشترك للوصول الحصري' : 'Subscribe for Exclusive Access'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Users className="w-4 h-4 text-blue-200" />
                <span className="text-blue-100 text-sm">
                  {creator?.totalSubscribers || 0} {isArabic ? 'مشترك' : 'subscribers'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Subscription Banner */}
      {currentSubscription && (
        <div className="bg-green-500/20 border-b-2 border-green-500/50 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 text-green-300">
              <Check className="w-5 h-5" />
              <span className="font-semibold">
                {isArabic
                  ? `مشترك حالياً في خطة ${currentSubscription.tier}`
                  : `Currently subscribed to ${currentSubscription.tier} plan`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 border border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  billingPeriod === 'MONTHLY'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isArabic ? 'شهرياً' : 'Monthly'}
              </button>
              <button
                onClick={() => setBillingPeriod('YEARLY')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all relative ${
                  billingPeriod === 'YEARLY'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isArabic ? 'سنوياً' : 'Yearly'}
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {isArabic ? 'وفّر' : 'Save'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Tiers */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {tiers.map((tier, index) => {
            const tierConfig = {
              BASIC: {
                gradient: 'from-blue-400 to-blue-600',
                icon: Sparkles,
                badge: isArabic ? 'للمبتدئين' : 'STARTER',
                popular: false,
              },
              PREMIUM: {
                gradient: 'from-purple-400 to-purple-600',
                icon: Star,
                badge: isArabic ? 'الأكثر شعبية' : 'POPULAR',
                popular: true,
              },
              VIP: {
                gradient: 'from-yellow-400 to-yellow-600',
                icon: Crown,
                badge: isArabic ? 'الأفضل' : 'BEST VALUE',
                popular: false,
              },
            };

            const config = tierConfig[tier.tier];
            const Icon = config.icon;
            const price = billingPeriod === 'MONTHLY' ? tier.monthlyPrice : tier.yearlyPrice;
            const isCurrentTier = currentSubscription?.tier === tier.tier;

            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 ${
                  config.popular ? 'ring-4 ring-purple-500 scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {config.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className={`bg-gradient-to-r ${config.gradient} text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg`}>
                      {config.badge}
                    </div>
                  </div>
                )}

                {/* Tier Icon */}
                <div className={`w-20 h-20 bg-gradient-to-br ${config.gradient} rounded-3xl flex items-center justify-center mb-6 mx-auto`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Tier Name */}
                <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
                  {isArabic ? tier.nameAr : tier.name}
                </h3>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-lg">
                      {isArabic ? 'ج.م' : 'EGP'}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {billingPeriod === 'MONTHLY'
                      ? isArabic ? 'شهرياً' : 'per month'
                      : isArabic ? 'سنوياً' : 'per year'}
                  </div>

                  {/* Yearly Savings */}
                  {billingPeriod === 'YEARLY' && tier.yearlySavings > 0 && (
                    <div className="mt-3 inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold">
                      <Zap className="w-4 h-4 inline mr-1" />
                      {isArabic ? `وفّر ${tier.yearlySavings} ج.م` : `Save ${tier.yearlySavings} EGP`}
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-4 mb-8">
                  {/* Messages */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {tier.benefits.monthlyMessages === null
                          ? isArabic ? 'رسائل غير محدودة' : 'Unlimited Messages'
                          : isArabic
                          ? `${tier.benefits.monthlyMessages} رسالة/شهر`
                          : `${tier.benefits.monthlyMessages} messages/month`}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isArabic ? 'دردشة خاصة مباشرة' : 'Direct private chat'}
                      </div>
                    </div>
                  </div>

                  {/* Meetings */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {tier.benefits.monthlyMeetings === null
                          ? isArabic ? 'اجتماعات غير محدودة' : 'Unlimited Meetings'
                          : isArabic
                          ? `${tier.benefits.monthlyMeetings} اجتماع/شهر`
                          : `${tier.benefits.monthlyMeetings} meeting${tier.benefits.monthlyMeetings > 1 ? 's' : ''}/month`}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isArabic
                          ? `${tier.benefits.meetingDuration} دقيقة لكل اجتماع`
                          : `${tier.benefits.meetingDuration} min per session`}
                      </div>
                    </div>
                  </div>

                  {/* Content Access */}
                  {tier.benefits.accessToContent && (
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {isArabic ? 'جميع الدورات' : 'All Courses'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {isArabic ? 'وصول كامل للمحتوى' : 'Full content access'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Priority Support */}
                  {tier.benefits.prioritySupport && (
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {isArabic ? 'دعم ذو أولوية' : 'Priority Support'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {isArabic ? 'استجابة سريعة' : 'Fast response time'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subscribe Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubscribe(tier.tier)}
                  disabled={subscribing !== null || isCurrentTier}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                    isCurrentTier
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${config.gradient} text-white hover:shadow-2xl`
                  }`}
                >
                  {subscribing === tier.tier ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{isArabic ? 'جاري الاشتراك...' : 'Subscribing...'}</span>
                    </div>
                  ) : isCurrentTier ? (
                    isArabic ? 'الخطة الحالية' : 'Current Plan'
                  ) : (
                    isArabic ? 'اشترك الآن' : 'Subscribe Now'
                  )}
                </motion.button>

                {/* Auto-renew Notice */}
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                  {isArabic ? 'يتجدد تلقائياً. يمكن الإلغاء في أي وقت' : 'Auto-renews. Cancel anytime'}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h4 className="font-semibold text-white mb-2">
                  {isArabic ? 'آمن ومضمون' : 'Safe & Secure'}
                </h4>
                <p className="text-sm text-gray-400">
                  {isArabic ? 'معلومات الدفع محمية' : 'Your payment info is protected'}
                </p>
              </div>
              <div>
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h4 className="font-semibold text-white mb-2">
                  {isArabic ? 'إلغاء في أي وقت' : 'Cancel Anytime'}
                </h4>
                <p className="text-sm text-gray-400">
                  {isArabic ? 'لا يوجد التزام طويل الأجل' : 'No long-term commitment'}
                </p>
              </div>
              <div>
                <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <h4 className="font-semibold text-white mb-2">
                  {isArabic ? 'وصول فوري' : 'Instant Access'}
                </h4>
                <p className="text-sm text-gray-400">
                  {isArabic ? 'ابدأ فوراً بعد الاشتراك' : 'Start immediately after subscribing'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
