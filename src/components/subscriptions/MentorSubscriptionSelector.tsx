'use client'

import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, Lock, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TierOption {
    name: string
    nameAr: string
    monthlyPrice: number
    yearlyPrice?: number
    color: string
    popular?: boolean
}

const defaultTiers: TierOption[] = [
    {
        name: 'Basic',
        nameAr: 'أساسي',
        monthlyPrice: 49,
        yearlyPrice: 490,
        color: 'from-blue-500 to-cyan-500'
    },
    {
        name: 'Premium',
        nameAr: 'بريميوم',
        monthlyPrice: 99,
        yearlyPrice: 990,
        color: 'from-purple-500 to-pink-500',
        popular: true
    },
    {
        name: 'VIP',
        nameAr: 'في آي بي',
        monthlyPrice: 199,
        yearlyPrice: 1990,
        color: 'from-yellow-500 to-orange-500'
    }
]

interface MentorSubscriptionSelectorProps {
    mentorId: string
    mentorName: string
    currentTier?: string
    onSubscribe?: (tier: string, billingCycle: 'monthly' | 'yearly') => void
    loading?: boolean
    locale?: string
}

export default function MentorSubscriptionSelector({
    mentorId,
    mentorName,
    currentTier,
    onSubscribe,
    loading = false,
    locale = 'en'
}: MentorSubscriptionSelectorProps) {
    const isArabic = locale === 'ar'

    return (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl max-w-4xl w-full border border-purple-500/30 shadow-2xl shadow-purple-500/20"
            >
                {/* Header */}
                <div className="p-8 border-b border-border">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-foreground mb-2">
                            {isArabic ? `اشترك في ${mentorName}` : `Subscribe to ${mentorName}`}
                        </h2>
                        <p className="text-muted-foreground">
                            {isArabic 
                                ? 'اختر خطة الاشتراك للوصول إلى المحتوى الحصري'
                                : 'Choose a subscription plan to unlock exclusive content'
                            }
                        </p>
                    </div>
                </div>

                {/* Tiers */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {defaultTiers.map((tier) => {
                        const isCurrentTier = currentTier?.toLowerCase() === tier.name.toLowerCase()
                        
                        return (
                            <motion.div
                                key={tier.name}
                                whileHover={{ scale: 1.02 }}
                                className={`relative rounded-2xl overflow-hidden ${
                                    tier.popular ? 'ring-2 ring-purple-500' : ''
                                }`}
                            >
                                {/* Popular Badge */}
                                {tier.popular && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-foreground">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            {isArabic ? 'شائع' : 'Popular'}
                                        </Badge>
                                    </div>
                                )}

                                {/* Card */}
                                <div className={`bg-gradient-to-br ${tier.color} p-6 text-foreground h-full flex flex-col`}>
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-black mb-1">
                                            {isArabic ? tier.nameAr : tier.name}
                                        </h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-black">
                                                €{tier.monthlyPrice}
                                            </span>
                                            <span className="text-sm opacity-80">
                                                {isArabic ? '/شهر' : '/mo'}
                                            </span>
                                        </div>
                                        {tier.yearlyPrice && (
                                            <p className="text-xs opacity-70 mt-1">
                                                {isArabic ? 'أو' : 'or'} €{tier.yearlyPrice} {isArabic ? '/سنة' : '/year'}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex-1 mb-6">
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 flex-shrink-0" />
                                                {isArabic ? 'جميع المنشورات' : 'All posts'}
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-4 h-4 flex-shrink-0" />
                                                {isArabic ? 'المحتوى الحصري' : 'Exclusive content'}
                                            </li>
                                            {tier.name === 'Premium' && (
                                                <>
                                                    <li className="flex items-center gap-2">
                                                        <Check className="w-4 h-4 flex-shrink-0" />
                                                        {isArabic ? 'رسائل مباشرة' : 'Direct messages'}
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Check className="w-4 h-4 flex-shrink-0" />
                                                        {isArabic ? 'محتوى مميز' : 'Premium content'}
                                                    </li>
                                                </>
                                            )}
                                            {tier.name === 'VIP' && (
                                                <>
                                                    <li className="flex items-center gap-2">
                                                        <Crown className="w-4 h-4 flex-shrink-0" />
                                                        {isArabic ? 'كل شيء في بريميوم' : 'Everything in Premium'}
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Crown className="w-4 h-4 flex-shrink-0" />
                                                        {isArabic ? 'جلسات 1-على-1' : '1-on-1 sessions'}
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <Crown className="w-4 h-4 flex-shrink-0" />
                                                        {isArabic ? 'محتوى VIP فقط' : 'VIP-only content'}
                                                    </li>
                                                </>
                                            )}
                                        </ul>
                                    </div>

                                    <Button
                                        onClick={() => onSubscribe?.(tier.name, 'monthly')}
                                        disabled={loading || isCurrentTier}
                                        className={`w-full bg-background text-foreground hover:bg-card-hover font-bold py-3 rounded-xl ${
                                            isCurrentTier ? 'opacity-50 cursor-default' : ''
                                        }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                                                {isArabic ? 'جاري...' : 'Processing...'}
                                            </span>
                                        ) : isCurrentTier ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Check className="w-4 h-4" />
                                                {isArabic ? 'الخطة الحالية' : 'Current Plan'}
                                            </span>
                                        ) : (
                                            isArabic ? 'اشترك الآن' : 'Subscribe Now'
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border text-center">
                    <p className="text-muted-foreground text-sm mb-4">
                        {isArabic 
                            ? '✓ إلغاء في أي وقت • ✓ ضمان استرداد الأموال لمدة 30 يوم'
                            : '✓ Cancel anytime • ✓ 30-day money-back guarantee'
                        }
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
