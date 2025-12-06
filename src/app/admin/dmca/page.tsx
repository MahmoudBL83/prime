'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Shield,
    Search,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    FileText,
    User,
    Calendar,
    Eye,
    Download,
    Send,
    MessageSquare,
    Ban,
    RotateCcw,
    TrendingUp,
    AlertCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface DMCARequest {
    id: string
    requestNumber: string
    type: 'takedown' | 'counter_notice'
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resolved'
    contentType: 'course' | 'video' | 'document'
    contentId: string
    contentTitle: string
    creator: {
        id: string
        name: string
        email: string
    }
    complainant: {
        name: string
        email: string
        company?: string
    }
    copyrightWork: string
    description: string
    evidence?: string[]
    submittedAt: string
    reviewedAt?: string
    resolvedAt?: string
    actionTaken?: 'content_removed' | 'strike_issued' | 'account_suspended' | 'dismissed'
    reviewNotes?: string
    autoTakedownAt?: string // Temporary takedown timestamp
}

const MOCK_DMCA_REQUESTS: DMCARequest[] = [
    {
        id: '1',
        requestNumber: 'DMCA-2024-0001',
        type: 'takedown',
        status: 'pending',
        contentType: 'course',
        contentId: 'c123',
        contentTitle: 'Egyptian History: Ancient Dynasties',
        creator: {
            id: 'cr1',
            name: 'Dr. Ahmed Khalil',
            email: 'ahmed.khalil@example.com'
        },
        complainant: {
            name: 'Sarah Johnson',
            email: 'sarah.j@historypublishers.com',
            company: 'History Publishers Inc.'
        },
        copyrightWork: 'Ancient Egypt: A Comprehensive Guide (ISBN: 978-1234567890)',
        description: 'This course uses substantial portions of my copyrighted book without permission, including diagrams, timelines, and text passages from chapters 3, 5, and 7.',
        evidence: ['screenshot1.jpg', 'screenshot2.jpg', 'comparison-document.pdf'],
        submittedAt: '2024-01-15T09:30:00Z',
        autoTakedownAt: '2024-01-18T09:30:00Z'
    },
    {
        id: '2',
        requestNumber: 'DMCA-2024-0002',
        type: 'takedown',
        status: 'under_review',
        contentType: 'video',
        contentId: 'v456',
        contentTitle: 'Advanced Calculus - Lesson 12',
        creator: {
            id: 'cr2',
            name: 'Prof. Mohamed Ibrahim',
            email: 'mohamed.i@example.com'
        },
        complainant: {
            name: 'John Smith',
            email: 'j.smith@mathcorp.com',
            company: 'MathCorp Educational'
        },
        copyrightWork: 'Calculus Mastery Video Series',
        description: 'The lesson video contains my copyrighted animation explaining integration techniques, used without licensing.',
        evidence: ['original-video.mp4', 'comparison.pdf'],
        submittedAt: '2024-01-14T14:20:00Z',
        reviewedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: '3',
        requestNumber: 'DMCA-2024-0003',
        type: 'counter_notice',
        status: 'pending',
        contentType: 'course',
        contentId: 'c789',
        contentTitle: 'Introduction to Arabic Grammar',
        creator: {
            id: 'cr3',
            name: 'Fatma Hassan',
            email: 'fatma.h@example.com'
        },
        complainant: {
            name: 'Fatma Hassan',
            email: 'fatma.h@example.com'
        },
        copyrightWork: 'Introduction to Arabic Grammar (Original Course)',
        description: 'I am the original creator of this content. The takedown request was filed in error by someone claiming false ownership. I have the original source files and creation timestamps to prove ownership.',
        evidence: ['source-files.zip', 'creation-logs.pdf', 'original-scripts.pdf'],
        submittedAt: '2024-01-15T11:00:00Z'
    },
    {
        id: '4',
        requestNumber: 'DMCA-2024-0004',
        type: 'takedown',
        status: 'approved',
        contentType: 'document',
        contentId: 'd321',
        contentTitle: 'Physics Formula Sheet.pdf',
        creator: {
            id: 'cr4',
            name: 'Khaled Youssef',
            email: 'khaled.y@example.com'
        },
        complainant: {
            name: 'Physics Education Group',
            email: 'legal@physicsed.com',
            company: 'Physics Education Group'
        },
        copyrightWork: 'Official Physics Formula Compendium',
        description: 'This PDF is a direct copy of our copyrighted formula compendium.',
        submittedAt: '2024-01-10T08:00:00Z',
        reviewedAt: '2024-01-11T15:30:00Z',
        resolvedAt: '2024-01-11T16:00:00Z',
        actionTaken: 'content_removed'
    },
    {
        id: '5',
        requestNumber: 'DMCA-2024-0005',
        type: 'takedown',
        status: 'rejected',
        contentType: 'course',
        contentId: 'c654',
        contentTitle: 'Chemistry Basics',
        creator: {
            id: 'cr5',
            name: 'Layla Ali',
            email: 'layla.a@example.com'
        },
        complainant: {
            name: 'Anonymous',
            email: 'anon@tempmail.com'
        },
        copyrightWork: 'Chemistry Textbook',
        description: 'Uses content from my textbook.',
        submittedAt: '2024-01-12T10:00:00Z',
        reviewedAt: '2024-01-13T09:00:00Z',
        resolvedAt: '2024-01-13T09:30:00Z',
        actionTaken: 'dismissed',
        reviewNotes: 'Insufficient evidence provided. Fair use applies to the referenced material.'
    }
]

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    resolved: 'bg-muted text-gray-800 border-border'
}

const actionColors = {
    content_removed: 'bg-red-100 text-red-800 border-red-200',
    strike_issued: 'bg-orange-100 text-orange-800 border-orange-200',
    account_suspended: 'bg-red-100 text-red-800 border-red-200',
    dismissed: 'bg-green-100 text-green-800 border-green-200'
}

export default function DMCAWorkflowPage() {
    const [requests, setRequests] = useState<DMCARequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [apiStats, setApiStats] = useState<{ total: number; pending: number; underReview: number; resolved: number } | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<DMCARequest | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewNotes, setReviewNotes] = useState('')
    const [selectedAction, setSelectedAction] = useState<DMCARequest['actionTaken']>('content_removed')

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (statusFilter !== 'all') params.set('status', statusFilter)
            if (typeFilter !== 'all') params.set('type', typeFilter)

            const response = await fetch(`/api/admin/dmca?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch DMCA requests')
            
            const data = await response.json()
            setRequests(data.requests || [])
            setApiStats(data.stats || null)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [statusFilter, typeFilter])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const stats = {
        total: apiStats?.total || requests.length,
        pending: apiStats?.pending || requests.filter(r => r.status === 'pending').length,
        underReview: apiStats?.underReview || requests.filter(r => r.status === 'under_review').length,
        autoTakedowns: requests.filter(r => r.autoTakedownAt && new Date(r.autoTakedownAt) > new Date()).length
    }

    const filteredRequests = requests.filter(request => {
        const matchesSearch = request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (request.creator?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleReview = (action: DMCARequest['actionTaken']) => {
        if (!selectedRequest) return

        const updatedRequest = {
            ...selectedRequest,
            status: 'approved' as const,
            actionTaken: action,
            reviewNotes,
            reviewedAt: new Date().toISOString(),
            resolvedAt: new Date().toISOString()
        }

        setRequests(requests.map(r => r.id === selectedRequest.id ? updatedRequest : r))
        setSelectedRequest(updatedRequest)
        setShowReviewModal(false)
        setReviewNotes('')
    }

    const handleReject = () => {
        if (!selectedRequest) return

        const updatedRequest = {
            ...selectedRequest,
            status: 'rejected' as const,
            actionTaken: 'dismissed' as const,
            reviewNotes,
            reviewedAt: new Date().toISOString(),
            resolvedAt: new Date().toISOString()
        }

        setRequests(requests.map(r => r.id === selectedRequest.id ? updatedRequest : r))
        setSelectedRequest(updatedRequest)
        setShowReviewModal(false)
        setReviewNotes('')
    }

    const getTimeUntilAutoTakedown = (autoTakedownAt: string) => {
        const now = new Date()
        const takedownDate = new Date(autoTakedownAt)
        const hoursLeft = Math.floor((takedownDate.getTime() - now.getTime()) / (1000 * 60 * 60))
        if (hoursLeft <= 0) return 'Automatic takedown in progress'
        return `Auto-takedown in ${hoursLeft}h`
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
                <div className="animate-pulse">
                    <div className="h-10 bg-white/5 rounded-lg w-1/3 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-xl h-28"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
                <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Error loading DMCA requests</h3>
                            <div className="text-sm text-red-300">{error}</div>
                            <button 
                                onClick={fetchRequests}
                                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">DMCA Workflow</h1>
                        <p className="text-muted-foreground">Manage copyright takedown requests and counter-notices</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Requests</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.pending}</div>
                        <div className="text-sm text-muted-foreground">Pending Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.underReview}</div>
                        <div className="text-sm text-muted-foreground">Under Review</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.autoTakedowns}</div>
                        <div className="text-sm text-muted-foreground">Auto-Takedown Pending</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Requests List */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Search and Filters */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-border">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search requests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Types</option>
                                <option value="takedown">Takedown Requests</option>
                                <option value="counter_notice">Counter Notices</option>
                            </select>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    {/* Requests List */}
                    <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                        {filteredRequests.map((request) => (
                            <motion.div
                                key={request.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border cursor-pointer transition-all ${
                                    selectedRequest?.id === request.id
                                        ? 'border-purple-500 bg-white/20'
                                        : 'border-border hover:border-white/40'
                                }`}
                                onClick={() => setSelectedRequest(request)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">{request.requestNumber}</span>
                                        {request.autoTakedownAt && new Date(request.autoTakedownAt) > new Date() && request.status === 'pending' && (
                                            <AlertCircle className="w-4 h-4 text-red-400" />
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-foreground font-medium mb-2 line-clamp-2">{request.contentTitle}</h3>

                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className={statusColors[request.status]}>
                                        {request.status.replace('_', ' ')}
                                    </Badge>
                                    <Badge className={request.type === 'takedown' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                                        {request.type === 'takedown' ? 'Takedown' : 'Counter Notice'}
                                    </Badge>
                                </div>

                                {request.autoTakedownAt && new Date(request.autoTakedownAt) > new Date() && request.status === 'pending' && (
                                    <div className="text-xs text-orange-300 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {getTimeUntilAutoTakedown(request.autoTakedownAt)}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{request.creator.name}</span>
                                    </div>
                                    <span>{formatDate(request.submittedAt)}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Request Details */}
                <div className="lg:col-span-2">
                    {selectedRequest ? (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-border p-6">
                            {/* Request Header */}
                            <div className="mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm text-muted-foreground">{selectedRequest.requestNumber}</span>
                                            {selectedRequest.autoTakedownAt && new Date(selectedRequest.autoTakedownAt) > new Date() && selectedRequest.status === 'pending' && (
                                                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    {getTimeUntilAutoTakedown(selectedRequest.autoTakedownAt)}
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-bold text-foreground mb-3">{selectedRequest.contentTitle}</h2>
                                        <div className="flex items-center gap-3">
                                            <Badge className={statusColors[selectedRequest.status]}>
                                                {selectedRequest.status.replace('_', ' ')}
                                            </Badge>
                                            <Badge className={selectedRequest.type === 'takedown' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200'}>
                                                {selectedRequest.type === 'takedown' ? 'Takedown Request' : 'Counter Notice'}
                                            </Badge>
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                                {selectedRequest.contentType}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Parties Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                                            {selectedRequest.type === 'takedown' ? 'Content Creator' : 'Counter-Claimant'}
                                        </h3>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="text-xs text-muted-foreground">Name</div>
                                                <div className="text-foreground">{selectedRequest.creator.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Email</div>
                                                <div className="text-foreground">{selectedRequest.creator.email}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                                            {selectedRequest.type === 'takedown' ? 'Complainant' : 'Original Claimant'}
                                        </h3>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="text-xs text-muted-foreground">Name</div>
                                                <div className="text-foreground">{selectedRequest.complainant.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">Email</div>
                                                <div className="text-foreground">{selectedRequest.complainant.email}</div>
                                            </div>
                                            {selectedRequest.complainant.company && (
                                                <div>
                                                    <div className="text-xs text-muted-foreground">Company</div>
                                                    <div className="text-foreground">{selectedRequest.complainant.company}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Copyright Work */}
                            <div className="bg-white/5 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Copyrighted Work</h3>
                                <p className="text-foreground">{selectedRequest.copyrightWork}</p>
                            </div>

                            {/* Description */}
                            <div className="bg-white/5 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                                <p className="text-foreground whitespace-pre-wrap">{selectedRequest.description}</p>
                            </div>

                            {/* Evidence */}
                            {selectedRequest.evidence && selectedRequest.evidence.length > 0 && (
                                <div className="bg-white/5 rounded-lg p-4 mb-6">
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Evidence Submitted</h3>
                                    <div className="space-y-2">
                                        {selectedRequest.evidence.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white/5 rounded p-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm text-foreground">{file}</span>
                                                </div>
                                                <Button size="sm" variant="outline" className="text-xs bg-white/5 hover:bg-white/10 text-foreground border-border">
                                                    <Download className="w-3 h-3 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="bg-white/5 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Timeline</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Submitted:</span>
                                        <span className="text-foreground">{formatDate(selectedRequest.submittedAt)}</span>
                                    </div>
                                    {selectedRequest.autoTakedownAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Auto-Takedown Scheduled:</span>
                                            <span className="text-orange-300">{formatDate(selectedRequest.autoTakedownAt)}</span>
                                        </div>
                                    )}
                                    {selectedRequest.reviewedAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Reviewed:</span>
                                            <span className="text-foreground">{formatDate(selectedRequest.reviewedAt)}</span>
                                        </div>
                                    )}
                                    {selectedRequest.resolvedAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Resolved:</span>
                                            <span className="text-foreground">{formatDate(selectedRequest.resolvedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Taken */}
                            {selectedRequest.actionTaken && (
                                <div className="bg-white/5 rounded-lg p-4 mb-6">
                                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Action Taken</h3>
                                    <Badge className={actionColors[selectedRequest.actionTaken]}>
                                        {selectedRequest.actionTaken.replace('_', ' ')}
                                    </Badge>
                                    {selectedRequest.reviewNotes && (
                                        <p className="text-sm text-foreground mt-3">{selectedRequest.reviewNotes}</p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            {(selectedRequest.status === 'pending' || selectedRequest.status === 'under_review') && (
                                <div className="flex items-center gap-3 pt-4 border-t border-border">
                                    <Button
                                        className="bg-purple-600 hover:bg-purple-700 text-foreground"
                                        onClick={() => setShowReviewModal(true)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Review Request
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="bg-white/5 hover:bg-white/10 text-foreground border-border"
                                        onClick={() => window.open(`/admin/content/${selectedRequest.contentId}`, '_blank')}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Content
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="bg-white/5 hover:bg-white/10 text-foreground border-border"
                                        onClick={() => window.open(`/admin/creators?id=${selectedRequest.creator.id}`, '_blank')}
                                    >
                                        <User className="w-4 h-4 mr-2" />
                                        View Creator Profile
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-border h-full flex items-center justify-center">
                            <div className="text-center">
                                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-foreground mb-2">No Request Selected</h3>
                                <p className="text-muted-foreground">Select a DMCA request from the list to review details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-background max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review DMCA Request</DialogTitle>
                        <DialogDescription>
                            {selectedRequest?.requestNumber} - {selectedRequest?.contentTitle}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Action to Take</Label>
                            <select
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value as DMCARequest['actionTaken'])}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="content_removed">Remove Content</option>
                                <option value="strike_issued">Issue Strike to Creator</option>
                                <option value="account_suspended">Suspend Creator Account</option>
                                <option value="dismissed">Dismiss Request</option>
                            </select>
                        </div>
                        <div>
                            <Label>Review Notes</Label>
                            <Textarea
                                placeholder="Explain the decision and any actions taken..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                className="min-h-[120px] resize-none"
                            />
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowReviewModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                className="text-red-600 hover:text-red-700 border-red-200"
                                onClick={handleReject}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Request
                            </Button>
                            <Button
                                className="bg-purple-600 hover:bg-purple-700 text-foreground"
                                onClick={() => handleReview(selectedAction)}
                                disabled={!reviewNotes.trim()}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Execute
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
