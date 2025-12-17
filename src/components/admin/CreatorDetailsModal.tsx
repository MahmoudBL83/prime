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
    DollarSign,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Download,
    Eye,
    Edit,
    Save,
    Trash2,
    Globe,
    CreditCard,
    Languages,
    MapPin,
    Video,
    Image,
    MessageSquare,
    Pin,
    Send,
    Plus
} from 'lucide-react'
import toast from 'react-hot-toast'

interface CreatorDetailsModalProps {
    creatorId: string
    isOpen: boolean
    onClose: () => void
    onCreatorUpdated: () => void
}

interface ChannelPost {
    id: string
    title?: string
    titleAr?: string
    content: string
    contentAr?: string
    type: 'TEXT' | 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'POLL' | 'ANNOUNCEMENT'
    tier: string
    mediaUrl?: string
    thumbnailUrl?: string
    isPinned: boolean
    publishedAt?: string
    scheduledAt?: string
    viewCount: number
    createdAt: string
    updatedAt: string
    _count: {
        likes: number
        comments: number
    }
}

interface CreatorChannel {
    id: string
    name: string
    posts: ChannelPost[]
}

interface CreatorDetails {
    id: string
    userId: string
    kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
    nationalId?: string
    nationalIdImage?: string
    selfieImage?: string
    addressProof?: string
    bankAccountIBAN?: string
    bankName?: string
    expertise?: string
    teachingGoals?: string
    contractSigned: boolean
    contractSignedAt?: string
    totalEarnings: number
    totalSubscribers: number
    monthlyPrice?: number
    hourlyRate?: number
    availableForMeetings?: boolean
    languages?: string
    timezone?: string
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        email: string
        phone?: string
        arabicName?: string
        bio?: string
        emailVerified?: string
        onboardingCompleted: boolean
        createdAt: string
    }
    courses: Array<{
        id: string
        title: string
        titleAr: string
        status: string
        totalEnrollments: number
        rating: number
        price: number
        createdAt: string
    }>
    credentials?: Array<{
        id: string
        type: string
        title: string
        titleAr?: string
        institution: string
        institutionAr?: string
        description?: string
        descriptionAr?: string
        issueDate?: string
        expiryDate?: string
        credentialId?: string
        credentialUrl?: string
        documentUrl?: string
        isVerified: boolean
        verifiedAt?: string
        isPublic: boolean
        sortOrder: number
    }>
    channels?: CreatorChannel[]
    _count: {
        courses: number
    }
}

const kycStatusColors = {
    NOT_STARTED: 'bg-muted text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    VERIFIED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
}

const kycStatusIcons = {
    NOT_STARTED: Clock,
    PENDING: AlertTriangle,
    VERIFIED: CheckCircle,
    REJECTED: XCircle
}

const kycStatusLabels = {
    NOT_STARTED: 'Not Started',
    PENDING: 'Pending',
    VERIFIED: 'Verified',
    REJECTED: 'Rejected'
}

export default function CreatorDetailsModal({ creatorId, isOpen, onClose, onCreatorUpdated }: CreatorDetailsModalProps) {
    const [creator, setCreator] = useState<CreatorDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'courses' | 'earnings' | 'credentials' | 'posts'>('overview')
    const [isEditing, setIsEditing] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showCredentialModal, setShowCredentialModal] = useState(false)
    const [editingCredential, setEditingCredential] = useState<any>(null)
    const [credentialForm, setCredentialForm] = useState({
        type: 'CERTIFICATION',
        title: '',
        titleAr: '',
        institution: '',
        institutionAr: '',
        description: '',
        descriptionAr: '',
        issueDate: '',
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
        documentUrl: '',
        isVerified: false,
        isPublic: true,
        sortOrder: 0
    })
    
    // Posts management state
    const [showPostModal, setShowPostModal] = useState(false)
    const [editingPost, setEditingPost] = useState<ChannelPost | null>(null)
    const [postForm, setPostForm] = useState({
        title: '',
        titleAr: '',
        content: '',
        contentAr: '',
        type: 'TEXT' as 'TEXT' | 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'POLL' | 'ANNOUNCEMENT',
        mediaUrl: '',
        thumbnailUrl: '',
        isPinned: false,
        isDraft: false,
        scheduledAt: ''
    })
    
    // Comprehensive edit form for creator
    const [editForm, setEditForm] = useState({
        expertise: '',
        teachingGoals: '',
        bankAccountIBAN: '',
        bankName: '',
        monthlyPrice: '',
        hourlyRate: '',
        availableForMeetings: false,
        languages: '',
        timezone: '',
        totalEarnings: '',
        totalSubscribers: '',
        kycStatus: 'NOT_STARTED' as CreatorDetails['kycStatus'],
        contractSigned: false
    })
    
    // User profile edit form
    const [profileEdit, setProfileEdit] = useState({
        name: '',
        email: '',
        phone: '',
        arabicName: '',
        bio: ''
    })

    useEffect(() => {
        if (isOpen && creatorId) {
            fetchCreatorDetails()
        }
    }, [isOpen, creatorId])

    useEffect(() => {
        if (creator) {
            setEditForm({
                expertise: creator.expertise || '',
                teachingGoals: creator.teachingGoals || '',
                bankAccountIBAN: creator.bankAccountIBAN || '',
                bankName: creator.bankName || '',
                monthlyPrice: creator.monthlyPrice?.toString() || '',
                hourlyRate: creator.hourlyRate?.toString() || '',
                availableForMeetings: creator.availableForMeetings || false,
                languages: creator.languages || '',
                timezone: creator.timezone || '',
                totalEarnings: creator.totalEarnings?.toString() || '0',
                totalSubscribers: creator.totalSubscribers?.toString() || '0',
                kycStatus: creator.kycStatus,
                contractSigned: creator.contractSigned
            })
            setProfileEdit({
                name: creator.user.name || '',
                email: creator.user.email || '',
                phone: creator.user.phone || '',
                arabicName: creator.user.arabicName || '',
                bio: creator.user.bio || ''
            })
        }
    }, [creator])

    const fetchCreatorDetails = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`/api/admin/creators/${creatorId}`)
            if (!response.ok) {
                throw new Error('Failed to fetch creator details')
            }
            const data = await response.json()
            setCreator(data.creator || data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleKycAction = async (action: 'approve' | 'reject', reason?: string) => {
        try {
            const response = await fetch(`/api/admin/creators/${creatorId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, reason })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update KYC status')
            }

            await fetchCreatorDetails()
            onCreatorUpdated()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        }
    }

    const handleSaveEdit = async () => {
        setSaving(true)
        try {
            const response = await fetch(`/api/admin/creators/${creatorId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'updateAll',
                    expertise: editForm.expertise,
                    teachingGoals: editForm.teachingGoals,
                    bankAccountIBAN: editForm.bankAccountIBAN,
                    bankName: editForm.bankName,
                    monthlyPrice: editForm.monthlyPrice,
                    hourlyRate: editForm.hourlyRate,
                    availableForMeetings: editForm.availableForMeetings,
                    languages: editForm.languages,
                    timezone: editForm.timezone,
                    totalEarnings: editForm.totalEarnings,
                    totalSubscribers: editForm.totalSubscribers,
                    kycStatus: editForm.kycStatus,
                    contractSigned: editForm.contractSigned,
                    user: {
                        name: profileEdit.name,
                        arabicName: profileEdit.arabicName,
                        phone: profileEdit.phone,
                        bio: profileEdit.bio
                    }
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update creator')
            }

            await fetchCreatorDetails()
            onCreatorUpdated()
            setIsEditing(false)
            toast.success('Creator updated successfully')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            toast.error(err instanceof Error ? err.message : 'Failed to update')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteCreator = async () => {
        setSaving(true)
        try {
            const response = await fetch(`/api/admin/creators/${creatorId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to delete creator')
            }

            onCreatorUpdated()
            onClose()
            toast.success('Creator deleted successfully')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            toast.error(err instanceof Error ? err.message : 'Failed to delete')
        } finally {
            setSaving(false)
            setShowDeleteConfirm(false)
        }
    }

    const handleUpdateUserProfile = async () => {
        try {
            const response = await fetch(`/api/admin/users/${creator?.user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'updateProfile',
                    name: profileEdit.name,
                    arabicName: profileEdit.arabicName,
                    phone: profileEdit.phone,
                    email: profileEdit.email
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update mentor profile')
            }

            await fetchCreatorDetails()
            onCreatorUpdated()
            setIsEditing(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        }
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const getKycStatusIcon = (status: CreatorDetails['kycStatus']) => {
        const Icon = kycStatusIcons[status]
        return <Icon className="w-5 h-5" />
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-semibold text-foreground">
                            Creator Details
                        </h2>
                        {creator && (
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${kycStatusColors[creator.kycStatus]}`}>
                                {getKycStatusIcon(creator.kycStatus)}
                                KYC {kycStatusLabels[creator.kycStatus]}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit All
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </>
                        )}
                        {isEditing && (
                            <>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save All'}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-card-hover rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <nav className="flex space-x-8 px-6 overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: User },
                            { id: 'kyc', label: 'KYC Documents', icon: Shield },
                            { id: 'courses', label: 'Courses', icon: BookOpen },
                            { id: 'earnings', label: 'Earnings', icon: DollarSign },
                            { id: 'credentials', label: 'Credentials', icon: Award },
                            { id: 'posts', label: 'Posts & Media', icon: Video }
                        ].map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {creator && activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Delete Confirmation Modal */}
                            {showDeleteConfirm && (
                                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                                    <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 border border-border">
                                        <h3 className="text-lg font-bold text-foreground mb-4">Confirm Delete</h3>
                                        <p className="text-muted-foreground mb-6">
                                            Are you sure you want to delete this creator profile? This action cannot be undone.
                                            {creator._count.courses > 0 && (
                                                <span className="block text-red-500 mt-2">
                                                    Warning: This creator has {creator._count.courses} courses. You must delete or reassign them first.
                                                </span>
                                            )}
                                        </p>
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDeleteCreator}
                                                disabled={saving || creator._count.courses > 0}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {saving ? 'Deleting...' : 'Delete Creator'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isEditing ? (
                                /* Full Edit Mode */
                                <div className="space-y-6">
                                    {/* User Profile Section */}
                                    <div className="bg-card rounded-lg p-4 border border-border">
                                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            User Profile
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                                                <input
                                                    type="text"
                                                    value={profileEdit.name}
                                                    onChange={(e) => setProfileEdit({ ...profileEdit, name: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Arabic Name</label>
                                                <input
                                                    type="text"
                                                    value={profileEdit.arabicName}
                                                    onChange={(e) => setProfileEdit({ ...profileEdit, arabicName: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    dir="rtl"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Email (Read-only)</label>
                                                <input
                                                    type="email"
                                                    value={profileEdit.email}
                                                    disabled
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-muted text-muted-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                                                <input
                                                    type="tel"
                                                    value={profileEdit.phone}
                                                    onChange={(e) => setProfileEdit({ ...profileEdit, phone: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
                                                <textarea
                                                    value={profileEdit.bio}
                                                    onChange={(e) => setProfileEdit({ ...profileEdit, bio: e.target.value })}
                                                    rows={3}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Creator Profile Section */}
                                    <div className="bg-card rounded-lg p-4 border border-border">
                                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                            <Award className="w-5 h-5" />
                                            Creator Profile
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-foreground mb-1">Expertise</label>
                                                <textarea
                                                    value={editForm.expertise}
                                                    onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })}
                                                    rows={2}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="Areas of expertise..."
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-foreground mb-1">Teaching Goals</label>
                                                <textarea
                                                    value={editForm.teachingGoals}
                                                    onChange={(e) => setEditForm({ ...editForm, teachingGoals: e.target.value })}
                                                    rows={2}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="Teaching goals..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Languages</label>
                                                <input
                                                    type="text"
                                                    value={editForm.languages}
                                                    onChange={(e) => setEditForm({ ...editForm, languages: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="English, Arabic..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
                                                <input
                                                    type="text"
                                                    value={editForm.timezone}
                                                    onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="UTC+2"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Section */}
                                    <div className="bg-card rounded-lg p-4 border border-border">
                                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                            <DollarSign className="w-5 h-5" />
                                            Pricing & Availability
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Monthly Price (€)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.monthlyPrice}
                                                    onChange={(e) => setEditForm({ ...editForm, monthlyPrice: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="29"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Hourly Rate (€)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.hourlyRate}
                                                    onChange={(e) => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="50"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.availableForMeetings}
                                                    onChange={(e) => setEditForm({ ...editForm, availableForMeetings: e.target.checked })}
                                                    className="w-5 h-5 rounded"
                                                />
                                                <label className="text-sm font-medium text-foreground">Available for Meetings</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Banking Section */}
                                    <div className="bg-card rounded-lg p-4 border border-border">
                                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                            <CreditCard className="w-5 h-5" />
                                            Banking Details
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Bank Name</label>
                                                <input
                                                    type="text"
                                                    value={editForm.bankName}
                                                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">IBAN</label>
                                                <input
                                                    type="text"
                                                    value={editForm.bankAccountIBAN}
                                                    onChange={(e) => setEditForm({ ...editForm, bankAccountIBAN: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Section */}
                                    <div className="bg-card rounded-lg p-4 border border-border">
                                        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                            <Shield className="w-5 h-5" />
                                            Status & Metrics
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">KYC Status</label>
                                                <select
                                                    value={editForm.kycStatus}
                                                    onChange={(e) => setEditForm({ ...editForm, kycStatus: e.target.value as CreatorDetails['kycStatus'] })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                >
                                                    <option value="NOT_STARTED">Not Started</option>
                                                    <option value="PENDING">Pending</option>
                                                    <option value="VERIFIED">Verified</option>
                                                    <option value="REJECTED">Rejected</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.contractSigned}
                                                    onChange={(e) => setEditForm({ ...editForm, contractSigned: e.target.checked })}
                                                    className="w-5 h-5 rounded"
                                                />
                                                <label className="text-sm font-medium text-foreground">Contract Signed</label>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Total Earnings (€)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.totalEarnings}
                                                    onChange={(e) => setEditForm({ ...editForm, totalEarnings: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">Total Subscribers</label>
                                                <input
                                                    type="number"
                                                    value={editForm.totalSubscribers}
                                                    onChange={(e) => setEditForm({ ...editForm, totalSubscribers: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <>
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-card rounded-lg p-4 border border-border">
                                            <h3 className="text-lg font-medium text-foreground mb-4">
                                                Personal Information
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <User className="w-5 h-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Name</p>
                                                        <p className="font-medium text-foreground">{creator.user.name}</p>
                                                        {creator.user.arabicName && <p className="text-sm text-muted-foreground">{creator.user.arabicName}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-5 h-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Email</p>
                                                        <p className="font-medium text-foreground">{creator.user.email}</p>
                                                        {creator.user.emailVerified ? (
                                                            <p className="text-sm text-green-600">Verified</p>
                                                        ) : (
                                                            <p className="text-sm text-red-600">Unverified</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {creator.user.phone && (
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-5 h-5 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Phone</p>
                                                            <p className="font-medium text-foreground">{creator.user.phone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Joined</p>
                                                        <p className="font-medium text-foreground">{formatDate(creator.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Metrics */}
                                        <div className="bg-card rounded-lg p-4 border border-border">
                                            <h3 className="text-lg font-medium text-foreground mb-4">
                                                Performance
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-background rounded-lg p-3 border border-border">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm text-muted-foreground">Courses</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{creator._count.courses}</p>
                                                </div>
                                                <div className="bg-background rounded-lg p-3 border border-border">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm text-muted-foreground">Subscribers</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{creator.totalSubscribers}</p>
                                                </div>
                                                <div className="bg-background rounded-lg p-3 border border-border col-span-2">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-green-600" />
                                                        <span className="text-sm text-muted-foreground">Total Earnings</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{formatCurrency(creator.totalEarnings)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Professional Info */}
                                    <div className="bg-card rounded-lg p-4 border border-border">
                                        <h3 className="text-lg font-medium text-foreground mb-4">
                                            Professional Information
                                        </h3>
                                        <div className="space-y-4">
                                            {creator.expertise && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Expertise</p>
                                                    <p className="text-foreground">{creator.expertise}</p>
                                                </div>
                                            )}
                                            {creator.teachingGoals && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Teaching Goals</p>
                                                    <p className="text-foreground">{creator.teachingGoals}</p>
                                                </div>
                                            )}
                                            {(creator.bankName || creator.bankAccountIBAN) && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Banking Details</p>
                                                    {creator.bankName && <p className="text-foreground">Bank: {creator.bankName}</p>}
                                                    {creator.bankAccountIBAN && <p className="text-foreground">IBAN: {creator.bankAccountIBAN}</p>}
                                                </div>
                                            )}
                                            {!creator.expertise && !creator.teachingGoals && !creator.bankName && !creator.bankAccountIBAN && (
                                                <p className="text-muted-foreground">No professional information provided yet.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contract Status */}
                                    <div className="bg-card rounded-lg p-4 border border-border">
                                        <h3 className="text-lg font-medium text-foreground mb-4">
                                            Contract Status
                                        </h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`font-medium ${creator.contractSigned ? 'text-green-600' : 'text-red-600'}`}>
                                                    {creator.contractSigned ? 'Contract Signed' : 'Contract Not Signed'}
                                                </p>
                                                {creator.contractSignedAt && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Signed on {formatDate(creator.contractSignedAt)}
                                                    </p>
                                                )}
                                            </div>
                                            {!creator.contractSigned && (
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                                    Send Contract
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {creator && activeTab === 'kyc' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-foreground">
                                    KYC Documentation
                                </h3>
                                <div className="flex gap-2">
                                    {creator.kycStatus === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleKycAction('approve')}
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Approve KYC
                                            </button>
                                            <button
                                                onClick={() => handleKycAction('reject', 'Documents incomplete or invalid')}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject KYC
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: 'National ID', field: 'nationalId', image: 'nationalIdImage' },
                                    { label: 'Selfie Verification', field: null, image: 'selfieImage' },
                                    { label: 'Address Proof', field: null, image: 'addressProof' },
                                ].map((doc, index) => (
                                    <div key={index} className="bg-card rounded-lg p-4 border border-border">
                                        <h4 className="font-medium text-foreground mb-3">{doc.label}</h4>
                                        {doc.field && creator[doc.field as keyof CreatorDetails] && (
                                            <p className="text-sm text-muted-foreground mb-2">
                                                ID: {creator[doc.field as keyof CreatorDetails] as string}
                                            </p>
                                        )}
                                        {creator[doc.image as keyof CreatorDetails] ? (
                                            <div className="space-y-2">
                                                <img
                                                    src={creator[doc.image as keyof CreatorDetails] as string}
                                                    alt={doc.label}
                                                    className="w-full h-32 object-cover rounded-lg border"
                                                />
                                                <div className="flex gap-2">
                                                    <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                                                        <Eye className="w-4 h-4" />
                                                        View Full Size
                                                    </button>
                                                    <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                No document uploaded
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {creator && activeTab === 'courses' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-foreground">
                                Created Courses
                            </h3>
                            {creator.courses && creator.courses.length > 0 ? (
                                <div className="space-y-3">
                                    {creator.courses.map((course) => (
                                        <div key={course.id} className="bg-card rounded-lg p-4 border border-border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-foreground">{course.title}</h4>
                                                    {course.titleAr && (
                                                        <p className="text-sm text-muted-foreground">{course.titleAr}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                        <span>{course.totalEnrollments} enrollments</span>
                                                        <span>★ {course.rating.toFixed(1)}</span>
                                                        <span>{formatCurrency(course.price)}</span>
                                                        <span className={`px-2 py-1 rounded text-xs ${course.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {course.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-muted-foreground hover:text-blue-600">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">
                                    No courses created yet
                                </p>
                            )}
                        </div>
                    )}

                    {creator && activeTab === 'earnings' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-card rounded-lg p-4 border border-border">
                                    <h4 className="text-lg font-medium text-foreground">
                                        Total Earnings
                                    </h4>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(creator.totalEarnings)}</p>
                                </div>
                                <div className="bg-card rounded-lg p-4 border border-border">
                                    <h4 className="text-lg font-medium text-foreground">
                                        Average per Course
                                    </h4>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(creator._count.courses > 0 ? creator.totalEarnings / creator._count.courses : 0)}
                                    </p>
                                </div>
                                <div className="bg-card rounded-lg p-4 border border-border">
                                    <h4 className="text-lg font-medium text-foreground">
                                        Payout Status
                                    </h4>
                                    <p className="text-lg font-medium text-yellow-600">
                                        Pending
                                    </p>
                                </div>
                            </div>

                            <div className="bg-card rounded-lg p-4 border border-border">
                                <h4 className="text-lg font-medium text-foreground mb-4">
                                    Recent Transactions
                                </h4>
                                <p className="text-muted-foreground">
                                    Transaction history will be displayed here
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Credentials Tab */}
                    {creator && activeTab === 'credentials' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">Certificates & Credentials</h3>
                                <button
                                    onClick={() => {
                                        setEditingCredential(null)
                                        setCredentialForm({
                                            type: 'CERTIFICATION',
                                            title: '',
                                            titleAr: '',
                                            institution: '',
                                            institutionAr: '',
                                            description: '',
                                            descriptionAr: '',
                                            issueDate: '',
                                            expiryDate: '',
                                            credentialId: '',
                                            credentialUrl: '',
                                            documentUrl: '',
                                            isVerified: false,
                                            isPublic: true,
                                            sortOrder: (creator.credentials?.length || 0) + 1
                                        })
                                        setShowCredentialModal(true)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Award className="w-4 h-4" />
                                    Add Credential
                                </button>
                            </div>

                            {(!creator.credentials || creator.credentials.length === 0) ? (
                                <div className="text-center py-8 bg-card rounded-lg border border-border">
                                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No credentials added yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">Add certificates, degrees, or professional credentials</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {creator.credentials.map((cred) => (
                                        <div key={cred.id} className="bg-card rounded-lg p-4 border border-border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-foreground">{cred.title}</h4>
                                                        {cred.isVerified && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Verified
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                            {cred.type}
                                                        </span>
                                                    </div>
                                                    {cred.titleAr && <p className="text-sm text-muted-foreground">{cred.titleAr}</p>}
                                                    <p className="text-sm text-foreground mt-1">{cred.institution}</p>
                                                    {cred.description && <p className="text-sm text-muted-foreground mt-2">{cred.description}</p>}
                                                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                                        {cred.issueDate && <span>Issued: {new Date(cred.issueDate).toLocaleDateString()}</span>}
                                                        {cred.expiryDate && <span>Expires: {new Date(cred.expiryDate).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!cred.isVerified && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const response = await fetch(`/api/admin/creators/${creatorId}`, {
                                                                        method: 'PATCH',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ action: 'verifyCredential', credentialId: cred.id })
                                                                    })
                                                                    if (response.ok) {
                                                                        toast.success('Credential verified')
                                                                        fetchCreatorDetails()
                                                                    }
                                                                } catch (err) {
                                                                    toast.error('Failed to verify credential')
                                                                }
                                                            }}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                            title="Verify"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setEditingCredential(cred)
                                                            setCredentialForm({
                                                                type: cred.type,
                                                                title: cred.title,
                                                                titleAr: cred.titleAr || '',
                                                                institution: cred.institution,
                                                                institutionAr: cred.institutionAr || '',
                                                                description: cred.description || '',
                                                                descriptionAr: cred.descriptionAr || '',
                                                                issueDate: cred.issueDate ? new Date(cred.issueDate).toISOString().split('T')[0] : '',
                                                                expiryDate: cred.expiryDate ? new Date(cred.expiryDate).toISOString().split('T')[0] : '',
                                                                credentialId: cred.credentialId || '',
                                                                credentialUrl: cred.credentialUrl || '',
                                                                documentUrl: cred.documentUrl || '',
                                                                isVerified: cred.isVerified,
                                                                isPublic: cred.isPublic,
                                                                sortOrder: cred.sortOrder
                                                            })
                                                            setShowCredentialModal(true)
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Are you sure you want to delete this credential?')) return
                                                            try {
                                                                const response = await fetch(`/api/admin/creators/${creatorId}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ action: 'deleteCredential', credentialId: cred.id })
                                                                })
                                                                if (response.ok) {
                                                                    toast.success('Credential deleted')
                                                                    fetchCreatorDetails()
                                                                }
                                                            } catch (err) {
                                                                toast.error('Failed to delete credential')
                                                            }
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Posts Tab */}
                    {creator && activeTab === 'posts' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">Posts & Media Content</h3>
                                <button
                                    onClick={() => {
                                        setEditingPost(null)
                                        setPostForm({
                                            title: '',
                                            titleAr: '',
                                            content: '',
                                            contentAr: '',
                                            type: 'TEXT',
                                            mediaUrl: '',
                                            thumbnailUrl: '',
                                            isPinned: false,
                                            isDraft: false,
                                            scheduledAt: ''
                                        })
                                        setShowPostModal(true)
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Post
                                </button>
                            </div>

                            {/* Posts Stats */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-card p-4 rounded-lg border border-border">
                                    <p className="text-sm text-muted-foreground">Total Posts</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {creator.channels?.[0]?.posts?.length || 0}
                                    </p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border border-border">
                                    <p className="text-sm text-muted-foreground">Videos</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {creator.channels?.[0]?.posts?.filter(p => p.type === 'VIDEO').length || 0}
                                    </p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border border-border">
                                    <p className="text-sm text-muted-foreground">Images</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {creator.channels?.[0]?.posts?.filter(p => p.type === 'IMAGE').length || 0}
                                    </p>
                                </div>
                                <div className="bg-card p-4 rounded-lg border border-border">
                                    <p className="text-sm text-muted-foreground">Pinned</p>
                                    <p className="text-2xl font-bold text-foreground">
                                        {creator.channels?.[0]?.posts?.filter(p => p.isPinned).length || 0}
                                    </p>
                                </div>
                            </div>

                            {(!creator.channels?.[0]?.posts || creator.channels[0].posts.length === 0) ? (
                                <div className="text-center py-8 bg-card rounded-lg border border-border">
                                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No posts yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">Create posts with text, images, or videos</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {creator.channels[0].posts.map((post) => (
                                        <div key={post.id} className="bg-card rounded-lg p-4 border border-border">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {post.isPinned && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                                                <Pin className="w-3 h-3" />
                                                                Pinned
                                                            </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                                            post.type === 'VIDEO' ? 'bg-purple-100 text-purple-700' :
                                                            post.type === 'IMAGE' ? 'bg-blue-100 text-blue-700' :
                                                            post.type === 'ANNOUNCEMENT' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {post.type}
                                                        </span>

                                                        {!post.publishedAt && (
                                                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                                                Draft
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-semibold text-foreground mt-2">{post.title || 'Untitled Post'}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                                                    
                                                    {post.mediaUrl && (
                                                        <div className="mt-2">
                                                            {post.type === 'VIDEO' ? (
                                                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                                                    <Video className="w-4 h-4" />
                                                                    <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">View Video</a>
                                                                </div>
                                                            ) : post.type === 'IMAGE' ? (
                                                                <img src={post.mediaUrl} alt="" className="w-24 h-24 object-cover rounded" />
                                                            ) : null}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-3 h-3" /> {post.viewCount} views
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            ❤️ {post._count.likes} likes
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="w-3 h-3" /> {post._count.comments} comments
                                                        </span>
                                                        <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!post.publishedAt && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const response = await fetch(`/api/admin/creators/${creatorId}`, {
                                                                        method: 'PATCH',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ action: 'publishPost', postId: post.id })
                                                                    })
                                                                    if (response.ok) {
                                                                        toast.success('Post published')
                                                                        fetchCreatorDetails()
                                                                    }
                                                                } catch (err) {
                                                                    toast.error('Failed to publish post')
                                                                }
                                                            }}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                            title="Publish"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const response = await fetch(`/api/admin/creators/${creatorId}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ action: 'pinPost', postId: post.id, isPinned: !post.isPinned })
                                                                })
                                                                if (response.ok) {
                                                                    toast.success(post.isPinned ? 'Post unpinned' : 'Post pinned')
                                                                    fetchCreatorDetails()
                                                                }
                                                            } catch (err) {
                                                                toast.error('Failed to update pin status')
                                                            }
                                                        }}
                                                        className={`p-2 ${post.isPinned ? 'text-amber-600' : 'text-gray-400'} hover:bg-amber-50 rounded`}
                                                        title={post.isPinned ? 'Unpin' : 'Pin'}
                                                    >
                                                        <Pin className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingPost(post)
                                                            setPostForm({
                                                                title: post.title || '',
                                                                titleAr: post.titleAr || '',
                                                                content: post.content,
                                                                contentAr: post.contentAr || '',
                                                                type: post.type,
                                                                mediaUrl: post.mediaUrl || '',
                                                                thumbnailUrl: post.thumbnailUrl || '',
                                                                isPinned: post.isPinned,
                                                                isDraft: !post.publishedAt,
                                                                scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
                                                            })
                                                            setShowPostModal(true)
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('Are you sure you want to delete this post? This will also delete all likes and comments.')) return
                                                            try {
                                                                const response = await fetch(`/api/admin/creators/${creatorId}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ action: 'deletePost', postId: post.id })
                                                                })
                                                                if (response.ok) {
                                                                    toast.success('Post deleted')
                                                                    fetchCreatorDetails()
                                                                }
                                                            } catch (err) {
                                                                toast.error('Failed to delete post')
                                                            }
                                                        }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Credential Add/Edit Modal */}
            {showCredentialModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                    <div className="bg-background rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">
                                {editingCredential ? 'Edit Credential' : 'Add New Credential'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                                    <select
                                        value={credentialForm.type}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, type: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    >
                                        <option value="CERTIFICATION">Certification</option>
                                        <option value="DEGREE">Degree</option>
                                        <option value="LICENSE">License</option>
                                        <option value="AWARD">Award</option>
                                        <option value="PUBLICATION">Publication</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Sort Order</label>
                                    <input
                                        type="number"
                                        value={credentialForm.sortOrder}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, sortOrder: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Title (English) *</label>
                                    <input
                                        type="text"
                                        value={credentialForm.title}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Title (Arabic)</label>
                                    <input
                                        type="text"
                                        value={credentialForm.titleAr}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, titleAr: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Institution (English) *</label>
                                    <input
                                        type="text"
                                        value={credentialForm.institution}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, institution: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Institution (Arabic)</label>
                                    <input
                                        type="text"
                                        value={credentialForm.institutionAr}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, institutionAr: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Description (English)</label>
                                <textarea
                                    value={credentialForm.description}
                                    onChange={(e) => setCredentialForm({ ...credentialForm, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Issue Date</label>
                                    <input
                                        type="date"
                                        value={credentialForm.issueDate}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, issueDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={credentialForm.expiryDate}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, expiryDate: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Credential URL</label>
                                    <input
                                        type="url"
                                        value={credentialForm.credentialUrl}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, credentialUrl: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Document URL</label>
                                    <input
                                        type="url"
                                        value={credentialForm.documentUrl}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, documentUrl: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={credentialForm.isVerified}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, isVerified: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-foreground">Verified</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={credentialForm.isPublic}
                                        onChange={(e) => setCredentialForm({ ...credentialForm, isPublic: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-foreground">Public</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setShowCredentialModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!credentialForm.title || !credentialForm.institution) {
                                        toast.error('Title and Institution are required')
                                        return
                                    }
                                    try {
                                        const response = await fetch(`/api/admin/creators/${creatorId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                action: editingCredential ? 'updateCredential' : 'addCredential',
                                                credentialId: editingCredential?.id,
                                                type: credentialForm.type,
                                                title: credentialForm.title,
                                                titleAr: credentialForm.titleAr,
                                                institution: credentialForm.institution,
                                                institutionAr: credentialForm.institutionAr,
                                                description: credentialForm.description,
                                                descriptionAr: credentialForm.descriptionAr,
                                                issueDate: credentialForm.issueDate,
                                                expiryDate: credentialForm.expiryDate,
                                                credentialUrl: credentialForm.credentialUrl,
                                                documentUrl: credentialForm.documentUrl,
                                                isVerified: credentialForm.isVerified,
                                                isPublic: credentialForm.isPublic,
                                                sortOrder: credentialForm.sortOrder
                                            })
                                        })
                                        if (response.ok) {
                                            toast.success(editingCredential ? 'Credential updated' : 'Credential added')
                                            setShowCredentialModal(false)
                                            fetchCreatorDetails()
                                        } else {
                                            const error = await response.json()
                                            throw new Error(error.error || 'Failed to save')
                                        }
                                    } catch (err) {
                                        toast.error(err instanceof Error ? err.message : 'Failed to save credential')
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {editingCredential ? 'Update' : 'Add'} Credential
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post Add/Edit Modal */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                    <div className="bg-background rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">
                                {editingPost ? 'Edit Post' : 'Create New Post'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Post Type</label>
                                    <select
                                        value={postForm.type}
                                        onChange={(e) => setPostForm({ ...postForm, type: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    >
                                        <option value="TEXT">Text</option>
                                        <option value="VIDEO">Video</option>
                                        <option value="IMAGE">Image</option>
                                        <option value="DOCUMENT">Document</option>
                                        <option value="ANNOUNCEMENT">Announcement</option>
                                    </select>
                                </div>

                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Title (English)</label>
                                    <input
                                        type="text"
                                        value={postForm.title}
                                        onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        placeholder="Optional title..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Title (Arabic)</label>
                                    <input
                                        type="text"
                                        value={postForm.titleAr}
                                        onChange={(e) => setPostForm({ ...postForm, titleAr: e.target.value })}
                                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Content (English) *</label>
                                <textarea
                                    value={postForm.content}
                                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    rows={4}
                                    placeholder="Write your post content..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Content (Arabic)</label>
                                <textarea
                                    value={postForm.contentAr}
                                    onChange={(e) => setPostForm({ ...postForm, contentAr: e.target.value })}
                                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                    rows={3}
                                    dir="rtl"
                                />
                            </div>
                            {(postForm.type === 'VIDEO' || postForm.type === 'IMAGE' || postForm.type === 'DOCUMENT') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Media URL</label>
                                        <input
                                            type="url"
                                            value={postForm.mediaUrl}
                                            onChange={(e) => setPostForm({ ...postForm, mediaUrl: e.target.value })}
                                            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Thumbnail URL</label>
                                        <input
                                            type="url"
                                            value={postForm.thumbnailUrl}
                                            onChange={(e) => setPostForm({ ...postForm, thumbnailUrl: e.target.value })}
                                            className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Schedule For (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={postForm.scheduledAt}
                                    onChange={(e) => setPostForm({ ...postForm, scheduledAt: e.target.value })}
                                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground"
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={postForm.isPinned}
                                        onChange={(e) => setPostForm({ ...postForm, isPinned: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-foreground">Pin this post</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={postForm.isDraft}
                                        onChange={(e) => setPostForm({ ...postForm, isDraft: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-foreground">Save as Draft</span>
                                </label>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setShowPostModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!postForm.content) {
                                        toast.error('Content is required')
                                        return
                                    }
                                    try {
                                        const response = await fetch(`/api/admin/creators/${creatorId}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                action: editingPost ? 'updatePost' : 'addPost',
                                                postId: editingPost?.id,
                                                title: postForm.title,
                                                titleAr: postForm.titleAr,
                                                content: postForm.content,
                                                contentAr: postForm.contentAr,
                                                type: postForm.type,
                                                mediaUrl: postForm.mediaUrl,
                                                thumbnailUrl: postForm.thumbnailUrl,
                                                isPinned: postForm.isPinned,
                                                isDraft: postForm.isDraft,
                                                scheduledAt: postForm.scheduledAt
                                            })
                                        })
                                        if (response.ok) {
                                            toast.success(editingPost ? 'Post updated' : 'Post created')
                                            setShowPostModal(false)
                                            fetchCreatorDetails()
                                        } else {
                                            const error = await response.json()
                                            throw new Error(error.error || 'Failed to save')
                                        }
                                    } catch (err) {
                                        toast.error(err instanceof Error ? err.message : 'Failed to save post')
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {editingPost ? 'Update' : 'Create'} Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
