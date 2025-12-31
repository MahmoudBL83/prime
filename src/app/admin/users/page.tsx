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
    Loader2
} from 'lucide-react'
import UserDetailsModal from '@/components/admin/UserDetailsModal'
import UserDeleteModal from '@/components/admin/UserDeleteModal'
import AddUserModal from '@/components/admin/AddUserModal'

interface User {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'CREATOR' | 'LEARNER'
    emailVerified: string | null
    phoneVerified: string | null
    onboardingCompleted: boolean
    createdAt: string
    updatedAt: string
    phone: string | null
    _count: {
        enrollments: number
    }
    creator?: {
        _count: {
            courses: number
        }
    }
}

const roleColors = {
    ADMIN: 'bg-red-100 text-red-800 border-red-200',
    CREATOR: 'bg-blue-100 text-blue-800 border-blue-200',
    LEARNER: 'bg-green-100 text-green-800 border-green-200'
}

const statusColors = {
    verified: 'bg-green-100 text-green-800',
    unverified: 'bg-yellow-100 text-yellow-800',
    incomplete: 'bg-muted text-gray-800'
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [statistics, setStatistics] = useState<{
        total: number
        byRole: { ADMIN?: number; CREATOR?: number; LEARNER?: number }
        emailVerified: number
        recentRegistrations: number
    } | null>(null)
    const pageSize = 50

    // Modal states
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showAddUserModal, setShowAddUserModal] = useState(false)
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [currentPage, roleFilter, statusFilter])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
            })
            if (roleFilter !== 'all') params.set('role', roleFilter)
            if (statusFilter !== 'all') params.set('status', statusFilter)

            const response = await fetch(`/api/admin/users?${params.toString()}`)
            if (!response.ok) {
                throw new Error('Failed to fetch users')
            }
            const data = await response.json()
            setUsers(data.users)
            setTotalUsers(data.pagination?.total || data.users.length)
            setTotalPages(data.pagination?.pages || 1)
            setStatistics(data.statistics || null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = roleFilter === 'all' || user.role === roleFilter

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'verified' && user.emailVerified) ||
            (statusFilter === 'unverified' && !user.emailVerified) ||
            (statusFilter === 'completed' && user.onboardingCompleted) ||
            (statusFilter === 'incomplete' && !user.onboardingCompleted)

        return matchesSearch && matchesRole && matchesStatus
    })

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let aValue: any = a[sortBy as keyof User]
        let bValue: any = b[sortBy as keyof User]

        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
            aValue = new Date(aValue).getTime()
            bValue = new Date(bValue).getTime()
        }

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase()
            bValue = bValue.toLowerCase()
        }

        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
    })

    const getUserStatus = (user: User) => {
        if (user.emailVerified && user.onboardingCompleted) return 'verified'
        if (!user.emailVerified) return 'unverified'
        return 'incomplete'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const handleViewUser = (userId: string) => {
        setSelectedUserId(userId)
        setShowDetailsModal(true)
    }

    const handleDeleteUser = (user: User) => {
        setUserToDelete({ id: user.id, name: user.name, email: user.email })
        setShowDeleteModal(true)
    }

    const confirmDeleteUser = async () => {
        if (!userToDelete) return

        try {
            const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete user')
            }

            // Refresh users list
            await fetchUsers()
            setUserToDelete(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        }
    }

    const handleUserUpdated = () => {
        fetchUsers()
    }

    const handleExport = async (format: 'csv' | 'json' = 'csv') => {
        try {
            setExporting(true)
            const params = new URLSearchParams({ format })
            if (roleFilter !== 'all') params.set('role', roleFilter)
            if (statusFilter !== 'all') params.set('status', statusFilter)

            const response = await fetch(`/api/admin/users/export?${params.toString()}`)

            if (!response.ok) {
                throw new Error('Failed to export users')
            }

            // Get the blob and create download link
            const blob = await response.blob()
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `users-export.${format}`

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export users')
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
                    onClick={fetchUsers}
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
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-gray-400 mt-1">Manage and monitor all platform users</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('csv')}
                        disabled={exporting}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white hover:bg-white/10 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {exporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        {exporting ? 'Exporting...' : 'Export'}
                    </button>
                    <button
                        onClick={() => setShowAddUserModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Users</p>
                            <p className="text-2xl font-semibold text-white">{statistics?.total || totalUsers}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Learners</p>
                            <p className="text-2xl font-semibold text-white">
                                {statistics?.byRole?.LEARNER || 0}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Creators</p>
                            <p className="text-2xl font-semibold text-white">
                                {statistics?.byRole?.CREATOR || 0}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-400" />
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg border border-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Verified</p>
                            <p className="text-2xl font-semibold text-white">
                                {statistics?.emailVerified || 0}
                            </p>
                        </div>
                        <Shield className="w-8 h-8 text-green-400" />
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
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Roles</option>
                        <option value="LEARNER">Learners</option>
                        <option value="CREATOR">Creators</option>
                        <option value="ADMIN">Admins</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                        <option value="completed">Onboarding Complete</option>
                        <option value="incomplete">Onboarding Incomplete</option>
                    </select>

                    {/* Sort */}
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split('-')
                            setSortBy(field)
                            setSortOrder(order as 'asc' | 'desc')
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                        <option value="email-asc">Email A-Z</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-white">User</th>
                                <th className="text-left py-3 px-4 font-medium text-white">Role</th>
                                <th className="text-left py-3 px-4 font-medium text-white">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-white">Activity</th>
                                <th className="text-left py-3 px-4 font-medium text-white">Joined</th>
                                <th className="text-center py-3 px-4 font-medium text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {sortedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium text-white">{user.name}</div>
                                            <div className="text-sm text-gray-400">{user.email}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[getUserStatus(user)]}`}>
                                            {getUserStatus(user) === 'verified' && 'Verified'}
                                            {getUserStatus(user) === 'unverified' && 'Unverified'}
                                            {getUserStatus(user) === 'incomplete' && 'Incomplete'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">
                                        {user.role === 'LEARNER' && (
                                            <div>{user._count.enrollments} enrollments</div>
                                        )}
                                        {user.role === 'CREATOR' && (
                                            <div>{user.creator?._count.courses || 0} courses</div>
                                        )}
                                        {user.role === 'ADMIN' && (
                                            <div className="text-gray-400">Admin user</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewUser(user.id)}
                                                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleViewUser(user.id)}
                                                className="p-1 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                title="Delete User"
                                            >
                                                <UserX className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sortedUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        No users found matching your filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Modals */}
            {selectedUserId && (
                <UserDetailsModal
                    userId={selectedUserId}
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false)
                        setSelectedUserId(null)
                    }}
                    onUserUpdated={handleUserUpdated}
                />
            )}

            {userToDelete && (
                <UserDeleteModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false)
                        setUserToDelete(null)
                    }}
                    onConfirm={confirmDeleteUser}
                    userName={userToDelete.name}
                    userEmail={userToDelete.email}
                />
            )}

            <AddUserModal
                isOpen={showAddUserModal}
                onClose={() => setShowAddUserModal(false)}
                onUserAdded={handleUserUpdated}
            />
        </div>
    )
}
