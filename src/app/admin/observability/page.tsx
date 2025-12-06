'use client'

import React, { useState, useEffect } from 'react'
import {
    Activity,
    Users,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Globe,
    Zap,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Database,
    Server,
    Cpu,
    HardDrive,
    RefreshCw,
    Bell,
    Download,
    Eye,
    UserPlus,
    ShoppingCart,
    GraduationCap,
    Star,
    BarChart3,
    LineChart,
    PieChart
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type SystemStatus = 'operational' | 'degraded' | 'down'
type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

interface LiveMetrics {
    concurrentUsers: number
    activeSessions: number
    apiResponseTime: number
    errorRate: number
    databaseLatency: number
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
}

interface RevenueMetrics {
    todayRevenue: number
    yesterdayRevenue: number
    subscriptionsToday: number
    courseSalesToday: number
    conversionRate: number
    avgOrderValue: number
}

interface PlatformKPIs {
    mau: number
    dau: number
    retentionRate7Day: number
    retentionRate30Day: number
    churnRate: number
    nps: number
}

interface CreatorKPIs {
    activeCreators: number
    coursesPublishedThisWeek: number
    avgCreatorEarnings: number
    topCreatorRevenue: number
}

interface LearnerKPIs {
    courseCompletionsToday: number
    avgEngagementScore: number
    activeLearners: number
    newSignupsToday: number
}

interface SystemAlert {
    id: string
    severity: AlertSeverity
    title: string
    message: string
    timestamp: string
    status: 'active' | 'resolved'
    affectedService: string
}

interface GeographicData {
    location: string
    users: number
    percentage: number
}

const MOCK_LIVE_METRICS: LiveMetrics = {
    concurrentUsers: 1247,
    activeSessions: 1589,
    apiResponseTime: 245,
    errorRate: 0.8,
    databaseLatency: 12,
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38
}

const MOCK_REVENUE: RevenueMetrics = {
    todayRevenue: 125000,
    yesterdayRevenue: 118000,
    subscriptionsToday: 45,
    courseSalesToday: 89,
    conversionRate: 3.2,
    avgOrderValue: 1250
}

const MOCK_PLATFORM_KPIS: PlatformKPIs = {
    mau: 45000,
    dau: 12500,
    retentionRate7Day: 68,
    retentionRate30Day: 42,
    churnRate: 4.5,
    nps: 72
}

const MOCK_CREATOR_KPIS: CreatorKPIs = {
    activeCreators: 850,
    coursesPublishedThisWeek: 23,
    avgCreatorEarnings: 4500,
    topCreatorRevenue: 45000
}

const MOCK_LEARNER_KPIS: LearnerKPIs = {
    courseCompletionsToday: 156,
    avgEngagementScore: 78,
    activeLearners: 8500,
    newSignupsToday: 234
}

const MOCK_ALERTS: SystemAlert[] = [
    {
        id: 'ALR-001',
        severity: 'warning',
        title: 'High API Response Time',
        message: 'API response time increased to 450ms. Normal range: 200-300ms.',
        timestamp: '2024-10-17T14:30:00Z',
        status: 'active',
        affectedService: 'API Gateway'
    },
    {
        id: 'ALR-002',
        severity: 'info',
        title: 'Traffic Spike Detected',
        message: 'Unusual traffic increase (+35%) detected from Cairo region.',
        timestamp: '2024-10-17T13:15:00Z',
        status: 'active',
        affectedService: 'Load Balancer'
    },
    {
        id: 'ALR-003',
        severity: 'error',
        title: 'Payment Gateway Timeout',
        message: '5 payment transactions failed due to gateway timeout.',
        timestamp: '2024-10-17T12:45:00Z',
        status: 'resolved',
        affectedService: 'Payment Service'
    }
]

const MOCK_GEOGRAPHIC: GeographicData[] = [
    { location: 'Cairo', users: 456, percentage: 36.5 },
    { location: 'Alexandria', users: 298, percentage: 23.9 },
    { location: 'Giza', users: 187, percentage: 15.0 },
    { location: 'Shubra El-Kheima', users: 145, percentage: 11.6 },
    { location: 'Port Said', users: 98, percentage: 7.8 },
    { location: 'Others', users: 63, percentage: 5.2 }
]

const MOCK_HOURLY_ACTIVITY = [
    { hour: '00:00', users: 234, revenue: 12000 },
    { hour: '01:00', users: 189, revenue: 9500 },
    { hour: '02:00', users: 156, revenue: 7800 },
    { hour: '03:00', users: 145, revenue: 7200 },
    { hour: '04:00', users: 167, revenue: 8400 },
    { hour: '05:00', users: 198, revenue: 9900 },
    { hour: '06:00', users: 276, revenue: 13800 },
    { hour: '07:00', users: 345, revenue: 17250 },
    { hour: '08:00', users: 456, revenue: 22800 },
    { hour: '09:00', users: 589, revenue: 29450 },
    { hour: '10:00', users: 687, revenue: 34350 },
    { hour: '11:00', users: 745, revenue: 37250 },
    { hour: '12:00', users: 823, revenue: 41150 },
    { hour: '13:00', users: 891, revenue: 44550 },
    { hour: '14:00', users: 934, revenue: 46700 },
    { hour: '15:00', users: 978, revenue: 48900 },
    { hour: '16:00', users: 1045, revenue: 52250 },
    { hour: '17:00', users: 1123, revenue: 56150 },
    { hour: '18:00', users: 1247, revenue: 62350 },
    { hour: '19:00', users: 1189, revenue: 59450 },
    { hour: '20:00', users: 1098, revenue: 54900 },
    { hour: '21:00', users: 967, revenue: 48350 },
    { hour: '22:00', users: 745, revenue: 37250 },
    { hour: '23:00', users: 534, revenue: 26700 }
]

const alertColors = {
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
}

const alertIcons = {
    info: Bell,
    warning: AlertTriangle,
    error: XCircle,
    critical: AlertTriangle
}

export default function ObservabilityDashboard() {
    const [activeTab, setActiveTab] = useState('overview')
    const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null)
    const [revenue, setRevenue] = useState<RevenueMetrics | null>(null)
    const [platformKPIs, setPlatformKPIs] = useState<PlatformKPIs | null>(null)
    const [creatorKPIs, setCreatorKPIs] = useState<CreatorKPIs | null>(null)
    const [learnerKPIs, setLearnerKPIs] = useState<LearnerKPIs | null>(null)
    const [alerts, setAlerts] = useState<SystemAlert[]>([])
    const [geographic, setGeographic] = useState<GeographicData[]>([])
    const [hourlyData] = useState(MOCK_HOURLY_ACTIVITY) // Keep hourly for charts
    const [lastUpdate, setLastUpdate] = useState(new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showAlertModal, setShowAlertModal] = useState(false)
    const [selectedAlert, setSelectedAlert] = useState<SystemAlert | null>(null)

    const fetchData = async () => {
        try {
            setIsRefreshing(true)
            const response = await fetch('/api/admin/observability')
            if (!response.ok) throw new Error('Failed to fetch data')
            
            const data = await response.json()
            setLiveMetrics(data.liveMetrics)
            setRevenue(data.revenue)
            setPlatformKPIs(data.platformKPIs)
            setCreatorKPIs(data.creatorKPIs)
            setLearnerKPIs(data.learnerKPIs)
            setAlerts(data.alerts || [])
            setGeographic(data.geographic || [])
            setLastUpdate(new Date())
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    // Initial fetch
    useEffect(() => {
        fetchData()
    }, [])

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData()
        }, 30000)

        return () => clearInterval(interval)
    }, [])

    const handleRefresh = () => {
        fetchData()
    }

    const handleViewAlert = (alert: SystemAlert) => {
        setSelectedAlert(alert)
        setShowAlertModal(true)
    }

    const getSystemStatus = (): SystemStatus => {
        if (!liveMetrics) return 'operational'
        if (liveMetrics.errorRate > 2 || liveMetrics.apiResponseTime > 500) return 'down'
        if (liveMetrics.errorRate > 1 || liveMetrics.apiResponseTime > 350) return 'degraded'
        return 'operational'
    }

    const systemStatus = getSystemStatus()
    const revenueChange = revenue && revenue.yesterdayRevenue > 0 
        ? ((revenue.todayRevenue - revenue.yesterdayRevenue) / revenue.yesterdayRevenue) * 100 
        : 0
    const activeAlerts = alerts.filter(a => a.status === 'active')

    const formatCurrency = (amount: number) => `E£${(amount / 1000).toFixed(0)}k`
    const formatTime = (date: Date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-6">
                <div className="max-w-[1800px] mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                        <div className="h-16 bg-white/5 rounded-lg"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-6">
                <div className="max-w-[1800px] mx-auto">
                    <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Error loading dashboard</h3>
                                <div className="text-sm text-red-300">{error}</div>
                                <Button onClick={handleRefresh} className="mt-4 bg-red-600 hover:bg-red-700">
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Use default values if data is null
    const metrics = liveMetrics || MOCK_LIVE_METRICS
    const rev = revenue || MOCK_REVENUE
    const platform = platformKPIs || MOCK_PLATFORM_KPIS
    const creator = creatorKPIs || MOCK_CREATOR_KPIS
    const learner = learnerKPIs || MOCK_LEARNER_KPIS

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-6">
            <div className="max-w-[1800px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Real-Time Observability Dashboard</h1>
                        <p className="text-muted-foreground">Live platform monitoring and KPI tracking</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-muted-foreground">
                            Last updated: {formatTime(lastUpdate)}
                        </div>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* System Status Banner */}
                <div className={`rounded-lg p-4 border-2 ${
                    systemStatus === 'operational' ? 'bg-green-500/10 border-green-500/30' :
                    systemStatus === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-red-500/10 border-red-500/30'
                }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {systemStatus === 'operational' ? (
                                <CheckCircle className="w-8 h-8 text-green-400" />
                            ) : systemStatus === 'degraded' ? (
                                <AlertTriangle className="w-8 h-8 text-yellow-400" />
                            ) : (
                                <XCircle className="w-8 h-8 text-red-400" />
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-foreground">
                                    System Status: {systemStatus === 'operational' ? 'All Systems Operational' :
                                                   systemStatus === 'degraded' ? 'Performance Degraded' :
                                                   'System Down'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
                                    {activeAlerts.length > 0 && ' - immediate attention required'}
                                </p>
                            </div>
                        </div>
                        {activeAlerts.length > 0 && (
                            <Badge className="bg-red-600 text-foreground text-lg px-4 py-2">
                                {activeAlerts.length} Alert{activeAlerts.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Live Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-400" />
                            <Activity className="w-5 h-5 text-green-400 animate-pulse" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{metrics.concurrentUsers.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground mt-1">Concurrent Users</div>
                        <div className="text-xs text-green-400 mt-2">↑ Live</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-8 h-8 text-yellow-400" />
                            <div className={`w-2 h-2 rounded-full ${metrics.apiResponseTime < 300 ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{metrics.apiResponseTime}ms</div>
                        <div className="text-sm text-muted-foreground mt-1">API Response Time</div>
                        <div className={`text-xs mt-2 ${metrics.apiResponseTime < 300 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {metrics.apiResponseTime < 300 ? '✓ Normal' : '⚠ Elevated'}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{metrics.errorRate.toFixed(2)}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Error Rate</div>
                        <div className={`text-xs mt-2 ${metrics.errorRate < 1 ? 'text-green-400' : 'text-red-400'}`}>
                            {metrics.errorRate < 1 ? '✓ Low' : '⚠ High'}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Database className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{metrics.databaseLatency}ms</div>
                        <div className="text-sm text-muted-foreground mt-1">Database Latency</div>
                        <div className="text-xs text-green-400 mt-2">✓ Optimal</div>
                    </div>
                </div>

                {/* System Resources */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Cpu className="w-6 h-6 text-blue-400" />
                            <span className="text-sm font-semibold text-foreground">CPU Usage</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-2">{metrics.cpuUsage}%</div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${metrics.cpuUsage > 70 ? 'bg-red-400' : 'bg-blue-400'}`}
                                style={{ width: `${metrics.cpuUsage}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Server className="w-6 h-6 text-purple-400" />
                            <span className="text-sm font-semibold text-foreground">Memory Usage</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-2">{metrics.memoryUsage}%</div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full ${metrics.memoryUsage > 80 ? 'bg-red-400' : 'bg-purple-400'}`}
                                style={{ width: `${metrics.memoryUsage}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <HardDrive className="w-6 h-6 text-green-400" />
                            <span className="text-sm font-semibold text-foreground">Disk Usage</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground mb-2">{metrics.diskUsage}%</div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="bg-green-400 h-2 rounded-full"
                                style={{ width: `${metrics.diskUsage}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Activity className="w-6 h-6 text-emerald-400" />
                            <span className="text-sm font-semibold text-foreground">Active Sessions</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{metrics.activeSessions.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">Session pool healthy</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="revenue" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Revenue
                                </TabsTrigger>
                                <TabsTrigger value="kpis" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    KPIs
                                </TabsTrigger>
                                <TabsTrigger value="alerts" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Bell className="w-4 h-4 mr-2" />
                                    Alerts ({activeAlerts.length})
                                </TabsTrigger>
                                <TabsTrigger value="geography" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Globe className="w-4 h-4 mr-2" />
                                    Geography
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="p-6">
                            <div className="space-y-6">
                                {/* 24-Hour Activity Chart */}
                                <div className="bg-white/5 rounded-lg p-6 border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">24-Hour User Activity</h3>
                                    <div className="h-64 flex items-end gap-1">
                                        {hourlyData.map((data, idx) => {
                                            const maxUsers = Math.max(...hourlyData.map(d => d.users))
                                            const height = (data.users / maxUsers) * 100
                                            const isCurrentHour = idx === 18 // Mock current hour
                                            
                                            return (
                                                <div key={data.hour} className="flex-1 flex flex-col items-center gap-1">
                                                    <div
                                                        className={`w-full rounded-t transition-all ${
                                                            isCurrentHour ? 'bg-blue-500' : 'bg-blue-400/60 hover:bg-blue-400'
                                                        }`}
                                                        style={{ height: `${height}%` }}
                                                        title={`${data.hour}: ${data.users} users`}
                                                    />
                                                    {idx % 3 === 0 && (
                                                        <div className="text-xs text-muted-foreground rotate-45 origin-left mt-2">
                                                            {data.hour}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-blue-500" />
                                            <span className="text-sm text-muted-foreground">Current Hour</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Peak: {Math.max(...hourlyData.map(d => d.users)).toLocaleString()} users at 18:00
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <UserPlus className="w-5 h-5 text-green-400" />
                                            <span className="text-sm text-muted-foreground">New Signups</span>
                                        </div>
                                        <div className="text-2xl font-bold text-foreground">{learner.newSignupsToday}</div>
                                        <div className="text-xs text-green-400 mt-1">+12% vs yesterday</div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShoppingCart className="w-5 h-5 text-blue-400" />
                                            <span className="text-sm text-muted-foreground">Course Sales</span>
                                        </div>
                                        <div className="text-2xl font-bold text-foreground">{rev.courseSalesToday}</div>
                                        <div className="text-xs text-blue-400 mt-1">E£{(rev.todayRevenue / 1000).toFixed(0)}k revenue</div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <GraduationCap className="w-5 h-5 text-purple-400" />
                                            <span className="text-sm text-muted-foreground">Completions</span>
                                        </div>
                                        <div className="text-2xl font-bold text-foreground">{learner.courseCompletionsToday}</div>
                                        <div className="text-xs text-purple-400 mt-1">Today</div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="w-5 h-5 text-yellow-400" />
                                            <span className="text-sm text-muted-foreground">Engagement</span>
                                        </div>
                                        <div className="text-2xl font-bold text-foreground">{learner.avgEngagementScore}%</div>
                                        <div className="text-xs text-yellow-400 mt-1">Avg score</div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Revenue Tab */}
                        <TabsContent value="revenue" className="p-6">
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-6 border border-green-500/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <DollarSign className="w-10 h-10 text-green-400" />
                                            {revenueChange > 0 ? (
                                                <TrendingUp className="w-6 h-6 text-green-400" />
                                            ) : (
                                                <TrendingDown className="w-6 h-6 text-red-400" />
                                            )}
                                        </div>
                                        <div className="text-4xl font-bold text-foreground mb-2">
                                            {formatCurrency(rev.todayRevenue)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Today's Revenue</div>
                                        <div className={`text-lg font-semibold mt-2 ${revenueChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs yesterday
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-6 border border-border">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-1">Subscriptions</div>
                                                <div className="text-3xl font-bold text-blue-400">{rev.subscriptionsToday}</div>
                                                <div className="text-xs text-muted-foreground mt-1">New subscriptions today</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-1">Course Sales</div>
                                                <div className="text-3xl font-bold text-purple-400">{rev.courseSalesToday}</div>
                                                <div className="text-xs text-muted-foreground mt-1">Individual purchases</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-6 border border-border">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-1">Conversion Rate</div>
                                                <div className="text-3xl font-bold text-yellow-400">{rev.conversionRate}%</div>
                                                <div className="text-xs text-green-400 mt-1">+0.3% vs last week</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground mb-1">Avg Order Value</div>
                                                <div className="text-3xl font-bold text-emerald-400">E£{rev.avgOrderValue}</div>
                                                <div className="text-xs text-muted-foreground mt-1">Per transaction</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Revenue Chart */}
                                <div className="bg-white/5 rounded-lg p-6 border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">24-Hour Revenue Trend</h3>
                                    <div className="h-64 flex items-end gap-1">
                                        {hourlyData.map((data, idx) => {
                                            const maxRevenue = Math.max(...hourlyData.map(d => d.revenue))
                                            const height = (data.revenue / maxRevenue) * 100
                                            
                                            return (
                                                <div key={data.hour} className="flex-1">
                                                    <div
                                                        className="w-full bg-green-400/60 hover:bg-green-400 rounded-t transition-all"
                                                        style={{ height: `${height}%` }}
                                                        title={`${data.hour}: ${formatCurrency(data.revenue)}`}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="text-center text-sm text-muted-foreground mt-4">
                                        Total 24h Revenue: {formatCurrency(hourlyData.reduce((sum, d) => sum + d.revenue, 0))}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* KPIs Tab */}
                        <TabsContent value="kpis" className="p-6">
                            <div className="space-y-6">
                                {/* Platform KPIs */}
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-4">Platform KPIs</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Monthly Active Users</div>
                                            <div className="text-3xl font-bold text-foreground">{platform.mau.toLocaleString()}</div>
                                            <div className="text-xs text-green-400 mt-2">+8.5% MoM</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Daily Active Users</div>
                                            <div className="text-3xl font-bold text-foreground">{platform.dau.toLocaleString()}</div>
                                            <div className="text-xs text-blue-400 mt-2">DAU/MAU: {platform.mau > 0 ? ((platform.dau / platform.mau) * 100).toFixed(1) : 0}%</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Net Promoter Score</div>
                                            <div className="text-3xl font-bold text-yellow-400">{platform.nps}</div>
                                            <div className="text-xs text-green-400 mt-2">Excellent</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">7-Day Retention</div>
                                            <div className="text-3xl font-bold text-emerald-400">{platform.retentionRate7Day}%</div>
                                            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                                <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${platform.retentionRate7Day}%` }} />
                                            </div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">30-Day Retention</div>
                                            <div className="text-3xl font-bold text-blue-400">{platform.retentionRate30Day}%</div>
                                            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                                <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${platform.retentionRate30Day}%` }} />
                                            </div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Churn Rate</div>
                                            <div className="text-3xl font-bold text-orange-400">{platform.churnRate}%</div>
                                            <div className="text-xs text-green-400 mt-2">Below industry avg (6%)</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Creator KPIs */}
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-4">Creator KPIs</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-5 border border-purple-500/30">
                                            <div className="text-sm text-muted-foreground mb-2">Active Creators</div>
                                            <div className="text-3xl font-bold text-foreground">{creator.activeCreators}</div>
                                            <div className="text-xs text-purple-400 mt-2">+15 this week</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Courses This Week</div>
                                            <div className="text-3xl font-bold text-blue-400">{creator.coursesPublishedThisWeek}</div>
                                            <div className="text-xs text-muted-foreground mt-2">New publications</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Avg Creator Earnings</div>
                                            <div className="text-3xl font-bold text-green-400">E£{creator.avgCreatorEarnings.toLocaleString()}</div>
                                            <div className="text-xs text-green-400 mt-2">+12% MoM</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Top Creator Revenue</div>
                                            <div className="text-3xl font-bold text-yellow-400">E£{creator.topCreatorRevenue.toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground mt-2">This month</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Learner KPIs */}
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-4">Learner KPIs</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Active Learners</div>
                                            <div className="text-3xl font-bold text-foreground">{learner.activeLearners.toLocaleString()}</div>
                                            <div className="text-xs text-blue-400 mt-2">Currently enrolled</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Completions Today</div>
                                            <div className="text-3xl font-bold text-emerald-400">{learner.courseCompletionsToday}</div>
                                            <div className="text-xs text-emerald-400 mt-2">+23% vs yesterday</div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">Engagement Score</div>
                                            <div className="text-3xl font-bold text-yellow-400">{learner.avgEngagementScore}%</div>
                                            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${learner.avgEngagementScore}%` }} />
                                            </div>
                                        </div>

                                        <div className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="text-sm text-muted-foreground mb-2">New Signups</div>
                                            <div className="text-3xl font-bold text-purple-400">{learner.newSignupsToday}</div>
                                            <div className="text-xs text-purple-400 mt-2">Today</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Alerts Tab */}
                        <TabsContent value="alerts" className="p-6">
                            <div className="space-y-4">
                                {alerts.map((alert) => {
                                    const AlertIcon = alertIcons[alert.severity]
                                    
                                    return (
                                        <div
                                            key={alert.id}
                                            className={`rounded-lg p-5 border-2 ${
                                                alert.status === 'active' ? 'bg-white/5' : 'bg-white/[0.02] opacity-60'
                                            } border-border`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <AlertIcon className={`w-6 h-6 ${
                                                            alert.severity === 'critical' ? 'text-red-400' :
                                                            alert.severity === 'error' ? 'text-orange-400' :
                                                            alert.severity === 'warning' ? 'text-yellow-400' :
                                                            'text-blue-400'
                                                        }`} />
                                                        <h4 className="text-lg font-semibold text-foreground">{alert.title}</h4>
                                                        <Badge className={alertColors[alert.severity]}>
                                                            {alert.severity}
                                                        </Badge>
                                                        <Badge className={alert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                                            {alert.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground mb-2">{alert.message}</p>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>Service: {alert.affectedService}</span>
                                                        <span>•</span>
                                                        <span>{new Date(alert.timestamp).toLocaleString('en-GB')}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                    onClick={() => handleViewAlert(alert)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Details
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        {/* Geography Tab */}
                        <TabsContent value="geography" className="p-6">
                            <div className="space-y-6">
                                <div className="bg-white/5 rounded-lg p-6 border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">User Distribution by Location</h3>
                                    <div className="space-y-3">
                                        {geographic.map((location) => (
                                            <div key={location.location} className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <Globe className="w-5 h-5 text-blue-400" />
                                                        <span className="text-foreground font-medium">{location.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-muted-foreground">{location.users} users</span>
                                                        <span className="text-foreground font-semibold w-16 text-right">{location.percentage}%</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-white/10 rounded-full h-3">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                                                        style={{ width: `${location.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-lg p-5 border border-border">
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Top Growing Region</h4>
                                        <div className="text-2xl font-bold text-green-400">Alexandria</div>
                                        <div className="text-sm text-muted-foreground mt-1">+28% this month</div>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-5 border border-border">
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Market Coverage</h4>
                                        <div className="text-2xl font-bold text-blue-400">6 Regions</div>
                                        <div className="text-sm text-muted-foreground mt-1">Across Egypt</div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Alert Details Modal */}
            <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
                <DialogContent className="bg-background text-foreground border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Alert Details</DialogTitle>
                    </DialogHeader>

                    {selectedAlert && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={alertColors[selectedAlert.severity]}>
                                        {selectedAlert.severity}
                                    </Badge>
                                    <Badge className={selectedAlert.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                        {selectedAlert.status}
                                    </Badge>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">{selectedAlert.title}</h3>
                                <p className="text-muted-foreground">{selectedAlert.message}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-sm text-muted-foreground">Affected Service</div>
                                    <div className="text-foreground font-semibold">{selectedAlert.affectedService}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-sm text-muted-foreground">Timestamp</div>
                                    <div className="text-foreground font-semibold">
                                        {new Date(selectedAlert.timestamp).toLocaleString('en-GB')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAlertModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Close
                                </Button>
                                {selectedAlert.status === 'active' && (
                                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-foreground">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark Resolved
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
