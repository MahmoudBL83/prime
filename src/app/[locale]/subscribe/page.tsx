'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Plus, X, Play } from 'lucide-react'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    thumbnail: string
    rating: number
    totalEnrollments: number
    price: number
    creator: {
        user: {
            name: string
            arabicName: string
        }
    }
}

export default function NetflixSubscribePage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    const isArabic = locale === 'ar'

    const [loading, setLoading] = useState(false)
    const [openFAQ, setOpenFAQ] = useState<number | null>(null)
    const [trendingCourses, setTrendingCourses] = useState<Course[]>([])
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

    // Fetch trending courses
    useEffect(() => {
        const fetchTrendingCourses = async () => {
            try {
                const response = await fetch('/api/courses?limit=5')
                const data = await response.json()
                if (data.courses) {
                    setTrendingCourses(data.courses)
                }
            } catch (error) {
                console.error('Failed to fetch trending courses:', error)
            }
        }
        fetchTrendingCourses()
    }, [])

    const handleSubscribe = async (planCategory: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/subscribe`)
            return
        }

        setLoading(true)
        try {
            // Get pricing for the selected plan
            const price = billingCycle === 'yearly' 
                ? (planCategory === 'CATEGORY_A' ? 199 * 12 * 0.8 : 299 * 12 * 0.8) // 20% discount
                : (planCategory === 'CATEGORY_A' ? 199 : 299)

            // Initiate Paymob payment
            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionType: planCategory, // CATEGORY_A or CATEGORY_B
                    amount: price,
                    currency: 'EUR',
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initiate payment')
            }

            // Open Paymob payment iframe
            if (data.iframeUrl) {
                // Create a modal or redirect to payment page
                window.open(data.iframeUrl, '_blank', 'width=600,height=700')
                
                // Alternatively, you could redirect to a payment page
                // router.push(`/payment?paymentKey=${data.paymentKey}&orderId=${data.orderId}`)
                
                toast.success(isArabic ? 'تم فتح صفحة الدفع' : 'Payment page opened')
            } else {
                throw new Error('No payment URL received')
            }
        } catch (error: any) {
            console.error('Payment initiation error:', error)
            toast.error(
                isArabic 
                    ? error.message || 'حدث خطأ أثناء بدء الدفع' 
                    : error.message || 'An error occurred initiating payment'
            )
            setLoading(false)
        }
    }

    const t = {
        en: {
            title: 'Unlimited learning, endless possibilities',
            subtitle: 'Learn anywhere. Cancel anytime.',
            readyText: 'Ready to learn? Enter your email to create or restart your membership.',
            startButton: 'Get Started',
            emailPlaceholder: 'Email address',
            mostPopular: 'Most Popular',
            trendingNow: 'Trending Now',
            
            // Category A - All Access
            allAccessPlan: 'All-Access Library',
            allAccessDesc: 'Access to thousands of courses across every topic. Perfect for curious learners.',
            
            // Category B - Signature
            signaturePlan: 'Signature Premium',
            signatureDesc: 'High-production curated programs from top experts with workbooks and assessments.',
            
            // Bundle A+B
            bundlePlan: 'Complete Bundle',
            bundleDesc: 'Full access to All-Access Library + Signature Premium. Best value for serious learners.',
            
            monthlyPrice: 'Monthly',
            annualPrice: 'Annual (Save 20%)',
            videoQuality: 'Course quality',
            resolution: 'Access level',
            devices: 'Learn on your laptop, phone, and tablet',
            
            faqTitle: 'Frequently Asked Questions',
            faq1Q: 'What is this platform?',
            faq1A: 'This is an Egyptian EdTech platform offering a wide variety of educational courses, mentoring sessions, and learning resources across multiple subjects.',
            faq2Q: 'How much does it cost?',
            faq2A: 'Access our platform on your smartphone, tablet, or computer, all for one fixed monthly fee. Plans range based on your learning needs. No extra costs, no contracts.',
            faq3Q: 'Where can I learn?',
            faq3A: 'Learn anywhere, anytime. Sign in with your account to access courses instantly on any internet-connected device.',
            faq4Q: 'How do I cancel?',
            faq4A: 'Our platform is flexible. There are no contracts and no commitments. You can easily cancel your account online. There are no cancellation fees – start or stop your account anytime.',
            faq5Q: 'What can I learn?',
            faq5A: 'We have an extensive library of courses across technology, business, design, languages, and more. Learn as much as you want, anytime you want.',
            faq6Q: 'What are Signature Courses?',
            faq6A: 'Signature courses are premium, high-production programs from established experts with cinematic video quality, structured workbooks, and comprehensive assessments.',
            
            reasonsTitle: 'More reasons to subscribe',
            enjoyAnywhere: 'Learn on any device',
            enjoyAnywhereDesc: 'Access courses on your laptop, tablet, smartphone - seamlessly synchronized across all devices.',
            downloadCourses: 'Download courses for offline learning',
            downloadCoursesDesc: 'Save your favorite courses and continue learning even without internet connection.',
            personalizedLearning: 'Personalized learning paths',
            personalizedLearningDesc: 'Get course recommendations based on your interests and learning goals.',
            expertMentors: 'Learn from expert mentors',
            expertMentorsDesc: 'Connect with industry professionals and get personalized guidance on your learning journey.',
            
            viewDetails: 'View Details',
            closeModal: 'Close',
            startCourse: 'Start Course',
            enrollments: 'students enrolled'
        },
        ar: {
            title: 'تعلم غير محدود، إمكانيات لا نهائية',
            subtitle: 'تعلم في أي مكان. ألغِ في أي وقت.',
            readyText: 'مستعد للتعلم؟ أدخل بريدك الإلكتروني لإنشاء عضويتك أو إعادة تشغيلها.',
            startButton: 'ابدأ',
            emailPlaceholder: 'عنوان البريد الإلكتروني',
            mostPopular: 'الأكثر شعبية',
            trendingNow: 'الأكثر رواجاً الآن',
            
            // Category A - All Access
            allAccessPlan: 'المكتبة الشاملة',
            allAccessDesc: 'الوصول إلى آلاف الدورات في كل موضوع. مثالي للمتعلمين الفضوليين.',
            
            // Category B - Signature
            signaturePlan: 'البرامج المميزة',
            signatureDesc: 'برامج عالية الإنتاج منسقة من كبار الخبراء مع كتب عمل وتقييمات.',
            
            // Bundle A+B
            bundlePlan: 'الباقة الكاملة',
            bundleDesc: 'وصول كامل للمكتبة الشاملة + البرامج المميزة. أفضل قيمة للمتعلمين الجادين.',
            
            monthlyPrice: 'شهري',
            annualPrice: 'سنوي (وفر 20٪)',
            videoQuality: 'جودة الدورة',
            resolution: 'مستوى الوصول',
            devices: 'تعلم على الكمبيوتر المحمول والهاتف والجهاز اللوحي',
            
            faqTitle: 'الأسئلة الشائعة',
            faq1Q: 'ما هي هذه المنصة؟',
            faq1A: 'هذه منصة تعليمية مصرية تقدم مجموعة واسعة من الدورات التعليمية وجلسات التوجيه وموارد التعلم عبر مواضيع متعددة.',
            faq2Q: 'كم تبلغ التكلفة؟',
            faq2A: 'استخدم منصتنا على هاتفك الذكي أو جهازك اللوحي أو الكمبيوتر، كل ذلك برسوم شهرية ثابتة. الخطط تعتمد على احتياجاتك التعليمية. لا توجد تكاليف إضافية ولا عقود.',
            faq3Q: 'أين يمكنني التعلم؟',
            faq3A: 'تعلم في أي مكان وفي أي وقت. سجّل الدخول باستخدام حسابك للوصول الفوري إلى الدورات على أي جهاز متصل بالإنترنت.',
            faq4Q: 'كيف ألغي اشتراكي؟',
            faq4A: 'منصتنا مرنة. لا توجد عقود ولا التزامات. يمكنك بسهولة إلغاء حسابك عبر الإنترنت. لا توجد رسوم إلغاء - ابدأ أو أوقف حسابك في أي وقت.',
            faq5Q: 'ماذا يمكنني أن أتعلم؟',
            faq5A: 'لدينا مكتبة واسعة من الدورات في التكنولوجيا والأعمال والتصميم واللغات والمزيد. تعلم بقدر ما تريد، في أي وقت تريد.',
            faq6Q: 'ما هي الدورات المميزة؟',
            faq6A: 'الدورات المميزة هي برامج متميزة عالية الإنتاج من خبراء مشهورين مع جودة فيديو سينمائية وكتب عمل منظمة وتقييمات شاملة.',
            
            reasonsTitle: 'المزيد من الأسباب للاشتراك',
            enjoyAnywhere: 'تعلم على أي جهاز',
            enjoyAnywhereDesc: 'الوصول إلى الدورات على الكمبيوتر المحمول والجهاز اللوحي والهاتف الذكي - مزامنة سلسة عبر جميع الأجهزة.',
            downloadCourses: 'قم بتنزيل الدورات للتعلم دون اتصال بالإنترنت',
            downloadCoursesDesc: 'احفظ دوراتك المفضلة واستمر في التعلم حتى بدون اتصال بالإنترنت.',
            personalizedLearning: 'مسارات تعلم شخصية',
            personalizedLearningDesc: 'احصل على توصيات الدورات بناءً على اهتماماتك وأهداف التعلم الخاصة بك.',
            expertMentors: 'تعلم من موجهين خبراء',
            expertMentorsDesc: 'تواصل مع محترفين في الصناعة واحصل على إرشادات شخصية في رحلة التعلم الخاصة بك.',
            
            viewDetails: 'عرض التفاصيل',
            closeModal: 'إغلاق',
            startCourse: 'ابدأ الدورة',
            enrollments: 'طالب مسجل'
        }
    }

    const currentT = t[isArabic ? 'ar' : 'en']

    // Fallback images for courses
    const courseFallbackImages = [
        '/images/courses/IMG-20251009-WA0079.jpg',
        '/images/courses/IMG-20251009-WA0080.jpg',
        '/images/courses/IMG-20251009-WA0081.jpg'
    ]

    // Helper function to get course image
    const getCourseImage = (course: Course, index: number) => {
        // if (course.thumbnail && course.thumbnail !== '/images/courses/default.jpg') {
        //     return course.thumbnail
        // }
        // Cycle through fallback images
        return courseFallbackImages[index % courseFallbackImages.length]
    }

    // Updated plans based on blueprint - Category A, B, and A+B Bundle
    const plans = [
        {
            name: currentT.allAccessPlan,
            monthlyPrice: '149',
            annualPrice: '1428',
            description: currentT.allAccessDesc,
            category: 'CATEGORY_A', // Maps to API subscription type
            features: [
                currentT.devices,
                isArabic ? 'آلاف الدورات في كل المجالات' : 'Thousands of courses across all topics',
                isArabic ? 'تعلم ذاتي السرعة' : 'Self-paced learning',
                isArabic ? 'شهادات الإكمال' : 'Completion certificates',
                isArabic ? 'دعم المجتمع' : 'Community support',
                currentT.downloadCourses
            ]
        },
        {
            name: currentT.signaturePlan,
            monthlyPrice: '249',
            annualPrice: '2388',
            description: currentT.signatureDesc,
            category: 'CATEGORY_B', // Maps to API subscription type
            features: [
                currentT.devices,
                isArabic ? 'برامج عالية الإنتاج من الخبراء' : 'High-production programs from experts',
                isArabic ? 'كتب عمل وتقييمات منظمة' : 'Structured workbooks and assessments',
                isArabic ? 'مشاريع نهائية' : 'Capstone projects',
                isArabic ? 'ساعات عمل جماعية للأسئلة' : 'Group Q&A office hours',
                isArabic ? 'جودة فيديو سينمائية' : 'Cinematic video quality'
            ]
        },
        {
            name: currentT.bundlePlan,
            monthlyPrice: '349',
            annualPrice: '3348',
            description: currentT.bundleDesc,
            popular: true,
            category: 'BUNDLE_AB', // Maps to API subscription type
            features: [
                currentT.devices,
                isArabic ? 'كل شيء في المكتبة الشاملة' : 'Everything in All-Access Library',
                isArabic ? 'كل شيء في البرامج المميزة' : 'Everything in Signature Premium',
                isArabic ? 'وفر 20٪ على الاشتراك السنوي' : 'Save 20% with annual subscription',
                isArabic ? 'الوصول الكامل لكل المحتوى' : 'Full access to all content',
                isArabic ? 'أفضل قيمة للمتعلمين الجادين' : 'Best value for serious learners'
            ]
        }
    ]

    const faqs = [
        { q: currentT.faq1Q, a: currentT.faq1A },
        { q: currentT.faq2Q, a: currentT.faq2A },
        { q: currentT.faq3Q, a: currentT.faq3A },
        { q: currentT.faq4Q, a: currentT.faq4A },
        { q: currentT.faq5Q, a: currentT.faq5A },
        { q: currentT.faq6Q, a: currentT.faq6A }
    ]

    const reasons = [
        { icon: '💻', title: currentT.enjoyAnywhere, desc: currentT.enjoyAnywhereDesc },
        { icon: '📥', title: currentT.downloadCourses, desc: currentT.downloadCoursesDesc },
        { icon: '🎯', title: currentT.personalizedLearning, desc: currentT.personalizedLearningDesc },
        { icon: '👨‍🏫', title: currentT.expertMentors, desc: currentT.expertMentorsDesc }
    ]

    return (
        <div className="min-h-screen bg-black text-white" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Hero Section */}
            <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img 
                        src="/images/courses/netflix1.jpg" 
                        alt="Hero Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl md:text-6xl font-black mb-6 leading-tight"
                    >
                        {currentT.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl mb-4"
                    >
                        {currentT.subtitle}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-base md:text-lg mb-8"
                    >
                        {currentT.readyText}
                    </motion.p>
                    
                    {/* Email Input */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto"
                    >
                        <input
                            type="email"
                            placeholder={currentT.emailPlaceholder}
                            className="flex-1 px-6 py-4 bg-white/10 border border-white/30 rounded-lg backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                        />
                        <button className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-colors flex items-center gap-2 justify-center">
                            {currentT.startButton}
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Trending Courses Section */}
            {trendingCourses.length > 0 && (
                <div className="py-16 px-6 bg-black">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-black mb-8">{currentT.trendingNow}</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {trendingCourses.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group relative cursor-pointer"
                                    onClick={() => setSelectedCourse(course)}
                                >
                                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                                        <img
                                            src={getCourseImage(course, index)}
                                            alt={isArabic ? course.titleAr : course.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        
                                        {/* Play icon on hover */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                <Play className="w-6 h-6 text-white fill-white" />
                                            </div>
                                        </div>

                                        {/* Rating badge */}
                                        {course.rating && (
                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                                <span className="text-yellow-400 text-xs font-bold">★ {course.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Course title */}
                                    <p className="mt-2 text-sm font-semibold line-clamp-2 group-hover:text-red-500 transition-colors">
                                        {isArabic ? course.titleAr : course.title}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Course Detail Modal */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedCourse(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-gradient-to-br from-gray-900 to-black rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setSelectedCourse(null)}
                                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="overflow-y-auto max-h-[90vh]">
                                {/* Hero Image */}
                                <div className="relative h-64 md:h-96">
                                    <img
                                        src={selectedCourse.thumbnail && selectedCourse.thumbnail !== '/images/courses/default.jpg' 
                                            ? selectedCourse.thumbnail 
                                            : courseFallbackImages[trendingCourses.findIndex(c => c.id === selectedCourse.id) % courseFallbackImages.length]}
                                        alt={isArabic ? selectedCourse.titleAr : selectedCourse.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                                    
                                    {/* Title overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-8">
                                        <h2 className="text-3xl md:text-4xl font-black mb-2">
                                            {isArabic ? selectedCourse.titleAr : selectedCourse.title}
                                        </h2>
                                        <div className="flex items-center gap-4 text-sm">
                                            {selectedCourse.rating && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-400">★</span>
                                                    <span className="font-bold">{selectedCourse.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                            <span className="text-gray-400">
                                                {selectedCourse.totalEnrollments.toLocaleString()} {currentT.enrollments}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8">
                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-2">
                                            {isArabic ? 'عن الدورة' : 'About this course'}
                                        </h3>
                                        <p className="text-gray-300 leading-relaxed">
                                            {isArabic ? selectedCourse.descriptionAr : selectedCourse.description}
                                        </p>
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-xl font-bold mb-2">
                                            {isArabic ? 'المدرب' : 'Instructor'}
                                        </h3>
                                        <p className="text-gray-300">
                                            {isArabic 
                                                ? selectedCourse.creator.user.arabicName 
                                                : selectedCourse.creator.user.name}
                                        </p>
                                    </div>

                                    {/* Subscription CTA */}
                                    <div className="p-6 bg-gradient-to-r from-red-900/30 to-purple-900/30 rounded-lg border border-red-600/30">
                                        <div className="text-center mb-4">
                                            <p className="text-lg font-semibold mb-2">
                                                {isArabic 
                                                    ? 'هذه الدورة متاحة مع اشتراكك' 
                                                    : 'This course is included with your subscription'}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {isArabic 
                                                    ? 'اشترك للوصول إلى هذه الدورة وآلاف الدورات الأخرى' 
                                                    : 'Subscribe to access this course and thousands more'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedCourse(null)
                                                // Scroll to pricing section
                                                const pricingSection = document.querySelector('#pricing-section')
                                                if (pricingSection) {
                                                    pricingSection.scrollIntoView({ behavior: 'smooth' })
                                                }
                                            }}
                                            className="w-full px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-colors"
                                        >
                                            {isArabic ? 'عرض خطط الاشتراك' : 'View Subscription Plans'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pricing Plans */}
            <div id="pricing-section" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Billing Cycle Toggle */}
                    <div className="flex justify-center mb-12">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-full p-1 inline-flex border border-white/10">
                            <button
                                onClick={() => setSelectedBillingCycle('monthly')}
                                className={`px-8 py-3 rounded-full font-semibold transition-all ${
                                    selectedBillingCycle === 'monthly'
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {isArabic ? 'شهري' : 'Monthly'}
                            </button>
                            <button
                                onClick={() => setSelectedBillingCycle('yearly')}
                                className={`px-8 py-3 rounded-full font-semibold transition-all relative ${
                                    selectedBillingCycle === 'yearly'
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {isArabic ? 'سنوي' : 'Annual'}
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {isArabic ? '-20%' : 'Save 20%'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-0 bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden border border-white/10">
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                className={`relative p-8 ${
                                    plan.popular 
                                        ? 'bg-gradient-to-br from-red-900/40 to-purple-900/40 border-2 border-red-600' 
                                        : 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-r border-white/10 last:border-r-0'
                                }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm font-bold">
                                        {currentT.mostPopular}
                                    </div>
                                )}
                                
                                <div className={`${plan.popular ? 'mt-10' : ''}`}>
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm mb-6 min-h-[60px]">{plan.description}</p>
                                    
                                    <div className="mb-6">
                                        {selectedBillingCycle === 'monthly' ? (
                                            // Monthly Price Display
                                            <div>
                                                <div className="text-5xl font-black text-white mb-2">
                                                    €{plan.monthlyPrice}
                                                </div>
                                                <p className="text-gray-400 text-sm">{currentT.monthlyPrice}</p>
                                            </div>
                                        ) : (
                                            // Annual Price Display
                                            <div>
                                                <div className="text-5xl font-black text-green-400 mb-2">
                                                    €{plan.annualPrice}
                                                </div>
                                                <p className="text-green-400 text-sm font-semibold">
                                                    {isArabic ? 'وفّر 20% مع الاشتراك السنوي' : 'Save 20% with annual billing'}
                                                </p>
                                                <p className="text-gray-500 text-xs mt-1">
                                                    {isArabic 
                                                        ? `€${plan.monthlyPrice} شهرياً` 
                                                        : `€${plan.monthlyPrice} per month`}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <ul className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handleSubscribe(plan.category, selectedBillingCycle)}
                                        disabled={loading}
                                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
                                            plan.popular
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {loading ? (isArabic ? 'جاري...' : 'Processing...') : (isArabic ? 'اشترك الآن' : 'Subscribe Now')}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Reasons to Subscribe */}
            <div className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-16">{currentT.reasonsTitle}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {reasons.map((reason, index) => (
                            <motion.div
                                key={reason.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="text-center p-6 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-2xl border border-white/10"
                            >
                                <div className="text-6xl mb-4">{reason.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{reason.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{reason.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black text-center mb-12">{currentT.faqTitle}</h2>
                    <div className="space-y-2">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="bg-gray-800 rounded-lg overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-700/50 transition-colors"
                                >
                                    <span className="text-xl font-semibold pr-4">{faq.q}</span>
                                    <Plus 
                                        className={`w-8 h-8 flex-shrink-0 transition-transform duration-300 ${
                                            openFAQ === index ? 'rotate-45' : ''
                                        }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {openFAQ === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-6 pt-0 text-gray-300 text-lg leading-relaxed">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                    
                    {/* Email CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 text-center"
                    >
                        <p className="text-lg mb-6">{currentT.readyText}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
                            <input
                                type="email"
                                placeholder={currentT.emailPlaceholder}
                                className="flex-1 px-6 py-4 bg-white/10 border border-white/30 rounded-lg backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600"
                            />
                            <button className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-bold text-lg transition-colors flex items-center gap-2 justify-center">
                                {currentT.startButton}
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 py-12 px-6 text-gray-400 text-sm">
                <div className="max-w-7xl mx-auto text-center">
                    <p>&copy; 2025 {isArabic ? 'منصة التعليم المصرية' : 'Egyptian EdTech Platform'}. {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
                </div>
            </div>
        </div>
    )
}
