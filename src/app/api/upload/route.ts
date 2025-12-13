import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// Use nodejs runtime for this API
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const formData = await req.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string // 'profile', 'cover', 'video', 'national-id', etc.

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type based on upload type
        let validTypes: string[] = []
        let maxSize: number

        if (type === 'video') {
            validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
            maxSize = 500 * 1024 * 1024 // 500MB for videos
        } else if (type === 'comment' || type === 'post') {
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
            maxSize = 10 * 1024 * 1024 // 10MB for comments/posts
        } else if (type === 'national-id' || type === 'selfie' || type === 'address-proof') {
            // KYC documents
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
            maxSize = 10 * 1024 * 1024 // 10MB for documents
        } else {
            // Default to images (profile, cover, etc.)
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            maxSize = 5 * 1024 * 1024 // 5MB for images
        }

        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed types: ${validTypes.join(', ')}` },
                { status: 400 }
            )
        }

        // Validate file size
        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024))
            return NextResponse.json(
                { error: `File too large. Maximum size is ${maxSizeMB}MB.` },
                { status: 400 }
            )
        }

        // Convert file to base64 data URL
        // This works in both development and production (serverless) without filesystem access
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const mimeType = file.type
        const dataUrl = `data:${mimeType};base64,${base64}`

        // Generate a unique identifier for tracking
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const ext = file.name.split('.').pop()
        const filename = `${type}_${session.user.id}_${timestamp}_${randomString}.${ext}`

        // For production, you should use cloud storage like:
        // - Cloudinary
        // - AWS S3
        // - Vercel Blob
        // - Uploadthing
        
        // For now, return the base64 data URL which works everywhere
        return NextResponse.json({
            success: true,
            url: dataUrl,
            filename,
            size: file.size,
            type: file.type
        })

    } catch (error) {
        console.error('File upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload file. Please try again.' },
            { status: 500 }
        )
    }
}
