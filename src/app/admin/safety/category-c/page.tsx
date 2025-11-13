'use client'

import React, { useState } from 'react'
import {
    AlertTriangle,
    TrendingDown,
    Flag,
    Eye,
    EyeOff,
    Ban,
    CheckCircle,
    XCircle,
    Activity,
    BarChart3,
    Clock,
    MessageSquare,
    Upload,
    Users,
    Filter,
    Download,
    Shield
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
import { Textarea } from '@/components/ui/textarea'

type ChannelStatus = 'monitoring' | 'warning_issued' | 'escalated' | 'suspended'
type ViolationType = 'spam' | 'policy_violation' | 'quality_decline' | 'copyright' | 'harassment'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

interface FlaggedChannel {
    id: string
    creatorId: string
    creatorName: string
    channelName: string
    status: ChannelStatus
    riskLevel: RiskLevel
    flaggedDate: string
    lastActivity: string
    violations: {
        type: ViolationType
        count: number
        lastOccurrence: string
        severity: 'minor' | 'moderate' | 'severe'
    }[]
    metrics: {
        avgQualityScore: number
        completionRate: number
        refundRate: number
        negativeReviews: number
        spamReports: number
    }
    automatedFlags: string[]
    manualReviews: number
    warningsIssued: number
    contentCount: number
    subscriberCount: number
}

const MOCK_FLAGGED_CHANNELS: FlaggedChannel[] = [
    {
        id: 'CH-1001',
        creatorId: 'creator-789',
        creatorName: 'Ahmed Marketing',
        channelName: 'Quick Money Online',
        status: 'escalated',
        riskLevel: 'critical',
        flaggedDate: '2024-10-10T08:00:00Z',
        lastActivity: '2024-10-16T14:30:00Z',
        violations: [
            { type: 'spam', count: 15, lastOccurrence: '2024-10-16T14:30:00Z', severity: 'severe' },
            { type: 'policy_violation', count: 8, lastOccurrence: '2024-10-15T10:00:00Z', severity: 'severe' },
            { type: 'quality_decline', count: 12, lastOccurrence: '2024-10-14T16:00:00Z', severity: 'moderate' }
        ],
        metrics: {
            avgQualityScore: 42,
            completionRate: 18,
            refundRate: 45,
            negativeReviews: 23,
            spamReports: 18
        },
        automatedFlags: [
            'Misleading course titles detected (10 instances)',
            'Excessive promotional content (spam score: 85%)',
            'Content quality below threshold (avg: 42/100)',
            'High refund rate pattern (45% vs platform avg 8%)',
            'Duplicate content uploaded across multiple courses'
        ],
        manualReviews: 3,
        warningsIssued: 2,
        contentCount: 12,
        subscriberCount: 450
    },
    {
        id: 'CH-1002',
        creatorId: 'creator-654',
        creatorName: 'Dr. Fatma Tech',
        channelName: 'Web Development Bootcamp',
        status: 'warning_issued',
        riskLevel: 'medium',
        flaggedDate: '2024-10-12T10:00:00Z',
        lastActivity: '2024-10-16T09:00:00Z',
        violations: [
            { type: 'quality_decline', count: 5, lastOccurrence: '2024-10-15T12:00:00Z', severity: 'moderate' },
            { type: 'copyright', count: 2, lastOccurrence: '2024-10-13T08:00:00Z', severity: 'moderate' }
        ],
        metrics: {
            avgQualityScore: 68,
            completionRate: 55,
            refundRate: 15,
            negativeReviews: 8,
            spamReports: 2
        },
        automatedFlags: [
            'Recent quality decline detected (from 85 to 68 in 2 weeks)',
            'Copyright claim filed by external party',
            'Code examples match existing tutorials (similarity: 78%)'
        ],
        manualReviews: 1,
        warningsIssued: 1,
        contentCount: 6,
        subscriberCount: 1250
    },
    {
        id: 'CH-1003',
        creatorId: 'creator-321',
        creatorName: 'Sara Business',
        channelName: 'Entrepreneur Academy',
        status: 'monitoring',
        riskLevel: 'low',
        flaggedDate: '2024-10-14T15:00:00Z',
        lastActivity: '2024-10-16T18:00:00Z',
        violations: [
            { type: 'policy_violation', count: 2, lastOccurrence: '2024-10-14T15:00:00Z', severity: 'minor' }
        ],
        metrics: {
            avgQualityScore: 82,
            completionRate: 78,
            refundRate: 5,
            negativeReviews: 3,
            spamReports: 1
        },
        automatedFlags: [
            'Minor promotional content in course materials',
            'External links to personal website (guideline reminder sent)'
        ],
        manualReviews: 0,
        warningsIssued: 0,
        contentCount: 8,
        subscriberCount: 2100
    },
    {
        id: 'CH-1004',
        creatorId: 'creator-987',
        creatorName: 'Omar Fitness',
        channelName: 'Health & Wellness Pro',
        status: 'escalated',
        riskLevel: 'high',
        flaggedDate: '2024-10-08T12:00:00Z',
        lastActivity: '2024-10-16T20:00:00Z',
        violations: [
            { type: 'policy_violation', count: 6, lastOccurrence: '2024-10-16T20:00:00Z', severity: 'severe' },
            { type: 'harassment', count: 4, lastOccurrence: '2024-10-15T14:00:00Z', severity: 'severe' }
        ],
        metrics: {
            avgQualityScore: 55,
            completionRate: 45,
            refundRate: 22,
            negativeReviews: 12,
            spamReports: 8
        },
        automatedFlags: [
            'Medical claims without proper credentials',
            'Harassment reports from students (4 confirmed cases)',
            'Aggressive sales tactics in course content',
            'Unverified health claims flagged by automated system'
        ],
        manualReviews: 2,
        warningsIssued: 2,
        contentCount: 10,
        subscriberCount: 890
    }
]

const statusColors = {
    monitoring: 'bg-blue-100 text-blue-800 border-blue-200',
    warning_issued: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    escalated: 'bg-orange-100 text-orange-800 border-orange-200',
    suspended: 'bg-red-100 text-red-800 border-red-200'
}

const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
}

const violationColors = {
    spam: 'bg-purple-100 text-purple-800 border-purple-200',
    policy_violation: 'bg-red-100 text-red-800 border-red-200',
    quality_decline: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    copyright: 'bg-orange-100 text-orange-800 border-orange-200',
    harassment: 'bg-red-100 text-red-800 border-red-200'
}

export default function CategoryCMonitoringPage() {
    const [activeTab, setActiveTab] = useState('critical')
    const [channels] = useState<FlaggedChannel[]>(MOCK_FLAGGED_CHANNELS)
    const [selectedChannel, setSelectedChannel] = useState<FlaggedChannel | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showActionModal, setShowActionModal] = useState(false)
    const [actionType, setActionType] = useState<'warning' | 'escalate' | 'restrict' | 'suspend'>('warning')
    const [actionNotes, setActionNotes] = useState('')

    const criticalChannels = channels.filter(c => c.riskLevel === 'critical')
    const highRisk = channels.filter(c => c.riskLevel === 'high')
    const mediumRisk = channels.filter(c => c.riskLevel === 'medium')
    const monitoring = channels.filter(c => c.status === 'monitoring')

    const stats = {
        totalFlagged: channels.length,
        critical: criticalChannels.length,
        escalated: channels.filter(c => c.status === 'escalated').length,
        warningsIssued: channels.reduce((sum, c) => sum + c.warningsIssued, 0),
        avgQualityScore: Math.round(channels.reduce((sum, c) => sum + c.metrics.avgQualityScore, 0) / channels.length),
        totalViolations: channels.reduce((sum, c) => c.violations.reduce((vSum, v) => vSum + v.count, 0) + sum, 0)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleViewDetails = (channel: FlaggedChannel) => {
        setSelectedChannel(channel)
        setShowDetailsModal(true)
    }

    const handleTakeAction = (channel: FlaggedChannel) => {
        setSelectedChannel(channel)
        setActionType('warning')
        setActionNotes('')
        setShowActionModal(true)
    }

    const handleSubmitAction = () => {
        console.log('Action submitted:', {
            channelId: selectedChannel?.id,
            action: actionType,
            notes: actionNotes
        })
        setShowActionModal(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Category C Channel Monitoring</h1>
                        <p className="text-muted-foreground">Automated detection and manual review of flagged creator channels</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            Weekly Report
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Flag className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalFlagged}</div>
                        <div className="text-sm text-muted-foreground mt-1">Flagged Channels</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.critical}</div>
                        <div className="text-sm text-muted-foreground mt-1">Critical Risk</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingDown className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.escalated}</div>
                        <div className="text-sm text-muted-foreground mt-1">Escalated</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.warningsIssued}</div>
                        <div className="text-sm text-muted-foreground mt-1">Warnings Issued</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.avgQualityScore}</div>
                        <div className="text-sm text-muted-foreground mt-1">Avg Quality Score</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalViolations}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Violations</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="critical" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Critical Risk ({stats.critical})
                                </TabsTrigger>
                                <TabsTrigger value="high" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Flag className="w-4 h-4 mr-2" />
                                    High Risk ({highRisk.length})
                                </TabsTrigger>
                                <TabsTrigger value="medium" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Activity className="w-4 h-4 mr-2" />
                                    Medium Risk ({mediumRisk.length})
                                </TabsTrigger>
                                <TabsTrigger value="monitoring" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Monitoring ({monitoring.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Critical Risk Tab */}
                        <TabsContent value="critical" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-300 mb-1">Critical Risk Channels - Immediate Action Required</h4>
                                            <p className="text-sm text-red-200/80">
                                                These channels have severe violations and require immediate review. Consider suspension or content restriction.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {criticalChannels.map((channel) => (
                                    <div key={channel.id} className="bg-white/5 rounded-lg p-5 border border-red-500/20 hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-red-500/20 rounded-lg p-2">
                                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{channel.channelName}</h4>
                                                        <p className="text-sm text-muted-foreground">by {channel.creatorName} • {channel.subscriberCount} subscribers</p>
                                                    </div>
                                                    <Badge className={statusColors[channel.status]}>
                                                        {channel.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Badge className={riskColors[channel.riskLevel]}>
                                                        {channel.riskLevel} risk
                                                    </Badge>
                                                    {channel.warningsIssued > 0 && (
                                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                                            {channel.warningsIssued} warnings
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-5 gap-4 mb-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Quality Score</div>
                                                        <div className={`text-lg font-semibold ${
                                                            channel.metrics.avgQualityScore >= 70 ? 'text-green-400' :
                                                            channel.metrics.avgQualityScore >= 50 ? 'text-yellow-400' :
                                                            'text-red-400'
                                                        }`}>{channel.metrics.avgQualityScore}/100</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
                                                        <div className="text-lg font-semibold text-foreground">{channel.metrics.completionRate}%</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Refund Rate</div>
                                                        <div className={`text-lg font-semibold ${
                                                            channel.metrics.refundRate > 20 ? 'text-red-400' :
                                                            channel.metrics.refundRate > 10 ? 'text-yellow-400' :
                                                            'text-green-400'
                                                        }`}>{channel.metrics.refundRate}%</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Spam Reports</div>
                                                        <div className="text-lg font-semibold text-red-400">{channel.metrics.spamReports}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Content</div>
                                                        <div className="text-lg font-semibold text-foreground">{channel.contentCount}</div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {channel.violations.map((violation, idx) => (
                                                        <Badge key={idx} className={violationColors[violation.type]}>
                                                            {violation.type.replace(/_/g, ' ')}: {violation.count}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                                    <h5 className="text-sm font-semibold text-red-300 mb-2">Automated Flags</h5>
                                                    <ul className="space-y-1">
                                                        {channel.automatedFlags.slice(0, 3).map((flag, idx) => (
                                                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                                {flag}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Flagged: {formatDate(channel.flaggedDate)} • Last Activity: {formatDate(channel.lastActivity)}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700 text-foreground"
                                                    onClick={() => handleViewDetails(channel)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Full Review
                                                </Button>
                                                <Button
                                                    className="bg-red-600 hover:bg-red-700 text-foreground"
                                                    onClick={() => handleTakeAction(channel)}
                                                >
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Take Action
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* High Risk Tab */}
                        <TabsContent value="high" className="p-6">
                            <div className="space-y-4">
                                {highRisk.map((channel) => (
                                    <div key={channel.id} className="bg-white/5 rounded-lg p-5 border border-orange-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-orange-500/20 rounded-lg p-2">
                                                        <Flag className="w-5 h-5 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{channel.channelName}</h4>
                                                        <p className="text-sm text-muted-foreground">by {channel.creatorName}</p>
                                                    </div>
                                                    <Badge className={riskColors[channel.riskLevel]}>
                                                        {channel.riskLevel} risk
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {channel.violations.map((violation, idx) => (
                                                        <Badge key={idx} className={violationColors[violation.type]}>
                                                            {violation.type.replace(/_/g, ' ')}: {violation.count}
                                                        </Badge>
                                                    ))}
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    Quality: {channel.metrics.avgQualityScore}/100 • Refunds: {channel.metrics.refundRate}%
                                                </div>
                                            </div>

                                            <div className="flex gap-2 ml-4">
                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700 text-foreground"
                                                    onClick={() => handleViewDetails(channel)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Review
                                                </Button>
                                                <Button
                                                    className="bg-orange-600 hover:bg-orange-700 text-foreground"
                                                    onClick={() => handleTakeAction(channel)}
                                                >
                                                    Action
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Medium Risk Tab */}
                        <TabsContent value="medium" className="p-6">
                            <div className="space-y-4">
                                {mediumRisk.map((channel) => (
                                    <div key={channel.id} className="bg-white/5 rounded-lg p-5 border border-border">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-yellow-500/20 rounded-lg p-2">
                                                        <Activity className="w-5 h-5 text-yellow-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{channel.channelName}</h4>
                                                        <p className="text-sm text-muted-foreground">by {channel.creatorName}</p>
                                                    </div>
                                                    <Badge className={riskColors[channel.riskLevel]}>
                                                        {channel.riskLevel} risk
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    {channel.violations.length} violation types • Quality: {channel.metrics.avgQualityScore}/100
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-blue-600 hover:bg-blue-700 text-foreground ml-4"
                                                onClick={() => handleViewDetails(channel)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Monitoring Tab */}
                        <TabsContent value="monitoring" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-300 mb-1">Active Monitoring - Low Risk</h4>
                                            <p className="text-sm text-blue-200/80">
                                                These channels have minor flags but are performing within acceptable parameters. Continue monitoring.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {monitoring.map((channel) => (
                                    <div key={channel.id} className="bg-white/5 rounded-lg p-5 border border-blue-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-blue-500/20 rounded-lg p-2">
                                                        <Eye className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{channel.channelName}</h4>
                                                        <p className="text-sm text-muted-foreground">by {channel.creatorName}</p>
                                                    </div>
                                                    <Badge className={riskColors[channel.riskLevel]}>
                                                        {channel.riskLevel} risk
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    Quality: {channel.metrics.avgQualityScore}/100 • {channel.violations.length} minor violations
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="bg-white/5 border-border text-muted-foreground hover:bg-white/10 ml-4"
                                                onClick={() => handleViewDetails(channel)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Channel Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Channel Full Review</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Complete analysis and violation history
                        </DialogDescription>
                    </DialogHeader>

                    {selectedChannel && (
                        <div className="space-y-6 mt-4">
                            {/* Channel Info */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Channel Information</h4>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Channel:</span>
                                        <span className="text-foreground ml-2 font-semibold">{selectedChannel.channelName}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Creator:</span>
                                        <span className="text-foreground ml-2">{selectedChannel.creatorName}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Subscribers:</span>
                                        <span className="text-foreground ml-2">{selectedChannel.subscriberCount}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Content Count:</span>
                                        <span className="text-foreground ml-2">{selectedChannel.contentCount}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Manual Reviews:</span>
                                        <span className="text-foreground ml-2">{selectedChannel.manualReviews}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Warnings:</span>
                                        <span className="text-foreground ml-2">{selectedChannel.warningsIssued}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Performance Metrics</h4>
                                <div className="grid grid-cols-5 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Quality Score</div>
                                        <div className={`text-2xl font-bold ${
                                            selectedChannel.metrics.avgQualityScore >= 70 ? 'text-green-400' :
                                            selectedChannel.metrics.avgQualityScore >= 50 ? 'text-yellow-400' :
                                            'text-red-400'
                                        }`}>{selectedChannel.metrics.avgQualityScore}/100</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
                                        <div className="text-2xl font-bold text-foreground">{selectedChannel.metrics.completionRate}%</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Refund Rate</div>
                                        <div className={`text-2xl font-bold ${
                                            selectedChannel.metrics.refundRate > 20 ? 'text-red-400' : 'text-yellow-400'
                                        }`}>{selectedChannel.metrics.refundRate}%</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Negative Reviews</div>
                                        <div className="text-2xl font-bold text-red-400">{selectedChannel.metrics.negativeReviews}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Spam Reports</div>
                                        <div className="text-2xl font-bold text-red-400">{selectedChannel.metrics.spamReports}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Violations */}
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <h4 className="font-semibold text-red-300 mb-3">Violations Breakdown</h4>
                                <div className="space-y-2">
                                    {selectedChannel.violations.map((violation, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                            <div className="flex items-center gap-3">
                                                <Badge className={violationColors[violation.type]}>
                                                    {violation.type.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {violation.count} instances • {violation.severity} severity
                                                </span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                Last: {formatDate(violation.lastOccurrence)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Automated Flags */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Automated Detection Flags</h4>
                                <ul className="space-y-2">
                                    {selectedChannel.automatedFlags.map((flag, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                            {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Take Action Modal */}
            <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-orange-400">Take Action</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Select enforcement action for this channel
                        </DialogDescription>
                    </DialogHeader>

                    {selectedChannel && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Channel:</strong> {selectedChannel.channelName} by {selectedChannel.creatorName}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong>Risk Level:</strong> {selectedChannel.riskLevel.toUpperCase()}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="action"
                                        checked={actionType === 'warning'}
                                        onChange={() => setActionType('warning')}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-yellow-400">Issue Warning</span> - Send formal warning to creator
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="action"
                                        checked={actionType === 'escalate'}
                                        onChange={() => setActionType('escalate')}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-orange-400">Escalate for Review</span> - Senior admin review required
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="action"
                                        checked={actionType === 'restrict'}
                                        onChange={() => setActionType('restrict')}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-orange-400">Restrict Visibility</span> - Hide content from discovery
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="action"
                                        checked={actionType === 'suspend'}
                                        onChange={() => setActionType('suspend')}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-red-400">Suspend Channel</span> - Full channel suspension
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Action Notes *</label>
                                <Textarea
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                    placeholder="Document reason for action and next steps..."
                                    className="bg-white/5 border-border text-foreground min-h-[100px]"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowActionModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitAction}
                                    className={`flex-1 ${
                                        actionType === 'suspend' ? 'bg-red-600 hover:bg-red-700' :
                                        actionType === 'restrict' || actionType === 'escalate' ? 'bg-orange-600 hover:bg-orange-700' :
                                        'bg-yellow-600 hover:bg-yellow-700'
                                    } text-foreground`}
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Confirm Action
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
