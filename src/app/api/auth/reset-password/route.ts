import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'
import { hash } from 'bcryptjs'

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json()

        if (!token || !password) {
            return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 })
        }

        if (password.length < 6) {
            return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
        }

        // Verify the token
        let decoded: any
        try {
            decoded = verify(token, process.env.NEXTAUTH_SECRET!)
        } catch (error) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 })
        }

        const { userId, email } = decoded

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user || user.email !== email) {
            return NextResponse.json({ message: 'Invalid token payload' }, { status: 400 })
        }

        // Hash the new password
        const hashedPassword = await hash(password, 12)

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: {
                passwordHash: hashedPassword,
                passwordResetRequired: false
                // potentially revoke all sessions here if you track them
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully'
        })

    } catch (error) {
        console.error('Password reset error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
