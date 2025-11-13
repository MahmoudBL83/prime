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
        basicMonthlyPrice: number
        premiumMonthlyPrice: number
        vipMonthlyPrice: number
    }
    isArabic?: boolean
    onSuccess?: () => void // Add success callback
}

export default function SubscribeModal({ isOpen, onClose, creator, isArabic = false, onSuccess }: SubscribeModalProps) {
    const [selectedTier, setSelectedTier] = useState<'BASIC' | 'PREMIUM' | 'VIP'>('PREMIUM')
    const [isProcessing, setIsProcessing] = useState(false)

    const tiers = [
        {
            id: 'BASIC' as const,
            name: isArabic ? 'أساسي' : 'Basic',
            price: creator.basicMonthlyPrice,
            color: 'from-gray-500 to-gray-600',
            borderColor: 'border-gray-500/30',
            bgColor: 'from-gray-500/10 to-gray-600/10',
            icon: '🎯',
            benefits: [
                isArabic ? 'جميع المنشورات والتحديثات' : 'Access to all posts & updates',
                isArabic ? 'الوصول إلى المجتمع' : 'Community access',
                isArabic ? 'جلسات مباشرة أسبوعية' : 'Weekly live sessions',
                isArabic ? 'محتوى حصري' : 'Exclusive content'
            ]
        },
        {
            id: 'PREMIUM' as const,
            name: isArabic ? 'مميز' : 'Premium',
            price: creator.premiumMonthlyPrice,
            color: 'from-purple-500 to-pink-500',
            borderColor: 'border-purple-500/50',
            bgColor: 'from-purple-500/10 to-pink-500/10',
            icon: '⭐',
            popular: true,
            benefits: [
                isArabic ? 'كل شيء في الأساسي' : 'Everything in Basic',
                isArabic ? 'جلسات Q&A شهرية' : 'Monthly Q&A sessions',
                isArabic ? 'دعم ذو أولوية' : 'Priority support',
                isArabic ? 'موارد حصرية' : 'Exclusive resources',
                isArabic ? 'خصومات على الدورات' : 'Course discounts'
            ]
        },
        {
            id: 'VIP' as const,
            name: 'VIP',
            price: creator.vipMonthlyPrice,
            color: 'from-yellow-500 to-orange-500',
            borderColor: 'border-yellow-500/30',
            bgColor: 'from-yellow-500/10 to-orange-500/10',
            icon: '👑',
            benefits: [
                isArabic ? 'كل شيء في المميز' : 'Everything in Premium',
                isArabic ? 'جلسات تدريب فردية' : '1-on-1 coaching sessions',
                isArabic ? 'المراسلة المباشرة' : 'Direct messaging',
                isArabic ? 'طلبات محتوى مخصص' : 'Custom content requests',
                isArabic ? 'وصول مبكر للمحتوى' : 'Early content access'
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
                    tier: selectedTier, // Basic, Premium, VIP
                    billingCycle: 'monthly',
                    paymentMethodId: null // Will be handled by payment flow later
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(
                    isArabic 
                        ? `تم الاشتراك بنجاح في ${tiers.find(t => t.id === selectedTier)?.name}!` 
                        : `Successfully subscribed to ${tiers.find(t => t.id === selectedTier)?.name}!`
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
                                    ? 'اختر خطة الاشتراك المناسبة لك'
                                    : 'Choose the subscription plan that\'s right for you'}
                            </p>

                            {/* Tier Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {tiers.map((tier) => (
                                    <motion.button
                                        key={tier.id}
                                        onClick={() => setSelectedTier(tier.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative text-left bg-gradient-to-br ${tier.bgColor} border-2 ${
                                            selectedTier === tier.id ? tier.borderColor : 'border-transparent'
                                        } rounded-2xl p-6 transition-all ${
                                            selectedTier === tier.id ? 'shadow-lg' : ''
                                        }`}
                                    >
                                        {tier.popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                {isArabic ? 'الأكثر شعبية' : 'MOST POPULAR'}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="text-3xl mb-2">{tier.icon}</div>
                                                <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                                            </div>
                                            {selectedTier === tier.id && (
                                                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                                                    <Check className="w-5 h-5 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <span className={`text-3xl font-black bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                                                {tier.price} EGP
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
                                    </motion.button>
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
                                        {isArabic ? `اشترك الآن - ${tiers.find(t => t.id === selectedTier)?.price} EGP/شهر` : `Subscribe Now - ${tiers.find(t => t.id === selectedTier)?.price} EGP/mo`}
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
