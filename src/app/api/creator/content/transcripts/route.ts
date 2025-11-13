import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Generate transcript for a video lesson
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { lessonId, language = 'en' } = body

        if (!lessonId) {
            return NextResponse.json(
                { error: 'Lesson ID is required' },
                { status: 400 }
            )
        }

        // Get lesson with course
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: {
                    creatorId: creator.id
                }
            },
            include: {
                course: true
            }
        })

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found or access denied' },
                { status: 404 }
            )
        }

        if (lesson.contentType !== 'VIDEO') {
            return NextResponse.json(
                { error: 'Transcripts can only be generated for video lessons' },
                { status: 400 }
            )
        }

        if (!lesson.videoUrl) {
            return NextResponse.json(
                { error: 'Lesson has no video URL' },
                { status: 400 }
            )
        }

        // Simulate transcript generation (in production, this would call an AI service)
        // For demo purposes, generate a mock transcript
        const mockTranscript = generateMockTranscript(lesson.title, language)

        // Update lesson with transcript
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcript: mockTranscript,
                transcriptLanguage: language
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Transcript generated successfully',
            data: {
                lessonId: updatedLesson.id,
                transcript: mockTranscript,
                language,
                wordCount: mockTranscript.split(' ').length
            }
        })
    } catch (error) {
        console.error('Error generating transcript:', error)
        return NextResponse.json(
            { error: 'Failed to generate transcript' },
            { status: 500 }
        )
    }
}

// GET - Fetch transcript for a lesson
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const lessonId = searchParams.get('lessonId')

        if (!lessonId) {
            return NextResponse.json(
                { error: 'Lesson ID is required' },
                { status: 400 }
            )
        }

        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: {
                    creatorId: creator.id
                }
            },
            select: {
                id: true,
                title: true,
                transcript: true,
                transcriptLanguage: true,
                videoUrl: true,
                contentType: true
            }
        })

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found or access denied' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                lessonId: lesson.id,
                title: lesson.title,
                transcript: lesson.transcript,
                language: lesson.transcriptLanguage,
                hasTranscript: !!lesson.transcript,
                wordCount: lesson.transcript ? lesson.transcript.split(' ').length : 0
            }
        })
    } catch (error) {
        console.error('Error fetching transcript:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transcript' },
            { status: 500 }
        )
    }
}

// PUT - Update transcript manually
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { lessonId, transcript, language } = body

        if (!lessonId || !transcript) {
            return NextResponse.json(
                { error: 'Lesson ID and transcript are required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: {
                    creatorId: creator.id
                }
            }
        })

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found or access denied' },
                { status: 404 }
            )
        }

        // Update transcript
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcript,
                transcriptLanguage: language || 'en'
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Transcript updated successfully',
            data: {
                lessonId: updatedLesson.id,
                wordCount: transcript.split(' ').length
            }
        })
    } catch (error) {
        console.error('Error updating transcript:', error)
        return NextResponse.json(
            { error: 'Failed to update transcript' },
            { status: 500 }
        )
    }
}

// DELETE - Remove transcript
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const lessonId = searchParams.get('lessonId')

        if (!lessonId) {
            return NextResponse.json(
                { error: 'Lesson ID is required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: {
                    creatorId: creator.id
                }
            }
        })

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found or access denied' },
                { status: 404 }
            )
        }

        // Remove transcript
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                transcript: null,
                transcriptLanguage: null
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Transcript removed successfully'
        })
    } catch (error) {
        console.error('Error removing transcript:', error)
        return NextResponse.json(
            { error: 'Failed to remove transcript' },
            { status: 500 }
        )
    }
}

// Helper function to generate mock transcript
function generateMockTranscript(title: string, language: string): string {
    if (language === 'ar') {
        return `مرحبا بكم في هذا الدرس حول ${title}. في هذا الفيديو، سنغطي المفاهيم الأساسية والتقنيات المتقدمة.

أولاً، دعونا نناقش المبادئ الأساسية. من المهم فهم الأساسيات قبل الانتقال إلى المواضيع الأكثر تعقيدًا.

الآن، دعونا ننظر إلى بعض الأمثلة العملية. كما ترون في الشاشة، يمكننا تطبيق هذه المفاهيم بعدة طرق مختلفة.

في الختام، نأمل أن تكونوا قد وجدتم هذا الدرس مفيدًا. لا تترددوا في طرح الأسئلة في قسم التعليقات.`
    } else if (language === 'de') {
        return `Willkommen zu dieser Lektion über ${title}. In diesem Video werden wir die grundlegenden Konzepte und fortgeschrittenen Techniken behandeln.

Zunächst besprechen wir die Grundprinzipien. Es ist wichtig, die Grundlagen zu verstehen, bevor wir zu komplexeren Themen übergehen.

Schauen wir uns nun einige praktische Beispiele an. Wie Sie auf dem Bildschirm sehen können, gibt es verschiedene Möglichkeiten, diese Konzepte anzuwenden.

Zusammenfassend hoffen wir, dass Sie diese Lektion hilfreich fanden. Zögern Sie nicht, Fragen im Kommentarbereich zu stellen.`
    } else {
        return `Welcome to this lesson on ${title}. In this video, we'll cover the fundamental concepts and advanced techniques.

First, let's discuss the core principles. It's important to understand the basics before moving on to more complex topics.

Now, let's look at some practical examples. As you can see on the screen, we can apply these concepts in several different ways.

To summarize, we hope you found this lesson helpful. Feel free to ask questions in the comments section below.`
    }
}
