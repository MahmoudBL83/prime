import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// Use nodejs runtime for this API
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper to get upload directory
const getUploadDir = () => {
    // For production (Hostinger), use public/uploads directory
    // For development, same location
    return path.join(process.cwd(), 'public', 'uploads')
}

// Ensure upload directory exists
const ensureUploadDir = async (subDir: string = '') => {
    const uploadDir = path.join(getUploadDir(), subDir)
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
    }
    return uploadDir
}

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
        let subDir: string = 'misc'

        if (type === 'video') {
            validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
            maxSize = 500 * 1024 * 1024 // 500MB for videos
            subDir = 'videos'
        } else if (type === 'comment' || type === 'post') {
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
            maxSize = 10 * 1024 * 1024 // 10MB for comments/posts
            subDir = 'posts'
        } else if (type === 'national-id' || type === 'selfie' || type === 'address-proof') {
            // KYC documents
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
            maxSize = 10 * 1024 * 1024 // 10MB for documents
            subDir = 'kyc'
        } else if (type === 'profile' || type === 'avatar') {
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            maxSize = 5 * 1024 * 1024 // 5MB for images
            subDir = 'avatars'
        } else if (type === 'cover') {
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            maxSize = 10 * 1024 * 1024 // 10MB for cover images
            subDir = 'covers'
        } else {
            // Default to images
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            maxSize = 5 * 1024 * 1024 // 5MB for images
            subDir = 'misc'
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

        // Generate unique filename
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const ext = file.name.split('.').pop() || 'bin'
        const filename = `${type}_${session.user.id}_${timestamp}_${randomString}.${ext}`

        // Check if we should use file storage or base64
        const useFileStorage = process.env.USE_FILE_STORAGE === 'true' || process.env.NODE_ENV === 'production'

        if (useFileStorage) {
            // Save to filesystem (for Hostinger and production)
            try {
                const uploadDir = await ensureUploadDir(subDir)
                const filePath = path.join(uploadDir, filename)

                const bytes = await file.arrayBuffer()
                const buffer = Buffer.from(bytes)

                await writeFile(filePath, buffer)

                // Return public URL path
                const publicUrl = `/uploads/${subDir}/${filename}`

                return NextResponse.json({
                    success: true,
                    url: publicUrl,
                    filename,
                    size: file.size,
                    type: file.type
                })
            } catch (fsError) {
                console.error('File system write error:', fsError)

                const errorMsg = fsError instanceof Error ? fsError.message : 'Unknown FS error'
                const currentDir = process.cwd()
                const targetDir = path.join(currentDir, 'public', 'uploads', subDir)

                // If the file is large (> 1MB), do NOT fall back to base64
                // as this ensures files appear in Hostinger File Manager
                if (file.size > 1 * 1024 * 1024) {
                    return NextResponse.json(
                        {
                            error: `Storage error: ${errorMsg}`,
                            details: `Could not write to ${targetDir}. Current directory: ${currentDir}. Please ensure public/uploads is writable (chmod 755 or 777).`,
                            env: process.env.NODE_ENV,
                            cwd: currentDir,
                            target: targetDir
                        },
                        { status: 507 } // Insufficient Storage
                    )
                }
            }
        }

        // Fallback: Convert file to base64 data URL
        // ONLY for very small files (< 1MB) to prevent bloating and ensure physical files for everything else
        if (file.size > 1 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large for base64 fallback. Storage directory must be writable on Hostinger.' },
                { status: 413 }
            )
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const mimeType = file.type
        const dataUrl = `data:${mimeType};base64,${base64}`

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
            { error: error instanceof Error ? error.message : 'Failed to upload file. Please try again.' },
            { status: 500 }
        )
    }
}
