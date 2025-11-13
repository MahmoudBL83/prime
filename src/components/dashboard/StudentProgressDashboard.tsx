/**
 * Student Progress Dashboard Component
 * Displays comprehensive learning progress, achievements, and analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import {
    Trophy,
    Clock,
    Target,
    TrendingUp,
    BookOpen,
    PlayCircle,
    CheckCircle2,
    Award,
    Calendar,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/video-utils';
import { Link } from '@/i18n/navigation';

interface ProgressStats {
    totalCourses: number;
    completedCourses: number;
    totalLessons: number;
    completedLessons: number;
    totalWatchTime: number; // in seconds
    averageProgress: number;
    currentStreak: number;
    longestStreak: number;
    certificatesEarned: number;
}

interface CourseProgress {
    id: string;
    title: string;
    titleAr: string;
    thumbnail: string;
    progress: number;
    completedLessons: number;
    totalLessons: number;
    lastWatched: Date;
    estimatedTimeLeft: number; // in seconds
    instructor: {
        name: string;
        avatar?: string;
    };
}

interface Achievement {
    id: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    icon: string;
    earnedAt: Date;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LearningActivity {
    date: string;
    watchTime: number; // in seconds
    lessonsCompleted: number;
    coursesAccessed: number;
}

export default function StudentProgressDashboard() {
    const { data: session } = useSession();
    const t = useTranslations('dashboard');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ProgressStats | null>(null);
    const [courses, setCourses] = useState<CourseProgress[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [weeklyActivity, setWeeklyActivity] = useState<LearningActivity[]>([]);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!session?.user?.id) return;

        const loadProgressData = async () => {
            try {
                setLoading(true);

                const [statsRes, coursesRes, achievementsRes, activityRes] = await Promise.all([
                    fetch('/api/students/progress/stats'),
                    fetch('/api/students/progress/courses'),
                    fetch('/api/students/achievements'),
                    fetch('/api/students/activity?period=week')
                ]);

                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                if (coursesRes.ok) {
                    const coursesData = await coursesRes.json();
                    setCourses(coursesData);
                }

                if (achievementsRes.ok) {
                    const achievementsData = await achievementsRes.json();
                    setAchievements(achievementsData);
                }

                if (activityRes.ok) {
                    const activityData = await activityRes.json();
                    setWeeklyActivity(activityData);
                }

            } catch (error) {
                console.error('Failed to load progress data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProgressData();
    }, [session]);

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return 'bg-muted text-foreground';
            case 'rare': return 'bg-blue-100 text-blue-700';
            case 'epic': return 'bg-purple-100 text-purple-700';
            case 'legendary': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-muted text-foreground';
        }
    };

    const getRarityText = (rarity: string) => {
        switch (rarity) {
            case 'common':
                return locale === 'ar' ? 'عادي' : locale === 'de' ? 'Gewöhnlich' : 'Common';
            case 'rare':
                return locale === 'ar' ? 'نادر' : locale === 'de' ? 'Selten' : 'Rare';
            case 'epic':
                return locale === 'ar' ? 'ملحمي' : locale === 'de' ? 'Episch' : 'Epic';
            case 'legendary':
                return locale === 'ar' ? 'أسطوري' : locale === 'de' ? 'Legendär' : 'Legendary';
            default:
                return rarity;
        }
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 90) return 'bg-green-500';
        if (progress >= 70) return 'bg-blue-500';
        if (progress >= 40) return 'bg-yellow-500';
        return 'bg-gray-400';
    };

    if (!session) {
        const loginTitle = locale === 'ar' ? 'يرجى تسجيل الدخول' : locale === 'de' ? 'Bitte anmelden' : 'Please log in';
        const loginDesc = locale === 'ar'
            ? 'قم بتسجيل الدخول لعرض تقدمك في التعلم'
            : locale === 'de'
                ? 'Melden Sie sich an, um Ihren Lernfortschritt anzuzeigen'
                : 'Log in to view your learning progress';

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold text-foreground mb-2">{loginTitle}</h2>
                    <p className="text-muted-foreground">{loginDesc}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        const loadingText = locale === 'ar'
            ? 'جاري تحميل بيانات التقدم...'
            : locale === 'de'
                ? 'Lade Fortschrittsdaten...'
                : 'Loading progress data...';

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">{loadingText}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {locale === 'ar' ? 'لوحة تقدم التعلم' : locale === 'de' ? 'Lernfortschritts-Dashboard' : 'Learning Progress Dashboard'}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === 'ar'
                            ? 'تتبع رحلتك التعليمية وانجازاتك'
                            : locale === 'de'
                                ? 'Verfolgen Sie Ihre Lernreise und Erfolge'
                                : 'Track your learning journey and achievements'
                        }
                    </p>
                </div>

                {/* Overview Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'الكورسات المكتملة' : locale === 'de' ? 'Abgeschlossene Kurse' : 'Completed Courses'}
                                </CardTitle>
                                <Trophy className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.completedCourses}</div>
                                <p className="text-xs text-muted-foreground">
                                    {locale === 'ar' ? 'من أصل' : locale === 'de' ? 'von' : 'of'} {stats.totalCourses} {locale === 'ar' ? 'كورس' : locale === 'de' ? 'Kursen' : 'courses'}
                                </p>
                                <Progress
                                    value={(stats.completedCourses / stats.totalCourses) * 100}
                                    className="mt-2"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'وقت المشاهدة الإجمالي' : locale === 'de' ? 'Gesamte Sehzeit' : 'Total Watch Time'}
                                </CardTitle>
                                <Clock className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatDuration(stats.totalWatchTime)}</div>
                                <p className="text-xs text-muted-foreground">
                                    {locale === 'ar' ? 'متوسط التقدم' : locale === 'de' ? 'Durchschnittlicher Fortschritt' : 'Average Progress'}: {Math.round(stats.averageProgress)}%
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'السلسلة الحالية' : locale === 'de' ? 'Aktuelle Serie' : 'Current Streak'}
                                </CardTitle>
                                <Target className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.currentStreak}</div>
                                <p className="text-xs text-muted-foreground">
                                    {locale === 'ar' ? 'أطول سلسلة' : locale === 'de' ? 'Längste Serie' : 'Longest streak'}: {stats.longestStreak} {locale === 'ar' ? 'يوم' : locale === 'de' ? 'Tage' : 'days'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {locale === 'ar' ? 'الشهادات المكتسبة' : locale === 'de' ? 'Erworbene Zertifikate' : 'Certificates Earned'}
                                </CardTitle>
                                <Award className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.certificatesEarned}</div>
                                <p className="text-xs text-muted-foreground">
                                    {locale === 'ar' ? 'الدروس المكتملة' : locale === 'de' ? 'Abgeschlossene Lektionen' : 'Completed lessons'}: {stats.completedLessons}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">
                            {locale === 'ar' ? 'نظرة عامة' : locale === 'de' ? 'Übersicht' : 'Overview'}
                        </TabsTrigger>
                        <TabsTrigger value="courses">
                            {locale === 'ar' ? 'الكورسات' : locale === 'de' ? 'Kurse' : 'Courses'}
                        </TabsTrigger>
                        <TabsTrigger value="achievements">
                            {locale === 'ar' ? 'الإنجازات' : locale === 'de' ? 'Erfolge' : 'Achievements'}
                        </TabsTrigger>
                        <TabsTrigger value="activity">
                            {locale === 'ar' ? 'النشاط' : locale === 'de' ? 'Aktivität' : 'Activity'}
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Courses */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        {locale === 'ar' ? 'الكورسات الأخيرة' : locale === 'de' ? 'Aktuelle Kurse' : 'Recent Courses'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {courses.slice(0, 3).map(course => (
                                            <div key={course.id} className="flex items-center space-x-4 rtl:space-x-reverse">
                                                <img
                                                    src={course.thumbnail}
                                                    alt={locale === 'ar' ? course.titleAr || course.title : course.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm truncate">
                                                        {locale === 'ar' ? course.titleAr || course.title : course.title}
                                                    </h4>
                                                    <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                                                        <Progress value={course.progress} className="flex-1 h-2" />
                                                        <span className="text-xs text-muted-foreground">{Math.round(course.progress)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Weekly Activity Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        {locale === 'ar' ? 'النشاط الأسبوعي' : locale === 'de' ? 'Wöchentliche Aktivität' : 'Weekly Activity'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {weeklyActivity.map((day, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">{day.date}</span>
                                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                                    <div className="text-sm">
                                                        {Math.round(day.watchTime / 60)} {locale === 'ar' ? 'دقيقة' : locale === 'de' ? 'Minuten' : 'minutes'}
                                                    </div>
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-500 h-2 rounded-full"
                                                            style={{ width: `${Math.min(100, (day.watchTime / 3600) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Courses Tab */}
                    <TabsContent value="courses" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map(course => (
                                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <img
                                            src={course.thumbnail}
                                            alt={locale === 'ar' ? course.titleAr || course.title : course.title}
                                            className="w-full h-32 object-cover rounded-lg mb-3"
                                        />
                                        <CardTitle className="text-lg">{locale === 'ar' ? course.titleAr || course.title : course.title}</CardTitle>
                                        <CardDescription>
                                            {locale === 'ar' ? 'بواسطة' : locale === 'de' ? 'Von' : 'By'} {course.instructor.name}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span>{locale === 'ar' ? 'التقدم' : locale === 'de' ? 'Fortschritt' : 'Progress'}: {Math.round(course.progress)}%</span>
                                                <span>{course.completedLessons}/{course.totalLessons} {locale === 'ar' ? 'درس' : locale === 'de' ? 'Lektionen' : 'lessons'}</span>
                                            </div>
                                            <Progress value={course.progress} className={getProgressColor(course.progress)} />
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{locale === 'ar' ? 'آخر مشاهدة' : locale === 'de' ? 'Zuletzt angesehen' : 'Last watched'}: {new Date(course.lastWatched).toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US')}</span>
                                                <span>{locale === 'ar' ? 'متبقي' : locale === 'de' ? 'Verbleibend' : 'Remaining'}: {formatDuration(course.estimatedTimeLeft)}</span>
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={() => window.location.href = `/courses/${course.id}/learn-new`}
                                            >
                                                {locale === 'ar' ? 'متابعة التعلم' : locale === 'de' ? 'Lernen fortsetzen' : 'Continue Learning'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Achievements Tab */}
                    <TabsContent value="achievements" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {achievements.map(achievement => (
                                <Card key={achievement.id} className="text-center">
                                    <CardHeader>
                                        <div className="text-4xl mb-2">{achievement.icon}</div>
                                        <CardTitle className="text-lg">{locale === 'ar' ? achievement.titleAr || achievement.title : achievement.title}</CardTitle>
                                        <Badge className={getRarityColor(achievement.rarity)}>
                                            {getRarityText(achievement.rarity)}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {locale === 'ar' ? achievement.descriptionAr || achievement.description : achievement.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {locale === 'ar' ? 'تم الحصول عليه في' : locale === 'de' ? 'Erhalten am' : 'Earned on'}: {new Date(achievement.earnedAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US')}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {locale === 'ar' ? 'تفاصيل النشاط' : locale === 'de' ? 'Aktivitätsdetails' : 'Activity Details'}
                                </CardTitle>
                                <CardDescription>
                                    {locale === 'ar'
                                        ? 'نشاطك التعليمي خلال الأسبوع الماضي'
                                        : locale === 'de'
                                            ? 'Ihre Lernaktivitäten der letzten Woche'
                                            : 'Your learning activity over the past week'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {weeklyActivity.map((day, index) => (
                                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">{day.date}</h4>
                                                <Badge variant="outline">{formatDuration(day.watchTime)}</Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <PlayCircle className="w-4 h-4" />
                                                    {locale === 'ar' ? 'وقت المشاهدة' : locale === 'de' ? 'Sehzeit' : 'Watch time'}: {Math.round(day.watchTime / 60)} {locale === 'ar' ? 'دقيقة' : locale === 'de' ? 'Minuten' : 'minutes'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    {locale === 'ar' ? 'الدروس المكتملة' : locale === 'de' ? 'Abgeschlossene Lektionen' : 'Completed lessons'}: {day.lessonsCompleted}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4" />
                                                    {locale === 'ar' ? 'الكورسات المتاحة' : locale === 'de' ? 'Zugegriffene Kurse' : 'Courses accessed'}: {day.coursesAccessed}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
