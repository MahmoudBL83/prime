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
    Save
} from 'lucide-react'

interface CreatorDetailsModalProps {
    creatorId: string
    isOpen: boolean
    onClose: () => void
    onCreatorUpdated: () => void
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
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'courses' | 'earnings'>('overview')
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        expertise: '',
        teachingGoals: '',
        bankAccountIBAN: '',
        bankName: ''
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
                bankName: creator.bankName || ''
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
        try {
            const response = await fetch(`/api/admin/creators/${creatorId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'updateProfile', ...editForm })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update creator')
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
                        {!isEditing && activeTab === 'overview' && (
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
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-card-hover rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-border">
                    <nav className="flex space-x-8 px-6">
                        {[
                            { id: 'overview', label: 'Overview', icon: User },
                            { id: 'kyc', label: 'KYC Documents', icon: Shield },
                            { id: 'courses', label: 'Courses', icon: BookOpen },
                            { id: 'earnings', label: 'Earnings', icon: DollarSign }
                        ].map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id
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
                                    {isEditing ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    Expertise
                                                </label>
                                                <textarea
                                                    value={editForm.expertise}
                                                    onChange={(e) => setEditForm({ ...editForm, expertise: e.target.value })}
                                                    rows={3}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="Areas of expertise..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    Teaching Goals
                                                </label>
                                                <textarea
                                                    value={editForm.teachingGoals}
                                                    onChange={(e) => setEditForm({ ...editForm, teachingGoals: e.target.value })}
                                                    rows={3}
                                                    className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                    placeholder="Teaching goals and objectives..."
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">
                                                        Bank Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.bankName}
                                                        onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                        placeholder="Bank name..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-1">
                                                        Bank Account IBAN
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={editForm.bankAccountIBAN}
                                                        onChange={(e) => setEditForm({ ...editForm, bankAccountIBAN: e.target.value })}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
                                                        placeholder="IBAN number..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save Changes
                                                </button>
                                                <button
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
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
                                        </>
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
                </div>
            </div>
        </div>
    )
}
