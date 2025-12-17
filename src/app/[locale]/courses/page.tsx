'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { Search, Play } from 'lucide-react';
import Image from 'next/image';
import { PaymentModal } from '@/components/PaymentModal';
import { Footer } from '@/components/landing/Footer';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { courses as courseList } from '@/data/courses';
import type { CourseData } from '@/data/courses';

type Course = CourseData;

const categoryLabels: Record<string, { en: string; ar?: string; de?: string }> = {
    'German Language': {
        en: 'German Language',
        ar: 'اللغة الألمانية',
        de: 'Deutsch lernen'
    },
    'Freelance & Side Hustle': {
        en: 'Freelance & Side Hustle',
        ar: 'العمل الحر والمشاريع الجانبية',
        de: 'Freelance & Nebenjobs'
    },
    'Entrepreneurship': {
        en: 'Entrepreneurship',
        ar: 'ريادة الأعمال',
        de: 'Unternehmertum'
    },
    'Trading': {
        en: 'Trading',
        ar: 'التداول',
        de: 'Trading'
    },
    'Coding & AI': {
        en: 'Coding & AI',
        ar: 'البرمجة والذكاء الاصطناعي',
        de: 'Programmierung & KI'
    },
    'German Integration': {
        en: 'German Integration',
        ar: 'الاندماج في ألمانيا',
        de: 'Integration in Deutschland'
    }
};

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>(courseList);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showLaunchingModal, setShowLaunchingModal] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [mouseStart, setMouseStart] = useState<number | null>(null);
    const [mouseEnd, setMouseEnd] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});
    const [showLeftArrow, setShowLeftArrow] = useState<{ [key: string]: boolean }>({});
    const [showRightArrow, setShowRightArrow] = useState<{ [key: string]: boolean }>({});
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
    const router = useRouter();
    const { data: session } = useSession();
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';
    const isGerman = locale === 'de';
    const getLocalizedText = (en: string, ar?: string, de?: string) => {
        if (isArabic && ar) return ar;
        if (isGerman && de) return de;
        return en;
    };
    const getCourseTitle = (course: Course) => {
        if (isArabic && course.titleAr) return course.titleAr;
        if (isGerman && course.titleDe) return course.titleDe;
        return course.title;
    };
    const getCourseDescription = (course: Course) => {
        if (isArabic && course.descriptionAr) return course.descriptionAr;
        if (isGerman && course.descriptionDe) return course.descriptionDe;
        return course.description;
    };
    const getCategoryLabel = (categoryKey: string) => {
        const labels = categoryLabels[categoryKey] || { en: categoryKey };
        return getLocalizedText(labels.en, labels.ar, labels.de);
    };
    const direction: 'ltr' | 'rtl' = isArabic ? 'rtl' : 'ltr';
    const dropdownTextAlign = isArabic ? 'text-right' : 'text-left';
    const cardMenuPositionClass = isArabic ? 'left-2 right-auto' : 'right-2';
    const rankBadgePositionClass = isArabic ? 'right-3 left-auto' : 'left-3';

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    // Categories for course sections
    const categories = [
        'German Language',
        'Freelance & Side Hustle',
        'Entrepreneurship',
        'Trading',
        'Coding & AI',
        'German Integration'
    ];

    const [showBottomCTA, setShowBottomCTA] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY;
            setIsScrolled(currentScroll > 50);
            setShowBottomCTA(currentScroll > 1);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        
        if (isLeftSwipe && heroIndex < courses.length - 1) {
            setHeroIndex(heroIndex + 1);
        }
        if (isRightSwipe && heroIndex > 0) {
            setHeroIndex(heroIndex - 1);
        }
    };

    const onMouseDown = (e: React.MouseEvent) => {
        setMouseEnd(null);
        setMouseStart(e.clientX);
        setIsDragging(true);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setMouseEnd(e.clientX);
    };

    const onMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        if (!mouseStart || !mouseEnd) return;
        
        const distance = mouseStart - mouseEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        
        if (isLeftSwipe && heroIndex < courses.length - 1) {
            setHeroIndex(heroIndex + 1);
        }
        if (isRightSwipe && heroIndex > 0) {
            setHeroIndex(heroIndex - 1);
        }
    };

    const onMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
        }
    };

    const topCourses = useMemo(() => {
        if (!courses.length) return [] as Course[];

        // Pick one from each category first
        const picked: Course[] = [];
        for (const category of categories) {
            const course = courses.find((c) => c.category === category);
            if (course) picked.push(course);
        }

        const used = new Set(picked.map((c) => c.id));
        const remaining = courses
            .filter((c) => !used.has(c.id))
            .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

        for (const course of remaining) {
            if (picked.length >= 10) break;
            picked.push(course);
        }

        return picked.slice(0, 10);
    }, [courses, categories]);

    const heroCourse = courses[heroIndex] || courseList[0];

    const handleCourseClick = (courseId: string) => {
        // Show launching soon modal instead of navigating to course detail
        setShowLaunchingModal(true);
    };

    const { openAuthModal } = useAuthModal();

    const handleLaunchingModalRegister = () => {
        setShowLaunchingModal(false);
        openAuthModal('signup');
    };

    const handleAcceptOffer = () => {
        if (session) {
            setShowPaymentModal(true);
            return;
        }

        openAuthModal('signin', {
            onSuccess: () => setShowPaymentModal(true),
        });
    };

    const scroll = (direction: 'left' | 'right', containerId: string) => {
        const container = document.getElementById(containerId);
        if (container) {
            // Card width (180px) + gap (12px = 3 in Tailwind)
            const cardWidth = 180 + 12;
            const scrollAmount = cardWidth;
            const newPosition = direction === 'left' 
                ? container.scrollLeft - scrollAmount 
                : container.scrollLeft + scrollAmount;
            
            container.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = (containerId: string) => {
        const container = document.getElementById(containerId);
        if (container) {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            const hasOverflow = scrollWidth > clientWidth;
            
            setShowLeftArrow(prev => ({
                ...prev,
                [containerId]: hasOverflow && scrollLeft > 10
            }));
            
            setShowRightArrow(prev => ({
                ...prev,
                [containerId]: hasOverflow && scrollLeft < scrollWidth - clientWidth - 10
            }));
        }
    };

    useEffect(() => {
        // Check scroll state on mount and window resize
        const checkAllScrollStates = () => {
            handleScroll('top-10-scroll');
            categories.forEach(category => {
                handleScroll(`category-${category.replace(/\s+/g, '-').toLowerCase()}`);
            });
        };

        checkAllScrollStates();
        window.addEventListener('resize', checkAllScrollStates);
        return () => window.removeEventListener('resize', checkAllScrollStates);
    }, [courses]);

    return (
        <div dir={direction} className="min-h-screen bg-[#1f1f1f]">
            {/* Sticky Bottom Banner */}
            {showBottomCTA && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0071E3] text-white py-4 px-4">
                    <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-semibold">€28.99/Mo For 12 Months</p>
                            <p className="text-xs opacity-90">Hundreds of exclusive Prime Originals. Now 50% off.</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button 
                                onClick={handleAcceptOffer}
                                className="bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all whitespace-nowrap text-center"
                                style={{
                                    border: 'none',
                                    borderRadius: '32px',
                                    boxShadow: '0 0 20px rgba(0, 0, 0, .06)',
                                    height: '32px',
                                    width: '245px',
                                    padding: '0 12px',
                                    verticalAlign: 'middle'
                                }}
                            >
                                Accept Offer
                            </button>
                            <p className="text-[10px] opacity-75 leading-tight w-[245px] text-center">
                                €28.99/Mo For 12 Months<br />
                                Terms apply.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section - Featured Course */}
            <div 
                className="relative h-screen w-full overflow-hidden mb-12 cursor-grab active:cursor-grabbing"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
            >
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={heroCourse.thumbnail || '/placeholder.jpg'}
                        alt={heroCourse.title}
                        fill
                        className="object-cover"
                        priority
                        key={heroCourse.id}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                </div>

                {/* Hero Content */}
                <div className={`relative h-full max-w-screen-2xl mx-auto px-8 flex flex-col justify-end pb-16 ${isArabic ? 'items-end' : ''}`}>
                    <div className={`max-w-xl space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {/* Title */}
                        <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                            {getCourseTitle(heroCourse)}
                        </h1>
                        
                        {/* Metadata - Movies • Thriller • Drama • 18+ */}
                        <div className={`flex items-center text-sm text-white/90 gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                                <span className="font-medium">{getCategoryLabel(heroCourse.category)}</span>
                            </div>
                            <span>•</span>
                            <span>Thriller</span>
                            <span>•</span>
                            <span>Drama</span>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 border border-white/40 rounded text-xs">18+</span>
                        </div>

                        {/* Description */}
                        <p className="text-base text-white/90 leading-relaxed max-w-md">
                            {getCourseDescription(heroCourse)}
                        </p>

                        {/* Buttons */}
                        <div className={`flex items-center gap-3 pt-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <button 
                                onClick={handleAcceptOffer}
                                className="apple-tv-button relative flex items-center justify-center gap-2 px-8 py-3 font-semibold text-base text-black rounded-full min-w-[100px] max-w-[340px] w-auto transition-transform duration-100 ease-in hover:scale-[1.02] active:scale-[0.98] z-10"
                                style={{
                                    height: '48px',
                                    borderRadius: '48px'
                                }}
                            >
                                <span className="absolute inset-0 bg-white rounded-full -z-10"></span>
                                Accept Offer
                            </button>
                            <button 
                                onClick={handleAcceptOffer}
                                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                            >
                                <span className="text-white text-xl font-light leading-none">+</span>
                            </button>
                        </div>

                        {/* Offer Text */}
                        <p className="text-xs text-white/70 pt-1 leading-relaxed">
                            €28.99/Mo For 12 Months
                        </p>
                    </div>
                </div>

                {/* Pagination Dots */}
                <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {courses.slice(0, 5).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setHeroIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === heroIndex ? 'bg-white w-8' : 'bg-white/40'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Top 10 TV Shows Section */}
            <div className="relative z-10 pb-8">
                <div className="max-w-screen-2xl mx-auto px-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                            <h2 className="text-xl font-semibold text-foreground">
                                Top 10 TV Shows
                            </h2>
                            <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                    
                    <div className="relative -mx-8 px-8">
                        {/* Navigation Arrows */}
                        {showLeftArrow['top-10-scroll'] && (
                            <button
                                onClick={() => scroll('left', 'top-10-scroll')}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-16 hover:bg-black/20 dark:hover:bg-white/10 flex items-center justify-center transition-all rounded-lg"
                            >
                                <svg className="w-3 h-8 text-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 31" fill="currentColor">
                                    <path d="M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.7 1.7 0 0 0 6.728.002a1.6 1.6 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.498L5.272 29.46Z" />
                                </svg>
                            </button>
                        )}
                        {showRightArrow['top-10-scroll'] && (
                            <button
                                onClick={() => scroll('right', 'top-10-scroll')}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-16 hover:bg-black/20 dark:hover:bg-white/10 flex items-center justify-center transition-all rounded-lg"
                            >
                                <svg className="w-3 h-8 text-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 31" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
                                    <path d="M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.7 1.7 0 0 0 6.728.002a1.6 1.6 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.498L5.272 29.46Z" />
                                </svg>
                            </button>
                        )}
                    
                        <div 
                            id="top-10-scroll" 
                            className="overflow-x-auto overflow-hidden scrollbar-hide"
                            onScroll={() => handleScroll('top-10-scroll')}
                        >
                        <div className="flex gap-3" style={{ width: 'max-content' }}>
                            {topCourses.slice(0, 8).map((course, index) => (
                            <div 
                                key={course.id} 
                                className="relative group cursor-pointer w-[180px] flex-shrink-0" 
                                onMouseEnter={() => setHoveredCard(course.id)}
                                onMouseLeave={() => {
                                    setHoveredCard(null);
                                    setShowMenu(null);
                                }}
                            >
                                {/* Course Thumbnail */}
                                <div className="relative aspect-[2/3] overflow-hidden" onClick={() => handleCourseClick(course.id)} style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                    {/* Rank Number - Apple TV Style */}
                                    <div 
                                        className={`absolute top-1 ${rankBadgePositionClass} z-10 text-white font-bold pointer-events-none select-none`}
                                        style={{
                                            fontSize: '40px',
                                            fontWeight: 700,
                                            marginTop: '4px',
                                            WebkitMask: 'linear-gradient(180deg, #fff 0, #fff 50%, hsla(0, 0%, 100%, .12))',
                                            mask: 'linear-gradient(180deg, #fff 0, #fff 50%, hsla(0, 0%, 100%, .12))'
                                        }}
                                    >
                                        {index + 1}
                                    </div>
                                    <Image
                                        src={course.thumbnail || '/placeholder.jpg'}
                                        alt={course.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        key={course.id}
                                    />
                                    {/* Three Dots Button - Apple TV Style */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(showMenu === course.id ? null : course.id);
                                        }}
                                        className={`absolute bottom-2 ${cardMenuPositionClass} w-7 h-7 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-10`}
                                    >
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                                            <circle cx="3" cy="8" r="1.5"/>
                                            <circle cx="8" cy="8" r="1.5"/>
                                            <circle cx="13" cy="8" r="1.5"/>
                                        </svg>
                                    </button>

                                    {/* Actions Dropdown Menu */}
                                    {showMenu === course.id && (
                                        <div className={`absolute bottom-12 ${cardMenuPositionClass} bg-neutral-800/95 dark:bg-neutral-800/95 backdrop-blur-md overflow-hidden shadow-xl z-20 w-[140px]`} style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(null);
                                                }}
                                                className={`w-full px-3 py-2.5 ${dropdownTextAlign} text-[13px] text-white/90 dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
                                            >
                                                <span>Share</span>
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                                </svg>
                                            </button>
                                            <div className="h-[0.5px] bg-white/10 mx-2"></div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(`${window.location.origin}/${locale}/courses/${course.id}`);
                                                    setShowMenu(null);
                                                }}
                                                className={`w-full px-3 py-2.5 ${dropdownTextAlign} text-[13px] text-white/90 dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
                                            >
                                                <span>Copy Link</span>
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        </div>
                        </div>
                    </div>
                </div>
                
                {/* Separator Line */}
                <div className="max-w-screen-2xl mx-auto px-8 mt-8">
                    <div className="h-[1px] bg-white/10"></div>
                </div>
            </div>

            {/* Category Sections */}
            {categories.map((category) => {
                const categoryCourses = courses.filter(c => c.category === category);
                if (categoryCourses.length === 0) return null;

                return (
                    <div key={category} className="relative z-10 pb-8">
                        <div className="max-w-screen-2xl mx-auto px-8">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse text-right' : ''}`}>
                                    <h2 className="text-xl font-semibold text-foreground">
                                        {getCategoryLabel(category)}
                                    </h2>
                                    <svg className="w-4 h-4 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                            
                            <div className="relative -mx-8 px-8">
                                {/* Navigation Arrows */}
                                {showLeftArrow[`category-${category.replace(/\s+/g, '-').toLowerCase()}`] && (
                                    <button
                                        onClick={() => scroll('left', `category-${category.replace(/\s+/g, '-').toLowerCase()}`)}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-16 hover:bg-black/20 dark:hover:bg-white/10 flex items-center justify-center transition-all rounded-lg"
                                    >
                                        <svg className="w-3 h-8 text-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 31" fill="currentColor">
                                            <path d="M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.7 1.7 0 0 0 6.728.002a1.6 1.6 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.498L5.272 29.46Z" />
                                        </svg>
                                    </button>
                                )}
                                {showRightArrow[`category-${category.replace(/\s+/g, '-').toLowerCase()}`] && (
                                    <button
                                        onClick={() => scroll('right', `category-${category.replace(/\s+/g, '-').toLowerCase()}`)}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-16 hover:bg-black/20 dark:hover:bg-white/10 flex items-center justify-center transition-all rounded-lg"
                                    >
                                        <svg className="w-3 h-8 text-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 31" fill="currentColor" style={{ transform: 'scaleX(-1)' }}>
                                            <path d="M5.275 29.46a1.61 1.61 0 0 0 1.456 1.077c1.018 0 1.772-.737 1.772-1.737 0-.526-.277-1.186-.449-1.62l-4.68-11.912L8.05 3.363c.172-.442.45-1.116.45-1.625A1.7 1.7 0 0 0 6.728.002a1.6 1.6 0 0 0-1.456 1.09L.675 12.774c-.301.775-.677 1.744-.677 2.495 0 .754.376 1.705.677 2.498L5.272 29.46Z" />
                                        </svg>
                                    </button>
                                )}
                            
                                <div 
                                    id={`category-${category.replace(/\s+/g, '-').toLowerCase()}`} 
                                    className="overflow-x-auto overflow-hidden scrollbar-hide"
                                    onScroll={() => handleScroll(`category-${category.replace(/\s+/g, '-').toLowerCase()}`)}
                                >
                                <div className="flex gap-3" style={{ width: 'max-content' }}>
                                    {categoryCourses.map((course) => (
                                    <div 
                                        key={course.id} 
                                        className="relative group cursor-pointer w-[180px] flex-shrink-0" 
                                        onMouseEnter={() => setHoveredCard(course.id)}
                                        onMouseLeave={() => {
                                            setHoveredCard(null);
                                            setShowMenu(null);
                                        }}
                                    >
                                        {/* Course Thumbnail */}
                                        <div className="relative aspect-[2/3] overflow-hidden" onClick={() => handleCourseClick(course.id)} style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                            <Image
                                                src={course.thumbnail || '/placeholder.jpg'}
                                                alt={course.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                key={course.id}
                                            />
                                            {/* Three Dots Button - Apple TV Style */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(showMenu === course.id ? null : course.id);
                                                }}
                                                className={`absolute bottom-2 ${cardMenuPositionClass} w-7 h-7 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-10`}
                                            >
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                                                    <circle cx="3" cy="8" r="1.5"/>
                                                    <circle cx="8" cy="8" r="1.5"/>
                                                    <circle cx="13" cy="8" r="1.5"/>
                                                </svg>
                                            </button>

                                            {/* Actions Dropdown Menu */}
                                            {showMenu === course.id && (
                                                <div className={`absolute bottom-12 ${cardMenuPositionClass} bg-neutral-800/95 dark:bg-neutral-800/95 backdrop-blur-md overflow-hidden shadow-xl z-20 w-[140px]`} style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowMenu(null);
                                                        }}
                                                        className={`w-full px-3 py-2.5 ${dropdownTextAlign} text-[13px] text-white/90 dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
                                                    >
                                                        <span>Share</span>
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                                        </svg>
                                                    </button>
                                                    <div className="h-[0.5px] bg-white/10 mx-2"></div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(`${window.location.origin}/${locale}/courses/${course.id}`);
                                                            setShowMenu(null);
                                                        }}
                                                        className={`w-full px-3 py-2.5 ${dropdownTextAlign} text-[13px] text-white/90 dark:text-white/90 hover:bg-white/10 dark:hover:bg-white/10 transition-colors flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
                                                    >
                                                        <span>Copy Link</span>
                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Separator Line */}
                        <div className="max-w-screen-2xl mx-auto px-8 mt-8">
                            <div className="h-[1px] bg-white/10"></div>
                        </div>
                    </div>
                );
            })}

            {/* Hero Banner Component */}
            <div className="relative z-10 pb-8">
                <div className="max-w-screen-2xl mx-auto px-8">
                    <div className="relative overflow-hidden" style={{ height: '400px', borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                        {/* Background Image */}
                        <div className="absolute inset-0">
                            <Image
                                src="/images/courses/courses-hero.jpg"
                                alt="Courses Hero"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                            <div className={`absolute inset-0 ${isArabic ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/80 via-transparent to-transparent`} />
                        </div>

                        {/* Hero Content */}
                        <div className={`relative h-full px-8 flex flex-col justify-center ${isArabic ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-2xl space-y-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                                {/* Prime Logo */}
                                <div className="flex items-center gap-2 mb-2">
                                    <Image
                                        src="/images/logo.jpg"
                                        alt="Prime"
                                        width={32}
                                        height={32}
                                        className="rounded-lg"
                                    />
                                    <span className="text-white text-2xl font-semibold">Prime</span>
                                </div>
                                
                                {/* Title */}
                                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight" style={{ fontSize: '22px' }}>
                                    {isArabic ? 'عرض لفترة محدودة. €28.99/Mo For 12 Months' : 'Limited-time offer. €28.99/Mo For 12 Months'}
                                </h1>

                                {/* CTA Button */}
                                <div className={`flex items-center gap-3 pt-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <button 
                                        onClick={handleAcceptOffer}
                                        className="bg-white hover:bg-white/90 text-black font-semibold px-8 py-3 rounded-full transition-all"
                                    >
                                        {isArabic ? 'قبول العرض' : 'Accept Offer'}
                                    </button>
                                </div>

                                {/* Offer Details */}
                                <p className="text-xs text-white/70 leading-relaxed">
                                    {isArabic 
                                        ? '€28.99/Mo For 12 Months' 
                                        : '€28.99/Mo For 12 Months'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Separator Line */}
                <div className="max-w-screen-2xl mx-auto px-8 mt-8">
                    <div className="h-[1px] bg-white/10"></div>
                </div>


            </div>

            {/* Watch on the go Section */}
            <div className="relative z-10 pb-12 bg-white">
                <div className="max-w-screen-2xl mx-auto px-8">
                    <div className="text-center py-12">
                        <h2 className="text-4xl font-bold text-black mb-6">Watch on the go.</h2>
                        <a href="#" className="text-[#0071E3] hover:underline text-sm font-semibold inline-flex items-center gap-1">
                            See all the ways to watch Prime
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                        
                        {/* Device Icons */}
                        <div className="flex items-center justify-center gap-12 mt-12 flex-wrap">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <svg className="w-10 h-12" viewBox="0 0 40 48" fill="none" stroke="black" strokeWidth="1.5">
                                        <rect x="6" y="2" width="28" height="44" rx="4" />
                                        <line x1="6" y1="38" x2="34" y2="38" />
                                    </svg>
                                </div>
                                <span className="text-sm text-black">iPhone</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="black" strokeWidth="1.5">
                                        <rect x="4" y="6" width="40" height="36" rx="4" />
                                        <line x1="4" y1="36" x2="44" y2="36" />
                                    </svg>
                                </div>
                                <span className="text-sm text-black">iPad</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="black" strokeWidth="1.5">
                                        <rect x="2" y="8" width="44" height="28" rx="2" />
                                        <path d="M16 36 L20 36 L22 44 L26 44 L28 36 L32 36" />
                                    </svg>
                                </div>
                                <span className="text-sm text-black">Mac & Windows</span>
                            </div>

                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none" stroke="black" strokeWidth="1.5">
                                        <rect x="8" y="12" width="32" height="24" rx="2" />
                                        <path d="M24 36 L24 42" />
                                        <line x1="16" y1="42" x2="32" y2="42" />
                                    </svg>
                                </div>
                                <span className="text-sm text-black">AirPlay</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <svg className="w-10 h-12" viewBox="0 0 40 48" fill="none" stroke="black" strokeWidth="1.5">
                                        <rect x="6" y="2" width="28" height="44" rx="4" />
                                        <line x1="6" y1="38" x2="34" y2="38" />
                                    </svg>
                                </div>
                                <span className="text-sm text-black">Android</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 flex items-center justify-center">
                                    <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none" stroke="black" strokeWidth="1.5">
                                        <circle cx="20" cy="20" r="18" />
                                        <path d="M12 20 L18 26 L28 14" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                    </svg>
                                </div>
                                <span className="text-sm text-black">Web</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Separator Line */}
                <div className="max-w-screen-2xl mx-auto px-8 mt-8">
                    <div className="h-[1px] bg-black/10"></div>
                </div>
            </div>

            {/* Questions? Answers. Section */}
            <div className="relative z-10 pb-12 bg-white">
                <div className="max-w-4xl mx-auto px-8">
                    <h2 className="text-4xl font-bold text-black text-center mb-12">Questions? Answers.</h2>
                    
                    <div className="space-y-0">
                        {/* FAQ Item 1 */}
                        <div className="border-b border-black/10">
                            <button 
                                onClick={() => setExpandedFAQ(expandedFAQ === 0 ? null : 0)}
                                className="w-full py-6 flex items-center justify-between text-left hover:opacity-70 transition-opacity"
                            >
                                <span className="text-xl font-semibold text-black">What is Prime ?</span>
                                <svg className="w-4 h-2 text-black" viewBox="0 0 17 8.85">
                                    <polyline 
                                        stroke="currentColor" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        fill="none" 
                                        fillRule="evenodd" 
                                        points={expandedFAQ === 0 ? "15 7.72 8.5 1.13 2 7.72" : "15 1.13 8.5 7.72 2 1.13"}
                                        className="transition-all duration-300"
                                    />
                                </svg>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${expandedFAQ === 0 ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                                <p className="text-black/80 leading-relaxed">
                                    Prime is your gateway to exceptional learning experiences, featuring hundreds of exclusive courses and programs — from intensive language courses and professional development to entrepreneurial training and technical skills — with new content added weekly. Subscribe and access all courses on the Prime platform. Prime subscription includes unlimited access to all courses, live sessions, interactive tools, and community features.
                                </p>
                            </div>
                        </div>

                        {/* FAQ Item 2 */}
                        <div className="border-b border-black/10">
                            <button 
                                onClick={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
                                className="w-full py-6 flex items-center justify-between text-left hover:opacity-70 transition-opacity"
                            >
                                <span className="text-xl font-semibold text-black">How much does a Prime subscription cost?</span>
                                <svg className="w-4 h-2 text-black" viewBox="0 0 17 8.85">
                                    <polyline 
                                        stroke="currentColor" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        fill="none" 
                                        fillRule="evenodd" 
                                        points={expandedFAQ === 1 ? "15 7.72 8.5 1.13 2 7.72" : "15 1.13 8.5 7.72 2 1.13"}
                                        className="transition-all duration-300"
                                    />
                                </svg>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${expandedFAQ === 1 ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                                <p className="text-black/80 leading-relaxed">
                                    A Prime subscription costs €28.99/Mo for 12 months. You can cancel anytime and get access to all courses, live sessions, certificates, and premium features.
                                </p>
                            </div>
                        </div>

                        {/* FAQ Item 3 */}
                        <div className="border-b border-black/10">
                            <button 
                                onClick={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
                                className="w-full py-6 flex items-center justify-between text-left hover:opacity-70 transition-opacity"
                            >
                                <span className="text-xl font-semibold text-black">Can I get a Prime subscription for free?</span>
                                <svg className="w-4 h-2 text-black" viewBox="0 0 17 8.85">
                                    <polyline 
                                        stroke="currentColor" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        fill="none" 
                                        fillRule="evenodd" 
                                        points={expandedFAQ === 2 ? "15 7.72 8.5 1.13 2 7.72" : "15 1.13 8.5 7.72 2 1.13"}
                                        className="transition-all duration-300"
                                    />
                                </svg>
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ${expandedFAQ === 2 ? 'max-h-96 pb-6' : 'max-h-0'}`}>
                                <p className="text-black/80 leading-relaxed">
                                    Yes! New subscribers can try Prime free for 7 days. After that, it's €28.99/Mo for 12 months with full access to all courses and features.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                    scroll-snap-type: x mandatory;
                    scroll-padding: 2rem;
                }
                
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                .scrollbar-hide > div > div {
                    scroll-snap-align: start;
                }
                
                @media (max-width: 768px) {
                    .overflow-x-auto {
                        scroll-snap-type: x mandatory;
                        scroll-padding: 2rem;
                    }
                    
                    .overflow-x-auto > div > div {
                        scroll-snap-align: start;
                    }
                }
            `}</style>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                courseTitle={heroCourse.title}
                price="€28.99/Mo For 12 Months"
            />

            {/* Launching Soon Modal */}
            {showLaunchingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
                        {/* Close button */}
                        <button
                            onClick={() => setShowLaunchingModal(false)}
                            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Rocket Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-4xl">🚀</span>
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white text-center mb-3">
                            {getLocalizedText(
                                'Launching Soon!',
                                'قريباً!',
                                'Bald verfügbar!'
                            )}
                        </h2>

                        {/* Description */}
                        <p className="text-white/80 text-center mb-6">
                            {getLocalizedText(
                                'Sign up now to get 50% off when we launch!',
                                'سجل الآن واحصل على خصم 50% عند الإطلاق!',
                                'Melden Sie sich jetzt an und erhalten Sie 50% Rabatt beim Start!'
                            )}
                        </p>

                        {/* Offer Badge */}
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg py-3 px-6 rounded-full text-center mb-6">
                            {getLocalizedText(
                                '🎉 50% OFF Early Bird Offer!',
                                '🎉 عرض الحجز المبكر - خصم 50%!',
                                '🎉 50% Frühbucher-Rabatt!'
                            )}
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={handleLaunchingModalRegister}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            {getLocalizedText(
                                'Sign Up Now',
                                'سجل الآن',
                                'Jetzt anmelden'
                            )}
                        </button>

                        {/* Secondary text */}
                        <p className="text-white/50 text-sm text-center mt-4">
                            {getLocalizedText(
                                'Be the first to know when courses go live!',
                                'كن أول من يعلم عند إطلاق الدورات!',
                                'Seien Sie der Erste, der erfährt, wenn Kurse starten!'
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
}
