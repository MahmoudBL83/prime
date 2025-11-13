import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic, Filter, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations, useLocale } from 'next-intl';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchFilter {
    category: string[];
    language: string[];
    type: string[];
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilter>({
        category: [],
        language: [],
        type: []
    });
    const t = useTranslations('search');
    const tCourses = useTranslations('courses');
    const tCommon = useTranslations('common');
    const locale = useLocale();

    // Recent searches (from localStorage or state)
    const recentSearches = ['React للمبتدئين', 'تصميم UI/UX', 'التسويق الرقمي', 'علوم البيانات'];
    const trendingSearches = ['الذكاء الاصطناعي', 'تطوير التطبيقات', 'البرمجة بـ Python', 'إدارة المشاريع'];

    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleSearch = (query: string) => {
        if (query.trim()) {
            // Implement search logic here
            console.log('Searching for:', query, 'with filters:', filters);
            onClose();
        }
    };

    const handleFilterChange = (type: keyof SearchFilter, value: string) => {
        setFilters(prev => ({
            ...prev,
            [type]: prev[type].includes(value)
                ? prev[type].filter(item => item !== value)
                : [...prev[type], value]
        }));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-background/80 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-start justify-center pt-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center gap-4">
                                    {/* Search Input */}
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder={t('placeholder')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                                            className="pl-12 pr-16 py-4 text-lg bg-card border-gray-600 text-foreground placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            autoFocus
                                        />

                                        {/* Voice Search Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <Mic className="w-5 h-5" />
                                        </Button>

                                        {/* Filter Toggle */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 ${showFilters ? 'text-purple-400' : 'text-muted-foreground'
                                                } hover:text-foreground`}
                                        >
                                            <Filter className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    {/* Close Button */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onClose}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>

                                {/* Filters Panel */}
                                {showFilters && (
                                    <motion.div
                                        className="mt-4 p-4 bg-card rounded-lg"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Categories */}
                                            <div>
                                                <h4 className="text-foreground font-medium mb-2">{t('category')}</h4>
                                                <div className="space-y-2">
                                                    {['برمجة', 'تصميم', 'تسويق', 'أعمال', 'لغات'].map(category => (
                                                        <label key={category} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={filters.category.includes(category)}
                                                                onChange={() => handleFilterChange('category', category)}
                                                                className="mr-2 rounded bg-gray-700 border-gray-600"
                                                            />
                                                            <span className="text-muted-foreground text-sm">{category}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Language */}
                                            <div>
                                                <h4 className="text-foreground font-medium mb-2">{t('language')}</h4>
                                                <div className="space-y-2">
                                                    {['العربية', 'الإنجليزية', 'الفرنسية'].map(language => (
                                                        <label key={language} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={filters.language.includes(language)}
                                                                onChange={() => handleFilterChange('language', language)}
                                                                className="mr-2 rounded bg-gray-700 border-gray-600"
                                                            />
                                                            <span className="text-muted-foreground text-sm">{language}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Type */}
                                            <div>
                                                <h4 className="text-foreground font-medium mb-2">{t('type')}</h4>
                                                <div className="space-y-2">
                                                    {['دورة كاملة', 'سلسلة', 'ورشة عمل', 'مسار تعليمي'].map(type => (
                                                        <label key={type} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={filters.type.includes(type)}
                                                                onChange={() => handleFilterChange('type', type)}
                                                                className="mr-2 rounded bg-gray-700 border-gray-600"
                                                            />
                                                            <span className="text-muted-foreground text-sm">{type}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto max-h-96">
                                {searchQuery ? (
                                    // Search Results
                                    <div>
                                        <h3 className="text-foreground font-medium mb-4">{t('results')}</h3>
                                        <div className="space-y-3">
                                            {/* Sample search results */}
                                            {[1, 2, 3].map(item => (
                                                <div key={item} className="flex items-center gap-3 p-3 bg-card rounded-lg hover:bg-gray-700 cursor-pointer">
                                                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                                                        <Search className="w-5 h-5 text-foreground" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-foreground font-medium">{tCourses('course')} {searchQuery} {t('forBeginners')}</h4>
                                                        <p className="text-muted-foreground text-sm">{t('with')} أحمد محمد • 25 {t('hours')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Empty State with Suggestions
                                    <div className="space-y-6">
                                        {/* Recent Searches */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Clock className="w-5 h-5 text-muted-foreground" />
                                                <h3 className="text-foreground font-medium">{t('recentSearches')}</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {recentSearches.map(search => (
                                                    <button
                                                        key={search}
                                                        onClick={() => setSearchQuery(search)}
                                                        className="px-3 py-2 bg-card text-muted-foreground rounded-full text-sm hover:bg-gray-700 transition-colors"
                                                    >
                                                        {search}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Trending Searches */}
                                        <div>
                                            <div className="flex items-center gap-2 mb-4">
                                                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                                                <h3 className="text-foreground font-medium">{t('trendingSearches')}</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {trendingSearches.map(search => (
                                                    <button
                                                        key={search}
                                                        onClick={() => setSearchQuery(search)}
                                                        className="px-3 py-2 bg-purple-600/20 text-purple-300 rounded-full text-sm hover:bg-purple-600/30 transition-colors"
                                                    >
                                                        {search}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}