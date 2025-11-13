'use client';

import { motion } from 'framer-motion';
import { Play, Star, Clock, Eye, Crown, Lock } from 'lucide-react';
import { CourseCard as CourseCardType } from '@/types/landing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { cn } from '@/lib/utils';

interface CourseCardProps {
    course: CourseCardType;
    onClick?: () => void;
    userSubscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
    className?: string;
}

export function CourseCard({ course, onClick, userSubscriptionStatus = 'NONE', className }: CourseCardProps) {
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
        <motion.div
            className={cn(
                "relative group cursor-pointer transform transition-all duration-500 ease-out bg-background rounded-lg overflow-hidden",
                className
            )}
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

                {/* MasterClass-style hover overlay */}
                <motion.div
                    className="absolute inset-0 bg-background bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                >
                    <motion.div
                        className="flex flex-col items-center gap-3"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center",
                            cta.variant === 'default' ? "bg-opacity-90" : "bg-opacity-80"
                        )} style={{ backgroundColor: 'var(--accent)' }}>
                            {cta.icon}
                        </div>
                        <span className="text-foreground text-sm font-medium">{cta.text}</span>
                    </motion.div>
                </motion.div>

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
                        style={course.level === "متقدم" ? { backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' } : undefined}
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
                        style={cta.variant === 'default' ? { backgroundColor: 'var(--accent)' } : undefined}
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
                style={{ backgroundColor: 'var(--accent)', transformOrigin: 'left' }}
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    );
}
