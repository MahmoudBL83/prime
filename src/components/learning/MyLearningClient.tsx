/**
 * My Learning Client Component
 * Interactive UI for viewing and filtering enrolled courses
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
    BookOpen,
    Clock,
    PlayCircle,
    CheckCircle2,
    Filter,
    Search,
    TrendingUp,
    Award,
    Calendar,
    Star,
    Users,
    ArrowRight,
    Download,
    Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

interface CourseData {
    id: string;
    title: string;
    titleAr?: string;
    description?: string;
    descriptionAr?: string;
    thumbnail?: string;
    level: string;
    category: string;
    price: number;
    rating?: number;
    progress: number;
    enrolledAt: Date;
    lastAccessed?: Date;
    completedAt?: Date;
    totalLessons: number;
    completedLessons: number;
    totalDuration: number;
    watchedDuration: number;
    instructor: {
        name: string;
        arabicName?: string;
        image?: string;
    };
    lastWatchedLesson?: {
        id: string;
        title: string;
        titleAr?: string;
        position: number;
    } | null;
    reviewsCount: number;
    studentsCount: number;
}

interface MyLearningClientProps {
    courses: CourseData[];
    userName: string;
}

type FilterType = 'all' | 'in-progress' | 'completed' | 'not-started';
type SortType = 'recent' | 'progress' | 'title' | 'enrolled';

export default function MyLearningClient({ courses, userName }: MyLearningClientProps) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('learning');
    const tCommon = useTranslations('common');

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortType, setSortType] = useState<SortType>('recent');

    // Filter and sort courses
    const filteredCourses = useMemo(() => {
        let filtered = courses;

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.titleAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply filter
        switch (filterType) {
            case 'in-progress':
                filtered = filtered.filter(c => c.progress > 0 && c.progress < 100);
                break;
            case 'completed':
                filtered = filtered.filter(c => c.progress >= 100 || c.completedAt);
                break;
            case 'not-started':
                filtered = filtered.filter(c => c.progress === 0);
                break;
        }

        // Apply sort
        switch (sortType) {
            case 'recent':
                filtered = [...filtered].sort((a, b) => {
                    const dateA = a.lastAccessed || a.enrolledAt;
                    const dateB = b.lastAccessed || b.enrolledAt;
                    return dateB.getTime() - dateA.getTime();
                });
                break;
            case 'progress':
                filtered = [...filtered].sort((a, b) => b.progress - a.progress);
                break;
            case 'title':
                filtered = [...filtered].sort((a, b) =>
                    locale === 'ar' && a.titleAr && b.titleAr
                        ? a.titleAr.localeCompare(b.titleAr, 'ar')
                        : a.title.localeCompare(b.title)
                );
                break;
            case 'enrolled':
                filtered = [...filtered].sort((a, b) =>
                    b.enrolledAt.getTime() - a.enrolledAt.getTime()
                );
                break;
        }

        return filtered;
    }, [courses, searchQuery, filterType, sortType, locale]);

    // Statistics
    const stats = useMemo(() => ({
        total: courses.length,
        inProgress: courses.filter(c => c.progress > 0 && c.progress < 100).length,
        completed: courses.filter(c => c.progress >= 100 || c.completedAt).length,
        totalHours: Math.floor(courses.reduce((sum, c) => sum + c.totalDuration, 0) / 3600),
        watchedHours: Math.floor(courses.reduce((sum, c) => sum + c.watchedDuration, 0) / 3600),
    }), [courses]);

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const getProgressColor = (progress: number) => {
        if (progress === 0) return 'text-muted-foreground';
        if (progress < 25) return 'text-red-400';
        if (progress < 50) return 'text-yellow-400';
        if (progress < 75) return 'text-blue-400';
        if (progress < 100) return 'text-purple-400';
        return 'text-green-400';
    };

    const getContinueWatchingText = (course: CourseData) => {
        if (course.progress >= 100) return locale === 'ar' ? 'مراجعة' : 'Review';
        if (course.progress === 0) return locale === 'ar' ? 'ابدأ الآن' : 'Start Now';
        if (course.lastWatchedLesson) {
            const lessonTitle = locale === 'ar' && course.lastWatchedLesson.titleAr
                ? course.lastWatchedLesson.titleAr
                : course.lastWatchedLesson.title;
            return locale === 'ar' ? `تابع: ${lessonTitle}` : `Continue: ${lessonTitle}`;
        }
        return locale === 'ar' ? 'تابع التعلم' : 'Continue Learning';
    };

    return (
        <div className="min-h-screen">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-700 pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            {locale === 'ar' ? `مرحباً ${userName}` : `Welcome back, ${userName}`}
                        </h1>
                        <p className="text-xl text-purple-100 mb-8">
                            {locale === 'ar' 
                                ? 'تابع رحلة التعلم الخاصة بك'
                                : 'Continue your learning journey'}
                        </p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-border">
                                <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                                <div className="text-sm text-purple-100">
                                    {locale === 'ar' ? 'الكورسات' : 'Courses'}
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-border">
                                <div className="text-3xl font-bold text-yellow-300">{stats.inProgress}</div>
                                <div className="text-sm text-purple-100">
                                    {locale === 'ar' ? 'قيد التقدم' : 'In Progress'}
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-border">
                                <div className="text-3xl font-bold text-green-300">{stats.completed}</div>
                                <div className="text-sm text-purple-100">
                                    {locale === 'ar' ? 'مكتملة' : 'Completed'}
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-border">
                                <div className="text-3xl font-bold text-blue-300">{stats.totalHours}</div>
                                <div className="text-sm text-purple-100">
                                    {locale === 'ar' ? 'ساعات محتوى' : 'Hours Content'}
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-border">
                                <div className="text-3xl font-bold text-purple-300">{stats.watchedHours}</div>
                                <div className="text-sm text-purple-100">
                                    {locale === 'ar' ? 'ساعات مشاهدة' : 'Hours Watched'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="bg-gray-800/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={locale === 'ar' ? 'ابحث في كورساتك...' : 'Search your courses...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 bg-gray-900/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2">
                            {['all', 'in-progress', 'completed', 'not-started'].map((filter) => (
                                <Button
                                    key={filter}
                                    onClick={() => setFilterType(filter as FilterType)}
                                    variant={filterType === filter ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        'rounded-xl transition-all',
                                        filterType === filter
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-foreground border-0'
                                            : 'bg-gray-900/50 border-border text-muted-foreground hover:bg-card hover:text-foreground'
                                    )}
                                >
                                    {locale === 'ar'
                                        ? filter === 'all' ? 'الكل'
                                            : filter === 'in-progress' ? 'قيد التقدم'
                                                : filter === 'completed' ? 'مكتملة'
                                                    : 'لم تبدأ'
                                        : filter === 'all' ? 'All'
                                            : filter === 'in-progress' ? 'In Progress'
                                                : filter === 'completed' ? 'Completed'
                                                    : 'Not Started'}
                                </Button>
                            ))}
                        </div>

                        {/* Sort */}
                        <select
                            value={sortType}
                            onChange={(e) => setSortType(e.target.value as SortType)}
                            className="bg-gray-900/50 border border-border text-foreground rounded-xl px-4 py-2.5 outline-none focus:border-purple-500 transition-colors"
                        >
                            <option value="recent">{locale === 'ar' ? 'الأحدث' : 'Recent'}</option>
                            <option value="progress">{locale === 'ar' ? 'التقدم' : 'Progress'}</option>
                            <option value="title">{locale === 'ar' ? 'العنوان' : 'Title'}</option>
                            <option value="enrolled">{locale === 'ar' ? 'تاريخ التسجيل' : 'Enrolled Date'}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-2xl font-semibold text-muted-foreground mb-2">
                            {locale === 'ar' ? 'لا توجد كورسات' : 'No courses found'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {locale === 'ar' 
                                ? 'ابدأ رحلة التعلم الخاصة بك من كتالوج الكورسات'
                                : 'Start your learning journey from our course catalog'}
                        </p>
                        <Link href="/courses">
                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                <BookOpen className="w-4 h-4 mr-2" />
                                {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-gray-800/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video overflow-hidden bg-background">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={locale === 'ar' && course.titleAr ? course.titleAr : course.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
                                            <BookOpen className="w-16 h-16 text-white/30" />
                                        </div>
                                    )}

                                    {/* Progress Badge */}
                                    {course.progress === 100 ? (
                                        <div className="absolute top-3 right-3 bg-green-500 text-foreground px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {locale === 'ar' ? 'مكتمل' : 'Completed'}
                                        </div>
                                    ) : course.progress > 0 ? (
                                        <div className="absolute top-3 right-3 bg-purple-600 text-foreground px-3 py-1 rounded-full text-xs font-semibold">
                                            {Math.round(course.progress)}%
                                        </div>
                                    ) : (
                                        <div className="absolute top-3 right-3 bg-gray-700 text-foreground px-3 py-1 rounded-full text-xs font-semibold">
                                            {locale === 'ar' ? 'جديد' : 'New'}
                                        </div>
                                    )}

                                    {/* Play Button Overlay */}
                                    <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-background rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform">
                                            <PlayCircle className="w-8 h-8 text-purple-600" />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    {/* Category & Level */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                                            {course.category}
                                        </Badge>
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs">
                                            {course.level}
                                        </Badge>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                        {locale === 'ar' && course.titleAr ? course.titleAr : course.title}
                                    </h3>

                                    {/* Instructor */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-foreground text-xs font-semibold">
                                            {course.instructor.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {locale === 'ar' && course.instructor.arabicName 
                                                ? course.instructor.arabicName 
                                                : course.instructor.name}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-muted-foreground">
                                                {locale === 'ar' ? 'التقدم' : 'Progress'}
                                            </span>
                                            <span className={cn('text-xs font-semibold', getProgressColor(course.progress))}>
                                                {Math.round(course.progress)}%
                                            </span>
                                        </div>
                                        <Progress value={course.progress} className="h-2" />
                                        <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                                            <span>{course.completedLessons} / {course.totalLessons} {locale === 'ar' ? 'دروس' : 'lessons'}</span>
                                            <span>{formatDuration(course.watchedDuration)} / {formatDuration(course.totalDuration)}</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                                            <span>{course.rating?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{course.studentsCount}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatDuration(course.totalDuration)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>
                                                {new Date(course.lastAccessed || course.enrolledAt).toLocaleDateString(
                                                    locale === 'ar' ? 'ar-EG' : 'en-US',
                                                    { month: 'short', day: 'numeric' }
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Link href={`/courses/${course.id}/learn`} className="flex-1">
                                            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-xl">
                                                <PlayCircle className="w-4 h-4 mr-2" />
                                                {getContinueWatchingText(course)}
                                            </Button>
                                        </Link>

                                        {course.progress >= 100 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-border text-muted-foreground hover:bg-card hover:text-foreground rounded-xl"
                                                onClick={() => {
                                                    // TODO: Download certificate
                                                    console.log('Download certificate for', course.id);
                                                }}
                                            >
                                                <Award className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {filteredCourses.length > 0 && (
                    <div className="text-center mt-8 text-muted-foreground text-sm">
                        {locale === 'ar' 
                            ? `عرض ${filteredCourses.length} من ${courses.length} كورس`
                            : `Showing ${filteredCourses.length} of ${courses.length} courses`}
                    </div>
                )}
            </div>
        </div>
    );
}
