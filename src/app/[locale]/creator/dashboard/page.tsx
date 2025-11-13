'use client'

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { 
    Skeleton, 
    StatCardSkeleton, 
    CourseRowSkeleton, 
    ActivitySkeleton,
    CardSkeleton 
} from '@/components/ui/skeleton'
import { useOptimizedNavigation } from '@/hooks/useOptimizedNavigation'

// Dynamic imports for icons to reduce initial bundle size
const IconComponents = {
    Upload: lazy(() => import('lucide-react').then(mod => ({ default: mod.Upload }))),
    Video: lazy(() => import('lucide-react').then(mod => ({ default: mod.Video }))),
    BarChart3: lazy(() => import('lucide-react').then(mod => ({ default: mod.BarChart3 }))),
    Users: lazy(() => import('lucide-react').then(mod => ({ default: mod.Users }))),
    MessageSquare: lazy(() => import('lucide-react').then(mod => ({ default: mod.MessageSquare }))),
    Settings: lazy(() => import('lucide-react').then(mod => ({ default: mod.Settings }))),
    DollarSign: lazy(() => import('lucide-react').then(mod => ({ default: mod.DollarSign }))),
    TrendingUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp }))),
    Eye: lazy(() => import('lucide-react').then(mod => ({ default: mod.Eye }))),
    Clock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock }))),
    ThumbsUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.ThumbsUp }))),
    Bell: lazy(() => import('lucide-react').then(mod => ({ default: mod.Bell }))),
    Calendar: lazy(() => import('lucide-react').then(mod => ({ default: mod.Calendar }))),
    Sparkles: lazy(() => import('lucide-react').then(mod => ({ default: mod.Sparkles }))),
    Play: lazy(() => import('lucide-react').then(mod => ({ default: mod.Play }))),
    AlertCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle }))),
    ChevronRight: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronRight }))),
    ArrowLeft: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft }))),
    Home: lazy(() => import('lucide-react').then(mod => ({ default: mod.Home }))),
    Loader2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Loader2 })))
}

// Icon fallback component
const IconFallback = () => <div className="w-5 h-5 bg-muted rounded animate-pulse" />

// Optimized icon component with lazy loading
const DynamicIcon = ({ name, className = "w-5 h-5", ...props }: { 
    name: keyof typeof IconComponents, 
    className?: string 
}) => {
    const IconComponent = IconComponents[name]
    return (
        <Suspense fallback={<IconFallback />}>
            <IconComponent className={className} {...props} />
        </Suspense>
    )
}

// Memoized components for better performance
const StatCard = React.memo(({ 
    title, 
    value, 
    icon, 
    growth, 
    onClick, 
    isArabic,
    className = ""
}: {
    title: string
    value: string | number
    icon: keyof typeof IconComponents
    growth?: string
    onClick?: () => void
    isArabic: boolean
    className?: string
}) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className={`bg-card border border-border rounded-xl p-6 ${onClick ? 'cursor-pointer group' : ''} ${className}`}
        onClick={onClick}
    >
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{title}</span>
            <DynamicIcon name={icon} className="w-5 h-5 text-purple-500" />
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        {growth && (
            <div className="flex items-center gap-1 text-sm text-green-500">
                <DynamicIcon name="TrendingUp" className="w-4 h-4" />
                <span>{growth}</span>
            </div>
        )}
    </motion.div>
))

const CourseCard = React.memo(({ 
    course, 
    onClick, 
    isArabic 
}: {
    course: any
    onClick: () => void
    isArabic: boolean
}) => (
    <div
        onClick={onClick}
        className="flex items-center gap-4 p-3 hover:bg-accent rounded-lg transition-colors cursor-pointer group"
    >
        <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-muted">
            <Image
                src={course.thumbnail || '/images/course-placeholder.svg'}
                alt={course.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/course-placeholder.svg';
                }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-purple-500 transition-colors">
                {course.title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <DynamicIcon name="Users" className="w-4 h-4" />
                    <span>{course.enrollments} {isArabic ? 'طالب' : 'students'}</span>
                </div>
                {course.rating > 0 && (
                    <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <DynamicIcon name="ThumbsUp" className="w-4 h-4" />
                            <span>{course.rating.toFixed(1)} ({course.reviews})</span>
                        </div>
                    </>
                )}
                <span>•</span>
                <span>{course.completionRate}% {isArabic ? 'معدل الإكمال' : 'completion'}</span>
            </div>
        </div>
        <DynamicIcon name="ChevronRight" className="w-5 h-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
    </div>
))

interface AnalyticsData {
    totalStudents: number
    totalEnrollments: number
    avgCompletionRate: number
    totalRevenue: number
    growth?: {
        students: number
        enrollments: number
        revenue: number
    }
    topCourses: {
        id: string
        title: string
        enrollments: number
        thumbnail: string
        publishedAt: string
        completionRate: number
        rating: number
        reviews: number
    }[]
    recentActivity: {
        type: string
        message: string
        time: string
    }[]
}

export default function CreatorDashboard() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    // Use optimized navigation for better performance
    const { navigateWithOptimization, prefetchRoute, isNavigating } = useOptimizedNavigation()

    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('dashboard')
    const [navigating, setNavigating] = useState(false)
    const [fetchAttempts, setFetchAttempts] = useState(0)

    // Prefetch important routes on component mount
    useEffect(() => {
        const routes = [
            `/${locale}/creator/courses`,
            `/${locale}/creator/analytics`,
            `/${locale}/creator/cohorts`,
            `/${locale}/creator/settings`,
            `/${locale}/creator/courses/create`
        ]
        
        // Prefetch after a short delay to not impact initial load
        const timer = setTimeout(() => {
            routes.forEach(route => prefetchRoute(route))
        }, 1000)

        return () => clearTimeout(timer)
    }, [locale, prefetchRoute])

    // Optimized navigation handlers
    const navigateToPage = useCallback(async (path: string) => {
        setNavigating(true)
        try {
            await navigateWithOptimization(path, `creator-nav-${path.split('/').pop()}`)
        } finally {
            setNavigating(false)
        }
    }, [navigateWithOptimization])

    // Cache analytics data for 5 minutes to prevent redundant API calls
    const cacheKey = `analytics_${session?.user?.id}_${locale}`
    const cacheTimeout = 5 * 60 * 1000 // 5 minutes
    const [lastFetchTime, setLastFetchTime] = useState<number>(0)

    // Optimized fetch function with caching and retry logic
    const fetchAnalytics = useCallback(async () => {
        if (!session?.user) return

        // Prevent multiple simultaneous calls
        const now = Date.now()
        if (now - lastFetchTime < 1000) { // Debounce within 1 second
            return
        }
        setLastFetchTime(now)

        // Check cache first
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached)
                if (Date.now() - timestamp < cacheTimeout) {
                    setAnalytics(data)
                    setLoading(false)
                    return
                }
            } catch (error) {
                // Clear invalid cache
                localStorage.removeItem(cacheKey)
            }
        }

        try {
            const response = await fetch('/api/creator/analytics?period=28', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            })
            
            if (response.ok) {
                const result = await response.json()
                if (result.success && result.data) {
                    // Transform the backend data to match our interface
                    const transformedData: AnalyticsData = {
                        totalStudents: result.data.overview.totalSubscribers || 0,
                        totalEnrollments: result.data.overview.totalEnrollments || 0,
                        avgCompletionRate: result.data.courses.completionRates?.length > 0
                            ? Math.round(
                                result.data.courses.completionRates.reduce(
                                    (sum: number, course: any) => sum + parseFloat(course.completionRate || 0), 
                                    0
                                ) / result.data.courses.completionRates.length
                              )
                            : 0,
                        totalRevenue: result.data.revenue.total || 0,
                        growth: {
                            students: result.data.growth?.subscriberGrowth || 0,
                            enrollments: result.data.growth?.enrollmentGrowth || 0,
                            revenue: result.data.growth?.revenueGrowth || 0
                        },
                        topCourses: result.data.courses.top.slice(0, 5).map((course: any) => {
                            const completionData = result.data.courses.completionRates?.find(
                                (c: any) => c.courseId === course.id
                            )
                            return {
                                id: course.id,
                                title: course.title,
                                enrollments: course.enrollments,
                                                                                thumbnail: course.thumbnail || '/images/course-placeholder.svg',
                                publishedAt: new Date().toLocaleDateString(),
                                completionRate: completionData ? parseFloat(completionData.completionRate) : 0,
                                rating: course.rating || 0,
                                reviews: course.reviews || 0
                            }
                        }),
                        recentActivity: [
                            ...result.data.activity.recentEnrollments.slice(0, 3).map((enrollment: any) => ({
                                type: 'enrollment',
                                message: `${enrollment.studentName} enrolled in ${enrollment.courseName}`,
                                time: new Date(enrollment.enrolledAt).toLocaleDateString()
                            })),
                            ...result.data.activity.recentReviews.slice(0, 2).map((review: any) => ({
                                type: 'review',
                                message: `New ${review.rating}⭐ review on ${review.courseName}`,
                                time: new Date(review.createdAt).toLocaleDateString()
                            }))
                        ]
                    }
                    
                    setAnalytics(transformedData)
                    
                    // Cache the result
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: transformedData,
                        timestamp: Date.now()
                    }))
                }
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
            
            // Retry logic for failed requests
            if (fetchAttempts < 2) {
                setFetchAttempts(prev => prev + 1)
                setTimeout(() => fetchAnalytics(), 2000) // Retry after 2 seconds
                return
            }
            
            toast.error(isArabic ? 'فشل تحميل البيانات' : 'Failed to load data')
        } finally {
            setLoading(false)
        }
    }, [session, cacheKey, cacheTimeout, isArabic, fetchAttempts, lastFetchTime])

    useEffect(() => {
        let mounted = true
        if (session?.user && mounted) {
            fetchAnalytics()
        }
        return () => {
            mounted = false
        }
    }, [session, fetchAnalytics])

    if (!session?.user) {
        router.push(`/${locale}/login`)
        return null
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background">
            {/* YouTube Studio Header - Standalone (No Main Navbar) */}
            <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        {/* Back and Home buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                title={isArabic ? 'رجوع' : 'Back'}
                            >
                                <DynamicIcon name="ArrowLeft" className="text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                                onClick={() => router.push(`/${locale}`)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                title={isArabic ? 'الصفحة الرئيسية' : 'Home'}
                            >
                                <DynamicIcon name="Home" className="text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>

                        <div className="h-8 w-px bg-slate-300 dark:bg-slate-600" />

                        <Link href={`/${locale}/creator/dashboard`} className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                <DynamicIcon name="Play" className="w-6 h-6 text-white fill-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                {isArabic ? 'استوديو المنشئ' : 'Creator Studio'}
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                            <Button
                                onClick={() => navigateToPage(`/${locale}/creator/courses/create`)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                disabled={navigating || isNavigating()}
                            >
                                <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                {isArabic ? 'إنشاء' : 'Create'}
                            </Button>                        {/* Student Messages - NEW */}
                        <button 
                            className="relative p-2 hover:bg-accent rounded-full transition-colors"
                            title={isArabic ? 'الرسائل' : 'Messages'}
                            onClick={() => toast(isArabic ? 'الرسائل قريباً' : 'Messaging coming soon')}
                        >
                            <DynamicIcon name="MessageSquare" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                        </button>
                        
                        <button className="p-2 hover:bg-accent rounded-full transition-colors">
                            <DynamicIcon name="Bell" />
                        </button>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold">
                                {session.user.name?.[0]?.toUpperCase() || 'C'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar - YouTube Studio Style */}
                <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 sticky top-16 shadow-sm">
                    <nav className="p-4 space-y-1">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            disabled={navigating || isNavigating()}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'dashboard'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-700/50'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                            } ${navigating || isNavigating() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <DynamicIcon name="BarChart3" className={activeTab === 'dashboard' ? 'text-purple-600 dark:text-purple-400' : ''} />
                            <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
                            {(navigating || isNavigating()) && activeTab === 'dashboard' && (
                                <DynamicIcon name="Loader2" className="w-4 h-4 animate-spin ml-auto text-purple-600 dark:text-purple-400" />
                            )}
                        </button>

                        <button
                            onClick={() => navigateToPage(`/${locale}/creator/courses`)}
                            disabled={navigating || isNavigating()}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'courses'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-700/50'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                            } ${navigating || isNavigating() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <DynamicIcon name="Video" className={activeTab === 'courses' ? 'text-purple-600 dark:text-purple-400' : ''} />
                            <span>{isArabic ? 'الدورات' : 'Courses'}</span>
                            {(navigating || isNavigating()) && (
                                <DynamicIcon name="Loader2" className="w-4 h-4 animate-spin ml-auto text-purple-600 dark:text-purple-400" />
                            )}
                        </button>

                        <button
                            onClick={() => navigateToPage(`/${locale}/creator/analytics`)}
                            disabled={navigating || isNavigating()}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'analytics'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-700/50'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                            } ${navigating || isNavigating() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <DynamicIcon name="TrendingUp" className={activeTab === 'analytics' ? 'text-purple-600 dark:text-purple-400' : ''} />
                            <span>{isArabic ? 'التحليلات' : 'Analytics'}</span>
                            {(navigating || isNavigating()) && (
                                <DynamicIcon name="Loader2" className="w-4 h-4 animate-spin ml-auto text-purple-600 dark:text-purple-400" />
                            )}
                        </button>

                        <button
                            onClick={() => navigateToPage(`/${locale}/creator/cohorts`)}
                            disabled={navigating || isNavigating()}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'cohorts'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-700/50'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                            } ${navigating || isNavigating() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <DynamicIcon name="Users" className={activeTab === 'cohorts' ? 'text-purple-600 dark:text-purple-400' : ''} />
                            <span>{isArabic ? 'المجموعات التعليمية' : 'Cohorts'}</span>
                            {(navigating || isNavigating()) && (
                                <DynamicIcon name="Loader2" className="w-4 h-4 animate-spin ml-auto text-purple-600 dark:text-purple-400" />
                            )}
                        </button>

                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />

                        <button
                            onClick={() => navigateToPage(`/${locale}/creator/settings`)}
                            disabled={navigating || isNavigating()}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-all"
                        >
                            <DynamicIcon name="Settings" />
                            <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
                            {(navigating || isNavigating()) && (
                                <DynamicIcon name="Loader2" className="w-4 h-4 animate-spin ml-auto text-slate-600 dark:text-slate-400" />
                            )}
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 bg-slate-50 dark:bg-background">
                    {/* Course Overview */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-foreground">
                                    {isArabic ? 'لوحة تحكم الدورات' : 'Course Dashboard'}
                                </h1>
                                <p className="text-slate-600 dark:text-muted-foreground">
                                    {session.user.name}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button 
                                    onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                    className="gap-2"
                                >
                                    <DynamicIcon name="Upload" className="w-4 h-4" />
                                    {isArabic ? 'إنشاء دورة' : 'Create Course'}
                                </Button>
                            </div>
                        </div>

                        {/* Quick Stats - Course Focused */}
                        <div className="grid md:grid-cols-4 gap-6">
                            {loading ? (
                                // Skeleton loading state
                                Array(4).fill(0).map((_, i) => (
                                    <StatCardSkeleton key={i} />
                                ))
                            ) : (
                                <>
                                    <StatCard
                                        title={isArabic ? 'إجمالي الطلاب' : 'Total Students'}
                                        value={analytics?.totalStudents || 0}
                                        icon="Users"
                                        growth={`+${analytics?.growth?.students || 0}% ${isArabic ? 'هذا الشهر' : 'this month'}`}
                                        isArabic={isArabic}
                                    />
                                    
                                    <StatCard
                                        title={isArabic ? 'التسجيلات' : 'Enrollments'}
                                        value={analytics?.totalEnrollments || 0}
                                        icon="Eye"
                                        isArabic={isArabic}
                                        className="[&>div:last-child]:text-muted-foreground [&>div:last-child]:text-sm"
                                    />
                                    
                                    <StatCard
                                        title={isArabic ? 'معدل الإكمال' : 'Avg Completion'}
                                        value={`${analytics?.avgCompletionRate || 0}%`}
                                        icon="Clock"
                                        isArabic={isArabic}
                                        className="[&>div:last-child]:text-muted-foreground [&>div:last-child]:text-sm"
                                    />
                                    
                                    <StatCard
                                        title={isArabic ? 'الأرباح' : 'Revenue'}
                                        value={`$${analytics?.totalRevenue || 0}`}
                                        icon="DollarSign"
                                        onClick={() => router.push(`/${locale}/creator/settings?tab=payout`)}
                                        isArabic={isArabic}
                                        className="group-hover:scale-105"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Earnings Breakdown - NEW */}
                    <div className="mb-8">
                        {loading ? (
                            <CardSkeleton />
                        ) : (
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                            <DynamicIcon name="DollarSign" className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">
                                                {isArabic ? 'ملخص الأرباح' : 'Earnings Summary'}
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'آخر 28 يوم' : 'Last 28 days'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => router.push(`/${locale}/creator/settings?tab=payout`)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <DynamicIcon name="Settings" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'إعدادات الدفع' : 'Payout Settings'}
                                    </Button>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4 mb-6">
                                    {/* Category A - All Access */}
                                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DynamicIcon name="Video" className="w-4 h-4 text-purple-500" />
                                            <span className="text-sm font-semibold text-purple-400">
                                                {isArabic ? 'الفئة أ - الوصول الشامل' : 'Category A - All Access'}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold mb-1">
                                            ${Math.round((analytics?.totalRevenue || 0) * 0.7)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {isArabic ? 'من دورات المكتبة' : 'From library courses'}
                                        </div>
                                    </div>

                                    {/* Category B - Signature */}
                                    <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DynamicIcon name="Sparkles" className="w-4 h-4 text-pink-500" />
                                            <span className="text-sm font-semibold text-pink-400">
                                                {isArabic ? 'الفئة ب - المميز' : 'Category B - Signature'}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold mb-1">
                                            ${Math.round((analytics?.totalRevenue || 0) * 0.3)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {isArabic ? 'من الدورات المميزة' : 'From premium courses'}
                                        </div>
                                    </div>

                                    {/* Next Payout */}
                                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DynamicIcon name="Calendar" className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-semibold text-green-400">
                                                {isArabic ? 'الدفعة القادمة' : 'Next Payout'}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold mb-1">
                                            ${analytics?.totalRevenue || 0}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {isArabic ? 'متوقعة في 15 نوفمبر' : 'Expected Nov 15'}
                                        </div>
                                    </div>
                                </div>

                                {/* Earnings Chart Placeholder */}
                                <div className="relative h-32 bg-accent/30 rounded-lg border border-border overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <DynamicIcon name="BarChart3" className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'مخطط الأرباح قريباً' : 'Earnings chart coming soon'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Channel Analytics */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Performance Overview */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        {isArabic ? 'نظرة عامة على الأداء' : 'Performance Overview'}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {isArabic ? 'آخر 28 يوم' : 'Last 28 days'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DynamicIcon name="Eye" className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm font-semibold text-blue-400">
                                                {isArabic ? 'مشاهدات' : 'Views'}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold mb-1">
                                            {analytics?.totalEnrollments || 0}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-green-500">
                                            <DynamicIcon name="TrendingUp" className="w-3 h-3" />
                                            <span>+{analytics?.growth?.enrollments || 0}%</span>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DynamicIcon name="Clock" className="w-4 h-4 text-purple-500" />
                                            <span className="text-sm font-semibold text-purple-400">
                                                {isArabic ? 'وقت المشاهدة' : 'Watch time'}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold mb-1">
                                            {Math.round((analytics?.avgCompletionRate || 0) * 2.5)}h
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {isArabic ? 'تقديري' : 'Estimated'}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <DynamicIcon name="DollarSign" className="w-4 h-4 text-green-500" />
                                            <span className="text-sm font-semibold text-green-400">
                                                {isArabic ? 'الأرباح' : 'Revenue'}
                                            </span>
                                        </div>
                                        <div className="text-2xl font-bold mb-1">
                                            ${analytics?.totalRevenue || 0}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-green-500">
                                            <DynamicIcon name="TrendingUp" className="w-3 h-3" />
                                            <span>+{analytics?.growth?.revenue || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Prompt */}
                            <div className="bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 border border-purple-500/30 rounded-xl p-8 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 animate-pulse" />
                                <div className="relative z-10">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200 }}
                                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full mb-4"
                                    >
                                        <DynamicIcon name="Video" className="w-10 h-10 text-purple-400" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        {isArabic 
                                            ? 'هل تريد رؤية مقاييس على دوراتك الحديثة؟'
                                            : 'Want to see metrics on your recent courses?'}
                                    </h3>
                                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                        {isArabic 
                                            ? 'قم بإنشاء ونشر دورة للبدء في تتبع الأداء والتفاعل.'
                                            : 'Create and publish a course to start tracking performance and engagement.'}
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <Button
                                            onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
                                        >
                                            <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                            {isArabic ? 'إنشاء دورة' : 'Create course'}
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/${locale}/creator/courses`)}
                                            variant="outline"
                                            className="border-purple-500/30 hover:bg-purple-500/10"
                                        >
                                            {isArabic ? 'عرض الدورات' : 'View courses'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Top Courses */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        {isArabic ? 'أفضل الدورات' : 'Top courses'}
                                    </h2>
                                    <button 
                                        onClick={() => router.push(`/${locale}/creator/courses`)}
                                        className="text-sm text-purple-500 hover:text-purple-400 flex items-center gap-1"
                                    >
                                        {isArabic ? 'عرض الكل' : 'View all'}
                                        <DynamicIcon name="ChevronRight" className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <CourseRowSkeleton key={i} />
                                        ))
                                    ) : analytics?.topCourses && analytics.topCourses.length > 0 ? (
                                        analytics.topCourses.map((course) => (
                                            <CourseCard
                                                key={course.id}
                                                course={course}
                                                onClick={() => router.push(`/${locale}/creator/courses/${course.id}/edit`)}
                                                isArabic={isArabic}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-full mb-4">
                                                <DynamicIcon name="Video" className="w-8 h-8 text-purple-500" />
                                            </div>
                                            <p className="text-muted-foreground mb-4">
                                                {isArabic ? 'لا توجد دورات بعد' : 'No courses yet'}
                                            </p>
                                            <Button
                                                onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                                            >
                                                <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                                {isArabic ? 'إنشاء دورة' : 'Create Course'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Issues & Updates */}
                        <div className="space-y-6">
                            {/* Recent Activity */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <DynamicIcon name="Bell" className="w-5 h-5 text-purple-500" />
                                    <h2 className="text-lg font-bold">
                                        {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {loading ? (
                                        Array(3).fill(0).map((_, i) => (
                                            <ActivitySkeleton key={i} />
                                        ))
                                    ) : analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                                        analytics.recentActivity.slice(0, 5).map((activity, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 hover:bg-accent rounded-lg transition-colors">
                                                <div className={`w-2 h-2 rounded-full mt-2 ${
                                                    activity.type === 'enrollment' ? 'bg-blue-500' : 'bg-yellow-500'
                                                }`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm mb-1 line-clamp-2">
                                                        {activity.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-sm text-muted-foreground">
                                            {isArabic ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                                        </div>
                                    )}
                                </div>
                                {analytics?.recentActivity && analytics.recentActivity.length > 5 && (
                                    <button className="w-full mt-4 text-sm text-purple-500 hover:text-purple-400 text-center py-2">
                                        {isArabic ? 'عرض المزيد' : 'View more'}
                                    </button>
                                )}
                            </div>

                            {/* Upcoming Events - NEW */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name="Calendar" className="w-5 h-5 text-purple-500" />
                                        <h2 className="text-lg font-bold">
                                            {isArabic ? 'الفعاليات القادمة' : 'Upcoming Events'}
                                        </h2>
                                    </div>
                                    <Badge variant="outline" className="text-xs bg-purple-500/10">
                                        {isArabic ? 'قريباً' : 'Soon'}
                                    </Badge>
                                </div>
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-full mb-3">
                                        <DynamicIcon name="Play" className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {isArabic 
                                            ? 'جدول الفعاليات والبث المباشر سيكون متاحاً قريباً'
                                            : 'Event scheduling and live streaming coming soon'}
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled
                                        className="opacity-50"
                                    >
                                        <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'جدولة فعالية' : 'Schedule Event'}
                                    </Button>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-lg font-bold mb-4">
                                    {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
                                </h2>
                                <div className="space-y-2">
                                    <Button
                                        onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                        className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    >
                                        <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'إنشاء دورة جديدة' : 'Create new course'}
                                    </Button>
                                    <Button
                                        onClick={() => router.push(`/${locale}/creator/analytics`)}
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        <DynamicIcon name="TrendingUp" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'عرض التحليلات' : 'View analytics'}
                                    </Button>
                                    <Button
                                        onClick={() => router.push(`/${locale}/creator/settings`)}
                                        variant="outline"
                                        className="w-full justify-start"
                                    >
                                        <DynamicIcon name="Settings" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'إدارة الإعدادات' : 'Manage settings'}
                                    </Button>
                                </div>
                            </div>

                            {/* Known Issues */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <DynamicIcon name="AlertCircle" className="w-5 h-5 text-amber-500" />
                                    <h2 className="text-lg font-bold">
                                        {isArabic ? 'تنبيهات' : 'Notices'}
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <DynamicIcon name="Sparkles" className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 text-sm">
                                            <p className="font-semibold mb-1 text-blue-400">
                                                {isArabic ? 'ميزات جديدة متاحة' : 'New Features Available'}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {isArabic 
                                                    ? 'تحقق من أدوات التحليل المحدثة'
                                                    : 'Check out our updated analytics tools'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Creator Insider */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold">
                                        {isArabic ? 'أخبار المنشئين' : 'Creator Insider'}
                                    </h2>
                                    <span className="text-sm text-muted-foreground">1 / 4</span>
                                </div>

                                <div className="relative rounded-xl overflow-hidden mb-4 aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <DynamicIcon name="Sparkles" className="w-16 h-16 text-purple-400" />
                                    </div>
                                </div>

                                <h3 className="font-bold mb-2">
                                    {isArabic ? 'ميزات جديدة قادمة' : 'New Features Coming Soon'}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {isArabic 
                                        ? 'تعرف على الميزات الجديدة المثيرة القادمة إلى المنصة'
                                        : 'Learn about exciting new features coming to the platform'}
                                </p>
                                <Button variant="outline" className="w-full">
                                    {isArabic ? 'شاهد على المنصة' : 'Watch on Platform'}
                                </Button>
                            </div>

                            {/* What's New */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-lg font-bold mb-4">
                                    {isArabic ? 'ما الجديد في الاستوديو' : "What's new in Studio"}
                                </h2>
                                <div className="space-y-4">
                                    <div className="border-b border-border pb-3">
                                        <h3 className="font-semibold mb-1">
                                            {isArabic ? 'زيادة طول الفيديوهات القصيرة' : 'Increasing Shorts length'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic 
                                                ? 'يمكنك الآن رفع فيديوهات أطول'
                                                : 'You can now upload longer videos'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">
                                            {isArabic ? 'توسيع صلاحيات القناة' : 'Expansion of channel permissions'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic 
                                                ? 'تحكم أفضل في صلاحيات الفريق'
                                                : 'Better control over team permissions'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
