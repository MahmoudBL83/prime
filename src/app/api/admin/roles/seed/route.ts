import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Default system roles to seed
const DEFAULT_ROLES = [
    {
        name: 'Super Admin',
        type: 'SUPER_ADMIN' as const,
        description: 'Full access to all platform features and settings',
        modules: [
            'users.view', 'users.edit', 'users.delete', 'users.ban',
            'creators.view', 'creators.edit', 'creators.approve', 'creators.ban',
            'content.view', 'content.edit', 'content.approve', 'content.delete',
            'financial.view', 'financial.edit', 'financial.payouts',
            'analytics.view', 'analytics.export',
            'settings.view', 'settings.edit',
            'safety.view', 'safety.moderate', 'safety.ban',
            'rewards.view', 'rewards.edit', 'rewards.approve',
            'channels.view', 'channels.approve', 'channels.moderate',
            'signature.view', 'signature.curate', 'signature.publish'
        ],
        isSystem: true
    },
    {
        name: 'Content Operations',
        type: 'CONTENT_ADMIN' as const,
        description: 'Manage content review and approval workflows',
        modules: ['content.view', 'content.edit', 'content.approve', 'creators.view', 'users.view', 'signature.view', 'signature.curate'],
        isSystem: true
    },
    {
        name: 'Trust & Safety',
        type: 'SAFETY_ADMIN' as const,
        description: 'Moderate content and handle safety reports',
        modules: ['safety.view', 'safety.moderate', 'safety.ban', 'users.view', 'users.ban', 'content.view'],
        isSystem: true
    },
    {
        name: 'Finance Operations',
        type: 'FINANCE_ADMIN' as const,
        description: 'Manage revenue, payouts, and financial reporting',
        modules: ['financial.view', 'financial.edit', 'financial.payouts', 'creators.view', 'analytics.view', 'analytics.export'],
        isSystem: true
    },
    {
        name: 'Creator Success',
        type: 'SUPPORT_ADMIN' as const,
        description: 'Support creators and approve applications',
        modules: ['creators.view', 'creators.edit', 'creators.approve', 'channels.view', 'channels.approve', 'content.view', 'analytics.view'],
        isSystem: true
    },
    {
        name: 'Editorial Team',
        type: 'CONTENT_ADMIN' as const,
        description: 'Curate signature courses and manage quality standards',
        modules: ['signature.view', 'signature.curate', 'signature.publish', 'content.view', 'creators.view'],
        isSystem: true
    }
]

// POST: Seed default roles
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const results = {
            created: [] as string[],
            existing: [] as string[],
            errors: [] as string[]
        }

        for (const roleData of DEFAULT_ROLES) {
            try {
                // Check if role already exists
                const existing = await prisma.adminRole.findUnique({
                    where: { name: roleData.name }
                })

                if (existing) {
                    results.existing.push(roleData.name)
                    continue
                }

                // Create the role
                await prisma.adminRole.create({
                    data: roleData
                })
                results.created.push(roleData.name)
            } catch (err) {
                results.errors.push(`${roleData.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
        }

        // Assign Super Admin role to current user if they don't have a role
        const currentUserAssignment = await prisma.adminAssignment.findFirst({
            where: { userId: session.user.id }
        })

        if (!currentUserAssignment) {
            const superAdminRole = await prisma.adminRole.findFirst({
                where: { name: 'Super Admin' }
            })

            if (superAdminRole) {
                await prisma.adminAssignment.create({
                    data: {
                        userId: session.user.id,
                        roleId: superAdminRole.id
                    }
                })
                results.created.push(`Assigned Super Admin role to ${session.user.email}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Roles seeded successfully',
            data: results
        })

    } catch (error) {
        console.error('Error seeding roles:', error)
        return NextResponse.json({ error: 'Failed to seed roles' }, { status: 500 })
    }
}
