'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Clock,
    User,
    Video,
    BookOpen,
    Check,
    X,
    Eye,
    Calendar,
    DollarSign,
    AlertCircle
} from 'lucide-react'

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    category: string
    skillLevel: string
    price: number
    duration: number
    thumbnail: string | null
    createdAt: string
    updatedAt: string
    creator: {
        id: string
        name: string
        email: string
        expertise: string | null
    } | null
    stats: {
        totalLessons: number
        totalEnrollments: number
        videoCount: number
        readyVideos: number
    }
}

interface ReviewModalProps {
    course: Course | null
    isOpen: boolean
    onClose: () => void
    onReview: (courseId: string, action: 'approve' | 'reject', feedback?: string) => void
}

function ReviewModal({ course, isOpen, onClose, onReview }: ReviewModalProps) {
    const [feedback, setFeedback] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    if (!isOpen || !course) return null

    const handleReview = async (action: 'approve' | 'reject') => {
        setIsLoading(true)
        try {
            await onReview(course.id, action, feedback)
            setFeedback('')
            onClose()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">{course.title}</h2>
                            <p className="text-muted-foreground text-lg">{course.titleAr}</p>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-semibold mb-2">Course Details</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Category:</strong> {course.category}</p>
                                <p><strong>Skill Level:</strong> {course.skillLevel}</p>
                                <p><strong>Duration:</strong> {course.duration} minutes</p>
                                <p><strong>Price:</strong> {course.price} EGP</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Creator Info</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {course.creator?.name}</p>
                                <p><strong>Email:</strong> {course.creator?.email}</p>
                                <p><strong>Expertise:</strong> {course.creator?.expertise || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Course Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-background rounded">
                                <BookOpen className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                                <p className="text-sm text-muted-foreground">Lessons</p>
                                <p className="font-bold">{course.stats.totalLessons}</p>
                            </div>
                            <div className="text-center p-3 bg-background rounded">
                                <Video className="h-6 w-6 mx-auto mb-1 text-green-600" />
                                <p className="text-sm text-muted-foreground">Videos</p>
                                <p className="font-bold">{course.stats.videoCount}</p>
                            </div>
                            <div className="text-center p-3 bg-background rounded">
                                <Check className="h-6 w-6 mx-auto mb-1 text-green-600" />
                                <p className="text-sm text-muted-foreground">Ready Videos</p>
                                <p className="font-bold">{course.stats.readyVideos}</p>
                            </div>
                            <div className="text-center p-3 bg-background rounded">
                                <User className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                                <p className="text-sm text-muted-foreground">Enrollments</p>
                                <p className="font-bold">{course.stats.totalEnrollments}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-foreground text-sm leading-relaxed">{course.description}</p>
                    </div>

                    <div className="mb-6">
                        <Label htmlFor="feedback">Review Feedback (Optional)</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Add any feedback for the creator..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="mt-2"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-4 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => handleReview('reject')}
                            disabled={isLoading}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Reject Course
                        </Button>
                        <Button
                            onClick={() => handleReview('approve')}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Approve & Publish
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CourseReviewPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchPendingCourses()
    }, [])

    const fetchPendingCourses = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/admin/courses/pending')
            const data = await response.json()

            if (data.success) {
                setCourses(data.courses)
            } else {
                setError(data.error || 'Failed to load courses')
            }
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReviewCourse = async (courseId: string, action: 'approve' | 'reject', feedback?: string) => {
        try {
            const response = await fetch(`/api/admin/courses/${courseId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, feedback }),
            })

            const data = await response.json()

            if (data.success) {
                // Remove the course from the list
                setCourses(prev => prev.filter(course => course.id !== courseId))
                // Show success message (you could add toast notifications here)
                alert(`Course ${action}d successfully!`)
            } else {
                alert(data.error || 'Failed to process review')
            }
        } catch (err) {
            alert('Failed to process review')
        }
    }

    const openReviewModal = (course: Course) => {
        setSelectedCourse(course)
        setIsModalOpen(true)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading pending courses...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <Button onClick={fetchPendingCourses} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Course Review</h1>
                <p className="text-muted-foreground mt-2">Review and approve courses submitted by creators</p>
            </div>

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No courses pending review</h3>
                        <p className="text-muted-foreground">All submitted courses have been reviewed.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                                        <CardDescription className="text-base">{course.titleAr}</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        Under Review
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{course.creator?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {new Date(course.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{course.price} EGP</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="text-center p-2 bg-background rounded">
                                        <BookOpen className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                                        <p className="text-xs text-muted-foreground">Lessons</p>
                                        <p className="font-semibold text-sm">{course.stats.totalLessons}</p>
                                    </div>
                                    <div className="text-center p-2 bg-background rounded">
                                        <Video className="h-4 w-4 mx-auto mb-1 text-green-600" />
                                        <p className="text-xs text-muted-foreground">Videos</p>
                                        <p className="font-semibold text-sm">{course.stats.videoCount}</p>
                                    </div>
                                    <div className="text-center p-2 bg-background rounded">
                                        <Check className="h-4 w-4 mx-auto mb-1 text-green-600" />
                                        <p className="text-xs text-muted-foreground">Ready</p>
                                        <p className="font-semibold text-sm">{course.stats.readyVideos}</p>
                                    </div>
                                    <div className="text-center p-2 bg-background rounded">
                                        <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                                        <p className="text-xs text-muted-foreground">Duration</p>
                                        <p className="font-semibold text-sm">{course.duration}m</p>
                                    </div>
                                </div>

                                <p className="text-foreground text-sm mb-4 line-clamp-2">{course.description}</p>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openReviewModal(course)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Review Course
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ReviewModal
                course={selectedCourse}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onReview={handleReviewCourse}
            />
        </div>
    )
}
/**
 * Course Creation Form - Multi-step form for creating new courses
 * Includes course details, syllabus planning, and initial setup
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    Upload,
    Image as ImageIcon,
    BookOpen,
    Clock,
    DollarSign,
    Tag,
    Globe
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface LessonData {
    title: string
    titleAr: string
    duration: number
    description: string
}

interface ModuleData {
    moduleTitle: string
    moduleTitleAr: string
    lessons: LessonData[]
}

interface CourseFormData {
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    category: string
    skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    language: string
    price: number
    duration: number
    syllabus: ModuleData[]
    thumbnail?: string
    tags: string[]
}

const CATEGORIES = [
    'البرمجة والتكنولوجيا',
    'التصميم والإبداع',
    'الأعمال والريادة',
    'التسويق الرقمي',
    'التطوير الشخصي',
    'العلوم والرياضيات',
    'اللغات',
    'أخرى'
]

export default function CreateCoursePage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('')

    const [formData, setFormData] = useState<CourseFormData>({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        category: '',
        skillLevel: 'BEGINNER',
        language: 'ar',
        price: 0,
        duration: 60,
        syllabus: [{
            moduleTitle: '',
            moduleTitleAr: '',
            lessons: [{
                title: '',
                titleAr: '',
                duration: 10,
                description: ''
            }]
        }],
        tags: []
    })

    const totalSteps = 3
    const progress = (currentStep / totalSteps) * 100

    const updateFormData = (field: keyof CourseFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const addModule = () => {
        setFormData(prev => ({
            ...prev,
            syllabus: [...prev.syllabus, {
                moduleTitle: '',
                moduleTitleAr: '',
                lessons: [{
                    title: '',
                    titleAr: '',
                    duration: 10,
                    description: ''
                }]
            }]
        }))
    }

    const removeModule = (moduleIndex: number) => {
        setFormData(prev => ({
            ...prev,
            syllabus: prev.syllabus.filter((_, index) => index !== moduleIndex)
        }))
    }

    const addLesson = (moduleIndex: number) => {
        setFormData(prev => ({
            ...prev,
            syllabus: prev.syllabus.map((module, index) =>
                index === moduleIndex
                    ? {
                        ...module,
                        lessons: [...module.lessons, {
                            title: '',
                            titleAr: '',
                            duration: 10,
                            description: ''
                        }]
                    }
                    : module
            )
        }))
    }

    const removeLesson = (moduleIndex: number, lessonIndex: number) => {
        setFormData(prev => ({
            ...prev,
            syllabus: prev.syllabus.map((module, index) =>
                index === moduleIndex
                    ? {
                        ...module,
                        lessons: module.lessons.filter((_, lIndex) => lIndex !== lessonIndex)
                    }
                    : module
            )
        }))
    }

    const updateModule = (moduleIndex: number, field: keyof ModuleData, value: any) => {
        setFormData(prev => ({
            ...prev,
            syllabus: prev.syllabus.map((module, index) =>
                index === moduleIndex ? { ...module, [field]: value } : module
            )
        }))
    }

    const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof LessonData, value: any) => {
        setFormData(prev => ({
            ...prev,
            syllabus: prev.syllabus.map((module, mIndex) =>
                mIndex === moduleIndex
                    ? {
                        ...module,
                        lessons: module.lessons.map((lesson, lIndex) =>
                            lIndex === lessonIndex ? { ...lesson, [field]: value } : lesson
                        )
                    }
                    : module
            )
        }))
    }

    const onSubmit = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/courses/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const result = await response.json()

            if (response.ok) {
                toast.success('تم إنشاء الدورة بنجاح!')
                router.push(`/creator/courses/${result.course.id}/edit`)
            } else {
                toast.error(result.error || 'حدث خطأ أثناء إنشاء الدورة')
            }
        } catch (error) {
            console.error('Course creation error:', error)
            toast.error('حدث خطأ غير متوقع')
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                setThumbnailPreview(result)
                updateFormData('thumbnail', result)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            <div className="max-w-4xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        العودة
                    </Button>

                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        إنشاء دورة تدريبية جديدة
                    </h1>
                    <p className="text-muted-foreground">
                        املأ البيانات التالية لإنشاء دورتك التدريبية الجديدة
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">خطوة {currentStep} من {totalSteps}</span>
                        <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                المعلومات الأساسية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Course Title */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="titleAr">عنوان الدورة (بالعربية) *</Label>
                                    <Input
                                        id="titleAr"
                                        value={formData.titleAr}
                                        onChange={(e) => updateFormData('titleAr', e.target.value)}
                                        placeholder="مثال: دورة البرمجة للمبتدئين"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="title">عنوان الدورة (بالإنجليزية) *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => updateFormData('title', e.target.value)}
                                        placeholder="e.g., Programming for Beginners"
                                    />
                                </div>
                            </div>

                            {/* Course Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="descriptionAr">وصف الدورة (بالعربية) *</Label>
                                    <Textarea
                                        id="descriptionAr"
                                        value={formData.descriptionAr}
                                        onChange={(e) => updateFormData('descriptionAr', e.target.value)}
                                        rows={4}
                                        placeholder="اكتب وصفاً مفصلاً عن الدورة وما سيتعلمه الطلاب..."
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">وصف الدورة (بالإنجليزية) *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => updateFormData('description', e.target.value)}
                                        rows={4}
                                        placeholder="Write a detailed description about the course..."
                                    />
                                </div>
                            </div>

                            {/* Category and Level */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="category">فئة الدورة *</Label>
                                    <select
                                        id="category"
                                        value={formData.category}
                                        onChange={(e) => updateFormData('category', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">اختر الفئة</option>
                                        {CATEGORIES.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="skillLevel">مستوى الصعوبة *</Label>
                                    <select
                                        id="skillLevel"
                                        value={formData.skillLevel}
                                        onChange={(e) => updateFormData('skillLevel', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="BEGINNER">مبتدئ</option>
                                        <option value="INTERMEDIATE">متوسط</option>
                                        <option value="ADVANCED">متقدم</option>
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="language">لغة الدورة *</Label>
                                    <select
                                        id="language"
                                        value={formData.language}
                                        onChange={(e) => updateFormData('language', e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="ar">العربية</option>
                                        <option value="en">الإنجليزية</option>
                                        <option value="ar-en">العربية والإنجليزية</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price and Duration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price">سعر الدورة (ج.م)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => updateFormData('price', parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                            className="pl-10"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">اتركه فارغاً إذا كانت الدورة مجانية</p>
                                </div>

                                <div>
                                    <Label htmlFor="duration">المدة الإجمالية (دقيقة) *</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="duration"
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => updateFormData('duration', parseInt(e.target.value) || 60)}
                                            placeholder="60"
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Thumbnail Upload */}
                            <div>
                                <Label htmlFor="thumbnail">صورة الدورة</Label>
                                <div className="mt-2">
                                    {thumbnailPreview ? (
                                        <div className="relative">
                                            <img
                                                src={thumbnailPreview}
                                                alt="Course thumbnail"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="absolute top-2 right-2"
                                                onClick={() => {
                                                    setThumbnailPreview('')
                                                    updateFormData('thumbnail', '')
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <div className="mt-4">
                                                <label
                                                    htmlFor="thumbnail-upload"
                                                    className="cursor-pointer"
                                                >
                                                    <span className="mt-2 block text-sm font-medium text-foreground">
                                                        ارفع صورة للدورة
                                                    </span>
                                                    <input
                                                        id="thumbnail-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleThumbnailUpload}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Course Syllabus */}
                {currentStep === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                منهج الدورة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {formData.syllabus.map((module, moduleIndex) => (
                                <div key={moduleIndex} className="border rounded-lg p-4 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium">الوحدة {moduleIndex + 1}</h3>
                                        {formData.syllabus.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeModule(moduleIndex)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Module Titles */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>عنوان الوحدة (بالعربية) *</Label>
                                            <Input
                                                value={module.moduleTitleAr}
                                                onChange={(e) => updateModule(moduleIndex, 'moduleTitleAr', e.target.value)}
                                                placeholder="مثال: مقدمة في البرمجة"
                                            />
                                        </div>
                                        <div>
                                            <Label>عنوان الوحدة (بالإنجليزية) *</Label>
                                            <Input
                                                value={module.moduleTitle}
                                                onChange={(e) => updateModule(moduleIndex, 'moduleTitle', e.target.value)}
                                                placeholder="e.g., Introduction to Programming"
                                            />
                                        </div>
                                    </div>

                                    {/* Module Lessons */}
                                    <div className="space-y-4">
                                        <h4 className="font-medium">دروس الوحدة:</h4>

                                        {module.lessons.map((lesson, lessonIndex) => (
                                            <div key={lessonIndex} className="bg-background rounded-lg p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">الدرس {lessonIndex + 1}</span>
                                                    {module.lessons.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeLesson(moduleIndex, lessonIndex)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-sm">عنوان الدرس (بالعربية) *</Label>
                                                        <Input
                                                            value={lesson.titleAr}
                                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'titleAr', e.target.value)}
                                                            placeholder="مثال: الدرس الأول"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">عنوان الدرس (بالإنجليزية) *</Label>
                                                        <Input
                                                            value={lesson.title}
                                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                                            placeholder="e.g., Lesson One"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label className="text-sm">مدة الدرس (دقيقة) *</Label>
                                                        <Input
                                                            type="number"
                                                            value={lesson.duration}
                                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'duration', parseInt(e.target.value) || 10)}
                                                            placeholder="10"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm">وصف الدرس</Label>
                                                        <Input
                                                            value={lesson.description}
                                                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                                                            placeholder="وصف مختصر للدرس"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addLesson(moduleIndex)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            إضافة درس
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addModule}
                                className="w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                إضافة وحدة جديدة
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Step 3: Review and Submit */}
                {currentStep === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>مراجعة وإرسال</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-medium text-blue-900 mb-2">ملاحظات مهمة:</h3>
                                    <ul className="text-sm text-blue-800 space-y-1">
                                        <li>• سيتم حفظ الدورة كمسودة ويمكنك تعديلها لاحقاً</li>
                                        <li>• ستحتاج لرفع فيديوهات الدروس قبل النشر</li>
                                        <li>• سيتم مراجعة المحتوى من قبل الإدارة قبل النشر</li>
                                    </ul>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">العنوان:</span>
                                        <p>{formData.titleAr}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">الفئة:</span>
                                        <p>{formData.category}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">عدد الوحدات:</span>
                                        <p>{formData.syllabus.length}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">إجمالي الدروس:</span>
                                        <p>{formData.syllabus.reduce((total, module) => total + module.lessons.length, 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                    >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        السابق
                    </Button>

                    {currentStep < totalSteps ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                        >
                            التالي
                            <ChevronLeft className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={onSubmit}
                            disabled={loading}
                        >
                            {loading ? 'جاري الإنشاء...' : 'إنشاء الدورة'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Clock,
    User,
    Video,
    BookOpen,
    Check,
    X,
    Eye,
    Calendar,
    DollarSign,
    AlertCircle
} from 'lucide-react'

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    category: string
    skillLevel: string
    price: number
    duration: number
    thumbnail: string | null
    createdAt: string
    updatedAt: string
    creator: {
        id: string
        name: string
        email: string
        expertise: string | null
    } | null
    stats: {
        totalLessons: number
        totalEnrollments: number
        videoCount: number
        readyVideos: number
    }
}

interface ReviewModalProps {
    course: Course | null
    isOpen: boolean
    onClose: () => void
    onReview: (courseId: string, action: 'approve' | 'reject', feedback?: string) => void
}

function ReviewModal({ course, isOpen, onClose, onReview }: ReviewModalProps) {
    const [feedback, setFeedback] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    if (!isOpen || !course) return null

    const handleReview = async (action: 'approve' | 'reject') => {
        setIsLoading(true)
        try {
            await onReview(course.id, action, feedback)
            setFeedback('')
            onClose()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">{course.title}</h2>
                            <p className="text-muted-foreground text-lg">{course.titleAr}</p>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-semibold mb-2">Course Details</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Category:</strong> {course.category}</p>
                                <p><strong>Skill Level:</strong> {course.skillLevel}</p>
                                <p><strong>Duration:</strong> {course.duration} minutes</p>
                                <p><strong>Price:</strong> {course.price} EGP</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Creator Info</h3>
                            <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {course.creator?.name}</p>
                                <p><strong>Email:</strong> {course.creator?.email}</p>
                                <p><strong>Expertise:</strong> {course.creator?.expertise || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Course Statistics</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-background rounded">
                                <BookOpen className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                                <p className="text-sm text-muted-foreground">Lessons</p>
                                <p className="font-bold">{course.stats.totalLessons}</p>
                            </div>
                            <div className="text-center p-3 bg-background rounded">
                                <Video className="h-6 w-6 mx-auto mb-1 text-green-600" />
                                <p className="text-sm text-muted-foreground">Videos</p>
                                <p className="font-bold">{course.stats.videoCount}</p>
                            </div>
                            <div className="text-center p-3 bg-background rounded">
                                <Check className="h-6 w-6 mx-auto mb-1 text-green-600" />
                                <p className="text-sm text-muted-foreground">Ready Videos</p>
                                <p className="font-bold">{course.stats.readyVideos}</p>
                            </div>
                            <div className="text-center p-3 bg-background rounded">
                                <User className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                                <p className="text-sm text-muted-foreground">Enrollments</p>
                                <p className="font-bold">{course.stats.totalEnrollments}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-foreground text-sm leading-relaxed">{course.description}</p>
                    </div>

                    <div className="mb-6">
                        <Label htmlFor="feedback">Review Feedback (Optional)</Label>
                        <Textarea
                            id="feedback"
                            placeholder="Add any feedback for the creator..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="mt-2"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-4 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => handleReview('reject')}
                            disabled={isLoading}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Reject Course
                        </Button>
                        <Button
                            onClick={() => handleReview('approve')}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Approve & Publish
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CourseReviewPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchPendingCourses()
    }, [])

    const fetchPendingCourses = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/admin/courses/pending')
            const data = await response.json()

            if (data.success) {
                setCourses(data.courses)
            } else {
                setError(data.error || 'Failed to load courses')
            }
        } catch (err) {
            setError('Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    const handleReviewCourse = async (courseId: string, action: 'approve' | 'reject', feedback?: string) => {
        try {
            const response = await fetch(`/api/admin/courses/${courseId}/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, feedback }),
            })

            const data = await response.json()

            if (data.success) {
                // Remove the course from the list
                setCourses(prev => prev.filter(course => course.id !== courseId))
                // Show success message (you could add toast notifications here)
                alert(`Course ${action}d successfully!`)
            } else {
                alert(data.error || 'Failed to process review')
            }
        } catch (err) {
            alert('Failed to process review')
        }
    }

    const openReviewModal = (course: Course) => {
        setSelectedCourse(course)
        setIsModalOpen(true)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading pending courses...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 font-medium">{error}</p>
                    <Button onClick={fetchPendingCourses} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Course Review</h1>
                <p className="text-muted-foreground mt-2">Review and approve courses submitted by creators</p>
            </div>

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="text-center py-12">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No courses pending review</h3>
                        <p className="text-muted-foreground">All submitted courses have been reviewed.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                                        <CardDescription className="text-base">{course.titleAr}</CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        Under Review
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{course.creator?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {new Date(course.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{course.price} EGP</span>
                                    </div>
                                </div>
