import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/applications/[id]
 * Get single application details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const application = await prisma.creatorApplication.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        arabicName: true,
                        profileImage: true,
                        bio: true,
                        phone: true,
                        createdAt: true
                    }
                }
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            application
        })
    } catch (error) {
        console.error('Error fetching application:', error)
        return NextResponse.json(
            { error: 'Failed to fetch application' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/admin/applications/[id]
 * Update application status (approve, reject, request resubmission)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { action, reviewNotes, rejectionReason } = body

        // Validate action
        if (!['approve', 'reject', 'resubmit', 'review'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const application = await prisma.creatorApplication.findUnique({
            where: { id },
            include: {
                user: true
            }
        })

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        let newStatus: string
        let updateData: any = {
            reviewedAt: new Date(),
            reviewedBy: session.user.id,
            reviewNotes
        }

        switch (action) {
            case 'approve':
                newStatus = 'APPROVED'
                
                // Create creator profile
                const creator = await prisma.creator.create({
                    data: {
                        userId: application.userId,
                        expertise: application.expertise,
                        kycStatus: 'NOT_STARTED',
                        contractSigned: false,
                        totalEarnings: 0,
                        totalSubscribers: 0
                    }
                })

                // Update user role to CREATOR
                await prisma.user.update({
                    where: { id: application.userId },
                    data: { role: 'CREATOR' }
                })

                // Mark application as approved
                updateData.status = 'APPROVED'
                updateData.kycVerified = false
                
                // TODO: Send approval email with next steps (KYC, contract signing)
                
                break

            case 'reject':
                if (!rejectionReason) {
                    return NextResponse.json({ 
                        error: 'Rejection reason is required' 
                    }, { status: 400 })
                }
                newStatus = 'REJECTED'
                updateData.status = 'REJECTED'
                updateData.rejectionReason = rejectionReason
                
                // TODO: Send rejection email
                
                break

            case 'resubmit':
                if (!reviewNotes) {
                    return NextResponse.json({ 
                        error: 'Review notes are required when requesting resubmission' 
                    }, { status: 400 })
                }
                newStatus = 'RESUBMIT_REQUIRED'
                updateData.status = 'RESUBMIT_REQUIRED'
                
                // TODO: Send resubmission request email
                
                break

            case 'review':
                newStatus = 'UNDER_REVIEW'
                updateData.status = 'UNDER_REVIEW'
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        const updatedApplication = await prisma.creatorApplication.update({
            where: { id },
            data: updateData
        })

        return NextResponse.json({
            success: true,
            message: `Application ${action}d successfully`,
            application: updatedApplication
        })

    } catch (error) {
        console.error('Error updating application:', error)
        return NextResponse.json(
            { error: 'Failed to update application' },
            { status: 500 }
        )
    }
}
