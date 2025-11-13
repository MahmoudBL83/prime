'use client';

import { motion } from 'framer-motion';
import { Play, Star, Clock, Users, Crown, Lock, Eye, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoPreviewModal } from './VideoPreviewModal';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Course {
    id: string;
    title: string;
    titleAr: string;
    description: string;
    thumbnail?: string;
    category: string;
    skillLevel: string;
    duration: number;
    rating: number;
    totalEnrollments: number;
    creator: {
        user: {
            name: string;
            arabicName?: string;
        }
    }
    // Extended fields for enhanced functionality
    hasPreview?: boolean;
    previewDuration?: number;
    userProgress?: number;
    isEnrolled?: boolean;
    lastAccessed?: string;
}

interface EnhancedCourseCardProps {
    course: Course;
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    onCourseClick?: (courseId: string) => void;
    onPreviewClick?: (courseId: string) => void;
    className?: string;
    lang?: 'ar' | 'en';
}

const CATEGORIES = [
    { id: 'CATEGORY_A', name: 'Technology & Programming', nameAr: 'التكنولوجيا والبرمجة' },
    { id: 'CATEGORY_B', name: 'Business & Marketing', nameAr: 'الأعمال والتسويق' },
    { id: 'CATEGORY_C', name: 'Languages & Skills', nameAr: 'اللغات والمهارات' },
];

const SKILL_LEVELS = [
    { id: 'Beginner', name: 'Beginner', nameAr: 'مبتدئ' },
    { id: 'Intermediate', name: 'Intermediate', nameAr: 'متوسط' },
    { id: 'Advanced', name: 'Advanced', nameAr: 'متقدم' },
];

export function EnhancedCourseCard({
    course,
    userSubscriptionStatus = 'NONE',
    onCourseClick,
    onPreviewClick,
    className,
    lang = 'ar'
}: EnhancedCourseCardProps) {
    const { data: session } = useSession();
    const [isHovered, setIsHovered] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const categoryInfo = CATEGORIES.find(c => c.id === course.category);
    const skillLevelInfo = SKILL_LEVELS.find(s => s.id === course.skillLevel);

    const getCTA = () => {
        // Check if user is enrolled and has progress
        if (course.isEnrolled && course.userProgress && course.userProgress > 0) {
            return {
                text: lang === 'ar' ? 'استكمال التعلم' : 'Continue Learning',
                icon: <Play className="w-4 h-4" />,
                variant: 'default' as const,
                color: 'bg-green-600 hover:bg-green-700',
                action: () => onCourseClick?.(course.id)
            };
        }

        // Check if user is enrolled but hasn't started
        if (course.isEnrolled) {
            return {
                text: lang === 'ar' ? 'ابدأ التعلم' : 'Start Learning',
                icon: <Play className="w-4 h-4" />,
                variant: 'default' as const,
                color: 'bg-blue-600 hover:bg-blue-700',
                action: () => onCourseClick?.(course.id)
            };
        }

        // Check subscription status for non-enrolled users
        if (!session) {
            return {
                text: lang === 'ar' ? 'معاينة الدورة' : 'Preview Course',
                icon: <Eye className="w-4 h-4" />,
                variant: 'outline' as const,
                color: 'border-gray-600 text-muted-foreground hover:bg-card',
                action: () => onPreviewClick?.(course.id)
            };
        }

        if (userSubscriptionStatus === 'ACTIVE') {
            return {
                text: lang === 'ar' ? 'ابدأ التعلم' : 'Start Learning',
                icon: <Play className="w-4 h-4" />,
                variant: 'default' as const,
                color: 'bg-blue-600 hover:bg-blue-700',
                action: () => onCourseClick?.(course.id)
            };
        }

        // Non-subscribed users
        return {
            text: lang === 'ar' ? 'اشترك للوصول' : 'Subscribe to Access',
            icon: <Crown className="w-4 h-4" />,
            variant: 'default' as const,
            color: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
            action: () => onCourseClick?.(course.id)
        };
    };

    const cta = getCTA();

    const handlePreviewClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (course.hasPreview) {
            setShowPreview(true);
            onPreviewClick?.(course.id);
        }
    };

    return (
        <>
            <motion.div
                className={cn(
                    "group relative bg-background rounded-xl overflow-hidden shadow-lg border border-border hover:border-border transition-all duration-300",
                    className
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, y: -5 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                onClick={() => cta.action()}
            >
                {/* Course Thumbnail with Preview Overlay */}
                <div className="relative aspect-video overflow-hidden">
                    <img
                        src={course.thumbnail || '/images/placeholder-course.jpg'}
                        alt={lang === 'ar' ? course.titleAr : course.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Preview play button overlay */}
                    {course.hasPreview && (
                        <motion.div
                            className="absolute inset-0 bg-background/40 flex items-center justify-center cursor-pointer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            onClick={handlePreviewClick}
                        >
                            <motion.div
                                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Play className="w-8 h-8 text-foreground ml-1" />
                            </motion.div>
                            <motion.div
                                className="absolute bottom-4 left-4 bg-background/60 px-2 py-1 rounded text-sm text-foreground"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                            >
                                {lang === 'ar' ? 'معاينة مجانية' : 'Free Preview'} {course.previewDuration && `${course.previewDuration}min`}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Progress bar for enrolled courses */}
                    {course.userProgress && course.userProgress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${course.userProgress}%` }}
                            />
                        </div>
                    )}

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-xs font-medium px-2 py-1",
                                course.skillLevel === "Beginner" && "bg-green-600 text-foreground",
                                course.skillLevel === "Intermediate" && "bg-yellow-600 text-foreground",
                                course.skillLevel === "Advanced" && "bg-red-600 text-foreground"
                            )}
                        >
                            {lang === 'ar' ? skillLevelInfo?.nameAr : skillLevelInfo?.name}
                        </Badge>

                        {course.isEnrolled && (
                            <Badge className="bg-blue-600 text-foreground text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {lang === 'ar' ? 'مُسجل' : 'Enrolled'}
                            </Badge>
                        )}
                    </div>

                    {/* Rating badge */}
                    <div className="absolute top-3 right-3 bg-background/60 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-foreground text-xs font-medium">{course.rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Course Content */}
                <div className="p-5">
                    {/* Category and Duration */}
                    <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs text-muted-foreground border-gray-600">
                            {lang === 'ar' ? categoryInfo?.nameAr : categoryInfo?.name}
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Clock className="w-3 h-3" />
                            <span>{Math.round(course.duration / 60)}{lang === 'ar' ? 'س' : 'h'}</span>
                        </div>
                    </div>

                    {/* Course Title */}
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 leading-tight">
                        {lang === 'ar' ? course.titleAr : course.title}
                    </h3>

                    {/* Course Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                        {course.description}
                    </p>

                    {/* Instructor and Stats */}
                    <div className="flex items-center justify-between mb-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-foreground">
                                    {(course.creator.user.arabicName || course.creator.user.name).charAt(0)}
                                </span>
                            </div>
                            <span className="text-muted-foreground font-medium truncate">
                                {lang === 'ar' ? course.creator.user.arabicName || course.creator.user.name : course.creator.user.name}
                            </span>
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span className="text-xs">{course.totalEnrollments.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                        className={cn(
                            "w-full font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                            cta.variant === 'outline' ? cta.color : `text-foreground ${cta.color}`
                        )}
                        variant={cta.variant}
                        onClick={(e) => {
                            e.stopPropagation();
                            cta.action();
                        }}
                    >
                        {cta.icon}
                        {cta.text}
                    </Button>

                    {/* Progress indicator for continued learning */}
                    {course.userProgress && course.userProgress > 0 && (
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{course.userProgress}% {lang === 'ar' ? 'مكتمل' : 'complete'}</span>
                            {course.lastAccessed && (
                                <span>
                                    {lang === 'ar' ? 'آخر وصول:' : 'Last accessed:'} {new Date(course.lastAccessed).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Bottom accent line */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ transformOrigin: lang === 'ar' ? 'right' : 'left' }}
                />
            </motion.div>

            {/* Video Preview Modal */}
            <VideoPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                course={course}
                userSubscriptionStatus={userSubscriptionStatus}
                lang={lang}
            />
        </>
    );
}
