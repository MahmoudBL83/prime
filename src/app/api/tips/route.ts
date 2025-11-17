import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/tips - Send a tip to a creator
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { creatorId, amount, message, isAnonymous } = body

        // Validate required fields
        if (!creatorId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate amount
        if (typeof amount !== 'number' || amount < 5 || amount > 10000) {
            return NextResponse.json(
                { error: 'Invalid amount. Must be between 5 and 10000 EGP' },
                { status: 400 }
            )
        }

        // Get creator
        const creator = await prisma.creator.findUnique({
            where: { id: creatorId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                        email: true
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

        // TODO: Integrate with payment gateway
        // For now, we'll process the tip directly

        // Create tip record
        const tip = await prisma.creatorEarnings.create({
            data: {
                creatorId: creatorId,
                userId: isAnonymous ? null : session.user.id,
                sourceType: 'TIP',
                sourceId: null,
                amount: amount,
                period: new Date().toISOString().slice(0, 7), // "2025-11" format
                description: message || 'Tip',
                status: 'COMPLETED',
                metadata: {
                    isAnonymous: isAnonymous || false,
                    message: message || null
                }
            }
        })

        // Update creator analytics
        const currentPeriod = new Date().toISOString().slice(0, 7) // "2025-11" format
        await prisma.creatorAnalytics.upsert({
            where: { 
                creatorId_period_periodType: {
                    creatorId: creatorId,
                    period: currentPeriod,
                    periodType: 'MONTHLY'
                }
            },
            create: {
                creatorId: creatorId,
                period: currentPeriod,
                periodType: 'MONTHLY',
                totalRevenue: amount,
                totalSubscribers: 0,
                totalViews: 0,
                totalEnrollments: 0
            },
            update: {
                totalRevenue: {
                    increment: amount
                }
            }
        })

        // Create notification for creator
        await prisma.notification.create({
            data: {
                userId: creator.userId,
                type: 'SYSTEM',
                title: isAnonymous 
                    ? 'New Anonymous Tip' 
                    : `${session.user.name} sent you a tip`,
                message: message || `You received ${amount} EGP`,
                data: {
                    tipId: tip.id,
                    amount: amount,
                    isAnonymous: isAnonymous,
                    senderId: isAnonymous ? null : session.user.id
                }
            }
        })

        // TODO: Send email notification to creator
        // await sendTipNotificationEmail(creator.user.email, amount, message)

        return NextResponse.json({
            success: true,
            tip: {
                id: tip.id,
                amount: tip.amount,
                message: message,
                isAnonymous: isAnonymous,
                creatorName: creator.user.name,
                createdAt: tip.createdAt
            }
        })

    } catch (error) {
        console.error('Tip error:', error)
        return NextResponse.json(
            { error: 'Failed to send tip' },
            { status: 500 }
        )
    }
}

// GET /api/tips - Get user's sent tips
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const tips = await prisma.creatorEarnings.findMany({
            where: {
                userId: session.user.id,
                sourceType: 'TIP'
            },
            include: {
                creator: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                profileImage: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            tips: tips.map(tip => ({
                id: tip.id,
                amount: tip.amount,
                message: tip.description,
                creator: {
                    name: tip.creator.user.name,
                    image: tip.creator.user.profileImage
                },
                createdAt: tip.createdAt
            }))
        })

    } catch (error) {
        console.error('Failed to fetch tips:', error)
        return NextResponse.json(
            { error: 'Failed to fetch tips' },
            { status: 500 }
        )
    }
}
