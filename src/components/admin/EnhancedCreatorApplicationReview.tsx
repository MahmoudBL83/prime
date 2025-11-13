'use client'

import React, { useState } from 'react'
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    FileText,
    User,
    Calendar,
    RefreshCw,
    Download,
    Filter,
    Shield,
    Award,
    TrendingUp,
    Users,
    PlayCircle,
    AlertCircle,
    CheckSquare,
    ExternalLink,
    Linkedin,
    Globe
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
import { Checkbox } from '@/components/ui/checkbox'

type ApplicationStatus = 'pending' | 'under_review' | 'revisions_requested' | 'approved' | 'rejected'
type SLAStatus = 'on_time' | 'near_breach' | 'breached'
type VerificationStatus = 'pending' | 'verified' | 'failed'

interface CreatorApplication {
    id: string
    applicantName: string
    email: string
    phone: string
    submittedDate: string
    daysInQueue: number
    slaStatus: SLAStatus
    status: ApplicationStatus
    expertise: string
    teachingExperience: number
    sampleContentUrl: string
    sampleContentTitle: string
    portfolioUrl?: string
    linkedinUrl?: string
    motivation: string
    requestedTier: 'basic' | 'premium' | 'signature'
    identityVerification: {
        status: VerificationStatus
        idUploaded: boolean
        selfieUploaded: boolean
        addressProofUploaded: boolean
    }
    autoPreScreening: {
        videoQuality: 'poor' | 'acceptable' | 'good' | 'excellent'
        audioQuality: 'poor' | 'acceptable' | 'good' | 'excellent'
        contentQuality: number
        expertiseDemonstrated: boolean
        duplicateAccount: boolean
        fraudRisk: 'low' | 'medium' | 'high'
    }
    revisionHistory?: {
        requestedDate: string
        requestedBy: string
        reason: string
        resubmittedDate?: string
    }[]
}

interface QualityChecklist {
    sampleContent: {
        videoQuality: boolean
        audioClarity: boolean
        teachingClarity: boolean
        contentUniqueness: boolean
    }
    expertise: {
        knowledgeDemonstrated: boolean
        appropriateLevel: boolean
        certifications: boolean
    }
    professionalism: {
        clearCommunication: boolean
        appropriatePresentation: boolean
        professionalDemeanor: boolean
    }
    platformFit: {
        educationalFocus: boolean
        alignsWithValues: boolean
        targetAudienceClear: boolean
    }
}

const MOCK_APPLICATIONS: CreatorApplication[] = [
    {
        id: 'APP-1001',
        applicantName: 'Dr. Ahmed Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+20 100 123 4567',
        submittedDate: '2024-10-14T10:00:00Z',
        daysInQueue: 2,
        slaStatus: 'on_time',
        status: 'pending',
        expertise: 'Data Science & Machine Learning',
        teachingExperience: 5,
        sampleContentUrl: '/sample-videos/ahmed-ml.mp4',
        sampleContentTitle: 'Introduction to Neural Networks',
        portfolioUrl: 'https://ahmedml.com',
        linkedinUrl: 'https://linkedin.com/in/ahmedhassan',
        motivation: 'I want to share my 5+ years of industry experience in ML with Arabic-speaking students who lack quality resources.',
        requestedTier: 'premium',
        identityVerification: {
            status: 'verified',
            idUploaded: true,
            selfieUploaded: true,
            addressProofUploaded: true
        },
        autoPreScreening: {
            videoQuality: 'excellent',
            audioQuality: 'excellent',
            contentQuality: 92,
            expertiseDemonstrated: true,
            duplicateAccount: false,
            fraudRisk: 'low'
        }
    },
    {
        id: 'APP-1002',
        applicantName: 'Fatma Mohamed',
        email: 'fatma.m@example.com',
        phone: '+20 101 234 5678',
        submittedDate: '2024-10-10T14:30:00Z',
        daysInQueue: 6,
        slaStatus: 'on_time',
        status: 'under_review',
        expertise: 'Web Development (React & Node.js)',
        teachingExperience: 3,
        sampleContentUrl: '/sample-videos/fatma-react.mp4',
        sampleContentTitle: 'React Hooks Explained',
        portfolioUrl: 'https://fatmadev.com',
        motivation: 'I have been teaching web development bootcamps for 3 years and want to reach more students online.',
        requestedTier: 'basic',
        identityVerification: {
            status: 'verified',
            idUploaded: true,
            selfieUploaded: true,
            addressProofUploaded: true
        },
        autoPreScreening: {
            videoQuality: 'good',
            audioQuality: 'good',
            contentQuality: 85,
            expertiseDemonstrated: true,
            duplicateAccount: false,
            fraudRisk: 'low'
        }
    },
    {
        id: 'APP-1003',
        applicantName: 'Omar Khaled',
        email: 'omar.k@example.com',
        phone: '+20 102 345 6789',
        submittedDate: '2024-10-05T09:15:00Z',
        daysInQueue: 11,
        slaStatus: 'breached',
        status: 'revisions_requested',
        expertise: 'Arabic Language & Grammar',
        teachingExperience: 8,
        sampleContentUrl: '/sample-videos/omar-arabic.mp4',
        sampleContentTitle: 'Arabic Grammar Fundamentals',
        motivation: 'As a certified Arabic teacher for 8 years, I want to help non-native speakers learn proper Arabic.',
        requestedTier: 'basic',
        identityVerification: {
            status: 'pending',
            idUploaded: true,
            selfieUploaded: false,
            addressProofUploaded: true
        },
        autoPreScreening: {
            videoQuality: 'acceptable',
            audioQuality: 'acceptable',
            contentQuality: 68,
            expertiseDemonstrated: true,
            duplicateAccount: false,
            fraudRisk: 'low'
        },
        revisionHistory: [
            {
                requestedDate: '2024-10-08T10:00:00Z',
                requestedBy: 'Admin Team',
                reason: 'Please upload a selfie for identity verification and improve video quality (better lighting recommended).',
                resubmittedDate: '2024-10-12T15:30:00Z'
            }
        ]
    },
    {
        id: 'APP-1004',
        applicantName: 'Sara Ali',
        email: 'sara.ali@example.com',
        phone: '+20 103 456 7890',
        submittedDate: '2024-10-15T11:45:00Z',
        daysInQueue: 1,
        slaStatus: 'on_time',
        status: 'pending',
        expertise: 'Business & Entrepreneurship',
        teachingExperience: 10,
        sampleContentUrl: '/sample-videos/sara-business.mp4',
        sampleContentTitle: 'Startup Fundamentals for Egypt',
        portfolioUrl: 'https://sarabusiness.com',
        linkedinUrl: 'https://linkedin.com/in/saraali',
        motivation: 'I founded 3 successful startups and want to mentor the next generation of Egyptian entrepreneurs.',
        requestedTier: 'signature',
        identityVerification: {
            status: 'verified',
            idUploaded: true,
            selfieUploaded: true,
            addressProofUploaded: true
        },
        autoPreScreening: {
            videoQuality: 'excellent',
            audioQuality: 'excellent',
            contentQuality: 95,
            expertiseDemonstrated: true,
            duplicateAccount: false,
            fraudRisk: 'low'
        }
    },
    {
        id: 'APP-1005',
        applicantName: 'Khaled Ibrahim',
        email: 'khaled.i@example.com',
        phone: '+20 104 567 8901',
        submittedDate: '2024-10-03T08:20:00Z',
        daysInQueue: 13,
        slaStatus: 'breached',
        status: 'under_review',
        expertise: 'Mathematics & Physics',
        teachingExperience: 6,
        sampleContentUrl: '/sample-videos/khaled-math.mp4',
        sampleContentTitle: 'Advanced Calculus Made Simple',
        motivation: 'I teach at a university and want to help high school students prepare for university-level math.',
        requestedTier: 'basic',
        identityVerification: {
            status: 'verified',
            idUploaded: true,
            selfieUploaded: true,
            addressProofUploaded: true
        },
        autoPreScreening: {
            videoQuality: 'good',
            audioQuality: 'excellent',
            contentQuality: 88,
            expertiseDemonstrated: true,
            duplicateAccount: false,
            fraudRisk: 'low'
        }
    }
]

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    revisions_requested: 'bg-orange-100 text-orange-800 border-orange-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
}

const slaStatusColors = {
    on_time: 'bg-green-100 text-green-800 border-green-200',
    near_breach: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    breached: 'bg-red-100 text-red-800 border-red-200'
}

const verificationStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    verified: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
}

const qualityColors = {
    poor: 'bg-red-100 text-red-800 border-red-200',
    acceptable: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    good: 'bg-blue-100 text-blue-800 border-blue-200',
    excellent: 'bg-green-100 text-green-800 border-green-200'
}

const riskColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
}

export default function EnhancedCreatorApplicationReview() {
    const [activeTab, setActiveTab] = useState('pending')
    const [applications] = useState<CreatorApplication[]>(MOCK_APPLICATIONS)
    const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewAction, setReviewAction] = useState<'approve' | 'request_revisions' | 'reject'>('approve')
    const [reviewNotes, setReviewNotes] = useState('')
    const [checklist, setChecklist] = useState<QualityChecklist>({
        sampleContent: { videoQuality: false, audioClarity: false, teachingClarity: false, contentUniqueness: false },
        expertise: { knowledgeDemonstrated: false, appropriateLevel: false, certifications: false },
        professionalism: { clearCommunication: false, appropriatePresentation: false, professionalDemeanor: false },
        platformFit: { educationalFocus: false, alignsWithValues: false, targetAudienceClear: false }
    })

    const pendingApplications = applications.filter(a => a.status === 'pending')
    const underReview = applications.filter(a => a.status === 'under_review')
    const revisionsRequested = applications.filter(a => a.status === 'revisions_requested')
    const slaBreached = applications.filter(a => a.slaStatus === 'breached')

    const stats = {
        totalPending: pendingApplications.length,
        underReview: underReview.length,
        revisionsRequested: revisionsRequested.length,
        slaBreached: slaBreached.length,
        avgReviewTime: 5.2,
        approvalRate: 78
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

    const handleStartReview = (application: CreatorApplication) => {
        setSelectedApplication(application)
        setReviewAction('approve')
        setReviewNotes('')
        setChecklist({
            sampleContent: { videoQuality: false, audioClarity: false, teachingClarity: false, contentUniqueness: false },
            expertise: { knowledgeDemonstrated: false, appropriateLevel: false, certifications: false },
            professionalism: { clearCommunication: false, appropriatePresentation: false, professionalDemeanor: false },
            platformFit: { educationalFocus: false, alignsWithValues: false, targetAudienceClear: false }
        })
        setShowReviewModal(true)
    }

    const calculateChecklistCompletion = () => {
        const allItems = [
            ...Object.values(checklist.sampleContent),
            ...Object.values(checklist.expertise),
            ...Object.values(checklist.professionalism),
            ...Object.values(checklist.platformFit)
        ]
        const completed = allItems.filter(Boolean).length
        return Math.round((completed / allItems.length) * 100)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Creator Application Review</h1>
                        <p className="text-muted-foreground">Review applications with 10-day SLA tracking and revision workflow</p>
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
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalPending}</div>
                        <div className="text-sm text-muted-foreground mt-1">Pending Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.underReview}</div>
                        <div className="text-sm text-muted-foreground mt-1">Under Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <RefreshCw className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.revisionsRequested}</div>
                        <div className="text-sm text-muted-foreground mt-1">Revisions Requested</div>
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

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Award className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.approvalRate}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Approval Rate</div>
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
                                <TabsTrigger value="revisions" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Revisions ({stats.revisionsRequested})
                                </TabsTrigger>
                                <TabsTrigger value="sla_breach" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    SLA Breach ({stats.slaBreached})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Pending Tab */}
                        <TabsContent value="pending" className="p-6">
                            <div className="space-y-4">
                                {pendingApplications.map((app) => (
                                    <div key={app.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-purple-500/20 rounded-lg p-2">
                                                        <User className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{app.applicantName}</h4>
                                                        <p className="text-sm text-muted-foreground">{app.email} • {app.phone}</p>
                                                    </div>
                                                    <Badge className={statusColors[app.status]}>
                                                        {app.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Badge className={slaStatusColors[app.slaStatus]}>
                                                        Day {app.daysInQueue}/10
                                                    </Badge>
                                                    <Badge className={verificationStatusColors[app.identityVerification.status]}>
                                                        ID: {app.identityVerification.status}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-4 gap-4 mb-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Expertise</div>
                                                        <div className="text-sm text-foreground">{app.expertise}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Experience</div>
                                                        <div className="text-sm text-foreground">{app.teachingExperience} years</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Requested Tier</div>
                                                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                                            {app.requestedTier.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Submitted</div>
                                                        <div className="text-sm text-foreground">{formatDate(app.submittedDate)}</div>
                                                    </div>
                                                </div>

                                                {/* Auto Pre-Screening Results */}
                                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                                    <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                                        <Shield className="w-4 h-4 text-blue-400" />
                                                        Automated Pre-Screening
                                                    </h5>
                                                    <div className="grid grid-cols-6 gap-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Video</div>
                                                            <Badge className={qualityColors[app.autoPreScreening.videoQuality]}>
                                                                {app.autoPreScreening.videoQuality}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Audio</div>
                                                            <Badge className={qualityColors[app.autoPreScreening.audioQuality]}>
                                                                {app.autoPreScreening.audioQuality}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Content Score</div>
                                                            <Badge className={app.autoPreScreening.contentQuality >= 85 ? qualityColors.excellent : app.autoPreScreening.contentQuality >= 70 ? qualityColors.good : qualityColors.acceptable}>
                                                                {app.autoPreScreening.contentQuality}/100
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Expertise</div>
                                                            <Badge className={app.autoPreScreening.expertiseDemonstrated ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                                                                {app.autoPreScreening.expertiseDemonstrated ? 'Demonstrated' : 'Unclear'}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Duplicate</div>
                                                            <Badge className={app.autoPreScreening.duplicateAccount ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}>
                                                                {app.autoPreScreening.duplicateAccount ? 'Detected' : 'None'}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Fraud Risk</div>
                                                            <Badge className={riskColors[app.autoPreScreening.fraudRisk]}>
                                                                {app.autoPreScreening.fraudRisk}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Social Proof */}
                                                <div className="flex items-center gap-3 mt-3">
                                                    {app.portfolioUrl && (
                                                        <a
                                                            href={app.portfolioUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                                                        >
                                                            <Globe className="w-4 h-4" />
                                                            Portfolio
                                                        </a>
                                                    )}
                                                    {app.linkedinUrl && (
                                                        <a
                                                            href={app.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                                                        >
                                                            <Linkedin className="w-4 h-4" />
                                                            LinkedIn
                                                        </a>
                                                    )}
                                                    <button className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300">
                                                        <PlayCircle className="w-4 h-4" />
                                                        Watch Sample: {app.sampleContentTitle}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button
                                                    className="bg-purple-600 hover:bg-purple-700 text-foreground"
                                                    onClick={() => handleStartReview(app)}
                                                >
                                                    <CheckSquare className="w-4 h-4 mr-2" />
                                                    Start Review
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Full Profile
                                                </Button>
                                            </div>
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
                                            <h4 className="font-semibold text-blue-300 mb-1">Applications Currently Under Review</h4>
                                            <p className="text-sm text-blue-200/80">
                                                These applications are being actively reviewed by team members. Complete review within SLA.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {underReview.map((app) => (
                                    <div key={app.id} className="bg-white/5 rounded-lg p-5 border border-border">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-blue-500/20 rounded-lg p-2">
                                                        <User className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{app.applicantName}</h4>
                                                        <p className="text-sm text-muted-foreground">{app.expertise} • {app.teachingExperience} years</p>
                                                    </div>
                                                    <Badge className={statusColors[app.status]}>
                                                        {app.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Badge className={slaStatusColors[app.slaStatus]}>
                                                        Day {app.daysInQueue}/10
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    Sample: {app.sampleContentTitle} • Score: {app.autoPreScreening.contentQuality}/100
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-green-600 hover:bg-green-700 text-foreground ml-4"
                                                onClick={() => handleStartReview(app)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Complete Review
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Revisions Tab */}
                        <TabsContent value="revisions" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <RefreshCw className="w-5 h-5 text-orange-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-orange-300 mb-1">Revisions Requested - Awaiting Resubmission</h4>
                                            <p className="text-sm text-orange-200/80">
                                                Applications where revisions were requested. Monitor resubmission deadline (5 days).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {revisionsRequested.map((app) => (
                                    <div key={app.id} className="bg-white/5 rounded-lg p-5 border border-orange-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-orange-500/20 rounded-lg p-2">
                                                        <RefreshCw className="w-5 h-5 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{app.applicantName}</h4>
                                                        <p className="text-sm text-muted-foreground">{app.expertise}</p>
                                                    </div>
                                                    <Badge className={statusColors[app.status]}>
                                                        {app.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </div>

                                                {/* Revision History */}
                                                {app.revisionHistory && app.revisionHistory.length > 0 && (
                                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-3">
                                                        <h5 className="text-sm font-semibold text-orange-300 mb-2">Latest Revision Request</h5>
                                                        <div className="text-sm text-muted-foreground mb-2">
                                                            <strong>Requested:</strong> {formatDate(app.revisionHistory[0].requestedDate)} by {app.revisionHistory[0].requestedBy}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mb-2">
                                                            <strong>Reason:</strong> {app.revisionHistory[0].reason}
                                                        </div>
                                                        {app.revisionHistory[0].resubmittedDate && (
                                                            <div className="text-sm text-green-400">
                                                                <strong>Resubmitted:</strong> {formatDate(app.revisionHistory[0].resubmittedDate)} ✓
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Days in Queue</div>
                                                        <div className="text-lg font-semibold text-foreground">{app.daysInQueue} days</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Revision Count</div>
                                                        <div className="text-lg font-semibold text-foreground">{app.revisionHistory?.length || 0}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Status</div>
                                                        <Badge className={slaStatusColors[app.slaStatus]}>
                                                            {app.slaStatus === 'breached' ? 'SLA BREACHED' : 'On Track'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 ml-4">
                                                <Button
                                                    className="bg-purple-600 hover:bg-purple-700 text-foreground"
                                                    onClick={() => handleStartReview(app)}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Review Resubmission
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View History
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
                                                These applications have exceeded the 10-day review SLA. Priority review needed immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {slaBreached.map((app) => (
                                    <div key={app.id} className="bg-white/5 rounded-lg p-5 border border-red-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-red-500/20 rounded-lg p-2">
                                                        <AlertCircle className="w-5 h-5 text-red-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{app.applicantName}</h4>
                                                        <p className="text-sm text-muted-foreground">{app.expertise}</p>
                                                    </div>
                                                    <Badge className="bg-red-100 text-red-800 border-red-200 text-lg px-3 py-1">
                                                        DAY {app.daysInQueue}/10 - BREACHED
                                                    </Badge>
                                                    <Badge className={statusColors[app.status]}>
                                                        {app.status.replace(/_/g, ' ')}
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    Submitted: {formatDate(app.submittedDate)} • Content Score: {app.autoPreScreening.contentQuality}/100
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-red-600 hover:bg-red-700 text-foreground ml-4"
                                                onClick={() => handleStartReview(app)}
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

            {/* Review Modal with Checklist */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Creator Application Review</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {selectedApplication?.applicantName} • {selectedApplication?.expertise}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedApplication && (
                        <div className="space-y-6 mt-4">
                            {/* Progress Bar */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Review Checklist Completion</span>
                                    <span className="text-sm font-semibold text-foreground">{calculateChecklistCompletion()}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                        style={{ width: `${calculateChecklistCompletion()}%` }}
                                    />
                                </div>
                            </div>

                            {/* Application Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="font-semibold text-foreground mb-3">Applicant Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Name:</span>
                                            <span className="text-foreground font-semibold">{selectedApplication.applicantName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span className="text-foreground">{selectedApplication.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Phone:</span>
                                            <span className="text-foreground">{selectedApplication.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Experience:</span>
                                            <span className="text-foreground">{selectedApplication.teachingExperience} years</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Requested Tier:</span>
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                                {selectedApplication.requestedTier.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="font-semibold text-foreground mb-3">Identity Verification</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Overall Status:</span>
                                            <Badge className={verificationStatusColors[selectedApplication.identityVerification.status]}>
                                                {selectedApplication.identityVerification.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">ID Document:</span>
                                            {selectedApplication.identityVerification.idUploaded ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-400" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Selfie Verification:</span>
                                            {selectedApplication.identityVerification.selfieUploaded ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-400" />
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Address Proof:</span>
                                            {selectedApplication.identityVerification.addressProofUploaded ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Motivation */}
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-2">Teaching Motivation</h4>
                                <p className="text-sm text-muted-foreground">{selectedApplication.motivation}</p>
                            </div>

                            {/* Quality Checklist */}
                            <div className="space-y-4">
                                {/* Sample Content Quality */}
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <PlayCircle className="w-5 h-5 text-purple-400" />
                                        Sample Content Quality
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries({
                                            videoQuality: 'Video quality acceptable (720p+, good lighting)',
                                            audioClarity: 'Audio clear & professional',
                                            teachingClarity: 'Teaching approach clear & effective',
                                            contentUniqueness: 'Content unique & valuable'
                                        }).map(([key, label]) => (
                                            <div key={key} className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={checklist.sampleContent[key as keyof typeof checklist.sampleContent]}
                                                    onCheckedChange={(checked) => {
                                                        setChecklist(prev => ({
                                                            ...prev,
                                                            sampleContent: {
                                                                ...prev.sampleContent,
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

                                {/* Expertise Verification */}
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-blue-400" />
                                        Expertise Verification
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries({
                                            knowledgeDemonstrated: 'Knowledge clearly demonstrated',
                                            appropriateLevel: 'Appropriate level for target audience',
                                            certifications: 'Certifications/credentials verified (if applicable)'
                                        }).map(([key, label]) => (
                                            <div key={key} className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={checklist.expertise[key as keyof typeof checklist.expertise]}
                                                    onCheckedChange={(checked) => {
                                                        setChecklist(prev => ({
                                                            ...prev,
                                                            expertise: {
                                                                ...prev.expertise,
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

                                {/* Professionalism */}
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-400" />
                                        Professionalism
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries({
                                            clearCommunication: 'Clear & effective communication',
                                            appropriatePresentation: 'Appropriate presentation & demeanor',
                                            professionalDemeanor: 'Professional approach to teaching'
                                        }).map(([key, label]) => (
                                            <div key={key} className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={checklist.professionalism[key as keyof typeof checklist.professionalism]}
                                                    onCheckedChange={(checked) => {
                                                        setChecklist(prev => ({
                                                            ...prev,
                                                            professionalism: {
                                                                ...prev.professionalism,
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

                                {/* Platform Fit */}
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-yellow-400" />
                                        Platform Fit
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries({
                                            educationalFocus: 'Educational focus (not entertainment)',
                                            alignsWithValues: 'Aligns with platform values',
                                            targetAudienceClear: 'Target audience clear & appropriate'
                                        }).map(([key, label]) => (
                                            <div key={key} className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={checklist.platformFit[key as keyof typeof checklist.platformFit]}
                                                    onCheckedChange={(checked) => {
                                                        setChecklist(prev => ({
                                                            ...prev,
                                                            platformFit: {
                                                                ...prev.platformFit,
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
                                            <span className="font-semibold text-green-400">Approve</span> - Grant creator access immediately
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
                                            <span className="font-semibold text-yellow-400">Request Revisions</span> - Specific improvements needed (5-day deadline)
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
                                            <span className="font-semibold text-red-400">Reject</span> - Application does not meet standards
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="text-sm text-muted-foreground mb-2 block">
                                        Feedback to Applicant {reviewAction !== 'approve' && <span className="text-red-400">*</span>}
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
                                        onClick={() => {
                                            console.log('Approved:', selectedApplication.id)
                                            setShowReviewModal(false)
                                        }}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve Application
                                    </Button>
                                )}
                                {reviewAction === 'request_revisions' && (
                                    <Button
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-foreground"
                                        onClick={() => {
                                            console.log('Revisions requested:', selectedApplication.id)
                                            setShowReviewModal(false)
                                        }}
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Request Revisions
                                    </Button>
                                )}
                                {reviewAction === 'reject' && (
                                    <Button
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-foreground"
                                        onClick={() => {
                                            console.log('Rejected:', selectedApplication.id)
                                            setShowReviewModal(false)
                                        }}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject Application
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                    onClick={() => setShowReviewModal(false)}
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
