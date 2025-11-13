'use client';

import { useTranslatio    payment: {
        subscribe: 'اشترك',
        upgrade: 'ترقية',
        plan: 'خطة',
        choosePlan: 'اختر الخطة',
        flexiblePlans: 'خطط مرنة تناسب احتياجاتك',
        mostPopular: 'الأكثر شعبية',
        checkEligibility: 'تحقق من الأهلية',
        getStarted: 'ابدأ الآن',
        subscribeNow: 'اشترك في برايم'
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
        description: 'الوصف'
    }seLocale } from 'next-intl';

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
        search: 'بحث'
    },
    payment: {
        subscribe: 'اشتراك',
        upgrade: 'ترقية',
        plan: 'خطة'
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
            const fallback = fallbackTranslations[namespace]?.[key];
            return fallback || key;
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