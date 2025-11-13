'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play,
    Pause,
    Users,
    Clock,
    Star,
    BookOpen,
    Award,
    Download,
    Share2,
    Heart,
    ChevronDown,
    CheckCircle,
    Volume2,
    VolumeX,
    Maximize,
    RotateCcw,
    Settings,
    MoreVertical,
    ArrowLeft,
    Globe,
    Calendar,
    Target,
    TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslationsSafe, useLocaleSafe } from '@/hooks/useTranslationsSafe'

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    thumbnail?: string
    demoVideoUrl?: string
    creatorId: string
    category: string
    skillLevel: string
    duration: number
    totalViews: number
    totalEnrollments: number
    rating: number
    price: number
    status: string
    creator: {
        user: {
            id: string
            name: string
            arabicName?: string
            profileImage?: string
        }
    }
    lessons?: Array<{
        id: string
        title: string
        titleAr: string
        order: number
        duration: number
    }>
}

// Sample demo video URLs (we'll use these for now)
const DEMO_VIDEOS = {
    programming: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    design: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    business: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    marketing: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    default: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
}

export default function ModernCoursePage() {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)
    const [videoProgress, setVideoProgress] = useState(0)
    const [videoDuration, setVideoDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [isMuted, setIsMuted] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showFullDescription, setShowFullDescription] = useState(false)
    const [currentVideoTime, setCurrentVideoTime] = useState(0)
    const [isEnrolled, setIsEnrolled] = useState(false)
    const [isFavorite, setIsFavorite] = useState(false)

    const currentLocale = useLocaleSafe()
    const { t } = useTranslationsSafe('coursePage')
    const { t: tCommon } = useTranslationsSafe('common')

    const getCourseTitle = (course: Course) => {
        if (currentLocale === 'ar') {
            return course.titleAr || course.title
        }
        return course.title || course.titleAr
    }

    const getCourseDescription = (course: Course) => {
        if (currentLocale === 'ar') {
            return course.descriptionAr || course.description
        }
        return course.description || course.descriptionAr
    }

    const getInstructorName = (instructor: any) => {
        if (currentLocale === 'ar') {
            return instructor.arabicName || instructor.name
        }
        return instructor.name || instructor.arabicName
    }

    const getVideoUrl = (course: Course) => {
        if (course.demoVideoUrl) return course.demoVideoUrl
        
        // Choose video based on category
        const category = course.category?.toLowerCase()
        if (category?.includes('programming')) return DEMO_VIDEOS.programming
        if (category?.includes('design')) return DEMO_VIDEOS.design
        if (category?.includes('business')) return DEMO_VIDEOS.business
        if (category?.includes('marketing')) return DEMO_VIDEOS.marketing
        
        return DEMO_VIDEOS.default
    }

    useEffect(() => {
        if (params.id) {
            fetchCourse()
        }
    }, [params.id])

    const fetchCourse = async () => {
        try {
            const response = await fetch(`/api/courses/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setCourse(data.course)
            }
        } catch (error) {
            console.error('Error fetching course:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `${hours}:${remainingMinutes.toString().padStart(2, '0')}`
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleEnroll = () => {
        setIsEnrolled(true)
        // Add enrollment logic here
        import('react-hot-toast').then(({ toast }) => {
            toast.success(
                currentLocale === 'ar' ? 'تم التسجيل في الكورس بنجاح!' : 'Successfully enrolled in course!'
            )
        })
    }

    const handleFavorite = () => {
        setIsFavorite(!isFavorite)
        import('react-hot-toast').then(({ toast }) => {
            toast.success(
                currentLocale === 'ar' 
                    ? (isFavorite ? 'تم إزالة الكورس من المفضلة' : 'تم إضافة الكورس للمفضلة')
                    : (isFavorite ? 'Removed from favorites' : 'Added to favorites')
            )
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
                />
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-white text-2xl font-bold mb-4">{t('courseNotFound')}</h1>
                    <Button onClick={() => router.back()} className="bg-purple-600 hover:bg-purple-700">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {tCommon('goBack')}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black">
            {/* Modern Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                
                {/* Navigation */}
                <div className="relative z-10 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            {tCommon('back')}
                        </Button>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <Share2 className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="relative z-10 px-6 pb-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Video Player Section */}
                            <div className="xl:col-span-2 space-y-6">
                                {/* Modern Video Player */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
                                >
                                    <div className="aspect-video relative group">
                                        <video
                                            className="w-full h-full object-cover"
                                            poster={course.thumbnail}
                                            controls
                                            onPlay={() => setIsVideoPlaying(true)}
                                            onPause={() => setIsVideoPlaying(false)}
                                            onTimeUpdate={(e) => {
                                                const video = e.target as HTMLVideoElement
                                                setCurrentVideoTime(video.currentTime)
                                                setVideoProgress((video.currentTime / video.duration) * 100)
                                            }}
                                            onLoadedMetadata={(e) => {
                                                const video = e.target as HTMLVideoElement
                                                setVideoDuration(video.duration)
                                            }}
                                        >
                                            <source src={getVideoUrl(course)} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>

                                        {/* Custom Play Button Overlay */}
                                        {!isVideoPlaying && (
                                            <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer backdrop-blur-sm"
                                                onClick={(e) => {
                                                    const video = e.currentTarget.previousSibling as HTMLVideoElement
                                                    video.play()
                                                }}
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-6 shadow-2xl"
                                                >
                                                    <Play className="w-12 h-12 text-white fill-current ml-1" />
                                                </motion.div>
                                            </motion.div>
                                        )}

                                        {/* Progress Bar */}
                                        <div className="absolute bottom-20 left-4 right-4">
                                            <Progress value={videoProgress} className="h-1 bg-black/50" />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Course Content Tabs */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50"
                                >
                                    <Tabs defaultValue="overview" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 bg-transparent border-b border-gray-700/50 rounded-none">
                                            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
                                                {t('overview')}
                                            </TabsTrigger>
                                            <TabsTrigger value="lessons" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
                                                {t('lessons')}
                                            </TabsTrigger>
                                            <TabsTrigger value="reviews" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
                                                {t('reviews')}
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="overview" className="p-6 space-y-6">
                                            <div>
                                                <h3 className="text-white text-xl font-bold mb-4">{t('aboutCourse')}</h3>
                                                <div className="text-gray-300 leading-relaxed">
                                                    <p className={`${showFullDescription ? '' : 'line-clamp-4'} mb-4`}>
                                                        {getCourseDescription(course)}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                                    >
                                                        {showFullDescription ? t('showLess') : t('showMore')}
                                                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* What You'll Learn */}
                                            <div className="space-y-4">
                                                <h4 className="text-white text-lg font-semibold">{t('whatYouWillLearn')}</h4>
                                                <div className="grid gap-3">
                                                    {[
                                                        'Master the fundamentals of the subject',
                                                        'Build real-world projects',
                                                        'Learn best practices and industry standards',
                                                        'Get hands-on experience with tools'
                                                    ].map((item, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className="flex items-center gap-3 text-gray-300"
                                                        >
                                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                                            <span>{item}</span>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Instructor Section */}
                                            <div className="pt-6 border-t border-gray-700/50">
                                                <h4 className="text-white text-lg font-semibold mb-4">{t('instructor')}</h4>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                                        {course.creator.user.profileImage ? (
                                                            <img
                                                                src={course.creator.user.profileImage}
                                                                alt={getInstructorName(course.creator.user)}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-white text-xl font-bold">
                                                                {getInstructorName(course.creator.user).charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="text-white font-semibold text-lg">
                                                            {getInstructorName(course.creator.user)}
                                                        </h5>
                                                        <p className="text-gray-400 text-sm mb-3">Expert Instructor</p>
                                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-4 h-4 text-yellow-400" />
                                                                <span>4.9 Rating</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-4 h-4" />
                                                                <span>12,000 Students</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="lessons" className="p-6">
                                            <div className="space-y-4">
                                                <h3 className="text-white text-xl font-bold">{t('courseLessons')}</h3>
                                                <div className="space-y-2">
                                                    {course.lessons?.map((lesson, index) => (
                                                        <motion.div
                                                            key={lesson.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center text-purple-300 text-sm font-medium">
                                                                    {lesson.order}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-white font-medium group-hover:text-purple-300 transition-colors">
                                                                        {currentLocale === 'ar' ? lesson.titleAr || lesson.title : lesson.title}
                                                                    </h4>
                                                                    <p className="text-gray-400 text-sm">
                                                                        {formatDuration(lesson.duration)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Play className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors" />
                                                        </motion.div>
                                                    )) || (
                                                        // Sample lessons if none exist
                                                        Array.from({ length: 8 }, (_, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: index * 0.05 }}
                                                                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer group"
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center text-purple-300 text-sm font-medium">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-white font-medium group-hover:text-purple-300 transition-colors">
                                                                            {t('lesson')} {index + 1}: Introduction to Concepts
                                                                        </h4>
                                                                        <p className="text-gray-400 text-sm">
                                                                            {Math.floor(Math.random() * 20) + 5}:00
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Play className="w-5 h-5 text-gray-400 group-hover:text-purple-300 transition-colors" />
                                                            </motion.div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="reviews" className="p-6">
                                            <div className="space-y-6">
                                                <h3 className="text-white text-xl font-bold">{t('studentReviews')}</h3>
                                                
                                                {/* Reviews Summary */}
                                                <div className="flex items-center gap-6">
                                                    <div className="text-center">
                                                        <div className="text-4xl font-bold text-white mb-2">{course.rating}</div>
                                                        <div className="flex items-center justify-center gap-1 mb-2">
                                                            {[1,2,3,4,5].map(star => (
                                                                <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                                                            ))}
                                                        </div>
                                                        <div className="text-gray-400 text-sm">Based on 1,234 reviews</div>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        {[5,4,3,2,1].map(stars => (
                                                            <div key={stars} className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-400 w-8">{stars}★</span>
                                                                <Progress value={stars === 5 ? 80 : stars === 4 ? 15 : 5} className="h-2" />
                                                                <span className="text-sm text-gray-400 w-12">{stars === 5 ? '80%' : stars === 4 ? '15%' : '5%'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Sample Reviews */}
                                                <div className="space-y-4">
                                                    {[
                                                        { name: 'Ahmed Hassan', rating: 5, text: 'Excellent course! Very comprehensive and well-structured.' },
                                                        { name: 'Sarah Mohamed', rating: 5, text: 'The instructor explains everything clearly. Highly recommended!' },
                                                        { name: 'Omar Ali', rating: 4, text: 'Great content, but could use more practical examples.' }
                                                    ].map((review, index) => (
                                                        <motion.div
                                                            key={index}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.1 }}
                                                            className="p-4 bg-gray-800/30 rounded-lg"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                                                    {review.name.charAt(0)}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-white font-medium">{review.name}</span>
                                                                        <div className="flex items-center gap-1">
                                                                            {[1,2,3,4,5].map(star => (
                                                                                <Star 
                                                                                    key={star} 
                                                                                    className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-gray-300 text-sm">{review.text}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </motion.div>
                            </div>

                            {/* Modern Sidebar */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="xl:col-span-1"
                            >
                                <div className="sticky top-6 space-y-6">
                                    {/* Course Card */}
                                    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                                        <h1 className="text-white text-2xl font-bold mb-6 leading-tight">
                                            {getCourseTitle(course)}
                                        </h1>

                                        {/* Course Stats */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                                                <BookOpen className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                                                <div className="text-white font-semibold">{course.lessons?.length || 17}</div>
                                                <div className="text-gray-400 text-xs">{t('lessons')}</div>
                                            </div>
                                            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                                                <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                                <div className="text-white font-semibold">{formatDuration(course.duration)}</div>
                                                <div className="text-gray-400 text-xs">{t('hours')}</div>
                                            </div>
                                            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                                                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                                <div className="text-white font-semibold">{course.rating}</div>
                                                <div className="text-gray-400 text-xs">{t('rating')}</div>
                                            </div>
                                            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                                                <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                                <div className="text-white font-semibold">{course.totalEnrollments?.toLocaleString() || '1.2K'}</div>
                                                <div className="text-gray-400 text-xs">{t('students')}</div>
                                            </div>
                                        </div>

                                        {/* Course Level & Category */}
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                                                {course.skillLevel}
                                            </Badge>
                                            <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                                                {course.category}
                                            </Badge>
                                        </div>

                                        {/* Price */}
                                        <div className="text-center mb-6">
                                            <div className="text-3xl font-bold text-green-400 mb-1">
                                                {currentLocale === 'ar' ? `${course.price} ج.م` : `EGP ${course.price}`}
                                            </div>
                                            <div className="text-gray-400 text-sm line-through">EGP {Math.floor(course.price * 1.5)}</div>
                                            <div className="text-red-400 text-sm font-medium">30% OFF Limited Time</div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            {!isEnrolled ? (
                                                <Button
                                                    onClick={handleEnroll}
                                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg"
                                                >
                                                    <BookOpen className="w-5 h-5 mr-2" />
                                                    {t('enrollNow')}
                                                </Button>
                                            ) : (
                                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg">
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    {t('enrolled')}
                                                </Button>
                                            )}

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                                                    onClick={handleFavorite}
                                                >
                                                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'text-red-400 fill-current' : ''}`} />
                                                    {t('favorite')}
                                                </Button>
                                                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                                    <Share2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Course Features */}
                                        <div className="mt-6 pt-6 border-t border-gray-700/50">
                                            <h4 className="text-white font-semibold mb-4">{t('courseIncludes')}</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-gray-300 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <span>{t('lifetimeAccess')}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-300 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <span>{t('certificate')}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-300 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <span>{t('mobileAccess')}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-300 text-sm">
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <span>{t('assignments')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Related Courses */}
                                    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
                                        <h3 className="text-white text-lg font-semibold mb-4">{t('relatedCourses')}</h3>
                                        <div className="space-y-3">
                                            {[
                                                { title: 'Advanced JavaScript', price: 299, rating: 4.8 },
                                                { title: 'React Masterclass', price: 399, rating: 4.9 },
                                                { title: 'Node.js Backend', price: 349, rating: 4.7 }
                                            ].map((relatedCourse, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer"
                                                >
                                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex-shrink-0"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-white text-sm font-medium truncate">{relatedCourse.title}</h4>
                                                        <div className="flex items-center justify-between mt-1">
                                                            <span className="text-green-400 text-sm font-medium">EGP {relatedCourse.price}</span>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                                                <span className="text-gray-400 text-xs">{relatedCourse.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}