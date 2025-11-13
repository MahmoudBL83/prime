'use client';

import { useState, useRef, useCallback } from 'react';
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

interface MessageComposerProps {
    conversation: Conversation;
    onSendMessage: (content: string, messageType?: string, replyToId?: string) => void;
    onTyping: () => void;
    onStopTyping: () => void;
}

export default function MessageComposer({
    conversation,
    onSendMessage,
    onTyping,
    onStopTyping,
}: MessageComposerProps) {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        if (!message.trim() && attachments.length === 0) return;

        onSendMessage(message.trim(), attachments.length > 0 ? 'FILE' : 'TEXT');
        setMessage('');
        setAttachments([]);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        onStopTyping();
    }, [message, attachments, onSendMessage, onStopTyping]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    }, [handleSubmit]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);

        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }

        // Trigger typing indicator
        if (e.target.value && !message) {
            onTyping();
        } else if (!e.target.value && message) {
            onStopTyping();
        }
    }, [message, onTyping, onStopTyping]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
    }, []);

    const removeAttachment = useCallback((index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }, []);

    const startRecording = useCallback(() => {
        setIsRecording(true);
        // In a real implementation, you would start audio recording here
    }, []);

    const stopRecording = useCallback(() => {
        setIsRecording(false);
        // In a real implementation, you would stop audio recording and process the audio file
    }, []);

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) {
            return '🖼️';
        } else if (file.type.startsWith('video/')) {
            return '🎥';
        } else if (file.type.startsWith('audio/')) {
            return '🎵';
        } else if (file.type.includes('pdf')) {
            return '📄';
        } else if (file.type.includes('document') || file.type.includes('word')) {
            return '📝';
        } else if (file.type.includes('spreadsheet') || file.type.includes('excel')) {
            return '📊';
        } else if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
            return '📊';
        } else {
            return '📎';
        }
    };

    return (
        <div className="border-t border-border bg-background p-4">
            {/* Attachments preview */}
            {attachments.length > 0 && (
                <div className="mb-4 space-y-2">
                    {attachments.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-background rounded-lg">
                            <span className="text-lg">{getFileIcon(file)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                            </div>
                            <button
                                onClick={() => removeAttachment(index)}
                                className="text-red-500 hover:text-red-600"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-4">
                {/* File upload button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-muted-foreground hover:text-muted-foreground"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </button>

                {/* Voice recording button */}
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                        "p-2 rounded-full",
                        isRecording
                            ? "text-red-500 bg-red-100"
                            : "text-muted-foreground hover:text-muted-foreground"
                    )}
                >
                    {isRecording ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9v6m0 0v6m0-6h6m-6 0H3" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                {/* Message input */}
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${conversation.type === 'GROUP' ? conversation.title : 'conversation'}...`}
                        className="w-full resize-none border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent max-h-32"
                        rows={1}
                    />
                </div>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={!message.trim() && attachments.length === 0}
                    className={cn(
                        "p-2 rounded-lg",
                        message.trim() || attachments.length > 0
                            ? "bg-primary text-foreground hover:bg-primary/90"
                            : "bg-gray-200 text-muted-foreground cursor-not-allowed"
                    )}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
        </div>
    );
}