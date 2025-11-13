import { CourseCard, MentorCard, ValueProp, PricingTier, Testimonial, TrustIndicator } from "@/types/landing";

export const featuredCourses: Record<string, CourseCard[]> = {
    technology: [
        {
            id: "web-dev-intro",
            titleAr: "مقدمة في تطوير الويب",
            titleEn: "Introduction to Web Development",
            thumbnail: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=500&h=300&fit=crop",
            instructor: "أحمد محمد",
            duration: "8 ساعات",
            level: "مبتدئ",
            rating: 4.8,
            category: "التكنولوجيا"
        },
        {
            id: "react-advanced",
            titleAr: "رياكت المتقدم",
            titleEn: "Advanced React",
            thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&h=300&fit=crop",
            instructor: "محمد علي",
            duration: "12 ساعة",
            level: "متقدم",
            rating: 4.9,
            category: "التكنولوجيا"
        },
        {
            id: "python-basics",
            titleAr: "أساسيات بايثون",
            titleEn: "Python Basics",
            thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500&h=300&fit=crop",
            instructor: "سارة أحمد",
            duration: "6 ساعات",
            level: "مبتدئ",
            rating: 4.7,
            category: "التكنولوجيا"
        },
        {
            id: "javascript-mastery",
            titleAr: "إتقان الجافاسكريبت",
            titleEn: "JavaScript Mastery",
            thumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=500&h=300&fit=crop",
            instructor: "عمر حسن",
            duration: "15 ساعة",
            level: "متوسط",
            rating: 4.8,
            category: "التكنولوجيا"
        },
        {
            id: "mobile-app-dev",
            titleAr: "تطوير تطبيقات الموبايل",
            titleEn: "Mobile App Development",
            thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=300&fit=crop",
            instructor: "مريم خالد",
            duration: "20 ساعة",
            level: "متقدم",
            rating: 4.9,
            category: "التكنولوجيا"
        },
        {
            id: "data-science",
            titleAr: "علوم البيانات والذكاء الاصطناعي",
            titleEn: "Data Science & AI",
            thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
            instructor: "د. أحمد مصطفى",
            duration: "25 ساعة",
            level: "متقدم",
            rating: 4.9,
            category: "التكنولوجيا"
        }
    ],
    business: [
        {
            id: "digital-marketing",
            titleAr: "التسويق الرقمي للمبتدئين",
            titleEn: "Digital Marketing for Beginners",
            thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
            instructor: "سارة أحمد",
            duration: "6 ساعات",
            level: "مبتدئ",
            rating: 4.9,
            category: "الأعمال"
        },
        {
            id: "business-finance",
            titleAr: "التمويل للأعمال",
            titleEn: "Business Finance",
            thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&h=300&fit=crop",
            instructor: "عمر خالد",
            duration: "10 ساعات",
            level: "متوسط",
            rating: 4.6,
            category: "الأعمال"
        },
        {
            id: "entrepreneurship",
            titleAr: "ريادة الأعمال من الصفر",
            titleEn: "Entrepreneurship from Zero",
            thumbnail: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500&h=300&fit=crop",
            instructor: "د. محمد صالح",
            duration: "18 ساعة",
            level: "متوسط",
            rating: 4.8,
            category: "الأعمال"
        },
        {
            id: "social-media-marketing",
            titleAr: "التسويق عبر وسائل التواصل",
            titleEn: "Social Media Marketing",
            thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=500&h=300&fit=crop",
            instructor: "نورا عبدالرحمن",
            duration: "8 ساعات",
            level: "مبتدئ",
            rating: 4.7,
            category: "الأعمال"
        },
        {
            id: "ecommerce-business",
            titleAr: "إنشاء متجر إلكتروني ناجح",
            titleEn: "Building Successful E-commerce",
            thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=300&fit=crop",
            instructor: "أحمد فاروق",
            duration: "12 ساعة",
            level: "متوسط",
            rating: 4.8,
            category: "الأعمال"
        }
    ],
    arts: [
        {
            id: "graphic-design",
            titleAr: "التصميم الجرافيكي",
            titleEn: "Graphic Design Fundamentals",
            thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&h=300&fit=crop",
            instructor: "نورا محمود",
            duration: "8 ساعات",
            level: "مبتدئ",
            rating: 4.8,
            category: "الفنون"
        },
        {
            id: "ui-ux-design",
            titleAr: "تصميم واجهات المستخدم",
            titleEn: "UI/UX Design",
            thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=500&h=300&fit=crop",
            instructor: "مريم حسن",
            duration: "14 ساعة",
            level: "متوسط",
            rating: 4.9,
            category: "الفنون"
        },
        {
            id: "photography",
            titleAr: "فن التصوير الفوتوغرافي",
            titleEn: "Photography Masterclass",
            thumbnail: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&h=300&fit=crop",
            instructor: "عمر السيد",
            duration: "10 ساعات",
            level: "مبتدئ",
            rating: 4.7,
            category: "الفنون"
        },
        {
            id: "video-editing",
            titleAr: "مونتاج الفيديو الاحترافي",
            titleEn: "Professional Video Editing",
            thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&h=300&fit=crop",
            instructor: "يوسف أحمد",
            duration: "16 ساعة",
            level: "متوسط",
            rating: 4.8,
            category: "الفنون"
        }
    ],
    languages: [
        {
            id: "english-conversation",
            titleAr: "المحادثة باللغة الإنجليزية",
            titleEn: "English Conversation",
            thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop",
            instructor: "جون سميث",
            duration: "15 ساعة",
            level: "متوسط",
            rating: 4.7,
            category: "اللغات"
        },
        {
            id: "french-basics",
            titleAr: "أساسيات اللغة الفرنسية",
            titleEn: "French Basics",
            thumbnail: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&h=300&fit=crop",
            instructor: "مارينا جان",
            duration: "12 ساعة",
            level: "مبتدئ",
            rating: 4.6,
            category: "اللغات"
        },
        {
            id: "business-english",
            titleAr: "الإنجليزية للأعمال",
            titleEn: "Business English",
            thumbnail: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=500&h=300&fit=crop",
            instructor: "سارة جونسون",
            duration: "18 ساعة",
            level: "متقدم",
            rating: 4.8,
            category: "اللغات"
        }
    ],
    professional: [
        {
            id: "project-management",
            titleAr: "إدارة المشاريع",
            titleEn: "Project Management",
            thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop",
            instructor: "خالد عبدالله",
            duration: "12 ساعة",
            level: "متوسط",
            rating: 4.8,
            category: "المهارات المهنية"
        },
        {
            id: "leadership-skills",
            titleAr: "مهارات القيادة",
            titleEn: "Leadership Skills",
            thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
            instructor: "د. فاطمة عبدالعزيز",
            duration: "14 ساعة",
            level: "متوسط",
            rating: 4.9,
            category: "المهارات المهنية"
        },
        {
            id: "communication-skills",
            titleAr: "مهارات التواصل الفعال",
            titleEn: "Effective Communication",
            thumbnail: "https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=500&h=300&fit=crop",
            instructor: "أمينة محمد",
            duration: "8 ساعات",
            level: "مبتدئ",
            rating: 4.7,
            category: "المهارات المهنية"
        },
        {
            id: "time-management",
            titleAr: "إدارة الوقت والإنتاجية",
            titleEn: "Time Management & Productivity",
            thumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&h=300&fit=crop",
            instructor: "محمد إبراهيم",
            duration: "6 ساعات",
            level: "مبتدئ",
            rating: 4.6,
            category: "المهارات المهنية"
        }
    ]
};

export const featuredMentors: MentorCard[] = [
    {
        id: "mentor-1",
        name: "د. أحمد محمود",
        specialty: "تطوير البرمجيات",
        subscribers: 15420,
        avatar: "/images/mentors/ahmed.jpg",
        channelPrice: 150
    },
    {
        id: "mentor-2",
        name: "سارة عبدالرحمن",
        specialty: "التسويق الرقمي",
        subscribers: 12350,
        avatar: "/images/mentors/sara.jpg",
        channelPrice: 120
    },
    {
        id: "mentor-3",
        name: "محمد خالد",
        specialty: "تصميم الجرافيك",
        subscribers: 8900,
        avatar: "/images/mentors/mohamed.jpg",
        channelPrice: 100
    }
];

export const valueProps: ValueProp[] = [
    {
        id: "library",
        titleAr: "المكتبة الشاملة",
        titleEn: "All-Access Library",
        descriptionAr: "الوصول إلى آلاف الدورات التعليمية من أفضل الخبراء",
        descriptionEn: "Access thousands of courses from top experts",
        icon: "BookOpen",
        priceRange: "99-250 ج.م/شهر"
    },
    {
        id: "mentors",
        titleAr: "قنوات المدربين",
        titleEn: "Mentor Channels",
        descriptionAr: "تابع المدربين المفضلين واحصل على محتوى حصري",
        descriptionEn: "Follow favorite mentors and get exclusive content",
        icon: "Users",
        priceRange: "80-500 ج.م/شهر"
    },
    {
        id: "study-buddy",
        titleAr: "رفيق الدراسة",
        titleEn: "Study Buddy",
        descriptionAr: "تواصل مع زملاء الدراسة وتعلم معًا",
        descriptionEn: "Connect with study buddies and learn together",
        icon: "UserCheck",
        priceRange: "مجاني"
    }
];

export const pricingTiers: PricingTier[] = [
    {
        id: "category-a",
        nameAr: "المكتبة الشاملة",
        nameEn: "All-Access Library",
        price: 199,
        currency: "ج.م",
        features: [
            "الوصول إلى جميع الدورات",
            "محتوى جديد كل أسبوع",
            "شهادات إتمام الدورات",
            "دعم فني على مدار الساعة"
        ]
    },
    {
        id: "category-c",
        nameAr: "قنوات المدربين",
        nameEn: "Mentor Channels",
        price: 150,
        currency: "ج.م",
        features: [
            "الوصول إلى قنوات المدربين",
            "محتوى حصري للمشتركين",
            "تفاعل مباشر مع المدربين",
            "جلسات أسئلة وأجوبة"
        ],
        popular: true
    }
];

export const testimonials: Testimonial[] = [
    {
        id: "testimonial-1",
        name: "فاطمة أحمد",
        role: "طالبة هندسة",
        contentAr: "منصة رائعة ساعدتني في تطوير مهاراتي البرمجية بشكل كبير",
        contentEn: "Great platform that helped me develop my programming skills significantly",
        avatar: "/images/testimonials/fatima.jpg",
        rating: 5
    },
    {
        id: "testimonial-2",
        name: "محمد خالد",
        role: "مطور ويب",
        contentAr: "أفضل منصة تعليمية في مصر، المحتوى عالي الجودة والأسعار مناسبة",
        contentEn: "Best educational platform in Egypt, high-quality content and reasonable prices",
        avatar: "/images/testimonials/mohamed.jpg",
        rating: 5
    }
];

export const trustIndicators: TrustIndicator[] = [
    {
        id: "fawry",
        name: "فوري",
        icon: "CreditCard",
        description: "الدفع عبر فوري"
    },
    {
        id: "meeza",
        name: "ميزة",
        icon: "CreditCard",
        description: "بطاقات ميزة"
    },
    {
        id: "visa",
        name: "فيزا",
        icon: "CreditCard",
        description: "بطاقات ائتمان"
    }
];

export const courseCategories = [
    { id: "technology", titleAr: "التكنولوجيا", titleEn: "Technology" },
    { id: "business", titleAr: "الأعمال", titleEn: "Business" },
    { id: "arts", titleAr: "الفنون", titleEn: "Arts" },
    { id: "languages", titleAr: "اللغات", titleEn: "Languages" },
    { id: "professional", titleAr: "المهارات المهنية", titleEn: "Professional Skills" }
];
