'use client'

import React, { useState } from 'react'
import {
    GraduationCap,
    Plus,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    FileText,
    Target,
    AlertTriangle,
    Download,
    Filter,
    Eye,
    BarChart3
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type CampaignStatus = 'active' | 'draft' | 'ended' | 'paused'
type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed'
type EligibilityType = 'income_based' | 'merit_based' | 'demographic' | 'hybrid'

interface ScholarshipCampaign {
    id: string
    name: string
    description: string
    status: CampaignStatus
    eligibilityType: EligibilityType
    totalBudget: number
    budgetUsed: number
    maxRecipients: number
    recipientsCount: number
    creditAmount: number
    validityDays: number
    startDate: string
    endDate: string
    criteria: {
        maxIncome?: number
        minCompletionRate?: number
        minRating?: number
        ageRange?: { min: number; max: number }
        locations?: string[]
        educationLevel?: string[]
    }
    requirements: string[]
}

interface ScholarshipApplication {
    id: string
    campaignId: string
    campaignName: string
    applicantName: string
    applicantEmail: string
    applicantId: string
    appliedAt: string
    status: ApplicationStatus
    score: number
    income: number
    demographics: {
        age: number
        location: string
        education: string
    }
    performance: {
        coursesCompleted: number
        avgRating: number
        completionRate: number
    }
    documents: {
        idCard: boolean
        incomeProof: boolean
        enrollmentProof: boolean
    }
    reviewNotes: string
    creditAmount: number
    expiryDate?: string
    disbursedAt?: string
    usageStatus?: {
        creditsUsed: number
        coursesEnrolled: string[]
    }
}

const MOCK_CAMPAIGNS: ScholarshipCampaign[] = [
    {
        id: 'SCH-2024-001',
        name: 'Tech Skills for Underserved Communities',
        description: 'Supporting low-income students to access technology and programming courses',
        status: 'active',
        eligibilityType: 'income_based',
        totalBudget: 500000,
        budgetUsed: 245000,
        maxRecipients: 100,
        recipientsCount: 49,
        creditAmount: 5000,
        validityDays: 180,
        startDate: '2024-09-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        criteria: {
            maxIncome: 5000,
            locations: ['Cairo', 'Giza', 'Alexandria'],
            educationLevel: ['High School', 'University Student']
        },
        requirements: ['National ID', 'Income Certificate', 'Student Enrollment Proof']
    },
    {
        id: 'SCH-2024-002',
        name: 'Women in STEM Excellence Program',
        description: 'Merit-based scholarships for high-performing female students in STEM fields',
        status: 'active',
        eligibilityType: 'merit_based',
        totalBudget: 300000,
        budgetUsed: 150000,
        maxRecipients: 50,
        recipientsCount: 30,
        creditAmount: 5000,
        validityDays: 365,
        startDate: '2024-08-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        criteria: {
            minCompletionRate: 85,
            minRating: 4.5,
            ageRange: { min: 18, max: 35 }
        },
        requirements: ['National ID', 'Academic Transcript', 'Portfolio']
    },
    {
        id: 'SCH-2024-003',
        name: 'Rural Education Initiative',
        description: 'Supporting students from rural areas to access online education',
        status: 'active',
        eligibilityType: 'demographic',
        totalBudget: 200000,
        budgetUsed: 80000,
        maxRecipients: 40,
        recipientsCount: 16,
        creditAmount: 5000,
        validityDays: 180,
        startDate: '2024-10-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        criteria: {
            locations: ['Assiut', 'Minya', 'Sohag', 'Qena'],
            maxIncome: 4000
        },
        requirements: ['National ID', 'Residency Proof', 'Income Certificate']
    }
]

const MOCK_APPLICATIONS: ScholarshipApplication[] = [
    {
        id: 'APP-1001',
        campaignId: 'SCH-2024-001',
        campaignName: 'Tech Skills for Underserved Communities',
        applicantName: 'Ahmed Mohamed',
        applicantEmail: 'ahmed.m@example.com',
        applicantId: 'user-789',
        appliedAt: '2024-10-15T10:30:00Z',
        status: 'pending',
        score: 85,
        income: 3500,
        demographics: {
            age: 22,
            location: 'Cairo',
            education: 'University Student'
        },
        performance: {
            coursesCompleted: 5,
            avgRating: 4.6,
            completionRate: 88
        },
        documents: {
            idCard: true,
            incomeProof: true,
            enrollmentProof: true
        },
        reviewNotes: '',
        creditAmount: 5000
    },
    {
        id: 'APP-1002',
        campaignId: 'SCH-2024-002',
        campaignName: 'Women in STEM Excellence Program',
        applicantName: 'Fatma Ali',
        applicantEmail: 'fatma.ali@example.com',
        applicantId: 'user-654',
        appliedAt: '2024-10-14T14:20:00Z',
        status: 'under_review',
        score: 92,
        income: 6000,
        demographics: {
            age: 24,
            location: 'Alexandria',
            education: 'University Graduate'
        },
        performance: {
            coursesCompleted: 12,
            avgRating: 4.8,
            completionRate: 95
        },
        documents: {
            idCard: true,
            incomeProof: true,
            enrollmentProof: true
        },
        reviewNotes: 'Exceptional performance. Strong portfolio.',
        creditAmount: 5000
    },
    {
        id: 'APP-1003',
        campaignId: 'SCH-2024-001',
        campaignName: 'Tech Skills for Underserved Communities',
        applicantName: 'Sara Hassan',
        applicantEmail: 'sara.h@example.com',
        applicantId: 'user-321',
        appliedAt: '2024-10-10T09:00:00Z',
        status: 'approved',
        score: 88,
        income: 2800,
        demographics: {
            age: 20,
            location: 'Giza',
            education: 'High School'
        },
        performance: {
            coursesCompleted: 3,
            avgRating: 4.7,
            completionRate: 92
        },
        documents: {
            idCard: true,
            incomeProof: true,
            enrollmentProof: true
        },
        reviewNotes: 'Meets all criteria. Approved for disbursement.',
        creditAmount: 5000,
        expiryDate: '2025-04-10T00:00:00Z'
    },
    {
        id: 'APP-1004',
        campaignId: 'SCH-2024-002',
        campaignName: 'Women in STEM Excellence Program',
        applicantName: 'Nour Ibrahim',
        applicantEmail: 'nour.i@example.com',
        applicantId: 'user-987',
        appliedAt: '2024-10-08T11:00:00Z',
        status: 'disbursed',
        score: 95,
        income: 5500,
        demographics: {
            age: 26,
            location: 'Cairo',
            education: 'University Graduate'
        },
        performance: {
            coursesCompleted: 15,
            avgRating: 4.9,
            completionRate: 98
        },
        documents: {
            idCard: true,
            incomeProof: true,
            enrollmentProof: true
        },
        reviewNotes: 'Top candidate. Disbursed successfully.',
        creditAmount: 5000,
        expiryDate: '2025-10-08T00:00:00Z',
        disbursedAt: '2024-10-12T15:00:00Z',
        usageStatus: {
            creditsUsed: 3500,
            coursesEnrolled: ['Machine Learning Basics', 'Web Development']
        }
    },
    {
        id: 'APP-1005',
        campaignId: 'SCH-2024-003',
        campaignName: 'Rural Education Initiative',
        applicantName: 'Khaled Youssef',
        applicantEmail: 'khaled.y@example.com',
        applicantId: 'user-456',
        appliedAt: '2024-10-16T08:00:00Z',
        status: 'pending',
        score: 78,
        income: 3000,
        demographics: {
            age: 19,
            location: 'Assiut',
            education: 'High School'
        },
        performance: {
            coursesCompleted: 2,
            avgRating: 4.3,
            completionRate: 75
        },
        documents: {
            idCard: true,
            incomeProof: true,
            enrollmentProof: false
        },
        reviewNotes: '',
        creditAmount: 5000
    }
]

const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    draft: 'bg-muted text-gray-800 border-border',
    ended: 'bg-red-100 text-red-800 border-red-200',
    paused: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const applicationStatusColors = {
    pending: 'bg-blue-100 text-blue-800 border-blue-200',
    under_review: 'bg-purple-100 text-purple-800 border-purple-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    disbursed: 'bg-emerald-100 text-emerald-800 border-emerald-200'
}

const eligibilityColors = {
    income_based: 'bg-blue-100 text-blue-800 border-blue-200',
    merit_based: 'bg-purple-100 text-purple-800 border-purple-200',
    demographic: 'bg-orange-100 text-orange-800 border-orange-200',
    hybrid: 'bg-pink-100 text-pink-800 border-pink-200'
}

export default function ScholarshipsPage() {
    const [activeTab, setActiveTab] = useState('campaigns')
    const [campaigns] = useState<ScholarshipCampaign[]>(MOCK_CAMPAIGNS)
    const [applications] = useState<ScholarshipApplication[]>(MOCK_APPLICATIONS)
    const [selectedCampaign, setSelectedCampaign] = useState<ScholarshipCampaign | null>(null)
    const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplication | null>(null)
    const [showCampaignModal, setShowCampaignModal] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject'>('approve')
    const [reviewNotes, setReviewNotes] = useState('')

    const pending = applications.filter(a => a.status === 'pending')
    const underReview = applications.filter(a => a.status === 'under_review')
    const approved = applications.filter(a => a.status === 'approved')
    const disbursed = applications.filter(a => a.status === 'disbursed')

    const stats = {
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalBudget: campaigns.reduce((sum, c) => sum + c.totalBudget, 0),
        budgetUsed: campaigns.reduce((sum, c) => sum + c.budgetUsed, 0),
        totalRecipients: campaigns.reduce((sum, c) => sum + c.recipientsCount, 0),
        pendingApplications: pending.length,
        utilizationRate: 78 // Mock data
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatCurrency = (amount: number) => {
        return `E£${(amount / 1000).toFixed(0)}k`
    }

    const handleViewCampaign = (campaign: ScholarshipCampaign) => {
        setSelectedCampaign(campaign)
        setShowCampaignModal(true)
    }

    const handleReviewApplication = (app: ScholarshipApplication) => {
        setSelectedApplication(app)
        setReviewDecision('approve')
        setReviewNotes(app.reviewNotes || '')
        setShowReviewModal(true)
    }

    const handleSubmitReview = () => {
        console.log('Review submitted:', {
            applicationId: selectedApplication?.id,
            decision: reviewDecision,
            notes: reviewNotes
        })
        setShowReviewModal(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Scholarship Management</h1>
                        <p className="text-muted-foreground">Support learners through targeted financial aid programs</p>
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
                        <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            New Campaign
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Award className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.activeCampaigns}</div>
                        <div className="text-sm text-muted-foreground mt-1">Active Campaigns</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalBudget)}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Budget</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.budgetUsed)}</div>
                        <div className="text-sm text-muted-foreground mt-1">Budget Used</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalRecipients}</div>
                        <div className="text-sm text-muted-foreground mt-1">Recipients</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.pendingApplications}</div>
                        <div className="text-sm text-muted-foreground mt-1">Pending Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.utilizationRate}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Utilization Rate</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="campaigns" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Award className="w-4 h-4 mr-2" />
                                    Campaigns ({campaigns.length})
                                </TabsTrigger>
                                <TabsTrigger value="applications" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Applications ({applications.length})
                                </TabsTrigger>
                                <TabsTrigger value="disbursed" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Disbursed ({disbursed.length})
                                </TabsTrigger>
                                <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Analytics
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Campaigns Tab */}
                        <TabsContent value="campaigns" className="p-6">
                            <div className="space-y-4">
                                {campaigns.map((campaign) => {
                                    const budgetPercent = (campaign.budgetUsed / campaign.totalBudget) * 100
                                    const recipientPercent = (campaign.recipientsCount / campaign.maxRecipients) * 100

                                    return (
                                        <div key={campaign.id} className="bg-white/5 rounded-lg p-6 border border-border hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="bg-blue-500/20 rounded-lg p-2">
                                                            <GraduationCap className="w-6 h-6 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-foreground">{campaign.name}</h3>
                                                            <p className="text-sm text-muted-foreground">{campaign.id}</p>
                                                        </div>
                                                        <Badge className={statusColors[campaign.status]}>
                                                            {campaign.status}
                                                        </Badge>
                                                        <Badge className={eligibilityColors[campaign.eligibilityType]}>
                                                            {campaign.eligibilityType.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-muted-foreground mb-4">{campaign.description}</p>

                                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Budget</div>
                                                            <div className="text-lg font-semibold text-foreground">
                                                                {formatCurrency(campaign.budgetUsed)} / {formatCurrency(campaign.totalBudget)}
                                                            </div>
                                                            <div className="w-full bg-white/10 rounded-full h-2 mt-1">
                                                                <div
                                                                    className="bg-blue-400 h-2 rounded-full"
                                                                    style={{ width: `${budgetPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Recipients</div>
                                                            <div className="text-lg font-semibold text-foreground">
                                                                {campaign.recipientsCount} / {campaign.maxRecipients}
                                                            </div>
                                                            <div className="w-full bg-white/10 rounded-full h-2 mt-1">
                                                                <div
                                                                    className="bg-emerald-400 h-2 rounded-full"
                                                                    style={{ width: `${recipientPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Credit Amount</div>
                                                            <div className="text-lg font-semibold text-green-400">
                                                                {formatCurrency(campaign.creditAmount)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Duration</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 rounded-lg p-3 border border-border">
                                                        <h4 className="text-sm font-semibold text-foreground mb-2">Eligibility Criteria</h4>
                                                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                            {campaign.criteria.maxIncome && (
                                                                <div>• Max Income: E£{campaign.criteria.maxIncome.toLocaleString()}</div>
                                                            )}
                                                            {campaign.criteria.minCompletionRate && (
                                                                <div>• Min Completion: {campaign.criteria.minCompletionRate}%</div>
                                                            )}
                                                            {campaign.criteria.minRating && (
                                                                <div>• Min Rating: {campaign.criteria.minRating} ⭐</div>
                                                            )}
                                                            {campaign.criteria.locations && (
                                                                <div>• Locations: {campaign.criteria.locations.join(', ')}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700 text-foreground ml-4"
                                                    onClick={() => handleViewCampaign(campaign)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        {/* Applications Tab */}
                        <TabsContent value="applications" className="p-6">
                            <div className="space-y-4">
                                {[...pending, ...underReview].map((app) => {
                                    const allDocuments = Object.values(app.documents).every(v => v)

                                    return (
                                        <div key={app.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-purple-500/20 rounded-lg p-2">
                                                            <Users className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground text-lg">{app.applicantName}</h4>
                                                            <p className="text-sm text-muted-foreground">{app.campaignName}</p>
                                                        </div>
                                                        <Badge className={applicationStatusColors[app.status]}>
                                                            {app.status.replace(/_/g, ' ')}
                                                        </Badge>
                                                        <div className="bg-yellow-500/20 px-3 py-1 rounded-full">
                                                            <span className="text-sm font-semibold text-yellow-400">Score: {app.score}/100</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-5 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Income</div>
                                                            <div className="text-base font-semibold text-foreground">E£{app.income.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Age</div>
                                                            <div className="text-base font-semibold text-foreground">{app.demographics.age} years</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Location</div>
                                                            <div className="text-base font-semibold text-foreground">{app.demographics.location}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
                                                            <div className="text-base font-semibold text-green-400">{app.performance.completionRate}%</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Courses Done</div>
                                                            <div className="text-base font-semibold text-foreground">{app.performance.coursesCompleted}</div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 border border-border rounded-lg p-3 mb-2">
                                                        <h5 className="text-sm font-semibold text-foreground mb-2">Required Documents</h5>
                                                        <div className="flex gap-4">
                                                            {Object.entries({ idCard: 'ID Card', incomeProof: 'Income Proof', enrollmentProof: 'Enrollment' }).map(([key, label]) => (
                                                                <div key={key} className="flex items-center gap-2">
                                                                    {app.documents[key as keyof typeof app.documents] ? (
                                                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                                                    ) : (
                                                                        <XCircle className="w-4 h-4 text-red-400" />
                                                                    )}
                                                                    <span className="text-sm text-muted-foreground">{label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {!allDocuments && (
                                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                                                            <div className="flex items-center gap-2">
                                                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                                                <span className="text-sm text-yellow-300">Missing required documents</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        Applied {formatDate(app.appliedAt)}
                                                    </div>
                                                </div>

                                                <Button
                                                    className="bg-purple-600 hover:bg-purple-700 text-foreground ml-4"
                                                    onClick={() => handleReviewApplication(app)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Review
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        {/* Disbursed Tab */}
                        <TabsContent value="disbursed" className="p-6">
                            <div className="space-y-4">
                                {disbursed.map((app) => (
                                    <div key={app.id} className="bg-white/5 rounded-lg p-5 border border-emerald-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-emerald-500/20 rounded-lg p-2">
                                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{app.applicantName}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Disbursed {app.disbursedAt && formatDate(app.disbursedAt)} • Expires {app.expiryDate && formatDate(app.expiryDate)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {app.usageStatus && (
                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                                        <h5 className="text-sm font-semibold text-emerald-300 mb-2">Usage Status</h5>
                                                        <div className="grid grid-cols-3 gap-4 mb-2">
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Credits Used</div>
                                                                <div className="text-lg font-semibold text-foreground">
                                                                    E£{app.usageStatus.creditsUsed.toLocaleString()} / E£{app.creditAmount.toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Courses Enrolled</div>
                                                                <div className="text-lg font-semibold text-emerald-400">{app.usageStatus.coursesEnrolled.length}</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Remaining</div>
                                                                <div className="text-lg font-semibold text-yellow-400">
                                                                    E£{(app.creditAmount - app.usageStatus.creditsUsed).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            <strong>Enrolled Courses:</strong> {app.usageStatus.coursesEnrolled.join(', ')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Analytics Tab */}
                        <TabsContent value="analytics" className="p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/5 rounded-lg p-6 border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Budget Utilization</h3>
                                    <div className="space-y-4">
                                        {campaigns.map((campaign) => {
                                            const percent = (campaign.budgetUsed / campaign.totalBudget) * 100
                                            return (
                                                <div key={campaign.id}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm text-muted-foreground">{campaign.name}</span>
                                                        <span className="text-sm text-foreground">{percent.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full bg-white/10 rounded-full h-2">
                                                        <div
                                                            className="bg-blue-400 h-2 rounded-full"
                                                            style={{ width: `${percent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-6 border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Application Success Rate</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Approved</span>
                                            <span className="text-2xl font-bold text-green-400">{approved.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Disbursed</span>
                                            <span className="text-2xl font-bold text-emerald-400">{disbursed.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Success Rate</span>
                                            <span className="text-2xl font-bold text-blue-400">
                                                {((approved.length + disbursed.length) / applications.length * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Campaign Details Modal */}
            <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Campaign Details</DialogTitle>
                    </DialogHeader>

                    {selectedCampaign && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h3 className="text-xl font-semibold text-foreground mb-2">{selectedCampaign.name}</h3>
                                <p className="text-muted-foreground">{selectedCampaign.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Financial Details</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total Budget</span>
                                            <span className="text-foreground font-semibold">{formatCurrency(selectedCampaign.totalBudget)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Budget Used</span>
                                            <span className="text-blue-400 font-semibold">{formatCurrency(selectedCampaign.budgetUsed)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Credit per Recipient</span>
                                            <span className="text-green-400 font-semibold">{formatCurrency(selectedCampaign.creditAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Recipient Details</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Max Recipients</span>
                                            <span className="text-foreground font-semibold">{selectedCampaign.maxRecipients}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Current Recipients</span>
                                            <span className="text-emerald-400 font-semibold">{selectedCampaign.recipientsCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Credit Validity</span>
                                            <span className="text-yellow-400 font-semibold">{selectedCampaign.validityDays} days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Required Documents</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedCampaign.requirements.map((req, idx) => (
                                        <Badge key={idx} className="bg-blue-100 text-blue-800">
                                            <FileText className="w-3 h-3 mr-1" />
                                            {req}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Review Application Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Review Application</DialogTitle>
                    </DialogHeader>

                    {selectedApplication && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-2">{selectedApplication.applicantName}</h4>
                                <p className="text-sm text-muted-foreground">{selectedApplication.applicantEmail}</p>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Score</div>
                                    <div className="text-2xl font-bold text-yellow-400">{selectedApplication.score}/100</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Income</div>
                                    <div className="text-2xl font-bold text-foreground">E£{selectedApplication.income.toLocaleString()}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
                                    <div className="text-2xl font-bold text-green-400">{selectedApplication.performance.completionRate}%</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Avg Rating</div>
                                    <div className="text-2xl font-bold text-yellow-400">{selectedApplication.performance.avgRating}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="decision"
                                        checked={reviewDecision === 'approve'}
                                        onChange={() => setReviewDecision('approve')}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-green-400">Approve & Disburse</span> - Award scholarship credit
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="decision"
                                        checked={reviewDecision === 'reject'}
                                        onChange={() => setReviewDecision('reject')}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm text-muted-foreground">
                                        <span className="font-semibold text-red-400">Reject</span> - Does not meet criteria
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Review Notes</label>
                                <Textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add review notes and decision justification..."
                                    className="bg-white/5 border-border text-foreground min-h-[100px]"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitReview}
                                    className={`flex-1 ${
                                        reviewDecision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                    } text-foreground`}
                                >
                                    {reviewDecision === 'approve' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
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
