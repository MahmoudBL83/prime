'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2, Send, MessageCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        profileImage?: string;
    };
}

interface Conversation {
    id: string;
    type: 'DIRECT' | 'GROUP';
    title?: string;
    participants: Array<{
        user: {
            id: string;
            name: string;
            profileImage?: string;
        };
    }>;
    _count: {
        messages: number;
    };
}

export default function SimplifiedMessagingPage() {
    const { data: session, status } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

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
        try {
            const response = await fetch(`/api/messaging/conversations/${conversationId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleConversationSelect = (conversation: Conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || sending) return;

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
                const newMsg = await response.json();
                setMessages(prev => [...prev, newMsg]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
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

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
                    <p className="text-white">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <Card className="w-full max-w-md mx-4 bg-gray-800 border-gray-700">
                    <CardContent className="p-6 text-center">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                        <h1 className="text-xl font-bold mb-2 text-white">Please sign in</h1>
                        <p className="text-gray-400">You need to be logged in to access messaging</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Conversations Sidebar */}
            <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-purple-500" />
                        Messages
                    </h1>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                            <p className="text-gray-400">No conversations yet</p>
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {conversations.map((conversation) => (
                                <motion.button
                                    key={conversation.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleConversationSelect(conversation)}
                                    className={`w-full p-3 rounded-lg text-left transition-colors ${\n                                        selectedConversation?.id === conversation.id\n                                            ? 'bg-purple-600 text-white'\n                                            : 'hover:bg-gray-700 text-gray-300'\n                                    }`}
                                >\n                                    <div className=\"flex items-center gap-3\">\n                                        <div className=\"w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold\">\n                                            {getConversationTitle(conversation)[0]?.toUpperCase()}\n                                        </div>\n                                        <div className=\"flex-1 min-w-0\">\n                                            <p className=\"font-medium truncate\">\n                                                {getConversationTitle(conversation)}\n                                            </p>\n                                            <p className=\"text-sm opacity-75\">\n                                                {conversation._count.messages} messages\n                                            </p>\n                                        </div>\n                                    </div>\n                                </motion.button>\n                            ))}\n                        </div>\n                    )}\n                </div>\n            </div>\n\n            {/* Messages Area */}\n            <div className=\"flex-1 flex flex-col\">\n                {selectedConversation ? (\n                    <>\n                        {/* Header */}\n                        <div className=\"p-4 border-b border-gray-700 bg-gray-800\">\n                            <h2 className=\"text-lg font-semibold text-white\">\n                                {getConversationTitle(selectedConversation)}\n                            </h2>\n                        </div>\n\n                        {/* Messages */}\n                        <div className=\"flex-1 overflow-y-auto p-4 space-y-4\">\n                            {messages.length === 0 ? (\n                                <div className=\"text-center text-gray-400 py-8\">\n                                    <MessageCircle className=\"w-12 h-12 mx-auto mb-3 opacity-50\" />\n                                    <p>No messages yet. Start the conversation!</p>\n                                </div>\n                            ) : (\n                                messages.map((message) => (\n                                    <motion.div\n                                        key={message.id}\n                                        initial={{ opacity: 0, y: 10 }}\n                                        animate={{ opacity: 1, y: 0 }}\n                                        className={`flex gap-3 ${\n                                            message.sender.id === session?.user?.id\n                                                ? 'flex-row-reverse'\n                                                : 'flex-row'\n                                        }`}\n                                    >\n                                        <div className=\"w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0\">\n                                            {message.sender.name[0]?.toUpperCase()}\n                                        </div>\n                                        <div\n                                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${\n                                                message.sender.id === session?.user?.id\n                                                    ? 'bg-purple-600 text-white'\n                                                    : 'bg-gray-700 text-gray-100'\n                                            }`}\n                                        >\n                                            <p className=\"text-sm font-medium mb-1\">\n                                                {message.sender.name}\n                                            </p>\n                                            <p>{message.content}</p>\n                                            <p className=\"text-xs opacity-75 mt-1\">\n                                                {new Date(message.createdAt).toLocaleTimeString()}\n                                            </p>\n                                        </div>\n                                    </motion.div>\n                                ))\n                            )}\n                        </div>\n\n                        {/* Message Input */}\n                        <form onSubmit={handleSendMessage} className=\"p-4 border-t border-gray-700 bg-gray-800\">\n                            <div className=\"flex gap-2\">\n                                <Input\n                                    value={newMessage}\n                                    onChange={(e) => setNewMessage(e.target.value)}\n                                    placeholder=\"Type your message...\"\n                                    className=\"flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400\"\n                                    disabled={sending}\n                                />\n                                <Button \n                                    type=\"submit\" \n                                    disabled={!newMessage.trim() || sending}\n                                    className=\"bg-purple-600 hover:bg-purple-700\"\n                                >\n                                    {sending ? (\n                                        <Loader2 className=\"w-4 h-4 animate-spin\" />\n                                    ) : (\n                                        <Send className=\"w-4 h-4\" />\n                                    )}\n                                </Button>\n                            </div>\n                        </form>\n                    </>\n                ) : (\n                    <div className=\"flex-1 flex items-center justify-center\">\n                        <div className=\"text-center text-gray-400\">\n                            <MessageCircle className=\"w-16 h-16 mx-auto mb-4 opacity-50\" />\n                            <h2 className=\"text-xl font-semibold mb-2\">Select a conversation</h2>\n                            <p>Choose a conversation from the sidebar to start messaging</p>\n                        </div>\n                    </div>\n                )}\n            </div>\n        </div>\n    );\n}