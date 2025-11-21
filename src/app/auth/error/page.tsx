'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Suspense } from 'react'

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error') || 'Default'
    const t = useTranslations('auth')
    const tErrors = useTranslations('errors')
    const tCommon = useTranslations('common')
    const locale = useLocale()
    const dir = locale === 'ar' ? 'rtl' : 'ltr'

    const map: Record<string, string> = {
        'Configuration': tErrors('serverError'),
        'AccessDenied': tErrors('permissionDenied'),
        'Verification': tErrors('sessionExpired'),
        'Default': tErrors('somethingWentWrong'),
    }

    const errorMessage = map[error] || tErrors('somethingWentWrong')

    return (
        <div className="min-h-screen flex items-center justify-center bg-background" dir={dir}>
            <div className="max-w-md w-full space-y-8 p-8 bg-gray-900/50 backdrop-blur-xl border border-border/50 rounded-lg shadow">
                <div>
                    <h2 className="text-center text-3xl font-bold text-red-500">{tErrors('somethingWentWrong')}</h2>
                    <p className="mt-2 text-center text-sm text-muted-foreground">{errorMessage}</p>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="text-center">
                        <Link href="/auth/login" className="font-medium text-purple-500 hover:text-purple-400">
                            {tCommon('back')}
                        </Link>
                    </div>

                    <div className="text-center">
                        <Link href="/" className="font-medium text-muted-foreground hover:text-muted-foreground">
                            {tCommon('goHome')}
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-gray-800/30 rounded-md">
                        <p className="text-sm text-muted-foreground">
                            <strong>{locale === 'ar' ? 'رمز الخطأ:' : 'Error code:'}</strong> {error}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">{tErrors('contactSupport')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-lg text-foreground">Loading...</div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    )
}

// Prevent static generation for auth pages
export const dynamic = 'force-dynamic'
