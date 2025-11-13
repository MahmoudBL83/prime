'use client'

import { motion } from 'framer-motion'
import { Check, Crown, Sparkles, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnlyFansStyleTiersProps {
    mentorName: string
    currentTier?: 'BASIC' | 'PREMIUM' | 'VIP' | null
    onSubscribe: (tier: 'BASIC' | 'PREMIUM' | 'VIP') => void
    loading?: boolean
    locale?: string
}

const tiers = [
    {
        name: 'BASIC',
        price: 49,
        nameAr: 'أساسي',
        benefits: ['All exclusive posts', 'Photo & video content', 'Community access']
    },
    {
        name: 'PREMIUM',
        price: 99,
        nameAr: 'بريميوم',
        benefits: ['Everything in Basic', 'HD videos', 'Priority messages', 'Exclusive stories'],
        popular: true
    },
    {
        name: 'VIP',
        price: 199,
        nameAr: 'في آي بي',
        benefits: ['Everything in Premium', '2 × 1-on-1 video calls/month', 'Direct messaging', 'Custom content requests'],
        premium: true
    }
]

export default function OnlyFansStyleTiers({
    mentorName,
    currentTier,
    onSubscribe,
    loading = false,
    locale = 'en'
}: OnlyFansStyleTiersProps) {
    const isArabic = locale === 'ar'

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier, i) => {
                const isActive = currentTier === tier.name
                
                return (
                    <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative"
                    >
                        {tier.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-foreground px-3 py-1 rounded-full text-xs font-bold">
                                    <Sparkles className="w-3 h-3 inline mr-1" />
                                    {isArabic ? 'الأكثر شعبية' : 'Most Popular'}
                                </div>
                            </div>
                        )}
                        
                        <div className={`bg-gray-900/50 backdrop-blur-xl border rounded-2xl p-6 h-full flex flex-col ${
                            tier.premium ? 'border-yellow-500/50' : tier.popular ? 'border-purple-500/50' : 'border-border'
                        } ${isActive ? 'ring-2 ring-green-500' : ''}`}>
                            
                            {tier.premium && (
                                <div className="flex items-center gap-2 mb-3">
                                    <Crown className="w-5 h-5 text-yellow-500" />
                                    <span className="text-yellow-500 font-bold text-sm">VIP</span>
                                </div>
                            )}
                            
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {isArabic ? tier.nameAr : tier.name}
                            </h3>
                            
                            <div className="mb-4">
                                <span className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    {tier.price}
                                </span>
                                <span className="text-muted-foreground ml-2">{isArabic ? 'ج.م/شهر' : 'EGP/mo'}</span>
                            </div>

                            {tier.name === 'VIP' && (
                                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                    <div className="flex items-center gap-2 text-purple-400 text-sm font-bold">
                                        <Calendar className="w-4 h-4" />
                                        <span>{isArabic ? 'جلستان 1-على-1' : '2 × 1-on-1 Sessions'}</span>
                                    </div>
                                </div>
                            )}
                            
                            <ul className="space-y-2 mb-6 flex-1">
                                {tier.benefits.map((benefit, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <Button
                                onClick={() => onSubscribe(tier.name as any)}
                                disabled={loading || isActive}
                                className={`w-full py-3 rounded-xl font-bold ${
                                    isActive
                                        ? 'bg-green-600 hover:bg-green-600 cursor-default'
                                        : tier.premium
                                        ? 'bg-gradient-to-r from-yellow-500 to-pink-500 hover:from-yellow-400 hover:to-pink-400'
                                        : tier.popular
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500'
                                        : 'bg-white/10 hover:bg-white/20'
                                }`}
                            >
                                {isActive ? (
                                    <>✓ {isArabic ? 'مشترك' : 'Subscribed'}</>
                                ) : (
                                    isArabic ? 'اشترك' : 'Subscribe'
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
