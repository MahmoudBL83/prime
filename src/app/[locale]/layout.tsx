import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { OpenGraph } from '@/components/seo/OpenGraph';
import Providers from "@/components/providers";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageTransitionProvider } from "@/components/navigation/PageTransition";

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const title = locale === 'ar'
        ? "برايم"
        : "Prime";

    const icons = {
        icon: '/images/logo.jpg',
        apple: '/images/logo.jpg',
    };

    const description = locale === 'ar'
        ? "منصة تعليمية شاملة للطلاب والمتعلمين في مصر"
        : "Comprehensive educational platform for students and learners in Egypt";

    return {
        title,
        description,
        icons,
        keywords: locale === 'ar'
            ? "تعليم, دورات, برمجة, تصميم, مصر, منصة تعليمية"
            : locale === 'de'
                ? "Bildung, Kurse, Programmierung, Design, Ägypten, Lernplattform"
                : "education, courses, programming, design, Egypt, learning platform",
        authors: [{ name: "Prime Egypt" }],
        creator: "Prime Egypt",
        publisher: "Prime Egypt",
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        metadataBase: new URL(`https://prime-egypt.com/${locale}`),
        openGraph: {
            title,
            description,
            url: `https://prime-egypt.com/${locale}`,
            siteName: title,
            locale: locale === 'ar' ? 'ar_EG' : locale === 'de' ? 'de_DE' : 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: `https://prime-egypt.com/${locale}`,
            languages: {
                'ar-EG': 'https://prime-egypt.com/ar',
                'en-US': 'https://prime-egypt.com/en',
                'de-DE': 'https://prime-egypt.com/de',
            },
        },
    };
}

export default async function RootLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    // Ensure that the incoming `locale` is valid
    const { locale } = await params;
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages({ locale });
    const isRTL = locale === 'ar';

    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            <div data-locale={locale} dir={isRTL ? 'rtl' : 'ltr'}>
                <Providers>
                    <PageTransitionProvider>
                        <MainLayout>
                            {children}
                        </MainLayout>
                    </PageTransitionProvider>
                </Providers>
            </div>
        </NextIntlClientProvider>
    );
}