'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Upload, User } from 'lucide-react'
import { useLocale } from 'next-intl'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

// Apple TV color palette
const colors = {
    background: '#000000',
    surface: 'rgba(255, 255, 255, 0.08)',
    surfaceHover: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.15)',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    blue: '#0A84FF',
    purple: '#BF5AF2',
    pink: '#FF375F',
    green: '#30D158',
    orange: '#FF9F0A',
    cyan: '#64D2FF',
}

const onboardingSchema = z.object({
    interests: z.array(z.string()).min(3, 'Select at least 3 interests'),
    goals: z.array(z.string()).min(1, 'Select at least 1 goal'),
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    availability: z.enum(['weekdays-morning', 'weekdays-evening', 'weekends', 'flexible']),
    studyBuddyOptIn: z.boolean(),
    age: z.string().min(1, 'Please select your age range'),
    avatar: z.string().min(1, 'Please upload your photo'),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

const INTERESTS = [
    { id: 'technology', name: 'Technology', nameAr: 'التكنولوجيا', color: colors.blue },
    { id: 'business', name: 'Business', nameAr: 'الأعمال', color: colors.green },
    { id: 'design', name: 'Design', nameAr: 'التصميم', color: colors.purple },
    { id: 'languages', name: 'Languages', nameAr: 'اللغات', color: colors.orange },
    { id: 'science', name: 'Science', nameAr: 'العلوم', color: colors.cyan },
    { id: 'arts', name: 'Arts', nameAr: 'الفنون', color: colors.pink },
]

const GOALS = [
    { id: 'career', name: 'Career Growth', nameAr: 'النمو الوظيفي', color: colors.blue },
    { id: 'skills', name: 'Build Skills', nameAr: 'بناء المهارات', color: colors.purple },
    { id: 'certificate', name: 'Get Certified', nameAr: 'الحصول على شهادة', color: colors.green },
    { id: 'explore', name: 'Explore & Learn', nameAr: 'استكشاف وتعلم', color: colors.orange },
]

const SKILL_LEVELS = [
    { value: 'beginner', label: 'Beginner', labelAr: 'مبتدئ', desc: 'Starting fresh', descAr: 'البداية' },
    { value: 'intermediate', label: 'Intermediate', labelAr: 'متوسط', desc: 'Some experience', descAr: 'خبرة متوسطة' },
    { value: 'advanced', label: 'Advanced', labelAr: 'متقدم', desc: 'Experienced', descAr: 'ذو خبرة' },
]

const AVAILABILITY = [
    { value: 'weekdays-morning', label: 'Weekday AM', labelAr: 'صباحًا' },
    { value: 'weekdays-evening', label: 'Weekday PM', labelAr: 'مساءً' },
    { value: 'weekends', label: 'Weekends', labelAr: 'عطلة نهاية الأسبوع' },
    { value: 'flexible', label: 'Flexible', labelAr: 'مرن' },
]

const AGE_RANGES = [
    { value: '13-17', label: '13-17' },
    { value: '18-24', label: '18-24' },
    { value: '25-34', label: '25-34' },
    { value: '35-44', label: '35-44' },
    { value: '45+', label: '45+' },
]

export default function OnboardingPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const locale = useLocale()
    const isArabic = locale === 'ar'

    const { handleSubmit, watch, setValue } = useForm<OnboardingForm>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            interests: [],
            goals: [],
            skillLevel: 'beginner',
            availability: 'flexible',
            studyBuddyOptIn: false,
            age: '',
            avatar: '',
        },
    })

    const values = watch()

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push(`/${locale}/auth/login`)
            return
        }

        const checkOnboarding = async () => {
            try {
                const response = await fetch('/api/user/profile')
                if (response.ok) {
                    const data = await response.json()
                    if (data.user.onboardingCompleted) {
                        router.push(`/${locale}/dashboard`)
                    }
                }
            } catch (error) {
                console.error('Error:', error)
            }
        }

        checkOnboarding()
    }, [session, status, router, locale])

    const toggleArrayValue = (field: 'interests' | 'goals', value: string) => {
        const current = values[field] || []
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value]
        setValue(field, updated)
    }

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error(isArabic ? 'يرجى اختيار صورة' : 'Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error(isArabic ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image size must be less than 5MB')
            return
        }

        setIsUploading(true)

        try {
            // Show preview immediately
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed')
            }

            setValue('avatar', data.url)
            toast.success(isArabic ? 'تم رفع الصورة بنجاح' : 'Photo uploaded successfully')
        } catch (error) {
            console.error('Upload error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo'
            toast.error(isArabic ? 'فشل رفع الصورة: ' + errorMessage : 'Failed to upload photo: ' + errorMessage)
            setPhotoPreview(null)
            setValue('avatar', '')
        } finally {
            setIsUploading(false)
        }
    }

    const onSubmit = async (data: OnboardingForm) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/user/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                setShowSuccess(true)
                setTimeout(() => router.push(`/${locale}/dashboard`), 2000)
            } else {
                const error = await response.json()
                toast.error(error.message || 'Failed to complete onboarding')
            }
        } catch (error) {
            toast.error('Network error')
        } finally {
            setIsLoading(false)
        }
    }

    const nextStep = () => {
        if (currentStep === 0 && (!values.age || !values.avatar)) {
            toast.error(isArabic ? 'اختر العمر وارفع صورتك' : 'Select age and upload photo')
            return
        }
        if (currentStep === 1 && values.interests.length < 3) {
            toast.error(isArabic ? 'اختر 3 اهتمامات على الأقل' : 'Select at least 3 interests')
            return
        }
        if (currentStep === 2 && values.goals.length === 0) {
            toast.error(isArabic ? 'اختر هدفًا واحدًا' : 'Select at least 1 goal')
            return
        }
        if (currentStep < 4) setCurrentStep(currentStep + 1)
    }

    if (status === 'loading') {
        return (
            <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 40, height: 40, border: `3px solid ${colors.surface}`, borderTopColor: colors.text, borderRadius: '50%' }}
                />
            </div>
        )
    }

    if (!session) return null

    if (showSuccess) {
        return (
            <div style={{ minHeight: '100vh', background: colors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    style={{ textAlign: 'center' }}
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        style={{
                            width: 80,
                            height: 80,
                            background: colors.green,
                            borderRadius: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}
                    >
                        <Check size={40} color={colors.background} strokeWidth={3} />
                    </motion.div>
                    <h2 style={{ fontSize: 48, fontWeight: 600, color: colors.text, marginBottom: 12 }}>
                        {isArabic ? 'مرحبًا بك!' : 'Welcome!'}
                    </h2>
                    <p style={{ fontSize: 20, color: colors.textSecondary }}>
                        {isArabic ? 'جاهز للبدء' : 'Ready to begin'}
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', background: colors.background, color: colors.text }}>
            <div style={{ position: 'sticky', top: 0, background: colors.background, borderBottom: `1px solid ${colors.border}`, zIndex: 10 }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 600 }}>Prime</h1>
                        <span style={{ fontSize: 15, color: colors.textSecondary, fontWeight: 500 }}>
                            {currentStep + 1} / 5
                        </span>
                    </div>
                    <div style={{ 
                        height: 4, 
                        background: colors.surface, 
                        borderRadius: 4, 
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / 5) * 100}%` }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            style={{ 
                                height: '100%', 
                                background: `linear-gradient(90deg, ${colors.blue} 0%, ${colors.cyan} 100%)`,
                                boxShadow: `0 0 12px ${colors.blue}40`,
                                borderRadius: 4,
                            }}
                        />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 32px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 0 && (
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                                        <h2 style={{ fontSize: 56, fontWeight: 600, marginBottom: 16 }}>
                                            {isArabic ? 'مرحبًا' : 'Welcome'}
                                        </h2>
                                        <p style={{ fontSize: 20, color: colors.textSecondary }}>
                                            {isArabic ? 'لنبدأ بإعداد ملفك الشخصي' : "Let's set up your profile"}
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: 60 }}>
                                        <label style={{ display: 'block', fontSize: 17, fontWeight: 500, marginBottom: 20, textAlign: 'center' }}>
                                            {isArabic ? 'صورتك الشخصية' : 'Your Photo'}
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                style={{ display: 'none' }}
                                            />
                                            
                                            <motion.div
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{
                                                    width: 160,
                                                    height: 160,
                                                    borderRadius: 80,
                                                    background: photoPreview ? 'transparent' : colors.surface,
                                                    border: `2px solid ${photoPreview ? colors.blue : colors.border}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    position: 'relative',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {isUploading ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                        style={{ width: 32, height: 32, border: `3px solid ${colors.surface}`, borderTopColor: colors.text, borderRadius: '50%' }}
                                                    />
                                                ) : photoPreview ? (
                                                    <>
                                                        <Image
                                                            src={photoPreview}
                                                            alt="Profile"
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                        <div style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            background: 'rgba(0,0,0,0.5)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                                        >
                                                            <Upload size={32} color={colors.text} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ textAlign: 'center' }}>
                                                        <User size={48} color={colors.textSecondary} strokeWidth={1.5} />
                                                        <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                                                            {isArabic ? 'ارفع صورتك' : 'Upload'}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>

                                            <p style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                                                {isArabic ? 'اختر صورة واضحة لملفك الشخصي' : 'Choose a clear photo for your profile'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 17, fontWeight: 500, marginBottom: 20, textAlign: 'center' }}>
                                            {isArabic ? 'العمر' : 'Age range'}
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, maxWidth: 700, margin: '0 auto' }}>
                                            {AGE_RANGES.map((age) => (
                                                <motion.button
                                                    key={age.value}
                                                    type="button"
                                                    onClick={() => setValue('age', age.value)}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    style={{
                                                        padding: '20px 16px',
                                                        fontSize: 17,
                                                        fontWeight: 500,
                                                        background: values.age === age.value ? colors.surface : 'transparent',
                                                        border: `2px solid ${values.age === age.value ? colors.blue : colors.border}`,
                                                        borderRadius: 12,
                                                        color: colors.text,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {age.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                                        <h2 style={{ fontSize: 56, fontWeight: 600, marginBottom: 16 }}>
                                            {isArabic ? 'اهتماماتك' : 'Your Interests'}
                                        </h2>
                                        <p style={{ fontSize: 20, color: colors.textSecondary }}>
                                            {isArabic ? 'أضف 3 على الأقل' : 'Add at least 3'}
                                        </p>
                                    </div>

                                    <div style={{ maxWidth: 700, margin: '0 auto', marginBottom: 32 }}>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <input
                                                type="text"
                                                placeholder={isArabic ? 'أضف اهتمامًا...' : 'Add an interest...'}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        const input = e.currentTarget
                                                        const value = input.value.trim()
                                                        if (value && !values.interests.includes(value)) {
                                                            setValue('interests', [...values.interests, value])
                                                            input.value = ''
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px 20px',
                                                    fontSize: 17,
                                                    background: colors.surface,
                                                    border: `2px solid ${colors.border}`,
                                                    borderRadius: 12,
                                                    color: colors.text,
                                                    outline: 'none',
                                                }}
                                            />
                                        </div>
                                        <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                                            {isArabic ? 'اضغط Enter للإضافة' : 'Press Enter to add'}
                                        </p>
                                    </div>

                                    {values.interests.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
                                            {values.interests.map((interest, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                    style={{
                                                        padding: '12px 20px',
                                                        background: colors.surface,
                                                        border: `2px solid ${colors.blue}`,
                                                        borderRadius: 24,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                    }}
                                                >
                                                    <span style={{ fontSize: 16, fontWeight: 500, color: colors.blue }}>
                                                        {interest}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue('interests', values.interests.filter((_, i) => i !== index))}
                                                        style={{
                                                            width: 20,
                                                            height: 20,
                                                            background: colors.blue,
                                                            border: 'none',
                                                            borderRadius: 10,
                                                            color: colors.background,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                        {INTERESTS.map((interest) => {
                                            const isSelected = values.interests.includes(isArabic ? interest.nameAr : interest.name)
                                            return (
                                                <motion.button
                                                    key={interest.id}
                                                    type="button"
                                                    onClick={() => toggleArrayValue('interests', isArabic ? interest.nameAr : interest.name)}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    style={{
                                                        padding: 32,
                                                        textAlign: 'center',
                                                        background: isSelected ? colors.surface : 'transparent',
                                                        border: `2px solid ${isSelected ? interest.color : colors.border}`,
                                                        borderRadius: 16,
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ fontSize: 20, fontWeight: 500, color: isSelected ? interest.color : colors.text }}>
                                                        {isArabic ? interest.nameAr : interest.name}
                                                    </div>
                                                    {isSelected && (
                                                        <motion.div
                                                            layoutId={`interest-${interest.id}`}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 12,
                                                                right: 12,
                                                                width: 24,
                                                                height: 24,
                                                                background: interest.color,
                                                                borderRadius: 12,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Check size={16} color={colors.background} strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                                        <h2 style={{ fontSize: 56, fontWeight: 600, marginBottom: 16 }}>
                                            {isArabic ? 'أهدافك' : 'Your Goals'}
                                        </h2>
                                        <p style={{ fontSize: 20, color: colors.textSecondary }}>
                                            {isArabic ? 'ما الذي تريد تحقيقه؟' : 'What do you want to achieve?'}
                                        </p>
                                    </div>

                                    <div style={{ maxWidth: 700, margin: '0 auto', marginBottom: 32 }}>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <input
                                                type="text"
                                                placeholder={isArabic ? 'أضف هدفًا...' : 'Add a goal...'}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        const input = e.currentTarget
                                                        const value = input.value.trim()
                                                        if (value && !values.goals.includes(value)) {
                                                            setValue('goals', [...values.goals, value])
                                                            input.value = ''
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '16px 20px',
                                                    fontSize: 17,
                                                    background: colors.surface,
                                                    border: `2px solid ${colors.border}`,
                                                    borderRadius: 12,
                                                    color: colors.text,
                                                    outline: 'none',
                                                }}
                                            />
                                        </div>
                                        <p style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
                                            {isArabic ? 'اضغط Enter للإضافة' : 'Press Enter to add'}
                                        </p>
                                    </div>

                                    {values.goals.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
                                            {values.goals.map((goal, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                    style={{
                                                        padding: '12px 20px',
                                                        background: colors.surface,
                                                        border: `2px solid ${colors.purple}`,
                                                        borderRadius: 24,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 12,
                                                    }}
                                                >
                                                    <span style={{ fontSize: 16, fontWeight: 500, color: colors.purple }}>
                                                        {goal}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setValue('goals', values.goals.filter((_, i) => i !== index))}
                                                        style={{
                                                            width: 20,
                                                            height: 20,
                                                            background: colors.purple,
                                                            border: 'none',
                                                            borderRadius: 10,
                                                            color: colors.background,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                                        {GOALS.map((goal) => {
                                            const isSelected = values.goals.includes(isArabic ? goal.nameAr : goal.name)
                                            return (
                                                <motion.button
                                                    key={goal.id}
                                                    type="button"
                                                    onClick={() => toggleArrayValue('goals', isArabic ? goal.nameAr : goal.name)}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    style={{
                                                        padding: 32,
                                                        textAlign: 'center',
                                                        background: isSelected ? colors.surface : 'transparent',
                                                        border: `2px solid ${isSelected ? goal.color : colors.border}`,
                                                        borderRadius: 16,
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ fontSize: 20, fontWeight: 500, color: isSelected ? goal.color : colors.text }}>
                                                        {isArabic ? goal.nameAr : goal.name}
                                                    </div>
                                                    {isSelected && (
                                                        <motion.div
                                                            layoutId={`goal-${goal.id}`}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 12,
                                                                right: 12,
                                                                width: 24,
                                                                height: 24,
                                                                background: goal.color,
                                                                borderRadius: 12,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <Check size={16} color={colors.background} strokeWidth={3} />
                                                        </motion.div>
                                                    )}
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                                        <h2 style={{ fontSize: 56, fontWeight: 600, marginBottom: 16 }}>
                                            {isArabic ? 'التفضيلات' : 'Preferences'}
                                        </h2>
                                        <p style={{ fontSize: 20, color: colors.textSecondary }}>
                                            {isArabic ? 'أخبرنا عن أسلوبك' : 'Tell us about your style'}
                                        </p>
                                    </div>

                                    <div style={{ marginBottom: 60 }}>
                                        <label style={{ display: 'block', fontSize: 17, fontWeight: 500, marginBottom: 20 }}>
                                            {isArabic ? 'مستوى الخبرة' : 'Experience Level'}
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                            {SKILL_LEVELS.map((level) => (
                                                <motion.button
                                                    key={level.value}
                                                    type="button"
                                                    onClick={() => setValue('skillLevel', level.value as any)}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    style={{
                                                        padding: 24,
                                                        textAlign: 'left',
                                                        background: values.skillLevel === level.value ? colors.surface : 'transparent',
                                                        border: `2px solid ${values.skillLevel === level.value ? colors.blue : colors.border}`,
                                                        borderRadius: 12,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>
                                                        {isArabic ? level.labelAr : level.label}
                                                    </div>
                                                    <div style={{ fontSize: 14, color: colors.textSecondary }}>
                                                        {isArabic ? level.descAr : level.desc}
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 17, fontWeight: 500, marginBottom: 20 }}>
                                            {isArabic ? 'الوقت المتاح' : 'Availability'}
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                                            {AVAILABILITY.map((avail) => (
                                                <motion.button
                                                    key={avail.value}
                                                    type="button"
                                                    onClick={() => setValue('availability', avail.value as any)}
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    style={{
                                                        padding: 20,
                                                        fontSize: 16,
                                                        fontWeight: 500,
                                                        background: values.availability === avail.value ? colors.surface : 'transparent',
                                                        border: `2px solid ${values.availability === avail.value ? colors.blue : colors.border}`,
                                                        borderRadius: 12,
                                                        color: colors.text,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {isArabic ? avail.labelAr : avail.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                                        <h2 style={{ fontSize: 56, fontWeight: 600, marginBottom: 16 }}>
                                            {isArabic ? 'التعلم معًا' : 'Learn Together'}
                                        </h2>
                                        <p style={{ fontSize: 20, color: colors.textSecondary }}>
                                            {isArabic ? 'تواصل مع متعلمين آخرين' : 'Connect with other learners'}
                                        </p>
                                    </div>

                                    <motion.button
                                        type="button"
                                        onClick={() => setValue('studyBuddyOptIn', !values.studyBuddyOptIn)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            width: '100%',
                                            maxWidth: 600,
                                            margin: '0 auto',
                                            padding: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            background: values.studyBuddyOptIn ? colors.surface : 'transparent',
                                            border: `2px solid ${values.studyBuddyOptIn ? colors.blue : colors.border}`,
                                            borderRadius: 16,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ textAlign: 'left', flex: 1 }}>
                                            <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
                                                {isArabic ? 'Study Buddies' : 'Study Buddies'}
                                            </div>
                                            <div style={{ fontSize: 16, color: colors.textSecondary }}>
                                                {isArabic ? 'تعلم مع متعلمين لديهم نفس الاهتمامات' : 'Learn with peers who share your interests'}
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ scale: values.studyBuddyOptIn ? [1, 1.2, 1] : 1 }}
                                            transition={{ duration: 0.3 }}
                                            style={{
                                                width: 60,
                                                height: 60,
                                                background: values.studyBuddyOptIn ? colors.blue : colors.surface,
                                                borderRadius: 30,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginLeft: 24,
                                            }}
                                        >
                                            {values.studyBuddyOptIn && <Check size={32} color={colors.text} strokeWidth={3} />}
                                        </motion.div>
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div style={{ display: 'flex', gap: 16, marginTop: 80 }}>
                        {currentStep > 0 && (
                            <motion.button
                                type="button"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 1,
                                    padding: '18px 32px',
                                    fontSize: 17,
                                    fontWeight: 500,
                                    background: 'transparent',
                                    border: `2px solid ${colors.border}`,
                                    borderRadius: 12,
                                    color: colors.text,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {isArabic ? 'السابق' : 'Back'}
                            </motion.button>
                        )}
                        {currentStep < 4 ? (
                            <motion.button
                                type="button"
                                onClick={nextStep}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: currentStep > 0 ? 1 : 2,
                                    padding: '18px 32px',
                                    fontSize: 17,
                                    fontWeight: 600,
                                    background: colors.blue,
                                    border: 'none',
                                    borderRadius: 12,
                                    color: colors.text,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {isArabic ? 'التالي' : 'Continue'}
                            </motion.button>
                        ) : (
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 2,
                                    padding: '18px 32px',
                                    fontSize: 17,
                                    fontWeight: 600,
                                    background: colors.blue,
                                    border: 'none',
                                    borderRadius: 12,
                                    color: colors.text,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    opacity: isLoading ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {isLoading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'إنهاء' : 'Complete')}
                            </motion.button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}
