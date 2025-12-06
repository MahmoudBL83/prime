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
    Loader2
} from 'lucide-react'
import CreatorDetailsModal from '@/components/admin/CreatorDetailsModal'

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
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP'
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

    const handleExport = async () => {
        try {
            setExporting(true)
            const response = await fetch('/api/admin/creators?limit=1000')
            const data = await response.json()
            
            if (!data.creators) throw new Error('No data')
            
            const headers = ['ID', 'User ID', 'Name', 'Email', 'KYC Status', 'Expertise', 'Courses', 'Subscribers', 'Earnings (EGP)', 'Contract Signed', 'Joined']
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
        </div>
    )
}
