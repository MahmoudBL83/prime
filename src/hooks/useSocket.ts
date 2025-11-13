import { useEffect, useRef, MutableRefObject } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
    url?: string;
    userId?: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onMessage?: (data: any) => void;
    onTyping?: (data: { userId: string; userName: string; conversationId: string }) => void;
    onStopTyping?: (data: { userId: string; conversationId: string }) => void;
}

export const useSocket = ({
    url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    userId,
    onConnect,
    onDisconnect,
    onMessage,
    onTyping,
    onStopTyping,
}: UseSocketOptions) => {
    const socketRef: MutableRefObject<Socket | null> = useRef(null);

    useEffect(() => {
        if (!userId) return;

        // Initialize socket connection
        const socket = io(url, {
            query: { userId },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            onConnect?.();
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            onDisconnect?.();
        });

        // Message events
        socket.on('new_message', onMessage);
        socket.on('user_typing', onTyping);
        socket.on('user_stopped_typing', onStopTyping);

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [userId, url, onConnect, onDisconnect, onMessage, onTyping, onStopTyping]);

    const joinConversation = (conversationId: string) => {
        socketRef.current?.emit('join_conversation', { conversationId });
    };

    const leaveConversation = (conversationId: string) => {
        socketRef.current?.emit('leave_conversation', { conversationId });
    };

    const sendMessage = (conversationId: string, message: any) => {
        socketRef.current?.emit('send_message', {
            conversationId,
            ...message,
        });
    };

    const startTyping = (conversationId: string) => {
        socketRef.current?.emit('start_typing', { conversationId });
    };

    const stopTyping = (conversationId: string) => {
        socketRef.current?.emit('stop_typing', { conversationId });
    };

    const markAsRead = (conversationId: string, messageId: string) => {
        socketRef.current?.emit('mark_as_read', {
            conversationId,
            messageId,
        });
    };

    return {
        socket: socketRef.current,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
    };
};