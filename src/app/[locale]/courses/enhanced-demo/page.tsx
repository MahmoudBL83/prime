'use client';

import { EnhancedCourseCard } from '@/components/landing/EnhancedCourseCard';
import { CourseCard } from '@/components/landing/CourseCard';
import { useTranslations } from 'next-intl';

// Demo course data
const demoCourse = {
    id: 'demo-course-1',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop',
    titleAr: 'تعلم React من الصفر',
    titleEn: 'Learn React from Scratch',
    instructor: 'أحمد محمد',
    duration: '8 ساعات',
    level: 'مبتدئ',
    rating: 4.8,
    category: 'البرمجة',
    hasProgress: false,
    progress: 0
};

export default function EnhancedCourseCardDemo() {
    const t = useTranslations('courses');

    return (
        <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Enhanced Course Card Demo
                    </h1>
                    <p className="text-gray-600">
                        Comparing the original CourseCard with the new EnhancedCourseCard that features hover card behavior
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Original CourseCard */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Original CourseCard
                        </h2>
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <CourseCard
                                course={demoCourse}
                                onClick={() => console.log('Course clicked')}
                                userSubscriptionStatus="NONE"
                            />
                        </div>
                    </div>

                    {/* Enhanced CourseCard */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Enhanced CourseCard (New)
                        </h2>
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <EnhancedCourseCard
                                course={demoCourse}
                                onClick={() => console.log('Course clicked')}
                                userSubscriptionStatus="NONE"
                            />
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-12 bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                        How to Test the Hover Behavior
                    </h3>
                    <ul className="text-blue-800 space-y-2">
                        <li>• Hover over the Enhanced CourseCard to see the detailed hover card appear below</li>
                        <li>• The hover card includes course description, category tags, and action buttons</li>
                        <li>• The hover card has smooth animations and proper positioning</li>
                        <li>• Compare with the original CourseCard which only shows a simple overlay</li>
                    </ul>
                </div>

                {/* Features */}
                <div className="mt-8 bg-green-50 p-6 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">
                        Enhanced Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-800">
                        <ul className="space-y-1">
                            <li>✅ Detailed hover card with course information</li>
                            <li>✅ Category tags with colored indicators</li>
                            <li>✅ Action buttons (Play, Add to List, Share)</li>
                            <li>✅ Smooth animations and transitions</li>
                        </ul>
                        <ul className="space-y-1">
                            <li>✅ Responsive design</li>
                            <li>✅ Proper positioning and z-index</li>
                            <li>✅ RTL language support</li>
                            <li>✅ Accessibility considerations</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}