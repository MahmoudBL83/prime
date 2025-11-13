import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';

interface PricingPlan {
    id: string;
    name: string;
    price: number;
    period: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
}

function buildPlans(locale: string): PricingPlan[] {
    const isAr = locale === 'ar';
    const isDe = locale === 'de';

    const text = {
        normalName: isAr ? 'الخطة العادية' : isDe ? 'Normal' : 'Normal',
        premiumName: isAr ? 'الخطة المميزة' : isDe ? 'Premium' : 'Premium',
        month: isAr ? 'شهر' : isDe ? 'Monat' : 'month',
        normalDesc: isAr ? 'وصول محدود للدورات المختارة' : isDe ? 'Zugriff auf ausgewählte Kurse' : 'Access to selected courses',
        premiumDesc: isAr ? 'وصول كامل لجميع المحتويات' : isDe ? 'Voller Zugriff auf alle Inhalte' : 'Full access to all content',
        ctaStart: isAr ? 'ابدأ الآن' : isDe ? 'Los geht\'s' : 'Get Started',
        ctaSubscribe: isAr ? 'اشترك الآن' : isDe ? 'Jetzt abonnieren' : 'Subscribe Now',
        currency: isAr ? 'ج.م/' : isDe ? 'EGP/' : 'EGP/'
    };

    const normalFeatures = isAr
        ? ['الوصول إلى 50 دورة تدريبية', 'المشاهدة على جهاز واحد', 'دعم فني أساسي', 'شهادات إتمام']
        : isDe
            ? ['Zugriff auf 50 Kurse', 'Ansehen auf einem Gerät', 'Basis-Support', 'Abschlusszertifikate']
            : ['Access to 50 courses', 'Watch on one device', 'Basic support', 'Completion certificates'];

    const premiumFeatures = isAr
        ? ['الوصول لجميع الدورات (1000+)', 'قنوات المنشئين الحصرية', 'المشاهدة على 3 أجهزة', 'التنزيل والمشاهدة دون اتصال', 'دعم فني متميز 24/7', 'ورش عمل شهرية مباشرة']
        : isDe
            ? ['Zugriff auf alle Kurse (1000+)', 'Exklusive Creator-Kanäle', 'Ansehen auf 3 Geräten', 'Offline-Downloads', 'Premium-Support 24/7', 'Monatliche Live-Workshops']
            : ['Access to all courses (1000+)', 'Exclusive creator channels', 'Watch on 3 devices', 'Offline downloads', 'Priority support 24/7', 'Monthly live workshops'];

    return [
        {
            id: 'normal',
            name: text.normalName,
            price: 99,
            period: text.month,
            description: text.normalDesc,
            features: normalFeatures,
            buttonText: text.ctaStart
        },
        {
            id: 'premium',
            name: text.premiumName,
            price: 199,
            period: text.month,
            description: text.premiumDesc,
            features: premiumFeatures,
            isPopular: true,
            buttonText: text.ctaSubscribe
        }
    ];
}

export function Pricing() {
    const { ref, inView, animationProps } = useScrollAnimation();
    const { t } = useTranslationsSafe('payment');
    const { locale } = useTranslationsSafe('payment');
    const pricingPlans = buildPlans(locale);

    return (
        <motion.section
            ref={ref}
            className="relative py-24 px-4 md:px-8 overflow-hidden"
            {...animationProps}
        >
            {/* Enhanced background effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900"></div>
                <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto">
                {/* Enhanced Header */}
                <div className="text-center mb-20">
                    <motion.div
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full px-6 py-2 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-2xl">💎</span>
                        <span className="text-sm font-medium text-purple-300">Premium Plans</span>
                    </motion.div>
                    
                    <motion.h2 
                        className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                            Choose Your
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-blue-400 bg-clip-text text-transparent">
                            Perfect Plan
                        </span>
                    </motion.h2>
                    
                    <motion.p 
                        className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {t('flexiblePlans')}
                    </motion.p>
                </div>

                {/* Poster-style Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            className="group relative"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            whileHover={{ scale: 1.05, zIndex: 10 }}
                        >
                            {/* Poster-style card */}
                            <div className="relative overflow-hidden rounded-3xl transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/40">
                                <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900">
                                    {/* Gradient background */}
                                    <div className={`absolute inset-0 ${plan.isPopular 
                                        ? 'bg-gradient-to-br from-yellow-500/20 via-purple-600/30 to-blue-600/30' 
                                        : 'bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-purple-600/20'
                                    } opacity-50 group-hover:opacity-70 transition-opacity duration-500`}></div>
                                    
                                    {/* Dark overlay for text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-500" />
                                    
                                    {/* Popular badge - top */}
                                    {plan.isPopular && (
                                        <div className="absolute top-0 left-0 right-0 z-20">
                                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Star className="w-5 h-5 text-yellow-900 fill-current" />
                                                    <span className="text-yellow-900 text-sm font-black uppercase tracking-wider">
                                                        Most Popular
                                                    </span>
                                                    <Star className="w-5 h-5 text-yellow-900 fill-current" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Content */}
                                    <div className={`absolute inset-0 flex flex-col justify-between p-8 z-10 ${plan.isPopular ? 'pt-20' : 'pt-8'}`}>
                                        {/* Top section - Plan name and price */}
                                        <div>
                                            <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">
                                                {plan.name}
                                            </h3>
                                            <p className="text-muted-foreground mb-6 text-base font-medium leading-relaxed">
                                                {plan.description}
                                            </p>
                                            <div className="flex items-end mb-8">
                                                <span className="text-6xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mr-2">
                                                    {plan.price}
                                                </span>
                                                <span className="text-lg text-muted-foreground font-bold pb-2">
                                                    EGP/{plan.period}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Middle section - Features */}
                                        <div className="flex-1">
                                            <ul className="space-y-3 mb-8">
                                                {plan.features.map((feature, featureIndex) => (
                                                    <li key={featureIndex} className="flex items-start gap-3 text-gray-200 text-sm font-medium">
                                                        <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                                                            <Check className="w-3 h-3 text-green-400" />
                                                        </div>
                                                        <span className="flex-1">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        {/* Bottom section - CTA Button */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Button
                                                className={`w-full py-4 rounded-xl font-bold text-base shadow-2xl border-0 transition-all duration-300 ${
                                                    plan.isPopular
                                                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-yellow-900 shadow-yellow-500/30'
                                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground shadow-purple-500/30'
                                                }`}
                                            >
                                                {plan.buttonText}
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    {/* Glow effect on hover */}
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl ${
                                        plan.isPopular ? 'bg-yellow-500' : 'bg-purple-500'
                                    }`}></div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Trust badges */}
                <motion.div 
                    className="mt-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <div className="flex justify-center items-center gap-8 flex-wrap">
                        {[
                            { icon: <Check className="w-5 h-5 text-green-400" />, text: t('moneyBackGuarantee') },
                            { icon: <Check className="w-5 h-5 text-green-400" />, text: t('cancelAnytime') },
                            { icon: <Check className="w-5 h-5 text-green-400" />, text: t('securePayment') }
                        ].map((badge, index) => (
                            <div 
                                key={index} 
                                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-border rounded-full px-6 py-3 hover:bg-white/10 hover:border-border transition-all duration-300"
                            >
                                {badge.icon}
                                <span className="text-muted-foreground text-sm font-medium">{badge.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
}
