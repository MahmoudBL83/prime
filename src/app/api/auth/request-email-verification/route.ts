import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmailVerificationEmail } from '@/lib/email'

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

        // Create a UserVerification record
        const verification = await prisma.userVerification.create({
            data: {
                userId: user.id,
                type: 'EMAIL',
                status: 'PENDING',
                method: 'EMAIL_LINK',
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const locale = 'en' // Default to English as we don't have user locale in session yet
        const verificationLink = `${baseUrl}/${locale}/auth/verify-email?token=${verification.id}`

        await sendEmailVerificationEmail({
            userEmail: user.email,
            userName: user.name || 'User',
            verificationLink,
            locale
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
