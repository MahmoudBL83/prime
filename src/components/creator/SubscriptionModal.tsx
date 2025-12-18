'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Crown, Heart, Sparkles, Star, Shield, Zap, DollarSign } from 'lucide-react'
import Image from 'next/image'

interface SubscriptionModalProps {
  creator: any
  isOpen: boolean
  onClose: () => void
  onSubscribe: (tier: string, duration: string) => void
}

export default function SubscriptionModal({ creator, isOpen, onClose, onSubscribe }: SubscriptionModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>('premium')
  const [selectedDuration, setSelectedDuration] = useState<string>('monthly')

  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      icon: Heart,
      color: 'blue',
      monthlyPrice: creator?.basicMonthlyPrice || 0,
      yearlyPrice: (creator?.basicMonthlyPrice || 0) * 10,
      benefits: [
        'Access to all standard posts',
        'Basic content library',
        'Community chat access',
        'Monthly exclusive post'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: Sparkles,
      color: 'pink',
      monthlyPrice: creator?.premiumMonthlyPrice || 0,
      yearlyPrice: (creator?.premiumMonthlyPrice || 0) * 10,
      popular: true,
      benefits: [
        'All Basic benefits',
        'Exclusive premium content',
        'Behind-the-scenes access',
        'Early content access',
        'Priority support',
        'Monthly 1-on-1 session'
      ]
    },
    {
      id: 'vip',
      name: 'VIP',
      icon: Crown,
      color: 'purple',
      monthlyPrice: creator?.vipMonthlyPrice || 0,
      yearlyPrice: (creator?.vipMonthlyPrice || 0) * 10,
      benefits: [
        'All Premium benefits',
        'Unlimited 1-on-1 messaging',
        'Custom content requests',
        'VIP badge on profile',
        'Priority DM responses',
        'Weekly live sessions',
        'Exclusive VIP community'
      ]
    }
  ]

  const selectedTierData = tiers.find(t => t.id === selectedTier)
  const finalPrice = selectedDuration === 'monthly' 
    ? selectedTierData?.monthlyPrice 
    : selectedTierData?.yearlyPrice

  const savings = selectedDuration === 'yearly' 
    ? ((selectedTierData?.monthlyPrice || 0) * 12 - (selectedTierData?.yearlyPrice || 0)).toFixed(2)
    : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
              {/* Header */}
              <div className="relative p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-gray-800">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
                      {creator?.user?.profileImage ? (
                        <Image 
                          src={creator.user.profileImage} 
                          alt={creator.user.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Subscribe to {creator?.user?.name}
                    </h2>
                    <p className="text-gray-400 mt-1">Choose your subscription tier</p>
                  </div>
                </div>
              </div>

              {/* Duration Toggle */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setSelectedDuration('monthly')}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      selectedDuration === 'monthly'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSelectedDuration('yearly')}
                    className={`px-8 py-3 rounded-lg font-medium transition-all relative ${
                      selectedDuration === 'yearly'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Yearly
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                      Save 15%
                    </span>
                  </button>
                </div>
              </div>

              {/* Tiers */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {tiers.map((tier) => {
                    const Icon = tier.icon
                    const isSelected = selectedTier === tier.id
                    const price = selectedDuration === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice
                    
                    return (
                      <motion.button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? `border-${tier.color}-500 bg-${tier.color}-500/10 shadow-lg shadow-${tier.color}-500/20`
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        } ${tier.popular ? 'ring-2 ring-pink-500 ring-opacity-50' : ''}`}
                      >
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full">
                              MOST POPULAR
                            </span>
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className={`w-6 h-6 bg-${tier.color}-500 rounded-full flex items-center justify-center`}>
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}

                        <div className={`w-12 h-12 rounded-lg bg-${tier.color}-500/20 flex items-center justify-center mb-4`}>
                          <Icon className={`w-6 h-6 text-${tier.color}-400`} />
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                        
                        <div className="mb-4">
                          <div className="flex items-baseline">
                            <span className="text-3xl font-bold text-white">${price}</span>
                            <span className="text-gray-400 ml-2">/{selectedDuration === 'monthly' ? 'month' : 'year'}</span>
                          </div>
                          {selectedDuration === 'yearly' && (
                            <p className="text-sm text-green-400 mt-1">
                              Save ${((tier.monthlyPrice * 12) - tier.yearlyPrice).toFixed(2)}/year
                            </p>
                          )}
                        </div>

                        <ul className="space-y-2">
                          {tier.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start text-sm">
                              <Check className={`w-4 h-4 text-${tier.color}-400 mr-2 mt-0.5 flex-shrink-0`} />
                              <span className="text-gray-300">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="p-6 bg-gray-800/50 border-t border-gray-700">
                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">Selected Plan</p>
                      <p className="text-white font-semibold text-lg">
                        {selectedTierData?.name} - {selectedDuration === 'monthly' ? 'Monthly' : 'Yearly'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Total</p>
                      <p className="text-white font-bold text-2xl">${finalPrice}</p>
                      {selectedDuration === 'yearly' && (
                        <p className="text-green-400 text-sm">Save ${savings}</p>
                      )}
                    </div>
                  </div>

                  {/* Benefits Highlight */}
                  <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-4 mb-4 border border-pink-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-5 h-5 text-pink-400" />
                      <span className="text-white font-semibold">What's Included:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 text-yellow-400 mr-2" />
                        Instant access
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 mr-2" />
                        Cancel anytime
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 text-green-400 mr-2" />
                        Secure payment
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 text-pink-400 mr-2" />
                        Direct support
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onSubscribe(selectedTier, selectedDuration)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all font-semibold shadow-lg"
                    >
                      Subscribe Now
                    </button>
                  </div>

                  <p className="text-center text-gray-500 text-xs mt-4">
                    By subscribing, you agree to recurring billing. You can cancel anytime.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
