'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle,
    Shield,
    Star,
    Users,
    BookOpen,
    Award,
    Zap,
    Clock,
    Headphones,
    TrendingUp,
    X,
    Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PLATFORM_PRICING, getPlanPrice, getBundleSavings, type PlanType } from '@/lib/pricing'

type SubscriptionPlan = 'CATEGORY_A' | 'CATEGORY_B' | 'CATEGORY_C' | 'BUNDLE_AB' | 'BUNDLE_ABC'

export default function SubscribePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('CATEGORY_A')
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [openFAQ, setOpenFAQ] = useState<number | null>(null)
    const [courseCounts, setCourseCounts] = useState({ categoryA: 500, categoryB: 87, categoryC: 142 })
    const [isLoading, setIsLoading] = useState(false)

    const isArabic = locale === 'ar'

    // Fetch actual course counts
    useEffect(() => {
        async function fetchCourseCounts() {
            try {
                const response = await fetch('/api/subscriptions/status')
                if (response.ok) {
                    const data = await response.json()
                    if (data.availableCourseCounts) {
                        setCourseCounts(data.availableCourseCounts)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch course counts:', error)
            }
        }
        fetchCourseCounts()
    }, [])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/subscribe`)
        }
    }, [status, router, locale])

    const handleSubscribe = async (plan: SubscriptionPlan) => {
        if (status !== 'authenticated') {
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/subscribe`)
            return
        }

        setIsLoading(true)
        setSelectedPlan(plan)

        try {
            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: plan,
                    billingCycle,
                    // In production, integrate with Paymob/Stripe for payment
                    paymentMethodId: 'demo_payment_method'
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(
                    isArabic 
                        ? `تم الاشتراك بنجاح! لديك الآن وصول إلى ${data.enrollmentCount} دورة`
                        : `Successfully subscribed! You now have access to ${data.enrollmentCount} courses`
                )
                // Redirect to my learning dashboard
                setTimeout(() => router.push(`/${locale}/dashboard/my-learning`), 1500)
            } else {
                toast.error(data.error || 'Subscription failed')
            }
        } catch (error) {
            console.error('Subscription error:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleFAQ = (index: number) => {
        setOpenFAQ(openFAQ === index ? null : index)
    }

    const getPrice = (planType: string) => {
        return getPlanPrice(planType as PlanType, billingCycle)
    }

    const getSavingsAmount = (planType: string) => {
        return getBundleSavings(planType as PlanType, billingCycle)
    }

    const faqItems = [
        {
            question: isArabic ? "كيف يعمل نظام الاشتراك؟" : "How does the subscription system work?",
            answer: isArabic 
                ? "عند الاشتراك، تحصل فوراً على وصول لجميع الدورات في الفئة التي اخترتها. لا حاجة للتسجيل يدوياً - كل الدورات متاحة لك على الفور!"
                : "When you subscribe, you instantly get access to ALL courses in your chosen category. No manual enrollment needed - all courses are immediately available!"
        },
        {
            question: isArabic ? "هل يمكنني الترقية أو الإلغاء لاحقاً؟" : "Can I upgrade or cancel later?",
            answer: isArabic
                ? "نعم! يمكنك الترقية في أي وقت، والإلغاء مع الاحتفاظ بالوصول حتى نهاية فترة الفوترة الحالية."
                : "Yes! You can upgrade anytime, and cancel while keeping access until the end of your current billing period."
        },
        {
            question: isArabic ? "ما الفرق بين الفئات؟" : "What's the difference between categories?",
            answer: isArabic
                ? "الفئة أ: مكتبة شاملة من جميع المنشئين. الفئة ب: دورات مميزة منسقة. الفئة ج: محتوى حصري من منشئين محددين."
                : "Category A: Broad library from all creators. Category B: Premium curated courses. Category C: Exclusive content from specific creators."
        },
        {
            question: isArabic ? "هل أحتاج لسلة تسوق؟" : "Do I need a shopping cart?",
            answer: isArabic
                ? "لا! نحن نعمل بنموذج الاشتراك فقط - اشترك وابدأ التعلم فوراً، لا حاجة لشراء دورات فردية."
                : "No! We use a subscription-only model - subscribe and start learning instantly, no need to purchase individual courses."
        }
    ]

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            
            {/* Hero Section */}
            <div className="relative z-10">
                <div className="backdrop-blur-sm bg-gradient-to-r from-purple-900/80 to-blue-900/80 py-20 px-6 border-b border-white/10">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-purple-200">{isArabic ? 'اشترك الآن واحصل على وصول فوري' : 'Subscribe Now & Get Instant Access'}</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-6 tracking-tight">
                            {isArabic ? 'خطط اشتراك PRIME' : 'PRIME Subscription Plans'}
                        </h1>
                        <p className="text-xl md:text-2xl mb-12 text-purple-100/80 leading-relaxed max-w-3xl mx-auto">
                            {isArabic 
                                ? 'اشترك مرة واحدة واحصل على وصول فوري لمئات الدورات - لا حاجة لسلة تسوق أو شراء دورات فردية!'
                                : 'Subscribe once and get instant access to hundreds of courses - no cart, no individual purchases!'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <div className="flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-2">
                                <Shield className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-purple-100">{isArabic ? 'دفع آمن' : 'Secure Payment'}</span>
                            </div>
                            <div className="flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-purple-100">{isArabic ? 'استرداد خلال 7 أيام' : '7-Day Money Back'}</span>
                            </div>
                            <div className="flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-4 py-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm text-purple-100">{isArabic ? 'وصول فوري' : 'Instant Access'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                <div className="flex items-center justify-center gap-6 mb-12">
                    <span className={`text-lg font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-purple-300' : 'text-gray-400'}`}>
                        {isArabic ? 'شهري' : 'Monthly'}
                    </span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className="relative inline-flex h-8 w-14 items-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg hover:shadow-xl"
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${billingCycle === 'yearly' ? (isArabic ? '-translate-x-7' : 'translate-x-7') : (isArabic ? '-translate-x-1' : 'translate-x-1')}`} />
                    </button>
                    <span className={`text-lg font-semibold transition-colors ${billingCycle === 'yearly' ? 'text-blue-300' : 'text-gray-400'}`}>
                        {isArabic ? 'سنوي' : 'Yearly'} 
                        <Badge className={`${isArabic ? 'mr-2' : 'ml-2'} bg-gradient-to-r from-green-500 to-emerald-600 border-none shadow-lg`}>
                            {isArabic ? 'وفر 20%' : 'Save 20%'}
                        </Badge>
                    </span>
                </div>

                {/* Pricing Grid - 3 Columns for main plans */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    {/* Category A - All-Access Library */}
                    <PricingCard
                        title={isArabic ? 'المكتبة الشاملة' : 'All-Access Library'}
                        subtitle={isArabic ? 'فئة أ' : 'Category A'}
                        description={isArabic ? `وصول غير محدود لـ ${courseCounts.categoryA}+ دورة` : `Unlimited access to ${courseCounts.categoryA}+ courses`}
                        price={getPrice('CATEGORY_A')}
                        billingCycle={billingCycle}
                        icon={<BookOpen className="w-10 h-10 text-white" />}
                        gradient="from-purple-500 to-blue-600"
                        popular={true}
                        features={[
                            isArabic ? `${courseCounts.categoryA}+ دورة تعليمية` : `${courseCounts.categoryA}+ learning courses`,
                            isArabic ? 'شهادات إتمام' : 'Completion certificates',
                            isArabic ? 'موارد قابلة للتحميل' : 'Downloadable resources',
                            isArabic ? 'دورات جديدة شهرياً' : 'New courses monthly',
                            isArabic ? 'وصول عبر الموبايل' : 'Mobile access',
                            isArabic ? 'دعم أولوي' : 'Priority support'
                        ]}
                        onSubscribe={() => handleSubscribe('CATEGORY_A')}
                        isLoading={isLoading && selectedPlan === 'CATEGORY_A'}
                        isArabic={isArabic}
                    />

                    {/* Category B - Signature Courses */}
                    <PricingCard
                        title={isArabic ? 'الدورات المميزة' : 'Signature Courses'}
                        subtitle={isArabic ? 'فئة ب' : 'Category B'}
                        description={isArabic ? `${courseCounts.categoryB} دورة منسقة ومميزة` : `${courseCounts.categoryB} curated premium courses`}
                        price={getPrice('CATEGORY_B')}
                        billingCycle={billingCycle}
                        icon={<Award className="w-10 h-10 text-white" />}
                        gradient="from-amber-500 to-orange-600"
                        features={[
                            isArabic ? 'محتوى منسق من خبراء' : 'Expert-curated content',
                            isArabic ? 'جودة إنتاج عالية' : 'High production quality',
                            isArabic ? 'مسارات تعليمية موجهة' : 'Guided learning paths',
                            isArabic ? 'مراجعة تحريرية' : 'Editorial review',
                            isArabic ? 'محتوى حصري' : 'Exclusive content',
                            isArabic ? 'شهادات مميزة' : 'Premium certificates'
                        ]}
                        onSubscribe={() => handleSubscribe('CATEGORY_B')}
                        isLoading={isLoading && selectedPlan === 'CATEGORY_B'}
                        isArabic={isArabic}
                    />

                    {/* Category C - Creator Channels */}
                    <PricingCard
                        title={isArabic ? 'قنوات المنشئين' : 'Creator Channels'}
                        subtitle={isArabic ? 'فئة ج' : 'Category C'}
                        description={isArabic ? 'محتوى حصري من منشئين محددين' : 'Exclusive content from specific creators'}
                        price={getPrice('CATEGORY_C')}
                        billingCycle={billingCycle}
                        icon={<Users className="w-10 h-10 text-white" />}
                        gradient="from-green-500 to-emerald-600"
                        features={[
                            isArabic ? 'محتوى حصري' : 'Exclusive content',
                            isArabic ? 'تفاعل مباشر' : 'Direct interaction',
                            isArabic ? 'جلسات مباشرة' : 'Live sessions',
                            isArabic ? 'وصول للمجتمع' : 'Community access',
                            isArabic ? 'وصول مبكر' : 'Early access',
                            isArabic ? 'دعم المنشئين' : 'Support creators'
                        ]}
                        onSubscribe={() => handleSubscribe('CATEGORY_C')}
                        isLoading={isLoading && selectedPlan === 'CATEGORY_C'}
                        isArabic={isArabic}
                    />
                </div>

                {/* Bundle Plans - 2 Columns */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center text-white mb-8">
                        {isArabic ? '🎁 عروض الباقات - وفر أكثر!' : '🎁 Bundle Plans - Save More!'}
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Bundle A+B */}
                        <BundleCard
                            title={isArabic ? 'باقة المكتبة + المميزة' : 'All-Access + Signature Bundle'}
                            subtitle="A + B"
                            description={isArabic ? 'احصل على كل شيء من الفئتين أ و ب' : 'Get everything from Category A & B'}
                            price={getPrice('BUNDLE_AB')}
                            savings={getSavingsAmount('BUNDLE_AB')}
                            billingCycle={billingCycle}
                            gradient="from-purple-600 via-pink-600 to-orange-600"
                            features={[
                                isArabic ? `${courseCounts.categoryA + courseCounts.categoryB}+ دورة إجمالاً` : `${courseCounts.categoryA + courseCounts.categoryB}+ total courses`,
                                isArabic ? 'كل مميزات الفئة أ' : 'All Category A features',
                                isArabic ? 'كل مميزات الفئة ب' : 'All Category B features',
                                isArabic ? 'محتوى منسق وشامل' : 'Curated & comprehensive',
                                isArabic ? `وفر ${getSavingsAmount('BUNDLE_AB')} ج.م/${billingCycle === 'monthly' ? 'شهر' : 'سنة'}` : `Save ${getSavingsAmount('BUNDLE_AB')} EGP/${billingCycle === 'monthly' ? 'mo' : 'yr'}`
                            ]}
                            onSubscribe={() => handleSubscribe('BUNDLE_AB')}
                            isLoading={isLoading && selectedPlan === 'BUNDLE_AB'}
                            isArabic={isArabic}
                            bestValue={true}
                        />

                        {/* Bundle ABC - Everything */}
                        <BundleCard
                            title={isArabic ? 'الباقة الشاملة الكاملة' : 'Ultimate Everything Bundle'}
                            subtitle="A + B + C"
                            description={isArabic ? 'الوصول الكامل لكل شيء في المنصة!' : 'Complete access to EVERYTHING on the platform!'}
                            price={getPrice('BUNDLE_ABC')}
                            savings={getSavingsAmount('BUNDLE_ABC')}
                            billingCycle={billingCycle}
                            gradient="from-indigo-600 via-purple-600 to-pink-600"
                            features={[
                                isArabic ? 'كل الدورات من جميع الفئات' : 'All courses from all categories',
                                isArabic ? 'جميع قنوات المنشئين' : 'All creator channels',
                                isArabic ? 'وصول غير محدود 100%' : '100% unlimited access',
                                isArabic ? 'كل المميزات المتاحة' : 'Every feature available',
                                isArabic ? `أقصى توفير: ${getSavingsAmount('BUNDLE_ABC')} ج.م/${billingCycle === 'monthly' ? 'شهر' : 'سنة'}` : `Maximum savings: ${getSavingsAmount('BUNDLE_ABC')} EGP/${billingCycle === 'monthly' ? 'mo' : 'yr'}`
                            ]}
                            onSubscribe={() => handleSubscribe('BUNDLE_ABC')}
                            isLoading={isLoading && selectedPlan === 'BUNDLE_ABC'}
                            isArabic={isArabic}
                            ultimate={true}
                        />
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mb-16">
                    <h2 className="text-4xl font-bold text-center mb-12 text-white">
                        {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                    </h2>
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqItems.map((faq, index) => (
                            <div 
                                key={index} 
                                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl hover:bg-white/15 hover:border-blue-400/50 transition-all duration-300 cursor-pointer"
                            >
                                <div className="p-6" onClick={() => toggleFAQ(index)}>
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="text-lg font-semibold flex-1 text-white">{faq.question}</h3>
                                        <button className="text-purple-300 hover:text-white transition-colors flex-shrink-0">
                                            {openFAQ === index ? <X className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {openFAQ === index && (
                                        <p className="text-purple-200 mt-4 leading-relaxed">{faq.answer}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="relative text-center backdrop-blur-md bg-gradient-to-r from-purple-900/80 to-blue-900/80 border border-white/20 text-white rounded-3xl p-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                            {isArabic ? 'جاهز للبدء؟' : 'Ready to Get Started?'}
                        </h2>
                        <p className="text-xl md:text-2xl mb-10 text-purple-100 max-w-2xl mx-auto">
                            {isArabic 
                                ? 'انضم لآلاف المتعلمين واحصل على وصول فوري لمئات الدورات!'
                                : 'Join thousands of learners and get instant access to hundreds of courses!'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Button
                                onClick={() => handleSubscribe('BUNDLE_AB')}
                                size="lg"
                                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                                {isArabic ? 'احصل على باقة A+B' : 'Get A+B Bundle'}
                            </Button>
                            <Button
                                onClick={() => handleSubscribe('CATEGORY_A')}
                                size="lg"
                                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold px-8 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                                {isArabic ? 'ابدأ بالمكتبة الشاملة' : 'Start with All-Access'}
                            </Button>
                        </div>
                        <p className="mt-8 text-sm text-purple-200 flex items-center justify-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                {isArabic ? 'ضمان استرداد 7 أيام' : '7-day money-back'}
                            </span>
                            <span className="text-purple-400">•</span>
                            <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                {isArabic ? 'إلغاء في أي وقت' : 'Cancel anytime'}
                            </span>
                            <span className="text-purple-400">•</span>
                            <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                {isArabic ? 'وصول فوري' : 'Instant access'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Pricing Card Component
function PricingCard({ 
    title, 
    subtitle,
    description, 
    price, 
    billingCycle, 
    icon, 
    gradient, 
    popular = false,
    features, 
    onSubscribe, 
    isLoading,
    isArabic 
}: any) {
    return (
        <div className={`relative overflow-hidden backdrop-blur-md bg-white/10 border ${popular ? 'border-purple-400/50 shadow-2xl shadow-purple-500/30' : 'border-white/20'} rounded-3xl hover:bg-white/15 transition-all duration-500 hover:shadow-2xl group`}>
            {popular && (
                <div className={`absolute top-0 ${isArabic ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl'} bg-gradient-to-r ${gradient} text-white px-6 py-2 shadow-lg`}>
                    <Badge className="bg-transparent border-none text-white font-semibold">
                        {isArabic ? '⭐ الأكثر شعبية' : '⭐ Most Popular'}
                    </Badge>
                </div>
            )}
            
            <div className="relative text-center pb-6 pt-12 px-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="mb-2">
                    <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
                    <p className="text-sm text-purple-300 font-semibold">{subtitle}</p>
                </div>
                <p className="text-purple-200 mb-6 min-h-[3rem] flex items-center justify-center">
                    {description}
                </p>
                <div className="mb-6">
                    <span className="text-5xl font-bold text-white">{price}</span>
                    <span className="text-2xl text-purple-300 mx-2">{isArabic ? 'ج.م' : 'EGP'}</span>
                    <span className="text-purple-300">/{billingCycle === 'monthly' ? (isArabic ? 'شهر' : 'mo') : (isArabic ? 'سنة' : 'yr')}</span>
                </div>
            </div>
            
            <div className="relative space-y-4 px-6 pb-8">
                <ul className="space-y-3 mb-8">
                    {features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-3 text-white text-sm">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <Button
                    onClick={onSubscribe}
                    disabled={isLoading}
                    className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-semibold py-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-lg`}
                >
                    {isLoading ? (isArabic ? 'جاري المعالجة...' : 'Processing...') : (isArabic ? 'اشترك الآن' : 'Subscribe Now')}
                </Button>
            </div>
        </div>
    )
}

// Bundle Card Component
function BundleCard({ 
    title, 
    subtitle,
    description, 
    price, 
    savings,
    billingCycle, 
    gradient,
    features, 
    onSubscribe, 
    isLoading,
    isArabic,
    bestValue = false,
    ultimate = false
}: any) {
    return (
        <div className={`relative overflow-hidden backdrop-blur-md bg-white/10 border-2 ${bestValue ? 'border-yellow-400/50' : ultimate ? 'border-pink-400/50' : 'border-white/20'} rounded-3xl hover:bg-white/15 transition-all duration-500 hover:shadow-2xl group`}>
            {(bestValue || ultimate) && (
                <div className={`absolute top-0 ${isArabic ? 'left-0 rounded-br-2xl' : 'right-0 rounded-bl-2xl'} bg-gradient-to-r ${gradient} text-white px-6 py-2 shadow-lg`}>
                    <Badge className="bg-transparent border-none text-white font-semibold text-sm">
                        {ultimate ? (isArabic ? '🏆 الأفضل قيمة' : '🏆 Best Value') : (isArabic ? '💎 موصى به' : '💎 Recommended')}
                    </Badge>
                </div>
            )}
            
            <div className="relative text-center pb-6 pt-12 px-8">
                <div className="mb-4">
                    <h3 className="text-3xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-sm text-purple-300 font-semibold">{subtitle}</p>
                </div>
                <p className="text-purple-200 mb-6">
                    {description}
                </p>
                <div className="mb-4">
                    <span className="text-5xl font-bold text-white">{price}</span>
                    <span className="text-2xl text-purple-300 mx-2">{isArabic ? 'ج.م' : 'EGP'}</span>
                    <span className="text-purple-300">/{billingCycle === 'monthly' ? (isArabic ? 'شهر' : 'mo') : (isArabic ? 'سنة' : 'yr')}</span>
                </div>
                {savings > 0 && (
                    <Badge className="bg-green-500/20 text-green-300 border border-green-400/30 font-semibold px-4 py-1">
                        {isArabic ? `وفر ${savings} ج.م` : `Save ${savings} EGP`}
                    </Badge>
                )}
            </div>
            
            <div className="relative space-y-4 px-8 pb-8">
                <ul className="space-y-3 mb-8">
                    {features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-3 text-white">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
                <Button
                    onClick={onSubscribe}
                    disabled={isLoading}
                    className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 text-white font-semibold py-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 text-lg`}
                >
                    {isLoading ? (isArabic ? 'جاري المعالجة...' : 'Processing...') : (isArabic ? 'اشترك الآن' : 'Subscribe Now')}
                </Button>
            </div>
        </div>
    )
}
