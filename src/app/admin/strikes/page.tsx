'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    AlertTriangle,
    Shield,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Filter,
    Eye,
    AlertOctagon,
    FileText,
    Calendar,
    Plus
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Strike {
    id: string
    creatorId: string
    contentType: 'COURSE' | 'POST' | 'LIVE_SESSION'
    contentId: string
    reason: string
    severity: 'WARNING' | 'MINOR' | 'MAJOR' | 'CRITICAL'
    issuedAt: string
    expiresAt: string | null
    issuedBy: string
    appealStatus: string | null
    appealReason: string | null
    appealedAt: string | null
    resolutionNotes: string | null
    resolvedAt: string | null
    creator: {
        id: string
        user: {
            id: string
            name: string
            email: string
        }
    }
}

const severityColors = {
    WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    MINOR: 'bg-blue-100 text-blue-800 border-blue-200',
    MAJOR: 'bg-orange-100 text-orange-800 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200'
}

const severityGradients = {
    WARNING: 'from-yellow-600/20 to-orange-600/20',
    MINOR: 'from-blue-600/20 to-cyan-600/20',
    MAJOR: 'from-orange-600/20 to-red-600/20',
    CRITICAL: 'from-red-600/20 to-pink-600/20'
}

const appealStatusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    UNDER_REVIEW: 'bg-blue-100 text-blue-800 border-blue-200',
    UPHELD: 'bg-red-100 text-red-800 border-red-200',
    REDUCED: 'bg-orange-100 text-orange-800 border-orange-200',
    REINSTATED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function StrikesPage() {
    const [strikes, setStrikes] = useState<Strike[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedStrike, setSelectedStrike] = useState<Strike | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [severityFilter, setSeverityFilter] = useState<string>('')
    const [resolvedFilter, setResolvedFilter] = useState<string>('')
    const [resolutionNotes, setResolutionNotes] = useState('')

    // New strike form
    const [newStrike, setNewStrike] = useState({
        creatorId: '',
        contentType: 'COURSE',
        contentId: '',
        reason: '',
        severity: 'WARNING',
        expiresAt: ''
    })

    useEffect(() => {
        fetchStrikes()
    }, [severityFilter, resolvedFilter])

    const fetchStrikes = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (severityFilter) params.set('severity', severityFilter)
            if (resolvedFilter) params.set('resolved', resolvedFilter)

            const response = await fetch(`/api/admin/strikes?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch strikes')

            const data = await response.json()
            setStrikes(data.strikes || [])
        } catch (err) {
            toast.error('Failed to load strikes')
        } finally {
            setLoading(false)
        }
    }

    const handleIssueStrike = async () => {
        if (!newStrike.creatorId || !newStrike.contentId || !newStrike.reason) {
            toast.error('Please fill in all required fields')
            return
        }

        setProcessing('new')
        try {
            const response = await fetch('/api/admin/strikes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStrike)
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to issue strike')
            }

            const data = await response.json()
            toast.success('Strike issued successfully')
            if (data.suspended) {
                toast.success(`Creator account suspended: ${data.suspensionReason}`)
            }
            setShowAddModal(false)
            setNewStrike({
                creatorId: '',
                contentType: 'COURSE',
                contentId: '',
                reason: '',
                severity: 'WARNING',
                expiresAt: ''
            })
            fetchStrikes()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to issue strike')
        } finally {
            setProcessing(null)
        }
    }

    const handleResolveAppeal = async (strikeId: string, action: 'APPROVE' | 'REJECT') => {
        setProcessing(strikeId)
        try {
            const response = await fetch('/api/admin/strikes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    strikeId,
                    action,
                    resolutionNotes
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to resolve appeal')
            }

            toast.success(`Appeal ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully`)
            setSelectedStrike(null)
            setResolutionNotes('')
            fetchStrikes()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to resolve appeal')
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

    // Count stats
    const stats = {
        total: strikes.length,
        warning: strikes.filter(s => s.severity === 'WARNING').length,
        minor: strikes.filter(s => s.severity === 'MINOR').length,
        major: strikes.filter(s => s.severity === 'MAJOR').length,
        critical: strikes.filter(s => s.severity === 'CRITICAL').length,
        pendingAppeals: strikes.filter(s => s.appealStatus === 'PENDING' || s.appealStatus === 'UNDER_REVIEW').length
    }

    if (loading && strikes.length === 0) {
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
                        Content Strikes
                    </h1>
                    <p className="text-muted-foreground">
                        Manage creator violations and appeals
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchStrikes}
                        disabled={loading}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Issue Strike
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSeverityFilter('WARNING')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-yellow-600/20 rounded-xl p-3">
                            <AlertTriangle className="h-6 w-6 text-yellow-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.warning}</div>
                    <div className="text-sm text-muted-foreground">Warnings</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSeverityFilter('MINOR')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-600/20 rounded-xl p-3">
                            <Shield className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.minor}</div>
                    <div className="text-sm text-muted-foreground">Minor Strikes</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSeverityFilter('MAJOR')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-orange-600/20 rounded-xl p-3">
                            <AlertOctagon className="h-6 w-6 text-orange-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.major}</div>
                    <div className="text-sm text-muted-foreground">Major Strikes</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-red-600/20 to-pink-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSeverityFilter('CRITICAL')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-red-600/20 rounded-xl p-3">
                            <XCircle className="h-6 w-6 text-red-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.critical}</div>
                    <div className="text-sm text-muted-foreground">Critical Strikes</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setResolvedFilter('false')}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="bg-purple-600/20 rounded-xl p-3">
                            <Clock className="h-6 w-6 text-purple-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stats.pendingAppeals}</div>
                    <div className="text-sm text-muted-foreground">Pending Appeals</div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                    <option value="">All Severities</option>
                    <option value="WARNING">Warning</option>
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                </select>

                <select
                    value={resolvedFilter}
                    onChange={(e) => setResolvedFilter(e.target.value)}
                    className="bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                    <option value="">All Strikes</option>
                    <option value="false">Pending/Active</option>
                    <option value="true">Resolved</option>
                </select>

                {(severityFilter || resolvedFilter) && (
                    <Button
                        onClick={() => {
                            setSeverityFilter('')
                            setResolvedFilter('')
                        }}
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Strikes Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Creator</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Severity</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Content Type</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Reason</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Appeal Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Issued</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {strikes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No strikes found</p>
                                    </td>
                                </tr>
                            ) : (
                                strikes.map((strike) => (
                                    <tr key={strike.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">
                                                        {strike.creator?.user?.name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {strike.creator?.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`${severityColors[strike.severity]} border`}>
                                                {strike.severity}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className="bg-white/10 text-foreground border-none">
                                                {strike.contentType.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-foreground text-sm truncate max-w-xs block">
                                                {strike.reason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {strike.appealStatus ? (
                                                <Badge className={`${appealStatusColors[strike.appealStatus as keyof typeof appealStatusColors] || 'bg-gray-100 text-gray-800'} border`}>
                                                    {strike.appealStatus.replace('_', ' ')}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No appeal</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {formatDate(strike.issuedAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setSelectedStrike(strike)}
                                                    className="bg-white/10 hover:bg-white/20 text-foreground"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {(strike.appealStatus === 'PENDING' || strike.appealStatus === 'UNDER_REVIEW') && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleResolveAppeal(strike.id, 'APPROVE')}
                                                            disabled={processing === strike.id}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            {processing === strike.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleResolveAppeal(strike.id, 'REJECT')}
                                                            disabled={processing === strike.id}
                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Add Strike Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-border rounded-2xl p-6 max-w-lg w-full"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground">Issue New Strike</h3>
                            <Button
                                size="sm"
                                onClick={() => setShowAddModal(false)}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Creator ID *
                                </label>
                                <input
                                    type="text"
                                    value={newStrike.creatorId}
                                    onChange={(e) => setNewStrike({ ...newStrike, creatorId: e.target.value })}
                                    placeholder="Enter creator ID"
                                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Content Type *
                                    </label>
                                    <select
                                        value={newStrike.contentType}
                                        onChange={(e) => setNewStrike({ ...newStrike, contentType: e.target.value })}
                                        className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    >
                                        <option value="COURSE">Course</option>
                                        <option value="POST">Post</option>
                                        <option value="LIVE_SESSION">Live Session</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Severity *
                                    </label>
                                    <select
                                        value={newStrike.severity}
                                        onChange={(e) => setNewStrike({ ...newStrike, severity: e.target.value })}
                                        className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                    >
                                        <option value="WARNING">Warning</option>
                                        <option value="MINOR">Minor</option>
                                        <option value="MAJOR">Major</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Content ID *
                                </label>
                                <input
                                    type="text"
                                    value={newStrike.contentId}
                                    onChange={(e) => setNewStrike({ ...newStrike, contentId: e.target.value })}
                                    placeholder="Enter content ID"
                                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Reason * (min 10 characters)
                                </label>
                                <textarea
                                    value={newStrike.reason}
                                    onChange={(e) => setNewStrike({ ...newStrike, reason: e.target.value })}
                                    placeholder="Describe the violation..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Expires At (optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newStrike.expiresAt}
                                    onChange={(e) => setNewStrike({ ...newStrike, expiresAt: e.target.value })}
                                    className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleIssueStrike}
                                    disabled={processing === 'new'}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
                                >
                                    {processing === 'new' ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                    )}
                                    Issue Strike
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedStrike && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground">Strike Details</h3>
                            <Button
                                size="sm"
                                onClick={() => setSelectedStrike(null)}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {/* Severity Badge */}
                            <div className={`p-4 bg-gradient-to-br ${severityGradients[selectedStrike.severity]} rounded-xl text-center`}>
                                <Badge className={`${severityColors[selectedStrike.severity]} border text-lg px-4 py-1`}>
                                    {selectedStrike.severity}
                                </Badge>
                            </div>

                            {/* Creator Info */}
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground">
                                        {selectedStrike.creator?.user?.name || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {selectedStrike.creator?.user?.email}
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Content Type</div>
                                    <div className="text-foreground font-medium">
                                        {selectedStrike.contentType.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Issued</div>
                                    <div className="text-foreground font-medium">
                                        {formatDate(selectedStrike.issuedAt)}
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="p-3 bg-white/5 rounded-xl">
                                <div className="text-xs text-muted-foreground mb-1">Reason</div>
                                <div className="text-foreground">{selectedStrike.reason}</div>
                            </div>

                            {/* Expiry */}
                            {selectedStrike.expiresAt && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Expires</div>
                                    <div className="text-foreground">{formatDate(selectedStrike.expiresAt)}</div>
                                </div>
                            )}

                            {/* Appeal Info */}
                            {selectedStrike.appealStatus && (
                                <>
                                    <div className="border-t border-border pt-4">
                                        <h4 className="font-semibold text-foreground mb-3">Appeal Information</h4>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-white/5 rounded-xl">
                                                <div className="text-xs text-muted-foreground mb-1">Status</div>
                                                <Badge className={`${appealStatusColors[selectedStrike.appealStatus as keyof typeof appealStatusColors] || 'bg-gray-100 text-gray-800'} border`}>
                                                    {selectedStrike.appealStatus.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            {selectedStrike.appealReason && (
                                                <div className="p-3 bg-white/5 rounded-xl">
                                                    <div className="text-xs text-muted-foreground mb-1">Appeal Reason</div>
                                                    <div className="text-foreground">{selectedStrike.appealReason}</div>
                                                </div>
                                            )}

                                            {selectedStrike.resolutionNotes && (
                                                <div className="p-3 bg-white/5 rounded-xl">
                                                    <div className="text-xs text-muted-foreground mb-1">Resolution Notes</div>
                                                    <div className="text-foreground">{selectedStrike.resolutionNotes}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resolution Actions */}
                                    {(selectedStrike.appealStatus === 'PENDING' || selectedStrike.appealStatus === 'UNDER_REVIEW') && (
                                        <div className="border-t border-border pt-4 space-y-3">
                                            <textarea
                                                value={resolutionNotes}
                                                onChange={(e) => setResolutionNotes(e.target.value)}
                                                placeholder="Resolution notes (optional)"
                                                rows={2}
                                                className="w-full bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                            />
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleResolveAppeal(selectedStrike.id, 'APPROVE')}
                                                    disabled={processing === selectedStrike.id}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    {processing === selectedStrike.id ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    Approve Appeal
                                                </Button>
                                                <Button
                                                    onClick={() => handleResolveAppeal(selectedStrike.id, 'REJECT')}
                                                    disabled={processing === selectedStrike.id}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject Appeal
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
