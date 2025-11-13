import { routing } from '@/i18n/routing';

export default function robots() {
    const baseUrl = 'https://prime-egypt.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/private/',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
        alternates: {
            languages: routing.locales.reduce((acc, locale) => {
                acc[locale] = `${baseUrl}/${locale}`;
                return acc;
            }, {} as Record<string, string>)
        }
    };
}