import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email already verified' }, { status: 400 })
        }

        // TODO: Integrate with actual email service
        // For now, we mock the email sending
        console.log(`[MOCK EMAIL] Email verification requested for ${user.email}. Code: ${Math.random().toString().substring(2, 8)}`)

        // We can also create a UserVerification record
        await prisma.userVerification.create({
            data: {
                userId: user.id,
                type: 'EMAIL',
                status: 'PENDING',
                method: 'EMAIL_LINK',
                // Mock expiration 24h
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Verification link has been sent to your email.'
        })

    } catch (error) {
        console.error('Email verification request error:', error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
