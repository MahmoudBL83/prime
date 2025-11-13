import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/mentors/[id]/resources - Get pinned resources
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: mentorId } = await context.params

        const resources = await prisma.communityResource.findMany({
            where: {
                creatorId: mentorId,
                isPinned: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({ resources })

    } catch (error) {
        console.error('Error fetching resources:', error)
        return NextResponse.json(
            { error: 'Failed to fetch resources' },
            { status: 500 }
        )
    }
}

// POST /api/mentors/[id]/resources - Create a resource
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        
        // Verify user is the mentor/creator
        const creator = await prisma.creator.findUnique({
            where: { id: mentorId },
            select: { userId: true }
        })

        if (!creator || creator.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized - You can only add resources to your own profile' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { title, titleAr, type, size, url, isPinned } = body

        if (!title || !type || !url) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const resource = await prisma.communityResource.create({
            data: {
                creatorId: mentorId,
                title,
                titleAr,
                type,
                size,
                url,
                isPinned: isPinned || false,
                downloads: 0
            }
        })

        return NextResponse.json({
            resource,
            message: 'Resource created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('Error creating resource:', error)
        return NextResponse.json(
            { error: 'Failed to create resource' },
            { status: 500 }
        )
    }
}

// PUT /api/mentors/[id]/resources - Update a resource
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        const body = await request.json()
        const { resourceId, ...updateData } = body

        if (!resourceId) {
            return NextResponse.json(
                { error: 'Resource ID required' },
                { status: 400 }
            )
        }

        // Verify user owns the resource
        const resource = await prisma.communityResource.findUnique({
            where: { id: resourceId }
        })

        if (!resource || resource.creatorId !== mentorId) {
            return NextResponse.json(
                { error: 'Resource not found' },
                { status: 404 }
            )
        }

        if (session.user.id !== mentorId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        const updatedResource = await prisma.communityResource.update({
            where: { id: resourceId },
            data: updateData
        })

        return NextResponse.json({
            resource: updatedResource,
            message: 'Resource updated successfully'
        })

    } catch (error) {
        console.error('Error updating resource:', error)
        return NextResponse.json(
            { error: 'Failed to update resource' },
            { status: 500 }
        )
    }
}

// DELETE /api/mentors/[id]/resources
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: mentorId } = await context.params
        const { searchParams } = new URL(request.url)
        const resourceId = searchParams.get('resourceId')

        if (!resourceId) {
            return NextResponse.json(
                { error: 'Resource ID required' },
                { status: 400 }
            )
        }

        // Verify user owns the resource
        const resource = await prisma.communityResource.findUnique({
            where: { id: resourceId }
        })

        if (!resource || resource.creatorId !== mentorId) {
            return NextResponse.json(
                { error: 'Resource not found' },
                { status: 404 }
            )
        }

        // Verify user owns the resource through Creator
        const creator = await prisma.creator.findUnique({
            where: { id: mentorId },
            select: { userId: true }
        })

        if (!creator || creator.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        await prisma.communityResource.delete({
            where: { id: resourceId }
        })

        return NextResponse.json({
            message: 'Resource deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting resource:', error)
        return NextResponse.json(
            { error: 'Failed to delete resource' },
            { status: 500 }
        )
    }
}
