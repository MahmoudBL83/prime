import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'VOICE_NOTE' | 'SYSTEM';
    replyToId?: string;
    edited: boolean;
    editedAt?: string;
    createdAt: string;
    updatedAt: string;
    sender: {
        id: string;
        name: string;
        email: string;
        profileImage?: string;
    };
    replyTo?: {
        id: string;
        content: string;
        sender: {
            id: string;
            name: string;
        };
    };
    attachments: Array<{
        id: string;
        fileName: string;
        fileSize: number;
        fileType: string;
        fileUrl: string;
        thumbnailUrl?: string;
    }>;
    reactions: Array<{
        id: string;
        emoji: string;
        user: {
            id: string;
            name: string;
        };
    }>;
}

export interface Conversation {
    id: string;
    type: 'DIRECT' | 'GROUP';
    title?: string;
    description?: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
    participants: Array<{
        id: string;
        userId: string;
        role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
        joinedAt: string;
        lastReadAt?: string;
        isActive: boolean;
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
}

export interface TypingUser {
    userId: string;
    conversationId: string;
}

export interface UseMessagingReturn {
    socket: Socket | null;
    isConnected: boolean;
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    typingUsers: TypingUser[];
    joinConversation: (conversationId: string) => void;
    leaveConversation: (conversationId: string) => void;
    sendMessage: (data: {
        conversationId: string;
        content: string;
        messageType?: Message['messageType'];
        replyToId?: string;
    }) => void;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
    addReaction: (messageId: string, emoji: string) => void;
    setCurrentConversation: (conversation: Conversation | null) => void;
    loadMessages: (conversationId: string, before?: string) => Promise<void>;
    loadConversations: () => Promise<void>;
}

export function useMessaging(): UseMessagingReturn {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize socket connection
    useEffect(() => {
        if (!session?.user) return;

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
            auth: {
                token: session.user.id,
            },
        });

        newSocket.on('connect', () => {
            console.log('Connected to messaging server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from messaging server');
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        // Message events
        newSocket.on('message_sent', (message: Message) => {
            setMessages(prev => [...prev, message]);
        });

        // Typing events
        newSocket.on('typing_start', (data: TypingUser) => {
            setTypingUsers(prev => {
                if (!prev.find(user => user.userId === data.userId && user.conversationId === data.conversationId)) {
                    return [...prev, data];
                }
                return prev;
            });
        });

        newSocket.on('typing_stop', (data: TypingUser) => {
            setTypingUsers(prev =>
                prev.filter(user =>
                    !(user.userId === data.userId && user.conversationId === data.conversationId)
                )
            );
        });

        // User status events
        newSocket.on('user_online', (data: { userId: string }) => {
            console.log(`User ${data.userId} is online`);
        });

        newSocket.on('user_offline', (data: { userId: string }) => {
            console.log(`User ${data.userId} is offline`);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [session?.user]);

    // Load conversations
    const loadConversations = useCallback(async () => {
        if (!session?.user) return;

        try {
            const response = await fetch('/api/messaging/conversations');
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    }, [session?.user]);

    // Load messages for a conversation
    const loadMessages = useCallback(async (conversationId: string, before?: string) => {
        try {
            const params = new URLSearchParams();
            if (before) params.append('before', before);

            const response = await fetch(`/api/messaging/conversations/${conversationId}/messages?${params}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...data, ...prev]);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }, []);

    // Join conversation
    const joinConversation = useCallback((conversationId: string) => {
        if (socket) {
            socket.emit('join_conversation', conversationId);
        }
    }, [socket]);

    // Leave conversation
    const leaveConversation = useCallback((conversationId: string) => {
        if (socket) {
            socket.emit('leave_conversation', conversationId);
        }
    }, [socket]);

    // Send message
    const sendMessage = useCallback((data: {
        conversationId: string;
        content: string;
        messageType?: Message['messageType'];
        replyToId?: string;
    }) => {
        if (socket) {
            socket.emit('send_message', data);
        }
    }, [socket]);

    // Start typing
    const startTyping = useCallback((conversationId: string) => {
        if (socket) {
            socket.emit('typing_start', conversationId);

            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Stop typing after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping(conversationId);
            }, 3000);
        }
    }, [socket]);

    // Stop typing
    const stopTyping = useCallback((conversationId: string) => {
        if (socket) {
            socket.emit('typing_stop', conversationId);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
    }, [socket]);

    // Add reaction
    const addReaction = useCallback((messageId: string, emoji: string) => {
        if (socket) {
            socket.emit('message_reaction', { messageId, emoji });
        }
    }, [socket]);

    return {
        socket,
        isConnected,
        conversations,
        currentConversation,
        messages,
        typingUsers,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        addReaction,
        setCurrentConversation,
        loadMessages,
        loadConversations,
    };
}