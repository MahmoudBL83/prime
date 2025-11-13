'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

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

interface ConversationListProps {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    onConversationSelect: (conversation: Conversation) => void;
    isConnected: boolean;
}

export default function ConversationList({
    conversations,
    currentConversation,
    onConversationSelect,
    isConnected,
}: ConversationListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConversations = conversations.filter(conversation => {
        if (!searchQuery) return true;

        const title = conversation.title || conversation.participants.map(p => p.user.name).join(', ');
        return title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const formatLastMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h`;
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <div className="w-full lg:w-80 border-r border-border bg-background flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-border">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <svg
                        className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Connection status */}
            <div className="px-4 py-2 bg-background border-b border-border">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center space-x-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isConnected ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-xs text-muted-foreground">
                            {isConnected ? "Online" : "Offline"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredConversations.map((conversation) => (
                            <div
                                key={conversation.id}
                                onClick={() => onConversationSelect(conversation)}
                                className={cn(
                                    "p-4 cursor-pointer hover:bg-background transition-colors",
                                    currentConversation?.id === conversation.id && "bg-blue-50 border-r-2 border-blue-500"
                                )}
                            >
                                <div className="flex items-center space-x-3">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {conversation.type === 'GROUP' ? (
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                {conversation.participants[0]?.user.profileImage ? (
                                                    <img
                                                        src={conversation.participants[0].user.profileImage}
                                                        alt={conversation.participants[0].user.name}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {conversation.participants[0]?.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Conversation info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-foreground truncate">
                                                {conversation.type === 'GROUP'
                                                    ? conversation.title
                                                    : conversation.participants.map(p => p.user.name).join(', ')
                                                }
                                            </h3>
                                            <span className="text-xs text-muted-foreground">
                                                {formatLastMessageTime(conversation.updatedAt)}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-sm text-muted-foreground truncate">
                                                {conversation._count.messages} messages
                                            </p>
                                            {conversation.type === 'GROUP' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    Group
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}