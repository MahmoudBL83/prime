import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sign } from 'jsonwebtoken'
import { sendPasswordResetEmail } from '@/lib/email'

const resetSchema = z.object({
    email: z.string().email()
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const validation = resetSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        const { email } = validation.data

        const user = await prisma.user.findUnique({
            where: { email }
        })

        // Security: Always return success even if user not found to prevent enumeration
        if (!user) {
            return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' })
        }

        // Generate a secure token
        const token = sign(
            { userId: user.id, email: user.email },
            process.env.NEXTAUTH_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        )

        // Store token in DB (optional, but good for invalidation) - skipping for now as per schema
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetRequired: true
            }
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const locale = 'en' // Default to 'en'
        const resetLink = `${baseUrl}/${locale}/auth/reset-password?token=${token}`

        await sendPasswordResetEmail({
            userEmail: user.email,
            userName: user.name || 'User',
            resetLink,
            locale
        })

        return NextResponse.json({
            success: true,
            message: 'Password reset link has been sent to your email.'
        })

    } catch (error) {
        console.error('Password reset request error:', error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
