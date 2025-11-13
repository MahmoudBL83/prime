import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { toggleWishlist, isInWishlist } from '@/utils/courseActions';

interface ContentItem {
    id: string;
    title?: string;
    titleKey?: string;
    type: 'course' | 'series' | 'film' | 'live';
    thumbnail: string;
    duration?: string;
    rating?: number;
    category?: string;
    isNew?: boolean;
    instructor?: string;
    instructorKey?: string;
    instructorImage?: string | null;
    description?: string;
    price?: number;
}

interface ContentRowProps {
    title?: string;
    titleKey?: string;
    items: ContentItem[];
    seeAllLink?: string;
}

export function ContentRow({ title, titleKey, items, seeAllLink }: ContentRowProps) {
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('courses');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    // Get the title based on titleKey or direct title
    const displayTitle = titleKey ? (t(titleKey) || titleKey) : title;

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return;

        const scrollAmount = 300;
        const newScrollLeft = scrollContainerRef.current.scrollLeft +
            (direction === 'right' ? scrollAmount : -scrollAmount);

        scrollContainerRef.current.scrollTo({
            left: newScrollLeft,
            behavior: 'smooth'
        });
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    return (
        <div className="mb-8">
            {/* Row Header */}
            <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
                <h2 className="text-xl font-semibold text-foreground">{displayTitle}</h2>
                {seeAllLink && (
                    <button
                        onClick={() => router.push(`/${locale}${seeAllLink}`)}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                        {tCommon('viewAll')}
                    </button>
                )}
            </div>

            {/* Carousel Container */}
            <div className="relative group">
                {/* Left Arrow */}
                {canScrollLeft && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full w-10 h-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => scroll('left')}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                )}

                {/* Right Arrow */}
                {canScrollRight && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background text-foreground rounded-full w-10 h-10 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => scroll('right')}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                )}

                {/* Scrollable Content */}
                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2"
                    onScroll={handleScroll}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {items.map((item) => (
                        <ContentCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ContentCard({ item }: { item: ContentItem }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isInWishlistState, setIsInWishlistState] = useState(false);
    const t = useTranslations('courses');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const router = useRouter();

    // Initialize wishlist state
    useEffect(() => {
        setIsInWishlistState(isInWishlist(item.id));
    }, [item.id]);

    // Handle wishlist toggle
    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newState = toggleWishlist(item.id, displayTitle);
        setIsInWishlistState(newState);
    };

    // Get translated title and instructor
    const displayTitle = item.titleKey ? t(item.titleKey) : item.title || '';
    const displayInstructor = item.instructorKey ? t(item.instructorKey) : item.instructor || '';

    // Get demo course background image - use local images
    const getCourseBackgroundImage = (courseId: string, title: string, category?: string) => {
        // Use the 4 local course images randomly
        const localCourseImages = [
            '/images/courses/react-course.jpg',
            '/images/courses/nodejs-course.jpg', 
            '/images/courses/design-course.jpg',
            '/images/courses/mobile-course.jpg'
        ];
        
        // Use course ID to determine which image to use (consistent across renders)
        const imageIndex = parseInt(courseId.replace(/[^0-9]/g, '') || '0') % localCourseImages.length;
        return localCourseImages[imageIndex];
    };

    // Get demo instructor image
    const getInstructorImage = (instructor?: string, courseId?: string) => {
        if (item.instructorImage) return item.instructorImage;

        const instructorImages: { [key: string]: string } = {
            'أحمد محمد': '/images/instructors/instructor1.jpg',
            'سارة أحمد': '/images/instructors/instructor2.jpg',
            'محمد علي': '/images/instructors/instructor1.jpg',
            'فاطمة حسن': '/images/instructors/instructor2.jpg',
            'خالد عبدالله': '/images/instructors/instructor1.jpg',
            'دكتور أحمد سالم': '/images/instructors/instructor1.jpg',
            'منى عبدالرحمن': '/images/instructors/instructor2.jpg',
            'دكتور محمد إبراهيم': '/images/instructors/instructor1.jpg',
            'أحمد علي': '/images/instructors/instructor1.jpg',
            'سارة محمد': '/images/instructors/instructor2.jpg',
            'محمد عبدالله': '/images/instructors/instructor1.jpg',
            'نور الدين حسن': '/images/instructors/instructor1.jpg',
            'فاطمة أحمد': '/images/instructors/instructor2.jpg',
            'Ahmed Mohamed': '/images/instructors/instructor1.jpg',
            'Sara Ahmed': '/images/instructors/instructor2.jpg',
            'Mohamed Ali': '/images/instructors/instructor1.jpg',
            'Fatma Hassan': '/images/instructors/instructor2.jpg',
            'Khaled Abdallah': '/images/instructors/instructor1.jpg',
            'Dr. Ahmed Salem': '/images/instructors/instructor1.jpg',
            'Mona Abdelrahman': '/images/instructors/instructor2.jpg',
            'Dr. Mohamed Ibrahim': '/images/instructors/instructor1.jpg',
            'Ahmed Ali': '/images/instructors/instructor1.jpg',
            'Sara Mohamed': '/images/instructors/instructor2.jpg',
            'Mohamed Abdallah': '/images/instructors/instructor1.jpg',
            'Nour El-Din Hassan': '/images/instructors/instructor1.jpg',
            'Fatma Ahmed': '/images/instructors/instructor2.jpg',
            'Ahmed Mahmoud': '/images/instructors/instructor1.jpg',
            'Mohamed Hassan': '/images/instructors/instructor1.jpg',
            'Aya Ibrahim': '/images/instructors/instructor2.jpg',
            'Youssef Khaled': '/images/instructors/instructor1.jpg',
            'Nadia Hassan': '/images/instructors/instructor2.jpg',
            'Dr. Ahmed Mahmoud': '/images/instructors/instructor1.jpg',
            'Eng. Mohamed Hassan': '/images/instructors/instructor1.jpg',
            'Dr. Aya Ibrahim': '/images/instructors/instructor2.jpg',
            'Mr. Youssef Khaled': '/images/instructors/instructor1.jpg',
            'Dr. Nadia Hassan': '/images/instructors/instructor2.jpg'
        };

        return instructorImages[instructor || ''] ||
            (parseInt(courseId || '0') % 2 === 0 ? '/images/instructors/instructor1.jpg' : '/images/instructors/instructor2.jpg');
    };

    // Get instructor name based on current locale
    const getInstructorName = (instructor?: string, category?: string) => {
        if (instructor) return instructor;

        // Instructor names by locale
        const instructorNames: { [key: string]: { [locale: string]: string } } = {
            'برمجة': {
                'ar': 'أحمد محمد',
                'en': 'Ahmed Mohamed',
                'de': 'Ahmed Mohamed'
            },
            'تصميم': {
                'ar': 'سارة أحمد',
                'en': 'Sara Ahmed',
                'de': 'Sara Ahmed'
            },
            'أعمال': {
                'ar': 'محمد علي',
                'en': 'Mohamed Ali',
                'de': 'Mohamed Ali'
            },
            'PROGRAMMING': {
                'ar': 'أحمد محمد',
                'en': 'Ahmed Mohamed',
                'de': 'Ahmed Mohamed'
            },
            'DESIGN': {
                'ar': 'سارة أحمد',
                'en': 'Sara Ahmed',
                'de': 'Sara Ahmed'
            },
            'BUSINESS': {
                'ar': 'محمد علي',
                'en': 'Mohamed Ali',
                'de': 'Mohamed Ali'
            }
        };

        // Default instructor names by locale
        const defaultInstructorNames: { [locale: string]: string } = {
            'ar': 'خبير',
            'en': 'Expert',
            'de': 'Experte'
        };

        // Try to get instructor name for current locale
        const instructorName = instructorNames[category || '']?.[locale];

        return instructorName || defaultInstructorNames[locale] || defaultInstructorNames['ar'];
    };

    // Get course description based on course ID or title and current locale
    const getCourseDescription = (courseId: string, title: string, category?: string) => {
        // Get descriptions based on current locale
        const descriptions: { [key: string]: { [locale: string]: string } } = {
            '1': {
                'ar': 'تعلم React من الصفر إلى الاحتراف. هذا الدورة الشاملة تغطي كل ما تحتاجه لبناء تطبيقات ويب حديثة باستخدام React.',
                'en': 'Learn React from zero to hero. This comprehensive course covers everything you need to build modern web applications using React.',
                'de': 'Lernen Sie React von Null bis Held. Dieser umfassende Kurs behandelt alles, was Sie zum Erstellen moderner Webanwendungen mit React benötigen.'
            },
            '2': {
                'ar': 'اكتشف أساسيات التصميم الجرافيكي ومبادئ التصميم البصري. مثالي للمبتدئين الذين يرغبون في دخول عالم التصميم.',
                'en': 'Discover the fundamentals of graphic design and visual design principles. Ideal for beginners who want to enter the world of design.',
                'de': 'Entdecken Sie die Grundlagen des Grafikdesigns und die Prinzipien des visuellen Designs. Ideal für Anfänger, die in die Welt des Designs einsteigen möchten.'
            },
            '3': {
                'ar': 'تعمق في عالم NodeJS وبناء تطبيقات الخادم القوية. تعلم كيفية إنشاء APIs وتطبيقات الويب الكاملة.',
                'en': 'Dive deep into the world of NodeJS and building robust server applications. Learn how to create APIs and complete web applications.',
                'de': 'Tauchen Sie tief in die Welt von NodeJS und den Aufbau robuster Serveranwendungen ein. Lernen Sie, wie Sie APIs und vollständige Webanwendungen erstellen.'
            },
            '4': {
                'ar': 'ابدأ رحلتك في تطوير التطبيقات المحمولة باستخدام أحدث التقنيات والأدوات.',
                'en': 'Start your journey in mobile app development using the latest technologies and tools.',
                'de': 'Beginnen Sie Ihre Reise in die Entwicklung mobiler Apps mit den neuesten Technologien und Tools.'
            },
            'برمجة': {
                'ar': 'دورة شاملة في عالم البرمجة، تغطي المفاهيم الأساسية والمتقدمة لبناء تطبيقات قوية.',
                'en': 'Comprehensive course in the world of programming, covering fundamental and advanced concepts for building robust applications.',
                'de': 'Umfassender Kurs in der Welt des Programmierens, der grundlegende und fortgeschrittene Konzepte für den Aufbau robuster Anwendungen abdeckt.'
            },
            'PROGRAMMING': {
                'ar': 'دورة شاملة في عالم البرمجة، تغطي المفاهيم الأساسية والمتقدمة لبناء تطبيقات قوية.',
                'en': 'Comprehensive programming course covering fundamental and advanced concepts for building robust applications.',
                'de': 'Umfassender Programmierkurs, der grundlegende und fortgeschrittene Konzepte für den Aufbau robuster Anwendungen abdeckt.'
            },
            'تصميم': {
                'ar': 'دورة في عالم التصميم الإبداعي، تركز على المبادئ الأساسية والتقنيات المتقدمة.',
                'en': 'Creative design course focusing on fundamental principles and advanced techniques.',
                'de': 'Kreativer Designkurs, der sich auf grundlegende Prinzipien und fortgeschrittene Techniken konzentriert.'
            },
            'DESIGN': {
                'ar': 'دورة في عالم التصميم الإبداعي، تركز على المبادئ الأساسية والتقنيات المتقدمة.',
                'en': 'Creative design course focusing on fundamental principles and advanced techniques.',
                'de': 'Kreativer Designkurs, der sich auf grundlegende Prinzipien und fortgeschrittene Techniken konzentriert.'
            },
            'أعمال': {
                'ar': 'دورة في إدارة الأعمال الحديثة، تغطي الاستراتيجيات والمفاهيم اللازمة لنجاح الأعمال.',
                'en': 'Modern business management course covering strategies and concepts needed for business success.',
                'de': 'Moderne Business-Management-Kurs, der Strategien und Konzepte für den Erfolg von Unternehmen abdeckt.'
            },
            'BUSINESS': {
                'ar': 'دورة في إدارة الأعمال الحديثة، تغطي الاستراتيجيات والمفاهيم اللازمة لنجاح الأعمال.',
                'en': 'Modern business management course covering strategies and concepts needed for business success.',
                'de': 'Moderne Business-Management-Kurs, der Strategien und Konzepte für den Erfolg von Unternehmen abdeckt.'
            },
            'تسويق': {
                'ar': 'دورة في التسويق الرقمي الحديث، تركز على الاستراتيجيات الفعالة للوصول إلى الجمهور المستهدف.',
                'en': 'Modern digital marketing course focusing on effective strategies to reach the target audience.',
                'de': 'Moderner digitaler Marketingkurs, der sich auf effektive Strategien zur Erreichung der Zielgruppe konzentriert.'
            },
            'تكنولوجيا': {
                'ar': 'دورة في أحدث التقنيات التكنولوجية، تغطي المفاهيم الأساسية والتطبيقات العملية.',
                'en': 'Course in the latest technology trends, covering fundamental concepts and practical applications.',
                'de': 'Kurs über die neuesten Technologietrends, der grundlegende Konzepte und praktische Anwendungen abdeckt.'
            },
            'ألعاب': {
                'ar': 'دورة في تطوير الألعاب، تغطي أساسيات تصميم وتطوير الألعاب باستخدام أحدث الأدوات.',
                'en': 'Game development course covering the basics of game design and development using the latest tools.',
                'de': 'Spieleentwicklungskurs, der die Grundlagen des Spieldesigns und der Entwicklung mit den neuesten Tools abdeckt.'
            }
        };

        // Default descriptions by locale
        const defaultDescriptions: { [locale: string]: string } = {
            'ar': `دورة تعليمية شاملة في مجال ${category || 'التعليم'}، مصممة لتزويدك بالمهارات والمعرفة اللازمة للتطور في هذا المجال.`,
            'en': `A comprehensive educational course in the field of ${category || 'education'}, designed to provide you with the skills and knowledge needed to develop in this field.`,
            'de': `Ein umfassender Bildungskurs im Bereich ${category || 'Bildung'}, der Ihnen die Fähigkeiten und Kenntnisse vermittelt, die Sie für Ihre Entwicklung in diesem Bereich benötigen.`
        };

        // Try to get description for current locale
        const courseDesc = descriptions[courseId]?.[locale] ||
            descriptions[category || '']?.[locale];

        return courseDesc || defaultDescriptions[locale] || defaultDescriptions['ar'];
    };

    // Format duration to show only hours and minutes
    const formatDuration = (duration: string) => {
        // Handle formats like "2:30:45" or "1:45:20"
        const parts = duration.split(':');
        if (parts.length >= 2) {
            const hours = parts[0];
            const minutes = parts[1];
            return `${hours}:${minutes}`;
        }
        return duration; // Return as-is if format is unexpected
    };

    const courseBackgroundImage = getCourseBackgroundImage(item.id, displayTitle, item.category);
    const instructorImage = getInstructorImage(displayInstructor, item.id);
    const courseDescription = getCourseDescription(item.id, displayTitle, item.category);

    return (
        <motion.div
            className="flex-shrink-0 w-80 group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{
                scale: 1.1,
                y: -8,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.5)"
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            onClick={() => router.push(`/${locale}/courses/${item.id}`)}
        >
            <div className="relative bg-background rounded-xl overflow-hidden shadow-2xl">
                {/* Main Course Thumbnail */}
                <div className="aspect-[16/10] relative overflow-hidden">
                    {/* Course background image with overlay */}
                    <div className="w-full h-full relative">
                        <img
                            src={courseBackgroundImage}
                            alt={displayTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback to local course images if external fails
                                const target = e.target as HTMLImageElement;
                                const localImages = [
                                    '/images/courses/react-course.jpg',
                                    '/images/courses/nodejs-course.jpg', 
                                    '/images/courses/design-course.jpg',
                                    '/images/courses/mobile-course.jpg'
                                ];
                                const fallbackIndex = parseInt(item.id.replace(/[^0-9]/g, '') || '0') % localImages.length;
                                target.src = localImages[fallbackIndex];
                            }}
                        />
                        {/* Fallback gradient background */}
                        <div className="hidden absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-pink-600"></div>

                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                        {/* Course level/category badge */}
                        <div className="absolute top-4 right-4">
                            {item.isNew && (
                                <span className="px-3 py-1 bg-red-500 text-foreground text-xs font-bold rounded-full">
                                    {tCommon('new')}
                                </span>
                            )}
                            {item.category && !item.isNew && (
                                <span className="px-3 py-1 bg-white/20 text-foreground text-xs font-medium rounded-full backdrop-blur-sm">
                                    {item.category}
                                </span>
                            )}
                        </div>

                        {/* Basic info shown when not hovered */}
                        {!isHovered && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                                <h3 className="text-foreground text-xl font-bold mb-2 line-clamp-2">
                                    {displayTitle}
                                </h3>
                                <div className="flex items-center gap-4 text-white/80 text-sm">
                                    {item.duration && (
                                        <span className="flex items-center gap-1">
                                            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                                            {formatDuration(item.duration)}
                                        </span>
                                    )}
                                    {item.rating && (
                                        <span className="flex items-center gap-1">
                                            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                                            ★ {item.rating}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Detailed info shown on hover - Netflix style */}
                        {isHovered && (
                            <motion.div
                                className="absolute inset-0 bg-background/90 flex flex-col"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Header with title and buttons */}
                                <div className="flex justify-between items-start mb-4 p-6">
                                    <h3 className="text-foreground text-xl font-bold line-clamp-2 flex-1 pr-2">
                                        {displayTitle}
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button
                                            size="lg"
                                            className="bg-background text-foreground hover:bg-gray-200 rounded-full w-10 h-10 p-0 shadow-lg"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/${locale}/courses/${item.id}`);
                                            }}
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className={`border-2 border-white text-foreground hover:bg-background hover:text-foreground rounded-full w-10 h-10 p-0 shadow-lg backdrop-blur-sm transition-all ${
                                                isInWishlistState ? 'bg-background text-foreground' : ''
                                            }`}
                                            onClick={handleWishlistToggle}
                                            title={isInWishlistState ? 'Remove from wishlist' : 'Add to wishlist'}
                                        >
                                            {isInWishlistState ? (
                                                <Check className="w-5 h-5" />
                                            ) : (
                                                <Plus className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Course metadata */}
                                <div className="flex items-center gap-3 text-white/80 text-sm mb-4 px-6">
                                    {item.rating && (
                                        <span className="flex items-center gap-1">
                                            ★ {item.rating}
                                        </span>
                                    )}
                                    {item.duration && (
                                        <span className="flex items-center gap-1">
                                            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                                            {formatDuration(item.duration)}
                                        </span>
                                    )}
                                    {item.category && (
                                        <span className="flex items-center gap-1">
                                            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                                            {item.category}
                                        </span>
                                    )}
                                </div>

                                {/* Course description */}
                                <div className="mb-4 flex-1 px-6">
                                    <p className="text-white/90 text-sm line-clamp-3">
                                        {courseDescription}
                                    </p>
                                </div>

                                {/* Instructor info */}
                                <div className="flex items-center gap-3 mt-auto px-6">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden border-2 border-white/30">
                                        <img
                                            src={instructorImage}
                                            alt={displayInstructor || t('instructor')}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to initials if instructor image fails
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `<span class="text-foreground text-lg font-bold">${displayInstructor?.charAt(0) || displayTitle.charAt(0)}</span>`;
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">{t('instructor')}</p>
                                        <p className="text-foreground text-sm font-medium">
                                            {getInstructorName(displayInstructor, item.category)}
                                        </p>
                                    </div>
                                </div>

                                {/* Price and additional info */}
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border px-6">
                                    {item.price && (
                                        <div>
                                            <p className="text-muted-foreground text-xs">{t('price')}</p>
                                            <p className="text-foreground font-bold">EGP {item.price}</p>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="text-foreground border-white hover:bg-background hover:text-foreground text-sm py-1 px-3"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/${locale}/courses/${item.id}`);
                                        }}
                                    >
                                        {tCommon('viewDetails')}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Course info section - only shown when not hovered */}
                {!isHovered && (
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                                    <img
                                        src={instructorImage}
                                        alt={displayInstructor || t('instructor')}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<span class="text-foreground text-xs font-bold">${displayInstructor?.charAt(0) || displayTitle.split(' ')[0].charAt(0)}</span>`;
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">{t('instructor')}</p>
                                    <p className="text-foreground text-sm font-medium">
                                        {getInstructorName(displayInstructor, item.category)}
                                    </p>
                                </div>
                            </div>

                            {item.duration && (
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-blue-400">
                                        <span className="text-foreground text-sm font-bold">{formatDuration(item.duration)}</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">{t('duration')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}// Sample data for demo
export const sampleContentRows = [
    {
        titleKey: "featuredToday",
        items: [
            {
                id: "1",
                titleKey: "sampleCourses.featuredToday.reactMastery.title",
                instructorKey: "sampleCourses.featuredToday.reactMastery.instructor",
                type: "course" as const,
                thumbnail: "",
                duration: "2:30:45",
                rating: 4.9,
                category: "برمجة",
                isNew: true,
                instructor: "أحمد محمد",
                instructorImage: null,
                price: 299
            },
            {
                id: "2",
                titleKey: "sampleCourses.featuredToday.graphicDesign.title",
                instructorKey: "sampleCourses.featuredToday.graphicDesign.instructor",
                type: "series" as const,
                thumbnail: "",
                duration: "1:45:20",
                rating: 4.7,
                category: "تصميم",
                instructor: "سارة أحمد",
                instructorImage: null,
                price: 199
            },
            {
                id: "3",
                titleKey: "sampleCourses.featuredToday.businessManagement.title",
                instructorKey: "sampleCourses.featuredToday.businessManagement.instructor",
                type: "course" as const,
                thumbnail: "",
                duration: "3:15:30",
                rating: 4.8,
                category: "أعمال",
                instructor: "محمد علي",
                instructorImage: null,
                price: 399
            },
            {
                id: "4",
                titleKey: "sampleCourses.featuredToday.digitalMarketing.title",
                instructorKey: "sampleCourses.featuredToday.digitalMarketing.instructor",
                type: "course" as const,
                thumbnail: "",
                duration: "2:45:15",
                rating: 4.6,
                category: "تسويق",
                instructor: "فاطمة حسن",
                instructorImage: null,
                price: 249
            }
        ],
        seeAllLink: "/courses?featured=true"
    },
    {
        titleKey: "mostViewed",
        items: [
            {
                id: "5",
                titleKey: "sampleCourses.mostViewed.unityGameDev.title",
                instructorKey: "sampleCourses.mostViewed.unityGameDev.instructor",
                type: "course" as const,
                thumbnail: "",
                duration: "3:15:30",
                rating: 4.8,
                category: "ألعاب",
                instructor: "خالد عبدالله",
                instructorImage: null,
                price: 349
            },
            {
                id: "6",
                titleKey: "sampleCourses.mostViewed.dataScience.title",
                instructorKey: "sampleCourses.mostViewed.dataScience.instructor",
                type: "series" as const,
                thumbnail: "",
                duration: "4:30:45",
                rating: 4.9,
                category: "تكنولوجيا",
                instructor: "دكتور أحمد سالم",
                instructorImage: null,
                price: 499
            },
            {
                id: "7",
                titleKey: "sampleCourses.mostViewed.entrepreneurship.title",
                instructorKey: "sampleCourses.mostViewed.entrepreneurship.instructor",
                type: "course" as const,
                thumbnail: "",
                duration: "2:20:30",
                rating: 4.7,
                category: "ريادة أعمال",
                instructor: "منى عبدالرحمن",
                instructorImage: null,
                price: 199
            }
        ],
        seeAllLink: "/courses?sort=popular"
    }
];