'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Users,
    DollarSign,
    Award,
    TrendingUp,
    Eye,
    Star,
    RefreshCw,
    ArrowLeft
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import AnalyticsCard from '@/components/creator/AnalyticsCard'
import RevenueChart from '@/components/creator/RevenueChart'
import CoursePerformanceTable from '@/components/creator/CoursePerformanceTable'

interface OverviewData {
    overview: {
        totalCourses: number
        totalStudents: number
        totalRevenue: number
        totalCompletions: number
        averageRating: number
        totalViews: number
        averageCompletionRate: number
    }
    trends: {
        enrollments: {
            current: number
            previous: number
            trend: number
        }
        completions: {
            current: number
            previous: number
            trend: number
        }
    }
}

interface RevenueData {
    summary: {
        totalRevenue: number
        totalEnrollments: number
        trends: {
            revenue: number
            enrollments: number
        }
    }
    chartData: Array<{
        period: string
        revenue: number
        enrollments: number
    }>
}

export default function CreatorAnalyticsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
    const [coursesData, setCoursesData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [revenuePeriod, setRevenuePeriod] = useState<'30d' | '90d' | '1y' | 'all'>('30d')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
            return
        }

        if (status === 'authenticated') {
            fetchAllData()
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated' && overviewData) {
            fetchRevenueData(revenuePeriod)
        }
    }, [revenuePeriod])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                fetchOverview(),
                fetchRevenueData(revenuePeriod),
                fetchCourses()
            ])
        } catch (error) {
            toast.error('Failed to load analytics data')
        } finally {
            setLoading(false)
        }
    }

    const fetchOverview = async () => {
        try {
            const response = await fetch('/api/creator/analytics/overview')
            if (response.ok) {
                const data = await response.json()
                setOverviewData(data)
            }
        } catch (error) {
            console.error('Error fetching overview:', error)
        }
    }

    const fetchRevenueData = async (period: string) => {
        try {
            const response = await fetch(`/api/creator/analytics/revenue?period=${period}`)
            if (response.ok) {
                const data = await response.json()
                setRevenueData(data)
            }
        } catch (error) {
            console.error('Error fetching revenue data:', error)
        }
    }

    const fetchCourses = async () => {
        try {
            const response = await fetch('/api/creator/analytics/courses')
            if (response.ok) {
                const data = await response.json()
                setCoursesData(data.courses)
            }
        } catch (error) {
            console.error('Error fetching courses:', error)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchAllData()
        setRefreshing(false)
        toast.success('Analytics refreshed!')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push('/creator/dashboard')}
                                className="p-2 hover:bg-card rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Advanced Analytics
                                </h1>
                                <p className="text-muted-foreground">
                                    Deep dive into your performance metrics
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center space-x-2 px-4 py-2 bg-card hover:bg-gray-700 text-foreground rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <AnalyticsCard
                        title="Total Students"
                        value={overviewData?.overview.totalStudents || 0}
                        trend={overviewData?.trends.enrollments.trend}
                        icon={Users}
                        iconColor="text-blue-500"
                        iconBgColor="bg-blue-500/10"
                    />
                    <AnalyticsCard
                        title="Total Revenue"
                        value={formatCurrency(overviewData?.overview.totalRevenue || 0)}
                        trend={revenueData?.summary.trends.revenue}
                        icon={DollarSign}
                        iconColor="text-green-500"
                        iconBgColor="bg-green-500/10"
                    />
                    <AnalyticsCard
                        title="Course Completions"
                        value={overviewData?.overview.totalCompletions || 0}
                        trend={overviewData?.trends.completions.trend}
                        icon={Award}
                        iconColor="text-purple-500"
                        iconBgColor="bg-purple-500/10"
                    />
                    <AnalyticsCard
                        title="Average Rating"
                        value={overviewData?.overview.averageRating.toFixed(1) || '0.0'}
                        subtitle={`${overviewData?.overview.totalCourses || 0} courses`}
                        icon={Star}
                        iconColor="text-yellow-500"
                        iconBgColor="bg-yellow-500/10"
                    />
                </div>

                {/* Revenue Chart */}
                <RevenueChart
                    data={revenueData?.chartData || []}
                    period={revenuePeriod}
                    onPeriodChange={setRevenuePeriod}
                    totalRevenue={revenueData?.summary.totalRevenue || 0}
                    trend={revenueData?.summary.trends.revenue || 0}
                />

                {/* Course Performance Table */}
                <CoursePerformanceTable courses={coursesData} />

                {/* Additional Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6"
                    >
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                <Eye className="w-5 h-5 text-blue-500" />
                            </div>
                            <h4 className="text-foreground font-semibold">Total Views</h4>
                        </div>
                        <p className="text-3xl font-bold text-foreground">
                            {(overviewData?.overview.totalViews || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">All-time video views</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6"
                    >
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-purple-500" />
                            </div>
                            <h4 className="text-foreground font-semibold">Completion Rate</h4>
                        </div>
                        <p className="text-3xl font-bold text-foreground">
                            {overviewData?.overview.averageCompletionRate || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Average across courses</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6"
                    >
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-500" />
                            </div>
                            <h4 className="text-foreground font-semibold">Avg. Revenue/Student</h4>
                        </div>
                        <p className="text-3xl font-bold text-foreground">
                            {formatCurrency(
                                overviewData?.overview.totalStudents
                                    ? (overviewData.overview.totalRevenue / overviewData.overview.totalStudents)
                                    : 0
                            )}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">Per enrollment</p>
                    </motion.div>
                </div>

                {/* Insights Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-700/30 rounded-xl p-6"
                >
                    <h3 className="text-xl font-bold text-foreground mb-4">📊 Quick Insights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                                <p className="text-foreground font-semibold">Strong Enrollment Growth</p>
                                <p className="text-sm text-muted-foreground">
                                    {overviewData?.trends.enrollments.trend && overviewData.trends.enrollments.trend > 0
                                        ? `+${overviewData.trends.enrollments.trend.toFixed(1)}% increase in new students`
                                        : 'Focus on marketing to boost enrollments'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Award className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-foreground font-semibold">Completion Performance</p>
                                <p className="text-sm text-muted-foreground">
                                    {overviewData?.overview.averageCompletionRate && overviewData.overview.averageCompletionRate > 50
                                        ? 'Excellent course completion rates!'
                                        : 'Consider adding more engagement features'}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
