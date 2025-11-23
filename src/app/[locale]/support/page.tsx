'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Plus, Search, Filter, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type TicketCategory = 'BILLING' | 'TECHNICAL' | 'CONTENT' | 'SAFETY' | 'OTHER'

interface SupportTicket {
  id: string
  subject: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
  _count: {
    messages: number
  }
  assignedTo?: {
    name: string
    email: string
  }
}

const statusConfig = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  RESOLVED: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: XCircle },
}

const priorityConfig = {
  LOW: { label: 'Low', color: 'text-gray-600' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600' },
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

export default function SupportTicketsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | ''>('')

  useEffect(() => {
    if (session) {
      fetchTickets()
    }
  }, [session, statusFilter, categoryFilter])

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)

      const response = await fetch(`/api/support/tickets?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">Manage your support requests</p>
          </div>
          <button
            onClick={() => router.push('/support/new')}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | '')}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.emoji} {config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-12 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No tickets found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter || categoryFilter
                ? 'Try adjusting your filters'
                : 'Create your first support ticket to get help'}
            </p>
            {!searchQuery && !statusFilter && !categoryFilter && (
              <button
                onClick={() => router.push('/support/new')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const StatusIcon = statusConfig[ticket.status].icon
              return (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/support/${ticket.id}`)}
                  className="bg-card rounded-lg shadow hover:shadow-md transition-all cursor-pointer p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{ticket.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[ticket.status].color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[ticket.status].label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {categoryConfig[ticket.category].emoji}
                          {categoryConfig[ticket.category].label}
                        </span>
                        <span className={`font-medium ${priorityConfig[ticket.priority].color}`}>
                          {priorityConfig[ticket.priority].label} Priority
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {ticket._count.messages} {ticket._count.messages === 1 ? 'message' : 'messages'}
                        </span>
                      </div>

                      {ticket.assignedTo && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Assigned to: <span className="font-medium">{ticket.assignedTo.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      <div>Created {formatDate(ticket.createdAt)}</div>
                      {ticket.lastMessageAt && (
                        <div className="text-xs mt-1">Last message {formatDate(ticket.lastMessageAt)}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
