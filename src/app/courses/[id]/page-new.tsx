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

export default function CourseDetailPage() {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const [course, setCourse] = useState<Course | null>(null)
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [enrolling, setEnrolling] = useState(false)
    const [relatedCourses, setRelatedCourses] = useState<RelatedCourse[]>([])
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
        try {
            const response = await fetch(`/api/courses/${params.id}/related`)
            if (response.ok) {
                const data = await response.json()
                setRelatedCourses(data.courses)
            }
        } catch (error) {
            console.error('Error fetching related courses:', error)
        }
    }

    const fetchCourse = async () => {
        try {
            const response = await fetch(`/api/courses/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                setCourse(data.course)
            } else {
                throw new Error('Course not found')
            }
        } catch (error) {
            console.error('Error fetching course:', error)
            toast.error('خطأ في تحميل الكورس')
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
            router.push('/auth/signin')
            return
        }

        try {
            setEnrolling(true)
            const response = await fetch(`/api/courses/${params.id}/enroll`, {
                method: 'POST',
            })

            if (response.ok) {
                await checkEnrollment()
                toast.success('تم التسجيل في الكورس بنجاح!')
                router.refresh()
            } else {
                const errorData = await response.json()
                if (response.status === 402) {
                    setShowSubscriptionGate(true)
                } else {
                    throw new Error(errorData.error || 'فشل في التسجيل')
                }
            }
        } catch (error) {
            console.error('Enrollment failed:', error)
            toast.error('فشل في التسجيل في الكورس')
        } finally {
            setEnrolling(false)
        }
    }

    const handleStartLearning = () => {
        if (course?.lessons && course.lessons.length > 0) {
            const firstLesson = course.lessons[0]
            router.push(`/courses/${course.id}/learn-new?lesson=${firstLesson.id}`)
        } else {
            toast.error('المحتوى غير متوفر حالياً')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">جاري التحميل...</div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">الكورس غير موجود</div>
            </div>
        )
    }

    // Enhanced course data for comprehensive component
    const enhancedCourse = {
        ...course,
        isEnrolled: !!enrollment,
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
            },
            {
                id: '3',
                userName: 'محمد علي',
                rating: 5,
                comment: 'شرح واضح ومفصل، أنصح به بشدة'
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
            <CourseOverviewContent
                course={enhancedCourse}
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
                    lang="ar"
                />
            )}
        </>
    )
}
