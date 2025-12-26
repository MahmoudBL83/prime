'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Upload, Link as LinkIcon, Save, Loader2, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { CredentialsSection, Credential } from '@/components/credentials/CredentialsSection'

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    currentProfile: {
        id?: string // Creator ID
        name: string
        bio?: string
        expertise?: string
        profileImage?: string | null
        coverImage?: string | null
        socialLinks?: any
        monthlyPrice?: number // Single tier in EUR
        credentials?: Credential[]
    }
    isArabic?: boolean
}

export default function EditProfileModal({ isOpen, onClose, currentProfile, isArabic = false }: EditProfileModalProps) {
    const [formData, setFormData] = useState({
        name: currentProfile.name || '',
        bio: currentProfile.bio || '',
        expertise: currentProfile.expertise || '',
        monthlyPrice: currentProfile.monthlyPrice || 0, // No fake fallbacks
        socialLinks: currentProfile.socialLinks || {
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: '',
            website: ''
        }
    })

    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [profileImagePreview, setProfileImagePreview] = useState(currentProfile.profileImage || '')
    const [coverImage, setCoverImage] = useState<File | null>(null)
    const [coverImagePreview, setCoverImagePreview] = useState(currentProfile.coverImage || '')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'social' | 'credentials'>('basic')
    const [credentials, setCredentials] = useState<Credential[]>(currentProfile.credentials || [])

    const profileImageRef = useRef<HTMLInputElement>(null)
    const coverImageRef = useRef<HTMLInputElement>(null)

    // Update previews when currentProfile changes (e.g., modal reopens with new data)
    useEffect(() => {
        console.log('🖼️ EditProfileModal - Updating images:', {
            profileImage: currentProfile.profileImage,
            coverImage: currentProfile.coverImage
        })
        setProfileImagePreview(currentProfile.profileImage || '')
        setCoverImagePreview(currentProfile.coverImage || '')
        setCredentials(currentProfile.credentials || [])
        setFormData({
            name: currentProfile.name || '',
            bio: currentProfile.bio || '',
            expertise: currentProfile.expertise || '',
            monthlyPrice: currentProfile.monthlyPrice || 0, // No fake fallbacks
            socialLinks: currentProfile.socialLinks || {
                twitter: '',
                instagram: '',
                linkedin: '',
                youtube: '',
                website: ''
            }
        })
    }, [currentProfile])

    const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setProfileImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setProfileImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setCoverImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setCoverImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Upload images first if they exist
            let uploadedProfileImage = profileImagePreview
            let uploadedCoverImage = coverImagePreview

            if (profileImage) {
                const formData = new FormData()
                formData.append('file', profileImage)
                formData.append('type', 'profile')

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (uploadRes.ok) {
                    const { url } = await uploadRes.json()
                    uploadedProfileImage = url
                }
            }

            if (coverImage) {
                const formData = new FormData()
                formData.append('file', coverImage)
                formData.append('type', 'cover')

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (uploadRes.ok) {
                    const { url } = await uploadRes.json()
                    uploadedCoverImage = url
                }
            }

            // Update profile
            const response = await fetch('/api/profile/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    profileImage: uploadedProfileImage,
                    coverImage: uploadedCoverImage
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profile updated successfully!')
                onClose()
                // Reload to show changes
                setTimeout(() => window.location.reload(), 1000)
            } else {
                const data = await response.json()
                toast.error(data.error || (isArabic ? 'فشل التحديث' : 'Update failed'))
            }
        } catch (error) {
            console.error('Profile update error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border p-6">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-2xl font-black text-foreground">
                                {isArabic ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                {isArabic ? 'قم بتحديث معلومات ملفك الشخصي' : 'Update your profile information'}
                            </p>

                            {/* Tabs */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setActiveTab('basic')}
                                    className={`px-4 py-2 rounded-full font-semibold transition-all ${activeTab === 'basic'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-card text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {isArabic ? 'الأساسي' : 'Basic Info'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('pricing')}
                                    className={`px-4 py-2 rounded-full font-semibold transition-all ${activeTab === 'pricing'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-card text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {isArabic ? 'الأسعار' : 'Pricing'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('social')}
                                    className={`px-4 py-2 rounded-full font-semibold transition-all ${activeTab === 'social'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-card text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {isArabic ? 'الروابط' : 'Social Links'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('credentials')}
                                    className={`px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-2 ${activeTab === 'credentials'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-card text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Award className="w-4 h-4" />
                                    {isArabic ? 'الشهادات' : 'Credentials'}
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Basic Info Tab */}
                            {activeTab === 'basic' && (
                                <div className="space-y-6">
                                    {/* Cover Image */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'صورة الغلاف' : 'Cover Image'}
                                        </label>
                                        <div
                                            onClick={() => coverImageRef.current?.click()}
                                            className="relative h-48 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-2xl overflow-hidden cursor-pointer group"
                                        >
                                            {coverImagePreview ? (
                                                <Image
                                                    src={coverImagePreview}
                                                    alt="Cover"
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Upload className="w-12 h-12 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <input
                                            ref={coverImageRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverImageChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Profile Image */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الصورة الشخصية' : 'Profile Picture'}
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div
                                                onClick={() => profileImageRef.current?.click()}
                                                className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group"
                                            >
                                                {profileImagePreview ? (
                                                    <Image
                                                        src={profileImagePreview}
                                                        alt="Profile"
                                                        fill
                                                        unoptimized
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                        <span className="text-3xl font-bold text-white">
                                                            {formData.name[0]?.toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Camera className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => profileImageRef.current?.click()}
                                                variant="outline"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                {isArabic ? 'تحميل صورة' : 'Upload Photo'}
                                            </Button>
                                        </div>
                                        <input
                                            ref={profileImageRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfileImageChange}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الاسم' : 'Name'}
                                        </label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    {/* Expertise */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'التخصص' : 'Expertise'}
                                        </label>
                                        <Input
                                            value={formData.expertise}
                                            onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                                            placeholder="Mathematics Teacher"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'النبذة التعريفية' : 'Bio'}
                                        </label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder={isArabic
                                                ? 'اكتب نبذة عنك...'
                                                : 'Tell subscribers about yourself...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formData.bio.length}/500 {isArabic ? 'حرف' : 'characters'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Pricing Tab */}
                            {activeTab === 'pricing' && (
                                <div className="space-y-6">
                                    <p className="text-muted-foreground text-sm">
                                        {isArabic
                                            ? 'حدد سعر الاشتراك الشهري'
                                            : 'Set your monthly subscription price'}
                                    </p>

                                    {/* Single All-Access Tier */}
                                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/50 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">
                                                    {isArabic ? 'الاشتراك الشامل' : 'All-Access Subscription'}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {isArabic ? 'كل المحتوى، الجلسات المباشرة، المراسلة وأولوية الدعم' : 'All content, live sessions, messaging & priority support'}
                                                </p>
                                            </div>
                                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">All-Access</Badge>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'السعر الشهري (€)' : 'Monthly Price (€)'}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                                <Input
                                                    type="number"
                                                    value={formData.monthlyPrice}
                                                    onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })}
                                                    min="1"
                                                    className="pl-8"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 text-xs text-muted-foreground space-y-1">
                                            <p>✓ {isArabic ? 'وصول كامل لكل المحتوى' : 'Full access to all content'}</p>
                                            <p>✓ {isArabic ? 'جلسات مباشرة أسبوعية' : 'Weekly live sessions'}</p>
                                            <p>✓ {isArabic ? 'مراسلات ذات أولوية' : 'Priority messaging'}</p>
                                            <p>✓ {isArabic ? 'حجوزات عبر التقويم' : 'Calendar bookings'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Social Links Tab */}
                            {activeTab === 'social' && (
                                <div className="space-y-4">
                                    <p className="text-muted-foreground text-sm">
                                        {isArabic
                                            ? 'أضف روابط حساباتك على وسائل التواصل الاجتماعي'
                                            : 'Add your social media links'}
                                    </p>

                                    {/* Twitter */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            Twitter / X
                                        </label>
                                        <Input
                                            value={formData.socialLinks.twitter}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                                            })}
                                            placeholder="https://twitter.com/username"
                                        />
                                    </div>

                                    {/* Instagram */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            Instagram
                                        </label>
                                        <Input
                                            value={formData.socialLinks.instagram}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                                            })}
                                            placeholder="https://instagram.com/username"
                                        />
                                    </div>

                                    {/* LinkedIn */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            LinkedIn
                                        </label>
                                        <Input
                                            value={formData.socialLinks.linkedin}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                                            })}
                                            placeholder="https://linkedin.com/in/username"
                                        />
                                    </div>

                                    {/* YouTube */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            YouTube
                                        </label>
                                        <Input
                                            value={formData.socialLinks.youtube}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                                            })}
                                            placeholder="https://youtube.com/@username"
                                        />
                                    </div>

                                    {/* Website */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                            <LinkIcon className="w-4 h-4" />
                                            {isArabic ? 'الموقع الإلكتروني' : 'Website'}
                                        </label>
                                        <Input
                                            value={formData.socialLinks.website}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                socialLinks: { ...formData.socialLinks, website: e.target.value }
                                            })}
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Credentials Tab */}
                            {activeTab === 'credentials' && currentProfile.id && (
                                <CredentialsSection
                                    creatorId={currentProfile.id}
                                    credentials={credentials}
                                    onCredentialsChange={setCredentials}
                                    isArabic={isArabic}
                                    isEditing={true}
                                />
                            )}

                            {activeTab === 'credentials' && !currentProfile.id && (
                                <div className="text-center py-12">
                                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">
                                        {isArabic
                                            ? 'يرجى حفظ الملف الشخصي أولاً لإدارة الشهادات'
                                            : 'Please save profile first to manage credentials'}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="mt-8 flex gap-3">
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={isSubmitting}
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
