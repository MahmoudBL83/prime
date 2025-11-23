'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginContent() {
    const router = useRouter()
    const t = useTranslations('auth')
    const tCommon = useTranslations('common')
    const locale = useLocale()
    const dir = locale === 'ar' ? 'rtl' : 'ltr'

    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Static positions to avoid hydration mismatch
    const particlePositions = [
        { left: 10, top: 20 }, { left: 85, top: 15 }, { left: 45, top: 80 },
        { left: 75, top: 45 }, { left: 25, top: 70 }, { left: 90, top: 85 },
        { left: 15, top: 35 }, { left: 65, top: 25 }, { left: 35, top: 90 },
        { left: 95, top: 55 }, { left: 5, top: 65 }, { left: 55, top: 10 },
        { left: 80, top: 75 }, { left: 40, top: 40 }, { left: 70, top: 60 }
    ]

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    })

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true)
        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                throw new Error(result.error)
            }

            toast.success(t('loginSuccess'))
            router.push(`/${locale}/dashboard`)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('invalidCredentials'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#1f1f1f] relative overflow-hidden" dir={dir}>
            {/* Apple TV style background */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-[#1f1f1f]" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#1f1f1f] via-black to-[#1f1f1f] opacity-80" />
                <div className="absolute inset-0 opacity-10">
                    <div className="w-full h-full bg-gradient-to-r from-[#0a84ff]/10 via-white/5 to-[#0a84ff]/10" />
                </div>

                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {particlePositions.map((position, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-20"
                            style={{
                                left: `${position.left}%`,
                                top: `${position.top}%`,
                            }}
                            animate={{
                                y: [0, -50, 0],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 4 + (i % 3),
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-md"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        {/* Back button */}
                        <div className="flex justify-start mb-6">
                            <Link
                                href="/"
                                className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                <span className="text-sm">{tCommon('back')}</span>
                            </Link>
                        </div>

                        {/* Prime Logo */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="mb-6"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
                                {locale === 'ar' ? 'برايم' : 'Prime'}
                            </h1>
                            <div className="w-16 h-1 mx-auto rounded-full bg-[#0a84ff]"></div>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-2xl md:text-3xl font-light mb-4 text-white"
                        >
                            {t('welcomeBack')}
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-gray-300 text-lg font-light"
                        >
                            {locale === 'ar' ? 'سجّل الدخول إلى حسابك التعليمي' : 'Sign in to your learning account'}
                        </motion.p>
                    </div>

                    {/* Form Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('email')}
                                </label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder={locale === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all placeholder-gray-500"
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('password')}
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={locale === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all placeholder-gray-500"
                                        disabled={isLoading}
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

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white py-4 px-6 rounded-lg font-medium text-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? tCommon('loading') : t('login')}
                            </motion.button>

                            {/* Trust Indicators removed */}

                            {/* Register Link */}
                            <div className="text-center mt-6">
                                <p className="text-gray-400">
                                    {t('dontHaveAccount')}{' '}
                                    <Link
                                        href="/auth/register"
                                        className="text-[#0a84ff] font-medium transition-colors hover:opacity-80"
                                    >
                                        {t('register')}
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </motion.div>

                    
                </motion.div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="text-lg text-white">Loading...</div></div>}>
            <LoginContent />
        </Suspense>
    )
}