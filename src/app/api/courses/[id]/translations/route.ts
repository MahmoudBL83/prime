import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Multi-Language Course Variants API
 * Manage course translations and language-specific content
 * GET/POST/PATCH /api/courses/[id]/translations
 */

const translationSchema = z.object({
    language: z.string().min(2).max(5), // e.g., 'en', 'ar', 'fr'
    title: z.string().min(1),
    description: z.string().optional(),
    curriculum: z.string().optional(),
    shortDescription: z.string().optional()
})

// GET: Get all translations for a course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: courseId } = await params

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: {
                id: true,
                title: true,
                titleAr: true,
                description: true,
                descriptionAr: true,
                curriculum: true,
                curriculumAr: true,
                shortDescription: true,
                shortDescriptionAr: true,
                lessons: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        description: true,
                        descriptionAr: true,
                        transcript: true,
                        transcriptAr: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Structure translations by language
        const translations = {
            en: {
                language: 'en',
                title: course.title,
                description: course.description,
                curriculum: course.curriculum,
                shortDescription: course.shortDescription,
                lessons: course.lessons.map(l => ({
                    id: l.id,
                    title: l.title,
                    description: l.description,
                    transcript: l.transcript
                }))
            },
            ar: {
                language: 'ar',
                title: course.titleAr,
                description: course.descriptionAr,
                curriculum: course.curriculumAr,
                shortDescription: course.shortDescriptionAr,
                lessons: course.lessons.map(l => ({
                    id: l.id,
                    title: l.titleAr,
                    description: l.descriptionAr,
                    transcript: l.transcriptAr
                }))
            }
        }

        // Calculate translation completeness
        const arTranslated = [
            course.titleAr,
            course.descriptionAr
        ].filter(Boolean).length

        const completeness = {
            ar: Math.round((arTranslated / 2) * 100)
        }

        return NextResponse.json({
            courseId,
            translations,
            availableLanguages: ['en', 'ar'],
            completeness
        })
    } catch (error) {
        console.error('Get translations error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch translations' },
            { status: 500 }
        )
    }
}

// POST: Add or update a translation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: courseId } = await params
        const body = await request.json()
        const parsed = translationSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
        }

        // Verify ownership
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        const course = await prisma.course.findFirst({
            where: {
                id: courseId,
                creatorId: creator?.id
            }
        })

        if (!course && session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Course not found or unauthorized' },
                { status: 404 }
            )
        }

        const { language, title, description, curriculum, shortDescription } = parsed.data

        // Update based on language
        let updateData: any = {}

        if (language === 'ar') {
            updateData = {
                titleAr: title,
                descriptionAr: description,
                curriculumAr: curriculum,
                shortDescriptionAr: shortDescription
            }
        } else if (language === 'en') {
            updateData = {
                title,
                description,
                curriculum,
                shortDescription
            }
        } else {
            // For other languages, store in metadata
            const existingMeta = (course?.metadata as any) || {}
            existingMeta.translations = existingMeta.translations || {}
            existingMeta.translations[language] = {
                title,
                description,
                curriculum,
                shortDescription,
                updatedAt: new Date().toISOString()
            }
            updateData = { metadata: existingMeta }
        }

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: updateData
        })

        return NextResponse.json({
            message: `${language.toUpperCase()} translation updated successfully`,
            courseId: updatedCourse.id
        })
    } catch (error) {
        console.error('Update translation error:', error)
        return NextResponse.json(
            { error: 'Failed to update translation' },
            { status: 500 }
        )
    }
}

// PATCH: Update lesson translations
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: courseId } = await params
        const body = await request.json()
        const { lessonId, language, title, description, transcript } = body

        if (!lessonId || !language) {
            return NextResponse.json(
                { error: 'lessonId and language are required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: {
                    id: courseId,
                    creatorId: creator?.id
                }
            }
        })

        if (!lesson && session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Lesson not found or unauthorized' },
                { status: 404 }
            )
        }

        // Update based on language
        let updateData: any = {}

        if (language === 'ar') {
            if (title) updateData.titleAr = title
            if (description) updateData.descriptionAr = description
            if (transcript) updateData.transcriptAr = transcript
        } else if (language === 'en') {
            if (title) updateData.title = title
            if (description) updateData.description = description
            if (transcript) updateData.transcript = transcript
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: updateData
        })

        return NextResponse.json({
            message: `Lesson ${language.toUpperCase()} translation updated`,
            lessonId: updatedLesson.id
        })
    } catch (error) {
        console.error('Update lesson translation error:', error)
        return NextResponse.json(
            { error: 'Failed to update lesson translation' },
            { status: 500 }
        )
    }
}
