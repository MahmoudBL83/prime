import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

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

        // Create unique filename
        const timestamp = Date.now()
        const ext = file.name.split('.').pop()
        const filename = `${session.user.id}-${timestamp}.${ext}`
        
        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'avatars')
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true })
        }

        // Save file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filepath = join(uploadDir, filename)
        await writeFile(filepath, buffer)

        // Return public URL
        const url = `/uploads/avatars/${filename}`

        return NextResponse.json({ url })
    } catch (error) {
        console.error('Avatar upload error:', error)
        return NextResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
        )
    }
}
