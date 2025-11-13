'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Play, Plus, Heart, Star, Clock, Users, BookOpen, X, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useSession } from 'next-auth/react'

interface Course {
    id: string
    title?: string
    titleAr?: string
    description?: string
    descriptionAr?: string
    thumbnail?: string
    category?: string
    categoryAr?: string
    skillLevel?: string
    duration?: number | string
    rating?: number
    instructor?: string
    instructorEn?: string
    studentCount?: number
    isEnrolled?: boolean
    userProgress?: number
}

interface NetflixCourseShowcaseProps {
    title: string
    courses: Course[]
    lang?: string
    onCourseClick?: (courseId: string) => void
    courseInteractions?: Record<string, { liked: boolean; inMyList: boolean }>
}

const SKILL_LEVELS = [
    { id: 'Beginner', name: 'Beginner', nameAr: 'مبتدئ', color: 'bg-green-500' },
    { id: 'Intermediate', name: 'Intermediate', nameAr: 'متوسط', color: 'bg-yellow-500' },
    { id: 'Advanced', name: 'Advanced', nameAr: 'متقدم', color: 'bg-red-500' },
]

// Generate random educational image based on course ID
function getRandomCourseImage(courseId: string): string {
    const educationalImages = [
        'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1550439062-609e1531270e?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=1200&fit=crop',
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=1200&fit=crop',
    ]
    
    const hash = courseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return educationalImages[hash % educationalImages.length]
}

function CourseCard({ course, lang, onClick, interactions }: { 
    course: Course; 
    lang: string; 
    onClick: () => void;
    interactions?: { liked: boolean; inMyList: boolean };
}) {
    const [isHovered, setIsHovered] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isInMyList, setIsInMyList] = useState(interactions?.inMyList || false)
    const [isLiked, setIsLiked] = useState(interactions?.liked || false)
    const [actionLoading, setActionLoading] = useState<'list' | 'like' | null>(null)
    const { theme } = useTheme()
    const { data: session } = useSession()
    const [mounted, setMounted] = useState(false)
    const courseImage = getRandomCourseImage(course.id)

    useEffect(() => {
        setMounted(true)
        // Update state when interactions prop changes
        if (interactions) {
            setIsInMyList(interactions.inMyList)
            setIsLiked(interactions.liked)
        }
    }, [interactions])

    const isDark = mounted ? theme === 'dark' : true

    const handleMyList = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!session) {
            // Show login prompt
            return
        }
        
        setActionLoading('list')
        try {
            const response = await fetch(`/api/courses/${course.id}/my-list`, {
                method: isInMyList ? 'DELETE' : 'POST',
            })
            
            if (response.ok) {
                setIsInMyList(!isInMyList)
            }
        } catch (error) {
            console.error('Error updating my list:', error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!session) {
            // Show login prompt
            return
        }
        
        setActionLoading('like')
        try {
            const response = await fetch(`/api/courses/${course.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ liked: !isLiked })
            })
            
            if (response.ok) {
                setIsLiked(!isLiked)
            }
        } catch (error) {
            console.error('Error updating like:', error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleClick = () => {
        setIsLoading(true)
        onClick()
    }

    return (
        <motion.div
            className="relative cursor-pointer flex-shrink-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{
                width: isHovered ? '400px' : '280px',
                zIndex: isHovered ? 999 : 1,
            }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
            <div className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                isHovered 
                    ? 'shadow-2xl shadow-[#00d9c0]/30 ring-4 ring-[#00d9c0]/40' 
                    : 'shadow-xl'
            }`}>
                <div className="relative overflow-hidden bg-background" style={{ height: '420px' }}>
                    <img
                        src={course.thumbnail || courseImage}
                        alt={lang === 'ar' ? (course.titleAr || course.title) : course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = courseImage
                        }}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 0.95 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30"
                    />
                </div>

                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="absolute inset-0 flex flex-col justify-between p-6 z-20"
                        >
                            <div className="flex items-start justify-end">
                                <motion.button
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1, duration: 0.3, type: "spring" }}
                                    className={`w-9 h-9 rounded-full ${
                                        isDark 
                                            ? 'bg-gray-900/90 hover:bg-gray-800 border-white/30 hover:border-white/60' 
                                            : 'bg-white/90 hover:bg-white border-gray-300 hover:border-gray-400'
                                    } flex items-center justify-center backdrop-blur-md border transition-all`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsHovered(false)
                                    }}
                                >
                                    <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} strokeWidth={2.5} />
                                </motion.button>
                            </div>

                            <div className="space-y-3">
                                <motion.h2
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.15, duration: 0.3 }}
                                    className="text-white font-bold text-2xl leading-tight drop-shadow-2xl line-clamp-2"
                                    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}
                                >
                                    {lang === 'ar' ? (course.titleAr || course.title) : course.title}
                                </motion.h2>

                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="flex items-center gap-2.5 text-sm font-medium text-gray-200"
                                >
                                    {course.duration && (
                                        <span className="font-semibold">
                                            {typeof course.duration === 'number' 
                                                ? `${Math.floor(course.duration / 60)}h ${course.duration % 60}m`
                                                : course.duration
                                            }
                                        </span>
                                    )}
                                    
                                    {course.duration && course.category && <span className="text-gray-400">•</span>}
                                    
                                    {course.category && (
                                        <span className="font-semibold">{lang === 'ar' ? course.categoryAr : course.category}</span>
                                    )}
                                    
                                    {course.skillLevel && course.category && <span className="text-gray-400">•</span>}
                                    
                                    {course.skillLevel && SKILL_LEVELS.find(level => level.id === course.skillLevel) && (
                                        <span className="font-semibold capitalize">
                                            {lang === 'ar'
                                                ? SKILL_LEVELS.find(level => level.id === course.skillLevel)?.nameAr
                                                : SKILL_LEVELS.find(level => level.id === course.skillLevel)?.name
                                            }
                                        </span>
                                    )}
                                </motion.div>

                                {course.isEnrolled && course.userProgress !== undefined && course.userProgress > 0 && (
                                    <motion.div
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        transition={{ delay: 0.25, duration: 0.4 }}
                                        className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden"
                                    >
                                        <div
                                            className="h-full bg-gradient-to-r from-[#00d9c0] to-[#00b4a0] transition-all duration-500"
                                            style={{ width: `${course.userProgress}%` }}
                                        />
                                    </motion.div>
                                )}

                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                    className="flex items-center gap-2"
                                >
                                    {/* Watch Now Button with My List and Like inside */}
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                                        <button
                                            onClick={handleClick}
                                            disabled={isLoading}
                                            className="flex items-center gap-3 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="w-12 h-12 bg-gradient-to-br from-[#00d9c0] to-[#00b4a0] rounded-full flex items-center justify-center flex-shrink-0">
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                ) : (
                                                    <Play className="w-5 h-5 ml-0.5 text-white" fill="white" />
                                                )}
                                            </div>
                                            <span className="text-base font-bold text-white pr-2">
                                                {isLoading ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') : (lang === 'ar' ? 'مشاهدة' : 'Watch Now')}
                                            </span>
                                        </button>

                                        {/* My List Button */}
                                        <button
                                            onClick={handleMyList}
                                            disabled={actionLoading === 'list'}
                                            className={`w-11 h-11 hover:bg-white/10 rounded-full flex items-center justify-center transition-all ${
                                                isInMyList ? 'bg-white/20' : ''
                                            } disabled:opacity-50`}
                                            title={isInMyList ? 'Remove from My List' : 'Add to My List'}
                                        >
                                            {actionLoading === 'list' ? (
                                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            ) : isInMyList ? (
                                                <Check className="w-5 h-5 text-white" strokeWidth={3} />
                                            ) : (
                                                <Plus className="w-5 h-5 text-white" />
                                            )}
                                        </button>

                                        {/* Like Button */}
                                        <button
                                            onClick={handleLike}
                                            disabled={actionLoading === 'like'}
                                            className={`w-11 h-11 hover:bg-white/10 rounded-full flex items-center justify-center transition-all mr-2 ${
                                                isLiked ? 'bg-white/20' : ''
                                            } disabled:opacity-50`}
                                            title={isLiked ? 'Unlike' : 'Like'}
                                        >
                                            {actionLoading === 'like' ? (
                                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            ) : (
                                                <Heart 
                                                    className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} 
                                                />
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export function NetflixCourseShowcase({ title, courses, lang = 'en', onCourseClick, courseInteractions }: NetflixCourseShowcaseProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const router = useRouter()

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    useEffect(() => {
        checkScroll()
        const scrollEl = scrollRef.current
        if (scrollEl) {
            scrollEl.addEventListener('scroll', checkScroll)
            return () => scrollEl.removeEventListener('scroll', checkScroll)
        }
    }, [courses])

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 600
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    const handleCourseClick = (courseId: string) => {
        if (onCourseClick) {
            onCourseClick(courseId)
        } else {
            router.push(`/${lang}/courses/${courseId}`)
        }
    }

    if (courses.length === 0) return null

    return (
        <div className="relative group/row mb-16">
            {/* Category Title */}
            <div className="px-6 mb-6">
                <h2 className="text-2xl font-semibold text-white">
                    {title}
                </h2>
            </div>

            {/* Scroll Container */}
            <div className="relative">
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-0 bottom-0 z-40 bg-background/80 hover:bg-background/95 text-foreground p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
                        style={{ width: '40px' }}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto scrollbar-hide px-6 py-2 gap-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            lang={lang}
                            onClick={() => handleCourseClick(course.id)}
                            interactions={courseInteractions?.[course.id]}
                        />
                    ))}
                </div>

                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-0 bottom-0 z-40 bg-background/80 hover:bg-background/95 text-foreground p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
                        style={{ width: '40px' }}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    )
}
