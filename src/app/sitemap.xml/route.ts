import { routing } from '@/i18n/routing';

export default function sitemap() {
    const baseUrl = 'https://prime-egypt.com';

    const urls = [
        { path: '/', priority: 1.0 },
        { path: '/courses', priority: 0.9 },
        { path: '/mentors', priority: 0.8 },
        { path: '/dashboard', priority: 0.7 },
        { path: '/study-buddy', priority: 0.7 },
        { path: '/admin', priority: 0.6 },
    ];

    const sitemapEntries = urls.flatMap(({ path, priority }) =>
        routing.locales.map(locale => ({
            url: `${baseUrl}/${locale}${path === '/' ? '' : path}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority,
            alternates: {
                languages: routing.locales.reduce((acc, loc) => {
                    acc[loc] = `${baseUrl}/${loc}${path === '/' ? '' : path}`;
                    return acc;
                }, {} as Record<string, string>)
            }
        }))
    );

    return sitemapEntries;
}
