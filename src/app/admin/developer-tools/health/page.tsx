'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Server,
    Database,
    Cpu,
    HardDrive,
    Wifi,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Activity,
    Zap
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface HealthMetric {
    name: string
    status: 'healthy' | 'warning' | 'critical'
    value: string
    unit: string
    description: string
    icon: any
}

interface SystemHealth {
    overall: 'healthy' | 'warning' | 'critical'
    services: HealthMetric[]
    lastUpdated: string
}

export default function HealthMonitorPage() {
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [loading, setLoading] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(false)

    useEffect(() => {
        fetchHealth()
        if (autoRefresh) {
            const interval = setInterval(fetchHealth, 30000) // Refresh every 30 seconds
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    const fetchHealth = async () => {
        try {
            const response = await fetch('/api/admin/developer-tools/health')
            if (response.ok) {
                const data = await response.json()
                setHealth(data)
            }
        } catch (error) {
            console.error('Failed to fetch health data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-green-400'
            case 'warning': return 'text-yellow-400'
            case 'critical': return 'text-red-400'
            default: return 'text-muted-foreground'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="w-5 h-5 text-green-400" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />
            case 'critical': return <XCircle className="w-5 h-5 text-red-400" />
            default: return <Activity className="w-5 h-5 text-muted-foreground" />
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
                        System Health Monitor
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time monitoring of system performance and service health
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`${
                            autoRefresh
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-foreground'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                        {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
                    </Button>
                    <Button
                        onClick={fetchHealth}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Now
                    </Button>
                </div>
            </motion.div>

            {/* Overall Status */}
            {health && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-foreground">System Status</h2>
                        <div className="flex items-center gap-2">
                            {getStatusIcon(health.overall)}
                            <Badge variant={
                                health.overall === 'healthy' ? 'default' :
                                health.overall === 'warning' ? 'secondary' : 'destructive'
                            }>
                                {health.overall.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(health.lastUpdated).toLocaleString()}
                    </p>
                </motion.div>
            )}

            {/* Health Metrics Grid */}
            {health && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {health.services.map((service, index) => (
                        <motion.div
                            key={service.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <service.icon className="w-6 h-6 text-foreground" />
                                </div>
                                {getStatusIcon(service.status)}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">{service.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-foreground">{service.value}</span>
                                    <span className="text-sm text-muted-foreground">{service.unit}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Performance Charts Placeholder */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-foreground mb-6">Performance Trends</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-white/5 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">CPU Usage Chart</p>
                            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                        </div>
                    </div>
                    <div className="h-64 bg-white/5 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                            <Database className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Memory Usage Chart</p>
                            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Alerts Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-foreground mb-6">Recent Alerts</h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-sm font-medium text-foreground">All systems operational</p>
                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <div>
                            <p className="text-sm font-medium text-foreground">High memory usage detected</p>
                            <p className="text-xs text-muted-foreground">15 minutes ago</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}