import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                channels: {
                    take: 1
                }
            }
        })

        if (!creator || !creator.channels || creator.channels.length === 0) {
            return NextResponse.json(
                { error: 'Creator profile or channel not found' },
                { status: 404 }
            )
        }

        const formData = await req.formData()
        const type = formData.get('type') as string
        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const visibility = formData.get('visibility') as string
        const file = formData.get('file') as File | null
        const thumbnail = formData.get('thumbnail') as File | null

        if (!title) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            )
        }

        let mediaUrl: string | null = null
        let thumbnailUrl: string | null = null
        let duration: number | null = null

        // Handle file upload
        if (file && type !== 'TEXT') {
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Create unique filename
            const timestamp = Date.now()
            const filename = `${timestamp}-${file.name.replace(/\s/g, '-')}`
            const uploadDir = type === 'VIDEO' ? 'videos' : 'images'
            const filepath = join(process.cwd(), 'public', 'uploads', uploadDir, filename)

            // Ensure directory exists
            await writeFile(filepath, buffer)
            mediaUrl = `/uploads/${uploadDir}/${filename}`

            // For videos, estimate duration (you'd need a proper video processing library)
            if (type === 'VIDEO') {
                duration = 300 // Placeholder: 5 minutes
            }
        }

        // Handle thumbnail upload
        if (thumbnail) {
            const bytes = await thumbnail.arrayBuffer()
            const buffer = Buffer.from(bytes)

            const timestamp = Date.now()
            const filename = `thumb-${timestamp}-${thumbnail.name.replace(/\s/g, '-')}`
            const filepath = join(process.cwd(), 'public', 'uploads', 'thumbnails', filename)

            await writeFile(filepath, buffer)
            thumbnailUrl = `/uploads/thumbnails/${filename}`
        }

        // Create post in database
        const post = await prisma.channelPost.create({
            data: {
                channelId: creator.channels[0].id,
                type: type as any,
                content: description || title,
                contentAr: description || title, // TODO: Add Arabic content field
                mediaUrl: mediaUrl,
                thumbnailUrl: thumbnailUrl || mediaUrl,
                tier: visibility as any,
                duration: duration
            }
        })

        return NextResponse.json({
            success: true,
            post: {
                id: post.id,
                type: post.type,
                mediaUrl: post.mediaUrl,
                thumbnailUrl: post.thumbnailUrl
            }
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
