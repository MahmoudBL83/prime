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
        <div className="min-h-screen bg-background relative overflow-hidden" dir={dir}>
            {/* Background with same style as Hero */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-background" />
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-80" />
                <div className="absolute inset-0 opacity-20">
                    <div className="w-full h-full bg-gradient-to-r from-amber-900/20 via-emerald-900/20 to-red-900/20" />
                </div>

                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-0.5 h-0.5 bg-background rounded-full opacity-20"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                y: [0, -50, 0],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 4 + Math.random() * 3,
                                repeat: Infinity,
                                delay: Math.random() * 3,
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
                                href={`/${locale}`}
                                className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors group"
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
                            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-foreground">
                                {locale === 'ar' ? 'برايم' : 'Prime'}
                            </h1>
                            <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-2xl md:text-3xl font-light mb-4 text-foreground"
                        >
                            {t('welcomeBack')}
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-muted-foreground text-lg font-light"
                        >
                            {locale === 'ar' ? 'سجّل الدخول إلى حسابك التعليمي' : 'Sign in to your learning account'}
                        </motion.p>
                    </div>

                    {/* Form Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="bg-gray-900/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl"
                    >
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    {t('email')}
                                </label>
                                <input
                                    {...register('email')}
                                    type="email"
                                    placeholder={locale === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                                    className="w-full bg-gray-800/50 border border-border text-foreground rounded-lg px-4 py-3 focus:ring-2 focus:border-transparent transition-all placeholder-gray-500"
                                    style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                                    disabled={isLoading}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    {t('password')}
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('password')}
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder={locale === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                                        className="w-full bg-gray-800/50 border border-border text-foreground rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:border-transparent transition-all placeholder-gray-500"
                                        style={{ '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
                                className="w-full text-foreground py-4 px-6 rounded-lg font-medium text-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                                style={{ backgroundColor: 'var(--accent)' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? tCommon('loading') : t('login')}
                            </motion.button>

                            {/* Trust Indicators removed */}

                            {/* Register Link */}
                            <div className="text-center mt-6">
                                <p className="text-muted-foreground">
                                    {t('dontHaveAccount')}{' '}
                                    <Link
                                        href={`/${locale}/auth/register`}
                                        className="font-medium transition-colors hover:opacity-80"
                                        style={{ color: 'var(--accent)' }}
                                    >
                                        {t('register')}
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </motion.div>

                    {/* Demo Account Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.0 }}
                        className="mt-6 p-4 bg-gray-800/30 border border-border/50 rounded-lg text-center"
                    >
                        <p className="text-sm text-muted-foreground mb-2">
                            {locale === 'ar' ? 'حسابات تجريبية للاختبار:' : 'Demo accounts for testing:'}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div>Admin: admin@prime.eg / demo123</div>
                            <div>Learner: fatma@demo.com / demo123</div>
                            <div>Creator: dr.sarah@demo.com / demo123</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="text-lg text-foreground">Loading...</div></div>}>
            <LoginContent />
        </Suspense>
    )
}

// Prevent static generation for auth pages
export const dynamic = 'force-dynamic'
