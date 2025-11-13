'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

import VideoPlayer from '@/components/course/VideoPlayer'
import CourseNavigation from '@/components/course/CourseNavigation'
import LessonContent from '@/components/course/LessonContent'

interface Module {
    id: string
    title: string
    titleAr: string
    description?: string
    descriptionAr?: string
    order: number
    lessons: Lesson[]
}

interface Lesson {
    id: string
    title: string
    titleAr: string
    description?: string
    descriptionAr?: string
    order: number
    duration: number
    videoUrl?: string
    isCompleted: boolean
    moduleId: string
    objectives?: Objective[]
    resources?: Resource[]
    transcript?: string
    transcriptAr?: string
}

interface Objective {
    id: string
    text: string
    textAr: string
}

interface Resource {
    id: string
    title: string
    titleAr: string
    type: 'pdf' | 'doc' | 'ppt' | 'xls' | 'link' | 'video' | 'audio' | 'image'
    url: string
    size?: string
    description?: string
    descriptionAr?: string
}

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    thumbnail?: string
    modules: Module[]
    totalDuration: number
    totalLessons: number
    progress: number
}

export default function CourseLearningPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [course, setCourse] = useState<Course | null>(null)
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
    const [loading, setLoading] = useState(true)
    const [lang, setLang] = useState<'en' | 'ar'>('ar')
    const [videoProgress, setVideoProgress] = useState(0)

    useEffect(() => {
        if (params.id) {
            fetchCourse()
        }
    }, [params.id])

    useEffect(() => {
        if (course && course.modules.length > 0) {
            // Find first incomplete lesson or first lesson
            let lessonToLoad: Lesson | null = null

            for (const module of course.modules) {
                for (const lesson of module.lessons) {
                    if (!lesson.isCompleted) {
                        lessonToLoad = lesson
                        break
                    }
                }
                if (lessonToLoad) break
            }

            // If no incomplete lesson found, load the first lesson
            if (!lessonToLoad) {
                lessonToLoad = course.modules[0].lessons[0]
            }

            setCurrentLesson(lessonToLoad)
        }
    }, [course])

    const fetchCourse = async () => {
        try {
            const response = await fetch(`/api/courses/${params.id}/learn`)
            if (response.ok) {
                const data = await response.json()
                setCourse(data.course)
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to load course')
                router.push('/courses')
            }
        } catch (error) {
            toast.error('Failed to load course')
            router.push('/courses')
        } finally {
            setLoading(false)
        }
    }

    const handleLessonSelect = (lessonId: string) => {
        if (!course) return

        let foundLesson: Lesson | null = null
        for (const module of course.modules) {
            foundLesson = module.lessons.find(lesson => lesson.id === lessonId) || null
            if (foundLesson) break
        }

        if (foundLesson) {
            setCurrentLesson(foundLesson)
            // Reset video progress when switching lessons
            setVideoProgress(0)
        }
    }

    const handleLessonComplete = (lessonId: string) => {
        if (!course) return

        // Update course progress
        const updatedCourse = { ...course }
        let totalLessons = 0
        let completedLessons = 0

        for (const module of updatedCourse.modules) {
            for (const lesson of module.lessons) {
                totalLessons++
                if (lesson.id === lessonId) {
                    lesson.isCompleted = !lesson.isCompleted
                }
                if (lesson.isCompleted) {
                    completedLessons++
                }
            }
        }

        updatedCourse.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
        setCourse(updatedCourse)

        // Show success message
        const isCompleted = updatedCourse.modules
            .flatMap(m => m.lessons)
            .find(l => l.id === lessonId)?.isCompleted

        if (isCompleted) {
            toast.success(
                lang === 'ar'
                    ? '✅ تم إكمال الدرس بنجاح!'
                    : '✅ Lesson completed successfully!',
                { duration: 3000 }
            )
        }
    }

    const handleVideoProgressUpdate = (progress: number, currentTime: number) => {
        setVideoProgress(progress)
    }

    const handleVideoComplete = () => {
        if (currentLesson && !currentLesson.isCompleted) {
            // Auto-mark lesson as complete when video finishes
            handleLessonComplete(currentLesson.id)
        }
    }

    const handleRelatedLessonClick = (lessonId: string) => {
        handleLessonSelect(lessonId)
    }

    // Get video sources for different qualities
    const getVideoSources = () => {
        if (!currentLesson?.videoUrl) return []

        return [
            {
                quality: '1080p',
                url: currentLesson.videoUrl,
                label: lang === 'ar' ? 'جودة عالية (1080p)' : 'High Quality (1080p)'
            },
            {
                quality: '720p',
                url: currentLesson.videoUrl.replace('/1080p/', '/720p/'), // In real app, these would be different URLs
                label: lang === 'ar' ? 'جودة متوسطة (720p)' : 'Medium Quality (720p)'
            },
            {
                quality: '480p',
                url: currentLesson.videoUrl.replace('/1080p/', '/480p/'), // In real app, these would be different URLs
                label: lang === 'ar' ? 'جودة منخفضة (480p)' : 'Low Quality (480p)'
            }
        ]
    }

    // Get subtitles
    const getSubtitles = () => {
        if (!currentLesson) return []

        return [
            {
                language: 'ar',
                label: lang === 'ar' ? 'العربية' : 'Arabic',
                url: `/api/courses/${params.id}/lessons/${currentLesson.id}/subtitles/ar.vtt`,
                isDefault: lang === 'ar'
            },
            {
                language: 'en',
                label: lang === 'ar' ? 'الإنجليزية' : 'English',
                url: `/api/courses/${params.id}/lessons/${currentLesson.id}/subtitles/en.vtt`,
                isDefault: lang === 'en'
            }
        ]
    }

    // Get related lessons (excluding current lesson)
    const getRelatedLessons = () => {
        if (!course || !currentLesson) return []

        const allLessons = course.modules.flatMap(module =>
            module.lessons
                .filter(lesson => lesson.id !== currentLesson.id)
                .map(lesson => ({
                    ...lesson,
                    moduleId: module.id
                }))
        )

        // Return up to 3 related lessons
        return allLessons.slice(0, 3)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
                    <p className="text-lg text-[var(--foreground)]">
                        {lang === 'ar' ? 'جاري تحميل الدورة...' : 'Loading course...'}
                    </p>
                </div>
            </div>
        )
    }

    if (!course || !currentLesson) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                        {lang === 'ar' ? 'الدورة غير موجودة' : 'Course Not Found'}
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-4">
                        {lang === 'ar' ? 'الدورة التي تبحث عنها غير متوفرة.' : 'The course you are looking for is not available.'}
                    </p>
                    <button
                        onClick={() => router.push('/courses')}
                        className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:bg-[var(--primary)] transition-colors"
                    >
                        {lang === 'ar' ? 'العودة إلى الدورات' : 'Back to Courses'}
                    </button>
                </div>
            </div>
        )
    }

    const videoSources = getVideoSources()
    const subtitles = getSubtitles()
    const relatedLessons = getRelatedLessons()

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <div className="bg-[var(--card)] border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.push(`/courses/${params.id}`)}
                                className="flex items-center space-x-2 text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                <span>{lang === 'ar' ? 'العودة' : 'Back'}</span>
                            </button>
                            <h1 className="text-xl font-bold text-[var(--foreground)]">
                                {lang === 'ar' ? course.titleAr : course.title}
                            </h1>
                        </div>
                        <button
                            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                            className="px-4 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                        >
                            {lang === 'en' ? 'العربية' : 'English'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Course Navigation */}
                    <div className="lg:col-span-1">
                        <CourseNavigation
                            courseId={params.id as string}
                            modules={course.modules}
                            currentLessonId={currentLesson.id}
                            onLessonSelect={handleLessonSelect}
                            onLessonComplete={handleLessonComplete}
                            lang={lang}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Video Player */}
                        {videoSources.length > 0 && (
                            <VideoPlayer
                                videoSources={videoSources}
                                subtitles={subtitles}
                                poster={course.thumbnail}
                                courseId={params.id as string}
                                lessonId={currentLesson.id}
                                onProgressUpdate={handleVideoProgressUpdate}
                                onComplete={handleVideoComplete}
                            />
                        )}

                        {/* Lesson Content */}
                        <LessonContent
                            lessonId={currentLesson.id}
                            title={currentLesson.title}
                            titleAr={currentLesson.titleAr}
                            description={currentLesson.description}
                            descriptionAr={currentLesson.descriptionAr}
                            objectives={currentLesson.objectives}
                            resources={currentLesson.resources}
                            transcript={currentLesson.transcript}
                            transcriptAr={currentLesson.transcriptAr}
                            relatedLessons={relatedLessons}
                            lang={lang}
                            onRelatedLessonClick={handleRelatedLessonClick}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
