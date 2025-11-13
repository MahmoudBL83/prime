'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Award,
    Users,
    CheckCircle,
    Clock,
    XCircle,
    Eye,
    Send,
    Search,
    Filter,
    MoreVertical,
    Star,
    TrendingUp,
    BookOpen,
    FileText,
    Video,
    Target,
    Sparkles,
    AlertCircle,
    UserCheck,
    Mail,
    BarChart3
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SignatureCourse {
    id: string
    title: string
    creator: {
        id: string
        name: string
        avatar: string
        verified: boolean
        expertise: string
    }
    stage: 'invited' | 'pitch' | 'in-production' | 'review' | 'approved' | 'published' | 'rejected'
    category: string
    estimatedPrice: number
    completionProgress: number
    content: {
        modules: number
        videos: number
        documents: number
        quizzes: number
    }
    quality: {
        productionValue: number
        contentDepth: number
        pedagogicalDesign: number
        marketFit: number
    }
    enrollments?: number
    revenue?: number
    rating?: number
    submittedAt?: string
    reviewedAt?: string
    notes?: string
}

const mockCourses: SignatureCourse[] = [
    {
        id: '1',
        title: 'Advanced Machine Learning Engineering',
        creator: {
            id: 'c1',
            name: 'Dr. Youssef Ahmed',
            avatar: 'YA',
            verified: true,
            expertise: 'AI Research Scientist, 10+ years'
        },
        stage: 'published',
        category: 'Technology',
        estimatedPrice: 1299,
        completionProgress: 100,
        content: {
            modules: 12,
            videos: 89,
            documents: 145,
            quizzes: 24
        },
        quality: {
            productionValue: 95,
            contentDepth: 98,
            pedagogicalDesign: 92,
            marketFit: 96
        },
        enrollments: 2847,
        revenue: 3698553,
        rating: 4.9,
        submittedAt: '2025-07-15',
        reviewedAt: '2025-07-20'
    },
    {
        id: '2',
        title: 'Comprehensive Medical Physiology',
        creator: {
            id: 'c2',
            name: 'Prof. Layla Hassan',
            avatar: 'LH',
            verified: true,
            expertise: 'Medical Professor, 15+ years'
        },
        stage: 'review',
        category: 'Medicine',
        estimatedPrice: 1499,
        completionProgress: 100,
        content: {
            modules: 18,
            videos: 134,
            documents: 287,
            quizzes: 36
        },
        quality: {
            productionValue: 88,
            contentDepth: 95,
            pedagogicalDesign: 90,
            marketFit: 93
        },
        submittedAt: '2025-10-10',
        notes: 'Excellent content quality. Minor audio improvements needed in modules 14-16.'
    },
    {
        id: '3',
        title: 'Enterprise Software Architecture',
        creator: {
            id: 'c3',
            name: 'Ahmed Mahmoud',
            avatar: 'AM',
            verified: true,
            expertise: 'Senior Architect at Microsoft, 12+ years'
        },
        stage: 'in-production',
        category: 'Technology',
        estimatedPrice: 1199,
        completionProgress: 65,
        content: {
            modules: 10,
            videos: 47,
            documents: 89,
            quizzes: 15
        },
        quality: {
            productionValue: 0,
            contentDepth: 0,
            pedagogicalDesign: 0,
            marketFit: 0
        },
        submittedAt: '2025-09-05'
    },
    {
        id: '4',
        title: 'Advanced Financial Analysis & Modeling',
        creator: {
            id: 'c4',
            name: 'Sarah Nabil',
            avatar: 'SN',
            verified: false,
            expertise: 'CFA Charterholder, Investment Banking'
        },
        stage: 'pitch',
        category: 'Business',
        estimatedPrice: 999,
        completionProgress: 0,
        content: {
            modules: 0,
            videos: 0,
            documents: 3,
            quizzes: 0
        },
        quality: {
            productionValue: 0,
            contentDepth: 0,
            pedagogicalDesign: 0,
            marketFit: 0
        },
        submittedAt: '2025-10-12',
        notes: 'Strong pitch deck. Awaiting curriculum outline and sample video.'
    },
    {
        id: '5',
        title: 'Constitutional Law Masterclass',
        creator: {
            id: 'c5',
            name: 'Dr. Omar Ibrahim',
            avatar: 'OI',
            verified: true,
            expertise: 'Law Professor, Former Judge'
        },
        stage: 'invited',
        category: 'Law',
        estimatedPrice: 1099,
        completionProgress: 0,
        content: {
            modules: 0,
            videos: 0,
            documents: 0,
            quizzes: 0
        },
        quality: {
            productionValue: 0,
            contentDepth: 0,
            pedagogicalDesign: 0,
            marketFit: 0
        }
    }
]

export default function AdminSignatureCoursesPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'pipeline' | 'review' | 'published'>('all')
    const [searchQuery, setSearchQuery] = useState('')

    const stats = {
        totalCourses: 28,
        inPipeline: 12,
        awaitingReview: 5,
        published: 11,
        totalRevenue: 14567890,
        avgRating: 4.8,
        totalEnrollments: 18453
    }

    const getStageColor = (stage: SignatureCourse['stage']) => {
        switch (stage) {
            case 'invited': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            case 'pitch': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            case 'in-production': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            case 'review': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'published': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
        }
    }

    const getStageIcon = (stage: SignatureCourse['stage']) => {
        switch (stage) {
            case 'invited': return <Mail className="w-4 h-4" />
            case 'pitch': return <FileText className="w-4 h-4" />
            case 'in-production': return <Video className="w-4 h-4" />
            case 'review': return <Eye className="w-4 h-4" />
            case 'approved': return <CheckCircle className="w-4 h-4" />
            case 'published': return <Sparkles className="w-4 h-4" />
            case 'rejected': return <XCircle className="w-4 h-4" />
        }
    }

    const filteredCourses = mockCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.creator.name.toLowerCase().includes(searchQuery.toLowerCase())
        
        if (activeTab === 'all') return matchesSearch
        if (activeTab === 'pipeline') return matchesSearch && ['invited', 'pitch', 'in-production'].includes(course.stage)
        if (activeTab === 'review') return matchesSearch && ['review', 'approved'].includes(course.stage)
        if (activeTab === 'published') return matchesSearch && course.stage === 'published'
        return matchesSearch
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-purple-950/20">
            <div className="p-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
                                Signature Courses
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Category B: Premium Expert-Led Curriculum
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground">
                                <Send className="w-4 h-4 mr-2" />
                                Invite Expert
                            </Button>
                            <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border">
                                <FileText className="w-4 h-4 mr-2" />
                                Quality Guidelines
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'from-purple-600 to-pink-600' },
                        { label: 'In Pipeline', value: stats.inPipeline, icon: Clock, color: 'from-blue-600 to-cyan-600' },
                        { label: 'Awaiting Review', value: stats.awaitingReview, icon: Eye, color: 'from-orange-600 to-red-600', badge: true },
                        { label: 'Total Revenue', value: `E£${(stats.totalRevenue / 1000000).toFixed(1)}M`, icon: TrendingUp, color: 'from-green-600 to-emerald-600' }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border transition-all group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <stat.icon className={`w-8 h-8 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                                    {stat.badge && (
                                        <Badge className="bg-orange-600 text-foreground">
                                            Review Needed
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6">
                    {[
                        { id: 'all', label: 'All Courses', count: mockCourses.length },
                        { id: 'pipeline', label: 'In Pipeline', count: mockCourses.filter(c => ['invited', 'pitch', 'in-production'].includes(c.stage)).length },
                        { id: 'review', label: 'Review & Approval', count: mockCourses.filter(c => ['review', 'approved'].includes(c.stage)).length },
                        { id: 'published', label: 'Published', count: mockCourses.filter(c => c.stage === 'published').length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-foreground'
                                    : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                            }`}
                        >
                            {tab.label}
                            <Badge className="ml-2 bg-white/20 text-foreground">
                                {tab.count}
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search courses or experts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                    </div>
                </div>

                {/* Courses List */}
                <div className="space-y-4">
                    {filteredCourses.map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Creator Avatar */}
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-foreground font-bold text-xl">
                                            {course.creator.avatar}
                                        </div>
                                        {course.creator.verified && (
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Course Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-foreground">{course.title}</h3>
                                            <Badge className={`${getStageColor(course.stage)} border`}>
                                                <div className="flex items-center gap-1">
                                                    {getStageIcon(course.stage)}
                                                    <span className="capitalize">{course.stage.replace('-', ' ')}</span>
                                                </div>
                                            </Badge>
                                            {course.stage === 'published' && (
                                                <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-foreground border-0">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    Signature
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground mb-1">by {course.creator.name}</p>
                                        <p className="text-sm text-muted-foreground mb-4">{course.creator.expertise}</p>

                                        {/* Progress Bar */}
                                        {course.completionProgress > 0 && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-muted-foreground">Course Completion</span>
                                                    <span className="text-sm font-semibold text-foreground">{course.completionProgress}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${course.completionProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Content Metrics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                                    <p className="text-xs text-muted-foreground">Modules</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{course.content.modules}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Video className="w-4 h-4 text-pink-400" />
                                                    <p className="text-xs text-muted-foreground">Videos</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{course.content.videos}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="w-4 h-4 text-blue-400" />
                                                    <p className="text-xs text-muted-foreground">Documents</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{course.content.documents}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Target className="w-4 h-4 text-green-400" />
                                                    <p className="text-xs text-muted-foreground">Quizzes</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{course.content.quizzes}</p>
                                            </div>
                                        </div>

                                        {/* Quality Scores */}
                                        {course.stage === 'review' || course.stage === 'published' ? (
                                            <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                                                <p className="text-sm font-semibold text-purple-400 mb-3">Quality Assessment</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Production', value: course.quality.productionValue },
                                                        { label: 'Content Depth', value: course.quality.contentDepth },
                                                        { label: 'Pedagogy', value: course.quality.pedagogicalDesign },
                                                        { label: 'Market Fit', value: course.quality.marketFit }
                                                    ].map((metric) => (
                                                        <div key={metric.label}>
                                                            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-white/10 rounded-full h-1.5">
                                                                    <div
                                                                        className={`h-1.5 rounded-full ${
                                                                            metric.value >= 90 ? 'bg-green-500' :
                                                                            metric.value >= 80 ? 'bg-blue-500' :
                                                                            metric.value >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                                                        }`}
                                                                        style={{ width: `${metric.value}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-semibold text-foreground w-8">{metric.value}%</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}

                                        {/* Published Metrics */}
                                        {course.stage === 'published' && (
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Enrollments</p>
                                                    <p className="text-2xl font-bold text-green-400">{course.enrollments?.toLocaleString()}</p>
                                                </div>
                                                <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                                                    <p className="text-2xl font-bold text-blue-400">E£{(course.revenue! / 1000000).toFixed(1)}M</p>
                                                </div>
                                                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg p-3">
                                                    <p className="text-xs text-muted-foreground mb-1">Rating</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-2xl font-bold text-yellow-400">{course.rating}</p>
                                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {course.notes && (
                                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-blue-400 mb-1">Editorial Notes</p>
                                                        <p className="text-sm text-muted-foreground">{course.notes}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {course.submittedAt && <span>Submitted: {new Date(course.submittedAt).toLocaleDateString()}</span>}
                                            {course.reviewedAt && (
                                                <>
                                                    <span>•</span>
                                                    <span>Reviewed: {new Date(course.reviewedAt).toLocaleDateString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {course.stage === 'invited' && (
                                        <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Invite
                                        </Button>
                                    )}
                                    {course.stage === 'pitch' && (
                                        <>
                                            <Button className="bg-green-600 hover:bg-green-700 text-foreground">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve Pitch
                                            </Button>
                                            <Button className="bg-red-600 hover:bg-red-700 text-foreground">
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Decline
                                            </Button>
                                        </>
                                    )}
                                    {course.stage === 'in-production' && (
                                        <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Monitor Progress
                                        </Button>
                                    )}
                                    {course.stage === 'review' && (
                                        <>
                                            <Button className="bg-green-600 hover:bg-green-700 text-foreground">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve & Publish
                                            </Button>
                                            <Button className="bg-yellow-600 hover:bg-yellow-700 text-foreground">
                                                <AlertCircle className="w-4 h-4 mr-2" />
                                                Request Changes
                                            </Button>
                                        </>
                                    )}
                                    {course.stage === 'published' && (
                                        <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            View Analytics
                                        </Button>
                                    )}
                                    <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border px-3">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredCourses.length === 0 && (
                    <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">No courses found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
