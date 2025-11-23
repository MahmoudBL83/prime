'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Send } from 'lucide-react'

type TicketCategory = 'BILLING' | 'TECHNICAL' | 'CONTENT' | 'SAFETY' | 'OTHER'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

const categoryOptions = [
  { value: 'TECHNICAL', label: 'Technical Issue', emoji: '🔧', description: 'Bugs, errors, or technical problems' },
  { value: 'BILLING', label: 'Billing', emoji: '💳', description: 'Payment, refunds, or subscription issues' },
  { value: 'CONTENT', label: 'Content', emoji: '📝', description: 'Course content or quality concerns' },
  { value: 'SAFETY', label: 'Safety', emoji: '🛡️', description: 'Report inappropriate content or behavior' },
  { value: 'OTHER', label: 'Other', emoji: '❓', description: 'General inquiries or other topics' },
]

const priorityOptions = [
  { value: 'LOW', label: 'Low', description: 'General questions or minor issues' },
  { value: 'MEDIUM', label: 'Medium', description: 'Issues affecting your experience' },
  { value: 'HIGH', label: 'High', description: 'Urgent issues requiring quick attention' },
  { value: 'URGENT', label: 'Urgent', description: 'Critical issues preventing platform use' },
]

export default function NewTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'OTHER' as TicketCategory,
    priority: 'MEDIUM' as TicketPriority,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ticket')
      }

      const { ticket } = await response.json()
      toast.success('Support ticket created successfully')
      router.push(`/support/${ticket.id}`)
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Create Support Ticket</h1>
          <p className="text-muted-foreground mt-1">Tell us how we can help you</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: option.value as TicketCategory })}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.category === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <div>
                      <div className="font-semibold text-foreground">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Priority <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: option.value as TicketPriority })}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    formData.priority === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div className="font-semibold text-foreground text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief summary of your issue"
              maxLength={120}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {formData.subject.length}/120
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed information about your issue. Include any error messages, steps to reproduce, or relevant details..."
              rows={8}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
            <div className="text-xs text-muted-foreground mt-1">
              Be as specific as possible to help us resolve your issue faster
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-border rounded-lg hover:bg-card/80 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for faster resolution</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Include screenshots or error messages if applicable</li>
            <li>• Describe what you expected to happen vs. what actually happened</li>
            <li>• Mention your browser and device type for technical issues</li>
            <li>• For billing issues, include your transaction ID or date</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
