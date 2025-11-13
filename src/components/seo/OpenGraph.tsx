import { useTranslations, useLocale } from 'next-intl';

interface OpenGraphProps {
    title?: string;
    description?: string;
    imageUrl?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
}

export function OpenGraph({
    title,
    description,
    imageUrl = 'https://prime-egypt.com/images/og-default.jpg',
    url,
    type = 'website',
    siteName,
    locale: propLocale
}: OpenGraphProps) {
    const t = useTranslations('common');
    const currentLocale = useLocale();
    const locale = propLocale || currentLocale;

    const defaultTitle = locale === 'ar'
        ? 'برايم - منصة التعلم الرقمي المصرية'
        : locale === 'de'
            ? 'Prime - Ägyptische digitale Lernplattform'
            : 'Prime - Egyptian Digital Learning Platform';

    const defaultDescription = locale === 'ar'
        ? 'منصة تعليمية شاملة للطلاب والمتعلمين في مصر'
        : locale === 'de'
            ? 'Umfassende Bildungsplattform für Studenten und Lernende in Ägypten'
            : 'Comprehensive educational platform for students and learners in Egypt';

    const finalTitle = title || defaultTitle;
    const finalDescription = description || defaultDescription;
    const finalSiteName = siteName || defaultTitle;

    return (
        <>
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:image" content={imageUrl} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={finalSiteName} />
            {url && <meta property="og:url" content={url} />}
            <meta property="og:locale" content={locale === 'ar' ? 'ar_EG' : locale === 'de' ? 'de_DE' : 'en_US'} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={imageUrl} />
        </>
    );
}