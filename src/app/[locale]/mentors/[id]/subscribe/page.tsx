'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Star,
  Users,
  BookOpen,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscribeModal from '@/components/modals/SubscribeModal';
import MentorSubscriptionBadge from '@/components/subscriptions/MentorSubscriptionBadge';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import toast from 'react-hot-toast';
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder';

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
  monthlyPrice: number; // Single tier in EUR
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
  tier: 'ALL_ACCESS';
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
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);

  const openSubscribe = () => setSubscribeModalOpen(true);
  const closeSubscribe = () => setSubscribeModalOpen(false);

  useEffect(() => {
    if (params.id) {
      fetchMentorData();
      checkUserSubscription();
    }
  }, [params.id]);

  const fetchMentorData = async () => {
    try {
      const response = await fetch(`/api/creators/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setMentor({
          id: params.id as string,
          user: {
            id: data.user.id,
            name: data.user.name,
            arabicName: data.user.arabicName,
            bio: data.user.bio || '',
            profileImage: data.user.profileImage,
          },
          expertise: data.expertise || '',
          monthlyPrice: data.monthlyPrice || 0, // No fake fallbacks - real price from DB
          totalSubscribers: data.totalSubscribers || 0,
          languages: data.languages || '',
          stats: data.stats || {
            totalFollowers: data.stats?.totalFollowers || 0,
            totalCourses: data.stats?.totalCourses || 0,
            totalStudents: data.stats?.totalStudents || 0,
            averageRating: data.stats?.averageRating || 0,
            yearsOfExperience: data.stats?.yearsOfExperience || 0,
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
                <AvatarPlaceholder 
                  name={mentor.user.name} 
                  size={96} 
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isArabic ? mentor.user.arabicName : mentor.user.name}
                </h1>
                {userSubscription?.status === 'ACTIVE' && (
                  <MentorSubscriptionBadge
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

      {/* Subscription Plan */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto grid gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-lg font-semibold mb-2">
              {isArabic ? 'خطة واحدة تشمل كل المزايا' : 'One simple plan with everything included'}
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {isArabic ? 'كل المحتوى، الجلسات المباشرة، الرسائل وأولوية الدعم' : 'All content, live sessions, messaging, and priority support'}
            </p>
            <div className="text-4xl font-black bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent mb-1">
              €{mentor.monthlyPrice}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">{isArabic ? 'شهرياً • إلغاء في أي وقت' : 'Monthly • Cancel anytime'}</div>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-6">
              <li>{isArabic ? 'جلسات مباشرة أسبوعية لكل الموجهين' : 'Weekly live sessions with every mentor'}</li>
              <li>{isArabic ? 'وصول كامل لكل المحتوى والوسائط' : 'Full access to all posts and media'}</li>
              <li>{isArabic ? 'مراسلات ذات أولوية ودعم سريع' : 'Priority messaging and quick support'}</li>
              <li>{isArabic ? 'حجوزات عبر التقويم عند الحاجة' : 'Calendar bookings when needed'}</li>
            </ul>
            <Button onClick={openSubscribe} className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold px-6 py-3 rounded-full">
              {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
            </Button>
          </div>
        </div>

        <SubscribeModal
          isOpen={subscribeModalOpen}
          onClose={closeSubscribe}
          creator={{
            id: mentor.id,
            channelId: undefined,
            user: {
              name: mentor.user.name,
              arabicName: mentor.user.arabicName,
              profileImage: mentor.user.profileImage,
            },
            expertise: mentor.expertise,
            monthlyPrice: mentor.monthlyPrice,
          }}
          isArabic={isArabic}
          onSuccess={() => checkUserSubscription()}
        />
      </div>
    </div>
  );
}
