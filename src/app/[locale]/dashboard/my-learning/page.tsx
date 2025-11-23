'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
    BookOpen, 
    Clock, 
    CheckCircle, 
    Play, 
    TrendingUp, 
    Award,
    Star,
    Calendar,
    Users,
    Filter,
    Search,
    ChevronRight,
    Sparkles,
    Crown,
    BarChart3,
    Bookmark,
    Heart,
    ChevronLeft,
    Home
} from 'lucide-react'
import Image from 'next/image'

interface Course {
    enrollmentId?: string
    courseId?: string
    id?: string
    title: string
    titleAr: string
    thumbnail: string
    instructor: {
        name: string
        arabicName: string
        image: string
    }
    progress?: number
    lastAccessedAt?: string
    completedAt?: string
    totalLessons: number
    duration: number
    category: string
    rating?: number
    totalEnrollments?: number
    skillLevel?: string
}

interface Stats {
    totalAccessibleCourses: number
    totalEnrolled: number
    inProgress: number
    completed: number
    notStarted: number
    totalHoursLearned: number
    averageProgress: number
}

interface Subscription {
    id: string
    type: string
    status: string
    startDate: string
    endDate: string
    autoRenew: boolean
    channelId?: string
    channelName?: string
    channelDescription?: string
    creatorName?: string
    creatorArabicName?: string
    creatorImage?: string
    totalCourses: number
}

interface LearningData {
    stats: Stats;
    subscriptions: Subscription[];
    courses: {
        continueWatching: Course[];
        completed: Course[];
        recommended: Course[];
        myList: Course[];
        liked: Course[];
    };
}

export default function MyLearningPage() {
    const router = useRouter()
    const params = useParams()
    const { data: session } = useSession()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<LearningData | null>(null);
    const [activeTab, setActiveTab] = useState<'continue' | 'completed' | 'recommended' | 'my-list' | 'liked'>('continue');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        if (session) {
            fetchLearningData()
        }
    }, [session])

    const fetchLearningData = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/my-learning')
            if (response.ok) {
                const learningData = await response.json()
                setData(learningData)
            } else {
                console.error('Failed to fetch learning data')
            }
        } catch (error) {
            console.error('Error fetching learning data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCourseClick = (courseId: string) => {
        router.push(`/${locale}/courses/${courseId}`)
    }

    const handleContinueLearning = (courseId: string) => {
        router.push(`/${locale}/courses/${courseId}/learn`)
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat(isArabic ? 'ar-EG' : 'en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(date)
    }

    const getFilteredCourses = () => {
        let courses: Course[] = [];
        
        switch (activeTab) {
            case 'continue':
                courses = data?.courses.continueWatching || [];
                break;
            case 'completed':
                courses = data?.courses.completed || [];
                break;
            case 'recommended':
                courses = data?.courses.recommended || [];
                break;
            case 'my-list':
                courses = data?.courses.myList || [];
                break;
            case 'liked':
                courses = data?.courses.liked || [];
                break;
        }

        // Filter by search
        if (searchQuery) {
            courses = courses.filter(course => 
                course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.titleAr?.includes(searchQuery)
            )
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            courses = courses.filter(course => course.category === selectedCategory)
        }

        return courses
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-white text-lg font-medium">
                        {isArabic ? 'جاري تحميل دوراتك...' : 'Loading your courses...'}
                    </p>
                    <p className="text-white/60 text-sm mt-2">
                        {isArabic ? 'جاري تحضير تجربتك التعليمية' : 'Preparing your learning experience'}
                    </p>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-lg">
                        {isArabic ? 'فشل في تحميل البيانات' : 'Failed to load data'}
                    </p>
                </div>
            </div>
        )
    }

    const filteredCourses = getFilteredCourses()

    return (
        <div className="min-h-screen bg-black" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Breadcrumb */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => router.push(`/${locale}/dashboard`)}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                    >
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <Home className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {isArabic ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Header Section */}
            <div className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative bg-black/40 backdrop-blur-sm py-16 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 mb-6">
                                <Sparkles className="w-5 h-5 text-white" />
                                <span className="text-white font-medium">
                                    {isArabic ? 'رحلتك التعليمية' : 'Your Learning Journey'}
                                </span>
                            </div>
                            
                            <h1 className="text-5xl lg:text-6xl font-semibold text-white mb-4 leading-tight">
                                {isArabic ? 'دوراتي' : 'My Learning'}
                            </h1>
                            <p className="text-xl text-white/70 mb-8 leading-relaxed max-w-3xl">
                                {isArabic 
                                    ? 'تتبع تقدمك واستمر في رحلتك التعليمية'
                                    : 'Track your progress and continue your learning journey'
                                }
                            </p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <BookOpen className="w-5 h-5 text-white/60" />
                                        <div className="text-3xl font-semibold text-white">
                                            {data.stats.totalEnrolled}
                                        </div>
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'دورات مسجلة' : 'Enrolled'}
                                    </div>
                                </div>

                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Play className="w-5 h-5 text-white/60" />
                                        <div className="text-3xl font-semibold text-white">
                                            {data.stats.inProgress}
                                        </div>
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'قيد التقدم' : 'In Progress'}
                                    </div>
                                </div>

                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-white/60" />
                                        <div className="text-3xl font-semibold text-white">
                                            {data.stats.completed}
                                        </div>
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'مكتملة' : 'Completed'}
                                    </div>
                                </div>

                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-white/60" />
                                        <div className="text-3xl font-semibold text-white">
                                            {data.stats.totalHoursLearned}h
                                        </div>
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'ساعات التعلم' : 'Hours Learned'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Active Subscriptions */}
                {data.subscriptions.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                                <Crown className="w-6 h-6 text-white" />
                                {isArabic ? 'اشتراكاتك النشطة' : 'Active Subscriptions'}
                            </h2>
                            <div className="text-white/60 text-sm">
                                {data.subscriptions.length} {isArabic ? 'اشتراك نشط' : 'Active'}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {data.subscriptions.map(sub => {
                                const daysRemaining = Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                const isExpiringSoon = daysRemaining <= 7
                                
                                return (
                                    <div 
                                        key={sub.id}
                                        className="group bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-300 cursor-pointer"
                                        onClick={() => sub.channelId && router.push(`/${locale}/channels/${sub.channelId}`)}
                                    >
                                        {/* Header with gradient overlay */}
                                        <div className="relative bg-gradient-to-br from-white/5 to-transparent p-6 border-b border-white/10">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {sub.creatorImage && (
                                                        <div className="relative">
                                                            <Image
                                                                src={sub.creatorImage}
                                                                alt={sub.creatorName || ''}
                                                                width={64}
                                                                height={64}
                                                                className="rounded-full ring-2 ring-white/20"
                                                            />
                                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                                                <Crown className="w-3 h-3 text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-semibold text-lg mb-1 truncate">
                                                            {sub.channelName}
                                                        </h3>
                                                        <p className="text-white/60 text-sm mb-2">
                                                            {isArabic ? sub.creatorArabicName : sub.creatorName}
                                                        </p>
                                                        {sub.channelDescription && (
                                                            <p className="text-white/50 text-xs line-clamp-1">
                                                                {sub.channelDescription}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Status Badge */}
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                                                        sub.status === 'ACTIVE' 
                                                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                                            : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                                    }`}>
                                                        {sub.status}
                                                    </span>
                                                    {sub.autoRenew && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                            {isArabic ? 'تجديد تلقائي' : 'Auto-renew'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Body with subscription details */}
                                        <div className="p-6">
                                            {/* Subscription Info Grid */}
                                            <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
                                                <div>
                                                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                                                        {isArabic ? 'مدة الاشتراك' : 'Billing Period'}
                                                    </p>
                                                    <p className="text-white font-medium">
                                                        {sub.type === 'CATEGORY_C_MONTHLY' ? (isArabic ? 'شهري' : 'Monthly') :
                                                         sub.type === 'CATEGORY_C_YEARLY' ? (isArabic ? 'سنوي' : 'Yearly') :
                                                         sub.type.includes('MONTHLY') ? (isArabic ? 'شهري' : 'Monthly') :
                                                         (isArabic ? 'سنوي' : 'Yearly')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1">
                                                        {isArabic ? 'نوع العضوية' : 'Membership'}
                                                    </p>
                                                    <p className="text-white font-medium flex items-center gap-1 justify-end">
                                                        <Crown className="w-4 h-4 text-white/60" />
                                                        {isArabic ? 'مشترك' : 'Subscriber'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {isArabic ? 'بدأ في' : 'Started'}
                                                    </p>
                                                    <p className="text-white/80 text-sm">
                                                        {formatDate(sub.startDate)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-white/50 text-xs uppercase tracking-wider mb-1 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {isArabic ? 'ينتهي في' : 'Expires'}
                                                    </p>
                                                    <p className={`text-sm font-medium ${isExpiringSoon ? 'text-orange-400' : 'text-white/80'}`}>
                                                        {formatDate(sub.endDate)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Days Remaining */}
                                            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                                                isExpiringSoon 
                                                    ? 'bg-orange-500/10 border border-orange-500/20' 
                                                    : 'bg-white/5 border border-white/10'
                                            }`}>
                                                <Clock className={`w-4 h-4 ${isExpiringSoon ? 'text-orange-400' : 'text-white/60'}`} />
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium ${isExpiringSoon ? 'text-orange-400' : 'text-white'}`}>
                                                        {daysRemaining} {isArabic ? 'يوم متبقي' : 'days remaining'}
                                                    </p>
                                                    {isExpiringSoon && (
                                                        <p className="text-orange-400/70 text-xs mt-0.5">
                                                            {isArabic ? 'ينتهي قريباً!' : 'Expiring soon!'}
                                                        </p>
                                                    )}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-2 mb-8 sticky top-0 z-10">
                    <div className="flex overflow-x-auto gap-2 no-scrollbar">
                        <button
                            onClick={() => setActiveTab('continue')}
                            className={`px-8 py-4 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                                activeTab === 'continue'
                                    ? 'bg-white/20 text-white shadow-lg border border-white/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Play className="w-5 h-5" />
                                <span>{isArabic ? 'متابعة المشاهدة' : 'Continue Watching'}</span>
                                {data.courses.continueWatching.length > 0 && (
                                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {data.courses.continueWatching.length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-8 py-4 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                                activeTab === 'completed'
                                    ? 'bg-white/20 text-white shadow-lg border border-white/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5" />
                                <span>{isArabic ? 'مكتملة' : 'Completed'}</span>
                                {data.courses.completed.length > 0 && (
                                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {data.courses.completed.length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('recommended')}
                            className={`px-8 py-4 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                                activeTab === 'recommended'
                                    ? 'bg-white/20 text-white shadow-lg border border-white/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-5 h-5" />
                                <span>{isArabic ? 'موصى به' : 'Recommended'}</span>
                                {data.courses.recommended.length > 0 && (
                                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {data.courses.recommended.length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('my-list')}
                            className={`px-8 py-4 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                                activeTab === 'my-list'
                                    ? 'bg-white/20 text-white shadow-lg border border-white/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Bookmark className="w-5 h-5" />
                                <span>{isArabic ? 'قائمتي' : 'My List'}</span>
                                {data.courses.myList.length > 0 && (
                                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {data.courses.myList.length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('liked')}
                            className={`px-8 py-4 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                                activeTab === 'liked'
                                    ? 'bg-white/20 text-white shadow-lg border border-white/30'
                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Heart className="w-5 h-5" />
                                <span>{isArabic ? 'المفضلة' : 'Liked'}</span>
                                {data.courses.liked.length > 0 && (
                                    <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                                        {data.courses.liked.length}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            placeholder={isArabic ? 'ابحث عن دورة...' : 'Search courses...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-12 text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
                        />
                    </div>

                </div>

                {/* Courses Grid */}
                {filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <div
                                key={course.enrollmentId || course.id}
                                className="group bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-300 cursor-pointer"
                                onClick={() => handleCourseClick(course.courseId || course.id || '')}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video overflow-hidden">
                                    <Image
                                        src={course.thumbnail || '/images/default-course.jpg'}
                                        alt={course.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {course.progress !== undefined && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                            <div 
                                                className="h-full bg-white transition-all duration-300"
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                    )}
                                    {activeTab === 'continue' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleContinueLearning(course.courseId || '')
                                            }}
                                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                                                <Play className="w-8 h-8 text-white ml-1" />
                                            </div>
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                                        {isArabic ? course.titleAr : course.title}
                                    </h3>

                                    {/* Instructor */}
                                    <div className="flex items-center gap-2 mb-4">
                                        {course.instructor.image && (
                                            <Image
                                                src={course.instructor.image}
                                                alt={course.instructor.name}
                                                width={24}
                                                height={24}
                                                className="rounded-full"
                                            />
                                        )}
                                        <p className="text-white/60 text-sm">
                                            {isArabic ? course.instructor.arabicName : course.instructor.name}
                                        </p>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 text-white/50 text-sm mb-4">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="w-4 h-4" />
                                            <span>{course.totalLessons} {isArabic ? 'درس' : 'lessons'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatDuration(course.duration)}</span>
                                        </div>
                                    </div>

                                    {/* Progress/Status */}
                                    {activeTab === 'continue' && course.progress !== undefined && (
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-white/60 text-sm">
                                                    {isArabic ? 'التقدم' : 'Progress'}
                                                </span>
                                                <span className="text-white font-medium text-sm">
                                                    {course.progress}%
                                                </span>
                                            </div>
                                            {course.lastAccessedAt && (
                                                <p className="text-white/40 text-xs">
                                                    {isArabic ? 'آخر وصول' : 'Last accessed'}: {formatDate(course.lastAccessedAt)}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'completed' && course.completedAt && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-green-400">
                                                <Award className="w-5 h-5" />
                                                <span className="text-sm font-medium">
                                                    {isArabic ? 'مكتمل' : 'Completed'}
                                                </span>
                                            </div>
                                            <span className="text-white/40 text-xs">
                                                {formatDate(course.completedAt)}
                                            </span>
                                        </div>
                                    )}

                                    {activeTab === 'recommended' && course.rating && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="text-white font-medium text-sm">{course.rating}</span>
                                            </div>
                                            {course.totalEnrollments && (
                                                <div className="flex items-center gap-1 text-white/50 text-xs">
                                                    <Users className="w-4 h-4" />
                                                    <span>{course.totalEnrollments}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-12 max-w-md mx-auto">
                            <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
                            <h3 className="text-white text-xl font-semibold mb-2">
                                {isArabic ? 'لا توجد دورات' : 'No Courses Found'}
                            </h3>
                            <p className="text-white/60">
                                {isArabic 
                                    ? 'لم يتم العثور على دورات تطابق معايير البحث'
                                    : 'No courses match your search criteria'
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
