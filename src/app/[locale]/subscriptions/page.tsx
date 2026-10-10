'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, Star, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionManagement from '@/components/subscriptions/SubscriptionManagement';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  billingPeriod: 'MONTHLY' | 'YEARLY';
  price: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  monthlyMessages: number | null;
  monthlyMeetings: number | null;
  meetingDuration: number;
  prioritySupport: boolean;
  creator: {
    id: string;
    user: {
      name: string;
      arabicName: string;
      profileImage?: string;
    };
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentLocale = useLocaleSafe();
  const isArabic = currentLocale === 'ar';

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptions();
    }
  }, [session]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/mentor-subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else {
        toast.error(isArabic ? 'فشل تحميل الاشتراكات' : 'Failed to load subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    try {
      const response = await fetch(`/api/mentor-subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(isArabic ? 'تم إلغاء الاشتراك' : 'Subscription cancelled');
        fetchSubscriptions();
      } else {
        const error = await response.json();
        toast.error(error.error || (isArabic ? 'فشل الإلغاء' : 'Cancellation failed'));
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleToggleAutoRenew = async (subscriptionId: string, autoRenew: boolean) => {
    try {
      const response = await fetch('/api/mentor-subscriptions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId, autoRenew }),
      });

      if (response.ok) {
        toast.success(
          isArabic
            ? autoRenew
              ? 'تم تفعيل التجديد التلقائي'
              : 'تم إيقاف التجديد التلقائي'
            : autoRenew
            ? 'Auto-renew enabled'
            : 'Auto-renew disabled'
        );
        fetchSubscriptions();
      } else {
        toast.error(isArabic ? 'فشل التحديث' : 'Update failed');
      }
    } catch (error) {
      console.error('Auto-renew toggle error:', error);
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleUpgrade = (subscriptionId: string) => {
    // Navigate to subscription upgrade page
    const subscription = subscriptions.find((sub) => sub.id === subscriptionId);
    if (subscription) {
      router.push(`/${currentLocale}/mentors/${subscription.creator.id}`);
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filter === 'active') return sub.status === 'ACTIVE';
    if (filter === 'cancelled') return sub.status === 'CANCELLED' || sub.status === 'EXPIRED';
    return true;
  });

  const activeCount = subscriptions.filter((sub) => sub.status === 'ACTIVE').length;
  const totalSpent = subscriptions
    .filter((sub) => sub.status === 'ACTIVE')
    .reduce((sum, sub) => sum + sub.price, 0);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {isArabic ? 'يرجى تسجيل الدخول' : 'Please Sign In'}
          </h2>
          <Button onClick={() => router.push(`/${currentLocale}/auth/signin`)}>
            {isArabic ? 'تسجيل الدخول' : 'Sign In'}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {isArabic ? 'جاري التحميل...' : 'Loading subscriptions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {isArabic ? 'اشتراكاتي' : 'My Subscriptions'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isArabic
              ? 'إدارة اشتراكاتك في الموجهين'
              : 'Manage your mentor subscriptions'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6" />
              <h3 className="text-sm font-semibold opacity-90">
                {isArabic ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
              </h3>
            </div>
            <p className="text-4xl font-bold">{activeCount}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6" />
              <h3 className="text-sm font-semibold opacity-90">
                {isArabic ? 'إجمالي الاشتراكات' : 'Total Subscriptions'}
              </h3>
            </div>
            <p className="text-4xl font-bold">{subscriptions.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6" />
              <h3 className="text-sm font-semibold opacity-90">
                {isArabic ? 'الإنفاق الشهري' : 'Monthly Spending'}
              </h3>
            </div>
            <p className="text-4xl font-bold">
              €{totalSpent}
            </p>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isArabic ? 'الكل' : 'All'} ({subscriptions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'active'
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isArabic ? 'نشط' : 'Active'} ({activeCount})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isArabic ? 'ملغي' : 'Cancelled'} (
            {subscriptions.filter((s) => s.status === 'CANCELLED' || s.status === 'EXPIRED').length})
          </button>
        </div>

        {/* Subscriptions List */}
        {filteredSubscriptions.length > 0 ? (
          <div className="space-y-6">
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionManagement
                key={subscription.id}
                subscription={subscription}
                onCancel={handleCancel}
                onToggleAutoRenew={handleToggleAutoRenew}
                onUpgrade={handleUpgrade}
                locale={currentLocale}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isArabic ? 'لا توجد اشتراكات' : 'No subscriptions found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isArabic
                ? 'ابدأ بالاشتراك مع موجه لإطلاق العنان لإمكاناتك'
                : 'Start subscribing to mentors to unlock your potential'}
            </p>
            <Button
              onClick={() => router.push(`/${currentLocale}/mentors`)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isArabic ? 'تصفح الموجهين' : 'Browse Mentors'}
            </Button>
          </div>
        )}

        {/* Browse More Mentors CTA */}
        {subscriptions.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">
              {isArabic ? 'هل تريد المزيد من الإرشاد؟' : 'Want More Mentorship?'}
            </h2>
            <p className="mb-6 opacity-90">
              {isArabic
                ? 'اكتشف المزيد من الموجهين الخبراء لتسريع رحلة التعلم الخاصة بك'
                : 'Discover more expert mentors to accelerate your learning journey'}
            </p>
            <Button
              onClick={() => router.push(`/${currentLocale}/mentors`)}
              variant="secondary"
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isArabic ? 'تصفح الموجهين' : 'Browse Mentors'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'
