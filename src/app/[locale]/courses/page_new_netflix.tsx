'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronLeft, ChevronRight, BookOpen, Star, Loader2, Play, Plus, Heart, Info, Clock, Users, X } from 'lucide-react'

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    thumbnail?: string
    creatorId: string
    category: string
    categoryAr: string
    skillLevel: string
    duration: number
    totalViews: number
    totalEnrollments: number
    rating: number
    creator: {
        user: {
            name: string
            arabicName?: string
        }
    }
    userProgress?: number
    isEnrolled?: boolean
}

interface CategoryCourses {
    category: string
    categoryAr: string
    courses: Course[]
}

interface UserProfile {
    subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
    enrollments?: Array<{
        courseId: string
        progress: number
        lastAccessed: string
    }>
}

const SKILL_LEVELS = [
    { id: 'Beginner', name: 'Beginner', nameAr: 'مبتدئ', color: 'bg-green-500' },
    { id: 'Intermediate', name: 'Intermediate', nameAr: 'متوسط', color: 'bg-yellow-500' },
    { id: 'Advanced', name: 'Advanced', nameAr: 'متقدم', color: 'bg-red-500' },
]

// Netflix-style Course Card with Modal Hover
function CourseCard({ course, lang, onClick, onHover }: {
    course: Course
    lang: string
    onClick: () => void
    onHover: (course: Course | null) => void
}) {
    const [isHovered, setIsHovered] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    return (
        <motion.div
            className="relative group flex-shrink-0 cursor-pointer"
            style={{ width: '250px' }}
            onMouseEnter={() => {
                setIsHovered(true)
                onHover(course)
            }}
            onMouseLeave={() => {
                setIsHovered(false)
                onHover(null)
            }}
            whileHover={{ scale: 1.15, zIndex: 50 }}
            transition={{ duration: 0.3 }}
        >
            {/* Card Container */}
            <div className="relative rounded-lg overflow-hidden shadow-2xl bg-gray-900">
                {/* Poster Image */}
                <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                        src={course.thumbnail || `/images/courses/IMG-20251009-WA00${78 + (parseInt(course.id.slice(-2), 16) % 4)}.jpg`}
                        alt={lang === 'ar' ? course.titleAr : course.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                            isHovered ? 'scale-105 brightness-75' : ''
                        }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-course.jpg'
                        }}
                    />
                    
                    {/* Gradient Overlay - Always visible on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-300 ${
                        isHovered ? 'opacity-100' : 'opacity-0'
                    }`} />
                </div>

                {/* Hover Content - Netflix Modal Style */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex flex-col justify-between p-4 z-10"
                        >
                            {/* Top Section - Badge */}
                            <div className="flex items-start justify-between">
                                {course.isEnrolled && (
                                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-white" />
                                        {lang === 'ar' ? 'مسجل' : 'Enrolled'}
                                    </span>
                                )}
                            </div>

                            {/* Bottom Section - Info */}
                            <div className="space-y-2">
                                {/* Title */}
                                <h3 className="font-bold text-white text-base leading-tight line-clamp-2">
                                    {lang === 'ar' ? course.titleAr : course.title}
                                </h3>

                                {/* Metadata Row */}
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    {course.duration && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {Math.floor(course.duration / 60)}h
                                        </span>
                                    )}
                                    <span>•</span>
                                    <span>{lang === 'ar' ? course.categoryAr : course.category}</span>
                                    {course.rating && (
                                        <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                {course.rating.toFixed(1)}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Skill Level Badge */}
                                {SKILL_LEVELS.find(level => level.id === course.skillLevel) && (
                                    <div>
                                        <span className={`text-xs px-2 py-1 rounded text-white ${
                                            SKILL_LEVELS.find(level => level.id === course.skillLevel)?.color
                                        }`}>
                                            {lang === 'ar'
                                                ? SKILL_LEVELS.find(level => level.id === course.skillLevel)?.nameAr
                                                : SKILL_LEVELS.find(level => level.id === course.skillLevel)?.name
                                            }
                                        </span>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                {course.isEnrolled && course.userProgress !== undefined && course.userProgress > 0 && (
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-300">{course.userProgress}% {lang === 'ar' ? 'مكتمل' : 'Complete'}</span>
                                        </div>
                                        <div className="w-full bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all duration-500"
                                                style={{ width: `${course.userProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        className="flex-1 bg-white hover:bg-gray-200 text-black px-3 py-2 rounded text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onClick()
                                        }}
                                    >
                                        <Play className="w-4 h-4" fill="currentColor" />
                                        {course.isEnrolled ? (lang === 'ar' ? 'متابعة' : 'Continue') : (lang === 'ar' ? 'ابدأ' : 'Start')}
                                    </button>
                                    <button
                                        className="bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-white p-2 rounded transition-all duration-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="bg-gray-800/90 hover:bg-gray-700 border border-gray-600 text-white p-2 rounded transition-all duration-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Heart className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

// Category Row Component with Horizontal Scroll
function CategoryRow({ category, categoryAr, courses, lang, onCourseClick, onCourseHover }: {
    category: string
    categoryAr: string
    courses: Course[]
    lang: string
    onCourseClick: (courseId: string) => void
    onCourseHover: (course: Course | null) => void
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

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
            const scrollAmount = 1000
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    if (courses.length === 0) return null

    return (
        <div className="relative group/row mb-12">
            {/* Category Title */}
            <h2 className="text-2xl font-bold text-white mb-4 px-6">
                {lang === 'ar' ? categoryAr : category}
            </h2>

            {/* Scroll Container */}
            <div className="relative">
                {/* Left Arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-0 bottom-0 z-40 bg-black/80 hover:bg-black/95 text-white p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
                        style={{ width: '40px' }}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {/* Courses Scroll */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide px-6 py-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            lang={lang}
                            onClick={() => onCourseClick(course.id)}
                            onHover={onCourseHover}
                        />
                    ))}
                </div>

                {/* Right Arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-0 bottom-0 z-40 bg-black/80 hover:bg-black/95 text-white p-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300"
                        style={{ width: '40px' }}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    )
}

export default function CoursesPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const [categorizedCourses, setCategorizedCourses] = useState<CategoryCourses[]>([])
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [hoveredCourse, setHoveredCourse] = useState<Course | null>(null)
    const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null)

    const locale = params?.locale as string || 'en'
    const lang = locale === 'ar' ? 'ar' : 'en'

    useEffect(() => {
        if (session) {
            fetchUserProfile()
        }
        fetchCourses()
    }, [session])

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/user/profile')
            if (response.ok) {
                const profile = await response.json()
                setUserProfile(profile)
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error)
        }
    }

    const fetchCourses = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/courses?page=1&limit=100&sort=popular`)
            if (response.ok) {
                const data = await response.json()

                // Enhance courses with user enrollment data
                const enhancedCourses = data.courses.map((course: Course) => {
                    const enrollment = userProfile?.enrollments?.find(e => e.courseId === course.id)
                    return {
                        ...course,
                        userProgress: enrollment?.progress || 0,
                        isEnrolled: !!enrollment,
                        lastAccessed: enrollment?.lastAccessed
                    }
                })

                // Group courses by category
                const grouped: { [key: string]: CategoryCourses } = {}
                enhancedCourses.forEach((course: Course) => {
                    const key = course.category
                    if (!grouped[key]) {
                        grouped[key] = {
                            category: course.category,
                            categoryAr: course.categoryAr || course.category,
                            courses: []
                        }
                    }
                    grouped[key].courses.push(course)
                })

                // Convert to array and add special categories
                const categorized = Object.values(grouped)

                // Add "Continue Learning" category if user has enrollments
                if (session && userProfile?.enrollments && userProfile.enrollments.length > 0) {
                    const continueL earning = {
                        category: 'Continue Learning',
                        categoryAr: 'استكمال التعلم',
                        courses: enhancedCourses.filter((c: Course) =>
                            c.isEnrolled && c.userProgress && c.userProgress > 0 && c.userProgress < 100
                        )
                    }
                    if (continueLearning.courses.length > 0) {
                        categorized.unshift(continueLearning)
                    }
                }

                // Add "Trending Now" category
                const trending = {
                    category: 'Trending Now',
                    categoryAr: 'الأكثر رواجًا',
                    courses: [...enhancedCourses].sort((a: Course, b: Course) =>
                        b.totalViews - a.totalViews
                    ).slice(0, 10)
                }
                if (trending.courses.length > 0) {
                    categorized.unshift(trending)
                }

                setCategorizedCourses(categorized)
            } else {
                toast.error('Failed to fetch courses')
            }
        } catch (error) {
            toast.error('Failed to fetch courses')
        } finally {
            setLoading(false)
        }
    }

    const handleCourseClick = (courseId: string) => {
        if (loadingCourseId) return
        setLoadingCourseId(courseId)
        setTimeout(() => {
            router.push(`/${locale}/courses/${courseId}`)
        }, 150)
    }

    const t = {
        en: {
            title: 'Courses',
            subtitle: 'Unlimited learning, endless possibilities',
            search: 'Search courses...',
        },
        ar: {
            title: 'الدورات',
            subtitle: 'تعلم غير محدود، إمكانيات لا نهائية',
            search: 'ابحث في الدورات...',
        },
    }

    const currentT = t[lang]

    return (
        <div className="min-h-screen bg-black">
            {/* Hero Section */}
            <div className="relative h-[70vh] overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="/images/hero-learning.jpg"
                        alt="Hero"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
                </div>

                {/* Hero Content */}
                <div className="relative h-full flex items-center px-6 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-2xl"
                    >
                        <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4">
                            {currentT.title}
                        </h1>
                        <p className="text-xl lg:text-2xl text-gray-300 mb-8">
                            {currentT.subtitle}
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-xl">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={currentT.search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="relative -mt-32 z-10 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-white" />
                    </div>
                ) : categorizedCourses.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-400">
                            {lang === 'ar' ? 'لا توجد دورات متاحة' : 'No courses available'}
                        </p>
                    </div>
                ) : (
                    <>
                        {categorizedCourses.map((category, index) => (
                            <CategoryRow
                                key={category.category}
                                category={category.category}
                                categoryAr={category.categoryAr}
                                courses={category.courses}
                                lang={lang}
                                onCourseClick={handleCourseClick}
                                onCourseHover={setHoveredCourse}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Loading Overlay */}
            {loadingCourseId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 animate-spin text-white" />
                        <p className="text-white text-lg">
                            {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    )
}
