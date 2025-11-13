'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Play,
    Pause,
    Plus,
    ThumbsUp,
    Volume2,
    VolumeX,
    Maximize,
    ChevronDown,
    ChevronUp,
    Star,
    Clock,
    Calendar,
    Film,
    Tv,
    Mic,
    CheckCircle,
    Info,
    Share2,
    Download,
    MoreVertical,
    ArrowLeft,
    SkipForward,
    SkipBack,
    Check,
    Users,
    Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslationsSafe, useLocaleSafe } from '@/hooks/useTranslationsSafe'
import Image from 'next/image'

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
    rating: number
    totalEnrollments: number
    creator: {
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
    const t = useTranslationsSafe()
    
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [showMoreInfo, setShowMoreInfo] = useState(false)
    const [selectedSeason, setSelectedSeason] = useState(1)
    const [isInMyList, setIsInMyList] = useState(false)
    const [isLiked, setIsLiked] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await fetch(`/api/courses/${params.id}`)
                if (response.ok) {
                    const data = await response.json()
                    setCourse(data)
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
    }, [params.id])

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
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
            case 'MOVIE': return <Film className="w-5 h-5" />
            case 'SERIES': return <Tv className="w-5 h-5" />
            case 'PODCAST': return <Mic className="w-5 h-5" />
            default: return <Film className="w-5 h-5" />
        }
    }

    const getContentTypeLabel = () => {
        const type = course?.contentType || 'SERIES'
        return t(`contentTypeLabels.${type}`) || type
    }

    const getMetadataLabel = () => {
        if (!course) return ''
        
        switch (course.contentType) {
            case 'MOVIE':
                return course.runtime ? `${course.runtime} ${t('minutes')}` : ''
            case 'SERIES':
                return course.totalSeasons 
                    ? `${course.totalSeasons} ${t('seasons')} • ${course.totalEpisodes || 0} ${t('episodes')}`
                    : ''
            case 'PODCAST':
                return course.frequency || t('podcast')
            default:
                return ''
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-2xl">Loading...</div>
            </div>
        )
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-2xl">Course not found</div>
            </div>
        )
    }

    const contentType = course.contentType || 'SERIES'

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section with Video Player */}
            <div className="relative h-screen">
                {/* Background Image/Video */}
                <div className="absolute inset-0">
                    {course.thumbnail && (
                        <Image
                            src={course.thumbnail}
                            alt={getLocalizedText(course.title, course.titleAr, course.titleDe)}
                            fill
                            className="object-cover"
                            priority
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-8 left-8 z-50 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                {/* Content */}
                <div className="relative z-10 h-full flex items-center px-16 max-w-7xl">
                    <div className="max-w-2xl space-y-6">
                        {/* Content Type Badge */}
                        <div className="flex items-center gap-3">
                            <Badge className={`
                                px-4 py-2 text-sm font-semibold flex items-center gap-2
                                ${contentType === 'MOVIE' ? 'bg-blue-600' : ''}
                                ${contentType === 'SERIES' ? 'bg-purple-600' : ''}
                                ${contentType === 'PODCAST' ? 'bg-green-600' : ''}
                            `}>
                                {getContentTypeIcon()}
                                {getContentTypeLabel()}
                            </Badge>
                            {course.releaseYear && (
                                <span className="text-gray-300 text-lg">{course.releaseYear}</span>
                            )}
                            {course.maturityRating && (
                                <Badge variant="outline" className="text-white border-gray-500">
                                    {course.maturityRating}
                                </Badge>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-5xl md:text-7xl font-black leading-tight">
                            {getLocalizedText(course.title, course.titleAr, course.titleDe)}
                        </h1>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-lg">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold">{course.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-gray-300">{getMetadataLabel()}</span>
                            {contentType === 'SERIES' && course.episodeDuration && (
                                <span className="text-gray-300">
                                    {course.episodeDuration} {t('minutes')}/{t('episode')}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-xl text-gray-300 line-clamp-3 leading-relaxed">
                            {getLocalizedText(course.description, course.descriptionAr, course.descriptionDe)}
                        </p>

                        {/* Genres */}
                        {course.genres && (
                            <div className="flex flex-wrap gap-2">
                                {JSON.parse(course.genres).map((genre: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-gray-300 border-gray-600">
                                        {genre}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 pt-4">
                            <Button
                                size="lg"
                                className="bg-white hover:bg-white/90 text-black text-lg px-8 py-6 rounded-md"
                                onClick={togglePlay}
                            >
                                <Play className="w-6 h-6 mr-2" fill="currentColor" />
                                {contentType === 'MOVIE' && t('watchNow')}
                                {contentType === 'SERIES' && t('playNow')}
                                {contentType === 'PODCAST' && t('listenNow')}
                            </Button>
                            
                            <Button
                                size="lg"
                                variant="ghost"
                                className="bg-gray-500/50 hover:bg-gray-500/70 text-white text-lg px-8 py-6 rounded-md backdrop-blur-sm"
                                onClick={() => setShowMoreInfo(!showMoreInfo)}
                            >
                                <Info className="w-6 h-6 mr-2" />
                                {t('moreInfo')}
                            </Button>

                            {/* Icon Buttons */}
                            <button
                                onClick={() => setIsInMyList(!isInMyList)}
                                className="w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors"
                            >
                                {isInMyList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={() => setIsLiked(!isLiked)}
                                className="w-12 h-12 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors"
                            >
                                <ThumbsUp className={`w-6 h-6 ${isLiked ? 'fill-white' : ''}`} />
                            </button>
                        </div>

                        {/* Creator Info */}
                        <div className="flex items-center gap-4 pt-4">
                            {course.creator.user.profileImage && (
                                <div className="w-12 h-12 rounded-full overflow-hidden">
                                    <Image
                                        src={course.creator.user.profileImage}
                                        alt={course.creator.user.name}
                                        width={48}
                                        height={48}
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <div>
                                <div className="text-sm text-gray-400">
                                    {contentType === 'PODCAST' ? t('hostedBy') : t('createdBy')}
                                </div>
                                <div className="text-lg font-semibold">
                                    {getLocalizedText(course.creator.user.name, course.creator.user.arabicName)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Episodes Section for SERIES */}
            {contentType === 'SERIES' && course.lessons && course.lessons.length > 0 && (
                <div className="px-16 py-12 max-w-7xl">
                    <h2 className="text-3xl font-bold mb-6">{t('episodesList')}</h2>
                    
                    {/* Season Selector */}
                    {getSeasons().length > 1 && (
                        <div className="mb-6">
                            <select
                                value={selectedSeason}
                                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                className="bg-gray-800 text-white px-6 py-3 rounded-md text-lg border border-gray-700 focus:outline-none focus:border-white"
                            >
                                {getSeasons().map(season => (
                                    <option key={season} value={season}>
                                        {t('season')} {season}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Episode List */}
                    <div className="space-y-4">
                        {getEpisodesBySeason(selectedSeason).map((episode, index) => (
                            <motion.div
                                key={episode.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-gray-900/50 hover:bg-gray-800/80 rounded-lg p-4 flex gap-4 cursor-pointer border border-gray-800 hover:border-gray-600 transition-all"
                            >
                                {/* Episode Number */}
                                <div className="flex-shrink-0 w-12 text-center text-2xl font-bold text-gray-400 group-hover:text-white">
                                    {episode.episodeNumber || index + 1}
                                </div>

                                {/* Episode Thumbnail */}
                                <div className="relative w-40 h-24 flex-shrink-0 bg-gray-800 rounded-md overflow-hidden">
                                    {course.thumbnail && (
                                        <Image
                                            src={course.thumbnail}
                                            alt={getLocalizedText(episode.title, episode.titleAr, episode.titleDe)}
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play className="w-6 h-6 ml-1" fill="white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Episode Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-semibold group-hover:text-white transition-colors">
                                            {getLocalizedText(episode.title, episode.titleAr, episode.titleDe)}
                                        </h3>
                                        <span className="text-gray-400 text-sm">{episode.duration} {t('minutes')}</span>
                                    </div>
                                    {episode.description && (
                                        <p className="text-gray-400 text-sm line-clamp-2 group-hover:text-gray-300">
                                            {getLocalizedText(episode.description || '', episode.descriptionAr, episode.descriptionDe)}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Podcast Episodes List */}
            {contentType === 'PODCAST' && course.lessons && course.lessons.length > 0 && (
                <div className="px-16 py-12 max-w-7xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold">{t('episodes')}</h2>
                        {course.frequency && (
                            <Badge className="bg-green-600 text-white px-4 py-2">
                                {course.frequency}
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-3">
                        {course.lessons
                            .sort((a, b) => b.order - a.order) // Latest first
                            .map((episode, index) => (
                                <motion.div
                                    key={episode.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="group bg-gray-900/50 hover:bg-gray-800/80 rounded-lg p-4 flex gap-4 items-center cursor-pointer border border-gray-800 hover:border-green-600 transition-all"
                                >
                                    {/* Play Button */}
                                    <button className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <Play className="w-5 h-5 ml-0.5" fill="white" />
                                    </button>

                                    {/* Episode Info */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold mb-1">
                                            {getLocalizedText(episode.title, episode.titleAr, episode.titleDe)}
                                        </h3>
                                        {episode.description && (
                                            <p className="text-gray-400 text-sm line-clamp-1">
                                                {getLocalizedText(episode.description || '', episode.descriptionAr, episode.descriptionDe)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Duration */}
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <span className="text-sm">{episode.duration} {t('minutes')}</span>
                                        <button className="hover:text-white">
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button className="hover:text-white">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </div>
            )}

            {/* More Info Section */}
            <AnimatePresence>
                {showMoreInfo && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-16 py-12 max-w-7xl border-t border-gray-800"
                    >
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold mb-4">{t('about')}</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {getLocalizedText(course.description, course.descriptionAr, course.descriptionDe)}
                                    </p>
                                </div>

                                {course.cast && (
                                    <div>
                                        <h3 className="text-xl font-bold mb-3">{t('cast')}</h3>
                                        <p className="text-gray-300">
                                            {JSON.parse(course.cast).join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-400">{t('totalEnrollments')}:</span>
                                    <span className="font-semibold">{course.totalEnrollments.toLocaleString()}</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 text-yellow-400" />
                                    <span className="text-gray-400">{t('rating')}:</span>
                                    <span className="font-semibold">{course.rating.toFixed(1)}/5.0</span>
                                </div>

                                {contentType === 'SERIES' && (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <Tv className="w-5 h-5 text-purple-400" />
                                            <span className="text-gray-400">{t('totalSeasons')}:</span>
                                            <span className="font-semibold">{course.totalSeasons}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Award className="w-5 h-5 text-purple-400" />
                                            <span className="text-gray-400">{t('totalEpisodes')}:</span>
                                            <span className="font-semibold">{course.totalEpisodes}</span>
                                        </div>
                                    </>
                                )}

                                {contentType === 'MOVIE' && course.runtime && (
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-blue-400" />
                                        <span className="text-gray-400">{t('runtime')}:</span>
                                        <span className="font-semibold">{course.runtime} {t('minutes')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
