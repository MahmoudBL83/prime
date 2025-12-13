import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Use nodejs runtime for file system operations
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            )
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
                { status: 400 }
            )
        }

        // Convert file to base64 data URL for storage
        // This works in both development and production without filesystem access
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const mimeType = file.type
        const dataUrl = `data:${mimeType};base64,${base64}`

        // For production, you should use a cloud storage service like:
        // - Cloudinary
        // - AWS S3
        // - Vercel Blob
        // - Uploadthing
        
        // For now, we'll store as base64 data URL which works everywhere
        // Update user profile image in database
        await prisma.user.update({
            where: { id: session.user.id },
            data: { profileImage: dataUrl }
        })

        return NextResponse.json({ 
            url: dataUrl,
            message: 'Avatar uploaded successfully'
        })
    } catch (error) {
        console.error('Avatar upload error:', error)
        return NextResponse.json(
            { error: 'Upload failed. Please try again.' },
            { status: 500 }
        )
    }
}
