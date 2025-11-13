'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Home,
    Bell,
    BarChart3,
    Video,
    TrendingUp,
    TrendingDown,
    Settings,
    Loader2,
    Users,
    Eye,
    Clock,
    DollarSign,
    Calendar,
    Download,
    ChevronDown,
    Star,
    ThumbsUp,
    MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface AnalyticsData {
    overview: {
        totalEnrollments: number
        enrollmentsChange: number
        totalStudents: number
        studentsChange: number
        avgCompletionRate: number
        completionChange: number
        totalRevenue: number
        revenueChange: number
    }
    topCourses: Array<{
        id: string
        title: string
        thumbnail: string | null
        enrollments: number
        avgRating: number
        completionRate: number
        revenue: number
    }>
    chartData: {
        enrollments: Array<{ date: string; value: number }>
        revenue: Array<{ date: string; value: number }>
    }
}

export default function CreatorAnalytics() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState(28)
    const [navigating, setNavigating] = useState(false)

    useEffect(() => {
        if (session?.user) {
            fetchAnalytics()
        }
    }, [session, period])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/creator/analytics?period=${period}`)
            if (response.ok) {
                const result = await response.json()
                if (result.success && result.data) {
                    // Transform data
                    const transformedData: AnalyticsData = {
                        overview: {
                            totalEnrollments: result.data.overview.totalEnrollments || 0,
                            enrollmentsChange: result.data.growth?.enrollmentGrowth || 0,
                            totalStudents: result.data.overview.totalSubscribers || 0,
                            studentsChange: result.data.growth?.subscriberGrowth || 0,
                            avgCompletionRate: result.data.courses.averageCompletionRate || 0,
                            completionChange: result.data.growth?.completionGrowth || 0,
                            totalRevenue: result.data.revenue.total || 0,
                            revenueChange: result.data.growth?.revenueGrowth || 0
                        },
                        topCourses: result.data.courses.top.slice(0, 10).map((course: any) => ({
                            id: course.id,
                            title: course.title,
                            thumbnail: course.thumbnail,
                            enrollments: course.enrollments,
                            avgRating: course.avgRating || 0,
                            completionRate: course.completionRate || 0,
                            revenue: course.revenue || 0
                        })),
                        chartData: {
                            enrollments: [],
                            revenue: []
                        }
                    }
                    setAnalytics(transformedData)
                }
            } else {
                toast.error(isArabic ? 'فشل تحميل البيانات' : 'Failed to load data')
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
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
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/dashboard`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
                        >
                            <BarChart3 className="w-5 h-5" />
                            <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
                            {navigating && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
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
                        </button>

                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-accent text-foreground font-semibold"
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
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">
                                    {isArabic ? 'تحليلات القناة' : 'Channel analytics'}
                                </h1>
                                <p className="text-muted-foreground">
                                    {isArabic ? 'البيانات الحالية' : 'Current data'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Period Selector */}
                                <div className="relative">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {period === 7 && (isArabic ? 'آخر 7 أيام' : 'Last 7 days')}
                                            {period === 28 && (isArabic ? 'آخر 28 يوم' : 'Last 28 days')}
                                            {period === 90 && (isArabic ? 'آخر 90 يوم' : 'Last 90 days')}
                                        </span>
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>
                                <Button variant="outline" size="icon">
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : (
                            <>
                                {/* Key Metrics */}
                                <div className="grid md:grid-cols-4 gap-6 mb-8">
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-card border border-border rounded-xl p-6"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                {isArabic ? 'إجمالي التسجيلات' : 'Total enrollments'}
                                            </span>
                                            <Eye className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="text-3xl font-bold mb-1">
                                            {analytics?.overview.totalEnrollments || 0}
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm ${
                                            (analytics?.overview.enrollmentsChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {(analytics?.overview.enrollmentsChange || 0) >= 0 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                            <span>
                                                {Math.abs(analytics?.overview.enrollmentsChange || 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-card border border-border rounded-xl p-6"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                {isArabic ? 'إجمالي الطلاب' : 'Total students'}
                                            </span>
                                            <Users className="w-5 h-5 text-purple-500" />
                                        </div>
                                        <div className="text-3xl font-bold mb-1">
                                            {analytics?.overview.totalStudents || 0}
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm ${
                                            (analytics?.overview.studentsChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {(analytics?.overview.studentsChange || 0) >= 0 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                            <span>
                                                {Math.abs(analytics?.overview.studentsChange || 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-card border border-border rounded-xl p-6"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                {isArabic ? 'معدل الإكمال' : 'Completion rate'}
                                            </span>
                                            <Clock className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div className="text-3xl font-bold mb-1">
                                            {analytics?.overview.avgCompletionRate || 0}%
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm ${
                                            (analytics?.overview.completionChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {(analytics?.overview.completionChange || 0) >= 0 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                            <span>
                                                {Math.abs(analytics?.overview.completionChange || 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className="bg-card border border-border rounded-xl p-6"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                {isArabic ? 'إجمالي الإيرادات' : 'Total revenue'}
                                            </span>
                                            <DollarSign className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="text-3xl font-bold mb-1">
                                            ${analytics?.overview.totalRevenue || 0}
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm ${
                                            (analytics?.overview.revenueChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                            {(analytics?.overview.revenueChange || 0) >= 0 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                            <span>
                                                {Math.abs(analytics?.overview.revenueChange || 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Top Performing Courses */}
                                <div className="bg-card border border-border rounded-xl p-6 mb-8">
                                    <h2 className="text-xl font-bold mb-6">
                                        {isArabic ? 'أفضل الدورات أداءً' : 'Top performing courses'}
                                    </h2>

                                    {!analytics?.topCourses || analytics.topCourses.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Video className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                            <p className="text-muted-foreground">
                                                {isArabic ? 'لا توجد دورات بعد' : 'No courses yet'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        <th className="text-left p-3 font-semibold text-sm text-muted-foreground">
                                                            {isArabic ? 'الدورة' : 'Course'}
                                                        </th>
                                                        <th className="text-left p-3 font-semibold text-sm text-muted-foreground">
                                                            {isArabic ? 'التسجيلات' : 'Enrollments'}
                                                        </th>
                                                        <th className="text-left p-3 font-semibold text-sm text-muted-foreground">
                                                            {isArabic ? 'التقييم' : 'Rating'}
                                                        </th>
                                                        <th className="text-left p-3 font-semibold text-sm text-muted-foreground">
                                                            {isArabic ? 'معدل الإكمال' : 'Completion'}
                                                        </th>
                                                        <th className="text-left p-3 font-semibold text-sm text-muted-foreground">
                                                            {isArabic ? 'الإيرادات' : 'Revenue'}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analytics?.topCourses.map((course) => (
                                                        <tr
                                                            key={course.id}
                                                            className="border-b border-border hover:bg-accent/50 transition-colors"
                                                        >
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="relative w-16 h-10 rounded overflow-hidden bg-muted">
                                                                        {course.thumbnail ? (
                                                                            <Image
                                                                                src={course.thumbnail}
                                                                                alt={course.title}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center">
                                                                                <Video className="w-5 h-5 text-muted-foreground" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <span className="font-medium line-clamp-1">
                                                                        {course.title}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Users className="w-4 h-4 text-muted-foreground" />
                                                                    <span>{course.enrollments}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                                    <span>{course.avgRating.toFixed(1)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                                                                        <div
                                                                            className="bg-green-500 h-2 rounded-full"
                                                                            style={{ width: `${course.completionRate}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-sm">{course.completionRate}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <DollarSign className="w-4 h-4 text-green-500" />
                                                                    <span className="font-semibold">${course.revenue}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Realtime Activity */}
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <h2 className="text-xl font-bold mb-6">
                                        {isArabic ? 'النشاط الفوري' : 'Realtime activity'}
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <Eye className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">
                                                        {isArabic ? 'المشاهدات النشطة' : 'Active viewers'}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isArabic ? 'الآن' : 'Right now'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-2xl font-bold">--</span>
                                        </div>

                                        <div className="text-center py-8 text-muted-foreground">
                                            <p className="text-sm">
                                                {isArabic 
                                                    ? 'لا يوجد نشاط فوري حالياً'
                                                    : 'No realtime activity right now'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
