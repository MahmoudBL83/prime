'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
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
    AlertTriangle
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
    const locale = useLocale()
    const [editForm, setEditForm] = useState({
        name: '',
        arabicName: '',
        phone: '',
        bio: '',
        role: 'LEARNER' as 'ADMIN' | 'CREATOR' | 'LEARNER'
    })

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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (action: string, data: any = {}) => {
        try {
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
        }
    }

    const handleSaveEdit = async () => {
        await handleUpdate('updateProfile', editForm)
        setIsEditing(false)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'de' ? 'de-DE' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">
                        {locale === 'ar' ? 'تفاصيل المستخدم' : locale === 'de' ? 'Benutzerdetails' : 'User Details'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700"
                            >
                                <Edit className="w-4 h-4" />
                                {locale === 'ar' ? 'تعديل' : locale === 'de' ? 'Bearbeiten' : 'Edit'}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-card-hover rounded-lg"
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
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {user && (
                        <div className="space-y-6">
                            {/* Basic Info */}
                            <div className="bg-background rounded-lg p-4">
                                <h3 className="text-lg font-medium text-foreground mb-4">
                                    {locale === 'ar' ? 'المعلومات الأساسية' : locale === 'de' ? 'Grundlegende Informationen' : 'Basic Information'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {isEditing ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    {locale === 'ar' ? 'الاسم' : locale === 'de' ? 'Name' : 'Name'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    {locale === 'ar' ? 'الاسم بالعربية' : locale === 'de' ? 'Arabischer Name' : 'Arabic Name'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.arabicName}
                                                    onChange={(e) => setEditForm({ ...editForm, arabicName: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    {locale === 'ar' ? 'رقم الهاتف' : locale === 'de' ? 'Telefon' : 'Phone'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.phone}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="w-full border border-border rounded-lg px-3 py-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-1">
                                                    {locale === 'ar' ? 'الدور' : locale === 'de' ? 'Rolle' : 'Role'}
                                                </label>
                                                <select
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                                                    className="w-full border border-border rounded-lg px-3 py-2"
                                                >
                                                    <option value="LEARNER">
                                                        {locale === 'ar' ? 'متعلم' : locale === 'de' ? 'Lernender' : 'Learner'}
                                                    </option>
                                                    <option value="CREATOR">
                                                        {locale === 'ar' ? 'مبدع' : locale === 'de' ? 'Ersteller' : 'Creator'}
                                                    </option>
                                                    <option value="ADMIN">
                                                        {locale === 'ar' ? 'مسؤول' : locale === 'de' ? 'Administrator' : 'Admin'}
                                                    </option>
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'الاسم' : locale === 'de' ? 'Name' : 'Name'}
                                                    </p>
                                                    <p className="font-medium">{user.name}</p>
                                                    {user.arabicName && <p className="text-sm text-muted-foreground">{user.arabicName}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'البريد الإلكتروني' : locale === 'de' ? 'E-Mail' : 'Email'}
                                                    </p>
                                                    <p className="font-medium">{user.email}</p>
                                                    {user.emailVerified ? (
                                                        <p className="text-sm text-green-600">
                                                            {locale === 'ar' ? 'مؤكد' : locale === 'de' ? 'Verifiziert' : 'Verified'}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-red-600">
                                                            {locale === 'ar' ? 'غير مؤكد' : locale === 'de' ? 'Nicht verifiziert' : 'Unverified'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-5 h-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {locale === 'ar' ? 'رقم الهاتف' : locale === 'de' ? 'Telefon' : 'Phone'}
                                                        </p>
                                                        <p className="font-medium">{user.phone}</p>
                                                        {user.phoneVerified ? (
                                                            <p className="text-sm text-green-600">
                                                                {locale === 'ar' ? 'مؤكد' : locale === 'de' ? 'Verifiziert' : 'Verified'}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-red-600">
                                                                {locale === 'ar' ? 'غير مؤكد' : locale === 'de' ? 'Nicht verifiziert' : 'Unverified'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-5 h-5 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'الدور' : locale === 'de' ? 'Rolle' : 'Role'}
                                                    </p>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${roleColors[user.role]}`}>
                                                        {user.role === 'LEARNER'
                                                            ? (locale === 'ar' ? 'متعلم' : locale === 'de' ? 'Lernender' : 'Learner')
                                                            : user.role === 'CREATOR'
                                                                ? (locale === 'ar' ? 'مبدع' : locale === 'de' ? 'Ersteller' : 'Creator')
                                                                : (locale === 'ar' ? 'مسؤول' : locale === 'de' ? 'Administrator' : 'Admin')
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {user.bio && !isEditing && (
                                    <div className="mt-4">
                                        <p className="text-sm text-muted-foreground mb-1">
                                            {locale === 'ar' ? 'السيرة الذاتية' : locale === 'de' ? 'Bio' : 'Bio'}
                                        </p>
                                        <p className="text-foreground">{user.bio}</p>
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            {locale === 'ar' ? 'السيرة الذاتية' : locale === 'de' ? 'Bio' : 'Bio'}
                                        </label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            rows={3}
                                            className="w-full border border-border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                )}

                                {isEditing && (
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-foreground rounded-lg hover:bg-green-700"
                                        >
                                            <Save className="w-4 h-4" />
                                            {locale === 'ar' ? 'حفظ التغييرات' : locale === 'de' ? 'Änderungen speichern' : 'Save Changes'}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-300 text-foreground rounded-lg hover:bg-gray-400"
                                        >
                                            {locale === 'ar' ? 'إلغاء' : locale === 'de' ? 'Abbrechen' : 'Cancel'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Account Status */}
                            <div className="bg-background rounded-lg p-4">
                                <h3 className="text-lg font-medium text-foreground mb-4">
                                    {locale === 'ar' ? 'حالة الحساب' : locale === 'de' ? 'Kontostatus' : 'Account Status'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {locale === 'ar' ? 'تاريخ الانضمام' : locale === 'de' ? 'Beigetreten' : 'Joined'}
                                            </p>
                                            <p className="font-medium">{formatDate(user.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <UserCheck className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {locale === 'ar' ? 'التسجيل' : locale === 'de' ? 'Onboarding' : 'Onboarding'}
                                            </p>
                                            <p className={`font-medium ${user.onboardingCompleted ? 'text-green-600' : 'text-red-600'}`}>
                                                {user.onboardingCompleted
                                                    ? (locale === 'ar' ? 'مكتمل' : locale === 'de' ? 'Abgeschlossen' : 'Complete')
                                                    : (locale === 'ar' ? 'غير مكتمل' : locale === 'de' ? 'Unvollständig' : 'Incomplete')
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            {!isEditing && (
                                <div className="bg-background rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-foreground mb-4">
                                        {locale === 'ar' ? 'إجراءات سريعة' : locale === 'de' ? 'Schnellaktionen' : 'Quick Actions'}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {!user.emailVerified && (
                                            <button
                                                onClick={() => handleUpdate('verifyEmail')}
                                                className="px-3 py-2 bg-green-600 text-foreground rounded-lg hover:bg-green-700 text-sm"
                                            >
                                                {locale === 'ar' ? 'تأكيد البريد الإلكتروني' : locale === 'de' ? 'E-Mail verifizieren' : 'Verify Email'}
                                            </button>
                                        )}
                                        {user.emailVerified && (
                                            <button
                                                onClick={() => handleUpdate('unverifyEmail')}
                                                className="px-3 py-2 bg-yellow-600 text-foreground rounded-lg hover:bg-yellow-700 text-sm"
                                            >
                                                {locale === 'ar' ? 'إلغاء تأكيد البريد الإلكتروني' : locale === 'de' ? 'E-Mail-Verifizierung aufheben' : 'Unverify Email'}
                                            </button>
                                        )}
                                        {!user.onboardingCompleted && (
                                            <button
                                                onClick={() => handleUpdate('completeOnboarding')}
                                                className="px-3 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 text-sm"
                                            >
                                                {locale === 'ar' ? 'إكمال التسجيل' : locale === 'de' ? 'Onboarding abschließen' : 'Complete Onboarding'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleUpdate('updateRole', { role: user.role === 'LEARNER' ? 'CREATOR' : 'LEARNER' })}
                                            className="px-3 py-2 bg-purple-600 text-foreground rounded-lg hover:bg-purple-700 text-sm"
                                        >
                                            {locale === 'ar' ? 'التبديل إلى' : locale === 'de' ? 'Wechseln zu' : 'Switch to'} {user.role === 'LEARNER'
                                                ? (locale === 'ar' ? 'مبدع' : locale === 'de' ? 'Ersteller' : 'Creator')
                                                : (locale === 'ar' ? 'متعلم' : locale === 'de' ? 'Lernender' : 'Learner')
                                            }
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Activity Summary */}
                            <div className="bg-background rounded-lg p-4">
                                <h3 className="text-lg font-medium text-foreground mb-4">
                                    {locale === 'ar' ? 'ملخص النشاط' : locale === 'de' ? 'Aktivitätsübersicht' : 'Activity Summary'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {user.role === 'LEARNER' && (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">{user._count.enrollments}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'التسجيلات' : locale === 'de' ? 'Anmeldungen' : 'Enrollments'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Award className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">{user._count.subscriptions}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'الاشتراكات' : locale === 'de' ? 'Abonnements' : 'Subscriptions'}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {user.role === 'CREATOR' && user.creator && (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <BookOpen className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">{user.creator._count.courses}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'الدورات' : locale === 'de' ? 'Kurse' : 'Courses'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <UserCheck className="w-5 h-5 text-green-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">{user.creator.totalSubscribers}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'المشتركون' : locale === 'de' ? 'Abonnenten' : 'Subscribers'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Award className="w-5 h-5 text-yellow-600" />
                                                <div>
                                                    <p className="text-2xl font-bold text-foreground">${user.creator.totalEarnings}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {locale === 'ar' ? 'الأرباح' : locale === 'de' ? 'Einnahmen' : 'Earnings'}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Recent Enrollments */}
                            {user.role === 'LEARNER' && user.enrollments.length > 0 && (
                                <div className="bg-background rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-foreground mb-4">
                                        {locale === 'ar' ? 'التسجيلات الأخيرة' : locale === 'de' ? 'Aktuelle Anmeldungen' : 'Recent Enrollments'}
                                    </h3>
                                    <div className="space-y-3">
                                        {user.enrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {locale === 'ar' ? enrollment.course.titleAr || enrollment.course.title : enrollment.course.title}
                                                    </p>
                                                    {locale !== 'ar' && (
                                                        <p className="text-sm text-muted-foreground">{enrollment.course.titleAr}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {enrollment.progress}% {locale === 'ar' ? 'مكتمل' : locale === 'de' ? 'abgeschlossen' : 'complete'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{formatDate(enrollment.createdAt)}</p>
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
