'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

// Prevent static generation for redirect pages
export const dynamic = 'force-dynamic'

export default function CoursesPage() {
    const router = useRouter()
    const locale = useLocale()

    useEffect(() => {
        // Redirect to the locale-based courses page
        router.push(`/${locale}/courses`)
    }, [router, locale])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-4">
                    Redirecting...
                </h2>
                <p className="text-[hsl(var(--muted-foreground))]">
                    Please wait while we redirect you to the courses page.
                </p>
            </div>
        </div>
    )
}

export const runtime = 'edge'
