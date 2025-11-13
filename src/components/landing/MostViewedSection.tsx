'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef } from 'react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { cn } from '@/lib/utils';

interface ProfessionalCourse {
    id: string;
    title: string;
    titleAr: string;
    instructor: string;
    instructorArabic?: string;
    instructorImage?: string;
    thumbnail?: string;
    duration: number;
    totalViews: number;
    lessonsCount: number;
    category: string;
    level: string;
}

interface MostViewedSectionProps {
    className?: string;
    onCourseClick?: (courseId: string) => void;
}

const getCourseBackgroundImage = (course: any) => {
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

const timeFilters = [
    { id: 'week', label: 'هذا الأسبوع', labelEn: 'This Week' },
    { id: 'month', label: 'هذا الشهر', labelEn: 'This Month' },
    { id: 'year', label: 'هذا العام', labelEn: 'This Year' },
];

export function MostViewedSection({ className, onCourseClick }: MostViewedSectionProps) {
    const { ref, inView, animationProps } = useScrollAnimation();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [activeFilter, setActiveFilter] = useState('month');
    const [courses, setCourses] = useState<ProfessionalCourse[]>([]);
    const [loading, setLoading] = useState(true);

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
            setCanScrollLeft(container.scrollLeft > 0);
            setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current;
        if (container) {
            const scrollAmount = container.clientWidth * 0.7;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        fetchMostViewedCourses();
    }, [activeFilter]);

    useEffect(() => {
        checkScroll();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScroll);
            return () => container.removeEventListener('scroll', checkScroll);
        }
    }, [courses]);

    const fetchMostViewedCourses = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/most-viewed?period=${activeFilter}`);
            if (response.ok) {
                const data = await response.json();
                setCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Failed to fetch most viewed courses:', error);
            // Fallback to mock data for demo
            setCourses(generateMockCourses());
        } finally {
            setLoading(false);
        }
    };

    const generateMockCourses = (): ProfessionalCourse[] => [
        {
            id: 'course1',
            title: 'Complete Web Development Course',
            titleAr: 'دورة تطوير الويب الشاملة',
            instructor: 'أحمد حسن',
            instructorArabic: 'أحمد حسن',
            duration: 3600,
            totalViews: 15420,
            lessonsCount: 42,
            category: 'Programming',
            level: 'Beginner'
        },
        {
            id: 'course2',
            title: 'English for Professionals',
            titleAr: 'تعلم الإنجليزية من الصفر حتى الاحتراف',
            instructor: 'محمد الجابر',
            instructorArabic: 'محمد الجابر',
            duration: 2880,
            totalViews: 12350,
            lessonsCount: 38,
            category: 'Language',
            level: 'Intermediate'
        },
        {
            id: 'course3',
            title: 'Digital Marketing Mastery',
            titleAr: 'الإنجليزية لاجتياز مقابلات العمل',
            instructor: 'محمد الجابر',
            instructorArabic: 'محمد الجابر',
            duration: 2520,
            totalViews: 9840,
            lessonsCount: 35,
            category: 'Marketing',
            level: 'Advanced'
        },
    ];

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}س ${minutes}د`;
    };

    const formatViews = (views: number) => {
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}ألف`;
        }
        return views.toString();
    };

    return (
        <motion.section
            ref={ref}
            className={cn("py-12 bg-background", className)}
            {...animationProps}
        >
            <div className="w-full">
                <div className="flex items-center justify-between mb-8 px-4 md:px-8">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-light text-foreground mb-2">
                            الأكثر مشاهدة
                        </h2>
                        <p className="text-muted-foreground text-sm uppercase tracking-wider">
                            MOST VIEWED COURSES
                        </p>
                    </div>

                    {/* Time Filter Buttons */}
                    <div className="flex gap-2">
                        {timeFilters.map((filter) => (
                            <Button
                                key={filter.id}
                                variant={activeFilter === filter.id ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                    "text-sm transition-all duration-200",
                                    activeFilter === filter.id
                                        ? "bg-[var(--primary)] text-foreground hover:bg-[var(--primary)]/90"
                                        : "text-muted-foreground hover:text-foreground hover:bg-card"
                                )}
                                onClick={() => setActiveFilter(filter.id)}
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-muted-foreground text-lg">جاري التحميل...</div>
                    </div>
                ) : (
                    <div className="relative group px-4 md:px-8">
                        {/* Left Scroll Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-full transition-all duration-300 hover:bg-card",
                                canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                            onClick={() => scroll('left')}
                        >
                            <ChevronLeft className="h-6 w-6 text-foreground" />
                        </Button>

                        {/* Right Scroll Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-full transition-all duration-300 hover:bg-card",
                                canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}
                            onClick={() => scroll('right')}
                        >
                            <ChevronRight className="h-6 w-6 text-foreground" />
                        </Button>

                        {/* Scrollable Content */}
                        <div
                            ref={scrollContainerRef}
                            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                            onScroll={checkScroll}
                        >
                            {courses.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    className="flex-shrink-0 w-80 sm:w-96 lg:w-[400px]"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <ProfessionalCourseCard
                                        course={course}
                                        onClick={() => onCourseClick?.(course.id)}
                                    />
                                </motion.div>
                            ))}
                        </div>

                        {/* Gradient fade on sides */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
                    </div>
                )}
            </div>
        </motion.section>
    );
}

interface ProfessionalCourseCardProps {
    course: ProfessionalCourse;
    onClick?: () => void;
}

function ProfessionalCourseCard({ course, onClick }: ProfessionalCourseCardProps) {
    const locale = useLocaleSafe();

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (locale === 'ar') {
            return `${hours}س ${minutes}د`;
        } else if (locale === 'de') {
            return `${hours}Std ${minutes}Min`;
        } else {
            return `${hours}h ${minutes}m`;
        }
    };

    const formatViews = (views: number) => {
        if (locale === 'ar') {
            if (views >= 1000) {
                return `${(views / 1000).toFixed(1)}ألف`;
            }
        } else if (locale === 'de') {
            if (views >= 1000) {
                return `${(views / 1000).toFixed(1)}Tsd`;
            }
        } else {
            if (views >= 1000) {
                return `${(views / 1000).toFixed(1)}K`;
            }
        }
        return views.toString();
    };

    return (
        <motion.div
            className="group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
        >
            <div className="bg-background rounded-xl overflow-hidden shadow-lg border border-border hover:border-gray-600 transition-all duration-300 h-96">
                {/* Main Instructor Photo Background Area */}
                <div
                    className="relative h-72 overflow-hidden bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: getCourseBackgroundImage(course)
                    }}
                >
                    {/* Small Instructor Photo Circle (for branding) */}
                    <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                            {course.instructorImage ? (
                                <img
                                    src={course.instructorImage}
                                    alt={course.instructorArabic || course.instructor}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center text-foreground font-bold text-sm">
                                    {(course.instructorArabic || course.instructor).charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructor Name */}
                    <div className="absolute bottom-4 left-20 text-foreground">
                        <h3 className="font-semibold text-sm group-hover:text-[var(--primary)] transition-colors duration-300 drop-shadow-md">
                            {locale === 'ar' ? (course.instructorArabic || course.instructor) : course.instructor}
                        </h3>
                        <p className="text-white/90 text-xs drop-shadow-md">
                            {locale === 'ar' ? 'مدرب معتمد' : locale === 'de' ? 'Zertifizierter Ausbilder' : 'Certified Instructor'}
                        </p>
                    </div>
                </div>

                {/* Course Details Footer */}
                <div className="p-4 h-32 flex flex-col justify-between">
                    {/* Course Title */}
                    <h4 className="text-foreground font-semibold text-sm mb-2 line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-300">
                        {locale === 'ar' ? course.titleAr : course.title}
                    </h4>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(course.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{course.lessonsCount} {locale === 'ar' ? 'درس' : locale === 'de' ? 'Lektionen' : 'lessons'}</span>
                            </div>
                        </div>
                        <div className="bg-card px-2 py-1 rounded text-xs">
                            {course.level}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
