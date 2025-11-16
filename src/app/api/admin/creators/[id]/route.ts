import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, KYCStatus } from '@prisma/client'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Get creator details with all related data
        const creator = await prisma.creator.findUnique({
            where: { id: id },
            include: {
                user: true,
                courses: {
                    include: {
                        _count: {
                            select: {
                                enrollments: true,
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: {
                        courses: true,
                    }
                }
            }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator not found' },
                { status: 404 }
            )
        }

        // Transform the data to include totalEnrollments for each course
        const transformedCreator = {
            ...creator,
            courses: creator.courses.map(course => ({
                ...course,
                totalEnrollments: course._count.enrollments
            }))
        }

        return NextResponse.json({ creator: transformedCreator })

    } catch (error) {
        console.error('Admin creator details API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { action, ...updateData } = body

        let updatedCreator

        switch (action) {
            case 'kyc_approve':
                updatedCreator = await prisma.creator.update({
                    where: { id: id },
                    data: {
                        kycStatus: KYCStatus.VERIFIED,
                        updatedAt: new Date()
                    }
                })

                // TODO: Send approval email to creator
                break

            case 'kyc_reject':
                updatedCreator = await prisma.creator.update({
                    where: { id: id },
                    data: {
                        kycStatus: KYCStatus.REJECTED,
                        updatedAt: new Date()
                    }
                })

                // TODO: Send rejection email with reason to creator
                break

            case 'updateProfile':
                updatedCreator = await prisma.creator.update({
                    where: { id: id },
                    data: {
                        expertise: updateData.expertise,
                        teachingGoals: updateData.teachingGoals,
                        bankAccountIBAN: updateData.bankAccountIBAN,
                        bankName: updateData.bankName,
                        updatedAt: new Date()
                    }
                })
                break

            case 'signContract':
                updatedCreator = await prisma.creator.update({
                    where: { id: id },
                    data: {
                        contractSigned: true,
                        contractSignedAt: new Date(),
                        updatedAt: new Date()
                    }
                })
                break

            case 'updateEarnings':
                if (typeof updateData.totalEarnings !== 'number') {
                    return NextResponse.json(
                        { error: 'Invalid earnings amount' },
                        { status: 400 }
                    )
                }

                updatedCreator = await prisma.creator.update({
                    where: { id: id },
                    data: {
                        totalEarnings: updateData.totalEarnings,
                        updatedAt: new Date()
                    }
                })
                break

            case 'updateSubscribers':
                if (typeof updateData.totalSubscribers !== 'number') {
                    return NextResponse.json(
                        { error: 'Invalid subscribers count' },
                        { status: 400 }
                    )
                }

                updatedCreator = await prisma.creator.update({
                    where: { id: id },
                    data: {
                        totalSubscribers: updateData.totalSubscribers,
                        updatedAt: new Date()
                    }
                })
                break

            default:
                return NextResponse.json(
                    { error: 'Invalid action specified' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            creator: updatedCreator,
            message: 'Creator updated successfully'
        })

    } catch (error) {
        console.error('Admin creator update API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Verify admin authentication
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Get current user from database
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        // Check if creator exists
        const creatorToDelete = await prisma.creator.findUnique({
            where: { id: id },
            include: {
                user: true,
                courses: true
            }
        })

        if (!creatorToDelete) {
            return NextResponse.json(
                { error: 'Creator not found' },
                { status: 404 }
            )
        }

        // Check if creator has active courses
        if (creatorToDelete.courses.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete creator with active courses. Please remove courses first.' },
                { status: 400 }
            )
        }

        // Delete creator record (this will not delete the user, just the creator profile)
        await prisma.creator.delete({
            where: { id: id }
        })

        // Optionally, update the user role back to LEARNER
        await prisma.user.update({
            where: { id: creatorToDelete.userId },
            data: { role: UserRole.LEARNER }
        })

        return NextResponse.json({
            message: 'Creator profile deleted successfully. User account converted back to learner.'
        })

    } catch (error) {
        console.error('Admin creator delete API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
