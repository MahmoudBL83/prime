export interface CourseData {
    id: string;
    title: string;
    titleAr?: string;
    titleDe?: string;
    category: string;
    thumbnail?: string;
    rating?: number;
    year?: number;
    duration?: string;
    description?: string;
    descriptionAr?: string;
    descriptionDe?: string;
}

export const courses: CourseData[] = [
    // German Language (8 courses)
    {
        id: 'lost-bus-german-survival',
        title: 'The Lost Bus',
        titleAr: 'الحافلة المفقودة',
        titleDe: 'Der verlorene Bus',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        description: 'To save 22 children, they risk everything—including their lives. Inspired by a true story of survival.',
        descriptionAr: 'لإنقاذ 22 طفلاً، يخاطرون بكل شيء - بما في ذلك حياتهم. مستوحى من قصة حقيقية للبقاء على قيد الحياة.',
        descriptionDe: 'Um 22 Kinder zu retten, riskieren sie alles – sogar ihr Leben. Inspiriert von einer wahren Überlebensgeschichte.',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 22.43.43_7cec6116.jpg'
    },
    {
        id: 'severance-german-advanced',
        title: 'Severance',
        titleAr: 'الفصل',
        titleDe: 'Severance',
        category: 'German Language',
        rating: 4.9,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 23.38.13_cf3432e6.jpg'
    },
    {
        id: 'german-b2-course',
        title: 'German B2 Course',
        titleAr: 'دورة الألمانية B2',
        titleDe: 'Deutsch B2 Kurs',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '7 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.30.27_09d6241b.jpg'
    },
    {
        id: 'german-c1-advanced',
        title: 'German C1 Advanced',
        titleAr: 'الألمانية C1 متقدم',
        titleDe: 'Deutsch C1 Fortgeschritten',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '8 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.11_b498b0d9.jpg'
    },
    {
        id: 'german-a1-beginner',
        title: 'German A1 Beginner',
        titleAr: 'الألمانية A1 للمبتدئين',
        titleDe: 'Deutsch A1 Anfänger',
        category: 'German Language',
        rating: 4.7,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.16_9169e54d.jpg'
    },
    {
        id: 'german-conversation',
        title: 'German Conversation',
        titleAr: 'محادثة ألمانية',
        titleDe: 'Deutsch Konversation',
        category: 'German Language',
        rating: 4.6,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.16_917477a7.jpg'
    },
    {
        id: 'german-grammar-mastery',
        title: 'German Grammar Mastery',
        titleAr: 'إتقان قواعد اللغة الألمانية',
        titleDe: 'Deutsch Grammatik Meisterkurs',
        category: 'German Language',
        rating: 4.9,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.17_825387de.jpg'
    },
    {
        id: 'german-business',
        title: 'Business German',
        titleAr: 'الألمانية للأعمال',
        titleDe: 'Business Deutsch',
        category: 'German Language',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/German Language Posters/WhatsApp Image 2025-11-25 at 14.32.17_ae8d6ae8.jpg'
    },
    // Freelance & Side Hustle (7 courses)
    {
        id: 'pluribus-drama-relationships',
        title: 'Pluribus',
        titleAr: 'بلوريبوس',
        titleDe: 'Pluribus',
        category: 'Freelance & Side Hustle',
        rating: 4.5,
        year: 2024,
        duration: '4 months',
        description: 'A compelling drama series exploring complex human relationships.',
        descriptionDe: 'Eine fesselnde Dramaserie, die komplexe menschliche Beziehungen erkundet.',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/between.png'
    },
    {
        id: 'foundation-freelance-mastery',
        title: 'Foundation',
        titleAr: 'الأساس',
        titleDe: 'Foundation',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        year: 2024,
        duration: '8 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/driving deliveries in berlin.png'
    },
    {
        id: 'freelance-success',
        title: 'Freelance Success',
        titleAr: 'نجاح العمل الحر',
        titleDe: 'Freelance-Erfolg',
        category: 'Freelance & Side Hustle',
        rating: 4.6,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/E-Commerce Day One.png'
    },
    {
        id: 'content-creation-mastery',
        title: 'Content Creation Mastery',
        titleAr: 'إتقان إنشاء المحتوى',
        titleDe: 'Content-Erstellung meistern',
        category: 'Freelance & Side Hustle',
        rating: 4.5,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/SKILL INTO INCOME.png'
    },
    {
        id: 'digital-marketing-blueprint',
        title: 'Digital Marketing Blueprint',
        titleAr: 'مخطط التسويق الرقمي',
        titleDe: 'Digitales Marketing-Blueprint',
        category: 'Freelance & Side Hustle',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'freelance-graphic-design',
        title: 'Freelance Graphic Design',
        titleAr: 'التصميم الجرافيكي الحر',
        titleDe: 'Freelance Grafikdesign',
        category: 'Freelance & Side Hustle',
        rating: 4.6,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.12_2ac19e78.jpg'
    },
    {
        id: 'freelance-writing',
        title: 'Freelance Writing',
        titleAr: 'الكتابة الحرة',
        titleDe: 'Freiberufliches Schreiben',
        category: 'Freelance & Side Hustle',
        rating: 4.8,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/Freelance & Side Hustle Posters/WhatsApp Image 2025-11-25 at 14.32.15_58aad836.jpg'
    },
    // Entrepreneurship (5 courses)
    {
        id: 'high-potential-entrepreneur',
        title: 'High Potential',
        titleAr: 'إمكانات عالية',
        titleDe: 'Hohes Potenzial',
        category: 'Entrepreneurship',
        rating: 4.6,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/first launch.png'
    },
    {
        id: 'invasion-startup-growth',
        title: 'Invasion',
        titleAr: 'الغزو',
        titleDe: 'Invasion',
        category: 'Entrepreneurship',
        rating: 4.5,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/investor room 101.png'
    },
    {
        id: 'startup-funding',
        title: 'Startup Funding',
        titleAr: 'تمويل الشركات الناشئة',
        titleDe: 'Startup-Finanzierung',
        category: 'Entrepreneurship',
        rating: 4.7,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.14_9bb85000.jpg'
    },
    {
        id: 'business-growth-strategies',
        title: 'Business Growth Strategies',
        titleAr: 'استراتيجيات نمو الأعمال',
        titleDe: 'Strategien für Unternehmenswachstum',
        category: 'Entrepreneurship',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 14.32.15_34d01093.jpg'
    },
    {
        id: 'scaling-your-startup',
        title: 'Scaling Your Startup',
        titleAr: 'توسيع شركتك الناشئة',
        titleDe: 'Dein Startup skalieren',
        category: 'Entrepreneurship',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/Entrepreneurship Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg'
    },
    // Trading (2 courses)
    {
        id: 'morning-show-trading',
        title: 'Morning Show',
        titleAr: 'برنامج الصباح',
        titleDe: 'Morning Show',
        category: 'Trading',
        rating: 4.7,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.12_063b614c.jpg'
    },
    {
        id: 'master-trader-pro',
        title: 'Master Trader',
        titleAr: 'المتداول المحترف',
        titleDe: 'Master Trader',
        category: 'Trading',
        rating: 4.8,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Trading Posters/WhatsApp Image 2025-11-25 at 14.32.14_770af3af.jpg'
    },
    // Coding & AI (3 courses)
    {
        id: 'ted-lasso-coding-ai',
        title: 'Ted Lasso',
        titleAr: 'تيد لاسو',
        titleDe: 'Ted Lasso',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.11_07d95353.jpg'
    },
    {
        id: 'ai-revolution-machine-learning',
        title: 'AI Revolution',
        titleAr: 'ثورة الذكاء الاصطناعي',
        titleDe: 'KI-Revolution',
        category: 'Coding & AI',
        rating: 4.9,
        year: 2024,
        duration: '7 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 14.32.13_c74bbc50.jpg'
    },
    {
        id: 'python-mastery',
        title: 'Python Mastery',
        titleAr: 'إتقان بايثون',
        titleDe: 'Python-Meisterkurs',
        category: 'Coding & AI',
        rating: 4.8,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/Coding & AI Posters/WhatsApp Image 2025-11-25 at 15.04.46_5f562939.jpg'
    },
    // German Integration (6 courses)
    {
        id: 'slow-horses-german-integration',
        title: 'Slow Horses',
        titleAr: 'الخيول البطيئة',
        titleDe: 'Slow Horses',
        category: 'German Integration',
        rating: 4.8,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_973f42cd.jpg'
    },
    {
        id: 'german-life-culture',
        title: 'German Life',
        titleAr: 'الحياة الألمانية',
        titleDe: 'Deutsches Leben',
        category: 'German Integration',
        rating: 4.7,
        year: 2024,
        duration: '5 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.13_d9d3d1dd.jpg'
    },
    {
        id: 'german-citizenship-prep',
        title: 'German Citizenship Prep',
        titleAr: 'التحضير للجنسية الألمانية',
        titleDe: 'Vorbereitung auf die deutsche Staatsbürgerschaft',
        category: 'German Integration',
        rating: 4.8,
        year: 2024,
        duration: '6 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.14_39554e98.jpg'
    },
    {
        id: 'german-work-culture',
        title: 'German Work Culture',
        titleAr: 'ثقافة العمل الألمانية',
        titleDe: 'Deutsche Arbeitskultur',
        category: 'German Integration',
        rating: 4.6,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.15_48365969.jpg'
    },
    {
        id: 'living-in-germany',
        title: 'Living in Germany',
        titleAr: 'العيش في ألمانيا',
        titleDe: 'In Deutschland leben',
        category: 'German Integration',
        rating: 4.7,
        year: 2024,
        duration: '3 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.16_fdffce41.jpg'
    },
    {
        id: 'german-social-system',
        title: 'German Social System',
        titleAr: 'النظام الاجتماعي الألماني',
        titleDe: 'Deutsches Sozialsystem',
        category: 'German Integration',
        rating: 4.9,
        year: 2024,
        duration: '4 months',
        thumbnail: '/images/courses/German Integration Posters/WhatsApp Image 2025-11-25 at 14.32.17_91121bd7.jpg'
    }
];

export const courseMap: Record<string, CourseData> = courses.reduce((map, course) => {
    map[course.id] = course;
    return map;
}, {} as Record<string, CourseData>);
