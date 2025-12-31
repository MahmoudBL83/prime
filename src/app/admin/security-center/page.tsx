'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Shield,
    AlertTriangle,
    Lock,
    Eye,
    UserX,
    Key,
    Activity,
    Clock,
    RefreshCw,
    CheckCircle,
    XCircle,
    Settings,
    Users,
    FileText,
    Globe
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SecurityMetrics {
    totalUsers: number
    activeSessions: number
    failedLogins: number
    suspiciousActivities: number
    blockedIPs: number
    activeThreats: number
}

interface SecurityEvent {
    id: string
    type: 'login_attempt' | 'suspicious_activity' | 'threat_detected' | 'policy_violation'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    userId?: string
    ipAddress: string
    timestamp: string
    status: 'active' | 'resolved' | 'investigating'
}

interface SecurityPolicy {
    id: string
    name: string
    description: string
    enabled: boolean
    lastUpdated: string
}

export default function SecurityCenterPage() {
    const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
    const [events, setEvents] = useState<SecurityEvent[]>([])
    const [policies, setPolicies] = useState<SecurityPolicy[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchSecurityData()
    }, [])

    const fetchSecurityData = async () => {
        try {
            setRefreshing(true)
            const [metricsRes, eventsRes, policiesRes] = await Promise.all([
                fetch('/api/admin/security/metrics'),
                fetch('/api/admin/security/events'),
                fetch('/api/admin/security/policies')
            ])

            if (metricsRes.ok) {
                const metricsData = await metricsRes.json()
                setMetrics(metricsData)
            } else {
                // Mock data
                setMetrics({
                    totalUsers: 15420,
                    activeSessions: 2341,
                    failedLogins: 45,
                    suspiciousActivities: 12,
                    blockedIPs: 23,
                    activeThreats: 3
                })
            }

            if (eventsRes.ok) {
                const eventsData = await eventsRes.json()
                setEvents(eventsData)
            } else {
                // Mock events
                setEvents([
                    {
                        id: '1',
                        type: 'threat_detected',
                        severity: 'high',
                        description: 'Multiple failed login attempts from IP 192.168.1.100',
                        ipAddress: '192.168.1.100',
                        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                        status: 'investigating'
                    },
                    {
                        id: '2',
                        type: 'suspicious_activity',
                        severity: 'medium',
                        description: 'Unusual API usage pattern detected for user ID 12345',
                        userId: '12345',
                        ipAddress: '10.0.0.50',
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        status: 'active'
                    },
                    {
                        id: '3',
                        type: 'login_attempt',
                        severity: 'low',
                        description: 'Failed login attempt from unknown device',
                        ipAddress: '203.0.113.1',
                        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                        status: 'resolved'
                    }
                ])
            }

            if (policiesRes.ok) {
                const policiesData = await policiesRes.json()
                setPolicies(policiesData)
            } else {
                // Mock policies
                setPolicies([
                    {
                        id: '1',
                        name: 'Multi-Factor Authentication',
                        description: 'Require MFA for all admin accounts',
                        enabled: true,
                        lastUpdated: new Date().toISOString()
                    },
                    {
                        id: '2',
                        name: 'Password Policy',
                        description: 'Minimum 12 characters, complexity requirements',
                        enabled: true,
                        lastUpdated: new Date().toISOString()
                    },
                    {
                        id: '3',
                        name: 'IP Whitelisting',
                        description: 'Restrict admin access to whitelisted IPs',
                        enabled: false,
                        lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: '4',
                        name: 'Session Timeout',
                        description: 'Auto-logout after 30 minutes of inactivity',
                        enabled: true,
                        lastUpdated: new Date().toISOString()
                    }
                ])
            }
        } catch (error) {
            console.error('Failed to fetch security data:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
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

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'login_attempt':
                return Key
            case 'suspicious_activity':
                return Eye
            case 'threat_detected':
                return AlertTriangle
            case 'policy_violation':
                return FileText
            default:
                return Activity
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'text-red-400'
            case 'investigating':
                return 'text-yellow-400'
            case 'resolved':
                return 'text-green-400'
            default:
                return 'text-gray-400'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(6)].map((_, i) => (
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
                        Security Center
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor threats, manage policies, and protect your platform
                    </p>
                </div>
                <Button
                    onClick={fetchSecurityData}
                    disabled={refreshing}
                    className="bg-white/10 hover:bg-white/20 text-foreground"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </motion.div>

            {/* Security Metrics */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Total Users</h3>
                                <p className="text-2xl font-bold text-foreground">{metrics.totalUsers.toLocaleString()}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Active Sessions</h3>
                                <p className="text-2xl font-bold text-foreground">{metrics.activeSessions.toLocaleString()}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                                <UserX className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Failed Logins</h3>
                                <p className="text-2xl font-bold text-foreground">{metrics.failedLogins}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Suspicious Activities</h3>
                                <p className="text-2xl font-bold text-foreground">{metrics.suspiciousActivities}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Blocked IPs</h3>
                                <p className="text-2xl font-bold text-foreground">{metrics.blockedIPs}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Active Threats</h3>
                                <p className="text-2xl font-bold text-foreground">{metrics.activeThreats}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Security Events */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-foreground mb-6">Recent Security Events</h3>
                <div className="space-y-4">
                    {events.map((event) => {
                        const EventIcon = getEventIcon(event.type)
                        return (
                            <div
                                key={event.id}
                                className="flex items-start gap-4 p-4 bg-white/5 border border-border rounded-xl"
                            >
                                <EventIcon className="w-5 h-5 mt-1 text-muted-foreground" />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-foreground">{event.description}</h4>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span>IP: {event.ipAddress}</span>
                                                {event.userId && <span>User ID: {event.userId}</span>}
                                                <span>{new Date(event.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getSeverityColor(event.severity)}>
                                                {event.severity}
                                            </Badge>
                                            <span className={`text-sm ${getStatusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Security Policies */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-foreground mb-6">Security Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {policies.map((policy) => (
                        <div
                            key={policy.id}
                            className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${policy.enabled ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                                <div>
                                    <h4 className="font-semibold text-foreground">{policy.name}</h4>
                                    <p className="text-sm text-muted-foreground">{policy.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                    Updated {new Date(policy.lastUpdated).toLocaleDateString()}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/10 hover:bg-white/20"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}