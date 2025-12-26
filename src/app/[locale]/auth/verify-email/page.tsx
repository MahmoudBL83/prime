'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const locale = useLocale()
    const isRTL = false // RTL disabled - platform only supports German and English

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage(isRTL ? 'رابط التحقق غير صالح' : 'Invalid verification link')
            return
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                })

                const data = await response.json()

                if (response.ok) {
                    setStatus('success')
                    setMessage(isRTL ? 'تم تأكيد بريدك الإلكتروني بنجاح!' : 'Your email has been successfully verified!')
                } else {
                    setStatus('error')
                    setMessage(data.message || (isRTL ? 'فشل التحقق من البريد الإلكتروني' : 'Failed to verify email'))
                }
            } catch (error) {
                setStatus('error')
                setMessage(isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred')
            }
        }

        verifyEmail()
    }, [token, isRTL])

    return (
        <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-[#0a84ff] animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? 'جاري التحقق...' : 'Verifying...'}
                        </h2>
                        <p className="text-gray-400">
                            {isRTL ? 'يرجى الانتظار بينما نتحقق من بريدك الإلكتروني' : 'Please wait while we verify your email address'}
                        </p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        >
                            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? 'تم التحقق بنجاح' : 'Verified Successfully'}
                        </h2>
                        <p className="text-gray-300 mb-8">
                            {message}
                        </p>
                        <Link
                            href="/auth/login"
                            className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center"
                        >
                            {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                            <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        >
                            <XCircle className="w-20 h-20 text-red-500 mb-6" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? 'فشل التحقق' : 'Verification Failed'}
                        </h2>
                        <p className="text-red-400 mb-8">
                            {message}
                        </p>
                        <Link
                            href="/"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            {isRTL ? 'العودة للصفحة الرئيسية' : 'Return to Home'}
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1f1f1f]" />}>
            <VerifyEmailContent />
        </Suspense>
    )
}
