'use client';

import { useLocaleSafe } from '@/hooks/useTranslationsSafe';

export default function AboutPage() {
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: '#1f1f1f' }}>
            <div className="max-w-4xl mx-auto px-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {isArabic ? 'عن Prime' : 'About Prime'}
                    </h1>
                    <div className="h-1 w-20 bg-[#0a84ff] rounded"></div>
                </div>

                {/* Content */}
                <div className="space-y-8 text-white/80">
                    {/* Mission Section */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? 'مهمتنا' : 'Our Mission'}
                        </h2>
                        <p className="text-base leading-relaxed">
                            {isArabic 
                                ? 'في Prime، نؤمن بأن التعليم يجب أن يكون متاحًا للجميع. مهمتنا هي تمكين المتعلمين في جميع أنحاء العالم من خلال تقديم دورات عالية الجودة وتجارب تعليمية تحويلية. نحن نربط الطلاب بأفضل المعلمين والموجهين لمساعدتهم على تحقيق أهدافهم الشخصية والمهنية.'
                                : 'At Prime, we believe that education should be accessible to everyone. Our mission is to empower learners worldwide by providing high-quality courses and transformative learning experiences. We connect students with the best instructors and mentors to help them achieve their personal and professional goals.'
                            }
                        </p>
                    </section>

                    {/* Vision Section */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? 'رؤيتنا' : 'Our Vision'}
                        </h2>
                        <p className="text-base leading-relaxed">
                            {isArabic
                                ? 'نتصور عالمًا حيث يمكن لأي شخص، في أي مكان، تعلم أي شيء. من خلال الاستفادة من التكنولوجيا والابتكار، نهدف إلى إنشاء منصة تعليمية رائدة تلهم الفضول وتعزز النمو وتدفع النجاح.'
                                : 'We envision a world where anyone, anywhere can learn anything. By leveraging technology and innovation, we aim to create a premier learning platform that inspires curiosity, fosters growth, and drives success.'
                            }
                        </p>
                    </section>

                    {/* What We Offer Section */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-6">
                            {isArabic ? 'ما نقدمه' : 'What We Offer'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {isArabic ? 'دورات عالية الجودة' : 'High-Quality Courses'}
                                </h3>
                                <p className="text-sm">
                                    {isArabic
                                        ? 'محتوى منظم من قبل خبراء الصناعة في مختلف المجالات'
                                        : 'Expert-curated content across various fields and disciplines'
                                    }
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {isArabic ? 'معلمون خبراء' : 'Expert Mentors'}
                                </h3>
                                <p className="text-sm">
                                    {isArabic
                                        ? 'تواصل مع محترفين في الصناعة وقادة فكر'
                                        : 'Connect with industry professionals and thought leaders'
                                    }
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {isArabic ? 'تعلم مرن' : 'Flexible Learning'}
                                </h3>
                                <p className="text-sm">
                                    {isArabic
                                        ? 'تعلم بالسرعة التي تناسبك، في أي وقت وفي أي مكان'
                                        : 'Learn at your own pace, anytime and anywhere'
                                    }
                                </p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {isArabic ? 'شهادات معتمدة' : 'Certified Programs'}
                                </h3>
                                <p className="text-sm">
                                    {isArabic
                                        ? 'احصل على شهادات معترف بها تعزز حياتك المهنية'
                                        : 'Earn recognized certificates that boost your career'
                                    }
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Values Section */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-6">
                            {isArabic ? 'قيمنا' : 'Our Values'}
                        </h2>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-[#0a84ff] rounded-full mt-2"></div>
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {isArabic ? 'التميز' : 'Excellence'}
                                    </h3>
                                    <p className="text-sm">
                                        {isArabic
                                            ? 'نسعى جاهدين للحصول على أعلى معايير الجودة في كل ما نقوم به'
                                            : 'We strive for the highest standards of quality in everything we do'
                                        }
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-[#0a84ff] rounded-full mt-2"></div>
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {isArabic ? 'الابتكار' : 'Innovation'}
                                    </h3>
                                    <p className="text-sm">
                                        {isArabic
                                            ? 'نحتضن التقنيات والأساليب الجديدة لتحسين التعلم'
                                            : 'We embrace new technologies and methods to enhance learning'
                                        }
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-[#0a84ff] rounded-full mt-2"></div>
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {isArabic ? 'الشمولية' : 'Inclusivity'}
                                    </h3>
                                    <p className="text-sm">
                                        {isArabic
                                            ? 'نرحب بالمتعلمين من جميع الخلفيات والقدرات'
                                            : 'We welcome learners from all backgrounds and abilities'
                                        }
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* Contact CTA */}
                    <section className="bg-gradient-to-r from-[#0a84ff]/20 to-transparent rounded-2xl p-8 border border-[#0a84ff]/30">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? 'انضم إلينا في رحلة التعلم' : 'Join Us on the Learning Journey'}
                        </h2>
                        <p className="text-base mb-6">
                            {isArabic
                                ? 'هل أنت مستعد لتحويل حياتك من خلال التعليم؟ ابدأ رحلتك التعليمية مع Prime اليوم.'
                                : 'Ready to transform your life through education? Start your learning journey with Prime today.'
                            }
                        </p>
                        <button
                            onClick={() => window.location.href = `/${locale}/courses`}
                            className="px-8 py-3 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-semibold rounded-full transition-all"
                        >
                            {isArabic ? 'استكشف الدورات' : 'Explore Courses'}
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}
