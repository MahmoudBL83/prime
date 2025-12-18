'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Shield,
    AlertTriangle,
    Eye,
    EyeOff,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    RefreshCw,
    BookOpen,
    MessageSquare,
    Star,
    Flag,
    User,
    Filter
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface PendingCourse {
    id: string
    type: 'course'
    title: string
    titleAr: string | null
    status: string
    isHidden: boolean
    createdAt: string
    creator: {
        id: string
        name: string
        email: string
    }
}

interface FlaggedReview {
    id: string
    type: 'review'
    rating: number
    comment: string | null
    createdAt: string
    user: {
        id: string
        name: string
        email: string
    }
    course: {
        id: string
        title: string
    }
}

interface ModerationEvent {
    id: string
    eventType: string
    severity: string
    reason: string | null
    createdAt: string
    resolvedAt: string | null
    metadata: any
    user: {
        id: string
        name: string
        email: string
    }
}

interface ModerationStats {
    pendingCourses: number
    flaggedContent: number
}

const severityColors = {
    LOW: 'bg-gray-100 text-gray-800 border-gray-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200'
}

export default function ModerationPage() {
    const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([])
    const [flaggedReviews, setFlaggedReviews] = useState<FlaggedReview[]>([])
    const [moderationHistory, setModerationHistory] = useState<ModerationEvent[]>([])
    const [stats, setStats] = useState<ModerationStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'courses' | 'reviews' | 'history'>('courses')
    const [actionReason, setActionReason] = useState('')
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [actionModal, setActionModal] = useState<{ type: string; item: any } | null>(null)

    useEffect(() => {
        fetchModerationData()
    }, [])

    const fetchModerationData = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/moderation')
            if (!response.ok) throw new Error('Failed to fetch moderation data')

            const data = await response.json()
            setPendingCourses(data.pendingCourses || [])
            setFlaggedReviews(data.flaggedReviews || [])
            setModerationHistory(data.moderationHistory || [])
            setStats(data.stats || null)
        } catch (err) {
            toast.error('Failed to load moderation data')
        } finally {
            setLoading(false)
        }
    }

    const handleModerateAction = async (contentType: string, contentId: string, action: string) => {
        setProcessing(contentId)
        try {
            const response = await fetch('/api/admin/moderation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType,
                    contentId,
                    action,
                    reason: actionReason,
                    notifyCreator: true,
                    severity: 'MEDIUM'
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Action failed')
            }

            toast.success(`Content ${action}d successfully`)
            setActionModal(null)
            setActionReason('')
            fetchModerationData()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Action failed')
        } finally {
            setProcessing(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-white/5 rounded-2xl"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Content Moderation
                    </h1>
                    <p className="text-muted-foreground">
                        Review and moderate platform content
                    </p>
                </div>
                <Button
                    onClick={fetchModerationData}
                    disabled={loading}
                    className="bg-white/10 hover:bg-white/20 text-foreground"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-yellow-600/20 rounded-xl p-3">
                            <BookOpen className="h-6 w-6 text-yellow-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {stats?.pendingCourses || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Courses Pending Review</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-red-600/20 rounded-xl p-3">
                            <Flag className="h-6 w-6 text-red-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {stats?.flaggedContent || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Flagged Content</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-600/20 rounded-xl p-3">
                            <Shield className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {moderationHistory.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Recent Actions</div>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border pb-2">
                <Button
                    onClick={() => setActiveTab('courses')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'courses'
                            ? 'bg-white/10 text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Pending Courses ({pendingCourses.length})
                </Button>
                <Button
                    onClick={() => setActiveTab('reviews')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'reviews'
                            ? 'bg-white/10 text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Star className="w-4 h-4 mr-2" />
                    Reviews ({flaggedReviews.length})
                </Button>
                <Button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'history'
                            ? 'bg-white/10 text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Clock className="w-4 h-4 mr-2" />
                    History ({moderationHistory.length})
                </Button>
            </div>

            {/* Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
            >
                {activeTab === 'courses' && (
                    <div className="divide-y divide-border">
                        {pendingCourses.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No courses pending review</p>
                            </div>
                        ) : (
                            pendingCourses.map((course) => (
                                <div key={course.id} className="p-6 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    {course.title}
                                                </h3>
                                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
                                                    {course.status}
                                                </Badge>
                                                {course.isHidden && (
                                                    <Badge className="bg-gray-100 text-gray-800 border-gray-200 border">
                                                        Hidden
                                                    </Badge>
                                                )}
                                            </div>
                                            {course.titleAr && (
                                                <p className="text-muted-foreground text-sm mb-2" dir="rtl">
                                                    {course.titleAr}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {course.creator.name}
                                                </span>
                                                <span>{formatDate(course.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => setActionModal({ type: 'approve', item: course })}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setActionModal({ type: 'reject', item: course })}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setActionModal({ type: 'hide', item: course })}
                                                className="bg-white/10 hover:bg-white/20 text-foreground"
                                            >
                                                <EyeOff className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="divide-y divide-border">
                        {flaggedReviews.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No flagged reviews</p>
                            </div>
                        ) : (
                            flaggedReviews.map((review) => (
                                <div key={review.id} className="p-6 hover:bg-white/5 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${
                                                                i < review.rating
                                                                    ? 'text-yellow-400 fill-yellow-400'
                                                                    : 'text-gray-400'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    on {review.course.title}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-foreground mb-2">{review.comment}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {review.user.name}
                                                </span>
                                                <span>{formatDate(review.createdAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => setActionModal({ type: 'dismiss', item: { ...review, contentType: 'review' } })}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Dismiss
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => setActionModal({ type: 'remove', item: { ...review, contentType: 'review' } })}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="divide-y divide-border">
                        {moderationHistory.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No moderation history</p>
                            </div>
                        ) : (
                            moderationHistory.map((event) => (
                                <div key={event.id} className="p-6 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-medium text-foreground">
                                                    {event.eventType.replace(/_/g, ' ')}
                                                </span>
                                                <Badge className={`${severityColors[event.severity as keyof typeof severityColors] || severityColors.MEDIUM} border`}>
                                                    {event.severity}
                                                </Badge>
                                                {event.resolvedAt && (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200 border">
                                                        Resolved
                                                    </Badge>
                                                )}
                                            </div>
                                            {event.reason && (
                                                <p className="text-muted-foreground text-sm mb-2">
                                                    {event.reason}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {event.user.name}
                                                </span>
                                                <span>{formatDate(event.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </motion.div>

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-border rounded-2xl p-6 max-w-md w-full"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground capitalize">
                                {actionModal.type} Content
                            </h3>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setActionModal(null)
                                    setActionReason('')
                                }}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                Are you sure you want to {actionModal.type} &quot;{actionModal.item.title || 'this content'}&quot;?
                            </p>

                            <textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                placeholder="Reason (required for reject/remove)"
                                className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                rows={3}
                            />

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setActionModal(null)
                                        setActionReason('')
                                    }}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => handleModerateAction(
                                        actionModal.item.type || actionModal.item.contentType,
                                        actionModal.item.id,
                                        actionModal.type
                                    )}
                                    disabled={processing === actionModal.item.id}
                                    className={`flex-1 ${
                                        actionModal.type === 'approve' || actionModal.type === 'dismiss'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    } text-white`}
                                >
                                    {processing === actionModal.item.id ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    Confirm {actionModal.type}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
