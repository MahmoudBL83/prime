'use client';

import { motion } from 'framer-motion';
import { Play, Plus, Star, Clock, Users, BookOpen, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { LoadingButton } from '@/components/ui/LoadingButton';
import Image from 'next/image';

interface CourseItem {
    id: string;
    title?: string;
    titleAr?: string;
    titleKey?: string;
    type: 'course' | 'series' | 'masterclass' | 'workshop';
    thumbnail: string;
    duration?: string;
    rating?: number;
    category?: string;
    categoryAr?: string;
    categoryKey?: string;
    isNew?: boolean;
    isTopRated?: boolean;
    topPosition?: number;
    instructor?: string;
    instructorEn?: string;
    instructorKey?: string;
    instructorImage?: string | null;
    description?: string;
    descriptionAr?: string;
    price?: number;
    studentCount?: number;
    reviewCount?: number;
    lessonCount?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface StreamingShowcaseProps {
    title?: string;
    titleKey?: string;
    items: CourseItem[];
    seeAllLink?: string;
    showTopBadges?: boolean;
    layout?: 'grid' | 'row';
}

// Netflix-style TOP Badge Component
function TopBadge({ position }: { position: number }) {
    return (
        <div className="absolute top-2 left-2 z-20">
            <div className="relative">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-foreground px-2 py-1 rounded-md shadow-lg">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold tracking-wider">TOP</span>
                        <span className="text-sm font-black leading-none">{position}</span>
                    </div>
                </div>
                {/* Ribbon effect */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[4px] border-l-transparent border-r-transparent border-t-red-700"></div>
            </div>
        </div>
    );
}

// Netflix-style Course Card Component
function CourseCard({ item, index, isLarge = false }: {
    item: CourseItem;
    index: number;
    isLarge?: boolean;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const t = useTranslations('courses');
    const locale = useLocale();
    const { navigateWithLoading, isLoading } = useNavigationLoading();
    const isArabic = locale === 'ar';

    const getTitle = (item: CourseItem) => {
        if (isArabic && item.titleAr) return item.titleAr;
        if (item.title) return item.title;
        if (item.titleKey) return t(item.titleKey as any) || item.titleKey;
        return 'Course Title';
    };

    const getInstructor = (item: CourseItem) => {
        if (isArabic && item.instructor) return item.instructor;
        if (item.instructorEn) return item.instructorEn;
        if (item.instructor) return item.instructor;
        if (item.instructorKey) return t(item.instructorKey as any);
        return 'Instructor';
    };

    const cardWidth = isLarge ? 'w-80' : 'w-64';
    const cardHeight = isLarge ? 'h-48' : 'h-36';

    return (
        <motion.div
            className={`group relative ${cardWidth} ${cardHeight} flex-shrink-0 cursor-pointer`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigateWithLoading(`/${locale}/courses/${item.id}`, `course-view-${item.id}`)}
        >
            {/* Main Card */}
            <div className="relative w-full h-full rounded-lg overflow-hidden bg-background shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:z-10">
                {/* Course Thumbnail */}
                <div className="relative w-full h-full">
                    <Image
                        src={item.thumbnail || '/images/course-placeholder.jpg'}
                        alt={getTitle(item)}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes={isLarge ? "320px" : "256px"}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/course-placeholder.jpg';
                        }}
                    />
                    
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    
                    {/* TOP Badge */}
                    {item.topPosition && <TopBadge position={item.topPosition} />}
                    
                    {/* New Badge */}
                    {item.isNew && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-green-600 to-green-500 text-foreground text-xs font-bold rounded shadow-lg">
                            {isArabic ? 'جديد' : 'NEW'}
                        </div>
                    )}
                </div>

                {/* Content Overlay - Always visible on bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-foreground">
                    {/* Title */}
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 leading-tight drop-shadow-lg">
                        {getTitle(item)}
                    </h3>
                    
                    {/* Instructor */}
                    <p className="text-sm text-muted-foreground mb-2 drop-shadow">
                        {getInstructor(item)}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                            {item.rating && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span>{item.rating.toFixed(1)}</span>
                                </div>
                            )}
                            {item.duration && (
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{item.duration}</span>
                                </div>
                            )}
                        </div>
                        
                        {item.price !== undefined && (
                            <div>
                                {item.price === 0 ? (
                                    <span className="text-green-400 font-semibold">{isArabic ? 'مجاني' : 'FREE'}</span>
                                ) : (
                                    <span className="text-foreground font-semibold">${item.price}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hover Play Button */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                    isHovered ? 'opacity-100 bg-background/20' : 'opacity-0'
                }`}>
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
                        {isLoading(`course-view-${item.id}`) ? (
                            <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <Play className="w-8 h-8 text-foreground fill-current ml-1" />
                        )}
                    </div>
                </div>

                {/* Difficulty Badge */}
                {item.difficulty && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
                        item.difficulty === 'beginner' ? 'bg-green-600' :
                        item.difficulty === 'intermediate' ? 'bg-yellow-600' : 'bg-red-600'
                    } text-foreground shadow-lg`}>
                        {isArabic ? 
                            (item.difficulty === 'beginner' ? 'مبتدئ' : 
                             item.difficulty === 'intermediate' ? 'متوسط' : 'متقدم') :
                            item.difficulty.toUpperCase()
                        }
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// Netflix-style Row Component
function CourseRow({ title, items, seeAllLink }: {
    title: string;
    items: CourseItem[];
    seeAllLink?: string;
}) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { navigateWithLoading, isLoading } = useNavigationLoading();
    const locale = useLocale();
    const isArabic = locale === 'ar';

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            const currentScroll = scrollContainerRef.current.scrollLeft;
            const targetScroll = direction === 'left' 
                ? currentScroll - scrollAmount 
                : currentScroll + scrollAmount;
            
            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    if (!items.length) return null;

    return (
        <div className="mb-8">
            {/* Row Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                    {title}
                </h3>
                {seeAllLink && (
                    <LoadingButton
                        onClick={() => navigateWithLoading(seeAllLink, 'see-all')}
                        loading={isLoading('see-all')}
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground text-sm"
                    >
                        {isArabic ? 'عرض الكل' : 'See All'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </LoadingButton>
                )}
            </div>

            {/* Scrollable Row */}
            <div className="relative group">
                {/* Left Arrow */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-background/50 hover:bg-background/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>

                {/* Right Arrow */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-background/50 hover:bg-background/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                >
                    <ChevronRight className="w-6 h-6 text-foreground" />
                </button>

                {/* Scrollable Container */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item, index) => (
                        <CourseCard
                            key={item.id}
                            item={item}
                            index={index}
                            isLarge={index === 0} // First item is larger like Netflix hero
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Main StreamingShowcase Component
export function StreamingShowcase({ 
    title, 
    titleKey, 
    items = [], 
    seeAllLink, 
    showTopBadges = false,
    layout = 'row'
}: StreamingShowcaseProps) {
    const t = useTranslations('courses');
    const locale = useLocale();
    const isArabic = locale === 'ar';

    if (!items.length) {
        return null;
    }

    const displayTitle = titleKey ? t(titleKey as any) : title || '';

    // Group items for different rows (like Netflix)
    const topRatedItems = items.filter(item => item.isTopRated || item.topPosition).slice(0, 8);
    const newReleases = items.filter(item => item.isNew).slice(0, 8);
    const allItems = items.slice(0, 10);

    return (
        <section className="relative py-8 md:py-12 bg-background">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Section Header */}
                {displayTitle && (
                    <div className="flex items-center justify-between mb-8">
                        <motion.h2 
                            className="text-3xl md:text-4xl font-bold text-foreground"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {displayTitle}
                        </motion.h2>
                    </div>
                )}

                {/* Netflix-style Rows */}
                <div className="space-y-8">
                    {/* Top Rated Row */}
                    {topRatedItems.length > 0 && (
                        <CourseRow 
                            title={isArabic ? "الأعلى تقييماً" : "Top Rated"}
                            items={topRatedItems}
                            seeAllLink={seeAllLink}
                        />
                    )}

                    {/* New Releases Row */}
                    {newReleases.length > 0 && (
                        <CourseRow 
                            title={isArabic ? "الإصدارات الجديدة" : "New Releases"}
                            items={newReleases}
                        />
                    )}

                    {/* All Courses Row */}
                    <CourseRow 
                        title={displayTitle || (isArabic ? "جميع الدورات" : "All Courses")}
                        items={allItems}
                        seeAllLink={seeAllLink}
                    />
                </div>
            </div>
        </section>
    );
}