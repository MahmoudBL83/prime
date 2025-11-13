'use client'

import React, { useState } from 'react'
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

const MOCK_TICKETS: Ticket[] = [
    {
        id: '1',
        ticketNumber: 'TKT-2024-0001',
        subject: 'Unable to access purchased course',
        category: 'technical',
        priority: 'urgent',
        status: 'open',
        user: {
            id: 'u1',
            name: 'Ahmed Hassan',
            email: 'ahmed.hassan@example.com',
            phone: '+20 100 123 4567',
            role: 'LEARNER'
        },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        messages: [
            {
                id: 'm1',
                content: 'I purchased the "Advanced Arabic Grammar" course yesterday but I cannot access it. The payment was successful but the course is not showing in my dashboard.',
                sender: 'user',
                senderName: 'Ahmed Hassan',
                createdAt: '2024-01-15T10:30:00Z'
            }
        ],
        slaBreached: true,
        responseTime: 6
    },
    {
        id: '2',
        ticketNumber: 'TKT-2024-0002',
        subject: 'Refund request for subscription',
        category: 'billing',
        priority: 'high',
        status: 'in_progress',
        user: {
            id: 'u2',
            name: 'Fatma Mohamed',
            email: 'fatma.m@example.com',
            role: 'LEARNER'
        },
        assignedTo: {
            id: 'a1',
            name: 'Support Team A'
        },
        createdAt: '2024-01-14T15:20:00Z',
        updatedAt: '2024-01-15T09:15:00Z',
        firstResponseAt: '2024-01-14T16:30:00Z',
        messages: [
            {
                id: 'm2',
                content: 'I would like to request a refund for my All-Access subscription. I subscribed by mistake.',
                sender: 'user',
                senderName: 'Fatma Mohamed',
                createdAt: '2024-01-14T15:20:00Z'
            },
            {
                id: 'm3',
                content: 'Hello Fatma, we\'ve received your refund request. Can you please confirm the subscription purchase date and the payment method used?',
                sender: 'admin',
                senderName: 'Support Team A',
                createdAt: '2024-01-14T16:30:00Z'
            },
            {
                id: 'm4',
                content: 'I purchased it on January 10th using my credit card ending in 4567.',
                sender: 'user',
                senderName: 'Fatma Mohamed',
                createdAt: '2024-01-15T09:00:00Z'
            }
        ],
        slaBreached: false,
        responseTime: 1.2
    },
    {
        id: '3',
        ticketNumber: 'TKT-2024-0003',
        subject: 'Creator payout not received',
        category: 'billing',
        priority: 'urgent',
        status: 'waiting',
        user: {
            id: 'u3',
            name: 'Dr. Khaled Ibrahim',
            email: 'khaled.ibrahim@example.com',
            phone: '+20 122 987 6543',
            role: 'CREATOR'
        },
        assignedTo: {
            id: 'a2',
            name: 'Finance Team'
        },
        createdAt: '2024-01-13T11:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
        firstResponseAt: '2024-01-13T14:20:00Z',
        messages: [
            {
                id: 'm5',
                content: 'I was supposed to receive my monthly creator payout on January 10th but I haven\'t received it yet. My earnings show E£3,450.',
                sender: 'user',
                senderName: 'Dr. Khaled Ibrahim',
                createdAt: '2024-01-13T11:00:00Z'
            },
            {
                id: 'm6',
                content: 'Hello Dr. Khaled, we\'re looking into this issue. Our finance team is reviewing your payout status.',
                sender: 'admin',
                senderName: 'Finance Team',
                createdAt: '2024-01-13T14:20:00Z'
            },
            {
                id: 'm7',
                content: 'We\'ve identified the issue - your bank details need verification. Please check your email for the verification form.',
                sender: 'admin',
                senderName: 'Finance Team',
                createdAt: '2024-01-15T08:00:00Z'
            }
        ],
        slaBreached: false,
        responseTime: 3.3
    },
    {
        id: '4',
        ticketNumber: 'TKT-2024-0004',
        subject: 'Email verification not working',
        category: 'account',
        priority: 'medium',
        status: 'resolved',
        user: {
            id: 'u4',
            name: 'Sara Ali',
            email: 'sara.ali@example.com',
            role: 'LEARNER'
        },
        assignedTo: {
            id: 'a3',
            name: 'Tech Support'
        },
        createdAt: '2024-01-12T09:30:00Z',
        updatedAt: '2024-01-12T15:45:00Z',
        firstResponseAt: '2024-01-12T10:15:00Z',
        resolvedAt: '2024-01-12T15:45:00Z',
        messages: [
            {
                id: 'm8',
                content: 'I\'m not receiving the email verification code. I\'ve tried multiple times.',
                sender: 'user',
                senderName: 'Sara Ali',
                createdAt: '2024-01-12T09:30:00Z'
            },
            {
                id: 'm9',
                content: 'Let me resend the verification code. Please check your spam folder as well.',
                sender: 'admin',
                senderName: 'Tech Support',
                createdAt: '2024-01-12T10:15:00Z'
            },
            {
                id: 'm10',
                content: 'Thank you! I found it in spam and verified successfully.',
                sender: 'user',
                senderName: 'Sara Ali',
                createdAt: '2024-01-12T15:45:00Z'
            }
        ],
        slaBreached: false,
        responseTime: 0.75
    },
    {
        id: '5',
        ticketNumber: 'TKT-2024-0005',
        subject: 'Inappropriate content reported',
        category: 'content',
        priority: 'high',
        status: 'in_progress',
        user: {
            id: 'u5',
            name: 'Omar Mahmoud',
            email: 'omar.m@example.com',
            role: 'LEARNER'
        },
        assignedTo: {
            id: 'a4',
            name: 'Content Moderation'
        },
        createdAt: '2024-01-15T07:00:00Z',
        updatedAt: '2024-01-15T08:30:00Z',
        firstResponseAt: '2024-01-15T07:45:00Z',
        messages: [
            {
                id: 'm11',
                content: 'I found some inappropriate content in Course ID: C-4567. The lesson contains material that violates community guidelines.',
                sender: 'user',
                senderName: 'Omar Mahmoud',
                createdAt: '2024-01-15T07:00:00Z'
            },
            {
                id: 'm12',
                content: 'Thank you for reporting this. Our content moderation team is reviewing the course now.',
                sender: 'admin',
                senderName: 'Content Moderation',
                createdAt: '2024-01-15T07:45:00Z'
            }
        ],
        slaBreached: false,
        responseTime: 0.75
    },
    {
        id: '6',
        ticketNumber: 'TKT-2024-0006',
        subject: 'Study buddy matching issue',
        category: 'technical',
        priority: 'low',
        status: 'open',
        user: {
            id: 'u6',
            name: 'Layla Youssef',
            email: 'layla.y@example.com',
            role: 'LEARNER'
        },
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        messages: [
            {
                id: 'm13',
                content: 'I\'ve been trying to find a study buddy for the Data Science course but the system keeps showing "no matches found".',
                sender: 'user',
                senderName: 'Layla Youssef',
                createdAt: '2024-01-15T12:00:00Z'
            }
        ],
        slaBreached: false,
        responseTime: 2
    }
]

const statusColors = {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    waiting: 'bg-purple-100 text-purple-800 border-purple-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-muted text-gray-800 border-border'
}

const priorityColors = {
    low: 'bg-muted text-gray-800 border-border',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-red-100 text-red-800 border-red-200'
}

const categoryIcons = {
    technical: Zap,
    billing: Tag,
    account: User,
    content: MessageCircle,
    other: MoreHorizontal
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [replyText, setReplyText] = useState('')

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        slaBreached: tickets.filter(t => t.slaBreached).length,
        avgResponseTime: 2.5
    }

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
        const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter
        return matchesSearch && matchesStatus && matchesPriority && matchesCategory
    })

    const handleSendReply = () => {
        if (!selectedTicket || !replyText.trim()) return

        const newMessage = {
            id: `m${Date.now()}`,
            content: replyText,
            sender: 'admin' as const,
            senderName: 'Admin Team',
            createdAt: new Date().toISOString()
        }

        const updatedTicket = {
            ...selectedTicket,
            messages: [...selectedTicket.messages, newMessage],
            status: 'in_progress' as const,
            updatedAt: new Date().toISOString(),
            firstResponseAt: selectedTicket.firstResponseAt || new Date().toISOString()
        }

        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t))
        setSelectedTicket(updatedTicket)
        setReplyText('')
    }

    const handleStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
        const updatedTickets = tickets.map(t => {
            if (t.id === ticketId) {
                const updates: Partial<Ticket> = {
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                }
                if (newStatus === 'resolved') {
                    updates.resolvedAt = new Date().toISOString()
                }
                return { ...t, ...updates }
            }
            return t
        })
        setTickets(updatedTickets)
        if (selectedTicket?.id === ticketId) {
            const updatedTicket = updatedTickets.find(t => t.id === ticketId)
            if (updatedTicket) setSelectedTicket(updatedTicket)
        }
    }

    const handleAssign = (ticketId: string, assigneeId: string, assigneeName: string) => {
        const updatedTickets = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    assignedTo: { id: assigneeId, name: assigneeName },
                    updatedAt: new Date().toISOString()
                }
            }
            return t
        })
        setTickets(updatedTickets)
        if (selectedTicket?.id === ticketId) {
            const updatedTicket = updatedTickets.find(t => t.id === ticketId)
            if (updatedTicket) setSelectedTicket(updatedTicket)
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
