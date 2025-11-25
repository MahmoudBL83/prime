'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { Search, Play } from 'lucide-react';
import Image from 'next/image';
import { SignInModal } from '@/components/SignInModal';
import { PaymentModal } from '@/components/PaymentModal';

interface Course {
    id: string;
    title: string;
    titleAr?: string;
    category: string;
    thumbnail?: string;
    rating?: number;
    year?: number;
    duration?: string;
    description?: string;
    descriptionAr?: string;
}

// Mock courses data matching Apple TV style
const mockCourses: Course[] = [
    {
        id: 'lost-bus-german-survival',
        title: 'The Lost Bus',
        titleAr: 'الحافلة المفقودة',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        description: 'To save 22 children, they risk everything—including their lives. Inspired by a true story of survival.',
        descriptionAr: 'لإنقاذ 22 طفلاً، يخاطرون بكل شيء - بما في ذلك حياتهم. مستوحى من قصة حقيقية للبقاء على قيد الحياة.',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 22.43.43_7cec6116.jpg'
    },
    {
        id: 'pluribus-drama-relationships',
        title: 'Pluribus',
        titleAr: 'بلوريبوس',
        category: 'Freelance & Side Hustle',
        rating: 4.5,
        year: 2024,
        duration: '4 months',
        description: 'A compelling drama series exploring complex human relationships.',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/between.png'
    },
    {
        id: 'high-potential-entrepreneur',
        title: 'High Potential',
        titleAr: 'إمكانات عالية',
        category: 'Entrepreneurship',
        rating: 4.6,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/first launch.png'
    },
    {
        id: 'morning-show-trading',
        title: 'Morning Show',
        titleAr: 'برنامج الصباح',
        category: 'Trading',
        rating: 4.7,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'ted-lasso-coding-ai',
        title: 'Ted Lasso',
        titleAr: 'تيد لاسو',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.11_07d95353.jpg'
    },
    {
        id: 'slow-horses-german-integration',
        title: 'Slow Horses',
        titleAr: 'الخيول البطيئة',
        category: 'German Integration',
        rating: 4.8,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_973f42cd.jpg'
    },
    {
        id: 'severance-german-advanced',
        title: 'Severance',
        titleAr: 'الفصل',
        category: 'German Language',
        rating: 4.9,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 23.38.13_cf3432e6.jpg'
    },
    {
        id: 'foundation-freelance-mastery',
        title: 'Foundation',
        titleAr: 'الأساس',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        year: 2024,
        duration: '8 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/driving deliveries in berlin.png'
    },
    {
        id: 'invasion-startup-growth',
        title: 'Invasion',
        titleAr: 'الغزو',
        category: 'Entrepreneurship',
        rating: 4.5,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/investor room 101.png'
    },
    {
        id: 'master-trader-pro',
        title: 'Master Trader',
        titleAr: 'المتداول المحترف',
        category: 'Trading',
        rating: 4.8,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.14_770af3af.jpg'
    },
    {
        id: 'ai-revolution-machine-learning',
        title: 'AI Revolution',
        titleAr: 'ثورة الذكاء الاصطناعي',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '7 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.13_c74bbc50.jpg'
    },
    {
        id: 'german-life-culture',
        title: 'German Life',
        titleAr: 'الحياة الألمانية',
        category: 'German Integration',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_d9d3d1dd.jpg'
    },
    {
        id: 'python-mastery',
        title: 'Python Mastery',
        titleAr: 'إتقان بايثون',
        category: 'Coding & AI',
        rating: 4.8,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg'
    },
    {
        id: 'freelance-success',
        title: 'Freelance Success',
        titleAr: 'نجاح العمل الحر',
        category: 'Freelance & Side Hustle',
        rating: 4.6,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/E-Commerce Day One.png'
    },
    {
        id: 'startup-funding',
        title: 'Startup Funding',
        titleAr: 'تمويل الشركات الناشئة',
        category: 'Entrepreneurship',
        rating: 4.7,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.14_9bb85000.jpg'
    },
    {
        id: 'forex-trading-pro',
        title: 'Forex Trading Pro',
        titleAr: 'احترافية تداول العملات',
        category: 'Trading',
        rating: 4.9,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'german-b2-course',
        title: 'German B2 Course',
        titleAr: 'دورة الألمانية B2',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '7 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.30.27_09d6241b.jpg'
    },
    {
        id: 'web-development-bootcamp',
        title: 'Web Development Bootcamp',
        titleAr: 'معسكر تطوير الويب',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '8 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.11_07d95353.jpg'
    },
    {
        id: 'content-creation-mastery',
        title: 'Content Creation Mastery',
        titleAr: 'إتقان إنشاء المحتوى',
        category: 'Freelance & Side Hustle',
        rating: 4.5,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/SKILL INTO INCOME.png'
    },
    {
        id: 'business-growth-strategies',
        title: 'Business Growth Strategies',
        titleAr: 'استراتيجيات نمو الأعمال',
        category: 'Entrepreneurship',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.15_34d01093.jpg'
    },
    {
        id: 'crypto-trading-fundamentals',
        title: 'Crypto Trading Fundamentals',
        titleAr: 'أساسيات تداول العملات المشفرة',
        category: 'Trading',
        rating: 4.6,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.14_770af3af.jpg'
    },
    {
        id: 'german-citizenship-prep',
        title: 'German Citizenship Prep',
        titleAr: 'التحضير للجنسية الألمانية',
        category: 'German Integration',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.14_39554e98.jpg'
    },
    {
        id: 'machine-learning-basics',
        title: 'Machine Learning Basics',
        titleAr: 'أساسيات تعلم الآلة',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '7 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.13_c74bbc50.jpg'
    },
    {
        id: 'digital-marketing-blueprint',
        title: 'Digital Marketing Blueprint',
        titleAr: 'مخطط التسويق الرقمي',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'scaling-your-startup',
        title: 'Scaling Your Startup',
        titleAr: 'توسيع شركتك الناشئة',
        category: 'Entrepreneurship',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg'
    },
    {
        id: 'day-trading-mastery',
        title: 'Day Trading Mastery',
        titleAr: 'إتقان التداول اليومي',
        category: 'Trading',
        rating: 4.9,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'german-c1-advanced',
        title: 'German C1 Advanced',
        titleAr: 'الألمانية C1 متقدم',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '8 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.11_b498b0d9.jpg'
    },
    {
        id: 'full-stack-developer',
        title: 'Full Stack Developer',
        titleAr: 'مطور متكامل',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '10 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg'
    },
    {
        id: 'freelance-graphic-design',
        title: 'Freelance Graphic Design',
        titleAr: 'التصميم الجرافيكي الحر',
        category: 'Freelance & Side Hustle',
        rating: 4.6,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_2ac19e78.jpg'
    },
    {
        id: 'ecommerce-empire',
        title: 'E-commerce Empire',
        titleAr: 'إمبراطورية التجارة الإلكترونية',
        category: 'Entrepreneurship',
        rating: 4.7,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/first launch.png'
    },
    {
        id: 'options-trading-advanced',
        title: 'Options Trading Advanced',
        titleAr: 'تداول الخيارات المتقدم',
        category: 'Trading',
        rating: 4.8,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.14_770af3af.jpg'
    }
];

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [mouseStart, setMouseStart] = useState<number | null>(null);
    const [mouseEnd, setMouseEnd] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});
    const [showLeftArrow, setShowLeftArrow] = useState<{ [key: string]: boolean }>({});
    const [showRightArrow, setShowRightArrow] = useState<{ [key: string]: boolean }>({});
    const router = useRouter();
    const { data: session } = useSession();
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';
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

    useEffect(() => {
        setCourses(mockCourses);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
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

    const heroCourse = courses[heroIndex] || mockCourses[0];

    const handleCourseClick = (courseId: string) => {
        router.push(`/${locale}/courses/${courseId}`);
    };

    const handleAcceptOffer = () => {
        if (session) {
            setShowPaymentModal(true);
        } else {
            setShowSignInModal(true);
        }
    };

    const handleSignInSuccess = () => {
        setShowSignInModal(false);
        setShowPaymentModal(true);
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
        <div dir={direction} className="min-h-screen bg-background">
            

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
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
                </div>

                {/* Hero Content */}
                <div className={`relative h-full max-w-screen-2xl mx-auto px-8 flex flex-col justify-end pb-16 ${isArabic ? 'items-end' : ''}`}>
                    <div className={`max-w-xl space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {/* Title */}
                        <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                            {isArabic && heroCourse.titleAr ? heroCourse.titleAr : heroCourse.title}
                        </h1>
                        
                        {/* Metadata - Movies • Thriller • Drama • 18+ */}
                        <div className={`flex items-center text-sm text-white/90 gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                                <span className="font-medium">{heroCourse.category}</span>
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
                            {isArabic && heroCourse.descriptionAr 
                                ? heroCourse.descriptionAr 
                                : heroCourse.description}
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
                            EGP 59.99/month for the first<br />
                            <span className="font-medium">6 months</span>, then EGP 119.99/month
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
                            {courses.slice(0, 8).map((course, index) => (
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
                                        {category}
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
                                {/* Apple TV Logo */}
                                <div className="flex items-center gap-1 mb-2">
                                    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="white">
                                        <path d="M22.184 8.82c-1.44 0-2.736.68-3.64.68-.944 0-2.4-.72-3.944-.72-3.04 0-6.4 2.52-6.4 7.28 0 4.64 3.68 9.84 6.68 9.84 1.32 0 2.32-.68 3.4-.68 1.04 0 2.08.72 3.52.72 2.88 0 5.2-4.72 5.2-4.84-.12 0-4.04-1.56-4.04-5.84 0-3.72 3.04-5.48 3.16-5.6-1.96-2.84-4.92-2.84-4.92-2.84zm-1.6-2.68c.96-1.16 1.68-2.76 1.44-4.4-1.52.08-3.32 1.04-4.36 2.28-.88 1.04-1.72 2.68-1.44 4.24 1.68.12 3.4-.84 4.36-2.12z"/>
                                    </svg>
                                    <span className="text-white text-2xl font-semibold">tv+</span>
                                </div>
                                
                                {/* Title */}
                                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight" style={{ fontSize: '22px' }}>
                                    {isArabic ? 'عرض لفترة محدودة. 59.99 جنيه مصري / شهر لمدة 6 أشهر' : 'Limited-time offer. $59.99/mo for 6 months.'}
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
                                        ? 'EGP 59.99/شهر للـ 6 أشهر الأولى، ثم EGP 119.99/شهر' 
                                        : '$59.99/month for the first 6 months, then $119.99/month'}
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

            {/* Sign In Modal */}
            <SignInModal
                isOpen={showSignInModal}
                onClose={() => setShowSignInModal(false)}
                onSignInSuccess={handleSignInSuccess}
                locale={locale}
            />

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                courseTitle={heroCourse.title}
                price="EGP 59.99/month for the first 6 months, then EGP 119.99/month"
            />
        </div>
    );
}
