import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

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
        const type = formData.get('type') as string // 'profile', 'cover', 'video', etc.

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type based on upload type
        let validTypes: string[] = []
        let maxSize: number
        let uploadSubDir: string

        if (type === 'video') {
            validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
            maxSize = 500 * 1024 * 1024 // 500MB for videos
            uploadSubDir = 'videos'
        } else if (type === 'comment' || type === 'post') {
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
            maxSize = 10 * 1024 * 1024 // 10MB for comments/posts
            uploadSubDir = 'posts'
        } else {
            // Default to images (profile, cover, etc.)
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            maxSize = 5 * 1024 * 1024 // 5MB for images
            uploadSubDir = 'profiles'
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

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Create uploads directory structure
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', uploadSubDir)
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const ext = file.name.split('.').pop()
        const filename = `${type}_${session.user.id}_${timestamp}_${randomString}.${ext}`
        const filepath = path.join(uploadsDir, filename)

        // Write file
        await writeFile(filepath, buffer)

        // Return URL
        const url = `/uploads/${uploadSubDir}/${filename}`

        return NextResponse.json({
            success: true,
            url,
            filename,
            size: file.size,
            type: file.type
        })

    } catch (error) {
        console.error('File upload error:', error)
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        )
    }
}
