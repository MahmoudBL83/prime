'use client';

import { useLocaleSafe } from '@/hooks/useTranslationsSafe';

export default function TermsPage() {
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: '#1f1f1f' }}>
            <div className="max-w-4xl mx-auto px-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {isArabic ? 'الشروط والأحكام' : 'Terms and Conditions'}
                    </h1>
                    <p className="text-white/60">
                        {isArabic ? 'آخر تحديث: 23 نوفمبر 2025' : 'Last Updated: November 23, 2025'}
                    </p>
                    <div className="h-1 w-20 bg-[#0a84ff] rounded mt-4"></div>
                </div>

                {/* Content */}
                <div className="space-y-8 text-white/80">
                    {/* Introduction */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '1. المقدمة' : '1. Introduction'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'مرحبًا بك في Prime. من خلال الوصول إلى منصتنا واستخدامها، فإنك توافق على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا.'
                                : 'Welcome to Prime. By accessing and using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.'
                            }
                        </p>
                    </section>

                    {/* User Accounts */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '2. حسابات المستخدمين' : '2. User Accounts'}
                        </h2>
                        <div className="space-y-4">
                            <p className="leading-relaxed">
                                {isArabic
                                    ? 'عند إنشاء حساب معنا، يجب عليك تقديم معلومات دقيقة وكاملة. أنت مسؤول عن:'
                                    : 'When you create an account with us, you must provide accurate and complete information. You are responsible for:'
                                }
                            </p>
                            <ul className="space-y-2 pl-6">
                                <li className="flex items-start gap-2">
                                    <span className="text-[#0a84ff] mt-1.5">•</span>
                                    <span>
                                        {isArabic
                                            ? 'الحفاظ على سرية كلمة المرور الخاصة بك'
                                            : 'Maintaining the confidentiality of your password'
                                        }
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#0a84ff] mt-1.5">•</span>
                                    <span>
                                        {isArabic
                                            ? 'جميع الأنشطة التي تحدث تحت حسابك'
                                            : 'All activities that occur under your account'
                                        }
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-[#0a84ff] mt-1.5">•</span>
                                    <span>
                                        {isArabic
                                            ? 'إخطارنا فورًا بأي استخدام غير مصرح به'
                                            : 'Notifying us immediately of any unauthorized use'
                                        }
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Course Enrollment */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '3. التسجيل في الدورات' : '3. Course Enrollment'}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            {isArabic
                                ? 'عند التسجيل في دورة، فإنك توافق على:'
                                : 'When enrolling in a course, you agree to:'
                            }
                        </p>
                        <ul className="space-y-2 pl-6">
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'دفع جميع الرسوم المطبقة'
                                        : 'Pay all applicable fees'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'استخدام محتوى الدورة للاستخدام الشخصي فقط'
                                        : 'Use course content for personal use only'
                                    }
                                </span>
                                </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'عدم مشاركة بيانات الاعتماد الخاصة بك مع الآخرين'
                                        : 'Not share your credentials with others'
                                    }
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Payment Terms */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '4. شروط الدفع' : '4. Payment Terms'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'جميع المدفوعات تتم بشكل آمن من خلال معالجي الدفع المعتمدين لدينا. نحن نقدم ضمان استرداد الأموال لمدة 30 يومًا لجميع الدورات. يتم تجديد الاشتراكات تلقائيًا ما لم يتم إلغاؤها قبل تاريخ التجديد.'
                                : 'All payments are processed securely through our authorized payment processors. We offer a 30-day money-back guarantee for all courses. Subscriptions renew automatically unless cancelled before the renewal date.'
                            }
                        </p>
                    </section>

                    {/* Intellectual Property */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '5. الملكية الفكرية' : '5. Intellectual Property'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'جميع المحتويات والمواد المتاحة على Prime، بما في ذلك النصوص والرسومات ومقاطع الفيديو والشعارات، محمية بموجب حقوق النشر والعلامات التجارية وحقوق الملكية الفكرية الأخرى. لا يجوز لك إعادة إنتاج أو توزيع أو تعديل أي محتوى دون إذن كتابي صريح.'
                                : 'All content and materials available on Prime, including text, graphics, videos, and logos, are protected by copyright, trademarks, and other intellectual property rights. You may not reproduce, distribute, or modify any content without explicit written permission.'
                            }
                        </p>
                    </section>

                    {/* User Conduct */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '6. سلوك المستخدم' : '6. User Conduct'}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            {isArabic ? 'أنت توافق على عدم:' : 'You agree not to:'}
                        </p>
                        <ul className="space-y-2 pl-6">
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'انتهاك أي قوانين أو لوائح'
                                        : 'Violate any laws or regulations'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'التحرش أو إساءة معاملة الآخرين'
                                        : 'Harass or abuse others'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'محاولة الوصول غير المصرح به إلى أنظمتنا'
                                        : 'Attempt unauthorized access to our systems'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'نشر محتوى ضار أو مسيء'
                                        : 'Post harmful or offensive content'
                                    }
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Termination */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '7. الإنهاء' : '7. Termination'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'نحتفظ بالحق في تعليق أو إنهاء حسابك إذا انتهكت هذه الشروط. يمكنك أيضًا إنهاء حسابك في أي وقت من خلال الاتصال بالدعم.'
                                : 'We reserve the right to suspend or terminate your account if you violate these Terms. You may also terminate your account at any time by contacting support.'
                            }
                        </p>
                    </section>

                    {/* Limitation of Liability */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '8. تحديد المسؤولية' : '8. Limitation of Liability'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'Prime غير مسؤول عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية ناشئة عن استخدامك للمنصة. استخدامك للخدمة على مسؤوليتك الخاصة.'
                                : 'Prime is not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Your use of the service is at your own risk.'
                            }
                        </p>
                    </section>

                    {/* Changes to Terms */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '9. التغييرات على الشروط' : '9. Changes to Terms'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على المنصة.'
                                : 'We reserve the right to modify these Terms at any time. You will be notified of any material changes via email or through a notice on the platform.'
                            }
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-gradient-to-r from-[#0a84ff]/20 to-transparent rounded-2xl p-8 border border-[#0a84ff]/30">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '10. اتصل بنا' : '10. Contact Us'}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            {isArabic
                                ? 'إذا كانت لديك أي أسئلة حول هذه الشروط والأحكام، يرجى الاتصال بنا:'
                                : 'If you have any questions about these Terms and Conditions, please contact us:'
                            }
                        </p>
                        <button
                            onClick={() => window.location.href = `/${locale}/contact`}
                            className="px-6 py-3 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-semibold rounded-full transition-all"
                        >
                            {isArabic ? 'اتصل بنا' : 'Contact Us'}
                        </button>
                    </section>
                </div>
            </div>
        </div>
    );
}
