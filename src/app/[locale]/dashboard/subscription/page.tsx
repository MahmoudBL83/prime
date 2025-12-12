'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  RefreshCw,
  Shield,
  Clock,
  DollarSign,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  Home
} from 'lucide-react';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  type: 'CATEGORY_A' | 'CATEGORY_B' | 'BUNDLE_AB';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE';
  startDate: string;
  endDate: string;
  pricePerMonth: number;
  billingCycle: 'monthly' | 'yearly';
  stripeSubscriptionId?: string;
  coursesCount: number;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  invoiceUrl?: string;
  pdfUrl?: string;
}

export default function SubscriptionManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t, locale } = useTranslationsSafe('subscription');
  const isRtl = locale === 'ar';
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPortal, setProcessingPortal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/login?redirect=/dashboard/subscription`);
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubscriptionData();
    }
  }, [status, locale]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscription details
      const subResponse = await fetch('/api/subscription/current');
      if (!subResponse.ok) throw new Error('Failed to fetch subscription');
      const subData = await subResponse.json();
      
      setSubscription(subData.subscription);
      
      // Fetch invoice history
      if (subData.subscription?.stripeSubscriptionId) {
        const invoiceResponse = await fetch('/api/subscription/invoices');
        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          setInvoices(invoiceData.invoices || []);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error(isRtl ? 'فشل تحميل بيانات الاشتراك' : 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleManagePayment = async () => {
    try {
      setProcessingPortal(true);
      
      // Create Stripe billing portal session
      const response = await fetch('/api/subscription/billing-portal', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to create portal session');
      
      const data = await response.json();
      
      // Redirect to Stripe billing portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error(isRtl ? 'فشل فتح بوابة الدفع' : 'Failed to open billing portal');
      setProcessingPortal(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to cancel subscription');
      
      toast.success(isRtl 
        ? 'تم إلغاء الاشتراك. ستظل لديك حق الوصول حتى نهاية فترة الفوترة.'
        : 'Subscription cancelled. You will retain access until the end of your billing period.');
      
      setShowCancelDialog(false);
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(isRtl ? 'فشل إلغاء الاشتراك' : 'Failed to cancel subscription');
    }
  };

  const handleUpgrade = (newType: string) => {
    router.push(`/${locale}/subscribe?upgrade=${newType}`);
  };

  const getSubscriptionTypeName = (type: string) => {
    const names: Record<string, { en: string; ar: string }> = {
      'CATEGORY_A': { en: 'Category A - Expert Instructors', ar: 'الفئة أ - المدربون الخبراء' },
      'CATEGORY_B': { en: 'Category B - Rising Stars', ar: 'الفئة ب - النجوم الصاعدة' },
      'BUNDLE_AB': { en: 'Bundle A+B - Complete Access', ar: 'الباقة أ+ب - الوصول الكامل' },
    };
    return isRtl ? names[type]?.ar : names[type]?.en;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: { en: string; ar: string } }> = {
      'ACTIVE': { 
        color: 'bg-green-500/10 text-green-400 border-green-500/20', 
        icon: CheckCircle,
        label: { en: 'Active', ar: 'نشط' }
      },
      'CANCELLED': { 
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', 
        icon: AlertCircle,
        label: { en: 'Cancelled', ar: 'ملغي' }
      },
      'EXPIRED': { 
        color: 'bg-red-500/10 text-red-400 border-red-500/20', 
        icon: XCircle,
        label: { en: 'Expired', ar: 'منتهي' }
      },
      'PAST_DUE': { 
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
        icon: AlertCircle,
        label: { en: 'Past Due', ar: 'متأخر' }
      },
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;
    const Icon = config.icon;
    const label = isRtl ? config.label.ar : config.label.en;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.color} text-sm font-medium`}>
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-950 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
            <Package className="w-20 h-20 text-gray-700 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-300 mb-4">
              {isRtl ? 'لا يوجد اشتراك نشط' : 'No Active Subscription'}
            </h2>
            <p className="text-gray-500 mb-8">
              {isRtl 
                ? 'ليس لديك اشتراك نشط حالياً. اشترك الآن للوصول إلى آلاف الدورات!'
                : 'You don\'t have an active subscription. Subscribe now to access thousands of courses!'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/${locale}/subscribe`)}
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl text-white font-semibold transition-all"
            >
              {isRtl ? 'استكشف الباقات' : 'Explore Plans'}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  const monthlyPrice = subscription.billingCycle === 'yearly' 
    ? Math.round(subscription.pricePerMonth * 12 / 12)
    : subscription.pricePerMonth;

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isRtl ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
            </span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isRtl ? 'إدارة الاشتراك' : 'Manage Subscription'}
          </h1>
          <p className="text-gray-400">
            {isRtl 
              ? 'إدارة خطة الاشتراك وطرق الدفع والفواتير'
              : 'Manage your subscription plan, payment methods, and billing'}
          </p>
        </div>

        {/* Current Subscription Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">
                  {getSubscriptionTypeName(subscription.type)}
                </h2>
                {getStatusBadge(subscription.status)}
              </div>
              <p className="text-gray-400">
                {isRtl ? 'اشتراكك الحالي' : 'Your current plan'}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-1">
                €{monthlyPrice}
                <span className="text-lg text-gray-400">
                  /{isRtl ? 'شهر' : 'month'}
                </span>
              </div>
              {subscription.billingCycle === 'yearly' && (
                <p className="text-sm text-green-400">
                  {isRtl ? 'توفير 20% بالدفع السنوي' : 'Save 20% with annual billing'}
                </p>
              )}
            </div>
          </div>

          {/* Subscription Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">
                  {isRtl ? 'تاريخ البدء' : 'Start Date'}
                </span>
              </div>
              <p className="text-white font-semibold">
                {new Date(subscription.startDate).toLocaleDateString(
                  isRtl ? 'ar-EG' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">
                  {isRtl ? 'التجديد التالي' : 'Next Renewal'}
                </span>
              </div>
              <p className="text-white font-semibold">
                {new Date(subscription.endDate).toLocaleDateString(
                  isRtl ? 'ar-EG' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">
                  {isRtl ? 'الدورات المتاحة' : 'Courses Available'}
                </span>
              </div>
              <p className="text-white font-semibold">
                {subscription.coursesCount} {isRtl ? 'دورة' : 'courses'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleManagePayment}
              disabled={processingPortal}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              {processingPortal 
                ? (isRtl ? 'جاري التحميل...' : 'Loading...') 
                : (isRtl ? 'إدارة طريقة الدفع' : 'Manage Payment Method')}
            </motion.button>

            {subscription.status === 'ACTIVE' && subscription.type !== 'BUNDLE_AB' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUpgradeDialog(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl text-white font-semibold transition-all"
              >
                <ArrowUpCircle className="w-5 h-5" />
                {isRtl ? 'ترقية الخطة' : 'Upgrade Plan'}
              </motion.button>
            )}

            {subscription.status === 'ACTIVE' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCancelDialog(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-semibold transition-colors"
              >
                <XCircle className="w-5 h-5" />
                {isRtl ? 'إلغاء الاشتراك' : 'Cancel Subscription'}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 rounded-2xl border border-gray-800 p-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-400" />
            {isRtl ? 'سجل الفواتير' : 'Billing History'}
          </h3>

          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {isRtl ? 'لا توجد فواتير بعد' : 'No invoices yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      invoice.status === 'paid' 
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {invoice.status === 'paid' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {invoice.amount} {invoice.currency.toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(invoice.date).toLocaleDateString(
                          isRtl ? 'ar-EG' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title={isRtl ? 'تحميل PDF' : 'Download PDF'}
                      >
                        <Download className="w-5 h-5 text-gray-400" />
                      </a>
                    )}
                    {invoice.invoiceUrl && (
                      <a
                        href={invoice.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title={isRtl ? 'عرض الفاتورة' : 'View Invoice'}
                      >
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {isRtl ? 'إلغاء الاشتراك؟' : 'Cancel Subscription?'}
                </h3>
                <p className="text-gray-400">
                  {isRtl 
                    ? 'ستفقد الوصول إلى جميع الدورات في نهاية فترة الفوترة الحالية.'
                    : 'You will lose access to all courses at the end of your current billing period.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-semibold transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-semibold transition-colors"
                >
                  {isRtl ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Upgrade Dialog */}
        {showUpgradeDialog && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-2xl border border-gray-800 p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                {isRtl ? 'ترقية الاشتراك' : 'Upgrade Subscription'}
              </h3>

              <div className="space-y-3 mb-6">
                {subscription.type !== 'BUNDLE_AB' && (
                  <button
                    onClick={() => handleUpgrade('BUNDLE_AB')}
                    className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">
                          {isRtl ? 'الباقة أ+ب' : 'Bundle A+B'}
                        </p>
                        <p className="text-sm opacity-90">
                          {isRtl ? 'الوصول الكامل لجميع الدورات' : 'Full access to all courses'}
                        </p>
                      </div>
                      <ArrowUpCircle className="w-6 h-6" />
                    </div>
                  </button>
                )}

                {subscription.type === 'CATEGORY_A' && (
                  <button
                    onClick={() => handleUpgrade('CATEGORY_B')}
                    className="w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-white text-left transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold">
                          {isRtl ? 'الفئة ب' : 'Category B'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {isRtl ? 'النجوم الصاعدة' : 'Rising Stars'}
                        </p>
                      </div>
                      <ArrowUpCircle className="w-6 h-6" />
                    </div>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowUpgradeDialog(false)}
                className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-semibold transition-colors"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
