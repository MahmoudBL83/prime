'use client'

import React, { useState, useEffect } from 'react'
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
    AlertTriangle
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
    const [creators, setCreators] = useState<Creator[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [kycFilter, setKycFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Modal states
    const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)

    useEffect(() => {
        fetchCreators()
    }, [])

    const fetchCreators = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/creators')
            if (!response.ok) {
                throw new Error('Failed to fetch creators')
            }
            const data = await response.json()
            setCreators(data.creators)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const filteredCreators = creators.filter(creator => {
        const matchesSearch = creator.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            creator.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (creator.user.arabicName && creator.user.arabicName.includes(searchTerm)) ||
            (creator.expertise && creator.expertise.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesKyc = kycFilter === 'all' || creator.kycStatus === kycFilter

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'verified' && creator.user.emailVerified) ||
            (statusFilter === 'contracted' && creator.contractSigned) ||
            (statusFilter === 'active' && creator._count.courses > 0)

        return matchesSearch && matchesKyc && matchesStatus
    })

    const sortedCreators = [...filteredCreators].sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortBy) {
            case 'name':
                aValue = a.user.name.toLowerCase()
                bValue = b.user.name.toLowerCase()
                break
            case 'earnings':
                aValue = a.totalEarnings
                bValue = b.totalEarnings
                break
            case 'subscribers':
                aValue = a.totalSubscribers
                bValue = b.totalSubscribers
                break
            case 'courses':
                aValue = a._count.courses
                bValue = b._count.courses
                break
            case 'createdAt':
            default:
                aValue = new Date(a.createdAt).getTime()
                bValue = new Date(b.createdAt).getTime()
                break
        }

        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
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

    const handleCreatorUpdated = () => {
        fetchCreators()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error}</p>
                <button
                    onClick={fetchCreators}
                    className="mt-2 text-red-600 hover:text-red-800 underline"
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
                    <h1 className="text-2xl font-bold text-foreground">Creator Management</h1>
                    <p className="text-muted-foreground mt-1">Manage creator applications, KYC verification, and performance</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-foreground hover:bg-background">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-foreground rounded-lg px-4 py-2 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4" />
                        Invite Creator
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Creators</p>
                            <p className="text-2xl font-semibold text-foreground">{creators.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">KYC Verified</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {creators.filter(c => c.kycStatus === 'VERIFIED').length}
                            </p>
                        </div>
                        <Shield className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Creators</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {creators.filter(c => c._count.courses > 0).length}
                            </p>
                        </div>
                        <BookOpen className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Earnings</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {formatCurrency(creators.reduce((sum, c) => sum + c.totalEarnings, 0))}
                            </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search creators by name, email, or expertise..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* KYC Filter */}
                    <select
                        value={kycFilter}
                        onChange={(e) => setKycFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        }}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Creator</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">KYC Status</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Performance</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Earnings</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Joined</th>
                                <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedCreators.map((creator) => (
                                <tr key={creator.id} className="hover:bg-background">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium text-foreground">{creator.user.name}</div>
                                            <div className="text-sm text-muted-foreground">{creator.user.email}</div>
                                            {creator.user.arabicName && (
                                                <div className="text-sm text-muted-foreground">{creator.user.arabicName}</div>
                                            )}
                                            {creator.expertise && (
                                                <div className="text-xs text-blue-600 mt-1">{creator.expertise}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${kycStatusColors[creator.kycStatus]}`}>
                                            {getKycStatusIcon(creator.kycStatus)}
                                            {creator.kycStatus.replace('_', ' ')}
                                        </span>
                                        {creator.contractSigned && (
                                            <div className="text-xs text-green-600 mt-1">Contract Signed</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
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
                                        <div className="font-medium text-foreground">
                                            {formatCurrency(creator.totalEarnings)}
                                        </div>
                                        {creator.totalEarnings > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                Avg: {formatCurrency(creator.totalEarnings / Math.max(creator._count.courses, 1))} per course
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {formatDate(creator.createdAt)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewCreator(creator.id)}
                                                className="p-1 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {creator.kycStatus === 'PENDING' && (
                                                <button className="p-1 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 rounded">
                                                    <Shield className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="p-1 text-muted-foreground hover:text-muted-foreground hover:bg-background rounded">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sortedCreators.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No creators found matching your filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">
                    Showing {sortedCreators.length} of {creators.length} creators
                </p>
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
