import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const courseId = id
        const isDemoAccess = request.nextUrl.searchParams.get('demo') === 'true'

        // For demo access, we don't require authentication
        let session = null
        if (!isDemoAccess) {
            session = await getServerSession(authOptions)
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        // Fetch course with lessons and user progress
        const course = await prisma.course.findUnique({
            where: {
                id: courseId,
                status: 'PUBLISHED',
            },
            include: {
                lessons: {
                    orderBy: {
                        order: 'asc'
                    }
                },
                enrollments: session ? {
                    where: {
                        userId: session.user.id
                    }
                } : undefined
            }
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Check if user is enrolled or if this is a demo access
        const enrollment = course.enrollments?.[0]

        if (!enrollment && !isDemoAccess) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
        }

        // Parse completed lessons from enrollment (or empty array for demo)
        const completedLessons = enrollment?.completedLessons
            ? JSON.parse(enrollment.completedLessons)
            : []

        // Transform the data to include completion status and progress
        const transformedCourse = {
            id: course.id,
            title: course.title,
            titleAr: course.titleAr,
            description: course.description,
            descriptionAr: course.descriptionAr,
            thumbnail: course.thumbnail,
            totalDuration: course.lessons.reduce((total, lesson) => total + lesson.duration, 0),
            totalLessons: course.lessons.length,
            progress: enrollment?.progress || 0,
            modules: [{
                id: course.id,
                title: course.title,
                titleAr: course.titleAr,
                description: course.description,
                descriptionAr: course.descriptionAr,
                order: 0,
                lessons: course.lessons.map((lesson: any) => {
                    // Determine lesson type based on title keywords
                    let lessonType = 'video' // default
                    let additionalData = {}

                    const title = lesson.title.toLowerCase()

                    if (title.includes('quiz') || title.includes('knowledge check') || title.includes('اختبار')) {
                        lessonType = 'quiz'
                        additionalData = {
                            quiz: {
                                questions: [
                                    {
                                        id: 'q1',
                                        question: 'What is the main concept of this lesson?',
                                        questionAr: 'ما هو المفهوم الرئيسي لهذا الدرس؟',
                                        type: 'multiple-choice',
                                        options: [
                                            { id: 'a', text: 'Option A', textAr: 'الخيار أ', isCorrect: false },
                                            { id: 'b', text: 'Option B', textAr: 'الخيار ب', isCorrect: true },
                                            { id: 'c', text: 'Option C', textAr: 'الخيار ج', isCorrect: false }
                                        ],
                                        explanation: 'This explains the correct answer.',
                                        explanationAr: 'هذا يوضح الإجابة الصحيحة.'
                                    }
                                ],
                                passingScore: 70
                            }
                        }
                    } else if (title.includes('assignment') || title.includes('مهمة') || title.includes('تحليل')) {
                        lessonType = 'assignment'
                        additionalData = {
                            assignment: {
                                title: lesson.title,
                                titleAr: lesson.titleAr,
                                description: lesson.description || 'Complete this assignment',
                                descriptionAr: lesson.descriptionAr || 'أكمل هذه المهمة',
                                instructions: 'Please follow the instructions carefully and submit your work.',
                                instructionsAr: 'يرجى اتباع التعليمات بعناية وتقديم عملك.',
                                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                                maxPoints: 100,
                                allowedFileTypes: ['pdf', 'doc', 'docx'],
                                maxFileSize: 10
                            }
                        }
                    } else if (title.includes('reading') || title.includes('fundamentals') || title.includes('أساسيات') || title.includes('guide')) {
                        lessonType = 'reading'
                        additionalData = {
                            reading: {
                                content: `<h2>${lesson.title}</h2><p>This is comprehensive reading material about ${lesson.title}. This content helps you understand the fundamentals and core concepts.</p><p>Study this material carefully to grasp the key concepts and principles.</p>`,
                                contentAr: `<h2>${lesson.titleAr}</h2><p>هذه مادة قراءة شاملة حول ${lesson.titleAr}. يساعدك هذا المحتوى على فهم الأساسيات والمفاهيم الأساسية.</p><p>ادرس هذه المادة بعناية لفهم المفاهيم والمبادئ الرئيسية.</p>`,
                                estimatedReadingTime: Math.floor(lesson.duration / 60),
                                keyPoints: [
                                    { text: 'Key concept 1', textAr: 'المفهوم الرئيسي 1' },
                                    { text: 'Key concept 2', textAr: 'المفهوم الرئيسي 2' }
                                ]
                            }
                        }
                    }

                    return {
                        id: lesson.id,
                        title: lesson.title,
                        titleAr: lesson.titleAr,
                        description: lesson.description,
                        descriptionAr: lesson.descriptionAr,
                        order: lesson.order,
                        duration: lesson.duration,
                        type: lessonType,
                        videoUrl: lesson.videoUrl,
                        isCompleted: completedLessons.includes(lesson.id),
                        moduleId: course.id,
                        objectives: [],
                        resources: JSON.parse(lesson.resources || '[]'),
                        transcript: lesson.transcript,
                        transcriptAr: lesson.transcriptAr,
                        ...additionalData
                    }
                })
            }]
        }

        return NextResponse.json({ course: transformedCourse })
    } catch (error) {
        console.error('Error fetching course for learning:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
