'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';

export default function FeaturedCoursesPage() {
    const router = useRouter();
    const { t } = useTranslationsSafe('courses');
    const { locale } = useTranslationsSafe('courses');

    return (
        <div className="min-h-screen bg-black text-white py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        {locale === 'ar' ? 'الدورات المميزة' : 'Featured Courses'}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        {locale === 'ar'
                            ? 'اكتشف أفضل الدورات التعليمية المختارة بعناية من خبرائنا'
                            : 'Discover the best educational courses carefully selected by our experts'
                        }
                    </p>
                </motion.div>

                <div className="text-center py-20">
                    <p className="text-gray-400 mb-8">
                        {locale === 'ar' ? 'قريباً...' : 'Coming Soon...'}
                    </p>
                    <button
                        onClick={() => router.push(`/${locale}/courses`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-medium transition-all duration-200"
                    >
                        {locale === 'ar' ? 'تصفح جميع الدورات' : 'Browse All Courses'}
                    </button>
                </div>
            </div>
        </div>
    );
}