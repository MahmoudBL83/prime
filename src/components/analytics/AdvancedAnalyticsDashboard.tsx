'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    BookOpen,
    Award,
    Clock,
    Eye,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalyticsData {
    type: string
    period: string
    data: any
}

interface AdvancedAnalyticsDashboardProps {
    role?: 'admin' | 'creator'
    creatorId?: string
    className?: string
}

export default function AdvancedAnalyticsDashboard({
    role = 'creator',
    creatorId,
    className = ''
}: AdvancedAnalyticsDashboardProps) {
    const [activeType, setActiveType] = useState<'overview' | 'engagement' | 'revenue' | 'content'>('overview')
    const [period, setPeriod] = useState('30d')
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAnalytics()
    }, [activeType, period])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                type: activeType,
                period,
                ...(creatorId && { creatorId })
            })
            const response = await fetch(`/api/analytics/advanced?${params}`)
            if (response.ok) {
                const result = await response.json()
                setData(result)
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    const periods = [
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
        { value: '1y', label: '1 Year' }
    ]

    const types = [
        { value: 'overview', label: 'Overview', icon: BarChart3 },
        { value: 'engagement', label: 'Engagement', icon: Eye },
        { value: 'revenue', label: 'Revenue', icon: DollarSign },
        { value: 'content', label: 'Content', icon: BookOpen }
    ]

    const renderOverview = () => {
        if (!data?.data) return null
        const d = data.data

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label="Total Users"
                    value={d.totalUsers?.toLocaleString()}
                    change={`+${d.newUsers} new`}
                    changeType="positive"
                />
                <StatCard
                    icon={BookOpen}
                    label="Total Courses"
                    value={d.totalCourses}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Enrollments"
                    value={d.totalEnrollments?.toLocaleString()}
                    subtext="This period"
                />
                <StatCard
                    icon={DollarSign}
                    label="Revenue"
                    value={`${(d.totalRevenue || 0).toLocaleString()} EGP`}
                    changeType="positive"
                />
            </div>
        )
    }

    const renderEngagement = () => {
        if (!data?.data) return null
        const d = data.data

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard
                        icon={Eye}
                        label="Video Views"
                        value={d.videoViews?.toLocaleString()}
                    />
                    <StatCard
                        icon={Clock}
                        label="Avg Watch Time"
                        value={`${d.avgWatchTimeMinutes} min`}
                    />
                    <StatCard
                        icon={Award}
                        label="Courses Completed"
                        value={d.coursesCompleted}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StatCard
                        icon={BarChart3}
                        label="Quiz Attempts"
                        value={d.quizAttempts?.toLocaleString()}
                    />
                    <StatCard
                        icon={Award}
                        label="Certificates Issued"
                        value={d.certificatesIssued}
                    />
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                    <p className="text-sm text-gray-400">Engagement Score</p>
                    <p className="text-3xl font-bold text-white">{d.engagementScore}/100</p>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            style={{ width: `${d.engagementScore}%` }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    const renderRevenue = () => {
        if (!data?.data) return null
        const d = data.data

        return (
            <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                    <p className="text-sm text-gray-400">Total Revenue</p>
                    <p className="text-4xl font-bold text-white">
                        {(d.totalRevenue || 0).toLocaleString()} EGP
                    </p>
                </div>

                {d.bySubscriptionType?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <h4 className="font-medium text-white mb-3">By Subscription Type</h4>
                        <div className="space-y-2">
                            {d.bySubscriptionType.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                                    <span className="text-gray-300">{item.type}</span>
                                    <div className="text-right">
                                        <span className="text-white font-medium">{item.revenue?.toLocaleString()} EGP</span>
                                        <span className="text-gray-500 text-sm ml-2">({item.transactions} txns)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {d.topCourses?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <h4 className="font-medium text-white mb-3">Top Performing Courses</h4>
                        <div className="space-y-2">
                            {d.topCourses.map((course: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                                    <span className="text-gray-300 truncate flex-1">{course.title}</span>
                                    <div className="text-right ml-4">
                                        <span className="text-white font-medium">{course.enrollments} enrolled</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    const renderContent = () => {
        if (!data?.data) return null
        const d = data.data

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <StatCard
                        icon={BookOpen}
                        label="Total Lessons"
                        value={d.totalLessons}
                    />
                    <StatCard
                        icon={BarChart3}
                        label="Avg Lessons/Course"
                        value={d.avgLessonsPerCourse}
                    />
                    <StatCard
                        icon={Clock}
                        label="Avg Duration"
                        value={`${d.avgCourseDuration} min`}
                    />
                </div>

                {d.topRatedCourses?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-4">
                        <h4 className="font-medium text-white mb-3">Top Rated Courses</h4>
                        <div className="space-y-2">
                            {d.topRatedCourses.map((course: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                                    <span className="text-gray-300 truncate flex-1">{course.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-400">★ {course.rating?.toFixed(1) || 'N/A'}</span>
                                        <span className="text-gray-500 text-sm">({course._count?.reviews || 0} reviews)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    {types.map(t => (
                        <Button
                            key={t.value}
                            variant={activeType === t.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveType(t.value as any)}
                            className="gap-2"
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {periods.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={`px-3 py-1 rounded-full text-sm ${period === p.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : (
                <div>
                    {activeType === 'overview' && renderOverview()}
                    {activeType === 'engagement' && renderEngagement()}
                    {activeType === 'revenue' && renderRevenue()}
                    {activeType === 'content' && renderContent()}
                </div>
            )}
        </div>
    )
}

// Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    change,
    changeType,
    subtext
}: {
    icon: any
    label: string
    value: string | number
    change?: string
    changeType?: 'positive' | 'negative'
    subtext?: string
}) {
    return (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {change && (
                <p className={`text-sm ${changeType === 'positive' ? 'text-green-400' : 'text-gray-400'}`}>
                    {change}
                </p>
            )}
            {subtext && (
                <p className="text-xs text-gray-500">{subtext}</p>
            )}
        </div>
    )
}
