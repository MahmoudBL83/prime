'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'MESSAGE' | 'USER' | 'GROUP' | 'CONVERSATION'
  targetId: string
  targetName: string
  isArabic?: boolean
}

const REPORT_REASONS = {
  en: [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'violence', label: 'Violence or dangerous content' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'other', label: 'Other' },
  ],
  ar: [
    { value: 'spam', label: 'رسائل مزعجة أو مضللة' },
    { value: 'harassment', label: 'مضايقة أو تنمر' },
    { value: 'hate_speech', label: 'خطاب كراهية' },
    { value: 'violence', label: 'عنف أو محتوى خطير' },
    { value: 'inappropriate', label: 'محتوى غير لائق' },
    { value: 'scam', label: 'احتيال أو نصب' },
    { value: 'other', label: 'أخرى' },
  ],
}

export default function ReportModal({
  isOpen,
  onClose,
  type,
  targetId,
  targetName,
  isArabic = false,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reasons = isArabic ? REPORT_REASONS.ar : REPORT_REASONS.en

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error(isArabic ? 'الرجاء اختيار سبب البلاغ' : 'Please select a reason')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId,
          reason: selectedReason,
          details: details || null,
        }),
      })

      if (response.ok) {
        toast.success(
          isArabic
            ? 'تم إرسال البلاغ بنجاح. سنراجعه في أقرب وقت.'
            : 'Report submitted successfully. We will review it shortly.'
        )
        onClose()
        setSelectedReason('')
        setDetails('')
      } else {
        toast.error(isArabic ? 'فشل إرسال البلاغ' : 'Failed to submit report')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error(isArabic ? 'حدث خطأ في إرسال البلاغ' : 'Error submitting report')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isArabic ? 'الإبلاغ' : 'Report'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isArabic
                ? `أنت على وشك الإبلاغ عن "${targetName}". الرجاء تحديد السبب:`
                : `You are about to report "${targetName}". Please select a reason:`}
            </p>

            {/* Reasons */}
            <div className="space-y-2">
              {reasons.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isArabic ? 'تفاصيل إضافية (اختياري)' : 'Additional details (optional)'}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder={
                  isArabic
                    ? 'أضف أي تفاصيل إضافية هنا...'
                    : 'Add any additional details here...'
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || submitting}
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting
                ? isArabic
                  ? 'جاري الإرسال...'
                  : 'Submitting...'
                : isArabic
                ? 'إرسال البلاغ'
                : 'Submit Report'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
