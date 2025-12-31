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
    { value: 5, label: '$5', icon: Coffee },
    { value: 10, label: '$10', icon: Heart },
    { value: 25, label: '$25', icon: Star },
    { value: 50, label: '$50', icon: Sparkles },
    { value: 100, label: '$100', icon: Zap },
    { value: 200, label: '$200', icon: Gift },
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
      setSelectedAmount(null)
      setCustomAmount('')
      setMessage('')
      setIsAnonymous(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/95"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-lg mx-4 bg-[#1a1a1a] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 pb-2">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full p-1 bg-[#2d2d2d] mb-4">
                {creator?.user?.profileImage ? (
                  <Image
                    src={creator.user.profileImage}
                    alt={creator.user.name}
                    width={64}
                    height={64}
                    className="rounded-full w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#3d3d3d]" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">Send a Tip</h2>
              <p className="text-[#86868b] text-sm">Support {creator?.user?.name}</p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 pt-2 overflow-y-auto">
            {/* Quick Amounts */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {quickAmounts.map((amount) => {
                const Icon = amount.icon
                const isSelected = selectedAmount === amount.value

                return (
                  <button
                    key={amount.value}
                    onClick={() => handleAmountClick(amount.value)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${isSelected
                        ? 'bg-[#0071e3] border-[#0071e3] text-white shadow-[0_0_15px_rgba(0,113,227,0.3)]'
                        : 'bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d]'
                      }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : 'text-[#86868b]'}`} />
                    <span className="font-bold">{amount.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom Amount */}
            <div className="mb-6 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                <DollarSign className="w-5 h-5" />
              </div>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                placeholder="Custom amount"
                className="w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a nice message..."
                rows={3}
                className="w-full bg-[#2d2d2d] border border-[#3d3d3d] rounded-xl p-4 text-white placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Anonymous Toggle */}
            <label className="flex items-center justify-between p-4 rounded-xl bg-[#2d2d2d] border border-[#3d3d3d] cursor-pointer mb-6">
              <span className="text-white text-sm font-medium">Send anonymously</span>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-5 h-5 rounded border-[#3d3d3d] bg-[#1a1a1a] text-[#0071e3] focus:ring-[#0071e3]"
              />
            </label>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={finalAmount <= 0}
              className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-4 font-bold text-lg transition-all shadow-[0_0_20px_rgba(0,113,227,0.2)] hover:shadow-[0_0_30px_rgba(0,113,227,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send ${finalAmount.toFixed(2)}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
