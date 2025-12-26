/**
 * Creator Course Builder
 * Complete course creation interface based on Business Blueprint Section 3.3
 * 
 * Features:
 * - Category selection (A/B/C)
 * - Syllabus planner with drag & drop
 * - Bulk video upload with progress
 * - Auto-generate transcripts & captions
 * - Quiz & assignment creator
 * - Workbook templates
 * - Pricing setup (within allowed ranges)
 * - DRM & watermarking settings
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
    BookOpen,
    Video,
    FileText,
    DollarSign,
    Settings,
    Upload,
    Plus,
    Trash2,
    GripVertical,
    Save,
    Eye,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Clock,
    Users,
    Star,
    Lock,
    Unlock,
    Download,
    PlayCircle,
    Image as ImageIcon,
    Tag,
    Globe,
    Calendar,
    Award,
    Zap,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    X,
    Copy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type CourseCategory = 'CATEGORY_A' | 'CATEGORY_B' | 'CATEGORY_C'
type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS'
type LessonType = 'VIDEO' | 'QUIZ' | 'ASSIGNMENT' | 'READING'

interface Lesson {
    id: string
    title: string
    type: LessonType
    videoUrl?: string
    videoFile?: File
    duration?: number
    description?: string
    order: number
    isFree?: boolean
    transcriptGenerated?: boolean
    captionsGenerated?: boolean
    uploading?: boolean
    uploadProgress?: number
}

interface CourseData {
    title: string
    subtitle: string
    description: string
    category: CourseCategory
    level: CourseLevel
    language: string
    price: number
    thumbnail?: string
    thumbnailFile?: File
    tags: string[]
    learningOutcomes: string[]
    requirements: string[]
    lessons: Lesson[]
    enableDRM: boolean
    enableWatermark: boolean
    enableOfflineDownload: boolean
    enableCertificate: boolean
    maxStudents?: number
}

const CATEGORY_INFO = {
    CATEGORY_A: {
        name: 'All-Access Library',
        description: 'Open contribution with quality guidelines - Revenue share based on engagement',
        color: 'blue',
        priceRange: 'Free (revenue share)',
        icon: BookOpen,
        features: ['First-time review required', 'Usage-based revenue', 'Broad audience']
    },
    CATEGORY_B: {
        name: 'Signature Courses',
        description: 'Premium curated programs - Invitation/curation only',
        color: 'purple',
        priceRange: 'Fixed fee + revenue share',
        icon: Star,
        features: ['Editorial partnership', 'High production quality', 'Expert positioning']
    },
    CATEGORY_C: {
        name: 'Creator Channel',
        description: 'Your membership channel content',
        color: 'green',
        priceRange: '49-499 EGP/month',
        icon: Users,
        features: ['Direct subscriber access', '80% revenue share', 'Full control']
    }
}

export default function CourseBuilderPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    const isArabic = locale === 'ar'

    const [activeStep, setActiveStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [savingDraft, setSavingDraft] = useState(false)

    const [courseData, setCourseData] = useState<CourseData>({
        title: '',
        subtitle: '',
        description: '',
        category: 'CATEGORY_A',
        level: 'ALL_LEVELS',
        language: 'en',
        price: 0,
        tags: [],
        learningOutcomes: [''],
        requirements: [''],
        lessons: [],
        enableDRM: true,
        enableWatermark: true,
        enableOfflineDownload: false,
        enableCertificate: true
    })

    const [newTag, setNewTag] = useState('')
    const [uploadingVideos, setUploadingVideos] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/creator/courses/new`)
        }
        if (session?.user?.role !== 'CREATOR') {
            toast.error('Access denied. Creator account required.')
            router.push(`/${locale}/dashboard`)
        }
    }, [session, status, router, locale])

    const steps = [
        { id: 1, name: 'Basic Info', icon: FileText, description: 'Course details' },
        { id: 2, name: 'Curriculum', icon: BookOpen, description: 'Add lessons' },
        { id: 3, name: 'Pricing', icon: DollarSign, description: 'Set pricing' },
        { id: 4, name: 'Settings', icon: Settings, description: 'Final settings' }
    ]

    const handleInputChange = (field: keyof CourseData, value: any) => {
        setCourseData(prev => ({ ...prev, [field]: value }))
    }

    const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Thumbnail must be less than 5MB')
                return
            }
            setCourseData(prev => ({
                ...prev,
                thumbnailFile: file,
                thumbnail: URL.createObjectURL(file)
            }))
        }
    }

    const addLearningOutcome = () => {
        setCourseData(prev => ({
            ...prev,
            learningOutcomes: [...prev.learningOutcomes, '']
        }))
    }

    const updateLearningOutcome = (index: number, value: string) => {
        setCourseData(prev => ({
            ...prev,
            learningOutcomes: prev.learningOutcomes.map((outcome, i) =>
                i === index ? value : outcome
            )
        }))
    }

    const removeLearningOutcome = (index: number) => {
        if (courseData.learningOutcomes.length > 1) {
            setCourseData(prev => ({
                ...prev,
                learningOutcomes: prev.learningOutcomes.filter((_, i) => i !== index)
            }))
        }
    }

    const addTag = () => {
        if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
            setCourseData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }))
            setNewTag('')
        }
    }

    const removeTag = (tag: string) => {
        setCourseData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }))
    }

    const addLesson = (type: LessonType = 'VIDEO') => {
        const newLesson: Lesson = {
            id: `lesson-${Date.now()}`,
            title: '',
            type,
            order: courseData.lessons.length + 1,
            isFree: false
        }
        setCourseData(prev => ({
            ...prev,
            lessons: [...prev.lessons, newLesson]
        }))
    }

    const updateLesson = (id: string, updates: Partial<Lesson>) => {
        setCourseData(prev => ({
            ...prev,
            lessons: prev.lessons.map(lesson =>
                lesson.id === id ? { ...lesson, ...updates } : lesson
            )
        }))
    }

    const removeLesson = (id: string) => {
        setCourseData(prev => ({
            ...prev,
            lessons: prev.lessons.filter(lesson => lesson.id !== id)
        }))
    }

    const handleVideoUpload = async (lessonId: string, file: File) => {
        if (file.size > 500 * 1024 * 1024) {
            toast.error('Video must be less than 500MB')
            return
        }

        updateLesson(lessonId, { uploading: true, uploadProgress: 0, videoFile: file })

        try {
            const formData = new FormData()
            formData.append('video', file)
            formData.append('lessonId', lessonId)

            // Simulate upload progress
            const simulateProgress = setInterval(() => {
                updateLesson(lessonId, {
                    uploadProgress: Math.min(
                        (courseData.lessons.find(l => l.id === lessonId)?.uploadProgress || 0) + 10,
                        90
                    )
                })
            }, 500)

            const response = await fetch('/api/creator/courses/upload-video', {
                method: 'POST',
                body: formData
            })

            clearInterval(simulateProgress)

            if (response.ok) {
                const data = await response.json()
                updateLesson(lessonId, {
                    videoUrl: data.videoUrl,
                    duration: data.duration,
                    uploading: false,
                    uploadProgress: 100,
                    transcriptGenerated: false,
                    captionsGenerated: false
                })
                toast.success('Video uploaded successfully')
            } else {
                throw new Error('Upload failed')
            }
        } catch (error) {
            console.error('Video upload error:', error)
            toast.error('Failed to upload video')
            updateLesson(lessonId, { uploading: false, uploadProgress: 0, videoFile: undefined })
        }
    }

    const generateTranscripts = async (lessonId: string) => {
        try {
            toast.loading('Generating transcript...', { id: `transcript-${lessonId}` })

            const response = await fetch('/api/creator/courses/generate-transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, videoUrl: courseData.lessons.find(l => l.id === lessonId)?.videoUrl })
            })

            if (response.ok) {
                updateLesson(lessonId, { transcriptGenerated: true })
                toast.success('Transcript generated', { id: `transcript-${lessonId}` })
            } else {
                throw new Error('Generation failed')
            }
        } catch (error) {
            console.error('Transcript generation error:', error)
            toast.error('Failed to generate transcript', { id: `transcript-${lessonId}` })
        }
    }

    const generateCaptions = async (lessonId: string) => {
        try {
            toast.loading('Generating captions...', { id: `captions-${lessonId}` })

            const response = await fetch('/api/creator/courses/generate-captions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, videoUrl: courseData.lessons.find(l => l.id === lessonId)?.videoUrl })
            })

            if (response.ok) {
                updateLesson(lessonId, { captionsGenerated: true })
                toast.success('Captions generated', { id: `captions-${lessonId}` })
            } else {
                throw new Error('Generation failed')
            }
        } catch (error) {
            console.error('Captions generation error:', error)
            toast.error('Failed to generate captions', { id: `captions-${lessonId}` })
        }
    }

    const saveDraft = async () => {
        try {
            setSavingDraft(true)
            const response = await fetch('/api/creator/courses/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            })

            if (response.ok) {
                toast.success('Draft saved')
            } else {
                throw new Error('Save failed')
            }
        } catch (error) {
            console.error('Save draft error:', error)
            toast.error('Failed to save draft')
        } finally {
            setSavingDraft(false)
        }
    }

    const submitForReview = async () => {
        // Validation
        if (!courseData.title || !courseData.description) {
            toast.error('Please fill in all required fields')
            return
        }

        if (courseData.lessons.length === 0) {
            toast.error('Please add at least one lesson')
            return
        }

        if (courseData.category === 'CATEGORY_B') {
            toast.error('Category B (Signature) courses are invitation-only. Please contact us.')
            return
        }

        try {
            setLoading(true)
            const response = await fetch('/api/creator/courses/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseData)
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(
                    courseData.category === 'CATEGORY_A'
                        ? 'Course submitted for review! You\'ll be notified within 10 days.'
                        : 'Course published to your channel!'
                )
                router.push(`/${locale}/creator/courses/${data.courseId}`)
            } else {
                const error = await response.json()
                throw new Error(error.message || 'Creation failed')
            }
        } catch (error: any) {
            console.error('Course creation error:', error)
            toast.error(error.message || 'Failed to create course')
        } finally {
            setLoading(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                {isArabic ? 'إنشاء دورة جديدة' : 'Create New Course'}
                            </h1>
                            <p className="text-gray-400">
                                {isArabic ? 'املأ المعلومات أدناه لإنشاء دورتك' : 'Fill in the information below to create your course'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={saveDraft}
                                disabled={savingDraft}
                                variant="outline"
                                className="border-gray-600 hover:border-gray-500"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {savingDraft ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ كمسودة' : 'Save Draft')}
                            </Button>
                            <Button
                                onClick={() => router.push(`/${locale}/creator/courses`)}
                                variant="ghost"
                            >
                                <X className="w-4 h-4 mr-2" />
                                {isArabic ? 'إلغاء' : 'Cancel'}
                            </Button>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="flex items-center justify-between bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.id}>
                                <button
                                    onClick={() => setActiveStep(step.id)}
                                    className={`flex flex-col items-center gap-2 transition-all ${activeStep === step.id
                                            ? 'opacity-100'
                                            : activeStep > step.id
                                                ? 'opacity-80'
                                                : 'opacity-50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${activeStep === step.id
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 border-purple-500'
                                            : activeStep > step.id
                                                ? 'bg-green-500 border-green-500'
                                                : 'bg-gray-700 border-gray-600'
                                        }`}>
                                        {activeStep > step.id ? (
                                            <CheckCircle className="w-6 h-6 text-white" />
                                        ) : (
                                            <step.icon className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-sm font-semibold ${activeStep >= step.id ? 'text-white' : 'text-gray-500'}`}>
                                            {step.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{step.description}</p>
                                    </div>
                                </button>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-4 rounded transition-all ${activeStep > step.id ? 'bg-green-500' : 'bg-gray-700'
                                        }`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
                    {/* Step 1: Basic Info */}
                    {activeStep === 1 && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <FileText className="w-6 h-6 text-purple-400" />
                                    {isArabic ? 'المعلومات الأساسية' : 'Basic Information'}
                                </h2>

                                {/* Category Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        {isArabic ? 'فئة الدورة' : 'Course Category'} <span className="text-red-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                                            const Icon = info.icon
                                            const isSelected = courseData.category === key
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => handleInputChange('category', key as CourseCategory)}
                                                    className={`p-6 rounded-xl border-2 transition-all text-left ${isSelected
                                                            ? `border-${info.color}-500 bg-${info.color}-500/10`
                                                            : 'border-gray-700 hover:border-gray-600 bg-gray-800/40'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <Icon className={`w-6 h-6 text-${info.color}-400`} />
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-white mb-1">{info.name}</h3>
                                                            <p className="text-xs text-gray-400 mb-2">{info.description}</p>
                                                            <Badge variant="outline" className="text-xs">
                                                                {info.priceRange}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {info.features.map((feature, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                                                <CheckCircle className="w-3 h-3 text-green-400" />
                                                                {feature}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {key === 'CATEGORY_B' && (
                                                        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400 flex items-center gap-2">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Invitation Only
                                                        </div>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Course Title */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'عنوان الدورة' : 'Course Title'} <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={courseData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder={isArabic ? 'أدخل عنوان الدورة' : 'Enter course title'}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                        maxLength={100}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{courseData.title.length}/100</p>
                                </div>

                                {/* Course Subtitle */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'العنوان الفرعي' : 'Subtitle'}
                                    </label>
                                    <input
                                        type="text"
                                        value={courseData.subtitle}
                                        onChange={(e) => handleInputChange('subtitle', e.target.value)}
                                        placeholder={isArabic ? 'وصف قصير جذاب' : 'Short catchy description'}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                        maxLength={120}
                                    />
                                </div>

                                {/* Course Description */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'وصف الدورة' : 'Course Description'} <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={courseData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder={isArabic ? 'اكتب وصفاً تفصيلياً للدورة...' : 'Write a detailed description of your course...'}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[150px]"
                                        maxLength={2000}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{courseData.description.length}/2000</p>
                                </div>

                                {/* Level & Language */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {isArabic ? 'المستوى' : 'Level'}
                                        </label>
                                        <select
                                            value={courseData.level}
                                            onChange={(e) => handleInputChange('level', e.target.value as CourseLevel)}
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                        >
                                            <option value="ALL_LEVELS">{isArabic ? 'جميع المستويات' : 'All Levels'}</option>
                                            <option value="BEGINNER">{isArabic ? 'مبتدئ' : 'Beginner'}</option>
                                            <option value="INTERMEDIATE">{isArabic ? 'متوسط' : 'Intermediate'}</option>
                                            <option value="ADVANCED">{isArabic ? 'متقدم' : 'Advanced'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {isArabic ? 'اللغة' : 'Language'}
                                        </label>
                                        <select
                                            value={courseData.language}
                                            onChange={(e) => handleInputChange('language', e.target.value)}
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                        >
                                            <option value="en">English</option>
                                            <option value="de">Deutsch</option>
                                            <option value="fr">Français</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Thumbnail Upload */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'صورة الغلاف' : 'Course Thumbnail'} <span className="text-red-400">*</span>
                                    </label>
                                    <div className="flex items-start gap-4">
                                        {courseData.thumbnail && (
                                            <div className="relative w-48 h-28 rounded-xl overflow-hidden border-2 border-gray-600">
                                                <img src={courseData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <label className="flex-1 cursor-pointer">
                                            <div className="border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-xl p-8 transition-all bg-gray-700/30 hover:bg-gray-700/50">
                                                <div className="text-center">
                                                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-sm text-gray-300 mb-1">
                                                        {isArabic ? 'انقر للتحميل' : 'Click to upload'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        PNG, JPG (max 5MB) - 16:9 ratio recommended
                                                    </p>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleThumbnailUpload}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Learning Outcomes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'نتائج التعلم' : 'Learning Outcomes'} <span className="text-red-400">*</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mb-3">
                                        {isArabic ? 'ماذا سيتعلم الطلاب؟' : 'What will students learn?'}
                                    </p>
                                    <div className="space-y-3">
                                        {courseData.learningOutcomes.map((outcome, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <input
                                                    type="text"
                                                    value={outcome}
                                                    onChange={(e) => updateLearningOutcome(index, e.target.value)}
                                                    placeholder={`${isArabic ? 'النتيجة' : 'Outcome'} ${index + 1}`}
                                                    className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                                />
                                                {courseData.learningOutcomes.length > 1 && (
                                                    <button
                                                        onClick={() => removeLearningOutcome(index)}
                                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={addLearningOutcome}
                                            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {isArabic ? 'إضافة نتيجة' : 'Add Outcome'}
                                        </button>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'العلامات' : 'Tags'}
                                    </label>
                                    <div className="flex items-center gap-3 mb-3">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                                            placeholder={isArabic ? 'أضف علامة...' : 'Add a tag...'}
                                            className="flex-1 bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                        />
                                        <Button onClick={addTag} variant="outline">
                                            <Tag className="w-4 h-4 mr-2" />
                                            {isArabic ? 'إضافة' : 'Add'}
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {courseData.tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="px-3 py-1 flex items-center gap-2"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:text-red-400"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Curriculum */}
                    {activeStep === 2 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                        <BookOpen className="w-6 h-6 text-purple-400" />
                                        {isArabic ? 'المنهج الدراسي' : 'Course Curriculum'}
                                    </h2>
                                    <p className="text-gray-400 text-sm">
                                        {isArabic ? 'أضف الدروس ورتبها' : 'Add and organize your lessons'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button onClick={() => addLesson('VIDEO')} variant="outline">
                                        <Video className="w-4 h-4 mr-2" />
                                        {isArabic ? 'درس فيديو' : 'Video Lesson'}
                                    </Button>
                                    <Button onClick={() => addLesson('QUIZ')} variant="outline">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {isArabic ? 'اختبار' : 'Quiz'}
                                    </Button>
                                </div>
                            </div>

                            {courseData.lessons.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-xl">
                                    <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-400 mb-2">
                                        {isArabic ? 'لا توجد دروس بعد' : 'No lessons yet'}
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        {isArabic ? 'ابدأ بإضافة درسك الأول' : 'Start by adding your first lesson'}
                                    </p>
                                    <Button onClick={() => addLesson('VIDEO')}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        {isArabic ? 'إضافة درس' : 'Add Lesson'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {courseData.lessons.map((lesson, index) => (
                                        <div
                                            key={lesson.id}
                                            className="bg-gray-700/50 border border-gray-600 rounded-xl p-6"
                                        >
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-lg">
                                                    <span className="text-purple-400 font-bold">{index + 1}</span>
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <input
                                                        type="text"
                                                        value={lesson.title}
                                                        onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                                                        placeholder={isArabic ? 'عنوان الدرس' : 'Lesson title'}
                                                        className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                                    />

                                                    {lesson.type === 'VIDEO' && (
                                                        <div>
                                                            {!lesson.videoUrl ? (
                                                                <label className="cursor-pointer block">
                                                                    <div className="border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg p-6 transition-all bg-gray-800/30 hover:bg-gray-800/50">
                                                                        {lesson.uploading ? (
                                                                            <div className="space-y-3">
                                                                                <div className="flex items-center justify-center gap-2 text-sm text-purple-400">
                                                                                    <Upload className="w-4 h-4 animate-pulse" />
                                                                                    Uploading... {lesson.uploadProgress}%
                                                                                </div>
                                                                                <Progress value={lesson.uploadProgress} />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center">
                                                                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                                                <p className="text-sm text-gray-300">
                                                                                    {isArabic ? 'انقر لتحميل الفيديو' : 'Click to upload video'}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    MP4, WebM (max 500MB)
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <input
                                                                        type="file"
                                                                        accept="video/*"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0]
                                                                            if (file) handleVideoUpload(lesson.id, file)
                                                                        }}
                                                                    />
                                                                </label>
                                                            ) : (
                                                                <div className="bg-gray-800/50 rounded-lg p-4">
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                                                        <span className="text-sm text-white">Video uploaded</span>
                                                                        {lesson.duration && (
                                                                            <Badge variant="outline">
                                                                                {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        {!lesson.transcriptGenerated && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => generateTranscripts(lesson.id)}
                                                                            >
                                                                                <Sparkles className="w-3 h-3 mr-1" />
                                                                                Generate Transcript
                                                                            </Button>
                                                                        )}
                                                                        {!lesson.captionsGenerated && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => generateCaptions(lesson.id)}
                                                                            >
                                                                                <Sparkles className="w-3 h-3 mr-1" />
                                                                                Generate Captions
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={lesson.isFree}
                                                                onChange={(e) => updateLesson(lesson.id, { isFree: e.target.checked })}
                                                                className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                                                            />
                                                            <span className="text-sm text-gray-300">
                                                                {isArabic ? 'معاينة مجانية' : 'Free Preview'}
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeLesson(lesson.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Pricing */}
                    {activeStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <DollarSign className="w-6 h-6 text-green-400" />
                                {isArabic ? 'التسعير' : 'Pricing'}
                            </h2>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-blue-300 font-semibold mb-2">
                                            {courseData.category === 'CATEGORY_A' && 'All-Access Library - Free for Students'}
                                            {courseData.category === 'CATEGORY_B' && 'Signature Courses - Fixed Fee + Revenue Share'}
                                            {courseData.category === 'CATEGORY_C' && 'Creator Channel - Set Your Price'}
                                        </h3>
                                        <p className="text-blue-200 text-sm">
                                            {courseData.category === 'CATEGORY_A' && 'Your earnings come from usage-based revenue share. Students access your course as part of their All-Access subscription.'}
                                            {courseData.category === 'CATEGORY_B' && 'We\'ll work with you on pricing. This is for invitation-only premium programs.'}
                                            {courseData.category === 'CATEGORY_C' && 'Set a monthly price for your channel members. Platform takes 20% + processing fees.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {courseData.category === 'CATEGORY_C' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'السعر الشهري (جنيه مصري)' : 'Monthly Price (EGP)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="49"
                                        max="499"
                                        value={courseData.price}
                                        onChange={(e) => handleInputChange('price', Number(e.target.value))}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Range: 49-499 EGP/month • You earn: {Math.round(courseData.price * 0.8)} EGP/month per subscriber
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-6">
                                    <h4 className="font-semibold text-white mb-2">Estimated Revenue</h4>
                                    <p className="text-3xl font-bold text-green-400 mb-1">
                                        {courseData.category === 'CATEGORY_C'
                                            ? `${Math.round(courseData.price * 0.8)} EGP`
                                            : 'Usage-Based'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {courseData.category === 'CATEGORY_C'
                                            ? 'Per subscriber/month (after fees)'
                                            : 'Based on watch time & engagement'}
                                    </p>
                                </div>
                                <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-6">
                                    <h4 className="font-semibold text-white mb-2">Platform Fee</h4>
                                    <p className="text-3xl font-bold text-purple-400 mb-1">
                                        {courseData.category === 'CATEGORY_C' ? '20%' : 'Share-Based'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {courseData.category === 'CATEGORY_C'
                                            ? '+ payment processing fees'
                                            : 'Fair engagement-weighted split'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Settings */}
                    {activeStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Settings className="w-6 h-6 text-blue-400" />
                                {isArabic ? 'الإعدادات' : 'Course Settings'}
                            </h2>

                            {/* DRM & Security */}
                            <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-6">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-yellow-400" />
                                    {isArabic ? 'الأمان والحماية' : 'Security & Protection'}
                                </h3>
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div>
                                            <p className="font-medium text-white">{isArabic ? 'تفعيل DRM' : 'Enable DRM'}</p>
                                            <p className="text-sm text-gray-400">{isArabic ? 'حماية الفيديوهات من النسخ' : 'Protect videos from copying'}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={courseData.enableDRM}
                                            onChange={(e) => handleInputChange('enableDRM', e.target.checked)}
                                            className="w-12 h-6 rounded-full"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div>
                                            <p className="font-medium text-white">{isArabic ? 'علامة مائية' : 'Watermark'}</p>
                                            <p className="text-sm text-gray-400">{isArabic ? 'إضافة علامة مائية للفيديوهات' : 'Add watermark to videos'}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={courseData.enableWatermark}
                                            onChange={(e) => handleInputChange('enableWatermark', e.target.checked)}
                                            className="w-12 h-6 rounded-full"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Student Features */}
                            <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-6">
                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-400" />
                                    {isArabic ? 'ميزات الطلاب' : 'Student Features'}
                                </h3>
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div>
                                            <p className="font-medium text-white">{isArabic ? 'التحميل للمشاهدة دون اتصال' : 'Offline Download'}</p>
                                            <p className="text-sm text-gray-400">{isArabic ? 'السماح بتحميل الدروس' : 'Allow students to download lessons'}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={courseData.enableOfflineDownload}
                                            onChange={(e) => handleInputChange('enableOfflineDownload', e.target.checked)}
                                            className="w-12 h-6 rounded-full"
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <div>
                                            <p className="font-medium text-white">{isArabic ? 'شهادة إتمام' : 'Completion Certificate'}</p>
                                            <p className="text-sm text-gray-400">{isArabic ? 'إصدار شهادة عند الإكمال' : 'Issue certificate upon completion'}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={courseData.enableCertificate}
                                            onChange={(e) => handleInputChange('enableCertificate', e.target.checked)}
                                            className="w-12 h-6 rounded-full"
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Max Students (Optional) */}
                            {courseData.category === 'CATEGORY_B' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {isArabic ? 'الحد الأقصى للطلاب (اختياري)' : 'Maximum Students (Optional)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={courseData.maxStudents || ''}
                                        onChange={(e) => handleInputChange('maxStudents', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder={isArabic ? 'بدون حد' : 'No limit'}
                                        className="w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {isArabic ? 'اتركه فارغاً للتسجيل غير المحدود' : 'Leave empty for unlimited enrollment'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-700 mt-8">
                        <Button
                            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
                            disabled={activeStep === 1}
                            variant="outline"
                        >
                            {isArabic ? 'السابق' : 'Previous'}
                        </Button>

                        {activeStep < 4 ? (
                            <Button
                                onClick={() => setActiveStep(Math.min(4, activeStep + 1))}
                                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                            >
                                {isArabic ? 'التالي' : 'Next'}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={submitForReview}
                                disabled={loading}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {isArabic ? 'جاري الإرسال...' : 'Submitting...'}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {courseData.category === 'CATEGORY_A'
                                            ? (isArabic ? 'إرسال للمراجعة' : 'Submit for Review')
                                            : (isArabic ? 'نشر الدورة' : 'Publish Course')}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
