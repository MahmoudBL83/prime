'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { ArrowLeft, Send, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type TicketCategory = 'BILLING' | 'TECHNICAL' | 'CONTENT' | 'SAFETY' | 'OTHER'

interface Message {
  id: string
  content: string
  createdAt: string
  isStaff: boolean
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Ticket {
  id: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  assignedAgent: {
    id: string
    name: string | null
    email: string
  } | null
  messages: Message[]
}

const statusConfig = {
  OPEN: { label: 'Open', color: 'bg-green-100 text-green-800', icon: AlertCircle },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

const priorityConfig = {
  LOW: { label: 'Low', color: 'text-gray-600' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-600' },
  HIGH: { label: 'High', color: 'text-orange-600' },
  URGENT: { label: 'Urgent', color: 'text-red-600' },
}

const categoryConfig = {
  BILLING: { label: 'Billing', emoji: '💳' },
  TECHNICAL: { label: 'Technical', emoji: '🔧' },
  CONTENT: { label: 'Content', emoji: '📝' },
  SAFETY: { label: 'Safety', emoji: '🛡️' },
  OTHER: { label: 'Other', emoji: '❓' },
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    fetchTicket()
  }, [id])

  useEffect(() => {
    if (ticket?.messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ticket?.messages])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/support/tickets/${id}`)
      if (!response.ok) throw new Error('Failed to fetch ticket')
      const data = await response.json()
      setTicket(data)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSending(true)

    try {
      const response = await fetch(`/api/support/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const { message } = await response.json()
      setTicket((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        status: message.isStaff ? 'IN_PROGRESS' : prev.status === 'CLOSED' ? 'OPEN' : prev.status,
      } : null)
      setNewMessage('')
      toast.success('Message sent')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ticket not found</h2>
          <button
            onClick={() => router.push('/support')}
            className="text-blue-600 hover:underline"
          >
            Back to Support
          </button>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[ticket.status].icon

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/support')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Support
          </button>
          
          <div className="bg-card rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{categoryConfig[ticket.category].emoji}</span>
                  <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
                </div>
                <p className="text-muted-foreground">{ticket.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${statusConfig[ticket.status].color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig[ticket.status].label}
              </div>
              
              <div className={`font-semibold ${priorityConfig[ticket.priority].color}`}>
                {priorityConfig[ticket.priority].label} Priority
              </div>
              
              <div className="text-muted-foreground">
                Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </div>
              
              {ticket.assignedAgent && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  Assigned to {ticket.assignedAgent.name || ticket.assignedAgent.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="bg-card rounded-lg shadow mb-6">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Conversation</h2>
          </div>
          
          <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
            {ticket.messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isStaff ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.isStaff
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.author.image ? (
                      <img
                        src={message.author.image}
                        alt={message.author.name || 'User'}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <span className="font-semibold text-sm text-foreground">
                      {message.author.name || message.author.email}
                    </span>
                    {message.isStaff && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        Support Team
                      </span>
                    )}
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{message.content}</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Form */}
        {ticket.status !== 'CLOSED' && (
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Reply</h3>
            <form onSubmit={sendMessage}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                disabled={sending}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {ticket.status === 'CLOSED' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              This ticket has been closed. If you need further assistance, please create a new ticket.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
