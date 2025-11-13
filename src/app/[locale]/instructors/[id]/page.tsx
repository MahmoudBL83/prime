'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star,
    Users,
    BookOpen,
    Clock,
    MapPin,
    Award,
    Calendar,
    MessageCircle,
    Heart,
    HeartOff,
    ExternalLink,
    Play,
    CheckCircle,
    TrendingUp,
    Target,
    Briefcase,
    GraduationCap,
    ArrowLeft,
    Globe,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslationsSafe, useLocaleSafe } from '@/hooks/useTranslationsSafe'
import { useNavigationLoading } from '@/hooks/useNavigationLoading'
import { LoadingButton } from '@/components/ui/loading-button'
import { toast } from 'react-hot-toast'

interface InstructorData {
    id: string
    user: {
        id: string
        name: string
        arabicName: string
        bio: string
        profileImage: string | null
        interests: string
        goals: string
        createdAt: string
    }
    kycStatus: string
    expertise: string
    teachingGoals: string
    totalEarnings: number
    totalSubscribers: number
    hourlyRate: number
    availableForMeetings: boolean
    timezone: string
    languages: string
    meetingTypes: Array<{
        type: string
        duration: number
        price: number
    }>
    certifications: Array<{
        name: string
        issuer: string
        year: number
        credential: string
    }>
    socialLinks: {
        [key: string]: string
    }
    stats: {
        totalFollowers: number
        totalCourses: number
        totalStudents: number
        completedMeetings: number
        averageRating: number
        yearsOfExperience: number
    }
    courses: Array<{
        id: string
        title: string
        titleAr: string
        description: string
        thumbnail: string
        price: number
        rating: number
        totalEnrollments: number
        formattedDuration: string
        category: string
        skillLevel: string
    }>
    recentReviews: Array<{
        id: string
        rating: number
        comment: string
        user: {
            name: string
            arabicName: string
            profileImage: string | null
        }
        course: {
            title: string
            titleAr: string
        }
        createdAt: string
    }>
}

export default function InstructorProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const currentLocale = useLocaleSafe()
    const { t } = useTranslationsSafe('instructorProfile')
    const { t: tCommon } = useTranslationsSafe('common')

    const { navigateWithLoading, isLoading } = useNavigationLoading()
    const [instructor, setInstructor] = useState<InstructorData | null>(null)
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [followLoading, setFollowLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        if (params.id) {
            fetchInstructorData()
        }
    }, [params.id])

    useEffect(() => {
        if (params.id && session?.user) {
            checkFollowStatus()
        }
    }, [params.id, session?.user])

    const fetchInstructorData = async () => {
        try {
            const response = await fetch(`/api/instructors/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setInstructor(data.instructor)
            } else {
                toast.error('Instructor not found')
                router.push('/instructors')
            }
        } catch (error) {
            console.error('Error fetching instructor:', error)
            toast.error('Failed to load instructor profile')
        } finally {
            setLoading(false)
        }
    }

    const checkFollowStatus = async () => {
        if (!session?.user) return
        
        try {
            const response = await fetch(`/api/instructors/${params.id}/follow`)
            if (response.ok) {
                const data = await response.json()
                setIsFollowing(data.isFollowing)
            } else {
                console.error('Failed to check follow status:', response.statusText)
            }
        } catch (error) {
            console.error('Error checking follow status:', error)
        }
    }

    const handleFollow = async () => {
        if (!session?.user) {
            toast.error('Please log in to follow instructors')
            router.push('/auth/login')
            return
        }

        setFollowLoading(true)
        try {
            const method = isFollowing ? 'DELETE' : 'POST'
            const response = await fetch(`/api/instructors/${params.id}/follow`, {
                method
            })

            if (response.ok) {
                setIsFollowing(!isFollowing)
                setInstructor(prev => prev ? {
                    ...prev,
                    stats: {
                        ...prev.stats,
                        totalFollowers: prev.stats.totalFollowers + (isFollowing ? -1 : 1)
                    }
                } : null)
                toast.success(isFollowing ? 'Unfollowed successfully' : 'Following successfully')
            } else {
                const error = await response.json()
                console.error('Follow API error:', error)
                
                // Handle specific error cases
                if (error.error === 'Already following this instructor') {
                    setIsFollowing(true)
                    toast.success('You are already following this instructor')
                } else if (error.error === 'Not following this instructor') {
                    setIsFollowing(false)
                    toast.success('You are not following this instructor')
                } else {
                    toast.error(error.error || error.message || 'Failed to update follow status')
                }
                
                // Refresh follow status to sync UI state
                checkFollowStatus()
            }
        } catch (error) {
            console.error('Follow error:', error)
            toast.error('Failed to update follow status')
        } finally {
            setFollowLoading(false)
        }
    }

    const handleBookMeeting = () => {
        if (!session?.user) {
            toast.error('Please log in to book meetings')
            navigateWithLoading('/auth/login', 'login')
            return
        }

        // Navigate to meeting booking page
        navigateWithLoading(`/instructors/${params.id}/book-meeting`, 'booking')
    }

    const handleSendMessage = () => {
        if (!session?.user) {
            toast.error('Please log in to send messages')
            navigateWithLoading('/auth/login', 'login')
            return
        }

        // Navigate to messages page (coming soon placeholder)
        navigateWithLoading('/messages', 'messages')
    }

    const getInstructorName = (instructor: InstructorData) => {
        return currentLocale === 'ar' && instructor.user.arabicName 
            ? instructor.user.arabicName 
            : instructor.user.name
    }

    const getCourseTitle = (course: any) => {
        return currentLocale === 'ar' && course.titleAr 
            ? course.titleAr 
            : course.title
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">{tCommon('loading')}</div>
            </div>
        )
    }

    if (!instructor) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Instructor not found</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            {/* Hero Section */}
            <div className="relative z-10">
                <div className="backdrop-blur-sm bg-gradient-to-r from-purple-900/80 to-blue-900/80 py-24 px-6 border-b border-white/10">
                    <div className="max-w-7xl mx-auto">
                        <LoadingButton
                            variant="ghost"
                            className="text-white mb-6"
                            onClick={() => navigateWithLoading('/instructors', 'back')}
                            loading={isLoading('back')}
                            loadingText="Going back..."
                            icon={<ArrowLeft className="w-4 h-4" />}
                        >
                            {tCommon('back')}
                        </LoadingButton>

                        <div className="flex flex-col lg:flex-row items-start gap-12">
                            {/* Profile Image with Glassmorphism */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="relative group"
                            >
                                <div className="w-40 h-40 rounded-3xl overflow-hidden backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl group-hover:scale-105 transition-all duration-500 relative z-10">
                                    {instructor.user.profileImage ? (
                                        <img
                                            src={instructor.user.profileImage}
                                            alt={getInstructorName(instructor)}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center relative">
                                            <span className="text-white text-5xl font-bold drop-shadow-lg">
                                                {getInstructorName(instructor).charAt(0)}
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        </div>
                                    )}
                                </div>
                                {/* Floating ring effect */}
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400 to-pink-400 blur-lg opacity-0 group-hover:opacity-30 transition-all duration-500 -z-10"></div>
                            </motion.div>

                            <motion.div 
                                className="flex-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div>
                                        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
                                            {getInstructorName(instructor)}
                                        </h1>
                                        <div className="flex items-center gap-3">
                                            {instructor.kycStatus === 'VERIFIED' && (
                                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow-lg px-3 py-1.5">
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Verified Expert
                                                </Badge>
                                            )}
                                            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 px-3 py-1.5">
                                                <TrendingUp className="w-4 h-4 mr-2" />
                                                Top Rated
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-purple-300 text-xl mb-4">{instructor.expertise}</p>
                                <p className="text-gray-300 text-lg max-w-2xl mb-6">{instructor.user.bio}</p>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { icon: Users, label: 'Students', value: instructor.stats.totalStudents.toLocaleString(), color: 'from-blue-500 to-cyan-500' },
                                        { icon: BookOpen, label: 'Courses', value: instructor.stats.totalCourses, color: 'from-green-500 to-emerald-500' },
                                        { icon: Star, label: 'Rating', value: instructor.stats.averageRating.toFixed(1), color: 'from-yellow-500 to-orange-500' },
                                        { icon: Heart, label: 'Followers', value: instructor.stats.totalFollowers, color: 'from-pink-500 to-rose-500' }
                                    ].map((stat, index) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                                            className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 text-center group hover:bg-white/20 transition-all duration-300 hover:scale-105"
                                        >
                                            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                                <stat.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                                            <div className="text-sm text-gray-300">{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 flex-wrap">
                                    <Button 
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        className={`px-6 py-3 ${isFollowing 
                                            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                                            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                                        }`}
                                    >
                                        {followLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                                        ) : isFollowing ? (
                                            <HeartOff className="w-4 h-4 mr-2" />
                                        ) : (
                                            <Heart className="w-4 h-4 mr-2" />
                                        )}
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Button>
                                    
                                    <LoadingButton 
                                        onClick={handleSendMessage}
                                        variant="outline" 
                                        className="border-white/30 text-white hover:bg-white/10"
                                        loading={isLoading('messages')}
                                        loadingText="Opening messages..."
                                        icon={<MessageCircle className="w-4 h-4" />}
                                    >
                                        Message
                                    </LoadingButton>

                                    {instructor.availableForMeetings && (
                                        <LoadingButton 
                                            onClick={handleBookMeeting}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            loading={isLoading('booking')}
                                            loadingText="Loading booking..."
                                            icon={<Calendar className="w-4 h-4" />}
                                        >
                                            Book Meeting (${instructor.hourlyRate}/hr)
                                        </LoadingButton>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-2 mb-8">
                        <TabsTrigger value="overview" className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-300">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="courses" className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-300">
                            Courses ({instructor?.stats.totalCourses})
                        </TabsTrigger>
                        <TabsTrigger value="reviews" className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-300">
                            Reviews
                        </TabsTrigger>
                        <TabsTrigger value="about" className="text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 transition-all duration-300">
                            About
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Popular Courses */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8"
                            >
                                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <BookOpen className="w-6 h-6 text-purple-400" />
                                    Popular Courses
                                </h3>
                                <div className="space-y-4">
                                    {instructor?.courses.slice(0, 3).map((course, index) => (
                                        <motion.div 
                                            key={course.id} 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group relative"
                                            onClick={() => navigateWithLoading(`/courses/${course.id}`, `course-${course.id}`)}
                                        >
                                            {isLoading(`course-${course.id}`) && (
                                                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
                                                    <div className="flex items-center gap-2 text-white">
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        <span>Loading course...</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex gap-4">
                                                <div className="relative overflow-hidden rounded-xl group-hover:scale-105 transition-transform duration-300">
                                                    <img 
                                                        src={course.thumbnail || '/images/placeholder-course.jpg'} 
                                                        alt={getCourseTitle(course)}
                                                        className="w-20 h-14 object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-semibold mb-1 group-hover:text-purple-300 transition-colors">
                                                        {getCourseTitle(course)}
                                                    </h4>
                                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                            {course.rating.toFixed(1)}
                                                        </div>
                                                        <span>{course.totalEnrollments} students</span>
                                                        <span>{course.formattedDuration}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-green-400 font-bold text-lg">${course.price}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Recent Reviews */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-8"
                            >
                                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                    <Star className="w-6 h-6 text-yellow-400" />
                                    Recent Reviews
                                </h3>
                                <div className="space-y-4">
                                    {instructor?.recentReviews.slice(0, 3).map((review, index) => (
                                        <motion.div 
                                            key={review.id} 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                                        >
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-xs font-bold">
                                                        {(currentLocale === 'ar' && review.user.arabicName ? review.user.arabicName : review.user.name).charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-white font-medium">
                                                            {currentLocale === 'ar' && review.user.arabicName ? review.user.arabicName : review.user.name}
                                                        </span>
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-300 text-sm">{review.comment}</p>
                                                    <p className="text-gray-500 text-xs mt-1">
                                                        For: {getCourseTitle(review.course)}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </TabsContent>

                    <TabsContent value="courses" className="mt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instructor.courses.map((course) => (
                                <div key={course.id} className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors cursor-pointer relative group"
                                    onClick={() => navigateWithLoading(`/courses/${course.id}`, `course-full-${course.id}`)}>
                                    {isLoading(`course-full-${course.id}`) && (
                                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
                                            <div className="flex items-center gap-2 text-white">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Loading...</span>
                                            </div>
                                        </div>
                                    )}
                                    <img 
                                        src={course.thumbnail || '/images/placeholder-course.jpg'} 
                                        alt={getCourseTitle(course)}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-white font-semibold mb-2">{getCourseTitle(course)}</h3>
                                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{course.description}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-white">{course.rating.toFixed(1)}</span>
                                                <span className="text-gray-400">({course.totalEnrollments})</span>
                                            </div>
                                            <span className="text-green-400 font-bold">${course.price}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-8">
                        <div className="space-y-6">
                            {instructor.recentReviews.map((review) => (
                                <div key={review.id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold">
                                                {(currentLocale === 'ar' && review.user.arabicName ? review.user.arabicName : review.user.name).charAt(0)}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-white font-semibold">
                                                    {currentLocale === 'ar' && review.user.arabicName ? review.user.arabicName : review.user.name}
                                                </span>
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-gray-400 text-sm">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 mb-2">{review.comment}</p>
                                            <p className="text-purple-400 text-sm">
                                                Course: {getCourseTitle(review.course)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="about" className="mt-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Certifications */}
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">Certifications & Credentials</h3>
                                <div className="space-y-4">
                                    {instructor.certifications.map((cert, index) => (
                                        <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                            <div className="flex items-start gap-3">
                                                <Award className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
                                                <div>
                                                    <h4 className="text-white font-semibold">{cert.name}</h4>
                                                    <p className="text-gray-400 text-sm">{cert.issuer} • {cert.year}</p>
                                                    <p className="text-gray-500 text-xs">ID: {cert.credential}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Social Links & Teaching Philosophy */}
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">Connect & Follow</h3>
                                <div className="space-y-3 mb-8">
                                    {Object.entries(instructor.socialLinks).map(([platform, url]) => (
                                        <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                                            <Globe className="w-5 h-5 text-purple-400" />
                                            <span className="text-white capitalize">{platform}</span>
                                            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
                                        </a>
                                    ))}
                                </div>

                                {/* Teaching Philosophy */}
                                <h4 className="text-xl font-bold text-white mb-4">Teaching Philosophy</h4>
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                    <p className="text-gray-300 leading-relaxed">
                                        {instructor.teachingGoals}
                                    </p>
                                </div>

                                {/* Additional Info */}
                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                        <span className="text-gray-400">Experience</span>
                                        <span className="text-white">{instructor.stats.yearsOfExperience}+ years</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                        <span className="text-gray-400">Sessions Completed</span>
                                        <span className="text-white">{instructor.stats.completedMeetings}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3 border-b border-gray-700">
                                        <span className="text-gray-400">Languages</span>
                                        <span className="text-white">{instructor.languages}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-3">
                                        <span className="text-gray-400">Timezone</span>
                                        <span className="text-white">{instructor.timezone}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}