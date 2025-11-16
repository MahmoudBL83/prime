import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/feedback/tokens
 * Generate anonymous feedback tokens for non-authenticated users
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, purpose } = body

        // Validate required fields
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Generate a unique token
        const token = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Store the token in database
        const feedbackToken = await prisma.feedbackToken.create({
            data: {
                token,
                email,
                purpose: purpose || 'feedback',
                expiresAt,
                used: false,
                createdAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Feedback token generated successfully',
            token: feedbackToken.token,
            expiresAt: feedbackToken.expiresAt
        })

    } catch (error) {
        console.error('Feedback token generation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/feedback/tokens?token=xxx
 * Validate a feedback token
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        // Find and validate the token
        const feedbackToken = await prisma.feedbackToken.findUnique({
            where: { token }
        })

        if (!feedbackToken) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 404 }
            )
        }

        if (feedbackToken.used) {
            return NextResponse.json(
                { error: 'Token has already been used' },
                { status: 400 }
            )
        }

        if (feedbackToken.expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Token has expired' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            valid: true,
            email: feedbackToken.email,
            purpose: feedbackToken.purpose,
            expiresAt: feedbackToken.expiresAt
        })

    } catch (error) {
        console.error('Feedback token validation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/feedback/tokens
 * Invalidate/use a feedback token
 */
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { token } = body

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        // Mark token as used
        const updatedToken = await prisma.feedbackToken.update({
            where: { token },
            data: { 
                used: true,
                usedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Token invalidated successfully'
        })

    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Token not found' },
                { status: 404 }
            )
        }

        console.error('Feedback token invalidation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
