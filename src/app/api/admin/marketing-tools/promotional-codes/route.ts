import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, DiscountType } from '@prisma/client'
import { z } from 'zod'

const createCodeSchema = z.object({
    code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/i, 'Code must contain only letters, numbers, hyphens, and underscores'),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.number().positive(),
    maxUses: z.number().int().positive().optional(),
    validFrom: z.string().datetime().optional(),
    validUntil: z.string().datetime().optional(),
    applicableTo: z.any().optional(),
    minimumAmount: z.number().min(0).optional(),
    firstTimeOnly: z.boolean().optional()
})

const updateCodeSchema = createCodeSchema.partial().omit({ code: true })

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search')
        const isActive = searchParams.get('isActive')

        const where: any = {}

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (isActive !== null) {
            where.isActive = isActive === 'true'
        }

        const [codes, total] = await Promise.all([
            prisma.promotionalCode.findMany({
                where,
                include: {
                    creator: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.promotionalCode.count({ where })
        ])

        return NextResponse.json({
            codes,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Failed to fetch promotional codes:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const validatedData = createCodeSchema.parse(body)

        // Check if code already exists
        const existingCode = await prisma.promotionalCode.findUnique({
            where: { code: validatedData.code.toUpperCase() }
        })

        if (existingCode) {
            return NextResponse.json(
                { error: 'Promotional code already exists' },
                { status: 400 }
            )
        }

        const code = await prisma.promotionalCode.create({
            data: {
                code: validatedData.code.toUpperCase(),
                name: validatedData.name,
                description: validatedData.description,
                discountType: validatedData.discountType,
                discountValue: validatedData.discountValue,
                maxUses: validatedData.maxUses,
                validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
                validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
                applicableTo: validatedData.applicableTo,
                minimumAmount: validatedData.minimumAmount,
                firstTimeOnly: validatedData.firstTimeOnly || false,
                createdBy: currentUser.id
            },
            include: {
                creator: {
                    select: { name: true, email: true }
                }
            }
        })

        return NextResponse.json(code, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Failed to create promotional code:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}