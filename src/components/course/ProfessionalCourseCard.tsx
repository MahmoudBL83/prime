'use client'

import { motion } from 'framer-motion'
import { Play, Clock, Users, BookOpen, Star, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTranslations, useLocale } from 'next-intl'

interface ProfessionalCourseCardProps {
    course: {
        id: string
        title: string
        titleAr: string
        description: string
        thumbnail?: string
        category: string
        skillLevel: string
        duration: number
        totalViews: number
        totalEnrollments: number
        rating: number
        creator: {
            user: {
                name: string
                arabicName?: string
                profileImage?: string
            }
        }
        isEnrolled?: boolean
        userProgress?: number
        hasPreview?: boolean
    }
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
    onClick?: () => void
    onPreview?: () => void
    lang?: 'en' | 'de'
}

export function ProfessionalCourseCard({
    course,
    userSubscriptionStatus,
    onClick,
    onPreview,
    lang = 'en'
}: ProfessionalCourseCardProps) {
    const t = useTranslations('courses');
    const tCommon = useTranslations('common');
    const currentLocale = useLocale();
    const effectiveLang = currentLocale || lang;

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (effectiveLang === 'ar') {
            return `${hours}س ${minutes}د`
        } else if (effectiveLang === 'de') {
            return `${hours}Std ${minutes}Min`
        } else {
            return `${hours}h ${minutes}m`
        }
    }

    const formatViews = (views: number) => {
        if (views >= 1000000) {
            if (effectiveLang === 'ar') {
                return `${(views / 1000000).toFixed(1)}مليون`
            } else if (effectiveLang === 'de') {
                return `${(views / 1000000).toFixed(1)}Mio`
            } else {
                return `${(views / 1000000).toFixed(1)}M`
            }
        }
        if (views >= 1000) {
            if (effectiveLang === 'ar') {
                return `${(views / 1000).toFixed(1)}ألف`
            } else if (effectiveLang === 'de') {
                return `${(views / 1000).toFixed(1)}Tsd`
            } else {
                return `${(views / 1000).toFixed(1)}K`
            }
        }
        return views.toString()
    }

    const getCTA = () => {
        if (course.isEnrolled) {
            return (
                <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-foreground"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick?.()
                    }}
                >
                    <Play className="w-4 h-4 mr-2" />
                    {effectiveLang === 'ar' ? 'متابعة التعلم' : effectiveLang === 'de' ? 'Lernen fortsetzen' : 'Continue Learning'}
                </Button>
            )
        }

        if (userSubscriptionStatus === 'ACTIVE') {
            return (
                <Button
                    size="sm"
                    className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-foreground"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick?.()
                    }}
                >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {effectiveLang === 'ar' ? 'ابدأ التعلم' : effectiveLang === 'de' ? 'Lernen beginnen' : 'Start Learning'}
                </Button>
            )
        }

        // For non-subscribed users, return null to hide the button
        return null
    }

    const getCourseBackgroundImage = () => {
        // If course has thumbnail, use it
        if (course.thumbnail) {
            return `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${course.thumbnail})`
        }

        // Course category-based background images
        const categoryImages = {
            'programming': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop&crop=face',
            'design': 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=600&h=400&fit=crop',
            'business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
            'marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
            'development': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',
            'photography': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=400&fit=crop',
            'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
            'languages': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
            'fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
            'cooking': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop'
        }

        // Get image based on course category or default
        const categoryKey = course.category.toLowerCase()
        const backgroundImage = categoryImages[categoryKey as keyof typeof categoryImages] || categoryImages['programming']

        return `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundImage})`
    }

    const getSkillLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            case 'advanced':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            default:
                return 'bg-muted text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }
    }

    const getSkillLevelText = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner':
                return effectiveLang === 'ar' ? 'مبتدئ' : effectiveLang === 'de' ? 'Anfänger' : 'Beginner'
            case 'intermediate':
                return effectiveLang === 'ar' ? 'متوسط' : effectiveLang === 'de' ? 'Mittelstufe' : 'Intermediate'
            case 'advanced':
                return effectiveLang === 'ar' ? 'متقدم' : effectiveLang === 'de' ? 'Fortgeschritten' : 'Advanced'
            default:
                return level
        }
    }

    return (
        <motion.div
            className="group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
        >
            <div className="bg-[hsl(var(--card))] rounded-xl overflow-hidden shadow-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 transition-all duration-300 h-80">
                {/* Main Instructor Photo Background Area */}
                <div
                    className="relative h-56 overflow-hidden bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: getCourseBackgroundImage(),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    {/* Small Instructor Photo Circle (for fallback/branding) */}
                    <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                            {course.creator.user.profileImage ? (
                                <img
                                    src={course.creator.user.profileImage}
                                    alt={lang === 'de' ? course.creator.user.arabicName || course.creator.user.name : course.creator.user.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--primary))] to-purple-600 flex items-center justify-center text-foreground font-bold text-sm">
                                    {(course.creator.user.arabicName || course.creator.user.name).charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructor Name */}
                    <div className="absolute bottom-4 left-20 text-foreground">
                        <h3 className="font-semibold text-sm group-hover:text-[hsl(var(--primary))] transition-colors duration-300 drop-shadow-md">
                            {effectiveLang === 'ar'
                                ? course.creator.user.arabicName || course.creator.user.name
                                : course.creator.user.name
                            }
                        </h3>
                        <p className="text-white/90 text-xs drop-shadow-md">
                            {effectiveLang === 'ar' ? 'مدرب معتمد' : effectiveLang === 'de' ? 'Zertifizierter Ausbilder' : 'Certified Instructor'}
                        </p>
                    </div>

                    {/* Progress Bar for enrolled users */}
                    {course.isEnrolled && course.userProgress !== undefined && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/30">
                            <div
                                className="h-full bg-background transition-all duration-300"
                                style={{ width: `${course.userProgress}%` }}
                            />
                        </div>
                    )}
                </div>

                {/* Course Details Footer */}
                <div className="p-4 flex flex-col justify-between" style={{ minHeight: '100px' }}>
                    {/* Course Title */}
                    <h4 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors duration-300">
                        {effectiveLang === 'ar' ? course.titleAr : course.title}
                    </h4>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(course.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{course.totalEnrollments}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{course.rating.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    {getCTA()}
                </div>
            </div>
        </motion.div>
    )
}
