'use client';

import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Crown, Star, BookOpen, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface DashboardBannerProps {
    userName?: string;
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

export function DashboardBanner({ userName, userSubscriptionStatus = 'NONE' }: DashboardBannerProps) {
    const { data: session } = useSession();
    const t = useTranslations('dashboard');
    const tCommon = useTranslations('common');
    const locale = useLocale();

    // Handle non-subscribed users (including expired/cancelled)
    if (userSubscriptionStatus === 'NONE' || userSubscriptionStatus === 'EXPIRED' || userSubscriptionStatus === 'CANCELLED') {
        const greeting = locale === 'ar' ? 'مرحباً' : locale === 'de' ? 'Hallo' : 'Hello';
        const title = locale === 'ar' ? 'فتح التعلم غير المحدود' : locale === 'de' ? 'Unbegrenztes Lernen freischalten' : 'Unlock Unlimited Learning';
        const description = locale === 'ar'
            ? `${greeting} ${userName || session?.user?.name || ''}! وصولك إلى مكتبتنا الكاملة من الدورات عالية الجودة`
            : locale === 'de'
                ? `${greeting} ${userName || session?.user?.name || ''}! Erhalten Sie Zugang zu unserer kompletten Bibliothek mit hochwertigen Kursen`
                : `${greeting} ${userName || session?.user?.name || ''}! Get access to our complete library of high-quality courses`;
        const courses = locale === 'ar' ? '150+ دورة حصرية' : locale === 'de' ? '150+ exklusive Kurse' : '150+ exclusive courses';
        const instructors = locale === 'ar' ? 'معلمون خبراء' : locale === 'de' ? 'Erfahrene Lehrer' : 'Expert instructors';
        const community = locale === 'ar' ? 'مجتمع تعليمي' : locale === 'de' ? 'Lerngemeinschaft' : 'Learning community';
        const currency = locale === 'ar' ? 'جنيه/شهر' : locale === 'de' ? '€/Monat' : '$/month';
        const price = userSubscriptionStatus === 'EXPIRED' || userSubscriptionStatus === 'CANCELLED' ? '199' : '150';
        const actionText = userSubscriptionStatus === 'EXPIRED' || userSubscriptionStatus === 'CANCELLED'
            ? (locale === 'ar' ? 'تجديد الاشتراك' : locale === 'de' ? 'Abonnement erneuern' : 'Renew Subscription')
            : (locale === 'ar' ? 'ابدأ مجاناً' : locale === 'de' ? 'Kostenlos starten' : 'Start Free');
        const buttonText = userSubscriptionStatus === 'EXPIRED' || userSubscriptionStatus === 'CANCELLED'
            ? (locale === 'ar' ? 'تجديد الاشتراك' : locale === 'de' ? 'Abonnement erneuern' : 'Renew Subscription')
            : (locale === 'ar' ? 'اشترك الآن' : locale === 'de' ? 'Jetzt abonnieren' : 'Subscribe Now');

        return (
            <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 rounded-lg p-6 mb-8 text-foreground">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <Crown className="w-8 h-8 text-yellow-400" />
                            <h2 className="text-2xl font-bold">{title}</h2>
                        </div>
                        <p className="text-gray-200 mb-4 text-lg">
                            {description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-yellow-400" />
                                <span>{courses}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span>{instructors}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-yellow-400" />
                                <span>{community}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-yellow-400 mb-1">
                                {price}
                                <span className="text-lg text-muted-foreground">{currency}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {actionText}
                            </p>
                        </div>
                        <Link href="/subscribe">
                            <Button
                                size="lg"
                                className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-foreground font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                                <Crown className="w-5 h-5 ml-2" />
                                {buttonText}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Handle subscribed users
    const welcomeBack = locale === 'ar' ? 'مرحباً بعودتك' : locale === 'de' ? 'Willkommen zurück' : 'Welcome back';
    const title = `${welcomeBack}, ${userName || session?.user?.name || ''}!`;
    const description = locale === 'ar'
        ? 'استمر في رحلة التعلم الخاصة بك مع وصول كامل إلى جميع الدورات والميزات المتميزة'
        : locale === 'de'
            ? 'Setzen Sie Ihre Lernreise mit vollem Zugang zu allen Kursen und Premium-Funktionen fort'
            : 'Continue your learning journey with full access to all courses and premium features';
    const unlimitedAccess = locale === 'ar' ? 'وصول غير محدود' : locale === 'de' ? 'Unbegrenzter Zugriff' : 'Unlimited access';
    const exclusiveContent = locale === 'ar' ? 'محتوى حصري' : locale === 'de' ? 'Exklusive Inhalte' : 'Exclusive content';
    const prioritySupport = locale === 'ar' ? 'دعم أولوية' : locale === 'de' ? 'Priorisierter Support' : 'Priority support';
    const activeSubscriber = locale === 'ar' ? 'مشترك نشط' : locale === 'de' ? 'Aktiver Abonnent' : 'Active subscriber';
    const enjoyFeatures = locale === 'ar' ? 'استمتع بجميع الميزات' : locale === 'de' ? 'Genießen Sie alle Funktionen' : 'Enjoy all features';
    const continueLearning = locale === 'ar' ? 'استمر بالتعلم' : locale === 'de' ? 'Lernen fortsetzen' : 'Continue Learning';

    return (
        <div className="bg-gradient-to-r from-green-900 via-teal-900 to-emerald-900 rounded-lg p-6 mb-8 text-foreground">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <Star className="w-8 h-8 text-yellow-400" />
                        <h2 className="text-2xl font-bold">{title}</h2>
                    </div>
                    <p className="text-gray-200 mb-4 text-lg">
                        {description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-green-400" />
                            <span>{unlimitedAccess}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-green-400" />
                            <span>{exclusiveContent}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-400" />
                            <span>{prioritySupport}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">
                            {activeSubscriber}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {enjoyFeatures}
                        </p>
                    </div>
                    <Link href="/courses">
                        <Button
                            size="lg"
                            className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-foreground font-semibold transition-all duration-200 transform hover:scale-105"
                        >
                            <BookOpen className="w-5 h-5 ml-2" />
                            {continueLearning}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
