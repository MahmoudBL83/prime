import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/subscription/check - Check if user has active subscription
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.email) {
            return NextResponse.json({ 
                hasAccess: false,
                subscriptionType: null,
                expiresAt: null,
                error: 'Not authenticated'
            })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                subscriptions: {
                    where: {
                        status: 'ACTIVE',
                        endDate: {
                            gt: new Date()
                        }
                    },
                    orderBy: {
                        endDate: 'desc'
                    },
                    take: 1
                }
            }
        })

        if (!user) {
            return NextResponse.json({ 
                hasAccess: false,
                subscriptionType: null,
                expiresAt: null,
                error: 'User not found'
            })
        }

        const activeSubscription = user.subscriptions[0]

        // Check if user has access to Category A content
        // Categories that grant access: CATEGORY_A, BUNDLE_AB, BUNDLE_ABC
        const hasAccess = activeSubscription && [
            'CATEGORY_A',
            'BUNDLE_AB',
            'BUNDLE_ABC'
        ].includes(activeSubscription.type)

        return NextResponse.json({
            hasAccess: !!hasAccess,
            subscriptionType: activeSubscription?.type ?? null,
            expiresAt: activeSubscription?.endDate ?? null,
            status: activeSubscription?.status ?? null
        })
    } catch (error) {
        console.error('Error checking subscription:', error)
        return NextResponse.json({ 
            hasAccess: false,
            subscriptionType: null,
            expiresAt: null,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
