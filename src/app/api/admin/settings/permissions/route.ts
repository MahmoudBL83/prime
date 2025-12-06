import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AdminRoleType } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const AVAILABLE_MODULES = [
    'Users Management',
    'Creator Applications',
    'Content Review',
    'Course Management',
    'Financial/Payouts',
    'Refunds',
    'Bans & Safety',
    'Appeals',
    'DMCA Claims',
    'Support Tickets',
    'Scholarships',
    'Analytics',
    'Communication',
    'Settings'
];

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '50');

        // Fetch roles, admins, and audit logs
        const [
            roles,
            adminAssignments,
            auditLogs,
            totalAuditLogs,
            failedAttempts
        ] = await Promise.all([
            prisma.adminRole.findMany({
                orderBy: { createdAt: 'desc' }
            }),
            prisma.adminAssignment.findMany({
                include: {
                    role: true,
                    user: { select: { id: true, name: true, email: true, createdAt: true, updatedAt: true } }
                }
            }),
            prisma.adminAuditLog.findMany({
                take: pageSize,
                skip: (page - 1) * pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    admin: { select: { id: true, name: true, email: true } }
                }
            }),
            prisma.adminAuditLog.count(),
            prisma.adminAuditLog.count({ where: { status: 'FAILED' } })
        ]);

        // Format roles
        const formattedRoles = roles.map((role) => ({
            id: role.id,
            name: role.name,
            type: role.type.toLowerCase(),
            description: role.description,
            adminCount: adminAssignments.filter((a) => a.roleId === role.id).length,
            modules: Array.isArray(role.modules) ? role.modules : [],
            createdAt: role.createdAt.toISOString(),
            updatedAt: role.updatedAt.toISOString()
        }));

        // Format admins
        const formattedAdmins = adminAssignments.map((assignment) => ({
            id: assignment.user.id,
            name: assignment.user.name,
            email: assignment.user.email,
            role: assignment.role.name,
            roleType: assignment.role.type.toLowerCase(),
            roleId: assignment.roleId,
            lastLogin: assignment.user.updatedAt.toISOString(),
            status: 'active',
            createdAt: assignment.user.createdAt.toISOString()
        }));

        // Format audit logs
        const formattedLogs = auditLogs.map((log) => ({
            id: log.id,
            adminId: log.admin?.id || null,
            adminName: log.admin?.name || log.adminName || 'System',
            adminEmail: log.admin?.email || log.adminEmail || '',
            action: log.action,
            module: log.module,
            details: log.details,
            timestamp: log.createdAt.toISOString(),
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            status: log.status
        }));

        // Log this access
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Unknown',
                adminEmail: session.user.email || 'unknown',
                action: 'VIEW',
                module: 'Settings/Permissions',
                details: 'Viewed permissions page',
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                status: 'SUCCESS'
            }
        }).catch(console.error);

        return NextResponse.json({
            roles: formattedRoles,
            admins: formattedAdmins,
            auditLogs: formattedLogs,
            stats: {
                totalRoles: roles.length,
                totalAdmins: adminAssignments.length,
                activeAdmins: adminAssignments.length,
                totalAuditLogs,
                failedAttempts
            },
            meta: {
                page,
                pageSize,
                totalPages: Math.ceil(totalAuditLogs / pageSize)
            },
            availableModules: AVAILABLE_MODULES
        });
    } catch (error) {
        console.error('Permissions API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch permissions data' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, roleId, adminId, ...data } = body as {
            action?: string
            roleId?: string
            adminId?: string
            userId?: string
            name?: string
            type?: string
            description?: string
            modules?: any
        };

        // Role actions
        if (action === 'create-role') {
            const toRoleType = (value?: string) => {
                if (!value) return AdminRoleType.CUSTOM;
                const key = value.toUpperCase();
                return (AdminRoleType as Record<string, AdminRoleType>)[key] || AdminRoleType.CUSTOM;
            };

            const roleType = toRoleType(data.type);

            const newRole = await prisma.adminRole.create({
                data: {
                    name: data.name || 'New Role',
                    type: roleType,
                    description: data.description,
                    modules: Array.isArray(data.modules) ? data.modules : []
                }
            });

            // Log action
            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    adminName: session.user.name || 'Unknown',
                    adminEmail: session.user.email || 'unknown',
                    action: 'CREATE',
                    module: 'Settings/Roles',
                    details: `Created role: ${data.name}`,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                    status: 'SUCCESS'
                }
            });

            return NextResponse.json({ success: true, role: newRole });
        }

        if (action === 'update-role') {
            const toRoleType = (value?: string) => {
                if (!value) return undefined;
                const key = value.toUpperCase();
                return (AdminRoleType as Record<string, AdminRoleType>)[key] || AdminRoleType.CUSTOM;
            };

            const roleType = toRoleType(data.type);

            const updated = await prisma.adminRole.update({
                where: { id: roleId || '' },
                data: {
                    name: data.name,
                    type: roleType,
                    description: data.description,
                    modules: Array.isArray(data.modules) ? data.modules : []
                }
            });

            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    adminName: session.user.name || 'Unknown',
                    adminEmail: session.user.email || 'unknown',
                    action: 'UPDATE',
                    module: 'Settings/Roles',
                    details: `Updated role: ${data.name}`,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                    status: 'SUCCESS'
                }
            });

            return NextResponse.json({ success: true, role: updated });
        }

        if (action === 'delete-role') {
            await prisma.adminRole.delete({
                where: { id: roleId || '' }
            });

            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    adminName: session.user.name || 'Unknown',
                    adminEmail: session.user.email || 'unknown',
                    action: 'DELETE',
                    module: 'Settings/Roles',
                    details: `Deleted role ID: ${roleId}`,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                    status: 'SUCCESS'
                }
            });

            return NextResponse.json({ success: true });
        }

        // Admin user actions
        if (action === 'assign-role') {
            await prisma.adminAssignment.upsert({
                where: { userId_roleId: { userId: adminId || '', roleId: roleId || '' } },
                update: { assignedAt: new Date(), assignedBy: session.user.id },
                create: {
                    userId: adminId || '',
                    roleId: roleId || '',
                    assignedAt: new Date(),
                    assignedBy: session.user.id
                }
            });

            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    adminName: session.user.name || 'Unknown',
                    adminEmail: session.user.email || 'unknown',
                    action: 'UPDATE',
                    module: 'Settings/Admins',
                    details: `Assigned role to admin: ${adminId}`,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                    status: 'SUCCESS'
                }
            });

            return NextResponse.json({ success: true });
        }

        if (action === 'remove-admin') {
            await prisma.adminAssignment.deleteMany({ where: { userId: adminId || '' } })

            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    adminName: session.user.name || 'Unknown',
                    adminEmail: session.user.email || 'unknown',
                    action: 'UPDATE',
                    module: 'Settings/Admins',
                    details: `Removed admin access: ${adminId}`,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                    status: 'SUCCESS'
                }
            });

            return NextResponse.json({ success: true });
        }

        if (action === 'add-admin') {
            await prisma.adminAssignment.upsert({
                where: { userId_roleId: { userId: data.userId || '', roleId: roleId || '' } },
                update: { assignedAt: new Date(), assignedBy: session.user.id },
                create: {
                    userId: data.userId || '',
                    roleId: roleId || '',
                    assignedAt: new Date(),
                    assignedBy: session.user.id
                }
            });

            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    adminName: session.user.name || 'Unknown',
                    adminEmail: session.user.email || 'unknown',
                    action: 'CREATE',
                    module: 'Settings/Admins',
                    details: `Added admin access: ${data.userId}`,
                    ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                    userAgent: request.headers.get('user-agent') || 'unknown',
                    status: 'SUCCESS'
                }
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Permissions action error:', error);
        return NextResponse.json(
            { error: 'Failed to process permissions action' },
            { status: 500 }
        );
    }
}
