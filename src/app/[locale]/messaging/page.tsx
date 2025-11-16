'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import {
    Search,
    Phone,
    Video,
    Info,
    MoreHorizontal,
    Send,
    Smile,
    Image as ImageIcon,
    Mic,
    ThumbsUp,
    Check,
    CheckCheck,
    Circle,
    Edit,
    Settings,
    Moon,
    Sun,
    ArrowLeft,
    MessageCircle,
    Camera,
    Gift,
    Sticker,
    Paperclip,
    MoreVertical,
    X,
    Plus,
    Play,
    Users,
    Flag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import VideoCallModal from '@/components/VideoCallModal'
import VoiceCallModal from '@/components/VoiceCallModal'
import ReportModal from '@/components/ReportModal'

interface Message {
    id: string
    content: string
    senderId: string
    senderName?: string
    senderImage?: string | null
    createdAt: Date
    read: boolean
    type: 'text' | 'image' | 'video' | 'audio' | 'file'
    replyTo?: string
    reactions?: { emoji: string; userId: string }[]
    fileUrl?: string
    fileName?: string
}

interface GroupMember {
    id: string
    name: string
    image: string | null
    role: 'admin' | 'member'
    isOnline: boolean
}

interface Conversation {
    id: string
    isGroup?: boolean
    groupName?: string
    groupImage?: string | null
    groupDescription?: string
    cohortId?: string
    members?: GroupMember[]
    admins?: string[]
    user: {
        id: string
        name: string
        image: string | null
        isOnline: boolean
        lastSeen?: Date
    }
    lastMessage?: {
        content: string
        createdAt: Date
        read: boolean
        senderId: string
    }
    unreadCount: number
}

export default function MessengerPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = (params.locale as string) || 'en'
    const isArabic = locale === 'ar'

    // State
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [messageInput, setMessageInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [showConversationList, setShowConversationList] = useState(true)
    const [isTyping, setIsTyping] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
    const [showMessageMenu, setShowMessageMenu] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [recording, setRecording] = useState(false)
    const [otherUserTyping, setOtherUserTyping] = useState(false)
    const [showEmojiPickerMain, setShowEmojiPickerMain] = useState(false)
    const [showNewMessageModal, setShowNewMessageModal] = useState(false)
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [searchUsers, setSearchUsers] = useState('')
    const [activeTab, setActiveTab] = useState<'inbox' | 'archived' | 'groups'>('inbox')
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
    const [showGroupInfoModal, setShowGroupInfoModal] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDescription, setNewGroupDescription] = useState('')
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([])
    const [cohorts, setCohorts] = useState<any[]>([])
    const [selectedCohort, setSelectedCohort] = useState<string | null>(null)
    const [showAddMembersModal, setShowAddMembersModal] = useState(false)
    const [groupMessages, setGroupMessages] = useState<{[key: string]: Message[]}>({})
    
    // Call modals state
    const [showVideoCallModal, setShowVideoCallModal] = useState(false)
    const [showVoiceCallModal, setShowVoiceCallModal] = useState(false)
    const [callSession, setCallSession] = useState<any>(null)
    
    // Report modal state
    const [showReportModal, setShowReportModal] = useState(false)
    const [reportTarget, setReportTarget] = useState<{ type: any; id: string; name: string } | null>(null)
    
    // Settings modal state
    const [showSettingsModal, setShowSettingsModal] = useState(false)
    
    // All users state for new message modal
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    
    // Group invite link state
    const [showInviteLinkModal, setShowInviteLinkModal] = useState(false)
    const [inviteLink, setInviteLink] = useState('')
    const [generatingLink, setGeneratingLink] = useState(false)
    
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Memoize mobile check
    const checkMobile = useCallback(() => {
        setIsMobile(window.innerWidth < 768)
    }, [])

    // Memoize scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        if (!session) {
            router.push(`/${locale}/login`)
            return
        }
        fetchConversations()
        fetchCohorts()
        checkMobile()
        window.addEventListener('resize', checkMobile)
        
        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement
                searchInput?.focus()
            }
            // Ctrl/Cmd + N for new message
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault()
                setShowNewMessageModal(true)
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                setShowNewMessageModal(false)
                setShowEmojiPickerMain(false)
                setShowInfo(false)
                setShowSettingsModal(false)
                setShowCreateGroupModal(false)
                setShowGroupInfoModal(false)
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('resize', checkMobile)
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [session, locale, router, checkMobile])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    const fetchCohorts = async () => {
        try {
            const response = await fetch('/api/cohorts/my-cohorts')
            if (response.ok) {
                const data = await response.json()
                setCohorts(data.cohorts || [])
            }
        } catch (error) {
            console.error('Failed to fetch cohorts:', error)
        }
    }

    const fetchAllUsers = async (searchQuery = '') => {
        setLoadingUsers(true)
        try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
            if (response.ok) {
                const users = await response.json()
                setAllUsers(users || [])
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoadingUsers(false)
        }
    }

    const fetchConversations = async () => {
        try {
            const response = await fetch('/api/messages/conversations')
            if (response.ok) {
                const data = await response.json()
                setConversations(data.conversations || [])
            } else {
                toast.error(isArabic ? 'فشل تحميل المحادثات' : 'Failed to load conversations')
            }
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
            toast.error(isArabic ? 'حدث خطأ في تحميل المحادثات' : 'Error loading conversations')
            setLoading(false)
        }
    }

    const fetchMessages = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/messages/${conversationId}`)
            if (response.ok) {
                const data = await response.json()
                setMessages(data.messages || [])
            } else {
                toast.error(isArabic ? 'فشل تحميل الرسائل' : 'Failed to load messages')
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
            toast.error(isArabic ? 'حدث خطأ في تحميل الرسائل' : 'Error loading messages')
        }
    }

    // Memoize conversation selection handler
    const handleSelectConversation = useCallback((conversation: Conversation) => {
        setSelectedConversation(conversation)
        fetchMessages(conversation.id)
        if (isMobile) {
            setShowConversationList(false)
        }
    }, [isMobile])

    // Memoize back to list handler
    const handleBackToList = useCallback(() => {
        setShowConversationList(true)
        setSelectedConversation(null)
    }, [])

    // Memoize send message handler
    const handleSendMessage = useCallback(async () => {
        if (!messageInput.trim() || !selectedConversation) return

        setSending(true)
        const tempContent = messageInput
        setMessageInput('')
        
        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: selectedConversation.id,
                    content: tempContent,
                    messageType: 'text',
                    replyToId: replyingTo?.id || null,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setMessages(prev => [...prev, data.message])
                setReplyingTo(null)
                
                // Update conversation last message
                setConversations(prev => prev.map(conv => 
                    conv.id === selectedConversation.id
                        ? { ...conv, lastMessage: { content: tempContent, createdAt: new Date(), read: false, senderId: session?.user?.id || 'me' } }
                        : conv
                ))
            } else {
                toast.error(isArabic ? 'فشل إرسال الرسالة' : 'Failed to send message')
                setMessageInput(tempContent) // Restore message on error
            }
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error(isArabic ? 'حدث خطأ في إرسال الرسالة' : 'Error sending message')
            setMessageInput(tempContent) // Restore message on error
        } finally {
            setSending(false)
        }
    }, [messageInput, selectedConversation, replyingTo, session?.user?.id, isArabic])

    // Memoize key press handler
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }, [handleSendMessage])

    // Typing indicator simulation
    useEffect(() => {
        if (!selectedConversation || !messageInput) return
        
        // Simulate other user typing after you type
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
        
        setOtherUserTyping(true)
        typingTimeoutRef.current = setTimeout(() => {
            setOtherUserTyping(false)
        }, 3000)

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current)
            }
        }
    }, [messageInput, selectedConversation])

    // Memoize reaction handler
    const handleReaction = useCallback(async (messageId: string, emoji: string) => {
        const userId = session?.user?.id
        if (!userId) return
        
        try {
            const response = await fetch('/api/messages/react', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, emoji }),
            })

            if (response.ok) {
                const data = await response.json()
                const currentUserId: string = userId
                
                setMessages(prev => prev.map(msg => {
                    if (msg.id === messageId) {
                        const reactions = msg.reactions || []
                        
                        if (data.action === 'removed') {
                            return {
                                ...msg,
                                reactions: reactions.filter(r => r.userId !== currentUserId)
                            }
                        } else if (data.action === 'updated') {
                            return {
                                ...msg,
                                reactions: reactions.map(r => 
                                    r.userId === currentUserId 
                                        ? { emoji: data.reaction.emoji as string, userId: currentUserId }
                                        : r
                                )
                            }
                        } else {
                            return {
                                ...msg,
                                reactions: [...reactions, { emoji: data.reaction.emoji as string, userId: currentUserId }]
                            }
                        }
                    }
                    return msg
                }))
            } else {
                toast.error(isArabic ? 'فشل في إضافة التفاعل' : 'Failed to add reaction')
            }
        } catch (error) {
            console.error('Error adding reaction:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
        setShowReactionPicker(null)
    }, [session?.user?.id, isArabic])

    // Memoize reply handler
    const handleReply = useCallback((message: Message) => {
        setReplyingTo(message)
        inputRef.current?.focus()
    }, [])

    // Memoize delete message handler
    const handleDeleteMessage = useCallback(async (messageId: string) => {
        try {
            const response = await fetch(`/api/messages/delete/${messageId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId))
                setShowMessageMenu(null)
                toast.success(isArabic ? 'تم حذف الرسالة' : 'Message deleted')
            } else {
                toast.error(isArabic ? 'فشل حذف الرسالة' : 'Failed to delete message')
            }
        } catch (error) {
            console.error('Error deleting message:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }, [isArabic])

    // Memoize forward message handler
    const handleForwardMessage = useCallback((messageId: string) => {
        toast.success('Forward feature coming soon')
        setShowMessageMenu(null)
    }, [])

    // Memoize copy message handler
    const handleCopyMessage = useCallback((message: Message) => {
        navigator.clipboard.writeText(message.content)
        toast.success('Message copied')
        setShowMessageMenu(null)
    }, [])

    // Memoize image upload handler
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const newMessage: Message = {
                    id: Date.now().toString(),
                    content: reader.result as string,
                    senderId: session?.user?.id || 'me',
                    createdAt: new Date(),
                    read: false,
                    type: 'image'
                }
                setMessages(prev => [...prev, newMessage])
            }
            reader.readAsDataURL(file)
        }
    }, [session?.user?.id])

    // Memoize voice record handler
    const handleVoiceRecord = useCallback(() => {
        setRecording(prev => !prev)
        if (!recording) {
            toast.success('Recording started')
        } else {
            toast.success('Voice message sent')
            const newMessage: Message = {
                id: Date.now().toString(),
                content: 'Voice message',
                senderId: session?.user?.id || 'me',
                createdAt: new Date(),
                read: false,
                type: 'audio'
            }
            setMessages(prev => [...prev, newMessage])
        }
    }, [recording, session?.user?.id])

    // Memoize quick reaction handler
    const handleQuickReaction = useCallback((messageId: string) => {
        handleReaction(messageId, '❤️')
    }, [handleReaction])

    // Memoize emojis array
    const emojis = useMemo(() => ['😀', '😂', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥳', '🥴', '🥺', '🤠', '🤡', '�', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'], [])

    // Memoize emoji select handler
    const handleEmojiSelect = useCallback((emoji: string) => {
        setMessageInput(prev => prev + emoji)
        setShowEmojiPickerMain(false)
        inputRef.current?.focus()
    }, [])

    // Memoize time formatting functions
    const formatTime = useCallback((date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / (3600000 * 24))

        if (hours < 1) {
            const mins = Math.floor(diff / 60000)
            return `${mins}m`
        } else if (hours < 24) {
            return `${hours}h`
        } else if (days < 7) {
            return `${days}d`
        } else {
            return date.toLocaleDateString()
        }
    }, [])

    const formatMessageTime = useCallback((date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }, [])

    // Memoize create group handler
    const handleCreateGroup = useCallback(async () => {
        if (!newGroupName.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال اسم المجموعة' : 'Please enter group name')
            return
        }

        try {
            const response = await fetch('/api/groups/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newGroupName,
                    description: newGroupDescription,
                    members: selectedGroupMembers,
                    cohortId: selectedCohort
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(isArabic ? 'تم إنشاء المجموعة!' : 'Group created!')
                fetchConversations()
                setShowCreateGroupModal(false)
                setNewGroupName('')
                setNewGroupDescription('')
                setSelectedGroupMembers([])
                setSelectedCohort(null)
            } else {
                // Create demo group
                const cohort = selectedCohort ? cohorts.find(c => c.id === selectedCohort) : null
                const members = cohort?.students || []
                
                const newGroup: Conversation = {
                    id: `group${Date.now()}`,
                    isGroup: true,
                    groupName: newGroupName,
                    groupDescription: newGroupDescription,
                    cohortId: selectedCohort || undefined,
                    members: members.map((student: any) => ({
                        id: student.id,
                        name: student.name,
                        image: student.image,
                        role: 'member' as const,
                        isOnline: false
                    })),
                    admins: [session?.user?.id || ''],
                    user: {
                        id: `group${Date.now()}`,
                        name: newGroupName,
                        image: null,
                        isOnline: true
                    },
                    unreadCount: 0
                }
                
                setConversations(prev => [newGroup, ...prev])
                toast.success(isArabic ? 'تم إنشاء المجموعة!' : 'Group created!')
                setShowCreateGroupModal(false)
                setNewGroupName('')
                setNewGroupDescription('')
                setSelectedGroupMembers([])
                setSelectedCohort(null)
            }
        } catch (error) {
            console.error('Failed to create group:', error)
            toast.error(isArabic ? 'فشل إنشاء المجموعة' : 'Failed to create group')
        }
    }, [newGroupName, newGroupDescription, selectedGroupMembers, selectedCohort, cohorts, session?.user?.id, isArabic])

    // Memoize leave group handler
    const handleLeaveGroup = useCallback(async (groupId: string) => {
        if (!window.confirm(isArabic ? 'هل تريد مغادرة المجموعة؟' : 'Leave this group?')) return

        try {
            const response = await fetch(`/api/groups/${groupId}/leave`, {
                method: 'POST'
            })

            if (response.ok) {
                setConversations(prev => prev.filter(conv => conv.id !== groupId))
                setSelectedConversation(null)
                toast.success(isArabic ? 'تم مغادرة المجموعة' : 'Left the group')
            }
        } catch (error) {
            console.error('Failed to leave group:', error)
            toast.error(isArabic ? 'فشل مغادرة المجموعة' : 'Failed to leave group')
        }
    }, [isArabic])

    // Handle initiating video call
    const handleInitiateVideoCall = useCallback(async () => {
        if (!selectedConversation || selectedConversation.isGroup) return

        try {
            const response = await fetch('/api/calls/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteeId: selectedConversation.user.id,
                    title: `Video call with ${selectedConversation.user.name}`,
                    callType: 'video',
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setCallSession(data.session)
                setShowVideoCallModal(true)
            } else {
                toast.error(isArabic ? 'فشل بدء مكالمة الفيديو' : 'Failed to start video call')
            }
        } catch (error) {
            console.error('Error initiating video call:', error)
            toast.error(isArabic ? 'حدث خطأ في بدء مكالمة الفيديو' : 'Error starting video call')
        }
    }, [selectedConversation, isArabic])

    // Handle initiating voice call
    const handleInitiateVoiceCall = useCallback(async () => {
        if (!selectedConversation || selectedConversation.isGroup) return

        try {
            const response = await fetch('/api/calls/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviteeId: selectedConversation.user.id,
                    title: `Voice call with ${selectedConversation.user.name}`,
                    callType: 'voice',
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setCallSession(data.session)
                setShowVoiceCallModal(true)
            } else {
                toast.error(isArabic ? 'فشل بدء المكالمة الصوتية' : 'Failed to start voice call')
            }
        } catch (error) {
            console.error('Error initiating voice call:', error)
            toast.error(isArabic ? 'حدث خطأ في بدء المكالمة الصوتية' : 'Error starting voice call')
        }
    }, [selectedConversation, isArabic])

    // Handle report
    const handleOpenReportModal = useCallback((type: any, targetId: string, targetName: string) => {
        setReportTarget({ type, id: targetId, name: targetName })
        setShowReportModal(true)
    }, [])

    // Handle generate invite link
    const handleGenerateInviteLink = useCallback(async () => {
        if (!selectedConversation?.isGroup) return
        
        setGeneratingLink(true)
        try {
            const response = await fetch('/api/groups/invite-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groupId: selectedConversation.id })
            })

            if (response.ok) {
                const data = await response.json()
                const fullLink = `${window.location.origin}/${locale}/join-group/${data.inviteCode}`
                setInviteLink(fullLink)
                setShowInviteLinkModal(true)
                toast.success(isArabic ? 'تم إنشاء رابط الدعوة!' : 'Invite link generated!')
            } else {
                // Generate a temporary invite link for demo
                const inviteCode = Math.random().toString(36).substring(2, 15)
                const fullLink = `${window.location.origin}/${locale}/join-group/${inviteCode}`
                setInviteLink(fullLink)
                setShowInviteLinkModal(true)
                toast.success(isArabic ? 'تم إنشاء رابط الدعوة!' : 'Invite link generated!')
            }
        } catch (error) {
            console.error('Error generating invite link:', error)
            // Generate a temporary invite link for demo
            const inviteCode = Math.random().toString(36).substring(2, 15)
            const fullLink = `${window.location.origin}/${locale}/join-group/${inviteCode}`
            setInviteLink(fullLink)
            setShowInviteLinkModal(true)
            toast.success(isArabic ? 'تم إنشاء رابط الدعوة!' : 'Invite link generated!')
        } finally {
            setGeneratingLink(false)
        }
    }, [selectedConversation, locale, isArabic])

    // Handle copy invite link
    const handleCopyInviteLink = useCallback(() => {
        navigator.clipboard.writeText(inviteLink)
        toast.success(isArabic ? 'تم نسخ الرابط!' : 'Link copied!')
    }, [inviteLink, isArabic])

    // Handle share invite link
    const handleShareInviteLink = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: isArabic ? 'انضم إلى المجموعة' : 'Join Group',
                    text: isArabic ? `انضم إلى ${selectedConversation?.groupName}` : `Join ${selectedConversation?.groupName}`,
                    url: inviteLink
                })
            } catch (error) {
                console.error('Error sharing:', error)
            }
        } else {
            handleCopyInviteLink()
        }
    }, [inviteLink, selectedConversation, isArabic, handleCopyInviteLink])

    // Memoized filtered conversations
    const filteredConversations = useMemo(() => {
        let filtered = conversations

        if (activeTab === 'groups') {
            filtered = conversations.filter(conv => conv.isGroup)
        } else if (activeTab === 'inbox') {
            filtered = conversations.filter(conv => !conv.isGroup)
        }

        return filtered.filter(conv =>
            conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (conv.isGroup && conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    }, [conversations, searchQuery, activeTab])

    if (!session) return null

    return (
        <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`} style={{ height: '100vh', position: 'fixed', inset: 0 }}>
            {/* Left Sidebar - Conversations List */}
            <div className={`${isMobile && !showConversationList ? 'hidden' : 'flex'} w-full md:w-[360px] flex-col border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            title={isArabic ? 'رجوع' : 'Go back'}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {isArabic ? 'المحادثات' : 'Chats'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            title={isDarkMode ? (isArabic ? 'الوضع الفاتح' : 'Light mode') : (isArabic ? 'الوضع الداكن' : 'Dark mode')}
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={() => setShowSettingsModal(true)}
                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            title={isArabic ? 'الإعدادات' : 'Settings'}
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setShowNewMessageModal(true)}
                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            title={isArabic ? 'رسالة جديدة' : 'New message'}
                        >
                            <Edit className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className={`relative rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <input
                            type="text"
                            placeholder={isArabic ? 'بحث في المحادثات...' : 'Search Messenger'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full py-2 px-10 rounded-full outline-none ${isDarkMode ? 'bg-gray-800 text-white placeholder:text-gray-400' : 'bg-gray-100 text-gray-900 placeholder:text-gray-500'}`}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-2 px-3 pb-2 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`flex-1 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                            activeTab === 'inbox'
                                ? 'bg-blue-500 text-white'
                                : isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {isArabic ? 'الوارد' : 'Inbox'}
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`flex-1 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                            activeTab === 'groups'
                                ? 'bg-blue-500 text-white'
                                : isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {isArabic ? 'المجموعات' : 'Groups'}
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`flex-1 px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                            activeTab === 'archived'
                                ? 'bg-blue-500 text-white'
                                : isDarkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {isArabic ? 'المؤرشف' : 'Archived'}
                    </button>
                </div>

                {/* Create Group Button */}
                {activeTab === 'groups' && (
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {isArabic ? 'إنشاء مجموعة جديدة' : 'Create New Group'}
                        </button>
                    </div>
                )}

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className={`text-center py-12 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                            <p className="font-semibold mb-1">
                                {isArabic ? 'لا توجد محادثات' : 'No conversations'}
                            </p>
                            <p className="text-sm">
                                {isArabic ? 'ابدأ محادثة جديدة' : 'Start a new conversation'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filteredConversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    onClick={() => handleSelectConversation(conversation)}
                                    className={`w-full p-3 flex items-center gap-3 transition-colors ${
                                        selectedConversation?.id === conversation.id
                                            ? isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                            : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {conversation.isGroup ? (
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                                                <Users className="w-7 h-7" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                                                {conversation.user.image ? (
                                                    <Image
                                                        src={conversation.user.image}
                                                        alt={conversation.user.name}
                                                        width={56}
                                                        height={56}
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-lg font-semibold">
                                                        {conversation.user.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {!conversation.isGroup && conversation.user.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <h3 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {conversation.isGroup ? conversation.groupName : conversation.user.name}
                                                </h3>
                                                {conversation.isGroup && (
                                                    <span className="flex-shrink-0 bg-blue-500/20 text-blue-500 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                        {conversation.members?.length || 0}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-xs flex-shrink-0 ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                                            </span>
                                        </div>
                                        {conversation.lastMessage && (
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm truncate ${
                                                    conversation.unreadCount > 0
                                                        ? isDarkMode ? 'text-white font-semibold' : 'text-gray-900 font-semibold'
                                                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                }`}>
                                                    {conversation.lastMessage.senderId === session.user?.id && (
                                                        <span className="mr-1">
                                                            {conversation.lastMessage.read ? (
                                                                <CheckCheck className="inline w-3 h-3 text-blue-500" />
                                                            ) : (
                                                                <Check className="inline w-3 h-3" />
                                                            )}
                                                        </span>
                                                    )}
                                                    {conversation.lastMessage.content}
                                                </p>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="flex-shrink-0 ml-2 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                        {conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`${isMobile && showConversationList ? 'hidden' : 'flex'} flex-1 flex flex-col`}>
                {!selectedConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <MessageCircle className="w-20 h-20 mx-auto mb-4 opacity-50" />
                            <h2 className="text-xl font-semibold mb-2">
                                {isArabic ? 'اختر محادثة' : 'Select a conversation'}
                            </h2>
                            <p className="text-sm">
                                {isArabic ? 'اختر محادثة من القائمة لبدء المراسلة' : 'Choose a conversation from the list to start messaging'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                                {isMobile && (
                                    <button
                                        onClick={handleBackToList}
                                        className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                )}
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                        {selectedConversation.user.image ? (
                                            <Image
                                                src={selectedConversation.user.image}
                                                alt={selectedConversation.user.name}
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold">
                                                {selectedConversation.user.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    {selectedConversation.user.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {selectedConversation.isGroup ? selectedConversation.groupName : selectedConversation.user.name}
                                        </h2>
                                        {selectedConversation.isGroup && (
                                            <Users className="w-4 h-4 text-blue-500" />
                                        )}
                                    </div>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {selectedConversation.isGroup
                                            ? `${selectedConversation.members?.length || 0} ${isArabic ? 'أعضاء' : 'members'}`
                                            : selectedConversation.user.isOnline
                                            ? isArabic ? 'متصل الآن' : 'Active now'
                                            : isArabic ? `آخر ظهور ${formatTime(selectedConversation.user.lastSeen!)}` : `Active ${formatTime(selectedConversation.user.lastSeen!)} ago`
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!selectedConversation.isGroup && (
                                    <>
                                        <button 
                                            onClick={handleInitiateVoiceCall}
                                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                            title={isArabic ? 'مكالمة صوتية' : 'Voice call'}
                                        >
                                            <Phone className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={handleInitiateVideoCall}
                                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                            title={isArabic ? 'مكالمة فيديو' : 'Video call'}
                                        >
                                            <Video className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => selectedConversation.isGroup ? setShowGroupInfoModal(true) : setShowInfo(!showInfo)}
                                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                    title={isArabic ? 'معلومات' : 'Info'}
                                >
                                    <Info className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className={`flex-1 overflow-y-auto p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                            <div className="space-y-2">
                                {messages.map((message, index) => {
                                    const isOwnMessage = message.senderId === session.user?.id
                                    const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId
                                    const showTime = index === messages.length - 1 || messages[index + 1]?.senderId !== message.senderId

                                    return (
                                        <motion.div
                                            key={message.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} group/message`}
                                            onMouseEnter={() => setHoveredMessage(message.id)}
                                            onMouseLeave={() => setHoveredMessage(null)}
                                        >
                                            {!isOwnMessage && showAvatar && (
                                                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                    {selectedConversation.user.image ? (
                                                        <Image
                                                            src={selectedConversation.user.image}
                                                            alt={selectedConversation.user.name}
                                                            width={28}
                                                            height={28}
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-semibold">
                                                            {selectedConversation.user.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!isOwnMessage && !showAvatar && <div className="w-7" />}

                                            {/* Message Actions - Left side for own messages */}
                                            {isOwnMessage && hoveredMessage === message.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center gap-1 mb-2"
                                                >
                                                    <button
                                                        onClick={() => setShowReactionPicker(message.id)}
                                                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        title="React"
                                                    >
                                                        <Smile className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowMessageMenu(message.id)}
                                                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        title="More"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </motion.div>
                                            )}

                                            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%] relative`}>
                                                {/* Reply indicator */}
                                                {message.replyTo && (
                                                    <div className={`text-xs px-3 py-1 mb-1 rounded-lg ${
                                                        isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        <span className="flex items-center gap-1">
                                                            <ArrowLeft className="w-3 h-3" />
                                                            Replying to a message
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="relative">
                                                    {/* Image Message */}
                                                    {message.type === 'image' ? (
                                                        <div className="rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-shadow" onClick={() => setSelectedImage(message.content)}>
                                                            <img src={message.content} alt="Shared image" className="max-w-xs max-h-96 object-cover" />
                                                        </div>
                                                    ) : message.type === 'audio' ? (
                                                        <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm ${
                                                            isOwnMessage ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                                                        }`}>
                                                            <button className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                                                <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                                                            </button>
                                                            <div className="flex-1">
                                                                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                                                                    <div className="h-full w-2/3 bg-white/60 rounded-full"></div>
                                                                </div>
                                                            </div>
                                                            <span className="text-xs font-medium">0:15</span>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                                                isOwnMessage
                                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                                    : isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'
                                                            }`}
                                                        >
                                                            <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                                                        </div>
                                                    )}

                                                    {/* Reactions Display */}
                                                    {message.reactions && message.reactions.length > 0 && (
                                                        <div className={`absolute -bottom-2 ${isOwnMessage ? 'right-2' : 'left-2'} flex gap-1`}>
                                                            {Array.from(new Set(message.reactions.map(r => r.emoji))).map(emoji => {
                                                                const count = message.reactions!.filter(r => r.emoji === emoji).length
                                                                return (
                                                                    <div
                                                                        key={emoji}
                                                                        className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs ${
                                                                            isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-300 shadow-sm'
                                                                        }`}
                                                                    >
                                                                        <span>{emoji}</span>
                                                                        {count > 1 && <span className="text-[10px]">{count}</span>}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}

                                                    {/* Reaction Picker */}
                                                    {showReactionPicker === message.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-full mt-2 flex gap-1 p-2 rounded-full shadow-lg z-50 ${
                                                                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                                            }`}
                                                        >
                                                            {['❤️', '😂', '😮', '😢', '👍', '👎'].map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => handleReaction(message.id, emoji)}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-125"
                                                                >
                                                                    <span className="text-lg">{emoji}</span>
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}

                                                    {/* Message Menu */}
                                                    {showMessageMenu === message.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.8 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-full mt-2 w-48 rounded-lg shadow-xl z-50 overflow-hidden ${
                                                                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                                                            }`}
                                                        >
                                                            <button
                                                                onClick={() => handleReply(message)}
                                                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                                }`}
                                                            >
                                                                <ArrowLeft className="w-4 h-4" />
                                                                Reply
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopyMessage(message)}
                                                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                                }`}
                                                            >
                                                                <ArrowLeft className="w-4 h-4 rotate-180" />
                                                                Copy
                                                            </button>
                                                            <button
                                                                onClick={() => handleForwardMessage(message.id)}
                                                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                                                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                                                                }`}
                                                            >
                                                                <ArrowLeft className="w-4 h-4 -rotate-45" />
                                                                {isArabic ? 'إعادة توجيه' : 'Forward'}
                                                            </button>
                                                            {!isOwnMessage && (
                                                                <button
                                                                    onClick={() => {
                                                                        setShowMessageMenu(null)
                                                                        handleOpenReportModal('MESSAGE', message.id, `Message from ${message.senderName || selectedConversation.user.name}`)
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
                                                                >
                                                                    <Flag className="w-4 h-4" />
                                                                    {isArabic ? 'إبلاغ' : 'Report'}
                                                                </button>
                                                            )}
                                                            {isOwnMessage && (
                                                                <button
                                                                    onClick={() => handleDeleteMessage(message.id)}
                                                                    className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    {isArabic ? 'حذف' : 'Delete'}
                                                                </button>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {showTime && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                            {formatMessageTime(message.createdAt)}
                                                        </span>
                                                        {isOwnMessage && (
                                                            <span className="flex items-center">
                                                                {message.read ? (
                                                                    <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                                                ) : (
                                                                    <Check className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Message Actions - Right side for other messages */}
                                            {!isOwnMessage && hoveredMessage === message.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center gap-1 mb-2"
                                                >
                                                    <button
                                                        onClick={() => setShowReactionPicker(message.id)}
                                                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        title="React"
                                                    >
                                                        <Smile className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                    <button
                                                        onClick={() => setShowMessageMenu(message.id)}
                                                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        title="More"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Typing Indicator */}
                            {otherUserTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-end gap-2 mt-2"
                                >
                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {selectedConversation.user.image ? (
                                            <Image
                                                src={selectedConversation.user.image}
                                                alt={selectedConversation.user.name}
                                                width={28}
                                                height={28}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-semibold">
                                                {selectedConversation.user.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`px-4 py-3 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        <div className="flex gap-1">
                                            <motion.div
                                                className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                            />
                                            <motion.div
                                                className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                            />
                                            <motion.div
                                                className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                            {/* Reply Preview */}
                            {replyingTo && (
                                <div className={`mb-2 p-3 rounded-lg flex items-center justify-between ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Replying to {replyingTo.senderId === session.user?.id ? 'yourself' : selectedConversation.user.name}
                                        </p>
                                        <p className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {replyingTo.content}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className={`flex items-end gap-2 rounded-full px-4 py-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                                <button className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                    title="Attach image"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                    title="Choose a sticker"
                                >
                                    <Sticker className="w-5 h-5" />
                                </button>
                                <button 
                                    className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                    title="Send a gift"
                                >
                                    <Gift className="w-5 h-5" />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={isArabic ? 'اكتب رسالة...' : 'Aa'}
                                    className={`flex-1 bg-transparent outline-none ${isDarkMode ? 'text-white placeholder:text-gray-400' : 'text-gray-900 placeholder:text-gray-500'}`}
                                />
                                <button 
                                    onClick={() => setShowEmojiPickerMain(!showEmojiPickerMain)}
                                    className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                    title="Choose an emoji"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                                {recording ? (
                                    <button
                                        onClick={handleVoiceRecord}
                                        className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white animate-pulse"
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>
                                ) : messageInput.trim() ? (
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sending}
                                        className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors text-white disabled:opacity-50"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleVoiceRecord}
                                        className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                    >
                                        <Mic className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Right Sidebar - Info Panel */}
            <AnimatePresence>
                {showInfo && selectedConversation && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        className={`w-80 border-l ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} p-4 overflow-y-auto`}
                    >
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mx-auto mb-3">
                                {selectedConversation.user.image ? (
                                    <Image
                                        src={selectedConversation.user.image}
                                        alt={selectedConversation.user.name}
                                        width={80}
                                        height={80}
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-2xl font-semibold">
                                        {selectedConversation.user.name[0]}
                                    </div>
                                )}
                            </div>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {selectedConversation.user.name}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {selectedConversation.user.isOnline ? (isArabic ? 'متصل الآن' : 'Active now') : (isArabic ? 'غير متصل' : 'Offline')}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button className={`w-full p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                                <Phone className={`w-5 h-5 mx-auto mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'مكالمة صوتية' : 'Audio Call'}
                                </span>
                            </button>
                            <button className={`w-full p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                                <Video className={`w-5 h-5 mx-auto mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'مكالمة فيديو' : 'Video Call'}
                                </span>
                            </button>
                        </div>

                        {/* Group Actions */}
                        {selectedConversation.isGroup && (
                            <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'إجراءات المجموعة' : 'Group Actions'}
                                </h4>
                                <div className="space-y-2">
                                    <button 
                                        onClick={handleGenerateInviteLink}
                                        disabled={generatingLink}
                                        className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                                            isDarkMode ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                                        } ${generatingLink ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Users className="w-5 h-5" />
                                        <div className="flex-1">
                                            <div className="font-semibold">
                                                {isArabic ? 'دعوة أعضاء' : 'Invite Members'}
                                            </div>
                                            <div className="text-xs opacity-80">
                                                {isArabic ? 'مشاركة رابط الانضمام' : 'Share join link'}
                                            </div>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => setShowAddMembersModal(true)}
                                        className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        {isArabic ? 'إضافة أعضاء' : 'Add members'}
                                    </button>
                                    <button className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {isArabic ? 'عرض الأعضاء' : 'View members'} ({selectedConversation.members?.length || 0})
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                            <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {isArabic ? 'الإعدادات' : 'Settings'}
                            </h4>
                            <div className="space-y-2">
                                <button className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isArabic ? 'كتم الإشعارات' : 'Mute notifications'}
                                </button>
                                <button className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {isArabic ? 'البحث في المحادثة' : 'Search in conversation'}
                                </button>
                                {!selectedConversation.isGroup && (
                                    <button className={`w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {isArabic ? 'عرض الملف الشخصي' : 'View profile'}
                                    </button>
                                )}
                                <button 
                                    onClick={() => {
                                        setShowInfo(false)
                                        handleOpenReportModal(
                                            selectedConversation.isGroup ? 'GROUP' : 'USER',
                                            selectedConversation.isGroup ? selectedConversation.id : selectedConversation.user.id,
                                            selectedConversation.isGroup ? selectedConversation.groupName! : selectedConversation.user.name
                                        )
                                    }}
                                    className={`w-full text-left p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 flex items-center gap-2`}
                                >
                                    <Flag className="w-4 h-4" />
                                    {isArabic ? 'إبلاغ' : 'Report'}
                                </button>
                                {selectedConversation.isGroup && (
                                    <button 
                                        onClick={() => handleLeaveGroup(selectedConversation.id)}
                                        className={`w-full text-left p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 flex items-center gap-2`}
                                    >
                                        <X className="w-4 h-4" />
                                        {isArabic ? 'مغادرة المجموعة' : 'Leave group'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Viewer Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            src={selectedImage}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emoji Picker for Input */}
            <AnimatePresence>
                {showEmojiPickerMain && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowEmojiPickerMain(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className={`fixed bottom-24 right-8 w-80 p-4 rounded-2xl shadow-2xl z-50 ${
                                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}
                        >
                            <div className="mb-3">
                                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'اختر إيموجي' : 'Choose an emoji'}
                                </h3>
                            </div>
                            <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
                                {emojis.map((emoji, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className={`text-2xl p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-125`}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* New Message Modal */}
            <AnimatePresence>
                {showNewMessageModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setShowNewMessageModal(false)
                            setSearchUsers('')
                            setAllUsers([])
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            onAnimationComplete={() => {
                                // Fetch users when modal opens
                                if (showNewMessageModal && allUsers.length === 0) {
                                    fetchAllUsers()
                                }
                            }}
                            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                                isDarkMode ? 'bg-gray-900' : 'bg-white'
                            }`}
                        >
                            {/* Modal Header */}
                            <div className={`flex items-center justify-between p-4 border-b ${
                                isDarkMode ? 'border-gray-800' : 'border-gray-200'
                            }`}>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'رسالة جديدة' : 'New Message'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowNewMessageModal(false)
                                        setSearchUsers('')
                                        setAllUsers([])
                                    }}
                                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                                >
                                    <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                            </div>

                            {/* Search Users */}
                            <div className="p-4">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {isArabic ? 'إلى:' : 'To:'}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder={isArabic ? 'اكتب اسم...' : 'Type a name...'}
                                        value={searchUsers}
                                        onChange={(e) => {
                                            setSearchUsers(e.target.value)
                                            // Debounce search
                                            const timer = setTimeout(() => {
                                                fetchAllUsers(e.target.value)
                                            }, 300)
                                            return () => clearTimeout(timer)
                                        }}
                                        className={`flex-1 bg-transparent outline-none ${
                                            isDarkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'
                                        }`}
                                    />
                                </div>
                            </div>

                            {/* User List */}
                            <div className="max-h-96 overflow-y-auto">
                                {loadingUsers ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : allUsers.length === 0 ? (
                                    <div className={`text-center py-12 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">
                                            {isArabic ? 'لا يوجد مستخدمين' : 'No users found'}
                                        </p>
                                    </div>
                                ) : (
                                    allUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={async () => {
                                                // Check if conversation already exists
                                                const existingConv = conversations.find(
                                                    conv => !conv.isGroup && conv.user.id === user.id
                                                )
                                                
                                                if (existingConv) {
                                                    handleSelectConversation(existingConv)
                                                } else {
                                                    // Create new conversation locally
                                                    const newConv: Conversation = {
                                                        id: `temp-${user.id}`,
                                                        user: {
                                                            id: user.id,
                                                            name: user.name || user.email,
                                                            image: user.profileImage || null,
                                                            isOnline: false
                                                        },
                                                        unreadCount: 0
                                                    }
                                                    setConversations(prev => [newConv, ...prev])
                                                    setSelectedConversation(newConv)
                                                    setMessages([])
                                                }
                                                
                                                setShowNewMessageModal(false)
                                                setSearchUsers('')
                                                setAllUsers([])
                                            }}
                                            className={`w-full p-3 flex items-center gap-3 transition-colors ${
                                                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                                    {user.profileImage ? (
                                                        <Image
                                                            src={user.profileImage}
                                                            alt={user.name || user.email}
                                                            width={48}
                                                            height={48}
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold">
                                                            {(user.name || user.email)[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 text-left">
                                                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {user.name || user.email}
                                                </h3>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {user.role === 'CREATOR' ? (isArabic ? 'منشئ محتوى' : 'Creator') : 
                                                     user.role === 'LEARNER' ? (isArabic ? 'متعلم' : 'Learner') : 
                                                     user.email}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Group Info Modal */}
            <AnimatePresence>
                {showGroupInfoModal && selectedConversation?.isGroup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowGroupInfoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                                isDarkMode ? 'bg-gray-900' : 'bg-white'
                            }`}
                        >
                            {/* Modal Header */}
                            <div className={`flex items-center justify-between p-4 border-b ${
                                isDarkMode ? 'border-gray-800' : 'border-gray-200'
                            }`}>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'معلومات المجموعة' : 'Group Info'}
                                </h2>
                                <button
                                    onClick={() => setShowGroupInfoModal(false)}
                                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                                >
                                    <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                            </div>

                            {/* Group Info Content */}
                            <div className="p-4 max-h-[600px] overflow-y-auto">
                                {/* Group Header */}
                                <div className="text-center mb-6">
                                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                        <Users className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedConversation.groupName}
                                    </h3>
                                    {selectedConversation.groupDescription && (
                                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {selectedConversation.groupDescription}
                                        </p>
                                    )}
                                    {selectedConversation.cohortId && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-xs font-semibold">
                                                <Video className="w-3 h-3" />
                                                {isArabic ? 'مجموعة دراسية' : 'Cohort Group'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Members List */}
                                <div className="mb-6">
                                    <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {isArabic ? 'الأعضاء' : 'Members'} ({selectedConversation.members?.length || 0})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedConversation.members?.map((member) => (
                                            <div key={member.id} className={`flex items-center justify-between p-2 rounded-lg ${
                                                isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                                            }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                                                            {member.image ? (
                                                                <Image src={member.image} alt={member.name} width={40} height={40} className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-sm font-semibold">
                                                                    {member.name[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {member.isOnline && (
                                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {member.name}
                                                            {member.id === session?.user?.id && (
                                                                <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                    ({isArabic ? 'أنت' : 'You'})
                                                                </span>
                                                            )}
                                                        </p>
                                                        {member.role === 'admin' && (
                                                            <span className="text-xs text-blue-500 font-semibold">
                                                                {isArabic ? 'مشرف' : 'Admin'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => {
                                            setShowGroupInfoModal(false)
                                            handleLeaveGroup(selectedConversation.id)
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        {isArabic ? 'مغادرة المجموعة' : 'Leave Group'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Group Modal */}
            <AnimatePresence>
                {showCreateGroupModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowCreateGroupModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
                                isDarkMode ? 'bg-gray-900' : 'bg-white'
                            }`}
                        >
                            {/* Modal Header */}
                            <div className={`flex items-center justify-between p-4 border-b ${
                                isDarkMode ? 'border-gray-800' : 'border-gray-200'
                            }`}>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'إنشاء مجموعة جديدة' : 'Create New Group'}
                                </h2>
                                <button
                                    onClick={() => setShowCreateGroupModal(false)}
                                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                                >
                                    <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                                {/* Group Name */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {isArabic ? 'اسم المجموعة' : 'Group Name'}
                                    </label>
                                    <input
                                        type="text"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        placeholder={isArabic ? 'أدخل اسم المجموعة...' : 'Enter group name...'}
                                        className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                                            isDarkMode
                                                ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                                        }`}
                                    />
                                </div>

                                {/* Group Description */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {isArabic ? 'الوصف (اختياري)' : 'Description (Optional)'}
                                    </label>
                                    <textarea
                                        value={newGroupDescription}
                                        onChange={(e) => setNewGroupDescription(e.target.value)}
                                        placeholder={isArabic ? 'وصف المجموعة...' : 'Group description...'}
                                        rows={3}
                                        className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors resize-none ${
                                            isDarkMode
                                                ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                                        }`}
                                    />
                                </div>

                                {/* Select from Cohort */}
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {isArabic ? 'إنشاء من مجموعة دراسية' : 'Create from Cohort'}
                                    </label>
                                    <select
                                        value={selectedCohort || ''}
                                        onChange={(e) => setSelectedCohort(e.target.value || null)}
                                        className={`w-full px-4 py-2 rounded-lg border outline-none transition-colors ${
                                            isDarkMode
                                                ? 'bg-gray-800 border-gray-700 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    >
                                        <option value="">{isArabic ? 'اختر مجموعة دراسية...' : 'Select a cohort...'}</option>
                                        {cohorts.map((cohort) => (
                                            <option key={cohort.id} value={cohort.id}>
                                                {cohort.name} ({cohort.students?.length || 0} {isArabic ? 'طالب' : 'students'})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedCohort && (
                                        <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {isArabic ? 'سيتم إضافة جميع طلاب هذه المجموعة تلقائياً' : 'All students from this cohort will be added automatically'}
                                        </p>
                                    )}
                                </div>

                                {/* Preview Members */}
                                {selectedCohort && (
                                    <div>
                                        <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {isArabic ? 'أعضاء المجموعة' : 'Group Members'}
                                        </label>
                                        <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {cohorts.find(c => c.id === selectedCohort)?.students?.map((student: any) => (
                                                    <div key={student.id} className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                            {student.image ? (
                                                                <Image src={student.image} alt={student.name} width={32} height={32} className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-xs font-semibold">
                                                                    {student.name[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {student.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className={`flex items-center justify-end gap-3 p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => setShowCreateGroupModal(false)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={!newGroupName.trim()}
                                    className="px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isArabic ? 'إنشاء المجموعة' : 'Create Group'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close menus */}
            {(showReactionPicker || showMessageMenu) && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                        setShowReactionPicker(null)
                        setShowMessageMenu(null)
                    }}
                />
            )}

            {/* Video Call Modal */}
            {showVideoCallModal && callSession && (
                <VideoCallModal
                    isOpen={showVideoCallModal}
                    onClose={() => {
                        setShowVideoCallModal(false)
                        setCallSession(null)
                    }}
                    sessionId={callSession.id}
                    sessionToken={callSession.sessionToken}
                    isHost={callSession.hostId === session?.user?.id}
                    otherUserName={callSession.inviteeName}
                    otherUserImage={callSession.inviteeImage}
                    isArabic={isArabic}
                />
            )}

            {/* Voice Call Modal */}
            {showVoiceCallModal && callSession && (
                <VoiceCallModal
                    isOpen={showVoiceCallModal}
                    onClose={() => {
                        setShowVoiceCallModal(false)
                        setCallSession(null)
                    }}
                    sessionId={callSession.id}
                    sessionToken={callSession.sessionToken}
                    isHost={callSession.hostId === session?.user?.id}
                    otherUserName={callSession.inviteeName}
                    otherUserImage={callSession.inviteeImage}
                    isArabic={isArabic}
                />
            )}

            {/* Report Modal */}
            {showReportModal && reportTarget && (
                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => {
                        setShowReportModal(false)
                        setReportTarget(null)
                    }}
                    type={reportTarget.type}
                    targetId={reportTarget.id}
                    targetName={reportTarget.name}
                    isArabic={isArabic}
                />
            )}

            {/* Invite Link Modal */}
            <AnimatePresence>
                {showInviteLinkModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowInviteLinkModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                                isDarkMode ? 'bg-gray-900' : 'bg-white'
                            }`}
                        >
                            {/* Modal Header */}
                            <div className={`flex items-center justify-between p-4 border-b ${
                                isDarkMode ? 'border-gray-800' : 'border-gray-200'
                            }`}>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'رابط دعوة المجموعة' : 'Group Invite Link'}
                                </h2>
                                <button
                                    onClick={() => setShowInviteLinkModal(false)}
                                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                                >
                                    <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-4">
                                {/* Group Info */}
                                <div className="text-center">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white mx-auto mb-3">
                                        <Users className="w-10 h-10" />
                                    </div>
                                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedConversation?.groupName}
                                    </h3>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {selectedConversation?.members?.length || 0} {isArabic ? 'أعضاء' : 'members'}
                                    </p>
                                </div>

                                {/* Info Box */}
                                <div className={`p-4 rounded-lg ${
                                    isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                                }`}>
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                                            }`}>
                                                <span className="text-xl">ℹ️</span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                                {isArabic 
                                                    ? 'شارك هذا الرابط مع أي شخص تريد دعوته للانضمام إلى المجموعة'
                                                    : 'Share this link with anyone you want to invite to the group'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Link Display */}
                                <div className={`p-4 rounded-lg border ${
                                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 overflow-hidden">
                                            <p className={`text-sm font-mono truncate ${
                                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                                {inviteLink}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleCopyInviteLink}
                                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                                                isDarkMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                        >
                                            {isArabic ? 'نسخ' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleShareInviteLink}
                                        className={`px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                                            isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                        }`}
                                    >
                                        <Send className="w-4 h-4" />
                                        {isArabic ? 'مشاركة' : 'Share'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleCopyInviteLink()
                                            setShowInviteLinkModal(false)
                                        }}
                                        className="px-4 py-3 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all"
                                    >
                                        {isArabic ? 'نسخ وإغلاق' : 'Copy & Close'}
                                    </button>
                                </div>

                                {/* Note */}
                                <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {isArabic 
                                        ? 'هذا الرابط لا ينتهي صلاحيته ويمكن استخدامه من قبل أي شخص'
                                        : 'This link never expires and can be used by anyone'
                                    }
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettingsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSettingsModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                                isDarkMode ? 'bg-gray-900' : 'bg-white'
                            }`}
                        >
                            {/* Modal Header */}
                            <div className={`flex items-center justify-between p-4 border-b ${
                                isDarkMode ? 'border-gray-800' : 'border-gray-200'
                            }`}>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {isArabic ? 'إعدادات المحادثة' : 'Chat Settings'}
                                </h2>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                                >
                                    <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                            </div>

                            {/* Settings Content */}
                            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
                                {/* Current User Info */}
                                {session?.user && (
                                    <div className={`p-3 rounded-lg ${
                                        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-semibold">
                                                    {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {session.user.name || session.user.email}
                                                </h3>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {session.user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Theme Setting */}
                                <div className={`flex items-center justify-between p-3 rounded-lg ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        {isDarkMode ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                                        <div>
                                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {isArabic ? 'المظهر' : 'Dark Mode'}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isDarkMode 
                                                    ? (isArabic ? 'مفعّل' : 'Enabled')
                                                    : (isArabic ? 'معطّل' : 'Disabled')
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsDarkMode(!isDarkMode)}
                                        className={`relative w-12 h-6 rounded-full transition-colors ${
                                            isDarkMode ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}
                                    >
                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                            isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                    </button>
                                </div>

                                {/* Active Status */}
                                <div className={`flex items-center justify-between p-3 rounded-lg ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {isArabic ? 'الحالة النشطة' : 'Active Status'}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'عرض حالتك للآخرين' : 'Show when you\'re active'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="relative w-12 h-6 rounded-full bg-blue-500"
                                    >
                                        <div className="absolute top-0.5 translate-x-6 w-5 h-5 bg-white rounded-full" />
                                    </button>
                                </div>

                                {/* Message Requests */}
                                <button
                                    onClick={() => {
                                        toast(isArabic ? 'لا توجد طلبات رسائل' : 'No message requests')
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <MessageCircle className="w-5 h-5 text-blue-400" />
                                        <div className="text-left">
                                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {isArabic ? 'طلبات الرسائل' : 'Message Requests'}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? '0 طلبات' : '0 requests'}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowLeft className={`w-5 h-5 -rotate-180 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>

                                {/* Archived Chats */}
                                <button
                                    onClick={() => {
                                        setActiveTab('archived')
                                        setShowSettingsModal(false)
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 text-blue-400">📦</div>
                                        <div className="text-left">
                                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {isArabic ? 'المحادثات المؤرشفة' : 'Archived Chats'}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'عرض المحادثات المؤرشفة' : 'View archived conversations'}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowLeft className={`w-5 h-5 -rotate-180 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>

                                {/* Muted Conversations */}
                                <button
                                    onClick={() => {
                                        toast(isArabic ? 'لا توجد محادثات مكتومة' : 'No muted conversations')
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                        isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 text-gray-400">🔇</div>
                                        <div className="text-left">
                                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {isArabic ? 'المحادثات المكتومة' : 'Muted Conversations'}
                                            </h3>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? '0 محادثة' : '0 conversations'}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowLeft className={`w-5 h-5 -rotate-180 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>

                                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} my-2`}></div>

                                {/* Keyboard Shortcuts */}
                                <div className={`p-3 rounded-lg ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <span>⌨️</span>
                                        <span>{isArabic ? 'اختصارات لوحة المفاتيح' : 'Keyboard Shortcuts'}</span>
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'رسالة جديدة' : 'New message'}
                                            </span>
                                            <kbd className={`px-2 py-1 text-xs rounded ${
                                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                Ctrl + N
                                            </kbd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'بحث' : 'Search'}
                                            </span>
                                            <kbd className={`px-2 py-1 text-xs rounded ${
                                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                Ctrl + K
                                            </kbd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'إرسال رسالة' : 'Send message'}
                                            </span>
                                            <kbd className={`px-2 py-1 text-xs rounded ${
                                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                Enter
                                            </kbd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'سطر جديد' : 'New line'}
                                            </span>
                                            <kbd className={`px-2 py-1 text-xs rounded ${
                                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                Shift + Enter
                                            </kbd>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'إغلاق' : 'Close modal'}
                                            </span>
                                            <kbd className={`px-2 py-1 text-xs rounded ${
                                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                                Esc
                                            </kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className={`p-3 rounded-lg ${
                                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                    <h3 className={`font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <span>📊</span>
                                        <span>{isArabic ? 'إحصائيات' : 'Statistics'}</span>
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'المحادثات النشطة' : 'Active chats'}
                                            </span>
                                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {filteredConversations.filter(c => !c.isGroup).length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'المجموعات' : 'Groups'}
                                            </span>
                                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {filteredConversations.filter(c => c.isGroup).length}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {isArabic ? 'الرسائل غير المقروءة' : 'Unread messages'}
                                            </span>
                                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* About */}
                                <div className={`p-3 rounded-lg text-center ${
                                    isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                                }`}>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {isArabic ? 'منصة التعليم المصرية' : 'Egyptian EdTech Platform'}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                                        Messenger v2.0
                                    </p>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className={`flex items-center justify-center gap-3 p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <button
                                    onClick={() => setShowSettingsModal(false)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {isArabic ? 'إغلاق' : 'Close'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
