'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Check, Sparkles, Mail, CheckCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
            color: 'from-purple-500 to-blue-500',
            borderColor: 'border-purple-500/40',
            bgColor: 'from-purple-500/10 to-blue-500/10',
            icon: '🎯',
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border border-border rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border p-6">
                            <button
                                onClick={handleClose}
                                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            
                            <div className="flex items-center gap-4">
                                {creator.user.profileImage ? (
                                    <Image
                                        src={creator.user.profileImage}
                                        alt={creator.user.name}
                                        width={64}
                                        height={64}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">
                                            {creator.user.name[0]}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-black text-foreground">
                                        {emailSent 
                                            ? (isArabic ? 'تحقق من بريدك' : 'Check Your Email')
                                            : (isArabic ? 'اشترك في' : 'Subscribe to')
                                        } {!emailSent && creator.user.name}
                                    </h2>
                                    <p className="text-muted-foreground">{creator.expertise}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {emailSent ? (
                                /* Email Sent State */
                                <div className="text-center py-8 space-y-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
                                    >
                                        <CheckCircle className="w-10 h-10 text-green-500" />
                                    </motion.div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">
                                            {isArabic ? 'تم إرسال رابط الدفع!' : 'Payment Link Sent!'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {isArabic 
                                                ? `تم إرسال رابط الدفع الآمن إلى ${session?.user?.email}`
                                                : `A secure payment link has been sent to ${session?.user?.email}`
                                            }
                                        </p>
                                    </div>
                                    <div className="bg-card/50 border border-border rounded-xl p-4">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <Mail className="w-5 h-5" />
                                            <span className="text-sm">
                                                {isArabic 
                                                    ? 'افحص صندوق الوارد (وأحياناً البريد المزعج)'
                                                    : 'Check your inbox (and sometimes spam folder)'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleClose}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-full"
                                    >
                                        {isArabic ? 'حسناً' : 'Got It'}
                                    </Button>
                                </div>
                            ) : (
                                /* Subscribe Form */
                                <>
                                    <p className="text-center text-muted-foreground mb-6">
                                        {isArabic 
                                            ? 'خطة واحدة تمنحك كل شيء'
                                            : 'One simple plan with everything included'}
                                    </p>

                                    {/* Single Tier Card */}
                                    <div className="grid grid-cols-1 gap-4 mb-6">
                                        {tiers.map((tier) => (
                                            <motion.div
                                                key={tier.id}
                                                whileHover={{ scale: 1.01 }}
                                                className={`relative text-left bg-gradient-to-br ${tier.bgColor} border-2 ${tier.borderColor} rounded-2xl p-6 transition-all shadow-lg`}
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <div className="text-3xl mb-2">{tier.icon}</div>
                                                        <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                                                        <Crown className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>

                                                <div className="mb-4">
                                                    <span className={`text-3xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                                                        €{tier.price}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">
                                                        /{isArabic ? 'شهر' : 'month'}
                                                    </span>
                                                </div>

                                                <ul className="space-y-2">
                                                    {tier.benefits.map((benefit, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm">
                                                            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                                            <span className="text-muted-foreground">{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* User Email Info */}
                                    {session?.user?.email && (
                                        <div className="bg-card/50 border border-border rounded-xl p-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                    <CreditCard className="w-5 h-5 text-purple-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-foreground font-medium">
                                                        {isArabic ? 'دفع آمن' : 'Secure Payment'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? 'ستتم إعادة توجيهك إلى صفحة الدفع' : "You'll be redirected to checkout"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Subscribe Button */}
                                    <Button
                                        onClick={handleSubscribe}
                                        disabled={isProcessing}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 text-lg rounded-full shadow-lg"
                                    >
                                        {isProcessing ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 mr-2" />
                                                {isArabic ? `اشترك الآن - €${tiers[0].price}/شهر` : `Subscribe Now - €${tiers[0].price}/mo`}
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-center text-xs text-muted-foreground mt-4">
                                        {isArabic 
                                            ? 'التجديد التلقائي شهرياً. يمكنك الإلغاء في أي وقت.'
                                            : 'Auto-renews monthly. Cancel anytime.'}
                                    </p>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
