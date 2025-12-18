'use client'

import React, { useState } from 'react'
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    CreditCard,
    MessageSquare,
    AlertTriangle,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCcw,
    DollarSign,
    FileText,
    Activity
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'

interface UserDetailsModalProps {
    user: {
        id: string
        name: string
        email: string
        phone?: string | null
        arabicName?: string | null
        role: string
        emailVerified: string | null
        phoneVerified: boolean
        onboardingCompleted: boolean
        createdAt: string
        _count: {
            enrollments: number
        }
        creator?: {
            _count: {
                courses: number
            }
        }
    }
    onClose: () => void
}

interface Subscription {
    id: string
    plan: 'all-access' | 'signature' | 'channel'
    status: 'active' | 'cancelled' | 'expired' | 'suspended'
    startDate: string
    renewalDate: string
    price: number
    autoRenew: boolean
}

interface Ticket {
    id: string
    ticketNumber: string
    subject: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    createdAt: string
}

interface RiskFlag {
    id: string
    type: 'chargeback' | 'payment_dispute' | 'abuse_report' | 'suspicious_activity' | 'multiple_accounts'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    createdAt: string
    status: 'open' | 'investigating' | 'resolved' | 'dismissed'
}

interface ActivityLog {
    id: string
    action: string
    details: string
    timestamp: string
    ipAddress?: string
}

// User details data - Will be populated from API when available
// TODO: Fetch subscriptions, tickets, risk flags, and activity from /api/admin/users/[id]/details
const EMPTY_SUBSCRIPTIONS: Subscription[] = []
const EMPTY_TICKETS: Ticket[] = []
const EMPTY_RISK_FLAGS: RiskFlag[] = []
const EMPTY_ACTIVITY: ActivityLog[] = []
    ]
}

const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-muted text-gray-800 border-border',
    expired: 'bg-red-100 text-red-800 border-red-200',
    suspended: 'bg-orange-100 text-orange-800 border-orange-200',
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-muted text-gray-800 border-border',
    investigating: 'bg-purple-100 text-purple-800 border-purple-200',
    dismissed: 'bg-muted text-gray-800 border-border'
}

const severityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
}

const priorityColors = {
    low: 'bg-muted text-gray-800 border-border',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
}

export default function EnhancedUserDetailsModal({ user, onClose }: UserDetailsModalProps) {
    const [activeTab, setActiveTab] = useState('overview')

    // Use empty arrays until API integration is complete
    const subscriptions = EMPTY_SUBSCRIPTIONS
    const tickets = EMPTY_TICKETS
    const riskFlags = EMPTY_RISK_FLAGS
    const activityLogs = EMPTY_ACTIVITY

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getPlanName = (plan: string) => {
        const names = {
            'all-access': 'All-Access Library',
            'signature': 'Signature Course',
            'channel': 'Creator Channel'
        }
        return names[plan as keyof typeof names] || plan
    }

    const getRiskTypeLabel = (type: string) => {
        const labels = {
            'chargeback': 'Chargeback',
            'payment_dispute': 'Payment Dispute',
            'abuse_report': 'Abuse Report',
            'suspicious_activity': 'Suspicious Activity',
            'multiple_accounts': 'Multiple Accounts'
        }
        return labels[type as keyof typeof labels] || type
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-foreground">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2">{user.name}</h2>
                                {user.arabicName && (
                                    <p className="text-purple-100 mb-2">{user.arabicName}</p>
                                )}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Badge className="bg-white/20 text-foreground border-white/30">
                                        {user.role}
                                    </Badge>
                                    {user.emailVerified && (
                                        <Badge className="bg-green-500/20 text-foreground border-green-400/30">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Email Verified
                                        </Badge>
                                    )}
                                    {user.onboardingCompleted && (
                                        <Badge className="bg-blue-500/20 text-foreground border-blue-400/30">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Onboarding Complete
                                        </Badge>
                                    )}
                                    {riskFlags.filter(f => f.status === 'open' || f.status === 'investigating').length > 0 && (
                                        <Badge className="bg-red-500/20 text-foreground border-red-400/30">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Risk Flags
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Enrollments</div>
                                <div className="text-2xl font-bold">{user._count.enrollments}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Active Subscriptions</div>
                                <div className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Support Tickets</div>
                                <div className="text-2xl font-bold">{tickets.length}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Risk Flags</div>
                                <div className="text-2xl font-bold">{riskFlags.filter(f => f.status !== 'resolved' && f.status !== 'dismissed').length}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <TabsList className="w-full justify-start border-b rounded-none bg-background p-0">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                                    <User className="w-4 h-4 mr-2" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="subscriptions" className="data-[state=active]:bg-background">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Subscriptions
                                </TabsTrigger>
                                <TabsTrigger value="tickets" className="data-[state=active]:bg-background">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Support Tickets
                                </TabsTrigger>
                                <TabsTrigger value="risks" className="data-[state=active]:bg-background">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Risk Flags
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="data-[state=active]:bg-background">
                                    <Activity className="w-4 h-4 mr-2" />
                                    Activity Log
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Overview Tab */}
                                <TabsContent value="overview" className="mt-0">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Email</div>
                                                        <div className="text-foreground">{user.email}</div>
                                                    </div>
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="text-sm text-muted-foreground">Phone</div>
                                                            <div className="text-foreground">{user.phone}</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Joined</div>
                                                        <div className="text-foreground">{formatDate(user.createdAt)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-foreground mb-4">Account Status</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Email Verified</span>
                                                    {user.emailVerified ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-600" />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Phone Verified</span>
                                                    {user.phoneVerified ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-600" />
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Onboarding</span>
                                                    {user.onboardingCompleted ? (
                                                        <Badge className="bg-green-100 text-green-800 border-green-200">Complete</Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Incomplete</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {user.creator && (
                                            <div>
                                                <h3 className="font-semibold text-foreground mb-4">Creator Stats</h3>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">Total Courses</span>
                                                        <span className="font-semibold">{user.creator._count.courses}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Subscriptions Tab */}
                                <TabsContent value="subscriptions" className="mt-0">
                                    <div className="space-y-4">
                                        {subscriptions.length > 0 ? (
                                            subscriptions.map((sub) => (
                                                <div key={sub.id} className="border border-border rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-semibold text-foreground">{getPlanName(sub.plan)}</h4>
                                                            <p className="text-sm text-muted-foreground">Started {formatDate(sub.startDate)}</p>
                                                        </div>
                                                        <Badge className={statusColors[sub.status]}>
                                                            {sub.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <div className="text-muted-foreground">Price</div>
                                                            <div className="font-semibold text-foreground">E£{sub.price}/mo</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Next Renewal</div>
                                                            <div className="font-semibold text-foreground">{formatDate(sub.renewalDate)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted-foreground">Auto-Renew</div>
                                                            <div className="font-semibold text-foreground">{sub.autoRenew ? 'Yes' : 'No'}</div>
                                                        </div>
                                                    </div>
                                                    {sub.status === 'active' && (
                                                        <div className="mt-3 flex gap-2">
                                                            <Button size="sm" variant="outline" className="text-xs">
                                                                <RefreshCcw className="w-3 h-3 mr-1" />
                                                                Manage
                                                            </Button>
                                                            <Button size="sm" variant="outline" className="text-xs text-red-600 hover:text-red-700">
                                                                Cancel Subscription
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-muted-foreground">No subscriptions found</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Support Tickets Tab */}
                                <TabsContent value="tickets" className="mt-0">
                                    <div className="space-y-3">
                                        {tickets.length > 0 ? (
                                            tickets.map((ticket) => (
                                                <div key={ticket.id} className="border border-border rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                                                                <Badge className={priorityColors[ticket.priority]}>
                                                                    {ticket.priority}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-medium text-foreground">{ticket.subject}</h4>
                                                        </div>
                                                        <Badge className={statusColors[ticket.status]}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatDate(ticket.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-muted-foreground">No support tickets found</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Risk Flags Tab */}
                                <TabsContent value="risks" className="mt-0">
                                    <div className="space-y-4">
                                        {riskFlags.length > 0 ? (
                                            riskFlags.map((flag) => (
                                                <div key={flag.id} className="border border-border rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge className={severityColors[flag.severity]}>
                                                                    {flag.severity} severity
                                                                </Badge>
                                                                <Badge className={statusColors[flag.status]}>
                                                                    {flag.status}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-semibold text-foreground mb-1">{getRiskTypeLabel(flag.type)}</h4>
                                                            <p className="text-sm text-muted-foreground">{flag.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            Flagged on {formatDate(flag.createdAt)}
                                                        </div>
                                                        {(flag.status === 'open' || flag.status === 'investigating') && (
                                                            <div className="flex gap-2">
                                                                <Button size="sm" variant="outline" className="text-xs">
                                                                    Investigate
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-xs">
                                                                    Dismiss
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-muted-foreground">No risk flags found</p>
                                                <p className="text-sm text-muted-foreground mt-1">This user has a clean record</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Activity Log Tab */}
                                <TabsContent value="activity" className="mt-0">
                                    <div className="space-y-2">
                                        {activityLogs.length > 0 ? (
                                            activityLogs.map((log) => (
                                                <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-background rounded-lg">
                                                    <div className="w-2 h-2 rounded-full bg-purple-600 mt-2"></div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-medium text-foreground">{log.action}</h4>
                                                            <span className="text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{log.details}</p>
                                                        {log.ipAddress && (
                                                            <p className="text-xs text-muted-foreground mt-1">IP: {log.ipAddress}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-muted-foreground">No activity logs found</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border p-4 bg-background flex items-center justify-end gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Message
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
