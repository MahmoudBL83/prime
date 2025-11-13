import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['ar', 'en', 'de'],
    defaultLocale: 'ar',
    localePrefix: 'always'
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