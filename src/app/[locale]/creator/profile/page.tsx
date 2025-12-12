'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Home,
    User,
    Mail,
    Globe,
    Clock,
    Languages,
    Award,
    Link as LinkIcon,
    Camera,
    Loader2,
    Save,
    Eye,
    CheckCircle,
    ExternalLink,
    BookOpen,
    Users,
    DollarSign,
    Star,
    Edit2,
    Youtube,
    Twitter,
    Linkedin,
    Instagram
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { CreatorSidebar, CreatorHeader } from '@/components/creator'

interface CreatorProfile {
    id: string
    user: {
        id: string
        name: string
        email: string
        profileImage: string | null
        arabicName: string | null
    }
    expertise: string | null
    languages: string | null
    timezone: string | null
    kycStatus: string
    contractSigned: boolean
    totalEarnings: number
    totalSubscribers: number
    availableForMeetings: boolean
    hourlyRate: number | null
    socialLinks: {
        youtube?: string
        twitter?: string
        linkedin?: string
        instagram?: string
        website?: string
    } | null
    certifications: Array<{
        name: string
        issuer: string
        year: string
    }> | null
    courseCount: number
    createdAt: string
}

export default function CreatorProfilePage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [profile, setProfile] = useState<CreatorProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Editable form fields
    const [expertise, setExpertise] = useState('')
    const [languages, setLanguages] = useState('')
    const [timezone, setTimezone] = useState('')
    const [hourlyRate, setHourlyRate] = useState<number | null>(null)
    const [availableForMeetings, setAvailableForMeetings] = useState(true)
    const [socialLinks, setSocialLinks] = useState({
        youtube: '',
        twitter: '',
        linkedin: '',
        instagram: '',
        website: ''
    })

    useEffect(() => {
        if (session?.user) {
            fetchProfile()
        }
    }, [session])

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/creator/profile')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.creator) {
                    setProfile(data.creator)
                    // Initialize form fields
                    setExpertise(data.creator.expertise || '')
                    setLanguages(data.creator.languages || '')
                    setTimezone(data.creator.timezone || '')
                    setHourlyRate(data.creator.hourlyRate)
                    setAvailableForMeetings(data.creator.availableForMeetings)
                    setSocialLinks({
                        youtube: data.creator.socialLinks?.youtube || '',
                        twitter: data.creator.socialLinks?.twitter || '',
                        linkedin: data.creator.socialLinks?.linkedin || '',
                        instagram: data.creator.socialLinks?.instagram || '',
                        website: data.creator.socialLinks?.website || ''
                    })
                }
            } else {
                toast.error(isArabic ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile')
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/creator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expertise,
                    languages,
                    timezone,
                    hourlyRate,
                    availableForMeetings,
                    socialLinks
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حفظ التغييرات' : 'Changes saved')
                setIsEditing(false)
                fetchProfile()
            } else {
                toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save')
            }
        } catch (error) {
            console.error('Failed to save profile:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            toast.error(isArabic ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image must be less than 5MB')
            return
        }

        setUploadingImage(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'profile')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                // Update user profile image
                await fetch('/api/user/profile', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileImage: data.url })
                })
                toast.success(isArabic ? 'تم تحديث الصورة' : 'Image updated')
                fetchProfile()
            } else {
                toast.error(isArabic ? 'فشل رفع الصورة' : 'Failed to upload image')
            }
        } catch (error) {
            console.error('Failed to upload image:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setUploadingImage(false)
        }
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-background">
                <CreatorHeader title="My Profile" titleAr="ملفي الشخصي" />
                <div className="flex">
                    <CreatorSidebar />
                    <main className="flex-1 p-8 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </main>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <CreatorHeader title="My Profile" titleAr="ملفي الشخصي" />
                <div className="flex">
                    <CreatorSidebar />
                    <main className="flex-1 p-8 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </main>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background">
                <CreatorHeader title="My Profile" titleAr="ملفي الشخصي" />
                <div className="flex">
                    <CreatorSidebar />
                    <main className="flex-1 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-xl font-bold mb-2">
                                {isArabic ? 'لم يتم العثور على ملف المنشئ' : 'Creator profile not found'}
                            </h2>
                            <Button onClick={() => router.push(`/${locale}/creator/onboarding`)}>
                                {isArabic ? 'إكمال التسجيل' : 'Complete Onboarding'}
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Custom Header with Edit/Save functionality */}
            <header className="sticky top-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <h1 className="text-xl font-bold">
                            {isArabic ? 'ملفي الشخصي' : 'My Profile'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/${locale}/mentors/${profile.id}`}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            {isArabic ? 'معاينة الصفحة العامة' : 'View Public Profile'}
                            <ExternalLink className="w-3 h-3" />
                        </Link>
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                variant="outline"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                {isArabic ? 'تعديل' : 'Edit'}
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setIsEditing(false)}
                                    variant="outline"
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {isArabic ? 'حفظ' : 'Save'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex">
                <CreatorSidebar />
                
                <main className="flex-1 p-6 max-w-5xl space-y-6">
                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400" />
                    
                    <div className="px-8 pb-8">
                        {/* Avatar */}
                        <div className="relative -mt-16 mb-4">
                            <div className="relative w-32 h-32 rounded-full border-4 border-card bg-card overflow-hidden">
                                {profile.user.profileImage ? (
                                    <Image
                                        src={profile.user.profileImage}
                                        alt={profile.user.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white">
                                            {profile.user.name?.[0]?.toUpperCase() || 'C'}
                                        </span>
                                    </div>
                                )}
                                {isEditing && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                        {uploadingImage ? (
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        ) : (
                                            <Camera className="w-6 h-6 text-white" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Name & Status */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {isArabic && profile.user.arabicName ? profile.user.arabicName : profile.user.name}
                                </h2>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4" />
                                    {profile.user.email}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className={profile.kycStatus === 'VERIFIED' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                                    {profile.kycStatus === 'VERIFIED' ? (
                                        <>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            {isArabic ? 'موثق' : 'Verified'}
                                        </>
                                    ) : (
                                        isArabic ? 'قيد المراجعة' : 'Pending Verification'
                                    )}
                                </Badge>
                                {profile.contractSigned && (
                                    <Badge className="bg-blue-500/10 text-blue-500">
                                        {isArabic ? 'العقد موقع' : 'Contract Signed'}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-accent/50 rounded-xl p-4 text-center">
                                <BookOpen className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                                <div className="text-2xl font-bold">{profile.courseCount}</div>
                                <div className="text-sm text-muted-foreground">
                                    {isArabic ? 'الدورات' : 'Courses'}
                                </div>
                            </div>
                            <div className="bg-accent/50 rounded-xl p-4 text-center">
                                <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                                <div className="text-2xl font-bold">{profile.totalSubscribers}</div>
                                <div className="text-sm text-muted-foreground">
                                    {isArabic ? 'المشتركين' : 'Subscribers'}
                                </div>
                            </div>
                            <div className="bg-accent/50 rounded-xl p-4 text-center">
                                <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
                                <div className="text-2xl font-bold">{profile.totalEarnings.toFixed(0)}</div>
                                <div className="text-sm text-muted-foreground">
                                    {isArabic ? 'الأرباح (ج.م)' : 'Earnings (EGP)'}
                                </div>
                            </div>
                            <div className="bg-accent/50 rounded-xl p-4 text-center">
                                <Star className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                                <div className="text-2xl font-bold">
                                    {new Date(profile.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', year: 'numeric' })}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {isArabic ? 'عضو منذ' : 'Member Since'}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Profile Details */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* About Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-xl p-6"
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-500" />
                            {isArabic ? 'معلومات أساسية' : 'Basic Information'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    <Award className="w-4 h-4 inline mr-1" />
                                    {isArabic ? 'الخبرة' : 'Expertise'}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={expertise}
                                        onChange={(e) => setExpertise(e.target.value)}
                                        placeholder={isArabic ? 'مثال: تطوير الويب، التصميم...' : 'e.g., Web Development, Design...'}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : (
                                    <p className="text-foreground">{expertise || (isArabic ? 'غير محدد' : 'Not specified')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    <Languages className="w-4 h-4 inline mr-1" />
                                    {isArabic ? 'اللغات' : 'Languages'}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={languages}
                                        onChange={(e) => setLanguages(e.target.value)}
                                        placeholder={isArabic ? 'مثال: العربية، الإنجليزية' : 'e.g., Arabic, English'}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : (
                                    <p className="text-foreground">{languages || (isArabic ? 'غير محدد' : 'Not specified')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    <Clock className="w-4 h-4 inline mr-1" />
                                    {isArabic ? 'المنطقة الزمنية' : 'Timezone'}
                                </label>
                                {isEditing ? (
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">{isArabic ? 'اختر المنطقة الزمنية' : 'Select timezone'}</option>
                                        <option value="Africa/Cairo">Cairo (GMT+2)</option>
                                        <option value="Asia/Dubai">Dubai (GMT+4)</option>
                                        <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                                        <option value="Europe/London">London (GMT)</option>
                                        <option value="America/New_York">New York (GMT-5)</option>
                                    </select>
                                ) : (
                                    <p className="text-foreground">{timezone || (isArabic ? 'غير محدد' : 'Not specified')}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    {isArabic ? 'السعر بالساعة' : 'Hourly Rate'}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={hourlyRate || ''}
                                        onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : null)}
                                        placeholder={isArabic ? 'السعر بالجنيه' : 'Price in EGP'}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : (
                                    <p className="text-foreground">
                                        {hourlyRate ? `${hourlyRate} ${isArabic ? 'ج.م/ساعة' : 'EGP/hour'}` : (isArabic ? 'غير محدد' : 'Not specified')}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground">
                                    {isArabic ? 'متاح للاجتماعات' : 'Available for Meetings'}
                                </label>
                                {isEditing ? (
                                    <button
                                        onClick={() => setAvailableForMeetings(!availableForMeetings)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            availableForMeetings ? 'bg-green-500' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                                availableForMeetings ? 'translate-x-6' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                ) : (
                                    <Badge className={availableForMeetings ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                                        {availableForMeetings ? (isArabic ? 'متاح' : 'Available') : (isArabic ? 'غير متاح' : 'Unavailable')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Social Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border rounded-xl p-6"
                    >
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-purple-500" />
                            {isArabic ? 'روابط التواصل الاجتماعي' : 'Social Links'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                    <Youtube className="w-4 h-4 text-red-500" />
                                    YouTube
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={socialLinks.youtube}
                                        onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                                        placeholder="https://youtube.com/@channel"
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : socialLinks.youtube ? (
                                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                                        {socialLinks.youtube}
                                    </a>
                                ) : (
                                    <p className="text-muted-foreground">{isArabic ? 'غير محدد' : 'Not specified'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                    <Twitter className="w-4 h-4 text-blue-400" />
                                    Twitter / X
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={socialLinks.twitter}
                                        onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                        placeholder="https://twitter.com/username"
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : socialLinks.twitter ? (
                                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                                        {socialLinks.twitter}
                                    </a>
                                ) : (
                                    <p className="text-muted-foreground">{isArabic ? 'غير محدد' : 'Not specified'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                    <Linkedin className="w-4 h-4 text-blue-600" />
                                    LinkedIn
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={socialLinks.linkedin}
                                        onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                        placeholder="https://linkedin.com/in/username"
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : socialLinks.linkedin ? (
                                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                                        {socialLinks.linkedin}
                                    </a>
                                ) : (
                                    <p className="text-muted-foreground">{isArabic ? 'غير محدد' : 'Not specified'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                    <Instagram className="w-4 h-4 text-pink-500" />
                                    Instagram
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={socialLinks.instagram}
                                        onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                        placeholder="https://instagram.com/username"
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : socialLinks.instagram ? (
                                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                                        {socialLinks.instagram}
                                    </a>
                                ) : (
                                    <p className="text-muted-foreground">{isArabic ? 'غير محدد' : 'Not specified'}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-500" />
                                    {isArabic ? 'الموقع الإلكتروني' : 'Website'}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        value={socialLinks.website}
                                        onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                        placeholder="https://yourwebsite.com"
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                ) : socialLinks.website ? (
                                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">
                                        {socialLinks.website}
                                    </a>
                                ) : (
                                    <p className="text-muted-foreground">{isArabic ? 'غير محدد' : 'Not specified'}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border border-border rounded-xl p-6"
                >
                    <h3 className="text-lg font-bold mb-4">
                        {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link
                            href={`/${locale}/creator/dashboard`}
                            className="flex flex-col items-center gap-2 p-4 bg-accent/50 hover:bg-accent rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-purple-500" />
                            </div>
                            <span className="text-sm font-medium">
                                {isArabic ? 'لوحة التحكم' : 'Dashboard'}
                            </span>
                        </Link>
                        <Link
                            href={`/${locale}/creator/courses`}
                            className="flex flex-col items-center gap-2 p-4 bg-accent/50 hover:bg-accent rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-sm font-medium">
                                {isArabic ? 'دوراتي' : 'My Courses'}
                            </span>
                        </Link>
                        <Link
                            href={`/${locale}/creator/earnings`}
                            className="flex flex-col items-center gap-2 p-4 bg-accent/50 hover:bg-accent rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="text-sm font-medium">
                                {isArabic ? 'الأرباح' : 'Earnings'}
                            </span>
                        </Link>
                        <Link
                            href={`/${locale}/creator/settings`}
                            className="flex flex-col items-center gap-2 p-4 bg-accent/50 hover:bg-accent rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Award className="w-5 h-5 text-orange-500" />
                            </div>
                            <span className="text-sm font-medium">
                                {isArabic ? 'الإعدادات' : 'Settings'}
                            </span>
                        </Link>
                    </div>
                </motion.div>
            </main>
            </div>
        </div>
    )
}