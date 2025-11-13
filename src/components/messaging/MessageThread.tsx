'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Message {
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

interface Conversation {
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

interface TypingUser {
    userId: string;
    conversationId: string;
}

interface MessageThreadProps {
    conversation: Conversation;
    messages: Message[];
    typingUsers: TypingUser[];
    onReaction: (messageId: string, emoji: string) => void;
    onReply: (messageId: string) => void;
}

export default function MessageThread({
    conversation,
    messages,
    typingUsers,
    onReaction,
    onReply,
}: MessageThreadProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isCurrentUser = (senderId: string) => {
        // This would come from the session - for now using a placeholder
        // TODO: Get current user ID from session context
        return senderId === 'current-user-id'; // Placeholder - needs session integration
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) {
            return '🖼️';
        } else if (fileType.startsWith('video/')) {
            return '🎥';
        } else if (fileType.startsWith('audio/')) {
            return '🎵';
        } else if (fileType.includes('pdf')) {
            return '📄';
        } else if (fileType.includes('document') || fileType.includes('word')) {
            return '📝';
        } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
            return '📊';
        } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
            return '📊';
        } else {
            return '📎';
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                            "flex",
                            isCurrentUser(message.senderId) ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                                isCurrentUser(message.senderId)
                                    ? "bg-blue-500 text-foreground"
                                    : "bg-background text-foreground border border-border"
                            )}
                        >
                            {/* Message header */}
                            {!isCurrentUser(message.senderId) && (
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-sm font-medium">{message.sender.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatMessageTime(message.createdAt)}
                                    </span>
                                </div>
                            )}

                            {/* Reply indicator */}
                            {message.replyTo && (
                                <div className="mb-2 p-2 bg-muted rounded text-sm">
                                    <span className="font-medium">{message.replyTo.sender.name}:</span>{' '}
                                    {message.replyTo.content.substring(0, 100)}
                                    {message.replyTo.content.length > 100 && '...'}
                                </div>
                            )}

                            {/* Message content */}
                            <div className="break-words">
                                {message.content}
                            </div>

                            {/* Attachments */}
                            {message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                    {message.attachments.map((attachment) => (
                                        <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                                            <span className="text-lg">{getFileIcon(attachment.fileType)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(attachment.fileSize / 1024 / 1024).toFixed(1)} MB
                                                </p>
                                            </div>
                                            <a
                                                href={attachment.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Message footer */}
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-1">
                                    {isCurrentUser(message.senderId) && (
                                        <span className="text-xs text-muted-foreground">
                                            {formatMessageTime(message.createdAt)}
                                        </span>
                                    )}
                                    {message.edited && (
                                        <span className="text-xs text-muted-foreground">(edited)</span>
                                    )}
                                </div>

                                {/* Reactions */}
                                {message.reactions.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                        {message.reactions.map((reaction) => (
                                            <button
                                                key={reaction.id}
                                                onClick={() => onReaction(message.id, reaction.emoji)}
                                                className="text-xs bg-muted px-1 py-0.5 rounded"
                                            >
                                                {reaction.emoji} {message.reactions.filter(r => r.emoji === reaction.emoji).length}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing indicators */}
                {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-background border border-border px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-1">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-sm text-muted-foreground ml-2">
                                    {typingUsers.length === 1
                                        ? `${typingUsers[0].userId} is typing...`
                                        : `${typingUsers.length} people are typing...`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}