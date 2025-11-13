'use client';

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

interface ContextPanelProps {
    conversation: Conversation;
    onClose: () => void;
}

export default function ContextPanel({ conversation, onClose }: ContextPanelProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'bg-red-100 text-red-800';
            case 'MODERATOR':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <div className="w-80 border-l border-border bg-background flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Conversation Info</h2>
                <button
                    onClick={onClose}
                    className="p-2 text-muted-foreground hover:text-muted-foreground"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Conversation details */}
                <div className="p-4 border-b border-border">
                    {conversation.type === 'GROUP' ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-foreground">{conversation.title}</h3>
                            {conversation.description && (
                                <p className="text-sm text-muted-foreground mt-1">{conversation.description}</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                {conversation.participants[0]?.user.profileImage ? (
                                    <img
                                        src={conversation.participants[0].user.profileImage}
                                        alt={conversation.participants[0].user.name}
                                        className="w-16 h-16 rounded-full"
                                    />
                                ) : (
                                    <span className="text-xl font-medium text-muted-foreground">
                                        {conversation.participants[0]?.user.name.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-medium text-foreground">
                                {conversation.participants[0]?.user.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {conversation.participants[0]?.user.email}
                            </p>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="p-4 border-b border-border">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {conversation._count.messages}
                            </div>
                            <div className="text-sm text-muted-foreground">Messages</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">
                                {conversation.participants.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {conversation.type === 'GROUP' ? 'Members' : 'Participants'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Participants/Members */}
                <div className="p-4">
                    <h4 className="text-sm font-medium text-foreground mb-3">
                        {conversation.type === 'GROUP' ? 'Members' : 'Participants'}
                    </h4>
                    <div className="space-y-3">
                        {conversation.participants.map((participant) => (
                            <div key={participant.id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        {participant.user.profileImage ? (
                                            <img
                                                src={participant.user.profileImage}
                                                alt={participant.user.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {participant.user.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {participant.user.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Joined {formatDate(participant.joinedAt)}
                                        </p>
                                    </div>
                                </div>

                                {conversation.type === 'GROUP' && (
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                        getRoleBadgeColor(participant.role)
                                    )}>
                                        {participant.role}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversation settings */}
                <div className="p-4 border-t border-border">
                    <div className="space-y-3">
                        <button className="w-full flex items-center space-x-3 p-2 text-foreground hover:bg-background rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                            </svg>
                            <span className="text-sm">Notification Settings</span>
                        </button>

                        {conversation.type === 'GROUP' && (
                            <button className="w-full flex items-center space-x-3 p-2 text-foreground hover:bg-background rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-sm">Group Settings</span>
                            </button>
                        )}

                        <button className="w-full flex items-center space-x-3 p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="text-sm">Leave Conversation</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}