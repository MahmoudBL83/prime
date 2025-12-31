import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, DiscountType } from '@prisma/client'
import { z } from 'zod'

const updateCodeSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    discountType: z.nativeEnum(DiscountType).optional(),
    discountValue: z.number().positive().optional(),
    maxUses: z.number().int().positive().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    applicableTo: z.any().optional(),
    minimumAmount: z.number().min(0).optional(),
    firstTimeOnly: z.boolean().optional(),
    isActive: z.boolean().optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id: codeId } = await params

        const code = await prisma.promotionalCode.findUnique({
            where: { id: codeId },
            include: {
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        if (!code) {
            return NextResponse.json(
                { error: 'Promotional code not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(code)
    } catch (error) {
        console.error('Failed to fetch promotional code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id: codeId } = await params
        const body = await request.json()
        const validatedData = updateCodeSchema.parse(body)

        // Check if code exists
        const existingCode = await prisma.promotionalCode.findUnique({
            where: { id: codeId }
        })

        if (!existingCode) {
            return NextResponse.json(
                { error: 'Promotional code not found' },
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = { ...validatedData }
        if (validatedData.validFrom) {
            updateData.validFrom = new Date(validatedData.validFrom)
        }
        if (validatedData.validUntil) {
            updateData.validUntil = new Date(validatedData.validUntil)
        }

        const updatedCode = await prisma.promotionalCode.update({
            where: { id: codeId },
            data: updateData,
            include: {
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        return NextResponse.json(updatedCode)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Failed to update promotional code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!currentUser || currentUser.role !== UserRole.ADMIN) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { id: codeId } = await params

        // Check if code exists
        const code = await prisma.promotionalCode.findUnique({
            where: { id: codeId }
        })

        if (!code) {
            return NextResponse.json(
                { error: 'Promotional code not found' },
                { status: 404 }
            )
        }

        // Check if code has been used
        if (code.currentUses > 0) {
            return NextResponse.json(
                { error: 'Cannot delete promotional code that has been used' },
                { status: 400 }
            )
        }

        await prisma.promotionalCode.delete({
            where: { id: codeId }
        })

        return NextResponse.json({ message: 'Promotional code deleted successfully' })
    } catch (error) {
        console.error('Failed to delete promotional code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}