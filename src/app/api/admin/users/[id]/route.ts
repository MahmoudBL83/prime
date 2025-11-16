import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

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

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: id },
            include: {
                _count: {
                    select: {
                        enrollments: true,
                        subscriptions: true,
                    }
                },
                creator: {
                    include: {
                        _count: {
                            select: {
                                courses: true,
                            }
                        }
                    }
                },
                enrollments: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        course: {
                            select: {
                                title: true,
                                titleAr: true,
                            }
                        }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ user })

    } catch (error) {
        console.error('Admin user details API error:', error)
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

        // Prevent admin from changing their own role or deleting themselves
        if (id === currentUser.id) {
            if (action === 'delete' || (updateData.role && updateData.role !== UserRole.ADMIN)) {
                return NextResponse.json(
                    { error: 'Cannot modify your own admin account' },
                    { status: 400 }
                )
            }
        }

        let updatedUser

        switch (action) {
            case 'updateRole':
                if (!updateData.role || !Object.values(UserRole).includes(updateData.role)) {
                    return NextResponse.json(
                        { error: 'Invalid role specified' },
                        { status: 400 }
                    )
                }

                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { role: updateData.role }
                })
                break

            case 'updateProfile':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: {
                        name: updateData.name,
                        arabicName: updateData.arabicName,
                        phone: updateData.phone,
                        bio: updateData.bio,
                    }
                })
                break

            case 'verifyEmail':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { emailVerified: new Date() }
                })
                break

            case 'unverifyEmail':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { emailVerified: null }
                })
                break

            case 'completeOnboarding':
                updatedUser = await prisma.user.update({
                    where: { id: id },
                    data: { onboardingCompleted: true } as any
                })
                break

            default:
                return NextResponse.json(
                    { error: 'Invalid action specified' },
                    { status: 400 }
                )
        }

        return NextResponse.json({
            user: updatedUser,
            message: 'User updated successfully'
        })

    } catch (error) {
        console.error('Admin user update API error:', error)
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

        // Prevent admin from deleting themselves
        if (id === currentUser.id) {
            return NextResponse.json(
                { error: 'Cannot delete your own admin account' },
                { status: 400 }
            )
        }

        // Check if user exists
        const userToDelete = await prisma.user.findUnique({
            where: { id: id }
        })

        if (!userToDelete) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Delete user and related data (this will cascade due to foreign key constraints)
        await prisma.user.delete({
            where: { id: id }
        })

        return NextResponse.json({
            message: 'User deleted successfully'
        })

    } catch (error) {
        console.error('Admin user delete API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
