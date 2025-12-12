'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CreditCard, RefreshCw, XCircle, Edit, AlertCircle } from 'lucide-react';

interface Subscription {
  id: string;
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  billingPeriod: 'MONTHLY' | 'YEARLY';
  price: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PAUSED';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  monthlyMessages: number | null;
  monthlyMeetings: number | null;
  meetingDuration: number;
  prioritySupport: boolean;
  creator: {
    id: string;
    user: {
      name: string;
      arabicName: string;
      profileImage?: string;
    };
  };
}

interface SubscriptionManagementProps {
  subscription: Subscription;
  onCancel: (subscriptionId: string) => Promise<void>;
  onToggleAutoRenew: (subscriptionId: string, autoRenew: boolean) => Promise<void>;
  onUpgrade: (subscriptionId: string) => void;
  locale?: string;
}

export default function SubscriptionManagement({
  subscription,
  onCancel,
  onToggleAutoRenew,
  onUpgrade,
  locale = 'en',
}: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const isArabic = locale === 'ar';

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await onCancel(subscription.id);
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    setIsLoading(true);
    try {
      await onToggleAutoRenew(subscription.id, !subscription.autoRenew);
    } catch (error) {
      console.error('Auto-renew toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tierColors = {
    BASIC: 'from-blue-400 to-blue-600',
    PREMIUM: 'from-purple-400 to-purple-600',
    VIP: 'from-yellow-400 to-yellow-600',
  };

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    EXPIRED: 'bg-muted text-foreground dark:bg-gray-700 dark:text-muted-foreground',
    PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  };

  const startDate = new Date(subscription.startDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US');
  const endDate = new Date(subscription.endDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background dark:bg-card rounded-2xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Creator Avatar */}
          {subscription.creator.user.profileImage ? (
            <img
              src={subscription.creator.user.profileImage}
              alt={subscription.creator.user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${tierColors[subscription.tier]} flex items-center justify-center text-foreground font-bold text-xl`}>
              {subscription.creator.user.name[0]}
            </div>
          )}

          {/* Subscription Info */}
          <div>
            <h3 className="text-xl font-bold text-foreground dark:text-foreground">
              {isArabic ? subscription.creator.user.arabicName : subscription.creator.user.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${tierColors[subscription.tier]} text-foreground`}>
                {subscription.tier}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[subscription.status]}`}>
                {subscription.status}
              </span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            €{subscription.price}
          </div>
          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
            {subscription.billingPeriod === 'MONTHLY' 
              ? (isArabic ? 'شهرياً' : 'per month')
              : (isArabic ? 'سنوياً' : 'per year')}
          </div>
        </div>
      </div>

      {/* Benefits Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background dark:bg-gray-700 rounded-xl p-4">
          <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">
            {isArabic ? 'الرسائل' : 'Messages'}
          </div>
          <div className="text-xl font-bold text-foreground dark:text-foreground">
            {subscription.monthlyMessages === null 
              ? (isArabic ? 'غير محدود' : 'Unlimited')
              : `${subscription.monthlyMessages}/${isArabic ? 'شهر' : 'month'}`}
          </div>
        </div>

        <div className="bg-background dark:bg-gray-700 rounded-xl p-4">
          <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-1">
            {isArabic ? 'الاجتماعات' : 'Meetings'}
          </div>
          <div className="text-xl font-bold text-foreground dark:text-foreground">
            {subscription.monthlyMeetings === null
              ? (isArabic ? 'غير محدود' : 'Unlimited')
              : `${subscription.monthlyMeetings}/${isArabic ? 'شهر' : 'month'}`}
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground dark:text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{isArabic ? 'بدأ في:' : 'Started:'} {startDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{isArabic ? 'ينتهي في:' : 'Ends:'} {endDate}</span>
        </div>
      </div>

      {/* Auto-Renew Toggle */}
      {subscription.status === 'ACTIVE' && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <RefreshCw className={`w-5 h-5 ${subscription.autoRenew ? 'text-blue-600' : 'text-muted-foreground'}`} />
            <div>
              <div className="font-semibold text-foreground dark:text-foreground">
                {isArabic ? 'التجديد التلقائي' : 'Auto-Renew'}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                {isArabic ? 'يتجدد تلقائياً عند انتهاء الفترة' : 'Automatically renews at end of period'}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleAutoRenew}
            disabled={isLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              subscription.autoRenew ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                subscription.autoRenew ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {subscription.status === 'ACTIVE' && subscription.tier !== 'VIP' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onUpgrade(subscription.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-foreground py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
          >
            <Edit className="w-5 h-5" />
            {isArabic ? 'ترقية الخطة' : 'Upgrade Plan'}
          </motion.button>
        )}

        {subscription.status === 'ACTIVE' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCancelConfirm(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-foreground py-3 rounded-xl font-semibold hover:shadow-lg transition-shadow"
          >
            <XCircle className="w-5 h-5" />
            {isArabic ? 'إلغاء الاشتراك' : 'Cancel Subscription'}
          </motion.button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background dark:bg-card rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground dark:text-foreground">
                {isArabic ? 'تأكيد الإلغاء' : 'Confirm Cancellation'}
              </h3>
            </div>

            <p className="text-muted-foreground dark:text-muted-foreground mb-6">
              {isArabic
                ? 'هل أنت متأكد من إلغاء اشتراكك؟ ستفقد الوصول إلى المزايا في نهاية الفترة الحالية.'
                : 'Are you sure you want to cancel your subscription? You will lose access to benefits at the end of the current period.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-foreground dark:text-foreground rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {isArabic ? 'رجوع' : 'Go Back'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-3 bg-red-500 text-foreground rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isLoading ? (isArabic ? 'جاري الإلغاء...' : 'Cancelling...') : (isArabic ? 'نعم، إلغاء' : 'Yes, Cancel')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
