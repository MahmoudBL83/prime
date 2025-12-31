'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Crown, Zap, Shield, Star, ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle?: string;
}

export default function SubscriptionModal({ isOpen, onClose, courseTitle }: SubscriptionModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';
  const isArabic = locale === 'ar';

  if (!isOpen) return null;

  const handleSubscribeClick = () => {
    router.push(`/${locale}/subscribe`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-neutral-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Header / Graceful Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-transparent -z-10" />

            <div className="p-8">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group"
              >
                <X className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              </button>

              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  {isArabic ? 'فتح الوصول الكامل' : 'Unlock Full Access'}
                </h2>
                <p className="text-white/60 text-base leading-relaxed max-w-[320px]">
                  {courseTitle
                    ? (isArabic ? `اشترك لمشاهدة ${courseTitle} وآلاف الدورات الأخرى.` : `Subscribe to watch ${courseTitle} and thousands of other courses.`)
                    : (isArabic ? 'اشترك للوصول إلى مكتبتنا الكاملة من الدورات المميزة.' : 'Subscribe to access our full library of premium courses.')
                  }
                </p>
              </div>

              {/* Perks List */}
              <div className="space-y-4 mb-10">
                {[
                  { icon: Zap, text: isArabic ? 'وصول غير محدود لجميع الدورات' : 'Unlimited access to all courses', color: 'text-yellow-400' },
                  { icon: Shield, text: isArabic ? 'شهادات معتمدة لكل دورة' : 'Verified certificates for every course', color: 'text-green-400' },
                  { icon: Star, text: isArabic ? 'محتوى حصري ودروس مباشرة' : 'Exclusive content & live sessions', color: 'text-blue-400' }
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${perk.color}`}>
                      <perk.icon className="w-5 h-5" />
                    </div>
                    <span className="text-white/80 font-medium">
                      {perk.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={handleSubscribeClick}
                className="w-full h-16 bg-white hover:bg-white/90 text-black font-bold text-lg rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl group"
              >
                <span>{isArabic ? 'اعرض خطط الاشتراك' : 'View Subscription Plans'}</span>
                <ArrowRight className={`w-5 h-5 transition-transform ${isArabic ? 'rotate-180' : 'group-hover:translate-x-1'}`} />
              </button>

              <p className="text-center text-white/40 text-sm mt-6">
                {isArabic ? 'ألغِ اشتراكك في أي وقت. لا توجد التزامات.' : 'Cancel anytime. No commitments.'}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
