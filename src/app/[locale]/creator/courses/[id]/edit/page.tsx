'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

// Icon Components with lazy loading
const IconComponents = {
    ArrowLeft: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft }))),
    Home: lazy(() => import('lucide-react').then(mod => ({ default: mod.Home }))),
    Save: lazy(() => import('lucide-react').then(mod => ({ default: mod.Save }))),
    Eye: lazy(() => import('lucide-react').then(mod => ({ default: mod.Eye }))),
    Upload: lazy(() => import('lucide-react').then(mod => ({ default: mod.Upload }))),
    Video: lazy(() => import('lucide-react').then(mod => ({ default: mod.Video }))),
    FileText: lazy(() => import('lucide-react').then(mod => ({ default: mod.FileText }))),
    Plus: lazy(() => import('lucide-react').then(mod => ({ default: mod.Plus }))),
    Trash2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Trash2 }))),
    GripVertical: lazy(() => import('lucide-react').then(mod => ({ default: mod.GripVertical }))),
    Loader2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Loader2 }))),
    Settings: lazy(() => import('lucide-react').then(mod => ({ default: mod.Settings }))),
    ImageIcon: lazy(() => import('lucide-react').then(mod => ({ default: mod.Image }))),
    Edit: lazy(() => import('lucide-react').then(mod => ({ default: mod.Edit }))),
    Play: lazy(() => import('lucide-react').then(mod => ({ default: mod.Play }))),
    Clock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock }))),
    Target: lazy(() => import('lucide-react').then(mod => ({ default: mod.Target }))),
    Users: lazy(() => import('lucide-react').then(mod => ({ default: mod.Users }))),
    X: lazy(() => import('lucide-react').then(mod => ({ default: mod.X }))),
    ClipboardList: lazy(() => import('lucide-react').then(mod => ({ default: mod.ClipboardList }))),
    Calendar: lazy(() => import('lucide-react').then(mod => ({ default: mod.Calendar }))),
    GraduationCap: lazy(() => import('lucide-react').then(mod => ({ default: mod.GraduationCap }))),
    TrendingUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp }))),
    Award: lazy(() => import('lucide-react').then(mod => ({ default: mod.Award }))),
    CheckCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle }))),
    AlertCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.AlertCircle }))),
    List: lazy(() => import('lucide-react').then(mod => ({ default: mod.List })))
}

// Dynamic Icon Component
type IconName = keyof typeof IconComponents;

interface DynamicIconProps {
    name: IconName;
    className?: string;
    [key: string]: any;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className, ...props }) => {
    const IconComponent = IconComponents[name]
    
    return (
        <Suspense fallback={<div className={className} />}>
            <IconComponent className={className} {...props} />
        </Suspense>
    )
}

interface Course {
    id: string
    title: string
    titleAr: string | null
    description: string
    descriptionAr: string | null
    thumbnail: string | null
    category: string
    skillLevel: string
    duration: number
    language: string
    contentCategory: string
    price: number
    status: string
}

interface Lesson {
    id: string
    title: string
    titleAr: string | null
    description: string | null
    descriptionAr: string | null
    videoUrl: string
    duration: number
    order: number
    seasonNumber: number | null
    episodeNumber: number | null
}

interface Quiz {
    id: string
    title: string
    titleAr: string | null
    description: string | null
    timeLimit: number | null
    passingScore: number
    maxAttempts: number
    shuffleQuestions: boolean
    questions: Question[]
    _count: {
        attempts: number
    }
    lesson?: {
        id: string
        title: string
    } | null
}

interface Question {
    id: string
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'
    question: string
    questionAr?: string | null
    options?: any
    correctAnswer: string
    explanation?: string | null
    points: number
    order: number
}

interface Assignment {
    id: string
    title: string
    titleAr: string | null
    description: string
    descriptionAr: string | null
    instructions: string | null
    instructionsAr: string | null
    dueDate: Date | null
    maxPoints: number
    allowLateSubmission: boolean
    _count: {
        submissions: number
    }
    lesson?: {
        id: string
        title: string
    } | null
}

export default function EditCourse() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const courseId = params.id as string
    const isArabic = locale === 'ar'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [course, setCourse] = useState<Course | null>(null)
    const [activeTab, setActiveTab] = useState('details')

    // Lessons state
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [lessonsLoading, setLessonsLoading] = useState(false)
    const [showAddLesson, setShowAddLesson] = useState(false)
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

    // Lesson form data
    const [lessonTitle, setLessonTitle] = useState('')
    const [lessonTitleAr, setLessonTitleAr] = useState('')
    const [lessonDescription, setLessonDescription] = useState('')
    const [lessonDescriptionAr, setLessonDescriptionAr] = useState('')
    const [lessonVideo, setLessonVideo] = useState<File | null>(null)
    const [lessonVideoPreview, setLessonVideoPreview] = useState('')
    const [lessonDuration, setLessonDuration] = useState(0)
    const [lessonSeasonNumber, setLessonSeasonNumber] = useState<number | null>(null)
    const [lessonEpisodeNumber, setLessonEpisodeNumber] = useState<number | null>(null)
    const [uploadingLesson, setUploadingLesson] = useState(false)

    // Form data
    const [title, setTitle] = useState('')
    const [titleAr, setTitleAr] = useState('')
    const [description, setDescription] = useState('')
    const [descriptionAr, setDescriptionAr] = useState('')
    const [category, setCategory] = useState('')
    const [skillLevel, setSkillLevel] = useState('Beginner')
    const [duration, setDuration] = useState(0)
    const [language, setLanguage] = useState('en')
    const [contentCategory, setContentCategory] = useState('CATEGORY_A')
    const [price, setPrice] = useState(0)
    const [thumbnail, setThumbnail] = useState<File | null>(null)
    const [thumbnailPreview, setThumbnailPreview] = useState('')

    // Settings data
    const [maxStudents, setMaxStudents] = useState<number | null>(null)
    const [enrollmentEndDate, setEnrollmentEndDate] = useState<string>('')
    const [savingSettings, setSavingSettings] = useState(false)

    // Quizzes state
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [quizzesLoading, setQuizzesLoading] = useState(false)
    const [showAddQuiz, setShowAddQuiz] = useState(false)
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
    const [quizTitle, setQuizTitle] = useState('')
    const [quizTitleAr, setQuizTitleAr] = useState('')
    const [quizDescription, setQuizDescription] = useState('')
    const [quizTimeLimit, setQuizTimeLimit] = useState<number | null>(null)
    const [quizPassingScore, setQuizPassingScore] = useState(70)
    const [quizMaxAttempts, setQuizMaxAttempts] = useState(3)
    const [quizQuestions, setQuizQuestions] = useState<any[]>([])
    const [savingQuiz, setSavingQuiz] = useState(false)

    // Assignments state
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [assignmentsLoading, setAssignmentsLoading] = useState(false)
    const [showAddAssignment, setShowAddAssignment] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
    const [assignmentTitle, setAssignmentTitle] = useState('')
    const [assignmentTitleAr, setAssignmentTitleAr] = useState('')
    const [assignmentDescription, setAssignmentDescription] = useState('')
    const [assignmentDescriptionAr, setAssignmentDescriptionAr] = useState('')
    const [assignmentInstructions, setAssignmentInstructions] = useState('')
    const [assignmentDueDate, setAssignmentDueDate] = useState<string>('')
    const [assignmentMaxScore, setAssignmentMaxScore] = useState(100)
    const [assignmentAllowLate, setAssignmentAllowLate] = useState(true)
    const [assignmentRequireFile, setAssignmentRequireFile] = useState(true)
    const [savingAssignment, setSavingAssignment] = useState(false)

    // Students progress state
    const [studentsData, setStudentsData] = useState<any[]>([])
    const [studentsLoading, setStudentsLoading] = useState(false)
    const [studentsSummary, setStudentsSummary] = useState<any>(null)

    // Grading state
    const [submissions, setSubmissions] = useState<any[]>([])
    const [submissionsLoading, setSubmissionsLoading] = useState(false)
    const [submissionsStats, setSubmissionsStats] = useState<any>(null)
    const [gradingFilter, setGradingFilter] = useState('ungraded')
    const [gradingSubmission, setGradingSubmission] = useState<any>(null)
    const [gradeScore, setGradeScore] = useState(0)
    const [gradeFeedback, setGradeFeedback] = useState('')
    const [savingGrade, setSavingGrade] = useState(false)

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

    useEffect(() => {
        if (session?.user && courseId) {
            fetchCourse()
        }
    }, [session, courseId])

    const fetchCourse = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.course) {
                    const courseData = data.course
                    setCourse(courseData)
                    setTitle(courseData.title)
                    setTitleAr(courseData.titleAr || '')
                    setDescription(courseData.description)
                    setDescriptionAr(courseData.descriptionAr || '')
                    setCategory(courseData.category)
                    setSkillLevel(courseData.skillLevel)
                    setDuration(courseData.duration)
                    setLanguage(courseData.language)
                    setContentCategory(courseData.contentCategory)
                    setPrice(courseData.price)
                    if (courseData.thumbnail) {
                        setThumbnailPreview(courseData.thumbnail)
                    }
                    // Load enrollment settings
                    setMaxStudents(courseData.maxStudents || null)
                    setEnrollmentEndDate(
                        courseData.enrollmentEndDate 
                            ? new Date(courseData.enrollmentEndDate).toISOString().split('T')[0]
                            : ''
                    )
                }
            } else {
                toast.error(isArabic ? 'فشل تحميل الدورة' : 'Failed to load course')
                router.push(`/${locale}/creator/courses`)
            }
        } catch (error) {
            console.error('Failed to fetch course:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setThumbnail(file)
            const url = URL.createObjectURL(file)
            setThumbnailPreview(url)
        }
    }

    const handleSave = async () => {
        if (!title.trim() || !description.trim() || !category) {
            toast.error(isArabic ? 'الرجاء ملء جميع الحقول المطلوبة' : 'Please fill all required fields')
            return
        }

        setSaving(true)

        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('titleAr', titleAr || title)
            formData.append('description', description)
            formData.append('descriptionAr', descriptionAr || description)
            formData.append('category', category)
            formData.append('skillLevel', skillLevel)
            formData.append('duration', duration.toString())
            formData.append('language', language)
            formData.append('contentCategory', contentCategory)
            formData.append('price', price.toString())
            
            if (thumbnail) {
                formData.append('thumbnail', thumbnail)
            }

            const response = await fetch(`/api/creator/courses/${courseId}`, {
                method: 'PATCH',
                body: formData
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حفظ التغييرات!' : 'Changes saved!')
                fetchCourse() // Reload course data
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حفظ التغييرات' : 'Failed to save changes'))
            }
        } catch (error) {
            console.error('Failed to save course:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    // Lesson management functions
    const fetchLessons = async () => {
        setLessonsLoading(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/lessons`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setLessons(data.lessons)
                }
            }
        } catch (error) {
            console.error('Failed to fetch lessons:', error)
        } finally {
            setLessonsLoading(false)
        }
    }

    const resetLessonForm = () => {
        setLessonTitle('')
        setLessonTitleAr('')
        setLessonDescription('')
        setLessonDescriptionAr('')
        setLessonVideo(null)
        setLessonVideoPreview('')
        setLessonDuration(0)
        setLessonSeasonNumber(null)
        setLessonEpisodeNumber(null)
        setEditingLesson(null)
        setShowAddLesson(false)
    }

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLessonVideo(file)
            const url = URL.createObjectURL(file)
            setLessonVideoPreview(url)
            
            // Get video duration
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src)
                const durationInMinutes = Math.ceil(video.duration / 60)
                setLessonDuration(durationInMinutes)
            }
            video.src = url
        }
    }

    const handleAddLesson = async () => {
        if (!lessonTitle.trim() || !lessonVideo) {
            toast.error(isArabic ? 'الرجاء إدخال العنوان ورفع الفيديو' : 'Please enter title and upload video')
            return
        }

        setUploadingLesson(true)

        try {
            const formData = new FormData()
            formData.append('title', lessonTitle)
            formData.append('titleAr', lessonTitleAr || '')
            formData.append('description', lessonDescription || '')
            formData.append('descriptionAr', lessonDescriptionAr || '')
            formData.append('video', lessonVideo)
            formData.append('duration', lessonDuration.toString())
            if (lessonSeasonNumber) formData.append('seasonNumber', lessonSeasonNumber.toString())
            if (lessonEpisodeNumber) formData.append('episodeNumber', lessonEpisodeNumber.toString())

            const response = await fetch(`/api/creator/courses/${courseId}/lessons`, {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إضافة الدرس!' : 'Lesson added!')
                resetLessonForm()
                fetchLessons()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل إضافة الدرس' : 'Failed to add lesson'))
            }
        } catch (error) {
            console.error('Failed to add lesson:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setUploadingLesson(false)
        }
    }

    const handleEditLesson = (lesson: Lesson) => {
        setEditingLesson(lesson)
        setLessonTitle(lesson.title)
        setLessonTitleAr(lesson.titleAr || '')
        setLessonDescription(lesson.description || '')
        setLessonDescriptionAr(lesson.descriptionAr || '')
        setLessonVideoPreview(lesson.videoUrl)
        setLessonDuration(lesson.duration)
        setLessonSeasonNumber(lesson.seasonNumber)
        setLessonEpisodeNumber(lesson.episodeNumber)
        setShowAddLesson(true)
    }

    const handleUpdateLesson = async () => {
        if (!editingLesson || !lessonTitle.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال العنوان' : 'Please enter title')
            return
        }

        setUploadingLesson(true)

        try {
            const formData = new FormData()
            formData.append('title', lessonTitle)
            formData.append('titleAr', lessonTitleAr || '')
            formData.append('description', lessonDescription || '')
            formData.append('descriptionAr', lessonDescriptionAr || '')
            if (lessonVideo) {
                formData.append('video', lessonVideo)
            }
            formData.append('duration', lessonDuration.toString())
            if (lessonSeasonNumber) formData.append('seasonNumber', lessonSeasonNumber.toString())
            if (lessonEpisodeNumber) formData.append('episodeNumber', lessonEpisodeNumber.toString())

            const response = await fetch(`/api/creator/courses/${courseId}/lessons/${editingLesson.id}`, {
                method: 'PATCH',
                body: formData
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم تحديث الدرس!' : 'Lesson updated!')
                resetLessonForm()
                fetchLessons()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل تحديث الدرس' : 'Failed to update lesson'))
            }
        } catch (error) {
            console.error('Failed to update lesson:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setUploadingLesson(false)
        }
    }

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الدرس؟' : 'Are you sure you want to delete this lesson?')) {
            return
        }

        try {
            const response = await fetch(`/api/creator/courses/${courseId}/lessons/${lessonId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حذف الدرس!' : 'Lesson deleted!')
                fetchLessons()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حذف الدرس' : 'Failed to delete lesson'))
            }
        } catch (error) {
            console.error('Failed to delete lesson:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const handleSaveEnrollmentSettings = async () => {
        setSavingSettings(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    maxStudents: maxStudents || null,
                    enrollmentEndDate: enrollmentEndDate || null
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حفظ الإعدادات!' : 'Settings saved!')
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حفظ الإعدادات' : 'Failed to save settings'))
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSavingSettings(false)
        }
    }

    // Quiz management functions
    const fetchQuizzes = async () => {
        setQuizzesLoading(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/quizzes`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setQuizzes(data.quizzes)
                }
            }
        } catch (error) {
            console.error('Failed to fetch quizzes:', error)
            toast.error(isArabic ? 'فشل تحميل الاختبارات' : 'Failed to load quizzes')
        } finally {
            setQuizzesLoading(false)
        }
    }

    const handleAddQuiz = () => {
        setEditingQuiz(null)
        setQuizTitle('')
        setQuizTitleAr('')
        setQuizDescription('')
        setQuizTimeLimit(null)
        setQuizPassingScore(70)
        setQuizMaxAttempts(3)
        setQuizQuestions([{
            type: 'MULTIPLE_CHOICE',
            question: '',
            questionAr: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            points: 10
        }])
        setShowAddQuiz(true)
    }

    const handleEditQuiz = (quiz: Quiz) => {
        setEditingQuiz(quiz)
        setQuizTitle(quiz.title)
        setQuizTitleAr(quiz.titleAr || '')
        setQuizDescription(quiz.description || '')
        setQuizTimeLimit(quiz.timeLimit)
        setQuizPassingScore(quiz.passingScore)
        setQuizMaxAttempts(quiz.maxAttempts || 3)
        setQuizQuestions(quiz.questions)
        setShowAddQuiz(true)
    }

    const handleSaveQuiz = async () => {
        if (!quizTitle.trim()) {
            toast.error(isArabic ? 'عنوان الاختبار مطلوب' : 'Quiz title is required')
            return
        }

        if (quizQuestions.length === 0) {
            toast.error(isArabic ? 'الاختبار يجب أن يحتوي على سؤال واحد على الأقل' : 'At least one question is required')
            return
        }

        setSavingQuiz(true)
        try {
            const quizData = {
                title: quizTitle,
                titleAr: quizTitleAr || null,
                description: quizDescription || null,
                timeLimit: quizTimeLimit,
                passingScore: quizPassingScore,
                maxAttempts: quizMaxAttempts,
                questions: quizQuestions
            }

            const url = editingQuiz 
                ? `/api/creator/courses/${courseId}/quizzes/${editingQuiz.id}`
                : `/api/creator/courses/${courseId}/quizzes`
            
            const method = editingQuiz ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizData)
            })

            if (response.ok) {
                toast.success(editingQuiz 
                    ? (isArabic ? 'تم تحديث الاختبار!' : 'Quiz updated!') 
                    : (isArabic ? 'تم إنشاء الاختبار!' : 'Quiz created!')
                )
                setShowAddQuiz(false)
                fetchQuizzes()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حفظ الاختبار' : 'Failed to save quiz'))
            }
        } catch (error) {
            console.error('Error saving quiz:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSavingQuiz(false)
        }
    }

    const handleDeleteQuiz = async (quizId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الاختبار؟' : 'Are you sure you want to delete this quiz?')) return

        try {
            const response = await fetch(`/api/creator/courses/${courseId}/quizzes/${quizId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حذف الاختبار!' : 'Quiz deleted!')
                fetchQuizzes()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حذف الاختبار' : 'Failed to delete quiz'))
            }
        } catch (error) {
            console.error('Error deleting quiz:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const addQuestion = () => {
        setQuizQuestions([...quizQuestions, {
            type: 'MULTIPLE_CHOICE',
            question: '',
            questionAr: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            points: 10
        }])
    }

    const updateQuestion = (index: number, field: string, value: any) => {
        const updated = [...quizQuestions]
        updated[index] = { ...updated[index], [field]: value }
        setQuizQuestions(updated)
    }

    const removeQuestion = (index: number) => {
        setQuizQuestions(quizQuestions.filter((_, i) => i !== index))
    }

    const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
        const updated = [...quizQuestions]
        const options = [...updated[questionIndex].options]
        options[optionIndex] = value
        updated[questionIndex] = { ...updated[questionIndex], options }
        setQuizQuestions(updated)
    }

    // Assignment management functions
    const fetchAssignments = async () => {
        setAssignmentsLoading(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/assignments`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setAssignments(data.assignments)
                }
            }
        } catch (error) {
            console.error('Failed to fetch assignments:', error)
            toast.error(isArabic ? 'فشل تحميل الواجبات' : 'Failed to load assignments')
        } finally {
            setAssignmentsLoading(false)
        }
    }

    const handleAddAssignment = () => {
        setEditingAssignment(null)
        setAssignmentTitle('')
        setAssignmentTitleAr('')
        setAssignmentDescription('')
        setAssignmentDescriptionAr('')
        setAssignmentInstructions('')
        setAssignmentDueDate('')
        setAssignmentMaxScore(100)
        setAssignmentAllowLate(true)
        setAssignmentRequireFile(true)
        setShowAddAssignment(true)
    }

    const handleEditAssignment = (assignment: Assignment) => {
        setEditingAssignment(assignment)
        setAssignmentTitle(assignment.title)
        setAssignmentTitleAr(assignment.titleAr || '')
        setAssignmentDescription(assignment.description)
        setAssignmentDescriptionAr(assignment.descriptionAr || '')
        setAssignmentInstructions(assignment.instructions || '')
        setAssignmentDueDate(assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '')
        setAssignmentMaxScore(assignment.maxPoints)
        setAssignmentAllowLate(assignment.allowLateSubmission)
        setAssignmentRequireFile(true)
        setShowAddAssignment(true)
    }

    const handleSaveAssignment = async () => {
        if (!assignmentTitle.trim() || !assignmentDescription.trim()) {
            toast.error(isArabic ? 'العنوان والوصف مطلوبان' : 'Title and description are required')
            return
        }

        setSavingAssignment(true)
        try {
            const assignmentData = {
                title: assignmentTitle,
                titleAr: assignmentTitleAr || null,
                description: assignmentDescription,
                descriptionAr: assignmentDescriptionAr || null,
                instructions: assignmentInstructions || null,
                dueDate: assignmentDueDate || null,
                maxScore: assignmentMaxScore,
                allowLateSubmission: assignmentAllowLate,
                requireFile: assignmentRequireFile
            }

            const url = editingAssignment 
                ? `/api/creator/courses/${courseId}/assignments/${editingAssignment.id}`
                : `/api/creator/courses/${courseId}/assignments`
            
            const method = editingAssignment ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignmentData)
            })

            if (response.ok) {
                toast.success(editingAssignment 
                    ? (isArabic ? 'تم تحديث الواجب!' : 'Assignment updated!') 
                    : (isArabic ? 'تم إنشاء الواجب!' : 'Assignment created!')
                )
                setShowAddAssignment(false)
                fetchAssignments()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حفظ الواجب' : 'Failed to save assignment'))
            }
        } catch (error) {
            console.error('Error saving assignment:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSavingAssignment(false)
        }
    }

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا الواجب؟' : 'Are you sure you want to delete this assignment?')) return

        try {
            const response = await fetch(`/api/creator/courses/${courseId}/assignments/${assignmentId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حذف الواجب!' : 'Assignment deleted!')
                fetchAssignments()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حذف الواجب' : 'Failed to delete assignment'))
            }
        } catch (error) {
            console.error('Error deleting assignment:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    // Students progress function
    const fetchStudentsProgress = async () => {
        setStudentsLoading(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/students`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setStudentsData(data.students)
                    setStudentsSummary(data.summary)
                }
            }
        } catch (error) {
            console.error('Failed to fetch students progress:', error)
            toast.error(isArabic ? 'فشل تحميل بيانات الطلاب' : 'Failed to load students data')
        } finally {
            setStudentsLoading(false)
        }
    }

    // Grading functions
    const fetchSubmissions = async () => {
        setSubmissionsLoading(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/submissions?filter=${gradingFilter}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setSubmissions(data.submissions.assignments)
                    setSubmissionsStats(data.stats)
                }
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error)
            toast.error(isArabic ? 'فشل تحميل التسليمات' : 'Failed to load submissions')
        } finally {
            setSubmissionsLoading(false)
        }
    }

    const handleGradeSubmission = (submission: any) => {
        setGradingSubmission(submission)
        setGradeScore(submission.score || 0)
        setGradeFeedback(submission.feedback || '')
    }

    const handleSaveGrade = async () => {
        if (!gradingSubmission) return

        setSavingGrade(true)
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/submissions/${gradingSubmission.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: gradeScore,
                    feedback: gradeFeedback
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حفظ التقييم!' : 'Grade saved!')
                setGradingSubmission(null)
                fetchSubmissions()
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل حفظ التقييم' : 'Failed to save grade'))
            }
        } catch (error) {
            console.error('Error saving grade:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSavingGrade(false)
        }
    }

    useEffect(() => {
        if (activeTab === 'content' && lessons.length === 0) {
            fetchLessons()
        }
        if (activeTab === 'quizzes' && quizzes.length === 0) {
            fetchQuizzes()
        }
        if (activeTab === 'assignments' && assignments.length === 0) {
            fetchAssignments()
        }
        if (activeTab === 'students' && studentsData.length === 0) {
            fetchStudentsProgress()
        }
        if (activeTab === 'grading') {
            fetchSubmissions()
        }
    }, [activeTab, gradingFilter])

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <DynamicIcon name="Loader2" className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <DynamicIcon name="Loader2" className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/${locale}/creator/courses`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <DynamicIcon name="ArrowLeft" className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <DynamicIcon name="Home" className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <div>
                            <h1 className="text-lg font-bold">
                                {isArabic ? 'تعديل الدورة' : 'Edit Course'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {course?.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/${locale}/courses/${courseId}`)}
                        >
                            <DynamicIcon name="Eye" className="w-4 h-4 mr-2" />
                            {isArabic ? 'معاينة' : 'Preview'}
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                        >
                            {saving ? (
                                <>
                                    <DynamicIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                </>
                            ) : (
                                <>
                                    <DynamicIcon name="Save" className="w-4 h-4 mr-2" />
                                    {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-border">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'details'
                                ? 'border-b-2 border-purple-500 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <DynamicIcon name="FileText" className="w-4 h-4 inline mr-2" />
                        {isArabic ? 'التفاصيل' : 'Details'}
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'content'
                                ? 'border-b-2 border-purple-500 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <DynamicIcon name="Video" className="w-4 h-4 inline mr-2" />
                        {isArabic ? 'المحتوى' : 'Content'}
                    </button>
                    <button
                        onClick={() => setActiveTab('quizzes')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'quizzes'
                                ? 'border-b-2 border-purple-500 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <DynamicIcon name="FileText" className="w-4 h-4 inline mr-2" />
                        {isArabic ? 'الاختبارات' : 'Quizzes'}
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'assignments'
                                ? 'border-b-2 border-purple-500 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <DynamicIcon name="ClipboardList" className="w-4 h-4 inline mr-2" />
                        {isArabic ? 'الواجبات' : 'Assignments'}
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'students'
                                ? 'border-b-2 border-purple-500 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <DynamicIcon name="GraduationCap" className="w-4 h-4 inline mr-2" />
                        {isArabic ? 'الطلاب' : 'Students'}
                    </button>
                    <button
                        onClick={() => setActiveTab('grading')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'grading'
                                ? 'border-b-2 border-purple-500 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <DynamicIcon name="CheckCircle" className="w-4 h-4 inline mr-2" />
                        {isArabic ? 'التقييم' : 'Grading'}
                        {submissionsStats && submissionsStats.ungradedAssignments > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {submissionsStats.ungradedAssignments}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-3 font-semibold transition-all ${
                            activeTab === 'settings'
                                ? 'border-b-2 border-purple-500 text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <DynamicIcon name="Settings" className="w-4 h-4 inline mr-2" />
                        {isArabic ? 'الإعدادات' : 'Settings'}
                    </button>
                </div>

                {/* Details Tab */}
                {activeTab === 'details' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Basic Info */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">
                                {isArabic ? 'المعلومات الأساسية' : 'Basic Information'}
                            </h2>
                            
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'عنوان الدورة (بالإنجليزية)' : 'Course Title (English)'} *
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            maxLength={100}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'عنوان الدورة (بالعربية)' : 'Course Title (Arabic)'}
                                        </label>
                                        <input
                                            type="text"
                                            value={titleAr}
                                            onChange={(e) => setTitleAr(e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            maxLength={100}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'وصف الدورة (بالإنجليزية)' : 'Course Description (English)'} *
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        maxLength={1000}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {description.length}/1000
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'وصف الدورة (بالعربية)' : 'Course Description (Arabic)'}
                                    </label>
                                    <textarea
                                        value={descriptionAr}
                                        onChange={(e) => setDescriptionAr(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        maxLength={1000}
                                    />
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'الفئة' : 'Category'} *
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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
                                            min="0"
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                        <option value="ar">العربية</option>
                                        <option value="de">Deutsch</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">
                                {isArabic ? 'صورة الدورة' : 'Course Thumbnail'}
                            </h2>
                            
                            <div className="space-y-4">
                                {thumbnailPreview && (
                                    <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden">
                                        <Image
                                            src={thumbnailPreview}
                                            alt="Thumbnail preview"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailSelect}
                                        className="hidden"
                                        id="thumbnail-upload"
                                    />
                                    <label htmlFor="thumbnail-upload">
                                        <Button variant="outline" className="cursor-pointer" asChild>
                                            <span>
                                                <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                                {isArabic ? 'تحميل صورة جديدة' : 'Upload New Image'}
                                            </span>
                                        </Button>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">
                                {isArabic ? 'التسعير' : 'Pricing'}
                            </h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'نوع المحتوى' : 'Content Category'} *
                                    </label>
                                    <select
                                        value={contentCategory}
                                        onChange={(e) => setContentCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="CATEGORY_A">
                                            {isArabic ? 'الفئة أ - الوصول الشامل' : 'Category A - All Access'}
                                        </option>
                                        <option value="CATEGORY_B">
                                            {isArabic ? 'الفئة ب - المميز' : 'Category B - Signature'}
                                        </option>
                                    </select>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {isArabic
                                            ? 'الفئة أ: متاح لجميع المشتركين. الفئة ب: يتطلب شراء منفصل'
                                            : 'Category A: Available to all subscribers. Category B: Requires separate purchase'}
                                    </p>
                                </div>

                                {contentCategory === 'CATEGORY_B' && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'السعر (جنيه مصري)' : 'Price (EGP)'} *
                                        </label>
                                        <input
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Content Tab */}
                {activeTab === 'content' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Add/Edit Lesson Form */}
                        {showAddLesson && (
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">
                                        {editingLesson 
                                            ? (isArabic ? 'تعديل الدرس' : 'Edit Lesson')
                                            : (isArabic ? 'إضافة درس جديد' : 'Add New Lesson')
                                        }
                                    </h2>
                                    <button
                                        onClick={resetLessonForm}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                {isArabic ? 'عنوان الدرس (بالإنجليزية)' : 'Lesson Title (English)'} *
                                            </label>
                                            <input
                                                type="text"
                                                value={lessonTitle}
                                                onChange={(e) => setLessonTitle(e.target.value)}
                                                placeholder={isArabic ? 'مثال: Introduction to React' : 'e.g., Introduction to React'}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                {isArabic ? 'عنوان الدرس (بالعربية)' : 'Lesson Title (Arabic)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={lessonTitleAr}
                                                onChange={(e) => setLessonTitleAr(e.target.value)}
                                                placeholder={isArabic ? 'مثال: مقدمة إلى React' : 'e.g., مقدمة إلى React'}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'فيديو الدرس' : 'Lesson Video'} *
                                        </label>
                                        
                                        {lessonVideoPreview && (
                                            <div className="mb-4">
                                                <video 
                                                    src={lessonVideoPreview} 
                                                    controls 
                                                    className="w-full max-w-md rounded-lg"
                                                />
                                            </div>
                                        )}
                                        
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoSelect}
                                            className="hidden"
                                            id="lesson-video-upload"
                                        />
                                        <label htmlFor="lesson-video-upload">
                                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition-colors">
                                                <DynamicIcon name="Upload" className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                                <p className="text-sm font-semibold mb-1">
                                                    {lessonVideo 
                                                        ? lessonVideo.name
                                                        : (isArabic ? 'انقر لرفع الفيديو' : 'Click to upload video')
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic ? 'MP4, WebM, أو MOV (الحد الأقصى 500 ميجابايت)' : 'MP4, WebM, or MOV (max 500MB)'}
                                                </p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                {isArabic ? 'المدة (بالدقائق)' : 'Duration (minutes)'}
                                            </label>
                                            <input
                                                type="number"
                                                value={lessonDuration}
                                                onChange={(e) => setLessonDuration(parseInt(e.target.value) || 0)}
                                                min="0"
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                {isArabic ? 'رقم الموسم' : 'Season Number'}
                                            </label>
                                            <input
                                                type="number"
                                                value={lessonSeasonNumber || ''}
                                                onChange={(e) => setLessonSeasonNumber(e.target.value ? parseInt(e.target.value) : null)}
                                                min="1"
                                                placeholder={isArabic ? 'اختياري' : 'Optional'}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold mb-2">
                                                {isArabic ? 'رقم الحلقة' : 'Episode Number'}
                                            </label>
                                            <input
                                                type="number"
                                                value={lessonEpisodeNumber || ''}
                                                onChange={(e) => setLessonEpisodeNumber(e.target.value ? parseInt(e.target.value) : null)}
                                                min="1"
                                                placeholder={isArabic ? 'اختياري' : 'Optional'}
                                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'وصف الدرس (بالإنجليزية)' : 'Lesson Description (English)'}
                                        </label>
                                        <textarea
                                            value={lessonDescription}
                                            onChange={(e) => setLessonDescription(e.target.value)}
                                            rows={3}
                                            placeholder={isArabic ? 'اشرح محتوى الدرس...' : 'Explain the lesson content...'}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'وصف الدرس (بالعربية)' : 'Lesson Description (Arabic)'}
                                        </label>
                                        <textarea
                                            value={lessonDescriptionAr}
                                            onChange={(e) => setLessonDescriptionAr(e.target.value)}
                                            rows={3}
                                            placeholder={isArabic ? 'اشرح محتوى الدرس...' : 'Explain the lesson content...'}
                                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <Button variant="outline" onClick={resetLessonForm}>
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                        </Button>
                                        <Button
                                            onClick={editingLesson ? handleUpdateLesson : handleAddLesson}
                                            disabled={uploadingLesson}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                                        >
                                            {uploadingLesson ? (
                                                <>
                                                    <DynamicIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                                                    {isArabic ? 'جاري الرفع...' : 'Uploading...'}
                                                </>
                                            ) : (
                                                editingLesson 
                                                    ? (isArabic ? 'تحديث الدرس' : 'Update Lesson')
                                                    : (isArabic ? 'إضافة الدرس' : 'Add Lesson')
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lessons List */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">
                                    {isArabic ? 'دروس الدورة' : 'Course Lessons'}
                                </h2>
                                {!showAddLesson && (
                                    <Button
                                        onClick={() => setShowAddLesson(true)}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                                    >
                                        <DynamicIcon name="Plus" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'إضافة درس' : 'Add Lesson'}
                                    </Button>
                                )}
                            </div>

                            {lessonsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <DynamicIcon name="Loader2" className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                            ) : lessons.length === 0 ? (
                                <div className="text-center py-12">
                                    <DynamicIcon name="Video" className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        {isArabic ? 'لا توجد دروس بعد' : 'No lessons yet'}
                                    </p>
                                    <Button
                                        onClick={() => setShowAddLesson(true)}
                                        variant="outline"
                                    >
                                        <DynamicIcon name="Plus" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'إضافة أول درس' : 'Add First Lesson'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {lessons.map((lesson, index) => (
                                        <motion.div
                                            key={lesson.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg hover:bg-accent transition-colors group"
                                        >
                                            <div className="cursor-grab text-muted-foreground">
                                                <DynamicIcon name="GripVertical" className="w-5 h-5" />
                                            </div>

                                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                                <DynamicIcon name="Play" className="w-6 h-6 text-purple-500" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-muted-foreground">
                                                        #{lesson.order}
                                                    </span>
                                                    <h3 className="font-semibold truncate">
                                                        {lesson.title}
                                                    </h3>
                                                    {lesson.seasonNumber && lesson.episodeNumber && (
                                                        <span className="text-sm text-muted-foreground">
                                                            S{lesson.seasonNumber}E{lesson.episodeNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                {lesson.description && (
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {lesson.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <DynamicIcon name="Clock" className="w-3 h-3" />
                                                        {lesson.duration} {isArabic ? 'دقيقة' : 'min'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditLesson(lesson)}
                                                    className="p-2 hover:bg-background rounded-lg transition-colors"
                                                >
                                                    <DynamicIcon name="Edit" className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                                >
                                                    <DynamicIcon name="Trash2" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Visibility & Status */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">
                                {isArabic ? 'الحالة والرؤية' : 'Status & Visibility'}
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'حالة الدورة' : 'Course Status'}
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`/api/creator/courses/${courseId}/status`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ status: 'DRAFT' })
                                                    })
                                                    if (response.ok) {
                                                        toast.success(isArabic ? 'تم التحديث!' : 'Updated!')
                                                        fetchCourse()
                                                    }
                                                } catch (error) {
                                                    toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                                course?.status === 'DRAFT'
                                                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-600'
                                                    : 'border-border hover:bg-accent'
                                            }`}
                                        >
                                            {isArabic ? 'مسودة' : 'Draft'}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`/api/creator/courses/${courseId}/status`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ status: 'PUBLISHED' })
                                                    })
                                                    if (response.ok) {
                                                        toast.success(isArabic ? 'تم النشر!' : 'Published!')
                                                        fetchCourse()
                                                    }
                                                } catch (error) {
                                                    toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                                course?.status === 'PUBLISHED'
                                                    ? 'border-green-500 bg-green-500/20 text-green-600'
                                                    : 'border-border hover:bg-accent'
                                            }`}
                                        >
                                            {isArabic ? 'منشور' : 'Published'}
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(`/api/creator/courses/${courseId}/status`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ status: 'ARCHIVED' })
                                                    })
                                                    if (response.ok) {
                                                        toast.success(isArabic ? 'تم الأرشفة!' : 'Archived!')
                                                        fetchCourse()
                                                    }
                                                } catch (error) {
                                                    toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                                course?.status === 'ARCHIVED'
                                                    ? 'border-gray-500 bg-gray-500/20 text-gray-600'
                                                    : 'border-border hover:bg-accent'
                                            }`}
                                        >
                                            {isArabic ? 'مؤرشف' : 'Archived'}
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {course?.status === 'DRAFT' && (isArabic 
                                            ? 'الدورة مخفية عن الطلاب ويمكنك العمل عليها'
                                            : 'Course is hidden from students and you can work on it')}
                                        {course?.status === 'PUBLISHED' && (isArabic 
                                            ? 'الدورة مرئية للطلاب ويمكنهم التسجيل فيها'
                                            : 'Course is visible to students and they can enroll')}
                                        {course?.status === 'ARCHIVED' && (isArabic 
                                            ? 'الدورة مؤرشفة ولا يمكن للطلاب الجدد التسجيل فيها'
                                            : 'Course is archived and new students cannot enroll')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SEO Settings */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">
                                {isArabic ? 'إعدادات SEO' : 'SEO Settings'}
                            </h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'عنوان الصفحة (Meta Title)' : 'Page Title (Meta Title)'}
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder={isArabic ? 'عنوان الدورة' : 'Course title'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        {isArabic ? 'وصف الصفحة (Meta Description)' : 'Page Description (Meta Description)'}
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder={isArabic ? 'وصف الدورة' : 'Course description'}
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {isArabic 
                                            ? 'يستخدم هذا الوصف في نتائج محركات البحث'
                                            : 'This description is used in search engine results'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Settings */}
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6">
                                {isArabic ? 'إعدادات التسجيل' : 'Enrollment Settings'}
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                                    <div>
                                        <h3 className="font-semibold">
                                            {isArabic ? 'حد أقصى للطلاب' : 'Maximum Students'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic ? 'تحديد عدد الطلاب المسموح بهم' : 'Limit the number of allowed students'}
                                        </p>
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={maxStudents || ''}
                                        onChange={(e) => setMaxStudents(e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder={isArabic ? 'غير محدود' : 'Unlimited'}
                                        className="w-32 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                                    <div>
                                        <h3 className="font-semibold">
                                            {isArabic ? 'إغلاق التسجيل تلقائياً' : 'Auto-Close Enrollment'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic ? 'إغلاق التسجيل بعد تاريخ محدد' : 'Close enrollment after a specific date'}
                                        </p>
                                    </div>
                                    <input
                                        type="date"
                                        value={enrollmentEndDate}
                                        onChange={(e) => setEnrollmentEndDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSaveEnrollmentSettings}
                                        disabled={savingSettings}
                                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {savingSettings ? (
                                            <>
                                                <DynamicIcon name="Loader2" className="w-4 h-4 animate-spin" />
                                                {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                <DynamicIcon name="Save" className="w-4 h-4" />
                                                {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-card border-2 border-red-500/30 rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-2 text-red-500">
                                {isArabic ? 'منطقة الخطر' : 'Danger Zone'}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                {isArabic 
                                    ? 'هذه الإجراءات دائمة ولا يمكن التراجع عنها'
                                    : 'These actions are permanent and cannot be undone'}
                            </p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                                    <div>
                                        <h3 className="font-semibold text-red-600">
                                            {isArabic ? 'حذف الدورة' : 'Delete Course'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic 
                                                ? 'حذف نهائي للدورة وجميع الدروس والبيانات'
                                                : 'Permanently delete course with all lessons and data'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        onClick={async () => {
                                            if (confirm(isArabic 
                                                ? 'هل أنت متأكد من حذف هذه الدورة؟ لا يمكن التراجع عن هذا الإجراء!'
                                                : 'Are you sure you want to delete this course? This action cannot be undone!')) {
                                                try {
                                                    const response = await fetch(`/api/creator/courses/${courseId}`, {
                                                        method: 'DELETE'
                                                    })
                                                    if (response.ok) {
                                                        toast.success(isArabic ? 'تم حذف الدورة!' : 'Course deleted!')
                                                        router.push(`/${locale}/creator/courses`)
                                                    } else {
                                                        const error = await response.json()
                                                        toast.error(error.error || (isArabic ? 'فشل حذف الدورة' : 'Failed to delete course'))
                                                    }
                                                } catch (error) {
                                                    toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
                                                }
                                            }
                                        }}
                                    >
                                        <DynamicIcon name="Trash2" className="w-4 h-4 mr-2" />
                                        {isArabic ? 'حذف الدورة' : 'Delete Course'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Quizzes Tab */}
                {activeTab === 'quizzes' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {isArabic ? 'الاختبارات' : 'Quizzes'}
                                </h2>
                                <p className="text-muted-foreground">
                                    {isArabic 
                                        ? 'أضف اختبارات لتقييم معرفة الطلاب'
                                        : 'Add quizzes to assess student knowledge'}
                                </p>
                            </div>
                            <Button
                                onClick={handleAddQuiz}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <DynamicIcon name="Plus" className="w-4 h-4 mr-2" />
                                {isArabic ? 'إضافة اختبار' : 'Add Quiz'}
                            </Button>
                        </div>

                        {quizzesLoading ? (
                            <div className="flex justify-center py-12">
                                <DynamicIcon name="Loader2" className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : quizzes.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl">
                                <DynamicIcon name="FileText" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">
                                    {isArabic ? 'لا توجد اختبارات' : 'No Quizzes Yet'}
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    {isArabic 
                                        ? 'قم بإنشاء أول اختبار لتقييم فهم الطلاب'
                                        : 'Create your first quiz to assess student understanding'}
                                </p>
                                <Button
                                    onClick={handleAddQuiz}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    <DynamicIcon name="Plus" className="w-4 h-4 mr-2" />
                                    {isArabic ? 'إنشاء اختبار' : 'Create Quiz'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {quizzes.map((quiz) => (
                                    <div
                                        key={quiz.id}
                                        className="bg-card border border-border rounded-xl p-6 hover:border-purple-500/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold mb-2">
                                                    {isArabic && quiz.titleAr ? quiz.titleAr : quiz.title}
                                                </h3>
                                                {quiz.description && (
                                                    <p className="text-muted-foreground text-sm mb-3">
                                                        {quiz.description}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name="FileText" className="w-4 h-4 text-purple-500" />
                                                        <span>{quiz.questions.length} {isArabic ? 'أسئلة' : 'Questions'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name="Clock" className="w-4 h-4 text-blue-500" />
                                                        <span>
                                                            {quiz.timeLimit 
                                                                ? `${quiz.timeLimit} ${isArabic ? 'دقيقة' : 'min'}` 
                                                                : (isArabic ? 'بدون حد زمني' : 'No time limit')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name="Target" className="w-4 h-4 text-green-500" />
                                                        <span>{quiz.passingScore}% {isArabic ? 'للنجاح' : 'to pass'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name="Users" className="w-4 h-4 text-orange-500" />
                                                        <span>{quiz._count.attempts} {isArabic ? 'محاولات' : 'attempts'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditQuiz(quiz)}
                                                >
                                                    <DynamicIcon name="Edit" className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <DynamicIcon name="Trash2" className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quiz Form Modal */}
                        {showAddQuiz && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                                        <h3 className="text-2xl font-bold">
                                            {editingQuiz 
                                                ? (isArabic ? 'تعديل الاختبار' : 'Edit Quiz')
                                                : (isArabic ? 'إنشاء اختبار جديد' : 'Create New Quiz')}
                                        </h3>
                                        <button
                                            onClick={() => setShowAddQuiz(false)}
                                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                                        >
                                            <DynamicIcon name="X" className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Quiz Details */}
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'عنوان الاختبار (بالإنجليزية)' : 'Quiz Title (English)'} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={quizTitle}
                                                        onChange={(e) => setQuizTitle(e.target.value)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder="e.g., JavaScript Fundamentals Quiz"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'عنوان الاختبار (بالعربية)' : 'Quiz Title (Arabic)'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={quizTitleAr}
                                                        onChange={(e) => setQuizTitleAr(e.target.value)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder="مثال: اختبار أساسيات JavaScript"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2">
                                                    {isArabic ? 'الوصف' : 'Description'}
                                                </label>
                                                <textarea
                                                    value={quizDescription}
                                                    onChange={(e) => setQuizDescription(e.target.value)}
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder={isArabic ? 'اختياري' : 'Optional'}
                                                />
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'الوقت المحدد (دقائق)' : 'Time Limit (minutes)'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={quizTimeLimit || ''}
                                                        onChange={(e) => setQuizTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder={isArabic ? 'بدون حد' : 'No limit'}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'درجة النجاح (%)' : 'Passing Score (%)'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={quizPassingScore}
                                                        onChange={(e) => setQuizPassingScore(parseInt(e.target.value) || 70)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'عدد المحاولات' : 'Max Attempts'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={quizMaxAttempts}
                                                        onChange={(e) => setQuizMaxAttempts(parseInt(e.target.value) || 3)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Questions */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-lg font-semibold">
                                                    {isArabic ? 'الأسئلة' : 'Questions'}
                                                </h4>
                                                <Button
                                                    onClick={addQuestion}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <DynamicIcon name="Plus" className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'إضافة سؤال' : 'Add Question'}
                                                </Button>
                                            </div>

                                            {quizQuestions.map((question, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-accent/50 border border-border rounded-lg p-4 space-y-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold">
                                                            {isArabic ? 'سؤال' : 'Question'} {index + 1}
                                                        </span>
                                                        <Button
                                                            onClick={() => removeQuestion(index)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-500"
                                                        >
                                                            <DynamicIcon name="Trash2" className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-2">
                                                                {isArabic ? 'نص السؤال' : 'Question Text'}
                                                            </label>
                                                            <textarea
                                                                value={question.question}
                                                                onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                                                rows={2}
                                                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-2">
                                                                {isArabic ? 'نص السؤال (عربي)' : 'Question Text (Arabic)'}
                                                            </label>
                                                            <textarea
                                                                value={question.questionAr || ''}
                                                                onChange={(e) => updateQuestion(index, 'questionAr', e.target.value)}
                                                                rows={2}
                                                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-2">
                                                                {isArabic ? 'نوع السؤال' : 'Question Type'}
                                                            </label>
                                                            <select
                                                                value={question.type}
                                                                onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                                                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            >
                                                                <option value="MULTIPLE_CHOICE">
                                                                    {isArabic ? 'اختيار متعدد' : 'Multiple Choice'}
                                                                </option>
                                                                <option value="TRUE_FALSE">
                                                                    {isArabic ? 'صح أو خطأ' : 'True/False'}
                                                                </option>
                                                                <option value="SHORT_ANSWER">
                                                                    {isArabic ? 'إجابة قصيرة' : 'Short Answer'}
                                                                </option>
                                                                <option value="ESSAY">
                                                                    {isArabic ? 'مقالي' : 'Essay'}
                                                                </option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold mb-2">
                                                                {isArabic ? 'النقاط' : 'Points'}
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={question.points}
                                                                onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 10)}
                                                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    {question.type === 'MULTIPLE_CHOICE' && (
                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-semibold">
                                                                {isArabic ? 'الخيارات' : 'Options'}
                                                            </label>
                                                            {question.options.map((option: string, optIndex: number) => (
                                                                <input
                                                                    key={optIndex}
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => updateQuestionOption(index, optIndex, e.target.value)}
                                                                    placeholder={`${isArabic ? 'الخيار' : 'Option'} ${optIndex + 1}`}
                                                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="block text-sm font-semibold mb-2">
                                                            {isArabic ? 'الإجابة الصحيحة' : 'Correct Answer'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={question.correctAnswer}
                                                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            placeholder={question.type === 'MULTIPLE_CHOICE' 
                                                                ? (isArabic ? 'مثال: A أو 1' : 'e.g., A or 1')
                                                                : (isArabic ? 'أدخل الإجابة الصحيحة' : 'Enter correct answer')}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowAddQuiz(false)}
                                            >
                                                {isArabic ? 'إلغاء' : 'Cancel'}
                                            </Button>
                                            <Button
                                                onClick={handleSaveQuiz}
                                                disabled={savingQuiz}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                                            >
                                                {savingQuiz ? (
                                                    <>
                                                        <DynamicIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                                                        {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <DynamicIcon name="Save" className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'حفظ الاختبار' : 'Save Quiz'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Assignments Tab */}
                {activeTab === 'assignments' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {isArabic ? 'الواجبات' : 'Assignments'}
                                </h2>
                                <p className="text-muted-foreground">
                                    {isArabic 
                                        ? 'أضف واجبات لتقييم المهارات العملية للطلاب'
                                        : 'Add assignments to assess student practical skills'}
                                </p>
                            </div>
                            <Button
                                onClick={handleAddAssignment}
                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                                <DynamicIcon name="Plus" className="w-4 h-4 mr-2" />
                                {isArabic ? 'إضافة واجب' : 'Add Assignment'}
                            </Button>
                        </div>

                        {assignmentsLoading ? (
                            <div className="flex justify-center py-12">
                                <DynamicIcon name="Loader2" className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl">
                                <DynamicIcon name="ClipboardList" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">
                                    {isArabic ? 'لا توجد واجبات' : 'No Assignments Yet'}
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    {isArabic 
                                        ? 'قم بإنشاء أول واجب لتقييم المهارات العملية'
                                        : 'Create your first assignment to assess practical skills'}
                                </p>
                                <Button
                                    onClick={handleAddAssignment}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                                >
                                    <DynamicIcon name="Plus" className="w-4 h-4 mr-2" />
                                    {isArabic ? 'إنشاء واجب' : 'Create Assignment'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="bg-card border border-border rounded-xl p-6 hover:border-purple-500/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold mb-2">
                                                    {isArabic && assignment.titleAr ? assignment.titleAr : assignment.title}
                                                </h3>
                                                <p className="text-muted-foreground text-sm mb-3">
                                                    {isArabic && assignment.descriptionAr ? assignment.descriptionAr : assignment.description}
                                                </p>
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name="Target" className="w-4 h-4 text-purple-500" />
                                                        <span>{assignment.maxPoints} {isArabic ? 'نقطة' : 'points'}</span>
                                                    </div>
                                                    {assignment.dueDate && (
                                                        <div className="flex items-center gap-2">
                                                            <DynamicIcon name="Calendar" className="w-4 h-4 text-blue-500" />
                                                            <span>
                                                                {isArabic ? 'الموعد: ' : 'Due: '}
                                                                {new Date(assignment.dueDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <DynamicIcon name="Users" className="w-4 h-4 text-green-500" />
                                                        <span>{assignment._count.submissions} {isArabic ? 'تسليمات' : 'submissions'}</span>
                                                    </div>
                                                    {assignment.allowLateSubmission && (
                                                        <div className="flex items-center gap-2">
                                                            <DynamicIcon name="Clock" className="w-4 h-4 text-orange-500" />
                                                            <span>{isArabic ? 'يسمح بالتأخير' : 'Late allowed'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditAssignment(assignment)}
                                                >
                                                    <DynamicIcon name="Edit" className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    <DynamicIcon name="Trash2" className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Assignment Form Modal */}
                        {showAddAssignment && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-card border border-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                                    <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                                        <h3 className="text-2xl font-bold">
                                            {editingAssignment 
                                                ? (isArabic ? 'تعديل الواجب' : 'Edit Assignment')
                                                : (isArabic ? 'إنشاء واجب جديد' : 'Create New Assignment')}
                                        </h3>
                                        <button
                                            onClick={() => setShowAddAssignment(false)}
                                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                                        >
                                            <DynamicIcon name="X" className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Basic Information */}
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'عنوان الواجب (بالإنجليزية)' : 'Assignment Title (English)'} *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={assignmentTitle}
                                                        onChange={(e) => setAssignmentTitle(e.target.value)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder="e.g., Build a Landing Page"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'عنوان الواجب (بالعربية)' : 'Assignment Title (Arabic)'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={assignmentTitleAr}
                                                        onChange={(e) => setAssignmentTitleAr(e.target.value)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder="مثال: بناء صفحة هبوط"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'الوصف (بالإنجليزية)' : 'Description (English)'} *
                                                    </label>
                                                    <textarea
                                                        value={assignmentDescription}
                                                        onChange={(e) => setAssignmentDescription(e.target.value)}
                                                        rows={4}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder="Describe what students need to do..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'الوصف (بالعربية)' : 'Description (Arabic)'}
                                                    </label>
                                                    <textarea
                                                        value={assignmentDescriptionAr}
                                                        onChange={(e) => setAssignmentDescriptionAr(e.target.value)}
                                                        rows={4}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        placeholder="صف ما يحتاج الطلاب للقيام به..."
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2">
                                                    {isArabic ? 'التعليمات التفصيلية' : 'Detailed Instructions'}
                                                </label>
                                                <textarea
                                                    value={assignmentInstructions}
                                                    onChange={(e) => setAssignmentInstructions(e.target.value)}
                                                    rows={6}
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder={isArabic 
                                                        ? 'أضف تعليمات خطوة بخطوة، متطلبات، ومعايير التقييم...'
                                                        : 'Add step-by-step instructions, requirements, and grading criteria...'}
                                                />
                                            </div>

                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'الموعد النهائي' : 'Due Date'}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={assignmentDueDate}
                                                        onChange={(e) => setAssignmentDueDate(e.target.value)}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">
                                                        {isArabic ? 'النقاط الكاملة' : 'Max Score'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={assignmentMaxScore}
                                                        onChange={(e) => setAssignmentMaxScore(parseInt(e.target.value) || 100)}
                                                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Settings */}
                                            <div className="space-y-3 pt-4 border-t border-border">
                                                <h4 className="font-semibold">
                                                    {isArabic ? 'الإعدادات' : 'Settings'}
                                                </h4>
                                                
                                                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                                                    <div>
                                                        <h5 className="font-medium">
                                                            {isArabic ? 'السماح بالتسليم المتأخر' : 'Allow Late Submission'}
                                                        </h5>
                                                        <p className="text-sm text-muted-foreground">
                                                            {isArabic 
                                                                ? 'السماح للطلاب بالتسليم بعد الموعد النهائي'
                                                                : 'Allow students to submit after the due date'}
                                                        </p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={assignmentAllowLate}
                                                            onChange={(e) => setAssignmentAllowLate(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                                    </label>
                                                </div>

                                                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                                                    <div>
                                                        <h5 className="font-medium">
                                                            {isArabic ? 'مطلوب ملف' : 'Require File Upload'}
                                                        </h5>
                                                        <p className="text-sm text-muted-foreground">
                                                            {isArabic 
                                                                ? 'يجب على الطلاب تحميل ملف للتسليم'
                                                                : 'Students must upload a file to submit'}
                                                        </p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={assignmentRequireFile}
                                                            onChange={(e) => setAssignmentRequireFile(e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowAddAssignment(false)}
                                            >
                                                {isArabic ? 'إلغاء' : 'Cancel'}
                                            </Button>
                                            <Button
                                                onClick={handleSaveAssignment}
                                                disabled={savingAssignment}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                                            >
                                                {savingAssignment ? (
                                                    <>
                                                        <DynamicIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                                                        {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <DynamicIcon name="Save" className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'حفظ الواجب' : 'Save Assignment'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">
                                {isArabic ? 'تقدم الطلاب' : 'Student Progress'}
                            </h2>
                            <p className="text-muted-foreground">
                                {isArabic 
                                    ? 'تتبع أداء الطلاب والواجبات والاختبارات'
                                    : 'Track student performance, assignments, and quiz attempts'}
                            </p>
                        </div>

                        {/* Summary Cards */}
                        {studentsSummary && (
                            <div className="grid md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <DynamicIcon name="Users" className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{studentsSummary.totalStudents}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {isArabic ? 'إجمالي الطلاب' : 'Total Students'}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <DynamicIcon name="TrendingUp" className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{Math.round(studentsSummary.averageProgress)}%</div>
                                    <div className="text-sm text-muted-foreground">
                                        {isArabic ? 'متوسط التقدم' : 'Average Progress'}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <DynamicIcon name="FileText" className="w-8 h-8 text-green-500" />
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{studentsSummary.totalQuizzes}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {isArabic ? 'الاختبارات' : 'Quizzes'}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <DynamicIcon name="ClipboardList" className="w-8 h-8 text-orange-500" />
                                    </div>
                                    <div className="text-3xl font-bold mb-1">{studentsSummary.totalAssignments}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {isArabic ? 'الواجبات' : 'Assignments'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {studentsLoading ? (
                            <div className="flex justify-center py-12">
                                <DynamicIcon name="Loader2" className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : studentsData.length === 0 ? (
                            <div className="text-center py-12 bg-card border border-border rounded-xl">
                                <DynamicIcon name="GraduationCap" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-xl font-semibold mb-2">
                                    {isArabic ? 'لا يوجد طلاب مسجلين' : 'No Students Enrolled Yet'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {isArabic 
                                        ? 'سيظهر الطلاب هنا بمجرد تسجيلهم في الدورة'
                                        : 'Students will appear here once they enroll in your course'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {studentsData.map((student) => (
                                    <div
                                        key={student.enrollment.id}
                                        className="bg-card border border-border rounded-xl p-6 hover:border-purple-500/50 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Student Avatar */}
                                            <div className="flex-shrink-0">
                                                {student.user.profileImage ? (
                                                    <Image
                                                        src={student.user.profileImage}
                                                        alt={student.user.name}
                                                        width={64}
                                                        height={64}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                                        {student.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Student Info */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="text-lg font-semibold">
                                                            {isArabic && student.user.arabicName ? student.user.arabicName : student.user.name}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">{student.user.email}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {isArabic ? 'التحق في: ' : 'Enrolled: '}
                                                            {new Date(student.enrollment.enrolledAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-bold text-purple-500">
                                                            {student.stats.overallProgress}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {isArabic ? 'التقدم' : 'Progress'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full bg-accent rounded-full h-2 mb-4">
                                                    <div 
                                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${student.stats.overallProgress}%` }}
                                                    />
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="bg-accent/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <DynamicIcon name="FileText" className="w-4 h-4 text-purple-500" />
                                                            <span className="text-sm font-medium">
                                                                {isArabic ? 'الاختبارات' : 'Quizzes'}
                                                            </span>
                                                        </div>
                                                        <div className="text-lg font-bold">
                                                            {student.stats.quizzes.completed}/{student.stats.quizzes.total}
                                                        </div>
                                                        {student.stats.quizzes.completed > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {isArabic ? 'المعدل: ' : 'Avg: '}{student.stats.quizzes.averageScore}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="bg-accent/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <DynamicIcon name="ClipboardList" className="w-4 h-4 text-orange-500" />
                                                            <span className="text-sm font-medium">
                                                                {isArabic ? 'الواجبات' : 'Assignments'}
                                                            </span>
                                                        </div>
                                                        <div className="text-lg font-bold">
                                                            {student.stats.assignments.submitted}/{student.stats.assignments.total}
                                                        </div>
                                                        {student.stats.assignments.graded > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {isArabic ? 'المعدل: ' : 'Avg: '}{student.stats.assignments.averageScore}%
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="bg-accent/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <DynamicIcon name="Award" className="w-4 h-4 text-green-500" />
                                                            <span className="text-sm font-medium">
                                                                {isArabic ? 'مُقيّم' : 'Graded'}
                                                            </span>
                                                        </div>
                                                        <div className="text-lg font-bold">
                                                            {student.stats.assignments.graded}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {isArabic ? 'واجبات' : 'assignments'}
                                                        </div>
                                                    </div>

                                                    <div className="bg-accent/50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <DynamicIcon name="Clock" className="w-4 h-4 text-blue-500" />
                                                            <span className="text-sm font-medium">
                                                                {isArabic ? 'آخر نشاط' : 'Last Active'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-bold">
                                                            {new Date(student.lastActivity).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(student.lastActivity).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toast(isArabic ? 'قريباً' : 'Coming soon')}
                                                    >
                                                        {isArabic ? 'عرض التفاصيل' : 'View Details'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toast(isArabic ? 'قريباً' : 'Coming soon')}
                                                    >
                                                        {isArabic ? 'إرسال رسالة' : 'Send Message'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Grading Tab Content */}
                {activeTab === 'grading' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Filter Buttons */}
                        <div className="flex items-center gap-3 mb-6">
                            <Button
                                variant={gradingFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGradingFilter('all')}
                            >
                                <DynamicIcon name="List" className="w-4 h-4 mr-2" />
                                {isArabic ? 'الكل' : 'All'}
                                {submissionsStats && (
                                    <span className="ml-2 px-2 py-0.5 bg-background rounded-full text-xs">
                                        {submissionsStats.total}
                                    </span>
                                )}
                            </Button>
                            <Button
                                variant={gradingFilter === 'ungraded' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGradingFilter('ungraded')}
                            >
                                <DynamicIcon name="AlertCircle" className="w-4 h-4 mr-2" />
                                {isArabic ? 'غير مصحح' : 'Ungraded'}
                                {submissionsStats && submissionsStats.ungradedAssignments > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                                        {submissionsStats.ungradedAssignments}
                                    </span>
                                )}
                            </Button>
                            <Button
                                variant={gradingFilter === 'graded' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGradingFilter('graded')}
                            >
                                <DynamicIcon name="CheckCircle" className="w-4 h-4 mr-2" />
                                {isArabic ? 'مصحح' : 'Graded'}
                                {submissionsStats && (
                                    <span className="ml-2 px-2 py-0.5 bg-background rounded-full text-xs">
                                        {submissionsStats.gradedAssignments}
                                    </span>
                                )}
                            </Button>
                        </div>

                        {/* Loading State */}
                        {submissionsLoading && (
                            <div className="flex items-center justify-center py-12">
                                <DynamicIcon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        )}

                        {/* Empty State */}
                        {!submissionsLoading && submissions.length === 0 && (
                            <div className="text-center py-12">
                                <DynamicIcon name="FileText" className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {isArabic ? 'لا توجد تسليمات' : 'No Submissions'}
                                </h3>
                                <p className="text-muted-foreground">
                                    {isArabic
                                        ? gradingFilter === 'ungraded'
                                            ? 'جميع التسليمات تم تصحيحها'
                                            : 'لم يتم تسليم أي واجبات بعد'
                                        : gradingFilter === 'ungraded'
                                        ? 'All submissions have been graded'
                                        : 'No assignments have been submitted yet'}
                                </p>
                            </div>
                        )}

                        {/* Submissions List */}
                        {!submissionsLoading && submissions.length > 0 && (
                            <div className="space-y-4">
                                {submissions.map((submission: any) => (
                                    <div
                                        key={submission.id}
                                        className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                {/* Student Info */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        {submission.user.image ? (
                                                            <img
                                                                src={submission.user.image}
                                                                alt={submission.user.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-primary font-semibold">
                                                                {submission.user.name?.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold">
                                                            {submission.user.name}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {submission.user.email}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Assignment Info */}
                                                <div className="bg-accent/30 rounded-lg p-4 mb-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <DynamicIcon name="FileText" className="w-4 h-4 text-primary" />
                                                        <span className="font-medium">
                                                            {isArabic
                                                                ? submission.assignment.titleAr || submission.assignment.titleEn
                                                                : submission.assignment.titleEn}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {isArabic ? 'الدرجة القصوى:' : 'Max Points:'}{' '}
                                                        {submission.assignment.maxPoints}
                                                    </p>
                                                </div>

                                                {/* Submission Content */}
                                                <div className="bg-muted/50 rounded-lg p-4 mb-3">
                                                    <p className="text-sm font-medium mb-2">
                                                        {isArabic ? 'المحتوى المقدم:' : 'Submitted Content:'}
                                                    </p>
                                                    <p className="text-sm whitespace-pre-wrap line-clamp-3">
                                                        {submission.content || (isArabic ? 'لا يوجد محتوى نصي' : 'No text content')}
                                                    </p>
                                                    {submission.fileUrl && (
                                                        <a
                                                            href={submission.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary hover:underline text-sm mt-2 inline-flex items-center gap-1"
                                                        >
                                                            <DynamicIcon name="FileText" className="w-4 h-4" />
                                                            {isArabic ? 'عرض الملف المرفق' : 'View Attached File'}
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Submission Date */}
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <DynamicIcon name="Clock" className="w-4 h-4" />
                                                    {isArabic ? 'تم التسليم في:' : 'Submitted:'}{' '}
                                                    {new Date(submission.submittedAt).toLocaleString(
                                                        isArabic ? 'ar-EG' : 'en-US',
                                                        {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short'
                                                        }
                                                    )}
                                                </div>

                                                {/* Current Grade (if graded) */}
                                                {submission.score !== null && (
                                                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                                                {isArabic ? 'الدرجة:' : 'Grade:'}{' '}
                                                                {submission.score} / {submission.assignment.maxPoints}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {isArabic ? 'تم التصحيح في:' : 'Graded:'}{' '}
                                                                {new Date(submission.gradedAt).toLocaleDateString(
                                                                    isArabic ? 'ar-EG' : 'en-US'
                                                                )}
                                                            </span>
                                                        </div>
                                                        {submission.feedback && (
                                                            <p className="text-sm mt-2 text-muted-foreground">
                                                                {submission.feedback}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Grade Button */}
                                            <Button
                                                size="sm"
                                                onClick={() => handleGradeSubmission(submission)}
                                                variant={submission.score !== null ? 'outline' : 'default'}
                                            >
                                                <DynamicIcon name="CheckCircle" className="w-4 h-4 mr-2" />
                                                {submission.score !== null
                                                    ? (isArabic ? 'تعديل الدرجة' : 'Edit Grade')
                                                    : (isArabic ? 'تصحيح' : 'Grade')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Grading Modal */}
                        {gradingSubmission && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                                >
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold">
                                                {isArabic ? 'تصحيح التسليم' : 'Grade Submission'}
                                            </h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setGradingSubmission(null)}
                                            >
                                                <DynamicIcon name="X" className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        {/* Student & Assignment Info */}
                                        <div className="bg-accent/30 rounded-lg p-4 mb-6">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                    {gradingSubmission.user.image ? (
                                                        <img
                                                            src={gradingSubmission.user.image}
                                                            alt={gradingSubmission.user.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-primary font-semibold text-lg">
                                                            {gradingSubmission.user.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold">
                                                        {gradingSubmission.user.name}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {gradingSubmission.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="border-t border-border pt-3">
                                                <p className="font-medium mb-1">
                                                    {isArabic
                                                        ? gradingSubmission.assignment.titleAr || gradingSubmission.assignment.titleEn
                                                        : gradingSubmission.assignment.titleEn}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {isArabic ? 'الدرجة القصوى:' : 'Maximum Points:'}{' '}
                                                    {gradingSubmission.assignment.maxPoints}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Submission Content */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium mb-2">
                                                {isArabic ? 'المحتوى المقدم:' : 'Submitted Content:'}
                                            </label>
                                            <div className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {gradingSubmission.content || (isArabic ? 'لا يوجد محتوى نصي' : 'No text content')}
                                                </p>
                                                {gradingSubmission.fileUrl && (
                                                    <a
                                                        href={gradingSubmission.fileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline text-sm mt-3 inline-flex items-center gap-1"
                                                    >
                                                        <DynamicIcon name="FileText" className="w-4 h-4" />
                                                        {isArabic ? 'فتح الملف المرفق' : 'Open Attached File'}
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        {/* Score Input */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium mb-2">
                                                {isArabic ? 'الدرجة' : 'Score'}{' '}
                                                <span className="text-muted-foreground">
                                                    (0 - {gradingSubmission.assignment.maxPoints})
                                                </span>
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                max={gradingSubmission.assignment.maxPoints}
                                                value={gradeScore}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGradeScore(parseFloat(e.target.value) || 0)}
                                                placeholder={isArabic ? 'أدخل الدرجة' : 'Enter score'}
                                            />
                                        </div>

                                        {/* Feedback Textarea */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium mb-2">
                                                {isArabic ? 'الملاحظات (اختياري)' : 'Feedback (Optional)'}
                                            </label>
                                            <Textarea
                                                value={gradeFeedback}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGradeFeedback(e.target.value)}
                                                placeholder={
                                                    isArabic
                                                        ? 'أضف ملاحظات للطالب...'
                                                        : 'Add feedback for the student...'
                                                }
                                                rows={4}
                                            />
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-end gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => setGradingSubmission(null)}
                                                disabled={savingGrade}
                                            >
                                                {isArabic ? 'إلغاء' : 'Cancel'}
                                            </Button>
                                            <Button
                                                onClick={handleSaveGrade}
                                                disabled={savingGrade || !gradeScore}
                                            >
                                                {savingGrade ? (
                                                    <>
                                                        <DynamicIcon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                                                        {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <DynamicIcon name="Save" className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'حفظ الدرجة' : 'Save Grade'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    )
}
