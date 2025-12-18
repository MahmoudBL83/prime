'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Award,
    GraduationCap,
    FileCheck,
    BadgeCheck,
    BookOpen,
    Trophy,
    FileText,
    Plus,
    Trash2,
    Edit2,
    Upload,
    X,
    ExternalLink,
    Calendar,
    Building,
    Loader2,
    Eye,
    EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import toast from 'react-hot-toast'

export interface Credential {
    id: string
    type: CredentialType
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
    isPublic: boolean
    sortOrder: number
}

export type CredentialType = 
    | 'DEGREE'
    | 'DIPLOMA'
    | 'CERTIFICATE'
    | 'LICENSE'
    | 'COURSE'
    | 'AWARD'
    | 'PUBLICATION'
    | 'OTHER'

const credentialTypeInfo: Record<CredentialType, { icon: React.ElementType; label: string; labelAr: string; color: string }> = {
    DEGREE: { icon: GraduationCap, label: 'Degree', labelAr: 'شهادة جامعية', color: 'from-blue-500 to-indigo-600' },
    DIPLOMA: { icon: FileCheck, label: 'Diploma', labelAr: 'دبلوم', color: 'from-purple-500 to-violet-600' },
    CERTIFICATE: { icon: Award, label: 'Certificate', labelAr: 'شهادة', color: 'from-amber-500 to-orange-600' },
    LICENSE: { icon: BadgeCheck, label: 'License', labelAr: 'رخصة', color: 'from-emerald-500 to-green-600' },
    COURSE: { icon: BookOpen, label: 'Course', labelAr: 'دورة', color: 'from-cyan-500 to-teal-600' },
    AWARD: { icon: Trophy, label: 'Award', labelAr: 'جائزة', color: 'from-yellow-500 to-amber-600' },
    PUBLICATION: { icon: FileText, label: 'Publication', labelAr: 'منشور', color: 'from-rose-500 to-pink-600' },
    OTHER: { icon: FileText, label: 'Other', labelAr: 'أخرى', color: 'from-gray-500 to-slate-600' },
}

interface CredentialsSectionProps {
    creatorId?: string // Optional - if not provided, uses logged-in creator's credentials API
    credentials: Credential[]
    onCredentialsChange: (credentials: Credential[]) => void
    isArabic?: boolean
    isEditing?: boolean
}

export function CredentialsSection({
    creatorId,
    credentials,
    onCredentialsChange,
    isArabic = false,
    isEditing = true
}: CredentialsSectionProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingCredential, setEditingCredential] = useState<Credential | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Determine API endpoint based on whether creatorId is provided
    const getApiEndpoint = (method: 'GET' | 'POST' | 'PUT' | 'DELETE', credentialId?: string) => {
        if (creatorId) {
            // Admin editing a specific creator
            if (method === 'DELETE' && credentialId) {
                return `/api/creators/${creatorId}/credentials?credentialId=${credentialId}`
            }
            return `/api/creators/${creatorId}/credentials`
        } else {
            // Creator editing their own credentials
            if (method === 'DELETE' && credentialId) {
                return `/api/creator/credentials?id=${credentialId}`
            }
            return '/api/creator/credentials'
        }
    }

    const handleAddCredential = async (credential: Partial<Credential>) => {
        setIsSubmitting(true)
        try {
            const response = await fetch(getApiEndpoint('POST'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credential)
            })

            if (response.ok) {
                const data = await response.json()
                const newCredential = data.credential
                onCredentialsChange([...credentials, newCredential])
                setIsAddModalOpen(false)
                toast.success(isArabic ? 'تمت إضافة الشهادة بنجاح' : 'Credential added successfully')
            } else {
                const data = await response.json()
                toast.error(data.error || (isArabic ? 'فشل في إضافة الشهادة' : 'Failed to add credential'))
            }
        } catch (error) {
            console.error('Add credential error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateCredential = async (credential: Credential) => {
        setIsSubmitting(true)
        try {
            const { id, ...credentialData } = credential
            const response = await fetch(getApiEndpoint('PUT'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credentialId: id, ...credentialData })
            })

            if (response.ok) {
                const data = await response.json()
                const updated = data.credential
                onCredentialsChange(credentials.map(c => c.id === updated.id ? updated : c))
                setEditingCredential(null)
                toast.success(isArabic ? 'تم تحديث الشهادة بنجاح' : 'Credential updated successfully')
            } else {
                const data = await response.json()
                toast.error(data.error || (isArabic ? 'فشل في التحديث' : 'Failed to update'))
            }
        } catch (error) {
            console.error('Update credential error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteCredential = async (credentialId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this credential?')) {
            return
        }

        try {
            const response = await fetch(getApiEndpoint('DELETE', credentialId), {
                method: 'DELETE'
            })

            if (response.ok) {
                onCredentialsChange(credentials.filter(c => c.id !== credentialId))
                toast.success(isArabic ? 'تم الحذف بنجاح' : 'Credential deleted')
            } else {
                toast.error(isArabic ? 'فشل في الحذف' : 'Failed to delete')
            }
        } catch (error) {
            console.error('Delete credential error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-500" />
                        {isArabic ? 'المؤهلات والشهادات' : 'Qualifications & Certificates'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isArabic 
                            ? 'أضف شهاداتك ومؤهلاتك لإظهار خبراتك'
                            : 'Add your credentials to showcase your expertise'}
                    </p>
                </div>
                {isEditing && (
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {isArabic ? 'إضافة شهادة' : 'Add Credential'}
                    </Button>
                )}
            </div>

            {/* Credentials List */}
            {credentials.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                    <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        {isArabic ? 'لم تتم إضافة أي شهادات بعد' : 'No credentials added yet'}
                    </p>
                    {isEditing && (
                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            variant="outline"
                            className="mt-4"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {isArabic ? 'أضف أول شهادة' : 'Add your first credential'}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {credentials.map((credential) => (
                        <CredentialCard
                            key={credential.id}
                            credential={credential}
                            isArabic={isArabic}
                            isEditing={isEditing}
                            onEdit={() => setEditingCredential(credential)}
                            onDelete={() => handleDeleteCredential(credential.id)}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {(isAddModalOpen || editingCredential) && (
                    <CredentialModal
                        isOpen={isAddModalOpen || !!editingCredential}
                        onClose={() => {
                            setIsAddModalOpen(false)
                            setEditingCredential(null)
                        }}
                        onSave={editingCredential ? handleUpdateCredential : handleAddCredential}
                        credential={editingCredential}
                        isArabic={isArabic}
                        isSubmitting={isSubmitting}
                        creatorId={creatorId}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

// Credential Card Component
function CredentialCard({
    credential,
    isArabic,
    isEditing,
    onEdit,
    onDelete
}: {
    credential: Credential
    isArabic: boolean
    isEditing: boolean
    onEdit: () => void
    onDelete: () => void
}) {
    const typeInfo = credentialTypeInfo[credential.type]
    const Icon = typeInfo.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-card rounded-2xl border border-border p-4 hover:border-purple-500/50 transition-all group"
        >
            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h4 className="font-semibold text-foreground">
                                {isArabic && credential.titleAr ? credential.titleAr : credential.title}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Building className="w-3.5 h-3.5" />
                                {isArabic && credential.institutionAr ? credential.institutionAr : credential.institution}
                            </p>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2">
                            {credential.isVerified && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
                                    <BadgeCheck className="w-3 h-3" />
                                    {isArabic ? 'موثق' : 'Verified'}
                                </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                                {isArabic ? typeInfo.labelAr : typeInfo.label}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {(credential.description || credential.descriptionAr) && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {isArabic && credential.descriptionAr ? credential.descriptionAr : credential.description}
                        </p>
                    )}

                    {/* Date and Links */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        {credential.issueDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(credential.issueDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                    year: 'numeric',
                                    month: 'short'
                                })}
                                {credential.expiryDate && (
                                    <> - {new Date(credential.expiryDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                        year: 'numeric',
                                        month: 'short'
                                    })}</>
                                )}
                            </span>
                        )}
                        {credential.credentialUrl && (
                            <a
                                href={credential.credentialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {isArabic ? 'تحقق' : 'Verify'}
                            </a>
                        )}
                        {!credential.isPublic && (
                            <span className="flex items-center gap-1 text-yellow-500">
                                <EyeOff className="w-3.5 h-3.5" />
                                {isArabic ? 'خاص' : 'Private'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Document Preview */}
                {credential.documentUrl && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0">
                        <Image
                            src={credential.documentUrl}
                            alt="Certificate"
                            fill
                            className="object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Edit/Delete Actions */}
            {isEditing && (
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </motion.div>
    )
}

// Credential Modal Component
function CredentialModal({
    isOpen,
    onClose,
    onSave,
    credential,
    isArabic,
    isSubmitting,
    creatorId
}: {
    isOpen: boolean
    onClose: () => void
    onSave: (credential: any) => void
    credential: Credential | null
    isArabic: boolean
    isSubmitting: boolean
    creatorId?: string
}) {
    const [formData, setFormData] = useState({
        type: credential?.type || 'CERTIFICATE',
        title: credential?.title || '',
        titleAr: credential?.titleAr || '',
        institution: credential?.institution || '',
        institutionAr: credential?.institutionAr || '',
        description: credential?.description || '',
        descriptionAr: credential?.descriptionAr || '',
        issueDate: credential?.issueDate ? new Date(credential.issueDate).toISOString().split('T')[0] : '',
        expiryDate: credential?.expiryDate ? new Date(credential.expiryDate).toISOString().split('T')[0] : '',
        credentialId: credential?.credentialId || '',
        credentialUrl: credential?.credentialUrl || '',
        documentUrl: credential?.documentUrl || '',
        isPublic: credential?.isPublic ?? true
    })

    const [documentPreview, setDocumentPreview] = useState(credential?.documentUrl || '')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const uploadData = new FormData()
            uploadData.append('file', file)
            uploadData.append('type', 'credential')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            })

            if (response.ok) {
                const { url } = await response.json()
                setFormData(prev => ({ ...prev, documentUrl: url }))
                setDocumentPreview(url)
                toast.success(isArabic ? 'تم رفع الملف بنجاح' : 'Document uploaded')
            } else {
                toast.error(isArabic ? 'فشل رفع الملف' : 'Upload failed')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = () => {
        if (!formData.title || !formData.institution || !formData.type) {
            toast.error(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields')
            return
        }

        if (credential) {
            onSave({ ...credential, ...formData })
        } else {
            onSave(formData)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-3xl shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-500" />
                        {credential
                            ? (isArabic ? 'تعديل الشهادة' : 'Edit Credential')
                            : (isArabic ? 'إضافة شهادة جديدة' : 'Add New Credential')}
                    </h3>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {isArabic ? 'نوع الشهادة *' : 'Credential Type *'}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {(Object.keys(credentialTypeInfo) as CredentialType[]).map((type) => {
                                const info = credentialTypeInfo[type]
                                const Icon = info.icon
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                                        className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5 ${
                                            formData.type === type
                                                ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                                                : 'border-border hover:border-purple-500/50 text-muted-foreground'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">
                                            {isArabic ? info.labelAr : info.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'العنوان (إنجليزي) *' : 'Title (English) *'}
                            </label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder={isArabic ? 'مثال: بكالوريوس علوم الحاسب' : 'e.g., Bachelor of Computer Science'}
                                className="bg-card border-border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
                            </label>
                            <Input
                                value={formData.titleAr}
                                onChange={(e) => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                                placeholder="مثال: بكالوريوس علوم الحاسب"
                                dir="rtl"
                                className="bg-card border-border"
                            />
                        </div>
                    </div>

                    {/* Institution */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'المؤسسة (إنجليزي) *' : 'Institution (English) *'}
                            </label>
                            <Input
                                value={formData.institution}
                                onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                                placeholder={isArabic ? 'مثال: جامعة القاهرة' : 'e.g., Cairo University'}
                                className="bg-card border-border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'المؤسسة (عربي)' : 'Institution (Arabic)'}
                            </label>
                            <Input
                                value={formData.institutionAr}
                                onChange={(e) => setFormData(prev => ({ ...prev, institutionAr: e.target.value }))}
                                placeholder="مثال: جامعة القاهرة"
                                dir="rtl"
                                className="bg-card border-border"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {isArabic ? 'الوصف' : 'Description'}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder={isArabic ? 'وصف مختصر للشهادة...' : 'Brief description of the credential...'}
                            rows={3}
                            className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground resize-none"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'تاريخ الإصدار' : 'Issue Date'}
                            </label>
                            <Input
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                                className="bg-card border-border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'تاريخ الانتهاء' : 'Expiry Date'}
                            </label>
                            <Input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                                className="bg-card border-border"
                            />
                        </div>
                    </div>

                    {/* Credential ID & URL */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'رقم الشهادة' : 'Credential ID'}
                            </label>
                            <Input
                                value={formData.credentialId}
                                onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
                                placeholder={isArabic ? 'مثال: CERT-12345' : 'e.g., CERT-12345'}
                                className="bg-card border-border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                {isArabic ? 'رابط التحقق' : 'Verification URL'}
                            </label>
                            <Input
                                type="url"
                                value={formData.credentialUrl}
                                onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))}
                                placeholder="https://..."
                                className="bg-card border-border"
                            />
                        </div>
                    </div>

                    {/* Document Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {isArabic ? 'صورة الشهادة' : 'Certificate Document'}
                        </label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative h-32 bg-card rounded-2xl border-2 border-dashed border-border hover:border-purple-500/50 transition-colors cursor-pointer flex items-center justify-center overflow-hidden"
                        >
                            {isUploading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                                </div>
                            ) : documentPreview ? (
                                <Image
                                    src={documentPreview}
                                    alt="Document"
                                    fill
                                    className="object-contain p-2"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="w-8 h-8" />
                                    <span className="text-sm">
                                        {isArabic ? 'اضغط لرفع الشهادة' : 'Click to upload certificate'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleDocumentUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Public Toggle */}
                    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                            {formData.isPublic ? (
                                <Eye className="w-5 h-5 text-green-500" />
                            ) : (
                                <EyeOff className="w-5 h-5 text-yellow-500" />
                            )}
                            <div>
                                <p className="font-medium text-foreground">
                                    {isArabic ? 'إظهار على الملف الشخصي' : 'Show on Profile'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isArabic 
                                        ? 'اجعل هذه الشهادة مرئية للجميع'
                                        : 'Make this credential visible to everyone'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                                formData.isPublic ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                    formData.isPublic ? 'left-7' : 'left-1'
                                }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-background/95 backdrop-blur-xl border-t border-border p-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        {isArabic ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.title || !formData.institution}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                            </>
                        ) : (
                            <>
                                {credential ? (isArabic ? 'تحديث' : 'Update') : (isArabic ? 'إضافة' : 'Add')}
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}

// Display-only component for mentor profile pages
export function CredentialsDisplay({
    credentials,
    isArabic = false
}: {
    credentials: Credential[]
    isArabic?: boolean
}) {
    if (credentials.length === 0) return null

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                {isArabic ? 'المؤهلات والشهادات' : 'Qualifications & Certificates'}
            </h3>
            <div className="grid gap-3">
                {credentials.filter(c => c.isPublic).map((credential) => (
                    <CredentialCard
                        key={credential.id}
                        credential={credential}
                        isArabic={isArabic}
                        isEditing={false}
                        onEdit={() => {}}
                        onDelete={() => {}}
                    />
                ))}
            </div>
        </div>
    )
}
