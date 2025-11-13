import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const uploadSchema = z.object({
    conversationId: z.string(),
    messageType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'VOICE_NOTE']).default('FILE'),
});

// Supported file types and their max sizes (in bytes)
const FILE_TYPE_CONFIGS = {
    IMAGE: {
        types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    VIDEO: {
        types: ['video/mp4', 'video/mov', 'video/avi', 'video/webm'],
        maxSize: 100 * 1024 * 1024, // 100MB
    },
    AUDIO: {
        types: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4'],
        maxSize: 50 * 1024 * 1024, // 50MB
    },
    FILE: {
        types: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
        ],
        maxSize: 25 * 1024 * 1024, // 25MB
    },
    VOICE_NOTE: {
        types: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/webm'],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
};

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const conversationId = formData.get('conversationId') as string;
        const messageType = (formData.get('messageType') as string) || 'FILE';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate input
        const validatedData = uploadSchema.parse({
            conversationId,
            messageType,
        });

        // Check file type and size
        const config = FILE_TYPE_CONFIGS[validatedData.messageType as keyof typeof FILE_TYPE_CONFIGS];
        if (!config) {
            return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
        }

        if (!config.types.includes(file.type)) {
            return NextResponse.json(
                { error: `File type ${file.type} not supported for ${validatedData.messageType}` },
                { status: 400 }
            );
        }

        if (file.size > config.maxSize) {
            return NextResponse.json(
                { error: `File size exceeds maximum allowed size of ${config.maxSize / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

        // Create upload directory structure
        const uploadDir = join(process.cwd(), 'uploads', 'messaging', 'attachments', conversationId);
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const filePath = join(uploadDir, fileName);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Generate file URL (in production, this would be a CDN URL)
        const fileUrl = `/uploads/messaging/attachments/${conversationId}/${fileName}`;

        // Generate thumbnail URL for images and videos
        let thumbnailUrl: string | undefined;
        if (validatedData.messageType === 'IMAGE' || validatedData.messageType === 'VIDEO') {
            const thumbnailFileName = `thumb-${fileName}`;
            const thumbnailPath = join(uploadDir, thumbnailFileName);
            // In a real implementation, you would generate thumbnails here
            thumbnailUrl = `/uploads/messaging/attachments/${conversationId}/${thumbnailFileName}`;
        }

        return NextResponse.json({
            fileName,
            fileSize: file.size,
            fileType: file.type,
            fileUrl,
            thumbnailUrl,
            messageType: validatedData.messageType,
        });
    } catch (error) {
        console.error('Error uploading file:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input', details: error.issues },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/messaging/upload - Get upload configuration
export async function GET() {
    return NextResponse.json({
        supportedTypes: FILE_TYPE_CONFIGS,
        maxSizes: Object.fromEntries(
            Object.entries(FILE_TYPE_CONFIGS).map(([type, config]) => [
                type,
                config.maxSize,
            ])
        ),
    });
}