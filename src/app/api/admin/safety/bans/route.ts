import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'all';

        // Build where clause based on status filter
        const whereClause = status !== 'all' ? { status: status.toUpperCase() as any } : {};

        // Get bans from the UserBan model
        const userBans = await prisma.userBan.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                bannedByAdmin: {
                    select: {
                        name: true
                    }
                },
                appeals: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            },
            orderBy: { bannedAt: 'desc' },
            take: 100
        });

        // Transform to frontend structure
        const bans = userBans.map((ban, index) => ({
            id: ban.id,
            caseId: `BAN-${new Date(ban.bannedAt).getFullYear()}-${(1001 + index).toString()}`,
            userId: ban.userId,
            userName: ban.user.name,
            userEmail: ban.user.email,
            banType: ban.banType.toLowerCase(),
            duration: ban.duration?.toLowerCase().replace('_', '_') || 'permanent',
            reason: ban.reason,
            evidence: ban.evidence,
            bannedAt: ban.bannedAt.toISOString(),
            expiresAt: ban.expiresAt?.toISOString(),
            bannedBy: ban.bannedByAdmin.name,
            status: ban.status.toLowerCase(),
            appealStatus: ban.appeals.length > 0 ? ban.appeals[0].status.toLowerCase() : 'none',
            appealId: ban.appeals.length > 0 ? ban.appeals[0].id : undefined,
            liftedAt: ban.liftedAt?.toISOString(),
            liftedBy: ban.liftedBy,
            liftReason: ban.liftReason
        }));

        // Calculate stats
        const activeBans = bans.filter(b => b.status === 'active');
        const stats = {
            totalActive: activeBans.length,
            totalPermanent: activeBans.filter(b => b.banType === 'permanent').length,
            totalTemporary: activeBans.filter(b => b.banType === 'temporary').length,
            expiringSoon: activeBans.filter(b => {
                if (!b.expiresAt) return false;
                const daysUntilExpiry = (new Date(b.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
            }).length,
            appealed: bans.filter(b => b.appealStatus !== 'none').length
        };

        return NextResponse.json({
            bans,
            stats,
            total: bans.length
        });
    } catch (error) {
        console.error('Bans API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bans' },
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
        const { userId, banType, duration, reason, evidence } = body;

        if (!userId || !banType || !reason) {
            return NextResponse.json(
                { error: 'User ID, ban type, and reason are required' },
                { status: 400 }
            );
        }

        // Calculate expiry date based on duration
        let expiresAt: Date | null = null;
        if (banType !== 'PERMANENT' && duration) {
            const durationDays: Record<string, number> = {
                'ONE_DAY': 1,
                'THREE_DAYS': 3,
                'SEVEN_DAYS': 7,
                'FOURTEEN_DAYS': 14,
                'THIRTY_DAYS': 30,
                'NINETY_DAYS': 90
            };
            const days = durationDays[duration] || 7;
            expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        }

        // Create the ban
        const ban = await prisma.userBan.create({
            data: {
                userId,
                banType: banType.toUpperCase(),
                duration: duration?.toUpperCase(),
                reason,
                evidence: evidence || [],
                bannedBy: session.user.id,
                expiresAt,
                status: 'ACTIVE'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Log the action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Admin',
                adminEmail: session.user.email || '',
                action: 'CREATE_BAN',
                module: 'Safety',
                details: `Banned user ${ban.user.name} (${ban.user.email}) - Type: ${banType}, Reason: ${reason}`,
                status: 'SUCCESS'
            }
        });

        return NextResponse.json({
            success: true,
            ban
        });
    } catch (error) {
        console.error('Ban creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create ban' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { banId, action, reason } = body;

        if (!banId || !action) {
            return NextResponse.json(
                { error: 'Ban ID and action are required' },
                { status: 400 }
            );
        }

        if (action === 'lift') {
            const ban = await prisma.userBan.update({
                where: { id: banId },
                data: {
                    status: 'LIFTED',
                    liftedAt: new Date(),
                    liftedBy: session.user.id,
                    liftReason: reason
                }
            });

            // Log the action
            await prisma.adminAuditLog.create({
                data: {
                    adminId: session.user.id,
                    adminName: session.user.name || 'Admin',
                    adminEmail: session.user.email || '',
                    action: 'LIFT_BAN',
                    module: 'Safety',
                    details: `Lifted ban ${banId} - Reason: ${reason}`,
                    status: 'SUCCESS'
                }
            });

            return NextResponse.json({ success: true, ban });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Ban update error:', error);
        return NextResponse.json(
            { error: 'Failed to update ban' },
            { status: 500 }
        );
    }
}
