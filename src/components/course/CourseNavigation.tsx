'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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
    moduleId?: string
}

interface Module {
    id: string
    title: string
    titleAr: string
    description?: string
    descriptionAr?: string
    order: number
    lessons: Lesson[]
    isExpanded?: boolean
}

interface CourseNavigationProps {
    courseId: string
    modules: Module[]
    currentLessonId?: string
    onLessonSelect: (lessonId: string) => void
    onLessonComplete: (lessonId: string) => void
    lang?: 'en' | 'de'
}

export default function CourseNavigation({
    courseId,
    modules,
    currentLessonId,
    onLessonSelect,
    onLessonComplete,
    lang = 'en'
}: CourseNavigationProps) {
    const { data: session } = useSession()
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
    const [updatingLessons, setUpdatingLessons] = useState<Set<string>>(new Set())

    // Initialize expanded state
    useEffect(() => {
        const initialExpanded = new Set<string>()
        modules.forEach(module => {
            // Expand first module by default, or module containing current lesson
            if (module.order === 0 || module.lessons.some(lesson => lesson.id === currentLessonId)) {
                initialExpanded.add(module.id)
            }
        })
        setExpandedModules(initialExpanded)

        // Initialize completed lessons
        const completed = new Set<string>()
        modules.forEach(module => {
            module.lessons.forEach(lesson => {
                if (lesson.isCompleted) {
                    completed.add(lesson.id)
                }
            })
        })
        setCompletedLessons(completed)
    }, [modules, currentLessonId])

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules)
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId)
        } else {
            newExpanded.add(moduleId)
        }
        setExpandedModules(newExpanded)
    }

    const handleLessonComplete = async (lessonId: string, event: React.MouseEvent) => {
        event.stopPropagation()

        if (!session) return

        setUpdatingLessons(prev => new Set(prev).add(lessonId))

        try {
            const isCurrentlyCompleted = completedLessons.has(lessonId)

            // Call API to update completion status
            const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
                method: isCurrentlyCompleted ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                // Update local state
                const newCompleted = new Set(completedLessons)
                if (isCurrentlyCompleted) {
                    newCompleted.delete(lessonId)
                } else {
                    newCompleted.add(lessonId)
                }
                setCompletedLessons(newCompleted)

                // Notify parent component
                onLessonComplete(lessonId)
            }
        } catch (error) {
            console.error('Failed to update lesson completion:', error)
        } finally {
            setUpdatingLessons(prev => {
                const newSet = new Set(prev)
                newSet.delete(lessonId)
                return newSet
            })
        }
    }

    const calculateProgress = () => {
        let totalLessons = 0
        let completedCount = 0

        modules.forEach(module => {
            totalLessons += module.lessons.length
            module.lessons.forEach(lesson => {
                if (completedLessons.has(lesson.id)) {
                    completedCount++
                }
            })
        })

        return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
    }

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    const progress = calculateProgress()

    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            {/* Course Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">
                        Course Progress
                    </h3>
                    <span className="text-sm font-medium text-[var(--accent)]">{progress}%</span>
                </div>
                <div className="w-full bg-[var(--muted)] rounded-full h-2">
                    <div
                        className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Modules and Lessons */}
            <div className="space-y-3">
                {modules.map((module) => (
                    <div key={module.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
                        {/* Module Header */}
                        <div
                            className="flex items-center justify-between p-3 bg-[var(--secondary)] cursor-pointer hover:bg-[var(--secondary)]/80 transition-colors"
                            onClick={() => toggleModule(module.id)}
                        >
                            <div className="flex items-center space-x-3">
                                <button
                                    className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                                    aria-label={expandedModules.has(module.id) ? 'Collapse' : 'Expand'}
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-200 ${expandedModules.has(module.id) ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <div>
                                    <h4 className="font-medium text-[var(--foreground)]">
                                        {module.title}
                                    </h4>
                                    {module.description && (
                                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                            {module.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-[var(--muted-foreground)]">
                                <span>
                                    {module.lessons.filter(lesson => completedLessons.has(lesson.id)).length}/{module.lessons.length}
                                </span>
                                <span>•</span>
                                <span>
                                    {Math.floor(module.lessons.reduce((total, lesson) => total + lesson.duration, 0) / 60)}m
                                </span>
                            </div>
                        </div>

                        {/* Lessons */}
                        {expandedModules.has(module.id) && (
                            <div className="divide-y divide-[var(--border)]">
                                {module.lessons.map((lesson) => {
                                    const isCurrent = lesson.id === currentLessonId
                                    const isCompleted = completedLessons.has(lesson.id)
                                    const isUpdating = updatingLessons.has(lesson.id)

                                    return (
                                        <div
                                            key={lesson.id}
                                            className={`p-3 cursor-pointer transition-colors ${isCurrent
                                                ? 'bg-[var(--accent)]/10 border-l-4 border-[var(--accent)]'
                                                : 'hover:bg-[var(--secondary)]/50'
                                                }`}
                                            onClick={() => onLessonSelect(lesson.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3 flex-1">
                                                    {/* Lesson Number */}
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isCompleted
                                                        ? 'bg-green-600 text-foreground'
                                                        : isCurrent
                                                            ? 'bg-[var(--accent)] text-foreground'
                                                            : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                                                        }`}>
                                                        {lesson.order + 1}
                                                    </span>

                                                    {/* Lesson Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className={`font-medium truncate ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'
                                                            }`}>
                                                            {lesson.title}
                                                        </h5>
                                                        {(lesson.description || lesson.descriptionAr) && (
                                                            <p className="text-sm text-[var(--muted-foreground)] truncate mt-1">
                                                                {lesson.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    {/* Duration */}
                                                    <span className="text-sm text-[var(--muted-foreground)]">
                                                        {formatDuration(lesson.duration)}
                                                    </span>

                                                    {/* Complete Checkbox */}
                                                    <button
                                                        onClick={(e) => handleLessonComplete(lesson.id, e)}
                                                        disabled={isUpdating}
                                                        className={`p-1 rounded transition-colors ${isUpdating
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : 'hover:bg-[var(--secondary)]'
                                                            }`}
                                                        aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                                    >
                                                        {isUpdating ? (
                                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : isCompleted ? (
                                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <div className="w-4 h-4 border-2 border-[var(--border)] rounded" />
                                                        )}
                                                    </button>

                                                    {/* Play/Pause Indicator */}
                                                    {isCurrent && (
                                                        <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Mark Complete Button */}
            {progress === 100 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="font-medium text-green-800">
                                Congratulations! Course Completed
                            </h4>
                            <p className="text-sm text-green-600">
                                You have completed all lessons in this course
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
