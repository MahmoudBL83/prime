'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageTransitionContextType {
    isTransitioning: boolean
    startTransition: (loadingText?: string) => void
    endTransition: () => void
    transitionProgress: number
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined)

export function usePageTransition() {
    const context = useContext(PageTransitionContext)
    if (!context) {
        throw new Error('usePageTransition must be used within a PageTransitionProvider')
    }
    return context
}

interface PageTransitionProviderProps {
    children: React.ReactNode
}

export function PageTransitionProvider({ children }: PageTransitionProviderProps) {
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [loadingText, setLoadingText] = useState('')
    const [transitionProgress, setTransitionProgress] = useState(0)
    const pathname = usePathname()

    // Auto-end transition when pathname changes
    useEffect(() => {
        if (isTransitioning) {
            // Simulate progress completion
            setTransitionProgress(100)
            setTimeout(() => {
                setIsTransitioning(false)
                setTransitionProgress(0)
                setLoadingText('')
            }, 300)
        }
    }, [pathname, isTransitioning])

    const startTransition = (text: string = 'Loading...') => {
        setLoadingText(text)
        setIsTransitioning(true)
        setTransitionProgress(0)
        
        // Simulate progress animation
        let progress = 0
        const interval = setInterval(() => {
            progress += Math.random() * 15
            if (progress > 85) progress = 85 // Cap at 85% until navigation completes
            setTransitionProgress(progress)
            
            if (progress >= 85) {
                clearInterval(interval)
            }
        }, 100)

        return () => clearInterval(interval)
    }

    const endTransition = () => {
        setTransitionProgress(100)
        setTimeout(() => {
            setIsTransitioning(false)
            setTransitionProgress(0)
            setLoadingText('')
        }, 200)
    }

    return (
        <PageTransitionContext.Provider value={{
            isTransitioning,
            startTransition,
            endTransition,
            transitionProgress
        }}>
            {children}
            <PageTransitionOverlay 
                isVisible={isTransitioning}
                loadingText={loadingText}
                progress={transitionProgress}
            />
        </PageTransitionContext.Provider>
    )
}

interface PageTransitionOverlayProps {
    isVisible: boolean
    loadingText: string
    progress: number
}

function PageTransitionOverlay({ isVisible, loadingText, progress }: PageTransitionOverlayProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Loading Bar */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                        className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 transform-gpu"
                        style={{
                            transformOrigin: 'left',
                            transform: `scaleX(${progress / 100})`
                        }}
                    />

                    {/* Full Screen Loading Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9998] bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 25 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 min-w-[200px] border border-gray-200 dark:border-gray-700"
                        >
                            {/* Spinner */}
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 rounded-full"></div>
                                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                                <div className="absolute inset-2 w-8 h-8 border-2 border-transparent border-t-blue-500 rounded-full animate-spin animate-reverse"></div>
                            </div>

                            {/* Loading Text */}
                            <div className="text-center">
                                <p className="text-gray-900 dark:text-gray-100 font-medium">
                                    {loadingText || 'Navigating...'}
                                </p>
                                <div className="flex items-center justify-center gap-1 mt-2">
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full max-w-xs">
                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-600"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.1, ease: 'easeOut' }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                                    {Math.round(progress)}%
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

/**
 * Minimal loading bar component for quick navigations
 */
export function NavigationLoadingBar() {
    const { isTransitioning, transitionProgress } = usePageTransition()

    return (
        <AnimatePresence>
            {isTransitioning && (
                <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: transitionProgress / 100, opacity: 1 }}
                    exit={{ scaleX: 1, opacity: 0 }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                    className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600"
                    style={{ transformOrigin: 'left' }}
                />
            )}
        </AnimatePresence>
    )
}

/**
 * Button loading state component
 */
interface NavigationButtonLoadingProps {
    isLoading: boolean
    children: React.ReactNode
    className?: string
}

export function NavigationButtonLoading({ 
    isLoading, 
    children, 
    className 
}: NavigationButtonLoadingProps) {
    return (
        <div className={cn('relative inline-flex items-center', className)}>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-0 -ml-6"
                >
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                </motion.div>
            )}
            <span className={cn(isLoading && 'opacity-75')}>{children}</span>
        </div>
    )
}

/**
 * Page entrance animation wrapper
 */
interface PageEntranceAnimationProps {
    children: React.ReactNode
    className?: string
    delay?: number
}

export function PageEntranceAnimation({ 
    children, 
    className,
    delay = 0 
}: PageEntranceAnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.5, 
                delay,
                type: 'spring',
                stiffness: 400,
                damping: 25 
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Staggered children animation for lists/grids
 */
interface StaggeredAnimationProps {
    children: React.ReactNode
    className?: string
    staggerDelay?: number
}

export function StaggeredAnimation({ 
    children, 
    className,
    staggerDelay = 0.1 
}: StaggeredAnimationProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            className={className}
        >
            {React.Children.map(children, (child, index) => (
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { 
                            opacity: 1, 
                            y: 0,
                            transition: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 25
                            }
                        }
                    }}
                    key={index}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    )
}