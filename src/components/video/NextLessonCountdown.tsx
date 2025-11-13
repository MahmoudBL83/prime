'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, X } from 'lucide-react';

interface NextLessonCountdownProps {
    nextLessonId: string | null;
    nextLessonTitle: string;
    onNavigate: () => void;
    onCancel: () => void;
    countdown?: number; // seconds
    isArabic?: boolean;
}

export default function NextLessonCountdown({
    nextLessonId,
    nextLessonTitle,
    onNavigate,
    onCancel,
    countdown = 5,
    isArabic = false,
}: NextLessonCountdownProps) {
    const [timeLeft, setTimeLeft] = useState(countdown);

    useEffect(() => {
        if (timeLeft === 0) {
            onNavigate();
            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft, onNavigate]);

    if (!nextLessonId) {
        return null;
    }

    return (
        <>
            {/* Animated Confetti Effect (CSS) */}
            <div className="confetti-container">
                {[...Array(50)].map((_, i) => (
                    <div
                        key={i}
                        className="confetti"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            backgroundColor: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'][i % 5],
                        }}
                    />
                ))}
            </div>

            {/* Countdown Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-800 border border-border rounded-2xl p-8 max-w-md w-full text-center relative"
                >
                    {/* Close Button */}
                    <button
                        onClick={onCancel}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Success Icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6"
                    >
                        <CheckCircle className="w-12 h-12 text-green-400" />
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {isArabic ? '🎉 أحسنت!' : '🎉 Great Job!'}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        {isArabic ? 'لقد أكملت هذا الدرس' : 'You completed this lesson'}
                    </p>

                    {/* Next Lesson Info */}
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-border">
                        <p className="text-sm text-muted-foreground mb-2">
                            {isArabic ? 'الدرس التالي' : 'Next Lesson'}
                        </p>
                        <p className="text-foreground font-semibold line-clamp-2">
                            {nextLessonTitle}
                        </p>
                    </div>

                    {/* Countdown */}
                    <div className="mb-6">
                        <div className="relative inline-flex items-center justify-center">
                            <svg className="w-24 h-24 -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-foreground"
                                />
                                <motion.circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-purple-500"
                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - timeLeft / countdown)}`}
                                    strokeLinecap="round"
                                    transition={{ duration: 1, ease: 'linear' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl font-bold text-foreground">{timeLeft}</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-3">
                            {isArabic ? 'سيبدأ الدرس التالي تلقائياً...' : 'Next lesson starting automatically...'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onNavigate}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                        >
                            {isArabic ? 'تشغيل الآن' : 'Play Now'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-6 bg-gray-700 hover:bg-gray-600 text-foreground py-3 rounded-lg font-semibold transition-colors"
                        >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            <style jsx>{`
                .confetti-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 9999;
                }
                .confetti {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    top: -10px;
                    opacity: 0;
                    animation: confetti-fall 3s linear forwards;
                }
                @keyframes confetti-fall {
                    to {
                        top: 100vh;
                        opacity: 1;
                        transform: rotateZ(360deg);
                    }
                }
            `}</style>
        </>
    );
}
