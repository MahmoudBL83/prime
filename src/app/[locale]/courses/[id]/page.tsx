'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { Play, Plus, Clock, Star, Check } from 'lucide-react';
import Image from 'next/image';
import { SignInModal } from '@/components/SignInModal';
import { PaymentModal } from '@/components/PaymentModal';
import { toast } from 'react-hot-toast';

interface Episode {
    id: string;
    number: number;
    title: string;
    titleAr?: string;
    description: string;
    descriptionAr?: string;
    duration: string;
    thumbnail: string;
}

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
    episodes?: Episode[];
}

// Course data mapping by ID
const coursesData: { [key: string]: Course } = {
    'lost-bus-german-survival': {
        id: 'lost-bus-german-survival',
        title: 'The Lost Bus',
        titleAr: 'الحافلة المفقودة',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        description: 'To save 22 children, they risk everything—including their lives. Inspired by a true story of survival.',
        descriptionAr: 'لإنقاذ 22 طفلاً، يخاطرون بكل شيء - بما في ذلك حياتهم. مستوحى من قصة حقيقية للبقاء على قيد الحياة.',
        thumbnail: '/images/courses/apple1.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'Blue Skies',
                titleAr: 'السماء الزرقاء',
                description: 'An unprecedented emergency sends Fairbanks into lockdown. Frank gathers...',
                descriptionAr: 'حالة طوارئ غير مسبوقة تدخل فيربانكس في حالة إغلاق. فرانك يجمع...',
                duration: '1h',
                thumbnail: '/images/courses/apple1.jpg'
            },
            {
                id: '2',
                number: 2,
                title: 'Wind of Change',
                titleAr: 'رياح التغيير',
                description: 'Luke tries to get back home as the manhunt for Havlock intensifies. Frank weighs...',
                descriptionAr: 'يحاول لوك العودة إلى المنزل بينما تشتد عملية مطاردة هافلوك. فرانك يزن...',
                duration: '55 min',
                thumbnail: '/images/courses/apple1.jpg'
            },
            {
                id: '3',
                number: 3,
                title: 'Cougar as F**k',
                titleAr: 'كوجر كما F**k',
                description: 'Sarah\'s disappearance adds urgency to Frank\'s search. Havlock\'s master plan tak...',
                descriptionAr: 'اختفاء سارة يضيف إلحاحًا لبحث فرانك. خطة هافلوك الرئيسية تأخذ...',
                duration: '1h 1 min',
                thumbnail: '/images/courses/apple1.jpg'
            },
            {
                id: '4',
                number: 4,
                title: 'American Dream',
                titleAr: 'الحلم الأمريكي',
                description: 'A state trooper goes missing, widening Frank\'s investigation. Armed locals join th...',
                descriptionAr: 'يختفي جندي الولاية، مما يوسع تحقيق فرانك. المحليون المسلحون ينضمون...',
                duration: '55 min',
                thumbnail: '/images/courses/apple1.jpg'
            },
            {
                id: '5',
                number: 5,
                title: 'Arnaq',
                titleAr: 'أرناق',
                description: 'Frank focuses on tracking down Luke. The CIA\'s involvement ramps up as Havlock\'s...',
                descriptionAr: 'يركز فرانك على تتبع لوك. تتصاعد مشاركة وكالة المخابرات المركزية حيث هافلوك...',
                duration: '52 min',
                thumbnail: '/images/courses/apple1.jpg'
            }
        ]
    },
    'pluribus-drama-relationships': {
        id: 'pluribus-drama-relationships',
        title: 'Pluribus',
        titleAr: 'بلوريبوس',
        category: 'Freelance & Side Hustle',
        rating: 4.5,
        year: 2024,
        duration: '4 months',
        description: 'A compelling drama series exploring complex human relationships.',
        descriptionAr: 'مسلسل دراما مقنع يستكشف العلاقات الإنسانية المعقدة.',
        thumbnail: '/images/courses/apple2.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'Pilot',
                titleAr: 'الحلقة التجريبية',
                description: 'Introduction to the complex world of relationships...',
                descriptionAr: 'مقدمة لعالم العلاقات المعقد...',
                duration: '58 min',
                thumbnail: '/images/courses/apple2.jpg'
            },
            {
                id: '2',
                number: 2,
                title: 'Connections',
                titleAr: 'الاتصالات',
                description: 'Deepening bonds and hidden secrets emerge...',
                descriptionAr: 'تعميق الروابط وظهور الأسرار الخفية...',
                duration: '55 min',
                thumbnail: '/images/courses/apple2.jpg'
            }
        ]
    },
    'severance-german-advanced': {
        id: 'severance-german-advanced',
        title: 'Severance',
        titleAr: 'الفصل',
        category: 'German Language',
        rating: 4.9,
        year: 2024,
        duration: '6 months',
        description: 'Advanced German language course with immersive content.',
        descriptionAr: 'دورة متقدمة في اللغة الألمانية مع محتوى غامر.',
        thumbnail: '/images/courses/apple7.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'Advanced Grammar',
                titleAr: 'القواعد المتقدمة',
                description: 'Complex German grammar structures...',
                descriptionAr: 'هياكل القواعد الألمانية المعقدة...',
                duration: '1h 5min',
                thumbnail: '/images/courses/apple7.jpg'
            }
        ]
    },
    'foundation-freelance-mastery': {
        id: 'foundation-freelance-mastery',
        title: 'Foundation',
        titleAr: 'الأساس',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        year: 2024,
        duration: '8 months',
        description: 'Build your freelance career from the ground up.',
        descriptionAr: 'ابن حياتك المهنية المستقلة من الصفر.',
        thumbnail: '/images/courses/apple8.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'Getting Started',
                titleAr: 'البداية',
                description: 'First steps in freelancing...',
                descriptionAr: 'الخطوات الأولى في العمل الحر...',
                duration: '1h',
                thumbnail: '/images/courses/apple8.jpg'
            }
        ]
    },
    'ted-lasso-coding-ai': {
        id: 'ted-lasso-coding-ai',
        title: 'Ted Lasso',
        titleAr: 'تيد لاسو',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '3 months',
        description: 'Master AI and coding with this comprehensive course.',
        descriptionAr: 'أتقن الذكاء الاصطناعي والبرمجة مع هذه الدورة الشاملة.',
        thumbnail: '/images/courses/apple5.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'AI Fundamentals',
                titleAr: 'أساسيات الذكاء الاصطناعي',
                description: 'Introduction to artificial intelligence...',
                descriptionAr: 'مقدمة للذكاء الاصطناعي...',
                duration: '50 min',
                thumbnail: '/images/courses/apple5.jpg'
            }
        ]
    },
    'slow-horses-german-integration': {
        id: 'slow-horses-german-integration',
        title: 'Slow Horses',
        titleAr: 'الخيول البطيئة',
        category: 'German Integration',
        rating: 4.8,
        year: 2024,
        duration: '5 months',
        description: 'Complete guide to German integration and culture.',
        descriptionAr: 'دليل كامل للاندماج والثقافة الألمانية.',
        thumbnail: '/images/courses/apple6.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'Culture Basics',
                titleAr: 'أساسيات الثقافة',
                description: 'Understanding German culture...',
                descriptionAr: 'فهم الثقافة الألمانية...',
                duration: '1h 10min',
                thumbnail: '/images/courses/apple6.jpg'
            }
        ]
    },
    'morning-show-trading': {
        id: 'morning-show-trading',
        title: 'Morning Show',
        titleAr: 'برنامج الصباح',
        category: 'Trading',
        rating: 4.7,
        year: 2024,
        duration: '6 months',
        description: 'Learn professional trading strategies and techniques.',
        descriptionAr: 'تعلم استراتيجيات وتقنيات التداول الاحترافية.',
        thumbnail: '/images/courses/apple4.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'Trading Basics',
                titleAr: 'أساسيات التداول',
                description: 'Introduction to trading markets...',
                descriptionAr: 'مقدمة لأسواق التداول...',
                duration: '1h 15min',
                thumbnail: '/images/courses/apple4.jpg'
            }
        ]
    },
    'ai-revolution-machine-learning': {
        id: 'ai-revolution-machine-learning',
        title: 'AI Revolution',
        titleAr: 'ثورة الذكاء الاصطناعي',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '7 months',
        description: 'Deep dive into machine learning and AI technologies.',
        descriptionAr: 'غوص عميق في تعلم الآلة وتقنيات الذكاء الاصطناعي.',
        thumbnail: '/images/courses/apple1.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'ML Introduction',
                titleAr: 'مقدمة تعلم الآلة',
                description: 'Getting started with machine learning...',
                descriptionAr: 'البدء في تعلم الآلة...',
                duration: '1h 20min',
                thumbnail: '/images/courses/apple1.jpg'
            }
        ]
    },
    'german-life-culture': {
        id: 'german-life-culture',
        title: 'German Life',
        titleAr: 'الحياة الألمانية',
        category: 'German Integration',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        description: 'Experience authentic German life and traditions.',
        descriptionAr: 'تجربة الحياة والتقاليد الألمانية الأصيلة.',
        thumbnail: '/images/courses/apple2.jpg',
        episodes: [
            {
                id: '1',
                number: 1,
                title: 'Daily Life',
                titleAr: 'الحياة اليومية',
                description: 'Understanding German daily routines...',
                descriptionAr: 'فهم الروتين اليومي الألماني...',
                duration: '55 min',
                thumbnail: '/images/courses/apple2.jpg'
            }
        ]
    }
};

export default function CourseDetailPage() {
    const [course, setCourse] = useState<Course | null>(null);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isInList, setIsInList] = useState(false);
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession();
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';

    useEffect(() => {
        // Get course by ID from params
        const courseId = params.id as string;
        const foundCourse = coursesData[courseId];
        if (foundCourse) {
            setCourse(foundCourse);
        } else {
            // Fallback to first course if ID not found
            setCourse(coursesData['lost-bus-german-survival']);
        }
    }, [params.id]);

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

    const handleAddToList = async () => {
        if (!session) {
            setShowSignInModal(true);
            return;
        }

        try {
            // Toggle the list state
            const newState = !isInList;
            setIsInList(newState);

            // TODO: Make API call to add/remove from user's list
            // await fetch('/api/user/list', {
            //     method: newState ? 'POST' : 'DELETE',
            //     body: JSON.stringify({ courseId: course?.id })
            // });

            toast.success(
                newState 
                    ? (isArabic ? 'تمت الإضافة إلى قائمتك' : 'Added to your list')
                    : (isArabic ? 'تمت الإزالة من قائمتك' : 'Removed from your list'),
                {
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }
            );
        } catch (error) {
            console.error('Error updating list:', error);
            toast.error(
                isArabic ? 'حدث خطأ' : 'Something went wrong',
                {
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }
            );
        }
    };

    if (!course) {
        return <div className="min-h-screen" style={{ backgroundColor: '#1f1f1f' }} />;
    }

    return (
        <div className="min-h-screen pt-" style={{ backgroundColor: '#1f1f1f' }}>
            {/* Hero Section */}
            <div className="relative h-screen w-full overflow-hidden mb-12">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src={course.thumbnail || '/placeholder.jpg'}
                        alt={course.title}
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #1f1f1f, rgba(31, 31, 31, 0.6), transparent)' }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(31, 31, 31, 0.8), transparent, transparent)' }} />
                </div>

                {/* Hero Content */}
                <div className="relative h-full max-w-screen-2xl mx-auto px-8 flex flex-col justify-end pb-16">
                    <div className="max-w-xl space-y-3">
                        {/* Title */}
                        <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                            {isArabic && course.titleAr ? course.titleAr : course.title}
                        </h1>
                        
                        {/* Metadata */}
                        <div className="flex items-center space-x-3 text-sm text-white/90">
                            <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                                <span className="font-medium">{course.category}</span>
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
                            {isArabic && course.descriptionAr 
                                ? course.descriptionAr 
                                : course.description}
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
                                <Play className="w-5 h-5" fill="currentColor" />
                                Play
                            </button>
                            <button 
                                onClick={handleAddToList}
                                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all backdrop-blur-sm"
                            >
                                {isInList ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : (
                                    <Plus className="w-5 h-5 text-white" />
                                )}
                            </button>
                        </div>

                        {/* Offer Text */}
                        <p className="text-xs text-white/70 pt-1 leading-relaxed">
                            EGP 59.99/month for the first<br />
                            <span className="font-medium">6 months</span>, then EGP 119.99/month
                        </p>
                    </div>
                </div>
            </div>

            {/* Episodes Section */}
            <div className="max-w-screen-2xl mx-auto px-8 pb-20">
                {/* Season Selector */}
                <div className="flex items-center space-x-2 mb-6">
                    <h2 className="text-2xl font-semibold text-white">
                        Season {selectedSeason}
                    </h2>
                </div>

                {/* Episodes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {course.episodes?.map((episode) => (
                        <div
                            key={episode.id}
                            className="relative group cursor-pointer"
                            onClick={handleAcceptOffer}
                            onMouseEnter={() => setShowMenu(null)}
                        >
                            {/* Episode Thumbnail */}
                            <div className="relative aspect-video overflow-hidden mb-3" style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                <Image
                                    src={episode.thumbnail}
                                    alt={episode.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                
                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                                        <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
                                    </div>
                                </div>

                                {/* Duration Badge */}
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded">
                                    {episode.duration}
                                </div>

                                {/* Three Dots Menu */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowMenu(showMenu === episode.id ? null : episode.id);
                                    }}
                                    className="absolute top-2 right-2 w-7 h-7 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center transition-all z-10"
                                >
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 16 16">
                                        <circle cx="3" cy="8" r="1.5"/>
                                        <circle cx="8" cy="8" r="1.5"/>
                                        <circle cx="13" cy="8" r="1.5"/>
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {showMenu === episode.id && (
                                    <div className="absolute top-12 right-2 bg-neutral-800/95 backdrop-blur-md overflow-hidden shadow-xl z-20 w-[140px]" style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAcceptOffer();
                                                setShowMenu(null);
                                            }}
                                            className="w-full px-3 py-2.5 text-left text-[13px] text-white/90 hover:bg-white/10 transition-colors"
                                        >
                                            Play
                                        </button>
                                        <div className="h-[0.5px] bg-white/10 mx-2"></div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToList();
                                                setShowMenu(null);
                                            }}
                                            className="w-full px-3 py-2.5 text-left text-[13px] text-white/90 hover:bg-white/10 transition-colors flex items-center justify-between"
                                        >
                                            <span>{isInList ? 'Remove from List' : 'Add to List'}</span>
                                            {isInList && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Episode Info */}
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2 text-white/60 text-xs">
                                    <span>EPISODE {episode.number}</span>
                                </div>
                                <h3 className="text-white font-semibold text-sm leading-tight">
                                    {isArabic && episode.titleAr ? episode.titleAr : episode.title}
                                </h3>
                                <p className="text-white/70 text-xs leading-relaxed line-clamp-2">
                                    {isArabic && episode.descriptionAr ? episode.descriptionAr : episode.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Separator Line */}
            <div className="max-w-screen-2xl mx-auto px-8 pb-8">
                <div className="h-[1px] bg-white/10"></div>
            </div>

            {/* Related Courses Section */}
            <div className="max-w-screen-2xl mx-auto px-8 pb-12">
                <div className="flex items-center space-x-2 mb-4">
                    <h2 className="text-xl font-semibold text-white">
                        You Might Also Like
                    </h2>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {[
                        { id: 'pluribus-drama-relationships', title: 'Pluribus', thumbnail: '/images/courses/apple2.jpg' },
                        { id: 'severance-german-advanced', title: 'Severance', thumbnail: '/images/courses/apple7.jpg' },
                        { id: 'foundation-freelance-mastery', title: 'Foundation', thumbnail: '/images/courses/apple8.jpg' },
                        { id: 'ted-lasso-coding-ai', title: 'Ted Lasso', thumbnail: '/images/courses/apple5.jpg' },
                        { id: 'slow-horses-german-integration', title: 'Slow Horses', thumbnail: '/images/courses/apple6.jpg' },
                        { id: 'morning-show-trading', title: 'Morning Show', thumbnail: '/images/courses/apple4.jpg' },
                        { id: 'ai-revolution-machine-learning', title: 'AI Revolution', thumbnail: '/images/courses/apple1.jpg' },
                        { id: 'german-life-culture', title: 'German Life', thumbnail: '/images/courses/apple2.jpg' }
                    ].map((related) => (
                        <div
                            key={related.id}
                            className="relative group cursor-pointer"
                            onClick={() => router.push(`/${locale}/courses/${related.id}`)}
                        >
                            <div className="relative aspect-[2/3] overflow-hidden" style={{ borderRadius: '14px', border: '1px solid hsla(0,0%,100%,.16)' }}>
                                <Image
                                    src={related.thumbnail}
                                    alt={related.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Separator Line */}
            <div className="max-w-screen-2xl mx-auto px-8 pb-8">
                <div className="h-[1px] bg-white/10"></div>
            </div>

            {/* About Section */}
            <div className="max-w-screen-2xl mx-auto px-8 pb-20">
                <h2 className="text-xl font-semibold text-white mb-6">About</h2>
                
                <div className="bg-neutral-900/50 rounded-2xl p-8 space-y-8">
                    {/* Course Description */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-2">{course.title}</h3>
                        <p className="text-white/70 text-sm uppercase tracking-wide mb-3">{course.category}</p>
                        <p className="text-white/80 text-sm leading-relaxed">
                            {isArabic && course.descriptionAr ? course.descriptionAr : course.description}
                        </p>
                    </div>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Information Column */}
                        <div className="space-y-4">
                            <h4 className="text-white font-semibold text-sm">Information</h4>
                            
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-white/60 mb-1">Released</p>
                                    <p className="text-white">{course.year}</p>
                                </div>
                                
                                <div>
                                    <p className="text-white/60 mb-1">Run Time</p>
                                    <p className="text-white">{course.duration}</p>
                                </div>
                                
                                <div>
                                    <p className="text-white/60 mb-1">Rated</p>
                                    <p className="text-white">R</p>
                                </div>
                                
                                <div>
                                    <p className="text-white/60 mb-1">Region of Origin</p>
                                    <p className="text-white">United States</p>
                                </div>
                            </div>
                        </div>

                        {/* Languages Column */}
                        <div className="space-y-4">
                            <h4 className="text-white font-semibold text-sm">Languages</h4>
                            
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-white/60 mb-1">Original Audio</p>
                                    <p className="text-white">English</p>
                                </div>
                                
                                <div>
                                    <p className="text-white/60 mb-1">Audio</p>
                                    <p className="text-white/80 leading-relaxed">
                                        English (AD, AAC, Dolby Atmos, Dolby 5.1), French (Canada) (AD, AAC, Dolby Atmos, Dolby 5.1), French (France) (AD, AAC, Dolby Atmos, Dolby 5.1), German (AD, AAC, Dolby Atmos, Dolby 5.1), Italian (AD, AAC, Dolby Atmos, Dolby 5.1)
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-white/60 mb-1">Subtitles</p>
                                    <p className="text-white/80 leading-relaxed">
                                        English (CC, SDH), Arabic (SDH), Bulgarian (SDH), Cantonese, Traditional (SDH), Chinese, Simplified (SDH), Chinese, Traditional (SDH), Czech (SDH), Danish (SDH), Dutch (SDH), Estonian (SDH), Finnish (SDH), French (Canada) (SDH), French (France) (SDH), German (SDH), Greek (SDH)...
                                        <button className="text-blue-500 hover:text-blue-400 ml-2">MORE</button>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Accessibility Column */}
                        <div className="space-y-4">
                            <h4 className="text-white font-semibold text-sm">Accessibility</h4>
                            
                            <div className="space-y-3 text-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] font-semibold rounded">CC</span>
                                        <p className="text-white/60">Closed Captions</p>
                                    </div>
                                    <p className="text-white/80 leading-relaxed">
                                        Closed captions refer to subtitles in available languages with the addition of relevant non-dialogue information.
                                    </p>
                                </div>
                                
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-1.5 py-0.5 bg-white/20 text-white text-[10px] font-semibold rounded">AD</span>
                                        <p className="text-white/60">Audio Descriptions</p>
                                    </div>
                                    <p className="text-white/80 leading-relaxed">
                                        Audio descriptions (AD) refer to a narration track describing what is happening on screen to provide context for those who are blind or have low vision.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
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
                courseTitle={course.title}
                price="EGP 59.99/month for the first 6 months, then EGP 119.99/month"
            />
        </div>
    );
}
