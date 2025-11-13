import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for course creation
const createCourseSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    titleAr: z.string().min(3, 'Arabic title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    descriptionAr: z.string().min(10, 'Arabic description must be at least 10 characters').max(2000),
    category: z.string().min(1, 'Category is required'),
    skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    language: z.string().min(1, 'Language is required'),
    price: z.number().min(0, 'Price must be positive').optional(),
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
    type: z.enum(['KIDS','AMUSEMENT','LEARNING','PODCASTS','MUSIC','BUSINESS','OTHER']).optional(),
    syllabus: z.array(z.object({
        moduleTitle: z.string(),
        moduleTitleAr: z.string(),
        lessons: z.array(z.object({
            title: z.string(),
            titleAr: z.string(),
            duration: z.number().min(1),
            description: z.string().optional(),
        }))
    })).min(1, 'At least one module is required'),
    thumbnail: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is a creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: { user: true }
        })

        if (!creator) {
            return NextResponse.json({
                error: 'Creator profile not found. Please complete your creator registration.'
            }, { status: 403 })
        }

        // Check KYC status
        if (creator.kycStatus !== 'VERIFIED') {
            return NextResponse.json({
                error: 'KYC verification required before creating courses.'
            }, { status: 403 })
        }

        const body = await req.json()
        const validation = createCourseSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid input data',
                details: validation.error.issues
            }, { status: 400 })
        }

        const courseData = validation.data

        // Create course with lessons
    const course = await prisma.course.create({
            data: {
                title: courseData.title,
                titleAr: courseData.titleAr,
                description: courseData.description,
                descriptionAr: courseData.descriptionAr,
                category: courseData.category,
                skillLevel: courseData.skillLevel,
        type: courseData.type || 'LEARNING',
                language: courseData.language,
                price: courseData.price || 0,
                duration: courseData.duration,
                syllabus: courseData.syllabus,
                thumbnail: courseData.thumbnail,
                creatorId: creator.id,
                status: 'DRAFT', // Start as draft
                lessons: {
                    create: courseData.syllabus.flatMap((module, moduleIndex) =>
                        module.lessons.map((lesson, lessonIndex) => ({
                            title: lesson.title,
                            titleAr: lesson.titleAr,
                            description: lesson.description || '',
                            duration: lesson.duration,
                            order: moduleIndex * 100 + lessonIndex + 1, // Ensure proper ordering
                            videoUrl: '', // Will be updated when video is uploaded
                        }))
                    )
                }
            },
            include: {
                lessons: {
                    orderBy: { order: 'asc' }
                },
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                arabicName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            course: {
                id: course.id,
                title: course.title,
                titleAr: course.titleAr,
                status: course.status,
                lessonsCount: course.lessons.length,
                creator: {
                    name: course.creator.user.name,
                    arabicName: course.creator.user.arabicName
                }
            },
            message: 'Course created successfully. You can now upload lesson videos.'
        })

    } catch (error) {
        console.error('Course creation error:', error)
        return NextResponse.json({
            error: 'Failed to create course. Please try again.'
        }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get creator's courses
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ courses: [] })
        }

        const courses = await prisma.course.findMany({
            where: { creatorId: creator.id },
            include: {
                lessons: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        order: true,
                        duration: true,
                        videoUrl: true
                    },
                    orderBy: { order: 'asc' }
                },
                _count: {
                    select: {
                        enrollments: true,
                        lessons: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ courses })

    } catch (error) {
        console.error('Error fetching creator courses:', error)
        return NextResponse.json({
            error: 'Failed to fetch courses'
        }, { status: 500 })
    }
}
