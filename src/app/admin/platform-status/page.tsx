'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Activity,
    Server,
    Database,
    Wifi,
    Users,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Zap,
    HardDrive,
    Cpu,
    MemoryStick
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SystemStatus {
    overall: 'healthy' | 'warning' | 'critical'
    services: {
        database: { status: 'up' | 'down' | 'degraded', latency: number, uptime: string }
        api: { status: 'up' | 'down' | 'degraded', latency: number, uptime: string }
        cdn: { status: 'up' | 'down' | 'degraded', latency: number, uptime: string }
        email: { status: 'up' | 'down' | 'degraded', latency: number, uptime: string }
    }
    metrics: {
        activeUsers: number
        totalRequests: number
        errorRate: number
        responseTime: number
    }
    resources: {
        cpu: number
        memory: number
        disk: number
        bandwidth: number
    }
    incidents: Array<{
        id: string
        title: string
        status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
        severity: 'low' | 'medium' | 'high' | 'critical'
        createdAt: string
        updatedAt: string
    }>
}

export default function PlatformStatusPage() {
    const [status, setStatus] = useState<SystemStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchStatus()
    }, [])

    const fetchStatus = async () => {
        try {
            setRefreshing(true)
            const response = await fetch('/api/admin/platform-status')
            if (response.ok) {
                const data = await response.json()
                setStatus(data)
            } else {
                // Mock data for demonstration
                setStatus({
                    overall: 'healthy',
                    services: {
                        database: { status: 'up', latency: 12, uptime: '99.9%' },
                        api: { status: 'up', latency: 45, uptime: '99.8%' },
                        cdn: { status: 'up', latency: 23, uptime: '99.9%' },
                        email: { status: 'degraded', latency: 120, uptime: '98.5%' }
                    },
                    metrics: {
                        activeUsers: 12543,
                        totalRequests: 2456789,
                        errorRate: 0.02,
                        responseTime: 145
                    },
                    resources: {
                        cpu: 67,
                        memory: 78,
                        disk: 45,
                        bandwidth: 82
                    },
                    incidents: [
                        {
                            id: '1',
                            title: 'Email service experiencing delays',
                            status: 'monitoring',
                            severity: 'medium',
                            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                            updatedAt: new Date().toISOString()
                        }
                    ]
                })
            }
        } catch (error) {
            console.error('Failed to fetch platform status:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'up':
            case 'healthy':
            case 'resolved':
                return 'text-green-400'
            case 'degraded':
            case 'warning':
            case 'investigating':
                return 'text-yellow-400'
            case 'down':
            case 'critical':
            case 'identified':
                return 'text-red-400'
            default:
                return 'text-gray-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'up':
            case 'healthy':
            case 'resolved':
                return CheckCircle
            case 'degraded':
            case 'warning':
            case 'investigating':
                return AlertTriangle
            case 'down':
            case 'critical':
            case 'identified':
                return XCircle
            default:
                return Clock
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'low':
                return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
            case 'medium':
                return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
            case 'high':
                return 'bg-orange-600/20 text-orange-400 border-orange-600/30'
            case 'critical':
                return 'bg-red-600/20 text-red-400 border-red-600/30'
            default:
                return 'bg-gray-600/20 text-gray-400 border-gray-600/30'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!status) {
        return (
            <div className="min-h-screen p-8">
                <div className="text-foreground">Unable to load platform status.</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Platform Status
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time monitoring of system health and performance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.overall === 'healthy' ? 'bg-green-400' : status.overall === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                        <span className="text-sm text-muted-foreground capitalize">
                            {status.overall}
                        </span>
                    </div>
                    <Button
                        onClick={fetchStatus}
                        disabled={refreshing}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </motion.div>

            {/* Service Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(status.services).map(([service, data]) => {
                    const Icon = getStatusIcon(data.status)
                    return (
                        <motion.div
                            key={service}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                        data.status === 'up' ? 'bg-green-600/20' :
                                        data.status === 'degraded' ? 'bg-yellow-600/20' : 'bg-red-600/20'
                                    }`}>
                                        {service === 'database' && <Database className="w-5 h-5 text-current" />}
                                        {service === 'api' && <Server className="w-5 h-5 text-current" />}
                                        {service === 'cdn' && <Wifi className="w-5 h-5 text-current" />}
                                        {service === 'email' && <Activity className="w-5 h-5 text-current" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground capitalize">{service}</h3>
                                        <p className="text-xs text-muted-foreground">{data.uptime} uptime</p>
                                    </div>
                                </div>
                                <Icon className={`w-5 h-5 ${getStatusColor(data.status)}`} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Latency</span>
                                    <span className="text-foreground">{data.latency}ms</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge className={`${data.status === 'up' ? 'bg-green-600/20 text-green-400' : data.status === 'degraded' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-red-600/20 text-red-400'}`}>
                                        {data.status}
                                    </Badge>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Metrics and Resources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Metrics */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <h3 className="text-xl font-bold text-foreground mb-6">Key Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-blue-400" />
                                <span className="text-muted-foreground">Active Users</span>
                            </div>
                            <span className="text-foreground font-semibold">{status.metrics.activeUsers.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-green-400" />
                                <span className="text-muted-foreground">Total Requests</span>
                            </div>
                            <span className="text-foreground font-semibold">{status.metrics.totalRequests.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <span className="text-muted-foreground">Error Rate</span>
                            </div>
                            <span className="text-foreground font-semibold">{status.metrics.errorRate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-purple-400" />
                                <span className="text-muted-foreground">Avg Response Time</span>
                            </div>
                            <span className="text-foreground font-semibold">{status.metrics.responseTime}ms</span>
                        </div>
                    </div>
                </motion.div>

                {/* Resource Usage */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <h3 className="text-xl font-bold text-foreground mb-6">Resource Usage</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-muted-foreground">CPU</span>
                                </div>
                                <span className="text-sm text-foreground">{status.resources.cpu}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${status.resources.cpu}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <MemoryStick className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-muted-foreground">Memory</span>
                                </div>
                                <span className="text-sm text-foreground">{status.resources.memory}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-green-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${status.resources.memory}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm text-muted-foreground">Disk</span>
                                </div>
                                <span className="text-sm text-foreground">{status.resources.disk}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${status.resources.disk}%` }}
                                ></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm text-muted-foreground">Bandwidth</span>
                                </div>
                                <span className="text-sm text-foreground">{status.resources.bandwidth}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-purple-400 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${status.resources.bandwidth}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Active Incidents */}
            {status.incidents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <h3 className="text-xl font-bold text-foreground mb-6">Active Incidents</h3>
                    <div className="space-y-4">
                        {status.incidents.map((incident) => {
                            const StatusIcon = getStatusIcon(incident.status)
                            return (
                                <div
                                    key={incident.id}
                                    className="flex items-start gap-4 p-4 bg-white/5 border border-border rounded-xl"
                                >
                                    <StatusIcon className={`w-5 h-5 mt-1 ${getStatusColor(incident.status)}`} />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <h4 className="font-semibold text-foreground">{incident.title}</h4>
                                            <Badge className={getSeverityColor(incident.severity)}>
                                                {incident.severity}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <span>Status: <span className={getStatusColor(incident.status)}>{incident.status}</span></span>
                                            <span>Started: {new Date(incident.createdAt).toLocaleString()}</span>
                                            <span>Updated: {new Date(incident.updatedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    )
}