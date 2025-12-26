'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Home,
    Upload,
    Image as ImageIcon,
    Video,
    FileText,
    DollarSign,
    Globe,
    Tag,
    Clock,
    Loader2,
    CheckCircle,
    AlertCircle,
    Sparkles,
    TrendingUp,
    Target,
    Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

export default function CreateCourse() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
    const [createSuccess, setCreateSuccess] = useState(false)

    // Form data
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [skillLevel, setSkillLevel] = useState('Beginner')
    const [duration, setDuration] = useState(0)
    const [language, setLanguage] = useState('en')
    const [contentCategory, setContentCategory] = useState('CATEGORY_A')
    const [price, setPrice] = useState(0)
    const [thumbnail, setThumbnail] = useState<File | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState('')

    const categories = [
        'Programming',
        'Design',
        'Business',
        'Marketing',
        'Photography',
        'Music',
        'Health & Fitness',
        'Language',
        'Other'
    ]

    const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(isArabic ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image size must be less than 5MB')
                return
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(isArabic ? 'يرجى تحميل صورة فقط' : 'Please upload an image file')
                return
            }

            setUploadingThumbnail(true)
            setThumbnail(file)
            const url = URL.createObjectURL(file)
            setThumbnailPreview(url)

            // Simulate upload delay for better UX
            setTimeout(() => {
                setUploadingThumbnail(false)
                toast.success(isArabic ? 'تم تحميل الصورة بنجاح' : 'Thumbnail uploaded successfully', {
                    icon: '✅',
                    duration: 2000
                })
            }, 500)
        }
    }

    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال عنوان الدورة' : 'Please enter course title', {
                icon: '⚠️',
                style: {
                    background: '#fee',
                    color: '#c00',
                }
            })
            return
        }

        if (!description.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال وصف الدورة' : 'Please enter course description', {
                icon: '⚠️',
                style: {
                    background: '#fee',
                    color: '#c00',
                }
            })
            return
        }

        if (!category) {
            toast.error(isArabic ? 'الرجاء اختيار الفئة' : 'Please select a category', {
                icon: '⚠️',
                style: {
                    background: '#fee',
                    color: '#c00',
                }
            })
            return
        }

        if (price < 0) {
            toast.error(isArabic ? 'السعر غير صالح' : 'Invalid price', {
                icon: '⚠️',
                style: {
                    background: '#fee',
                    color: '#c00',
                }
            })
            return
        }

        setLoading(true)

        // Show loading toast
        const loadingToast = toast.loading(
            isArabic ? 'جاري إنشاء دورتك الرائعة... ✨' : 'Creating your amazing course... ✨',
            {
                style: {
                    background: '#333',
                    color: '#fff',
                }
            }
        )

        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('description', description)
            formData.append('category', category)
            formData.append('skillLevel', skillLevel)
            formData.append('duration', duration.toString())
            formData.append('language', language)
            formData.append('contentCategory', contentCategory)
            formData.append('price', price.toString())

            if (thumbnail) {
                formData.append('thumbnail', thumbnail)
            }

            const response = await fetch('/api/creator/courses/create', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()

                // Dismiss loading toast
                toast.dismiss(loadingToast)

                // Show success with animation
                setCreateSuccess(true)
                toast.success(
                    isArabic ? '🎉 تم إنشاء الدورة بنجاح!' : '🎉 Course created successfully!',
                    {
                        duration: 3000,
                        style: {
                            background: '#10b981',
                            color: '#fff',
                            fontWeight: 'bold',
                        }
                    }
                )

                // Wait for animation before redirecting
                setTimeout(() => {
                    router.push(`/${locale}/creator/courses/${data.courseId}/edit`)
                }, 1500)
            } else {
                const error = await response.json()
                toast.dismiss(loadingToast)
                toast.error(error.error || (isArabic ? 'فشل إنشاء الدورة' : 'Failed to create course'), {
                    icon: '❌',
                    duration: 4000,
                    style: {
                        background: '#fee',
                        color: '#c00',
                    }
                })
                setLoading(false)
            }
        } catch (error) {
            console.error('Failed to create course:', error)
            toast.dismiss(loadingToast)
            toast.error(isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred', {
                icon: '❌',
                duration: 4000,
                style: {
                    background: '#fee',
                    color: '#c00',
                }
            })
            setLoading(false)
        }
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/5 dark:to-purple-950/5">
            {/* Success Overlay */}
            <AnimatePresence>
                {createSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-gradient-to-br from-green-500 to-emerald-600 p-12 rounded-3xl shadow-2xl text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <CheckCircle className="w-24 h-24 text-white mx-auto mb-4" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {isArabic ? '🎉 تم بنجاح!' : '🎉 Success!'}
                            </h2>
                            <p className="text-white/90 text-lg">
                                {isArabic ? 'جاري تحويلك إلى تحرير الدورة...' : 'Redirecting to course editor...'}
                            </p>
                            <div className="mt-6">
                                <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enhanced Header */}
            <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-accent rounded-full transition-all hover:scale-105"
                            disabled={loading}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-all hover:scale-105"
                            disabled={loading}
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                {isArabic ? 'إنشاء دورة جديدة' : 'Create New Course'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {isArabic ? 'خطوة' : 'Step'} {step} {isArabic ? 'من' : 'of'} 3
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            {isArabic ? 'وضع المنشئ' : 'Creator Mode'}
                        </Badge>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto p-8">
                {/* Enhanced Progress Steps */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center mb-12"
                >
                    <div className="flex items-center gap-4">
                        {/* Step 1 */}
                        <motion.div
                            className={`flex items-center gap-3 ${step >= 1 ? 'text-purple-500' : 'text-muted-foreground'}`}
                            whileHover={{ scale: step > 1 ? 1.05 : 1 }}
                        >
                            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${step >= 1
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-muted text-muted-foreground'
                                }`}>
                                {step > 1 ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <span className="font-bold">1</span>
                                )}
                                {step === 1 && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-purple-500"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-semibold text-sm">{isArabic ? 'المعلومات' : 'Basic'}</p>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'الأساسية' : 'Info'}</p>
                            </div>
                        </motion.div>

                        {/* Connector 1 */}
                        <div className="relative w-20 h-1 rounded-full bg-muted overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600"
                                initial={{ width: '0%' }}
                                animate={{ width: step >= 2 ? '100%' : '0%' }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        {/* Step 2 */}
                        <motion.div
                            className={`flex items-center gap-3 ${step >= 2 ? 'text-purple-500' : 'text-muted-foreground'}`}
                            whileHover={{ scale: step > 2 ? 1.05 : 1 }}
                        >
                            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${step >= 2
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-muted text-muted-foreground'
                                }`}>
                                {step > 2 ? (
                                    <CheckCircle className="w-6 h-6" />
                                ) : (
                                    <span className="font-bold">2</span>
                                )}
                                {step === 2 && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-purple-500"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-semibold text-sm">{isArabic ? 'التفاصيل' : 'Details'}</p>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'والوصف' : '& Media'}</p>
                            </div>
                        </motion.div>

                        {/* Connector 2 */}
                        <div className="relative w-20 h-1 rounded-full bg-muted overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-pink-600"
                                initial={{ width: '0%' }}
                                animate={{ width: step >= 3 ? '100%' : '0%' }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        {/* Step 3 */}
                        <motion.div
                            className={`flex items-center gap-3 ${step >= 3 ? 'text-purple-500' : 'text-muted-foreground'}`}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${step >= 3
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                                : 'bg-muted text-muted-foreground'
                                }`}>
                                <span className="font-bold">3</span>
                                {step === 3 && (
                                    <motion.div
                                        className="absolute inset-0 rounded-full bg-purple-500"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-semibold text-sm">{isArabic ? 'المراجعة' : 'Review'}</p>
                                <p className="text-xs text-muted-foreground">{isArabic ? 'والنشر' : '& Publish'}</p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-xl"
                >
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    {isArabic ? 'عنوان الدورة (بالإنجليزية)' : 'Course Title (English)'} *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={isArabic ? 'مثال: Complete Web Development Bootcamp' : 'e.g., Complete Web Development Bootcamp'}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                    maxLength={100}
                                    disabled={loading}
                                    autoComplete="off"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    {title.length}/100 {isArabic ? 'حرف' : 'characters'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    {isArabic ? 'الفئة' : 'Category'} *
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">{isArabic ? 'اختر الفئة' : 'Select a category'}</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'مستوى الصعوبة' : 'Skill Level'} *
                                    </label>
                                    <select
                                        value={skillLevel}
                                        onChange={(e) => setSkillLevel(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        {skillLevels.map((level) => (
                                            <option key={level} value={level}>
                                                {level}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'المدة (بالساعات)' : 'Duration (hours)'} *
                                    </label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                                        placeholder={isArabic ? 'مثال: 10' : 'e.g., 10'}
                                        min="0"
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        disabled={loading}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    {isArabic ? 'لغة الدورة' : 'Course Language'} *
                                </label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="en">English</option>
                                    <option value="de">Deutsch</option>
                                </select>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!title || !category}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    {isArabic ? 'التالي' : 'Next'}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    {isArabic ? 'وصف الدورة (بالإنجليزية)' : 'Course Description (English)'} *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={isArabic ? 'اشرح ما سيتعلمه الطلاب في هذه الدورة...' : 'Explain what students will learn in this course...'}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                                    maxLength={1000}
                                    disabled={loading}
                                    autoComplete="off"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    {description.length}/1000 {isArabic ? 'حرف' : 'characters'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-purple-500" />
                                    {isArabic ? 'صورة الدورة' : 'Course Thumbnail'}
                                </label>
                                <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${thumbnailPreview
                                    ? 'border-purple-500 bg-purple-50/5'
                                    : 'border-border hover:border-purple-500 hover:bg-accent/50'
                                    } cursor-pointer group`}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailSelect}
                                        className="hidden"
                                        id="thumbnail-upload"
                                        disabled={uploadingThumbnail}
                                    />
                                    <label htmlFor="thumbnail-upload" className="cursor-pointer">
                                        {uploadingThumbnail ? (
                                            <div className="space-y-4">
                                                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
                                                <p className="text-sm text-purple-500 font-semibold">
                                                    {isArabic ? 'جاري التحميل...' : 'Uploading...'}
                                                </p>
                                            </div>
                                        ) : thumbnailPreview ? (
                                            <div className="space-y-4">
                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-xl">
                                                    <Image
                                                        src={thumbnailPreview}
                                                        alt="Thumbnail preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                                        <Upload className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {isArabic ? 'انقر لتغيير الصورة' : 'Click to change image'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <ImageIcon className="w-16 h-16 text-muted-foreground/50 mx-auto group-hover:text-purple-500 transition-colors" />
                                                    <motion.div
                                                        className="absolute inset-0 flex items-center justify-center"
                                                        initial={{ scale: 0 }}
                                                        whileHover={{ scale: 1 }}
                                                    >
                                                        <Upload className="w-8 h-8 text-purple-500" />
                                                    </motion.div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground mb-1">
                                                        {isArabic ? 'انقر لتحميل صورة أو اسحبها هنا' : 'Click to upload or drag and drop'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? 'الحجم الموصى به: 1280x720 | بحد أقصى 5MB' : 'Recommended: 1280x720 | Max 5MB'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <Button
                                    onClick={() => setStep(1)}
                                    variant="outline"
                                >
                                    {isArabic ? 'السابق' : 'Previous'}
                                </Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={!description}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    {isArabic ? 'التالي' : 'Next'}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Review & Pricing */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-6"
                        >
                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    {isArabic ? 'نوع المحتوى' : 'Content Type'} *
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent">
                                        <input
                                            type="radio"
                                            name="contentCategory"
                                            value="CATEGORY_A"
                                            checked={contentCategory === 'CATEGORY_A'}
                                            onChange={(e) => setContentCategory(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <p className="font-semibold">
                                                {isArabic ? 'الفئة أ - مكتبة الوصول الشامل' : 'Category A - All-Access Library'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'دورة قياسية متاحة للجميع' : 'Standard course available to all subscribers'}
                                            </p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent">
                                        <input
                                            type="radio"
                                            name="contentCategory"
                                            value="CATEGORY_B"
                                            checked={contentCategory === 'CATEGORY_B'}
                                            onChange={(e) => setContentCategory(e.target.value)}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <p className="font-semibold">
                                                {isArabic ? 'الفئة ب - دورات مميزة' : 'Category B - Signature Courses'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'دورات عالية الجودة بإنتاج احترافي' : 'High-quality courses with premium production'}
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">
                                    {isArabic ? 'السعر (EGP)' : 'Price (EGP)'} *
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(Number(e.target.value))}
                                        min="0"
                                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                        disabled={loading}
                                        autoComplete="off"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {isArabic ? 'اترك 0 للدورات المجانية' : 'Set to 0 for free courses'}
                                </p>
                            </div>

                            {/* Review Summary */}
                            <div className="bg-accent/50 rounded-lg p-6 space-y-3">
                                <h3 className="font-bold mb-4">{isArabic ? 'ملخص الدورة' : 'Course Summary'}</h3>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isArabic ? 'العنوان:' : 'Title:'}</span>
                                    <span className="font-semibold">{title}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isArabic ? 'الفئة:' : 'Category:'}</span>
                                    <span className="font-semibold">{category}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isArabic ? 'نوع المحتوى:' : 'Content Type:'}</span>
                                    <span className="font-semibold">{contentCategory}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{isArabic ? 'السعر:' : 'Price:'}</span>
                                    <span className="font-semibold">{price} EGP</span>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <Button
                                    onClick={() => setStep(2)}
                                    variant="outline"
                                >
                                    {isArabic ? 'السابق' : 'Previous'}
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {isArabic ? 'جاري الإنشاء...' : 'Creating...'}
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {isArabic ? 'إنشاء الدورة' : 'Create Course'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
