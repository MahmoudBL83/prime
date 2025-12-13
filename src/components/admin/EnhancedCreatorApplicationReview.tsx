'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Eye,
    FileText,
    Calendar,
    RefreshCw,
    Download,
    Globe,
    Loader2,
    ChevronLeft,
    ChevronRight,
    PlayCircle
} from 'lucide-react'
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

type ApplicationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED'

interface CreatorApplication {
    id: string
    userId: string
    status: ApplicationStatus
    expertise: string
    experienceYears: number | null
    sampleContentUrl: string | null
    portfolioUrl: string | null
    socialProof: string | null
    motivation: string | null
    nationalIdImage: string | null
    reviewNotes: string | null
    reviewedAt: string | null
    reviewedBy: string | null
    contractSigned: boolean
    kycVerified: boolean
    rejectionReason: string | null
    createdAt: string
    updatedAt: string
    user?: {
        id: string
        name: string
        email: string
        arabicName: string | null
        profileImage: string | null
        phone?: string | null
        bio?: string | null
        createdAt: string
    }
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
}

interface Stats {
    total: number
    pending: number
    underReview: number
    approved: number
    rejected: number
    resubmitRequired: number
}

const statusColors: Record<ApplicationStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    RESUBMIT_REQUIRED: 'bg-orange-100 text-orange-800 border-orange-200'
}

const statusLabels: Record<ApplicationStatus, string> = {
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    RESUBMIT_REQUIRED: 'Revisions Requested'
}

const statusIcons: Record<ApplicationStatus, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4" />,
    UNDER_REVIEW: <Eye className="w-4 h-4" />,
    APPROVED: <CheckCircle className="w-4 h-4" />,
    REJECTED: <XCircle className="w-4 h-4" />,
    RESUBMIT_REQUIRED: <AlertTriangle className="w-4 h-4" />
}

export default function EnhancedCreatorApplicationReview() {
    const [applications, setApplications] = useState<CreatorApplication[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('all')
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
    })
    const [stats, setStats] = useState<Stats>({
        total: 0,
        pending: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
        resubmitRequired: 0
    })
    
    // Modal states
    const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null)
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [showIdImageModal, setShowIdImageModal] = useState(false)
    const [idImageUrl, setIdImageUrl] = useState<string | null>(null)
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'resubmit' | 'review'>('approve')
    const [reviewNotes, setReviewNotes] = useState('')
    const [rejectionReason, setRejectionReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchApplications = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams()
            params.set('page', pagination.page.toString())
            params.set('limit', pagination.limit.toString())
            if (activeTab !== 'all') {
                params.set('status', activeTab)
            }

            const response = await fetch(`/api/admin/applications?${params.toString()}`)
            
            if (!response.ok) {
                throw new Error('Failed to fetch applications')
            }

            const result = await response.json()
            
            if (result.success) {
                setApplications(result.data.applications || [])
                setPagination(prev => ({
                    ...prev,
                    total: result.data.pagination?.total || 0,
                    totalPages: result.data.pagination?.totalPages || 1
                }))
                setStats(result.data.stats || {
                    total: 0,
                    pending: 0,
                    underReview: 0,
                    approved: 0,
                    rejected: 0,
                    resubmitRequired: 0
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [activeTab, pagination.page, pagination.limit])

    useEffect(() => {
        fetchApplications()
    }, [fetchApplications])

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        setPagination(prev => ({ ...prev, page: 1 }))
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

    const getDaysInQueue = (createdAt: string) => {
        const created = new Date(createdAt)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - created.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const handleOpenReview = (application: CreatorApplication, action: 'approve' | 'reject' | 'resubmit' | 'review') => {
        setSelectedApplication(application)
        setReviewAction(action)
        setReviewNotes('')
        setRejectionReason('')
        setShowReviewModal(true)
    }

    const handleSubmitReview = async () => {
        if (!selectedApplication) return

        if (reviewAction === 'reject' && !rejectionReason.trim()) {
            alert('Please provide a rejection reason')
            return
        }

        if (reviewAction === 'resubmit' && !reviewNotes.trim()) {
            alert('Please provide review notes for the resubmission request')
            return
        }

        setSubmitting(true)

        try {
            const response = await fetch(`/api/admin/applications/${selectedApplication.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: reviewAction,
                    reviewNotes: reviewNotes.trim() || undefined,
                    rejectionReason: rejectionReason.trim() || undefined
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update application')
            }

            setShowReviewModal(false)
            setSelectedApplication(null)
            fetchApplications()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    const handleExport = async () => {
        try {
            const response = await fetch('/api/admin/applications?limit=1000')
            const result = await response.json()
            
            if (!result.success) throw new Error('Failed to fetch data')
            
            const apps = result.data.applications || []
            
            const headers = ['ID', 'Name', 'Email', 'Expertise', 'Experience (Years)', 'Status', 'Submitted', 'Portfolio', 'Motivation']
            const rows = apps.map((app: CreatorApplication) => [
                app.id,
                app.user?.name || '',
                app.user?.email || '',
                app.expertise,
                app.experienceYears || '',
                app.status,
                formatDate(app.createdAt),
                app.portfolioUrl || '',
                (app.motivation || '').replace(/,/g, ';').replace(/\n/g, ' ')
            ])
            
            const csvContent = [headers.join(','), ...rows.map((row: (string | number)[]) => row.map(cell => `"${cell}"`).join(','))].join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `creator-applications-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            alert('Failed to export applications')
        }
    }

    if (loading && applications.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300">Error: {error}</p>
                <button onClick={fetchApplications} className="mt-2 text-red-400 hover:text-red-300 underline">
                    Try again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Creator Applications</h1>
                    <p className="text-sm sm:text-base text-gray-400 mt-1">Review and approve creator applications</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={fetchApplications}
                        disabled={loading}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        size="sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleExport}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        size="sm"
                    >
                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Total</p>
                            <p className="text-xl sm:text-2xl font-semibold text-white">{stats.total}</p>
                        </div>
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Pending</p>
                            <p className="text-xl sm:text-2xl font-semibold text-yellow-400">{stats.pending}</p>
                        </div>
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Under Review</p>
                            <p className="text-xl sm:text-2xl font-semibold text-blue-400">{stats.underReview}</p>
                        </div>
                        <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Approved</p>
                            <p className="text-xl sm:text-2xl font-semibold text-green-400">{stats.approved}</p>
                        </div>
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm text-gray-400">Rejected</p>
                            <p className="text-xl sm:text-2xl font-semibold text-red-400">{stats.rejected}</p>
                        </div>
                        <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                    </div>
                </div>
            </div>

            {/* Tabs and Applications */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <div className="overflow-x-auto">
                    <TabsList className="bg-white/5 border border-white/10 inline-flex w-full sm:w-auto">
                        <TabsTrigger value="all" className="data-[state=active]:bg-white/10 text-white text-xs sm:text-sm">
                            <span className="hidden sm:inline">All</span>
                            <span className="sm:hidden">All</span> ({stats.total})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="data-[state=active]:bg-white/10 text-white text-xs sm:text-sm">
                            <span className="hidden sm:inline">Pending</span>
                            <span className="sm:hidden">Pend.</span> ({stats.pending})
                        </TabsTrigger>
                        <TabsTrigger value="under_review" className="data-[state=active]:bg-white/10 text-white text-xs sm:text-sm">
                            <span className="hidden sm:inline">Under Review</span>
                            <span className="sm:hidden">Review</span> ({stats.underReview})
                        </TabsTrigger>
                        <TabsTrigger value="resubmit_required" className="data-[state=active]:bg-white/10 text-white text-xs sm:text-sm">
                            <span className="hidden sm:inline">Revisions</span>
                            <span className="sm:hidden">Rev.</span> ({stats.resubmitRequired})
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="data-[state=active]:bg-white/10 text-white text-xs sm:text-sm">
                            <span className="hidden sm:inline">Approved</span>
                            <span className="sm:hidden">Appr.</span> ({stats.approved})
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="data-[state=active]:bg-white/10 text-white text-xs sm:text-sm">
                            <span className="hidden sm:inline">Rejected</span>
                            <span className="sm:hidden">Rej.</span> ({stats.rejected})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value={activeTab} className="space-y-4">
                    {applications.length === 0 ? (
                        <div className="bg-white/5 rounded-lg border border-white/10 p-8 text-center">
                            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-gray-400">No applications found</p>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {applications.map((application) => (
                                <div 
                                    key={application.id}
                                    className="bg-white/5 rounded-lg border border-white/10 p-3 sm:p-4 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                                <h3 className="font-semibold text-white text-base sm:text-lg">
                                                    {application.user?.name || 'Unknown'}
                                                </h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border w-fit ${statusColors[application.status]}`}>
                                                    {statusIcons[application.status]}
                                                    {statusLabels[application.status]}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                                                <div className="truncate">
                                                    <span className="text-gray-500">Email:</span>{' '}
                                                    <span className="text-white">{application.user?.email}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Expertise:</span>{' '}
                                                    <span className="text-blue-400">{application.expertise}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Experience:</span>{' '}
                                                    <span className="text-white">{application.experienceYears || 'N/A'} years</span>
                                                </div>
                                                <div className="truncate">
                                                    <span className="text-gray-500">Submitted:</span>{' '}
                                                    <span className="text-white">{formatDate(application.createdAt)}</span>
                                                </div>
                                            </div>
                                            {application.user?.phone && (
                                                <div className="mt-2 text-xs sm:text-sm text-gray-400">
                                                    <span className="text-gray-500">Phone:</span>{' '}
                                                    <span className="text-white">{application.user.phone}</span>
                                                </div>
                                            )}
                                            {application.motivation && (
                                                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-300 line-clamp-2">
                                                    <span className="text-gray-500">Motivation:</span> {application.motivation}
                                                </p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                                                {application.portfolioUrl && (
                                                    <a 
                                                        href={application.portfolioUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm flex items-center gap-1"
                                                    >
                                                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        Portfolio
                                                    </a>
                                                )}
                                                {application.sampleContentUrl && (
                                                    <a 
                                                        href={application.sampleContentUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm flex items-center gap-1"
                                                    >
                                                        <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        Sample Content
                                                    </a>
                                                )}
                                                {application.nationalIdImage && (
                                                    <button 
                                                        onClick={() => {
                                                            setIdImageUrl(application.nationalIdImage)
                                                            setShowIdImageModal(true)
                                                        }}
                                                        className="text-green-400 hover:text-green-300 text-xs sm:text-sm flex items-center gap-1"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        National ID
                                                    </button>
                                                )}
                                                <span className="text-gray-500 text-xs sm:text-sm flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    {getDaysInQueue(application.createdAt)} days in queue
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex flex-row lg:flex-col gap-2 flex-wrap lg:flex-nowrap">
                                            {application.status === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleOpenReview(application, 'review')}
                                                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                                                >
                                                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                                                    Start Review
                                                </Button>
                                            )}
                                            {application.status === 'UNDER_REVIEW' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleOpenReview(application, 'approve')}
                                                        className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenReview(application, 'resubmit')}
                                                        className="border-orange-500 text-orange-400 hover:bg-orange-500/20 text-xs sm:text-sm"
                                                    >
                                                        <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                                                        <span className="hidden sm:inline">Request Changes</span>
                                                        <span className="sm:hidden">Changes</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleOpenReview(application, 'reject')}
                                                        className="border-red-500 text-red-400 hover:bg-red-500/20 text-xs sm:text-sm"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                            {application.status === 'RESUBMIT_REQUIRED' && (
                                                <span className="text-xs sm:text-sm text-orange-400">
                                                    Waiting for resubmission
                                                </span>
                                            )}
                                            {(application.status === 'APPROVED' || application.status === 'REJECTED') && (
                                                <span className="text-xs sm:text-sm text-gray-500">
                                                    Reviewed on {application.reviewedAt ? formatDate(application.reviewedAt) : 'N/A'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {application.rejectionReason && (
                                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <p className="text-sm text-red-300">
                                                <span className="font-medium">Rejection Reason:</span> {application.rejectionReason}
                                            </p>
                                        </div>
                                    )}
                                    {application.reviewNotes && application.status === 'RESUBMIT_REQUIRED' && (
                                        <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                            <p className="text-sm text-orange-300">
                                                <span className="font-medium">Requested Changes:</span> {application.reviewNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4">
                            <p className="text-xs sm:text-sm text-gray-400">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="bg-white/5 border-white/10 text-white text-xs sm:text-sm"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline ml-1">Previous</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="bg-white/5 border-white/10 text-white text-xs sm:text-sm"
                                >
                                    <span className="hidden sm:inline mr-1">Next</span>
                                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Review Modal */}
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
                <DialogContent className="bg-gray-900 border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {reviewAction === 'review' && 'Start Review'}
                            {reviewAction === 'approve' && 'Approve Application'}
                            {reviewAction === 'reject' && 'Reject Application'}
                            {reviewAction === 'resubmit' && 'Request Changes'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {selectedApplication?.user?.name} - {selectedApplication?.expertise}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {reviewAction === 'reject' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Rejection Reason <span className="text-red-400">*</span>
                                </label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this application is being rejected..."
                                    className="bg-white/5 border-white/10 text-white"
                                    rows={4}
                                />
                            </div>
                        )}

                        {(reviewAction === 'resubmit' || reviewAction === 'approve') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Review Notes {reviewAction === 'resubmit' && <span className="text-red-400">*</span>}
                                </label>
                                <Textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder={reviewAction === 'resubmit' 
                                        ? "Explain what changes are needed..."
                                        : "Optional notes about this approval..."
                                    }
                                    className="bg-white/5 border-white/10 text-white"
                                    rows={4}
                                />
                            </div>
                        )}

                        {reviewAction === 'review' && (
                            <p className="text-gray-400">
                                This will mark the application as &quot;Under Review&quot; and notify the applicant.
                            </p>
                        )}

                        {reviewAction === 'approve' && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                <p className="text-sm text-green-300">
                                    <strong>Note:</strong> Approving this application will:
                                </p>
                                <ul className="text-sm text-green-300 mt-2 list-disc list-inside">
                                    <li>Create a Creator profile for the user</li>
                                    <li>Change their account role to Creator</li>
                                    <li>Send them an email with next steps</li>
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => setShowReviewModal(false)}
                                className="bg-white/5 border-white/10 text-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitReview}
                                disabled={submitting}
                                className={
                                    reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                                    reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                                    reviewAction === 'resubmit' ? 'bg-orange-600 hover:bg-orange-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                                }
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {reviewAction === 'review' && 'Start Review'}
                                        {reviewAction === 'approve' && 'Approve'}
                                        {reviewAction === 'reject' && 'Reject'}
                                        {reviewAction === 'resubmit' && 'Request Changes'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* National ID Image Modal */}
            <Dialog open={showIdImageModal} onOpenChange={setShowIdImageModal}>
                <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>National ID Document</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Verify the applicant&apos;s identity document
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {idImageUrl ? (
                            <div className="relative">
                                <img 
                                    src={idImageUrl} 
                                    alt="National ID"
                                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg border border-white/10"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        target.parentElement?.insertAdjacentHTML('beforeend', 
                                            '<div class="p-8 text-center text-gray-400"><p>Unable to load image</p><p class="text-sm mt-2 text-gray-500 break-all">' + idImageUrl + '</p></div>'
                                        )
                                    }}
                                />
                                <div className="mt-4 flex gap-2 justify-end">
                                    <a 
                                        href={idImageUrl}
                                        download="national-id"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowIdImageModal(false)}
                                        className="bg-white/5 border-white/10 text-white"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">No image available</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
