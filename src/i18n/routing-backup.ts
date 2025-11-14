import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['ar', 'en', 'de'],
    defaultLocale: 'ar',
    localePrefix: 'always',
    pathnames: {
        '/': '/',
        '/courses': {
            ar: '/الدورات',
            en: '/courses',
            de: '/kurse'
        },
        '/dashboard': {
            ar: '/لوحة-التحكم',
            en: '/dashboard',
            de: '/dashboard'
        },
        '/admin': {
            ar: '/الإدارة',
            en: '/admin',
            de: '/admin'
        },
        '/mentors': {
            ar: '/المدربون',
            en: '/mentors',
            de: '/mentoren'
        },
        '/study-buddy': {
            ar: '/شريك-الدراسة',
            en: '/study-buddy',
            de: '/lernpartner'
        },
        '/courses/featured': {
            ar: '/الدورات/المميزة',
            en: '/courses/featured',
            de: '/kurse/empfohlen'
        },
        '/auth/login': {
            ar: '/تسجيل-الدخول',
            en: '/auth/login',
            de: '/auth/anmeldung'
        },
        '/auth/register': {
            ar: '/إنشاء-حساب',
            en: '/auth/register',
            de: '/auth/registrierung'
        },
        '/subscribe': {
            ar: '/اشتراك',
            en: '/subscribe',
            de: '/abonnieren'
        },
        '/profile': {
            ar: '/الملف-الشخصي',
            en: '/profile',
            de: '/profil'
        },
        '/settings': {
            ar: '/الإعدادات',
            en: '/settings',
            de: '/einstellungen'
        },
        '/my-learning': {
            ar: '/تعليمي',
            en: '/my-learning',
            de: '/mein-lernen'
        },
        '/about': {
            ar: '/من-نحن',
            en: '/about',
            de: '/uber-uns'
        },
        '/help': {
            ar: '/المساعدة',
            en: '/help',
            de: '/hilfe'
        },
        '/terms': {
            ar: '/الشروط',
            en: '/terms',
            de: '/bedingungen'
        },
        '/privacy': {
            ar: '/الخصوصية',
            en: '/privacy',
            de: '/datenschutz'
        },
        '/contact': {
            ar: '/اتصل-بنا',
            en: '/contact',
            de: '/kontakt'
        },
        '/courses/[id]': {
            ar: '/الدورات/[id]',
            en: '/courses/[id]',
            de: '/kurse/[id]'
        },
        '/mentors/[id]': {
            ar: '/المدربين/[id]',
            en: '/mentors/[id]',
            de: '/mentoren/[id]'
        }
    }
});

export const localeNames = {
    ar: 'العربية',
    en: 'English',
    de: 'Deutsch'
};

export const localeFlags = {
    ar: '🇪🇬',
    en: '🇺🇸',
    de: '🇩🇪'
};
