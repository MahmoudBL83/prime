'use client'

import React, { useState, useEffect } from 'react'
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    Play,
    Film,
    FileText,
    Shield,
    Award,
    Users,
    TrendingUp,
    RefreshCw,
    Download,
    Filter,
    Search,
    ChevronRight,
    AlertCircle,
    Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
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
import { Checkbox } from '@/components/ui/checkbox'

type ReviewStatus = 'pending_first_review' | 'under_review' | 'revisions_requested' | 'approved' | 'rejected'
type ContentQuality = 'poor' | 'acceptable' | 'good' | 'excellent'
type CreatorType = 'first_time' | 'ongoing'

interface ContentSubmission {
    id: string
    courseTitle: string
    creator: {
        id: string
        name: string
        email: string
        isFirstTime: boolean
        previousApprovals: number
    }
    submittedDate: string
    status: ReviewStatus
    daysInQueue: number
    slaStatus: 'on_time' | 'near_breach' | 'breached'
    totalLessons: number
    totalDuration: number
    category: string
    thumbnail: string
    autoCheckResults: {
        videoQuality: ContentQuality
        audioQuality: ContentQuality
        captionsAvailable: boolean
        policyFlags: number
        plagiarismScore: number
    }
}

interface ReviewChecklist {
    videoQuality: {
        resolution: boolean
        lighting: boolean
        audio: boolean
        pacing: boolean
    }
    learningDesign: {
        outcomesStated: boolean
        syllabusStructured: boolean
        assessmentsAligned: boolean
        practiceIncluded: boolean
    }
    policyCompliance: {
        educationalFocus: boolean
        noProhibited: boolean
        originalContent: boolean
        accurateInfo: boolean
    }
    accessibility: {
        captionsAvailable: boolean
        transcriptQuality: boolean
        visualContrast: boolean
    }
    technical: {
        videosPlayable: boolean
        downloadsWork: boolean
        linksValid: boolean
        quizzesFunctional: boolean
    }
}

const statusColors = {
    pending_first_review: 'bg-purple-100 text-purple-800 border-purple-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    revisions_requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
}

const slaStatusColors = {
    on_time: 'bg-green-100 text-green-800 border-green-200',
    near_breach: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    breached: 'bg-red-100 text-red-800 border-red-200'
}

const qualityColors = {
    poor: 'bg-red-100 text-red-800 border-red-200',
    acceptable: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    good: 'bg-blue-100 text-blue-800 border-blue-200',
    excellent: 'bg-green-100 text-green-800 border-green-200'
}

export default function EnhancedContentReviewQueue() {
    const [activeTab, setActiveTab] = useState('first_time')
    const [submissions, setSubmissions] = useState<ContentSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmission | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewAction, setReviewAction] = useState<'approve' | 'request_revisions' | 'reject'>('approve')
    const [reviewNotes, setReviewNotes] = useState('')
    const [checklist, setChecklist] = useState<ReviewChecklist>({
        videoQuality: { resolution: false, lighting: false, audio: false, pacing: false },
        learningDesign: { outcomesStated: false, syllabusStructured: false, assessmentsAligned: false, practiceIncluded: false },
        policyCompliance: { educationalFocus: false, noProhibited: false, originalContent: false, accurateInfo: false },
        accessibility: { captionsAvailable: false, transcriptQuality: false, visualContrast: false },
        technical: { videosPlayable: false, downloadsWork: false, linksValid: false, quizzesFunctional: false }
    })

    useEffect(() => {
        fetchSubmissions()
    }, [])

    const fetchSubmissions = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/content-review')
            if (!response.ok) throw new Error('Failed to fetch submissions')
            const data = await response.json()
            setSubmissions(data.submissions || [])
        } catch (error) {
            toast.error('Failed to load content reviews')
        } finally {
            setLoading(false)
        }
    }

    const handleReviewAction = async (action: 'approve' | 'request_revisions' | 'reject') => {
        if (!selectedSubmission) return
        
        try {
            setActionLoading(true)
            const response = await fetch('/api/admin/content-review', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: selectedSubmission.id,
                    action,
                    notes: reviewNotes
                })
            })

            if (!response.ok) throw new Error('Failed to update review')

            const actionLabels = {
                approve: 'approved',
                request_revisions: 'sent back for revisions',
                reject: 'rejected'
            }
            toast.success(`Course ${actionLabels[action]}`)
            setShowReviewModal(false)
            fetchSubmissions()
        } catch (error) {
            toast.error('Failed to submit review')
        } finally {
            setActionLoading(false)
        }
    }

    const firstTimeSubmissions = submissions.filter(s => s.creator.isFirstTime)
    const ongoingSubmissions = submissions.filter(s => !s.creator.isFirstTime)
    const slaBreached = submissions.filter(s => s.slaStatus === 'breached')

    const stats = {
        totalFirstTime: firstTimeSubmissions.length,
        totalOngoing: ongoingSubmissions.length,
        underReview: submissions.filter(s => s.status === 'under_review').length,
        slaBreached: slaBreached.length,
        avgReviewTime: 4.5
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

    const handleStartReview = (submission: ContentSubmission) => {
        setSelectedSubmission(submission)
        setReviewAction('approve')
        setReviewNotes('')
        setChecklist({
            videoQuality: { resolution: false, lighting: false, audio: false, pacing: false },
            learningDesign: { outcomesStated: false, syllabusStructured: false, assessmentsAligned: false, practiceIncluded: false },
            policyCompliance: { educationalFocus: false, noProhibited: false, originalContent: false, accurateInfo: false },
            accessibility: { captionsAvailable: false, transcriptQuality: false, visualContrast: false },
            technical: { videosPlayable: false, downloadsWork: false, linksValid: false, quizzesFunctional: false }
        })
        setShowReviewModal(true)
    }

    const calculateChecklistCompletion = () => {
        const allItems = [
            ...Object.values(checklist.videoQuality),
            ...Object.values(checklist.learningDesign),
            ...Object.values(checklist.policyCompliance),
            ...Object.values(checklist.accessibility),
            ...Object.values(checklist.technical)
        ]
        const completed = allItems.filter(Boolean).length
        return Math.round((completed / allItems.length) * 100)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading content reviews...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Content Review Queue</h1>
                        <p className="text-muted-foreground">Comprehensive review for first-time creators and spot checks for ongoing creators</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalFirstTime}</div>
                        <div className="text-sm text-muted-foreground mt-1">First-Time Creators</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalOngoing}</div>
                        <div className="text-sm text-muted-foreground mt-1">Ongoing (Spot Check)</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.underReview}</div>
                        <div className="text-sm text-muted-foreground mt-1">Under Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.slaBreached}</div>
                        <div className="text-sm text-muted-foreground mt-1">SLA Breached</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.avgReviewTime} days</div>
                        <div className="text-sm text-muted-foreground mt-1">Avg Review Time</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="first_time" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Shield className="w-4 h-4 mr-2" />
                                    First-Time Creators ({stats.totalFirstTime})
                                </TabsTrigger>
                                <TabsTrigger value="ongoing" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Users className="w-4 h-4 mr-2" />
                                    Ongoing Spot Checks ({stats.totalOngoing})
                                </TabsTrigger>
                                <TabsTrigger value="sla_breach" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    SLA Breached ({stats.slaBreached})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* First-Time Tab */}
                        <TabsContent value="first_time" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-purple-300 mb-1">Mandatory Comprehensive Review Required</h4>
                                            <p className="text-sm text-purple-200/80">
                                                All courses from first-time creators must pass comprehensive review before publishing. Use the full checklist below.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {firstTimeSubmissions.map((submission) => (
                                    <div key={submission.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-purple-500/20 rounded-lg p-2">
                                                        <Film className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{submission.courseTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {submission.creator.name} • {submission.creator.email}
                                                        </p>
                                                    </div>
                                                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                                        FIRST-TIME CREATOR
                                                    </Badge>
                                                    <Badge className={statusColors[submission.status]}>
                                                        {submission.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Badge className={slaStatusColors[submission.slaStatus]}>
                                                        {submission.daysInQueue} days in queue
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-4 gap-4 mb-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Total Lessons</div>
                                                        <div className="text-lg font-semibold text-foreground">{submission.totalLessons} lessons</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Duration</div>
                                                        <div className="text-lg font-semibold text-foreground">{submission.totalDuration} min</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Category</div>
                                                        <div className="text-sm text-foreground">{submission.category}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Submitted</div>
                                                        <div className="text-sm text-foreground">{formatDate(submission.submittedDate)}</div>
                                                    </div>
                                                </div>

                                                {/* Auto-Check Results */}
                                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                                    <h5 className="text-sm font-semibold text-foreground mb-2">Automated Pre-Screening Results</h5>
                                                    <div className="grid grid-cols-5 gap-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Video Quality</div>
                                                            <Badge className={qualityColors[submission.autoCheckResults.videoQuality]}>
                                                                {submission.autoCheckResults.videoQuality}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Audio Quality</div>
                                                            <Badge className={qualityColors[submission.autoCheckResults.audioQuality]}>
                                                                {submission.autoCheckResults.audioQuality}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Captions</div>
                                                            <Badge className={submission.autoCheckResults.captionsAvailable ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                                                                {submission.autoCheckResults.captionsAvailable ? 'Available' : 'Missing'}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Policy Flags</div>
                                                            <Badge className={submission.autoCheckResults.policyFlags === 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                                                                {submission.autoCheckResults.policyFlags} flags
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Plagiarism</div>
                                                            <Badge className={submission.autoCheckResults.plagiarismScore < 10 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                                                                {submission.autoCheckResults.plagiarismScore}% match
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button
                                                    className="bg-purple-600 hover:bg-purple-700 text-foreground"
                                                    onClick={() => handleStartReview(submission)}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Start Review
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview Course
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Ongoing Tab */}
                        <TabsContent value="ongoing" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Users className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-300 mb-1">Spot Check Review (10% Random Sample)</h4>
                                            <p className="text-sm text-blue-200/80">
                                                Lighter review process for creators with previous approvals. Focus on policy compliance and quality regression.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {ongoingSubmissions.map((submission) => (
                                    <div key={submission.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-blue-500/20 rounded-lg p-2">
                                                        <Film className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{submission.courseTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {submission.creator.name} • {submission.creator.previousApprovals} previous approvals
                                                        </p>
                                                    </div>
                                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                        ONGOING CREATOR
                                                    </Badge>
                                                    <Badge className={statusColors[submission.status]}>
                                                        {submission.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Content</div>
                                                        <div className="text-sm text-foreground">{submission.totalLessons} lessons • {submission.totalDuration} min</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Category</div>
                                                        <div className="text-sm text-foreground">{submission.category}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Submitted</div>
                                                        <div className="text-sm text-foreground">{formatDate(submission.submittedDate)}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-foreground"
                                                    onClick={() => handleStartReview(submission)}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Quick Review
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* SLA Breach Tab */}
                        <TabsContent value="sla_breach" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-red-300 mb-1">SLA Breached - Immediate Action Required</h4>
                                            <p className="text-sm text-red-200/80">
                                                These submissions have exceeded the 10-day review SLA. Priority review needed.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {slaBreached.map((submission) => (
                                    <div key={submission.id} className="bg-white/5 rounded-lg p-5 border border-red-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-red-500/20 rounded-lg p-2">
                                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{submission.courseTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">{submission.creator.name}</p>
                                                    </div>
                                                    <Badge className="bg-red-100 text-red-800 border-red-200 text-lg px-3 py-1">
                                                        {submission.daysInQueue} DAYS IN QUEUE
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    Submitted: {formatDate(submission.submittedDate)} • {submission.totalLessons} lessons • {submission.totalDuration} min
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-red-600 hover:bg-red-700 text-foreground ml-4"
                                                onClick={() => handleStartReview(submission)}
                                            >
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                URGENT REVIEW
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Review Modal with Comprehensive Checklist */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {selectedSubmission?.creator.isFirstTime ? 'Comprehensive' : 'Quick'} Content Review
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {selectedSubmission?.courseTitle} by {selectedSubmission?.creator.name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSubmission && (
                        <div className="space-y-6 mt-4">
                            {/* Progress Bar */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Checklist Completion</span>
                                    <span className="text-sm font-semibold text-foreground">{calculateChecklistCompletion()}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                        style={{ width: `${calculateChecklistCompletion()}%` }}
                                    />
                                </div>
                            </div>

                            {/* Comprehensive Checklist (First-Time Only) */}
                            {selectedSubmission.creator.isFirstTime && (
                                <div className="space-y-4">
                                    {/* Video Quality */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Film className="w-5 h-5 text-purple-400" />
                                            Video Quality
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries({
                                                resolution: 'Resolution (min 720p)',
                                                lighting: 'Proper lighting & visibility',
                                                audio: 'Clear audio (no background noise)',
                                                pacing: 'Appropriate pacing'
                                            }).map(([key, label]) => (
                                                <div key={key} className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={checklist.videoQuality[key as keyof typeof checklist.videoQuality]}
                                                        onCheckedChange={(checked) => {
                                                            setChecklist(prev => ({
                                                                ...prev,
                                                                videoQuality: {
                                                                    ...prev.videoQuality,
                                                                    [key]: checked as boolean
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                    <label className="text-sm text-muted-foreground">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Learning Design */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Award className="w-5 h-5 text-blue-400" />
                                            Learning Design
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries({
                                                outcomesStated: 'Learning outcomes stated upfront',
                                                syllabusStructured: 'Syllabus logically structured',
                                                assessmentsAligned: 'Assessments tied to outcomes',
                                                practiceIncluded: 'Practice exercises included'
                                            }).map(([key, label]) => (
                                                <div key={key} className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={checklist.learningDesign[key as keyof typeof checklist.learningDesign]}
                                                        onCheckedChange={(checked) => {
                                                            setChecklist(prev => ({
                                                                ...prev,
                                                                learningDesign: {
                                                                    ...prev.learningDesign,
                                                                    [key]: checked as boolean
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                    <label className="text-sm text-muted-foreground">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Policy Compliance */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-green-400" />
                                            Policy Compliance
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries({
                                                educationalFocus: 'Educational focus (not entertainment)',
                                                noProhibited: 'No prohibited content',
                                                originalContent: 'Original content (no plagiarism)',
                                                accurateInfo: 'Accurate & factual information'
                                            }).map(([key, label]) => (
                                                <div key={key} className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={checklist.policyCompliance[key as keyof typeof checklist.policyCompliance]}
                                                        onCheckedChange={(checked) => {
                                                            setChecklist(prev => ({
                                                                ...prev,
                                                                policyCompliance: {
                                                                    ...prev.policyCompliance,
                                                                    [key]: checked as boolean
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                    <label className="text-sm text-muted-foreground">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Accessibility */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Eye className="w-5 h-5 text-yellow-400" />
                                            Accessibility
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries({
                                                captionsAvailable: 'Captions/subtitles available',
                                                transcriptQuality: 'Transcript quality acceptable',
                                                visualContrast: 'Good visual contrast & readability'
                                            }).map(([key, label]) => (
                                                <div key={key} className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={checklist.accessibility[key as keyof typeof checklist.accessibility]}
                                                        onCheckedChange={(checked) => {
                                                            setChecklist(prev => ({
                                                                ...prev,
                                                                accessibility: {
                                                                    ...prev.accessibility,
                                                                    [key]: checked as boolean
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                    <label className="text-sm text-muted-foreground">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Technical Validation */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-orange-400" />
                                            Technical Validation
                                        </h4>
                                        <div className="space-y-2">
                                            {Object.entries({
                                                videosPlayable: 'All videos playable',
                                                downloadsWork: 'Downloads functional',
                                                linksValid: 'All links valid',
                                                quizzesFunctional: 'Quizzes/assessments work'
                                            }).map(([key, label]) => (
                                                <div key={key} className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={checklist.technical[key as keyof typeof checklist.technical]}
                                                        onCheckedChange={(checked) => {
                                                            setChecklist(prev => ({
                                                                ...prev,
                                                                technical: {
                                                                    ...prev.technical,
                                                                    [key]: checked as boolean
                                                                }
                                                            }))
                                                        }}
                                                    />
                                                    <label className="text-sm text-muted-foreground">{label}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Review Decision */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Review Decision</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="reviewAction"
                                            checked={reviewAction === 'approve'}
                                            onChange={() => setReviewAction('approve')}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-green-400">Approve & Publish</span> - Course goes live immediately
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="reviewAction"
                                            checked={reviewAction === 'request_revisions'}
                                            onChange={() => setReviewAction('request_revisions')}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-yellow-400">Request Revisions</span> - Specific changes required
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="reviewAction"
                                            checked={reviewAction === 'reject'}
                                            onChange={() => setReviewAction('reject')}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-red-400">Reject</span> - Course does not meet standards
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="text-sm text-muted-foreground mb-2 block">
                                        Feedback to Creator {reviewAction !== 'approve' && <span className="text-red-400">*</span>}
                                    </label>
                                    <Textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Provide detailed feedback..."
                                        className="bg-white/5 border-border text-foreground min-h-[100px]"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                {reviewAction === 'approve' && (
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-foreground"
                                        disabled={actionLoading}
                                        onClick={() => handleReviewAction('approve')}
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        Approve & Publish
                                    </Button>
                                )}
                                {reviewAction === 'request_revisions' && (
                                    <Button
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-foreground"
                                        disabled={actionLoading}
                                        onClick={() => handleReviewAction('request_revisions')}
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                        Request Revisions
                                    </Button>
                                )}
                                {reviewAction === 'reject' && (
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-foreground"
                                        disabled={actionLoading}
                                        onClick={() => handleReviewAction('reject')}
                                    >
                                        {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                        Reject Course
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                    onClick={() => setShowReviewModal(false)}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
