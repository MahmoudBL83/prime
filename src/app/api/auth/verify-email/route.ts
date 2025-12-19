import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json()

        if (!token) {
            return NextResponse.json({ message: 'Token is required' }, { status: 400 })
        }

        // Find the verification record
        const verification = await prisma.userVerification.findUnique({
            where: { id: token },
            include: { user: true }
        })

        if (!verification) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 400 })
        }

        if (verification.status !== 'PENDING') {
            return NextResponse.json({ message: 'Token has already been used or expired' }, { status: 400 })
        }

        if (verification.expiresAt && new Date() > verification.expiresAt) {
            return NextResponse.json({ message: 'Token has expired' }, { status: 400 })
        }

        // Update user emailVerified status
        await prisma.$transaction([
            prisma.user.update({
                where: { id: verification.userId },
                data: {
                    emailVerified: new Date(),
                    // Determine role based on current state or keep as is?
                    // Assuming role is already set correctly on registration
                }
            }),
            prisma.userVerification.update({
                where: { id: token },
                data: {
                    status: 'APPROVED',
                    verifiedAt: new Date()
                }
            })
        ])

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully'
        })

    } catch (error) {
        console.error('Email verification error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
