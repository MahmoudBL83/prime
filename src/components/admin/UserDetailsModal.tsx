'use client'

import React, { useState, useEffect } from 'react'
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    BookOpen,
    Award,
    UserCheck,
    Edit,
    Save,
    ShieldX
} from 'lucide-react'

interface UserDetailsModalProps {
    userId: string
    isOpen: boolean
    onClose: () => void
    onUserUpdated: () => void
}

interface UserDetails {
    id: string
    name: string
    email: string
    phone?: string
    arabicName?: string
    bio?: string
    role: 'ADMIN' | 'CREATOR' | 'LEARNER'
    emailVerified: string | null
    phoneVerified: string | null
    onboardingCompleted: boolean
    loginDisabled?: boolean
    passwordResetRequired?: boolean
    featureFlags?: Record<string, any>
    createdAt: string
    updatedAt: string
    _count: {
        enrollments: number
        subscriptions: number
    }
    creator?: {
        expertise?: string
        teachingGoals?: string
        totalEarnings: number
        totalSubscribers: number
        _count: {
            courses: number
        }
    }
    enrollments: Array<{
        id: string
        progress: number
        createdAt: string
        course: {
            title: string
            titleAr: string
        }
    }>
    blockedUsers?: Array<{ blocked: { id: string; name: string; email: string } }>
    blockedByUsers?: Array<{ blocker: { id: string; name: string; email: string } }>
}

const roleColors = {
    ADMIN: 'bg-red-100 text-red-800 border-red-200',
    CREATOR: 'bg-blue-100 text-blue-800 border-blue-200',
    LEARNER: 'bg-green-100 text-green-800 border-green-200'
}

export default function UserDetailsModal({ userId, isOpen, onClose, onUserUpdated }: UserDetailsModalProps) {
    const [user, setUser] = useState<UserDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        arabicName: '',
        phone: '',
        bio: '',
        role: 'LEARNER' as 'ADMIN' | 'CREATOR' | 'LEARNER'
    })
    const [blockTarget, setBlockTarget] = useState('')
    const [blockLoading, setBlockLoading] = useState(false)
    const [flagsInput, setFlagsInput] = useState('')

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserDetails()
        }
    }, [isOpen, userId])

    const fetchUserDetails = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`/api/admin/users/${userId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch user details')
            }
            const data = await response.json()
            setUser(data.user)
            setEditForm({
                name: data.user.name || '',
                arabicName: data.user.arabicName || '',
                phone: data.user.phone || '',
                bio: data.user.bio || '',
                role: data.user.role
            })
            setFlagsInput(JSON.stringify(data.user.featureFlags || {}, null, 2))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (action: string, data: any = {}) => {
        try {
            setBlockLoading(action === 'blockUser' || action === 'unblockUser')
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, ...data })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update user')
            }

            await fetchUserDetails()
            onUserUpdated()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setBlockLoading(false)
        }
    }

    const handleSaveEdit = async () => {
        await handleUpdate('updateProfile', editForm)
        setIsEditing(false)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const requireTarget = () => {
        if (!blockTarget.trim()) {
            setError('Provide a target email or user ID')
            return false
        }
        return true
    }

    const handleBlockUser = async () => {
        if (!requireTarget()) return
        await handleUpdate('blockUser', { targetEmail: blockTarget.trim() })
        setBlockTarget('')
    }

    const handleBlockUserFromTarget = async () => {
        if (!requireTarget()) return
        await handleUpdate('blockUserFromTarget', { targetEmail: blockTarget.trim() })
        setBlockTarget('')
    }

    const handleMutualBlock = async () => {
        if (!requireTarget()) return
        await handleUpdate('mutualBlock', { targetEmail: blockTarget.trim() })
        setBlockTarget('')
    }

    const handleClearBlocks = async () => {
        if (!requireTarget()) return
        await handleUpdate('clearBlocksBetween', { targetEmail: blockTarget.trim() })
        setBlockTarget('')
    }

    const handleUnblockUser = async (targetUserId: string) => {
        await handleUpdate('unblockUser', { targetUserId })
    }

    const handleSaveFeatureFlags = async () => {
        try {
            const parsed = flagsInput.trim() ? JSON.parse(flagsInput) : {}
            if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
                throw new Error('Feature flags must be a JSON object')
            }
            await handleUpdate('setFeatureFlags', { featureFlags: parsed })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Invalid feature flags JSON')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">User Details</h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Edit className="w-4 h-4" />
                                Edit
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 mb-6">
                            <p className="text-red-300">{error}</p>
                        </div>
                    )}

                    {user && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-lg font-medium text-white mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {isEditing ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Arabic Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.arabicName}
                                                    onChange={(e) => setEditForm({ ...editForm, arabicName: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                                                <input
                                                    type="text"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                                <select
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'CREATOR' | 'LEARNER' })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                                >
                                                    <option value="LEARNER">Learner</option>
                                                    <option value="CREATOR">Creator</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Name</p>
                                                    <p className="font-medium text-white">{user.name}</p>
                                                    {user.arabicName && <p className="text-sm text-gray-400">{user.arabicName}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Email</p>
                                                    <p className="font-medium text-white">{user.email}</p>
                                                    {user.emailVerified ? (
                                                        <p className="text-sm text-green-400">Verified</p>
                                                    ) : (
                                                        <p className="text-sm text-red-400">Unverified</p>
                                                    )}
                                                </div>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm text-gray-400">Phone</p>
                                                        <p className="font-medium text-white">{user.phone}</p>
                                                        {user.phoneVerified ? (
                                                            <p className="text-sm text-green-400">Verified</p>
                                                        ) : (
                                                            <p className="text-sm text-red-400">Unverified</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-400">Role</p>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {user.bio && !isEditing && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-400 mb-1">Bio</p>
                                        <p className="text-white">{user.bio}</p>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                        />
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Account Status */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-lg font-medium text-white mb-4">Account Status</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-400">Joined</p>
                                            <p className="font-medium text-white">{formatDate(user.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <UserCheck className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-400">Onboarding</p>
                                            <p className={`font-medium ${user.onboardingCompleted ? 'text-green-400' : 'text-red-400'}`}>
                                                {user.onboardingCompleted ? 'Complete' : 'Incomplete'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-400">Login access</p>
                                            <p className={`font-medium ${user.loginDisabled ? 'text-red-400' : 'text-green-400'}`}>
                                                {user.loginDisabled ? 'Disabled' : 'Enabled'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm text-gray-400">Password reset required</p>
                                            <p className={`font-medium ${user.passwordResetRequired ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                {user.passwordResetRequired ? 'Pending reset' : 'Not required'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Flags */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-medium text-white">Feature Flags</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFlagsInput(JSON.stringify(user.featureFlags || {}, null, 2))}
                                            className="px-3 py-1 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                        >
                                            Reset to current
                                        </button>
                                        <button
                                            onClick={handleSaveFeatureFlags}
                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Save Flags
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mb-2">Provide a JSON object of feature toggles. Example: {`{"beta":true,"group":"staff"}`}</p>
                                <textarea
                                    value={flagsInput}
                                    onChange={(e) => setFlagsInput(e.target.value)}
                                    rows={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
                                />
                            </div>

                            {/* Quick Actions */}
                            {!isEditing && (
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {!user.emailVerified && (
                                            <button
                                                onClick={() => handleUpdate('verifyEmail')}
                                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                            >
                                                Verify Email
                                            </button>
                                        )}
                                        {user.emailVerified && (
                                            <button
                                                onClick={() => handleUpdate('unverifyEmail')}
                                                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                                            >
                                                Unverify Email
                                            </button>
                                        )}
                                        {!user.onboardingCompleted && (
                                            <button
                                                onClick={() => handleUpdate('completeOnboarding')}
                                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                Complete Onboarding
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleUpdate('disableLogin')}
                                            className="px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm"
                                        >
                                            Disable Login
                                        </button>
                                        <button
                                            onClick={() => handleUpdate('enableLogin')}
                                            className="px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm"
                                        >
                                            Enable Login
                                        </button>
                                        <button
                                            onClick={() => handleUpdate('requirePasswordReset')}
                                            className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                                        >
                                            Require Password Reset
                                        </button>
                                        <button
                                            onClick={() => handleUpdate('clearPasswordReset')}
                                            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                                        >
                                            Clear Reset Requirement
                                        </button>
                                        <button
                                            onClick={() => handleUpdate('updateRole', { role: user.role === 'LEARNER' ? 'CREATOR' : 'LEARNER' })}
                                            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                        >
                                            Switch to {user.role === 'LEARNER' ? 'Creator' : 'Learner'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Activity Summary */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-lg font-medium text-white mb-4">Activity Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {user.role === 'LEARNER' && (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-5 h-5 text-blue-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{user._count.enrollments}</p>
                                                    <p className="text-sm text-gray-400">Enrollments</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Award className="w-5 h-5 text-green-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{user._count.subscriptions}</p>
                                                    <p className="text-sm text-gray-400">Subscriptions</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {user.role === 'CREATOR' && user.creator && (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-5 h-5 text-blue-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{user.creator._count.courses}</p>
                                                    <p className="text-sm text-gray-400">Courses</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <UserCheck className="w-5 h-5 text-green-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-white">{user.creator.totalSubscribers}</p>
                                                    <p className="text-sm text-gray-400">Subscribers</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Award className="w-5 h-5 text-yellow-400" />
                                                <div>
                                                    <p className="text-2xl font-bold text-white">${user.creator.totalEarnings}</p>
                                                    <p className="text-sm text-gray-400">Earnings</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Blocking Controls */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-white">User Blocking</h3>
                                    <span className="text-xs text-gray-400">Admin-only moderation</span>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm text-gray-300">Block another user on behalf of this user</label>
                                        <div className="flex flex-col md:flex-row gap-2">
                                            <input
                                                type="text"
                                                value={blockTarget}
                                                onChange={(e) => setBlockTarget(e.target.value)}
                                                placeholder="Target email or user ID"
                                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500"
                                            />
                                            <button
                                                onClick={handleBlockUser}
                                                disabled={blockLoading}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                                            >
                                                {blockLoading ? 'Blocking...' : 'Block'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <button
                                                onClick={handleBlockUserFromTarget}
                                                disabled={blockLoading}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-60 text-sm"
                                            >
                                                {blockLoading ? 'Working...' : 'Block this user from target'}
                                            </button>
                                            <button
                                                onClick={handleMutualBlock}
                                                disabled={blockLoading}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-60 text-sm"
                                            >
                                                {blockLoading ? 'Working...' : 'Mutual block'}
                                            </button>
                                            <button
                                                onClick={handleClearBlocks}
                                                disabled={blockLoading}
                                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-60 text-sm"
                                            >
                                                {blockLoading ? 'Working...' : 'Clear blocks between both'}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400">Scenarios: block target from contacting this user, block this user from target, mutual block, or clear all blocks between them.</p>
                                    </div>

                                    {user.blockedUsers && user.blockedUsers.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-300 mb-2">Currently blocked by this user</p>
                                            <div className="space-y-2">
                                                {user.blockedUsers.map((entry) => (
                                                    <div key={entry.blocked.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                                        <div>
                                                            <p className="text-white text-sm">{entry.blocked.name}</p>
                                                            <p className="text-xs text-gray-400">{entry.blocked.email}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUnblockUser(entry.blocked.id)}
                                                            disabled={blockLoading}
                                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-60"
                                                        >
                                                            <ShieldX className="w-4 h-4" />
                                                            Unblock
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {user.blockedByUsers && user.blockedByUsers.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-300 mb-2">Blocked by other users</p>
                                            <div className="space-y-2">
                                                {user.blockedByUsers.map((entry) => (
                                                    <div key={entry.blocker.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                                        <div>
                                                            <p className="text-white text-sm">{entry.blocker.name}</p>
                                                            <p className="text-xs text-gray-400">{entry.blocker.email}</p>
                                                        </div>
                                                        <span className="text-xs text-gray-400">Cannot message this user</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recent Enrollments */}
                            {user.role === 'LEARNER' && user.enrollments.length > 0 && (
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-lg font-medium text-white mb-4">Recent Enrollments</h3>
                                    <div className="space-y-3">
                                        {user.enrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-white">{enrollment.course.title}</p>
                                                    {enrollment.course.titleAr && (
                                                        <p className="text-sm text-gray-400">{enrollment.course.titleAr}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-white">{enrollment.progress}% complete</p>
                                                    <p className="text-xs text-gray-400">{formatDate(enrollment.createdAt)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
