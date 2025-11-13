'use client';

import { motion } from 'framer-motion';
import { Play, Plus, Check, Star, Clock, Users, BookOpen, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useNavigationLoading } from '@/hooks/useNavigationLoading';
import { LoadingButton } from '@/components/ui/LoadingButton';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

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
        <div className="absolute top-3 left-3 z-20">
            <div className="relative">
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-foreground px-2.5 py-1.5 rounded-md shadow-lg">
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold tracking-wider">TOP</span>
                        <span className="text-base font-black leading-none">{position}</span>
                    </div>
                </div>
                {/* Ribbon effect */}
                <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-t-[5px] border-l-transparent border-r-transparent border-t-red-700"></div>
            </div>
        </div>
    );
}

// Get random local course image
function getRandomCourseImage(index: number): string {
    const localImages = [
        '/images/courses/IMG-20251009-WA0078.jpg',
        '/images/courses/IMG-20251009-WA0079.jpg',
        '/images/courses/IMG-20251009-WA0080.jpg',
        '/images/courses/IMG-20251009-WA0081.jpg'
    ];
    return localImages[index % localImages.length];
}

// Netflix-style POSTER Card Component - Vertical movie poster style
function CourseCard({ item, index, isLarge = false }: {
    item: CourseItem;
    index: number;
    isLarge?: boolean;
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [inMyList, setInMyList] = useState(false);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const t = useTranslations('courses');
    const locale = useLocale();
    const { navigateWithLoading, isLoading } = useNavigationLoading();
    const { data: session } = useSession();
    const isArabic = locale === 'ar';

    // Fetch my list status on mount
    useEffect(() => {
        if (session?.user) {
            fetchMyListStatus();
        }
    }, [session, item.id]);

    const fetchMyListStatus = async () => {
        try {
            const response = await fetch(`/api/courses/${item.id}/interaction`);
            if (response.ok) {
                const data = await response.json();
                setInMyList(data.inMyList || false);
            }
        } catch (error) {
            console.error('Error fetching my list status:', error);
        }
    };

    const handleToggleMyList = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!session?.user) {
            toast.error(isArabic ? 'يجب تسجيل الدخول أولاً' : 'Please sign in to add to your list');
            navigateWithLoading(`/${locale}/auth/login`, 'login');
            return;
        }

        setIsLoadingList(true);
        const action = inMyList ? 'removeFromList' : 'addToList';
        
        try {
            const response = await fetch(`/api/courses/${item.id}/interaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action }),
            });

            if (response.ok) {
                const data = await response.json();
                setInMyList(data.inMyList);
                toast.success(
                    data.inMyList 
                        ? (isArabic ? 'تمت الإضافة إلى قائمتي' : 'Added to My List')
                        : (isArabic ? 'تمت الإزالة من قائمتي' : 'Removed from My List')
                );
            } else {
                throw new Error('Failed to update list');
            }
        } catch (error) {
            console.error('Error toggling my list:', error);
            toast.error(isArabic ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong');
        } finally {
            setIsLoadingList(false);
        }
    };

    const getTitle = (item: CourseItem) => {
        if (isArabic && item.titleAr) return item.titleAr;
        if (item.title) return item.title;
        if (item.titleKey) return t(item.titleKey as any) || item.titleKey;
        return isArabic ? 'عنوان الدورة' : 'Course Title';
    };

    const getInstructor = (item: CourseItem) => {
        if (isArabic && item.instructor) return item.instructor;
        if (item.instructorEn) return item.instructorEn;
        if (item.instructor) return item.instructor;
        if (item.instructorKey) return t(item.instructorKey as any);
        return isArabic ? 'المدرب' : 'Instructor';
    };

    return (
        <motion.div
            className="group relative flex-shrink-0 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
                opacity: 1,
                y: 0,
                scale: isHovered ? 1.05 : 1,
                zIndex: isHovered ? 50 : 1
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigateWithLoading(`/${locale}/courses/${item.id}`, `course-view-${item.id}`)}
        >
            {/* POSTER Card - 2:3 aspect ratio (like movie posters) - LARGER SIZE */}
            <div className="relative w-64 h-96 rounded-lg overflow-hidden bg-background shadow-2xl group-hover:shadow-purple-500/40 transition-all duration-300">
                {/* Course Poster Image */}
                <div className="relative w-full h-full">
                    <Image
                        src={getRandomCourseImage(index)}
                        alt={getTitle(item)}
                        fill
                        className="object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                        sizes="256px"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getRandomCourseImage(0);
                        }}
                    />
                    
                    {/* Poster overlay gradient - subtle at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    {/* TOP Badge - Netflix style */}
                    {item.topPosition && <TopBadge position={item.topPosition} />}
                    
                    {/* New Badge - Top right corner */}
                    {item.isNew && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-red-600 text-foreground text-xs font-bold rounded shadow-lg">
                            {isArabic ? 'جديد' : 'NEW'}
                        </div>
                    )}

                    {/* Rating Badge - Top left (if no TOP badge) */}
                    {!item.topPosition && item.rating && (
                        <div className="absolute top-3 left-3 px-2.5 py-1.5 bg-background/80 backdrop-blur-sm rounded flex items-center gap-1.5">
                            <Star className="w-4 h-4 fill-current text-yellow-400" />
                            <span className="text-foreground text-sm font-bold">{item.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                {/* Always visible bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent">
                    <h3 className={`text-foreground font-bold text-base line-clamp-2 leading-tight mb-1.5 ${
                        isArabic ? 'text-right font-arabic' : 'text-left'
                    }`}>
                        {getTitle(item)}
                    </h3>
                    {item.instructor && (
                        <p className="text-muted-foreground text-sm line-clamp-1">{getInstructor(item)}</p>
                    )}
                </div>

                {/* Hover Overlay - Appears on hover */}
                <motion.div 
                    className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
                >
                    {/* Play button */}
                    <motion.button
                        className="mb-5 bg-white/95 backdrop-blur-sm text-foreground p-5 rounded-full shadow-2xl hover:bg-background hover:scale-110 transition-all duration-200"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: isHovered ? 1 : 0.8 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigateWithLoading(`/${locale}/courses/${item.id}`, `course-play-${item.id}`);
                        }}
                    >
                        <Play className="w-7 h-7 fill-current" />
                    </motion.button>

                    {/* Course title */}
                    <h3 className={`text-foreground font-bold text-lg text-center mb-3 line-clamp-2 ${
                        isArabic ? 'font-arabic' : ''
                    }`}>
                        {getTitle(item)}
                    </h3>
                    
                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                        {item.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current text-yellow-400" />
                                <span className="font-medium">{item.rating.toFixed(1)}</span>
                            </div>
                        )}
                        {item.duration && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.duration}</span>
                            </div>
                        )}
                        {item.lessonCount && (
                            <div className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                <span>{item.lessonCount}</span>
                            </div>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 w-full">
                        <button
                            className="w-full px-4 py-2 bg-background text-foreground font-semibold rounded-md hover:bg-gray-200 transition-colors text-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigateWithLoading(`/${locale}/courses/${item.id}`, `course-start-${item.id}`);
                            }}
                        >
                            {isArabic ? 'ابدأ الآن' : 'Start Now'}
                        </button>
                        
                        <button
                            className={`w-full px-4 py-2 backdrop-blur-sm text-foreground rounded-md transition-all text-sm flex items-center justify-center gap-2 ${
                                inMyList 
                                    ? 'bg-green-600/80 hover:bg-green-700/80 border border-green-500/50' 
                                    : 'bg-gray-800/80 hover:bg-gray-700/80'
                            } ${isLoadingList ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleToggleMyList}
                            disabled={isLoadingList}
                        >
                            {isLoadingList ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : inMyList ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {inMyList ? (isArabic ? 'في قائمتي' : 'In My List') : (isArabic ? 'قائمتي' : 'My List')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

// Netflix-style Row Component - Exact match to reference image
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
            const scrollAmount = 400; // Larger scroll amount for Netflix feel
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
        <div className="mb-10">
            {/* Row Header - Netflix style */}
            <div className="flex items-center justify-between mb-4 px-4 md:px-0">
                <h3 className="text-xl md:text-2xl font-bold text-foreground hover:text-muted-foreground transition-colors cursor-pointer">
                    {title}
                </h3>
                {seeAllLink && (
                    <LoadingButton
                        onClick={() => navigateWithLoading(seeAllLink, 'see-all')}
                        loading={isLoading('see-all')}
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground text-sm font-medium"
                    >
                        {isArabic ? 'استكشاف الكل' : 'Explore All'}
                        <ChevronRight className={`w-4 h-4 ${isArabic ? 'mr-1' : 'ml-1'}`} />
                    </LoadingButton>
                )}
            </div>

            {/* Scrollable Row - Netflix style with better spacing */}
            <div className="relative group overflow-visible">
                {/* Left Arrow - Netflix style */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-background/60 hover:bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-xl"
                >
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                </button>

                {/* Right Arrow - Netflix style */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-background/60 hover:bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-xl"
                >
                    <ChevronRight className="w-6 h-6 text-foreground" />
                </button>

                {/* Scrollable Container - Poster grid style */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth py-4 px-4 md:px-6"
                    style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        scrollSnapType: 'x mandatory'
                    }}
                >
                    {items.map((item, index) => (
                        <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
                            <CourseCard
                                item={item}
                                index={index}
                                isLarge={false}
                            />
                        </div>
                    ))}
                    {/* Add spacing at the end */}
                    <div className="w-4 flex-shrink-0"></div>
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

    // Simple single row - no grouping or sub-rows
    return (
        <section className="relative py-8 md:py-12 bg-background">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Single Course Row */}
                <CourseRow 
                    title={displayTitle}
                    items={items}
                    seeAllLink={seeAllLink}
                />
            </div>
        </section>
    );
}