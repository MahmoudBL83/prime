import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/creator/courses/[id]/assignments - List all assignments for a course
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
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
                { status: 403 }
            )
        }

        // Verify course ownership
        const course = await prisma.course.findFirst({
            where: {
                id,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or access denied' },
                { status: 404 }
            )
        }

        // Fetch all assignments for this course
        const assignments = await prisma.assignment.findMany({
            where: {
                courseId: id
            },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                },
                _count: {
                    select: {
                        submissions: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            assignments
        })
    } catch (error) {
        console.error('Error fetching assignments:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/creator/courses/[id]/assignments - Create a new assignment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
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
                { status: 403 }
            )
        }

        // Verify course ownership
        const course = await prisma.course.findFirst({
            where: {
                id,
                creatorId: creator.id
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found or access denied' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const {
            title,
            titleAr,
            description,
            descriptionAr,
            instructions,
            instructionsAr,
            dueDate,
            maxScore,
            allowLateSubmission,
            requireFile,
            acceptedFileTypes,
            maxFileSize,
            lessonId
        } = body

        // Validate required fields
        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title and description are required' },
                { status: 400 }
            )
        }

        // Create assignment
        const assignment = await prisma.assignment.create({
            data: {
                type: 'PROJECT', // Default type
                title,
                titleAr: titleAr || null,
                description,
                descriptionAr: descriptionAr || null,
                instructions: instructions || null,
                instructionsAr: instructionsAr || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                maxPoints: maxScore || 100,
                allowLateSubmission: allowLateSubmission ?? false,
                courseId: id,
                lessonId: lessonId || null
            },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true
                    }
                },
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            assignment
        })
    } catch (error) {
        console.error('Error creating assignment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
