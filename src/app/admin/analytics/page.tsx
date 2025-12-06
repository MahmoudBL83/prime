'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, BookOpen, DollarSign,
    CheckCircle, Clock, Star, Eye, Calendar, Filter, Download,
    AlertTriangle, Award, Target, RefreshCw
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
    const { data: session, status } = useSession();
    const [platformData, setPlatformData] = useState<PlatformMetrics | null>(null);
    const [contentData, setContentData] = useState<any>(null);
    const [creatorData, setCreatorData] = useState<any>(null);
    const [advancedData, setAdvancedData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('30');
    const [activeTab, setActiveTab] = useState<'platform' | 'content' | 'creators' | 'advanced'>('platform');
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const lastRangeRef = useRef<Record<typeof activeTab, string | null>>({
        platform: null,
        content: null,
        creators: null,
        advanced: 'static',
    });
    const inFlightRef = useRef<{ key: string | null; promise: Promise<any> | null }>({ key: null, promise: null });

    const getCachedData = (tab: typeof activeTab) => {
        if (tab === 'platform') return platformData;
        if (tab === 'content') return contentData;
        if (tab === 'creators') return creatorData;
        return advancedData;
    };

    const fetchPlatformData = async () => {
        const response = await fetch(`/api/admin/analytics/platform?days=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        const data = await response.json();
        setPlatformData(data);
        return data;
    };

    const fetchContentData = async () => {
        const response = await fetch(`/api/admin/analytics/content?days=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch content analytics');
        const data = await response.json();
        setContentData(data);
        return data;
    };

    const fetchCreatorData = async () => {
        const response = await fetch(`/api/admin/analytics/creators?days=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch creator analytics');
        const data = await response.json();
        setCreatorData(data);
        return data;
    };

    const fetchAdvancedData = async () => {
        const response = await fetch('/api/admin/analytics/advanced');
        if (!response.ok) throw new Error('Failed to fetch advanced analytics');
        const data = await response.json();
        setAdvancedData(data);
        return data;
    };

    const fetchers: Record<typeof activeTab, () => Promise<any>> = {
        platform: fetchPlatformData,
        content: fetchContentData,
        creators: fetchCreatorData,
        advanced: fetchAdvancedData,
    };

    const isAdmin = status === 'authenticated' && session?.user.role === 'ADMIN';

    const loadData = async (tab: typeof activeTab = activeTab, { force = false } = {}) => {
        const cache = getCachedData(tab);
        const rangeKey = tab === 'advanced' ? 'static' : timeRange;
        const hasCacheForRange = cache && lastRangeRef.current[tab] === rangeKey;

        if (!force && hasCacheForRange) {
            return cache;
        }

        const requestKey = `${tab}-${rangeKey}`;
        if (inFlightRef.current.key === requestKey && inFlightRef.current.promise) {
            return inFlightRef.current.promise;
        }

        const showSpinner = !cache;
        if (showSpinner) setLoading(true);
        setError(null);

        const promise = fetchers[tab]()
            .then((result) => {
                lastRangeRef.current[tab] = rangeKey;
                return result;
            })
            .catch((err) => {
                setError(err instanceof Error ? err.message : 'An error occurred');
                throw err;
            })
            .finally(() => {
                if (showSpinner) setLoading(false);
                inFlightRef.current = { key: null, promise: null };
            });

        inFlightRef.current = { key: requestKey, promise };
        return promise;
    };

    useEffect(() => {
        if (isAdmin) {
            loadData(activeTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, activeTab]);

    useEffect(() => {
        if (isAdmin) {
            // Load all tabs for the new timeRange
            loadData('platform');
            loadData('content');
            loadData('creators');
            // Load advanced if not loaded
            if (!advancedData) loadData('advanced');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, timeRange]);

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

    const formatMaybeNumber = (value: number | null | undefined, { suffix = '', prefix = '', decimals = 0 }: { suffix?: string; prefix?: string; decimals?: number } = {}) => {
        if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
        const factor = Math.pow(10, decimals);
        const rounded = Math.round(value * factor) / factor;
        return `${prefix}${rounded}${suffix}`;
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
            await loadData(activeTab, { force: true });
        } finally {
            setRefreshing(false);
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            // Ensure freshest data
            const fresh = await loadData(activeTab, { force: true });
            const data = fresh ?? getCachedData(activeTab);

            const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-${activeTab}-${new Date().toISOString()}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export');
        } finally {
            setExporting(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading session…</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
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
                                                loadData(activeTab, { force: true });
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
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-8 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-xs text-white font-semibold shadow-lg">
                            <Eye className="w-3.5 h-3.5" />
                            Live Admin Analytics
                        </div>
                        <h1 className="mt-4 text-4xl font-bold text-white drop-shadow-lg">Analytics Dashboard</h1>
                        <p className="text-white/80 mt-1 text-lg">Comprehensive platform insights and performance metrics</p>
                    </div>
                    <div className="relative flex items-center gap-3">
                        <div className="hidden md:flex items-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 p-1.5 text-sm shadow-lg">
                            {[{ id: '7', label: '7d' }, { id: '30', label: '30d' }, { id: '90', label: '90d' }].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setTimeRange(opt.id)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${timeRange === opt.id ? 'bg-white text-purple-600 shadow-md' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm px-4 py-2.5 text-white font-semibold hover:bg-white/30 disabled:opacity-50 transition-all shadow-lg"
                        >
                            {refreshing ? <Clock className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {refreshing ? 'Refreshing' : 'Refresh'}
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-purple-600 font-bold hover:bg-white/90 disabled:opacity-50 transition-all shadow-xl"
                        >
                            {exporting ? <Clock className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {exporting ? 'Exporting…' : 'Export JSON'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-border shadow-sm p-2">
                <nav className="flex space-x-2">
                    {[
                        { id: 'platform', label: 'Platform Overview', icon: TrendingUp },
                        { id: 'content', label: 'Content Analytics', icon: BookOpen },
                        { id: 'creators', label: 'Creator Insights', icon: Users },
                        { id: 'advanced', label: 'Advanced Metrics', icon: Target },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                const nextTab = tab.id as typeof activeTab;
                                setActiveTab(nextTab);
                            }}
                            className={`flex items-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
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
                        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Total Users</p>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatNumber(platformData.overview.totalUsers)}</p>
                                </div>
                                <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div className="relative mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                <span className="text-green-600 font-bold">+{platformData.growth.newUsers}</span>
                                <span className="text-blue-700 dark:text-blue-300 ml-1">in last {platformData.growth.periodDays} days</span>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl shadow-lg border border-green-200 dark:border-green-800 hover:shadow-xl transition-all group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-1">Total Courses</p>
                                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">{formatNumber(platformData.overview.totalCourses)}</p>
                                </div>
                                <div className="p-4 bg-green-600 rounded-2xl shadow-lg">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div className="relative mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                <span className="text-green-600 font-bold">+{platformData.growth.newCourses}</span>
                                <span className="text-green-700 dark:text-green-300 ml-1">new courses</span>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-1">Total Enrollments</p>
                                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatNumber(platformData.overview.totalEnrollments)}</p>
                                </div>
                                <div className="p-4 bg-purple-600 rounded-2xl shadow-lg">
                                    <Target className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div className="relative mt-4 flex items-center text-sm">
                                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                <span className="text-green-600 font-bold">+{platformData.growth.newEnrollments}</span>
                                <span className="text-purple-700 dark:text-purple-300 ml-1">new enrollments</span>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-6 rounded-2xl shadow-lg border border-yellow-200 dark:border-yellow-800 hover:shadow-xl transition-all group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-1">Total Revenue</p>
                                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(platformData.overview.totalRevenue)}</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg">
                                    <DollarSign className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            <div className="relative mt-4 flex items-center text-sm">
                                <span className="text-orange-700 dark:text-orange-300 font-semibold">
                                    {platformData.overview.publishedCourses} published courses
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Metrics Chart */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
                                Daily Activity
                            </h3>
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
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-blue-600 rounded-full" />
                                Course Status Distribution
                            </h3>
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
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
                                Top Performing Courses
                            </h3>
                            <div className="space-y-3">
                                {platformData.insights.topCourses.slice(0, 5).map((course, index) => (
                                    <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{course.title}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">by {course.creator}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">{course.enrollments} students</p>
                                            <div className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-500">
                                                <Star className="w-4 h-4 fill-current" />
                                                {course.rating.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-blue-600 rounded-full" />
                                Recent Activity
                            </h3>
                            <div className="space-y-3">
                                {platformData.insights.recentActivity.slice(0, 5).map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700">
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
            {activeTab === 'content' && (
                <div className="space-y-6">
                    {contentData ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl shadow-lg border border-green-200 dark:border-green-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Published Courses</p>
                                            <p className="text-3xl font-bold text-green-900 dark:text-green-100">{contentData.overview.totalPublishedCourses}</p>
                                        </div>
                                        <div className="p-4 bg-green-600 rounded-2xl shadow-lg">
                                            <BookOpen className="w-6 h-6 text-green-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-6 rounded-2xl shadow-lg border border-yellow-200 dark:border-yellow-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Average Rating</p>
                                            <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{contentData.overview.averageRating.toFixed(1)}</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg">
                                            <Star className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Total Views</p>
                                            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{formatNumber(contentData.overview.totalViews)}</p>
                                        </div>
                                        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                                            <Eye className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Total Enrollments</p>
                                            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{formatNumber(contentData.overview.totalEnrollments)}</p>
                                        </div>
                                        <div className="p-4 bg-purple-600 rounded-2xl shadow-lg">
                                            <Users className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full" />
                                        Category Performance
                                    </h3>
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

                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full" />
                                        Top Earning Courses
                                    </h3>
                                    <div className="space-y-3">
                                        {contentData.revenue.topEarningCourses.slice(0, 5).map((course: any, index: number) => (
                                            <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{course.title}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{course.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(course.revenue)}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{course.enrollments} enrollments</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                            No content analytics yet. Refresh to pull the latest data.
                        </div>
                    )}
                </div>
            )}

            {/* Creator Insights Tab */}
            {activeTab === 'creators' && (
                <div className="space-y-6">
                    {creatorData ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">Total Creators</p>
                                            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{creatorData.overview.totalCreators}</p>
                                        </div>
                                        <div className="p-4 bg-blue-600 rounded-2xl shadow-lg">
                                            <Users className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center text-sm">
                                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                        <span className="text-green-600 font-bold">+{creatorData.growth.newCreators}</span>
                                        <span className="text-blue-700 dark:text-blue-300 ml-1">new creators</span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl shadow-lg border border-green-200 dark:border-green-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Verified Creators</p>
                                            <p className="text-3xl font-bold text-green-900 dark:text-green-100">{creatorData.overview.verifiedCreators}</p>
                                        </div>
                                        <div className="p-4 bg-green-600 rounded-2xl shadow-lg">
                                            <CheckCircle className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">Active Creators</p>
                                            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{creatorData.overview.activeCreators}</p>
                                        </div>
                                        <div className="p-4 bg-purple-600 rounded-2xl shadow-lg">
                                            <Award className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-6 rounded-2xl shadow-lg border border-yellow-200 dark:border-yellow-800 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">Total Revenue</p>
                                            <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(creatorData.overview.totalRevenue)}</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg">
                                            <DollarSign className="w-7 h-7 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-600 rounded-full" />
                                        Top Creators by Revenue
                                    </h3>
                                    <div className="space-y-3">
                                        {creatorData.topPerformers.byRevenue.slice(0, 5).map((creator: any, index: number) => (
                                            <div key={creator.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{creator.name}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{creator.publishedCourses} courses</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(creator.totalRevenue)}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{creator.totalEnrollments} students</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full" />
                                        KYC Status Distribution
                                    </h3>
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
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                            No creator insights yet. Refresh to pull the latest data.
                        </div>
                    )}
                </div>
            )}

            {/* Advanced Metrics Tab */}
            {activeTab === 'advanced' && (
                <div className="space-y-6">
                    {advancedData ? (
                        <>
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
                                        <p className="text-3xl font-bold">{formatMaybeNumber(advancedData.northStar.weeklyLearningHours, { suffix: ' hrs', decimals: 1 })}</p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                        <p className="text-blue-100 text-sm mb-1">Weekly Active Users</p>
                                        <p className="text-3xl font-bold">{formatMaybeNumber(advancedData.northStar.weeklyActiveUsers)}</p>
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

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full" />
                                    User Activation Funnel
                                </h3>
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

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full" />
                                    Retention Cohorts
                                </h3>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-green-600 to-blue-600 rounded-full" />
                                        Unit Economics
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-muted-foreground">Customer Lifetime Value</span>
                                                <span className="text-2xl font-bold text-green-600">{formatMaybeNumber(advancedData.economics.ltv, { prefix: '$', decimals: 1 })}</span>
                                            </div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-muted-foreground">Customer Acquisition Cost</span>
                                                <span className="text-2xl font-bold text-blue-600">{formatMaybeNumber(advancedData.economics.cac, { prefix: '$', decimals: 1 })}</span>
                                            </div>
                                            <div className="border-t pt-4 mt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-foreground font-semibold">LTV:CAC Ratio</span>
                                                    <span className={`text-3xl font-bold ${
                                                        (advancedData.economics.ltvCacRatio ?? 0) >= 3 ? 'text-green-600' : 'text-yellow-600'
                                                    }`}>
                                                        {advancedData.economics.ltvCacRatio !== null && advancedData.economics.ltvCacRatio !== undefined
                                                            ? `${advancedData.economics.ltvCacRatio}:1`
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {advancedData.economics.ltvCacRatio !== null && advancedData.economics.ltvCacRatio !== undefined
                                                        ? advancedData.economics.ltvCacRatio >= 3 ? 'Excellent' : 'Good'
                                                        : 'Not enough data for CAC'}
                                                    {advancedData.economics.ltvCacRatio !== null && advancedData.economics.ltvCacRatio !== undefined ? ' - Target is 3:1 or higher' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Payback Period</p>
                                                <p className="text-xl font-bold text-foreground">{formatMaybeNumber(advancedData.economics.paybackPeriod, { suffix: ' months', decimals: 1 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                                                <p className="text-xl font-bold text-foreground">{formatMaybeNumber(advancedData.economics.conversionRate, { suffix: '%', decimals: 1 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">ARPU</p>
                                                <p className="text-xl font-bold text-foreground">{formatMaybeNumber(advancedData.economics.arpu, { prefix: '$', decimals: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">ARPPU</p>
                                                <p className="text-xl font-bold text-foreground">{formatMaybeNumber(advancedData.economics.arppu, { prefix: '$', decimals: 2 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">MRR</p>
                                                <p className="text-xl font-bold text-foreground">{formatMaybeNumber(advancedData.economics.mrr ? advancedData.economics.mrr / 1000 : null, { suffix: 'K', decimals: 0 })}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">ARR</p>
                                                <p className="text-xl font-bold text-foreground">{formatMaybeNumber(advancedData.economics.arr ? advancedData.economics.arr / 1000000 : null, { suffix: 'M', decimals: 1 })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full" />
                                        Creator Earnings Distribution
                                    </h3>
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

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full" />
                                    A/B Test Results
                                </h3>
                                {advancedData.abTests.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-4 text-muted-foreground">No A/B tests recorded yet.</div>
                                ) : (
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
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full" />
                                    ML Recommendation Performance
                                </h3>
                                {advancedData.recommendations.totalRecommendations === 0 && advancedData.recommendations.topSources.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-4 text-muted-foreground">No recommendation performance data yet.</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Total Recommendations</p>
                                                <p className="text-3xl font-bold text-blue-600">{formatMaybeNumber(advancedData.recommendations.totalRecommendations ? advancedData.recommendations.totalRecommendations / 1000 : null, { suffix: 'K' })}</p>
                                            </div>
                                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Click-Through Rate</p>
                                                <p className="text-3xl font-bold text-green-600">{formatMaybeNumber(advancedData.recommendations.clickThroughRate, { suffix: '%' })}</p>
                                            </div>
                                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Enrollment Rate</p>
                                                <p className="text-3xl font-bold text-purple-600">{formatMaybeNumber(advancedData.recommendations.enrollmentRate, { suffix: '%' })}</p>
                                            </div>
                                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-1">Revenue Generated</p>
                                                <p className="text-3xl font-bold text-yellow-600">{formatMaybeNumber(advancedData.recommendations.revenueGenerated ? advancedData.recommendations.revenueGenerated / 1000 : null, { prefix: '$', suffix: 'K', decimals: 1 })}</p>
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
                                                            <span className="font-semibold text-foreground">{formatMaybeNumber(source.clicks ? source.clicks / 1000 : null, { suffix: 'K' })}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Enrollments: </span>
                                                            <span className="font-semibold text-foreground">{formatMaybeNumber(source.enrollments)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Revenue: </span>
                                                            <span className="font-semibold text-green-600">{formatMaybeNumber(source.revenue ? source.revenue / 1000 : null, { prefix: '$', suffix: 'K', decimals: 1 })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                            No advanced metrics yet. Refresh to pull the latest data.
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
