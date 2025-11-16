'use client'

import { useState, useEffect, useRef, Suspense, lazy, useCallback, useMemo, memo } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslationsSafe, useLocaleSafe } from '@/hooks/useTranslationsSafe'

// Dynamic imports for icons to reduce initial bundle size
const IconComponents = {
    Play: lazy(() => import('lucide-react').then(mod => ({ default: mod.Play }))),
    Pause: lazy(() => import('lucide-react').then(mod => ({ default: mod.Pause }))),
    Plus: lazy(() => import('lucide-react').then(mod => ({ default: mod.Plus }))),
    ThumbsUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.ThumbsUp }))),
    ThumbsDown: lazy(() => import('lucide-react').then(mod => ({ default: mod.ThumbsDown }))),
    Volume2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Volume2 }))),
    VolumeX: lazy(() => import('lucide-react').then(mod => ({ default: mod.VolumeX }))),
    Maximize: lazy(() => import('lucide-react').then(mod => ({ default: mod.Maximize }))),
    ChevronDown: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronDown }))),
    ChevronUp: lazy(() => import('lucide-react').then(mod => ({ default: mod.ChevronUp }))),
    Star: lazy(() => import('lucide-react').then(mod => ({ default: mod.Star }))),
    CheckCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle }))),
    LockIcon: lazy(() => import('lucide-react').then(mod => ({ default: mod.Lock }))),
    Clock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Clock }))),
    Calendar: lazy(() => import('lucide-react').then(mod => ({ default: mod.Calendar }))),
    Film: lazy(() => import('lucide-react').then(mod => ({ default: mod.Film }))),
    Tv: lazy(() => import('lucide-react').then(mod => ({ default: mod.Tv }))),
    Mic: lazy(() => import('lucide-react').then(mod => ({ default: mod.Mic }))),
    CheckCircle: lazy(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle }))),
    Info: lazy(() => import('lucide-react').then(mod => ({ default: mod.Info }))),
    Share2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Share2 }))),
    Download: lazy(() => import('lucide-react').then(mod => ({ default: mod.Download }))),
    MoreVertical: lazy(() => import('lucide-react').then(mod => ({ default: mod.MoreVertical }))),
    ArrowLeft: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft }))),
    SkipForward: lazy(() => import('lucide-react').then(mod => ({ default: mod.SkipForward }))),
    SkipBack: lazy(() => import('lucide-react').then(mod => ({ default: mod.SkipBack }))),
    Check: lazy(() => import('lucide-react').then(mod => ({ default: mod.Check }))),
    Users: lazy(() => import('lucide-react').then(mod => ({ default: mod.Users }))),
    Award: lazy(() => import('lucide-react').then(mod => ({ default: mod.Award }))),
    Lock: lazy(() => import('lucide-react').then(mod => ({ default: mod.Lock }))),
    Bookmark: lazy(() => import('lucide-react').then(mod => ({ default: mod.Bookmark }))),
    Eye: lazy(() => import('lucide-react').then(mod => ({ default: mod.Eye }))),
    X: lazy(() => import('lucide-react').then(mod => ({ default: mod.X }))),
    Shield: lazy(() => import('lucide-react').then(mod => ({ default: mod.Shield }))),
    BookOpen: lazy(() => import('lucide-react').then(mod => ({ default: mod.BookOpen }))),
    ArrowRight: lazy(() => import('lucide-react').then(mod => ({ default: mod.ArrowRight }))),
    Sparkles: lazy(() => import('lucide-react').then(mod => ({ default: mod.Sparkles }))),
    Sun: lazy(() => import('lucide-react').then(mod => ({ default: mod.Sun }))),
    Moon: lazy(() => import('lucide-react').then(mod => ({ default: mod.Moon }))),
    Search: lazy(() => import('lucide-react').then(mod => ({ default: mod.Search }))),
    Loader2: lazy(() => import('lucide-react').then(mod => ({ default: mod.Loader2 })))
}

// Icon fallback component
const IconFallback = () => <div className="w-5 h-5 bg-muted rounded animate-pulse" />

// Optimized icon component with lazy loading
const DynamicIcon = memo(({ name, className = "w-5 h-5", ...props }: { 
    name: keyof typeof IconComponents, 
    className?: string 
}) => {
    const IconComponent = IconComponents[name]
    return (
        <Suspense fallback={<IconFallback />}>
            <IconComponent className={className} {...props} />
        </Suspense>
    )
})
DynamicIcon.displayName = 'DynamicIcon'

// Skeleton Components for better loading performance
const CourseSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-96 bg-gray-800 rounded-lg mb-6" />
        <div className="space-y-4">
            <div className="h-8 bg-gray-700 rounded w-3/4" />
            <div className="h-6 bg-gray-700 rounded w-1/2" />
            <div className="flex gap-4">
                <div className="h-12 bg-gray-700 rounded w-32" />
                <div className="h-12 bg-gray-700 rounded w-12" />
            </div>
        </div>
    </div>
)

const LessonSkeleton = () => (
    <div className="animate-pulse bg-gray-800/50 rounded-xl p-4 flex gap-4">
        <div className="w-12 h-12 bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-700 rounded w-1/2" />
            <div className="h-3 bg-gray-700 rounded w-1/4" />
        </div>
    </div>
)
import Image from 'next/image'

// Related Course Card Component
interface RelatedCourseCardProps {
    course: Course
    index: number
    locale: string
    isDark: boolean
    getLocalizedText: (text: string, textAr?: string, textDe?: string) => string
}

const RelatedCourseCard = memo(({ course, index, locale, isDark, getLocalizedText }: RelatedCourseCardProps) => {
    const [isHovered, setIsHovered] = useState(false)
    const [cardLoading, setCardLoading] = useState(false)
    const router = useRouter()
    const courseImage = useMemo(() => 
        course.thumbnail || `https://images.unsplash.com/photo-${1500000000000 + index}?w=800&h=1200&fit=crop`, 
        [course.thumbnail, index]
    )

    const handleClick = useCallback(() => {
        setCardLoading(true)
        router.push(`/${locale}/courses/${course.id}`)
    }, [router, locale, course.id])

    const handleMouseEnter = useCallback(() => setIsHovered(true), [])
    const handleMouseLeave = useCallback(() => setIsHovered(false), [])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative cursor-pointer flex-shrink-0"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                width: isHovered ? '400px' : '280px',
                zIndex: isHovered ? 999 : 1,
                transition: 'width 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
            }}
            onClick={handleClick}
        >
            <div className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                isHovered 
                    ? (isDark 
                        ? 'shadow-2xl shadow-cyan-500/30 ring-4 ring-cyan-500/40' 
                        : 'shadow-2xl shadow-purple-500/30 ring-4 ring-purple-500/40')
                    : 'shadow-xl'
            }`}>
                <div className="relative overflow-hidden" style={{ height: '420px' }}>
                    <Image
                        src={courseImage}
                        alt={getLocalizedText(course.title, course.titleAr, course.titleDe)}
                        fill
                        className="object-cover"
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
                                    className={`w-9 h-9 rounded-full ${isDark ? 'bg-gray-900/90 hover:bg-gray-800' : 'bg-white/90 hover:bg-white'} flex items-center justify-center backdrop-blur-md border ${isDark ? 'border-white/30 hover:border-white/60' : 'border-gray-300 hover:border-gray-400'} transition-all`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsHovered(false)
                                    }}
                                >
                                    <DynamicIcon 
                                        name="X" 
                                        className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} 
                                    />
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
                                    {getLocalizedText(course.title, course.titleAr, course.titleDe)}
                                </motion.h2>

                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="flex items-center gap-2.5 text-sm font-medium text-gray-200"
                                >
                                    {course.releaseYear && (
                                        <span className="font-semibold">{course.releaseYear}</span>
                                    )}
                                    
                                    {course.releaseYear && course.rating && <span className="text-gray-400">•</span>}
                                    
                                    {course.rating && (
                                        <span className="flex items-center gap-1 font-semibold">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            {course.rating.toFixed(1)}
                                        </span>
                                    )}
                                    
                                    {course.rating && (course.totalEpisodes || course.lessons?.length) && <span className="text-gray-400">•</span>}
                                    
                                    {(course.totalEpisodes || course.lessons?.length) && (
                                        <span className="font-semibold">
                                            {course.totalEpisodes || course.lessons?.length} {locale === 'ar' ? 'حلقات' : 'Episodes'}
                                        </span>
                                    )}
                                </motion.div>

                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.3 }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                                        <button
                                            disabled={cardLoading}
                                            className="flex items-center gap-3 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isDark 
                                                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600'
                                                    : 'bg-gradient-to-br from-purple-600 to-pink-600'
                                            }`}>
                                                {cardLoading ? (
                                                    <DynamicIcon name="Loader2" className="w-5 h-5 text-white animate-spin" />
                                                ) : (
                                                    <DynamicIcon name="Play" className="w-5 h-5 ml-0.5 text-white" />
                                                )}
                                            </div>
                                            <span className="text-base font-bold text-white pr-2">
                                                {cardLoading ? (locale === 'ar' ? 'جاري التحميل...' : 'Loading...') : (locale === 'ar' ? 'مشاهدة' : 'Watch Now')}
                                            </span>
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                            }}
                                            className="w-11 h-11 hover:bg-white/10 rounded-full flex items-center justify-center transition-all"
                                        >
                                            <DynamicIcon name="Plus" className="w-5 h-5 text-white" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                            }}
                                            className="w-11 h-11 hover:bg-white/10 rounded-full flex items-center justify-center transition-all mr-2"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
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
})

interface Lesson {
    id: string
    title: string
    titleAr?: string
    titleDe?: string
    description?: string
    descriptionAr?: string
    descriptionDe?: string
    order: number
    duration: number
    videoUrl?: string
    seasonNumber?: number
    episodeNumber?: number
}

interface Course {
    id: string
    title: string
    titleAr?: string
    titleDe?: string
    description: string
    descriptionAr?: string
    descriptionDe?: string
    thumbnail?: string
    contentType?: 'MOVIE' | 'SERIES' | 'PODCAST'
    runtime?: number // minutes for movies
    totalSeasons?: number
    totalEpisodes?: number
    episodeDuration?: number // average episode length
    frequency?: string // for podcasts
    hostName?: string
    releaseYear?: number
    maturityRating?: string
    genres?: string
    cast?: string
    trailer?: string
    rating?: number
    totalEnrollments?: number
    creator?: {
        user: {
            id: string
            name: string
            arabicName?: string
            profileImage?: string
        }
    }
    lessons?: Lesson[]
}

export default function NetflixCoursePage() {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const locale = useLocaleSafe()
    const { t } = useTranslationsSafe('coursePage')
    const { theme, setTheme } = useTheme()
    
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [showMoreInfo, setShowMoreInfo] = useState(false)
    const [selectedSeason, setSelectedSeason] = useState(1)
    const [isInMyList, setIsInMyList] = useState(false)
    const [netflixLiked, setNetflixLiked] = useState<boolean | null>(null)
    const [hasSubscription, setHasSubscription] = useState(false)
    const [subscriptionLoading, setSubscriptionLoading] = useState(true)
    const [showSubscribeModal, setShowSubscribeModal] = useState(false)
    const [showNotification, setShowNotification] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState('')
    const [showSidebar, setShowSidebar] = useState(false)
    const [hoveredEpisodeId, setHoveredEpisodeId] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [playButtonLoading, setPlayButtonLoading] = useState(false)
    const [loadingLessonId, setLoadingLessonId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'episodes' | 'promos' | 'related' | 'more'>('episodes')
    const [relatedCourses, setRelatedCourses] = useState<Course[]>([])
    const [loadingRelated, setLoadingRelated] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const courseContentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = mounted ? theme === 'dark' : true

    const toggleTheme = () => {
        if (mounted) {
            setTheme(theme === 'dark' ? 'light' : 'dark')
        }
    }

    const fetchCourse = useCallback(async () => {
        try {
            // Check cache first
            const cacheKey = `course_${params.id}`
            const cached = localStorage.getItem(cacheKey)
            const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`)
            
            // Use cache if it exists and is less than 5 minutes old
            if (cached && cacheTimestamp) {
                const isExpired = Date.now() - parseInt(cacheTimestamp) > 5 * 60 * 1000
                if (!isExpired) {
                    const cachedData = JSON.parse(cached)
                    setCourse(cachedData)
                    setLoading(false)
                    return
                }
            }
            
            const response = await fetch(`/api/courses/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                
                // Cache the response
                localStorage.setItem(cacheKey, JSON.stringify(data))
                localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString())
                    
                    // If course has no lessons or it's a mock course, add mock episodes
                    if (!data.lessons || data.lessons.length === 0 || String(params.id).startsWith('cm2k3x8y1')) {
                        const mockLessons: Lesson[] = [
                            {
                                id: 'lesson-1',
                                title: 'Introduction and Getting Started',
                                titleAr: 'المقدمة والبدء',
                                description: 'Welcome to the course! In this first lesson, we\'ll cover the fundamentals and set up everything you need to succeed.',
                                descriptionAr: 'مرحباً بك في الدورة! في هذا الدرس الأول، سنغطي الأساسيات ونقوم بإعداد كل ما تحتاجه للنجاح.',
                                order: 1,
                                duration: 45,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 1,
                                episodeNumber: 1
                            },
                            {
                                id: 'lesson-2',
                                title: 'Core Concepts and Fundamentals',
                                titleAr: 'المفاهيم الأساسية والجوهرية',
                                description: 'Deep dive into the core concepts that form the foundation of everything we\'ll learn in this course.',
                                descriptionAr: 'الغوص العميق في المفاهيم الأساسية التي تشكل أساس كل ما سنتعلمه في هذه الدورة.',
                                order: 2,
                                duration: 52,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 1,
                                episodeNumber: 2
                            },
                            {
                                id: 'lesson-3',
                                title: 'Practical Application and Examples',
                                titleAr: 'التطبيق العملي والأمثلة',
                                description: 'Let\'s apply what we\'ve learned with real-world examples and hands-on exercises.',
                                descriptionAr: 'لنطبق ما تعلمناه مع أمثلة من العالم الحقيقي وتمارين عملية.',
                                order: 3,
                                duration: 48,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 1,
                                episodeNumber: 3
                            },
                            {
                                id: 'lesson-4',
                                title: 'Advanced Techniques and Best Practices',
                                titleAr: 'التقنيات المتقدمة وأفضل الممارسات',
                                description: 'Master advanced techniques and learn industry best practices that professionals use every day.',
                                descriptionAr: 'إتقان التقنيات المتقدمة وتعلم أفضل الممارسات الصناعية التي يستخدمها المحترفون كل يوم.',
                                order: 4,
                                duration: 55,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 1,
                                episodeNumber: 4
                            },
                            {
                                id: 'lesson-5',
                                title: 'Building Your First Project',
                                titleAr: 'بناء مشروعك الأول',
                                description: 'Time to build! Create your first complete project from scratch using everything you\'ve learned.',
                                descriptionAr: 'حان وقت البناء! أنشئ مشروعك الكامل الأول من الصفر باستخدام كل ما تعلمته.',
                                order: 5,
                                duration: 62,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 1,
                                episodeNumber: 5
                            },
                            {
                                id: 'lesson-6',
                                title: 'Troubleshooting and Common Mistakes',
                                titleAr: 'استكشاف الأخطاء والأخطاء الشائعة',
                                description: 'Learn how to debug effectively and avoid the most common mistakes beginners make.',
                                descriptionAr: 'تعلم كيفية إصلاح الأخطاء بفعالية وتجنب الأخطاء الأكثر شيوعاً التي يرتكبها المبتدئون.',
                                order: 6,
                                duration: 43,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 1,
                                episodeNumber: 6
                            },
                            {
                                id: 'lesson-7',
                                title: 'Module 2: Intermediate Level Concepts',
                                titleAr: 'الوحدة 2: مفاهيم المستوى المتوسط',
                                description: 'Welcome to Module 2! Now we\'ll take your skills to the next level with intermediate techniques.',
                                descriptionAr: 'مرحباً بك في الوحدة 2! الآن سنأخذ مهاراتك إلى المستوى التالي بتقنيات متوسطة.',
                                order: 7,
                                duration: 50,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 2,
                                episodeNumber: 1
                            },
                            {
                                id: 'lesson-8',
                                title: 'Working with Real Data',
                                titleAr: 'العمل مع البيانات الحقيقية',
                                description: 'Learn how to work with real-world data sources and integrate external APIs.',
                                descriptionAr: 'تعلم كيفية العمل مع مصادر البيانات الواقعية ودمج واجهات برمجة التطبيقات الخارجية.',
                                order: 8,
                                duration: 58,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 2,
                                episodeNumber: 2
                            },
                            {
                                id: 'lesson-9',
                                title: 'Performance Optimization',
                                titleAr: 'تحسين الأداء',
                                description: 'Discover techniques to make your projects faster, more efficient, and production-ready.',
                                descriptionAr: 'اكتشف تقنيات لجعل مشاريعك أسرع وأكثر كفاءة وجاهزة للإنتاج.',
                                order: 9,
                                duration: 47,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 2,
                                episodeNumber: 3
                            },
                            {
                                id: 'lesson-10',
                                title: 'Security Best Practices',
                                titleAr: 'أفضل ممارسات الأمان',
                                description: 'Learn essential security practices to protect your applications and user data.',
                                descriptionAr: 'تعلم ممارسات الأمان الأساسية لحماية تطبيقاتك وبيانات المستخدمين.',
                                order: 10,
                                duration: 54,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 2,
                                episodeNumber: 4
                            },
                            {
                                id: 'lesson-11',
                                title: 'Testing and Quality Assurance',
                                titleAr: 'الاختبار وضمان الجودة',
                                description: 'Master testing strategies to ensure your code is reliable and bug-free.',
                                descriptionAr: 'إتقان استراتيجيات الاختبار لضمان أن يكون كودك موثوقاً وخالياً من الأخطاء.',
                                order: 11,
                                duration: 51,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 2,
                                episodeNumber: 5
                            },
                            {
                                id: 'lesson-12',
                                title: 'Final Project and Portfolio Building',
                                titleAr: 'المشروع النهائي وبناء المحفظة',
                                description: 'Create an impressive final project that showcases your skills and belongs in your portfolio.',
                                descriptionAr: 'أنشئ مشروعاً نهائياً مثيراً للإعجاب يعرض مهاراتك وينتمي إلى محفظتك.',
                                order: 12,
                                duration: 68,
                                videoUrl: '/videos/demo/course-promo.mp4',
                                seasonNumber: 2,
                                episodeNumber: 6
                            }
                        ]
                        
                        data.lessons = mockLessons
                        data.totalSeasons = 2
                        data.totalEpisodes = 12
                    }
                    
                    setCourse(data)
                }
            } catch (error) {
                console.error('Error fetching course:', error)
            } finally {
                setLoading(false)
            }
        }, [params.id])

    useEffect(() => {
        if (params.id) {
            fetchCourse()
        }
    }, [params.id, fetchCourse])

    // Fetch subscription status
    useEffect(() => {
        const fetchSubscription = async () => {
            if (!session) {
                setSubscriptionLoading(false)
                return
            }
            
            try {
                const response = await fetch('/api/user/subscription/check')
                const data = await response.json()
                setHasSubscription(data.hasAccess)
            } catch (error) {
                console.error('Error fetching subscription:', error)
            } finally {
                setSubscriptionLoading(false)
            }
        }

        fetchSubscription()
    }, [session])

    // Fetch user's interaction
    useEffect(() => {
        const fetchInteraction = async () => {
            if (!session || !params.id) return
            
            try {
                const response = await fetch(`/api/courses/${params.id}/interaction`)
                const data = await response.json()
                setNetflixLiked(data.liked)
                setIsInMyList(data.inMyList)
            } catch (error) {
                console.error('Error fetching interaction:', error)
            }
        }

        fetchInteraction()
    }, [session, params.id])

    // Fetch related courses when Related tab is active
    useEffect(() => {
        const fetchRelatedCourses = async () => {
            if (activeTab !== 'related' || relatedCourses.length > 0) return
            
            setLoadingRelated(true)
            try {
                const response = await fetch('/api/courses')
                if (response.ok) {
                    const data = await response.json()
                    // Filter out current course and get up to 12 courses
                    const filtered = data.courses
                        ?.filter((c: Course) => c.id !== params.id)
                        .slice(0, 12) || []
                    setRelatedCourses(filtered)
                }
            } catch (error) {
                console.error('Error fetching related courses:', error)
            } finally {
                setLoadingRelated(false)
            }
        }

        fetchRelatedCourses()
    }, [activeTab, params.id, relatedCourses.length])

    // Auto-play video after 2 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            if (videoRef.current && !isPlaying) {
                videoRef.current.play()
                setIsPlaying(true)
            }
        }, 2000)

        return () => clearTimeout(timer)
    }, [course])

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }, [isPlaying])

    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }, [isMuted])

    const toggleSidebar = useCallback(() => {
        setShowSidebar(prev => !prev)
    }, [])

    // Memoized course metadata
    const courseMetadata = useMemo(() => {
        if (!course) return null
        
        return {
            duration: course.lessons?.reduce((acc, lesson) => acc + lesson.duration, 0) || 0,
            totalLessons: course.lessons?.length || 0,
            contentType: course.lessons && course.lessons.length > 1 ? 'SERIES' : 'MOVIE'
        }
    }, [course?.lessons])

    // Show notification
    const showToast = (message: string) => {
        setNotificationMessage(message)
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
    }

    // Handle like button
    const handleLike = async () => {
        if (!session) {
            router.push(`/${locale}/auth/signin`)
            return
        }

        const newState = netflixLiked === true ? null : true
        setNetflixLiked(newState)

        try {
            await fetch(`/api/courses/${params.id}/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newState === null ? 'clearRating' : 'like' })
            })
            
            if (newState === true) {
                showToast('Added to your Liked Courses ❤️')
            } else {
                showToast('Removed from Liked Courses')
            }
        } catch (error) {
            console.error('Error updating like:', error)
            setNetflixLiked(netflixLiked) // Revert on error
            showToast('Failed to update. Please try again.')
        }
    }

    // Handle dislike button
    const handleDislike = async () => {
        if (!session) {
            router.push(`/${locale}/auth/signin`)
            return
        }

        const newState = netflixLiked === false ? null : false
        setNetflixLiked(newState)

        try {
            await fetch(`/api/courses/${params.id}/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newState === null ? 'clearRating' : 'dislike' })
            })
            
            if (newState === false) {
                showToast('Thanks for your feedback')
            } else {
                showToast('Rating cleared')
            }
        } catch (error) {
            console.error('Error updating dislike:', error)
            setNetflixLiked(netflixLiked) // Revert on error
            showToast('Failed to update. Please try again.')
        }
    }

    // Handle My List button
    const handleMyList = async () => {
        if (!session) {
            router.push(`/${locale}/auth/signin`)
            return
        }

        const newState = !isInMyList
        setIsInMyList(newState)

        try {
            await fetch(`/api/courses/${params.id}/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: newState ? 'addToList' : 'removeFromList' })
            })
            
            if (newState) {
                showToast('Added to My List ✓')
            } else {
                showToast('Removed from My List')
            }
        } catch (error) {
            console.error('Error updating My List:', error)
            setIsInMyList(!newState) // Revert on error
            showToast('Failed to update. Please try again.')
        }
    }

    // Handle play button - Allow demo access
    const handlePlay = () => {
        setPlayButtonLoading(true)
        // Remove subscription check for demo purposes
        router.push(`/${locale}/courses/${params.id}/learn`)
    }

    const getLocalizedText = (text: string, textAr?: string, textDe?: string) => {
        if (locale === 'ar' && textAr) return textAr
        if (locale === 'de' && textDe) return textDe
        return text
    }

    // Group lessons by season for series
    const getEpisodesBySeason = (seasonNum: number) => {
        if (!course?.lessons) return []
        return course.lessons
            .filter(lesson => lesson.seasonNumber === seasonNum)
            .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0))
    }

    const getSeasons = () => {
        if (!course?.lessons) return []
        const seasons = new Set(course.lessons.map(l => l.seasonNumber).filter(Boolean))
        return Array.from(seasons).sort((a, b) => (a || 0) - (b || 0))
    }

    const getContentTypeIcon = () => {
        switch (course?.contentType) {
            case 'MOVIE': return <DynamicIcon name="Film" className="w-5 h-5" />
            case 'SERIES': return <DynamicIcon name="Tv" className="w-5 h-5" />
            case 'PODCAST': return <DynamicIcon name="Mic" className="w-5 h-5" />
            default: return <DynamicIcon name="Film" className="w-5 h-5" />
        }
    }

    const getContentTypeLabel = () => {
        const type = course?.contentType || 'SERIES'
        const labels: Record<string, string> = {
            'MOVIE': 'Course',
            'SERIES': 'Course',
            'PODCAST': 'Podcast'
        }
        return labels[type] || 'Course'
    }

    const getMetadataLabel = () => {
        if (!course) return ''
        
        switch (course.contentType) {
            case 'MOVIE':
                return course.runtime ? `${course.runtime} min` : ''
            case 'SERIES':
                return course.totalSeasons 
                    ? `${course.totalSeasons} Modules • ${course.totalEpisodes || 0} Lessons`
                    : ''
            case 'PODCAST':
                return course.frequency || 'Podcast'
            default:
                return course.lessons?.length ? `${course.lessons.length} Lessons` : ''
        }
    }

    if (loading) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
                <div className="max-w-[1920px] mx-auto px-6 lg:px-12">
                    <CourseSkeleton />
                </div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-2xl`}>Course not found</div>
            </div>
        )
    }

    const contentType = course.contentType || 'SERIES'

    return (
        <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Custom Navbar - Shahid Style */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isDark 
                    ? 'bg-[#181d25]' 
                    : 'bg-white/95 backdrop-blur-lg shadow-md'
            }`}>
                <div className="max-w-[1920px] mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between h-[72px]">
                        {/* Logo */}
                        <div className="flex items-center gap-8">
                            {/* PRIME Logo */}
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/${locale}/courses`)}>
                                <svg width="85" height="32" viewBox="0 0 85 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <text x="0" y="24" fill={isDark ? "#00d9c0" : "#8b5cf6"} fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold">
                                        PRIME
                                    </text>
                                </svg>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden lg:flex items-center gap-8">
                                <button onClick={() => router.push(`/${locale}`)} className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    Home
                                </button>
                                <button onClick={() => router.push(`/${locale}/courses`)} className={`${isDark ? 'text-white' : 'text-gray-900'} transition-colors text-[15px] font-semibold flex items-center gap-1`}>
                                    <span>Courses</span>
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    New & Top 🔥
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    TV Shows
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    Movies
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    Sports
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    Explore
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    Live TV
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium`}>
                                    My List
                                </button>
                                <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-[15px] font-medium flex items-center gap-1`}>
                                    <span className={`${isDark ? 'bg-[#00d9c0] text-black' : 'bg-purple-600 text-white'} px-2 py-0.5 rounded text-xs font-bold`}>kids</span>
                                    <span>Kids</span>
                                </button>
                            </div>
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-4">
                            <button className={`p-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-lg transition-colors`}>
                                <DynamicIcon name="Search" className="w-5 h-5" />
                            </button>
                            
                            {/* Theme Toggle Button */}
                            {mounted && (
                                <button 
                                    onClick={toggleTheme}
                                    className={`p-2 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'} rounded-lg transition-all duration-300`}
                                    aria-label="Toggle theme"
                                >
                                    {isDark ? (
                                        <DynamicIcon name="Sun" className="w-5 h-5 text-yellow-400 transition-transform hover:rotate-180 duration-500" />
                                    ) : (
                                        <DynamicIcon name="Moon" className="w-5 h-5 text-purple-600 transition-transform hover:-rotate-12 duration-500" />
                                    )}
                                </button>
                            )}
                            
                            <button className={`${isDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-gray-900'} text-[15px] font-medium hidden lg:block`}>
                                My Account
                            </button>
                            <div className={`w-9 h-9 rounded-full ${isDark ? 'bg-gradient-to-br from-purple-500 to-pink-500 ring-white/20' : 'bg-gradient-to-br from-purple-600 to-pink-600 ring-purple-200'} flex items-center justify-center ring-2`}>
                                <span className="text-white text-sm font-semibold">
                                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Toast Notification */}
            <AnimatePresence>
                {showNotification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'} px-6 py-3 rounded-full shadow-2xl flex items-center gap-3`}
                    >
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">{notificationMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Course Content Sidebar */}
            <AnimatePresence>
                {showSidebar && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]"
                            onClick={toggleSidebar}
                        />
                        
                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] lg:w-[700px] bg-gradient-to-br from-gray-900 via-gray-900 to-black z-[160] overflow-y-auto border-l border-gray-700/50 shadow-2xl"
                        >
                            {/* Sidebar Header */}
                            <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-900 to-black border-b border-gray-700/50 backdrop-blur-xl">
                                <div className="flex items-center justify-between p-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <DynamicIcon name="BookOpen" className="w-6 h-6 text-purple-400" />
                                            Course Content
                                        </h2>
                                        {course.lessons && (
                                            <p className="text-gray-400 text-sm mt-1">
                                                {course.lessons.length} lessons • {Math.floor(course.lessons.reduce((acc, l) => acc + l.duration, 0) / 60)} hours
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={toggleSidebar}
                                        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                                    >
                                        <DynamicIcon name="X" className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Module Selector */}
                                {contentType === 'SERIES' && course.totalSeasons && course.totalSeasons > 1 && (
                                    <div className="flex gap-3 px-6 pb-4 overflow-x-auto">
                                        {Array.from({ length: course.totalSeasons }, (_, i) => i + 1).map((season) => {
                                            const seasonLessons = course.lessons?.filter(l => l.seasonNumber === season) || []
                                            const seasonDuration = seasonLessons.reduce((acc, l) => acc + l.duration, 0)
                                            
                                            return (
                                                <button
                                                    key={season}
                                                    onClick={() => setSelectedSeason(season)}
                                                    className={`flex-shrink-0 px-5 py-3 rounded-lg font-semibold transition-all text-sm ${
                                                        selectedSeason === season
                                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                    }`}
                                                >
                                                    <div>Module {season}</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {seasonLessons.length} lessons
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Lessons List */}
                            <div className="p-6">
                                {contentType === 'SERIES' && course.lessons && course.lessons.length > 0 && (
                                    <div className="space-y-3">
                                        {course.lessons
                                            .filter(lesson => !course.totalSeasons || course.totalSeasons <= 1 || lesson.seasonNumber === selectedSeason)
                                            .map((lesson, index) => {
                                                const isLocked = !hasSubscription
                                                const lessonNumber = lesson.episodeNumber || (index + 1)
                                                
                                                return (
                                                    <motion.div
                                                        key={lesson.id}
                                                        initial={{ opacity: 0, x: 50 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 transition-all group ${
                                                            !isLocked ? 'cursor-pointer hover:bg-gray-800' : 'cursor-not-allowed opacity-75'
                                                        } ${loadingLessonId === lesson.id ? 'opacity-50' : ''}`}
                                                        onClick={() => {
                                                            if (loadingLessonId) return // Prevent multiple clicks
                                                            // Allow demo access - remove subscription check
                                                            setLoadingLessonId(lesson.id)
                                                            router.push(`/${locale}/courses/${course.id}/learn?lesson=${lesson.id}`)
                                                        }}
                                                    >
                                                        <div className="flex gap-4">
                                                            {/* Lesson Number/Play Button */}
                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                isLocked 
                                                                    ? 'bg-gray-700' 
                                                                    : 'bg-gradient-to-br from-purple-600 to-blue-600 group-hover:from-purple-500 group-hover:to-blue-500'
                                                            }`}>
                                                                {isLocked ? (
                                                                    <DynamicIcon name="Lock" className="w-5 h-5 text-gray-400" />
                                                                ) : loadingLessonId === lesson.id ? (
                                                                    <DynamicIcon name="Loader2" className="w-5 h-5 text-white animate-spin" />
                                                                ) : (
                                                                    <DynamicIcon name="Play" className="w-5 h-5 text-white" />
                                                                )}
                                                            </div>

                                                            {/* Lesson Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs text-gray-400 mb-1">
                                                                            Lesson {lessonNumber}
                                                                        </div>
                                                                        <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                                                                            {getLocalizedText(lesson.title, lesson.titleAr)}
                                                                        </h3>
                                                                    </div>
                                                                    {lessonNumber === 1 && !isLocked && (
                                                                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs flex-shrink-0">
                                                                            FREE
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                
                                                                {lesson.description && (
                                                                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                                                        {getLocalizedText(lesson.description, lesson.descriptionAr)}
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                    <div className="flex items-center gap-1">
                                                                        <DynamicIcon name="Clock" className="w-3 h-3" />
                                                                        <span>{lesson.duration} min</span>
                                                                    </div>
                                                                    {lesson.videoUrl && (
                                                                        <div className="flex items-center gap-1">
                                                                            <DynamicIcon name="Film" className="w-3 h-3" />
                                                                            <span>HD</span>
                                                                        </div>
                                                                    )}
                                                                    {!isLocked && (
                                                                        <div className="flex items-center gap-1 text-green-500">
                                                                            <DynamicIcon name="CheckCircle" className="w-3 h-3" />
                                                                            <span>Unlocked</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                    </div>
                                )}

                                {/* Podcast Lessons */}
                                {contentType === 'PODCAST' && !course.lessons?.some(l => l.seasonNumber) && course.lessons && course.lessons.length > 0 && (
                                    <div className="space-y-3">
                                        {course.lessons
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((lesson, index) => {
                                                const isLocked = !hasSubscription
                                                
                                                return (
                                                    <motion.div
                                                        key={lesson.id}
                                                        initial={{ opacity: 0, x: 50 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-green-500/50 transition-all group ${
                                                            !isLocked ? 'cursor-pointer hover:bg-gray-800' : 'cursor-not-allowed opacity-75'
                                                        }`}
                                                        onClick={() => {
                                                            // Allow demo access - remove subscription check
                                                            router.push(`/${locale}/courses/${params.id}/learn?lesson=${lesson.id}`)
                                                        }}
                                                    >
                                                        <div className="flex gap-4">
                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                isLocked 
                                                                    ? 'bg-gray-700' 
                                                                    : 'bg-gradient-to-br from-green-600 to-emerald-600 group-hover:from-green-500 group-hover:to-emerald-500'
                                                            }`}>
                                                                {isLocked ? (
                                                                    <Lock className="w-5 h-5 text-gray-400" />
                                                                ) : (
                                                                    <Play className="w-5 h-5 text-white" fill="white" />
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2 mb-1">
                                                                    {getLocalizedText(lesson.title, lesson.titleAr, lesson.titleDe)}
                                                                </h3>
                                                                {lesson.description && (
                                                                    <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                                                        {getLocalizedText(lesson.description || '', lesson.descriptionAr, lesson.descriptionDe)}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                    <div className="flex items-center gap-1">
                                                                        <DynamicIcon name="Clock" className="w-3 h-3" />
                                                                        <span>{lesson.duration} min</span>
                                                                    </div>
                                                                    {!isLocked && (
                                                                        <div className="flex items-center gap-1 text-green-500">
                                                                            <DynamicIcon name="CheckCircle" className="w-3 h-3" />
                                                                            <span>Unlocked</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                    </div>
                                )}

                                {/* Locked Message */}
                                {!hasSubscription && course.lessons && course.lessons.length > 0 && (
                                    <div className="mt-6 bg-gradient-to-r from-yellow-600/10 to-orange-600/5 border border-yellow-600/30 rounded-xl p-6 text-center">
                                        <Lock className="w-10 h-10 mx-auto mb-3 text-yellow-500" />
                                        <h3 className="text-lg font-bold mb-2">Unlock All {course.lessons.length} Lessons</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            Subscribe to access this course and thousands more
                                        </p>
                                        <Button 
                                            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
                                            onClick={() => {
                                                setShowSubscribeModal(true)
                                                setShowSidebar(false)
                                            }}
                                        >
                                            <DynamicIcon name="Play" className="w-4 h-4 mr-2" />
                                            Subscribe Now
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Hero Section - Shahid Style (Exact Colors) */}
            <div className="relative h-[85vh] pt-[72px]" style={{ backgroundColor: '#1a1d29', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                {/* Background Video/Image */}
                <div className="absolute inset-0 pt-[72px]">
                    {/* Background Image Fallback */}
                    {course.thumbnail && (
                        <Image
                            src={course.thumbnail}
                            alt={getLocalizedText(course.title, course.titleAr, course.titleDe)}
                            fill
                            className="object-cover"
                            priority
                        />
                    )}
                    
                    {/* Video Overlay (plays on top of image) */}
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        poster={course.thumbnail}
                    >
                        <source src="/videos/demo/course-promo.mp4" type="video/mp4" />
                    </video>
                    
                    {/* Exact Shahid Gradients */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(26, 29, 41, 0) 0%, rgba(26, 29, 41, 0.7) 60%, rgba(26, 29, 41, 1) 100%)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(26, 29, 41, 0.9) 0%, rgba(26, 29, 41, 0.5) 50%, rgba(26, 29, 41, 0) 100%)' }} />
                </div>

                {/* Mute Button - Top Right (Shahid Style) */}
                <button
                    onClick={toggleMute}
                    className="absolute top-8 right-8 z-50 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                    style={{ backgroundColor: 'rgba(26, 29, 41, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                    {isMuted ? <DynamicIcon name="VolumeX" className="w-5 h-5" style={{ color: '#ffffff' }} /> : <DynamicIcon name="Volume2" className="w-5 h-5" style={{ color: '#ffffff' }} />}
                </button>

                {/* Theme Toggle Button - Top Right */}
                {mounted && (
                    <button
                        onClick={toggleTheme}
                        className="absolute top-8 right-24 z-50 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110"
                        style={{ backgroundColor: 'rgba(26, 29, 41, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <DynamicIcon name="Sun" className="w-5 h-5 text-yellow-400 transition-transform hover:rotate-180 duration-500" />
                        ) : (
                            <DynamicIcon name="Moon" className="w-5 h-5 text-purple-600 transition-transform hover:-rotate-12 duration-500" />
                        )}
                    </button>
                )}

                {/* Content - Split Layout (Shahid Style) */}
                <div className="relative z-10 h-full flex flex-col justify-between px-12 py-16">
                    {/* TOP SECTION - Title and Badge */}
                    <div className="space-y-3 pt-8">
                        {/* Title Logo/Text (Shahid White) */}
                        <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ color: '#ffffff', fontWeight: 700, letterSpacing: '-0.02em' }}>
                            {getLocalizedText(course.title, course.titleAr, course.titleDe)}
                        </h1>

                        {/* Top Badge (Trending Badge like Shahid - Exact Pink) */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded" style={{ backgroundColor: '#e4007f' }}>
                            <span className="text-[11px] font-black tracking-wide" style={{ color: '#ffffff' }}>TOP 4</span>
                            <span className="text-[12px] font-medium" style={{ color: '#ffffff' }}>in TV Shows in Egypt Today</span>
                        </div>
                    </div>

                    {/* BOTTOM SECTION - All Details and Buttons */}
                    <div className="max-w-2xl space-y-6 pb-4">
                        {/* Season Title - Larger */}
                        <div>
                            <h2 className="text-3xl font-bold" style={{ color: '#ffffff', letterSpacing: '-0.015em' }}>Season {selectedSeason}</h2>
                        </div>

                        {/* Metadata Line (Season, Genre, Turkish) - Larger */}
                        <div className="flex items-center gap-3 text-base" style={{ fontWeight: 500 }}>
                            <span style={{ color: '#ffffff' }}>Season {selectedSeason}</span>
                            <span style={{ color: '#6b7280', fontSize: '10px' }}>●</span>
                            {course.genres && (() => {
                                try {
                                    const genres = JSON.parse(course.genres)
                                    return (
                                        <>
                                            <span style={{ color: '#00d9df' }}>{genres[0]}</span>
                                            {genres[1] && (
                                                <>
                                                    <span style={{ color: '#6b7280', fontSize: '10px' }}>●</span>
                                                    <span style={{ color: '#00d9df' }}>{genres[1]}</span>
                                                </>
                                            )}
                                        </>
                                    )
                                } catch {
                                    return <span style={{ color: '#00d9df' }}>Drama</span>
                                }
                            })()}
                            <span style={{ color: '#6b7280', fontSize: '10px' }}>●</span>
                            <span style={{ color: '#00d9df' }}>Turkish</span>
                        </div>

                        {/* Description - Larger */}
                        <p className="text-[17px] line-clamp-3 leading-relaxed" style={{ color: '#d1d5db', fontWeight: 400 }}>
                            {getLocalizedText(course.description, course.descriptionAr, course.descriptionDe)}
                        </p>

                        {/* Cast/Crew - Larger */}
                        {course.cast && (() => {
                            try {
                                const cast = JSON.parse(course.cast)
                                return (
                                    <p className="text-[15px]" style={{ color: '#9ca3af', fontWeight: 400 }}>
                                        <span style={{ color: '#6b7280' }}>Stars: </span>
                                        {cast.slice(0, 4).join(', ')}
                                    </p>
                                )
                            } catch {
                                return null
                            }
                        })()}

                        {/* Available Languages Row - Larger */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2.5 text-[15px]" style={{ color: '#9ca3af', fontWeight: 400 }}>
                                <span>Available Languages:</span>
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#16a34a' }}>
                                    <span className="font-bold text-[11px]" style={{ color: '#ffffff' }}>AD</span>
                                </div>
                                <span style={{ color: '#ffffff', fontWeight: 500 }}>Audio (2)</span>
                                <span style={{ color: '#9ca3af' }}>,</span>
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: '#16a34a' }}>
                                    <span className="font-bold text-[11px]" style={{ color: '#ffffff' }}>CC</span>
                                </div>
                                <span style={{ color: '#ffffff', fontWeight: 500 }}>Subtitles (2)</span>
                            </div>
                            
                            {/* Available in Turkish audio - Shahid Cyan Accent Bar */}
                            <div className="inline-flex items-center gap-3 px-0">
                                <div className="w-1 h-5 rounded-full" style={{ backgroundColor: '#00d9df' }}></div>
                                <span className="text-[17px] font-semibold" style={{ color: '#ffffff', letterSpacing: '-0.01em' }}>Available in Turkish audio</span>
                            </div>
                        </div>

                        {/* Action Buttons - LARGER Shahid Design */}
                        <div className="flex items-center gap-5 pt-4">
                            {/* Watch Now Button - LARGER Cyan Circle with Text */}
                            <button
                                className="flex items-center gap-4 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handlePlay}
                                disabled={subscriptionLoading || playButtonLoading}
                            >
                                {/* LARGER Cyan Play Circle - 72px instead of 64px */}
                                <div 
                                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center transition-transform hover:scale-105"
                                    style={{ 
                                        backgroundColor: '#00d9df',
                                        boxShadow: '0 4px 12px rgba(0, 217, 223, 0.3)'
                                    }}
                                >
                                    {playButtonLoading ? (
                                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#000000' }} />
                                    ) : (
                                        <Play className="w-8 h-8 ml-1" style={{ color: '#000000' }} fill="#000000" />
                                    )}
                                </div>
                                
                                {/* Text Next to Button - LARGER */}
                                <div className="flex flex-col items-start">
                                    <span className="text-white font-bold text-lg leading-tight">
                                        {playButtonLoading ? 'Loading...' : 'Watch Now'}
                                    </span>
                                    <span className="text-[14px] leading-tight" style={{ color: '#9ca3af' }}>Season {selectedSeason}, Episode 1</span>
                                </div>
                            </button>

                            {/* Vertical Separator - Taller */}
                            <div className="h-14 w-px mx-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}></div>

                            {/* Icon Buttons - LARGER (52px circles) */}
                            <div className="flex items-center gap-5">
                                {/* My List Button - LARGER */}
                                <button
                                    onClick={handleMyList}
                                    className="flex flex-col items-center gap-2 transition-all hover:opacity-80 group"
                                    title={isInMyList ? 'Remove from My List' : 'Add to My List'}
                                >
                                    <div 
                                        className="w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 transition-all"
                                        style={{ 
                                            backgroundColor: isInMyList ? 'rgba(0, 217, 223, 0.15)' : 'rgba(44, 51, 68, 0.85)',
                                            borderColor: isInMyList ? '#00d9df' : 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                    >
                                        <DynamicIcon name="Plus" className="w-6 h-6" style={{ color: isInMyList ? '#00d9df' : '#ffffff' }} />
                                    </div>
                                    <span className="text-[13px] font-medium" style={{ color: '#b8bcc8' }}>My list</span>
                                </button>

                                {/* Like Button - LARGER */}
                                <button
                                    onClick={handleLike}
                                    className="flex flex-col items-center gap-2 transition-all hover:opacity-80 group"
                                    title="Like"
                                >
                                    <div 
                                        className="w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 transition-all"
                                        style={{ 
                                            backgroundColor: netflixLiked === true ? 'rgba(0, 217, 223, 0.15)' : 'rgba(44, 51, 68, 0.85)',
                                            borderColor: netflixLiked === true ? '#00d9df' : 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                    >
                                        {netflixLiked === true ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00d9df" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#00d9df" />
                                            </svg>
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-[13px] font-medium" style={{ color: '#b8bcc8' }}>Like</span>
                                </button>

                                {/* Share Button - LARGER */}
                                <button
                                    className="flex flex-col items-center gap-2 transition-all hover:opacity-80 group"
                                    title="Share"
                                >
                                    <div 
                                        className="w-[52px] h-[52px] rounded-full flex items-center justify-center border-2 transition-all"
                                        style={{ 
                                            backgroundColor: 'rgba(44, 51, 68, 0.85)',
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                    >
                                        <Share2 className="w-6 h-6" style={{ color: '#ffffff' }} strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[13px] font-medium" style={{ color: '#b8bcc8' }}>Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation - Shahid Style */}
            <div className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="px-12">
                    <div className="flex gap-8">
                        <button 
                            onClick={() => setActiveTab('episodes')}
                            className={`py-4 border-b-2 font-semibold transition-colors ${
                                activeTab === 'episodes'
                                    ? (isDark 
                                        ? 'border-cyan-500 text-cyan-400' 
                                        : 'border-purple-600 text-purple-600')
                                    : (isDark 
                                        ? 'border-transparent text-gray-400 hover:text-white' 
                                        : 'border-transparent text-gray-600 hover:text-gray-900')
                            }`}
                        >
                            Episodes ({course.lessons?.filter(l => !course.totalSeasons || course.totalSeasons <= 1 || l.seasonNumber === selectedSeason).length || 0})
                        </button>
                        <button 
                            onClick={() => setActiveTab('promos')}
                            className={`py-4 border-b-2 font-semibold transition-colors ${
                                activeTab === 'promos'
                                    ? (isDark 
                                        ? 'border-cyan-500 text-cyan-400' 
                                        : 'border-purple-600 text-purple-600')
                                    : (isDark 
                                        ? 'border-transparent text-gray-400 hover:text-white' 
                                        : 'border-transparent text-gray-600 hover:text-gray-900')
                            }`}
                        >
                            Promos
                        </button>
                        <button 
                            onClick={() => setActiveTab('related')}
                            className={`py-4 border-b-2 font-semibold transition-colors ${
                                activeTab === 'related'
                                    ? (isDark 
                                        ? 'border-cyan-500 text-cyan-400' 
                                        : 'border-purple-600 text-purple-600')
                                    : (isDark 
                                        ? 'border-transparent text-gray-400 hover:text-white' 
                                        : 'border-transparent text-gray-600 hover:text-gray-900')
                            }`}
                        >
                            Related
                        </button>
                        <button 
                            onClick={() => {
                                setActiveTab('more')
                                setShowMoreInfo(!showMoreInfo)
                            }}
                            className={`py-4 border-b-2 font-semibold transition-colors ${
                                activeTab === 'more'
                                    ? (isDark 
                                        ? 'border-cyan-500 text-cyan-400' 
                                        : 'border-purple-600 text-purple-600')
                                    : (isDark 
                                        ? 'border-transparent text-gray-400 hover:text-white' 
                                        : 'border-transparent text-gray-600 hover:text-gray-900')
                            }`}
                        >
                            More Info
                        </button>
                    </div>
                </div>
            </div>

            {/* Episodes Grid - Shahid Style */}
            {activeTab === 'episodes' && course.lessons && course.lessons.length > 0 && (
                <div className={`px-12 py-8 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                    {/* Season Selector for Series */}
                    {contentType === 'SERIES' && course.totalSeasons && course.totalSeasons > 1 && (
                        <div className="mb-6">
                            <select
                                value={selectedSeason}
                                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                className={`rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 ${
                                    isDark 
                                        ? 'bg-gray-800 border border-gray-700 text-white' 
                                        : 'bg-white border border-gray-300 text-gray-900'
                                }`}
                            >
                                {Array.from({ length: course.totalSeasons }, (_, i) => i + 1).map((season) => (
                                    <option key={season} value={season}>
                                        Season {season}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Episodes Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {course.lessons
                            .filter(lesson => !course.totalSeasons || course.totalSeasons <= 1 || lesson.seasonNumber === selectedSeason)
                            .map((lesson, index) => {
                                const isLocked = !hasSubscription && index > 0
                                const lessonNumber = lesson.episodeNumber || (index + 1)
                                const isHovered = hoveredEpisodeId === lesson.id
                                // Cycle through netflix images 1-7
                                const imageNumber = ((index % 7) + 1)
                                const episodeImage = `/images/courses/netflix${imageNumber}.jpg`
                                
                                return (
                                    <motion.div
                                        key={lesson.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group cursor-pointer relative"
                                        onMouseEnter={() => setHoveredEpisodeId(lesson.id)}
                                        onMouseLeave={() => setHoveredEpisodeId(null)}
                                        style={{ zIndex: isHovered ? 50 : 1 }}
                                    >
                                        {/* Thumbnail Card - Shahid Style */}
                                        <motion.div 
                                            className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                                                isDark 
                                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
                                                    : 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-md'
                                            }`}
                                            animate={{ 
                                                scale: isHovered ? 1.35 : 1,
                                                y: isHovered ? -20 : 0,
                                                height: isHovered ? 'auto' : 'auto'
                                            }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                            style={{
                                                boxShadow: isHovered 
                                                    ? (isDark ? '0 20px 40px rgba(0, 0, 0, 0.6)' : '0 20px 40px rgba(0, 0, 0, 0.2)')
                                                    : 'none',
                                                aspectRatio: isHovered ? 'auto' : '16/9',
                                                opacity: loadingLessonId === lesson.id ? 0.5 : 1
                                            }}
                                            onClick={() => {
                                                if (loadingLessonId) return // Prevent multiple clicks
                                                // Allow demo access - remove subscription check
                                                setLoadingLessonId(lesson.id)
                                                router.push(`/${locale}/courses/${course.id}/learn?lesson=${lesson.id}`)
                                            }}
                                        >
                                            {/* Background Image Container */}
                                            <div className="relative" style={{ aspectRatio: '16/9' }}>
                                                {/* Background Image */}
                                                <Image
                                                    src={episodeImage}
                                                    alt={getLocalizedText(lesson.title, lesson.titleAr)}
                                                    fill
                                                    className="object-cover"
                                                />
                                                
                                                {/* Dark Overlay */}
                                                <div 
                                                    className="absolute inset-0 transition-opacity duration-300"
                                                    style={{ 
                                                        background: isDark 
                                                            ? 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)'
                                                            : 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)',
                                                        opacity: isHovered ? 1 : 0.7 
                                                    }}
                                                />
                                                
                                                {/* Episode Title Overlay - Bottom Left (Always Visible) */}
                                                <div className="absolute left-4 bottom-4 pr-4" style={{ maxWidth: '60%' }}>
                                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-snug text-white" 
                                                        style={{ textShadow: '0 4px 18px rgba(0,0,0,0.8)' }}>
                                                        Episode {lessonNumber}
                                                    </h3>
                                                </div>

                                                {/* Duration + Transparent Play Button - Bottom Right (Always Visible, pre-hover) */}
                                                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                                                    {/* Duration Badge */}
                                                    <div className="px-2.5 py-1 rounded text-xs font-semibold backdrop-blur-sm text-white"
                                                         style={{ 
                                                             backgroundColor: 'rgba(0, 0, 0, 0.75)'
                                                         }}>
                                                        {lesson.duration}:00
                                                    </div>

                                                    {/* Transparent Play Button with cyan border (always visible) */}
                                                    <button
                                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-cyan-500/20"
                                                        style={{
                                                            backgroundColor: 'transparent',
                                                            border: '2px solid #00d9df'
                                                        }}
                                                        onClick={(e) => { 
                                                            e.stopPropagation()
                                                            if (loadingLessonId) return
                                                            setLoadingLessonId(lesson.id)
                                                            router.push(`/${locale}/courses/${course.id}/learn?lesson=${lesson.id}`)
                                                        }}
                                                    >
                                                        {loadingLessonId === lesson.id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#00d9df' }} />
                                                        ) : (
                                                            <Play className="w-5 h-5" style={{ color: '#00d9df' }} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Episode Details - Expands Below (Shows on Hover like Shahid) */}
                                            <AnimatePresence>
                                                {isHovered && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                        style={{ 
                                                            backgroundColor: isDark ? '#1a1d29' : '#f3f4f6'
                                                        }}
                                                    >
                                                        <div className="p-5 space-y-3">
                                                            <h4 className={`text-base font-bold leading-snug ${
                                                                isDark ? 'text-white' : 'text-gray-900'
                                                            }`}>
                                                                {getLocalizedText(lesson.title, lesson.titleAr)}
                                                            </h4>
                                                            
                                                            <p className={`text-sm leading-relaxed ${
                                                                isDark ? 'text-gray-400' : 'text-gray-600'
                                                            }`}>
                                                                {getLocalizedText(
                                                                    lesson.description || 'Saniha follows through with her plan and pays off the debt of the musician stranger who had taken over "her" apartment. Meanwhile, Khaled is reluctantly dragged to a family gathering.',
                                                                    lesson.descriptionAr
                                                                )}
                                                            </p>
                                                            
                                                            {/* Action Buttons Row - Shahid Style (Small cyan share only) */}
                                                            <div className="flex items-center gap-3 pt-2">
                                                                {/* Small Transparent Cyan Bordered Share Icon + Text */}
                                                                <button 
                                                                    className="flex items-center gap-2 transition-all hover:opacity-80"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        showToast('Share feature coming soon!')
                                                                    }}
                                                                >
                                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: '2px solid #00d9df', background: 'transparent' }}>
                                                                        <DynamicIcon name="Share2" className="w-4 h-4" style={{ color: '#00d9df' }} />
                                                                    </div>
                                                                    <span className="text-sm font-semibold" style={{ color: '#00d9df' }}>Share</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    </motion.div>
                                )
                            })}
                    </div>
                </div>
            )}

            {/* Promos Tab Content - Shahid Style */}
            {activeTab === 'promos' && (
                <div className={`px-12 py-8 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Trailer/Promo Videos */}
                        {[
                            {
                                id: 'promo-1',
                                title: 'Official Trailer',
                                titleAr: 'الإعلان الرسمي',
                                duration: '2:30',
                                thumbnail: '/images/courses/netflix1.jpg'
                            },
                            {
                                id: 'promo-2',
                                title: 'Behind The Scenes',
                                titleAr: 'من وراء الكواليس',
                                duration: '5:15',
                                thumbnail: '/images/courses/netflix2.jpg'
                            },
                            {
                                id: 'promo-3',
                                title: 'Season Preview',
                                titleAr: 'معاينة الموسم',
                                duration: '1:45',
                                thumbnail: '/images/courses/netflix3.jpg'
                            },
                            {
                                id: 'promo-4',
                                title: 'Cast Interviews',
                                titleAr: 'مقابلات الممثلين',
                                duration: '8:20',
                                thumbnail: '/images/courses/netflix4.jpg'
                            },
                            {
                                id: 'promo-5',
                                title: 'Teaser',
                                titleAr: 'التشويق',
                                duration: '0:45',
                                thumbnail: '/images/courses/netflix5.jpg'
                            }
                        ].map((promo, index) => (
                            <motion.div
                                key={promo.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group cursor-pointer"
                            >
                                <div className={`relative rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 ${
                                    isDark 
                                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-xl hover:shadow-cyan-500/20' 
                                        : 'bg-gradient-to-br from-gray-100 to-gray-200 shadow-md hover:shadow-lg hover:shadow-purple-300/30'
                                }`}>
                                    {/* Thumbnail */}
                                    <div className="relative" style={{ aspectRatio: '16/9' }}>
                                        <Image
                                            src={promo.thumbnail}
                                            alt={getLocalizedText(promo.title, promo.titleAr)}
                                            fill
                                            className="object-cover"
                                        />
                                        {/* Gradient Overlay */}
                                        <div className={`absolute inset-0 ${
                                            isDark
                                                ? 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'
                                                : 'bg-gradient-to-t from-gray-900/60 via-gray-900/10 to-transparent'
                                        }`} />
                                        
                                        {/* Play Button Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg">
                                                <Play className="w-7 h-7 text-black ml-1" fill="black" />
                                            </div>
                                        </div>
                                        
                                        {/* Duration Badge */}
                                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 backdrop-blur-sm">
                                            <span className="text-xs font-semibold text-white">{promo.duration}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Title */}
                                    <div className="p-3">
                                        <h4 className={`text-sm font-semibold line-clamp-2 ${
                                            isDark ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {getLocalizedText(promo.title, promo.titleAr)}
                                        </h4>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Related Tab Content - Shahid Style */}
            {activeTab === 'related' && (
                <div className={`py-8 ${isDark ? 'bg-transparent' : 'bg-white'}`}>
                    {loadingRelated ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-cyan-500' : 'text-purple-600'}`} />
                        </div>
                    ) : relatedCourses.length > 0 ? (
                        <div className="px-6">
                            <h3 className={`text-2xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                More Like This
                            </h3>
                            <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {relatedCourses.map((relatedCourse, index) => (
                                    <RelatedCourseCard
                                        key={relatedCourse.id}
                                        course={relatedCourse}
                                        index={index}
                                        locale={locale}
                                        isDark={isDark}
                                        getLocalizedText={getLocalizedText}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <p>No related courses found</p>
                        </div>
                    )}
                </div>
            )}

            {/* More Info Section - Expandable */}
            <AnimatePresence>
                {activeTab === 'more' && showMoreInfo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`overflow-hidden ${isDark ? 'bg-gray-900/50' : 'bg-gray-100/80'}`}
                    >
                        <div className="px-12 py-8">
                            <div className="max-w-4xl">
                                <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    About This Course
                                </h3>
                                
                                {/* Description */}
                                <div className="mb-6">
                                    <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {getLocalizedText(course.description, course.descriptionAr, course.descriptionDe)}
                                    </p>
                                </div>

                                {/* Cast */}
                                {course.cast && (() => {
                                    try {
                                        const cast = JSON.parse(course.cast)
                                        return (
                                            <div className="mb-4">
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cast: </span>
                                                <span className={isDark ? 'text-white' : 'text-gray-900'}>{cast.join(', ')}</span>
                                            </div>
                                        )
                                    } catch {
                                        return null
                                    }
                                })()}

                                {/* Genres */}
                                {course.genres && (() => {
                                    try {
                                        const genres = JSON.parse(course.genres)
                                        return (
                                            <div className="mb-4">
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Genres: </span>
                                                <span className={isDark ? 'text-white' : 'text-gray-900'}>{genres.join(', ')}</span>
                                            </div>
                                        )
                                    } catch {
                                        return null
                                    }
                                })()}

                                {/* Creator */}
                                {course.creator?.user && (
                                    <div className="mb-4">
                                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Created by: </span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{getLocalizedText(course.creator.user.name, course.creator.user.arabicName)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enhanced Subscription Modal */}
            <AnimatePresence>
                {showSubscribeModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                        onClick={() => setShowSubscribeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowSubscribeModal(false)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-800/80 hover:bg-gray-700 flex items-center justify-center transition-colors z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Hero Section */}
                            <div className="relative overflow-hidden pt-16 pb-12 px-8 text-center border-b border-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-blue-600/10"></div>
                                <Lock className="w-20 h-20 mx-auto mb-6 text-yellow-500 relative" />
                                <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent relative">
                                    Unlock Unlimited Learning
                                </h2>
                                <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6 relative">
                                    Choose a plan to access this course and thousands more. Cancel anytime.
                                </p>
                                <div className="flex items-center justify-center gap-6 text-sm text-gray-400 relative">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-green-500" />
                                        <span>7-Day Money Back</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>No Commitment</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-green-500" />
                                        <span>10K+ Active Learners</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Cards */}
                            <div className="p-8">
                                <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                                    {/* Category A - All-Access Library */}
                                    <motion.div
                                        whileHover={{ scale: 1.03, y: -5 }}
                                        className="relative bg-gradient-to-br from-yellow-600/10 to-orange-600/5 border-2 border-yellow-600/50 rounded-2xl p-8 hover:border-yellow-500 transition-all cursor-pointer group"
                                        onClick={() => router.push(`/${locale}/subscribe?plan=CATEGORY_A`)}
                                    >
                                        <div className="absolute top-6 right-6">
                                            <BookOpen className="w-8 h-8 text-yellow-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold mb-2 text-yellow-400">All-Access Library</h3>
                                            <p className="text-gray-400 text-sm">Category A - Amazon of Learning</p>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-white">$29</span>
                                                <span className="text-gray-400">/month</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">or $279/year (save $69)</p>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Access to 500+ courses across all topics</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">HD streaming quality (1080p)</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Download for offline viewing</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Basic certificates of completion</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Community forum access</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-6 text-lg">
                                            Get Started
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </motion.div>

                                    {/* Bundle AB - Pro (Most Popular) */}
                                    <motion.div
                                        whileHover={{ scale: 1.03, y: -5 }}
                                        className="relative bg-gradient-to-br from-purple-600/20 to-blue-600/10 border-2 border-purple-500 rounded-2xl p-8 hover:border-purple-400 transition-all cursor-pointer group shadow-xl shadow-purple-900/20"
                                        onClick={() => router.push(`/${locale}/subscribe?plan=BUNDLE_AB`)}
                                    >
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-black px-6 py-2 rounded-full uppercase tracking-wider shadow-lg">
                                                ⭐ Most Popular
                                            </div>
                                        </div>

                                        <div className="absolute top-6 right-6">
                                            <Sparkles className="w-8 h-8 text-purple-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                                        </div>

                                        <div className="mb-6 mt-4">
                                            <h3 className="text-2xl font-bold mb-2 text-purple-400">Pro Bundle</h3>
                                            <p className="text-gray-400 text-sm">Categories A + B Signature</p>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-white">$49</span>
                                                <span className="text-gray-400">/month</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">or $469/year (save $119)</p>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm font-semibold">Everything in All-Access, plus:</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">50+ premium signature courses</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">4K Ultra HD streaming quality</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Expert-curated learning paths</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Priority email support</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Professional certificates</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Structured workbooks & projects</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-6 text-lg">
                                            Choose Pro
                                            <DynamicIcon name="ArrowRight" className="w-5 h-5 ml-2" />
                                        </Button>
                                    </motion.div>

                                    {/* Bundle ABC - Ultimate */}
                                    <motion.div
                                        whileHover={{ scale: 1.03, y: -5 }}
                                        className="relative bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border-2 border-blue-600/50 rounded-2xl p-8 hover:border-blue-500 transition-all cursor-pointer group"
                                        onClick={() => router.push(`/${locale}/subscribe?plan=BUNDLE_ABC`)}
                                    >
                                        <div className="absolute top-6 right-6">
                                            <DynamicIcon name="Star" className="w-8 h-8 text-blue-500 opacity-20 group-hover:opacity-40 transition-opacity" />
                                        </div>

                                        <div className="mb-6">
                                            <h3 className="text-2xl font-bold mb-2 text-blue-400">Ultimate</h3>
                                            <p className="text-gray-400 text-sm">Categories A + B + C Creators</p>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-white">$79</span>
                                                <span className="text-gray-400">/month</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">or $759/year (save $189)</p>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-start gap-3">
                                                <DynamicIcon name="Check" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm font-semibold">Everything in Pro, plus:</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <DynamicIcon name="Check" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Access to creator membership channels</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <DynamicIcon name="Check" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Live Q&A sessions with experts</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <DynamicIcon name="Check" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">1:1 coaching opportunities</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <DynamicIcon name="Check" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Private community access</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">Creator tools & resources</span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">VIP support (24/7)</span>
                                            </div>
                                        </div>

                                        <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-6 text-lg">
                                            Get Ultimate
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </motion.div>
                                </div>

                                {/* Category Explanations */}
                                <div className="mt-12 pt-8 border-t border-gray-800 max-w-6xl mx-auto">
                                    <h3 className="text-2xl font-bold mb-6 text-center">What's Included in Each Category?</h3>
                                    <div className="grid md:grid-cols-3 gap-6 text-sm">
                                        <div className="bg-gray-800/30 rounded-lg p-6">
                                            <h4 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
                                                <DynamicIcon name="BookOpen" className="w-5 h-5" />
                                                Category A: All-Access Library
                                            </h4>
                                            <p className="text-gray-400 leading-relaxed">
                                                The "Amazon of Learning" - a vast library of pre-recorded courses across every topic. 
                                                Perfect for self-paced learners who want variety and flexibility.
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-lg p-6">
                                            <h4 className="font-bold text-purple-400 mb-3 flex items-center gap-2">
                                                <DynamicIcon name="Sparkles" className="w-5 h-5" />
                                                Category B: Signature Courses
                                            </h4>
                                            <p className="text-gray-400 leading-relaxed">
                                                Premium, expertly-curated programs from industry leaders. 
                                                Cinematic production, structured workbooks, and professional-grade content.
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-lg p-6">
                                            <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                                                <DynamicIcon name="Users" className="w-5 h-5" />
                                                Category C: Creator Channels
                                            </h4>
                                            <p className="text-gray-400 leading-relaxed">
                                                Subscribe directly to creators for exclusive content, live sessions, 
                                                community access, and personalized coaching. Interactive learning at its best.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trust Badges */}
                                <div className="mt-12 flex flex-wrap justify-center gap-8 text-center text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name="Shield" className="w-5 h-5 text-green-500" />
                                        <span>SSL Secured</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name="CheckCircle" className="w-5 h-5 text-green-500" />
                                        <span>Cancel Anytime</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name="Star" className="w-5 h-5 text-yellow-500" />
                                        <span>4.8/5 Rating</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name="Users" className="w-5 h-5 text-blue-500" />
                                        <span>10,000+ Active Learners</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
