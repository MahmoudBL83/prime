'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    ChevronRight, 
    ChevronDown, 
    CheckCircle2, 
    Circle, 
    Clock, 
    PlayCircle,
    Lock
} from 'lucide-react'

interface Lesson {
    id: string
    title: string
    duration: number // in seconds
    order: number
    isCompleted: boolean
    isLocked?: boolean
}

interface Section {
    id: string
    title: string
    order: number
    lessons: Lesson[]
}

interface LessonSidebarProps {
    courseId: string
    sections: Section[]
    currentLessonId: string
    onLessonSelect: (lessonId: string) => void
    isArabic?: boolean
}

export default function LessonSidebar({
    courseId,
    sections,
    currentLessonId,
    onLessonSelect,
    isArabic = false
}: LessonSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [progress, setProgress] = useState({ completed: 0, total: 0 })

    useEffect(() => {
        // Auto-expand section containing current lesson
        const currentSection = sections.find(section =>
            section.lessons.some(lesson => lesson.id === currentLessonId)
        )
        if (currentSection) {
            setExpandedSections(prev => new Set([...prev, currentSection.id]))
        }

        // Calculate progress
        const totalLessons = sections.reduce((sum, section) => sum + section.lessons.length, 0)
        const completedLessons = sections.reduce(
            (sum, section) => sum + section.lessons.filter(lesson => lesson.isCompleted).length,
            0
        )
        setProgress({ completed: completedLessons, total: totalLessons })
    }, [sections, currentLessonId])

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev)
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId)
            } else {
                newSet.add(sectionId)
            }
            return newSet
        })
    }

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60)
        const secs = seconds % 60
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60)
            const mins = minutes % 60
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    const getTotalSectionDuration = (section: Section): number => {
        return section.lessons.reduce((sum, lesson) => sum + lesson.duration, 0)
    }

    const getSectionProgress = (section: Section): number => {
        const completed = section.lessons.filter(lesson => lesson.isCompleted).length
        return section.lessons.length > 0 ? Math.round((completed / section.lessons.length) * 100) : 0
    }

    const handleLessonClick = (lesson: Lesson) => {
        if (lesson.isLocked) {
            return
        }
        onLessonSelect(lesson.id)
    }

    const progressPercentage = progress.total > 0 
        ? Math.round((progress.completed / progress.total) * 100) 
        : 0

    return (
        <div className="h-full flex flex-col bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border">
                <h3 className="text-lg font-bold text-foreground mb-3">
                    {isArabic ? 'محتوى الدورة' : 'Course Content'}
                </h3>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {isArabic ? 'تقدمك' : 'Your Progress'}
                        </span>
                        <span className="text-foreground font-semibold">
                            {progress.completed} / {progress.total}
                        </span>
                    </div>
                    <div className="relative h-2 bg-card rounded-full overflow-hidden">
                        <motion.div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-medium text-purple-400">
                            {progressPercentage}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Sections & Lessons List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-1">
                    {sections.map((section, sectionIndex) => {
                        const isExpanded = expandedSections.has(section.id)
                        const sectionProgress = getSectionProgress(section)
                        const totalDuration = getTotalSectionDuration(section)

                        return (
                            <div key={section.id} className="mb-1">
                                {/* Section Header */}
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-card rounded-lg transition-colors group"
                                >
                                    <div className="flex items-center space-x-3 flex-1 text-left">
                                        <motion.div
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-xs font-semibold text-purple-400">
                                                    {isArabic ? 'قسم' : 'Section'} {sectionIndex + 1}
                                                </span>
                                                {sectionProgress === 100 && (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                )}
                                            </div>
                                            <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                                                {section.title}
                                            </h4>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="text-xs text-muted-foreground">
                                                    {section.lessons.length} {isArabic ? 'دروس' : 'lessons'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatDuration(totalDuration)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Progress Badge */}
                                    <div className="ml-2 px-2 py-1 bg-background rounded text-xs font-medium text-purple-400">
                                        {sectionProgress}%
                                    </div>
                                </button>

                                {/* Lessons List */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-1 space-y-1 pl-4">
                                                {section.lessons.map((lesson, lessonIndex) => {
                                                    const isCurrent = lesson.id === currentLessonId
                                                    const isDisabled = lesson.isLocked

                                                    return (
                                                        <motion.button
                                                            key={lesson.id}
                                                            onClick={() => handleLessonClick(lesson)}
                                                            disabled={isDisabled}
                                                            className={`
                                                                w-full flex items-start space-x-3 p-3 rounded-lg transition-all
                                                                ${isCurrent 
                                                                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50 shadow-lg shadow-purple-500/20' 
                                                                    : lesson.isCompleted
                                                                    ? 'bg-gray-800/30 hover:bg-card-hover'
                                                                    : 'bg-gray-800/20 hover:bg-gray-800/40'
                                                                }
                                                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                                            `}
                                                            whileHover={!isDisabled ? { scale: 1.02, x: 4 } : {}}
                                                            whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                                        >
                                                            {/* Status Icon */}
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                {isDisabled ? (
                                                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                                                ) : lesson.isCompleted ? (
                                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                ) : isCurrent ? (
                                                                    <PlayCircle className="w-5 h-5 text-purple-400" />
                                                                ) : (
                                                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                                                )}
                                                            </div>

                                                            {/* Lesson Info */}
                                                            <div className="flex-1 text-left">
                                                                <div className="flex items-center space-x-2 mb-1">
                                                                    <span className="text-xs font-medium text-muted-foreground">
                                                                        {lessonIndex + 1}.
                                                                    </span>
                                                                    {isCurrent && (
                                                                        <span className="text-xs font-semibold text-purple-400">
                                                                            {isArabic ? 'الدرس الحالي' : 'Now Playing'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h5 className={`
                                                                    text-sm font-medium mb-1 line-clamp-2
                                                                    ${isCurrent ? 'text-foreground' : lesson.isCompleted ? 'text-muted-foreground' : 'text-muted-foreground'}
                                                                `}>
                                                                    {lesson.title}
                                                                </h5>
                                                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>{formatDuration(lesson.duration)}</span>
                                                                </div>
                                                            </div>

                                                            {/* Current Indicator */}
                                                            {isCurrent && (
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                                                                </div>
                                                            )}
                                                        </motion.button>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer - Expand/Collapse All */}
            <div className="p-3 border-t border-border">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setExpandedSections(new Set(sections.map(s => s.id)))}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        {isArabic ? 'توسيع الكل' : 'Expand All'}
                    </button>
                    <button
                        onClick={() => setExpandedSections(new Set())}
                        className="text-xs text-muted-foreground hover:text-muted-foreground transition-colors"
                    >
                        {isArabic ? 'طي الكل' : 'Collapse All'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(31, 41, 55, 0.3);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.5);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(139, 92, 246, 0.7);
                }
            `}</style>
        </div>
    )
}
