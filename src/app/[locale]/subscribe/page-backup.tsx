'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle,
    Sparkles,
    ArrowRight,
    Zap,
    TrendingDown,
    ChevronDown,
    Shield,
    Users,
    BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
    type SubscriptionType,
    type BillingCycle,
    getSubscriptionPrice,
    getYearlyMonthlyEquivalent,
    getBundleSavings,
    MONTHLY_PRICES,
    SUBSCRIPTION_FEATURES,
    SUBSCRIPTION_DESCRIPTIONS,
    SUBSCRIPTION_NAMES
} from '@/config/pricing'

export default function SubscribePage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    const isArabic = locale === 'ar'

    const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY')
    const [loading, setLoading] = useState(false)
    const [courseCounts, setCourseCounts] = useState({
        CATEGORY_A: 5,
        CATEGORY_B: 12,
        CATEGORY_C: 0
    })

    useEffect(() => {
        fetchCourseCounts()
    }, [])

    const fetchCourseCounts = async () => {
        try {
            const response = await fetch('/api/subscriptions/status')
            if (response.ok) {
                const data = await response.json()
                if (data.courseCountByCategory) {
                    setCourseCounts(data.courseCountByCategory)
                }
            }
        } catch (error) {
            console.error('Failed to fetch course counts:', error)
        }
    }

    const getPlanPrice = (type: SubscriptionType): number => {
        return getSubscriptionPrice(type, billingCycle)
    }

    const handleSubscribe = async (type: SubscriptionType) => {
        if (!session) {
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/subscribe`)
            return
        }

        // Category C requires browsing channels - redirect to channels page
        if (type === 'CATEGORY_C') {
            router.push(`/${locale}/channels`)
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    billingCycle: billingCycle.toLowerCase()
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(
                    isArabic 
                        ? `تم الاشتراك بنجاح! تم تسجيلك في ${data.enrolledCourses} دورة`
                        : `Subscription successful! You're enrolled in ${data.enrolledCourses} courses`
                )
                router.push(`/${locale}/dashboard/my-learning`)
            } else {
                toast.error(data.error || (isArabic ? 'فشل الاشتراك' : 'Subscription failed'))
            }
        } catch (error) {
            console.error('Subscription error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/30 to-blue-900/30 py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-3 mb-6">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-200 font-medium">
                            {isArabic ? 'عرض محدود: خصم 20% على الخطط السنوية' : 'Limited Offer: 20% Off Yearly Plans'}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-6 leading-tight">
                        {isArabic ? 'اختر خطتك المثالية' : 'Choose Your Perfect Plan'}
                    </h1>
                    <p className="text-xl text-purple-100/80 max-w-3xl mx-auto leading-relaxed">
                        {isArabic 
                            ? 'احصل على وصول فوري إلى مئات الدورات التدريبية عالية الجودة. لا توجد رسوم خفية، ألغِ في أي وقت.'
                            : 'Get instant access to hundreds of high-quality courses. No hidden fees, cancel anytime.'}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-8 mt-12">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">{courseCounts.CATEGORY_A + courseCounts.CATEGORY_B}+</div>
                            <div className="text-purple-300 text-sm uppercase tracking-wider">{isArabic ? 'دورات' : 'Courses'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">10K+</div>
                            <div className="text-purple-300 text-sm uppercase tracking-wider">{isArabic ? 'طلاب' : 'Students'}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white">4.8★</div>
                            <div className="text-purple-300 text-sm uppercase tracking-wider">{isArabic ? 'التقييم' : 'Rating'}</div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Billing Toggle */}
                <div className="flex justify-center items-center gap-4 mb-16">
                    <span className={`text-lg font-semibold transition-colors ${billingCycle === 'MONTHLY' ? 'text-white' : 'text-gray-400'}`}>
                        {isArabic ? 'شهري' : 'Monthly'}
                    </span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY')}
                        className="relative w-20 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-1 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <div className={`w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform ${
                            billingCycle === 'YEARLY' ? 'translate-x-10' : 'translate-x-0'
                        }`}></div>
                    </button>
                    <span className={`text-lg font-semibold transition-colors ${billingCycle === 'YEARLY' ? 'text-white' : 'text-gray-400'}`}>
                        {isArabic ? 'سنوي' : 'Yearly'}
                    </span>
                    {billingCycle === 'YEARLY' && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none shadow-lg px-3 py-1">
                            {isArabic ? 'وفر 20%' : 'Save 20%'}
                        </Badge>
                    )}
                </div>

                {/* Individual Plans */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <PricingCard
                        title={isArabic ? SUBSCRIPTION_NAMES.CATEGORY_A.ar : SUBSCRIPTION_NAMES.CATEGORY_A.en}
                        description={isArabic ? SUBSCRIPTION_DESCRIPTIONS.CATEGORY_A.ar : SUBSCRIPTION_DESCRIPTIONS.CATEGORY_A.en}
                        price={getPlanPrice('CATEGORY_A')}
                        yearlyPrice={billingCycle === 'YEARLY' ? getPlanPrice('CATEGORY_A') : undefined}
                        features={isArabic ? SUBSCRIPTION_FEATURES.CATEGORY_A.ar : SUBSCRIPTION_FEATURES.CATEGORY_A.en}
                        onSubscribe={() => handleSubscribe('CATEGORY_A')}
                        loading={loading}
                        isArabic={isArabic}
                    />
                    
                    <PricingCard
                        title={isArabic ? SUBSCRIPTION_NAMES.CATEGORY_B.ar : SUBSCRIPTION_NAMES.CATEGORY_B.en}
                        description={isArabic ? SUBSCRIPTION_DESCRIPTIONS.CATEGORY_B.ar : SUBSCRIPTION_DESCRIPTIONS.CATEGORY_B.en}
                        price={getPlanPrice('CATEGORY_B')}
                        yearlyPrice={billingCycle === 'YEARLY' ? getPlanPrice('CATEGORY_B') : undefined}
                        features={isArabic ? SUBSCRIPTION_FEATURES.CATEGORY_B.ar : SUBSCRIPTION_FEATURES.CATEGORY_B.en}
                        onSubscribe={() => handleSubscribe('CATEGORY_B')}
                        loading={loading}
                        isArabic={isArabic}
                        isPopular={true}
                    />

                    <PricingCard
                        title={isArabic ? SUBSCRIPTION_NAMES.CATEGORY_C.ar : SUBSCRIPTION_NAMES.CATEGORY_C.en}
                        description={isArabic ? SUBSCRIPTION_DESCRIPTIONS.CATEGORY_C.ar : SUBSCRIPTION_DESCRIPTIONS.CATEGORY_C.en}
                        price={getPlanPrice('CATEGORY_C')}
                        yearlyPrice={billingCycle === 'YEARLY' ? getPlanPrice('CATEGORY_C') : undefined}
                        features={isArabic ? SUBSCRIPTION_FEATURES.CATEGORY_C.ar : SUBSCRIPTION_FEATURES.CATEGORY_C.en}
                        onSubscribe={() => handleSubscribe('CATEGORY_C')}
                        loading={loading}
                        isArabic={isArabic}
                        customButtonText={isArabic ? 'تصفح القنوات' : 'Browse Channels'}
                    />
                </div>

                {/* Bundle Plans */}
                <div className="grid md:grid-cols-2 gap-8">
                    <BundleCard
                        title={isArabic ? SUBSCRIPTION_NAMES.BUNDLE_AB.ar : SUBSCRIPTION_NAMES.BUNDLE_AB.en}
                        description={isArabic ? SUBSCRIPTION_DESCRIPTIONS.BUNDLE_AB.ar : SUBSCRIPTION_DESCRIPTIONS.BUNDLE_AB.en}
                        price={getPlanPrice('BUNDLE_AB')}
                        originalPrice={MONTHLY_PRICES.CATEGORY_A + MONTHLY_PRICES.CATEGORY_B}
                        savings={getBundleSavings('BUNDLE_AB')}
                        yearlyPrice={billingCycle === 'YEARLY' ? getPlanPrice('BUNDLE_AB') : undefined}
                        features={isArabic ? SUBSCRIPTION_FEATURES.BUNDLE_AB.ar : SUBSCRIPTION_FEATURES.BUNDLE_AB.en}
                        onSubscribe={() => handleSubscribe('BUNDLE_AB')}
                        loading={loading}
                        isArabic={isArabic}
                    />

                    <BundleCard
                        title={isArabic ? SUBSCRIPTION_NAMES.BUNDLE_ABC.ar : SUBSCRIPTION_NAMES.BUNDLE_ABC.en}
                        description={isArabic ? SUBSCRIPTION_DESCRIPTIONS.BUNDLE_ABC.ar : SUBSCRIPTION_DESCRIPTIONS.BUNDLE_ABC.en}
                        price={getPlanPrice('BUNDLE_ABC')}
                        originalPrice={MONTHLY_PRICES.CATEGORY_A + MONTHLY_PRICES.CATEGORY_B + MONTHLY_PRICES.CATEGORY_C}
                        savings={getBundleSavings('BUNDLE_ABC')}
                        yearlyPrice={billingCycle === 'YEARLY' ? getPlanPrice('BUNDLE_ABC') : undefined}
                        features={isArabic ? SUBSCRIPTION_FEATURES.BUNDLE_ABC.ar : SUBSCRIPTION_FEATURES.BUNDLE_ABC.en}
                        onSubscribe={() => handleSubscribe('BUNDLE_ABC')}
                        loading={loading}
                        isArabic={isArabic}
                        isUltimate={true}
                    />
                </div>

                {/* Trust Badges */}
                <div className="grid md:grid-cols-3 gap-8 mt-20 mb-16">
                    <div className="text-center p-6 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-purple-500/20">
                        <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-white mb-2">
                            {isArabic ? 'دفع آمن' : 'Secure Payment'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {isArabic ? 'تشفير SSL 256-bit' : '256-bit SSL encryption'}
                        </p>
                    </div>
                    <div className="text-center p-6 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-purple-500/20">
                        <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-white mb-2">
                            {isArabic ? '10,000+ طالب' : '10,000+ Students'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {isArabic ? 'انضم إلى مجتمعنا' : 'Join our community'}
                        </p>
                    </div>
                    <div className="text-center p-6 bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-purple-500/20">
                        <BookOpen className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-white mb-2">
                            {isArabic ? 'ضمان 7 أيام' : '7-Day Guarantee'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {isArabic ? 'استرداد كامل للأموال' : 'Full money-back refund'}
                        </p>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-24 bg-gray-900/40 backdrop-blur-xl rounded-3xl p-12 border border-purple-500/20">
                    <h2 className="text-4xl font-bold text-white text-center mb-12">
                        {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        <FAQItem
                            question={isArabic ? 'هل يمكنني إلغاء الاشتراك في أي وقت؟' : 'Can I cancel my subscription anytime?'}
                            answer={isArabic 
                                ? 'نعم، يمكنك إلغاء اشتراكك في أي وقت. ستحتفظ بالوصول حتى نهاية فترة الفوترة.'
                                : 'Yes, you can cancel your subscription at any time. You\'ll retain access until the end of your billing period.'}
                        />
                        <FAQItem
                            question={isArabic ? 'هل تتوفر فترة تجريبية مجانية؟' : 'Is there a free trial available?'}
                            answer={isArabic 
                                ? 'نقدم ضمان استرداد الأموال لمدة 7 أيام على جميع الاشتراكات.'
                                : 'We offer a 7-day money-back guarantee on all subscriptions.'}
                        />
                        <FAQItem
                            question={isArabic ? 'ماذا يحدث عند الترقية؟' : 'What happens when I upgrade?'}
                            answer={isArabic 
                                ? 'عند الترقية، ستحصل على وصول فوري إلى جميع الدورات في الفئة الجديدة. سنحسب المبلغ المتناسب.'
                                : 'When you upgrade, you get instant access to all courses in the new tier. We\'ll prorate the amount.'}
                        />
                        <FAQItem
                            question={isArabic ? 'هل أحتاج إلى بطاقة ائتمان؟' : 'Do I need a credit card?'}
                            answer={isArabic 
                                ? 'نقبل بطاقات الائتمان والخصم والمحافظ الإلكترونية.'
                                : 'We accept credit cards, debit cards, and digital wallets.'}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// Pricing Card Component
function PricingCard({ 
    title, 
    description, 
    price, 
    yearlyPrice,
    features, 
    onSubscribe, 
    loading,
    isArabic,
    isPopular = false,
    customButtonText
}: any) {
    return (
        <div className={`bg-gray-900/60 backdrop-blur-xl border-2 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 relative overflow-hidden ${
            isPopular ? 'border-purple-500/50 shadow-xl shadow-purple-500/10' : 'border-gray-700/50 hover:border-purple-400/50'
        }`}>
            {isPopular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600"></div>
            )}
            
            <div className="relative z-10">
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold text-white">{title}</h3>
                        {isPopular && (
                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none shadow-md">
                                {isArabic ? 'الأكثر شعبية' : 'Popular'}
                            </Badge>
                        )}
                    </div>
                    <p className="text-gray-400">{description}</p>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white">{price}</span>
                        <span className="text-gray-400">{isArabic ? 'جنيه' : 'EGP'}</span>
                        <span className="text-gray-400">/{isArabic ? 'شهر' : 'mo'}</span>
                    </div>
                    {yearlyPrice && (
                        <p className="text-sm text-purple-400 font-medium mt-2">
                            {isArabic ? `${yearlyPrice} جنيه / سنة` : `${yearlyPrice} EGP / year`}
                        </p>
                    )}
                </div>

                <ul className="space-y-3 mb-8">
                    {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300">{feature}</span>
                        </li>
                    ))}
                </ul>

                <Button
                    onClick={onSubscribe}
                    disabled={loading}
                    className={`w-full ${isPopular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                        : 'bg-gray-800 hover:bg-gray-700'
                    } text-white font-semibold py-6 text-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {isArabic ? 'جاري...' : 'Processing...'}
                        </div>
                    ) : (
                        <>
                            {customButtonText || (isArabic ? 'اشترك الآن' : 'Subscribe Now')}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

// Bundle Card Component
function BundleCard({ 
    title, 
    description, 
    price, 
    originalPrice,
    savings,
    yearlyPrice,
    features, 
    onSubscribe, 
    loading,
    isArabic,
    isUltimate = false
}: any) {
    return (
        <div className={`bg-gradient-to-br rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 relative overflow-hidden border-2 ${
            isUltimate 
                ? 'from-purple-900/40 to-blue-900/40 border-purple-500/50 shadow-purple-500/20 backdrop-blur-xl' 
                : 'from-gray-900/60 to-gray-800/60 border-purple-600/30 backdrop-blur-xl'
        }`}>
            {isUltimate && (
                <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none shadow-lg">
                        <Zap className="w-4 h-4 mr-1" />
                        {isArabic ? 'أفضل قيمة' : 'Best Value'}
                    </Badge>
                </div>
            )}
            
            <div className="relative z-10">
                <div className="mb-6">
                    <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-300">{description}</p>
                </div>

                <div className={`${isUltimate ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-600/10 border-purple-600/20'} border rounded-xl p-4 mb-6`}>
                    <div className={`flex items-center gap-2 ${isUltimate ? 'text-purple-300' : 'text-purple-400'} mb-2`}>
                        <TrendingDown className="w-5 h-5" />
                        <span className="font-semibold">{isArabic ? 'وفر' : 'Save'} {savings} {isArabic ? 'جنيه/شهر' : 'EGP/mo'}</span>
                    </div>
                    <p className="text-sm text-slate-400">
                        {isArabic 
                            ? `مقارنة بـ ${originalPrice} جنيه`
                            : `vs. ${originalPrice} EGP separately`}
                    </p>
                </div>

                <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-bold text-white">{price}</span>
                        <span className="text-slate-300">{isArabic ? 'جنيه' : 'EGP'}</span>
                        <span className="text-slate-300">/{isArabic ? 'شهر' : 'mo'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-gray-400 line-through">{originalPrice} {isArabic ? 'جنيه' : 'EGP'}</span>
                    </div>
                    {yearlyPrice && (
                        <p className="text-sm text-purple-400 font-medium mt-2">
                            {isArabic ? `${yearlyPrice} جنيه / سنة` : `${yearlyPrice} EGP / year`}
                        </p>
                    )}
                </div>

                <ul className="space-y-3 mb-8">
                    {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span className="text-white font-medium">{feature}</span>
                        </li>
                    ))}
                </ul>

                <Button
                    onClick={onSubscribe}
                    disabled={loading}
                    className={`w-full ${isUltimate ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : 'bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50'} text-white font-bold py-7 text-xl transition-all hover:shadow-xl hover:shadow-purple-500/50 disabled:opacity-50`}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {isArabic ? 'جاري...' : 'Processing...'}
                        </div>
                    ) : (
                        <>
                            {isUltimate && <Sparkles className="w-6 h-6 mr-2" />}
                            {isArabic ? 'احصل عليها الآن' : 'Get It Now'}
                            <ArrowRight className="w-6 h-6 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false)
    
    return (
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left"
            >
                <h3 className="text-lg font-semibold text-white pr-4">{question}</h3>
                <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <p className="mt-4 text-gray-400 leading-relaxed">{answer}</p>
            )}
        </div>
    )
}
