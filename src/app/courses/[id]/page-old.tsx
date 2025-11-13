'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import CourseOverviewContent from '@/components/course/CourseOverviewContent'
import CourseSubscriptionGate from '@/components/course/CourseSubscriptionGate'

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
    currency: string
    status: string
    createdAt: string
    creator: {
        user: {
            id: string
            name: string
            arabicName?: string
            email: string
            profileImage?: string
        }
    }
    lessons?: {
        id: string
        title: string
        titleAr: string
        order: number
        duration: number
    }[]
}

interface Enrollment {
    id: string
    userId: string
    courseId: string
    enrolledAt: string
    progress: number
    completedAt?: string
}

interface UserProfile {
    subscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
}

interface RelatedCourse {
    id: string
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    thumbnail?: string
    category: string
    skillLevel: string
    duration: number
    totalEnrollments: number
    rating: number
    creator: string
    creatorArabic?: string
    lessonsCount: number
    totalDuration: number
}

const CATEGORIES = [
    { id: 'CATEGORY_A', name: 'Category A (150-250 EGP)', nameAr: 'الفئة أ (150-250 جنيه)' },
    { id: 'CATEGORY_B', name: 'Category B (300-500 EGP)', nameAr: 'الفئة ب (300-500 جنيه)' },
    { id: 'CATEGORY_C', name: 'Creator Channels (80-500 EGP)', nameAr: 'قنوات المنشئين (80-500 جنيه)' },
]

const SKILL_LEVELS = [
    { id: 'Beginner', name: 'Beginner', nameAr: 'مبتدئ' },
    { id: 'Intermediate', name: 'Intermediate', nameAr: 'متوسط' },
    { id: 'Advanced', name: 'Advanced', nameAr: 'متقدم' },
]

export default function CourseDetailPage() {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const [course, setCourse] = useState<Course | null>(null)
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [enrolling, setEnrolling] = useState(false)
    const [lang, setLang] = useState<'en' | 'ar'>('ar')
    const [showVideoModal, setShowVideoModal] = useState(false)
    const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([])
    const [relatedLoading, setRelatedLoading] = useState(false)
    const [showSubscriptionGate, setShowSubscriptionGate] = useState(false)

    useEffect(() => {
        if (params.id) {
            fetchCourse()
            fetchRelatedCourses()
            if (session) {
                checkEnrollment()
                fetchUserProfile()
            }
        }
    }, [params.id, session])

    useEffect(() => {
        if (params.id && course) {
            fetchRelatedCourses()
        }
    }, [params.id, course])

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/user/profile')
            if (response.ok) {
                const data = await response.json()
                setUserProfile(data.user)
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
        }
    }

    const fetchRelatedCourses = async () => {
        setRelatedLoading(true)
        try {
            const response = await fetch(`/api/courses/${params.id}/related`)
            if (response.ok) {
                const data = await response.json()
                setRelatedCourses(data.courses)
            }
        } catch (error) {
            console.error('Error fetching related courses:', error)
        } finally {
            setRelatedLoading(false)
        }
    }

    const fetchCourse = async () => {
        try {
            const response = await fetch(`/api/courses/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setCourse(data.course)
            } else {
                toast.error('Failed to fetch course')
            }
        } catch (error) {
            toast.error('Failed to fetch course')
        } finally {
            setLoading(false)
        }
    }

    const checkEnrollment = async () => {
        try {
            const response = await fetch(`/api/courses/${params.id}/enrollment`)
            if (response.ok) {
                const data = await response.json()
                setEnrollment(data.enrollment)
            }
        } catch (error) {
            console.error('Error checking enrollment:', error)
        }
    }

    const handleEnroll = async () => {
        if (!session) {
            router.push('/auth/login')
            return
        }

        setEnrolling(true)
        try {
            const response = await fetch(`/api/courses/${params.id}/enroll`, {
                method: 'POST',
            })

            if (response.ok) {
                const data = await response.json()
                setEnrollment(data.enrollment)

                // Show success toast with Egyptian localization
                const successMessage = lang === 'ar'
                    ? '🎉 تم التسجيل في الدورة بنجاح! يمكنك البدء في التعلم الآن.'
                    : '🎉 Successfully enrolled in the course! You can start learning now.'

                toast.success(successMessage, {
                    duration: 4000,
                    position: 'top-center',
                })

                // Update course enrollment count
                if (course) {
                    setCourse({
                        ...course,
                        totalEnrollments: course.totalEnrollments + 1,
                    })
                }

                // Auto-redirect to learning after a short delay
                setTimeout(() => {
                    handleStartLearning()
                }, 2000)

            } else {
                const error = await response.json()
                const errorMessage = lang === 'ar'
                    ? error.error || 'فشل التسجيل في الدورة'
                    : error.error || 'Failed to enroll in course'

                toast.error(errorMessage, {
                    duration: 4000,
                    position: 'top-center',
                })
            }
        } catch (error) {
            const errorMessage = lang === 'ar'
                ? 'حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'
                : 'An error occurred during enrollment. Please try again.'

            toast.error(errorMessage, {
                duration: 4000,
                position: 'top-center',
            })
        } finally {
            setEnrolling(false)
        }
    }

    const handleStartLearning = () => {
        // If this is the demo course, redirect to demo learning page
        if (params.id === 'cmffkdg7c0001bwuj1dxofcka') {
            router.push(`/courses/${params.id}/learn-udemy?demo=true`)
        } else {
            router.push(`/courses/${params.id}/learn`)
        }
    }

    const t = {
        en: {
            title: 'Course Details',
            enroll: 'Start Learning',
            startLearning: 'Start Learning',
            continueLearning: 'Continue Learning',
            enrolled: 'Enrolled',
            duration: 'Duration',
            students: 'Students',
            rating: 'Rating',
            skillLevel: 'Skill Level',
            category: 'Category',
            instructor: 'Instructor',
            chapters: 'Chapters',
            description: 'Description',
            about: 'About This Course',
            whatYouLearn: 'What You Will Learn',
            requirements: 'Requirements',
            whoThisFor: 'Who This Course Is For',
            loading: 'Loading...',
            error: 'Course not found',
            signIn: 'Sign in to start',
        },
        ar: {
            title: 'تفاصيل الدورة',
            enroll: 'ابدأ التعلم',
            startLearning: 'ابدأ التعلم',
            continueLearning: 'استمر في التعلم',
            enrolled: 'مسجل',
            duration: 'المدة',
            students: 'الطلاب',
            rating: 'التقييم',
            skillLevel: 'المستوى',
            category: 'الفئة',
            instructor: 'المدرس',
            chapters: 'الفصول',
            description: 'الوصف',
            about: 'حول هذه الدورة',
            whatYouLearn: 'ما ستتعلمه',
            requirements: 'المتطلبات',
            whoThisFor: 'لهذه الدورة',
            loading: 'جاري التحميل...',
            error: 'الدورة غير موجودة',
            signIn: 'سجل الدخول للبدء',
        },
    }

    const currentT = t[lang]

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">{currentT.loading}</div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">{currentT.error}</div>
            </div>
        )
    }

    const isEnrolled = !!enrollment
    const categoryInfo = CATEGORIES.find(c => c.id === course.category)
    const skillLevelInfo = SKILL_LEVELS.find(s => s.id === course.skillLevel)

    const getCTAButton = () => {
        if (!session) {
            return (
                <Button
                    onClick={() => router.push('/auth/login')}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-semibold"
                    size="lg"
                >
                    <User className="w-5 h-5 mr-2" />
                    {currentT.signIn}
                </Button>
            )
        }

        if (isEnrolled) {
            return (
                <Button
                    onClick={handleStartLearning}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-semibold"
                    size="lg"
                >
                    <Play className="w-5 h-5 mr-2" />
                    {enrollment?.progress && enrollment.progress > 0 ? currentT.continueLearning : 'Go to Course'}
                </Button>
            )
        }

        if (userProfile?.subscriptionStatus === 'ACTIVE') {
            return (
                <Button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-semibold disabled:opacity-50"
                    size="lg"
                >
                    {enrolling ? (
                        <>
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                            {lang === 'ar' ? 'جاري التسجيل...' : 'Enrolling...'}
                        </>
                    ) : (
                        <>
                            <BookOpen className="w-5 h-5 mr-2" />
                            {currentT.enroll}
                        </>
                    )}
                </Button>
            )
        }

        return (
            <Button
                onClick={() => setShowSubscriptionGate(true)}
                className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-semibold"
                size="lg"
            >
                <Star className="w-5 h-5 mr-2" />
                {lang === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
            </Button>
        )
    }

    // Enhanced course data for comprehensive component
    const enhancedCourse = {
        ...course,
        isEnrolled,
        progress: enrollment?.progress || 0,
        completedLessons: course.lessons?.filter(l => 
            // Mock completion status based on progress
            enrollment?.progress && enrollment.progress > 0 
        ).length || 0,
        totalLessons: course.lessons?.length || 0,
        instructor: {
            name: course.creator.user.arabicName || course.creator.user.name,
            avatar: course.creator.user.profileImage,
            bio: "مدرب معتمد مع خبرة واسعة في المجال" // Mock bio
        },
        reviews: [
            {
                id: '1',
                userName: 'أحمد محمد',
                rating: 5,
                comment: 'كورس ممتاز ومفيد جداً'
            },
            {
                id: '2', 
                userName: 'فاطمة أحمد',
                rating: 4,
                comment: 'محتوى رائع وشرح واضح'
            }
        ],
        relatedCourses: relatedCourses.map(rc => ({
            ...rc,
            creator: {
                user: {
                    name: rc.creator,
                    arabicName: rc.creatorArabic
                }
            }
        }))
    };

    return (
        <>
            <CourseOverviewContent course={enhancedCourse} />
            {/* Main Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Video Player Section */}
                    <div className="lg:col-span-2">
                        {/* Video Player */}
                        <div className="bg-black rounded-lg overflow-hidden mb-6">
                            <div className="relative aspect-video bg-gray-900">
                                {course.demoVideoUrl ? (
                                    <video
                                        controls
                                        className="w-full h-full object-cover"
                                        poster={course.thumbnail}
                                        preload="metadata"
                                    >
                                        <source src={course.demoVideoUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : course.thumbnail ? (
                                    <div
                                        className="relative aspect-video bg-gray-900 flex items-center justify-center group cursor-pointer"
                                        onClick={() => setShowVideoModal(true)}
                                    >
                                        <img
                                            src={course.thumbnail}
                                            alt={lang === 'ar' ? course.titleAr : course.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center group-hover:bg-opacity-10 transition-opacity">
                                            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors">
                                                <Play className="w-8 h-8 text-white ml-1" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
                                            {lang === 'ar' ? 'عرض توضيحي قريباً' : 'Demo Coming Soon'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 w-full h-full flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <Play className="w-16 h-16 mx-auto mb-4" />
                                            <p className="text-lg font-semibold mb-2">
                                                {lang === 'ar' ? 'عرض توضيحي' : 'Course Preview'}
                                            </p>
                                            <p className="text-sm opacity-80">
                                                {lang === 'ar' ? 'قريباً' : 'Coming Soon'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Course Title */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
                                {lang === 'ar' ? course.titleAr : course.title}
                            </h1>
                            <p className="text-[var(--muted-foreground)] text-lg leading-relaxed">
                                {lang === 'ar' ? course.descriptionAr : course.description}
                            </p>
                        </div>

                        {/* Instructor Section */}
                        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6">
                            <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
                                {lang === 'ar' ? 'تعرف على الكورس' : 'About the Course'}
                            </h2>
                            <div className="flex items-start space-x-4 mb-6">
                                {course.creator.user.profileImage ? (
                                    <img
                                        src={course.creator.user.profileImage}
                                        alt={course.creator.user.arabicName || course.creator.user.name}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {(course.creator.user.arabicName || course.creator.user.name).charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                                        {course.creator.user.arabicName || course.creator.user.name}
                                    </h3>
                                    <p className="text-[var(--muted-foreground)] text-sm mb-2">
                                        {lang === 'ar' ? 'مدرس اللغة الإنجليزية' : 'English Instructor'}
                                    </p>
                                    <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
                                        {lang === 'ar'
                                            ? `متخصص عبد الصبور مدرس لغة إنجليزية خبرة أكثر من 7 سنوات درس لجميع الأعمار وجميع المستويات ومؤسس DR.ENGLISH لتعليم اللغة الإنجليزية.`
                                            : `Specialized English instructor with over 7 years of experience teaching all ages and levels. Founder of DR.ENGLISH for English language learning.`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Course Info Card */}
                        <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-6 sticky top-6">
                            <h2 className="text-xl font-bold mb-6 text-[var(--foreground)]">
                                {lang === 'ar' ? course.titleAr : course.title}
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--muted-foreground)] flex items-center">
                                        <BookOpen className="w-4 h-4 mr-2" />
                                        {lang === 'ar' ? 'عدد الدروس:' : 'Lessons:'}
                                    </span>
                                    <span className="font-medium text-[var(--foreground)]">{course.lessons?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--muted-foreground)] flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {lang === 'ar' ? 'مدة الكورس:' : 'Duration:'}
                                    </span>
                                    <span className="font-medium text-[var(--foreground)]">
                                        {Math.floor(course.duration / 3600)} {lang === 'ar' ? 'ساعات' : 'hours'} {Math.floor((course.duration % 3600) / 60)} {lang === 'ar' ? 'دقيقة' : 'minutes'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--muted-foreground)] flex items-center">
                                        <User className="w-4 h-4 mr-2" />
                                        {lang === 'ar' ? 'المدرب:' : 'Instructor:'}
                                    </span>
                                    <span className="font-medium text-blue-600">{course.creator.user.arabicName || course.creator.user.name}</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="mb-4">
                                {getCTAButton()}
                            </div>

                            <p className="text-xs text-[var(--muted-foreground)] text-center">
                                {lang === 'ar'
                                    ? 'جميع الدورات متاحة مع اشتراك واحد'
                                    : 'All courses available with one subscription'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Watch Also Section */}
            <div className="bg-[var(--card)] border-t border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h2 className="text-2xl font-bold mb-8 text-[var(--foreground)] text-center">
                        {lang === 'ar' ? 'شاهد أيضًا' : 'Watch Also'}
                    </h2>

                    {relatedLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="animate-pulse">
                                    <div className="aspect-video bg-[var(--muted)] rounded-lg mb-4"></div>
                                    <div className="h-4 bg-[var(--muted)] rounded mb-2"></div>
                                    <div className="h-3 bg-[var(--muted)] rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    ) : relatedCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedCourses.slice(0, 3).map((relatedCourse) => (
                                <div
                                    key={relatedCourse.id}
                                    className="group cursor-pointer transition-transform hover:scale-105"
                                    onClick={() => router.push(`/courses/${relatedCourse.id}`)}
                                >
                                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg mb-4 overflow-hidden">
                                        {relatedCourse.thumbnail ? (
                                            <img
                                                src={relatedCourse.thumbnail}
                                                alt={lang === 'ar' ? relatedCourse.titleAr : relatedCourse.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    target.parentElement!.classList.add('bg-gradient-to-br', 'from-green-500', 'to-blue-600');
                                                    target.parentElement!.innerHTML = `
                                                        <div class="w-full h-full flex items-center justify-center text-white">
                                                            <div class="text-center">
                                                                <div class="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                                                    </svg>
                                                                </div>
                                                                <p class="text-sm font-medium">${relatedCourse.skillLevel}</p>
                                                            </div>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                                                <div className="text-center text-white">
                                                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <BookOpen className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-medium">
                                                        {relatedCourse.skillLevel}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Course Category Badge */}
                                        <div className="absolute top-3 left-3">
                                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                {lang === 'ar' ? 'دورة تعليمية' : 'Course'}
                                            </div>
                                        </div>

                                        {/* Instructor Badge */}
                                        {(relatedCourse.creator || relatedCourse.creatorArabic) && (
                                            <div className="absolute bottom-3 left-3">
                                                <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                    {lang === 'ar' ? relatedCourse.creatorArabic || relatedCourse.creator : relatedCourse.creator}
                                                </div>
                                            </div>
                                        )}

                                        {/* Play Button Overlay */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 bg-white bg-opacity-0 group-hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all">
                                                <Play className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="font-semibold text-[var(--foreground)] mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {lang === 'ar' ? relatedCourse.titleAr : relatedCourse.title}
                                    </h3>
                                    <p className="text-[var(--muted-foreground)] text-sm">
                                        {lang === 'ar' ? relatedCourse.creatorArabic || relatedCourse.creator : relatedCourse.creator}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
                            <p className="text-[var(--muted-foreground)] text-lg">
                                {lang === 'ar' ? 'لا توجد دورات ذات صلة متاحة حاليا' : 'No related courses available'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructor Video Modal */}
            <InstructorVideoModal
                isOpen={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                course={{
                    id: course.id,
                    title: course.title,
                    titleAr: course.titleAr,
                    instructor: course.creator.user.name,
                    instructorArabicName: course.creator.user.arabicName,
                    thumbnail: course.thumbnail
                }}
                userSubscriptionStatus={userProfile?.subscriptionStatus}
                lang={lang}
            />

            {/* Course Subscription Gate */}
            {showSubscriptionGate && (
                <CourseSubscriptionGate
                    course={{
                        id: course.id,
                        title: course.title,
                        titleAr: course.titleAr,
                        description: course.description,
                        thumbnail: course.thumbnail,
                        duration: course.duration,
                        rating: course.rating,
                        totalEnrollments: course.totalEnrollments,
                        creator: course.creator
                    }}
                    onClose={() => setShowSubscriptionGate(false)}
                    lang={lang}
                />
            )}
        </div>
    )
}
