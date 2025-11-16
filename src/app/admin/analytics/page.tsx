'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, BookOpen, DollarSign,
    CheckCircle, Clock, Star, Eye, Calendar, Filter, Download,
    AlertTriangle, Award, Target
} from 'lucide-react';

interface PlatformMetrics {
    overview: {
        totalUsers: number;
        totalCreators: number;
        totalCourses: number;
        totalEnrollments: number;
        totalRevenue: number;
        publishedCourses: number;
        pendingCourses: number;
    };
    growth: {
        newUsers: number;
        newCreators: number;
        newCourses: number;
        newEnrollments: number;
        periodDays: number;
    };
    charts: {
        dailyMetrics: Array<{
            date: string;
            users: number;
            enrollments: number;
            courses: number;
            revenue: number;
        }>;
        courseStatusDistribution: Array<{
            status: string;
            count: number;
        }>;
        creatorVerificationStatus: Array<{
            status: string;
            count: number;
        }>;
    };
    insights: {
        topCourses: Array<{
            id: string;
            title: string;
            enrollments: number;
            rating: number;
            creator: string;
            status: string;
        }>;
        recentActivity: Array<{
            id: string;
            title: string;
            status: string;
            creator: string;
            updatedAt: string;
        }>;
    };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function AnalyticsDashboard() {
    const { data: session } = useSession();
    const [platformData, setPlatformData] = useState<PlatformMetrics | null>(null);
    const [contentData, setContentData] = useState<any>(null);
    const [creatorData, setCreatorData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('30');
    const [activeTab, setActiveTab] = useState<'platform' | 'content' | 'creators' | 'advanced'>('platform');
    const [advancedData, setAdvancedData] = useState<any>(null);

    useEffect(() => {
        if (session?.user.role === 'ADMIN') {
            if (activeTab === 'platform') {
                fetchPlatformData();
            } else if (activeTab === 'content') {
                fetchContentData();
            } else if (activeTab === 'creators') {
                fetchCreatorData();
            } else if (activeTab === 'advanced') {
                fetchAdvancedData();
            }
        }
    }, [session, timeRange, activeTab]);

    const fetchPlatformData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/analytics/platform?days=${timeRange}`);
            if (!response.ok) throw new Error('Failed to fetch analytics data');
            const data = await response.json();
            setPlatformData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchContentData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/analytics/content?days=${timeRange}`);
            if (!response.ok) throw new Error('Failed to fetch content analytics');
            const data = await response.json();
            setContentData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchCreatorData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/analytics/creators?days=${timeRange}`);
            if (!response.ok) throw new Error('Failed to fetch creator analytics');
            const data = await response.json();
            setCreatorData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdvancedData = async () => {
        try {
            setLoading(true);
            // Mock advanced analytics data
            const mockData = {
                northStar: {
                    weeklyLearningHours: 42.5,
                    weeklyActiveUsers: 3456,
                    hoursPerUser: 12.3,
                    trend: 8.5, // percentage change
                    weeklyData: [
                        { week: 'W1', hours: 38.2, users: 3200 },
                        { week: 'W2', hours: 39.8, users: 3280 },
                        { week: 'W3', hours: 41.5, users: 3380 },
                        { week: 'W4', hours: 42.5, users: 3456 }
                    ]
                },
                activationFunnel: [
                    { stage: 'Sign Up', users: 10000, percentage: 100 },
                    { stage: 'Profile Complete', users: 8500, percentage: 85 },
                    { stage: 'First Course View', users: 7200, percentage: 72 },
                    { stage: 'First Enrollment', users: 5400, percentage: 54 },
                    { stage: 'First Lesson Complete', users: 4100, percentage: 41 },
                    { stage: 'Active User (7d)', users: 3200, percentage: 32 }
                ],
                retention: {
                    cohorts: [
                        { cohort: 'Oct 2025', week0: 100, week1: 65, week2: 52, week3: 45, week4: 42, week8: 38, week12: 35 },
                        { cohort: 'Sep 2025', week0: 100, week1: 62, week2: 49, week3: 43, week4: 40, week8: 35, week12: 32 },
                        { cohort: 'Aug 2025', week0: 100, week1: 60, week2: 47, week3: 41, week4: 38, week8: 33, week12: 30 },
                        { cohort: 'Jul 2025', week0: 100, week1: 58, week2: 45, week3: 39, week4: 36, week8: 31, week12: 28 }
                    ],
                    dayRetention: [
                        { period: 'Day 1', rate: 45 },
                        { period: 'Day 7', rate: 32 },
                        { period: 'Day 30', rate: 25 },
                        { period: 'Day 90', rate: 18 }
                    ]
                },
                economics: {
                    ltv: 847,
                    cac: 125,
                    ltvCacRatio: 6.8,
                    paybackPeriod: 2.3, // months
                    arpu: 42,
                    arppu: 156,
                    conversionRate: 8.5,
                    churnRate: 4.2,
                    mrr: 245000,
                    arr: 2940000
                },
                creatorEarnings: [
                    { range: '$0-$100', count: 234, percentage: 42 },
                    { range: '$100-$500', count: 156, percentage: 28 },
                    { range: '$500-$1K', count: 89, percentage: 16 },
                    { range: '$1K-$5K', count: 54, percentage: 10 },
                    { range: '$5K-$10K', count: 15, percentage: 3 },
                    { range: '$10K+', count: 8, percentage: 1 }
                ],
                abTests: [
                    {
                        id: 'test-1',
                        name: 'Course Card Design',
                        status: 'running',
                        variants: [
                            { name: 'Control', users: 5000, conversions: 425, conversionRate: 8.5 },
                            { name: 'Variant A', users: 5000, conversions: 520, conversionRate: 10.4 }
                        ],
                        winner: 'Variant A',
                        confidence: 95
                    },
                    {
                        id: 'test-2',
                        name: 'Pricing Page Layout',
                        status: 'completed',
                        variants: [
                            { name: 'Control', users: 8000, conversions: 640, conversionRate: 8.0 },
                            { name: 'Variant B', users: 8000, conversions: 776, conversionRate: 9.7 }
                        ],
                        winner: 'Variant B',
                        confidence: 98
                    }
                ],
                recommendations: {
                    totalRecommendations: 125000,
                    clickThroughRate: 15.2,
                    enrollmentRate: 6.8,
                    revenueGenerated: 89500,
                    topSources: [
                        { source: 'Homepage', clicks: 45000, enrollments: 3150, revenue: 35200 },
                        { source: 'Course Page', clicks: 38000, enrollments: 2660, revenue: 28400 },
                        { source: 'Dashboard', clicks: 25000, enrollments: 1750, revenue: 18900 },
                        { source: 'Email', clicks: 17000, enrollments: 1190, revenue: 7000 }
                    ]
                }
            };
            setAdvancedData(mockData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (!session || session.user.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
                    <p className="text-muted-foreground">You need admin privileges to access analytics.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                        <p className="text-muted-foreground">Comprehensive platform insights and performance metrics</p>
                    </div>
                </div>
                <div className="flex items-center justify-center min-h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                        <p className="text-muted-foreground">Comprehensive platform insights and performance metrics</p>
                    </div>
                </div>
                <div className="flex items-center justify-center min-h-96">
                    <div className="text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-foreground mb-2">Error Loading Analytics</h1>
                        <p className="text-muted-foreground mb-4">{error}</p>
                        <button
                            onClick={() => {
                                if (activeTab === 'platform') fetchPlatformData();
                                else if (activeTab === 'content') fetchContentData();
                                else if (activeTab === 'creators') fetchCreatorData();
                            }}
                            className="px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Comprehensive platform insights and performance metrics</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Time Range Selector */}
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>

                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border">
                <nav className="flex space-x-8">
                    {[
                        { id: 'platform', label: 'Platform Overview', icon: TrendingUp },
                        { id: 'content', label: 'Content Analytics', icon: BookOpen },
                        { id: 'creators', label: 'Creator Insights', icon: Users },
                        { id: 'advanced', label: 'Advanced Metrics', icon: Target },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Platform Overview Tab */}
            {activeTab === 'platform' && platformData && (
                <div className="space-y-6">
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                    <p className="text-2xl font-bold text-foreground">{formatNumber(platformData.overview.totalUsers)}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-green-600 font-medium">+{platformData.growth.newUsers}</span>
                                <span className="text-muted-foreground ml-1">in last {platformData.growth.periodDays} days</span>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                                    <p className="text-2xl font-bold text-foreground">{formatNumber(platformData.overview.totalCourses)}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <BookOpen className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-green-600 font-medium">+{platformData.growth.newCourses}</span>
                                <span className="text-muted-foreground ml-1">new courses</span>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
                                    <p className="text-2xl font-bold text-foreground">{formatNumber(platformData.overview.totalEnrollments)}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Target className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-green-600 font-medium">+{platformData.growth.newEnrollments}</span>
                                <span className="text-muted-foreground ml-1">new enrollments</span>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold text-foreground">{formatCurrency(platformData.overview.totalRevenue)}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <DollarSign className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-muted-foreground">
                                    {platformData.overview.publishedCourses} published courses
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Metrics Chart */}
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Daily Activity</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={platformData.charts.dailyMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                                    <Area type="monotone" dataKey="enrollments" stackId="1" stroke="#10B981" fill="#10B981" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Course Status Distribution */}
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Course Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={platformData.charts.courseStatusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry: any) => `${entry.status} ${(entry.percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {platformData.charts.courseStatusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Courses and Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Courses */}
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Top Performing Courses</h3>
                            <div className="space-y-3">
                                {platformData.insights.topCourses.slice(0, 5).map((course, index) => (
                                    <div key={course.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-foreground font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{course.title}</p>
                                                <p className="text-sm text-muted-foreground">by {course.creator}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-foreground">{course.enrollments} students</p>
                                            <div className="flex items-center gap-1 text-sm text-yellow-600">
                                                <Star className="w-4 h-4 fill-current" />
                                                {course.rating.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {platformData.insights.recentActivity.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                        <div>
                                            <p className="font-medium text-foreground">{activity.title}</p>
                                            <p className="text-sm text-muted-foreground">by {activity.creator}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                                                    activity.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-muted text-gray-800'
                                                }`}>
                                                {activity.status.replace('_', ' ')}
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(activity.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Analytics Tab */}
            {activeTab === 'content' && contentData && (
                <div className="space-y-6">
                    {/* Content Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Published Courses</p>
                                    <p className="text-2xl font-bold text-foreground">{contentData.overview.totalPublishedCourses}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <BookOpen className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                                    <p className="text-2xl font-bold text-foreground">{contentData.overview.averageRating.toFixed(1)}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <Star className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                                    <p className="text-2xl font-bold text-foreground">{formatNumber(contentData.overview.totalViews)}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Eye className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
                                    <p className="text-2xl font-bold text-foreground">{formatNumber(contentData.overview.totalEnrollments)}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Users className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Category Performance Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Category Performance</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={contentData.categoryPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="category" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="totalEnrollments" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Top Earning Courses</h3>
                            <div className="space-y-3">
                                {contentData.revenue.topEarningCourses.slice(0, 5).map((course: any, index: number) => (
                                    <div key={course.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-foreground font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{course.title}</p>
                                                <p className="text-sm text-muted-foreground">{course.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-foreground">{formatCurrency(course.revenue)}</p>
                                            <p className="text-sm text-muted-foreground">{course.enrollments} enrollments</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Creator Insights Tab */}
            {activeTab === 'creators' && creatorData && (
                <div className="space-y-6">
                    {/* Creator Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Creators</p>
                                    <p className="text-2xl font-bold text-foreground">{creatorData.overview.totalCreators}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                <span className="text-green-600 font-medium">+{creatorData.growth.newCreators}</span>
                                <span className="text-muted-foreground ml-1">new creators</span>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Verified Creators</p>
                                    <p className="text-2xl font-bold text-foreground">{creatorData.overview.verifiedCreators}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Creators</p>
                                    <p className="text-2xl font-bold text-foreground">{creatorData.overview.activeCreators}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Award className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold text-foreground">{formatCurrency(creatorData.overview.totalRevenue)}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <DollarSign className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Performers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Top Creators by Revenue</h3>
                            <div className="space-y-3">
                                {creatorData.topPerformers.byRevenue.slice(0, 5).map((creator: any, index: number) => (
                                    <div key={creator.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-foreground font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{creator.name}</p>
                                                <p className="text-sm text-muted-foreground">{creator.publishedCourses} courses</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-foreground">{formatCurrency(creator.totalRevenue)}</p>
                                            <p className="text-sm text-muted-foreground">{creator.totalEnrollments} students</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">KYC Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={creatorData.kycDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry: any) => `${entry.status} (${entry.count})`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {creatorData.kycDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Metrics Tab */}
            {activeTab === 'advanced' && advancedData && (
                <div className="space-y-6">
                    {/* North Star Metric */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg shadow-lg text-foreground">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">North Star Metric</h2>
                                <p className="text-blue-100">Weekly Learning Hours per Active User</p>
                            </div>
                            <div className="text-right">
                                <p className="text-5xl font-bold">{advancedData.northStar.hoursPerUser}</p>
                                <p className="text-xl mt-2">hours/user/week</p>
                                <div className="flex items-center justify-end gap-2 mt-2">
                                    <TrendingUp className="w-5 h-5" />
                                    <span className="font-semibold">+{advancedData.northStar.trend}%</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <p className="text-blue-100 text-sm mb-1">Total Weekly Hours</p>
                                <p className="text-3xl font-bold">{advancedData.northStar.weeklyLearningHours}K</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <p className="text-blue-100 text-sm mb-1">Weekly Active Users</p>
                                <p className="text-3xl font-bold">{advancedData.northStar.weeklyActiveUsers}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <ResponsiveContainer width="100%" height={60}>
                                    <LineChart data={advancedData.northStar.weeklyData}>
                                        <Line type="monotone" dataKey="hours" stroke="#fff" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Activation Funnel */}
                    <div className="bg-background p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">User Activation Funnel</h3>
                        <div className="space-y-4">
                            {advancedData.activationFunnel.map((stage: any, index: number) => (
                                <div key={stage.stage} className="relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                stage.percentage >= 50 ? 'bg-green-100 text-green-700' :
                                                stage.percentage >= 25 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {index + 1}
                                            </div>
                                            <span className="font-medium text-foreground">{stage.stage}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-muted-foreground">{stage.users.toLocaleString()} users</span>
                                            <span className={`font-bold ${
                                                stage.percentage >= 50 ? 'text-green-600' :
                                                stage.percentage >= 25 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                                {stage.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all ${
                                                stage.percentage >= 50 ? 'bg-green-500' :
                                                stage.percentage >= 25 ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}
                                            style={{ width: `${stage.percentage}%` }}
                                        />
                                    </div>
                                    {index < advancedData.activationFunnel.length - 1 && (
                                        <div className="absolute left-4 top-12 w-0.5 h-4 bg-gray-300" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Retention Cohorts */}
                    <div className="bg-background p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Retention Cohorts</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Cohort</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Week 0</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Week 1</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Week 2</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Week 3</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Week 4</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Week 8</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Week 12</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {advancedData.retention.cohorts.map((cohort: any) => (
                                        <tr key={cohort.cohort} className="border-b hover:bg-background">
                                            <td className="py-3 px-4 font-medium text-foreground">{cohort.cohort}</td>
                                            {Object.entries(cohort).filter(([key]) => key !== 'cohort').map(([week, value]) => (
                                                <td key={week} className="text-center py-3 px-4">
                                                    <span className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-semibold ${
                                                        (value as number) >= 40 ? 'bg-green-100 text-green-700' :
                                                        (value as number) >= 30 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {value as number}%
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* LTV/CAC Economics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Unit Economics</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-muted-foreground">Customer Lifetime Value</span>
                                        <span className="text-2xl font-bold text-green-600">${advancedData.economics.ltv}</span>
                                    </div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-muted-foreground">Customer Acquisition Cost</span>
                                        <span className="text-2xl font-bold text-blue-600">${advancedData.economics.cac}</span>
                                    </div>
                                    <div className="border-t pt-4 mt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-foreground font-semibold">LTV:CAC Ratio</span>
                                            <span className={`text-3xl font-bold ${
                                                advancedData.economics.ltvCacRatio >= 3 ? 'text-green-600' : 'text-yellow-600'
                                            }`}>
                                                {advancedData.economics.ltvCacRatio}:1
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {advancedData.economics.ltvCacRatio >= 3 ? 'Excellent' : 'Good'} - Target is 3:1 or higher
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                                        <p className="text-xl font-bold text-foreground">{advancedData.economics.paybackPeriod} months</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                                        <p className="text-xl font-bold text-foreground">{advancedData.economics.conversionRate}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">ARPU</p>
                                        <p className="text-xl font-bold text-foreground">${advancedData.economics.arpu}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">ARPPU</p>
                                        <p className="text-xl font-bold text-foreground">${advancedData.economics.arppu}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">MRR</p>
                                        <p className="text-xl font-bold text-foreground">${(advancedData.economics.mrr / 1000).toFixed(0)}K</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">ARR</p>
                                        <p className="text-xl font-bold text-foreground">${(advancedData.economics.arr / 1000000).toFixed(1)}M</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-background p-6 rounded-lg shadow-sm border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Creator Earnings Distribution</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={advancedData.creatorEarnings}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#8B5CF6" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-4 space-y-2">
                                {advancedData.creatorEarnings.map((range: any) => (
                                    <div key={range.range} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{range.range}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">{range.count} creators</span>
                                            <span className="text-muted-foreground">({range.percentage}%)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* A/B Test Results */}
                    <div className="bg-background p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">A/B Test Results</h3>
                        <div className="space-y-4">
                            {advancedData.abTests.map((test: any) => (
                                <div key={test.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold text-foreground">{test.name}</h4>
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-1 ${
                                                test.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Winner: <span className="font-semibold text-green-600">{test.winner}</span></p>
                                            <p className="text-sm text-muted-foreground">Confidence: {test.confidence}%</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        {test.variants.map((variant: any) => (
                                            <div key={variant.name} className={`p-3 rounded-lg ${
                                                variant.name === test.winner ? 'bg-green-50 border border-green-200' : 'bg-background'
                                            }`}>
                                                <p className="font-medium text-foreground mb-2">{variant.name}</p>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Users:</span>
                                                        <span className="font-medium">{variant.users.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Conversions:</span>
                                                        <span className="font-medium">{variant.conversions}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Conv. Rate:</span>
                                                        <span className={`font-bold ${
                                                            variant.name === test.winner ? 'text-green-600' : 'text-foreground'
                                                        }`}>
                                                            {variant.conversionRate}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ML Recommendation Performance */}
                    <div className="bg-background p-6 rounded-lg shadow-sm border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">ML Recommendation Performance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Total Recommendations</p>
                                <p className="text-3xl font-bold text-blue-600">{(advancedData.recommendations.totalRecommendations / 1000).toFixed(0)}K</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Click-Through Rate</p>
                                <p className="text-3xl font-bold text-green-600">{advancedData.recommendations.clickThroughRate}%</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Enrollment Rate</p>
                                <p className="text-3xl font-bold text-purple-600">{advancedData.recommendations.enrollmentRate}%</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Revenue Generated</p>
                                <p className="text-3xl font-bold text-yellow-600">${(advancedData.recommendations.revenueGenerated / 1000).toFixed(0)}K</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <p className="font-semibold text-foreground">Top Performing Sources</p>
                            {advancedData.recommendations.topSources.map((source: any, index: number) => (
                                <div key={source.source} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-foreground font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <span className="font-medium text-foreground">{source.source}</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Clicks: </span>
                                            <span className="font-semibold text-foreground">{(source.clicks / 1000).toFixed(0)}K</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Enrollments: </span>
                                            <span className="font-semibold text-foreground">{source.enrollments}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Revenue: </span>
                                            <span className="font-semibold text-green-600">${(source.revenue / 1000).toFixed(1)}K</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
