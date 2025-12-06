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

        // Get appeals from the Appeal model
        const appealRecords = await prisma.appeal.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                ban: {
                    select: {
                        id: true,
                        banType: true,
                        duration: true,
                        reason: true,
                        evidence: true,
                        bannedAt: true,
                        expiresAt: true
                    }
                },
                reviewer: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { submittedAt: 'desc' },
            take: 100
        });

        // Transform to frontend structure
        const appeals = appealRecords.map((appeal) => ({
            id: appeal.id,
            appealNumber: appeal.appealNumber,
            userId: appeal.userId,
            userName: appeal.user.name,
            userEmail: appeal.user.email,
            banId: appeal.banId,
            submittedAt: appeal.submittedAt.toISOString(),
            status: appeal.status.toLowerCase(),
            priority: appeal.priority.toLowerCase(),
            daysInQueue: Math.floor((Date.now() - appeal.submittedAt.getTime()) / (1000 * 60 * 60 * 24)),
            appealReason: appeal.reason,
            appealEvidence: appeal.evidence,
            originalBan: {
                type: appeal.ban.banType.toLowerCase(),
                duration: appeal.ban.duration?.toLowerCase() || 'permanent',
                reason: appeal.ban.reason,
                evidence: appeal.ban.evidence,
                bannedAt: appeal.ban.bannedAt.toISOString(),
                expiresAt: appeal.ban.expiresAt?.toISOString()
            },
            reviewedBy: appeal.reviewer?.name,
            reviewedAt: appeal.reviewedAt?.toISOString(),
            decision: appeal.decision?.toLowerCase(),
            decisionNotes: appeal.decisionNotes,
            previousAppeals: 0 // Would need to count previous appeals for this user
        }));

        // Calculate stats
        const stats = {
            totalPending: appeals.filter(a => a.status === 'pending').length,
            underReview: appeals.filter(a => a.status === 'under_review').length,
            urgent: appeals.filter(a => a.priority === 'urgent').length,
            avgReviewTime: 7.5, // Would need historical data
            resolutionRate: appeals.length > 0 
                ? Math.round(appeals.filter(a => ['upheld', 'reduced', 'reinstated'].includes(a.status)).length / appeals.length * 100)
                : 0,
            reinstatedRate: appeals.length > 0
                ? Math.round(appeals.filter(a => a.status === 'reinstated').length / appeals.length * 100)
                : 0
        };

        return NextResponse.json({
            appeals,
            stats,
            total: appeals.length
        });
    } catch (error) {
        console.error('Appeals API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appeals' },
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
        const { appealId, action, decision, notes } = body;

        if (!appealId || !action) {
            return NextResponse.json(
                { error: 'Appeal ID and action are required' },
                { status: 400 }
            );
        }

        // Map action to status and decision
        let newStatus: string;
        let appealDecision: string | null = null;

        switch (action) {
            case 'review':
                newStatus = 'UNDER_REVIEW';
                break;
            case 'approve':
            case 'reinstate':
                newStatus = 'REINSTATED';
                appealDecision = 'FULL_REINSTATEMENT';
                break;
            case 'reduce':
                newStatus = 'REDUCED';
                appealDecision = decision || 'REDUCE_DURATION';
                break;
            case 'reject':
                newStatus = 'REJECTED';
                appealDecision = 'UPHOLD';
                break;
            case 'uphold':
                newStatus = 'UPHELD';
                appealDecision = 'UPHOLD';
                break;
            default:
                newStatus = 'PENDING';
        }

        // Update the appeal
        const updated = await prisma.appeal.update({
            where: { id: appealId },
            data: {
                status: newStatus as any,
                decision: appealDecision as any,
                decisionNotes: notes,
                reviewedAt: new Date(),
                reviewedBy: session.user.id
            }
        });

        // If reinstated, update the ban status
        if (newStatus === 'REINSTATED') {
            await prisma.userBan.update({
                where: { id: updated.banId },
                data: {
                    status: 'LIFTED',
                    liftedAt: new Date(),
                    liftedBy: session.user.id,
                    liftReason: `Appeal ${updated.appealNumber} approved`
                }
            });
        }

        // Log the action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                adminName: session.user.name || 'Admin',
                adminEmail: session.user.email || '',
                action: `APPEAL_${action.toUpperCase()}`,
                module: 'Safety',
                details: `Processed appeal ${updated.appealNumber} - Decision: ${appealDecision || action}`,
                status: 'SUCCESS'
            }
        });

        return NextResponse.json({
            success: true,
            appeal: updated
        });
    } catch (error) {
        console.error('Appeal action error:', error);
        return NextResponse.json(
            { error: 'Failed to process appeal action' },
            { status: 500 }
        );
    }
}
