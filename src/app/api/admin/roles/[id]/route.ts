import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRoleSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional()
})

const assignUserSchema = z.object({
    userId: z.string(),
    action: z.enum(['assign', 'unassign'])
})

// GET: Get a specific role
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const role = await prisma.adminRole.findUnique({
            where: { id },
            include: {
                admins: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profileImage: true,
                                createdAt: true
                            }
                        }
                    }
                }
            }
        })

        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: {
                id: role.id,
                name: role.name,
                type: role.type,
                description: role.description,
                permissions: role.modules,
                isSystem: role.isSystem,
                createdAt: role.createdAt.toISOString(),
                admins: role.admins.map((a: { user: { id: string; name: string; email: string; profileImage: string | null }; assignedAt: Date }) => ({
                    id: a.user.id,
                    name: a.user.name,
                    email: a.user.email,
                    avatar: a.user.profileImage,
                    assignedAt: a.assignedAt.toISOString()
                }))
            }
        })

    } catch (error) {
        console.error('Error fetching role:', error)
        return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 })
    }
}

// PUT: Update a role
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const body = await req.json()

        // Check if this is a user assignment request
        if (body.userId && body.action) {
            const assignData = assignUserSchema.parse(body)
            
            if (assignData.action === 'assign') {
                // Check if user exists and is an admin
                const user = await prisma.user.findUnique({
                    where: { id: assignData.userId }
                })

                if (!user) {
                    return NextResponse.json({ error: 'User not found' }, { status: 404 })
                }

                // Make user an admin if not already
                if (user.role !== 'ADMIN') {
                    await prisma.user.update({
                        where: { id: assignData.userId },
                        data: { role: 'ADMIN' }
                    })
                }

                // Remove existing role assignments for this user
                await prisma.adminAssignment.deleteMany({
                    where: { userId: assignData.userId }
                })

                // Create new assignment
                await prisma.adminAssignment.create({
                    data: {
                        userId: assignData.userId,
                        roleId: id,
                        assignedBy: session.user.id
                    }
                })

                return NextResponse.json({
                    success: true,
                    message: 'User assigned to role successfully'
                })
            } else {
                // Unassign user from role
                await prisma.adminAssignment.deleteMany({
                    where: {
                        userId: assignData.userId,
                        roleId: id
                    }
                })

                return NextResponse.json({
                    success: true,
                    message: 'User unassigned from role successfully'
                })
            }
        }

        // Regular role update
        const data = updateRoleSchema.parse(body)

        // Check if role exists
        const existingRole = await prisma.adminRole.findUnique({
            where: { id }
        })

        if (!existingRole) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 })
        }

        // System roles can only have permissions updated
        if (existingRole.isSystem && data.name) {
            return NextResponse.json({ error: 'Cannot rename system roles' }, { status: 400 })
        }

        // Check name uniqueness if changing name
        if (data.name && data.name !== existingRole.name) {
            const nameExists = await prisma.adminRole.findUnique({
                where: { name: data.name }
            })
            if (nameExists) {
                return NextResponse.json({ error: 'A role with this name already exists' }, { status: 400 })
            }
        }

        // Update the role
        const updatedRole = await prisma.adminRole.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                modules: data.permissions
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                id: updatedRole.id,
                name: updatedRole.name,
                type: updatedRole.type,
                description: updatedRole.description,
                permissions: updatedRole.modules,
                isSystem: updatedRole.isSystem
            }
        })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Error updating role:', error)
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }
}

// DELETE: Delete a role
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const role = await prisma.adminRole.findUnique({
            where: { id },
            include: { _count: { select: { admins: true } } }
        })

        if (!role) {
            return NextResponse.json({ error: 'Role not found' }, { status: 404 })
        }

        if (role.isSystem) {
            return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 })
        }

        if (role._count.admins > 0) {
            return NextResponse.json({ 
                error: 'Cannot delete role with assigned users. Please reassign users first.' 
            }, { status: 400 })
        }

        await prisma.adminRole.delete({
            where: { id }
        })

        return NextResponse.json({
            success: true,
            message: 'Role deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting role:', error)
        return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
    }
}
