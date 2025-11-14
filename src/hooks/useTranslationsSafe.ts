'use client';

import { useTranslations, useLocale } from 'next-intl';

// Fallback translations for each namespace
const fallbackTranslations: Record<string, Record<string, string>> = {
    navigation: {
        home: 'الرئيسية',
        courses: 'الدورات',
        dashboard: 'لوحة التحكم',
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج',
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        admin: 'الإدارة',
        creators: 'المنشئون',
        studyBuddy: 'رفيق الدراسة',
        subscribe: 'الاشتراك'
    },
    auth: {
        login: 'تسجيل الدخول',
        register: 'إنشاء حساب',
        email: 'البريد الإلكتروني',
        password: 'كلمة المرور',
        forgotPassword: 'نسيت كلمة المرور؟',
        rememberMe: 'تذكرني'
    },
    common: {
        loading: 'جاري التحميل...',
        error: 'حدث خطأ',
        save: 'حفظ',
        cancel: 'إلغاء',
        edit: 'تعديل',
        delete: 'حذف',
        search: 'بحث',
        viewMore: 'عرض المزيد'
    },
    payment: {
        subscribe: 'اشترك',
        upgrade: 'ترقية',
        plan: 'خطة',
        choosePlan: 'اختر الخطة',
        flexiblePlans: 'خطط مرنة تناسب احتياجاتك',
        mostPopular: 'الأكثر شعبية',
        checkEligibility: 'تحقق من الأهلية',
        getStarted: 'ابدأ الآن',
        subscribeNow: 'اشترك في برايم',
        paymentMethods: 'طرق الدفع',
        moneyBackGuarantee: 'ضمان استرداد الأموال',
        cancelAnytime: 'إلغاء في أي وقت',
        securePayment: 'دفع آمن'
    },
    footer: {
        about: 'حول',
        help: 'مساعدة',
        terms: 'الشروط',
        privacy: 'الخصوصية',
        contact: 'اتصل بنا',
        allRightsReserved: 'جميع الحقوق محفوظة'
    },
    mentors: {
        title: 'المدربون',
        learnFromTopMentors: 'تعلم من أفضل المدربين',
        exclusiveChannels: 'قنوات حصرية من الخبراء في مجالاتهم',
        viewChannel: 'عرض القناة',
        followers: 'متابع',
        viewAllMentors: 'عرض جميع المدربين',
        specialty: 'التخصص',
        rating: 'التقييم',
        subscribers: 'المشتركون',
        channelPrice: 'سعر القناة',
        subscribe: 'اشترك',
        description: 'الوصف',
        'mentorData.ahmed_mahmoud.name': 'د. أحمد محمود',
        'mentorData.ahmed_mahmoud.specialty': 'أستاذ الهندسة المعمارية',
        'mentorData.ahmed_mahmoud.description': 'خبير في التصميم المعماري والتخطيط العمراني مع أكثر من 20 عام خبرة',
        'mentorData.mohamed_hassan.name': 'م. محمد حسن',
        'mentorData.mohamed_hassan.specialty': 'مطور البرمجيات',
        'mentorData.mohamed_hassan.description': 'خبير في تطوير تطبيقات الويب والهواتف الذكية مع تقنيات حديثة',
        'mentorData.aya_ibrahim.name': 'د. آية إبراهيم',
        'mentorData.aya_ibrahim.specialty': 'خبيرة الطب النفسي',
        'mentorData.aya_ibrahim.description': 'طبيبة نفسية متخصصة في العلاج السلوكي المعرفي والصحة النفسية',
        'mentorData.youssef_khaled.name': 'أ. يوسف خالد',
        'mentorData.youssef_khaled.specialty': 'مدرب ريادة الأعمال',
        'mentorData.youssef_khaled.description': 'مؤسس شركات ناشئة ومدرب في مجال ريادة الأعمال والاستثمار',
        'mentorData.nadia_hassan.name': 'د. نادية حسن',
        'mentorData.nadia_hassan.specialty': 'أستاذة اللغة العربية',
        'mentorData.nadia_hassan.description': 'دكتوراه في الأدب العربي ومتخصصة في تعليم اللغة العربية للناطقين بها'
    },
    courses: {
        title: 'الدورات',
        featuredCourses: 'الدورات المميزة',
        allCourses: 'جميع الدورات',
        myCourses: 'دوراتي',
        instructor: 'المدرس',
        duration: 'المدة'
    },
    coursePage: {
        courseNotFound: 'الكورس غير موجود',
        discountBanner: 'حتى يوم 20 ستمتع بخصم 70% على اشتراك السنوي بكود 60',
        getDiscount: 'احصل على الخصم',
        aboutCourse: 'تعرف على الكورس',
        showMore: 'عرض المزيد',
        showLess: 'عرض أقل',
        instructor: 'مدرب الدورة',
        courseInstructor: 'المدرب',
        lessonsCount: 'عدد الدروس',
        lessons: 'درس',
        courseDuration: 'مدة الكورس',
        hours: 'ساعات',
        minutes: 'دقيقة',
        rating: 'التقييم',
        stars: 'نجوم',
        subscribeNow: 'اشترك الآن',
        addToFavorites: 'إضافة للمفضلة',
        share: 'مشاركة',
        whatYouGet: 'ما ستحصل عليه:',
        lifetimeAccess: 'وصول مدى الحياة للكورس',
        certificate: 'شهادة إتمام معتمدة',
        directSupport: 'دعم فني مباشر',
        practicalProjects: 'مشاريع تطبيقية',
        skillsYouLearn: 'المهارات التي ستتعلمها:',
        relatedCourses: 'كورسات ذات صلة',
        loadingPlayer: 'جاري تحميل مشغل الكورس...',
        courseLoadError: 'خطأ في تحميل الكورس',
        'sampleRelatedCourses.socialMedia.title': 'مبادئ إدارة مواقع التواصل الاجتماعي',
        'sampleRelatedCourses.socialMedia.instructor': 'مريم هشام',
        'sampleRelatedCourses.marketingBasics.title': 'أساسيات التسويق للمبتدئين',
        'sampleRelatedCourses.marketingBasics.instructor': 'إسلام الصادق',
        'sampleRelatedCourses.marketeerAtoZ.title': 'Marketeer A to Z',
        'sampleRelatedCourses.marketeerAtoZ.instructor': 'إسلام الصادق'
    },
    landing: {
        'hero.title': 'منصة التعلم الرقمي المصري',
        'hero.subtitle': 'اكتشف عالماً من المعرفة مع أفضل الدورات التعليمية من مصر',
        'hero.cta': 'ابدأ رحلتك التعليمية اليوم',
        'hero.exploreCourses': 'استكشف الدورات',
        'hero.featuredCourseTitle': 'إتقان البرمجة مع أحمد محمد',
        'hero.featuredCourseDescription': 'تعلم أسرار البرمجة الحديثة من خبير التكنولوجيا الأول في مصر. دورة شاملة تغطي كل ما تحتاجه لتصبح مطور محترف.',
        'hero.year': '2024',
        'hero.duration': '25 ساعة',
        'hero.lessons': '45 درس',
        'hero.category': 'برمجة',
        'hero.addToList': 'إضافة إلى القائمة',
        'hero.startWatching': 'ابدأ المشاهدة',
        'hero.moreInfo': 'مزيد من المعلومات'
    }
};

export function useTranslationsSafe(namespace: string) {
    try {
        const t = useTranslations(namespace);
        const locale = useLocale();
        return { t, locale, isReady: true };
    } catch (error) {
        console.warn(`Translation context not available for namespace: ${namespace}, using fallbacks`);

        const fallbackT = (key: string) => {
            // Handle nested keys like 'hero.title'
            const keys = key.split('.');
            let value: any = fallbackTranslations[namespace];

            for (const k of keys) {
                value = value?.[k];
            }

            return value || key;
        };

        return {
            t: fallbackT,
            locale: 'ar',
            isReady: false
        };
    }
}

export function useLocaleSafe() {
    try {
        return useLocale();
    } catch (error) {
        console.warn('Locale context not available, using fallback');
        return 'ar';
    }
}
