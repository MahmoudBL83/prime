'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { 
    Upload,
    Video,
    BarChart3,
    Users,
    Settings,
    DollarSign,
    TrendingUp,
    Eye,
    Clock,
    ThumbsUp,
    Sparkles,
    Play,
    AlertCircle,
    ChevronRight,
    BookOpen,
    Award,
    Target,
    ArrowLeft,
    Home,
    Bell,
    Loader2
} from 'lucide-react'

// Apple-style stat card
const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend
}: {
    title: string
    value: string | number
    icon: any
    trend?: { value: string; positive: boolean }
}) => (
    <div className="bg-white dark:bg-black border border-border dark:border-white/10 rounded-xl p-6 hover:border-[#0a84ff] dark:hover:border-[#0a84ff] transition-all">
        <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground dark:text-white/60">{title}</span>
            <Icon className="w-5 h-5 text-[#0a84ff]" />
        </div>
        <div className="text-3xl font-semibold mb-2 text-foreground dark:text-white">{value}</div>
        {trend && (
            <div className={`text-sm ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.value}
            </div>
        )}
    </div>
)

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

    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [navigating, setNavigating] = useState(false)

    // Fetch analytics data
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await fetch('/api/creator/analytics?period=28')
                if (response.ok) {
                    const result = await response.json()
                    if (result.success && result.data) {
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
                    }
                }
            } catch (error) {
                console.error('Failed to fetch analytics:', error)
            } finally {
                setLoading(false)
            }
        }

        if (session?.user) {
            fetchAnalytics()
        }
    }, [session])

    if (!session?.user) {
        router.push(`/${locale}/login`)
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <h1 className="text-xl font-bold">
                            {isArabic ? 'استوديو المنشئ' : 'Creator Studio'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-accent rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
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
                {/* Sidebar */}
                <aside className="w-64 min-h-screen bg-card border-r border-border sticky top-16">
                    <nav className="p-4 space-y-1">
                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-accent text-foreground font-semibold"
                        >
                            <BarChart3 className="w-5 h-5" />
                            <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/courses`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
                        >
                            <Video className="w-5 h-5" />
                            <span>{isArabic ? 'الدورات' : 'Courses'}</span>
                            {navigating && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/analytics`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
                        >
                            <TrendingUp className="w-5 h-5" />
                            <span>{isArabic ? 'التحليلات' : 'Analytics'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/cohorts`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
                        >
                            <Users className="w-5 h-5" />
                            <span>{isArabic ? 'المجموعات التعليمية' : 'Cohorts'}</span>
                        </button>

                        <div className="h-px bg-border my-4" />

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/settings`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent/50 transition-all"
                        >
                            <Settings className="w-5 h-5" />
                            <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Application Status Banner */}
                        {session?.user?.applicationStatus && session.user.applicationStatus !== 'APPROVED' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-8 rounded-2xl border p-6 ${
                            session.user.applicationStatus === 'PENDING' 
                                ? 'bg-blue-500/10 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/10' 
                                : session.user.applicationStatus === 'UNDER_REVIEW'
                                ? 'bg-yellow-500/10 border-yellow-500/20 dark:bg-yellow-500/5 dark:border-yellow-500/10'
                                : session.user.applicationStatus === 'REJECTED'
                                ? 'bg-red-500/10 border-red-500/20 dark:bg-red-500/5 dark:border-red-500/10'
                                : 'bg-orange-500/10 border-orange-500/20 dark:bg-orange-500/5 dark:border-orange-500/10'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${
                                session.user.applicationStatus === 'PENDING'
                                    ? 'bg-blue-500/20 dark:bg-blue-500/10'
                                    : session.user.applicationStatus === 'UNDER_REVIEW'
                                    ? 'bg-yellow-500/20 dark:bg-yellow-500/10'
                                    : session.user.applicationStatus === 'REJECTED'
                                    ? 'bg-red-500/20 dark:bg-red-500/10'
                                    : 'bg-orange-500/20 dark:bg-orange-500/10'
                            }`}>
                                <AlertCircle className={`w-5 h-5 ${
                                    session.user.applicationStatus === 'PENDING'
                                        ? 'text-blue-500'
                                        : session.user.applicationStatus === 'UNDER_REVIEW'
                                        ? 'text-yellow-500'
                                        : session.user.applicationStatus === 'REJECTED'
                                        ? 'text-red-500'
                                        : 'text-orange-500'
                                }`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold mb-1 text-foreground dark:text-white">
                                    {session.user.applicationStatus === 'PENDING' && 'Application Pending'}
                                    {session.user.applicationStatus === 'UNDER_REVIEW' && 'Under Review'}
                                    {session.user.applicationStatus === 'REJECTED' && 'Application Rejected'}
                                    {session.user.applicationStatus === 'RESUBMIT_REQUIRED' && 'Resubmission Required'}
                                </h3>
                                <p className="text-sm text-muted-foreground dark:text-white/60 mb-3">
                                    {session.user.applicationStatus === 'PENDING' && 'Your application is being reviewed by our team.'}
                                    {session.user.applicationStatus === 'UNDER_REVIEW' && 'We\'ll contact you within 24-48 hours.'}
                                    {session.user.applicationStatus === 'REJECTED' && 'Please review the feedback and reapply.'}
                                    {session.user.applicationStatus === 'RESUBMIT_REQUIRED' && 'Please update your application based on feedback.'}
                                </p>
                                <Button
                                    onClick={() => router.push(`/${locale}/creator/apply`)}
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                >
                                    View Application
                                </Button>
                            </div>
                        </div>
                        </motion.div>
                        )}

                        {/* Welcome Section */}
                        <div className="mb-12">
                            <h2 className="text-4xl font-bold mb-2 text-foreground dark:text-white">
                                Welcome back, {session.user.name}
                            </h2>
                            <p className="text-lg text-muted-foreground dark:text-white/60">
                                Here's what's happening with your courses
                            </p>
                        </div>

                        {/* Stats Grid - Apple Style */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            <StatCard
                                title="Total Students"
                                value={loading ? '...' : analytics?.totalStudents || 0}
                                icon={Users}
                                trend={!loading && analytics?.growth ? { 
                                    value: `+${analytics.growth.students}%`, 
                                    positive: analytics.growth.students > 0 
                                } : undefined}
                            />
                            <StatCard
                                title="Enrollments"
                                value={loading ? '...' : analytics?.totalEnrollments || 0}
                                icon={Eye}
                                trend={!loading && analytics?.growth ? { 
                                    value: `+${analytics.growth.enrollments}%`, 
                                    positive: analytics.growth.enrollments > 0 
                                } : undefined}
                            />
                            <StatCard
                                title="Completion Rate"
                                value={loading ? '...' : `${analytics?.avgCompletionRate || 0}%`}
                                icon={Target}
                            />
                            <StatCard
                                title="Revenue"
                                value={loading ? '...' : `$${analytics?.totalRevenue || 0}`}
                                icon={DollarSign}
                                trend={!loading && analytics?.growth ? { 
                                    value: `+${analytics.growth.revenue}%`, 
                                    positive: analytics.growth.revenue > 0 
                                } : undefined}
                            />
                        </div>

                        {/* Content Grid */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Top Courses */}
                            <div className="lg:col-span-2">
                                <div className="bg-white dark:bg-black border border-border dark:border-white/10 rounded-2xl p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-semibold text-foreground dark:text-white">Top Courses</h3>
                                        <button 
                                            onClick={() => router.push(`/${locale}/creator/courses`)}
                                            className="text-sm text-[#0a84ff] hover:underline"
                                        >
                                            View all
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="h-20 bg-muted dark:bg-white/5 rounded-xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : analytics?.topCourses && analytics.topCourses.length > 0 ? (
                                        <div className="space-y-4">
                                            {analytics.topCourses.map((course) => (
                                                <div
                                                    key={course.id}
                                                    onClick={() => router.push(`/${locale}/creator/courses/${course.id}/edit`)}
                                                    className="flex items-center gap-4 p-4 hover:bg-muted dark:hover:bg-white/5 rounded-xl transition-all cursor-pointer group"
                                                >
                                                    <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-muted dark:bg-white/5 flex-shrink-0">
                                                        <Image
                                                            src={course.thumbnail}
                                                            alt={course.title}
                                                            fill
                                                            className="object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = '/images/course-placeholder.svg';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium mb-1 line-clamp-1 text-foreground dark:text-white group-hover:text-[#0a84ff]">
                                                            {course.title}
                                                        </h4>
                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-white/60">
                                                            <span>{course.enrollments} students</span>
                                                            <span>•</span>
                                                            <span>{course.completionRate}% completion</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground dark:text-white/40 group-hover:text-[#0a84ff]" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground dark:text-white/30" />
                                            <p className="text-muted-foreground dark:text-white/60 mb-4">No courses yet</p>
                                            <Button
                                                onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                                className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white rounded-full"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Create Course
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions & Activity */}
                            <div className="space-y-6">
                                {/* Quick Actions */}
                                <div className="bg-white dark:bg-black border border-border dark:border-white/10 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-white">Quick Actions</h3>
                                    <div className="space-y-2">
                                        <Button
                                            onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                            className="w-full justify-start bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Create Course
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/${locale}/creator/analytics`)}
                                            variant="outline"
                                            className="w-full justify-start"
                                        >
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            View Analytics
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/${locale}/creator/cohorts`)}
                                            variant="outline"
                                            className="w-full justify-start"
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            Manage Cohorts
                                        </Button>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white dark:bg-black border border-border dark:border-white/10 rounded-2xl p-6">
                                    <h3 className="text-lg font-semibold mb-4 text-foreground dark:text-white">Recent Activity</h3>
                                    {loading ? (
                                        <div className="space-y-3">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="h-12 bg-muted dark:bg-white/5 rounded-lg animate-pulse" />
                                            ))}
                                        </div>
                                    ) : analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                                        <div className="space-y-3">
                                            {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 hover:bg-muted dark:hover:bg-white/5 rounded-lg transition-colors">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${
                                                        activity.type === 'enrollment' ? 'bg-[#0a84ff]' : 'bg-yellow-500'
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm mb-1 line-clamp-2 text-foreground dark:text-white">
                                                            {activity.message}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground dark:text-white/50">
                                                            {activity.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground dark:text-white/60 text-center py-6">
                                            No recent activity
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

