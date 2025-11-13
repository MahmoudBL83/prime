'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
    ChevronDown,
    ChevronRight,
    Play,
    CheckCircle,
    Clock,
    FileText,
    Download,
    BookOpen,
    Settings,
    MoreVertical,
    Star,
    Share2,
    MessageCircle,
    ArrowLeft,
    Menu,
    X,
    HelpCircle,
    PenTool,
    BookmarkIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import ImprovedVideoPlayer from '@/components/course/ImprovedVideoPlayer'
import QuizComponent from '@/components/course/QuizComponent'
import AssignmentComponent from '@/components/course/AssignmentComponent'
import ReadingMaterialComponent from '@/components/course/ReadingMaterialComponent'

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
    type: 'video' | 'quiz' | 'assignment' | 'reading'
    videoUrl?: string
    isCompleted: boolean
    moduleId: string
    objectives?: Objective[]
    resources?: Resource[]
    transcript?: string
    transcriptAr?: string
    // Quiz content
    quiz?: {
        questions: {
            id: string
            question: string
            questionAr: string
            type: 'multiple-choice' | 'true-false'
            options?: {
                id: string
                text: string
                textAr: string
                isCorrect: boolean
            }[]
            correctAnswer?: string
            explanation?: string
            explanationAr?: string
        }[]
        passingScore: number
    }
    // Assignment content
    assignment?: {
        title: string
        titleAr: string
        description: string
        descriptionAr: string
        instructions: string
        instructionsAr: string
        dueDate?: Date
        maxPoints: number
        allowedFileTypes: string[]
        maxFileSize: number
        resources?: {
            title: string
            titleAr: string
            url: string
            type: string
        }[]
    }
    // Reading material content
    reading?: {
        content: string
        contentAr: string
        estimatedReadingTime: number
        keyPoints?: {
            text: string
            textAr: string
        }[]
        resources?: {
            title: string
            titleAr: string
            url: string
            type: 'pdf' | 'doc' | 'link' | 'video'
            description?: string
            descriptionAr?: string
        }[]
    }
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
    instructor?: {
        name: string
        avatar?: string
        bio?: string
    }
}

export default function UdemyStyleCoursePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const [course, setCourse] = useState<Course | null>(null)
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
    const [loading, setLoading] = useState(true)
    const [lang, setLang] = useState<'en' | 'ar'>('ar')
    const [videoProgress, setVideoProgress] = useState(0)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
    const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'resources'>('overview')

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

            // Auto-expand modules
            const initialExpanded = new Set<string>()
            course.modules.forEach((module, index) => {
                if (index < 2) { // Expand first 2 modules by default
                    initialExpanded.add(module.id)
                }
            })
            setExpandedModules(initialExpanded)

            // Set completed lessons
            const completed = new Set<string>()
            course.modules.forEach(module => {
                module.lessons.forEach(lesson => {
                    if (lesson.isCompleted) {
                        completed.add(lesson.id)
                    }
                })
            })
            setCompletedLessons(completed)
        }
    }, [course])

    const fetchCourse = async () => {
        try {
            // Add demo parameter to allow access without enrollment
            const response = await fetch(`/api/courses/${params.id}/learn?demo=true`)
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
            setVideoProgress(0)
        }
    }

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules)
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId)
        } else {
            newExpanded.add(moduleId)
        }
        setExpandedModules(newExpanded)
    }

    const handleLessonComplete = async (lessonId: string) => {
        if (!session) return

        try {
            const response = await fetch(`/api/courses/${params.id}/lessons/${lessonId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            if (response.ok) {
                setCompletedLessons(prev => new Set(prev).add(lessonId))
                toast.success('Lesson completed!')
            }
        } catch (error) {
            console.error('Error completing lesson:', error)
        }
    }

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        return `${minutes}min`
    }

    const getTotalModuleDuration = (module: Module) => {
        return module.lessons.reduce((total, lesson) => total + lesson.duration, 0)
    }

    const getCompletedLessonsInModule = (module: Module) => {
        return module.lessons.filter(lesson => completedLessons.has(lesson.id)).length
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading course...</p>
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Course not found</p>
            </div>
        )
    }

    return (
        <div className="h-screen flex bg-gray-900">
            {/* Course Content Sidebar */}
            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/courses')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Courses
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <h1 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                        {lang === 'en' ? course.title : course.titleAr}
                    </h1>
                    <div className="flex items-center justify-between text-sm text-gray-700">
                        <span>{course.progress}% complete</span>
                        <span>{course.totalLessons} lessons</span>
                    </div>
                    <Progress value={course.progress} className="mt-2 h-2" />
                </div>

                {/* Course Content */}
                <div className="flex-1 overflow-y-auto">
                    {course.modules.map((module) => (
                        <div key={module.id} className="border-b border-gray-100">
                            <button
                                onClick={() => toggleModule(module.id)}
                                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {expandedModules.has(module.id) ? (
                                            <ChevronDown className="w-4 h-4 text-gray-600" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                        )}
                                        <span className="font-medium text-gray-900">
                                            {lang === 'en' ? module.title : module.titleAr}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {getCompletedLessonsInModule(module)}/{module.lessons.length}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                                    <span>{module.lessons.length} lessons</span>
                                    <span>{formatDuration(getTotalModuleDuration(module))}</span>
                                </div>
                            </button>

                            {expandedModules.has(module.id) && (
                                <div className="pb-2">
                                    {module.lessons.map((lesson) => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleLessonSelect(lesson.id)}
                                            className={`w-full p-3 pl-8 text-left hover:bg-blue-50 transition-colors border-l-2 ${currentLesson?.id === lesson.id
                                                ? 'bg-blue-50 border-blue-500'
                                                : 'border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0">
                                                    {completedLessons.has(lesson.id) ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <>
                                                            {lesson.type === 'video' && <Play className="w-5 h-5 text-gray-400" />}
                                                            {lesson.type === 'quiz' && <HelpCircle className="w-5 h-5 text-purple-500" />}
                                                            {lesson.type === 'assignment' && <PenTool className="w-5 h-5 text-orange-500" />}
                                                            {lesson.type === 'reading' && <BookmarkIcon className="w-5 h-5 text-blue-500" />}
                                                            {!lesson.type && <Play className="w-5 h-5 text-gray-400" />}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${currentLesson?.id === lesson.id
                                                        ? 'text-blue-600'
                                                        : 'text-gray-900'
                                                        }`}>
                                                        {lang === 'en' ? lesson.title : lesson.titleAr}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-600">
                                                            {formatDuration(lesson.duration)}
                                                        </span>
                                                        {lesson.resources && lesson.resources.length > 0 && (
                                                            <>
                                                                <FileText className="w-3 h-3 text-gray-400" />
                                                                <span className="text-xs text-gray-600">
                                                                    {lesson.resources.length} resources
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-black">
                {/* Top Bar */}
                <div className="bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {!sidebarOpen && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(true)}
                                className="text-white hover:bg-gray-800"
                            >
                                <Menu className="w-4 h-4" />
                            </Button>
                        )}
                        <div className="text-white">
                            <h2 className="font-medium">
                                {currentLesson ? (lang === 'en' ? currentLesson.title : currentLesson.titleAr) : 'Select a lesson'}
                            </h2>
                            {currentLesson && (
                                <p className="text-sm text-gray-400">
                                    {formatDuration(currentLesson.duration)} • {course.instructor?.name || 'Instructor'}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                            <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
                            <Star className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative">
                    {currentLesson ? (
                        <div className="h-full">
                            {/* Video Lesson */}
                            {currentLesson.type === 'video' && currentLesson.videoUrl && (
                                <ImprovedVideoPlayer
                                    videoSources={[{
                                        quality: '720p',
                                        url: currentLesson.videoUrl,
                                        label: '720p HD'
                                    }]}
                                    courseId={params.id as string}
                                    lessonId={currentLesson.id}
                                    onProgressUpdate={(progress: number, currentTime: number) => setVideoProgress(progress)}
                                    onComplete={() => handleLessonComplete(currentLesson.id)}
                                />
                            )}

                            {/* Quiz Lesson */}
                            {currentLesson.type === 'quiz' && currentLesson.quiz && (
                                <div className="h-full bg-white overflow-y-auto">
                                    <QuizComponent
                                        questions={currentLesson.quiz.questions}
                                        lessonId={currentLesson.id}
                                        lang={lang}
                                        passingScore={currentLesson.quiz.passingScore}
                                        onComplete={(score, passed) => {
                                            if (passed) {
                                                handleLessonComplete(currentLesson.id)
                                            }
                                            toast.success(`Quiz completed! Score: ${score}%`)
                                        }}
                                    />
                                </div>
                            )}

                            {/* Assignment Lesson */}
                            {currentLesson.type === 'assignment' && currentLesson.assignment && (
                                <div className="h-full bg-white overflow-y-auto">
                                    <AssignmentComponent
                                        assignment={{
                                            ...currentLesson.assignment,
                                            id: currentLesson.id,
                                        }}
                                        lang={lang}
                                        onSubmit={(files, text) => {
                                            // Handle assignment submission
                                            handleLessonComplete(currentLesson.id)
                                            toast.success('Assignment submitted successfully!')
                                        }}
                                    />
                                </div>
                            )}

                            {/* Reading Material Lesson */}
                            {currentLesson.type === 'reading' && currentLesson.reading && (
                                <div className="h-full bg-white">
                                    <ReadingMaterialComponent
                                        material={{
                                            id: currentLesson.id,
                                            title: currentLesson.title,
                                            titleAr: currentLesson.titleAr,
                                            ...currentLesson.reading
                                        }}
                                        lang={lang}
                                        onComplete={() => handleLessonComplete(currentLesson.id)}
                                        isCompleted={currentLesson.isCompleted}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-800">
                            <div className="text-center text-white">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                                <p className="text-lg mb-2">Select a lesson to begin</p>
                                <p className="text-gray-400">Choose from videos, quizzes, assignments, or reading materials</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Content Tabs */}
                <div className="bg-white border-t border-gray-200">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('notes')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'notes'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Notes
                        </button>
                        <button
                            onClick={() => setActiveTab('resources')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'resources'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Resources
                        </button>
                    </div>

                    <div className="p-6 max-h-48 overflow-y-auto">
                        {activeTab === 'overview' && currentLesson && (
                            <div>
                                <h3 className="font-semibold text-lg mb-3">
                                    {lang === 'en' ? currentLesson.title : currentLesson.titleAr}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {lang === 'en' ? currentLesson.description : currentLesson.descriptionAr}
                                </p>
                                {currentLesson.objectives && currentLesson.objectives.length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2">Learning Objectives:</h4>
                                        <ul className="space-y-1">
                                            {currentLesson.objectives.map((objective) => (
                                                <li key={objective.id} className="flex items-start gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">
                                                        {lang === 'en' ? objective.text : objective.textAr}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Your Notes</h3>
                                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                                    <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p>Take notes while watching the lesson</p>
                                    <Button size="sm" className="mt-2">Add Note</Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'resources' && currentLesson && (
                            <div>
                                <h3 className="font-semibold text-lg mb-3">Lesson Resources</h3>
                                {currentLesson.resources && currentLesson.resources.length > 0 ? (
                                    <div className="space-y-2">
                                        {currentLesson.resources.map((resource) => (
                                            <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-gray-600" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {lang === 'en' ? resource.title : resource.titleAr}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {resource.type.toUpperCase()} {resource.size && `• ${resource.size}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="outline">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                                        <FileText className="w-8 h-8 mx-auto mb-2" />
                                        <p>No resources available for this lesson</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
