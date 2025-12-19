'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'

const resetSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ResetForm = z.infer<typeof resetSchema>

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const locale = useLocale()
    const isRTL = locale === 'ar'

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
        resolver: zodResolver(resetSchema)
    })

    const onSubmit = async (data: ResetForm) => {
        if (!token) {
            setStatus('error')
            setMessage(isRTL ? 'رمز التحقق مفقود' : 'Invalid request: missing token')
            return
        }

        setStatus('loading')
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: data.password
                })
            })

            const result = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password has been reset successfully')
            } else {
                setStatus('error')
                setMessage(result.message || (isRTL ? 'فشل إعادة تعيين كلمة المرور' : 'Failed to reset password'))
            }
        } catch (error) {
            setStatus('error')
            setMessage(isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred')
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? 'رابط غير صالح' : 'Invalid Link'}</h2>
                    <p className="text-gray-400 mb-6">{isRTL ? 'رابط إعادة تعيين كلمة المرور غير صالح أو مفقود.' : 'The password reset link is invalid or missing.'}</p>
                    <Link href="/auth/login" className="text-[#0a84ff] hover:text-[#0a84ff]/80">
                        {isRTL ? 'العودة لتسجيل الدخول' : 'Return to Login'}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
                {status === 'success' ? (
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        >
                            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRTL ? 'تم بنجاح!' : 'Success!'}
                        </h2>
                        <p className="text-gray-300 mb-8">
                            {message}
                        </p>
                        <Link
                            href="/auth/login"
                            className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center w-full"
                        >
                            {isRTL ? 'تسجيل الدخول' : 'Sign In Now'}
                            <ArrowRight className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <Lock className="w-12 h-12 text-[#0a84ff] mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {isRTL ? 'تعيين كلمة المرور الجديدة' : 'Reset Password'}
                            </h2>
                            <p className="text-gray-400">
                                {isRTL ? 'أدخل كلمة المرور الجديدة أدناه' : 'Enter your new password below'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all placeholder-gray-500"
                                        placeholder={isRTL ? '******' : '******'}
                                        disabled={status === 'loading'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('confirmPassword')}
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all placeholder-gray-500"
                                        placeholder={isRTL ? '******' : '******'}
                                        disabled={status === 'loading'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {status === 'error' && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {message}
                                </div>
                            )}

                            <motion.button
                                type="submit"
                                disabled={status === 'loading'}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white py-4 px-6 rounded-lg font-medium text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {status === 'loading'
                                    ? (isRTL ? 'جاري التحديث...' : 'Resetting...')
                                    : (isRTL ? 'تحديث كلمة المرور' : 'Reset Password')
                                }
                            </motion.button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#1f1f1f]" />}>
            <ResetPasswordContent />
        </Suspense>
    )
}
