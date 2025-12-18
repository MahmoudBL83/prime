import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CreatorCredentialType } from '@prisma/client'

/**
 * GET /api/creator/credentials
 * Get all credentials for the authenticated creator
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Get all credentials for this creator
        const credentials = await prisma.creatorCredential.findMany({
            where: { creatorId: creator.id },
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json({
            success: true,
            credentials
        })

    } catch (error) {
        console.error('Get credentials error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/creator/credentials
 * Add a new credential for the authenticated creator
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

        // Get creator
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
            isPublic,
            sortOrder
        } = body

        // Validate required fields
        if (!title || !institution) {
            return NextResponse.json(
                { error: 'Title and institution are required' },
                { status: 400 }
            )
        }

        // Validate type is a valid CreatorCredentialType
        const validTypes: CreatorCredentialType[] = ['DEGREE', 'DIPLOMA', 'CERTIFICATE', 'LICENSE', 'COURSE', 'AWARD', 'PUBLICATION', 'OTHER']
        const credentialType = validTypes.includes(type as CreatorCredentialType) ? type : 'CERTIFICATE'

        // Create credential
        const credential = await prisma.creatorCredential.create({
            data: {
                creatorId: creator.id,
                type: credentialType as CreatorCredentialType,
                title,
                titleAr: titleAr || null,
                institution,
                institutionAr: institutionAr || null,
                description: description || null,
                descriptionAr: descriptionAr || null,
                issueDate: issueDate ? new Date(issueDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                credentialId: credentialId || null,
                credentialUrl: credentialUrl || null,
                documentUrl: documentUrl || null,
                isVerified: false, // Creator-added credentials are not verified by default
                isPublic: isPublic !== false,
                sortOrder: sortOrder || 0
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Credential added successfully',
            credential
        })

    } catch (error) {
        console.error('Add credential error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/creator/credentials
 * Update an existing credential for the authenticated creator
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator
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
        const {
            id,
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
            isPublic,
            sortOrder
        } = body

        if (!id) {
            return NextResponse.json(
                { error: 'Credential ID is required' },
                { status: 400 }
            )
        }

        // Verify the credential belongs to this creator
        const existingCredential = await prisma.creatorCredential.findFirst({
            where: {
                id,
                creatorId: creator.id
            }
        })

        if (!existingCredential) {
            return NextResponse.json(
                { error: 'Credential not found or does not belong to you' },
                { status: 404 }
            )
        }

        // Validate type if provided
        const validTypes: CreatorCredentialType[] = ['DEGREE', 'DIPLOMA', 'CERTIFICATE', 'LICENSE', 'COURSE', 'AWARD', 'PUBLICATION', 'OTHER']
        const credentialType = type && validTypes.includes(type as CreatorCredentialType) 
            ? type as CreatorCredentialType 
            : existingCredential.type

        // Update credential
        const updatedCredential = await prisma.creatorCredential.update({
            where: { id },
            data: {
                type: credentialType,
                title: title || existingCredential.title,
                titleAr: titleAr !== undefined ? titleAr : existingCredential.titleAr,
                institution: institution || existingCredential.institution,
                institutionAr: institutionAr !== undefined ? institutionAr : existingCredential.institutionAr,
                description: description !== undefined ? description : existingCredential.description,
                descriptionAr: descriptionAr !== undefined ? descriptionAr : existingCredential.descriptionAr,
                issueDate: issueDate !== undefined ? (issueDate ? new Date(issueDate) : null) : existingCredential.issueDate,
                expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existingCredential.expiryDate,
                credentialId: credentialId !== undefined ? credentialId : existingCredential.credentialId,
                credentialUrl: credentialUrl !== undefined ? credentialUrl : existingCredential.credentialUrl,
                documentUrl: documentUrl !== undefined ? documentUrl : existingCredential.documentUrl,
                isPublic: isPublic !== undefined ? isPublic : existingCredential.isPublic,
                sortOrder: sortOrder !== undefined ? sortOrder : existingCredential.sortOrder,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Credential updated successfully',
            credential: updatedCredential
        })

    } catch (error) {
        console.error('Update credential error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/creator/credentials
 * Delete a credential for the authenticated creator
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator
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
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Credential ID is required' },
                { status: 400 }
            )
        }

        // Verify the credential belongs to this creator
        const existingCredential = await prisma.creatorCredential.findFirst({
            where: {
                id,
                creatorId: creator.id
            }
        })

        if (!existingCredential) {
            return NextResponse.json(
                { error: 'Credential not found or does not belong to you' },
                { status: 404 }
            )
        }

        // Delete credential
        await prisma.creatorCredential.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Credential deleted successfully'
        })

    } catch (error) {
        console.error('Delete credential error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
