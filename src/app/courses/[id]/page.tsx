'use client'

import { useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function CourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()
    const locale = useLocale()

    useEffect(() => {
        // Redirect to the locale-based course detail page
        if (params.id) {
            router.push(`/${locale}/courses/${params.id}`)
        }
    }, [router, locale, params.id])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">
                    Redirecting...
                </h2>
                <p className="text-[hsl(var(--muted-foreground))]">
                    Please wait while we redirect you to the course page.
                </p>
            </div>
        </div>
    )
}