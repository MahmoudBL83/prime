'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Sparkles, Mail, CreditCard, Star } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface SubscribeModalProps {
    isOpen: boolean
    onClose: () => void
    creator: {
        id: string
        channelId?: string
        user: {
            name: string
            arabicName?: string
            profileImage: string | null
        }
        expertise: string
        monthlyPrice: number // Single tier in EUR
    }
    isArabic?: boolean
    onSuccess?: () => void // Add success callback
}

export default function SubscribeModal({ isOpen, onClose, creator, isArabic = false, onSuccess }: SubscribeModalProps) {
    const { data: session } = useSession()
    const [isProcessing, setIsProcessing] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const tiers = [
        {
            id: 'ALL_ACCESS' as const,
            name: isArabic ? 'وصول شامل' : 'All-Access',
            price: creator.monthlyPrice, // Single tier price in EUR
            benefits: [
                isArabic ? 'كل المحتوى والوسائط' : 'All posts & media',
                isArabic ? 'جلسات مباشرة أسبوعية' : 'Weekly live sessions',
                isArabic ? 'أولوية في الرسائل والأسئلة' : 'Priority DMs & Q&A',
                isArabic ? 'حجوزات عبر التقويم' : 'Calendar bookings',
                isArabic ? 'وصول للمجتمع' : 'Community access'
            ]
        }
    ]

    const handleSubscribe = async () => {
        if (!session?.user?.email) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول للمتابعة' : 'Please sign in to continue')
            return
        }

        if (!creator.id) {
            toast.error(isArabic ? 'لا توجد قناة متاحة' : 'No creator available')
            return
        }

        setIsProcessing(true)
        try {
            // Create Stripe checkout session for payment
            const response = await fetch('/api/payments/create-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: creator.monthlyPrice,
                    description: `Mentor Subscription - ${creator.user.name} - €${creator.monthlyPrice}/month`,
                    successUrl: `${window.location.origin}/payment-success?type=mentor&mentorId=${creator.id}&session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: window.location.href,
                    metadata: {
                        type: 'mentor_subscription',
                        mentorId: creator.id,
                        channelId: creator.channelId,
                        userId: session.user.id,
                        tier: 'ALL_ACCESS',
                    }
                })
            })

            const data = await response.json()

            if (response.ok) {
                // If we have a checkout URL, redirect to it
                if (data.paymentUrl) {
                    window.location.href = data.paymentUrl
                } else {
                    // Otherwise, email was sent
                    setEmailSent(true)
                    toast.success(
                        isArabic
                            ? 'تم إرسال رابط الدفع إلى بريدك الإلكتروني!'
                            : 'Payment link sent to your email!'
                    )
                }
            } else {
                toast.error(data.error || (isArabic ? 'فشل إنشاء رابط الدفع' : 'Failed to create payment link'))
            }
        } catch (error) {
            console.error('Subscribe error:', error)
            toast.error(isArabic ? 'حدث خطأ. يرجى المحاولة مرة أخرى.' : 'An error occurred. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleClose = () => {
        setEmailSent(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/95"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative z-10 w-full max-w-md mx-4 my-8 bg-[#1a1a1a] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] flex items-center justify-center transition-all z-10"
                    >
                        <X className="w-4 h-4 text-white/80" />
                    </button>

                    {/* Header */}
                    <div className="flex flex-col items-center pt-12 pb-6 px-8 relative">
                        {/* Creator Avatar with Glow */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-[#0071e3] blur-2xl opacity-20 rounded-full" />
                            <div className="relative w-20 h-20 rounded-full p-1 bg-[#1a1a1a] border border-[#3d3d3d]">
                                {creator.user.profileImage ? (
                                    <Image
                                        src={creator.user.profileImage}
                                        alt={creator.user.name}
                                        fill
                                        className="rounded-full object-cover p-0.5"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-[#2d2d2d] flex items-center justify-center">
                                        <span className="text-2xl font-semibold text-white">
                                            {creator.user.name[0]}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0071e3] rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">
                                <Star className="w-3 h-3 text-white fill-current" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-semibold text-white text-center mb-1">
                            {emailSent
                                ? (isArabic ? 'تحقق من بريدك' : 'Check Your Email')
                                : creator.user.name
                            }
                        </h2>
                        <p className="text-[#86868b] text-sm text-center">
                            {emailSent
                                ? (isArabic ? 'رابط الدفع في الطريق إليك' : 'Payment link sent successfully')
                                : creator.expertise
                            }
                        </p>
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8">
                        {emailSent ? (
                            /* Email Sent State */
                            <div className="space-y-6">
                                <div className="bg-[#2d2d2d] rounded-xl p-4 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#3d3d3d] flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-4 h-4 text-[#0071e3]" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium mb-1">
                                            {isArabic ? 'تم الإرسال!' : 'Email Sent!'}
                                        </p>
                                        <p className="text-[#86868b] text-xs leading-relaxed">
                                            {isArabic
                                                ? `تم إرسال رابط الدفع إلى ${session?.user?.email}. يرجى التحقق من صندوق الوارد.`
                                                : `We sent a secure payment link to ${session?.user?.email}. Please check your inbox.`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 text-sm font-semibold transition-all"
                                >
                                    {isArabic ? 'حسناً' : 'Got it'}
                                </button>
                            </div>
                        ) : (
                            /* Subscribe State */
                            <div className="space-y-6">
                                {/* Price Card */}
                                <div className="bg-[#2d2d2d] rounded-xl border border-[#3d3d3d] p-5">
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-3xl font-bold text-white">€{creator.monthlyPrice}</span>
                                        <span className="text-[#86868b] text-sm">/{isArabic ? 'شهر' : 'month'}</span>
                                    </div>

                                    <div className="space-y-3">
                                        {tiers[0].benefits.map((benefit, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-full bg-[#0071e3]/10 flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-[#0071e3]" />
                                                </div>
                                                <span className="text-sm text-white/80">{benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Security Note */}
                                <div className="flex items-center justify-center gap-2 text-[#86868b] text-xs">
                                    <CreditCard className="w-3 h-3" />
                                    <span>
                                        {isArabic ? 'دفع آمن ومشفر' : 'Secure & Encrypted Payment'}
                                    </span>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={handleSubscribe}
                                    disabled={isProcessing}
                                    className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 text-sm font-semibold transition-all shadow-[0_0_20px_rgba(0,113,227,0.3)] hover:shadow-[0_0_30px_rgba(0,113,227,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {isArabic ? 'جاري المعالجة...' : 'Processing...'}
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
