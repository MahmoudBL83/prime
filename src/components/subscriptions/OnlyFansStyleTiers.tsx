'use client'

import { motion } from 'framer-motion'
import { Check, Crown, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnlyFansStyleTiersProps {
    mentorName: string
    currentTier?: 'ALL_ACCESS' | 'BASIC' | 'PREMIUM' | 'VIP' | null
    onSubscribe: (tier: 'ALL_ACCESS') => void
    loading?: boolean
    locale?: string
    basicPrice?: number
}

export default function OnlyFansStyleTiers({
    mentorName,
    currentTier,
    onSubscribe,
    loading = false,
    locale = 'en',
    basicPrice = 49
}: OnlyFansStyleTiersProps) {
    const isArabic = locale === 'ar'
    const isActive = currentTier === 'ALL_ACCESS' || !!currentTier

    const benefits = isArabic
        ? [
            'كل المنشورات والوسائط الحصرية',
            'جلسات مباشرة أسبوعية',
            'وصول للمجتمع والمناقشات',
            'مراسلات ذات أولوية',
            'حجوزات عبر التقويم'
          ]
        : [
            'All exclusive posts & media',
            'Weekly live sessions',
            'Community & discussions access',
            'Priority messaging',
            'Calendar bookings'
          ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative max-w-md mx-auto"
        >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                    <Crown className="w-3 h-3 inline mr-1" />
                    {isArabic ? 'وصول شامل' : 'All-Access'}
                </div>
            </div>

            <div className={`bg-gray-900/50 backdrop-blur-xl border rounded-2xl p-6 flex flex-col border-purple-500/50 ${isActive ? 'ring-2 ring-green-500' : ''}`}>
                <h3 className="text-xl font-bold text-foreground mb-2">
                    {isArabic ? 'خطة وصول شامل' : 'All-Access Plan'}
                </h3>

                <div className="mb-4">
                    <span className="text-4xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        €{basicPrice}
                    </span>
                    <span className="text-muted-foreground ml-2">{isArabic ? '/شهر' : '/mo'}</span>
                </div>

                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-400 text-sm font-bold">
                        <Calendar className="w-4 h-4" />
                        <span>{isArabic ? 'جلسات مباشرة أسبوعية' : 'Weekly Live Sessions Included'}</span>
                    </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                    {benefits.map((benefit, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <span>{benefit}</span>
                        </li>
                    ))}
                </ul>

                <Button
                    onClick={() => onSubscribe('ALL_ACCESS')}
                    disabled={loading || isActive}
                    className={`w-full py-3 rounded-xl font-bold ${
                        isActive
                            ? 'bg-green-600 hover:bg-green-600 cursor-default'
                            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-400 hover:to-blue-400'
                    }`}
                >
                    {isActive ? (
                        <>✓ {isArabic ? 'مشترك' : 'Subscribed'}</>
                    ) : (
                        isArabic ? 'اشترك الآن' : 'Subscribe Now'
                    )}
                </Button>
            </div>
        </motion.div>
    )
}
