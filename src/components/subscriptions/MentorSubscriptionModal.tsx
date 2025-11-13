'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Star, Crown, Check, TrendingUp, TrendingDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionTier {
  id: 'BASIC' | 'PREMIUM' | 'VIP';
  name: string;
  icon: any;
  color: string;
  gradient: string;
  monthlyPrice: number;
  yearlyPrice: number;
  messages: number | null;
  meetings: number | null;
  meetingDuration: number;
  features: string[];
}

interface CurrentSubscription {
  id: string;
  tier: 'BASIC' | 'PREMIUM' | 'VIP';
  billingPeriod: 'MONTHLY' | 'YEARLY';
  price: number;
  endDate: string;
  autoRenew: boolean;
}

interface MentorSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: {
    id: string;
    name: string;
    arabicName?: string;
    profileImage?: string;
    bio?: string;
    totalSubscribers?: number;
    basicMonthlyPrice?: number;
    basicYearlyPrice?: number;
    premiumMonthlyPrice?: number;
    premiumYearlyPrice?: number;
    vipMonthlyPrice?: number;
    vipYearlyPrice?: number;
  };
  currentSubscription?: CurrentSubscription | null;
  onSubscribe: () => void;
}

export default function MentorSubscriptionModal({
  isOpen,
  onClose,
  mentor,
  currentSubscription,
  onSubscribe,
}: MentorSubscriptionModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'BASIC' | 'PREMIUM' | 'VIP' | null>(null);

  const tiers: SubscriptionTier[] = [
    {
      id: 'BASIC',
      name: 'Basic',
      icon: Sparkles,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      monthlyPrice: mentor.basicMonthlyPrice || 149,
      yearlyPrice: mentor.basicYearlyPrice || 1490,
      messages: 10,
      meetings: 1,
      meetingDuration: 30,
      features: [
        '10 messages per month',
        '1 one-on-one meeting',
        '30 minutes per meeting',
        'Access to exclusive content',
        'Email support',
      ],
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      icon: Star,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      monthlyPrice: mentor.premiumMonthlyPrice || 299,
      yearlyPrice: mentor.premiumYearlyPrice || 2990,
      messages: 50,
      meetings: 4,
      meetingDuration: 60,
      features: [
        '50 messages per month',
        '4 one-on-one meetings',
        '60 minutes per meeting',
        'Access to exclusive content',
        'Priority support',
        'Early access to new features',
      ],
    },
    {
      id: 'VIP',
      name: 'VIP',
      icon: Crown,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
      monthlyPrice: mentor.vipMonthlyPrice || 699,
      yearlyPrice: mentor.vipYearlyPrice || 6990,
      messages: null,
      meetings: null,
      meetingDuration: 90,
      features: [
        'Unlimited messages',
        'Unlimited meetings',
        '90 minutes per meeting',
        'Access to exclusive content',
        'Priority support',
        '24/7 direct access',
        'Exclusive VIP perks',
      ],
    },
  ];

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setLoading(true);
    setSelectedTier(tier.id);

    try {
      const isUpgrade = currentSubscription && getTierLevel(tier.id) > getTierLevel(currentSubscription.tier);
      const isDowngrade = currentSubscription && getTierLevel(tier.id) < getTierLevel(currentSubscription.tier);

      if (currentSubscription) {
        // Update existing subscription
        const response = await fetch(`/api/mentor-subscriptions/${currentSubscription.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: tier.id,
            billingPeriod,
          }),
        });

        if (!response.ok) throw new Error('Failed to update subscription');
      } else {
        // Create new subscription
        const response = await fetch('/api/mentor-subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: mentor.id,
            tier: tier.id,
            billingPeriod,
          }),
        });

        if (!response.ok) throw new Error('Failed to create subscription');
      }

      // 🎉 Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: tier.id === 'BASIC' ? ['#3B82F6', '#06B6D4'] : 
                tier.id === 'PREMIUM' ? ['#A855F7', '#EC4899'] : 
                ['#F59E0B', '#F97316'],
      });

      onSubscribe();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error managing subscription:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  const getTierLevel = (tier: 'BASIC' | 'PREMIUM' | 'VIP'): number => {
    return tier === 'BASIC' ? 1 : tier === 'PREMIUM' ? 2 : 3;
  };

  const getActionLabel = (tier: SubscriptionTier): string => {
    if (!currentSubscription) return 'Subscribe';
    if (currentSubscription.tier === tier.id) return 'Current Plan';
    if (getTierLevel(tier.id) > getTierLevel(currentSubscription.tier)) return 'Upgrade';
    return 'Downgrade';
  };

  const getActionIcon = (tier: SubscriptionTier) => {
    if (!currentSubscription || currentSubscription.tier === tier.id) return null;
    if (getTierLevel(tier.id) > getTierLevel(currentSubscription.tier)) return TrendingUp;
    return TrendingDown;
  };

  const calculateSavings = (tier: SubscriptionTier) => {
    const monthlyTotal = tier.monthlyPrice * 12;
    const yearlySavings = monthlyTotal - tier.yearlyPrice;
    const savingsPercentage = Math.round((yearlySavings / monthlyTotal) * 100);
    return { amount: yearlySavings, percentage: savingsPercentage };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-border"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="relative p-8 pb-6 border-b border-border/50">
            <div className="flex items-start gap-6">
              {mentor.profileImage && (
                <img
                  src={mentor.profileImage}
                  alt={mentor.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-500/30"
                />
              )}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  Subscribe to {mentor.arabicName || mentor.name}
                </h2>
                <p className="text-muted-foreground mb-4">{mentor.bio || 'Expert mentor and educator'}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-muted-foreground">{mentor.totalSubscribers || 0} subscribers</span>
                  </div>
                  {currentSubscription && (
                    <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                      Current: {currentSubscription.tier} • {currentSubscription.billingPeriod}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setBillingPeriod('MONTHLY')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  billingPeriod === 'MONTHLY'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-foreground shadow-lg'
                    : 'bg-card text-muted-foreground hover:bg-gray-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('YEARLY')}
                className={`px-6 py-3 rounded-xl font-medium transition-all relative ${
                  billingPeriod === 'YEARLY'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-foreground shadow-lg'
                    : 'bg-card text-muted-foreground hover:bg-gray-700'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-foreground text-xs rounded-full">
                  Save up to 17%
                </span>
              </button>
            </div>
          </div>

          {/* Tiers Grid */}
          <div className="grid md:grid-cols-3 gap-6 p-8">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const ActionIcon = getActionIcon(tier);
              const price = billingPeriod === 'MONTHLY' ? tier.monthlyPrice : tier.yearlyPrice;
              const savings = billingPeriod === 'YEARLY' ? calculateSavings(tier) : null;
              const isCurrentPlan = currentSubscription?.tier === tier.id;
              const actionLabel = getActionLabel(tier);

              return (
                <motion.div
                  key={tier.id}
                  whileHover={{ scale: 1.02 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    isCurrentPlan
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-border bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  {/* Tier Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${tier.gradient}`}>
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    {tier.id === 'PREMIUM' && (
                      <span className="px-3 py-1 bg-purple-500 text-foreground text-xs rounded-full font-medium">
                        Popular
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-2">{tier.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">{price}</span>
                      <span className="text-muted-foreground">EGP</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per {billingPeriod === 'MONTHLY' ? 'month' : 'year'}
                    </div>
                    {savings && (
                      <div className="mt-2 text-sm text-green-400">
                        Save {savings.amount} EGP ({savings.percentage}%)
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Button */}
                  <button
                    onClick={() => !isCurrentPlan && handleSubscribe(tier)}
                    disabled={loading || isCurrentPlan}
                    className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCurrentPlan
                        ? 'bg-gray-700 text-muted-foreground cursor-not-allowed'
                        : `bg-gradient-to-r ${tier.gradient} text-foreground hover:shadow-lg hover:scale-105`
                    }`}
                  >
                    {loading && selectedTier === tier.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {ActionIcon && <ActionIcon className="w-5 h-5" />}
                        {actionLabel}
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Trust Indicators */}
          <div className="border-t border-border/50 p-6 bg-gray-800/30">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Safe & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Instant Access</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
