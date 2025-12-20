'use client'

import { useState, useRef, useEffect } from 'react'
import { Heart, X, MessageCircle, User, Star, Book, Zap, Brain, Clock, Users, Target, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

interface StudyBuddy {
    id: string
    name: string
    arabicName?: string | null
    interests: string[]
    goals: string[]
    skillLevel: string | null
    learningMode?: string | null
    profileImage?: string | null
    compatibilityScore: number
    compatibilityBreakdown?: {
        interestsScore: number
        goalsScore: number
        skillLevelScore: number
        communicationScore: number
        learningStyleScore: number
        scheduleScore: number
        subjectScore: number
        preferencesScore: number
    }
    sharedInterests: string[]
    sharedGoals: string[]
    reasonsForMatch?: string[]
}

interface SwipeInterfaceProps {
    potentialMatches: StudyBuddy[]
    onSwipe: (userId: string, action: 'like' | 'pass') => Promise<void>
    onMatch?: (match: any) => void
    isLoading?: boolean
}

export function SwipeInterface({ potentialMatches, onSwipe, onMatch, isLoading = false }: SwipeInterfaceProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragOffset, setDragOffset] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    // Reset index when new matches are loaded
    useEffect(() => {
        setCurrentIndex(0)
    }, [potentialMatches])

    const handleSwipe = async (action: 'like' | 'pass') => {
        if (currentIndex >= potentialMatches.length || isAnimating) return

        const currentMatch = potentialMatches[currentIndex]
        setIsAnimating(true)

        try {
            await onSwipe(currentMatch.id, action)

            // Animate card out
            if (cardRef.current) {
                const direction = action === 'like' ? 1 : -1
                cardRef.current.style.transform = `translateX(${direction * window.innerWidth}px) rotate(${direction * 30}deg)`
                cardRef.current.style.opacity = '0'
            }

            // Move to next card after animation
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1)
                setDragOffset(0)
                setIsAnimating(false)
            }, 300)
        } catch (error) {
            toast.error('Failed to process swipe')
            setIsAnimating(false)
        }
    }

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (isAnimating || currentIndex >= potentialMatches.length) return
        setIsDragging(true)
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        setDragStartX(clientX)
    }

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !cardRef.current || isAnimating) return
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        const deltaX = clientX - dragStartX
        setDragOffset(deltaX)

        const rotation = deltaX * 0.1
        cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`

        const opacity = Math.min(Math.abs(deltaX) / 200, 0.3)
        if (deltaX > 0) {
            cardRef.current.style.boxShadow = `0 0 20px rgba(34, 197, 94, ${opacity})`
        } else {
            cardRef.current.style.boxShadow = `0 0 20px rgba(239, 68, 68, ${opacity})`
        }
    }

    const handleDragEnd = () => {
        if (!isDragging || !cardRef.current || isAnimating) return
        setIsDragging(false)

        if (Math.abs(dragOffset) > 100) {
            const action = dragOffset > 0 ? 'like' : 'pass'
            handleSwipe(action)
        } else {
            cardRef.current.style.transform = 'translateX(0) rotate(0)'
            cardRef.current.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
            setDragOffset(0)
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
            handleSwipe('pass')
        } else if (e.key === 'ArrowRight') {
            handleSwipe('like')
        }
    }

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex, potentialMatches])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-3 border-white/30 border-t-[#0a84ff] rounded-full"
                />
            </div>
        )
    }

    if (currentIndex >= potentialMatches.length) {
        return (
            <div className="bg-white/5 backdrop-blur-sm border border-border rounded-2xl p-8">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-[#0a84ff]/20 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-[#0a84ff]" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No more matches available</h3>
                    <p className="text-muted-foreground mb-6">Check back later for new study buddies!</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                    >
                        Refresh Matches
                    </button>
                </div>
            </div>
        )
    }

    const currentMatch = potentialMatches[currentIndex]

    return (
        <div className="relative w-full mx-auto" style={{ height: '600px' }}>
            {/* Card Stack Background */}
            <div className="absolute inset-0">
                {potentialMatches.slice(currentIndex + 1, currentIndex + 3).map((match, index) => (
                    <motion.div
                        key={match.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 - index * 0.15 }}
                        className="absolute bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-border rounded-3xl p-6 shadow-2xl"
                        style={{
                            width: '100%',
                            height: '520px',
                            transform: `scale(${0.96 - index * 0.03}) translateY(${index * 8}px)`,
                            zIndex: 10 - index,
                        }}
                    >
                        <div className="flex items-center justify-center h-full text-gray-500/50">
                            <User className="w-16 h-16" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Swipeable Card */}
            <motion.div
                ref={cardRef}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl cursor-grab active:cursor-grabbing transition-shadow duration-300 hover:border-white/20"
                style={{
                    width: '100%',
                    height: '520px',
                    zIndex: 20,
                    transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
                }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
            >
                {/* Subtle Background Accent */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#0a84ff]/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#0a84ff]/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 h-full flex flex-col p-6">
                    {/* Header Section - Profile Info */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="relative group">
                                {currentMatch.profileImage ? (
                                    <img
                                        src={currentMatch.profileImage}
                                        alt={currentMatch.name}
                                        className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl ring-4 ring-[#0a84ff]/20"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-[#0a84ff] flex items-center justify-center shadow-xl ring-4 ring-[#0a84ff]/20">
                                        <span className="text-foreground text-3xl font-bold">
                                            {currentMatch.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                {/* Online Indicator */}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-foreground mb-1">{currentMatch.name}</h3>
                                {currentMatch.arabicName && (
                                    <p className="text-base text-muted-foreground mb-2">{currentMatch.arabicName}</p>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                        <span className="text-xs text-gray-200 font-medium capitalize">
                                            {currentMatch.skillLevel?.toLowerCase() || 'Learning'}
                                        </span>
                                    </div>
                                    {currentMatch.learningMode && (
                                        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                            <Users className="w-3.5 h-3.5 text-[#0a84ff]" />
                                            <span className="text-xs text-gray-200 font-medium capitalize">
                                                {currentMatch.learningMode}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Compatibility Score Badge */}
                        <div className="text-center">
                            <div className="bg-[#0a84ff]/20 backdrop-blur-sm rounded-2xl p-4 border border-[#0a84ff]/40 shadow-lg">
                                <div className="text-3xl font-black text-[#0a84ff] mb-1">
                                    {currentMatch.compatibilityScore}%
                                </div>
                                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Match</div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section - Scrollable */}
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '340px' }}>
                        {/* Match Reasons Highlight */}
                        {currentMatch.reasonsForMatch && currentMatch.reasonsForMatch.length > 0 && (
                            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    <h4 className="font-bold text-base text-foreground">Why You'll Click</h4>
                                </div>
                                <div className="space-y-2">
                                    {currentMatch.reasonsForMatch.slice(0, 3).map((reason, index) => (
                                        <div key={index} className="flex items-start gap-2.5">
                                            <div className="w-2 h-2 bg-[#0a84ff] rounded-full mt-1.5 flex-shrink-0" />
                                            <span className="text-sm text-gray-200 leading-relaxed">{reason}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Compatibility Breakdown */}
                        {currentMatch.compatibilityBreakdown && (
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <Brain className="w-5 h-5 text-[#0a84ff]" />
                                    <h4 className="font-bold text-base text-foreground">Compatibility Details</h4>
                                </div>
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-[#0a84ff]" />
                                            <span className="text-sm text-muted-foreground">Interests</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-card rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0a84ff] rounded-full"
                                                    style={{ width: `${currentMatch.compatibilityBreakdown.interestsScore}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-[#0a84ff] font-semibold w-10 text-right">
                                                {currentMatch.compatibilityBreakdown.interestsScore}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4 text-[#0a84ff]" />
                                            <span className="text-sm text-muted-foreground">Goals</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-card rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0a84ff] rounded-full"
                                                    style={{ width: `${currentMatch.compatibilityBreakdown.goalsScore}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-[#0a84ff] font-semibold w-10 text-right">
                                                {currentMatch.compatibilityBreakdown.goalsScore}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4 text-[#0a84ff]" />
                                            <span className="text-sm text-muted-foreground">Communication</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-card rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0a84ff] rounded-full"
                                                    style={{ width: `${currentMatch.compatibilityBreakdown.communicationScore}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-[#0a84ff] font-semibold w-10 text-right">
                                                {currentMatch.compatibilityBreakdown.communicationScore}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-[#0a84ff]" />
                                            <span className="text-sm text-muted-foreground">Schedule</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-1.5 bg-card rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#0a84ff] rounded-full"
                                                    style={{ width: `${currentMatch.compatibilityBreakdown.scheduleScore}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-[#0a84ff] font-semibold w-10 text-right">
                                                {currentMatch.compatibilityBreakdown.scheduleScore}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shared Interests & Goals - Side by Side */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#0a84ff]/10 backdrop-blur-sm border border-[#0a84ff]/20 rounded-2xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Book className="w-4 h-4 text-[#0a84ff]" />
                                    <h4 className="font-semibold text-sm text-foreground">Interests</h4>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {currentMatch.sharedInterests.length > 0 ? (
                                        currentMatch.sharedInterests.slice(0, 3).map((interest) => (
                                            <span
                                                key={interest}
                                                className="px-2 py-1 bg-[#0a84ff]/30 text-white text-xs rounded-lg font-medium"
                                            >
                                                {interest}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Explore together</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#0a84ff]/10 backdrop-blur-sm border border-[#0a84ff]/20 rounded-2xl p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-4 h-4 text-[#0a84ff]" />
                                    <h4 className="font-semibold text-sm text-foreground">Goals</h4>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {currentMatch.sharedGoals.length > 0 ? (
                                        currentMatch.sharedGoals.slice(0, 3).map((goal) => (
                                            <span
                                                key={goal}
                                                className="px-2 py-1 bg-[#0a84ff]/30 text-white text-xs rounded-lg font-medium"
                                            >
                                                {goal}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground italic">Grow together</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Enhanced Action Buttons */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-4 z-30 pb-4">
                <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe('pass')}
                    disabled={isAnimating}
                    className="group relative p-5 bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-500/50 text-white rounded-full shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    <X className="w-7 h-7" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-foreground text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Pass
                    </span>
                </motion.button>

                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-border rounded-full"
                >
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-[#0a84ff] rounded-full animate-pulse"></div>
                        <span className="font-medium">{potentialMatches.length - currentIndex} remaining</span>
                    </div>
                </motion.div>

                <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSwipe('like')}
                    disabled={isAnimating}
                    className="group relative p-5 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white rounded-full shadow-2xl shadow-[#0a84ff]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[#0a84ff]/50"
                >
                    <Heart className="w-7 h-7" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-foreground text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Like
                    </span>
                </motion.button>
            </div>
        </div>
    )
}
