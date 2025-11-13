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
    Shield
} from 'lucide-react'
import UserDetailsModal from '@/components/admin/UserDetailsModal'
import UserDeleteModal from '@/components/admin/UserDeleteModal'

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
    arabicName: string | null
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

    // Modal states
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string; email: string } | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/users')
            if (!response.ok) {
                throw new Error('Failed to fetch users')
            }
            const data = await response.json()
            setUsers(data.users)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.arabicName && user.arabicName.includes(searchTerm))

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
                    onClick={fetchUsers}
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
                    <h1 className="text-2xl font-bold text-foreground">User Management</h1>
                    <p className="text-muted-foreground mt-1">Manage and monitor all platform users</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-foreground hover:bg-background">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-foreground rounded-lg px-4 py-2 hover:bg-blue-700">
                        <UserPlus className="w-4 h-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Users</p>
                            <p className="text-2xl font-semibold text-foreground">{users.length}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Learners</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {users.filter(u => u.role === 'LEARNER').length}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Creators</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {users.filter(u => u.role === 'CREATOR').length}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Verified</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {users.filter(u => u.emailVerified).length}
                            </p>
                        </div>
                        <Shield className="w-8 h-8 text-green-600" />
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
                                placeholder="Search users by name, email, or Arabic name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Role Filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-foreground">User</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Role</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Activity</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Joined</th>
                                <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-background">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium text-foreground">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                            {user.arabicName && (
                                                <div className="text-sm text-muted-foreground">{user.arabicName}</div>
                                            )}
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
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {user.role === 'LEARNER' && (
                                            <div>{user._count.enrollments} enrollments</div>
                                        )}
                                        {user.role === 'CREATOR' && (
                                            <div>{user.creator?._count.courses || 0} courses</div>
                                        )}
                                        {user.role === 'ADMIN' && (
                                            <div className="text-muted-foreground">Admin user</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        {formatDate(user.createdAt)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewUser(user.id)}
                                                className="p-1 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleViewUser(user.id)}
                                                className="p-1 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded"
                                                title="Edit User"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Delete User"
                                            >
                                                <UserX className="w-4 h-4" />
                                            </button>
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

                {sortedUsers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No users found matching your filters.
                    </div>
                )}
            </div>

            {/* Pagination would go here */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">
                    Showing {sortedUsers.length} of {users.length} users
                </p>
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
        </div>
    )
}
