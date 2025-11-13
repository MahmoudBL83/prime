'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, Star, Film, Tv, Mic, Plus, Check, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe'
import Image from 'next/image'

interface Course {
    id: string
    title: string
    titleAr?: string
    description: string
    thumbnail?: string
    creatorId: string
    category: string
    skillLevel: string
    duration: number
    totalViews: number
    totalEnrollments: number
    rating: number
    
    // Netflix-style fields
    contentType: 'MOVIE' | 'SERIES' | 'PODCAST'
    runtime?: number // for movies (in minutes)
    totalSeasons?: number
    totalEpisodes?: number
    episodeDuration?: number // average episode length
    frequency?: string // for podcasts
    hostName?: string // podcast host
    releaseYear?: number
    maturityRating?: string
    genres?: string // JSON string
    cast?: string // JSON string
    trailer?: string
    
    creator: {
        user: {
            name: string
            arabicName?: string
        }
    }
    isEnrolled?: boolean
    userProgress?: number
}

export default function NetflixCoursesPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const { t } = useTranslationsSafe('courses')
    const locale = (params?.locale as string) || 'en'
    const isRTL = locale === 'ar'
    
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedType, setSelectedType] = useState<'ALL' | 'MOVIE' | 'SERIES' | 'PODCAST'>('ALL')
    const [hoveredCourse, setHoveredCourse] = useState<string | null>(null)
    const [myList, setMyList] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchCourses()
    }, [selectedType])

    const fetchCourses = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                status: 'PUBLISHED',
                limit: '50',
            })
            
            if (selectedType !== 'ALL') {
                params.append('contentType', selectedType)
            }
            
            const response = await fetch(`/api/courses?${params}`)
            if (response.ok) {
                const data = await response.json()
                setCourses(data.courses || [])
            }
        } catch (error) {
            console.error('Error fetching courses:', error)
        } finally {
            setLoading(false)
        }
    }

    const getContentTypeIcon = (type: string) => {
        switch (type) {
            case 'MOVIE': return <Film className="w-4 h-4" />
            case 'SERIES': return <Tv className="w-4 h-4" />
            case 'PODCAST': return <Mic className="w-4 h-4" />
            default: return null
        }
    }

    const getContentTypeLabel = (course: Course) => {
        if (course.contentType === 'MOVIE') {
            return course.runtime ? `${course.runtime}min` : t('contentTypes.movie')
        }
        if (course.contentType === 'SERIES') {
            return course.totalEpisodes 
                ? `${course.totalSeasons} ${t('seasons')} • ${course.totalEpisodes} ${t('episodes')}`
                : t('contentTypes.series')
        }
        if (course.contentType === 'PODCAST') {
            return course.frequency || t('contentTypes.podcast')
        }
        return ''
    }

    const toggleMyList = (courseId: string) => {
        setMyList(prev => {
            const newSet = new Set(prev)
            if (newSet.has(courseId)) {
                newSet.delete(courseId)
            } else {
                newSet.add(courseId)
            }
            return newSet
        })
    }

    const handlePlay = (courseId: string) => {
        router.push(`/${locale}/courses/${courseId}`)
    }

    return (
        <div className="min-h-screen bg-black">
            {/* Netflix-Style Hero Section */}
            {courses[0] && (
                <div className="relative h-screen mb-16">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src={courses[0].thumbnail || '/images/courses/default.jpg'}
                            alt={courses[0].title}
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Triple gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
                    </div>

                    {/* Hero Content */}
                    <div className="relative h-full flex items-end pb-32 px-4 md:px-12 lg:px-16">
                        <div className="max-w-2xl">
                            {/* Content Type Badge */}
                            <motion.div
                                className="flex items-center gap-3 mb-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded">
                                    {getContentTypeIcon(courses[0].contentType)}
                                    <span className="text-white text-xs font-bold uppercase">
                                        {t(`contentTypeLabels.${courses[0].contentType}`)}
                                    </span>
                                </div>
                                {courses[0].rating && (
                                    <div className="flex items-center gap-1 bg-yellow-500/90 px-2 py-1 rounded">
                                        <Star className="w-3 h-3 fill-current text-yellow-900" />
                                        <span className="text-yellow-900 text-xs font-bold">{courses[0].rating.toFixed(1)}</span>
                                    </div>
                                )}
                                {courses[0].releaseYear && (
                                    <span className="text-gray-300 text-sm font-medium">{courses[0].releaseYear}</span>
                                )}
                                {courses[0].maturityRating && (
                                    <span className="border border-gray-400 text-gray-300 text-xs px-2 py-0.5 rounded">
                                        {courses[0].maturityRating}
                                    </span>
                                )}
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight drop-shadow-2xl"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                {isRTL && courses[0].titleAr ? courses[0].titleAr : courses[0].title}
                            </motion.h1>

                            {/* Metadata */}
                            <motion.p
                                className="text-lg text-gray-300 mb-6 leading-relaxed line-clamp-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                {courses[0].description}
                            </motion.p>

                            {/* Info Line */}
                            <motion.div
                                className="flex items-center gap-4 mb-8 text-sm text-gray-300"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <span>{getContentTypeLabel(courses[0])}</span>
                                <span>•</span>
                                <span>{courses[0].creator.user.name}</span>
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                className="flex items-center gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                            >
                                <Button
                                    onClick={() => handlePlay(courses[0].id)}
                                    className="bg-white hover:bg-gray-200 text-black px-8 py-6 rounded text-lg font-bold flex items-center gap-3 shadow-xl border-0"
                                >
                                    <Play className="w-6 h-6 fill-current" />
                                    {t('playNow')}
                                </Button>
                                <Button
                                    onClick={() => handlePlay(courses[0].id)}
                                    variant="outline"
                                    className="bg-gray-600/70 hover:bg-gray-600 text-white border-0 px-8 py-6 rounded text-lg font-bold flex items-center gap-3 backdrop-blur-sm"
                                >
                                    <Info className="w-6 h-6" />
                                    {t('moreInfo')}
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Type Tabs */}
            <div className="px-4 md:px-12 lg:px-16 mb-8">
                <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
                    {(['ALL', 'MOVIE', 'SERIES', 'PODCAST'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300 whitespace-nowrap ${
                                selectedType === type
                                    ? 'bg-white text-black'
                                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                            }`}
                        >
                            {t(`contentTypes.${type.toLowerCase()}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Netflix-Style Grid */}
            <div className="px-4 md:px-12 lg:px-16 pb-16">
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {courses.map((course, index) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                whileHover={{ scale: 1.05, zIndex: 10 }}
                                onHoverStart={() => setHoveredCourse(course.id)}
                                onHoverEnd={() => setHoveredCourse(null)}
                                className="group relative cursor-pointer"
                                onClick={() => handlePlay(course.id)}
                            >
                                {/* Poster */}
                                <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                                    <Image
                                        src={course.thumbnail || '/images/courses/default.jpg'}
                                        alt={course.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                                    
                                    {/* Content Type Badge */}
                                    <div className="absolute top-3 left-3 z-10">
                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded shadow-lg ${
                                            course.contentType === 'MOVIE' ? 'bg-blue-600' :
                                            course.contentType === 'SERIES' ? 'bg-purple-600' :
                                            'bg-green-600'
                                        }`}>
                                            {getContentTypeIcon(course.contentType)}
                                            <span className="text-white text-xs font-bold">
                                                {t(`contentTypeLabels.${course.contentType}`)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rating Badge */}
                                    {course.rating > 0 && (
                                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-yellow-500/90 px-2 py-1 rounded shadow-lg">
                                            <Star className="w-3 h-3 fill-current text-yellow-900" />
                                            <span className="text-yellow-900 text-xs font-bold">{course.rating.toFixed(1)}</span>
                                        </div>
                                    )}

                                    {/* Play Button (on hover) */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                                        <div className="w-16 h-16 bg-white/25 backdrop-blur-md rounded-full flex items-center justify-center border-3 border-white/50 shadow-2xl">
                                            <Play className="w-8 h-8 text-white ml-1" fill="white" />
                                        </div>
                                    </div>

                                    {/* Bottom Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                        <h3 className="text-white font-bold text-sm mb-1 line-clamp-2 drop-shadow-lg">
                                            {isRTL && course.titleAr ? course.titleAr : course.title}
                                        </h3>
                                        <p className="text-gray-300 text-xs mb-2">
                                            {getContentTypeLabel(course)}
                                        </p>
                                        
                                        {/* Quick Actions (on hover) */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 mt-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleMyList(course.id)
                                                }}
                                                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all"
                                            >
                                                {myList.has(course.id) ? (
                                                    <Check className="w-4 h-4 text-white" />
                                                ) : (
                                                    <Plus className="w-4 h-4 text-white" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar (if enrolled) */}
                                    {course.isEnrolled && course.userProgress && course.userProgress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                            <div 
                                                className="h-full bg-red-600"
                                                style={{ width: `${course.userProgress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
