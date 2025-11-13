import { useTranslations, useLocale } from 'next-intl';

export interface StreamingCourseItem {
    id: string;
    title?: string;
    titleKey?: string;
    type: 'course' | 'series' | 'masterclass' | 'workshop';
    thumbnail?: string;
    duration?: string;
    rating?: number;
    category?: string;
    categoryKey?: string;
    isNew?: boolean;
    isTopRated?: boolean;
    topPosition?: number;
    instructor?: string;
    instructorKey?: string;
    instructorImage?: string | null;
    description?: string;
    price?: number;
    studentCount?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// Top 10 Most Popular Courses - Similar to streaming service top content
export const topCoursesData: StreamingCourseItem[] = [
    {
        id: "cmg18oojh003iuqawwdq9lm56",
        titleKey: "streamingCourses.topCourses.reactMastery.title",
        type: "masterclass",
        duration: "4:30:45",
        rating: 4.9,
        categoryKey: "programming",
        isTopRated: true,
        topPosition: 1,
        instructorKey: "streamingCourses.topCourses.reactMastery.instructor",
        price: 499,
        studentCount: 15420,
        difficulty: 'intermediate',
        description: "Complete React development course with modern hooks, Redux, and deployment strategies."
    },
    {
        id: "cmg18onxr000muqaw6ngi97rf",
        titleKey: "streamingCourses.topCourses.aiMachineLearning.title",
        type: "series",
        duration: "6:15:20",
        rating: 4.8,
        categoryKey: "technology",
        isTopRated: true,
        topPosition: 2,
        instructorKey: "streamingCourses.topCourses.aiMachineLearning.instructor",
        price: 599,
        studentCount: 12890,
        difficulty: 'advanced',
        description: "Deep dive into AI and Machine Learning with Python, TensorFlow, and real-world projects."
    },
    {
        id: "cmg18onva000auqaw1nnrq2jb",
        titleKey: "streamingCourses.topCourses.digitalMarketing.title",
        type: "course",
        duration: "3:45:30",
        rating: 4.7,
        categoryKey: "marketing",
        isTopRated: true,
        topPosition: 3,
        instructorKey: "streamingCourses.topCourses.digitalMarketing.instructor",
        price: 399,
        studentCount: 18750,
        difficulty: 'beginner',
        description: "Master digital marketing strategies, SEO, social media, and Google Ads."
    },
    {
        id: "cmg18oozu005uuqawm6vbk4z4",
        titleKey: "streamingCourses.topCourses.uiuxDesign.title",
        type: "masterclass",
        duration: "5:20:15",
        rating: 4.9,
        categoryKey: "design",
        isTopRated: true,
        topPosition: 4,
        instructorKey: "streamingCourses.topCourses.uiuxDesign.instructor",
        price: 449,
        studentCount: 11230,
        difficulty: 'intermediate',
        description: "Complete UI/UX design course with Figma, user research, and portfolio building."
    },
    {
        id: "cmg18ooxm005iuqawb073kcci",
        titleKey: "streamingCourses.topCourses.entrepreneurship.title",
        type: "course",
        duration: "4:10:45",
        rating: 4.6,
        categoryKey: "business",
        isTopRated: true,
        topPosition: 5,
        instructorKey: "streamingCourses.topCourses.entrepreneurship.instructor",
        price: 349,
        studentCount: 9650,
        difficulty: 'beginner',
        description: "Learn how to start and grow your own business from idea to successful company."
    },
    {
        id: "top-6",
        titleKey: "streamingCourses.topCourses.dataScience.title",
        type: "series",
        duration: "7:30:20",
        rating: 4.8,
        categoryKey: "technology",
        isTopRated: true,
        topPosition: 6,
        instructorKey: "streamingCourses.topCourses.dataScience.instructor",
        price: 549,
        studentCount: 8940,
        difficulty: 'advanced',
        description: "Comprehensive data science course with Python, R, and machine learning algorithms."
    },
    {
        id: "top-7",
        titleKey: "streamingCourses.topCourses.gameDevUnity.title",
        type: "course",
        duration: "5:45:30",
        rating: 4.7,
        categoryKey: "gaming",
        isTopRated: true,
        topPosition: 7,
        instructorKey: "streamingCourses.topCourses.gameDevUnity.instructor",
        price: 429,
        studentCount: 7820,
        difficulty: 'intermediate',
        description: "Create stunning 2D and 3D games using Unity engine and C# programming."
    },
    {
        id: "top-8",
        titleKey: "streamingCourses.topCourses.cloudComputing.title",
        type: "masterclass",
        duration: "6:00:45",
        rating: 4.8,
        categoryKey: "technology",
        isTopRated: true,
        topPosition: 8,
        instructorKey: "streamingCourses.topCourses.cloudComputing.instructor",
        price: 499,
        studentCount: 6740,
        difficulty: 'advanced',
        description: "Master AWS, Azure, and Google Cloud platforms for modern applications."
    },
    {
        id: "top-9",
        titleKey: "streamingCourses.topCourses.mobileAppDev.title",
        type: "course",
        duration: "4:25:20",
        rating: 4.6,
        categoryKey: "programming",
        isTopRated: true,
        topPosition: 9,
        instructorKey: "streamingCourses.topCourses.mobileAppDev.instructor",
        price: 399,
        studentCount: 5960,
        difficulty: 'intermediate',
        description: "Build native mobile apps for iOS and Android using React Native and Flutter."
    },
    {
        id: "top-10",
        titleKey: "streamingCourses.topCourses.cybersecurity.title",
        type: "series",
        duration: "5:15:30",
        rating: 4.9,
        categoryKey: "technology",
        isTopRated: true,
        topPosition: 10,
        instructorKey: "streamingCourses.topCourses.cybersecurity.instructor",
        price: 549,
        studentCount: 5120,
        difficulty: 'advanced',
        description: "Learn ethical hacking, network security, and cybersecurity best practices."
    }
];

// New Releases - Fresh content like streaming services showcase
export const newReleasesData: StreamingCourseItem[] = [
    {
        id: "cmg18ool2003quqawrzg27fqf",
        titleKey: "streamingCourses.newReleases.nextjsFullstack.title",
        type: "masterclass",
        duration: "5:30:45",
        rating: 4.9,
        categoryKey: "programming",
        isNew: true,
        instructorKey: "streamingCourses.newReleases.nextjsFullstack.instructor",
        price: 499,
        studentCount: 1250,
        difficulty: 'advanced',
        description: "Build modern full-stack applications with Next.js 14, Prisma, and TypeScript."
    },
    {
        id: "cmg18oo0a000yuqaw7xfefih2",
        titleKey: "streamingCourses.newReleases.blockchainDev.title",
        type: "course",
        duration: "4:20:30",
        rating: 4.8,
        categoryKey: "technology",
        isNew: true,
        instructorKey: "streamingCourses.newReleases.blockchainDev.instructor",
        price: 599,
        studentCount: 890,
        difficulty: 'advanced',
        description: "Learn blockchain development, smart contracts, and DeFi applications."
    },
    {
        id: "cmg18oov80056uqawonibhnd4",
        titleKey: "streamingCourses.newReleases.socialMediaStrategy.title",
        type: "workshop",
        duration: "3:15:20",
        rating: 4.7,
        categoryKey: "marketing",
        isNew: true,
        instructorKey: "streamingCourses.newReleases.socialMediaStrategy.instructor",
        price: 299,
        studentCount: 2340,
        difficulty: 'beginner',
        description: "Modern social media marketing strategies for 2024 and beyond."
    },
    {
        id: "new-4",
        titleKey: "streamingCourses.newReleases.motionGraphics.title",
        type: "course",
        duration: "4:45:15",
        rating: 4.8,
        categoryKey: "design",
        isNew: true,
        instructorKey: "streamingCourses.newReleases.motionGraphics.instructor",
        price: 429,
        studentCount: 1680,
        difficulty: 'intermediate',
        description: "Create stunning motion graphics and animations with After Effects and Cinema 4D."
    },
    {
        id: "new-5",
        titleKey: "streamingCourses.newReleases.productManagement.title",
        type: "masterclass",
        duration: "3:50:30",
        rating: 4.6,
        categoryKey: "business",
        isNew: true,
        instructorKey: "streamingCourses.newReleases.productManagement.instructor",
        price: 399,
        studentCount: 1120,
        difficulty: 'intermediate',
        description: "Master product management from strategy to execution in tech companies."
    },
    {
        id: "new-6",
        titleKey: "streamingCourses.newReleases.devops.title",
        type: "series",
        duration: "6:20:45",
        rating: 4.9,
        categoryKey: "technology",
        isNew: true,
        instructorKey: "streamingCourses.newReleases.devops.instructor",
        price: 549,
        studentCount: 945,
        difficulty: 'advanced',
        description: "Complete DevOps pipeline with Docker, Kubernetes, and CI/CD automation."
    }
];

// Featured Egyptian Content - Local focus
export const featuredEgyptianData: StreamingCourseItem[] = [
    {
        id: "cmg18ooop0048uqawd4i8mtpo",
        titleKey: "streamingCourses.egyptianContent.arabicContentStrategy.title",
        type: "course",
        duration: "3:30:20",
        rating: 4.8,
        categoryKey: "marketing",
        instructorKey: "streamingCourses.egyptianContent.arabicContentStrategy.instructor",
        price: 299,
        studentCount: 3450,
        difficulty: 'beginner',
        description: "استراتيجيات التسويق بالمحتوى العربي وبناء العلامة التجارية في السوق المصري."
    },
    {
        id: "cmg18oo5i001kuqaw50am4yst",
        titleKey: "streamingCourses.egyptianContent.egyptianBusiness.title",
        type: "masterclass",
        duration: "4:15:45",
        rating: 4.7,
        categoryKey: "business",
        instructorKey: "streamingCourses.egyptianContent.egyptianBusiness.instructor",
        price: 399,
        studentCount: 2780,
        difficulty: 'intermediate',
        description: "دليل شامل لبدء وإدارة الأعمال التجارية في مصر والشرق الأوسط."
    },
    {
        id: "cmg18oosx004uuqawdsk2xguq",
        titleKey: "streamingCourses.egyptianContent.arabicWebDev.title",
        type: "course",
        duration: "5:20:30",
        rating: 4.9,
        categoryKey: "programming",
        instructorKey: "streamingCourses.egyptianContent.arabicWebDev.instructor",
        price: 449,
        studentCount: 1920,
        difficulty: 'intermediate',
        description: "تطوير مواقع الويب باللغة العربية مع التركيز على اللغة والثقافة المحلية."
    },
    {
        id: "cmg18op1v0064uqawyf3rsnhl",
        titleKey: "streamingCourses.egyptianContent.egyptianDesign.title",
        type: "workshop",
        duration: "3:45:15",
        rating: 4.6,
        categoryKey: "design",
        instructorKey: "streamingCourses.egyptianContent.egyptianDesign.instructor",
        price: 329,
        studentCount: 1540,
        difficulty: 'beginner',
        description: "تصميم الهوية البصرية المصرية وتطبيق الفن والثقافة المحلية في التصميم."
    }
];

// Popular by Category - Similar to streaming service category browsing
export const popularByCategory = {
    programming: [
        {
            id: "prog-1",
            titleKey: "streamingCourses.programming.fullStackJavaScript.title",
            type: "series" as const,
            duration: "8:45:30",
            rating: 4.9,
            categoryKey: "programming",
            instructorKey: "streamingCourses.programming.fullStackJavaScript.instructor",
            price: 599,
            studentCount: 12450,
            difficulty: 'intermediate' as const
        },
        {
            id: "prog-2",
            titleKey: "streamingCourses.programming.pythonAdvanced.title",
            type: "masterclass" as const,
            duration: "6:20:45",
            rating: 4.8,
            categoryKey: "programming",
            instructorKey: "streamingCourses.programming.pythonAdvanced.instructor",
            price: 499,
            studentCount: 9870,
            difficulty: 'advanced' as const
        }
    ],
    design: [
        {
            id: "design-1",
            titleKey: "streamingCourses.design.brandIdentity.title",
            type: "course" as const,
            duration: "4:30:20",
            rating: 4.7,
            categoryKey: "design",
            instructorKey: "streamingCourses.design.brandIdentity.instructor",
            price: 399,
            studentCount: 7650,
            difficulty: 'intermediate' as const
        }
    ]
};

// Hook to get streaming course data with translations
export function useStreamingCourses() {
    const t = useTranslations('courses');
    const tCategories = useTranslations('categories');
    const locale = useLocale();

    // Helper function to process course items with translations
    const processCourseItems = (items: StreamingCourseItem[]) => {
        return items.map(item => ({
            ...item,
            title: item.titleKey ? t(item.titleKey) : item.title,
            instructor: item.instructorKey ? t(item.instructorKey) : item.instructor,
            category: item.categoryKey ? tCategories(item.categoryKey) : item.category
        }));
    };

    return {
        topCourses: processCourseItems(topCoursesData),
        newReleases: processCourseItems(newReleasesData),
        featuredEgyptian: processCourseItems(featuredEgyptianData),
        popularByCategory: {
            programming: processCourseItems(popularByCategory.programming),
            design: processCourseItems(popularByCategory.design)
        }
    };
}
