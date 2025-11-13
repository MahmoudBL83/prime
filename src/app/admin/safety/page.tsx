'use client'

import { useState } from 'react'
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
    Unlock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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

export default function SafetyModerationPage() {
    const [activeTab, setActiveTab] = useState<'reports' | 'bans' | 'dmca' | 'strikes' | 'logs'>('reports')
    const [filterStatus, setFilterStatus] = useState<'all' | ReportStatus>('all')

    const reports: Report[] = [
        {
            id: '1',
            type: 'harassment',
            status: 'pending',
            contentType: 'message',
            reportedUser: 'John Doe',
            reportedBy: 'Jane Smith',
            description: 'Repeated harassment in private messages',
            createdAt: '2024-10-15T10:30:00',
            priority: 'critical'
        },
        {
            id: '2',
            type: 'spam',
            status: 'reviewing',
            contentType: 'post',
            reportedUser: 'Spam Bot 123',
            reportedBy: 'Multiple Users',
            description: 'Posting promotional links in comments',
            createdAt: '2024-10-15T09:15:00',
            priority: 'high'
        },
        {
            id: '3',
            type: 'inappropriate',
            status: 'pending',
            contentType: 'video',
            reportedUser: 'Content Creator X',
            reportedBy: 'Sarah Johnson',
            description: 'Video contains inappropriate language',
            createdAt: '2024-10-15T08:45:00',
            priority: 'medium'
        },
        {
            id: '4',
            type: 'copyright',
            status: 'pending',
            contentType: 'video',
            reportedUser: 'Video Uploader',
            reportedBy: 'Copyright Holder',
            description: 'Unauthorized use of copyrighted material',
            createdAt: '2024-10-14T16:20:00',
            priority: 'high'
        },
        {
            id: '5',
            type: 'abuse',
            status: 'resolved',
            contentType: 'comment',
            reportedUser: 'Troll User',
            reportedBy: 'Community Member',
            description: 'Abusive language in course comments',
            createdAt: '2024-10-14T14:10:00',
            priority: 'medium'
        }
    ]

    const stats = {
        pendingReports: reports.filter(r => r.status === 'pending').length,
        criticalReports: reports.filter(r => r.priority === 'critical').length,
        activeBans: 12,
        dmcaClaims: 3,
        activeStrikes: 45,
        avgResponseTime: '2.5 hours'
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
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                activeTab === tab.id
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
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        report.priority === 'critical' ? 'bg-red-600/20' :
                                        report.priority === 'high' ? 'bg-orange-600/20' :
                                        report.priority === 'medium' ? 'bg-yellow-600/20' :
                                        'bg-blue-600/20'
                                    }`}>
                                        <ContentIcon className={`w-6 h-6 ${
                                            report.priority === 'critical' ? 'text-red-400' :
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
                                            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-foreground">
                                                <Eye className="w-4 h-4 mr-2" />
                                                Review
                                            </Button>
                                            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-foreground">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Resolve
                                            </Button>
                                            <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-foreground">
                                                <Ban className="w-4 h-4 mr-2" />
                                                Ban User
                                            </Button>
                                            <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Dismiss
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
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
