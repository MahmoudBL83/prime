'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    Activity,
    Users,
    TrendingUp,
    DollarSign,
    Eye,
    UserPlus,
    ShoppingCart,
    AlertCircle
} from 'lucide-react'

interface MetricData {
    activeUsers: number
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    newSignups: number
    activeSubscriptions: number
    todayRevenue: number
    onlineCreators: number
    pendingReviews: number
    recentActivity: ActivityItem[]
}

interface ActivityItem {
    id: string
    type: 'signup' | 'purchase' | 'enrollment' | 'review'
    message: string
    timestamp: Date
}

interface RealTimeMetricsProps {
    className?: string
    refreshInterval?: number // milliseconds
    showDetailedStats?: boolean
}

export default function RealTimeMetrics({
    className = '',
    refreshInterval = 30000,
    showDetailedStats = true
}: RealTimeMetricsProps) {
    const { data: session } = useSession()
    const [metrics, setMetrics] = useState<MetricData | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch metrics via REST API (fallback)
    const fetchMetrics = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/metrics/realtime')
            if (response.ok) {
                const data = await response.json()
                setMetrics(data)
                setLastUpdate(new Date())
            }
        } catch (error) {
            console.error('Failed to fetch metrics:', error)
        }
    }, [])

    // Initialize Socket.io connection
    useEffect(() => {
        if (!session?.user || session.user.role !== 'ADMIN') return

        // Try WebSocket connection first
        const connectWebSocket = () => {
            try {
                const wsUrl = process.env.NEXT_PUBLIC_WS_URL ||
                    (typeof window !== 'undefined'
                        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/socket/metrics`
                        : null)

                if (!wsUrl) {
                    // Fall back to polling
                    fetchMetrics()
                    intervalRef.current = setInterval(fetchMetrics, refreshInterval)
                    return
                }

                socketRef.current = new WebSocket(wsUrl)

                socketRef.current.onopen = () => {
                    setIsConnected(true)
                }

                socketRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)
                        if (data.type === 'metrics') {
                            setMetrics(data.payload)
                            setLastUpdate(new Date())
                        }
                    } catch (e) {
                        console.error('Failed to parse metrics:', e)
                    }
                }

                socketRef.current.onclose = () => {
                    setIsConnected(false)
                    // Reconnect after delay
                    setTimeout(connectWebSocket, 5000)
                }

                socketRef.current.onerror = () => {
                    setIsConnected(false)
                    // Fall back to polling
                    fetchMetrics()
                    intervalRef.current = setInterval(fetchMetrics, refreshInterval)
                }
            } catch (error) {
                // Fall back to polling
                fetchMetrics()
                intervalRef.current = setInterval(fetchMetrics, refreshInterval)
            }
        }

        connectWebSocket()

        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [session, fetchMetrics, refreshInterval])

    // Initial fetch
    useEffect(() => {
        if (session?.user?.role === 'ADMIN') {
            fetchMetrics()
        }
    }, [session, fetchMetrics])

    if (!metrics) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-gray-800 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    const statCards = [
        {
            label: 'Active Now',
            value: metrics.activeUsers,
            icon: Users,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10 hover:bg-green-500/20',
            pulse: true
        },
        {
            label: 'DAU',
            value: metrics.dailyActiveUsers,
            icon: Activity,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10 hover:bg-blue-500/20'
        },
        {
            label: 'New Signups',
            value: metrics.newSignups,
            icon: UserPlus,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10 hover:bg-purple-500/20'
        },
        {
            label: "Today's Revenue",
            value: `${metrics.todayRevenue.toLocaleString()} EGP`,
            icon: DollarSign,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20'
        }
    ]

    const additionalStats = [
        {
            label: 'WAU',
            value: metrics.weeklyActiveUsers,
            icon: TrendingUp,
            color: 'text-cyan-400'
        },
        {
            label: 'MAU',
            value: metrics.monthlyActiveUsers,
            icon: Eye,
            color: 'text-pink-400'
        },
        {
            label: 'Active Subscriptions',
            value: metrics.activeSubscriptions,
            icon: ShoppingCart,
            color: 'text-orange-400'
        },
        {
            label: 'Pending Reviews',
            value: metrics.pendingReviews,
            icon: AlertCircle,
            color: metrics.pendingReviews > 10 ? 'text-red-400' : 'text-gray-400'
        }
    ]

    return (
        <div className={className}>
            {/* Connection Status */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Real-Time Metrics</h3>
                <div className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                    <span className="text-gray-400">
                        {isConnected ? 'Live' : 'Polling'}
                    </span>
                    {lastUpdate && (
                        <span className="text-gray-500">
                            • Updated {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {statCards.map((stat, i) => (
                    <div
                        key={i}
                        className={`relative group ${stat.bgColor} backdrop-blur-xl rounded-2xl p-5 border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-xl bg-white/5`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            {stat.pulse && (
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            )}
                        </div>
                        <p className="relative text-3xl font-black text-white mb-1 tracking-tight">
                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </p>
                        <p className="relative text-sm font-medium text-gray-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            {showDetailedStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {additionalStats.map((stat, i) => (
                        <div
                            key={i}
                            className="bg-white/5 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/5 hover:bg-white/10 transition-all group"
                        >
                            <div className={`p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">
                                    {stat.value.toLocaleString()}
                                </p>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Activity Feed */}
            {metrics.recentActivity && metrics.recentActivity.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Activity Stream</h4>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-purple-500" />
                            <div className="w-1 h-1 rounded-full bg-purple-500/50" />
                            <div className="w-1 h-1 rounded-full bg-purple-500/20" />
                        </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {metrics.recentActivity.slice(0, 8).map(activity => (
                            <div
                                key={activity.id}
                                className="group text-sm text-gray-300 p-3 bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl flex items-center gap-4 transition-all hover:bg-white/10"
                            >
                                <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${activity.type === 'signup' ? 'bg-green-500 shadow-green-500/20' :
                                    activity.type === 'purchase' ? 'bg-yellow-500 shadow-yellow-500/20' :
                                        activity.type === 'enrollment' ? 'bg-blue-500 shadow-blue-500/20' :
                                            'bg-purple-500 shadow-purple-500/20'
                                    }`} />
                                <span className="flex-1 font-medium">{activity.message}</span>
                                <span className="text-[10px] text-gray-500 font-mono">JUST NOW</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
