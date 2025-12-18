'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
    Users,
    Search,
    Filter,
    UserPlus,
    Download,
    MoreHorizontal,
    Edit,
    Eye,
    UserX,
    Shield,
    BookOpen,
    DollarSign,
    Award,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    FileText,
    Loader2,
    X,
    Copy
} from 'lucide-react'
import CreatorDetailsModal from '@/components/admin/CreatorDetailsModal'
import toast from 'react-hot-toast'

interface Creator {
    id: string
    userId: string
    kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
    expertise: string | null
    teachingGoals: string | null
    contractSigned: boolean
    contractSignedAt: string | null
    totalEarnings: number
    totalSubscribers: number
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        email: string
        phone: string | null
        arabicName: string | null
        emailVerified: string | null
        onboardingCompleted: boolean
        createdAt: string
    }
    _count: {
        courses: number
    }
}

interface CreatorStatistics {
    total: number
    byKycStatus: Partial<Record<Creator['kycStatus'], number>>
    totalEarnings: number
    totalSubscribers: number
    averageEarnings: number
    averageSubscribers: number
    activeCreators: number
    recentRegistrations: number
}

interface PaginationInfo {
    page: number
    limit: number
    total: number
    pages: number
}

const kycStatusColors = {
    NOT_STARTED: 'bg-muted text-gray-800 border-border',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    VERIFIED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200'
}

const kycStatusIcons = {
    NOT_STARTED: Clock,
    PENDING: AlertTriangle,
    VERIFIED: CheckCircle,
    REJECTED: XCircle
}

export default function CreatorsPage() {
    const pageSize = 20
    const [creators, setCreators] = useState<Creator[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [kycFilter, setKycFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: pageSize,
        total: 0,
        pages: 1
    })
    const [stats, setStats] = useState<CreatorStatistics | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    // Create new creator modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [creating, setCreating] = useState(false)
    const [newCreatorForm, setNewCreatorForm] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        arabicName: '',
        expertise: '',
        teachingGoals: '',
        kycStatus: 'NOT_STARTED',
        contractSigned: false
    })
    const [createdCredentials, setCreatedCredentials] = useState<{ name: string; email: string; password: string } | null>(null)
    // Modal states
    const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400)
        return () => clearTimeout(handler)
    }, [searchTerm])

    useEffect(() => {
        const controller = new AbortController()

        async function loadCreators() {
            setLoading(true)
            setError(null)

            try {
                const params = new URLSearchParams()
                params.set('page', page.toString())
                params.set('limit', pageSize.toString())
                params.set('sortBy', sortBy)
                params.set('sortOrder', sortOrder)

                if (debouncedSearch) {
                    params.set('search', debouncedSearch)
                }
                if (kycFilter !== 'all') {
                    params.set('kycStatus', kycFilter)
                }
                if (statusFilter !== 'all') {
                    params.set('status', statusFilter)
                }

                const response = await fetch(`/api/admin/creators?${params.toString()}`, {
                    signal: controller.signal
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch creators')
                }

                const data = await response.json()
                setCreators(data.creators ?? [])
                setPagination({
                    page: data.pagination?.page ?? page,
                    limit: data.pagination?.limit ?? pageSize,
                    total: data.pagination?.total ?? data.creators?.length ?? 0,
                    pages: data.pagination?.pages ?? 1
                })
                setStats(data.statistics ?? null)
            } catch (err) {
                if ((err as Error).name === 'AbortError') return
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        loadCreators()

        return () => controller.abort()
    }, [debouncedSearch, kycFilter, statusFilter, sortBy, sortOrder, page, refreshKey])

    const triggerRefresh = () => setRefreshKey((prev) => prev + 1)

    const totalCreators = useMemo(() => {
        if (stats?.total != null) return stats.total
        return pagination.total || creators.length
    }, [stats, pagination.total, creators.length])

    const kycVerifiedCount = useMemo(() => {
        const verifiedFromStats = stats?.byKycStatus ? stats.byKycStatus['VERIFIED'] : undefined
        if (verifiedFromStats != null) {
            return verifiedFromStats
        }
        return creators.filter(c => c.kycStatus === 'VERIFIED').length
    }, [stats, creators])

    const activeCreatorsCount = useMemo(() => {
        if (stats?.activeCreators != null) {
            return stats.activeCreators
        }
        return creators.filter(c => c._count.courses > 0).length
    }, [stats, creators])

    const totalEarnings = useMemo(() => {
        if (stats?.totalEarnings != null) {
            return stats.totalEarnings
        }
        return creators.reduce((sum, c) => sum + c.totalEarnings, 0)
    }, [stats, creators])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount)
    }

    const getKycStatusIcon = (status: Creator['kycStatus']) => {
        const Icon = kycStatusIcons[status]
        return <Icon className="w-4 h-4" />
    }

    const handleViewCreator = (creatorId: string) => {
        setSelectedCreatorId(creatorId)
        setShowDetailsModal(true)
    }

    const handleEditCreator = (creatorId: string) => {
        setSelectedCreatorId(creatorId)
        setShowDetailsModal(true)
        // The modal will open with editing capability
    }

    const handleKycReview = (creatorId: string) => {
        setSelectedCreatorId(creatorId)
        setShowDetailsModal(true)
        // The modal will open to the KYC tab
    }

    const handleCreatorUpdated = () => {
        triggerRefresh()
    }

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }

    const handleCreateCreator = async () => {
        if (!newCreatorForm.name || !newCreatorForm.email) {
            toast.error('Name and email are required')
            return
        }

        const password = newCreatorForm.password || generatePassword()
        
        setCreating(true)
        try {
            const response = await fetch('/api/admin/creators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newCreatorForm,
                    password
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create creator')
            }

            setCreatedCredentials({ name: newCreatorForm.name, email: newCreatorForm.email, password })
            toast.success('Creator account created successfully!')
            triggerRefresh()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create creator')
        } finally {
            setCreating(false)
        }
    }

    const resetCreateForm = () => {
        setNewCreatorForm({
            name: '',
            email: '',
            password: '',
            phone: '',
            arabicName: '',
            expertise: '',
            teachingGoals: '',
            kycStatus: 'NOT_STARTED',
            contractSigned: false
        })
        setCreatedCredentials(null)
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            const response = await fetch('/api/admin/creators?limit=1000')
            const data = await response.json()
            
            if (!data.creators) throw new Error('No data')
            
            const headers = ['ID', 'User ID', 'Name', 'Email', 'KYC Status', 'Expertise', 'Courses', 'Subscribers', 'Earnings (EUR)', 'Contract Signed', 'Joined']
            const rows = data.creators.map((c: Creator) => [
                c.id,
                c.userId,
                c.user?.name || '',
                c.user?.email || '',
                c.kycStatus,
                c.expertise || '',
                c._count?.courses || 0,
                c.totalSubscribers || 0,
                c.totalEarnings || 0,
                c.contractSigned ? 'Yes' : 'No',
                new Date(c.createdAt).toISOString().split('T')[0]
            ])
            
            const csvContent = [headers.join(','), ...rows.map((row: (string | number)[]) => row.map(cell => `"${cell}"`).join(','))].join('\n')
            
            const blob = new Blob([csvContent], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `creators-export-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            setError('Failed to export creators')
        } finally {
            setExporting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-red-300">Error: {error}</p>
                <button
                    onClick={triggerRefresh}
                    className="mt-2 text-red-400 hover:text-red-300 underline"
                >
                    Try again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Creator Management</h1>
                    <p className="text-gray-400 mt-1">Manage creator applications, KYC verification, and performance</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            resetCreateForm()
                            setShowCreateModal(true)
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Creator
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white hover:bg-white/10 transition-colors backdrop-blur-sm disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {exporting ? 'Exporting...' : 'Export'}
                    </button>
                    <Link 
                        href="/admin/applications"
                        className="flex items-center gap-2 bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Applications
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Creators</p>
                            <p className="text-2xl font-semibold text-white">{totalCreators.toLocaleString()}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">KYC Verified</p>
                            <p className="text-2xl font-semibold text-white">
                                {kycVerifiedCount.toLocaleString()}
                            </p>
                        </div>
                        <Shield className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Active Creators</p>
                            <p className="text-2xl font-semibold text-white">
                                {activeCreatorsCount.toLocaleString()}
                            </p>
                        </div>
                        <BookOpen className="w-8 h-8 text-purple-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Earnings</p>
                            <p className="text-2xl font-semibold text-white">
                                {formatCurrency(totalEarnings)}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-400" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search creators by name, email, or expertise..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setPage(1)
                                }}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* KYC Filter */}
                    <select
                        value={kycFilter}
                        onChange={(e) => {
                            setKycFilter(e.target.value)
                            setPage(1)
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All KYC Status</option>
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="PENDING">Pending Review</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value)
                            setPage(1)
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="verified">Email Verified</option>
                        <option value="contracted">Contract Signed</option>
                        <option value="active">Has Courses</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split('-')
                            setSortBy(field)
                            setSortOrder(order as 'asc' | 'desc')
                            setPage(1)
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="earnings-desc">Highest Earnings</option>
                        <option value="subscribers-desc">Most Subscribers</option>
                        <option value="courses-desc">Most Courses</option>
                    </select>
                </div>
            </div>

            {/* Creators Table */}
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-white">Creator</th>
                                <th className="text-left py-3 px-4 font-medium text-white">KYC Status</th>
                                <th className="text-left py-3 px-4 font-medium text-white">Performance</th>
                                <th className="text-left py-3 px-4 font-medium text-white">Earnings</th>
                                <th className="text-left py-3 px-4 font-medium text-white">Joined</th>
                                <th className="text-center py-3 px-4 font-medium text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {creators.map((creator) => (
                                <tr key={creator.id} className="hover:bg-white/5">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium text-white">{creator.user.name}</div>
                                            <div className="text-sm text-gray-400">{creator.user.email}</div>
                                            {creator.user.arabicName && (
                                                <div className="text-sm text-gray-400">{creator.user.arabicName}</div>
                                            )}
                                            {creator.expertise && (
                                                <div className="text-xs text-blue-400 mt-1">{creator.expertise}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${kycStatusColors[creator.kycStatus]}`}>
                                            {getKycStatusIcon(creator.kycStatus)}
                                            {creator.kycStatus.replace('_', ' ')}
                                        </span>
                                        {creator.contractSigned && (
                                            <div className="text-xs text-green-400 mt-1">Contract Signed</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="w-3 h-3" />
                                                <span>{creator._count.courses} courses</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                <span>{creator.totalSubscribers} subscribers</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-white">
                                            {formatCurrency(creator.totalEarnings)}
                                        </div>
                                        {creator.totalEarnings > 0 && (
                                            <div className="text-xs text-gray-400">
                                                Avg: {formatCurrency(creator.totalEarnings / Math.max(creator._count.courses, 1))} per course
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">
                                        {formatDate(creator.createdAt)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewCreator(creator.id)}
                                                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleEditCreator(creator.id)}
                                                className="p-1 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                                title="Edit Creator"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {creator.kycStatus === 'PENDING' && (
                                                <button 
                                                    onClick={() => handleKycReview(creator.id)}
                                                    className="p-1 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                                                    title="Review KYC"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {creators.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        No creators found matching your filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                    {pagination.total === 0
                        ? 'No creators to display'
                        : `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} creators`}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={pagination.page === 1 || loading}
                        className="px-3 py-1 rounded border border-white/10 text-sm text-white disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                        disabled={pagination.page >= pagination.pages || loading}
                        className="px-3 py-1 rounded border border-white/10 text-sm text-white disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Modals */}
            {selectedCreatorId && (
                <CreatorDetailsModal
                    creatorId={selectedCreatorId}
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false)
                        setSelectedCreatorId(null)
                    }}
                    onCreatorUpdated={handleCreatorUpdated}
                />
            )}

            {/* Create Creator Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a2e] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">
                                {createdCredentials ? 'Creator Created Successfully' : 'Add New Creator'}
                            </h2>
                            <button
                                onClick={resetCreateForm}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6">
                            {createdCredentials ? (
                                // Show credentials after creation
                                <div className="space-y-6">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                        <p className="text-green-400 font-medium mb-2">
                                            Creator account has been created successfully!
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            Please save these credentials and share them with the creator.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Name</label>
                                            <p className="text-white font-medium">{createdCredentials.name}</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Email</label>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium flex-1 bg-[#0a0a14] px-3 py-2 rounded-lg">
                                                    {createdCredentials.email}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(createdCredentials.email)
                                                        toast.success('Email copied!')
                                                    }}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Copy email"
                                                >
                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Password</label>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium flex-1 bg-[#0a0a14] px-3 py-2 rounded-lg font-mono">
                                                    {createdCredentials.password}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(createdCredentials.password)
                                                        toast.success('Password copied!')
                                                    }}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Copy password"
                                                >
                                                    <Copy className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <button
                                                onClick={() => {
                                                    const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`
                                                    navigator.clipboard.writeText(text)
                                                    toast.success('Credentials copied!')
                                                }}
                                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                            >
                                                Copy All Credentials
                                            </button>
                                            <button
                                                onClick={resetCreateForm}
                                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Show form
                                <form onSubmit={handleCreateCreator} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">
                                                Name <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newCreatorForm.name}
                                                onChange={(e) => setNewCreatorForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                                required
                                                placeholder="John Doe"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">
                                                Arabic Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newCreatorForm.arabicName}
                                                onChange={(e) => setNewCreatorForm(prev => ({ ...prev, arabicName: e.target.value }))}
                                                className="w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                                placeholder="الاسم بالعربية"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">
                                            Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={newCreatorForm.email}
                                            onChange={(e) => setNewCreatorForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            required
                                            placeholder="creator@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">
                                            Password <span className="text-red-400">*</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCreatorForm.password}
                                                onChange={(e) => setNewCreatorForm(prev => ({ ...prev, password: e.target.value }))}
                                                className="flex-1 px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white font-mono focus:border-purple-500 focus:outline-none"
                                                required
                                                minLength={8}
                                                placeholder="Min 8 characters"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewCreatorForm(prev => ({ ...prev, password: generatePassword() }))}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors whitespace-nowrap"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Phone</label>
                                        <input
                                            type="tel"
                                            value={newCreatorForm.phone}
                                            onChange={(e) => setNewCreatorForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            placeholder="+1234567890"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Expertise</label>
                                        <input
                                            type="text"
                                            value={newCreatorForm.expertise}
                                            onChange={(e) => setNewCreatorForm(prev => ({ ...prev, expertise: e.target.value }))}
                                            className="w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            placeholder="e.g., Web Development, Data Science"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Teaching Goals</label>
                                        <textarea
                                            value={newCreatorForm.teachingGoals}
                                            onChange={(e) => setNewCreatorForm(prev => ({ ...prev, teachingGoals: e.target.value }))}
                                            className="w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
                                            rows={3}
                                            placeholder="What does this creator aim to teach?"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">KYC Status</label>
                                            <select
                                                value={newCreatorForm.kycStatus}
                                                onChange={(e) => setNewCreatorForm(prev => ({ ...prev, kycStatus: e.target.value }))}
                                                className="w-full px-3 py-2 bg-[#0a0a14] border border-white/10 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="verified">Verified</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center">
                                            <label className="flex items-center gap-2 cursor-pointer mt-6">
                                                <input
                                                    type="checkbox"
                                                    checked={newCreatorForm.contractSigned}
                                                    onChange={(e) => setNewCreatorForm(prev => ({ ...prev, contractSigned: e.target.checked }))}
                                                    className="w-4 h-4 rounded border-white/10 bg-[#0a0a14] text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-white">Contract Signed</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={creating}
                                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            {creating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="w-4 h-4" />
                                                    Create Creator
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetCreateForm}
                                            disabled={creating}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
