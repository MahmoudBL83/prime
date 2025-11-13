'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Heart, Sparkles, Zap, Gift, Coffee, Star } from 'lucide-react'
import Image from 'next/image'

interface TipModalProps {
  creator: any
  isOpen: boolean
  onClose: () => void
  onSend: (amount: number, message: string) => void
}

export default function TipModal({ creator, isOpen, onClose, onSend }: TipModalProps) {
  const [customAmount, setCustomAmount] = useState<string>('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [message, setMessage] = useState<string>('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const quickAmounts = [
    { value: 5, label: '$5', icon: Coffee, color: 'blue', description: 'Coffee' },
    { value: 10, label: '$10', icon: Heart, color: 'pink', description: 'Love it!' },
    { value: 25, label: '$25', icon: Star, color: 'yellow', description: 'Awesome!' },
    { value: 50, label: '$50', icon: Sparkles, color: 'purple', description: 'Amazing!' },
    { value: 100, label: '$100', icon: Zap, color: 'orange', description: 'You rock!' },
    { value: 200, label: '$200', icon: Gift, color: 'green', description: 'Incredible!' },
  ]

  const handleAmountClick = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value)
    setSelectedAmount(null)
  }

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0

  const handleSend = () => {
    if (finalAmount > 0) {
      onSend(finalAmount, message)
      // Reset form
      setSelectedAmount(null)
      setCustomAmount('')
      setMessage('')
      setIsAnonymous(false)
    }
  }

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
            <div className="bg-card rounded-2xl max-w-2xl w-full border border-border shadow-2xl overflow-hidden my-8">
              {/* Header */}
              <div className="relative p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-border">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-card-hover hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-0.5">
                    <div className="w-full h-full rounded-full bg-card overflow-hidden flex items-center justify-center">
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
                    <h2 className="text-2xl font-bold text-foreground flex items-center">
                      <Heart className="w-6 h-6 text-pink-500 mr-2" />
                      Send a Tip
                    </h2>
                    <p className="text-muted-foreground mt-1">Show your support to {creator?.user?.name}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Quick Amounts */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-3">
                    {quickAmounts.map((amount) => {
                      const Icon = amount.icon
                      const isSelected = selectedAmount === amount.value
                      
                      return (
                        <motion.button
                          key={amount.value}
                          onClick={() => handleAmountClick(amount.value)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? amount.color === 'blue' ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20' :
                                amount.color === 'pink' ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20' :
                                amount.color === 'yellow' ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20' :
                                amount.color === 'purple' ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' :
                                amount.color === 'orange' ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20' :
                                'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                              : 'border-border bg-card hover:bg-card-hover'
                          }`}
                        >
                          <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                            amount.color === 'blue' ? 'bg-blue-500/20' :
                            amount.color === 'pink' ? 'bg-pink-500/20' :
                            amount.color === 'yellow' ? 'bg-yellow-500/20' :
                            amount.color === 'purple' ? 'bg-purple-500/20' :
                            amount.color === 'orange' ? 'bg-orange-500/20' :
                            'bg-green-500/20'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              amount.color === 'blue' ? 'text-blue-400' :
                              amount.color === 'pink' ? 'text-pink-400' :
                              amount.color === 'yellow' ? 'text-yellow-400' :
                              amount.color === 'purple' ? 'text-purple-400' :
                              amount.color === 'orange' ? 'text-orange-400' :
                              'text-green-400'
                            }`} />
                          </div>
                          <div className="text-center">
                            <p className="text-foreground font-bold text-lg">{amount.label}</p>
                            <p className="text-muted-foreground text-xs">{amount.description}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Custom Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="Enter custom amount"
                      className="w-full bg-input border border-input rounded-lg pl-12 pr-4 py-3 text-foreground text-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Add a Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Say something nice..."
                    rows={3}
                    maxLength={200}
                    className="w-full bg-input border border-input rounded-lg px-4 py-3 text-foreground focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all resize-none"
                  />
                  <p className="text-muted-foreground text-xs mt-1">{message.length}/200 characters</p>
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                  <div>
                    <p className="text-foreground font-medium">Send Anonymously</p>
                    <p className="text-muted-foreground text-sm">Your name won't be shown to the creator</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                  </label>
                </div>

                {/* Total Display */}
                {finalAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-xl border border-pink-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm mb-1">You're sending</p>
                        <p className="text-foreground text-3xl font-bold">${finalAmount.toFixed(2)}</p>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Heart className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mt-3">
                      {isAnonymous ? 'Anonymous' : 'From you'} • {message ? 'With message' : 'No message'}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-card/50 border-t border-border">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={finalAmount === 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send ${finalAmount.toFixed(2)}
                  </button>
                </div>
                <p className="text-center text-muted-foreground text-xs mt-4">
                  Tips are processed securely. Transaction fees may apply.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
