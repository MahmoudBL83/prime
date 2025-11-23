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
        thumbnail: '/images/courses/apple1.jpg'
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
        thumbnail: '/images/courses/apple2.jpg'
    },
    {
        id: 'high-potential-entrepreneur',
        title: 'High Potential',
        titleAr: 'إمكانات عالية',
        category: 'Entrepreneurship',
        rating: 4.6,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/apple3.jpg'
    },
    {
        id: 'morning-show-trading',
        title: 'Morning Show',
        titleAr: 'برنامج الصباح',
        category: 'Trading',
        rating: 4.7,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/apple4.jpg'
    },
    {
        id: 'ted-lasso-coding-ai',
        title: 'Ted Lasso',
        titleAr: 'تيد لاسو',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/apple5.jpg'
    },
    {
        id: 'slow-horses-german-integration',
        title: 'Slow Horses',
        titleAr: 'الخيول البطيئة',
        category: 'German Integration',
        rating: 4.8,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/apple6.jpg'
    },
    {
        id: 'severance-german-advanced',
        title: 'Severance',
        titleAr: 'الفصل',
        category: 'German Language',
        rating: 4.9,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/apple7.jpg'
    },
    {
        id: 'foundation-freelance-mastery',
        title: 'Foundation',
        titleAr: 'الأساس',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        year: 2024,
        duration: '8 months',
        thumbnail: '/images/courses/apple8.jpg'
    },
    {
        id: 'invasion-startup-growth',
        title: 'Invasion',
        titleAr: 'الغزو',
        category: 'Entrepreneurship',
        rating: 4.5,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/apple9.jpg'
    },
    {
        id: 'master-trader-pro',
        title: 'Master Trader',
        titleAr: 'المتداول المحترف',
        category: 'Trading',
        rating: 4.8,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/apple10.jpg'
    },
    {
        id: 'ai-revolution-machine-learning',
        title: 'AI Revolution',
        titleAr: 'ثورة الذكاء الاصطناعي',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '7 months',
        thumbnail: '/images/courses/apple1.jpg'
    },
    {
        id: 'german-life-culture',
        title: 'German Life',
        titleAr: 'الحياة الألمانية',
        category: 'German Integration',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/apple2.jpg'
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
    const router = useRouter();
    const { data: session } = useSession();
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';

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

    return (
        <div className="min-h-screen pt-" style={{ backgroundColor: '#1f1f1f' }}>
            {/* Hero Section - Featured Course */}
            <div 
                className="relative h-[70vh] w-full overflow-hidden mb-20"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
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
                <div className="relative h-full max-w-screen-2xl mx-auto px-8 flex flex-col justify-end pb-16">
                    <div className="max-w-xl space-y-3">
                        {/* Title */}
                        <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                            {isArabic && heroCourse.titleAr ? heroCourse.titleAr : heroCourse.title}
                        </h1>
                        
                        {/* Metadata - Movies • Thriller • Drama • 18+ */}
                        <div className="flex items-center space-x-3 text-sm text-white/90">
                            <div className="flex items-center space-x-1">
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
                        <div className="flex items-center space-x-3 pt-2">
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
                            <button className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all backdrop-blur-sm">
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
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
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
                    <div className="flex items-center space-x-2 mb-4">
                        <h2 className="text-xl font-semibold text-white">
                            Top 10 TV Shows
                        </h2>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    
                    <div className="overflow-x-auto scrollbar-hide -mx-8 px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 min-w-max md:min-w-0">
                            {courses.slice(0, 8).map((course, index) => (
                            <div 
                                key={course.id} 
                                className="relative group cursor-pointer" 
                                onMouseEnter={() => setHoveredCard(course.id)}
                                onMouseLeave={() => {
                                    setHoveredCard(null);
                                    setShowMenu(null);
                                }}
                            >
                                {/* Rank Number */}
                                <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 text-9xl font-black text-white/10 group-hover:text-white/20 transition-all z-0 pointer-events-none select-none" style={{ 
                                    WebkitTextStroke: '2px rgba(255,255,255,0.3)',
                                    textShadow: '0 0 20px rgba(0,0,0,0.8)'
                                }}>
                                    {index + 1}
                                </div>
                                
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
                                        className="absolute bottom-2 right-2 w-7 h-7 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-10"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                                            <circle cx="3" cy="8" r="1.5"/>
                                            <circle cx="8" cy="8" r="1.5"/>
                                            <circle cx="13" cy="8" r="1.5"/>
                                        </svg>
                                    </button>

                                    {/* Actions Dropdown Menu */}
                                    {showMenu === course.id && (
                                        <div className="absolute bottom-12 right-2 bg-neutral-800/95 backdrop-blur-md overflow-hidden shadow-xl z-20 w-[140px]" style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowMenu(null);
                                                }}
                                                className="w-full px-3 py-2.5 text-left text-[13px] text-white/90 hover:bg-white/10 transition-colors flex items-center justify-between"
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
                                                className="w-full px-3 py-2.5 text-left text-[13px] text-white/90 hover:bg-white/10 transition-colors flex items-center justify-between"
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
                            <div className="flex items-center space-x-2 mb-4">
                                <h2 className="text-xl font-semibold text-white">
                                    {category}
                                </h2>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            
                            <div className="overflow-x-auto scrollbar-hide -mx-8 px-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 min-w-max md:min-w-0">
                                    {categoryCourses.map((course) => (
                                    <div 
                                        key={course.id} 
                                        className="relative group cursor-pointer" 
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
                                                className="absolute bottom-2 right-2 w-7 h-7 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-10"
                                            >
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                                                    <circle cx="3" cy="8" r="1.5"/>
                                                    <circle cx="8" cy="8" r="1.5"/>
                                                    <circle cx="13" cy="8" r="1.5"/>
                                                </svg>
                                            </button>

                                            {/* Actions Dropdown Menu */}
                                            {showMenu === course.id && (
                                                <div className="absolute bottom-12 right-2 bg-neutral-800/95 backdrop-blur-md overflow-hidden shadow-xl z-20 w-[140px]" style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowMenu(null);
                                                        }}
                                                        className="w-full px-3 py-2.5 text-left text-[13px] text-white/90 hover:bg-white/10 transition-colors flex items-center justify-between"
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
                                                        className="w-full px-3 py-2.5 text-left text-[13px] text-white/90 hover:bg-white/10 transition-colors flex items-center justify-between"
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
                        
                        {/* Separator Line */}
                        <div className="max-w-screen-2xl mx-auto px-8 mt-8">
                            <div className="h-[1px] bg-white/10"></div>
                        </div>
                    </div>
                );
            })}

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
                }
                
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
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
