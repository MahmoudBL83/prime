'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    MessageSquare,
    Search,
    Filter,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    User,
    Mail,
    Phone,
    Calendar,
    ArrowUpRight,
    Send,
    Paperclip,
    Eye,
    MessageCircle,
    Tag,
    TrendingUp,
    Users,
    Zap,
    MoreHorizontal,
    ChevronDown,
    AlertTriangle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'

interface Ticket {
    id: string
    ticketNumber: string
    subject: string
    category: 'technical' | 'billing' | 'account' | 'content' | 'other'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
    user: {
        id: string
        name: string
        email: string
        phone?: string
        role: 'LEARNER' | 'CREATOR' | 'ADMIN'
    }
    assignedTo?: {
        id: string
        name: string
    }
    createdAt: string
    updatedAt: string
    firstResponseAt?: string
    resolvedAt?: string
    messages: Array<{
        id: string
        content: string
        sender: 'user' | 'admin'
        senderName: string
        createdAt: string
        attachments?: string[]
    }>
    slaBreached: boolean
    responseTime?: number // in hours
}

const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    waiting: 'bg-purple-100 text-purple-800 border-purple-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    RESOLVED: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-muted text-gray-800 border-border',
    CLOSED: 'bg-muted text-gray-800 border-border'
}

const priorityColors: Record<string, string> = {
    low: 'bg-muted text-gray-800 border-border',
    LOW: 'bg-muted text-gray-800 border-border',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
    URGENT: 'bg-red-100 text-red-800 border-red-200'
}

const categoryIcons: Record<string, any> = {
    technical: Zap,
    TECHNICAL: Zap,
    billing: Tag,
    BILLING: Tag,
    account: User,
    ACCOUNT: User,
    content: MessageCircle,
    CONTENT: MessageCircle,
    other: MoreHorizontal,
    OTHER: MoreHorizontal
}

interface Stats {
    status: Record<string, number>
    priority: Record<string, number>
    slaBreached: number
    avgResponseTimeHours: number | null
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [apiStats, setApiStats] = useState<Stats | null>(null)
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [replyText, setReplyText] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('pageSize', '25')
            if (statusFilter !== 'all') params.set('status', statusFilter.toUpperCase())
            if (priorityFilter !== 'all') params.set('priority', priorityFilter.toUpperCase())
            if (categoryFilter !== 'all') params.set('category', categoryFilter.toUpperCase())
            if (searchTerm) params.set('search', searchTerm)

            const response = await fetch(`/api/admin/support?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch tickets')
            
            const data = await response.json()
            setTickets(data.tickets || [])
            setApiStats(data.stats || null)
            setTotalPages(Math.ceil((data.meta?.total || 0) / (data.meta?.pageSize || 25)))
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, priorityFilter, categoryFilter, searchTerm])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page !== 1) setPage(1)
            else fetchTickets()
        }, 400)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const stats = {
        total: apiStats ? Object.values(apiStats.status).reduce((a, b) => a + b, 0) : tickets.length,
        open: apiStats?.status?.OPEN || tickets.filter(t => t.status.toLowerCase() === 'open').length,
        inProgress: apiStats?.status?.IN_PROGRESS || tickets.filter(t => t.status.toLowerCase() === 'in_progress').length,
        slaBreached: apiStats?.slaBreached || tickets.filter(t => t.slaBreached).length,
        avgResponseTime: apiStats?.avgResponseTimeHours || 0
    }

    const filteredTickets = tickets

    const handleSendReply = async () => {
        if (!selectedTicket || !replyText.trim()) return

        try {
            const response = await fetch('/api/admin/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: selectedTicket.id,
                    action: 'reply',
                    message: replyText
                })
            })
            
            if (!response.ok) throw new Error('Failed to send reply')
            
            const data = await response.json()
            setTickets(tickets.map(t => t.id === selectedTicket.id ? data.ticket : t))
            setSelectedTicket(data.ticket)
            setReplyText('')
        } catch (err) {
            console.error('Failed to send reply:', err)
        }
    }

    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        try {
            const response = await fetch('/api/admin/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId,
                    action: 'status',
                    status: newStatus.toUpperCase()
                })
            })
            
            if (!response.ok) throw new Error('Failed to update status')
            
            const data = await response.json()
            setTickets(tickets.map(t => t.id === ticketId ? data.ticket : t))
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(data.ticket)
            }
        } catch (err) {
            console.error('Failed to update status:', err)
        }
    }

    const handleAssign = async (ticketId: string, assigneeId: string, assigneeName: string) => {
        try {
            const response = await fetch('/api/admin/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId,
                    action: 'assign',
                    assignedToId: assigneeId
                })
            })
            
            if (!response.ok) throw new Error('Failed to assign ticket')
            
            const data = await response.json()
            setTickets(tickets.map(t => t.id === ticketId ? data.ticket : t))
            if (selectedTicket?.id === ticketId) {
                setSelectedTicket(data.ticket)
            }
        } catch (err) {
            console.error('Failed to assign ticket:', err)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
        
        if (diffInHours < 1) return 'Just now'
        if (diffInHours < 24) return `${diffInHours}h ago`
        if (diffInHours < 48) return 'Yesterday'
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    }

    if (loading && tickets.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
                <div className="animate-pulse">
                    <div className="h-10 bg-white/5 rounded-lg w-1/3 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-xl h-28"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white/5 rounded-xl h-24"></div>
                            ))}
                        </div>
                        <div className="lg:col-span-2 bg-white/5 rounded-xl h-96"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
                <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6 backdrop-blur-xl">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="h-6 w-6 text-red-400" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Error loading tickets</h3>
                            <div className="text-sm text-red-300">{error}</div>
                            <Button 
                                onClick={() => fetchTickets()} 
                                className="mt-4 bg-red-600 hover:bg-red-700"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-foreground mb-2">Support Tickets</h1>
                        <p className="text-muted-foreground">Manage customer support requests and inquiries</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <MessageSquare className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Tickets</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <AlertCircle className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.open}</div>
                        <div className="text-sm text-muted-foreground">Open</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.inProgress}</div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.slaBreached}</div>
                        <div className="text-sm text-muted-foreground">SLA Breached</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-border">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">{stats.avgResponseTime}h</div>
                        <div className="text-sm text-muted-foreground">Avg Response</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets List */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Search and Filters */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-border">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-border rounded-lg text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Status</option>
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="waiting">Waiting</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Priority</option>
                                <option value="urgent">Urgent</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="technical">Technical</option>
                                <option value="billing">Billing</option>
                                <option value="account">Account</option>
                                <option value="content">Content</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    {/* Tickets List */}
                    <div className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                        {filteredTickets.map((ticket) => {
                            const CategoryIcon = categoryIcons[ticket.category]
                            return (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border cursor-pointer transition-all ${
                                        selectedTicket?.id === ticket.id
                                            ? 'border-purple-500 bg-white/20'
                                            : 'border-border hover:border-white/40'
                                    }`}
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                                        </div>
                                        {ticket.slaBreached && (
                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                        )}
                                    </div>

                                    <h3 className="text-foreground font-medium mb-2 line-clamp-2">{ticket.subject}</h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge className={`text-xs ${statusColors[ticket.status]}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </Badge>
                                        <Badge className={`text-xs ${priorityColors[ticket.priority]}`}>
                                            {ticket.priority}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{ticket.user.name}</span>
                                        </div>
                                        <span>{formatDate(ticket.createdAt)}</span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Ticket Details */}
                <div className="lg:col-span-2">
                    {selectedTicket ? (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-border h-full flex flex-col">
                            {/* Ticket Header */}
                            <div className="p-6 border-b border-border">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm text-muted-foreground">{selectedTicket.ticketNumber}</span>
                                            {selectedTicket.slaBreached && (
                                                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                                    SLA Breached
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="text-2xl font-bold text-foreground mb-3">{selectedTicket.subject}</h2>
                                        <div className="flex items-center gap-3">
                                            <Badge className={`${statusColors[selectedTicket.status]}`}>
                                                {selectedTicket.status.replace('_', ' ')}
                                            </Badge>
                                            <Badge className={`${priorityColors[selectedTicket.priority]}`}>
                                                {selectedTicket.priority}
                                            </Badge>
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                                {selectedTicket.category}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="bg-white/5 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Customer</span>
                                            </div>
                                            <p className="text-foreground font-medium">{selectedTicket.user.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedTicket.user.email}</p>
                                            {selectedTicket.user.phone && (
                                                <p className="text-sm text-muted-foreground">{selectedTicket.user.phone}</p>
                                            )}
                                            <Badge className="mt-2 bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                {selectedTicket.user.role}
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">Timeline</span>
                                            </div>
                                            <p className="text-sm text-foreground">Created: {formatDate(selectedTicket.createdAt)}</p>
                                            {selectedTicket.firstResponseAt && (
                                                <p className="text-sm text-foreground">First Response: {formatDate(selectedTicket.firstResponseAt)}</p>
                                            )}
                                            {selectedTicket.resolvedAt && (
                                                <p className="text-sm text-foreground">Resolved: {formatDate(selectedTicket.resolvedAt)}</p>
                                            )}
                                            {selectedTicket.responseTime && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    Response Time: {selectedTicket.responseTime}h
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedTicket.status}
                                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Ticket['status'])}
                                        className="px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="waiting">Waiting on Customer</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="closed">Closed</option>
                                    </select>

                                    <select
                                        value={selectedTicket.assignedTo?.id || ''}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            if (value) {
                                                const option = e.target.options[e.target.selectedIndex]
                                                handleAssign(selectedTicket.id, value, option.text)
                                            }
                                        }}
                                        className="px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Assign to...</option>
                                        <option value="a1">Support Team A</option>
                                        <option value="a2">Finance Team</option>
                                        <option value="a3">Tech Support</option>
                                        <option value="a4">Content Moderation</option>
                                    </select>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="ml-auto bg-purple-600 hover:bg-purple-700 text-foreground border-0"
                                        onClick={() => window.open(`/admin/users?id=${selectedTicket.user.id}`, '_blank')}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View User Profile
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {selectedTicket.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg p-4 ${
                                                message.sender === 'admin'
                                                    ? 'bg-purple-600 text-foreground'
                                                    : 'bg-white/10 text-foreground'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm">{message.senderName}</span>
                                                <span className="text-xs opacity-70">{formatDate(message.createdAt)}</span>
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Paperclip className="w-4 h-4" />
                                                    <span className="text-xs">{message.attachments.length} attachment(s)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Box */}
                            <div className="p-6 border-t border-border">
                                <div className="mb-3">
                                    <Textarea
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="min-h-[100px] bg-white/5 border-border text-foreground placeholder-gray-400 resize-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/5 hover:bg-white/10 text-foreground border-border"
                                    >
                                        <Paperclip className="w-4 h-4 mr-2" />
                                        Attach File
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700 text-foreground"
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim()}
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Reply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-border h-full flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-medium text-foreground mb-2">No Ticket Selected</h3>
                                <p className="text-muted-foreground">Select a ticket from the list to view details and respond</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
