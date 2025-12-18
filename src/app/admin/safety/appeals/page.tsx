'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Clock,
    Eye,
    Shield,
    User,
    MessageSquare,
    TrendingDown,
    TrendingUp,
    Filter,
    Download,
    Loader2
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
import { Label } from '@/components/ui/label'

type AppealStatus = 'pending' | 'under_review' | 'upheld' | 'reduced' | 'reinstated'
type AppealPriority = 'low' | 'medium' | 'high' | 'urgent'
type AppealDecision = 'uphold' | 'reduce_warning' | 'reduce_duration' | 'full_reinstatement'

interface Appeal {
    id: string
    appealNumber: string
    userId: string
    userName: string
    userEmail: string
    banId: string
    submittedAt: string
    status: AppealStatus
    priority: AppealPriority
    daysInQueue: number
    appealReason: string
    appealEvidence: string[]
    originalBan: {
        type: string
        duration: string
        reason: string
        evidence: string[]
        bannedAt: string
        expiresAt?: string
    }
    reviewedBy?: string
    reviewedAt?: string
    decision?: AppealDecision
    decisionNotes?: string
    previousAppeals: number
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    upheld: 'bg-red-100 text-red-800 border-red-200',
    reduced: 'bg-orange-100 text-orange-800 border-orange-200',
    reinstated: 'bg-green-100 text-green-800 border-green-200'
}

const priorityColors = {
    low: 'bg-muted text-gray-800 border-border',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
}

export default function AppealManagementPage() {
    const [activeTab, setActiveTab] = useState('pending')
    const [appeals, setAppeals] = useState<Appeal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewDecision, setReviewDecision] = useState<AppealDecision>('uphold')
    const [decisionNotes, setDecisionNotes] = useState('')
    const [stats, setStats] = useState({
        totalPending: 0,
        underReview: 0,
        urgent: 0,
        avgReviewTime: 7.5,
        resolutionRate: 0,
        reinstatedRate: 0
    })

    const fetchAppeals = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/admin/safety/appeals')
            if (!response.ok) throw new Error('Failed to fetch appeals')
            const data = await response.json()
            setAppeals(data.appeals || [])
            if (data.stats) {
                setStats(data.stats)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAppeals()
    }, [fetchAppeals])

    const pendingAppeals = appeals.filter(a => a.status === 'pending')
    const underReview = appeals.filter(a => a.status === 'under_review')
    const resolved = appeals.filter(a => ['upheld', 'reduced', 'reinstated'].includes(a.status))

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleReviewAppeal = (appeal: Appeal) => {
        setSelectedAppeal(appeal)
        setReviewDecision('uphold')
        setDecisionNotes('')
        setShowReviewModal(true)
    }

    const handleSubmitDecision = async () => {
        if (!selectedAppeal) return
        
        try {
            const action = reviewDecision === 'full_reinstatement' ? 'approve' :
                          reviewDecision === 'uphold' ? 'reject' : 'review'
            
            const response = await fetch('/api/admin/safety/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appealId: selectedAppeal.id,
                    action,
                    decision: reviewDecision,
                    notes: decisionNotes
                })
            })
            
            if (!response.ok) throw new Error('Failed to submit decision')
            
            setShowReviewModal(false)
            fetchAppeals() // Refresh the list
        } catch (err) {
            console.error('Failed to submit decision:', err)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                    <Button onClick={fetchAppeals} className="mt-4">Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Appeal Management</h1>
                        <p className="text-muted-foreground">Review and process user ban appeals with fair evaluation</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <RefreshCw className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalPending}</div>
                        <div className="text-sm text-muted-foreground mt-1">Pending Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Eye className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.underReview}</div>
                        <div className="text-sm text-muted-foreground mt-1">Under Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.urgent}</div>
                        <div className="text-sm text-muted-foreground mt-1">Urgent Priority</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.avgReviewTime} days</div>
                        <div className="text-sm text-muted-foreground mt-1">Avg Review Time</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.resolutionRate}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Resolution Rate</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.reinstatedRate}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Reinstatement Rate</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="pending" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Pending ({stats.totalPending})
                                </TabsTrigger>
                                <TabsTrigger value="under_review" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Under Review ({stats.underReview})
                                </TabsTrigger>
                                <TabsTrigger value="resolved" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Resolved ({resolved.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Pending Appeals Tab */}
                        <TabsContent value="pending" className="p-6">
                            <div className="space-y-4">
                                {pendingAppeals.map((appeal) => (
                                    <div key={appeal.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-blue-500/20 rounded-lg p-2">
                                                        <RefreshCw className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{appeal.userName}</h4>
                                                        <p className="text-sm text-muted-foreground">{appeal.userEmail} • Appeal #{appeal.appealNumber}</p>
                                                    </div>
                                                    <Badge className={statusColors[appeal.status]}>
                                                        {appeal.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Badge className={priorityColors[appeal.priority]}>
                                                        {appeal.priority} priority
                                                    </Badge>
                                                    <Badge className={appeal.daysInQueue > 7 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}>
                                                        Day {appeal.daysInQueue} in queue
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 mb-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Original Ban</div>
                                                        <div className="text-sm text-foreground capitalize">{appeal.originalBan.type.replace(/_/g, ' ')}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Ban Duration</div>
                                                        <div className="text-sm text-foreground">{appeal.originalBan.duration.replace(/_/g, ' ')}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Submitted</div>
                                                        <div className="text-sm text-foreground">{formatDate(appeal.submittedAt)}</div>
                                                    </div>
                                                </div>

                                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                                                    <h5 className="text-sm font-semibold text-yellow-300 mb-2">Original Ban Reason</h5>
                                                    <p className="text-sm text-muted-foreground">{appeal.originalBan.reason}</p>
                                                </div>

                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                    <h5 className="text-sm font-semibold text-blue-300 mb-2">Appeal Statement</h5>
                                                    <p className="text-sm text-muted-foreground line-clamp-3">{appeal.appealReason}</p>
                                                </div>

                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Evidence provided: {appeal.appealEvidence.length} items • Previous appeals: {appeal.previousAppeals}
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-purple-600 hover:bg-purple-700 text-foreground ml-4"
                                                onClick={() => handleReviewAppeal(appeal)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Review Appeal
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Under Review Tab */}
                        <TabsContent value="under_review" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-300 mb-1">Appeals Currently Under Review</h4>
                                            <p className="text-sm text-blue-200/80">
                                                These appeals are being actively reviewed by team members. Complete review within 10 days.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {underReview.map((appeal) => (
                                    <div key={appeal.id} className="bg-white/5 rounded-lg p-5 border border-blue-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-blue-500/20 rounded-lg p-2">
                                                        <Eye className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{appeal.userName}</h4>
                                                        <p className="text-sm text-muted-foreground">Reviewing: {appeal.reviewedBy} • Day {appeal.daysInQueue}</p>
                                                    </div>
                                                    <Badge className={statusColors[appeal.status]}>
                                                        {appeal.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    Appeal for: {appeal.originalBan.type.replace(/_/g, ' ')} ban
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-foreground ml-4"
                                                onClick={() => handleReviewAppeal(appeal)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Complete Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Resolved Appeals Tab */}
                        <TabsContent value="resolved" className="p-6">
                            <div className="space-y-4">
                                {resolved.map((appeal) => (
                                    <div key={appeal.id} className="bg-white/5 rounded-lg p-5 border border-border">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className={`rounded-lg p-2 ${
                                                        appeal.status === 'reinstated' ? 'bg-green-500/20' :
                                                        appeal.status === 'reduced' ? 'bg-orange-500/20' :
                                                        'bg-red-500/20'
                                                    }`}>
                                                        {appeal.status === 'reinstated' ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                                                         appeal.status === 'reduced' ? <TrendingDown className="w-5 h-5 text-orange-400" /> :
                                                         <XCircle className="w-5 h-5 text-red-400" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{appeal.userName}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Reviewed by {appeal.reviewedBy} on {appeal.reviewedAt && formatDate(appeal.reviewedAt)}
                                                        </p>
                                                    </div>
                                                    <Badge className={statusColors[appeal.status]}>
                                                        {appeal.status}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Decision</div>
                                                        <div className="text-sm text-foreground capitalize">
                                                            {appeal.decision?.replace(/_/g, ' ')}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Original Ban</div>
                                                        <div className="text-sm text-foreground capitalize">
                                                            {appeal.originalBan.type.replace(/_/g, ' ')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {appeal.decisionNotes && (
                                                    <div className="bg-white/5 border border-border rounded-lg p-3">
                                                        <h5 className="text-sm font-semibold text-foreground mb-1">Decision Notes</h5>
                                                        <p className="text-sm text-muted-foreground">{appeal.decisionNotes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Review Appeal Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Review Appeal</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {selectedAppeal?.appealNumber} • {selectedAppeal?.userName}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAppeal && (
                        <div className="space-y-6 mt-4">
                            {/* User Info */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">User Information</h4>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="text-foreground ml-2 font-semibold">{selectedAppeal.userName}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="text-foreground ml-2">{selectedAppeal.userEmail}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Previous Appeals:</span>
                                        <span className="text-foreground ml-2">{selectedAppeal.previousAppeals}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Original Ban Details */}
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <h4 className="font-semibold text-red-300 mb-3">Original Ban Details</h4>
                                <div className="space-y-2 text-sm mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ban Type:</span>
                                        <span className="text-foreground capitalize">{selectedAppeal.originalBan.type.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Duration:</span>
                                        <span className="text-foreground capitalize">{selectedAppeal.originalBan.duration.replace(/_/g, ' ')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Banned On:</span>
                                        <span className="text-foreground">{formatDate(selectedAppeal.originalBan.bannedAt)}</span>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <h5 className="text-xs text-muted-foreground mb-1">Ban Reason:</h5>
                                    <p className="text-sm text-foreground">{selectedAppeal.originalBan.reason}</p>
                                </div>
                                <div>
                                    <h5 className="text-xs text-muted-foreground mb-2">Original Evidence:</h5>
                                    <ul className="space-y-1">
                                        {selectedAppeal.originalBan.evidence.map((item, index) => (
                                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Appeal Statement */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-300 mb-3">User's Appeal Statement</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAppeal.appealReason}</p>
                            </div>

                            {/* Appeal Evidence */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Evidence Provided by User</h4>
                                <ul className="space-y-2">
                                    {selectedAppeal.appealEvidence.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Decision Section */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Review Decision</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="decision"
                                            checked={reviewDecision === 'uphold'}
                                            onChange={() => setReviewDecision('uphold')}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-red-400">Uphold Ban</span> - Original ban remains in effect
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="decision"
                                            checked={reviewDecision === 'reduce_warning'}
                                            onChange={() => setReviewDecision('reduce_warning')}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-orange-400">Reduce to Warning</span> - Lift ban, issue final warning
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="decision"
                                            checked={reviewDecision === 'reduce_duration'}
                                            onChange={() => setReviewDecision('reduce_duration')}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-yellow-400">Reduce Duration</span> - Shorten ban period
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="decision"
                                            checked={reviewDecision === 'full_reinstatement'}
                                            onChange={() => setReviewDecision('full_reinstatement')}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-green-400">Full Reinstatement</span> - Lift ban completely, no warning
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Label htmlFor="decisionNotes">Decision Notes *</Label>
                                    <Textarea
                                        id="decisionNotes"
                                        value={decisionNotes}
                                        onChange={(e) => setDecisionNotes(e.target.value)}
                                        placeholder="Explain your decision and reasoning..."
                                        className="bg-white/5 border-border text-foreground min-h-[120px] mt-1"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitDecision}
                                    className={`flex-1 ${
                                        reviewDecision === 'uphold' ? 'bg-red-600 hover:bg-red-700' :
                                        reviewDecision === 'full_reinstatement' ? 'bg-green-600 hover:bg-green-700' :
                                        'bg-orange-600 hover:bg-orange-700'
                                    } text-foreground`}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submit Decision
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
