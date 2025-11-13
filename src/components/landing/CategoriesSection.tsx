'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';

interface Category {
  key: string;
  name: string;
  nameAr: string;
  icon: string;
  color: string;
  courseCount?: number;
}

const categories: Category[] = [
  {
    key: 'programming',
    name: 'Programming',
    nameAr: 'البرمجة',
    icon: '💻',
    color: '#3B82F6'
  },
  {
    key: 'web-development',
    name: 'Web Development',
    nameAr: 'تطوير الويب',
    icon: '🌐',
    color: '#10B981'
  },
  {
    key: 'mobile-development',
    name: 'Mobile Development',
    nameAr: 'تطوير تطبيقات الجوال',
    icon: '📱',
    color: '#8B5CF6'
  },
  {
    key: 'data-science',
    name: 'Data Science',
    nameAr: 'علوم البيانات',
    icon: '📊',
    color: '#F59E0B'
  },
  {
    key: 'ai',
    name: 'Artificial Intelligence',
    nameAr: 'الذكاء الاصطناعي',
    icon: '🤖',
    color: '#EC4899'
  },
  {
    key: 'design',
    name: 'Design',
    nameAr: 'التصميم',
    icon: '🎨',
    color: '#6366F1'
  },
  {
    key: 'business',
    name: 'Business',
    nameAr: 'الأعمال',
    icon: '💼',
    color: '#14B8A6'
  },
  {
    key: 'marketing',
    name: 'Marketing',
    nameAr: 'التسويق',
    icon: '📢',
    color: '#F97316'
  }
];

export function CategoriesSection() {
  const router = useRouter();
  const { locale } = useTranslationsSafe('common');
  const isRtl = locale === 'ar';

  const handleCategoryClick = (categoryKey: string) => {
    router.push(`/${locale}/courses?category=${categoryKey}`);
  };

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced Section Header */}
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full px-6 py-2 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-2xl">📚</span>
            <span className="text-sm font-medium text-purple-300">
              {isRtl ? 'استكشف الفئات' : 'Explore Categories'}
            </span>
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              {isRtl ? 'تصفح حسب' : 'Browse by'}
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
              {isRtl ? 'الفئة' : 'Category'}
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {isRtl 
              ? 'استكشف آلاف الدورات في مختلف المجالات واختر ما يناسب شغفك وأهدافك المهنية' 
              : 'Explore thousands of courses across different fields and choose what suits your passion and professional goals'
            }
          </motion.p>
        </div>

        {/* Poster-style Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.button
              key={category.key}
              onClick={() => handleCategoryClick(category.key)}
              className="group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer hover:shadow-2xl"
              style={{
                boxShadow: `0 0 40px ${category.color}00`
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ 
                scale: 1.08, 
                zIndex: 10,
                boxShadow: `0 0 40px ${category.color}40`
              }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Poster-style background */}
              <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {/* Gradient overlay matching category color */}
                <div 
                  className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${category.color}20 0%, ${category.color}40 50%, ${category.color}20 100%)`
                  }}
                ></div>
                
                {/* Dark gradient for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                
                {/* Animated glow effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl"
                  style={{ background: category.color }}
                ></div>
                
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="transform group-hover:scale-125 transition-transform duration-500">
                    <span 
                      className="text-8xl opacity-90 group-hover:opacity-100"
                      style={{ 
                        filter: `drop-shadow(0 0 20px ${category.color}80)`,
                        textShadow: `0 0 30px ${category.color}`
                      }}
                    >
                      {category.icon}
                    </span>
                  </div>
                </div>
                
                {/* Bottom content section */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  {/* Category Name */}
                  <h3 
                    className="text-lg font-bold mb-2 transition-all duration-300 group-hover:text-foreground"
                    style={{ color: category.color }}
                  >
                    {isRtl ? category.nameAr : category.name}
                  </h3>
                  
                  {/* Course Count */}
                  {category.courseCount !== undefined && (
                    <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {category.courseCount} {isRtl ? 'دورة' : 'courses'}
                    </p>
                  )}
                  
                  {/* Hover details - View button */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-3">
                    <div 
                      className="w-full py-2.5 rounded-lg text-foreground text-sm font-bold text-center backdrop-blur-sm transition-all duration-300"
                      style={{ 
                        background: `linear-gradient(135deg, ${category.color}80, ${category.color}60)`,
                        boxShadow: `0 4px 12px ${category.color}40`
                      }}
                    >
                      {isRtl ? 'استكشف الآن' : 'Explore Now'}
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Enhanced View All Button */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={() => router.push(`/${locale}/courses`)}
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl shadow-purple-500/30 border-0"
          >
            {isRtl ? 'عرض جميع الدورات' : 'View All Courses'}
            <svg 
              className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
