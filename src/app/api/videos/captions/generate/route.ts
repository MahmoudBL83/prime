import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

/**
 * Auto-Caption Generation API
 * Generates captions/transcripts for videos using AI
 * POST /api/videos/captions/generate
 */

interface CaptionSegment {
    start: number
    end: number
    text: string
}

interface CaptionResult {
    language: string
    segments: CaptionSegment[]
    fullText: string
}

// Mock transcription function - replace with actual API call
async function transcribeVideo(videoUrl: string, language: string = 'auto'): Promise<CaptionResult> {
    // In production, integrate with:
    // - OpenAI Whisper API
    // - AssemblyAI
    // - Google Cloud Speech-to-Text
    // - AWS Transcribe

    // For demo, return mock captions
    return {
        language: language === 'auto' ? 'en' : language,
        segments: [
            { start: 0, end: 5, text: 'Welcome to this lesson.' },
            { start: 5, end: 12, text: 'Today we will learn about important concepts.' },
            { start: 12, end: 20, text: 'Let\'s get started with the basics.' },
            { start: 20, end: 30, text: 'First, we need to understand the fundamentals.' },
            { start: 30, end: 45, text: 'This is a key concept that you\'ll use throughout.' },
        ],
        fullText: 'Welcome to this lesson. Today we will learn about important concepts. Let\'s get started with the basics. First, we need to understand the fundamentals. This is a key concept that you\'ll use throughout.'
    }
}

// POST: Generate captions for a video
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { lessonId, language = 'auto', regenerate = false } = body

        if (!lessonId) {
            return NextResponse.json(
                { error: 'lessonId is required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    include: {
                        creator: true
                    }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        // Check if user owns this content or is admin
        const isOwner = lesson.course.creator.userId === session.user.id
        const isAdmin = session.user.role === 'ADMIN'

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Check if captions already exist (unless regenerating)
        if (lesson.transcript && !regenerate) {
            return NextResponse.json({
                message: 'Captions already exist. Set regenerate=true to regenerate.',
                existing: true,
                transcript: lesson.transcript
            })
        }

        // Generate captions
        const captionResult = await transcribeVideo(lesson.videoUrl, language)

        // Store captions in the lesson
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcript: captionResult.fullText,
                transcriptAr: language === 'ar' ? captionResult.fullText : lesson.transcriptAr
            }
        })

        // Create or update caption metadata (store in resources JSON)
        const resources = (lesson.resources as any) || {}
        resources.captions = {
            id: randomUUID(),
            language: captionResult.language,
            segments: captionResult.segments,
            generatedAt: new Date().toISOString(),
            status: 'completed'
        }

        await prisma.lesson.update({
            where: { id: lessonId },
            data: { resources }
        })

        return NextResponse.json({
            success: true,
            captions: {
                language: captionResult.language,
                segments: captionResult.segments,
                fullText: captionResult.fullText
            },
            message: 'Captions generated successfully'
        })
    } catch (error) {
        console.error('Caption generation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate captions' },
            { status: 500 }
        )
    }
}

// GET: Get existing captions for a lesson
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const lessonId = searchParams.get('lessonId')

        if (!lessonId) {
            return NextResponse.json(
                { error: 'lessonId is required' },
                { status: 400 }
            )
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                title: true,
                transcript: true,
                transcriptAr: true,
                resources: true
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        const resources = (lesson.resources as any) || {}

        return NextResponse.json({
            lessonId: lesson.id,
            title: lesson.title,
            transcript: lesson.transcript,
            transcriptAr: lesson.transcriptAr,
            captions: resources.captions || null,
            hasCaptions: !!lesson.transcript || !!resources.captions
        })
    } catch (error) {
        console.error('Get captions error:', error)
        return NextResponse.json(
            { error: 'Failed to get captions' },
            { status: 500 }
        )
    }
}

// PUT: Update/edit captions
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { lessonId, transcript, transcriptAr, segments } = body

        if (!lessonId) {
            return NextResponse.json(
                { error: 'lessonId is required' },
                { status: 400 }
            )
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    include: { creator: true }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        // Check ownership
        const isOwner = lesson.course.creator.userId === session.user.id
        const isAdmin = session.user.role === 'ADMIN'

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Update transcript
        const updateData: any = {}
        if (transcript !== undefined) updateData.transcript = transcript
        if (transcriptAr !== undefined) updateData.transcriptAr = transcriptAr

        // Update segments in resources if provided
        if (segments) {
            const resources = (lesson.resources as any) || {}
            resources.captions = {
                ...resources.captions,
                segments,
                editedAt: new Date().toISOString(),
                editedBy: session.user.id
            }
            updateData.resources = resources
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            lesson: {
                id: updatedLesson.id,
                transcript: updatedLesson.transcript,
                transcriptAr: updatedLesson.transcriptAr
            },
            message: 'Captions updated successfully'
        })
    } catch (error) {
        console.error('Update captions error:', error)
        return NextResponse.json(
            { error: 'Failed to update captions' },
            { status: 500 }
        )
    }
}
