'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Play,
    Users,
    Clock,
    Star,
    BookOpen,
    Award,
    Download,
    Share2,
    Heart,
    ChevronDown,
    CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContentRow } from '@/components/landing/ContentRow'

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
    lessons?: {
        id: string
        title: string
        titleAr: string
        order: number
        duration: number
    }[]
}

export default function BeautifulCoursePage() {
    const { data: session } = useSession()
    const params = useParams()
    const router = useRouter()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)
    const [showFullDescription, setShowFullDescription] = useState(false)

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

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">الكورس غير موجود</div>
            </div>
        )
    }

    // Sample related courses for demo
    const relatedCoursesData = [
        {
            id: "related-1",
            title: "مبادئ إدارة مواقع التواصل الاجتماعي",
            type: "course" as const,
            thumbnail: "/images/courses/design-course.jpg",
            duration: "5:30",
            instructor: "مريم هشام",
            instructorImage: "/images/instructors/instructor2.jpg"
        },
        {
            id: "related-2",
            title: "أساسيات التسويق للمبتدئين",
            type: "course" as const,
            thumbnail: "/images/courses/mobile-course.jpg",
            duration: "4:45",
            instructor: "إسلام الصادق",
            instructorImage: "/images/instructors/instructor1.jpg"
        },
        {
            id: "related-3",
            title: "Marketeer A to Z",
            type: "course" as const,
            thumbnail: "/images/courses/nodejs-course.jpg",
            duration: "6:20",
            instructor: "إسلام الصادق",
            instructorImage: "/images/instructors/instructor1.jpg"
        }
    ]

    return (
        <div className="min-h-screen bg-black">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 py-3 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <span className="text-white text-sm">
                        حتى يوم 20 ستمتع بخصم 70% على اشتراك السنوي بكود 60
                    </span>
                    <Button className="mr-4 bg-red-500 hover:bg-red-600 text-white px-4 py-1 text-sm rounded-full">
                        احصل على الخصم
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Video Player Section - Left Side */}
                    <div className="lg:col-span-2">
                        {/* Video Player */}
                        <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-6">
                            <div className="aspect-video relative">
                                {course.thumbnail ? (
                                    <img
                                        src={course.thumbnail}
                                        alt={course.titleAr || course.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                        <span className="text-white text-2xl font-bold">
                                            {course.titleAr?.charAt(0) || course.title.charAt(0)}
                                        </span>
                                    </div>
                                )}

                                {/* Play Button Overlay */}
                                {!isVideoPlaying && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                                        onClick={() => setIsVideoPlaying(true)}>
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className="bg-white rounded-full p-4 shadow-2xl"
                                        >
                                            <Play className="w-8 h-8 text-black fill-current" />
                                        </motion.div>
                                    </div>
                                )}

                                {/* Video Controls */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <Button variant="ghost" size="sm">
                                                <Play className="w-4 h-4 mr-2" />
                                            </Button>
                                            <span className="text-sm">1x</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <Share2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Course Description */}
                        <div className="bg-gray-900 rounded-xl p-6">
                            <h3 className="text-white text-xl font-bold mb-4">تعرف على الكورس</h3>
                            <div className="text-gray-300 leading-relaxed">
                                <p className={`${showFullDescription ? '' : 'line-clamp-3'} mb-4`}>
                                    {course.descriptionAr || course.description}
                                </p>
                                <Button
                                    variant="ghost"
                                    className="text-purple-400 hover:text-purple-300 p-0"
                                    onClick={() => setShowFullDescription(!showFullDescription)}
                                >
                                    {showFullDescription ? 'عرض أقل' : 'عرض المزيد'}
                                    <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFullDescription ? 'rotate-180' : ''}`} />
                                </Button>
                            </div>

                            {/* Instructor Info */}
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full overflow-hidden">
                                        {course.creator.user.profileImage ? (
                                            <img
                                                src={course.creator.user.profileImage}
                                                alt={course.creator.user.arabicName || course.creator.user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-purple-600 flex items-center justify-center">
                                                <span className="text-white text-xl font-bold">
                                                    {(course.creator.user.arabicName || course.creator.user.name).charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-semibold text-lg">
                                            {course.creator.user.arabicName || course.creator.user.name}
                                        </h4>
                                        <p className="text-gray-400 text-sm">مدرب الدورة</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                                <Users className="w-4 h-4 mr-2" />
                                                LinkedIn
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                                <Share2 className="w-4 h-4 mr-2" />
                                                Instagram
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Info Sidebar - Right Side */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 rounded-xl p-6 sticky top-6">
                            {/* Course Title */}
                            <h1 className="text-white text-2xl font-bold mb-4 leading-tight">
                                {course.titleAr || course.title}
                            </h1>

                            {/* Course Stats */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 text-gray-300">
                                    <BookOpen className="w-5 h-5 text-purple-400" />
                                    <span className="text-sm">عدد الدروس: {course.lessons?.length || 17} درس</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Clock className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm">مدة الكورس: {formatDuration(course.duration)} ساعات و 19 دقيقة</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Users className="w-5 h-5 text-green-400" />
                                    <span className="text-sm">المدرب: {course.creator.user.arabicName || course.creator.user.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-300">
                                    <Star className="w-5 h-5 text-yellow-400" />
                                    <span className="text-sm">التقييم: {course.rating} نجوم</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <Button
                                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 rounded-xl"
                                    size="lg"
                                >
                                    اشترك الآن
                                </Button>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl"
                                    >
                                        <Heart className="w-4 h-4 mr-2" />
                                        إضافة للمفضلة
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 rounded-xl"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        مشاركة
                                    </Button>
                                </div>
                            </div>

                            {/* Course Features */}
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <h4 className="text-white font-semibold mb-4">ما ستحصل عليه:</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-sm">وصول مدى الحياة للكورس</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-sm">شهادة إتمام معتمدة</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-sm">دعم فني مباشر</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <span className="text-sm">مشاريع تطبيقية</span>
                                    </div>
                                </div>
                            </div>

                            {/* Skills You'll Learn */}
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <h4 className="text-white font-semibold mb-4">المهارات التي ستتعلمها:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Facebook Ads', 'Google Analytics', 'Content Strategy', 'SEO', 'Social Media'].map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full border border-gray-600"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Courses Section */}
                <div className="mt-16">
                    <ContentRow
                        title="شاهد أيضاً"
                        items={relatedCoursesData}
                        seeAllLink="/courses"
                    />
                </div>
            </div>
        </div>
    )
}