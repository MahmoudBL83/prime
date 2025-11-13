import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const transcriptSchema = z.object({
    videoUrl: z.string().url(),
    language: z.enum(['ar', 'en']).default('ar')
})

/**
 * POST /api/creator/courses/[id]/transcripts
 * 
 * Generate transcript for a video using OpenAI Whisper
 * In production, this would call OpenAI Whisper API or similar service
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
        }

        const courseId = params.id
        const body = await request.json()
        const { videoUrl, language } = transcriptSchema.parse(body)

        // Verify course ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course || course.creatorId !== creator.id) {
            return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 })
        }

        // TODO: In production, call OpenAI Whisper API
        // const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        //         'Content-Type': 'multipart/form-data'
        //     },
        //     body: formData
        // })

        // For now, return mock transcript
        const mockTranscript = language === 'ar' 
            ? `مرحباً بكم في هذه الدورة التدريبية. سنتعلم اليوم عن ${course.title}.

في البداية، دعونا نفهم الأساسيات. هذا الموضوع مهم جداً لأنه يساعدنا على فهم المفاهيم المتقدمة.

سنغطي عدة نقاط رئيسية:
- النقطة الأولى: الأساسيات
- النقطة الثانية: التطبيقات العملية
- النقطة الثالثة: أمثلة واقعية

دعونا نبدأ بالنقطة الأولى...`
            : `Welcome to this training course. Today we will learn about ${course.title}.

First, let's understand the basics. This topic is very important because it helps us understand advanced concepts.

We will cover several main points:
- First point: Fundamentals
- Second point: Practical applications
- Third point: Real-world examples

Let's start with the first point...`

        return NextResponse.json({
            success: true,
            transcript: mockTranscript,
            language,
            wordCount: mockTranscript.split(/\s+/).length,
            characterCount: mockTranscript.length,
            estimatedDuration: Math.ceil(mockTranscript.split(/\s+/).length / 130) // ~130 words per minute
        })

    } catch (error) {
        console.error('Transcript generation error:', error)
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Invalid request data',
                details: error.errors
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to generate transcript'
        }, { status: 500 })
    }
}

/**
 * GET /api/creator/courses/[id]/transcripts?lessonId=xxx
 * 
 * Get transcript for a specific lesson
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const lessonId = searchParams.get('lessonId')

        if (!lessonId) {
            return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
        }

        // Get lesson with transcript
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                section: {
                    include: {
                        course: {
                            select: {
                                creatorId: true
                            }
                        }
                    }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        // Verify creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator || lesson.section.course.creatorId !== creator.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Get transcript from lesson metadata (stored in JSON field)
        const transcript = lesson.transcript || null

        return NextResponse.json({
            success: true,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            transcript,
            hasTranscript: !!transcript
        })

    } catch (error) {
        console.error('Get transcript error:', error)
        return NextResponse.json({
            error: 'Failed to get transcript'
        }, { status: 500 })
    }
}

/**
 * PUT /api/creator/courses/[id]/transcripts
 * 
 * Update/save edited transcript
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { lessonId, transcript } = body

        if (!lessonId || !transcript) {
            return NextResponse.json({ error: 'Lesson ID and transcript required' }, { status: 400 })
        }

        // Verify creator ownership
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                section: {
                    include: {
                        course: {
                            select: {
                                creatorId: true
                            }
                        }
                    }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator || lesson.section.course.creatorId !== creator.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Update transcript
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcript: transcript
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Transcript updated successfully'
        })

    } catch (error) {
        console.error('Update transcript error:', error)
        return NextResponse.json({
            error: 'Failed to update transcript'
        }, { status: 500 })
    }
}
