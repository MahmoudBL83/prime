'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    Eye,
    User,
    Star,
    Play,
    Calendar,
    Filter,
    AlertTriangle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/utils'

interface Submission {
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
    status: string
    daysInQueue: number
    slaStatus: 'on_time' | 'near_breach' | 'breached'
    totalLessons: number
    totalDuration: number
    category: string
    thumbnail: string
    autoCheckResults: {
        videoQuality: string
        audioQuality: string
        captionsAvailable: boolean
        policyFlags: number
        plagiarismScore: number
    }
}

interface Stats {
    totalFirstTime: number
    totalOngoing: number
    underReview: number
    slaBreached: number
}

const slaColors = {
    on_time: 'bg-green-100 text-green-800 border-green-200',
    near_breach: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    breached: 'bg-red-100 text-red-800 border-red-200'
}

export default function CoursesAdminPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
    const [filter, setFilter] = useState<'all' | 'firstTime' | 'ongoing'>('all')
    const [reviewNotes, setReviewNotes] = useState('')

    useEffect(() => {
        fetchSubmissions()
    }, [filter])

    const fetchSubmissions = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (filter === 'firstTime') params.set('firstTime', 'true')
            else if (filter === 'ongoing') params.set('firstTime', 'false')

            const response = await fetch(`/api/admin/content-review?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch submissions')

            const data = await response.json()
            setSubmissions(data.submissions || [])
            setStats(data.stats || null)
        } catch (err) {
            toast.error('Failed to load course submissions')
        } finally {
            setLoading(false)
        }
    }

    const handleReviewAction = async (courseId: string, action: 'approve' | 'reject' | 'request_revisions') => {
        setProcessing(courseId)
        try {
            const response = await fetch('/api/admin/content-review', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    action,
                    notes: reviewNotes
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Action failed')
            }

            toast.success(`Course ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent for revisions'} successfully`)
            setSelectedSubmission(null)
            setReviewNotes('')
            fetchSubmissions()
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
            day: 'numeric'
        })
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    if (loading && submissions.length === 0) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
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
                        Course Review Queue
                    </h1>
                    <p className="text-muted-foreground">
                        Review and approve course submissions
                    </p>
                </div>
                <Button
                    onClick={fetchSubmissions}
                    disabled={loading}
                    className="bg-white/10 hover:bg-white/20 text-foreground"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setFilter('all')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-600/20 rounded-xl p-3">
                                <BookOpen className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.underReview}</div>
                        <div className="text-sm text-muted-foreground">Under Review</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setFilter('firstTime')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-green-600/20 rounded-xl p-3">
                                <Star className="h-6 w-6 text-green-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.totalFirstTime}</div>
                        <div className="text-sm text-muted-foreground">First-Time Creators</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setFilter('ongoing')}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-purple-600/20 rounded-xl p-3">
                                <User className="h-6 w-6 text-purple-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.totalOngoing}</div>
                        <div className="text-sm text-muted-foreground">Ongoing Creators</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-red-600/20 rounded-xl p-3">
                                <AlertTriangle className="h-6 w-6 text-red-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.slaBreached}</div>
                        <div className="text-sm text-muted-foreground">SLA Breached</div>
                    </motion.div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                    <option value="all">All Submissions</option>
                    <option value="firstTime">First-Time Creators</option>
                    <option value="ongoing">Ongoing Creators</option>
                </select>
            </div>

            {/* Submissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {submissions.length === 0 ? (
                    <div className="col-span-full bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-12 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No courses pending review</p>
                    </div>
                ) : (
                    submissions.map((submission, index) => (
                        <motion.div
                            key={submission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video">
                                <Image
                                    src={submission.thumbnail || '/placeholder-course.jpg'}
                                    alt={submission.courseTitle}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute top-2 left-2 flex gap-2">
                                    <Badge className={`${slaColors[submission.slaStatus]} border`}>
                                        {submission.daysInQueue}d in queue
                                    </Badge>
                                    {submission.creator.isFirstTime && (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 border">
                                            First Course
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                                    {submission.courseTitle}
                                </h3>
                                
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                    <User className="w-4 h-4" />
                                    <span>{submission.creator.name}</span>
                                    {submission.creator.previousApprovals > 0 && (
                                        <Badge className="bg-white/10 border-none text-xs">
                                            {submission.creator.previousApprovals} courses
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1">
                                        <Play className="w-4 h-4" />
                                        {submission.totalLessons} lessons
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatDuration(submission.totalDuration)}
                                    </span>
                                </div>

                                <div className="text-xs text-muted-foreground mb-4">
                                    {submission.category}
                                </div>

                                {/* Auto Check Results */}
                                <div className="flex flex-wrap gap-1 mb-4">
                                    <Badge className={`text-xs ${submission.autoCheckResults.videoQuality === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} border-none`}>
                                        Video: {submission.autoCheckResults.videoQuality}
                                    </Badge>
                                    <Badge className={`text-xs ${submission.autoCheckResults.audioQuality === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} border-none`}>
                                        Audio: {submission.autoCheckResults.audioQuality}
                                    </Badge>
                                    {submission.autoCheckResults.captionsAvailable && (
                                        <Badge className="text-xs bg-blue-100 text-blue-800 border-none">
                                            Captions ✓
                                        </Badge>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedSubmission(submission)}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-foreground"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Review
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleReviewAction(submission.id, 'approve')}
                                        disabled={processing === submission.id}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {processing === submission.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleReviewAction(submission.id, 'reject')}
                                        disabled={processing === submission.id}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Review Modal */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header Image */}
                        <div className="relative aspect-video">
                            <Image
                                src={selectedSubmission.thumbnail || '/placeholder-course.jpg'}
                                alt={selectedSubmission.courseTitle}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                            <Button
                                size="sm"
                                onClick={() => setSelectedSubmission(null)}
                                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                            <div className="absolute bottom-4 left-4 right-4">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {selectedSubmission.courseTitle}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <Badge className={`${slaColors[selectedSubmission.slaStatus]} border`}>
                                        {selectedSubmission.daysInQueue} days in queue
                                    </Badge>
                                    {selectedSubmission.creator.isFirstTime && (
                                        <Badge className="bg-green-500 text-white border-none">
                                            First-Time Creator
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Creator Info */}
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-foreground">
                                        {selectedSubmission.creator.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedSubmission.creator.email}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground">Previous Approvals</div>
                                    <div className="font-semibold text-foreground">
                                        {selectedSubmission.creator.previousApprovals}
                                    </div>
                                </div>
                            </div>

                            {/* Course Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-center">
                                    <Play className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                                    <div className="font-semibold text-foreground">
                                        {selectedSubmission.totalLessons}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Lessons</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl text-center">
                                    <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                                    <div className="font-semibold text-foreground">
                                        {formatDuration(selectedSubmission.totalDuration)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Duration</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl text-center">
                                    <Calendar className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                                    <div className="font-semibold text-foreground">
                                        {formatDate(selectedSubmission.submittedDate)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Submitted</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl text-center">
                                    <BookOpen className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                                    <div className="font-semibold text-foreground text-xs">
                                        {selectedSubmission.category}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Category</div>
                                </div>
                            </div>

                            {/* Auto Check Results */}
                            <div className="p-4 bg-white/5 rounded-xl">
                                <h3 className="font-semibold text-foreground mb-3">Auto-Check Results</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="flex items-center gap-2">
                                        {selectedSubmission.autoCheckResults.videoQuality === 'good' ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                        )}
                                        <span className="text-sm text-foreground">
                                            Video: {selectedSubmission.autoCheckResults.videoQuality}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedSubmission.autoCheckResults.audioQuality === 'good' ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                        )}
                                        <span className="text-sm text-foreground">
                                            Audio: {selectedSubmission.autoCheckResults.audioQuality}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedSubmission.autoCheckResults.captionsAvailable ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className="text-sm text-foreground">
                                            Captions: {selectedSubmission.autoCheckResults.captionsAvailable ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedSubmission.autoCheckResults.policyFlags === 0 ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                        )}
                                        <span className="text-sm text-foreground">
                                            Policy Flags: {selectedSubmission.autoCheckResults.policyFlags}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedSubmission.autoCheckResults.plagiarismScore < 10 ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                        )}
                                        <span className="text-sm text-foreground">
                                            Plagiarism: {selectedSubmission.autoCheckResults.plagiarismScore}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Review Notes */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Review Notes (optional)
                                </label>
                                <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add feedback for the creator..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => handleReviewAction(selectedSubmission.id, 'approve')}
                                    disabled={processing === selectedSubmission.id}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {processing === selectedSubmission.id ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Approve
                                </Button>
                                <Button
                                    onClick={() => handleReviewAction(selectedSubmission.id, 'request_revisions')}
                                    disabled={processing === selectedSubmission.id}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                    Request Revisions
                                </Button>
                                <Button
                                    onClick={() => handleReviewAction(selectedSubmission.id, 'reject')}
                                    disabled={processing === selectedSubmission.id}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
