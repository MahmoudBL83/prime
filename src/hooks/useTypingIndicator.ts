import { useState, useEffect, useRef } from 'react';

export const useTypingIndicator = (conversationId?: string) => {
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const addTypingUser = (userId: string) => {
        setTypingUsers(prev => {
            if (!prev.includes(userId)) {
                return [...prev, userId];
            }
            return prev;
        });
    };

    const removeTypingUser = (userId: string) => {
        setTypingUsers(prev => prev.filter(id => id !== userId));
    };

    const startTyping = (onStartTyping?: () => void) => {
        if (!isTyping) {
            setIsTyping(true);
            onStartTyping?.();
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
        }, 3000);
    };

    const stopTyping = (onStopTyping?: () => void) => {
        setIsTyping(false);
        onStopTyping?.();
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    const getTypingText = (currentUserId?: string) => {
        const otherTypingUsers = typingUsers.filter(id => id !== currentUserId);
        
        if (otherTypingUsers.length === 0) return '';
        
        if (otherTypingUsers.length === 1) {
            return 'Someone is typing...';
        } else if (otherTypingUsers.length === 2) {
            return '2 people are typing...';
        } else {
            return 'Several people are typing...';
        }
    };

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return {
        typingUsers,
        isTyping,
        addTypingUser,
        removeTypingUser,
        startTyping,
        stopTyping,
        getTypingText,
    };
};
