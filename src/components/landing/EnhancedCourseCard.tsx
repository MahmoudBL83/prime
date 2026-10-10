'use client';

import { motion } from 'framer-motion';
import { Play, Star, Clock, Eye, Crown, Lock, Plus, Share2, Heart } from 'lucide-react';
import { CourseCard as CourseCardType } from '@/types/landing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { cn } from '@/lib/utils';

interface EnhancedCourseCardProps {
    course: CourseCardType;
    onClick?: () => void;
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    className?: string;
}

export function EnhancedCourseCard({ course, onClick, userSubscriptionStatus = 'NONE', className }: EnhancedCourseCardProps) {
    const { data: session } = useSession();
    const locale = useLocaleSafe();

    const getCTA = () => {
        // Anonymous users
        if (!session) {
            return {
                text: 'معاينة الدورة',
                icon: <Eye className="w-4 h-4 ml-1" />,
                action: onClick,
                variant: 'outline' as const,
                showLock: false
            };
        }

        // Registered but not subscribed users
        if (userSubscriptionStatus === 'NONE' || userSubscriptionStatus === 'EXPIRED' || userSubscriptionStatus === 'CANCELLED') {
            return {
                text: 'فتح الدورة',
                icon: <Crown className="w-4 h-4 ml-1" />,
                action: onClick,
                variant: 'default' as const,
                showLock: true
            };
        }

        // Subscribed users
        return {
            text: course.hasProgress ? 'استمر بالمشاهدة' : 'ابدأ التعلم',
            icon: <Play className="w-4 h-4 ml-1" />,
            action: onClick,
            variant: 'default' as const,
            showLock: false
        };
    };

    const cta = getCTA();

    return (
        <div className={cn("relative group", className)}>
            <motion.div
                className="relative cursor-pointer transform transition-all duration-500 ease-out bg-background rounded-lg overflow-hidden"
                whileHover={{
                    scale: 1.1,
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.5)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={cta.action}
            >
                {/* Card Image/Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                    <img
                        src={course.thumbnail}
                        alt={course.titleAr}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Lock overlay for premium content */}
                    {cta.showLock && (
                        <div className="absolute inset-0 bg-background bg-opacity-40 flex items-center justify-center">
                            <div className="absolute top-3 right-3">
                                <Lock className="w-5 h-5 text-foreground" />
                            </div>
                        </div>
                    )}

                    {/* Level Badge */}
                    <div className="absolute top-3 left-3">
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-xs font-medium px-2 py-1",
                                course.level === "مبتدئ" && "bg-green-600 text-foreground hover:bg-green-700",
                                course.level === "متوسط" && "bg-yellow-600 text-foreground hover:bg-yellow-700",
                                course.level === "متقدم" && "hover:opacity-90"
                            )}
                            style={course.level === "متقدم" ? { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' } : undefined}
                        >
                            {course.level}
                        </Badge>
                    </div>

                    {/* Rating */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-background bg-opacity-60 px-2 py-1 rounded">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-foreground text-xs font-medium">{course.rating}</span>
                    </div>

                    {/* Duration */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-background bg-opacity-60 px-2 py-1 rounded">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground text-xs">{course.duration}</span>
                    </div>

                    {/* Progress indicator for enrolled courses */}
                    {course.hasProgress && course.progress && (
                        <div className="absolute bottom-3 left-3">
                            <div className="bg-background bg-opacity-60 px-2 py-1 rounded">
                                <div className="flex items-center gap-1">
                                    <div className="w-12 h-1 bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 transition-all duration-300"
                                            style={{ width: `${course.progress}%` }}
                                        />
                                    </div>
                                    <span className="text-foreground text-xs">{course.progress}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card Content */}
                <div className="p-4 bg-background">
                    <div className="mb-2">
                        <Badge variant="outline" className="text-xs text-muted-foreground border-gray-600 hover:bg-card">
                            {course.category}
                        </Badge>
                    </div>

                    <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2 leading-tight">
                        {locale === 'ar' ? course.titleAr : course.titleEn}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                        {locale === 'ar' ? course.titleEn : course.titleAr}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate font-medium">{course.instructor}</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-xs">{course.rating}</span>
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-3">
                        <Button
                            variant={cta.variant}
                            size="sm"
                            className={cn(
                                "w-full text-sm font-medium transition-all duration-200",
                                cta.variant === 'default' && "text-foreground hover:opacity-90",
                                cta.variant === 'outline' && "border-gray-600 text-muted-foreground hover:bg-card"
                            )}
                            style={cta.variant === 'default' ? { backgroundColor: 'hsl(var(--accent))' } : undefined}
                            onClick={(e) => {
                                e.stopPropagation();
                                cta.action?.();
                            }}
                        >
                            {cta.icon}
                            {cta.text}
                        </Button>
                    </div>
                </div>

                {/* MasterClass-style bottom border on hover */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: 'hsl(var(--accent))', transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>

            {/* Enhanced Hover Card - Inspired by Shahid Design */}
            <motion.div
                className={cn(
                    "absolute left-1/2 top-full w-full bg-card rounded-lg shadow-2xl border border-border",
                    "invisible opacity-0 group-hover:visible group-hover:opacity-100",
                    "transition-all duration-300 ease-out",
                    "z-50 p-4 flex flex-col gap-3",
                    "max-w-sm -translate-x-1/2 mt-2"
                )}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                whileHover={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                {/* Course Title */}
                <h4 className="text-foreground font-bold text-lg leading-tight">
                    {locale === 'ar' ? course.titleAr : course.titleEn}
                </h4>

                {/* Course Description */}
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                    <span className="line-clamp-2">
                        {locale === 'ar' ? course.titleEn : course.titleAr}
                    </span>
                </div>

                {/* Category Tags */}
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                        {locale === 'ar' ? 'الموسم 1' : 'Season 1'}
                    </span>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-green-400 capitalize">{course.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-blue-400">{course.level}</span>
                    </div>
                </div>

                {/* Highlighted Description */}
                <div className="border-l-4 border-green-500 pl-3 py-1">
                    <p className="text-muted-foreground text-sm font-medium">
                        {locale === 'ar' ? 'تعلم بطريقة تفاعلية وممتعة' : 'Learn interactively and enjoyably'}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                    <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            cta.action?.();
                        }}
                    >
                        <Play className="w-4 h-4 mr-1" />
                        {cta.text}
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-muted-foreground hover:bg-gray-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Add to favorites functionality
                        }}
                    >
                        <Heart className="w-4 h-4" />
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-muted-foreground hover:bg-gray-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Share functionality
                        }}
                    >
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}