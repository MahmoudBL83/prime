'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
    Loader2, 
    Send, 
    MessageCircle, 
    Users, 
    Search, 
    Plus, 
    MoreVertical,
    Phone,
    Video,
    Info,
    Smile,
    Paperclip,
    Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'VOICE_NOTE' | 'SYSTEM';
    createdAt: string;
    sender: {
        id: string;
        name: string;
        arabicName?: string;
        profileImage?: string;
    };
    replyTo?: {
        id: string;
        content: string;
        sender: {
            id: string;
            name: string;
            arabicName?: string;
        };
    };
}

interface Conversation {
    id: string;
    type: 'DIRECT' | 'GROUP';
    title?: string;
    description?: string;
    participants: Array<{
        id: string;
        userId: string;
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
            profileImage?: string;
        };
    }>;
    _count: {
        messages: number;
    };
    updatedAt: string;
}

export default function MessagingPage() {
    const { data: session, status } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load conversations
    useEffect(() => {
        if (session?.user) {
            loadConversations();
        }
    }, [session?.user]);

    const loadConversations = async () => {
        try {
            const response = await fetch('/api/messaging/conversations');
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId: string) => {
        setLoadingMessages(true);
        try {
            const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`);
            if (response.ok) {
                const result = await response.json();
                // Handle both wrapped and direct response formats
                const messagesData = result.success ? result.data : result;
                setMessages(Array.isArray(messagesData) ? messagesData : []);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleConversationSelect = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sending) return;

        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content: newMessage.trim(),
            messageType: 'TEXT',
            createdAt: new Date().toISOString(),
            sender: {
                id: session?.user?.id || '',
                name: session?.user?.name || '',
                profileImage: undefined
            }
        };

        // Optimistically add message
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        setSending(true);

        try {
            const response = await fetch(`/api/messaging/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: newMessage.trim(),
                    messageType: 'TEXT',
                }),
            });

            if (response.ok) {
                const result = await response.json();
                const newMsg = result.success ? result.data : result;
                // Replace temp message with actual message
                setMessages(prev => prev.map(msg => 
                    msg.id === tempMessage.id ? newMsg : msg
                ));
            } else {
                // Remove temp message on error
                setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove temp message on error
            setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        } finally {
            setSending(false);
        }
    };

    const getConversationTitle = (conversation: Conversation) => {
        if (conversation.title) return conversation.title;
        const otherParticipants = conversation.participants.filter(
            p => p.user.id !== session?.user?.id
        );
        return otherParticipants.map(p => p.user.name).join(', ') || 'Unknown';
    };

    const getConversationSubtitle = (conversation: Conversation) => {
        if (conversation.type === 'GROUP') {
            return `${conversation.participants.length} members`;
        }
        return 'Direct message';
    };

    const filteredConversations = conversations.filter(conv =>
        getConversationTitle(conv).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <Loader2 className="w-6 h-6 animate-spin absolute -bottom-1 -right-1 text-purple-400 bg-gray-900 rounded-full" />
                    </div>
                    <p className="text-white font-medium">Loading conversations...</p>
                    <p className="text-purple-300 text-sm mt-1">Please wait</p>
                </motion.div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md mx-4"
                >
                    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2 text-white">Welcome to Messages</h1>
                            <p className="text-purple-200 mb-6">Please sign in to access your conversations</p>
                            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                                Sign In
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex overflow-hidden">
            {/* Conversations Sidebar */}
            <motion.div 
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                className="w-80 bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col"
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            Messages
                        </h1>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="text-purple-300 hover:text-white hover:bg-white/10">
                                <Plus className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-purple-300 hover:text-white hover:bg-white/10">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
                        <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search conversations..."
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder-purple-300 focus:border-purple-400"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {filteredConversations.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <Users className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="text-purple-300 font-medium mb-1">No conversations yet</p>
                            <p className="text-purple-400 text-sm">Start a new conversation to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            <AnimatePresence>
                                {filteredConversations.map((conversation) => (
                                    <motion.button
                                        key={conversation.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleConversationSelect(conversation)}
                                        className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                                            selectedConversation?.id === conversation.id
                                                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white shadow-lg'
                                                : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                    {getConversationTitle(conversation)[0]?.toUpperCase()}
                                                </div>
                                                {conversation.type === 'DIRECT' && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-gray-900 rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium truncate">
                                                        {getConversationTitle(conversation)}
                                                    </p>
                                                    <p className="text-xs opacity-75">
                                                        {formatMessageTime(conversation.updatedAt)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm opacity-75">
                                                        {getConversationSubtitle(conversation)}
                                                    </p>
                                                    {conversation._count.messages > 0 && (
                                                        <div className="bg-purple-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                                                            {conversation._count.messages > 99 ? '99+' : conversation._count.messages}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <motion.div 
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            {getConversationTitle(selectedConversation)[0]?.toUpperCase()}
                                        </div>
                                        {selectedConversation.type === 'DIRECT' && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border border-gray-900 rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">
                                            {getConversationTitle(selectedConversation)}
                                        </h2>
                                        <p className="text-sm text-purple-300">
                                            {selectedConversation.type === 'DIRECT' ? 'Online' : getConversationSubtitle(selectedConversation)}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" className="text-purple-300 hover:text-white hover:bg-white/10">
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-purple-300 hover:text-white hover:bg-white/10">
                                        <Video className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-purple-300 hover:text-white hover:bg-white/10">
                                        <Info className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                                    <span className="ml-2 text-purple-300">Loading messages...</span>
                                </div>
                            ) : messages.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center text-purple-300 py-12"
                                >
                                    <div className="w-20 h-20 bg-white/5 rounded-full mx-auto mb-4 flex items-center justify-center">
                                        <MessageCircle className="w-10 h-10 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-white">Start the conversation</h3>
                                    <p>Send a message to begin chatting with {getConversationTitle(selectedConversation)}</p>
                                </motion.div>
                            ) : (
                                <AnimatePresence>
                                    {messages.map((message, index) => {
                                        const isOwn = message.sender.id === session?.user?.id;
                                        const showSender = index === 0 || messages[index - 1].sender.id !== message.sender.id;
                                        
                                        return (
                                            <motion.div
                                                key={message.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                                            >
                                                {showSender && !isOwn && (
                                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {message.sender.name[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                                {!showSender && !isOwn && <div className="w-8 h-8 flex-shrink-0"></div>}
                                                
                                                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'flex flex-col items-end' : ''}`}>
                                                    {showSender && !isOwn && (
                                                        <p className="text-sm font-medium mb-1 text-purple-300 ml-2">
                                                            {message.sender.name}
                                                        </p>
                                                    )}
                                                    <div
                                                        className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                                                            isOwn
                                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                                : 'bg-white/10 text-gray-100 border border-white/10'
                                                        } ${!showSender && isOwn ? 'rounded-tr-md' : ''} ${!showSender && !isOwn ? 'rounded-tl-md' : ''}`}
                                                    >
                                                        <p className="break-words">{message.content}</p>
                                                        <p className={`text-xs mt-1 ${isOwn ? 'text-purple-100' : 'text-purple-300'}`}>
                                                            {formatMessageTime(message.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <motion.form 
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            onSubmit={handleSendMessage} 
                            className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-lg"
                        >
                            <div className="flex items-center gap-3">
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-purple-300 hover:text-white hover:bg-white/10"
                                >
                                    <Paperclip className="w-4 h-4" />
                                </Button>
                                
                                <div className="flex-1 relative">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="bg-white/10 border-white/20 text-white placeholder-purple-300 pr-20 py-3 rounded-2xl focus:border-purple-400"
                                        disabled={sending}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                        <Button 
                                            type="button" 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-purple-300 hover:text-white p-1 h-auto"
                                        >
                                            <Smile className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Button 
                                    type="button" 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-purple-300 hover:text-white hover:bg-white/10"
                                >
                                    <Mic className="w-4 h-4" />
                                </Button>
                                
                                <Button 
                                    type="submit" 
                                    disabled={!newMessage.trim() || sending}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-3 shadow-lg"
                                >
                                    {sending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </motion.form>
                    </>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex items-center justify-center"
                    >
                        <div className="text-center text-purple-300 max-w-md">
                            <div className="w-24 h-24 bg-white/5 rounded-full mx-auto mb-6 flex items-center justify-center">
                                <MessageCircle className="w-12 h-12 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-white">Welcome to Messages</h2>
                            <p className="text-purple-300 mb-6">Choose a conversation from the sidebar to start messaging, or create a new conversation to connect with others.</p>
                            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Start New Chat
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}