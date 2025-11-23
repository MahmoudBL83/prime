'use client';

import { useState } from 'react';
import { useLocaleSafe } from '@/hooks/useTranslationsSafe';
import { ChevronDown, Search, MessageCircle, Book, CreditCard, Settings } from 'lucide-react';

interface FAQItem {
    question: string;
    questionAr: string;
    answer: string;
    answerAr: string;
    category: string;
}

export default function HelpPage() {
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const faqData: FAQItem[] = [
        {
            question: 'How do I enroll in a course?',
            questionAr: 'كيف أسجل في دورة؟',
            answer: 'To enroll in a course, browse our course catalog, select the course you want, and click the "Accept Offer" button. You\'ll be guided through the payment process to complete your enrollment.',
            answerAr: 'للتسجيل في دورة، تصفح كتالوج الدورات لدينا، اختر الدورة التي تريدها، وانقر على زر "قبول العرض". سيتم توجيهك خلال عملية الدفع لإكمال تسجيلك.',
            category: 'getting-started'
        },
        {
            question: 'What payment methods do you accept?',
            questionAr: 'ما هي طرق الدفع التي تقبلونها؟',
            answer: 'We accept various payment methods including credit/debit cards (Visa, Mastercard), PayPal, and local payment options. All transactions are secure and encrypted.',
            answerAr: 'نقبل طرق دفع متنوعة بما في ذلك بطاقات الائتمان/الخصم (فيزا، ماستركارد)، باي بال، وخيارات الدفع المحلية. جميع المعاملات آمنة ومشفرة.',
            category: 'payment'
        },
        {
            question: 'Can I get a refund?',
            questionAr: 'هل يمكنني استرداد الأموال؟',
            answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with a course, you can request a full refund within 30 days of purchase.',
            answerAr: 'نعم، نقدم ضمان استرداد الأموال لمدة 30 يومًا. إذا لم تكن راضيًا عن دورة، يمكنك طلب استرداد كامل المبلغ خلال 30 يومًا من الشراء.',
            category: 'payment'
        },
        {
            question: 'How long do I have access to a course?',
            questionAr: 'كم من الوقت لدي للوصول إلى الدورة؟',
            answer: 'Once you enroll in a course, you have lifetime access to all course materials. You can learn at your own pace and revisit the content anytime.',
            answerAr: 'بمجرد تسجيلك في دورة، لديك وصول مدى الحياة لجميع مواد الدورة. يمكنك التعلم بالسرعة التي تناسبك وإعادة زيارة المحتوى في أي وقت.',
            category: 'courses'
        },
        {
            question: 'Do I get a certificate upon completion?',
            questionAr: 'هل أحصل على شهادة عند الانتهاء؟',
            answer: 'Yes, you will receive a certificate of completion for each course you finish. Certificates can be downloaded and shared on professional networks.',
            answerAr: 'نعم، ستحصل على شهادة إتمام لكل دورة تنهيها. يمكن تنزيل الشهادات ومشاركتها على الشبكات المهنية.',
            category: 'courses'
        },
        {
            question: 'How do I contact my mentor?',
            questionAr: 'كيف أتواصل مع معلمي؟',
            answer: 'You can contact your mentor through the messaging system within the course. Simply go to your course dashboard and click on the messaging icon.',
            answerAr: 'يمكنك التواصل مع معلمك من خلال نظام المراسلة داخل الدورة. ببساطة انتقل إلى لوحة تحكم الدورة وانقر على أيقونة المراسلة.',
            category: 'getting-started'
        },
        {
            question: 'Can I switch my subscription plan?',
            questionAr: 'هل يمكنني تبديل خطة اشتراكي؟',
            answer: 'Yes, you can upgrade or downgrade your subscription plan at any time from your account settings. Changes will take effect in the next billing cycle.',
            answerAr: 'نعم، يمكنك ترقية أو تخفيض خطة اشتراكك في أي وقت من إعدادات حسابك. ستسري التغييرات في دورة الفوترة التالية.',
            category: 'account'
        },
        {
            question: 'Is there a mobile app available?',
            questionAr: 'هل يوجد تطبيق للهاتف المحمول؟',
            answer: 'Yes, Prime is available on both iOS and Android devices. Download our app from the App Store or Google Play to learn on the go.',
            answerAr: 'نعم، Prime متاح على أجهزة iOS و Android. قم بتنزيل تطبيقنا من App Store أو Google Play للتعلم أثناء التنقل.',
            category: 'technical'
        },
    ];

    const categories = [
        { id: 'all', label: isArabic ? 'الكل' : 'All', icon: Book },
        { id: 'getting-started', label: isArabic ? 'البدء' : 'Getting Started', icon: Book },
        { id: 'courses', label: isArabic ? 'الدورات' : 'Courses', icon: Book },
        { id: 'payment', label: isArabic ? 'الدفع' : 'Payment', icon: CreditCard },
        { id: 'account', label: isArabic ? 'الحساب' : 'Account', icon: Settings },
        { id: 'technical', label: isArabic ? 'التقني' : 'Technical', icon: Settings },
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    const filteredFAQs = faqData.filter(faq => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
            (isArabic ? faq.questionAr : faq.question).toLowerCase().includes(searchQuery.toLowerCase()) ||
            (isArabic ? faq.answerAr : faq.answer).toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: '#1f1f1f' }}>
            <div className="max-w-6xl mx-auto px-8">
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {isArabic ? 'مركز المساعدة' : 'Help Center'}
                    </h1>
                    <p className="text-white/70 text-lg">
                        {isArabic ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we help you today?'}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={isArabic ? 'ابحث عن المساعدة...' : 'Search for help...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-neutral-900/50 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#0a84ff]/50"
                        />
                    </div>
                </div>

                {/* Category Filters */}
                <div className="mb-8 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 min-w-max md:min-w-0 md:justify-center">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                                    selectedCategory === category.id
                                        ? 'bg-[#0a84ff] text-white'
                                        : 'bg-neutral-900/50 text-white/70 hover:bg-neutral-900 border border-white/10'
                                }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="space-y-4 mb-12">
                    {filteredFAQs.length > 0 ? (
                        filteredFAQs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-neutral-900/50 rounded-xl border border-white/10 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                                >
                                    <span className="text-white font-semibold text-base">
                                        {isArabic ? faq.questionAr : faq.question}
                                    </span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-white/70 transition-transform ${
                                            openFAQ === index ? 'transform rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                {openFAQ === index && (
                                    <div className="px-6 pb-4">
                                        <p className="text-white/80 leading-relaxed">
                                            {isArabic ? faq.answerAr : faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-white/60">
                                {isArabic ? 'لم يتم العثور على نتائج' : 'No results found'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Contact Support Section */}
                <div className="bg-gradient-to-r from-[#0a84ff]/20 to-transparent rounded-2xl p-8 border border-[#0a84ff]/30">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#0a84ff]/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-6 h-6 text-[#0a84ff]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-white mb-2">
                                {isArabic ? 'لم تجد ما تبحث عنه؟' : "Didn't find what you're looking for?"}
                            </h2>
                            <p className="text-white/70 mb-4">
                                {isArabic
                                    ? 'فريق الدعم لدينا هنا للمساعدة. تواصل معنا وسنعاود الاتصال بك في أقرب وقت ممكن.'
                                    : 'Our support team is here to help. Contact us and we\'ll get back to you as soon as possible.'
                                }
                            </p>
                            <button
                                onClick={() => window.location.href = `/${locale}/contact`}
                                className="px-6 py-3 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-semibold rounded-full transition-all"
                            >
                                {isArabic ? 'اتصل بنا' : 'Contact Support'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
}
