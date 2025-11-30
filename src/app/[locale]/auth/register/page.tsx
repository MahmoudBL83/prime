'use client'

import { Suspense, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'

const baseRegisterSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    birthDate: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid birth date'),
    country: z.string().min(2, 'Country is required'),
})

type RegisterForm = z.infer<typeof baseRegisterSchema>

const countryOptions = [
    'Egypt',
    'Germany',
    'United Arab Emirates',
    'Saudi Arabia',
    'United States',
    'United Kingdom',
]

function RegisterContent() {
    const router = useRouter()
    const t = useTranslations('auth')
    const tCommon = useTranslations('common')
    const locale = useLocale()
    const dir = locale === 'ar' ? 'rtl' : 'ltr'

    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const registerSchema = useMemo(() => baseRegisterSchema.refine((data) => data.password === data.confirmPassword, {
        message: t('passwordMismatch'),
        path: ['confirmPassword'],
    }), [t('passwordMismatch')])

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true)
        try {
            const processedData = {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                birthDate: data.birthDate,
                country: data.country,
            }

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(processedData),
            })

            const result = await res.json()
            if (!res.ok) {
                throw new Error(result?.error || t('registerFail'))
            }

            toast.success(t('registerSuccess'))
            router.push(`/${locale}?auth=signin`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t('registerFail'))
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
                    {[...Array(15)].map((_, i) => {
                        // Static positions to avoid hydration mismatch
                        const positions = [
                            { left: 12, top: 25 }, { left: 87, top: 18 }, { left: 43, top: 82 },
                            { left: 78, top: 47 }, { left: 23, top: 73 }, { left: 92, top: 88 },
                            { left: 18, top: 38 }, { left: 68, top: 28 }, { left: 38, top: 93 },
                            { left: 98, top: 58 }, { left: 8, top: 68 }, { left: 58, top: 13 },
                            { left: 83, top: 78 }, { left: 33, top: 43 }, { left: 73, top: 63 }
                        ];
                        const pos = positions[i] || positions[0];
                        
                        return (
                            <motion.div
                                key={i}
                                className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-20"
                                style={{
                                    left: `${pos.left}%`,
                                    top: `${pos.top}%`,
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
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-2xl"
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
                            <img 
                                src="/images/logo.jpg" 
                                alt="Prime" 
                                className="h-16 w-auto mx-auto"
                                style={{ borderRadius: '12px' }}
                            />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="text-2xl md:text-3xl font-light mb-4 text-white"
                        >
                            {t('createAccount')}
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-gray-300 text-lg font-light"
                        >
                            {locale === 'ar' ? 'انضم إلى منصتنا التعليمية' : 'Join our learning platform'}
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

                            {/* Personal Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('firstName')}
                                    </label>
                                    <input
                                        {...register('firstName')}
                                        type="text"
                                        placeholder={locale === 'ar' ? 'الاسم الأول' : 'First name'}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all placeholder-gray-500"
                                        disabled={isLoading}
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('lastName')}
                                    </label>
                                    <input
                                        {...register('lastName')}
                                        type="text"
                                        placeholder={locale === 'ar' ? 'اسم العائلة' : 'Last name'}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all placeholder-gray-500"
                                        disabled={isLoading}
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('birthDate')}
                                    </label>
                                    <input
                                        {...register('birthDate')}
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all"
                                        disabled={isLoading}
                                    />
                                    {errors.birthDate && (
                                        <p className="mt-1 text-sm text-red-400">{errors.birthDate.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('country')}
                                    </label>
                                    <select
                                        {...register('country')}
                                        className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all"
                                        disabled={isLoading}
                                    >
                                        <option value="" className="bg-gray-900">
                                            {locale === 'ar' ? 'اختر الدولة' : 'Select country'}
                                        </option>
                                        {countryOptions.map((option) => (
                                            <option key={option} value={option} className="bg-gray-900">
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.country && (
                                        <p className="mt-1 text-sm text-red-400">{errors.country.message}</p>
                                    )}
                                </div>
                            </div>

                            {/* Password Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('password')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder={locale === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'}
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t('confirmPassword')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register('confirmPassword')}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder={locale === 'ar' ? 'أكد كلمة المرور' : 'Confirm password'}
                                            className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all placeholder-gray-500"
                                            disabled={isLoading}
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
                            </div>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white py-4 px-6 rounded-lg font-medium text-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? tCommon('loading') : t('register')}
                            </motion.button>

                            {/* Trust Indicators removed */}

                            {/* Login Link */}
                            <div className="text-center mt-6">
                                <p className="text-gray-400">
                                    {t('alreadyHaveAccount')}{' '}
                                    <Link
                                        href="/?auth=signin"
                                        className="text-[#0a84ff] font-medium transition-colors hover:opacity-80"
                                    >
                                        {t('login')}
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

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900"><div className="text-lg text-white">Loading...</div></div>}>
            <RegisterContent />
        </Suspense>
    )
}