import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * POST /api/creator/courses/create
 * Create a new course
 */
export async function POST(request: NextRequest) {
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
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const formData = await request.formData()
        const title = formData.get('title') as string
        const titleAr = formData.get('titleAr') as string
        const description = formData.get('description') as string
        const descriptionAr = formData.get('descriptionAr') as string
        const category = formData.get('category') as string
        const contentCategory = formData.get('contentCategory') as string
        const skillLevel = formData.get('skillLevel') as string || 'Beginner'
        const duration = parseInt(formData.get('duration') as string || '0')
        const language = formData.get('language') as string || 'en'
        const price = parseFloat(formData.get('price') as string)
        const thumbnail = formData.get('thumbnail') as File | null

        // Validation
        if (!title || !description || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Handle thumbnail upload
        let thumbnailUrl: string | null = null
        if (thumbnail) {
            const bytes = await thumbnail.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            const timestamp = Date.now()
            const filename = `${timestamp}-${thumbnail.name.replace(/\s/g, '-')}`
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'courses')
            const filepath = join(uploadDir, filename)
            
            try {
                const { mkdir } = await import('fs/promises')
                // Ensure directory exists
                await mkdir(uploadDir, { recursive: true })
                await writeFile(filepath, buffer)
                thumbnailUrl = `/uploads/courses/${filename}`
            } catch (error) {
                console.error('Failed to save thumbnail:', error)
            }
        }

        // Create course
        const course = await prisma.course.create({
            data: {
                title,
                titleAr: titleAr || title,
                description,
                descriptionAr: descriptionAr || description,
                category,
                contentCategory: contentCategory as any,
                skillLevel,
                duration,
                language,
                price,
                thumbnail: thumbnailUrl,
                syllabus: [], // Empty syllabus, will be filled later
                status: 'DRAFT',
                creatorId: creator.id
            }
        })

        return NextResponse.json({
            success: true,
            courseId: course.id,
            message: 'Course created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Failed to create course:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
