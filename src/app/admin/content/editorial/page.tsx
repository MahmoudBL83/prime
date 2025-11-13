'use client'

import React, { useState } from 'react'
import {
    Star,
    TrendingUp,
    Award,
    Calendar,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Sparkles,
    Home,
    Zap,
    BookOpen,
    Filter,
    Download,
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

type EditorialStatus = 'nominated' | 'under_review' | 'approved' | 'scheduled' | 'published' | 'rejected'
type FeaturedSection = 'homepage_hero' | 'topic_spotlight' | 'new_releases' | 'trending_now'

interface FeaturedContent {
    id: string
    courseId: string
    courseTitle: string
    creatorName: string
    category: string
    nominatedBy: string
    nominatedAt: string
    status: EditorialStatus
    featuredSection?: FeaturedSection
    scheduledDate?: string
    publishedDate?: string
    metrics: {
        enrollments: number
        rating: number
        completionRate: number
        revenue: number
    }
    qualityChecks: {
        productionQuality: boolean
        learningOutcomes: boolean
        marketDemand: boolean
        uniqueness: boolean
    }
    curatorNotes: string
    performanceData?: {
        conversionLift: number
        enrollmentIncrease: number
        viewsGenerated: number
    }
}

const MOCK_FEATURED_CONTENT: FeaturedContent[] = [
    {
        id: 'FT-1001',
        courseId: 'course-789',
        courseTitle: 'Complete Machine Learning Masterclass',
        creatorName: 'Dr. Ahmed Hassan',
        category: 'Data Science',
        nominatedBy: 'Editorial Team',
        nominatedAt: '2024-10-15T10:00:00Z',
        status: 'under_review',
        metrics: {
            enrollments: 2450,
            rating: 4.8,
            completionRate: 82,
            revenue: 245000
        },
        qualityChecks: {
            productionQuality: true,
            learningOutcomes: true,
            marketDemand: true,
            uniqueness: true
        },
        curatorNotes: 'Exceptional production quality. Strong student outcomes. High demand in Egyptian tech market.'
    },
    {
        id: 'FT-1002',
        courseId: 'course-654',
        courseTitle: 'Arabic Language Mastery for Beginners',
        creatorName: 'Prof. Fatma Mohamed',
        category: 'Languages',
        nominatedBy: 'Content Team',
        nominatedAt: '2024-10-14T14:30:00Z',
        status: 'scheduled',
        featuredSection: 'homepage_hero',
        scheduledDate: '2024-10-20T00:00:00Z',
        metrics: {
            enrollments: 1850,
            rating: 4.9,
            completionRate: 88,
            revenue: 185000
        },
        qualityChecks: {
            productionQuality: true,
            learningOutcomes: true,
            marketDemand: true,
            uniqueness: true
        },
        curatorNotes: 'Perfect for homepage hero. Unique approach to Arabic teaching. Excellent reviews.'
    },
    {
        id: 'FT-1003',
        courseId: 'course-321',
        courseTitle: 'Egyptian Entrepreneurship Bootcamp',
        creatorName: 'Sara Ali',
        category: 'Business',
        nominatedBy: 'Editorial Team',
        nominatedAt: '2024-10-10T09:00:00Z',
        status: 'published',
        featuredSection: 'topic_spotlight',
        scheduledDate: '2024-10-12T00:00:00Z',
        publishedDate: '2024-10-12T00:00:00Z',
        metrics: {
            enrollments: 3200,
            rating: 4.7,
            completionRate: 75,
            revenue: 320000
        },
        qualityChecks: {
            productionQuality: true,
            learningOutcomes: true,
            marketDemand: true,
            uniqueness: true
        },
        curatorNotes: 'Local entrepreneurship focus. Strong case studies. Great market timing.',
        performanceData: {
            conversionLift: 45,
            enrollmentIncrease: 180,
            viewsGenerated: 15000
        }
    },
    {
        id: 'FT-1004',
        courseId: 'course-987',
        courseTitle: 'Advanced React & Next.js Development',
        creatorName: 'Khaled Ibrahim',
        category: 'Web Development',
        nominatedBy: 'Tech Team',
        nominatedAt: '2024-10-13T11:00:00Z',
        status: 'nominated',
        metrics: {
            enrollments: 1650,
            rating: 4.6,
            completionRate: 70,
            revenue: 165000
        },
        qualityChecks: {
            productionQuality: false,
            learningOutcomes: true,
            marketDemand: true,
            uniqueness: false
        },
        curatorNotes: 'Needs production quality improvements. Content is solid but presentation could be better.'
    },
    {
        id: 'FT-1005',
        courseId: 'course-456',
        courseTitle: 'Digital Marketing for Egyptian SMEs',
        creatorName: 'Nour Hassan',
        category: 'Marketing',
        nominatedBy: 'Editorial Team',
        nominatedAt: '2024-10-16T08:00:00Z',
        status: 'approved',
        featuredSection: 'trending_now',
        metrics: {
            enrollments: 2100,
            rating: 4.8,
            completionRate: 80,
            revenue: 210000
        },
        qualityChecks: {
            productionQuality: true,
            learningOutcomes: true,
            marketDemand: true,
            uniqueness: true
        },
        curatorNotes: 'Timely content. Egyptian SME focus is unique. Ready for featured placement.'
    }
]

const statusColors = {
    nominated: 'bg-blue-100 text-blue-800 border-blue-200',
    under_review: 'bg-purple-100 text-purple-800 border-purple-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    rejected: 'bg-red-100 text-red-800 border-red-200'
}

const sectionIcons = {
    homepage_hero: Home,
    topic_spotlight: Sparkles,
    new_releases: Zap,
    trending_now: TrendingUp
}

const sectionColors = {
    homepage_hero: 'bg-purple-100 text-purple-800 border-purple-200',
    topic_spotlight: 'bg-blue-100 text-blue-800 border-blue-200',
    new_releases: 'bg-green-100 text-green-800 border-green-200',
    trending_now: 'bg-orange-100 text-orange-800 border-orange-200'
}

export default function EditorialPipelinePage() {
    const [activeTab, setActiveTab] = useState('review')
    const [content] = useState<FeaturedContent[]>(MOCK_FEATURED_CONTENT)
    const [selectedContent, setSelectedContent] = useState<FeaturedContent | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject'>('approve')
    const [featuredSection, setFeaturedSection] = useState<FeaturedSection>('homepage_hero')
    const [scheduledDate, setScheduledDate] = useState('')
    const [curatorNotes, setCuratorNotes] = useState('')

    const nominated = content.filter(c => c.status === 'nominated')
    const underReview = content.filter(c => c.status === 'under_review')
    const approved = content.filter(c => c.status === 'approved')
    const scheduled = content.filter(c => c.status === 'scheduled')
    const published = content.filter(c => c.status === 'published')

    const stats = {
        totalNominated: nominated.length,
        underReview: underReview.length,
        approved: approved.length,
        scheduled: scheduled.length,
        published: published.length,
        avgConversionLift: 45
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleStartReview = (item: FeaturedContent) => {
        setSelectedContent(item)
        setReviewDecision('approve')
        setCuratorNotes(item.curatorNotes || '')
        setShowReviewModal(true)
    }

    const handleSchedule = (item: FeaturedContent) => {
        setSelectedContent(item)
        setFeaturedSection('homepage_hero')
        setScheduledDate('')
        setShowScheduleModal(true)
    }

    const handleSubmitReview = () => {
        console.log('Review submitted:', {
            contentId: selectedContent?.id,
            decision: reviewDecision,
            notes: curatorNotes
        })
        setShowReviewModal(false)
    }

    const handleSubmitSchedule = () => {
        console.log('Schedule submitted:', {
            contentId: selectedContent?.id,
            section: featuredSection,
            date: scheduledDate
        })
        setShowScheduleModal(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Category B Editorial Pipeline</h1>
                        <p className="text-muted-foreground">Curate and feature premium content for platform discovery</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            Performance Report
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Star className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalNominated}</div>
                        <div className="text-sm text-muted-foreground mt-1">Nominated</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Eye className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.underReview}</div>
                        <div className="text-sm text-muted-foreground mt-1">Under Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.approved}</div>
                        <div className="text-sm text-muted-foreground mt-1">Approved</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Calendar className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.scheduled}</div>
                        <div className="text-sm text-muted-foreground mt-1">Scheduled</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Sparkles className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.published}</div>
                        <div className="text-sm text-muted-foreground mt-1">Published</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">+{stats.avgConversionLift}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Avg Conversion Lift</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="review" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Review Queue ({stats.totalNominated + stats.underReview})
                                </TabsTrigger>
                                <TabsTrigger value="approved" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approved ({stats.approved})
                                </TabsTrigger>
                                <TabsTrigger value="scheduled" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Scheduled ({stats.scheduled})
                                </TabsTrigger>
                                <TabsTrigger value="published" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Published ({stats.published})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Review Queue Tab */}
                        <TabsContent value="review" className="p-6">
                            <div className="space-y-4">
                                {[...nominated, ...underReview].map((item) => {
                                    const allChecksPassed = Object.values(item.qualityChecks).every(v => v)
                                    
                                    return (
                                        <div key={item.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-purple-500/20 rounded-lg p-2">
                                                            <Award className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground text-lg">{item.courseTitle}</h4>
                                                            <p className="text-sm text-muted-foreground">by {item.creatorName} • {item.category}</p>
                                                        </div>
                                                        <Badge className={statusColors[item.status]}>
                                                            {item.status.replace(/_/g, ' ')}
                                                        </Badge>
                                                        {allChecksPassed && (
                                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                                                All checks passed
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Enrollments</div>
                                                            <div className="text-lg font-semibold text-foreground">{item.metrics.enrollments.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Rating</div>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                                <span className="text-lg font-semibold text-foreground">{item.metrics.rating}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Completion</div>
                                                            <div className="text-lg font-semibold text-foreground">{item.metrics.completionRate}%</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                                                            <div className="text-lg font-semibold text-foreground">E£{(item.metrics.revenue / 1000).toFixed(0)}k</div>
                                                        </div>
                                                    </div>

                                                    {/* Quality Checklist */}
                                                    <div className="bg-white/5 border border-border rounded-lg p-3 mb-3">
                                                        <h5 className="text-sm font-semibold text-foreground mb-2">Editorial Checklist</h5>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {Object.entries({
                                                                productionQuality: 'Production Quality',
                                                                learningOutcomes: 'Clear Learning Outcomes',
                                                                marketDemand: 'Market Demand',
                                                                uniqueness: 'Unique Value Proposition'
                                                            }).map(([key, label]) => (
                                                                <div key={key} className="flex items-center gap-2">
                                                                    {item.qualityChecks[key as keyof typeof item.qualityChecks] ? (
                                                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                                                    ) : (
                                                                        <XCircle className="w-4 h-4 text-red-400" />
                                                                    )}
                                                                    <span className="text-sm text-muted-foreground">{label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {item.curatorNotes && (
                                                        <div className="text-sm text-muted-foreground italic">
                                                            "{item.curatorNotes}"
                                                        </div>
                                                    )}

                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        Nominated by {item.nominatedBy} on {formatDate(item.nominatedAt)}
                                                    </div>
                                                </div>

                                                <Button
                                                    className="bg-purple-600 hover:bg-purple-700 text-foreground ml-4"
                                                    onClick={() => handleStartReview(item)}
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

                        {/* Approved Tab */}
                        <TabsContent value="approved" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-green-300 mb-1">Approved for Featured Placement</h4>
                                            <p className="text-sm text-green-200/80">
                                                These courses passed editorial review. Schedule them for featured sections.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {approved.map((item) => (
                                    <div key={item.id} className="bg-white/5 rounded-lg p-5 border border-green-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-green-500/20 rounded-lg p-2">
                                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{item.courseTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">by {item.creatorName}</p>
                                                    </div>
                                                    {item.featuredSection && (
                                                        <Badge className={sectionColors[item.featuredSection]}>
                                                            {item.featuredSection.replace(/_/g, ' ')}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="text-sm text-muted-foreground">
                                                    Rating: {item.metrics.rating} ⭐ • {item.metrics.enrollments.toLocaleString()} enrollments
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-yellow-600 hover:bg-yellow-700 text-foreground ml-4"
                                                onClick={() => handleSchedule(item)}
                                            >
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Schedule
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Scheduled Tab */}
                        <TabsContent value="scheduled" className="p-6">
                            <div className="space-y-4">
                                {scheduled.map((item) => {
                                    const SectionIcon = item.featuredSection ? sectionIcons[item.featuredSection] : Calendar
                                    
                                    return (
                                        <div key={item.id} className="bg-white/5 rounded-lg p-5 border border-yellow-500/20">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-yellow-500/20 rounded-lg p-2">
                                                            <SectionIcon className="w-5 h-5 text-yellow-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground text-lg">{item.courseTitle}</h4>
                                                            <p className="text-sm text-muted-foreground">Scheduled for {item.scheduledDate && formatDate(item.scheduledDate)}</p>
                                                        </div>
                                                        {item.featuredSection && (
                                                            <Badge className={sectionColors[item.featuredSection]}>
                                                                {item.featuredSection.replace(/_/g, ' ')}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="text-sm text-muted-foreground">
                                                        {item.creatorName} • {item.category}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        {/* Published Tab */}
                        <TabsContent value="published" className="p-6">
                            <div className="space-y-4">
                                {published.map((item) => (
                                    <div key={item.id} className="bg-white/5 rounded-lg p-5 border border-emerald-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-emerald-500/20 rounded-lg p-2">
                                                        <Sparkles className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{item.courseTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">Featured since {item.publishedDate && formatDate(item.publishedDate)}</p>
                                                    </div>
                                                    {item.featuredSection && (
                                                        <Badge className={sectionColors[item.featuredSection]}>
                                                            {item.featuredSection.replace(/_/g, ' ')}
                                                        </Badge>
                                                    )}
                                                </div>

                                                {/* Performance Data */}
                                                {item.performanceData && (
                                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                                        <h5 className="text-sm font-semibold text-emerald-300 mb-2">Performance Impact</h5>
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Conversion Lift</div>
                                                                <div className="text-lg font-semibold text-emerald-400">+{item.performanceData.conversionLift}%</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Enrollment Increase</div>
                                                                <div className="text-lg font-semibold text-emerald-400">+{item.performanceData.enrollmentIncrease}%</div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs text-muted-foreground">Views Generated</div>
                                                                <div className="text-lg font-semibold text-foreground">{item.performanceData.viewsGenerated.toLocaleString()}</div>
                                                            </div>
                                                        </div>
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

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Editorial Review</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Evaluate content for featured placement
                        </DialogDescription>
                    </DialogHeader>

                    {selectedContent && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-2">{selectedContent.courseTitle}</h4>
                                <p className="text-sm text-muted-foreground">by {selectedContent.creatorName} • {selectedContent.category}</p>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Enrollments</div>
                                    <div className="text-2xl font-bold text-foreground">{selectedContent.metrics.enrollments.toLocaleString()}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Rating</div>
                                    <div className="text-2xl font-bold text-yellow-400">{selectedContent.metrics.rating}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Completion</div>
                                    <div className="text-2xl font-bold text-foreground">{selectedContent.metrics.completionRate}%</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-xs text-muted-foreground mb-1">Revenue</div>
                                    <div className="text-2xl font-bold text-green-400">E£{(selectedContent.metrics.revenue / 1000).toFixed(0)}k</div>
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
                                        <span className="font-semibold text-green-400">Approve for Featured</span> - Meets editorial standards
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
                                        <span className="font-semibold text-red-400">Reject</span> - Does not meet standards
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Curator Notes</label>
                                <Textarea
                                    value={curatorNotes}
                                    onChange={(e) => setCuratorNotes(e.target.value)}
                                    placeholder="Add notes about quality, uniqueness, market fit..."
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

            {/* Schedule Modal */}
            <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
                <DialogContent className="bg-background text-foreground border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-yellow-400">Schedule Featured Placement</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Choose section and publish date
                        </DialogDescription>
                    </DialogHeader>

                    {selectedContent && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Course:</strong> {selectedContent.courseTitle}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Featured Section</label>
                                <Select value={featuredSection} onValueChange={(value) => setFeaturedSection(value as FeaturedSection)}>
                                    <SelectTrigger className="bg-white/5 border-border text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="homepage_hero">Homepage Hero</SelectItem>
                                        <SelectItem value="topic_spotlight">Topic Spotlight</SelectItem>
                                        <SelectItem value="new_releases">New Releases</SelectItem>
                                        <SelectItem value="trending_now">Trending Now</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Publish Date</label>
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowScheduleModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSubmitSchedule}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-foreground"
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Schedule
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
