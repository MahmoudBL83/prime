'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

export default function DashboardPage() {
    const router = useRouter()
    const locale = useLocale()

    useEffect(() => {
        // Redirect to the locale-based dashboard page
        router.push(`/${locale}/dashboard`)
    }, [router, locale])

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    Redirecting...
                </h2>
                <p className="text-[var(--muted-foreground)]">
                    Please wait while we redirect you to your dashboard.
                </p>
            </div>
        </div>
    )
}
