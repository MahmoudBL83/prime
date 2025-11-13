'use client'

import React, { useState } from 'react'
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
    Download
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

const MOCK_APPEALS: Appeal[] = [
    {
        id: 'APL-1001',
        appealNumber: 'APL-2024-1001',
        userId: 'user-789',
        userName: 'Omar Hassan',
        userEmail: 'omar.h@example.com',
        banId: 'BAN-1003',
        submittedAt: '2024-10-07T10:00:00Z',
        status: 'pending',
        priority: 'high',
        daysInQueue: 9,
        appealReason: 'I believe this permanent ban is unjustified. While I admit to having disputes with other users, I never engaged in threats or harassment as claimed. The messages were taken out of context. I am willing to undergo mediation and community guidelines training. I have invested significant time and money in courses on this platform and this ban is devastating to my learning journey.',
        appealEvidence: [
            'Full conversation logs showing context',
            'Character references from 3 course instructors',
            'Proof of completed community guidelines course',
            'Screenshots showing misunderstanding, not threats'
        ],
        originalBan: {
            type: 'permanent',
            duration: 'permanent',
            reason: 'Repeated harassment and threatening behavior toward other users',
            evidence: [
                '15 harassment reports from 8 different users',
                'Threatening language in messages and comments',
                'Continued violations after 2 previous warnings',
                'Created alternate account to evade ban'
            ],
            bannedAt: '2024-10-05T09:00:00Z'
        },
        previousAppeals: 0
    },
    {
        id: 'APL-1002',
        appealNumber: 'APL-2024-1002',
        userId: 'user-987',
        userName: 'Layla Mahmoud',
        userEmail: 'layla.m@example.com',
        banId: 'BAN-1006',
        submittedAt: '2024-10-13T14:30:00Z',
        status: 'under_review',
        priority: 'medium',
        daysInQueue: 3,
        appealReason: 'My account was compromised during the time of the spam activity. I have since secured my account with 2FA and changed my password. I can provide IP logs showing the spam messages came from a different location than my usual login location (Cairo). I have filed a police report for the account hack.',
        appealEvidence: [
            'Police report for account compromise',
            'IP logs showing suspicious activity from different location',
            'Proof of 2FA activation after incident',
            'Screenshots of password reset confirmation'
        ],
        originalBan: {
            type: 'temporary',
            duration: '30_days',
            reason: 'Spam messaging - sent 100+ promotional messages in 24 hours',
            evidence: [
                'Automated detection of spam pattern',
                '25 user reports of spam messages',
                'Identical message content sent to multiple users'
            ],
            bannedAt: '2024-10-10T08:00:00Z',
            expiresAt: '2024-11-09T08:00:00Z'
        },
        reviewedBy: 'Admin Sarah',
        previousAppeals: 0
    },
    {
        id: 'APL-1003',
        appealNumber: 'APL-2024-1003',
        userId: 'user-456',
        userName: 'Fatma Ali',
        userEmail: 'fatma.ali@example.com',
        banId: 'BAN-1002',
        submittedAt: '2024-10-15T09:00:00Z',
        status: 'pending',
        priority: 'urgent',
        daysInQueue: 1,
        appealReason: 'The content flagged as plagiarism was from my own YouTube channel from 2 years ago. I am the original creator. The DMCA claim was filed by someone who re-uploaded MY content. I have provided proof of ownership including my YouTube channel with earlier upload dates, original raw footage, and copyright registration.',
        appealEvidence: [
            'YouTube channel ownership verification (2 years history)',
            'Original raw video files with metadata showing earlier dates',
            'Copyright registration certificate',
            'DMCA counter-notice filed against false claimant',
            'Proof of identity matching YouTube channel owner'
        ],
        originalBan: {
            type: 'feature_specific',
            duration: '30_days',
            reason: 'Multiple instances of plagiarized content uploaded',
            evidence: [
                'Copyright claim from claimed "original creator"',
                'DMCA notice filed',
                'Similarity score 95% with flagged content'
            ],
            bannedAt: '2024-10-12T15:30:00Z',
            expiresAt: '2024-11-11T15:30:00Z'
        },
        previousAppeals: 0
    },
    {
        id: 'APL-1004',
        appealNumber: 'APL-2024-1004',
        userId: 'user-654',
        userName: 'Ahmed Youssef',
        userEmail: 'ahmed.y@example.com',
        banId: 'BAN-1007',
        submittedAt: '2024-09-28T11:00:00Z',
        status: 'reduced',
        priority: 'low',
        daysInQueue: 18,
        appealReason: 'I accept responsibility for my inappropriate language. This was my first offense and I was having a very stressful day. I have since apologized to the affected users and completed anger management resources.',
        appealEvidence: [
            'Apology messages sent to affected users',
            'Completion certificate for online communication course',
            'No prior violations on account (4 years)'
        ],
        originalBan: {
            type: 'temporary',
            duration: '7_days',
            reason: 'Inappropriate language and personal attacks in course Q&A',
            evidence: [
                '5 flagged comments with profanity and personal attacks',
                '3 user reports'
            ],
            bannedAt: '2024-09-25T14:00:00Z',
            expiresAt: '2024-10-02T14:00:00Z'
        },
        reviewedBy: 'Admin Khaled',
        reviewedAt: '2024-10-01T10:00:00Z',
        decision: 'reduce_duration',
        decisionNotes: 'Reduced to 3 days based on sincere apology and no prior violations. Final warning issued.',
        previousAppeals: 0
    },
    {
        id: 'APL-1005',
        appealNumber: 'APL-2024-1005',
        userId: 'user-321',
        userName: 'Nour Ibrahim',
        userEmail: 'nour.i@example.com',
        banId: 'BAN-1008',
        submittedAt: '2024-10-01T16:00:00Z',
        status: 'reinstated',
        priority: 'medium',
        daysInQueue: 15,
        appealReason: 'The transactions flagged as fraudulent were legitimate purchases made by my business for employee training. I can provide company documentation, purchase orders, and confirmation that all learners are real employees.',
        appealEvidence: [
            'Company registration documents',
            'Employee roster matching enrolled learners',
            'Purchase orders and payment receipts',
            'HR confirmation letters for all enrolled users'
        ],
        originalBan: {
            type: 'permanent',
            duration: 'permanent',
            reason: 'Fraudulent transaction pattern - multiple accounts from same IP',
            evidence: [
                'Automated fraud detection alert',
                '10 accounts created from same IP in 24 hours',
                'Bulk course purchases flagged as suspicious'
            ],
            bannedAt: '2024-09-28T09:00:00Z'
        },
        reviewedBy: 'Admin Sarah',
        reviewedAt: '2024-10-05T14:00:00Z',
        decision: 'full_reinstatement',
        decisionNotes: 'Legitimate corporate training purchase. Ban lifted with apology. Corporate account setup recommended for future.',
        previousAppeals: 0
    }
]

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
    const [appeals] = useState<Appeal[]>(MOCK_APPEALS)
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewDecision, setReviewDecision] = useState<AppealDecision>('uphold')
    const [decisionNotes, setDecisionNotes] = useState('')

    const pendingAppeals = appeals.filter(a => a.status === 'pending')
    const underReview = appeals.filter(a => a.status === 'under_review')
    const resolved = appeals.filter(a => ['upheld', 'reduced', 'reinstated'].includes(a.status))

    const stats = {
        totalPending: pendingAppeals.length,
        underReview: underReview.length,
        urgent: pendingAppeals.filter(a => a.priority === 'urgent').length,
        avgReviewTime: 7.5,
        resolutionRate: 85,
        reinstatedRate: 35
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

    const handleReviewAppeal = (appeal: Appeal) => {
        setSelectedAppeal(appeal)
        setReviewDecision('uphold')
        setDecisionNotes('')
        setShowReviewModal(true)
    }

    const handleSubmitDecision = () => {
        console.log('Appeal decision:', {
            appealId: selectedAppeal?.id,
            decision: reviewDecision,
            notes: decisionNotes
        })
        setShowReviewModal(false)
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
