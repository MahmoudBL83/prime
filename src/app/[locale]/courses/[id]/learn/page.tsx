'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    SkipBack,
    SkipForward,
    Settings,
    Maximize,
    MessageSquare,
    X,
    Download,
    Cast,
    Share2,
    ChevronRight,
    Sun,
    Moon
} from 'lucide-react'
import { useLocaleSafe } from '@/hooks/useTranslationsSafe'

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
    lessons?: Lesson[]
}

export default function CoursePlayerPage() {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const locale = useLocaleSafe()
    
    // Theme
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    
    const [course, setCourse] = useState<Course | null>(null)
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [showControls, setShowControls] = useState(true)
    const [showSkipIntro, setShowSkipIntro] = useState(false)
    const [showEpisodesSidebar, setShowEpisodesSidebar] = useState(false)
    
    const videoRef = useRef<HTMLVideoElement>(null)
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isDark = mounted ? theme === 'dark' : true

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await fetch(`/api/courses/${params.id}`)
                if (response.ok) {
                    const data = await response.json()
                    
                    // If course has no lessons or it's a mock course, add mock episodes
                    if (!data.lessons || data.lessons.length === 0 || String(params.id).startsWith('mock-')) {
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
                    }
                    
                    setCourse(data)
                    
                    // Get lesson from URL or use first lesson
                    const lessonId = searchParams.get('lesson')
                    if (lessonId && data.lessons) {
                        const lesson = data.lessons.find((l: Lesson) => l.id === lessonId)
                        setCurrentLesson(lesson || data.lessons[0])
                    } else if (data.lessons && data.lessons.length > 0) {
                        setCurrentLesson(data.lessons[0])
                    }
                }
            } catch (error) {
                console.error('Error fetching course:', error)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchCourse()
        }
    }, [params.id, searchParams])

    // Show skip intro button between 5-90 seconds
    useEffect(() => {
        if (currentTime >= 5 && currentTime <= 90) {
            setShowSkipIntro(true)
        } else {
            setShowSkipIntro(false)
        }
    }, [currentTime])

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleTimeUpdate = () => setCurrentTime(video.currentTime)
        const handleDurationChange = () => setDuration(video.duration)
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('durationchange', handleDurationChange)
        video.addEventListener('play', handlePlay)
        video.addEventListener('pause', handlePause)

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('durationchange', handleDurationChange)
            video.removeEventListener('play', handlePlay)
            video.removeEventListener('pause', handlePause)
        }
    }, [])

    // Auto-hide controls
    const resetControlsTimeout = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current)
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false)
            }, 3000)
        }
    }

    useEffect(() => {
        resetControlsTimeout()
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current)
            }
        }
    }, [isPlaying])

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const skipBackward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
        }
    }

    const skipForward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
        }
    }

    const skipIntro = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 90 // Skip to 1:30
        }
    }

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const bounds = e.currentTarget.getBoundingClientRect()
            const percent = (e.clientX - bounds.left) / bounds.width
            videoRef.current.currentTime = percent * duration
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const goToNextEpisode = () => {
        if (!course?.lessons || !currentLesson) return
        
        const currentIndex = course.lessons.findIndex(l => l.id === currentLesson.id)
        if (currentIndex < course.lessons.length - 1) {
            const nextLesson = course.lessons[currentIndex + 1]
            setCurrentLesson(nextLesson)
            router.push(`/${locale}/courses/${params.id}/learn?lesson=${nextLesson.id}`)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getLocalizedText = (text: string, textAr?: string, textDe?: string) => {
        if (locale === 'ar' && textAr) return textAr
        if (locale === 'de' && textDe) return textDe
        return text
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
                <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Loading...</div>
            </div>
        )
    }

    if (!course || !currentLesson) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
                <div className={`text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Episode not found</div>
            </div>
        )
    }

    const seasonNumber = currentLesson.seasonNumber || 1
    const episodeNumber = currentLesson.episodeNumber || 1

    return (
        <div 
            className={`relative w-full h-screen overflow-hidden ${isDark ? 'bg-black' : 'bg-gray-50'}`}
            onMouseMove={resetControlsTimeout}
            onClick={togglePlay}
        >
            {/* Video Player */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-contain"
                poster={course.thumbnail}
                onClick={(e) => e.stopPropagation()}
            >
                <source src="/videos/demo/course-promo.mp4" type="video/mp4" />
            </video>

            {/* Controls Overlay */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
                            {/* Left Icons */}
                            <div className="flex items-center gap-4">
                                <button 
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                                    title="Episodes"
                                    onClick={(e) => { e.stopPropagation(); setShowEpisodesSidebar(!showEpisodesSidebar); }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                                    </svg>
                                </button>
                                <button 
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                                    title="Share"
                                >
                                    <Share2 className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            {/* Center Title */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                <h1 className="text-white text-xl font-semibold mb-1">
                                    {getLocalizedText(course.title, course.titleAr, course.titleDe)}
                                </h1>
                                <p className="text-gray-300 text-sm">
                                    S{seasonNumber}:E{episodeNumber}
                                </p>
                            </div>

                            {/* Right Icons (matching pasted player: only Close X) */}
                            <div className="flex items-center gap-4">
                                {mounted && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                                        className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 backdrop-blur-sm"
                                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                    >
                                        {isDark ? (
                                            <Sun className="w-5 h-5 text-yellow-400 transition-transform duration-300 hover:rotate-180" />
                                        ) : (
                                            <Moon className="w-5 h-5 text-purple-600 transition-transform duration-300 hover:-rotate-12" />
                                        )}
                                    </button>
                                )}
                                <button 
                                    onClick={() => router.push(`/${locale}/courses/${params.id}`)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom Controls - Matching Shahid/Pasted Image Exactly */}
                        <div className="absolute bottom-0 left-0 right-0 pb-6 px-6">
                            {/* Progress Bar */}
                            <div 
                                className="w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-6 relative group"
                                onClick={handleProgressClick}
                            >
                                <div 
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{ width: `${(currentTime / duration) * 100}%` }}
                                />
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ left: `${(currentTime / duration) * 100}%` }}
                                />
                            </div>

                            {/* Control Buttons - Exact Layout from Pasted Image */}
                            <div className="flex items-center justify-between">
                                {/* Left Controls: Play, Skip-10, Skip+10, Volume, Time */}
                                <div className="flex items-center gap-3">
                                    {/* Play/Pause */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-7 h-7 text-white" fill="white" />
                                        ) : (
                                            <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
                                        )}
                                    </button>

                                    {/* Skip Back 10s - Circle with "10" inside */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); skipBackward(); }}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors relative"
                                        title="Rewind 10 seconds"
                                    >
                                        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="absolute">
                                            <circle cx="22" cy="22" r="20" stroke="white" strokeWidth="2" opacity="0.8"/>
                                        </svg>
                                        <span className="text-white text-xs font-bold relative z-10">10</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="absolute left-1 top-1" opacity="0.9">
                                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                                        </svg>
                                    </button>

                                    {/* Skip Forward 10s - Circle with "10" inside */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); skipForward(); }}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors relative"
                                        title="Forward 10 seconds"
                                    >
                                        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="absolute">
                                            <circle cx="22" cy="22" r="20" stroke="white" strokeWidth="2" opacity="0.8"/>
                                        </svg>
                                        <span className="text-white text-xs font-bold relative z-10">10</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="absolute right-1 top-1" opacity="0.9">
                                            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                                        </svg>
                                    </button>

                                    {/* Volume/Mute */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? (
                                            <VolumeX className="w-6 h-6 text-white" strokeWidth={2} />
                                        ) : (
                                            <Volume2 className="w-6 h-6 text-white" strokeWidth={2} />
                                        )}
                                    </button>

                                    {/* Time Display */}
                                    <div className="text-white text-base font-medium ml-3 tabular-nums">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                </div>

                                {/* Right Controls: Next, Comments, Settings, Fullscreen */}
                                <div className="flex items-center gap-3">
                                    {/* Next Episode - Play/Skip to next icon */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); goToNextEpisode(); }}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors disabled:opacity-40"
                                        disabled={!course?.lessons || course.lessons.findIndex(l => l.id === currentLesson.id) === course.lessons.length - 1}
                                        title="Next episode"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5">
                                            <path d="M5 4l10 8-10 8V4z"/>
                                            <path d="M19 5v14" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </button>

                                    {/* Comments/Chat */}
                                    <button 
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                        title="Comments"
                                    >
                                        <MessageSquare className="w-6 h-6 text-white" strokeWidth={2} />
                                    </button>

                                    {/* Settings/Gear */}
                                    <button 
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                        title="Settings"
                                    >
                                        <Settings className="w-6 h-6 text-white" strokeWidth={2} />
                                    </button>

                                    {/* Fullscreen */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                                        className="w-11 h-11 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                                        title="Fullscreen"
                                    >
                                        <Maximize className="w-6 h-6 text-white" strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Skip Intro Button */}
            <AnimatePresence>
                {showSkipIntro && showControls && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={(e) => { e.stopPropagation(); skipIntro(); }}
                        className="absolute bottom-32 right-6 px-8 py-3 rounded-full font-semibold text-base transition-all hover:opacity-90"
                        style={{ backgroundColor: '#00d9df', color: '#000000' }}
                    >
                        Skip intro
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Episodes Sidebar - Matching Shahid Design */}
            <AnimatePresence>
                {showEpisodesSidebar && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                            onClick={(e) => { e.stopPropagation(); setShowEpisodesSidebar(false); }}
                        />
                        
                        {/* Sidebar Panel */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className={`absolute left-0 top-0 bottom-0 w-[400px] backdrop-blur-md z-50 overflow-y-auto ${
                                isDark ? 'bg-gray-900/95' : 'bg-white/95'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Sidebar Header */}
                            <div className={`sticky top-0 border-b p-4 flex items-center justify-between ${
                                isDark ? 'bg-gray-900 border-gray-700/50' : 'bg-white border-gray-200'
                            }`}>
                                <div>
                                    <h2 className={`text-lg font-semibold flex items-center gap-2 ${
                                        isDark ? 'text-white' : 'text-gray-900'
                                    }`}>
                                        <span>{getLocalizedText(course.title, course.titleAr, course.titleDe)}</span>
                                    </h2>
                                    <p className={`text-sm mt-1 ${
                                        isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>Season {seasonNumber}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowEpisodesSidebar(false); }}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                        isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                                </button>
                            </div>

                            {/* Episodes List */}
                            <div className="py-2">
                                {course?.lessons?.map((lesson, index) => {
                                    const isCurrentLesson = lesson.id === currentLesson?.id
                                    const imageNumber = ((index % 7) + 1)
                                    const episodeImage = `/images/courses/netflix${imageNumber}.jpg`
                                    
                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setCurrentLesson(lesson)
                                                router.push(`/${locale}/courses/${params.id}/learn?lesson=${lesson.id}`)
                                                setShowEpisodesSidebar(false)
                                            }}
                                            className={`w-full flex items-start gap-3 p-3 transition-all ${
                                                isDark 
                                                    ? `hover:bg-white/5 ${isCurrentLesson ? 'bg-white/10' : ''}` 
                                                    : `hover:bg-gray-100 ${isCurrentLesson ? 'bg-gray-100' : ''}`
                                            }`}
                                        >
                                            {/* Episode Thumbnail */}
                                            <div className={`relative w-32 h-18 flex-shrink-0 rounded overflow-hidden ${
                                                isDark ? 'bg-gray-800' : 'bg-gray-200'
                                            }`}>
                                                <img
                                                    src={episodeImage}
                                                    alt={`Episode ${lesson.episodeNumber || index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                
                                                {/* Duration Badge */}
                                                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white">
                                                    {lesson.duration}:00
                                                </div>
                                            </div>
                                            
                                            {/* Episode Info */}
                                            <div className="flex-1 text-left min-w-0">
                                                <h3 className={`text-sm font-medium mb-1 ${
                                                    isDark
                                                        ? isCurrentLesson ? 'text-white' : 'text-gray-200'
                                                        : isCurrentLesson ? 'text-gray-900' : 'text-gray-700'
                                                }`}>
                                                    Episode {lesson.episodeNumber || index + 1}
                                                </h3>
                                                <p className={`text-xs line-clamp-2 ${
                                                    isDark ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                    {getLocalizedText(lesson.title, lesson.titleAr, lesson.titleDe)}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
