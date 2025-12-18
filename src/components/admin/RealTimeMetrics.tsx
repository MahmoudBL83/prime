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
            bgColor: 'bg-green-500/10',
            pulse: true
        },
        {
            label: 'DAU',
            value: metrics.dailyActiveUsers,
            icon: Activity,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
        },
        {
            label: 'New Signups',
            value: metrics.newSignups,
            icon: UserPlus,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10'
        },
        {
            label: "Today's Revenue",
            value: `${metrics.todayRevenue.toLocaleString()} EGP`,
            icon: DollarSign,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10'
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
                        className={`${stat.bgColor} rounded-xl p-4 border border-gray-700/50`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            {stat.pulse && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-white">
                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </p>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Additional Stats */}
            {showDetailedStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {additionalStats.map((stat, i) => (
                        <div
                            key={i}
                            className="bg-gray-800/50 rounded-lg p-3 flex items-center gap-3"
                        >
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <div>
                                <p className="text-lg font-semibold text-white">
                                    {stat.value.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Activity Feed */}
            {metrics.recentActivity && metrics.recentActivity.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-400">Recent Activity</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {metrics.recentActivity.slice(0, 5).map(activity => (
                            <div
                                key={activity.id}
                                className="text-sm text-gray-300 py-1 px-2 bg-gray-800/30 rounded flex items-center gap-2"
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${activity.type === 'signup' ? 'bg-green-500' :
                                        activity.type === 'purchase' ? 'bg-yellow-500' :
                                            activity.type === 'enrollment' ? 'bg-blue-500' :
                                                'bg-purple-500'
                                    }`} />
                                {activity.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
