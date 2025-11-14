import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { subscriptionType, demo } = body

        // For demo purposes, we just return success
        // In a real implementation, you would store this in the database

        return NextResponse.json({
            success: true,
            message: 'Demo subscription activated',
            subscription: {
                type: subscriptionType,
                status: 'active',
                demo: true,
                userId: session.user.id
            }
        })
    } catch (error) {
        console.error('Demo subscription error:', error)
        return NextResponse.json(
            { error: 'Failed to activate demo subscription' },
            { status: 500 }
        )
    }
}
