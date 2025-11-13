'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react'

interface NavigationLesson {
    id: string
    title: string
    order: number
}

interface QuickNavigationProps {
    previousLesson: NavigationLesson | null
    nextLesson: NavigationLesson | null
    onPrevious: () => void
    onNext: () => void
    enableKeyboardShortcuts?: boolean
    isArabic?: boolean
}

export default function QuickNavigation({
    previousLesson,
    nextLesson,
    onPrevious,
    onNext,
    enableKeyboardShortcuts = true,
    isArabic = false
}: QuickNavigationProps) {
    
    useEffect(() => {
        if (!enableKeyboardShortcuts) return

        const handleKeyPress = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            const target = e.target as HTMLElement
            if (
                target.tagName === 'INPUT' || 
                target.tagName === 'TEXTAREA' || 
                target.isContentEditable
            ) {
                return
            }

            // P key for Previous
            if (e.key === 'p' || e.key === 'P') {
                if (previousLesson) {
                    e.preventDefault()
                    onPrevious()
                }
            }

            // N key for Next
            if (e.key === 'n' || e.key === 'N') {
                if (nextLesson) {
                    e.preventDefault()
                    onNext()
                }
            }

            // Arrow Left for Previous
            if (e.key === 'ArrowLeft' && e.shiftKey) {
                if (previousLesson) {
                    e.preventDefault()
                    onPrevious()
                }
            }

            // Arrow Right for Next
            if (e.key === 'ArrowRight' && e.shiftKey) {
                if (nextLesson) {
                    e.preventDefault()
                    onNext()
                }
            }
        }

        window.addEventListener('keydown', handleKeyPress)
        return () => window.removeEventListener('keydown', handleKeyPress)
    }, [previousLesson, nextLesson, onPrevious, onNext, enableKeyboardShortcuts])

    return (
        <div className="flex items-center justify-between gap-4 p-4 bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl">
            {/* Previous Button */}
            <motion.button
                onClick={onPrevious}
                disabled={!previousLesson}
                className={`
                    group flex items-center space-x-3 px-5 py-3 rounded-lg transition-all flex-1
                    ${previousLesson
                        ? 'bg-gradient-to-r from-gray-800 to-gray-700 hover:from-purple-600 hover:to-purple-500 text-foreground shadow-lg hover:shadow-purple-500/30'
                        : 'bg-gray-800/30 text-muted-foreground cursor-not-allowed'
                    }
                `}
                whileHover={previousLesson ? { scale: 1.02, x: -4 } : {}}
                whileTap={previousLesson ? { scale: 0.98 } : {}}
            >
                {/* Icon */}
                <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${previousLesson 
                        ? 'bg-gray-700 group-hover:bg-purple-500/20' 
                        : 'bg-gray-800/50'
                    }
                `}>
                    {isArabic ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <ChevronLeft className="w-5 h-5" />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">
                        {isArabic ? 'الدرس السابق' : 'Previous Lesson'}
                    </div>
                    <div className={`
                        text-sm font-semibold line-clamp-1
                        ${previousLesson ? 'text-foreground' : 'text-muted-foreground'}
                    `}>
                        {previousLesson ? previousLesson.title : (isArabic ? 'لا يوجد' : 'None')}
                    </div>
                    {previousLesson && enableKeyboardShortcuts && (
                        <div className="flex items-center space-x-1 mt-1">
                            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-background border border-border rounded">
                                P
                            </kbd>
                            <span className="text-xs text-muted-foreground">or</span>
                            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-background border border-border rounded">
                                Shift
                            </kbd>
                            <span className="text-xs text-muted-foreground">+</span>
                            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-background border border-border rounded">
                                ←
                            </kbd>
                        </div>
                    )}
                </div>

                {/* Decorative Icon */}
                {previousLesson && (
                    <SkipBack className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </motion.button>

            {/* Divider */}
            <div className="w-px h-12 bg-card" />

            {/* Next Button */}
            <motion.button
                onClick={onNext}
                disabled={!nextLesson}
                className={`
                    group flex items-center space-x-3 px-5 py-3 rounded-lg transition-all flex-1
                    ${nextLesson
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-foreground shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
                        : 'bg-gray-800/30 text-muted-foreground cursor-not-allowed'
                    }
                `}
                whileHover={nextLesson ? { scale: 1.02, x: 4 } : {}}
                whileTap={nextLesson ? { scale: 0.98 } : {}}
            >
                {/* Decorative Icon */}
                {nextLesson && (
                    <SkipForward className="w-4 h-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}

                {/* Content */}
                <div className="flex-1 text-right">
                    <div className="text-xs font-medium text-purple-200 mb-0.5">
                        {isArabic ? 'الدرس التالي' : 'Next Lesson'}
                    </div>
                    <div className={`
                        text-sm font-semibold line-clamp-1
                        ${nextLesson ? 'text-foreground' : 'text-muted-foreground'}
                    `}>
                        {nextLesson ? nextLesson.title : (isArabic ? 'لا يوجد' : 'None')}
                    </div>
                    {nextLesson && enableKeyboardShortcuts && (
                        <div className="flex items-center justify-end space-x-1 mt-1">
                            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-purple-900/50 border border-purple-700 rounded">
                                N
                            </kbd>
                            <span className="text-xs text-purple-200">or</span>
                            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-purple-900/50 border border-purple-700 rounded">
                                Shift
                            </kbd>
                            <span className="text-xs text-purple-200">+</span>
                            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-purple-900/50 border border-purple-700 rounded">
                                →
                            </kbd>
                        </div>
                    )}
                </div>

                {/* Icon */}
                <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${nextLesson 
                        ? 'bg-white/10 group-hover:bg-white/20' 
                        : 'bg-gray-800/50'
                    }
                `}>
                    {isArabic ? (
                        <ChevronLeft className="w-5 h-5" />
                    ) : (
                        <ChevronRight className="w-5 h-5" />
                    )}
                </div>
            </motion.button>
        </div>
    )
}
