'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Crown, Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import toast from 'react-hot-toast'

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
    const [isProcessing, setIsProcessing] = useState(false)

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
        if (!creator.channelId && !creator.id) {
            toast.error(isArabic ? 'لا توجد قناة متاحة' : 'No channel available')
            return
        }

        setIsProcessing(true)
        try {
            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'CATEGORY_C',
                    creatorId: creator.id, // Use creator ID directly
                    channelId: creator.channelId, // Optional channel ID
                    tier: 'ALL_ACCESS', // Always use single tier
                    billingCycle: 'monthly',
                    paymentMethodId: null // Will be handled by payment flow later
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(
                    isArabic 
                        ? `تم الاشتراك بنجاح في ${tiers[0].name}!` 
                        : `Successfully subscribed to ${tiers[0].name}!`
                )
                onClose()
                // Call success callback instead of reloading
                if (onSuccess) {
                    onSuccess()
                }
                // Also call global refresh function if it exists (for individual creator pages)
                if (typeof window !== 'undefined' && (window as any).refreshCreatorSubscriptionStatus) {
                    (window as any).refreshCreatorSubscriptionStatus()
                }
            } else {
                toast.error(data.error || (isArabic ? 'فشل الاشتراك' : 'Subscription failed'))
            }
        } catch (error) {
            console.error('Subscribe error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsProcessing(false)
        }
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
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border p-6">
                            <button
                                onClick={onClose}
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
                                        {isArabic ? 'اشترك في' : 'Subscribe to'} {creator.user.name}
                                    </h2>
                                    <p className="text-muted-foreground">{creator.expertise}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
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
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
