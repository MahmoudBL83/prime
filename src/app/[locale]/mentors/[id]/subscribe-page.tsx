'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Star,
  Users,
  BookOpen,
  Award,
  ArrowLeft,
  MessageCircle,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionTierCard from '@/components/subscriptions/SubscriptionTierCard';
import MentorSubscriptionBadge from '@/components/subscriptions/MentorSubscriptionBadge';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import toast from 'react-hot-toast';

interface MentorData {
  id: string;
  user: {
    id: string;
    name: string;
    arabicName: string;
    bio: string;
    profileImage: string | null;
  };
  expertise: string;
  basicMonthlyPrice: number;
  basicYearlyPrice: number;
  premiumMonthlyPrice: number;
  premiumYearlyPrice: number;
  vipMonthlyPrice: number;
  vipYearlyPrice: number;
  totalSubscribers: number;
  languages: string;
  stats: {
    totalFollowers: number;
    totalCourses: number;
    totalStudents: number;
    averageRating: number;
    yearsOfExperience: number;
  };
}

interface UserSubscription {
  id: string;
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
}

export default function MentorSubscribePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const currentLocale = useLocaleSafe();
  const isArabic = currentLocale === 'ar';

  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    if (params.id) {
      fetchMentorData();
      checkUserSubscription();
    }
  }, [params.id]);

  const fetchMentorData = async () => {
    try {
      // Fetch subscription tiers
      const response = await fetch(`/api/creators/${params.id}/subscription-tiers`);
      if (response.ok) {
        const data = await response.json();
        setMentor({
          id: params.id as string,
          user: {
            id: data.creatorId,
            name: data.creatorName,
            arabicName: data.creatorNameAr,
            bio: '',
            profileImage: data.creatorImage,
          },
          expertise: '',
          basicMonthlyPrice: data.tiers[0].monthlyPrice,
          basicYearlyPrice: data.tiers[0].yearlyPrice,
          premiumMonthlyPrice: data.tiers[1].monthlyPrice,
          premiumYearlyPrice: data.tiers[1].yearlyPrice,
          vipMonthlyPrice: data.tiers[2].monthlyPrice,
          vipYearlyPrice: data.tiers[2].yearlyPrice,
          totalSubscribers: 0,
          languages: 'English, Arabic',
          stats: {
            totalFollowers: 0,
            totalCourses: 0,
            totalStudents: 0,
            averageRating: 5.0,
            yearsOfExperience: 5,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching mentor data:', error);
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkUserSubscription = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/mentor-subscriptions');
      if (response.ok) {
        const subscriptions = await response.json();
        const subscription = subscriptions.find(
          (sub: any) => sub.creatorId === params.id && sub.status === 'ACTIVE'
        );
        setUserSubscription(subscription || null);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscribe = async (tier: string, billingPeriod: string) => {
    if (!session?.user?.id) {
      toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in');
      router.push(`/${currentLocale}/auth/signin`);
      return;
    }

    try {
      const response = await fetch('/api/mentor-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: params.id,
          tier,
          billingPeriod,
        }),
      });

      if (response.ok) {
        toast.success(
          isArabic
            ? '🎉 تم الاشتراك بنجاح!'
            : '🎉 Successfully subscribed!'
        );
        checkUserSubscription();
      } else {
        const error = await response.json();
        toast.error(error.error || (isArabic ? 'فشل الاشتراك' : 'Subscription failed'));
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isArabic ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isArabic ? 'الموجه غير موجود' : 'Mentor not found'}
          </h2>
          <Button onClick={() => router.back()}>
            {isArabic ? 'رجوع' : 'Go Back'}
          </Button>
        </div>
      </div>
    );
  }

  const subscriptionTiers = [
    {
      tier: 'BASIC' as const,
      name: 'Basic',
      nameAr: 'أساسي',
      monthlyPrice: mentor.basicMonthlyPrice,
      yearlyPrice: mentor.basicYearlyPrice,
      yearlySavings: mentor.basicMonthlyPrice * 12 - mentor.basicYearlyPrice,
      benefits: {
        monthlyMessages: 10,
        monthlyMeetings: 1,
        meetingDuration: 30,
        accessToContent: true,
        prioritySupport: false,
      },
    },
    {
      tier: 'PREMIUM' as const,
      name: 'Premium',
      nameAr: 'متميز',
      monthlyPrice: mentor.premiumMonthlyPrice,
      yearlyPrice: mentor.premiumYearlyPrice,
      yearlySavings: mentor.premiumMonthlyPrice * 12 - mentor.premiumYearlyPrice,
      benefits: {
        monthlyMessages: 50,
        monthlyMeetings: 4,
        meetingDuration: 60,
        accessToContent: true,
        prioritySupport: true,
      },
    },
    {
      tier: 'VIP' as const,
      name: 'VIP',
      nameAr: 'كبار الشخصيات',
      monthlyPrice: mentor.vipMonthlyPrice,
      yearlyPrice: mentor.vipYearlyPrice,
      yearlySavings: mentor.vipMonthlyPrice * 12 - mentor.vipYearlyPrice,
      benefits: {
        monthlyMessages: null,
        monthlyMeetings: null,
        meetingDuration: 90,
        accessToContent: true,
        prioritySupport: true,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isArabic ? 'رجوع' : 'Back'}
          </Button>

          {/* Mentor Info */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
              {mentor.user.profileImage ? (
                <img
                  src={mentor.user.profileImage}
                  alt={mentor.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                  {mentor.user.name[0]}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isArabic ? mentor.user.arabicName : mentor.user.name}
                </h1>
                {userSubscription?.status === 'ACTIVE' && (
                  <MentorSubscriptionBadge
                    tier={userSubscription.tier}
                    isSubscribed={true}
                    locale={currentLocale}
                  />
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {mentor.totalSubscribers} {isArabic ? 'مشترك' : 'subscribers'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{mentor.stats.averageRating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {mentor.stats.totalCourses} {isArabic ? 'دورات' : 'courses'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {isArabic ? 'مراسلة' : 'Message'}
            </Button>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="container mx-auto px-4 py-12">
        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setBillingPeriod('MONTHLY')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingPeriod === 'MONTHLY'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {isArabic ? 'شهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setBillingPeriod('YEARLY')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                billingPeriod === 'YEARLY'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {isArabic ? 'سنوي' : 'Yearly'}
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                {isArabic ? 'وفّر حتى 20%' : 'Save up to 20%'}
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {subscriptionTiers.map((tier) => (
            <SubscriptionTierCard
              key={tier.tier}
              tier={tier}
              billingPeriod={billingPeriod}
              creatorId={mentor.id}
              isSubscribed={userSubscription?.tier === tier.tier && userSubscription?.status === 'ACTIVE'}
              onSubscribe={handleSubscribe}
              locale={currentLocale}
            />
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            {isArabic ? 'مقارنة الميزات' : 'Feature Comparison'}
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    {isArabic ? 'الميزة' : 'Feature'}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">Basic</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-purple-600">Premium</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-yellow-600">VIP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {isArabic ? 'الرسائل الشهرية' : 'Monthly Messages'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">10</td>
                  <td className="px-6 py-4 text-center text-sm">50</td>
                  <td className="px-6 py-4 text-center text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {isArabic ? 'الاجتماعات الشهرية' : 'Monthly Meetings'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">1</td>
                  <td className="px-6 py-4 text-center text-sm">4</td>
                  <td className="px-6 py-4 text-center text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {isArabic ? 'مدة الاجتماع' : 'Meeting Duration'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">30 min</td>
                  <td className="px-6 py-4 text-center text-sm">60 min</td>
                  <td className="px-6 py-4 text-center text-sm">90 min</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {isArabic ? 'دعم ذو أولوية' : 'Priority Support'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">-</td>
                  <td className="px-6 py-4 text-center text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
