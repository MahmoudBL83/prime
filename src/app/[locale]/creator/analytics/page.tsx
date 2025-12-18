'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    BarChart3,
    Video,
    TrendingUp,
    TrendingDown,
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
import { CreatorSidebar, CreatorHeader } from '@/components/creator'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Legend
} from 'recharts'

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

// Generate chart data based on period - uses real totals without fake daily distribution
function generateChartData(days: number, totalEnrollments: number, totalRevenue: number) {
    const enrollments: Array<{ date: string; value: number }> = []
    const revenue: Array<{ date: string; value: number }> = []
    
    const today = new Date()
    
    // Show real data as a single point or empty if no historical data available
    // For production, this should be replaced with actual historical data from the API
    if (totalEnrollments > 0 || totalRevenue > 0) {
        // Show only today's total as we don't have historical breakdown
        const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        enrollments.push({
            date: dateStr,
            value: totalEnrollments
        })
        revenue.push({
            date: dateStr,
            value: totalRevenue
        })
    }
    
    return { enrollments, revenue }
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
                        chartData: generateChartData(period, result.data.overview.totalEnrollments || 0, result.data.revenue.total || 0)
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
            <CreatorHeader />

            <div className="flex">
                {/* Sidebar */}
                <CreatorSidebar />

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

                                {/* Charts Section */}
                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    {/* Enrollments Chart */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-card border border-border rounded-xl p-6"
                                    >
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-purple-500" />
                                            {isArabic ? 'التسجيلات' : 'Enrollments'}
                                        </h3>
                                        <div className="h-64">
                                            {analytics?.chartData?.enrollments && analytics.chartData.enrollments.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={analytics.chartData.enrollments}>
                                                        <defs>
                                                            <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            stroke="#6b7280" 
                                                            fontSize={12}
                                                            tickLine={false}
                                                        />
                                                        <YAxis 
                                                            stroke="#6b7280" 
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                backgroundColor: 'hsl(var(--card))', 
                                                                border: '1px solid hsl(var(--border))',
                                                                borderRadius: '8px'
                                                            }}
                                                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="value" 
                                                            stroke="#8b5cf6" 
                                                            strokeWidth={2}
                                                            fill="url(#enrollmentGradient)"
                                                            name={isArabic ? 'التسجيلات' : 'Enrollments'}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                                    {isArabic ? 'لا توجد بيانات' : 'No data available'}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Revenue Chart */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-card border border-border rounded-xl p-6"
                                    >
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-green-500" />
                                            {isArabic ? 'الإيرادات' : 'Revenue'}
                                        </h3>
                                        <div className="h-64">
                                            {analytics?.chartData?.revenue && analytics.chartData.revenue.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={analytics.chartData.revenue}>
                                                        <defs>
                                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            stroke="#6b7280" 
                                                            fontSize={12}
                                                            tickLine={false}
                                                        />
                                                        <YAxis 
                                                            stroke="#6b7280" 
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{ 
                                                                backgroundColor: 'hsl(var(--card))', 
                                                                border: '1px solid hsl(var(--border))',
                                                                borderRadius: '8px'
                                                            }}
                                                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                                                            formatter={(value: number) => [`$${value}`, isArabic ? 'الإيرادات' : 'Revenue']}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey="value" 
                                                            stroke="#22c55e" 
                                                            strokeWidth={2}
                                                            fill="url(#revenueGradient)"
                                                            name={isArabic ? 'الإيرادات' : 'Revenue'}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                                    {isArabic ? 'لا توجد بيانات' : 'No data available'}
                                                </div>
                                            )}
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
