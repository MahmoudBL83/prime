'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Play, Clock, BookOpen, Award, TrendingUp, Calendar, 
    Trophy, Target, Flame, CheckCircle, BookmarkCheck,
    Filter, Search, Grid, List, BarChart3, Star, Users,
    Sparkles, ArrowRight, X, Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import toast from 'react-hot-toast';

interface CourseWithProgress {
    id: string
    title: string
    titleAr?: string
    thumbnail: string
    progress: number
    enrolledAt: Date
    lastAccessed: Date
    completedAt?: Date
    totalLessons: number
    completedLessons: number
    totalDuration: number
    watchedDuration: number
    instructor: {
        name: string
        arabicName?: string
        image?: string
    }
    lastWatchedLesson?: {
        id: string
        title: string
        titleAr?: string
        position: number
    }
    level?: string
    category?: string
    rating?: number
    reviewsCount: number
    studentsCount: number
}

interface LearningStats {
    totalCourses: number
    completedCourses: number
    inProgressCourses: number
    totalWatchTime: number // minutes
    currentStreak: number // days
    certificates: number
    achievements: number
    weeklyGoal: number // minutes
    weeklyProgress: number // minutes
}

interface RecommendedCourse {
    id: string
    title: string
    titleAr?: string
    thumbnail: string
    level?: string
    category?: string
    price?: number
    rating?: number
    instructor: {
        name: string
        arabicName?: string
        image?: string
    }
    studentsCount: number
    reviewsCount: number
    reason: string
}

interface EnhancedMyLearningProps {
    courses: CourseWithProgress[]
    userName: string
    stats?: LearningStats
    achievements?: any[]
    certificates?: any[]
}

export default function EnhancedMyLearning({
    courses,
    userName,
    stats,
    achievements = [],
    certificates = []
}: EnhancedMyLearningProps) {
    const router = useRouter();
    const locale = useLocale();
    const { navigateWithLoading, isLoading } = useNavigationLoading();
    const isArabic = locale === 'ar';

    const [filter, setFilter] = useState<'all' | 'inProgress' | 'completed'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');
    const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [weeklyGoalHours, setWeeklyGoalHours] = useState(Math.floor((stats?.weeklyGoal || 300) / 60));
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    // Fetch recommendations on mount
    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        if (loadingRecommendations) return;
        setLoadingRecommendations(true);
        try {
            const response = await fetch('/api/my-learning/recommendations');
            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.recommendations || []);
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleSaveGoal = async () => {
        try {
            // Save goal to backend (implement API endpoint)
            toast.success(isArabic ? 'تم حفظ الهدف!' : 'Goal saved!');
            setShowGoalModal(false);
        } catch (error) {
            toast.error(isArabic ? 'فشل حفظ الهدف' : 'Failed to save goal');
        }
    };

    // Calculate learning stats from courses
    const learningStats: LearningStats = useMemo(() => {
        const completed = courses.filter(c => c.completedAt).length;
        const inProgress = courses.filter(c => !c.completedAt && c.progress > 0).length;
        const totalWatchTime = courses.reduce((sum, c) => sum + c.watchedDuration, 0);
        
        return {
            totalCourses: courses.length,
            completedCourses: completed,
            inProgressCourses: inProgress,
            totalWatchTime: Math.floor(totalWatchTime / 60), // Convert to minutes
            currentStreak: stats?.currentStreak || 0,
            certificates: certificates.length,
            achievements: achievements.length,
            weeklyGoal: stats?.weeklyGoal || 300, // 5 hours default
            weeklyProgress: stats?.weeklyProgress || 0,
        };
    }, [courses, stats, certificates, achievements]);

    // Filter and sort courses
    const filteredCourses = useMemo(() => {
        let filtered = courses;

        // Apply filter
        if (filter === 'completed') {
            filtered = filtered.filter(c => c.completedAt);
        } else if (filter === 'inProgress') {
            filtered = filtered.filter(c => !c.completedAt && c.progress > 0);
        }

        // Apply search
        if (searchQuery) {
            filtered = filtered.filter(c => 
                c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.titleAr && c.titleAr.includes(searchQuery))
            );
        }

        // Apply sort
        filtered = [...filtered].sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
            } else if (sortBy === 'progress') {
                return b.progress - a.progress;
            } else {
                return a.title.localeCompare(b.title);
            }
        });

        return filtered;
    }, [courses, filter, searchQuery, sortBy]);

    // Continue learning section - courses in progress
    const continueLearnin = courses
        .filter(c => !c.completedAt && c.lastWatchedLesson)
        .slice(0, 3);

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return isArabic ? 'اليوم' : 'Today';
        if (days === 1) return isArabic ? 'أمس' : 'Yesterday';
        if (days < 7) return isArabic ? `منذ ${days} أيام` : `${days} days ago`;
        if (days < 30) return isArabic ? `منذ ${Math.floor(days / 7)} أسابيع` : `${Math.floor(days / 7)} weeks ago`;
        return isArabic ? `منذ ${Math.floor(days / 30)} شهور` : `${Math.floor(days / 30)} months ago`;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 via-gray-900 to-pink-900 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            {isArabic ? `مرحباً ${userName}! 👋` : `Welcome back, ${userName}! 👋`}
                        </h1>
                        <p className="text-muted-foreground">
                            {isArabic ? 'واصل رحلتك التعليمية' : 'Continue your learning journey'}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Learning Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
                    {[
                        { icon: BookOpen, label: isArabic ? 'دورات' : 'Courses', value: learningStats.totalCourses, color: 'from-blue-500 to-cyan-500' },
                        { icon: CheckCircle, label: isArabic ? 'مكتملة' : 'Completed', value: learningStats.completedCourses, color: 'from-green-500 to-emerald-500' },
                        { icon: Play, label: isArabic ? 'جارية' : 'In Progress', value: learningStats.inProgressCourses, color: 'from-purple-500 to-pink-500' },
                        { icon: Clock, label: isArabic ? 'ساعات' : 'Hours', value: Math.floor(learningStats.totalWatchTime / 60), color: 'from-orange-500 to-red-500' },
                        { icon: Flame, label: isArabic ? 'متتالية' : 'Streak', value: learningStats.currentStreak, suffix: isArabic ? ' يوم' : ' days', color: 'from-yellow-500 to-orange-500' },
                        { icon: Award, label: isArabic ? 'شهادات' : 'Certificates', value: learningStats.certificates, color: 'from-indigo-500 to-purple-500' },
                        { icon: Trophy, label: isArabic ? 'إنجازات' : 'Achievements', value: learningStats.achievements, color: 'from-pink-500 to-rose-500' },
                        { icon: Target, label: isArabic ? 'الهدف' : 'Goal', value: `${Math.floor((learningStats.weeklyProgress / learningStats.weeklyGoal) * 100)}%`, color: 'from-teal-500 to-cyan-500', clickable: true },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-border hover:border-purple-500/50 transition-all ${stat.clickable ? 'cursor-pointer group' : ''}`}
                            onClick={stat.clickable ? () => setShowGoalModal(true) : undefined}
                        >
                            <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mb-3 ${stat.clickable ? 'group-hover:scale-110 transition-transform' : ''}`}>
                                <stat.icon className="w-5 h-5 text-foreground" />
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-1">
                                {stat.value}{stat.suffix || ''}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                {stat.label}
                                {stat.clickable && <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Continue Learning Section */}
                {continueLearnin.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Play className="w-6 h-6 text-purple-400" />
                            {isArabic ? 'تابع التعلم' : 'Continue Learning'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {continueLearnin.map((course) => (
                                <motion.div
                                    key={course.id}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className="group relative bg-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden border border-border hover:border-purple-500/50 transition-all cursor-pointer"
                                    onClick={() => navigateWithLoading(
                                        `/${locale}/courses/${course.id}/learn?lesson=${course.lastWatchedLesson?.id}`,
                                        `continue-${course.id}`
                                    )}
                                >
                                    <div className="relative h-40">
                                        <Image
                                            src={course.thumbnail || '/images/default-course.jpg'}
                                            alt={course.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                        <div className="absolute bottom-3 left-3 right-3">
                                            <div className="w-full bg-card rounded-full h-1.5 mb-2">
                                                <div 
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-foreground font-medium">
                                                {course.progress}% {isArabic ? 'مكتمل' : 'complete'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                                            {isArabic && course.titleAr ? course.titleAr : course.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {course.lastWatchedLesson ? (
                                                isArabic && course.lastWatchedLesson.titleAr
                                                    ? course.lastWatchedLesson.titleAr
                                                    : course.lastWatchedLesson.title
                                            ) : (isArabic ? 'ابدأ الدرس الأول' : 'Start first lesson')}
                                        </p>
                                        <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground rounded-lg font-medium transition-all flex items-center justify-center gap-2">
                                            <Play className="w-4 h-4" />
                                            {isArabic ? 'تابع' : 'Continue'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                    <div className="flex gap-2">
                        {[
                            { id: 'all', label: isArabic ? 'الكل' : 'All', count: courses.length },
                            { id: 'inProgress', label: isArabic ? 'جارية' : 'In Progress', count: learningStats.inProgressCourses },
                            { id: 'completed', label: isArabic ? 'مكتملة' : 'Completed', count: learningStats.completedCourses },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id as any)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    filter === tab.id
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-foreground shadow-lg shadow-purple-500/25'
                                        : 'bg-background text-muted-foreground hover:text-foreground hover:bg-card'
                                }`}
                            >
                                {tab.label} <span className="text-xs opacity-75">({tab.count})</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={isArabic ? 'بحث...' : 'Search...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
                            />
                        </div>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-500 transition-all"
                        >
                            <option value="recent">{isArabic ? 'الأحدث' : 'Recent'}</option>
                            <option value="progress">{isArabic ? 'التقدم' : 'Progress'}</option>
                            <option value="title">{isArabic ? 'العنوان' : 'Title'}</option>
                        </select>

                        <div className="flex gap-1 bg-background rounded-lg p-1 border border-border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-all ${
                                    viewMode === 'grid' ? 'bg-purple-600 text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-all ${
                                    viewMode === 'list' ? 'bg-purple-600 text-foreground' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Courses Grid/List */}
                <AnimatePresence mode="wait">
                    {filteredCourses.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-20"
                        >
                            <BookmarkCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {isArabic ? 'لا توجد دورات' : 'No courses found'}
                            </h3>
                            <p className="text-muted-foreground">
                                {isArabic ? 'جرب تعديل الفلاتر أو البحث' : 'Try adjusting your filters or search'}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}
                        >
                            {filteredCourses.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1.01, y: -4 }}
                                    className={`group relative bg-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden border border-border hover:border-purple-500/50 transition-all cursor-pointer ${
                                        viewMode === 'list' ? 'flex gap-4' : ''
                                    }`}
                                    onClick={() => navigateWithLoading(
                                        `/${locale}/courses/${course.id}`,
                                        `course-${course.id}`
                                    )}
                                >
                                    <div className={`relative ${viewMode === 'grid' ? 'h-48' : 'w-48 h-32'}`}>
                                        <Image
                                            src={course.thumbnail || '/images/default-course.jpg'}
                                            alt={course.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {course.completedAt && (
                                            <div className="absolute top-3 right-3 bg-green-500 text-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                {isArabic ? 'مكتمل' : 'Completed'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex-1">
                                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                                            {isArabic && course.titleAr ? course.titleAr : course.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                {course.completedLessons}/{course.totalLessons}
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {formatDuration(course.totalDuration / 60)}
                                            </div>
                                        </div>
                                        <div className="w-full bg-card rounded-full h-2 mb-2">
                                            <div 
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{course.progress}% {isArabic ? 'مكتمل' : 'complete'}</span>
                                            <span>{formatDate(course.lastAccessed)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Recommended Courses */}
            {recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-2xl font-bold text-foreground">
                                {isArabic ? 'مقترح لك' : 'Recommended for You'}
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.slice(0, 6).map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-lg rounded-2xl border border-border/50 overflow-hidden hover:border-purple-500/50 transition-all group cursor-pointer"
                                onClick={() => navigateWithLoading(`/${locale}/courses/${course.id}`)}
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <Image
                                        src={course.thumbnail || '/images/course-placeholder.jpg'}
                                        alt={course.title}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                                    
                                    {/* Recommendation Badge */}
                                    <div className="absolute top-3 right-3 bg-yellow-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-foreground flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        {course.reason}
                                    </div>

                                    {/* Level Badge */}
                                    {course.level && (
                                        <div className="absolute top-3 left-3 bg-purple-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-foreground">
                                            {course.level}
                                        </div>
                                    )}
                                </div>

                                <div className="p-5">
                                    <h3 className="font-bold text-foreground text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                                        {isArabic && course.titleAr ? course.titleAr : course.title}
                                    </h3>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                        <Image
                                            src={course.instructor.image || '/images/avatar-placeholder.jpg'}
                                            alt={course.instructor.name}
                                            width={24}
                                            height={24}
                                            className="rounded-full"
                                        />
                                        <span className="line-clamp-1">
                                            {isArabic && course.instructor.arabicName 
                                                ? course.instructor.arabicName 
                                                : course.instructor.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span>{course.rating?.toFixed(1) || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{course.studentsCount.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigateWithLoading(`/${locale}/courses/${course.id}`);
                                        }}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all group"
                                    >
                                        {isArabic ? 'تفاصيل الدورة' : 'View Course'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Goal Setting Modal */}
            <AnimatePresence>
                {showGoalModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowGoalModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-gray-900 to-gray-800 border border-border rounded-2xl p-8 max-w-md w-full"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Target className="w-6 h-6 text-purple-400" />
                                    <h3 className="text-xl font-bold text-foreground">
                                        {isArabic ? 'حدد هدفك الأسبوعي' : 'Set Weekly Goal'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setShowGoalModal(false)}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <p className="text-muted-foreground mb-6">
                                {isArabic 
                                    ? 'كم ساعة تريد أن تتعلم كل أسبوع؟' 
                                    : 'How many hours do you want to learn each week?'}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        {isArabic ? 'ساعات في الأسبوع' : 'Hours per week'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="40"
                                        value={weeklyGoalHours}
                                        onChange={(e) => setWeeklyGoalHours(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))}
                                        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">
                                            {isArabic ? 'هدف يومي تقريبي' : 'Daily target (approx)'}
                                        </span>
                                        <span className="text-foreground font-semibold">
                                            {Math.round(weeklyGoalHours * 60 / 7)} {isArabic ? 'دقيقة' : 'min'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic 
                                            ? `${weeklyGoalHours} ساعات = ${weeklyGoalHours * 60} دقيقة في الأسبوع`
                                            : `${weeklyGoalHours} hours = ${weeklyGoalHours * 60} minutes per week`}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowGoalModal(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-foreground py-3 rounded-lg font-semibold transition-colors"
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSaveGoal}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground py-3 rounded-lg font-semibold transition-all"
                                >
                                    {isArabic ? 'حفظ' : 'Save Goal'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
