'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Shield,
    AlertTriangle,
    Ban,
    Flag,
    MessageSquare,
    FileText,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    User,
    MessageCircle,
    Video,
    Image as ImageIcon,
    TrendingUp,
    UserX,
    FileWarning,
    Lock,
    Unlock,
    Loader2,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

type ReportType = 'abuse' | 'spam' | 'copyright' | 'harassment' | 'inappropriate' | 'fraud'
type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
type ContentType = 'message' | 'post' | 'video' | 'comment' | 'profile'

interface Report {
    id: string
    type: ReportType
    status: ReportStatus
    contentType: ContentType
    reportedUser: string
    reportedBy: string
    description: string
    createdAt: string
    priority: 'low' | 'medium' | 'high' | 'critical'
}

interface Ban {
    id: string
    caseId: string
    userId: string
    userName: string
    userEmail: string
    banType: string
    duration: string
    reason: string
    evidence: string[]
    bannedAt: string
    expiresAt?: string
    bannedBy: string
    status: string
    appealStatus: string
}

interface DMCARequest {
    id: string
    caseNumber: string
    complainantName: string
    complainantEmail: string
    contentTitle: string
    status: string
    priority: string
    submittedAt: string
}

interface Strike {
    id: string
    creatorId: string
    contentType: string
    contentId: string
    reason: string
    severity: string
    issuedAt: string
    expiresAt?: string
    appealStatus?: string
}

interface AuditLog {
    id: string
    action: string
    module: string
    details: string
    status: string
    createdAt: string
    admin: {
        name: string
        email: string
    }
}

interface Stats {
    pendingReports: number
    criticalReports: number
    activeBans: number
    dmcaClaims: number
    activeStrikes: number
    avgResponseTime: string
}

export default function SafetyModerationPage() {
    const [activeTab, setActiveTab] = useState<'reports' | 'bans' | 'dmca' | 'strikes' | 'logs'>('reports')
    const [filterStatus, setFilterStatus] = useState<'all' | ReportStatus>('all')

    // Data states
    const [reports, setReports] = useState<Report[]>([])
    const [bans, setBans] = useState<Ban[]>([])
    const [dmcaRequests, setDmcaRequests] = useState<DMCARequest[]>([])
    const [strikes, setStrikes] = useState<Strike[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

    // Loading states
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Stats state
    const [stats, setStats] = useState<Stats>({
        pendingReports: 0,
        criticalReports: 0,
        activeBans: 0,
        dmcaClaims: 0,
        activeStrikes: 0,
        avgResponseTime: '0 hours'
    })

    // Fetch all data on mount
    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                fetchReports(),
                fetchBans(),
                fetchDMCA(),
                fetchStrikes(),
                fetchAuditLogs()
            ])
        } catch (error) {
            console.error('Error fetching safety data:', error)
            toast.error('Failed to load safety data')
        } finally {
            setLoading(false)
        }
    }

    const refreshData = async () => {
        setRefreshing(true)
        await fetchAllData()
        setRefreshing(false)
        toast.success('Data refreshed')
    }

    const fetchReports = async () => {
        try {
            const res = await fetch('/api/admin/safety/reports')
            if (res.ok) {
                const data = await res.json()
                setReports(data.reports || [])
                if (data.stats) {
                    setStats(prev => ({
                        ...prev,
                        pendingReports: data.stats.pending || 0,
                        criticalReports: data.reports?.filter((r: any) => r.priority === 'critical').length || 0
                    }))
                }
            }
        } catch (error) {
            console.error('Error fetching reports:', error)
        }
    }

    const fetchBans = async () => {
        try {
            const res = await fetch('/api/admin/safety/bans')
            if (res.ok) {
                const data = await res.json()
                setBans(data.bans || [])
                setStats(prev => ({
                    ...prev,
                    activeBans: data.stats?.totalActive || data.bans?.filter((b: any) => b.status === 'active').length || 0
                }))
            }
        } catch (error) {
            console.error('Error fetching bans:', error)
        }
    }

    const fetchDMCA = async () => {
        try {
            const res = await fetch('/api/admin/dmca')
            if (res.ok) {
                const data = await res.json()
                setDmcaRequests(data.requests || [])
                setStats(prev => ({
                    ...prev,
                    dmcaClaims: data.stats?.pending || data.requests?.length || 0
                }))
            }
        } catch (error) {
            console.error('Error fetching DMCA:', error)
        }
    }

    const fetchStrikes = async () => {
        try {
            const res = await fetch('/api/admin/strikes')
            if (res.ok) {
                const data = await res.json()
                setStrikes(data.strikes || [])
                setStats(prev => ({
                    ...prev,
                    activeStrikes: data.strikes?.length || 0
                }))
            }
        } catch (error) {
            console.error('Error fetching strikes:', error)
        }
    }

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch('/api/admin/audit-log?module=Safety&limit=50')
            if (res.ok) {
                const data = await res.json()
                setAuditLogs(data.logs || [])
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error)
        }
    }

    // Action handlers
    const handleUpdateReportStatus = async (reportId: string, status: string) => {
        try {
            const res = await fetch('/api/admin/safety/reports', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, status })
            })
            if (res.ok) {
                toast.success(`Report ${status}`)
                fetchReports()
            }
        } catch (error) {
            toast.error('Failed to update report')
        }
    }

    const handleLiftBan = async (banId: string) => {
        try {
            const res = await fetch('/api/admin/safety/bans', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banId, action: 'lift', reason: 'Lifted by admin' })
            })
            if (res.ok) {
                toast.success('Ban lifted')
                fetchBans()
            }
        } catch (error) {
            toast.error('Failed to lift ban')
        }
    }



    const getReportTypeColor = (type: ReportType) => {
        switch (type) {
            case 'abuse': return 'bg-red-600/20 text-red-400 border-red-600/30'
            case 'spam': return 'bg-orange-600/20 text-orange-400 border-orange-600/30'
            case 'copyright': return 'bg-purple-600/20 text-purple-400 border-purple-600/30'
            case 'harassment': return 'bg-pink-600/20 text-pink-400 border-pink-600/30'
            case 'inappropriate': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
            case 'fraud': return 'bg-red-700/20 text-red-500 border-red-700/30'
        }
    }

    const getStatusColor = (status: ReportStatus) => {
        switch (status) {
            case 'pending': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
            case 'reviewing': return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
            case 'resolved': return 'bg-green-600/20 text-green-400 border-green-600/30'
            case 'dismissed': return 'bg-gray-600/20 text-muted-foreground border-gray-600/30'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-600/20 text-red-400 border-red-600/30'
            case 'high': return 'bg-orange-600/20 text-orange-400 border-orange-600/30'
            case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
            case 'low': return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
        }
    }

    const getContentTypeIcon = (type: ContentType) => {
        switch (type) {
            case 'message': return MessageSquare
            case 'post': return FileText
            case 'video': return Video
            case 'comment': return MessageCircle
            case 'profile': return User
        }
    }

    const filteredReports = filterStatus === 'all'
        ? reports
        : reports.filter(r => r.status === filterStatus)

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Trust & Safety Center
                    </h1>
                    <p className="text-muted-foreground">
                        Content moderation, abuse reports, and safety management
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={refreshData}
                        disabled={refreshing}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                        <Filter className="w-4 h-4 mr-2" />
                        Advanced Filters
                    </Button>
                    <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-foreground">
                        <Shield className="w-4 h-4 mr-2" />
                        Safety Dashboard
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-600/20 rounded-xl p-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <span className="text-xs font-semibold text-red-400">CRITICAL</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.criticalReports}
                    </div>
                    <div className="text-xs text-muted-foreground">Critical Reports</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-yellow-600/20 rounded-xl p-2">
                            <Clock className="h-5 w-5 text-yellow-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.pendingReports}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending Reports</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-600/20 rounded-xl p-2">
                            <Ban className="h-5 w-5 text-purple-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.activeBans}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Bans</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600/20 rounded-xl p-2">
                            <FileWarning className="h-5 w-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.dmcaClaims}
                    </div>
                    <div className="text-xs text-muted-foreground">DMCA Claims</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-orange-600/20 rounded-xl p-2">
                            <Flag className="h-5 w-5 text-orange-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.activeStrikes}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Strikes</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-600/20 rounded-xl p-2">
                            <TrendingUp className="h-5 w-5 text-green-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.avgResponseTime}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Response</div>
                </motion.div>
            </div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-2"
            >
                <div className="flex gap-2">
                    {[
                        { id: 'reports' as const, label: 'Abuse Reports', icon: Flag },
                        { id: 'bans' as const, label: 'Bans & Appeals', icon: Ban },
                        { id: 'dmca' as const, label: 'DMCA Takedowns', icon: FileWarning },
                        { id: 'strikes' as const, label: 'Strike System', icon: AlertTriangle },
                        { id: 'logs' as const, label: 'Audit Logs', icon: FileText }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-red-600 to-pink-600 text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Reports Content */}
            {activeTab === 'reports' && (
                <div className="space-y-4">
                    {/* Filter Bar */}
                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-border rounded-xl p-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search reports..."
                                    className="w-full bg-white/10 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                />
                            </div>
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="bg-white/10 border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>

                    {/* Reports List */}
                    {filteredReports.map((report, index) => {
                        const ContentIcon = getContentTypeIcon(report.contentType)
                        return (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + index * 0.05 }}
                                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${report.priority === 'critical' ? 'bg-red-600/20' :
                                        report.priority === 'high' ? 'bg-orange-600/20' :
                                            report.priority === 'medium' ? 'bg-yellow-600/20' :
                                                'bg-blue-600/20'
                                        }`}>
                                        <ContentIcon className={`w-6 h-6 ${report.priority === 'critical' ? 'text-red-400' :
                                            report.priority === 'high' ? 'text-orange-400' :
                                                report.priority === 'medium' ? 'text-yellow-400' :
                                                    'text-blue-400'
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-foreground">
                                                Report #{report.id}
                                            </h3>
                                            <Badge className={getReportTypeColor(report.type) + ' capitalize'}>
                                                {report.type}
                                            </Badge>
                                            <Badge className={getStatusColor(report.status) + ' capitalize'}>
                                                {report.status}
                                            </Badge>
                                            <Badge className={getPriorityColor(report.priority) + ' capitalize'}>
                                                {report.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {report.description}
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Reported User</p>
                                                <p className="text-sm font-semibold text-foreground">{report.reportedUser}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Reported By</p>
                                                <p className="text-sm font-semibold text-foreground">{report.reportedBy}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Content Type</p>
                                                <p className="text-sm font-semibold text-foreground capitalize">{report.contentType}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {new Date(report.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleUpdateReportStatus(report.id, 'reviewing')}
                                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-foreground"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Review
                                            </Button>
                                            <Button
                                                onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-foreground"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Resolve
                                            </Button>
                                            <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-foreground">
                                                <Ban className="w-4 h-4 mr-2" />
                                                Ban User
                                            </Button>
                                            <Button
                                                onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                                className="bg-white/10 hover:bg-white/20 text-foreground"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Dismiss
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                    {filteredReports.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Flag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No reports found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Bans Content */}
            {activeTab === 'bans' && (
                <div className="space-y-4">
                    {bans.map((ban, index) => (
                        <motion.div
                            key={ban.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ban.status === 'active' ? 'bg-red-600/20' : 'bg-gray-600/20'
                                        }`}>
                                        <Ban className={`w-6 h-6 ${ban.status === 'active' ? 'text-red-400' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-foreground">{ban.userName}</h3>
                                            <Badge className={ban.status === 'active'
                                                ? 'bg-red-600/20 text-red-400 border-red-600/30'
                                                : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                                            }>
                                                {ban.status}
                                            </Badge>
                                            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                                                {ban.banType}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">{ban.userEmail}</p>
                                        <p className="text-sm text-foreground mb-3">{ban.reason}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Case ID</p>
                                                <p className="font-semibold text-foreground">{ban.caseId}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Duration</p>
                                                <p className="font-semibold text-foreground">{ban.duration}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Banned At</p>
                                                <p className="font-semibold text-foreground">{new Date(ban.bannedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Appeal Status</p>
                                                <p className="font-semibold text-foreground capitalize">{ban.appealStatus}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {ban.status === 'active' && (
                                    <Button
                                        onClick={() => handleLiftBan(ban.id)}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        <Unlock className="w-4 h-4 mr-2" />
                                        Lift Ban
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {bans.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <Ban className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No active bans</p>
                        </div>
                    )}
                </div>
            )}

            {/* DMCA Content */}
            {activeTab === 'dmca' && (
                <div className="space-y-4">
                    {dmcaRequests.map((dmca, index) => (
                        <motion.div
                            key={dmca.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-600/20">
                                    <FileWarning className="w-6 h-6 text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-foreground">Case #{dmca.caseNumber}</h3>
                                        <Badge className={
                                            dmca.status === 'PENDING' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                                                dmca.status === 'RESOLVED' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                                                    'bg-gray-600/20 text-gray-400 border-gray-600/30'
                                        }>
                                            {dmca.status}
                                        </Badge>
                                        <Badge className={
                                            dmca.priority === 'HIGH' ? 'bg-red-600/20 text-red-400 border-red-600/30' :
                                                dmca.priority === 'MEDIUM' ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' :
                                                    'bg-blue-600/20 text-blue-400 border-blue-600/30'
                                        }>
                                            {dmca.priority}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-foreground mb-2">Content: {dmca.contentTitle}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Complainant</p>
                                            <p className="font-semibold text-foreground">{dmca.complainantName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="font-semibold text-foreground">{dmca.complainantEmail}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Submitted</p>
                                            <p className="font-semibold text-foreground">{new Date(dmca.submittedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="bg-white/10 hover:bg-white/20">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {dmcaRequests.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileWarning className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No DMCA requests</p>
                        </div>
                    )}
                </div>
            )}

            {/* Strikes Content */}
            {activeTab === 'strikes' && (
                <div className="space-y-4">
                    {strikes.map((strike, index) => (
                        <motion.div
                            key={strike.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${strike.severity === 'CRITICAL' ? 'bg-red-600/20' :
                                    strike.severity === 'HIGH' ? 'bg-orange-600/20' :
                                        'bg-yellow-600/20'
                                    }`}>
                                    <AlertTriangle className={`w-6 h-6 ${strike.severity === 'CRITICAL' ? 'text-red-400' :
                                        strike.severity === 'HIGH' ? 'text-orange-400' :
                                            'text-yellow-400'
                                        }`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-bold text-foreground">Strike #{strike.id.slice(0, 8)}</h3>
                                        <Badge className={
                                            strike.severity === 'CRITICAL' ? 'bg-red-600/20 text-red-400 border-red-600/30' :
                                                strike.severity === 'HIGH' ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' :
                                                    'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                                        }>
                                            {strike.severity}
                                        </Badge>
                                        {strike.appealStatus && (
                                            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                                                Appeal: {strike.appealStatus}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-foreground mb-3">{strike.reason}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Content Type</p>
                                            <p className="font-semibold text-foreground">{strike.contentType}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Issued At</p>
                                            <p className="font-semibold text-foreground">{new Date(strike.issuedAt).toLocaleDateString()}</p>
                                        </div>
                                        {strike.expiresAt && (
                                            <div>
                                                <p className="text-xs text-muted-foreground">Expires At</p>
                                                <p className="font-semibold text-foreground">{new Date(strike.expiresAt).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {strikes.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No strikes issued</p>
                        </div>
                    )}
                </div>
            )}

            {/* Audit Logs Content */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-border">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Action</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Module</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Details</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Admin</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5">
                                        <td className="py-3 px-4">
                                            <Badge className={
                                                log.action.includes('BAN') ? 'bg-red-600/20 text-red-400 border-red-600/30' :
                                                    log.action.includes('LIFT') ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                                                        'bg-blue-600/20 text-blue-400 border-blue-600/30'
                                            }>
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-foreground">{log.module}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">{log.details}</td>
                                        <td className="py-3 px-4 text-sm text-foreground">{log.admin?.name || 'System'}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {auditLogs.length === 0 && !loading && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No audit logs found</p>
                        </div>
                    )}
                </div>
            )}



            {/* AI Moderation Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
            >
                <div className="flex items-start gap-4">
                    <div className="bg-purple-600/20 rounded-xl p-3">
                        <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            AI-Powered Moderation
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Automated content filtering and pattern detection for proactive safety management
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-semibold text-foreground">Message Filters</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Real-time chat moderation</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Video className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-semibold text-foreground">Content Scanning</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Automated video analysis</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserX className="w-4 h-4 text-red-400" />
                                    <span className="text-sm font-semibold text-foreground">Spam Detection</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Auto-ban spam accounts</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Lock className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold text-foreground">Age Safety</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Age-appropriate matching</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
