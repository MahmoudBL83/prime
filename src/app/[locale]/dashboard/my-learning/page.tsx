'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
    BookOpen, 
    Clock, 
    CheckCircle, 
    PlayCircle, 
    Award,
    TrendingUp,
    Sparkles,
    Zap,
    Users,
    Calendar,
    ArrowRight,
    Star,
    Download,
    Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import toast from 'react-hot-toast'

interface Course {
    id: string
    title: string
    titleAr?: string
    thumbnail?: string
    instructor: {
        name: string
        arabicName?: string
        image?: string
    }
    progress?: number
    lastAccessedAt?: string
    completedAt?: string
    enrollmentId?: string
    totalLessons: number
    duration: number
    category: string
    rating?: number
    totalEnrollments?: number
    skillLevel?: string
    certificateId?: string // Added for certificate functionality
}

interface Subscription {
    id: string
    type: string
    status: string
    endDate: string
    channelId?: string
    channelName?: string
    creatorName?: string
    creatorImage?: string
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

interface MyLearningData {
    stats: Stats
    subscriptions: Subscription[]
    courses: {
        continueWatching: Course[]
        completed: Course[]
        recommended: Course[]
    }
}

export default function MyLearningPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    
    const [data, setData] = useState<MyLearningData | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'continue' | 'completed' | 'explore'>('continue')
    
    const isArabic = locale === 'ar'

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/dashboard/my-learning`)
            return
        }

        if (status === 'authenticated') {
            fetchMyLearning()
        }
    }, [status, router, locale])

    const fetchMyLearning = async () => {
        try {
            const response = await fetch('/api/my-learning')
            if (response.ok) {
                const learningData = await response.json()
                setData(learningData)
            } else {
                toast.error('Failed to load your learning data')
            }
        } catch (error) {
            console.error('Error fetching my learning:', error)
            toast.error('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return new Intl.DateTimeFormat(locale, { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        }).format(date)
    }

    const handleCertificateDownload = async (enrollmentId: string) => {
        try {
            toast.loading(isArabic ? 'جار إنشاء الشهادة...' : 'Generating certificate...')
            
            // First, try to generate certificate if it doesn't exist
            const generateResponse = await fetch('/api/certificates/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    enrollmentId,
                    courseId: data?.courses.completed.find(c => c.enrollmentId === enrollmentId)?.id
                })
            })

            if (!generateResponse.ok) {
                const error = await generateResponse.json()
                toast.dismiss()
                toast.error(error.error || (isArabic ? 'فشل إنشاء الشهادة' : 'Failed to generate certificate'))
                return
            }

            const { certificate } = await generateResponse.json()

            toast.dismiss()
            toast.loading(isArabic ? 'جار تنزيل ملف PDF...' : 'Downloading PDF...')

            // Download PDF directly
            const downloadUrl = `/api/certificates/${certificate.id}/download?locale=${locale}`
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `Certificate-${certificate.certificateNumber}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Small delay to show success message after download starts
            setTimeout(() => {
                toast.dismiss()
                toast.success(isArabic ? 'تم تنزيل الشهادة بنجاح!' : 'Certificate downloaded successfully!')
            }, 500)

        } catch (error) {
            console.error('Certificate download error:', error)
            toast.dismiss()
            toast.error(isArabic ? 'حدث خطأ أثناء تنزيل الشهادة' : 'Error downloading certificate')
        }
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    const getSubscriptionBadge = (type: string) => {
        const badges: Record<string, { text: string, color: string }> = {
            'CATEGORY_A': { 
                text: isArabic ? 'المكتبة الشاملة' : 'All-Access', 
                color: 'bg-purple-500/20 text-purple-300 border-purple-400/30' 
            },
            'CATEGORY_B': { 
                text: isArabic ? 'الدورات المميزة' : 'Signature', 
                color: 'bg-amber-500/20 text-amber-300 border-amber-400/30' 
            },
            'CATEGORY_C': { 
                text: isArabic ? 'قناة منشئ' : 'Creator Channel', 
                color: 'bg-green-500/20 text-green-300 border-green-400/30' 
            },
            'BUNDLE_AB': { 
                text: isArabic ? 'باقة A+B' : 'Bundle A+B', 
                color: 'bg-pink-500/20 text-pink-300 border-pink-400/30' 
            },
            'BUNDLE_ABC': { 
                text: isArabic ? 'الباقة الشاملة' : 'Ultimate', 
                color: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30' 
            }
        }
        return badges[type] || badges['CATEGORY_A']
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 rounded-full animate-ping"></div>
                        <div className="w-16 h-16 border-4 border-purple-500/50 border-t-purple-400 rounded-full animate-spin mx-auto mb-6"></div>
                    </div>
                    <p className="text-purple-200 text-lg font-medium">{isArabic ? 'جاري التحميل...' : 'Loading your learning...'}</p>
                    <p className="text-gray-400 text-sm mt-2">{isArabic ? 'تحضير دوراتك' : 'Preparing your courses'}</p>
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
                <Card className="max-w-md bg-gray-800/60 backdrop-blur-md border-gray-700/50 text-white">
                    <CardContent className="p-8 text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                        <h2 className="text-2xl font-bold mb-2">
                            {isArabic ? 'لا توجد اشتراكات نشطة' : 'No Active Subscriptions'}
                        </h2>
                        <p className="text-gray-300 mb-6">
                            {isArabic 
                                ? 'اشترك في خطة للبدء في التعلم والوصول إلى مئات الدورات!'
                                : 'Subscribe to a plan to start learning and access hundreds of courses!'}
                        </p>
                        <Link href={`/${locale}/subscribe`}>
                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
                                {isArabic ? 'عرض الخطط' : 'View Plans'}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/30 to-blue-900/30 py-16 px-6 border-b border-white/10">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            {/* Back to Dashboard Button */}
                            <Link href={`/${locale}/dashboard`}>
                                <Button 
                                    variant="ghost" 
                                    className="text-purple-200 hover:text-white hover:bg-purple-600/20 mb-6 -ml-2"
                                >
                                    <ArrowRight className={`w-4 h-4 ${isArabic ? '' : 'rotate-180'}`} />
                                    <span className="ml-2">{isArabic ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}</span>
                                </Button>
                            </Link>

                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-cyan-600/20 backdrop-blur-sm border border-cyan-500/30 rounded-full px-6 py-3 mb-6">
                                <BookOpen className="w-5 h-5 text-cyan-400" />
                                <span className="text-cyan-200 font-medium">
                                    {isArabic ? 'مركز التعلم الخاص بك' : 'Your Learning Hub'}
                                </span>
                            </div>
                            
                            {/* Large Gradient Title */}
                            <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent mb-4 leading-tight">
                                {isArabic ? 'تعلمي' : 'My Learning'}
                            </h1>
                            
                            {/* Description */}
                            <p className="text-xl text-purple-100/80 mb-8 leading-relaxed max-w-3xl">
                                {isArabic 
                                    ? `لديك وصول إلى ${data.stats.totalAccessibleCourses} دورة عبر اشتراكاتك النشطة. واصل رحلة التعلم وحقق أهدافك!`
                                    : `You have access to ${data.stats.totalAccessibleCourses} courses across your active subscriptions. Continue your learning journey and achieve your goals!`}
                            </p>
                            
                            {/* Quick Stats - Mini Version */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                                <div className="text-center bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 hover:border-cyan-400/60 transition-all duration-300">
                                    <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                                        {data.stats.totalAccessibleCourses}
                                    </div>
                                    <div className="text-cyan-300 text-xs uppercase tracking-wider">
                                        {isArabic ? 'إجمالي الدورات' : 'Total Courses'}
                                    </div>
                                </div>
                                <div className="text-center bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 hover:border-orange-400/60 transition-all duration-300">
                                    <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                                        {data.stats.inProgress}
                                    </div>
                                    <div className="text-orange-300 text-xs uppercase tracking-wider">
                                        {isArabic ? 'قيد التقدم' : 'In Progress'}
                                    </div>
                                </div>
                                <div className="text-center bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 hover:border-green-400/60 transition-all duration-300">
                                    <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                                        {data.stats.completed}
                                    </div>
                                    <div className="text-green-300 text-xs uppercase tracking-wider">
                                        {isArabic ? 'مكتملة' : 'Completed'}
                                    </div>
                                </div>
                                <div className="text-center bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 hover:border-purple-400/60 transition-all duration-300">
                                    <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                                        {data.stats.averageProgress}%
                                    </div>
                                    <div className="text-purple-300 text-xs uppercase tracking-wider">
                                        {isArabic ? 'متوسط الإنجاز' : 'Avg Progress'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Active Subscriptions */}
                {data.subscriptions.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                                {isArabic ? 'اشتراكاتك النشطة' : 'Your Active Subscriptions'}
                            </h2>
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                {data.subscriptions.length} {isArabic ? 'نشطة' : 'active'}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.subscriptions.map((sub) => {
                                const badge = getSubscriptionBadge(sub.type)
                                // Link to individual channel page if channelId exists, otherwise to channels browse page
                                const channelUrl = sub.channelId 
                                    ? `/${locale}/channels/${sub.channelId}` 
                                    : sub.type === 'CATEGORY_C' 
                                        ? `/${locale}/channels` 
                                        : `/${locale}/subscribe`
                                return (
                                    <Link key={sub.id} href={channelUrl}>
                                        <div className="relative group bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer">
                                            {/* Decorative gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                                            
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-4">
                                                    <Badge className={`${badge.color} border`}>
                                                        {badge.text}
                                                    </Badge>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${sub.status === 'ACTIVE' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                                                        <span className={`text-xs font-medium ${sub.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-400'}`}>
                                                            {sub.status === 'ACTIVE' 
                                                                ? (isArabic ? 'نشط' : 'Active')
                                                                : (isArabic ? 'ملغى' : 'Cancelled')}
                                                        </span>
                                                    </div>
                                                </div>
                                                {sub.channelName && (
                                                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-300 transition-colors">{sub.channelName}</h3>
                                                )}
                                                {sub.creatorName && (
                                                    <div className="flex items-center gap-2 mb-4">
                                                        {sub.creatorImage ? (
                                                            <Image src={sub.creatorImage} alt={sub.creatorName} width={24} height={24} className="rounded-full" />
                                                        ) : (
                                                            <Users className="w-5 h-5 text-gray-400" />
                                                        )}
                                                        <p className="text-sm text-gray-400">{sub.creatorName}</p>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50">
                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{isArabic ? 'ينتهي في' : 'Ends'} {formatDate(sub.endDate)}</span>
                                                    </div>
                                                    <ArrowRight className={`w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-all group-hover:translate-x-1 ${isArabic ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Course Library Section */}
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        {isArabic ? 'مكتبة الدورات' : 'Course Library'}
                    </h2>
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                        <TabButton
                            active={activeTab === 'continue'}
                            onClick={() => setActiveTab('continue')}
                            icon={<PlayCircle className="w-5 h-5" />}
                            label={isArabic ? 'واصل المشاهدة' : 'Continue Watching'}
                            count={data.courses.continueWatching.length}
                        />
                        <TabButton
                            active={activeTab === 'completed'}
                            onClick={() => setActiveTab('completed')}
                            icon={<Award className="w-5 h-5" />}
                            label={isArabic ? 'مكتمل' : 'Completed'}
                            count={data.courses.completed.length}
                        />
                        <TabButton
                            active={activeTab === 'explore'}
                            onClick={() => setActiveTab('explore')}
                            icon={<TrendingUp className="w-5 h-5" />}
                            label={isArabic ? 'استكشف' : 'Explore'}
                            count={data.courses.recommended.length}
                        />
                    </div>
                </div>

                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTab === 'continue' && data.courses.continueWatching.map((course) => (
                        <CourseCard key={course.enrollmentId} course={course} locale={locale} type="continue" />
                    ))}
                    {activeTab === 'completed' && data.courses.completed.map((course) => (
                        <CourseCard 
                            key={course.enrollmentId} 
                            course={course} 
                            locale={locale} 
                            type="completed" 
                            onCertificateDownload={handleCertificateDownload}
                        />
                    ))}
                    {activeTab === 'explore' && data.courses.recommended.map((course) => (
                        <CourseCard key={course.id} course={course} locale={locale} type="explore" />
                    ))}
                </div>

                {/* Empty State */}
                {((activeTab === 'continue' && data.courses.continueWatching.length === 0) ||
                  (activeTab === 'completed' && data.courses.completed.length === 0) ||
                  (activeTab === 'explore' && data.courses.recommended.length === 0)) && (
                    <div className="text-center py-20">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-2xl"></div>
                            <div className="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-full p-8">
                                <BookOpen className="w-16 h-16 text-gray-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                            {activeTab === 'continue' && (isArabic ? 'لا توجد دورات قيد التقدم' : 'No courses in progress')}
                            {activeTab === 'completed' && (isArabic ? 'لم تكمل أي دورات بعد' : 'No completed courses yet')}
                            {activeTab === 'explore' && (isArabic ? 'تم استكشاف جميع الدورات!' : 'All courses explored!')}
                        </h3>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            {activeTab === 'explore' && (isArabic 
                                ? 'لقد بدأت جميع الدورات المتاحة. عمل رائع!'
                                : "You've started all available courses. Great work!")}
                            {activeTab !== 'explore' && (isArabic 
                                ? 'ابدأ التعلم لرؤية الدورات هنا'
                                : 'Start learning to see courses here')}
                        </p>
                        {activeTab === 'explore' && (
                            <Link href={`/${locale}/subscribe`}>
                                <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                                    {isArabic ? 'ترقية الاشتراك' : 'Upgrade Subscription'}
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// Tab Button Component
function TabButton({ active, onClick, icon, label, count }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                active 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'bg-gray-800/60 border border-gray-700/50 text-gray-300 hover:bg-gray-800/80 hover:border-gray-600/50'
            }`}
        >
            {icon}
            <span>{label}</span>
            {count > 0 && (
                <Badge className={active ? 'bg-white/20 text-white border-none' : 'bg-gray-700/50 text-gray-400 border-gray-600/30'}>
                    {count}
                </Badge>
            )}
        </button>
    )
}

// Course Card Component
function CourseCard({ course, locale, type, onCertificateDownload }: { 
    course: Course, 
    locale: string, 
    type: 'continue' | 'completed' | 'explore',
    onCertificateDownload?: (enrollmentId: string) => void
}) {
    const isArabic = locale === 'ar'
    const title = isArabic && course.titleAr ? course.titleAr : course.title
    const instructorName = isArabic && course.instructor.arabicName ? course.instructor.arabicName : course.instructor.name

    return (
        <Link href={`/${locale}/courses/${course.id}/learn`}>
            <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden hover:bg-gray-800/80 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 group cursor-pointer">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-gray-700/50 to-gray-800/50 overflow-hidden">
                    {course.thumbnail ? (
                        <Image 
                            src={course.thumbnail} 
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-16 h-16 text-white/50" />
                        </div>
                    )}
                    
                    {/* Progress Overlay for Continue Watching */}
                    {type === 'continue' && course.progress !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white">{Math.round(course.progress)}%</span>
                                <PlayCircle className="w-4 h-4 text-white" />
                            </div>
                            <Progress value={course.progress} className="h-1" />
                        </div>
                    )}

                    {/* Completed Badge */}
                    {type === 'completed' && (
                        <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                    )}

                    {/* Category Badge for Explore */}
                    {type === 'explore' && (
                        <div className="absolute top-3 left-3">
                            <Badge className="bg-purple-500/80 backdrop-blur-sm text-white border-none">
                                {course.category === 'CATEGORY_A' && (isArabic ? 'فئة أ' : 'Category A')}
                                {course.category === 'CATEGORY_B' && (isArabic ? 'فئة ب' : 'Category B')}
                                {course.category === 'CATEGORY_C' && (isArabic ? 'فئة ج' : 'Category C')}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {title}
                    </h3>
                    
                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-3">
                        {course.instructor.image ? (
                            <Image 
                                src={course.instructor.image} 
                                alt={instructorName}
                                width={24}
                                height={24}
                                className="rounded-full"
                            />
                        ) : (
                            <Users className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-400">{instructorName}</span>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.totalLessons} {isArabic ? 'دروس' : 'lessons'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{Math.floor(course.duration / 60)}h</span>
                        </div>
                        {course.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span>{course.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    {/* Last Accessed / Completed Date */}
                    {type === 'continue' && course.lastAccessedAt && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {isArabic ? 'آخر وصول:' : 'Last accessed:'} {new Date(course.lastAccessedAt).toLocaleDateString(locale)}
                        </p>
                    )}
                    {type === 'completed' && course.completedAt && (
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {isArabic ? 'اكتمل في:' : 'Completed on:'} {new Date(course.completedAt).toLocaleDateString(locale)}
                        </p>
                    )}

                    {/* CTA Button */}
                    <div className="mt-4 space-y-2">
                        {type !== 'completed' && (
                            <Button 
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white"
                                size="sm"
                            >
                                {type === 'continue' && (
                                    <>
                                        <PlayCircle className="w-4 h-4 mr-2" />
                                        {isArabic ? 'واصل التعلم' : 'Continue Learning'}
                                    </>
                                )}
                                {type === 'explore' && (
                                    <>
                                        {isArabic ? 'ابدأ الدورة' : 'Start Course'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>
                        )}

                        {/* Completed Course Actions */}
                        {type === 'completed' && (
                            <>
                                <Button 
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white"
                                    size="sm"
                                >
                                    <Award className="w-4 h-4 mr-2" />
                                    {isArabic ? 'مراجعة' : 'Review'}
                                </Button>
                                
                                {/* Certificate Download Button */}
                                <Button 
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white"
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onCertificateDownload?.(course.enrollmentId!)
                                    }}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    {isArabic ? 'تحميل الشهادة' : 'Download Certificate'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
