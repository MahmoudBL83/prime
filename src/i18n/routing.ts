import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'de'],
    defaultLocale: 'en',
    localePrefix: 'always'
});

export const localeNames = {
    en: 'English',
    de: 'Deutsch'
};

export const localeFlags = {
    en: '🇺🇸',
    de: '🇩🇪'
};
