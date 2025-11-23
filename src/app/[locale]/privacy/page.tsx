'use client';

import { useLocaleSafe } from '@/hooks/useTranslationsSafe';

export default function PrivacyPage() {
    const locale = useLocaleSafe();
    const isArabic = locale === 'ar';

    return (
        <div className="min-h-screen pt-20 pb-12" style={{ backgroundColor: '#1f1f1f' }}>
            <div className="max-w-4xl mx-auto px-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
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
                                ? 'في Prime، نحن ملتزمون بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك الشخصية واستخدامها وحمايتها ومشاركتها عند استخدام منصتنا.'
                                : 'At Prime, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our platform.'
                            }
                        </p>
                    </section>

                    {/* Information We Collect */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '2. المعلومات التي نجمعها' : '2. Information We Collect'}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {isArabic ? 'معلومات تقدمها لنا' : 'Information You Provide'}
                                </h3>
                                <ul className="space-y-2 pl-6">
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#0a84ff] mt-1.5">•</span>
                                        <span>
                                            {isArabic
                                                ? 'الاسم وعنوان البريد الإلكتروني ومعلومات الحساب'
                                                : 'Name, email address, and account information'
                                            }
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#0a84ff] mt-1.5">•</span>
                                        <span>
                                            {isArabic
                                                ? 'معلومات الدفع والفوترة'
                                                : 'Payment and billing information'
                                            }
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#0a84ff] mt-1.5">•</span>
                                        <span>
                                            {isArabic
                                                ? 'معلومات الملف الشخصي والتفضيلات'
                                                : 'Profile information and preferences'
                                            }
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2 mt-4">
                                    {isArabic ? 'المعلومات التي نجمعها تلقائيًا' : 'Information Collected Automatically'}
                                </h3>
                                <ul className="space-y-2 pl-6">
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#0a84ff] mt-1.5">•</span>
                                        <span>
                                            {isArabic
                                                ? 'معلومات الجهاز (نوع الجهاز، نظام التشغيل، المتصفح)'
                                                : 'Device information (device type, OS, browser)'
                                            }
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#0a84ff] mt-1.5">•</span>
                                        <span>
                                            {isArabic
                                                ? 'بيانات الاستخدام (الصفحات المشاهدة، النقرات، الوقت المستغرق)'
                                                : 'Usage data (pages viewed, clicks, time spent)'
                                            }
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-[#0a84ff] mt-1.5">•</span>
                                        <span>
                                            {isArabic
                                                ? 'عنوان IP والموقع الجغرافي'
                                                : 'IP address and geolocation'
                                            }
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* How We Use Your Information */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '3. كيف نستخدم معلوماتك' : '3. How We Use Your Information'}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            {isArabic ? 'نستخدم معلوماتك من أجل:' : 'We use your information to:'}
                        </p>
                        <ul className="space-y-2 pl-6">
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'توفير وتحسين خدماتنا'
                                        : 'Provide and improve our services'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'تخصيص تجربة التعلم الخاصة بك'
                                        : 'Personalize your learning experience'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'معالجة المدفوعات والمعاملات'
                                        : 'Process payments and transactions'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'التواصل معك بشأن حسابك ودوراتك'
                                        : 'Communicate with you about your account and courses'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'إرسال تحديثات وعروض ترويجية (مع موافقتك)'
                                        : 'Send updates and promotions (with your consent)'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'منع الاحتيال وضمان الأمان'
                                        : 'Prevent fraud and ensure security'
                                    }
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Information Sharing */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '4. مشاركة المعلومات' : '4. Information Sharing'}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            {isArabic
                                ? 'نحن لا نبيع معلوماتك الشخصية. قد نشارك معلوماتك مع:'
                                : 'We do not sell your personal information. We may share your information with:'
                            }
                        </p>
                        <ul className="space-y-2 pl-6">
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'مقدمي الخدمات (معالجات الدفع، استضافة البيانات)'
                                        : 'Service providers (payment processors, data hosting)'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'المعلمون (لتسهيل الدورات)'
                                        : 'Instructors (to facilitate courses)'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'السلطات القانونية (عند الحاجة بموجب القانون)'
                                        : 'Legal authorities (when required by law)'
                                    }
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Data Security */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '5. أمن البيانات' : '5. Data Security'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'نستخدم تدابير أمنية من الدرجة الصناعية لحماية معلوماتك، بما في ذلك التشفير والخوادم الآمنة والتحديثات الأمنية المنتظمة. ومع ذلك، لا يمكن ضمان أي طريقة للنقل عبر الإنترنت أو التخزين الإلكتروني بنسبة 100٪.'
                                : 'We use industry-standard security measures to protect your information, including encryption, secure servers, and regular security updates. However, no method of transmission over the internet or electronic storage is 100% secure.'
                            }
                        </p>
                    </section>

                    {/* Cookies */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '6. ملفات تعريف الارتباط' : '6. Cookies'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتحسين تجربتك وتحليل الاستخدام وتخصيص المحتوى. يمكنك التحكم في تفضيلات ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك.'
                                : 'We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. You can control cookie preferences through your browser settings.'
                            }
                        </p>
                    </section>

                    {/* Your Rights */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '7. حقوقك' : '7. Your Rights'}
                        </h2>
                        <p className="leading-relaxed mb-4">
                            {isArabic ? 'لديك الحق في:' : 'You have the right to:'}
                        </p>
                        <ul className="space-y-2 pl-6">
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'الوصول إلى معلوماتك الشخصية وتحديثها'
                                        : 'Access and update your personal information'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'طلب حذف بياناتك'
                                        : 'Request deletion of your data'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'إلغاء الاشتراك في الاتصالات التسويقية'
                                        : 'Opt-out of marketing communications'
                                    }
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#0a84ff] mt-1.5">•</span>
                                <span>
                                    {isArabic
                                        ? 'تصدير بياناتك'
                                        : 'Export your data'
                                    }
                                </span>
                            </li>
                        </ul>
                    </section>

                    {/* Children's Privacy */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '8. خصوصية الأطفال' : '8. Children\'s Privacy'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'خدماتنا غير مخصصة للأطفال دون سن 13 عامًا. نحن لا نجمع معلومات شخصية عن قصد من الأطفال. إذا علمت أننا جمعنا معلومات من طفل، يرجى الاتصال بنا.'
                                : 'Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you learn we have collected information from a child, please contact us.'
                            }
                        </p>
                    </section>

                    {/* Changes to Privacy Policy */}
                    <section className="bg-neutral-900/50 rounded-2xl p-8 border border-white/10">
                        <h2 className="text-2xl font-semibold text-white mb-4">
                            {isArabic ? '9. التغييرات على سياسة الخصوصية' : '9. Changes to Privacy Policy'}
                        </h2>
                        <p className="leading-relaxed">
                            {isArabic
                                ? 'قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات جوهرية عن طريق نشر السياسة الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث".'
                                : 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date.'
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
                                ? 'إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه أو كيفية تعاملنا مع بياناتك، يرجى الاتصال بنا:'
                                : 'If you have any questions about this Privacy Policy or how we handle your data, please contact us:'
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
