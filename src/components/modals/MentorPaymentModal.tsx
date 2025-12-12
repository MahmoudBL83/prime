'use client';

import { useState } from 'react';
import { X, CheckCircle, Mail, Crown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface MentorPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    mentor: {
        id: string;
        channelId?: string;
        name: string;
        arabicName?: string;
        profileImage: string | null;
        expertise: string;
        price: number;
    };
    isArabic?: boolean;
    onSuccess?: () => void;
}

export function MentorPaymentModal({ 
    isOpen, 
    onClose, 
    mentor, 
    isArabic = false,
    onSuccess 
}: MentorPaymentModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSendPaymentLink = async () => {
        if (!session?.user?.email) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول للمتابعة' : 'Please sign in to continue');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/payments/create-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: mentor.price,
                    description: `Mentor Subscription - ${mentor.name} - €${mentor.price}/month`,
                    successUrl: `${window.location.origin}/payment-success?type=mentor&mentorId=${mentor.id}&session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/mentors/${mentor.id}`,
                    metadata: {
                        type: 'mentor_subscription',
                        mentorId: mentor.id,
                        channelId: mentor.channelId,
                        userId: session.user.id,
                    }
                }),
            });

            if (response.ok) {
                setEmailSent(true);
                toast.success(isArabic ? 'تم إرسال رابط الدفع إلى بريدك الإلكتروني!' : 'Payment link sent to your email!');
            } else {
                throw new Error('Failed to create payment link');
            }
        } catch (error) {
            console.error('Error creating payment link:', error);
            toast.error(isArabic ? 'فشل إرسال رابط الدفع. يرجى المحاولة مرة أخرى.' : 'Failed to send payment link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const benefits = isArabic ? [
        'كل المحتوى والوسائط',
        'جلسات مباشرة أسبوعية',
        'أولوية في الرسائل والأسئلة',
        'حجوزات عبر التقويم',
        'وصول للمجتمع',
        'إلغاء في أي وقت'
    ] : [
        'All posts & media content',
        'Weekly live sessions',
        'Priority DMs & Q&A',
        'Calendar bookings',
        'Community access',
        'Cancel anytime'
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-3xl shadow-2xl"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-neutral-900 border-b border-white/10 px-8 py-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                                <h2 className="text-2xl font-bold text-white">
                                    {emailSent 
                                        ? (isArabic ? 'تحقق من بريدك الإلكتروني' : 'Check Your Email')
                                        : (isArabic ? 'إتمام الدفع' : 'Complete Payment')
                                    }
                                </h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-8 space-y-6">
                            {!emailSent ? (
                                <>
                                    {/* Mentor Info */}
                                    <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                                        <div className="flex items-center gap-4">
                                            {mentor.profileImage ? (
                                                <Image
                                                    src={mentor.profileImage}
                                                    alt={mentor.name}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-white">
                                                        {mentor.name[0]}
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white/60 text-sm">
                                                    {isArabic ? 'الاشتراك مع' : 'Subscribe to'}
                                                </p>
                                                <p className="text-white font-bold text-xl">
                                                    {isArabic && mentor.arabicName ? mentor.arabicName : mentor.name}
                                                </p>
                                                <p className="text-white/60 text-sm">{mentor.expertise}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Crown className="w-5 h-5 text-[#0a84ff]" />
                                                <span className="text-white/80">
                                                    {isArabic ? 'وصول شامل' : 'All-Access'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-2xl font-bold text-white">€{mentor.price}</span>
                                                <span className="text-white/60 text-sm">/{isArabic ? 'شهر' : 'mo'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Email */}
                                    <div className="bg-[#0a84ff]/10 border border-[#0a84ff]/20 rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-[#0a84ff]/20 rounded-full flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-[#0a84ff]" />
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold">
                                                    {isArabic ? 'رابط الدفع' : 'Payment Link'}
                                                </p>
                                                <p className="text-white/60 text-sm">
                                                    {isArabic ? 'سنرسل لك رابطاً آمناً' : "We'll email you a secure link"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl px-4 py-3">
                                            <p className="text-white text-sm">{session?.user?.email}</p>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-3">
                                        <p className="text-white/60 text-sm font-medium">
                                            {isArabic ? 'ما ستحصل عليه:' : "What's included:"}
                                        </p>
                                        <ul className="space-y-2.5">
                                            {benefits.map((feature, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                                    <span className="text-white/90 text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Terms */}
                                    <div className="text-xs text-white/60 leading-relaxed">
                                        {isArabic ? (
                                            <>
                                                بالمتابعة، أنت توافق على{' '}
                                                <button className="text-[#0a84ff] hover:text-[#0a84ff]/80">
                                                    شروط وأحكام Prime
                                                </button>
                                                {' '}وتقر بأنك قد قرأت{' '}
                                                <button className="text-[#0a84ff] hover:text-[#0a84ff]/80">
                                                    سياسة الخصوصية
                                                </button>.
                                            </>
                                        ) : (
                                            <>
                                                By continuing, you agree to the{' '}
                                                <button className="text-[#0a84ff] hover:text-[#0a84ff]/80">
                                                    Prime Terms and Conditions
                                                </button>
                                                {' '}and acknowledge that you have read the{' '}
                                                <button className="text-[#0a84ff] hover:text-[#0a84ff]/80">
                                                    Privacy Policy
                                                </button>.
                                            </>
                                        )}
                                    </div>

                                    {/* Send Payment Link Button */}
                                    <button
                                        onClick={handleSendPaymentLink}
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span>{isArabic ? 'جاري الإرسال...' : 'Sending...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                <span>
                                                    {isArabic 
                                                        ? `اشترك الآن - €${mentor.price}/شهر` 
                                                        : `Subscribe Now - €${mentor.price}/mo`
                                                    }
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Success State */}
                                    <div className="text-center space-y-6 py-8">
                                        <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                                            <Mail className="w-10 h-10 text-green-500" />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-bold text-white">
                                                {isArabic ? 'تحقق من بريدك الإلكتروني' : 'Check Your Email'}
                                            </h3>
                                            <p className="text-white/60">
                                                {isArabic ? 'لقد أرسلنا رابط دفع آمن إلى:' : "We've sent a secure payment link to:"}
                                            </p>
                                            <p className="text-[#0a84ff] font-semibold">
                                                {session?.user?.email}
                                            </p>
                                        </div>

                                        <div className="bg-white/5 rounded-2xl p-6 space-y-3 text-left">
                                            <p className="text-white font-semibold">
                                                {isArabic ? 'الخطوات التالية:' : 'Next steps:'}
                                            </p>
                                            <ol className="space-y-2 text-sm text-white/80">
                                                <li className="flex gap-3">
                                                    <span className="w-6 h-6 bg-[#0a84ff] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                        1
                                                    </span>
                                                    <span>
                                                        {isArabic 
                                                            ? 'تحقق من بريدك الوارد (ومجلد الرسائل غير المرغوب فيها)' 
                                                            : 'Check your email inbox (and spam folder)'
                                                        }
                                                    </span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="w-6 h-6 bg-[#0a84ff] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                        2
                                                    </span>
                                                    <span>
                                                        {isArabic 
                                                            ? 'انقر على رابط الدفع الآمن' 
                                                            : 'Click the secure payment link'
                                                        }
                                                    </span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="w-6 h-6 bg-[#0a84ff] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                        3
                                                    </span>
                                                    <span>
                                                        {isArabic 
                                                            ? 'أكمل دفعتك بشكل آمن مع Stripe' 
                                                            : 'Complete your payment securely with Stripe'
                                                        }
                                                    </span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="w-6 h-6 bg-[#0a84ff] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                        4
                                                    </span>
                                                    <span>
                                                        {isArabic 
                                                            ? `ابدأ التعلم مع ${mentor.name} فوراً!` 
                                                            : `Start learning with ${mentor.name} immediately!`
                                                        }
                                                    </span>
                                                </li>
                                            </ol>
                                        </div>

                                        <div className="bg-[#0a84ff]/10 border border-[#0a84ff]/20 rounded-xl p-4">
                                            <p className="text-white/60 text-xs">
                                                💡 {isArabic 
                                                    ? 'سينتهي صلاحية رابط الدفع خلال 24 ساعة' 
                                                    : 'The payment link will expire in 24 hours'
                                                }
                                            </p>
                                        </div>

                                        <button
                                            onClick={onClose}
                                            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-full transition-all"
                                        >
                                            {isArabic ? 'إغلاق' : 'Close'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
