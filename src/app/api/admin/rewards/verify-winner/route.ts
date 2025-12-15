import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Prize Winner Verification API
 * Admin endpoint for verifying prize winners
 * GET /api/admin/rewards/verify-winner
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status') // PENDING, VERIFIED, REJECTED
        const rewardId = searchParams.get('rewardId')

        const whereClause: any = {}
        if (status) whereClause.status = status
        if (rewardId) whereClause.rewardId = rewardId

        const winners = await prisma.rewardWinner.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        email: true,
                        profileImage: true,
                        phone: true
                    }
                },
                reward: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        value: true,
                        currency: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Get verification stats
        const stats = await prisma.rewardWinner.groupBy({
            by: ['status'],
            _count: { id: true }
        })

        return NextResponse.json({
            winners,
            stats: {
                pending: stats.find(s => s.status === 'PENDING')?._count.id || 0,
                verified: stats.find(s => s.status === 'CLAIMED')?._count.id || 0,
                total: winners.length
            }
        })
    } catch (error) {
        console.error('Verify winner GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch winners' },
            { status: 500 }
        )
    }
}

// POST: Verify or reject a winner
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { winnerId, action, reason, verificationNotes } = body

        if (!winnerId || !action) {
            return NextResponse.json(
                { error: 'winnerId and action are required' },
                { status: 400 }
            )
        }

        const winner = await prisma.rewardWinner.findUnique({
            where: { id: winnerId },
            include: {
                user: true,
                reward: true
            }
        })

        if (!winner) {
            return NextResponse.json({ error: 'Winner not found' }, { status: 404 })
        }

        let updateData: any = {}
        let notificationTitle = ''
        let notificationMessage = ''

        switch (action) {
            case 'verify':
                updateData = {
                    status: 'CLAIMED',
                    claimedAt: new Date()
                }
                notificationTitle = 'Prize Claimed!'
                notificationMessage = `Congratulations! Your prize "${winner.reward.title}" has been verified and is being processed.`
                break

            case 'request_verification':
                updateData = {
                    status: 'PENDING'
                }
                notificationTitle = 'Verification Required'
                notificationMessage = `Please provide identity verification to claim your prize "${winner.reward.title}". ${reason || ''}`
                break

            case 'reject':
                if (!reason) {
                    return NextResponse.json(
                        { error: 'Reason is required for rejection' },
                        { status: 400 }
                    )
                }
                updateData = {
                    status: 'REJECTED'
                }
                notificationTitle = 'Prize Claim Rejected'
                notificationMessage = `Your prize claim for "${winner.reward.title}" was rejected: ${reason}`
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        // Update winner
        const updatedWinner = await prisma.rewardWinner.update({
            where: { id: winnerId },
            data: updateData
        })

        // Create notification
        await prisma.notification.create({
            data: {
                userId: winner.userId,
                type: 'REWARD',
                title: notificationTitle,
                message: notificationMessage,
                metadata: {
                    rewardId: winner.rewardId,
                    winnerId,
                    action,
                    verifiedBy: session.user.id
                }
            }
        })

        // Log the action
        await prisma.adminAuditLog.create({
            data: {
                adminId: session.user.id,
                action: `WINNER_${action.toUpperCase()}`,
                module: 'Rewards',
                details: `${action} winner ${winner.user.name} for reward "${winner.reward.title}". ${verificationNotes || ''}`,
                status: 'SUCCESS'
            }
        })

        return NextResponse.json({
            winner: updatedWinner,
            message: `Winner ${action}d successfully`
        })
    } catch (error) {
        console.error('Verify winner POST error:', error)
        return NextResponse.json(
            { error: 'Failed to verify winner' },
            { status: 500 }
        )
    }
}
