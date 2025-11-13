'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Eye,
    Play,
    Film,
    Tv,
    Mic,
    User,
    Calendar,
    BookOpen,
    Loader2,
    Award,
    TrendingUp,
    MessageSquare,
    Star,
    FileText,
    Shield,
    RefreshCcw,
    ExternalLink,
    ChevronRight,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import Image from 'next/image'

interface Course {
    id: string
    title: string
    titleAr?: string
    description: string
    thumbnail?: string
    contentType: string
    contentCategory: string
    status: string
    category: string
    skillLevel: string
    duration: number
    totalLessons: number
    totalEnrollments: number
    rating: number
    createdAt: string
    updatedAt: string
    publishedAt?: string
    creator: {
        id: string
        name: string
        arabicName?: string
        email: string
        profileImage?: string
        expertise?: string
    }
    lessons: Array<{
        id: string
        title: string
        duration: number
        videoUrl?: string
        order: number
    }>
}

export default function ContentReviewPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [courses, setCourses] = useState<Course[]>([])
    const [stats, setStats] = useState({
        total: 0,
        draft: 0,
        underReview: 0,
        published: 0,
        rejected: 0,
        categoryA: 0,
        categoryB: 0,
        categoryC: 0
    })
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_changes' | 'start_review'>('approve')
    const [reviewNotes, setReviewNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState('under_review')

    useEffect(() => {
        if (session?.user?.role !== 'ADMIN') {
            router.push('/dashboard')
            return
        }
        fetchCourses()
    }, [session, activeTab])

    const fetchCourses = async () => {
        try {
            setLoading(true)
            const status = activeTab === 'all' ? 'all' : activeTab.toUpperCase()
            const response = await fetch(`/api/admin/content/reviews?status=${status}`)
            if (!response.ok) throw new Error('Failed to fetch')
            const result = await response.json()
            setCourses(result.data.courses)
            setStats(result.data.stats)
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to load courses')
        } finally {
            setLoading(false)
        }
    }

    const handleReview = (course: Course, action: 'approve' | 'reject' | 'request_changes' | 'start_review') => {
        setSelectedCourse(course)
        setReviewAction(action)
        setReviewNotes('')
        setShowReviewModal(true)
    }

    const submitReview = async () => {
        if (!selectedCourse) return

        if ((reviewAction === 'reject' || reviewAction === 'request_changes') && !reviewNotes.trim()) {
            toast.error('Please provide detailed feedback')
            return
        }

        try {
            setSubmitting(true)
            const response = await fetch(`/api/admin/content/reviews/${selectedCourse.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: reviewAction,
                    reviewNotes
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update')
            }

            const result = await response.json()
            toast.success(result.message)
            setShowReviewModal(false)
            fetchCourses()
        } catch (error: any) {
            console.error('Error:', error)
            toast.error(error.message || 'Failed to update course')
        } finally {
            setSubmitting(false)
        }
    }

    const getContentTypeIcon = (type: string) => {
        const icons = {
            'MOVIE': <Film className="w-5 h-5" />,
            'SERIES': <Tv className="w-5 h-5" />,
            'PODCAST': <Mic className="w-5 h-5" />
        }
        return icons[type as keyof typeof icons] || <BookOpen className="w-5 h-5" />
    }

    const getCategoryBadge = (category: string) => {
        const config: Record<string, { label: string, color: string }> = {
            'CATEGORY_A': { label: 'All-Access', color: 'bg-yellow-600' },
            'CATEGORY_B': { label: 'Signature', color: 'bg-purple-600' },
            'CATEGORY_C': { label: 'Channel', color: 'bg-blue-600' }
        }
        return config[category] || { label: category, color: 'bg-gray-600' }
    }

    const getStatusBadge = (status: string) => {
        const config: Record<string, { color: string, icon: any, label: string }> = {
            'DRAFT': { color: 'bg-gray-600', icon: FileText, label: 'Draft' },
            'UNDER_REVIEW': { color: 'bg-blue-600', icon: Eye, label: 'Under Review' },
            'PUBLISHED': { color: 'bg-green-600', icon: CheckCircle, label: 'Published' },
            'REJECTED': { color: 'bg-red-600', icon: XCircle, label: 'Rejected' }
        }
        return config[status] || config['DRAFT']
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

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <div className="border-b border-border bg-gradient-to-r from-black via-gray-900 to-black">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                                Content Review Queue
                            </h1>
                            <p className="text-muted-foreground">Review and approve courses for publication</p>
                        </div>
                        <Button
                            onClick={fetchCourses}
                            variant="outline"
                            className="border-border hover:bg-card"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-700/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Under Review</p>
                                    <Eye className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-3xl font-black text-foreground">{stats.underReview}</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-border">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Draft</p>
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <p className="text-3xl font-black text-foreground">{stats.draft}</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-700/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Published</p>
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-3xl font-black text-foreground">{stats.published}</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-700/50">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm text-muted-foreground">Rejected</p>
                                    <XCircle className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="text-3xl font-black text-foreground">{stats.rejected}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Category Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Card className="bg-background border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.categoryA}</p>
                                    <p className="text-sm text-muted-foreground">Category A</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-background border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                                    <Award className="w-6 h-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.categoryB}</p>
                                    <p className="text-sm text-muted-foreground">Category B</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-background border-border">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                    <Play className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.categoryC}</p>
                                    <p className="text-sm text-muted-foreground">Category C</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-background border border-border mb-6">
                        <TabsTrigger value="under_review" className="data-[state=active]:bg-blue-600">
                            <Eye className="w-4 h-4 mr-2" />
                            Under Review ({stats.underReview})
                        </TabsTrigger>
                        <TabsTrigger value="draft" className="data-[state=active]:bg-gray-600">
                            Draft ({stats.draft})
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600">
                            Rejected ({stats.rejected})
                        </TabsTrigger>
                        <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
                            All
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                            </div>
                        ) : courses.length === 0 ? (
                            <Card className="bg-background border-border">
                                <CardContent className="py-20 text-center">
                                    <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-xl text-muted-foreground">No courses in this category</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {courses.map((course, index) => {
                                    const statusConfig = getStatusBadge(course.status)
                                    const categoryConfig = getCategoryBadge(course.contentCategory)
                                    const StatusIcon = statusConfig.icon

                                    return (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-border hover:border-gray-600 transition-all group overflow-hidden">
                                                <CardContent className="p-0">
                                                    <div className="flex gap-6 p-6">
                                                        {/* Thumbnail */}
                                                        <div className="relative w-64 h-36 rounded-lg overflow-hidden flex-shrink-0 bg-card group-hover:ring-2 group-hover:ring-purple-500 transition-all">
                                                            {course.thumbnail ? (
                                                                <Image
                                                                    src={course.thumbnail}
                                                                    alt={course.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                                                                    {getContentTypeIcon(course.contentType)}
                                                                </div>
                                                            )}
                                                            <div className="absolute top-2 left-2">
                                                                <Badge className={categoryConfig.color}>
                                                                    {categoryConfig.label}
                                                                </Badge>
                                                            </div>
                                                            <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs font-semibold">
                                                                {formatDuration(course.duration)}
                                                            </div>
                                                        </div>

                                                        {/* Course Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Badge className={statusConfig.color}>
                                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                                            {statusConfig.label}
                                                                        </Badge>
                                                                        <span className="text-muted-foreground">•</span>
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {getContentTypeIcon(course.contentType)}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-2xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors">
                                                                        {course.title}
                                                                    </h3>
                                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                                        {course.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Creator Info */}
                                                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-foreground font-bold">
                                                                    {course.creator.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {course.creator.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {course.creator.email}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Metadata Grid */}
                                                            <div className="grid grid-cols-4 gap-4 mb-4">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Lessons</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {course.totalLessons}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Category</p>
                                                                    <p className="text-sm font-semibold text-foreground line-clamp-1">
                                                                        {course.category}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Level</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {course.skillLevel}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Submitted</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            {(course.status === 'DRAFT' || course.status === 'UNDER_REVIEW') && (
                                                                <div className="flex gap-2">
                                                                    {course.status === 'DRAFT' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleReview(course, 'start_review')}
                                                                            className="border-border hover:bg-card"
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            Start Review
                                                                        </Button>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => handleReview(course, 'approve')}
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => handleReview(course, 'request_changes')}
                                                                        className="border-border hover:bg-card"
                                                                    >
                                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                                        Request Changes
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleReview(course, 'reject')}
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        Reject
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => router.push(`/courses/${course.id}`)}
                                                                        className="border-border hover:bg-card ml-auto"
                                                                    >
                                                                        <ExternalLink className="w-4 h-4 mr-2" />
                                                                        Preview
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-background border-border text-foreground max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {reviewAction === 'approve' && 'Approve Course'}
                            {reviewAction === 'reject' && 'Reject Course'}
                            {reviewAction === 'request_changes' && 'Request Changes'}
                            {reviewAction === 'start_review' && 'Start Review'}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {selectedCourse && selectedCourse.title}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCourse && (
                        <div className="space-y-4 py-4">
                            {/* Course Preview */}
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-border">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground mb-1">Creator</p>
                                        <p className="font-semibold">{selectedCourse.creator.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Lessons</p>
                                        <p className="font-semibold">{selectedCourse.totalLessons} lessons</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Duration</p>
                                        <p className="font-semibold">{formatDuration(selectedCourse.duration)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Category</p>
                                        <Badge className={getCategoryBadge(selectedCourse.contentCategory).color}>
                                            {getCategoryBadge(selectedCourse.contentCategory).label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Review Notes */}
                            {(reviewAction === 'reject' || reviewAction === 'request_changes') && (
                                <div>
                                    <Label htmlFor="reviewNotes" className="text-foreground">
                                        {reviewAction === 'reject' ? 'Rejection Reason *' : 'Feedback for Creator *'}
                                    </Label>
                                    <Textarea
                                        id="reviewNotes"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder={
                                            reviewAction === 'reject' 
                                                ? 'Explain why this course is being rejected...'
                                                : 'Provide detailed feedback on what needs to be improved...'
                                        }
                                        rows={5}
                                        className="mt-2 bg-card border-border text-foreground"
                                    />
                                </div>
                            )}

                            {reviewAction === 'approve' && (
                                <>
                                    <div>
                                        <Label htmlFor="reviewNotes" className="text-foreground">Review Notes (Optional)</Label>
                                        <Textarea
                                            id="reviewNotes"
                                            value={reviewNotes}
                                            onChange={(e) => setReviewNotes(e.target.value)}
                                            placeholder="Add any notes about this approval..."
                                            rows={3}
                                            className="mt-2 bg-card border-border text-foreground"
                                        />
                                    </div>
                                    <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-muted-foreground">
                                                <p className="font-medium mb-1">This will publish the course</p>
                                                <p className="text-xs text-muted-foreground">
                                                    The course will be immediately available to users and the creator will be notified.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {reviewAction === 'reject' && (
                                <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-muted-foreground">
                                            <p className="font-medium mb-1">Content Strike</p>
                                            <p className="text-xs text-muted-foreground">
                                                A content strike will be recorded for quality tracking. The creator will be notified with your feedback.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 border-border"
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={submitReview}
                                    className={`flex-1 ${
                                        reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                        reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Confirm {reviewAction === 'approve' ? 'Approval' : 
                                                     reviewAction === 'reject' ? 'Rejection' :
                                                     reviewAction === 'request_changes' ? 'Feedback' : 'Review'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
