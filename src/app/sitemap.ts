import { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://prime-egypt.com'

    const routes = [
        { path: '', priority: 1.0, changeFrequency: 'daily' as const },
        { path: '/courses', priority: 0.9, changeFrequency: 'daily' as const },
        { path: '/mentors', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/signature-courses', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/study-buddy', priority: 0.7, changeFrequency: 'weekly' as const },
        { path: '/dashboard', priority: 0.7, changeFrequency: 'daily' as const },
        { path: '/creator', priority: 0.6, changeFrequency: 'weekly' as const },
        { path: '/about', priority: 0.5, changeFrequency: 'monthly' as const },
        { path: '/contact', priority: 0.5, changeFrequency: 'monthly' as const },
        { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
        { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const }
    ]

    const sitemapEntries: MetadataRoute.Sitemap = []

    // Add entries for all locales
    routes.forEach(({ path, priority, changeFrequency }) => {
        routing.locales.forEach(locale => {
            const url = `${baseUrl}/${locale}${path}`
            sitemapEntries.push({
                url,
                lastModified: new Date(),
                changeFrequency,
                priority,
                alternates: {
                    languages: routing.locales.reduce((acc, loc) => {
                        acc[loc] = `${baseUrl}/${loc}${path}`
                        return acc
                    }, {} as Record<string, string>)
                }
            })
        })
    })

    // Add default locale redirects (without locale prefix)
    routes.forEach(({ path, priority, changeFrequency }) => {
        const url = path ? `${baseUrl}${path}` : baseUrl
        sitemapEntries.push({
            url,
            lastModified: new Date(),
            changeFrequency,
            priority: priority * 0.8, // Slightly lower priority for non-localized URLs
            alternates: {
                languages: routing.locales.reduce((acc, locale) => {
                    acc[locale] = `${baseUrl}/${locale}${path}`
                    return acc
                }, {} as Record<string, string>)
            }
        })
    })

    return sitemapEntries
}