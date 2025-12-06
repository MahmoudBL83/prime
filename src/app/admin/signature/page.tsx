'use client'

import { useEffect, useState } from 'react'
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
    BarChart3,
    Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SignatureCourse {
    id: string
    proposalId?: string
    invitationId?: string
    courseId?: string
    title: string
    creator: {
        id: string
        name: string
        email?: string
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

export default function AdminSignatureCoursesPage() {
    const [courses, setCourses] = useState<SignatureCourse[]>([])
    const [activeTab, setActiveTab] = useState<'all' | 'pipeline' | 'review' | 'published'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch('/api/admin/signature')
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    throw new Error(body.error || 'Failed to load signature courses')
                }
                const data = await res.json()
                setCourses(data.courses || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load signature courses')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const stats = (() => {
        const totalCourses = courses.length
        const inPipeline = courses.filter(c => ['invited', 'pitch', 'in-production'].includes(c.stage)).length
        const awaitingReview = courses.filter(c => c.stage === 'review').length
        const published = courses.filter(c => c.stage === 'published').length
        const totalRevenue = courses.reduce((sum, c) => sum + (c.revenue || 0), 0)
        const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrollments || 0), 0)
        const ratings = courses.map(c => c.rating).filter((r): r is number => typeof r === 'number')
        const avgRating = ratings.length ? Number((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2)) : 0

        return { totalCourses, inPipeline, awaitingReview, published, totalRevenue, avgRating, totalEnrollments }
    })()

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

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.creator.name.toLowerCase().includes(searchQuery.toLowerCase())
        
        if (activeTab === 'all') return matchesSearch
        if (activeTab === 'pipeline') return matchesSearch && ['invited', 'pitch', 'in-production'].includes(course.stage)
        if (activeTab === 'review') return matchesSearch && ['review', 'approved'].includes(course.stage)
        if (activeTab === 'published') return matchesSearch && course.stage === 'published'
        return matchesSearch
    })

    const handleInvite = async () => {
        const email = window.prompt('Enter creator email to invite:')?.trim()
        if (!email) return
        const message = window.prompt('Optional message:', 'We would like you to build a signature course with us.')?.trim() || undefined
        try {
            setActionLoading('invite')
            const res = await fetch('/api/admin/signature/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, message })
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || 'Failed to send invitation')
            }
            await res.json()
            const refresh = await fetch('/api/admin/signature')
            const data = await refresh.json()
            setCourses(data.courses || [])
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to send invitation')
        } finally {
            setActionLoading(null)
        }
    }

    const handleProposalAction = async (course: SignatureCourse, action: 'APPROVE_PITCH' | 'DECLINE' | 'REQUEST_CHANGES' | 'APPROVE_PUBLISH' | 'MOVE_TO_REVIEW') => {
        if (!course.proposalId) return
        const notes = action === 'REQUEST_CHANGES' ? window.prompt('Add review notes (optional):', course.notes || '') || undefined : undefined
        try {
            setActionLoading(`${course.id}-${action}`)
            const res = await fetch(`/api/admin/signature/proposals/${course.proposalId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes })
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || 'Action failed')
            }
            await res.json()
            const refresh = await fetch('/api/admin/signature')
            const data = await refresh.json()
            setCourses(data.courses || [])
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Action failed')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-purple-950/20">
                <div className="flex items-center gap-3 text-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading signature courses...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-purple-950/20">
                <div className="bg-white/5 border border-border rounded-xl p-6 text-center max-w-md">
                    <p className="text-foreground font-semibold mb-2">Failed to load signature courses</p>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        )
    }

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
                            <Button
                                onClick={handleInvite}
                                disabled={actionLoading === 'invite'}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground"
                            >
                                {actionLoading === 'invite' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                {actionLoading === 'invite' ? 'Sending...' : 'Invite Expert'}
                            </Button>
                            <Button
                                className="bg-white/5 hover:bg-white/10 text-foreground border border-border"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Quality Guidelines
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <span>Live data from admin API. Actions update proposals/invitations.</span>
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
                        { id: 'all', label: 'All Courses', count: courses.length },
                        { id: 'pipeline', label: 'In Pipeline', count: courses.filter(c => ['invited', 'pitch', 'in-production'].includes(c.stage)).length },
                        { id: 'review', label: 'Review & Approval', count: courses.filter(c => ['review', 'approved'].includes(c.stage)).length },
                        { id: 'published', label: 'Published', count: courses.filter(c => c.stage === 'published').length }
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
                                        <Button
                                            disabled={!!actionLoading}
                                            className="bg-purple-600 hover:bg-purple-700 text-foreground"
                                            onClick={handleInvite}
                                        >
                                            {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                            {actionLoading ? 'Sending...' : 'Send Invite'}
                                        </Button>
                                    )}
                                    {course.stage === 'pitch' && (
                                        <>
                                            <Button
                                                disabled={actionLoading === `${course.id}-APPROVE_PITCH`}
                                                className="bg-green-600 hover:bg-green-700 text-foreground"
                                                onClick={() => handleProposalAction(course, 'APPROVE_PITCH')}
                                            >
                                                {actionLoading === `${course.id}-APPROVE_PITCH` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                {actionLoading === `${course.id}-APPROVE_PITCH` ? 'Approving...' : 'Approve Pitch'}
                                            </Button>
                                            <Button
                                                disabled={actionLoading === `${course.id}-DECLINE`}
                                                className="bg-red-600 hover:bg-red-700 text-foreground"
                                                onClick={() => handleProposalAction(course, 'DECLINE')}
                                            >
                                                {actionLoading === `${course.id}-DECLINE` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                {actionLoading === `${course.id}-DECLINE` ? 'Declining...' : 'Decline'}
                                            </Button>
                                        </>
                                    )}
                                    {course.stage === 'in-production' && (
                                        <Button
                                            disabled={actionLoading === `${course.id}-MOVE_TO_REVIEW`}
                                            className="bg-white/5 hover:bg-white/10 text-foreground border border-border"
                                            onClick={() => handleProposalAction(course, 'MOVE_TO_REVIEW')}
                                        >
                                            {actionLoading === `${course.id}-MOVE_TO_REVIEW` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                                            {actionLoading === `${course.id}-MOVE_TO_REVIEW` ? 'Moving...' : 'Monitor / Move to Review'}
                                        </Button>
                                    )}
                                    {course.stage === 'review' && (
                                        <>
                                            <Button
                                                disabled={actionLoading === `${course.id}-APPROVE_PUBLISH`}
                                                className="bg-green-600 hover:bg-green-700 text-foreground"
                                                onClick={() => handleProposalAction(course, 'APPROVE_PUBLISH')}
                                            >
                                                {actionLoading === `${course.id}-APPROVE_PUBLISH` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                {actionLoading === `${course.id}-APPROVE_PUBLISH` ? 'Publishing...' : 'Approve & Publish'}
                                            </Button>
                                            <Button
                                                disabled={actionLoading === `${course.id}-REQUEST_CHANGES`}
                                                className="bg-yellow-600 hover:bg-yellow-700 text-foreground"
                                                onClick={() => handleProposalAction(course, 'REQUEST_CHANGES')}
                                            >
                                                {actionLoading === `${course.id}-REQUEST_CHANGES` ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                                                {actionLoading === `${course.id}-REQUEST_CHANGES` ? 'Sending...' : 'Request Changes'}
                                            </Button>
                                        </>
                                    )}
                                    {course.stage === 'published' && (
                                        <Button
                                            disabled={!!actionLoading}
                                            className="bg-white/5 hover:bg-white/10 text-foreground border border-border"
                                            onClick={() => {
                                                if (course.courseId) {
                                                    window.open(`/admin/analytics?courseId=${course.courseId}`, '_blank')
                                                }
                                            }}
                                        >
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
