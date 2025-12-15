import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Permission categories and their permissions
const PERMISSION_DEFINITIONS = {
    users: {
        label: 'Users',
        permissions: {
            'users.view': { label: 'View Users', description: 'View user profiles and data' },
            'users.edit': { label: 'Edit Users', description: 'Modify user information' },
            'users.delete': { label: 'Delete Users', description: 'Permanently delete user accounts' },
            'users.ban': { label: 'Ban Users', description: 'Suspend or ban user accounts' }
        }
    },
    creators: {
        label: 'Creators',
        permissions: {
            'creators.view': { label: 'View Creators', description: 'View creator profiles and applications' },
            'creators.edit': { label: 'Edit Creators', description: 'Modify creator information' },
            'creators.approve': { label: 'Approve Creators', description: 'Approve creator applications' },
            'creators.ban': { label: 'Ban Creators', description: 'Suspend creator accounts' }
        }
    },
    content: {
        label: 'Content',
        permissions: {
            'content.view': { label: 'View Content', description: 'View all courses and content' },
            'content.edit': { label: 'Edit Content', description: 'Modify course content' },
            'content.approve': { label: 'Approve Content', description: 'Approve/reject content submissions' },
            'content.delete': { label: 'Delete Content', description: 'Remove content from platform' }
        }
    },
    financial: {
        label: 'Financial',
        permissions: {
            'financial.view': { label: 'View Financial', description: 'View revenue and transactions' },
            'financial.edit': { label: 'Edit Financial', description: 'Modify pricing and revenue settings' },
            'financial.payouts': { label: 'Process Payouts', description: 'Approve and process creator payouts' }
        }
    },
    analytics: {
        label: 'Analytics',
        permissions: {
            'analytics.view': { label: 'View Analytics', description: 'Access platform analytics' },
            'analytics.export': { label: 'Export Analytics', description: 'Export analytics reports' }
        }
    },
    settings: {
        label: 'Settings',
        permissions: {
            'settings.view': { label: 'View Settings', description: 'View platform settings' },
            'settings.edit': { label: 'Edit Settings', description: 'Modify platform configuration' }
        }
    },
    safety: {
        label: 'Safety',
        permissions: {
            'safety.view': { label: 'View Reports', description: 'View safety reports' },
            'safety.moderate': { label: 'Moderate Content', description: 'Review and moderate flagged content' },
            'safety.ban': { label: 'Ban Users', description: 'Take enforcement actions' }
        }
    },
    rewards: {
        label: 'Rewards',
        permissions: {
            'rewards.view': { label: 'View Rewards', description: 'View rewards and scholarships' },
            'rewards.edit': { label: 'Edit Rewards', description: 'Create and modify rewards' },
            'rewards.approve': { label: 'Approve Winners', description: 'Approve reward winners' }
        }
    },
    channels: {
        label: 'Channels',
        permissions: {
            'channels.view': { label: 'View Channels', description: 'View membership channels' },
            'channels.approve': { label: 'Approve Channels', description: 'Approve channel applications' },
            'channels.moderate': { label: 'Moderate Channels', description: 'Moderate channel content' }
        }
    },
    signature: {
        label: 'Signature',
        permissions: {
            'signature.view': { label: 'View Courses', description: 'View signature courses' },
            'signature.curate': { label: 'Curate Content', description: 'Curate and review courses' },
            'signature.publish': { label: 'Publish Courses', description: 'Approve for publication' }
        }
    }
}

// Default permissions for each role type
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    SUPER_ADMIN: Object.values(PERMISSION_DEFINITIONS).flatMap(cat => Object.keys(cat.permissions)),
    CONTENT_ADMIN: ['content.view', 'content.edit', 'content.approve', 'content.delete', 'creators.view', 'users.view', 'signature.view', 'signature.curate', 'signature.publish'],
    SAFETY_ADMIN: ['safety.view', 'safety.moderate', 'safety.ban', 'users.view', 'users.ban', 'content.view'],
    FINANCE_ADMIN: ['financial.view', 'financial.edit', 'financial.payouts', 'creators.view', 'analytics.view', 'analytics.export'],
    SUPPORT_ADMIN: ['users.view', 'users.edit', 'creators.view', 'creators.edit', 'content.view'],
    CUSTOM: []
}

// Role colors by type
const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: 'from-red-600 to-pink-600',
    CONTENT_ADMIN: 'from-blue-600 to-cyan-600',
    SAFETY_ADMIN: 'from-purple-600 to-pink-600',
    FINANCE_ADMIN: 'from-green-600 to-emerald-600',
    SUPPORT_ADMIN: 'from-indigo-600 to-purple-600',
    CUSTOM: 'from-gray-600 to-gray-700'
}

const createRoleSchema = z.object({
    name: z.string().min(2).max(50),
    type: z.enum(['SUPER_ADMIN', 'CONTENT_ADMIN', 'SAFETY_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'CUSTOM']),
    description: z.string().optional(),
    permissions: z.array(z.string())
})

// GET: List all roles with their assignments
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Get all roles with admin count
        const roles = await prisma.adminRole.findMany({
            include: {
                _count: {
                    select: { admins: true }
                },
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
            },
            orderBy: { createdAt: 'asc' }
        })

        // Get all admin users (users with ADMIN role)
        const adminUsers = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            include: {
                adminRoleAssignments: {
                    include: {
                        role: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Transform roles data
        const transformedRoles = roles.map(role => ({
            id: role.id,
            name: role.name,
            type: role.type,
            description: role.description,
            permissions: role.modules as string[],
            userCount: role._count.admins,
            isSystem: role.isSystem,
            color: ROLE_COLORS[role.type] || ROLE_COLORS.CUSTOM,
            createdAt: role.createdAt.toISOString(),
            admins: role.admins.map((a: { user: { id: string; name: string; email: string; profileImage: string | null }; assignedAt: Date }) => ({
                id: a.user.id,
                name: a.user.name,
                email: a.user.email,
                avatar: a.user.profileImage,
                assignedAt: a.assignedAt.toISOString()
            }))
        }))

        // Transform admin users
        const transformedUsers = adminUsers.map(user => {
            const assignment = user.adminRoleAssignments[0]
            return {
                id: user.id,
                name: user.name || 'Unknown',
                email: user.email,
                avatar: user.profileImage || user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A',
                role: assignment?.role?.name || 'No Role Assigned',
                roleId: assignment?.role?.id || null,
                roleType: assignment?.role?.type || null,
                status: 'active' as const,
                lastActive: user.updatedAt.toISOString(),
                createdAt: user.createdAt.toISOString()
            }
        })

        // Stats
        const stats = {
            totalRoles: roles.length,
            totalAdmins: adminUsers.length,
            activeToday: adminUsers.filter(u => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return new Date(u.updatedAt) >= today
            }).length,
            pendingInvites: 0 // Would need invite tracking
        }

        return NextResponse.json({
            success: true,
            data: {
                roles: transformedRoles,
                users: transformedUsers,
                stats,
                permissionDefinitions: PERMISSION_DEFINITIONS
            }
        })

    } catch (error) {
        console.error('Error fetching roles:', error)
        return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }
}

// POST: Create a new role
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await req.json()
        const data = createRoleSchema.parse(body)

        // Check if role name already exists
        const existing = await prisma.adminRole.findUnique({
            where: { name: data.name }
        })

        if (existing) {
            return NextResponse.json({ error: 'A role with this name already exists' }, { status: 400 })
        }

        // Create the role
        const role = await prisma.adminRole.create({
            data: {
                name: data.name,
                type: data.type,
                description: data.description,
                modules: data.permissions,
                isSystem: false
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                id: role.id,
                name: role.name,
                type: role.type,
                description: role.description,
                permissions: role.modules,
                isSystem: role.isSystem,
                color: ROLE_COLORS[role.type] || ROLE_COLORS.CUSTOM,
                createdAt: role.createdAt.toISOString()
            }
        }, { status: 201 })

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Error creating role:', error)
        return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
    }
}
