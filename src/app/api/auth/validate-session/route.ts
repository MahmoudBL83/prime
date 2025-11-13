import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/auth/validate-session
 * Validate if the session user exists in the database
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({
                valid: false,
                error: 'No session found',
                action: 'SIGN_IN_REQUIRED'
            })
        }

        // Check if user exists in database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        })

        if (!user) {
            return NextResponse.json({
                valid: false,
                error: 'Session user not found in database',
                message: 'Your session is stale. Please sign out and sign in again.',
                sessionUserId: session.user.id,
                action: 'SIGN_OUT_AND_SIGN_IN'
            })
        }

        // Check if creator profile exists
        const creator = await prisma.creator.findUnique({
            where: { userId: user.id }
        })

        return NextResponse.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                createdAt: user.createdAt
            },
            hasCreatorProfile: !!creator,
            message: 'Session is valid'
        })

    } catch (error) {
        console.error('Session validation error:', error)
        return NextResponse.json(
            { 
                valid: false,
                error: 'Failed to validate session',
                message: 'An error occurred while validating your session'
            },
            { status: 500 }
        )
    }
}
