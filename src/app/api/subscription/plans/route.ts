import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/subscription/plans
 * Get available subscription plans
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const includeInactive = searchParams.get('includeInactive') === 'true'
        const planType = searchParams.get('type') // 'LEARNER' | 'CREATOR'

        // Build where clause
        let whereClause: any = {}

        if (!includeInactive) {
            whereClause.active = true
        }

        if (planType) {
            whereClause.planType = planType
        }

        const plans = await prisma.subscriptionPlan.findMany({
            where: whereClause,
            orderBy: [
                { planType: 'asc' },
                { price: 'asc' }
            ],
            select: {
                id: true,
                name: true,
                arabicName: true,
                description: true,
                arabicDescription: true,
                price: true,
                currency: true,
                billingInterval: true,
                planType: true,
                features: true,
                arabicFeatures: true,
                maxCourses: true,
                maxStudents: true,
                maxStorage: true,
                analyticsAccess: true,
                prioritySupport: true,
                customBranding: true,
                liveSessionsIncluded: true,
                certificatesIncluded: true,
                downloadableContent: true,
                stripeProductId: true,
                stripePriceId: true,
                active: true,
                createdAt: true,
                updatedAt: true
            }
        })

        // Group plans by type for easier frontend consumption
        const groupedPlans = {
            LEARNER: plans.filter(plan => plan.planType === 'LEARNER'),
            CREATOR: plans.filter(plan => plan.planType === 'CREATOR')
        }

        return NextResponse.json({
            success: true,
            data: {
                plans,
                grouped: groupedPlans,
                totalPlans: plans.length
            }
        })

    } catch (error) {
        console.error('Subscription plans fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/subscription/plans
 * Create a new subscription plan (Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const {
            name,
            arabicName,
            description,
            arabicDescription,
            price,
            currency = 'EGP',
            billingInterval,
            planType,
            features,
            arabicFeatures,
            maxCourses,
            maxStudents,
            maxStorage,
            analyticsAccess = false,
            prioritySupport = false,
            customBranding = false,
            liveSessionsIncluded = 0,
            certificatesIncluded = false,
            downloadableContent = false,
            stripeProductId,
            stripePriceId,
            active = true
        } = body

        // Validate required fields
        if (!name || !description || !price || !billingInterval || !planType) {
            return NextResponse.json(
                { error: 'Name, description, price, billing interval, and plan type are required' },
                { status: 400 }
            )
        }

        // Validate plan type
        if (!['LEARNER', 'CREATOR'].includes(planType)) {
            return NextResponse.json(
                { error: 'Plan type must be LEARNER or CREATOR' },
                { status: 400 }
            )
        }

        // Validate billing interval
        if (!['MONTHLY', 'YEARLY'].includes(billingInterval)) {
            return NextResponse.json(
                { error: 'Billing interval must be MONTHLY or YEARLY' },
                { status: 400 }
            )
        }

        // Create the subscription plan
        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                arabicName,
                description,
                arabicDescription,
                price: parseFloat(price),
                currency,
                billingInterval,
                planType,
                features: features || [],
                arabicFeatures: arabicFeatures || [],
                maxCourses: maxCourses ? parseInt(maxCourses) : null,
                maxStudents: maxStudents ? parseInt(maxStudents) : null,
                maxStorage: maxStorage ? parseInt(maxStorage) : null,
                analyticsAccess,
                prioritySupport,
                customBranding,
                liveSessionsIncluded: parseInt(liveSessionsIncluded),
                certificatesIncluded,
                downloadableContent,
                stripeProductId,
                stripePriceId,
                active,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Subscription plan created successfully',
            plan: {
                id: plan.id,
                name: plan.name,
                planType: plan.planType,
                price: plan.price,
                currency: plan.currency,
                billingInterval: plan.billingInterval,
                active: plan.active
            }
        })

    } catch (error) {
        console.error('Subscription plan creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/subscription/plans
 * Update subscription plan status (Admin only)
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { planId, active } = body

        if (!planId || active === undefined) {
            return NextResponse.json(
                { error: 'Plan ID and active status are required' },
                { status: 400 }
            )
        }

        // Update the plan
        const updatedPlan = await prisma.subscriptionPlan.update({
            where: { id: planId },
            data: {
                active,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: `Subscription plan ${active ? 'activated' : 'deactivated'} successfully`,
            plan: {
                id: updatedPlan.id,
                name: updatedPlan.name,
                active: updatedPlan.active
            }
        })

    } catch (error) {
        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Subscription plan not found' },
                { status: 404 }
            )
        }

        console.error('Subscription plan update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
