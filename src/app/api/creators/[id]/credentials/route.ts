import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Fetch all credentials for a creator
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const credentials = await prisma.creatorCredential.findMany({
            where: {
                creatorId: id,
                isPublic: true
            },
            orderBy: [
                { sortOrder: 'asc' },
                { issueDate: 'desc' }
            ]
        })

        return NextResponse.json({ credentials })
    } catch (error) {
        console.error('Error fetching credentials:', error)
        return NextResponse.json(
            { error: 'Failed to fetch credentials' },
            { status: 500 }
        )
    }
}

// POST - Create a new credential (creator only)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify the user owns this creator profile
        const creator = await prisma.creator.findUnique({
            where: { id },
            select: { userId: true }
        })

        if (!creator || creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const {
            type,
            title,
            titleAr,
            institution,
            institutionAr,
            description,
            descriptionAr,
            issueDate,
            expiryDate,
            credentialId,
            credentialUrl,
            documentUrl,
            isPublic = true,
            sortOrder = 0
        } = body

        if (!type || !title || !institution) {
            return NextResponse.json(
                { error: 'Type, title, and institution are required' },
                { status: 400 }
            )
        }

        const credential = await prisma.creatorCredential.create({
            data: {
                creatorId: id,
                type,
                title,
                titleAr,
                institution,
                institutionAr,
                description,
                descriptionAr,
                issueDate: issueDate ? new Date(issueDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                credentialId,
                credentialUrl,
                documentUrl,
                isPublic,
                sortOrder
            }
        })

        return NextResponse.json({ credential }, { status: 201 })
    } catch (error) {
        console.error('Error creating credential:', error)
        return NextResponse.json(
            { error: 'Failed to create credential' },
            { status: 500 }
        )
    }
}

// PUT - Update a credential
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { credentialId, ...updateData } = body

        if (!credentialId) {
            return NextResponse.json(
                { error: 'Credential ID is required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const credential = await prisma.creatorCredential.findUnique({
            where: { id: credentialId },
            include: { creator: { select: { userId: true } } }
        })

        if (!credential || credential.creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Handle date conversions
        if (updateData.issueDate) {
            updateData.issueDate = new Date(updateData.issueDate)
        }
        if (updateData.expiryDate) {
            updateData.expiryDate = new Date(updateData.expiryDate)
        }

        const updated = await prisma.creatorCredential.update({
            where: { id: credentialId },
            data: updateData
        })

        return NextResponse.json({ credential: updated })
    } catch (error) {
        console.error('Error updating credential:', error)
        return NextResponse.json(
            { error: 'Failed to update credential' },
            { status: 500 }
        )
    }
}

// DELETE - Delete a credential
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const credentialId = searchParams.get('credentialId')

        if (!credentialId) {
            return NextResponse.json(
                { error: 'Credential ID is required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const credential = await prisma.creatorCredential.findUnique({
            where: { id: credentialId },
            include: { creator: { select: { userId: true } } }
        })

        if (!credential || credential.creator.userId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.creatorCredential.delete({
            where: { id: credentialId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting credential:', error)
        return NextResponse.json(
            { error: 'Failed to delete credential' },
            { status: 500 }
        )
    }
}
